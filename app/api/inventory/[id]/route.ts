import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/errors";
import { z } from "zod";

const patchInventorySchema = z.object({
  status: z.enum(["AVAILABLE", "RESERVED", "ALLOCATED", "SHIPPED", "RETURNED", "DAMAGED"]).optional(),
  serialNumber: z.string().min(1).optional(),
  partNumber: z.string().nullable().optional(),
  location: z.string().optional(),
  costPrice: z.number().nonnegative().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: { product: true },
    });
    if (!item) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = patchInventorySchema.parse(body);

    const data: any = {};
    if (parsed.status !== undefined) data.status = parsed.status;
    if (parsed.serialNumber !== undefined) data.serialNumber = parsed.serialNumber.trim();
    if (parsed.partNumber !== undefined) data.partNumber = parsed.partNumber?.trim() || null;
    if (parsed.location !== undefined) data.location = parsed.location.trim();
    if (parsed.costPrice !== undefined) data.costPrice = parsed.costPrice;
    data.lastUpdated = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      const currentItem = await tx.inventoryItem.findUnique({
        where: { id },
      });
      if (!currentItem) {
        throw new ServiceError("Inventory item not found", 404);
      }

      // Guard: Cannot directly change the status of an already SHIPPED inventory unit
      if (currentItem.status === "SHIPPED" && parsed.status !== undefined && parsed.status !== "SHIPPED") {
        throw new ServiceError("Cannot directly change the status of an already SHIPPED inventory unit.", 400);
      }

      // If serial number is changing, verify uniqueness
      if (parsed.serialNumber !== undefined && parsed.serialNumber.trim()) {
        const existing = await tx.inventoryItem.findFirst({
          where: {
            serialNumber: parsed.serialNumber.trim(),
            id: { not: id },
          },
        });
        if (existing) {
          throw new ServiceError(`Serial number already exists: ${parsed.serialNumber}`, 409);
        }
      }

      const item = await tx.inventoryItem.update({
        where: { id },
        data,
      });

      // Log status transitions if status changed
      if (parsed.status !== undefined && parsed.status !== currentItem.status) {
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            inventoryItemId: item.id,
            type: parsed.status === "DAMAGED" || parsed.status === "SHIPPED" || parsed.status === "ALLOCATED" ? "OUTWARD" : "ADJUSTMENT",
            quantity: 1,
            note: `Status updated from ${currentItem.status} to ${parsed.status}`,
          },
        });
      }

      return item;
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    if (error instanceof ServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: { id },
      });
      if (!item) {
        throw new ServiceError("Inventory item not found", 404);
      }

      // Guard: Block deletion of inventory units linked to OrderItemUnit records
      const linkedOrderUnit = await tx.orderItemUnit.findFirst({
        where: { inventoryItemId: id },
      });
      if (linkedOrderUnit) {
        throw new ServiceError("Cannot delete inventory unit that is linked to an order transaction history record.", 400);
      }

      await tx.inventoryItem.delete({
        where: { id },
      });

      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: "OUTWARD",
          quantity: 1,
          note: `Unit deleted (Serial: ${item.serialNumber || "N/A"})`,
        },
      });

      return item;
    });

    return NextResponse.json(deleted);
  } catch (error: any) {
    if (error instanceof ServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
