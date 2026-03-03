import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CategoryEnum = z.enum([
    "PROCESSOR", "GPU", "MOTHERBOARD", "RAM", "STORAGE",
    "PSU", "CABINET", "COOLER", "MONITOR", "PERIPHERAL", "NETWORKING",
]);

const specSchema = z.object({
    key: z.string().min(1),
    value: z.string().min(1),
});

const updateProductSchema = z.object({
    name: z.string().min(1).optional(),
    category: CategoryEnum.optional(),
    price: z.number().positive().optional(),
    stock: z.number().int().min(0).optional(),
    image: z.string().min(1).optional(),
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
                specs: true,
                brand: true,
                reviews: { orderBy: { createdAt: "desc" } },
                variants: { include: { warehouseInventories: true } },
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
            // Update specs: delete old, create new
            if (data.specs) {
                await tx.productSpec.deleteMany({ where: { productId: id } });
                await tx.productSpec.createMany({
                    data: data.specs.map((s) => ({ productId: id, key: s.key, value: s.value })),
                });
            }

            const { specs: _, price, stock, image, ...productData } = data;
            const p = await tx.product.update({
                where: { id },
                data: productData,
                include: { specs: true, brand: true, variants: true, media: true },
            });

            // Map flat API updates to variant/media models if passed
            if (price !== undefined || stock !== undefined) {
                const variant = await tx.productVariant.findFirst({ where: { productId: id } });
                if (variant) {
                    await tx.productVariant.update({
                        where: { id: variant.id },
                        data: {
                            ...(price !== undefined ? { price } : {})
                        }
                    });
                    // If stock passed, update main warehouse
                    if (stock !== undefined) {
                        const defaultWarehouse = await tx.warehouse.findFirst({ where: { code: "MAIN" } });
                        if (defaultWarehouse) {
                            const inv = await tx.warehouseInventory.findUnique({ where: { variantId_warehouseId: { variantId: variant.id, warehouseId: defaultWarehouse.id } } });
                            if (inv) {
                                await tx.warehouseInventory.update({
                                    where: { id: inv.id },
                                    data: { quantity: stock }
                                });
                            }
                        }
                    }
                }
            }

            if (image !== undefined) {
                const mediaNode = await tx.productMedia.findFirst({ where: { productId: id } });
                if (mediaNode) {
                    await tx.productMedia.update({
                        where: { id: mediaNode.id },
                        data: { url: image }
                    });
                } else {
                    await tx.productMedia.create({
                        data: { productId: id, url: image, sortOrder: 0 }
                    });
                }
            }


            return p;
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

        // Will fail if OrderItems reference this product (onDelete: Restrict)
        await prisma.product.delete({ where: { id } });
        return NextResponse.json({ message: "Product deleted" });
    } catch (error: any) {
        if (error?.code === "P2003") {
            return NextResponse.json(
                { error: "Cannot delete product: it is referenced by existing orders" },
                { status: 409 }
            );
        }
        console.error("DELETE /api/products/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
