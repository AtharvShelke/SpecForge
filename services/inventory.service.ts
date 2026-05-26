/**
 * inventory.service.ts — Business logic for InventoryItems.
 */

import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/errors";
import {
  InventoryItem,
  StockMovementType,
} from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// INVENTORY ITEMS
// ─────────────────────────────────────────────────────────────────────────────

export async function getInventoryItems(filters?: {
  productId?: string;
}): Promise<InventoryItem[]> {
  const where: any = {};
  if (filters?.productId) where.productId = filters.productId;

  const items = await prisma.inventoryItem.findMany({
    where,
    orderBy: { lastUpdated: "desc" },
    select: {
      id: true,
      productId: true,
      serialNumber: true,
      partNumber: true,
      quantity: true,
      reserved: true,
      reorderLevel: true,
      costPrice: true,
      location: true,
      lastUpdated: true,
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
    },
  });
  return items as unknown as InventoryItem[];
}

export async function getInventoryItem(id: string): Promise<InventoryItem> {
  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      product: true,
    },
  });
  if (!item) throw new ServiceError("Inventory item not found", 404);
  return item as unknown as InventoryItem;
}

export function getAvailableQuantity(item: InventoryItem): number {
  return (item.quantity || 0) - (item.reserved || 0);
}

export async function createInventoryItem(data: {
  productId: string;
  serialNumber?: string;
  partNumber?: string;
  units?: Array<{
    serialNumber: string;
    partNumber: string;
  }>;
  quantity?: number;
  costPrice?: number;
  location?: string;
}) {
  if (!data.productId) throw new ServiceError("productId is required");

  if (Array.isArray(data.units) && data.units.length > 0) {
    const normalizedUnits = data.units.map((unit) => ({
      serialNumber: unit.serialNumber?.trim(),
      partNumber: unit.partNumber?.trim(),
    }));

    const hasMissingValues = normalizedUnits.some(
      (unit) => !unit.serialNumber || !unit.partNumber,
    );
    if (hasMissingValues) {
      throw new ServiceError(
        "Each unit must include serialNumber and partNumber",
        400,
      );
    }

    const duplicateSerials = normalizedUnits.filter(
      (unit, index) =>
        normalizedUnits.findIndex(
          (candidate) => candidate.serialNumber === unit.serialNumber,
        ) !== index,
    );
    if (duplicateSerials.length > 0) {
      throw new ServiceError(
        `Duplicate serial number(s) in request: ${duplicateSerials
          .map((unit) => unit.serialNumber)
          .join(", ")}`,
        409,
      );
    }

    const existing = await prisma.inventoryItem.findMany({
      where: {
        serialNumber: {
          in: normalizedUnits.map((unit) => unit.serialNumber!),
        },
      },
      select: { serialNumber: true },
    });

    if (existing.length > 0) {
      throw new ServiceError(
        `Serial number(s) already exist: ${existing
          .map((item) => item.serialNumber)
          .filter(Boolean)
          .join(", ")}`,
        409,
      );
    }

    return prisma.$transaction(
      normalizedUnits.map((unit) =>
        prisma.inventoryItem.create({
          data: {
            productId: data.productId,
            serialNumber: unit.serialNumber,
            partNumber: unit.partNumber,
            quantity: 1,
            reserved: 0,
            costPrice: data.costPrice ?? 0,
            location: data.location ?? "",
            lastUpdated: new Date(),
          },
        }),
      ),
    );
  }

  if (data.serialNumber) {
    const existing = await prisma.inventoryItem.findFirst({
      where: { serialNumber: data.serialNumber },
    });
    if (existing) throw new ServiceError("Serial number already exists", 409);
  }

  return prisma.inventoryItem.create({
    data: {
      productId: data.productId,
      serialNumber: data.serialNumber,
      partNumber: data.partNumber,
      quantity: data.quantity ?? (data.serialNumber || data.partNumber ? 1 : 0),
      reserved: 0,
      costPrice: data.costPrice ?? 0,
      location: data.location ?? "",
      lastUpdated: new Date(),
    },
  });
}

export async function adjustStockByProduct(
  productId: string,
  quantity: number,
  type: string,
) {
  // Find bulk items first
  let item = await prisma.inventoryItem.findFirst({
    where: { productId, serialNumber: null },
  });

  if (!item) {
    item = await prisma.inventoryItem.create({
      data: {
        productId,
        quantity: 0,
        reserved: 0,
        location: "",
        lastUpdated: new Date(),
      },
    });
  }

  let increment = 0;
  if (type === "INWARD" || type === "RETURN") {
    increment = quantity;
  } else if (type === "OUTWARD" || type === "SALE") {
    increment = -quantity;
  } else if (type === "ADJUSTMENT") {
    increment = quantity;
  }

  return prisma.inventoryItem.update({
    where: { id: item.id },
    data: { quantity: { increment }, lastUpdated: new Date() },
  });
}

export async function updateInventoryItem(
  id: string,
  data: {
    serialNumber?: string;
    partNumber?: string;
    quantity?: number;
    reserved?: number;
    costPrice?: number;
    location?: string;
  },
) {
  if (data.serialNumber) {
    const existing = await prisma.inventoryItem.findFirst({
      where: { serialNumber: data.serialNumber },
    });
    if (existing && existing.id !== id)
      throw new ServiceError("Serial number already in use", 409);
  }

  const patch: any = {};
  if (data.serialNumber !== undefined) patch.serialNumber = data.serialNumber;
  if (data.partNumber !== undefined) patch.partNumber = data.partNumber;
  if (data.quantity !== undefined) patch.quantity = data.quantity;
  if (data.reserved !== undefined) patch.reserved = data.reserved;
  if (data.costPrice !== undefined) patch.costPrice = data.costPrice;
  if (data.location !== undefined) patch.location = data.location;
  patch.lastUpdated = new Date();

  try {
    return await prisma.inventoryItem.update({ where: { id }, data: patch });
  } catch (err: any) {
    if (err.code === "P2025")
      throw new ServiceError("Inventory Item not found", 404);
    throw err;
  }
}

export async function adjustStockBySku(
  skuOrProductId: string,
  quantity: number,
  type: string,
) {
  // Try to find the product by SKU first, fall back to treating input as productId
  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { id: skuOrProductId },
        { sku: skuOrProductId },
      ],
    },
    select: { id: true },
  });
  
  const productId = product?.id;
  if (!productId) throw new ServiceError(`Product not found: ${skuOrProductId}`, 404);
  
  return adjustStockByProduct(productId, quantity, type);
}

// ─────────────────────────────────────────────────────────────────────────────
// RESERVATIONS (MOCK)
// ─────────────────────────────────────────────────────────────────────────────

export async function getReservations(orderId?: string): Promise<any[]> {
  return [];
}

export async function createReservation(data: any) {
  return {
    id: `res-${Date.now()}`,
    orderId: data.orderId || "",
    inventoryItemId: data.inventoryItemId || "",
    quantity: data.quantity || 1,
    status: "ACTIVE",
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function updateReservation(id: string, data: any) {
  return {
    id,
    status: data.status || "RELEASED",
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    updatedAt: new Date(),
  };
}