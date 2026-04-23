import { NextRequest, NextResponse } from "next/server";
import { listOrders, createOrder } from "@/lib/services/order.service";
import { ServiceError } from "@/lib/services/catalog.service";
import { serializeOrder, serializeOrders } from "@/lib/api/adminSerializers";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const orders = await listOrders({
      status: searchParams.get("status") || undefined,
      customerId: searchParams.get("customerId") || undefined,
    });
    return NextResponse.json(serializeOrders(orders as any[]));
  } catch (error: any) {
    if (error instanceof ServiceError) return new NextResponse(error.message, { status: error.statusCode });
    console.error("[GET_ORDERS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const order = await createOrder(body);
    return NextResponse.json(serializeOrder(order), { status: 201 });
  } catch (error: any) {
    if (error instanceof ServiceError) return new NextResponse(error.message, { status: error.statusCode });
    console.error("[POST_ORDERS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
