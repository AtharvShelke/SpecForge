import { PrismaClient } from "@/generated/prisma/client";

type PrismaTx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export interface InventoryReserveItem {
    variantId: string;
    quantity: number;
}

export class InsufficientStockError extends Error {
    public variantId: string;
    constructor(variantId: string) {
        super(`Insufficient stock for variant ${variantId}`);
        this.name = 'InsufficientStockError';
        this.variantId = variantId;
    }
}

/**
 * Reserve inventory for an order (deducts available, increments reserved).
 * Must be called within a Prisma transaction.
 */
export async function reserveInventory(
    tx: PrismaTx,
    items: InventoryReserveItem[],
    orderId: string,
    performedBy: string = 'System'
): Promise<void> {
    for (const item of items) {
        // Find best bulk inventory item with sufficient stock for this variant.
        const inv = await tx.inventoryItem.findFirst({
            where: { 
                variantId: item.variantId, 
                quantityOnHand: { gte: item.quantity },
                status: 'IN_STOCK'
            },
            orderBy: { quantityOnHand: 'desc' },
        });

        if (!inv) throw new InsufficientStockError(item.variantId);

        // Optimistic concurrency: re-check quantity in WHERE clause
        const updated = await tx.inventoryItem.updateMany({
            where: { id: inv.id, quantityOnHand: { gte: item.quantity } },
            data: {
                quantityOnHand: { decrement: item.quantity },
                quantityReserved: { increment: item.quantity },
            },
        });

        if (updated.count === 0) throw new InsufficientStockError(item.variantId);

        // Record the formal reservation linking via the new Reservation model
        await tx.reservation.create({
            data: {
                orderId,
                inventoryItemId: inv.id,
                quantity: item.quantity,
                status: 'ACTIVE'
            }
        });

        // Trigger OUT_OF_STOCK status if total available quantity hits 0
        const allInv = await tx.inventoryItem.aggregate({
            where: { variantId: item.variantId },
            _sum: { quantityOnHand: true }
        });

        if ((allInv._sum.quantityOnHand || 0) <= 0) {
            await tx.productVariant.update({
                where: { id: item.variantId },
                data: { status: 'OUT_OF_STOCK' }
            });
        }
    }
}

/**
 * Confirm reserved inventory (deducts reserved count on shipment).
 * Called when order transitions to SHIPPED.
 */
export async function confirmInventory(
    tx: PrismaTx,
    items: InventoryReserveItem[],
    orderId: string,
    performedBy: string = 'System'
): Promise<void> {
    for (const item of items) {
        const reservations = await tx.reservation.findMany({
            where: { orderId, status: 'ACTIVE', inventoryItem: { variantId: item.variantId } },
            include: { inventoryItem: true }
        });

        for (const res of reservations) {
            await tx.inventoryItem.update({
                where: { id: res.inventoryItemId },
                data: {
                    quantityReserved: { decrement: res.quantity },
                },
            });

            await tx.reservation.update({
                where: { id: res.id },
                data: { status: 'CONVERTED' }
            });
        }
    }
}

/**
 * Restore inventory when an order is cancelled or returned.
 * Handles both pre-ship (reserved → available) and post-ship (add back to available).
 */
export async function restoreInventory(
    tx: PrismaTx,
    items: InventoryReserveItem[],
    orderId: string,
    isPreShip: boolean,
    reason: string,
    performedBy: string = 'System'
): Promise<void> {
    for (const item of items) {
        if (isPreShip) {
            // Pre-ship cancellation: move from reserved back to available and release Reservation
            const reservations = await tx.reservation.findMany({
                where: { orderId, status: 'ACTIVE', inventoryItem: { variantId: item.variantId } },
                include: { inventoryItem: true }
            });

            let restoredTotal = 0;
            for (const res of reservations) {
                await tx.inventoryItem.update({
                    where: { id: res.inventoryItemId },
                    data: {
                        quantityOnHand: { increment: res.quantity },
                        quantityReserved: { decrement: res.quantity },
                    },
                });

                await tx.reservation.update({
                    where: { id: res.id },
                    data: { status: 'RELEASED' }
                });
                restoredTotal += res.quantity;
            }

            // If returned item makes stock > 0, make sure status is IN_STOCK
            if (restoredTotal > 0) {
                const variant = await tx.productVariant.findUnique({
                    where: { id: item.variantId },
                    select: { status: true }
                });

                if (variant?.status === 'OUT_OF_STOCK') {
                    await tx.productVariant.update({
                        where: { id: item.variantId },
                        data: { status: 'IN_STOCK' }
                    });
                }
            }
        } else {
            // Post-ship return: add back to available
            const inv = await tx.inventoryItem.findFirst({
                where: { variantId: item.variantId, trackingType: 'BULK' }
            });

            if (inv) {
                await tx.inventoryItem.update({
                    where: { id: inv.id },
                    data: {
                        quantityOnHand: { increment: item.quantity },
                    },
                });
                
                const variant = await tx.productVariant.findUnique({
                    where: { id: item.variantId },
                    select: { status: true }
                });

                if (variant?.status === 'OUT_OF_STOCK') {
                    await tx.productVariant.update({
                        where: { id: item.variantId },
                        data: { status: 'IN_STOCK' }
                    });
                }
            }
        }
    }
}
