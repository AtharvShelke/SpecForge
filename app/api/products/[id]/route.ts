import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createInventoryUnits } from "@/lib/services/inventory";
import {
    fullProductInclude,
    mapProduct,
} from "@/lib/contracts/server-mappers";

const specSchema = z.object({
    key: z.string().min(1),
    value: z.string().min(1),
});

const inventoryUnitSchema = z.object({
    partNumber: z.string().min(1),
    serialNumber: z.string().min(1),
    costPrice: z.number().min(0).optional(),
    location: z.string().optional(),
    reorderLevel: z.number().int().min(0).optional(),
});

const updateProductSchema = z.object({
    name: z.string().min(1).optional(),
    categoryId: z.number().int().positive().optional(),
    category: z.string().min(1).optional(),
    price: z.number().positive().optional(),
    stock: z.number().int().min(0).optional(),
    images: z.array(z.string().min(1)).optional(), // Support multiple images
    description: z.string().nullable().optional(),
    brandId: z.string().uuid().nullable().optional(),
    specs: z.array(specSchema).optional(),
    inventoryUnits: z.array(inventoryUnitSchema).optional(),
});

function normalizeIdentifier(value: string | null | undefined) {
    return (value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

async function resolveCategoryId(input: string) {
    const categories = await prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, code: true, name: true, slug: true, shortLabel: true },
    });

    const requested = normalizeIdentifier(input);
    for (const category of categories) {
        const categoryKeys = new Set([
            normalizeIdentifier(category.code),
            normalizeIdentifier(category.name),
            normalizeIdentifier(category.slug),
            normalizeIdentifier(category.shortLabel),
        ]);
        if (categoryKeys.has(requested)) {
            return category.id;
        }
    }

    return null;
}

// ── GET /api/products/[id] ──────────────────────────────
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const product = await prisma.product.findUnique({
            where: { id },
            include: fullProductInclude,
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        return NextResponse.json(mapProduct(product));
    } catch (error) {
        console.error("GET /api/products/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── PUT /api/products/[id] ──────────────────────────────
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const data = updateProductSchema.parse(body);

        const existing = await prisma.product.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        const product = await prisma.$transaction(async (tx) => {
            // Update specs: delete old, create new
            if (data.specs) {
                await tx.productSpec.deleteMany({ where: { productId: id } });
            }

            const { specs: _, price, stock, images, brandId, category, inventoryUnits, ...productData } = data;
            
            // Prepare update data for product
            const updateData: Prisma.ProductUncheckedUpdateInput = { ...productData };
            if (price !== undefined) updateData.price = price;
            if (brandId !== undefined) updateData.brandId = brandId;
            if (category !== undefined) {
                const categoryId = await resolveCategoryId(category);
                if (!categoryId) {
                    throw new Error(`Invalid category: ${category}`);
                }
                updateData.categoryId = categoryId;
            }
            if (stock !== undefined) {
                updateData.stockStatus = stock > 0 ? "IN_STOCK" : "OUT_OF_STOCK";
            }

            const p = await tx.product.update({
                where: { id },
                data: updateData,
                include: fullProductInclude,
            });

           if (data.specs) {
    const targetCategoryId =
        typeof updateData.categoryId === "number"
            ? updateData.categoryId
            : existing.categoryId;

    const categoryAttributes = await tx.categoryAttribute.findMany({
        where: { categoryId: targetCategoryId },
        include: { options: true },
    });

    const attributeMap = new Map<
        string,
        (typeof categoryAttributes)[number]
    >(categoryAttributes.map((attribute) => [attribute.key, attribute]));

    for (const spec of data.specs) {
        const attribute = attributeMap.get(spec.key);

        if (!attribute) {
            throw new Error(
                `Unknown specification key for category: ${spec.key}`
            );
        }

        const matchedOption =
            attribute.options.find(
                (option) => option.value === spec.value
            ) ?? null;

        if (
            (attribute.type === "select" ||
                attribute.type === "multi_select") &&
            !matchedOption
        ) {
            throw new Error(
                `Invalid value for ${spec.key}. Admin must define this option first.`
            );
        }

        await tx.productSpec.create({
            data: {
                productId: id,
                attributeId: attribute.id,
                optionId: matchedOption?.id ?? null,
                value: spec.value,
                valueNumber:
                    attribute.type === "number"
                        ? Number(spec.value)
                        : null,
                valueBoolean:
                    attribute.type === "boolean"
                        ? spec.value.toLowerCase() === "true"
                        : null,
            },
        });
    }
}

            if (inventoryUnits) {
                const activeLinkedUnits = await tx.orderItemUnit.findMany({
                    where: {
                        inventoryItem: { productId: id },
                    },
                    select: { inventoryItemId: true },
                });
                const linkedUnitIds = new Set(activeLinkedUnits.map((item) => item.inventoryItemId));

                await tx.inventoryItem.deleteMany({
                    where: {
                        productId: id,
                        id: { notIn: [...linkedUnitIds] },
                    },
                });

                await createInventoryUnits(
                    tx,
                    id,
                    inventoryUnits.map((unit) => ({
                        partNumber: unit.partNumber,
                        serialNumber: unit.serialNumber,
                        costPrice: unit.costPrice ?? ((price ?? p.price ?? 0) as number) * 0.8,
                        location: unit.location ?? "WAREHOUSE-A",
                        reorderLevel: unit.reorderLevel ?? 5,
                    })),
                    "Inventory units refreshed",
                );
            }

            if (images !== undefined) {
                // Delete existing media and create new ones
                await tx.productMedia.deleteMany({ where: { productId: id } });
                await tx.productMedia.createMany({
                    data: images.map((url, index) => ({
                        productId: id,
                        url,
                        sortOrder: index
                    }))
                });
            }


            return p;
        });

        const refreshed = await prisma.product.findUnique({
            where: { id },
            include: fullProductInclude,
        });

        return NextResponse.json(refreshed ? mapProduct(refreshed) : null);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("PUT /api/products/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── DELETE /api/products/[id] ───────────────────────────
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const existing = await prisma.product.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Will fail if OrderItems or BuildGuideItems reference this product (onDelete: Restrict)
        await prisma.product.delete({ where: { id } });
        return NextResponse.json({ message: "Product deleted" });
    } catch (error: unknown) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "P2003"
        ) {
            return NextResponse.json(
                { error: "Cannot delete product: it is referenced by existing orders or build guides" },
                { status: 409 }
            );
        }
        console.error("DELETE /api/products/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
