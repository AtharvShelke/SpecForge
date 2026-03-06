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

        await tx.stockMovement.create({
            data: {
                warehouseInventoryId: inv.id,
                warehouseId: inv.warehouseId,
                type: 'SALE',
                quantity: item.quantity,
                previousQuantity: inv.quantity,
                newQuantity: inv.quantity,
                orderId,
                reason: `Order ${orderId} shipped — reserved stock confirmed`,
                performedBy,
            },
        });
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

        await tx.stockMovement.create({
            data: {
                warehouseInventoryId: inv.id,
                warehouseId: inv.warehouseId,
                type: 'RETURN',
                quantity: item.quantity,
                previousQuantity: inv.quantity,
                newQuantity,
                orderId,
                reason,
                performedBy,
            },
        });

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
