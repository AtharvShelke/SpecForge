import { NextRequest, NextResponse } from "next/server";
import {
  getBillingProfile,
  upsertBillingProfile,
} from "@/services/billing.service";
import { ServiceError } from "@/services/catalog.service";

export async function GET() {
  try {
    const profile = await getBillingProfile();
    return NextResponse.json(profile);
  } catch (error: any) {
    if (error instanceof ServiceError)
      return new NextResponse(error.message, { status: error.statusCode });
    console.error("[GET_BILLING_PROFILE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const profile = await upsertBillingProfile(body);
    return NextResponse.json(profile);
  } catch (error: any) {
    if (error instanceof ServiceError)
      return new NextResponse(error.message, { status: error.statusCode });
    console.error("[POST_BILLING_PROFILE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
