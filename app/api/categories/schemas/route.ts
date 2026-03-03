import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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

// ── GET /api/categories/schemas ─────────────────────────
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get("category");

        const where = category && CategoryEnum.safeParse(category).success
            ? { category: category as any }
            : undefined;

        const schemas = await prisma.categorySchema.findMany({
            where,
            include: { attributes: { orderBy: { sortOrder: "asc" } } },
        });

        return NextResponse.json(schemas);
    } catch (error) {
        console.error("GET /api/categories/schemas error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── PUT /api/categories/schemas ─────────────────────────
// Upsert schema for a given category
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const data = updateSchemaBody.parse(body);

        const result = await prisma.$transaction(async (tx) => {
            // Find or create schema
            let schema = await tx.categorySchema.findUnique({
                where: { category: data.category },
            });

            if (!schema) {
                schema = await tx.categorySchema.create({
                    data: { category: data.category },
                });
            }

            // Delete old attributes and recreate
            await tx.attributeDefinition.deleteMany({
                where: { categorySchemaId: schema.id },
            });

            await tx.attributeDefinition.createMany({
                data: data.attributes.map((a) => ({
                    categorySchemaId: schema!.id,
                    key: a.key,
                    label: a.label,
                    type: a.type,
                    required: a.required,
                    options: a.options,
                    unit: a.unit,
                    sortOrder: a.sortOrder,
                })),
            });

            return tx.categorySchema.findUnique({
                where: { id: schema.id },
                include: { attributes: { orderBy: { sortOrder: "asc" } } },
            });
        });

        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("PUT /api/categories/schemas error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
