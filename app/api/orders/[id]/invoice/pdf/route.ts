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
) {
  try {
    const { id } = await params;
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
    );
  }
}
