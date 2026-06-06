import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/errors";

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
    const { status, serialNumber, partNumber, location, costPrice } = body;

    const data: any = {};
    if (status !== undefined) data.status = status;
    if (serialNumber !== undefined) data.serialNumber = serialNumber.trim();
    if (partNumber !== undefined) data.partNumber = partNumber.trim() || null;
    if (location !== undefined) data.location = location.trim() || "";
    if (costPrice !== undefined) data.costPrice = Number(costPrice);
    data.lastUpdated = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      // If serial number is changing, verify uniqueness
      if (serialNumber !== undefined && serialNumber.trim()) {
        const existing = await tx.inventoryItem.findFirst({
          where: {
            serialNumber: serialNumber.trim(),
            id: { not: id },
          },
        });
        if (existing) {
          throw new ServiceError(`Serial number already exists: ${serialNumber}`, 409);
        }
      }

      const currentItem = await tx.inventoryItem.findUnique({
        where: { id },
      });
      if (!currentItem) {
        throw new ServiceError("Inventory item not found", 404);
      }

      const item = await tx.inventoryItem.update({
        where: { id },
        data,
      });

      // Log status transitions if status changed
      if (status !== undefined && status !== currentItem.status) {
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            inventoryItemId: item.id,
            type: status === "DAMAGED" || status === "SHIPPED" || status === "ALLOCATED" ? "OUTWARD" : "ADJUSTMENT",
            quantity: 1,
            note: `Status updated from ${currentItem.status} to ${status}`,
          },
        });
      }

      return item;
    });

    return NextResponse.json(updated);
  } catch (error: any) {
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
