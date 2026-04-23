import { NextRequest, NextResponse } from "next/server";
import { getInvoiceById, updateInvoice } from "@/lib/services/billing.service";
import { ServiceError } from "@/lib/services/catalog.service";
import { serializeInvoice } from "@/lib/api/adminSerializers";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const invoice = await getInvoiceById(id);
    return NextResponse.json(serializeInvoice(invoice));
  } catch (error: any) {
    if (error instanceof ServiceError) return new NextResponse(error.message, { status: error.statusCode });
    console.error("[GET_INVOICE_ID]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const invoice = await updateInvoice(id, body);
    return NextResponse.json(serializeInvoice(invoice));
  } catch (error: any) {
    if (error instanceof ServiceError) return new NextResponse(error.message, { status: error.statusCode });
    console.error("[PATCH_INVOICE_ID]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
