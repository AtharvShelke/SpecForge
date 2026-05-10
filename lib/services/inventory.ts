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
    productId: string;
    quantity: number;
}

export class InsufficientStockError extends Error {
    public productId: string;
    constructor(productId: string) {
        super(`Insufficient stock for product ${productId}`);
        this.name = 'InsufficientStockError';
        this.productId = productId;
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
        const inv = await tx.inventoryItem.findFirst({
            where: { productId: item.productId, quantity: { gte: item.quantity } },
            orderBy: { quantity: 'desc' },
        });

        if (!inv) throw new InsufficientStockError(item.productId);

        // Optimistic concurrency: re-check quantity in WHERE clause
        const updated = await tx.inventoryItem.updateMany({
            where: { id: inv.id, quantity: { gte: item.quantity } },
            data: {
                quantity: { decrement: item.quantity },
                reserved: { increment: item.quantity },
                lastUpdated: new Date(),
            },
        });

        if (updated.count === 0) throw new InsufficientStockError(item.productId);

        // Log stock movement with order reference
        await tx.stockMovement.create({
            data: {
                orderId,
                productId: inv.productId,
                type: 'RESERVE',
                quantity: item.quantity,
                note: `Order ${orderId} placed — stock reserved`,
            },
        });

        // Trigger OUT_OF_STOCK status if total available quantity hits 0 across all warehouses
        const allInv = await tx.inventoryItem.aggregate({
            where: { productId: item.productId },
            _sum: { quantity: true }
        });

        if ((allInv._sum.quantity || 0) <= 0) {
            await tx.product.update({
                where: { id: item.productId },
                data: { stockStatus: 'OUT_OF_STOCK' }
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
        const inv = await tx.inventoryItem.findFirst({
            where: { productId: item.productId },
        });
        if (!inv) continue;

        await tx.inventoryItem.update({
            where: { id: inv.id },
            data: {
                reserved: { decrement: item.quantity },
                lastUpdated: new Date(),
            },
        });

        await tx.stockMovement.create({
            data: {
                orderId,
                productId: inv.productId,
                type: 'SALE',
                quantity: item.quantity,
                note: `Order ${orderId} shipped — reserved stock confirmed`,
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
        const inv = await tx.inventoryItem.findFirst({
            where: { productId: item.productId },
        });
        if (!inv) continue;

        const newQuantity = inv.quantity + item.quantity;

        if (isPreShip) {
            // Pre-ship cancellation: move from reserved back to available
            await tx.inventoryItem.update({
                where: { id: inv.id },
                data: {
                    quantity: { increment: item.quantity },
                    reserved: { decrement: item.quantity },
                    lastUpdated: new Date(),
                },
            });
        } else {
            // Post-ship return: add back to available (no reserved to decrement)
            await tx.inventoryItem.update({
                where: { id: inv.id },
                data: {
                    quantity: { increment: item.quantity },
                    lastUpdated: new Date(),
                },
            });
        }

        await tx.stockMovement.create({
            data: {
                orderId,
                productId: inv.productId,
                type: 'RETURN',
                quantity: item.quantity,
                note: reason,
            },
        });

        // If returned item makes stock > 0, make sure status is IN_STOCK
        const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { stockStatus: true }
        });

        if (product?.stockStatus === 'OUT_OF_STOCK' && newQuantity > 0) {
            await tx.product.update({
                where: { id: item.productId },
                data: { stockStatus: 'IN_STOCK' }
            });
        }
    }
}
