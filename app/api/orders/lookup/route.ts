import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createOrderInvoiceAccessToken } from "@/lib/security/documents";
import { handleApiError, jsonError } from "@/lib/security/errors";
import {
  enforceRateLimit,
  withRateLimitHeaders,
} from "@/lib/security/rate-limit";
import { parseJsonBody } from "@/lib/security/validation";

const orderLookupSchema = z.object({
  orderId: z.string().min(1),
  contact: z.string().min(3),
});

export async function POST(req: NextRequest) {
  try {
    const rateLimit = enforceRateLimit(req, "orderLookup");
    const { orderId, contact } = await parseJsonBody(req, orderLookupSchema);

    const order = await prisma.order.findUnique({
      where: { id: orderId.trim().toUpperCase() },
      include: {
        items: { include: { assignedUnits: true } },
        logs: { orderBy: { timestamp: "asc" } },
        invoices: { include: { lineItems: true } },
        payments: { orderBy: { createdAt: "desc" } },
      },
    });

    const normalizedContact = contact.trim().toLowerCase();
    const matchesContact =
      order &&
      (order.email.toLowerCase() === normalizedContact ||
        (order.phone?.trim().toLowerCase() ?? "") === normalizedContact);

    if (!order || !matchesContact) {
      return withRateLimitHeaders(
        jsonError(404, "Order not found", "ORDER_NOT_FOUND"),
        rateLimit
      );
    }

    const invoiceAccessToken = await createOrderInvoiceAccessToken({
      orderId: order.id,
      email: order.email,
    });

    return withRateLimitHeaders(
      NextResponse.json({ order, invoiceAccessToken }),
      rateLimit
    );
  } catch (error) {
    return handleApiError(error);
  }
}
