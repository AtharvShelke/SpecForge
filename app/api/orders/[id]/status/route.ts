import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus } from "@/services/order.service";
import { ServiceError } from "@/services/catalog.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const order = await updateOrderStatus(id, body.status, body.note);
    return NextResponse.json(order);
  } catch (error: any) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error("[POST_ORDER_STATUS]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 },
    );
  }
}
