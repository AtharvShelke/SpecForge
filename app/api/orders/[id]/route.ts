import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  confirmInventory,
  restoreInventory,
} from "@/lib/services/inventory";
import { generateOrderInvoice } from "@/lib/services/invoice";
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

const OrderStatusEnum = z.enum([
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
]);

const updateOrderSchema = z.object({
  status: OrderStatusEnum,
  note: z.string().optional(),
});

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["RETURNED"],
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin(req);
    const rateLimit = enforceRateLimit(req, "adminAction", user.id);
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { assignedUnits: true } },
        logs: { orderBy: { timestamp: "asc" } },
        invoices: { include: { lineItems: true } },
        payments: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!order) {
      return withRateLimitHeaders(
        jsonError(404, "Order not found", "ORDER_NOT_FOUND"),
        rateLimit
      );
    }

    return withRateLimitHeaders(NextResponse.json(order), rateLimit);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin(req);
    assertTrustedOrigin(req);
    const rateLimit = enforceRateLimit(req, "adminAction", user.id);
    const { id } = await params;
    const data = await parseJsonBody(req, updateOrderSchema);
    const auditContext = buildAuditContext(req, user, { orderId: id });

    const startTime = Date.now();

    const order = await prisma.$transaction(
      async (tx) => {
        const existing = await tx.order.findUnique({
          where: { id },
          include: { items: { include: { assignedUnits: true } } },
        });
        if (!existing) {
          throw new Error("NOT_FOUND");
        }

        const oldStatus = existing.status;
        const newStatus = data.status;

        if (oldStatus === newStatus) {
          throw new Error("SAME_STATUS");
        }

        const allowed = VALID_TRANSITIONS[oldStatus] ?? [];
        if (!allowed.includes(newStatus)) {
          throw new Error(`INVALID_TRANSITION:${oldStatus}->${newStatus}`);
        }

        const versionCheck = await tx.order.updateMany({
          where: { id, version: existing.version },
          data: { version: { increment: 1 } },
        });
        if (versionCheck.count === 0) {
          throw new Error("CONCURRENT_MODIFICATION");
        }

        const assignedUnits = existing.items.flatMap((item) =>
          item.assignedUnits.map((unit) => ({
            inventoryItemId: unit.inventoryItemId,
            productId: item.productId,
          }))
        );

        if (newStatus === "SHIPPED") {
          await confirmInventory(tx, assignedUnits, id);
        } else if (newStatus === "CANCELLED") {
          const isPreShip = ["PENDING", "PAID", "PROCESSING"].includes(
            oldStatus
          );
          await restoreInventory(
            tx,
            assignedUnits,
            id,
            isPreShip,
            `Order ${id} cancelled from ${oldStatus}`
          );
        } else if (newStatus === "RETURNED") {
          await restoreInventory(
            tx,
            assignedUnits,
            id,
            false,
            `Order ${id} returned`
          );
        }

        if (newStatus === "PAID") {
          try {
            await generateOrderInvoice(tx, id);
          } catch (invoiceError) {
            console.error(
              `[Invoice Generation] Failed for order ${id}:`,
              invoiceError
            );
          }
        }

        const updated = await tx.order.update({
          where: { id },
          data: {
            status: newStatus,
            logs: {
              create: {
                status: newStatus,
                note:
                  data.note ||
                  `Status updated from ${oldStatus} to ${newStatus}`,
              },
            },
          },
          include: {
            items: { include: { assignedUnits: true } },
            logs: { orderBy: { timestamp: "asc" } },
            payments: { orderBy: { createdAt: "desc" } },
          },
        });

        await tx.auditLog.create({
          data: {
            entityType: "Order",
            entityId: id,
            action: "status_changed",
            actor: auditContext.actor,
            before: { status: oldStatus },
            after: { status: newStatus },
            metadata: auditContext.metadata,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
          },
        });

        return updated;
      },
      {
        maxWait: 5000,
        timeout: 15000,
      }
    );

    const duration = Date.now() - startTime;
    console.log(`[Order Transaction] PATCH /api/orders/${id} completed in ${duration}ms`);

    return withRateLimitHeaders(NextResponse.json(order), rateLimit);
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return jsonError(404, "Order not found", "ORDER_NOT_FOUND");
    }
    if (error?.message === "SAME_STATUS") {
      return jsonError(400, "Order already has this status", "SAME_STATUS");
    }
    if (error?.message?.startsWith("INVALID_TRANSITION")) {
      return jsonError(
        400,
        `Invalid status transition: ${error.message.split(":")[1]}`,
        "INVALID_TRANSITION"
      );
    }
    if (error?.message === "CONCURRENT_MODIFICATION") {
      return jsonError(
        409,
        "Order was modified by another request. Please retry.",
        "CONCURRENT_MODIFICATION"
      );
    }

    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin(req);
    assertTrustedOrigin(req);
    const rateLimit = enforceRateLimit(req, "adminAction", user.id);
    const { id } = await params;
    const auditContext = buildAuditContext(req, user, { orderId: id });

    const startTime = Date.now();

    await prisma.$transaction(
      async (tx) => {
        const existing = await tx.order.findUnique({
          where: { id },
          include: { items: { include: { assignedUnits: true } } },
        });

        if (!existing) {
          throw new Error("NOT_FOUND");
        }

        if (existing.status !== "CANCELLED") {
          const oldStatus = existing.status;
          const assignedUnits = existing.items.flatMap((item) =>
            item.assignedUnits.map((unit) => ({
              inventoryItemId: unit.inventoryItemId,
              productId: item.productId,
            }))
          );

          const isPreShip = ["PENDING", "PAID", "PROCESSING"].includes(
            oldStatus
          );

          await restoreInventory(
            tx,
            assignedUnits,
            id,
            isPreShip,
            `Order ${id} cancelled during deletion from ${oldStatus}`
          );
        }

        await tx.order.delete({ where: { id } });

        await tx.auditLog.create({
          data: {
            entityType: "Order",
            entityId: id,
            action: "deleted",
            actor: auditContext.actor,
            before: {
              id: existing.id,
              status: existing.status,
              customerName: existing.customerName,
              total: existing.total,
            },
            metadata: auditContext.metadata,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
          },
        });
      },
      {
        maxWait: 5000,
        timeout: 15000,
      }
    );

    const duration = Date.now() - startTime;
    console.log(`[Order Deletion] DELETE /api/orders/${id} completed in ${duration}ms`);

    return withRateLimitHeaders(
      NextResponse.json({ success: true, message: `Order ${id} deleted` }),
      rateLimit
    );
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return jsonError(404, "Order not found", "ORDER_NOT_FOUND");
    }

    return handleApiError(error);
  }
}
