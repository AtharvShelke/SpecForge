import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInvoiceHTML } from "@/lib/invoice";
import { authorizeOrderInvoiceAccess } from "@/lib/security/documents";
import { handleApiError, jsonError } from "@/lib/security/errors";
import {
  enforceRateLimit,
  withRateLimitHeaders,
} from "@/lib/security/rate-limit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimit = enforceRateLimit(req, "invoiceAccess");
    const { id } = await params;
    await authorizeOrderInvoiceAccess(req, id);

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

    let html = generateInvoiceHTML(order);
    html = html.replace(
      "</body></html>",
      "<script>window.onload=function(){window.print();}</script></body></html>"
    );

    return withRateLimitHeaders(
      new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "private, no-store",
        },
      }),
      rateLimit
    );
  } catch (error) {
    return handleApiError(error);
  }
}
