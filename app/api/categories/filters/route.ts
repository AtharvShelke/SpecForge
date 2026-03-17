import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ── Schema Definitions ───────────────────────────────────
// Defined outside handlers so they are parsed once at module load,
// not re-instantiated on every request.

const CategoryEnum = z.enum([
    "PROCESSOR", "GPU", "MOTHERBOARD", "RAM", "STORAGE",
    "PSU", "CABINET", "COOLER", "MONITOR", "PERIPHERAL", "NETWORKING", "LAPTOP",
]);

const FilterTypeEnum = z.enum(["checkbox", "range", "boolean"]);

const filterSchema = z.object({
    key: z.string().min(1),
    label: z.string().min(1),
    type: FilterTypeEnum,
    options: z.array(z.string()).default([]),
    min: z.number().optional(),
    max: z.number().optional(),
    dependencyKey: z.string().optional(),
    dependencyValue: z.string().optional(),
    sortOrder: z.number().int().default(0),
});

const updateFilterBody = z.object({
    category: CategoryEnum,
    filters: z.array(filterSchema),
});

// ── Shared select shape ──────────────────────────────────
// Reused in both GET and PUT to avoid duplication and ensure
// consistent projection — only fetching columns we actually need.
const FILTER_SELECT = {
    id: true,
    key: true,
    label: true,
    type: true,
    options: true,
    min: true,
    max: true,
    dependencyKey: true,
    dependencyValue: true,
    sortOrder: true,
} as const;

const CONFIG_SELECT = {
    id: true,
    category: true,
    filters: {
        select: FILTER_SELECT,
        orderBy: { sortOrder: "asc" as const },
    },
} as const;

// ── In-memory cache for GET ──────────────────────────────
// Safe because filter configs are infrequently written (admin-only PUT).
// TTL of 60 s avoids stale data after a PUT without requiring Redis.
// Cache is per-process; in multi-instance deployments the worst case is
// serving data that is up to TTL seconds old, which is acceptable here.
const CACHE_TTL_MS = 60_000;
interface CacheEntry { data: unknown; expiresAt: number }
const filterCache = new Map<string, CacheEntry>();

function getCached(key: string): unknown | null {
    const entry = filterCache.get(key);
    if (!entry || Date.now() > entry.expiresAt) return null;
    return entry.data;
}

function setCache(key: string, data: unknown): void {
    filterCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

function invalidateCache(category?: string): void {
    // Invalidate the specific category key AND the "all" key so
    // a subsequent GET always returns fresh data after a PUT.
    filterCache.delete(category ?? "");
    filterCache.delete("__all__");
}

// ── GET /api/categories/filters ─────────────────────────
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const raw = searchParams.get("category");

        // Validate the category param once; reuse the parsed value.
        const parsed = raw ? CategoryEnum.safeParse(raw) : null;
        const category = parsed?.success ? parsed.data : null;

        // Cache key: use category value or a sentinel for "fetch all".
        const cacheKey = category ?? "__all__";
        const cached = getCached(cacheKey);
        if (cached) {
            return NextResponse.json(cached);
        }

        // Single query — Prisma generates one JOIN instead of separate
        // child queries because we use nested `select` (not a lazy load).
        const configs = await prisma.categoryFilterConfig.findMany({
            where: category ? { category } : undefined,
            select: CONFIG_SELECT,
        });

        setCache(cacheKey, configs);
        return NextResponse.json(configs);
    } catch (error) {
        console.error("GET /api/categories/filters error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── PUT /api/categories/filters ─────────────────────────
export async function PUT(req: NextRequest) {
    try {
        // Parse body and validate in one step; bail early on bad input
        // before touching the database.
        const body = await req.json();
        const data = updateFilterBody.parse(body);

        // Use upsert instead of findUnique + conditional create.
        // This collapses two round-trips into one and is race-condition-safe.
        const result = await prisma.$transaction(async (tx) => {
            const config = await tx.categoryFilterConfig.upsert({
                where: { category: data.category },
                create: { category: data.category },
                update: {},           // no scalar fields to update on the parent
                select: { id: true }, // fetch only the id we need next
            });

            // deleteMany + createMany is the fastest bulk-replace pattern
            // in Prisma — a single DELETE and a single multi-row INSERT,
            // rather than individual upserts per filter row.
            await tx.filterDefinition.deleteMany({
                where: { categoryFilterConfigId: config.id },
            });

            await tx.filterDefinition.createMany({
                data: data.filters.map((f) => ({
                    categoryFilterConfigId: config.id,
                    key: f.key,
                    label: f.label,
                    type: f.type,
                    options: f.options,
                    min: f.min ?? null,
                    max: f.max ?? null,
                    dependencyKey: f.dependencyKey ?? null,
                    dependencyValue: f.dependencyValue ?? null,
                    sortOrder: f.sortOrder,
                })),
            });

            // Final read — after the writes have committed inside the
            // transaction — returns exactly the same shape as GET.
            return tx.categoryFilterConfig.findUnique({
                where: { id: config.id },
                select: CONFIG_SELECT,
            });
        }, {
            // Cap the transaction wall-clock time to avoid long-held locks
            // under load. Adjust upward if filter lists are very large.
            timeout: 10_000,
        });

        // Bust cache so the next GET reflects the new data immediately.
        invalidateCache(data.category);

        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("PUT /api/categories/filters error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}