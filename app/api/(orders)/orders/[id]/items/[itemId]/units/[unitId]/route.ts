import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError } from "@/lib/security/errors";
import {
  enforceRateLimit,
  withRateLimitHeaders,
} from "@/lib/security/rate-limit";
import {
  assertTrustedOrigin,
  buildAuditContext,
} from "@/lib/security/request";
import { parseJsonBody } from "@/lib/security/validation";

const updateUnitSchema = z.object({
  serialNumber: z.string().optional(),
  partNumber: z.string().optional(),
  inventoryItemId: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string; unitId: string }> }
) {
  try {
    const user = await requireAdmin(req);
    assertTrustedOrigin(req);
    const rateLimit = enforceRateLimit(req, "adminAction", user.id);
    const { id, itemId, unitId } = await params;
    const data = await parseJsonBody(req, updateUnitSchema);
    const auditContext = buildAuditContext(req, user, {
      orderId: id,
      orderItemId: itemId,
      unitId,
    });

    const unit = await prisma.orderItemUnit.findFirst({
      where: {
        id: unitId,
        orderItem: {
          id: itemId,
          orderId: id,
        },
      },
      include: {
        orderItem: {
          include: {
            order: true,
          },
        },
        inventoryItem: true,
      },
    });

    if (!unit) {
      return withRateLimitHeaders(
        jsonError(404, "Unit not found", "UNIT_NOT_FOUND"),
        rateLimit
      );
    }

    // Handle swapping to a different inventory item
    if (data.inventoryItemId && data.inventoryItemId !== unit.inventoryItemId) {
      const newInvItem = await prisma.inventoryItem.findUnique({
        where: { id: data.inventoryItemId },
      });

      if (!newInvItem) {
        return withRateLimitHeaders(
          jsonError(404, "New inventory item not found", "NEW_INVENTORY_ITEM_NOT_FOUND"),
          rateLimit
        );
      }

      if (newInvItem.productId !== unit.orderItem.productId) {
        return withRateLimitHeaders(
          jsonError(400, "New inventory item belongs to a different product", "PRODUCT_MISMATCH"),
          rateLimit
        );
      }

      const orderStatus = unit.orderItem.order.status;

      // Swap stock count / reservation
      if (["PENDING", "PAID", "PROCESSING"].includes(orderStatus)) {
        if (newInvItem.status !== "AVAILABLE") {
          return withRateLimitHeaders(
            jsonError(409, "Selected inventory item is not available", "ITEM_NOT_AVAILABLE"),
            rateLimit
          );
        }

        await prisma.$transaction([
          prisma.inventoryItem.update({
            where: { id: unit.inventoryItemId },
            data: { status: "AVAILABLE", lastUpdated: new Date() },
          }),
          prisma.inventoryItem.update({
            where: { id: data.inventoryItemId },
            data: { status: "RESERVED", lastUpdated: new Date() },
          }),
          prisma.stockMovement.create({
            data: {
              productId: unit.orderItem.productId,
              inventoryItemId: unit.inventoryItemId,
              orderId: id,
              type: "ADJUSTMENT",
              quantity: 1,
              note: `Swapped out of order ${id} (released reservation)`,
            },
          }),
          prisma.stockMovement.create({
            data: {
              productId: newInvItem.productId,
              inventoryItemId: newInvItem.id,
              orderId: id,
              type: "RESERVE",
              quantity: 1,
              note: `Swapped into order ${id} (reserved unit)`,
            },
          }),
        ]);
      } else if (["SHIPPED", "DELIVERED"].includes(orderStatus)) {
        if (newInvItem.status !== "AVAILABLE") {
          return withRateLimitHeaders(
            jsonError(409, "Selected inventory item is not available", "ITEM_NOT_AVAILABLE"),
            rateLimit
          );
        }

        await prisma.$transaction([
          prisma.inventoryItem.update({
            where: { id: unit.inventoryItemId },
            data: { status: "AVAILABLE", lastUpdated: new Date() },
          }),
          prisma.inventoryItem.update({
            where: { id: data.inventoryItemId },
            data: { status: "SHIPPED", lastUpdated: new Date() },
          }),
          prisma.stockMovement.create({
            data: {
              productId: unit.orderItem.productId,
              inventoryItemId: unit.inventoryItemId,
              orderId: id,
              type: "RETURN",
              quantity: 1,
              note: `Swapped out of shipped order ${id}`,
            },
          }),
          prisma.stockMovement.create({
            data: {
              productId: newInvItem.productId,
              inventoryItemId: newInvItem.id,
              orderId: id,
              type: "SALE",
              quantity: 1,
              note: `Swapped into shipped order ${id}`,
            },
          }),
        ]);
      }


      const updatedUnit = await prisma.orderItemUnit.update({
        where: { id: unitId },
        data: {
          inventoryItemId: data.inventoryItemId,
          serialNumber: newInvItem.serialNumber,
          partNumber: newInvItem.partNumber,
        },
      });

      await prisma.auditLog.create({
        data: {
          entityType: "OrderItemUnit",
          entityId: unitId,
          action: "swapped_inventory_item",
          actor: auditContext.actor,
          before: {
            inventoryItemId: unit.inventoryItemId,
            serialNumber: unit.serialNumber,
            partNumber: unit.partNumber,
          },
          after: {
            inventoryItemId: data.inventoryItemId,
            serialNumber: newInvItem.serialNumber,
            partNumber: newInvItem.partNumber,
          },
          metadata: auditContext.metadata,
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        },
      });

      return withRateLimitHeaders(
        NextResponse.json({ unit: updatedUnit }),
        rateLimit
      );
    }

    // Otherwise directly edit serial and part number of the current inventory item
    const updatedInventoryItem = await prisma.inventoryItem.update({
      where: { id: unit.inventoryItemId },
      data: {
        serialNumber: data.serialNumber,
        partNumber: data.partNumber,
        lastUpdated: new Date(),
      },
    });

    const updatedUnit = await prisma.orderItemUnit.update({
      where: { id: unitId },
      data: {
        serialNumber: data.serialNumber,
        partNumber: data.partNumber,
      },
    });

    await prisma.auditLog.create({
      data: {
        entityType: "InventoryItem",
        entityId: unit.inventoryItemId,
        action: "updated",
        actor: auditContext.actor,
        before: {
          serialNumber: unit.inventoryItem?.serialNumber,
          partNumber: unit.inventoryItem?.partNumber,
        },
        after: {
          serialNumber: data.serialNumber,
          partNumber: data.partNumber,
        },
        metadata: auditContext.metadata,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      },
    });

    return withRateLimitHeaders(
      NextResponse.json({ inventoryItem: updatedInventoryItem, unit: updatedUnit }),
      rateLimit
    );
  } catch (error) {
    return handleApiError(error);
  }
}
