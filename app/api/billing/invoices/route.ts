import { NextRequest, NextResponse } from "next/server";
import { listInvoices, createInvoice } from "@/lib/services/billing.service";
import { ServiceError } from "@/lib/services/catalog.service";
import { serializeInvoice, serializeInvoices } from "@/lib/api/adminSerializers";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const invoices = await listInvoices({
      status: searchParams.get("status") || undefined,
      customerId: searchParams.get("customerId") || undefined,
      orderId: searchParams.get("orderId") || undefined,
    });
    return NextResponse.json(serializeInvoices(invoices as any[]));
  } catch (error: any) {
    if (error instanceof ServiceError) return new NextResponse(error.message, { status: error.statusCode });
    console.error("[GET_INVOICES]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const invoice = await createInvoice(body);
    return NextResponse.json(serializeInvoice(invoice), { status: 201 });
  } catch (error: any) {
    if (error instanceof ServiceError) return new NextResponse(error.message, { status: error.statusCode });
    console.error("[POST_INVOICES]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
