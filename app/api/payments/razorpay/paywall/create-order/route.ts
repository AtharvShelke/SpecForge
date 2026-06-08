import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getRazorpayConfig } from "@/lib/payments";

export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { keyId, keySecret } = getRazorpayConfig();
    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay keys are not configured." },
        { status: 500 },
      );
    }

    const settings = await prisma.paywallSettings.findUnique({
      where: { id: "paywall_config" },
    });
    const price = settings?.price ?? 150;

    const gatewayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      },
      body: JSON.stringify({
        amount: Math.round(price * 100),
        currency: "INR",
        notes: {
          userId: user.id,
          userEmail: user.email,
          purpose: "PC Builder Paywall",
        },
      }),
      cache: "no-store",
    });

    const gatewayPayload = await gatewayResponse.json();

    if (!gatewayResponse.ok) {
      return NextResponse.json(
        {
          error:
            gatewayPayload?.error?.description ||
            "Failed to create Razorpay order.",
        },
        { status: gatewayResponse.status || 500 },
      );
    }

    await prisma.paywallPayment.create({
      data: {
        userId: user.id,
        amount: price,
        paymentStatus: "PENDING",
        razorpayOrderId: gatewayPayload.id,
      },
    });

    return NextResponse.json({
      amount: gatewayPayload.amount,
      currency: gatewayPayload.currency,
      razorpayOrderId: gatewayPayload.id,
      keyId,
      customerName: user.name,
      email: user.email,
    });
  } catch (error) {
    console.error("[PAYWALL_CREATE_ORDER] Error:", error);
    return NextResponse.json(
      { error: "Unable to initialize Razorpay checkout." },
      { status: 500 },
    );
  }
}
