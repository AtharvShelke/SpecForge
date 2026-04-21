import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const specSchema = z.object({
    specId: z.string().uuid(),
    optionId: z.string().uuid().optional().nullable(),
    valueString: z.string().optional().nullable(),
    valueNumber: z.number().optional().nullable(),
    valueBool: z.boolean().optional().nullable(),
});

const updateProductSchema = z.object({
    name: z.string().min(1).optional(),
    subCategoryId: z.string().uuid().optional(),
    price: z.number().positive().optional(),
    stock: z.number().int().min(0).optional(),
    images: z.array(z.string().min(1)).optional(),
    description: z.string().nullable().optional(),
    brandId: z.string().uuid().nullable().optional(),
    specs: z.array(specSchema).optional(),
});

// ── GET /api/products/[id] ──────────────────────────────
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                brand: true,
                subCategory: true,
                variants: { 
                    include: { 
                        inventoryItems: true,
                        variantSpecs: {
                            include: {
                                spec: true,
                                option: true
                            }
                        }
                    } 
                },
                media: true
            },
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        return NextResponse.json(product);
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
            const { specs, price, stock, images, ...productData } = data;
            
            await tx.product.update({
                where: { id },
                data: productData
            });

            // Handle specs, price, stock on the first variant if requested
            if (price !== undefined || stock !== undefined || specs !== undefined) {
                const variant = await tx.productVariant.findFirst({ where: { productId: id } });
                if (variant) {
                    if (price !== undefined) {
                        await tx.productVariant.update({
                            where: { id: variant.id },
                            data: { price }
                        });
                    }
                    if (stock !== undefined) {
                        const inv = await tx.inventoryItem.findFirst({ where: { variantId: variant.id } });
                        if (inv) {
                            await tx.inventoryItem.update({
                                where: { id: inv.id },
                                data: { quantityOnHand: stock }
                            });
                        } else {
                            await tx.inventoryItem.create({
                                data: {
                                    variantId: variant.id,
                                    trackingType: "BULK",
                                    quantityOnHand: stock,
                                    quantityReserved: 0,
                                    status: "IN_STOCK"
                                }
                            });
                        }
                    }
                    if (specs !== undefined) {
                        await tx.variantSpec.deleteMany({ where: { variantId: variant.id } });
                        if (specs.length > 0) {
                            await tx.variantSpec.createMany({
                                data: specs.map(s => ({
                                    variantId: variant.id,
                                    specId: s.specId,
                                    optionId: s.optionId ?? null,
                                    valueString: s.valueString ?? null,
                                    valueNumber: s.valueNumber ?? null,
                                    valueBool: s.valueBool ?? null,
                                }))
                            });
                        }
                    }
                }
            }

            if (images !== undefined) {
                await tx.productMedia.deleteMany({ where: { productId: id } });
                if (images.length > 0) {
                    await tx.productMedia.createMany({
                        data: images.map((url, index) => ({
                            productId: id,
                            url,
                            sortOrder: index
                        }))
                    });
                }
            }

            // Return updated complete representation
            return await tx.product.findUnique({
                where: { id },
                include: {
                    brand: true,
                    subCategory: true,
                    variants: {
                        include: { 
                            inventoryItems: true, 
                            variantSpecs: {
                                include: { spec: true, option: true }
                            } 
                        }
                    },
                    media: true
                }
            });
        });

        return NextResponse.json(product);
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

        // Will fail if referenced via strict relations
        await prisma.product.delete({ where: { id } });
        return NextResponse.json({ message: "Product deleted" });
    } catch (error: any) {
        if (error?.code === "P2003") {
            return NextResponse.json(
                { error: "Cannot delete product: it is referenced by existing orders or build guides" },
                { status: 409 }
            );
        }
        console.error("DELETE /api/products/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
