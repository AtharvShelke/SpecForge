import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@/types";
import { serializeOrder } from "@/lib/adminSerializers";
import { updateOrderStatus } from "@/services/order.service";

const paymentStatusSchema = z.object({
  status: z.enum([PaymentStatus.COMPLETED, PaymentStatus.FAILED]),
  note: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> },
) {
  try {
    const { id, paymentId } = await params;
    const data = paymentStatusSchema.parse(await req.json());

    const order = await prisma.order.findUnique({
      where: { id },
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
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const payment = order.payments.find((entry) => entry.id === paymentId);
    if (!payment) {
      return NextResponse.json(
        { error: "Payment transaction not found." },
        { status: 404 },
      );
    }

    await prisma.paymentTransaction.update({
      where: { id: paymentId },
      data: {
        status: data.status,
        metadata: {
          ...(payment.metadata as Record<string, unknown> | null),
          adminReviewNote: data.note,
          reviewedAt: new Date().toISOString(),
        },
      },
    });

    await prisma.order.update({
      where: { id },
      data: {
        paymentStatus: data.status,
        paymentTransactionId: payment.gatewayTxnId || payment.id,
      },
    });

    if (data.status === PaymentStatus.COMPLETED && order.status === "PENDING") {
      await updateOrderStatus(
        id,
        "PAID",
        data.note || `Manual payment verified for ${payment.method}`,
      );
    }

    if (data.status === PaymentStatus.FAILED) {
      await prisma.orderLog.create({
        data: {
          orderId: id,
          status: order.status,
          note: data.note || `Payment marked as failed for ${payment.method}`,
        },
      });
    }

    const updatedOrder = await prisma.order.findUnique({
      where: { id },
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

    return NextResponse.json(
      updatedOrder ? serializeOrder(updatedOrder) : null,
    );
  } catch (error: unknown) {
    console.error("[PATCH_ORDER_PAYMENT]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update payment status.",
      },
      { status: 500 },
    );
  }
}
