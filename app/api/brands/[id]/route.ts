import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateBrandSchema = z.object({
    name: z.string().min(1).optional(),
    categories: z.array(z.string().min(1)).optional(),
});

function normalizeIdentifier(value: string | null | undefined) {
    return (value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function slugify(value: string) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

async function loadCategoryResolver() {
    const [definitions, categories] = await Promise.all([
        prisma.categoryDefinition.findMany({
            where: { isActive: true },
            select: { code: true, label: true, shortLabel: true },
        }),
        prisma.category.findMany({
            select: { id: true, name: true, slug: true },
        }),
    ]);

    return {
        resolveCategoryIds(inputs: string[]) {
            const requested = new Set(inputs.map((input) => normalizeIdentifier(input)).filter(Boolean));
            const matches = new Set<number>();

            for (const category of categories) {
                const categoryKeys = new Set([
                    normalizeIdentifier(category.name),
                    normalizeIdentifier(category.slug),
                ]);

                const definition = definitions.find((item) => {
                    const definitionKeys = [
                        normalizeIdentifier(item.code),
                        normalizeIdentifier(item.label),
                        normalizeIdentifier(item.shortLabel),
                        normalizeIdentifier(slugify(item.label)),
                    ].filter(Boolean);

                    return definitionKeys.some((key) => categoryKeys.has(key));
                });

                const candidateKeys = new Set([
                    ...categoryKeys,
                    normalizeIdentifier(definition?.code),
                    normalizeIdentifier(definition?.label),
                    normalizeIdentifier(definition?.shortLabel),
                ]);

                if ([...candidateKeys].some((key) => requested.has(key))) {
                    matches.add(category.id);
                }
            }

            return [...matches];
        },
    };
}

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const brand = await prisma.brand.findUnique({
            where: { id },
            include: {
                brandCategories: {
                    include: {
                        category: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
                products: { select: { id: true, name: true, variants: { select: { sku: true } } } },
            },
        });

        if (!brand) {
            return NextResponse.json({ error: "Brand not found" }, { status: 404 });
        }

        return NextResponse.json({
            ...brand,
            categories: brand.brandCategories.map((item) => item.category.name),
        });
    } catch (error) {
        console.error("GET /api/brands/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const data = updateBrandSchema.parse(body);

        if (data.name) {
            const existing = await prisma.brand.findUnique({ where: { name: data.name } });
            if (existing && existing.id !== id) {
                return NextResponse.json({ error: "Brand name already exists" }, { status: 409 });
            }
        }

        const resolver = await loadCategoryResolver();
        const categoryIds = data.categories ? resolver.resolveCategoryIds(data.categories) : undefined;

        const brand = await prisma.brand.update({
            where: { id },
            data: {
                ...(data.name !== undefined ? { name: data.name } : {}),
                ...(categoryIds !== undefined ? {
                    brandCategories: {
                        deleteMany: {},
                        ...(categoryIds.length
                            ? {
                                create: categoryIds.map((categoryId) => ({
                                    category: { connect: { id: categoryId } },
                                })),
                            }
                            : {}),
                    },
                } : {}),
            },
            include: {
                brandCategories: {
                    include: {
                        category: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json({
            id: brand.id,
            name: brand.name,
            createdAt: brand.createdAt,
            updatedAt: brand.updatedAt,
            categories: brand.brandCategories.map((item) => item.category.name),
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("PUT /api/brands/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.brand.delete({ where: { id } });
        return NextResponse.json({ message: "Brand deleted" });
    } catch (error) {
        console.error("DELETE /api/brands/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
