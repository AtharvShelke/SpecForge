import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ── Schemas (module-level, parsed once on cold start) ────
const CategoryEnum = z.enum([
    "PROCESSOR", "GPU", "MOTHERBOARD", "RAM", "STORAGE",
    "PSU", "CABINET", "COOLER", "MONITOR", "PERIPHERAL", "NETWORKING", "LAPTOP",
]);

const attributeSchema = z.object({
    key: z.string().min(1),
    label: z.string().min(1),
    type: z.string().min(1),
    required: z.boolean().default(false),
    options: z.array(z.string()).default([]),
    unit: z.string().optional(),
    sortOrder: z.number().int().default(0),
});

const updateSchemaBody = z.object({
    category: CategoryEnum,
    attributes: z.array(attributeSchema),
});

// ── Shared select projection ─────────────────────────────
// Defined once, reused in GET + PUT final read.
// Using `select` instead of `include` avoids fetching internal
// Prisma join metadata and gives the query planner tighter column hints.
const ATTRIBUTE_SELECT = {
    id: true,
    key: true,
    label: true,
    type: true,
    required: true,
    options: true,
    unit: true,
    sortOrder: true,
} as const;

const SCHEMA_SELECT = {
    id: true,
    category: true,
    attributes: {
        select: ATTRIBUTE_SELECT,
        orderBy: { sortOrder: "asc" as const },
    },
} as const;

// ── In-process TTL cache ─────────────────────────────────
// Safe here because schemas are written only via PUT (admin path).
// Avoids a DB round-trip on every GET for what is essentially
// static configuration data between writes.
// In a multi-replica deployment the worst case is TTL-seconds of
// staleness on replicas that haven't received the PUT — acceptable
// for category schema config. Swap for Redis if stricter consistency
// is required.
const CACHE_TTL_MS = 60_000;

interface CacheEntry {
    data: unknown;
    expiresAt: number;
}

const schemaCache = new Map<string, CacheEntry>();

function getCached(key: string): unknown | null {
    const entry = schemaCache.get(key);
    if (!entry || Date.now() > entry.expiresAt) return null;
    return entry.data;
}

function setCache(key: string, data: unknown): void {
    schemaCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

function invalidateCache(category: string): void {
    // Bust both the targeted key and the "all categories" sentinel
    // so neither GET ?category=X nor GET (no param) serves stale data.
    schemaCache.delete(category);
    schemaCache.delete("__all__");
}

// ── GET /api/categories/schemas ─────────────────────────
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const raw = searchParams.get("category");

        // Validate once; reuse the parsed value to avoid double-parsing.
        const parsed = raw ? CategoryEnum.safeParse(raw) : null;
        const category = parsed?.success ? parsed.data : null;

        const cacheKey = category ?? "__all__";
        const cached = getCached(cacheKey);
        if (cached) {
            return NextResponse.json(cached);
        }

        // Single query with nested select — Prisma issues one JOIN rather
        // than a separate child query per parent row (no N+1).
        const schemas = await prisma.categorySchema.findMany({
            where: category ? { category } : undefined,
            select: SCHEMA_SELECT,
        });

        setCache(cacheKey, schemas);
        return NextResponse.json(schemas);
    } catch (error) {
        console.error("GET /api/categories/schemas error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── PUT /api/categories/schemas ─────────────────────────
export async function PUT(req: NextRequest) {
    try {
        // Validate before touching the DB — fail fast on bad input.
        const body = await req.json();
        const data = updateSchemaBody.parse(body);

        const result = await prisma.$transaction(
            async (tx) => {
                // upsert collapses findUnique + conditional create into one
                // atomic round-trip, eliminating a race condition where two
                // concurrent PUTs for the same category could both hit the
                // "not found" branch and attempt duplicate creates.
                const schema = await tx.categorySchema.upsert({
                    where: { category: data.category },
                    create: { category: data.category },
                    update: {},          // no scalar fields on parent to update
                    select: { id: true },// fetch only what the next queries need
                });

                // deleteMany + createMany = one DELETE + one multi-row INSERT.
                // Faster than per-row upserts and keeps the attribute list in
                // exact sync with the request payload (handles deletions too).
                await tx.attributeDefinition.deleteMany({
                    where: { categorySchemaId: schema.id },
                });

                await tx.attributeDefinition.createMany({
                    data: data.attributes.map((a) => ({
                        categorySchemaId: schema.id,
                        key: a.key,
                        label: a.label,
                        type: a.type,
                        required: a.required,
                        options: a.options,
                        unit: a.unit ?? null,   // explicit null avoids driver
                        sortOrder: a.sortOrder, // coercion warnings in PG
                    })),
                });

                // Final read after writes have committed — same projection
                // as GET so the response shape is always consistent.
                return tx.categorySchema.findUnique({
                    where: { id: schema.id },
                    select: SCHEMA_SELECT,
                });
            },
            {
                // Cap wall-clock time to prevent long-held row locks
                // from cascading under concurrent load.
                timeout: 10_000,
            }
        );

        // Invalidate cache so the next GET reflects the new schema immediately.
        invalidateCache(data.category);

        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("PUT /api/categories/schemas error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}