/**
 * Payment Service
 *
 * Handles:
 * - Creating payment transactions with idempotency
 * - Payment reconciliation
 * - Refund recording
 */

import type { PrismaClient } from '@/generated/prisma';
import type { PaymentMethodType, PaymentStatus, Currency } from '@/generated/prisma';

type PrismaTx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

// ─────────────────────────────────────────────────
// PAYMENT CREATION
// ─────────────────────────────────────────────────

export interface CreatePaymentInput {
    orderId: string;
    method: PaymentMethodType;
    amount: number;
    currency?: Currency;
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
            currency: input.currency ?? 'INR',
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
        .reduce((sum, t) => sum + t.amount, 0);

    const totalRefunded = transactions
        .filter(t => t.status === 'REFUNDED' || t.status === 'PARTIALLY_REFUNDED')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

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

