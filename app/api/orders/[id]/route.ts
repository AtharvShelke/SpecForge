import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrder } from "@/lib/services/order.service";
import { ServiceError } from "@/lib/services/catalog.service";
import { serializeOrder } from "@/lib/api/adminSerializers";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = await getOrderById(id);
    return NextResponse.json(serializeOrder(order));
  } catch (error: any) {
    if (error instanceof ServiceError) return new NextResponse(error.message, { status: error.statusCode });
    console.error("[GET_ORDER_ID]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const order = await updateOrder(id, body);
    return NextResponse.json(serializeOrder(order));
  } catch (error: any) {
    if (error instanceof ServiceError) return new NextResponse(error.message, { status: error.statusCode });
    console.error("[PATCH_ORDER_ID]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
