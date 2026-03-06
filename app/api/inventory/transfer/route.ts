import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const transferSchema = z.object({
    sourceWarehouseId: z.string().uuid(),
    targetWarehouseId: z.string().uuid(),
    variantId: z.string().uuid(),
    quantity: z.number().int().positive(),
    reason: z.string().optional(),
});

// ── POST /api/inventory/transfer ────────────────────────
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const data = transferSchema.parse(body);

        if (data.sourceWarehouseId === data.targetWarehouseId) {
            return NextResponse.json(
                { error: "Source and target warehouses must be different" },
                { status: 400 }
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Verify source inventory item & balance
            const sourceInv = await tx.warehouseInventory.findUnique({
                where: {
                    variantId_warehouseId: {
                        variantId: data.variantId,
                        warehouseId: data.sourceWarehouseId,
                    },
                },
            });

            if (!sourceInv || sourceInv.quantity < data.quantity) {
                throw new Error("INSUFFICIENT_STOCK");
            }

            // 2. Find target inventory item
            const targetInv = await tx.warehouseInventory.findUnique({
                where: {
                    variantId_warehouseId: {
                        variantId: data.variantId,
                        warehouseId: data.targetWarehouseId,
                    },
                },
            });

            const newTargetQty = (targetInv?.quantity || 0) + data.quantity;
            let updatedTarget;

            if (targetInv) {
                updatedTarget = await tx.warehouseInventory.update({
                    where: { id: targetInv.id },
                    data: { quantity: newTargetQty, lastUpdated: new Date() },
                });
            } else {
                updatedTarget = await tx.warehouseInventory.create({
                    data: {
                        variantId: data.variantId,
                        warehouseId: data.targetWarehouseId,
                        quantity: newTargetQty,
                        reorderLevel: sourceInv.reorderLevel,
                        costPrice: sourceInv.costPrice,
                    },
                });
            }

            // 3. Perform deductions
            const newSourceQty = sourceInv.quantity - data.quantity;
            const updatedSource = await tx.warehouseInventory.update({
                where: { id: sourceInv.id },
                data: { quantity: newSourceQty, lastUpdated: new Date() },
            });

            // 4. Log movements
            await tx.stockMovement.create({
                data: {
                    warehouseInventoryId: sourceInv.id,
                    warehouseId: data.sourceWarehouseId,
                    type: "OUTWARD",
                    quantity: data.quantity,
                    previousQuantity: sourceInv.quantity,
                    newQuantity: newSourceQty,
                    reason: data.reason || "Warehouse Transfer (Out)",
                    performedBy: "Admin",
                },
            });

            await tx.stockMovement.create({
                data: {
                    warehouseInventoryId: updatedTarget.id,
                    warehouseId: data.targetWarehouseId,
                    type: "INWARD",
                    quantity: data.quantity,
                    previousQuantity: targetInv?.quantity || 0,
                    newQuantity: newTargetQty,
                    reason: data.reason || "Warehouse Transfer (In)",
                    performedBy: "Admin",
                },
            });

            // Recalculate global stock for safely turning out of stock
            const allInv = await tx.warehouseInventory.aggregate({
                where: { variantId: data.variantId },
                _sum: { quantity: true }
            });
            if ((allInv._sum.quantity || 0) <= 0) {
                await tx.productVariant.update({
                    where: { id: data.variantId },
                    data: { status: 'OUT_OF_STOCK' }
                });
            }

            return { updatedSource, updatedTarget };
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
