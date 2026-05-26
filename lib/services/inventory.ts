/**
 * Unit-level inventory service.
 *
 * Each inventory row represents one physical unit. Availability is derived from:
 * - available: quantity = 1, reserved = 0
 * - reserved:  quantity = 0, reserved = 1
 * - sold:      quantity = 0, reserved = 0
 */

import { PrismaClient } from "@/generated/prisma/client";

type PrismaTx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export interface InventoryReserveItem {
    productId: string;
    quantity: number;
}

export interface AssignedInventoryUnit {
    inventoryItemId: string;
    serialNumber: string | null;
    partNumber: string | null;
}

export interface ReservedInventoryItem {
    productId: string;
    quantity: number;
    units: AssignedInventoryUnit[];
}

export interface OrderUnitReference {
    inventoryItemId: string;
    productId: string;
}

export class InsufficientStockError extends Error {
    public productId: string;
    constructor(productId: string) {
        super(`Insufficient stock for product ${productId}`);
        this.name = 'InsufficientStockError';
        this.productId = productId;
    }
}

async function refreshProductStockStatus(tx: PrismaTx, productId: string) {
    const aggregate = await tx.inventoryItem.aggregate({
        where: { productId, quantity: { gt: 0 } },
        _count: { id: true },
    });

    await tx.product.update({
        where: { id: productId },
        data: { stockStatus: (aggregate._count.id ?? 0) > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK' },
    });
}

export async function reserveInventory(
    tx: PrismaTx,
    items: InventoryReserveItem[],
    orderId: string,
): Promise<ReservedInventoryItem[]> {
    const reservations: ReservedInventoryItem[] = [];

    for (const item of items) {
        const units = await tx.inventoryItem.findMany({
            where: {
                productId: item.productId,
                quantity: { gt: 0 },
                reserved: 0,
            },
            orderBy: [
                { lastUpdated: 'asc' },
                { id: 'asc' },
            ],
            take: item.quantity,
        });

        if (units.length < item.quantity) {
            throw new InsufficientStockError(item.productId);
        }

        for (const unit of units) {
            const updated = await tx.inventoryItem.updateMany({
                where: {
                    id: unit.id,
                    productId: item.productId,
                    quantity: { gt: 0 },
                    reserved: 0,
                },
                data: {
                    quantity: 0,
                    reserved: 1,
                    lastUpdated: new Date(),
                },
            });

            if (updated.count === 0) {
                throw new InsufficientStockError(item.productId);
            }

            await tx.stockMovement.create({
                data: {
                    orderId,
                    productId: item.productId,
                    inventoryItemId: unit.id,
                    type: 'RESERVE',
                    quantity: 1,
                    note: `Order ${orderId} reserved unit${unit.serialNumber ? ` ${unit.serialNumber}` : ''}`,
                },
            });
        }

        await refreshProductStockStatus(tx, item.productId);

        reservations.push({
            productId: item.productId,
            quantity: units.length,
            units: units.map((unit) => ({
                inventoryItemId: unit.id,
                serialNumber: unit.serialNumber,
                partNumber: unit.partNumber,
            })),
        });
    }

    return reservations;
}

export async function confirmInventory(
    tx: PrismaTx,
    units: OrderUnitReference[],
    orderId: string,
): Promise<void> {
    for (const unit of units) {
        await tx.inventoryItem.updateMany({
            where: {
                id: unit.inventoryItemId,
                productId: unit.productId,
                reserved: { gt: 0 },
            },
            data: {
                reserved: 0,
                lastUpdated: new Date(),
            },
        });

        await tx.stockMovement.create({
            data: {
                orderId,
                productId: unit.productId,
                inventoryItemId: unit.inventoryItemId,
                type: 'SALE',
                quantity: 1,
                note: `Order ${orderId} shipped`,
            },
        });

        await refreshProductStockStatus(tx, unit.productId);
    }
}

export async function restoreInventory(
    tx: PrismaTx,
    units: OrderUnitReference[],
    orderId: string,
    isPreShip: boolean,
    reason: string,
): Promise<void> {
    for (const unit of units) {
        if (isPreShip) {
            await tx.inventoryItem.update({
                where: { id: unit.inventoryItemId },
                data: {
                    quantity: 1,
                    reserved: 0,
                    lastUpdated: new Date(),
                },
            });
        } else {
            await tx.inventoryItem.update({
                where: { id: unit.inventoryItemId },
                data: {
                    quantity: 1,
                    reserved: 0,
                    lastUpdated: new Date(),
                },
            });
        }

        await tx.stockMovement.create({
            data: {
                orderId,
                productId: unit.productId,
                inventoryItemId: unit.inventoryItemId,
                type: 'RETURN',
                quantity: 1,
                note: reason,
            },
        });

        await refreshProductStockStatus(tx, unit.productId);
    }
}

export async function createInventoryUnits(
    tx: PrismaTx,
    productId: string,
    units: Array<{
        partNumber: string;
        serialNumber: string;
        costPrice?: number;
        location?: string;
        reorderLevel?: number;
    }>,
    note: string,
) {
    if (units.length === 0) return;

    for (const unit of units) {
        const created = await tx.inventoryItem.create({
            data: {
                productId,
                partNumber: unit.partNumber,
                serialNumber: unit.serialNumber,
                quantity: 1,
                reserved: 0,
                costPrice: unit.costPrice ?? 0,
                location: unit.location ?? '',
                reorderLevel: unit.reorderLevel ?? 5,
                lastUpdated: new Date(),
            },
        });

        await tx.stockMovement.create({
            data: {
                productId,
                inventoryItemId: created.id,
                type: 'INWARD',
                quantity: 1,
                note: `${note} (${unit.serialNumber})`,
            },
        });
    }

    await refreshProductStockStatus(tx, productId);
}
