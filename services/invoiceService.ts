/**
 * Centralized Invoice Generation Service
 *
 * Handles:
 * - Sequential invoice number generation (atomic DB increment)
 * - Automatic invoice creation from paid orders
 * - Invoice immutability enforcement
 * - Credit note generation for refunds/voids
 * - Idempotent invoice generation (won't duplicate)
 */

import type { PrismaClient } from '@/generated/prisma/client';
import { calculateTax, roundCurrency, type TaxLineInput } from '@/lib/tax-engine';

type PrismaTx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

// ─────────────────────────────────────────────────
// SEQUENTIAL NUMBERING
// ─────────────────────────────────────────────────

/**
 * Atomically generate the next sequential invoice number.
 * Format: INV-YYMM-000001
 */
async function nextInvoiceNumber(tx: PrismaTx): Promise<string> {
    const seq = await tx.invoiceSequence.upsert({
        where: { id: 'invoice_seq' },
        update: { currentValue: { increment: 1 } },
        create: { id: 'invoice_seq', currentValue: 1 },
    });

    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    return `INV-${yy}${mm}-${String(seq.currentValue).padStart(6, '0')}`;
}

/**
 * Atomically generate the next sequential credit note number.
 * Format: CN-YYMM-000001
 */
async function nextCreditNoteNumber(tx: PrismaTx): Promise<string> {
    // Use a separate sequence row for credit notes
    const seq = await tx.invoiceSequence.upsert({
        where: { id: 'credit_note_seq' },
        update: { currentValue: { increment: 1 } },
        create: { id: 'credit_note_seq', currentValue: 1 },
    });

    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    return `CN-${yy}${mm}-${String(seq.currentValue).padStart(6, '0')}`;
}

// ─────────────────────────────────────────────────
// INVOICE GENERATION
// ─────────────────────────────────────────────────

/**
 * Generate an invoice for a paid order.
 * Idempotent: if an invoice already exists for this order, returns it.
 *
 * @param tx - Prisma transaction client
 * @param orderId - The order to generate an invoice for
 * @returns The created (or existing) invoice
 */
export async function generateOrderInvoice(tx: PrismaTx, orderId: string) {
    // Idempotency check: don't create duplicates
    const existing = await tx.invoice.findFirst({
        where: { orderId, type: 'STANDARD' },
        include: { customer: true, lineItems: true, audit: true },
    });
    if (existing) return existing;

    // Load order with items
    const order = await tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: { items: true },
    });

    // Find or create customer record
    let customerId = order.customerId;
    if (!customerId) {
        const customer = await tx.customer.upsert({
            where: { id: 'lookup' }, // This won't match, so it'll search by email below
            update: {},
            create: {
                name: order.customerName,
                email: order.email,
                phone: order.phone,
            },
        }).catch(async () => {
            // Upsert by email isn't directly supported, find first then create
            const found = await tx.customer.findFirst({ where: { email: order.email } });
            if (found) return found;
            return tx.customer.create({
                data: {
                    name: order.customerName,
                    email: order.email,
                    phone: order.phone,
                },
            });
        });
        customerId = customer.id;
    }

    // Compute invoice number
    const invoiceNumber = await nextInvoiceNumber(tx);

    // Build tax inputs from order items
    const taxInputs: TaxLineInput[] = order.items.map(item => ({
        unitPrice: item.price,
        quantity: item.quantity,
        taxRatePct: 18, // default for PC components
    }));

    const taxResult = calculateTax({ items: taxInputs });

    // Build line items
    const lineItems = order.items.map((item, idx) => ({
        name: item.name,
        description: item.sku ? `SKU: ${item.sku}` : undefined,
        quantity: item.quantity,
        unitPrice: item.price,
        taxRatePct: taxResult.lineResults[idx].taxRatePct,
    }));

    // Create immutable invoice
    const invoice = await tx.invoice.create({
        data: {
            invoiceNumber,
            orderId,
            type: 'STANDARD',
            status: 'paid',
            customerId,
            currency: 'INR',
            subtotal: taxResult.subtotal,
            taxTotal: taxResult.totalTax,
            discountPct: 0,
            shipping: 0,
            total: taxResult.grandTotal,
            amountPaid: taxResult.grandTotal,
            amountDue: 0,
            paidAt: new Date(),
            dueDate: new Date(),
            lineItems: { create: lineItems },
            audit: {
                create: {
                    type: 'created',
                    actor: 'System',
                    message: `Invoice auto-generated for order ${orderId}`,
                },
            },
        },
        include: { customer: true, lineItems: true, audit: true },
    });

    return invoice;
}

// ─────────────────────────────────────────────────
// IMMUTABILITY ENFORCEMENT
// ─────────────────────────────────────────────────

/** Statuses that indicate an invoice is finalized and cannot be modified */
const IMMUTABLE_STATUSES = ['paid', 'overdue', 'cancelled', 'refunded', 'voided'];

/**
 * Check if an invoice can be modified.
 * Only draft and pending invoices can be edited.
 */
export function isInvoiceImmutable(status: string): boolean {
    return IMMUTABLE_STATUSES.includes(status);
}

/**
 * Valid status transitions for invoices.
 */
const INVOICE_TRANSITIONS: Record<string, string[]> = {
    draft: ['pending', 'cancelled'],
    pending: ['paid', 'overdue', 'cancelled'],
    overdue: ['paid', 'cancelled'],
    paid: ['voided'],
    cancelled: [],
    refunded: [],
    voided: [],
};

export function isValidInvoiceTransition(from: string, to: string): boolean {
    return INVOICE_TRANSITIONS[from]?.includes(to) ?? false;
}

// ─────────────────────────────────────────────────
// CREDIT NOTES
// ─────────────────────────────────────────────────

export interface CreditNoteInput {
    originalInvoiceId: string;
    orderId?: string;
    reason: string;
    items: {
        name: string;
        quantity: number;
        unitPrice: number;
        taxRatePct?: number;
        hsnCode?: string;
    }[];
}

/**
 * Create a credit note against an existing invoice.
 * Voids the original if fully credited.
 */
export async function createCreditNote(tx: PrismaTx, input: CreditNoteInput) {
    const invoice = await tx.invoice.findUniqueOrThrow({
        where: { id: input.originalInvoiceId },
        include: { lineItems: true },
    });

    // Calculate credit amounts
    const taxInputs: TaxLineInput[] = input.items.map(item => ({
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        taxRatePct: item.taxRatePct ?? 18,
    }));

    const taxResult = calculateTax({ items: taxInputs });

    const creditNoteNumber = await nextCreditNoteNumber(tx);

    const creditNote = await tx.creditNote.create({
        data: {
            creditNoteNumber,
            originalInvoiceId: input.originalInvoiceId,
            orderId: input.orderId,
            reason: input.reason,
            subtotal: taxResult.subtotal,
            taxTotal: taxResult.totalTax,
            total: taxResult.grandTotal,
            lineItems: {
                create: input.items.map((item, idx) => ({
                    name: item.name,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    taxRatePct: taxResult.lineResults[idx].taxRatePct,
                    hsnCode: item.hsnCode,
                })),
            },
        },
        include: { lineItems: true },
    });

    // If credit note covers full invoice amount, void the invoice
    if (roundCurrency(taxResult.grandTotal) >= roundCurrency(invoice.total)) {
        await tx.invoice.update({
            where: { id: input.originalInvoiceId },
            data: {
                status: 'voided',
                voidedAt: new Date(),
            },
        });
        await tx.invoiceAuditEvent.create({
            data: {
                invoiceId: input.originalInvoiceId,
                type: 'voided',
                actor: 'System',
                message: `Invoice voided — credit note ${creditNoteNumber} issued`,
            },
        });
    }

    return creditNote;
}
