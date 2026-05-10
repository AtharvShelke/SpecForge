import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateUnitSchema = z.object({
  serialNumber: z.string().optional(),
  partNumber: z.string().optional(),
});

// ── PATCH /api/orders/[id]/items/[itemId]/units/[unitId] ──────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string; unitId: string }> }
) {
  try {
    const { id, itemId, unitId } = await params;
    const body = await req.json();
    const data = updateUnitSchema.parse(body);

    // Verify the unit belongs to the specified order and item
    const unit = await prisma.orderItemUnit.findFirst({
      where: {
        id: unitId,
        orderItem: {
          id: itemId,
          orderId: id,
        },
      },
      include: {
        orderItem: true,
        inventoryItem: true,
      },
    });

    if (!unit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    // Update the source InventoryItem (single source of truth)
    // This will automatically reflect in all references including this OrderItemUnit
    const updatedInventoryItem = await prisma.inventoryItem.update({
      where: { id: unit.inventoryItemId },
      data: {
        serialNumber: data.serialNumber,
        partNumber: data.partNumber,
        lastUpdated: new Date(),
      },
    });

    // Also update the OrderItemUnit to keep it in sync for display purposes
    const updatedUnit = await prisma.orderItemUnit.update({
      where: { id: unitId },
      data: {
        serialNumber: data.serialNumber,
        partNumber: data.partNumber,
      },
    });

    // Log to audit
    await prisma.auditLog.create({
      data: {
        entityType: 'InventoryItem',
        entityId: unit.inventoryItemId,
        action: 'updated',
        actor: 'Admin',
        before: { serialNumber: unit.inventoryItem?.serialNumber, partNumber: unit.inventoryItem?.partNumber },
        after: { serialNumber: data.serialNumber, partNumber: data.partNumber },
      },
    });

    return NextResponse.json({ inventoryItem: updatedInventoryItem, unit: updatedUnit });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("PATCH /api/orders/[id]/items/[itemId]/units/[unitId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
