import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const StockMovementTypeEnum = z.enum([
    "PURCHASE", "INWARD", "OUTWARD", "SALE", "RETURN", "ADJUSTMENT", "RESERVE",
]);

const createMovementSchema = z.object({
    type: StockMovementTypeEnum,
    quantity: z.number().int().positive(),
    reason: z.string().nullable().optional(),
    performedBy: z.string().default("System"),
});

// ── GET /api/inventory/[id]/movements ───────────────────
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: sku } = await params;
        // First find the product by SKU
        const product = await prisma.product.findUnique({
            where: { sku },
            select: { id: true }
        });
        
        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        const movements = await prisma.stockMovement.findMany({
            where: { productId: product.id },
            orderBy: { createdAt: "desc" },
            take: 100,
        });

        return NextResponse.json(movements);
    } catch (error) {
        console.error("GET /api/inventory/[id]/movements error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── POST /api/inventory/[id]/movements ──────────────────
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: sku } = await params;
        const body = await req.json();
        const data = createMovementSchema.parse(body);

        const result = await prisma.$transaction(async (tx) => {
            const inv = await tx.inventoryItem.findFirst({
                where: { product: { sku } }
            });
            if (!inv) throw new Error("NOT_FOUND");

            let qtyDelta = 0;
            let reservedDelta = 0;

            switch (data.type) {
                case "INWARD":
                case "RETURN":
                case "PURCHASE":
                    qtyDelta = data.quantity;
                    break;
                case "OUTWARD":
                case "ADJUSTMENT":
                    qtyDelta = -data.quantity;
                    break;
                case "RESERVE":
                    qtyDelta = -data.quantity;
                    reservedDelta = data.quantity;
                    break;
                case "SALE":
                    reservedDelta = -data.quantity;
                    break;
            }

            const newQty = Math.max(0, inv.quantity + qtyDelta);
            const newReserved = Math.max(0, inv.reserved + reservedDelta);

            await tx.inventoryItem.update({
                where: { id: inv.id },
                data: {
                    quantity: newQty,
                    reserved: newReserved,
                    lastUpdated: new Date(),
                },
            });

            // Sync product stock
            await tx.product.update({
                where: { id: inv.productId },
                data: { stockStatus: newQty > 0 ? "IN_STOCK" : "OUT_OF_STOCK" },
            });

            const movement = await tx.stockMovement.create({
                data: {
                    productId: inv.productId,
                    type: data.type,
                    quantity: data.quantity,
                    note: data.reason,
                },
            });

            return movement;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        if (error?.message === "NOT_FOUND") {
            return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
        }
        console.error("POST /api/inventory/[id]/movements error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
