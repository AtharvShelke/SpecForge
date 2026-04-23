/**
 * billing.service.ts — Enterprise-grade billing logic.
 *
 * Invoice lifecycle:  DRAFT → PENDING → PAID / OVERDUE
 * Terminal states:    VOIDED, CANCELLED, REFUNDED
 *
 * Every mutation logs an InvoiceAuditEvent for traceability.
 */

import { prisma } from "@/lib/prisma";
import { ServiceError } from "./catalog.service";

// ─────────────────────────────────────────────────────────────────────────────
// VALID STATUS TRANSITIONS
// ─────────────────────────────────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["PENDING", "VOIDED", "CANCELLED"],
  PENDING: ["PAID", "OVERDUE", "VOIDED", "CANCELLED"],
  OVERDUE: ["PAID", "VOIDED", "CANCELLED"],
  PAID: ["REFUNDED"],
  // Terminal states — no outbound transitions
  VOIDED: [],
  CANCELLED: [],
  REFUNDED: [],
};

function assertTransition(from: string, to: string) {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    throw new ServiceError(
      `Invalid invoice transition: ${from} → ${to}`,
      400
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LIST
// ─────────────────────────────────────────────────────────────────────────────

export async function listInvoices(filters?: {
  status?: string;
  customerId?: string;
  orderId?: string;
}) {
  const where: any = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.customerId) where.customerId = filters.customerId;
  if (filters?.orderId) where.orderId = filters.orderId;

  return prisma.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { customer: true, lineItems: true, audit: { orderBy: { createdAt: "desc" } } },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET BY ID (with full audit trail)
// ─────────────────────────────────────────────────────────────────────────────

export async function getInvoiceById(id: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      lineItems: true,
      order: true,
      audit: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!invoice) throw new ServiceError("Invoice not found", 404);
  return invoice;
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────────────────────

export async function createInvoice(data: {
  customerId: string;
  orderId?: string;
  type?: string;
  subtotal?: number;
  taxTotal?: number;
  discountPct?: number;
  shipping?: number;
  total?: number;
  amountPaid?: number;
  amountDue?: number;
  dueDate: string;
  notes?: string;
  lineItems?: Array<{
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    taxRatePct?: number;
    hsnCode?: string;
  }>;
}) {
  if (!data.customerId)
    throw new ServiceError("Customer ID is required");
  if (!data.dueDate)
    throw new ServiceError("Due Date is required");

  return prisma.$transaction(async (tx) => {
    // 1. Atomically increment sequence
    const sequence = await tx.invoiceSequence.upsert({
      where: { id: "invoice_seq" },
      update: { currentValue: { increment: 1 } },
      create: { id: "invoice_seq", currentValue: 1 },
    });

    const invoiceNumber = `INV-${String(sequence.currentValue).padStart(6, "0")}`;

    // 2. Auto-compute totals from line items if not provided
    let subtotal = data.subtotal ?? 0;
    let taxTotal = data.taxTotal ?? 0;

    if (data.lineItems && data.lineItems.length > 0 && !data.subtotal) {
      subtotal = data.lineItems.reduce(
        (sum, li) => sum + li.quantity * li.unitPrice,
        0
      );
      taxTotal = data.lineItems.reduce(
        (sum, li) =>
          sum +
          li.quantity * li.unitPrice * ((li.taxRatePct ?? 18) / 100),
        0
      );
    }

    const shipping = data.shipping ?? 0;
    const discountPct = data.discountPct ?? 0;
    const discountAmount = subtotal * (discountPct / 100);
    const total =
      data.total ?? subtotal + taxTotal + shipping - discountAmount;
    const amountPaid = data.amountPaid ?? 0;
    const amountDue = data.amountDue ?? total - amountPaid;

    // 3. Build invoice payload
    const invoiceData: any = {
      invoiceNumber,
      customerId: data.customerId,
      orderId: data.orderId,
      type: data.type || "STANDARD",
      status: "DRAFT",
      subtotal,
      taxTotal,
      discountPct,
      shipping,
      total,
      amountPaid,
      amountDue,
      dueDate: new Date(data.dueDate),
      notes: data.notes,
    };

    if (data.lineItems && data.lineItems.length > 0) {
      invoiceData.lineItems = {
        create: data.lineItems.map((item) => ({
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRatePct: item.taxRatePct ?? 18,
          hsnCode: item.hsnCode,
        })),
      };
    }

    // 4. Create invoice
    const invoice = await tx.invoice.create({
      data: invoiceData,
      include: { lineItems: true, audit: true },
    });

    // 5. Audit event
    await tx.invoiceAuditEvent.create({
      data: {
        invoiceId: invoice.id,
        type: "CREATED",
        actor: "System",
        message: `Invoice ${invoiceNumber} created as DRAFT (Total: ₹${total.toFixed(2)})`,
      },
    });

    return invoice;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────────────────────

export async function updateInvoice(
  id: string,
  data: Record<string, any>
) {
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new ServiceError("Invoice not found", 404);

  const actor = data.actor ?? "System";

  return prisma.$transaction(async (tx) => {
    const updateData = { ...data };
    delete updateData.actor;

    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    }

    const updated = await tx.invoice.update({
      where: { id },
      data: updateData,
      include: { lineItems: true, audit: { orderBy: { createdAt: "desc" } } },
    });

    await tx.invoiceAuditEvent.create({
      data: {
        invoiceId: id,
        type: "UPDATED",
        actor,
        message: `Invoice updated`,
      },
    });

    return updated;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PAY (partial payment support)
// ─────────────────────────────────────────────────────────────────────────────

export async function payInvoice(
  id: string,
  data: { amount?: number; note?: string; actor?: string }
) {
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new ServiceError("Invoice not found", 404);
  if (invoice.status === "PAID")
    throw new ServiceError("Invoice is already fully paid", 400);
  if (invoice.status === "VOIDED" || invoice.status === "CANCELLED")
    throw new ServiceError(`Cannot pay a ${invoice.status} invoice`, 400);

  const actor = data.actor ?? "System";
  const paymentAmount =
    data.amount !== undefined ? Number(data.amount) : Number(invoice.amountDue);

  if (paymentAmount <= 0)
    throw new ServiceError("Payment amount must be positive", 400);

  const newAmountPaid = Number(invoice.amountPaid) + paymentAmount;
  const newAmountDue = Math.max(0, Number(invoice.total) - newAmountPaid);
  const isFullyPaid = newAmountDue <= 0;

  // Determine next status
  let newStatus = invoice.status as string;
  if (isFullyPaid) {
    newStatus = "PAID";
  } else if (invoice.status === "DRAFT") {
    newStatus = "PENDING";
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.invoice.update({
      where: { id },
      data: {
        amountPaid: newAmountPaid,
        amountDue: newAmountDue,
        status: newStatus as any,
        paidAt: isFullyPaid ? new Date() : undefined,
      },
      include: { lineItems: true, audit: { orderBy: { createdAt: "desc" } } },
    });

    await tx.invoiceAuditEvent.create({
      data: {
        invoiceId: id,
        type: isFullyPaid ? "PAYMENT_COMPLETED" : "PARTIAL_PAYMENT",
        actor,
        message:
          data.note ||
          `Payment of ₹${paymentAmount.toFixed(2)} received. ${isFullyPaid ? "Invoice fully paid." : `Remaining due: ₹${newAmountDue.toFixed(2)}`}`,
      },
    });

    return updated;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SEND
// ─────────────────────────────────────────────────────────────────────────────

export async function sendInvoice(
  id: string,
  data: { note?: string; actor?: string }
) {
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new ServiceError("Invoice not found", 404);
  if (["VOIDED", "CANCELLED"].includes(invoice.status))
    throw new ServiceError(`Cannot send a ${invoice.status} invoice`, 400);

  const actor = data.actor ?? "System";
  const now = new Date();

  let nextStatus = invoice.status as string;
  if (invoice.status === "DRAFT") {
    nextStatus = invoice.dueDate < now ? "OVERDUE" : "PENDING";
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.invoice.update({
      where: { id },
      data: { sentAt: now, status: nextStatus as any },
      include: { lineItems: true, audit: { orderBy: { createdAt: "desc" } } },
    });

    await tx.invoiceAuditEvent.create({
      data: {
        invoiceId: id,
        type: "SENT",
        actor,
        message:
          data.note ||
          `Invoice sent to customer. Status → ${nextStatus}`,
      },
    });

    return updated;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// VOID
// ─────────────────────────────────────────────────────────────────────────────

export async function voidInvoice(
  id: string,
  data: { reason?: string; actor?: string }
) {
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new ServiceError("Invoice not found", 404);

  assertTransition(invoice.status, "VOIDED");

  const actor = data.actor ?? "System";

  return prisma.$transaction(async (tx) => {
    const updated = await tx.invoice.update({
      where: { id },
      data: { status: "VOIDED", voidedAt: new Date() },
      include: { lineItems: true, audit: { orderBy: { createdAt: "desc" } } },
    });

    await tx.invoiceAuditEvent.create({
      data: {
        invoiceId: id,
        type: "VOIDED",
        actor,
        message:
          data.reason || `Invoice voided by ${actor}`,
      },
    });

    return updated;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CANCEL
// ─────────────────────────────────────────────────────────────────────────────

export async function cancelInvoice(
  id: string,
  data: { reason?: string; actor?: string }
) {
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new ServiceError("Invoice not found", 404);

  assertTransition(invoice.status, "CANCELLED");

  const actor = data.actor ?? "System";

  return prisma.$transaction(async (tx) => {
    const updated = await tx.invoice.update({
      where: { id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
      include: { lineItems: true, audit: { orderBy: { createdAt: "desc" } } },
    });

    await tx.invoiceAuditEvent.create({
      data: {
        invoiceId: id,
        type: "CANCELLED",
        actor,
        message:
          data.reason || `Invoice cancelled by ${actor}`,
      },
    });

    return updated;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CREDIT NOTE
// ─────────────────────────────────────────────────────────────────────────────

export async function createCreditNote(
  originalInvoiceId: string,
  data: {
    reason?: string;
    actor?: string;
    lineItems?: Array<{
      name: string;
      description?: string;
      quantity: number;
      unitPrice: number;
      taxRatePct?: number;
      hsnCode?: string;
    }>;
  }
) {
  const original = await prisma.invoice.findUnique({
    where: { id: originalInvoiceId },
    include: { lineItems: true },
  });
  if (!original) throw new ServiceError("Original invoice not found", 404);
  if (original.status !== "PAID")
    throw new ServiceError("Credit notes can only be issued against PAID invoices", 400);

  const actor = data.actor ?? "System";

  // Use provided line items or mirror the original invoice
  const creditLineItems =
    data.lineItems && data.lineItems.length > 0
      ? data.lineItems
      : original.lineItems.map((li) => ({
          name: `[CREDIT] ${li.name}`,
          description: li.description || undefined,
          quantity: li.quantity,
          unitPrice: Number(li.unitPrice),
          taxRatePct: Number(li.taxRatePct),
          hsnCode: li.hsnCode || undefined,
        }));

  return prisma.$transaction(async (tx) => {
    // 1. Increment sequence
    const sequence = await tx.invoiceSequence.upsert({
      where: { id: "invoice_seq" },
      update: { currentValue: { increment: 1 } },
      create: { id: "invoice_seq", currentValue: 1 },
    });

    const invoiceNumber = `CN-${String(sequence.currentValue).padStart(6, "0")}`;

    // 2. Compute credit totals
    const subtotal = creditLineItems.reduce(
      (sum, li) => sum + li.quantity * li.unitPrice,
      0
    );
    const taxTotal = creditLineItems.reduce(
      (sum, li) =>
        sum +
        li.quantity * li.unitPrice * ((li.taxRatePct ?? 18) / 100),
      0
    );
    const total = subtotal + taxTotal;

    // 3. Create credit note invoice
    const creditNote = await tx.invoice.create({
      data: {
        invoiceNumber,
        customerId: original.customerId,
        orderId: original.orderId,
        type: "CREDIT_NOTE",
        status: "PAID",
        subtotal,
        taxTotal,
        discountPct: 0,
        shipping: 0,
        total,
        amountPaid: total,
        amountDue: 0,
        dueDate: new Date(),
        paidAt: new Date(),
        notes: data.reason || `Credit note against ${original.invoiceNumber}`,
        lineItems: {
          create: creditLineItems.map((item) => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRatePct: item.taxRatePct ?? 18,
            hsnCode: item.hsnCode,
          })),
        },
      },
      include: { lineItems: true, audit: true },
    });

    // 4. Mark original as REFUNDED
    await tx.invoice.update({
      where: { id: originalInvoiceId },
      data: { status: "REFUNDED", refundedAt: new Date() },
    });

    // 5. Audit both invoices
    await tx.invoiceAuditEvent.create({
      data: {
        invoiceId: originalInvoiceId,
        type: "REFUNDED",
        actor,
        message: `Refunded via credit note ${invoiceNumber}. Reason: ${data.reason || "N/A"}`,
      },
    });

    await tx.invoiceAuditEvent.create({
      data: {
        invoiceId: creditNote.id,
        type: "CREATED",
        actor,
        message: `Credit note ${invoiceNumber} created against invoice ${original.invoiceNumber}`,
      },
    });

    return creditNote;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT TRAIL (standalone)
// ─────────────────────────────────────────────────────────────────────────────

export async function getInvoiceAuditTrail(invoiceId: string) {
  return prisma.invoiceAuditEvent.findMany({
    where: { invoiceId },
    orderBy: { createdAt: "desc" },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BILLING PROFILE
// ─────────────────────────────────────────────────────────────────────────────

export async function getBillingProfile() {
  return prisma.billingProfile.findFirst();
}

export async function upsertBillingProfile(data: any) {
  const profile = await prisma.billingProfile.findFirst();

  if (profile) {
    return prisma.billingProfile.update({
      where: { id: profile.id },
      data,
    });
  }

  return prisma.billingProfile.create({
    data,
  });
}
