import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createPaymentTransaction, reconcileOrderPayments } from "@/lib/services/payment";
import {
  CurrencySchema,
  PaymentStatusSchema,
  PaymentTransactionMethodSchema,
} from "@/lib/contracts/validation";
import { handleApiError, jsonError } from "@/lib/security/errors";
import { buildAuditContext } from "@/lib/security/request";
import { parseJsonBody } from "@/lib/security/validation";

const createPaymentSchema = z.object({
    orderId: z.string().min(1),
    method: PaymentTransactionMethodSchema,
    amount: z.number().positive(),
    currency: CurrencySchema.default("INR"),
    gatewayTxnId: z.string().optional(),
    idempotencyKey: z.string().min(1),
    status: PaymentStatusSchema.default("COMPLETED"),
    metadata: z.record(z.string(), z.unknown()).optional(),
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

        const reconciliation = await reconcileOrderPayments(prisma, orderId, order.total);

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
        const user = await requireAdmin(req);
        const data = await parseJsonBody(req, createPaymentSchema);
        const auditContext = buildAuditContext(req, user, {
            orderId: data.orderId,
        });

        // Verify order exists
        const order = await prisma.order.findUnique({ where: { id: data.orderId } });
        if (!order) {
            return jsonError(404, "Order not found", "ORDER_NOT_FOUND");
        }

        const transaction = await prisma.$transaction(async (tx) => {
            const txn = await createPaymentTransaction(tx, {
                orderId: data.orderId,
                method: data.method,
                amount: data.amount,
                currency: data.currency,
                gatewayTxnId: data.gatewayTxnId,
                idempotencyKey: data.idempotencyKey,
                status: data.status,
                metadata: data.metadata,
            });

            // Log to unified audit
            await tx.auditLog.create({
                data: {
                    entityType: 'Payment',
                    entityId: txn.id,
                    action: 'created',
                    actor: auditContext.actor,
                    after: {
                        orderId: data.orderId,
                        amount: data.amount,
                        method: data.method,
                        status: data.status,
                    },
                    metadata: auditContext.metadata,
                    ipAddress: auditContext.ipAddress,
                    userAgent: auditContext.userAgent,
                },
            });

            return txn;
        });

        return NextResponse.json(transaction, { status: 201 });
    } catch (error) {
        return handleApiError(error);
    }
}
