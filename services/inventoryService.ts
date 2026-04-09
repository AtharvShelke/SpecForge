/**
 * Centralized Inventory Service
 *
 * Channel-agnostic inventory reservation, confirmation, and restoration.
 * All sales channels funnel through these functions — no inventory logic
 * should live in API routes directly.
 */

import { PrismaClient } from "@/generated/prisma/client";



type PrismaTx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export interface InventoryReserveItem {
    variantId: string;
    quantity: number;
    orderItemId?: string;
    assignedUnitIds?: string[];
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
        // Find best warehouse with sufficient stock
        const inv = await tx.warehouseInventory.findFirst({
            where: { variantId: item.variantId, quantity: { gte: item.quantity } },
            orderBy: { quantity: 'desc' },
        });

        if (!inv) throw new InsufficientStockError(item.variantId);

        // Optimistic concurrency: re-check quantity in WHERE clause
        const updated = await tx.warehouseInventory.updateMany({
            where: { id: inv.id, quantity: { gte: item.quantity } },
            data: {
                quantity: { decrement: item.quantity },
                reserved: { increment: item.quantity },
                lastUpdated: new Date(),
            },
        });

        if (updated.count === 0) throw new InsufficientStockError(item.variantId);

        // Log stock movement with order reference
        await tx.stockMovement.create({
            data: {
                warehouseInventoryId: inv.id,
                warehouseId: inv.warehouseId,
                type: 'RESERVE',
                quantity: item.quantity,
                previousQuantity: inv.quantity,
                newQuantity: inv.quantity - item.quantity,
                orderId,
                reason: `Order ${orderId} placed — stock reserved`,
                performedBy,
            },
        });

        // Trigger OUT_OF_STOCK status if total available quantity hits 0 across all warehouses
        const allInv = await tx.warehouseInventory.aggregate({
            where: { variantId: item.variantId },
            _sum: { quantity: true }
        });

        if ((allInv._sum.quantity || 0) <= 0) {
            await tx.productVariant.update({
                where: { id: item.variantId },
                data: { status: 'OUT_OF_STOCK' }
            });
        }

        // Trace physical inventory units
        if (item.orderItemId) {
            const units = await tx.inventoryUnit.findMany({
                where: {
                    variantId: item.variantId,
                    warehouseId: inv.warehouseId,
                    status: 'AVAILABLE'
                },
                take: item.quantity,
            });

            if (units.length > 0) {
                await tx.inventoryUnit.updateMany({
                    where: { id: { in: units.map(u => u.id) } },
                    data: {
                        status: 'RESERVED',
                        orderItemId: item.orderItemId,
                        updatedAt: new Date(),
                    }
                });
            }

            // Fallback: If warehouse inventory unit count misaligned
            if (units.length < item.quantity) {
                const remaining = item.quantity - units.length;
                const extraUnits = await tx.inventoryUnit.findMany({
                    where: {
                        variantId: item.variantId,
                        status: 'AVAILABLE'
                    },
                    take: remaining,
                });
                if (extraUnits.length > 0) {
                    await tx.inventoryUnit.updateMany({
                        where: { id: { in: extraUnits.map(u => u.id) } },
                        data: {
                            status: 'RESERVED',
                            orderItemId: item.orderItemId,
                            updatedAt: new Date(),
                        }
                    });
                }
            }
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
        const inv = await tx.warehouseInventory.findFirst({
            where: { variantId: item.variantId },
        });
        if (!inv) continue;

        await tx.warehouseInventory.update({
            where: { id: inv.id },
            data: {
                reserved: { decrement: item.quantity },
                lastUpdated: new Date(),
            },
        });

        const assignedCount = item.assignedUnitIds?.length || 0;
        const unassignedQty = item.quantity - assignedCount;

        if (unassignedQty > 0) {
            await tx.stockMovement.create({
                data: {
                    warehouseInventoryId: inv.id,
                    warehouseId: inv.warehouseId,
                    type: 'SALE',
                    quantity: unassignedQty,
                    previousQuantity: inv.quantity,
                    newQuantity: inv.quantity,
                    orderId,
                    reason: `Order ${orderId} shipped — reserved stock confirmed`,
                    performedBy,
                },
            });
        }

        if (item.orderItemId) {
            if (item.assignedUnitIds && item.assignedUnitIds.length > 0) {
                // Return any auto-reserved units to available
                await tx.inventoryUnit.updateMany({
                    where: { orderItemId: item.orderItemId, status: 'RESERVED' },
                    data: { status: 'AVAILABLE', orderItemId: null, updatedAt: new Date() }
                });

                // Mark specific assigned units as SOLD
                await tx.inventoryUnit.updateMany({
                    where: { id: { in: item.assignedUnitIds } },
                    data: { status: 'SOLD', orderItemId: item.orderItemId, soldAt: new Date(), updatedAt: new Date() }
                });

                // Detailed stock movement for mapped units
                for (const uId of item.assignedUnitIds) {
                    const u = await tx.inventoryUnit.findUnique({ where: { id: uId } });
                    if (u && u.warehouseInventoryId) {
                        await tx.stockMovement.create({
                            data: {
                                warehouseInventoryId: u.warehouseInventoryId,
                                warehouseId: u.warehouseId,
                                inventoryUnitId: u.id,
                                serialNumberSnapshot: u.sn || null,
                                type: "SALE",
                                quantity: 1,
                                previousQuantity: 1,
                                newQuantity: 0,
                                orderId: orderId,
                                reason: `Unit manually mapped for order ${orderId}`,
                                performedBy: performedBy || "Admin",
                            }
                        });
                    }
                }
            } else {
                await tx.inventoryUnit.updateMany({
                    where: { orderItemId: item.orderItemId, status: 'RESERVED' },
                    data: { status: 'SOLD', soldAt: new Date(), updatedAt: new Date() }
                });
            }
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
        const inv = await tx.warehouseInventory.findFirst({
            where: { variantId: item.variantId },
        });
        if (!inv) continue;

        const newQuantity = inv.quantity + item.quantity;

        if (isPreShip) {
            // Pre-ship cancellation: move from reserved back to available
            await tx.warehouseInventory.update({
                where: { id: inv.id },
                data: {
                    quantity: { increment: item.quantity },
                    reserved: { decrement: item.quantity },
                    lastUpdated: new Date(),
                },
            });
        } else {
            // Post-ship return: add back to available (no reserved to decrement)
            await tx.warehouseInventory.update({
                where: { id: inv.id },
                data: {
                    quantity: { increment: item.quantity },
                    lastUpdated: new Date(),
                },
            });
        }

        let assignedCount = 0;
        if (item.orderItemId) {
            if (isPreShip) {
                // Return to available
                const unitsToRestore = await tx.inventoryUnit.findMany({
                    where: { orderItemId: item.orderItemId, status: 'RESERVED' },
                });
                assignedCount = unitsToRestore.length;

                await tx.inventoryUnit.updateMany({
                    where: { orderItemId: item.orderItemId, status: 'RESERVED' },
                    data: { status: 'AVAILABLE', orderItemId: null, updatedAt: new Date() }
                });

                for (const u of unitsToRestore) {
                    await tx.stockMovement.create({
                        data: {
                            warehouseInventoryId: u.warehouseInventoryId!,
                            warehouseId: u.warehouseId,
                            inventoryUnitId: u.id,
                            serialNumberSnapshot: u.sn || null,
                            type: 'RETURN',
                            quantity: 1,
                            previousQuantity: 0,
                            newQuantity: 1,
                            orderId: orderId,
                            reason: `${reason} (Pre-ship unit unassigned)`,
                            performedBy,
                        }
                    });
                }
            } else {
                // Post-ship return -> RETURNED status for inspection
                const unitsToReturn = await tx.inventoryUnit.findMany({
                    where: { orderItemId: item.orderItemId, status: 'SOLD' },
                });
                assignedCount = unitsToReturn.length;

                await tx.inventoryUnit.updateMany({
                    where: { orderItemId: item.orderItemId, status: 'SOLD' },
                    data: { status: 'RETURNED', updatedAt: new Date() }
                });

                for (const u of unitsToReturn) {
                    await tx.stockMovement.create({
                        data: {
                            warehouseInventoryId: u.warehouseInventoryId!,
                            warehouseId: u.warehouseId,
                            inventoryUnitId: u.id,
                            serialNumberSnapshot: u.sn || null,
                            type: 'RETURN',
                            quantity: 1,
                            previousQuantity: 0,
                            newQuantity: 1,
                            orderId: orderId,
                            reason: `${reason} (Unit returned)`,
                            performedBy,
                        }
                    });
                }
            }
        }

        const unassignedQty = item.quantity - assignedCount;

        if (unassignedQty > 0) {
            await tx.stockMovement.create({
                data: {
                    warehouseInventoryId: inv.id,
                    warehouseId: inv.warehouseId,
                    type: 'RETURN',
                    quantity: unassignedQty,
                    previousQuantity: inv.quantity,
                    newQuantity,
                    orderId,
                    reason,
                    performedBy,
                },
            });
        }

        // If returned item makes stock > 0, make sure status is ACTIVE
        const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            select: { status: true }
        });

        if (variant?.status === 'OUT_OF_STOCK' && newQuantity > 0) {
            await tx.productVariant.update({
                where: { id: item.variantId },
                data: { status: 'ACTIVE' }
            });
        }
    }
}
