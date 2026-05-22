import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const transferSchema = z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    reason: z.string().optional(),
});

// ── POST /api/inventory/transfer ────────────────────────
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const data = transferSchema.parse(body);

        const result = await prisma.$transaction(async (tx) => {
            // 1. Verify inventory item & balance
            const inv = await tx.inventoryItem.findFirst({
                where: { productId: data.productId },
            });

            if (!inv || inv.quantity < data.quantity) {
                throw new Error("INSUFFICIENT_STOCK");
            }

            // 2. Update inventory quantity
            const updatedInv = await tx.inventoryItem.update({
                where: { id: inv.id },
                data: { 
                    quantity: inv.quantity - data.quantity,
                    lastUpdated: new Date(),
                },
            });

            // 3. Log movement
            await tx.stockMovement.create({
                data: {
                    productId: data.productId,
                    type: "OUTWARD",
                    quantity: data.quantity,
                    note: data.reason || "Inventory Transfer",
                },
            });

            // Recalculate global stock for safely turning out of stock
            const allInv = await tx.inventoryItem.aggregate({
                where: { productId: data.productId },
                _sum: { quantity: true }
            });
            if ((allInv._sum.quantity || 0) <= 0) {
                await tx.product.update({
                    where: { id: data.productId },
                    data: { stockStatus: 'OUT_OF_STOCK' }
                });
            }

            return { updatedInv };
        });

        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
            return NextResponse.json(
                { error: "Insufficient stock in source warehouse" },
                { status: 400 }
            );
        }
        console.error("POST /api/inventory/transfer error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
