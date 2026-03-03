import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { PurchaseOrderStatus } from "@/generated/prisma/client";

const receiveItemSchema = z.object({
    itemId: z.string().uuid(),
    quantityReceiving: z.number().int().min(0),
});

const receivePoSchema = z.object({
    items: z.array(receiveItemSchema).min(1),
});

// ── GET /api/inventory/purchase-orders/[id] ────────────
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const po = await prisma.purchaseOrder.findUnique({
            where: { id },
            include: {
                supplier: true,
                warehouse: true,
                items: {
                    include: {
                        variant: {
                            include: { product: { select: { name: true } } },
                        },
                    },
                },
            },
        });

        if (!po) return NextResponse.json({ error: "Purchase Order not found" }, { status: 404 });

        return NextResponse.json(po);
    } catch (error) {
        console.error("GET /api/inventory/purchase-orders/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── PATCH /api/inventory/purchase-orders/[id]/receive ──
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const data = receivePoSchema.parse(body);

        const result = await prisma.$transaction(async (tx) => {
            const po = await tx.purchaseOrder.findUnique({
                where: { id },
                include: { items: true },
            });

            if (!po) throw new Error("NOT_FOUND");
            if (po.status === "COMPLETED" || po.status === "CANCELLED") {
                throw new Error("INVALID_STATE");
            }

            let allItemsReceived = true;
            let someItemsReceived = false;

            // Update items and inventory
            for (const incomingItem of data.items) {
                const poItem = po.items.find(i => i.id === incomingItem.itemId);
                if (!poItem) continue;

                const qtyToReceive = incomingItem.quantityReceiving;
                if (qtyToReceive <= 0) {
                    // Check if previously fully received
                    if (poItem.quantityReceived < poItem.quantityOrdered) {
                        allItemsReceived = false;
                    } else if (poItem.quantityReceived > 0) {
                        someItemsReceived = true;
                    }
                    continue; // Skip this item for processing now
                }

                // Update PO Item quantity received
                const newQtyReceived = poItem.quantityReceived + qtyToReceive;
                await tx.purchaseOrderItem.update({
                    where: { id: poItem.id },
                    data: { quantityReceived: newQtyReceived },
                });

                if (newQtyReceived < poItem.quantityOrdered) allItemsReceived = false;
                someItemsReceived = true;

                // Sync Warehouse Inventory
                let inv = await tx.warehouseInventory.findUnique({
                    where: {
                        variantId_warehouseId: {
                            variantId: poItem.variantId,
                            warehouseId: po.warehouseId,
                        },
                    },
                });

                let previousInvQuantity = 0;
                let newInvQuantity = qtyToReceive;
                let invId = "";

                if (inv) {
                    previousInvQuantity = inv.quantity;
                    newInvQuantity = inv.quantity + qtyToReceive;

                    // A simple moving average for unit cost can be implemented here if required
                    await tx.warehouseInventory.update({
                        where: { id: inv.id },
                        data: { quantity: newInvQuantity, lastUpdated: new Date() },
                    });
                    invId = inv.id;
                } else {
                    const newInv = await tx.warehouseInventory.create({
                        data: {
                            variantId: poItem.variantId,
                            warehouseId: po.warehouseId,
                            quantity: newInvQuantity,
                            costPrice: poItem.unitCost, // Initialize unit cost
                        },
                    });
                    invId = newInv.id;
                }

                // Append Stock Movement
                await tx.stockMovement.create({
                    data: {
                        warehouseInventoryId: invId,
                        warehouseId: po.warehouseId,
                        type: "PURCHASE",
                        quantity: qtyToReceive,
                        previousQuantity: previousInvQuantity,
                        newQuantity: newInvQuantity,
                        reason: `Received PO: ${po.id}`,
                        performedBy: "Admin",
                    },
                });

                // Update Product status metadata
                await tx.productVariant.update({
                    where: { id: poItem.variantId },
                    data: { status: "IN_STOCK" },
                });
            }

            // Determine new overall PO status
            let newStatus: PurchaseOrderStatus = po.status;
            if (allItemsReceived) {
                newStatus = "COMPLETED";
            } else if (someItemsReceived || po.status === "PARTIAL") {
                newStatus = "PARTIAL";
            }

            const updatedPo = await tx.purchaseOrder.update({
                where: { id },
                data: { status: newStatus },
                include: {
                    supplier: true,
                    warehouse: true,
                    items: {
                        include: { variant: { include: { product: { select: { name: true } } } } }
                    }
                }
            });

            return updatedPo;
        });

        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        if (error instanceof Error && error.message === "NOT_FOUND") {
            return NextResponse.json({ error: "Purchase Order not found" }, { status: 404 });
        }
        if (error instanceof Error && error.message === "INVALID_STATE") {
            return NextResponse.json({ error: "Cannot receive items for a completed or cancelled PO" }, { status: 400 });
        }
        console.error("PATCH /api/inventory/purchase-orders/[id]/receive error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
