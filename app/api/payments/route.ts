import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createPaymentTransaction, reconcileOrderPayments } from "@/services/paymentService";

const PaymentMethodEnum = z.enum(["RAZORPAY", "UPI", "BANK_TRANSFER"]);
const PaymentStatusEnum = z.enum(["INITIATED", "PENDING", "COMPLETED", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"]);

const createPaymentSchema = z.object({
    orderId: z.string().min(1),
    method: PaymentMethodEnum,
    amount: z.number().positive(),
    gatewayTxnId: z.string().optional(),
    idempotencyKey: z.string().min(1),
    status: PaymentStatusEnum.default("COMPLETED"),
    metadata: z.record(z.string(), z.any()).optional(),
});

// ── GET /api/payments?orderId=xxx ───────────────────────
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const orderId = searchParams.get("orderId");

        if (!orderId) {
            return NextResponse.json({ error: "orderId is required" }, { status: 400 });
        }

        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        const transactions = await prisma.paymentTransaction.findMany({
            where: { orderId },
            orderBy: { createdAt: "desc" },
        });

        const reconciliation = await reconcileOrderPayments(prisma, orderId, Number(order.total));

        return NextResponse.json({
            transactions,
            reconciliation,
        });
    } catch (error) {
        console.error("GET /api/payments error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── POST /api/payments ──────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const data = createPaymentSchema.parse(body);

        // Verify order exists
        const order = await prisma.order.findUnique({ where: { id: data.orderId } });
        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        const transaction = await prisma.$transaction(async (tx) => {
            const txn = await createPaymentTransaction(tx, {
                orderId: data.orderId,
                method: data.method as any,
                amount: data.amount,
                gatewayTxnId: data.gatewayTxnId,
                idempotencyKey: data.idempotencyKey,
                status: data.status as any,
                metadata: data.metadata,
            });

            // Log to unified audit
            await tx.auditLog.create({
                data: {
                    entityType: 'Payment',
                    entityId: txn.id,
                    action: 'created',
                    actor: 'System',
                    after: {
                        orderId: data.orderId,
                        amount: data.amount,
                        method: data.method,
                        status: data.status,
                    },
                },
            });

            return txn;
        });

        return NextResponse.json(transaction, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("POST /api/payments error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
