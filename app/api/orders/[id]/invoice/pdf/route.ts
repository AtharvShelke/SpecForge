<<<<<<< HEAD
import { NextResponse } from "next/server";
import { serializeOrder } from "@/lib/adminSerializers";
import { ServiceError } from "@/lib/errors";
import { getOrderById } from "@/services/order.service";
import { generateInvoicePdfBuffer } from "@/lib/invoicePdf";
import type { Order } from "@/types";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
=======
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
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
) {
  try {
    const rateLimit = enforceRateLimit(req, "invoiceAccess");
    const { id } = await params;
<<<<<<< HEAD
    const order = await getOrderById(id);
    const serializedOrder = serializeOrder(order) as Order;
    const pdfBuffer = await generateInvoicePdfBuffer(serializedOrder);

    return new NextResponse(pdfBuffer as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Invoice-${id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error("[GET_ORDER_INVOICE_PDF]", error);
    return NextResponse.json(
      { error: "Failed to generate invoice PDF." },
      { status: 500 },
=======
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
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
    );
  } catch (error) {
    return handleApiError(error);
  }
}
