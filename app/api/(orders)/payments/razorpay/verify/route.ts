import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getRazorpayConfig, verifyRazorpaySignature } from "@/lib/payments";
import { PaymentStatus } from "@/types";
import { updateOrderStatus } from "@/services/order.service";
import { serializeOrder } from "@/lib/adminSerializers";

const verifySchema = z.object({
  orderId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const data = verifySchema.parse(await req.json());
    const { keySecret } = getRazorpayConfig();

    if (!keySecret) {
      return NextResponse.json(
        { error: "Razorpay secret is not configured." },
        { status: 500 },
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        items: true,
        logs: { orderBy: { timestamp: "desc" } },
        payments: {
          include: { paymentProofs: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const payment = await prisma.paymentTransaction.findFirst({
      where: { orderId: order.id },
      orderBy: { createdAt: "desc" },
    });
    if (!payment) {
      return NextResponse.json(
        { error: "Payment transaction not found." },
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
      await prisma.$transaction(async (tx) => {
        await tx.paymentTransaction.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            metadata: {
              ...(payment.metadata as Record<string, unknown> | null),
              razorpayOrderId: data.razorpayOrderId,
              razorpayPaymentId: data.razorpayPaymentId,
              verification: "FAILED",
            },
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: PaymentStatus.FAILED,
            paymentTransactionId: data.razorpayPaymentId,
          },
        });
      });

      return NextResponse.json(
        { error: "Razorpay signature verification failed." },
        { status: 400 },
      );
    }

    await prisma.paymentTransaction.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.COMPLETED,
        gatewayTxnId: data.razorpayPaymentId,
        metadata: {
          ...(payment.metadata as Record<string, unknown> | null),
          razorpayOrderId: data.razorpayOrderId,
          razorpayPaymentId: data.razorpayPaymentId,
          razorpaySignature: data.razorpaySignature,
          verification: "COMPLETED",
        },
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: PaymentStatus.COMPLETED,
        paymentTransactionId: data.razorpayPaymentId,
      },
    });

    if (order.status === "PENDING") {
      await updateOrderStatus(
        order.id,
        "PAID",
        `Razorpay payment verified (${data.razorpayPaymentId})`,
      );
    }

    const verifiedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: true,
        logs: { orderBy: { timestamp: "desc" } },
        payments: {
          include: { paymentProofs: true },
          orderBy: { createdAt: "desc" },
        },
        shipments: { orderBy: { createdAt: "desc" } },
        invoices: {
          include: { lineItems: true },
          orderBy: { createdAt: "desc" },
        },
        reservations: true,
      },
    });

    return NextResponse.json({
      success: true,
      order: verifiedOrder ? serializeOrder(verifiedOrder) : null,
    });
  } catch (error: unknown) {
    console.error("[RAZORPAY_VERIFY]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to verify Razorpay payment.",
      },
      { status: 500 },
    );
  }
}
