import { NextResponse } from "next/server";
import { getManualPaymentDetails, getRazorpayConfig } from "@/lib/payments";

export async function GET() {
  const manualPaymentDetails = getManualPaymentDetails();
  const razorpay = getRazorpayConfig();

  return NextResponse.json({
    manualPaymentDetails,
    razorpay: {
      keyId: razorpay.keyId,
      enabled: Boolean(razorpay.keyId && razorpay.keySecret),
    },
  });
}
