import { NextResponse } from "next/server";
import { configService } from "@/services/config.service";

export async function GET() {
  try {
    const methods = await configService.getPaymentMethods();
    return NextResponse.json(methods);
  } catch (error) {
    console.error("[/api/payments/methods] Failed to fetch payment methods:", error);
    return NextResponse.json([], { status: 500 });
  }
}
