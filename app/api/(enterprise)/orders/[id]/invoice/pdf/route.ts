import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInvoicePdfBuffer } from "@/lib/invoicePdf";
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
      },
    });

    if (!order) {
      return withRateLimitHeaders(
        jsonError(404, "Order not found", "ORDER_NOT_FOUND"),
        rateLimit
      );
    }

    const pdfBuffer = await generateInvoicePdfBuffer(order);

    return withRateLimitHeaders(
      new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="Invoice-${id}.pdf"`,
          "Content-Length": String(pdfBuffer.length),
          "Cache-Control": "private, no-store",
        },
      }),
      rateLimit
    );
  } catch (error) {
    return handleApiError(error);
  }
}
