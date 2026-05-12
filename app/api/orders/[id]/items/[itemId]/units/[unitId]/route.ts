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
        orderItem: true,
        inventoryItem: true,
      },
    });

    if (!unit) {
      return withRateLimitHeaders(
        jsonError(404, "Unit not found", "UNIT_NOT_FOUND"),
        rateLimit
      );
    }

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
