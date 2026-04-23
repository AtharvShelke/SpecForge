import { NextRequest, NextResponse } from "next/server";
import { listCustomers, createCustomer } from "@/lib/services/customer.service";
import { ServiceError } from "@/lib/services/catalog.service";

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email") || undefined;
    const customers = await listCustomers({ email });
    return NextResponse.json(customers);
  } catch (error: any) {
    if (error instanceof ServiceError) return new NextResponse(error.message, { status: error.statusCode });
    console.error("[GET_CUSTOMERS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const customer = await createCustomer(body);
    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    if (error instanceof ServiceError) return new NextResponse(error.message, { status: error.statusCode });
    console.error("[POST_CUSTOMERS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
