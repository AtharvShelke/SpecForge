import { NextRequest, NextResponse } from "next/server";
import { cancelInvoice } from "@/services/billing.service";
import { serializeInvoice } from "@/lib/adminSerializers";
import { ServiceError } from "@/lib/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const invoice = await cancelInvoice(id, body);
    return NextResponse.json(serializeInvoice(invoice));
  } catch (error: any) {
    if (error instanceof ServiceError)
      return new NextResponse(error.message, { status: error.statusCode });
    console.error("[POST_INVOICE_CANCEL]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
