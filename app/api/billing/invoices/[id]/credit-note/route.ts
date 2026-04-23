import { NextRequest, NextResponse } from "next/server";
import { createCreditNote } from "@/lib/services/billing.service";
import { serializeInvoice } from "@/lib/api/adminSerializers";
import { ServiceError } from "@/lib/services/catalog.service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const creditNote = await createCreditNote(id, body);
    return NextResponse.json(serializeInvoice(creditNote), { status: 201 });
  } catch (error: any) {
    if (error instanceof ServiceError) return new NextResponse(error.message, { status: error.statusCode });
    console.error("[POST_CREDIT_NOTE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
