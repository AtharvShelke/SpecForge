import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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

// ── GET /api/categories/filters ─────────────────────────
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get("category");

        const where = category && CategoryEnum.safeParse(category).success
            ? { category: category as any }
            : undefined;

        const configs = await prisma.categoryFilterConfig.findMany({
            where,
            include: { filters: { orderBy: { sortOrder: "asc" } } },
        });

        return NextResponse.json(configs);
    } catch (error) {
        console.error("GET /api/categories/filters error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── PUT /api/categories/filters ─────────────────────────
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const data = updateFilterBody.parse(body);

        const result = await prisma.$transaction(async (tx) => {
            let config = await tx.categoryFilterConfig.findUnique({
                where: { category: data.category },
            });

            if (!config) {
                config = await tx.categoryFilterConfig.create({
                    data: { category: data.category },
                });
            }

            await tx.filterDefinition.deleteMany({
                where: { categoryFilterConfigId: config.id },
            });

            await tx.filterDefinition.createMany({
                data: data.filters.map((f) => ({
                    categoryFilterConfigId: config!.id,
                    key: f.key,
                    label: f.label,
                    type: f.type,
                    options: f.options,
                    min: f.min,
                    max: f.max,
                    dependencyKey: f.dependencyKey,
                    dependencyValue: f.dependencyValue,
                    sortOrder: f.sortOrder,
                })),
            });

            return tx.categoryFilterConfig.findUnique({
                where: { id: config.id },
                include: { filters: { orderBy: { sortOrder: "asc" } } },
            });
        });

        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("PUT /api/categories/filters error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
