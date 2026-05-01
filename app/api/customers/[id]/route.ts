import { NextRequest, NextResponse } from "next/server";
import { getCustomerById, updateCustomer } from "@/services/customer.service";
import { ServiceError } from "@/services/catalog.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const customer = await getCustomerById(id);
    return NextResponse.json(customer);
  } catch (error: any) {
    if (error instanceof ServiceError)
      return new NextResponse(error.message, { status: error.statusCode });
    console.error("[GET_CUSTOMER_ID]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const customer = await updateCustomer(id, body);
    return NextResponse.json(customer);
  } catch (error: any) {
    if (error instanceof ServiceError)
      return new NextResponse(error.message, { status: error.statusCode });
    console.error("[PATCH_CUSTOMER_ID]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
