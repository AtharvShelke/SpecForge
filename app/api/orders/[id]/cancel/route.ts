import { NextRequest, NextResponse } from "next/server";
import { cancelOrder } from "@/lib/services/order.service";
import { ServiceError } from "@/lib/services/catalog.service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const order = await cancelOrder(id, body.note);
    return NextResponse.json(order);
  } catch (error: any) {
    if (error instanceof ServiceError) return new NextResponse(error.message, { status: error.statusCode });
    console.error("[POST_ORDER_CANCEL]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
