import { NextRequest, NextResponse } from "next/server";
import { sendInvoice } from "@/services/billing.service";
import { serializeInvoice } from "@/lib/adminSerializers";
import { ServiceError } from "@/lib/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const invoice = await sendInvoice(id, body);
    return NextResponse.json(serializeInvoice(invoice));
  } catch (error: any) {
    if (error instanceof ServiceError)
      return new NextResponse(error.message, { status: error.statusCode });
    console.error("[POST_INVOICE_SEND]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
