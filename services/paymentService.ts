/**
 * Payment Service
 *
 * Handles:
 * - Creating payment transactions with idempotency
 * - Payment reconciliation
 * - Refund recording
 */

import type { PrismaClient } from '@/generated/prisma/client';
import { PaymentMethodType, PaymentStatus } from '@/types';

type PrismaTx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

// ─────────────────────────────────────────────────
// PAYMENT CREATION
// ─────────────────────────────────────────────────

export interface CreatePaymentInput {
    orderId: string;
    method: PaymentMethodType;
    amount: number;
    gatewayTxnId?: string;
    idempotencyKey: string;
    metadata?: Record<string, any>;
    status?: PaymentStatus;
}

/**
 * Create a payment transaction record.
 * Idempotent: returns existing transaction if idempotencyKey already exists.
 */
export async function createPaymentTransaction(tx: PrismaTx, input: CreatePaymentInput) {
    // Idempotency check
    const existing = await tx.paymentTransaction.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) return existing;

    return tx.paymentTransaction.create({
        data: {
            orderId: input.orderId,
            method: input.method,
            amount: input.amount,
            gatewayTxnId: input.gatewayTxnId,
            status: input.status ?? 'COMPLETED',
            idempotencyKey: input.idempotencyKey,
            metadata: input.metadata,
        },
    });
}

// ─────────────────────────────────────────────────
// RECONCILIATION
// ─────────────────────────────────────────────────

export interface ReconciliationResult {
    totalPaid: number;
    totalRefunded: number;
    netPaid: number;
    isFullyPaid: boolean;
    isOverpaid: boolean;
    balance: number;
    transactionCount: number;
}

/**
 * Reconcile all payment transactions for an order.
 */
export async function reconcileOrderPayments(
    tx: PrismaTx,
    orderId: string,
    orderTotal: number
): Promise<ReconciliationResult> {
    const transactions = await tx.paymentTransaction.findMany({
        where: { orderId },
        orderBy: { createdAt: 'asc' },
    });

    const totalPaid = transactions
        .filter(t => t.status === 'COMPLETED')
        .reduce((sum, t) => sum + Number(t.amount), 0); // Handle Decimal math safely

    const totalRefunded = transactions
        .filter(t => t.status === 'REFUNDED' || t.status === 'PARTIALLY_REFUNDED')
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    const netPaid = totalPaid - totalRefunded;

    return {
        totalPaid,
        totalRefunded,
        netPaid,
        isFullyPaid: netPaid >= orderTotal,
        isOverpaid: netPaid > orderTotal,
        balance: orderTotal - netPaid,
        transactionCount: transactions.length,
    };
}

// ─────────────────────────────────────────────────
// REFUNDS
// ─────────────────────────────────────────────────

export interface RefundInput {
    orderId: string;
    originalPaymentId: string;
    amount: number;
    reason: string;
}

/**
 * Record a refund transaction.
 */
export async function recordRefund(tx: PrismaTx, input: RefundInput) {
    // Get original payment for method info
    const original = await tx.paymentTransaction.findUniqueOrThrow({
        where: { id: input.originalPaymentId },
    });

    const idempotencyKey = `refund-${input.orderId}-${input.originalPaymentId}-${Date.now()}`;

    // Create refund transaction (negative amount)
    const refundTxn = await tx.paymentTransaction.create({
        data: {
            orderId: input.orderId,
            method: original.method,
            amount: -Math.abs(input.amount),
            status: 'REFUNDED',
            idempotencyKey,
            metadata: {
                reason: input.reason,
                originalPaymentId: input.originalPaymentId,
            },
        },
    });

    // Update original payment status resolving Decimal safe casting
    const originalAmountAssigned = Number(original.amount);
    const isFullRefund = Math.abs(input.amount) >= originalAmountAssigned;
    await tx.paymentTransaction.update({
        where: { id: input.originalPaymentId },
        data: {
            status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        },
    });

    return refundTxn;
}
