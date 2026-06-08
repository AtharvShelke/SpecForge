import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getRazorpayConfig, verifyRazorpaySignature } from "@/lib/payments";
import { getSessionUser } from "@/lib/auth";

const verifySchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = verifySchema.parse(await req.json());
    const { keySecret } = getRazorpayConfig();

    if (!keySecret) {
      return NextResponse.json(
        { error: "Razorpay secret is not configured." },
        { status: 500 },
      );
    }

    const paywallPayment = await prisma.paywallPayment.findUnique({
      where: { razorpayOrderId: data.razorpayOrderId },
    });

    if (!paywallPayment) {
      return NextResponse.json(
        { error: "Payment attempt not found." },
        { status: 404 },
      );
    }

    const isValid = verifyRazorpaySignature({
      razorpayOrderId: data.razorpayOrderId,
      razorpayPaymentId: data.razorpayPaymentId,
      razorpaySignature: data.razorpaySignature,
      keySecret,
    });

    if (!isValid) {
      await prisma.paywallPayment.update({
        where: { id: paywallPayment.id },
        data: {
          paymentStatus: "FAILED",
          razorpayPaymentId: data.razorpayPaymentId,
        },
      });
      return NextResponse.json(
        { error: "Razorpay signature verification failed." },
        { status: 400 },
      );
    }

    // Success: update payment status and mark User as paid
    await prisma.$transaction([
      prisma.paywallPayment.update({
        where: { id: paywallPayment.id },
        data: {
          paymentStatus: "COMPLETED",
          razorpayPaymentId: data.razorpayPaymentId,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          hasPaidPaywall: true,
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PAYWALL_VERIFY] Error:", error);
    return NextResponse.json(
      { error: "Unable to verify payment." },
      { status: 500 },
    );
  }
}
