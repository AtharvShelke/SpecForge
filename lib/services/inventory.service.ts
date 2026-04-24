/**
 * inventory.service.ts — Business logic for InventoryItems and Reservations.
 */

import { prisma } from "@/lib/prisma";
import { ServiceError } from "./catalog.service";
import {
  InventoryItem,
  InventoryTrackingType,
  InventoryStatus,
  Reservation,
  ReservationStatus,
  StockMovementType,
} from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// INVENTORY ITEMS
// ─────────────────────────────────────────────────────────────────────────────

export async function getInventoryItems(filters?: {
  variantId?: string;
  status?: string;
}): Promise<InventoryItem[]> {
  const where: any = {};
  if (filters?.variantId) where.variantId = filters.variantId;
  if (filters?.status) where.status = filters.status;

  const items = await prisma.inventoryItem.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      variant: { include: { product: true } },
    },
  });
  return items as unknown as InventoryItem[];
}

export async function getInventoryItem(id: string): Promise<InventoryItem> {
  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      variant: { include: { product: true } },
    },
  });
  if (!item) throw new ServiceError("Inventory item not found", 404);
  return item as unknown as InventoryItem;
}

export function getAvailableQuantity(item: InventoryItem): number {
  return (item.quantityOnHand || 0) - (item.quantityReserved || 0);
}

export async function createInventoryItem(data: {
  variantId: string;
  trackingType?: string;
  serialNumber?: string;
  partNumber?: string;
  units?: Array<{
    serialNumber: string;
    partNumber: string;
  }>;
  quantityOnHand?: number;
  status?: string;
  costPrice?: number;
  batchNumber?: string;
  notes?: string;
}) {
  if (!data.variantId) throw new ServiceError("variantId is required");

  if (Array.isArray(data.units) && data.units.length > 0) {
    const normalizedUnits = data.units.map((unit) => ({
      serialNumber: unit.serialNumber?.trim(),
      partNumber: unit.partNumber?.trim(),
    }));

    const hasMissingValues = normalizedUnits.some(
      (unit) => !unit.serialNumber || !unit.partNumber,
    );
    if (hasMissingValues) {
      throw new ServiceError("Each unit must include serialNumber and partNumber", 400);
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
            variantId: data.variantId,
            trackingType: "SERIALIZED",
            serialNumber: unit.serialNumber,
            partNumber: unit.partNumber,
            quantityOnHand: 1,
            quantityReserved: 0,
            status: (data.status as any) || "IN_STOCK",
            costPrice: data.costPrice,
            batchNumber: data.batchNumber,
            notes: data.notes,
            receivedAt: new Date(),
          },
        }),
      ),
    );
  }

  if (data.serialNumber) {
    const existing = await prisma.inventoryItem.findUnique({
      where: { serialNumber: data.serialNumber },
    });
    if (existing)
      throw new ServiceError("Serial number already exists", 409);
  }

  return prisma.inventoryItem.create({
    data: {
      variantId: data.variantId,
      trackingType: (data.trackingType as any) || (data.serialNumber ? "SERIALIZED" : "BULK"),
      serialNumber: data.serialNumber,
      partNumber: data.partNumber,
      quantityOnHand:
        data.quantityOnHand ?? ((data.serialNumber || data.partNumber) ? 1 : 0),
      status: (data.status as any) || "IN_STOCK",
      costPrice: data.costPrice,
      batchNumber: data.batchNumber,
      notes: data.notes,
      receivedAt: new Date(),
    },
  });
}

export async function adjustStockByVariant(
  variantId: string,
  quantity: number,
  type: string
) {
  const serializedCount = await prisma.inventoryItem.count({
    where: { variantId, trackingType: "SERIALIZED" },
  });

  if (serializedCount > 0) {
    throw new ServiceError(
      "Serialized inventory must be managed as individual units with serial and part numbers.",
      400,
    );
  }

  let item = await prisma.inventoryItem.findFirst({
    where: { variantId, trackingType: "BULK" },
  });

  if (!item) {
    item = await prisma.inventoryItem.create({
      data: {
        variantId,
        trackingType: "BULK",
        quantityOnHand: 0,
        status: "IN_STOCK",
      },
    });
  }

  let increment = 0;
  if (type === "INWARD" || type === "RETURN") {
    increment = quantity;
  } else if (type === "OUTWARD" || type === "SALE") {
    increment = -quantity;
  } else if (type === "ADJUSTMENT") {
    increment = quantity; // could be negative or positive
  }

  return prisma.inventoryItem.update({
    where: { id: item.id },
    data: { quantityOnHand: { increment } },
  });
}

export async function updateInventoryItem(
  id: string,
  data: {
    trackingType?: string;
    serialNumber?: string;
    partNumber?: string;
    quantityOnHand?: number;
    quantityReserved?: number;
    status?: string;
    costPrice?: number;
    batchNumber?: string;
    notes?: string;
  }
) {
  if (data.serialNumber) {
    const existing = await prisma.inventoryItem.findUnique({
      where: { serialNumber: data.serialNumber },
    });
    if (existing && existing.id !== id)
      throw new ServiceError("Serial number already in use", 409);
  }

  const patch: any = {};
  if (data.trackingType !== undefined) patch.trackingType = data.trackingType;
  if (data.serialNumber !== undefined) patch.serialNumber = data.serialNumber;
  if (data.partNumber !== undefined) patch.partNumber = data.partNumber;
  if (data.quantityOnHand !== undefined) patch.quantityOnHand = data.quantityOnHand;
  if (data.quantityReserved !== undefined) patch.quantityReserved = data.quantityReserved;
  if (data.status !== undefined) patch.status = data.status;
  if (data.costPrice !== undefined) patch.costPrice = data.costPrice;
  if (data.batchNumber !== undefined) patch.batchNumber = data.batchNumber;
  if (data.notes !== undefined) patch.notes = data.notes;

  try {
    return await prisma.inventoryItem.update({ where: { id }, data: patch });
  } catch (err: any) {
    if (err.code === "P2025")
      throw new ServiceError("Inventory Item not found", 404);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RESERVATIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function getReservations(orderId?: string): Promise<Reservation[]> {
  const where: any = {};
  if (orderId) where.orderId = orderId;

  const items = await prisma.reservation.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { inventoryItem: true },
  });
  return items as unknown as Reservation[];
}

export async function createReservation(data: {
  orderId: string;
  inventoryItemId?: string;
  variantId?: string;
  quantity?: number;
  expiresAt?: string;
}) {
  if (!data.orderId || (!data.inventoryItemId && !data.variantId))
    throw new ServiceError("orderId and either inventoryItemId or variantId are required");

  let inventoryItemId = data.inventoryItemId;

  if (!inventoryItemId && data.variantId) {
    let item = await prisma.inventoryItem.findFirst({
      where: { variantId: data.variantId, trackingType: "BULK" },
    });
    if (!item) {
      item = await prisma.inventoryItem.create({
        data: {
          variantId: data.variantId,
          trackingType: "BULK",
          quantityOnHand: 0,
          status: "IN_STOCK",
        },
      });
    }
    inventoryItemId = item.id;
  }

  const quantity = data.quantity ?? 1;

  const [reservation] = await prisma.$transaction([
    prisma.reservation.create({
      data: {
        orderId: data.orderId,
        inventoryItemId: inventoryItemId!,
        quantity,
        status: "ACTIVE",
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    }),
    prisma.inventoryItem.update({
      where: { id: inventoryItemId! },
      data: { quantityReserved: { increment: quantity } },
    }),
  ]);

  return reservation;
}

export async function updateReservation(
  id: string,
  data: { status?: string; expiresAt?: string }
) {
  const currentReservation = await prisma.reservation.findUnique({
    where: { id },
  });
  if (!currentReservation)
    throw new ServiceError("Reservation not found", 404);

  const patch: any = {};
  if (data.status !== undefined) patch.status = data.status;
  if (data.expiresAt !== undefined) patch.expiresAt = new Date(data.expiresAt);

  // Handle state transitions with inventory adjustments
  if (data.status && data.status !== currentReservation.status) {
    // ACTIVE → RELEASED | EXPIRED: give back reserved qty
    if (
      currentReservation.status === "ACTIVE" &&
      (data.status === "RELEASED" || data.status === "EXPIRED")
    ) {
      await prisma.$transaction([
        prisma.reservation.update({ where: { id }, data: patch }),
        prisma.inventoryItem.update({
          where: { id: currentReservation.inventoryItemId },
          data: { quantityReserved: { decrement: currentReservation.quantity } },
        }),
      ]);
      return prisma.reservation.findUnique({ where: { id } });
    }

    // ACTIVE → CONVERTED: deduct both reserved and on-hand
    if (
      currentReservation.status === "ACTIVE" &&
      data.status === "CONVERTED"
    ) {
      await prisma.$transaction([
        prisma.reservation.update({ where: { id }, data: patch }),
        prisma.inventoryItem.update({
          where: { id: currentReservation.inventoryItemId },
          data: {
            quantityReserved: { decrement: currentReservation.quantity },
            quantityOnHand: { decrement: currentReservation.quantity },
          },
        }),
      ]);
      return prisma.reservation.findUnique({ where: { id } });
    }
  }

  // Default update — no inventory side‐effects
  return prisma.reservation.update({ where: { id }, data: patch });
}
