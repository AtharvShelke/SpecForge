/**
 * inventory.service.ts — Business logic for InventoryItems with serialized tracking.
 */

import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/errors";
import { PrismaClient, InventoryUnitStatus } from "@/generated/prisma";

type PrismaTx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

const getClient = (tx?: PrismaTx) => tx || prisma;

export async function getInventoryItems(filters?: {
  productId?: string;
  status?: InventoryUnitStatus;
  serialNumber?: string;
  partNumber?: string;
  location?: string;
}) {
  const where: any = {};
  if (filters?.productId) where.productId = filters.productId;
  if (filters?.status) where.status = filters.status;
  if (filters?.serialNumber) where.serialNumber = { contains: filters.serialNumber, mode: "insensitive" };
  if (filters?.partNumber) where.partNumber = { contains: filters.partNumber, mode: "insensitive" };
  if (filters?.location) where.location = { contains: filters.location, mode: "insensitive" };

  return prisma.inventoryItem.findMany({
    where,
    orderBy: { lastUpdated: "desc" },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          price: true,
          compareAtPrice: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          media: {
            orderBy: { sortOrder: "asc" },
            take: 1,
            select: {
              id: true,
              url: true,
              altText: true,
              sortOrder: true,
            },
          },
          subcategory: {
            select: {
              id: true,
              name: true,
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      orderItemUnits: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          orderId: true,
          orderItem: {
            select: {
              orderId: true,
              order: {
                select: {
                  customerName: true,
                  status: true,
                }
              }
            }
          }
        }
      }
    },
  });
}

export async function getInventoryItem(id: string) {
  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      product: true,
    },
  });
  if (!item) throw new ServiceError("Inventory item not found", 404);
  return item;
}

export async function getAvailableCount(productId: string, tx?: PrismaTx): Promise<number> {
  const client = getClient(tx);
  return client.inventoryItem.count({
    where: {
      productId,
      status: "AVAILABLE",
    },
  });
}

export async function createInventoryUnit(
  data: {
    productId: string;
    serialNumber: string;
    partNumber?: string;
    costPrice?: number;
    location?: string;
  },
  tx?: PrismaTx
) {
  const client = getClient(tx);

  const existing = await client.inventoryItem.findUnique({
    where: { serialNumber: data.serialNumber },
  });
  if (existing) throw new ServiceError(`Serial number already exists: ${data.serialNumber}`, 409);

  const created = await client.inventoryItem.create({
    data: {
      productId: data.productId,
      serialNumber: data.serialNumber,
      partNumber: data.partNumber || null,
      status: "AVAILABLE",
      costPrice: data.costPrice ?? 0,
      location: data.location ?? "",
      lastUpdated: new Date(),
    },
  });

  await client.stockMovement.create({
    data: {
      productId: data.productId,
      inventoryItemId: created.id,
      type: "INWARD",
      quantity: 1,
      note: `Unit created manually (Serial: ${data.serialNumber})`,
    },
  });

  return created;
}

export async function bulkCreateInventoryUnits(
  productId: string,
  units: Array<{
    partNumber: string;
    serialNumber: string;
    costPrice?: number;
    location?: string;
  }>,
  note: string,
  tx?: PrismaTx
) {
  const client = getClient(tx);
  if (units.length === 0) return;

  // Validate internal uniqueness of serial numbers in the request
  const serials = units.map(u => u.serialNumber.trim());
  const uniqueSerials = new Set(serials);
  if (uniqueSerials.size !== serials.length) {
    throw new ServiceError("Duplicate serial numbers found in the request", 400);
  }

  // Check if any serial numbers already exist in the database
  const existing = await client.inventoryItem.findMany({
    where: {
      serialNumber: { in: serials },
    },
    select: { serialNumber: true },
  });

  if (existing.length > 0) {
    throw new ServiceError(
      `Serial number(s) already exist: ${existing.map(e => e.serialNumber).join(", ")}`,
      409
    );
  }

  // Create units
  for (const unit of units) {
    const created = await client.inventoryItem.create({
      data: {
        productId,
        partNumber: unit.partNumber || null,
        serialNumber: unit.serialNumber,
        status: "AVAILABLE",
        costPrice: unit.costPrice ?? 0,
        location: unit.location ?? "",
        lastUpdated: new Date(),
      },
    });

    await client.stockMovement.create({
      data: {
        productId,
        inventoryItemId: created.id,
        type: "INWARD",
        quantity: 1,
        note: `${note} (Serial: ${unit.serialNumber})`,
      },
    });
  }
}

export async function updateInventoryItem(
  id: string,
  data: {
    serialNumber?: string;
    partNumber?: string;
    costPrice?: number;
    location?: string;
    status?: InventoryUnitStatus;
  },
  tx?: PrismaTx
) {
  const client = getClient(tx);

  if (data.serialNumber) {
    const existing = await client.inventoryItem.findUnique({
      where: { serialNumber: data.serialNumber },
    });
    if (existing && existing.id !== id) {
      throw new ServiceError("Serial number already in use", 409);
    }
  }

  const patch: any = {};
  if (data.serialNumber !== undefined) patch.serialNumber = data.serialNumber;
  if (data.partNumber !== undefined) patch.partNumber = data.partNumber;
  if (data.costPrice !== undefined) patch.costPrice = data.costPrice;
  if (data.location !== undefined) patch.location = data.location;
  if (data.status !== undefined) patch.status = data.status;
  patch.lastUpdated = new Date();

  try {
    return await client.inventoryItem.update({
      where: { id },
      data: patch,
    });
  } catch (err: any) {
    if (err.code === "P2025") {
      throw new ServiceError("Inventory Item not found", 404);
    }
    throw err;
  }
}

export async function reserveUnitsForOrder(
  tx: PrismaTx,
  productId: string,
  quantity: number,
  orderId: string,
  orderItemId: string
) {
  // Find available units
  const availableUnits = await tx.inventoryItem.findMany({
    where: {
      productId,
      status: "AVAILABLE",
    },
    take: quantity,
  });

  if (availableUnits.length < quantity) {
    throw new ServiceError(
      `Insufficient stock available for product. Requested: ${quantity}, Available: ${availableUnits.length}`,
      409
    );
  }

  const reservedUnits = [];
  for (const unit of availableUnits) {
    // Transition status to RESERVED
    const updated = await tx.inventoryItem.update({
      where: { id: unit.id },
      data: {
        status: "RESERVED",
        lastUpdated: new Date(),
      },
    });

    // Create OrderItemUnit record
    await tx.orderItemUnit.create({
      data: {
        orderItemId,
        inventoryItemId: unit.id,
        serialNumber: unit.serialNumber,
        partNumber: unit.partNumber,
        orderId,
      },
    });

    // Log stock movement
    await tx.stockMovement.create({
      data: {
        productId,
        inventoryItemId: unit.id,
        orderId,
        type: "RESERVE",
        quantity: 1,
        note: `Reserved unit for order ${orderId} (Serial: ${unit.serialNumber})`,
      },
    });

    reservedUnits.push(updated);
  }

  return reservedUnits;
}

export async function shipOrderUnits(tx: PrismaTx, orderId: string) {
  const linkedUnits = await tx.orderItemUnit.findMany({
    where: { orderId },
    include: { inventoryItem: true },
  });

  for (const link of linkedUnits) {
    if (link.inventoryItem.status === "RESERVED") {
      await tx.inventoryItem.update({
        where: { id: link.inventoryItemId },
        data: {
          status: "SHIPPED",
          lastUpdated: new Date(),
        },
      });

      await tx.stockMovement.create({
        data: {
          productId: link.inventoryItem.productId,
          inventoryItemId: link.inventoryItemId,
          orderId,
          type: "SALE",
          quantity: 1,
          note: `Shipped unit for order ${orderId} (Serial: ${link.serialNumber})`,
        },
      });
    }
  }
}

export async function cancelOrderReservation(tx: PrismaTx, orderId: string) {
  const linkedUnits = await tx.orderItemUnit.findMany({
    where: { orderId },
    include: { inventoryItem: true },
  });

  for (const link of linkedUnits) {
    // Only return reserved units to available
    if (link.inventoryItem.status === "RESERVED") {
      await tx.inventoryItem.update({
        where: { id: link.inventoryItemId },
        data: {
          status: "AVAILABLE",
          lastUpdated: new Date(),
        },
      });

      await tx.stockMovement.create({
        data: {
          productId: link.inventoryItem.productId,
          inventoryItemId: link.inventoryItemId,
          orderId,
          type: "ADJUSTMENT",
          quantity: 1,
          note: `Cancelled reservation for order ${orderId} (Serial: ${link.serialNumber})`,
        },
      });
    }
  }

  // Delete the OrderItemUnit records since reservation is cancelled
  await tx.orderItemUnit.deleteMany({
    where: { orderId },
  });
}

export async function returnOrderUnits(tx: PrismaTx, orderId: string, unitIds?: string[]) {
  const whereClause: any = { orderId };
  if (unitIds && unitIds.length > 0) {
    whereClause.inventoryItemId = { in: unitIds };
  }

  const linkedUnits = await tx.orderItemUnit.findMany({
    where: whereClause,
    include: { inventoryItem: true },
  });

  for (const link of linkedUnits) {
    if (link.inventoryItem.status === "SHIPPED") {
      await tx.inventoryItem.update({
        where: { id: link.inventoryItemId },
        data: {
          status: "RETURNED",
          lastUpdated: new Date(),
        },
      });

      await tx.stockMovement.create({
        data: {
          productId: link.inventoryItem.productId,
          inventoryItemId: link.inventoryItemId,
          orderId,
          type: "RETURN",
          quantity: 1,
          note: `Returned unit for order ${orderId} (Serial: ${link.serialNumber})`,
        },
      });
    }
  }
}

export async function markDamaged(unitId: string, tx?: PrismaTx) {
  const client = getClient(tx);

  const item = await client.inventoryItem.findUnique({ where: { id: unitId } });
  if (!item) throw new ServiceError("Inventory item not found", 404);

  const updated = await client.inventoryItem.update({
    where: { id: unitId },
    data: {
      status: "DAMAGED",
      lastUpdated: new Date(),
    },
  });

  await client.stockMovement.create({
    data: {
      productId: item.productId,
      inventoryItemId: unitId,
      type: "ADJUSTMENT",
      quantity: 1,
      note: `Unit marked as DAMAGED (Serial: ${item.serialNumber})`,
    },
  });

  return updated;
}

export async function restockUnit(unitId: string, tx?: PrismaTx) {
  const client = getClient(tx);

  const item = await client.inventoryItem.findUnique({ where: { id: unitId } });
  if (!item) throw new ServiceError("Inventory item not found", 404);

  const updated = await client.inventoryItem.update({
    where: { id: unitId },
    data: {
      status: "AVAILABLE",
      lastUpdated: new Date(),
    },
  });

  await client.stockMovement.create({
    data: {
      productId: item.productId,
      inventoryItemId: unitId,
      type: "INWARD",
      quantity: 1,
      note: `Unit restocked to AVAILABLE (Serial: ${item.serialNumber})`,
    },
  });

  return updated;
}

export async function getProductStockStatus(productId: string, tx?: PrismaTx) {
  const client = getClient(tx);

  const groups = await client.inventoryItem.groupBy({
    by: ["status"],
    where: { productId },
    _count: { id: true },
  });

  const statusCounts = {
    available: 0,
    reserved: 0,
    allocated: 0,
    shipped: 0,
    returned: 0,
    damaged: 0,
    total: 0,
  };

  for (const group of groups) {
    const count = group._count.id;
    statusCounts.total += count;

    switch (group.status) {
      case "AVAILABLE":
        statusCounts.available = count;
        break;
      case "RESERVED":
        statusCounts.reserved = count;
        break;
      case "ALLOCATED":
        statusCounts.allocated = count;
        break;
      case "SHIPPED":
        statusCounts.shipped = count;
        break;
      case "RETURNED":
        statusCounts.returned = count;
        break;
      case "DAMAGED":
        statusCounts.damaged = count;
        break;
    }
  }

  return statusCounts;
}