import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { InvoiceStatusSchema } from "@/lib/contracts/validation";
import {
  isInvoiceImmutable,
  isValidInvoiceTransition,
} from "@/lib/services/invoice";
import { handleApiError, jsonError } from "@/lib/security/errors";
import { buildAuditContext } from "@/lib/security/request";
import { parseJsonBody } from "@/lib/security/validation";

const lineItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  taxRatePct: z.number().min(0).default(18),
  hsnCode: z.string().optional(),
});

const updateInvoiceSchema = z.object({
  status: z
    .preprocess(
      (val) => (typeof val === "string" ? val.toUpperCase() : val),
      InvoiceStatusSchema,
    )
    .optional(),
  subtotal: z.number().min(0).optional(),
  taxTotal: z.number().min(0).optional(),
  discountPct: z.number().min(0).max(100).optional(),
  shipping: z.number().min(0).optional(),
  total: z.number().min(0).optional(),
  amountPaid: z.number().min(0).optional(),
  amountDue: z.number().min(0).optional(),
  notes: z.string().nullable().optional(),
  dueDate: z.string().optional(),
  lineItems: z.array(lineItemSchema).optional(),
});

// ── GET /api/invoices/[id] ──────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        lineItems: true,
        audit: { orderBy: { createdAt: "asc" } },
        creditNotes: { include: { lineItems: true } },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("GET /api/invoices/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ── PUT /api/invoices/[id] ──────────────────────────────
// IMMUTABILITY: Only draft/pending invoices can be modified.
// Once paid/overdue/cancelled/refunded/voided, only status transitions are allowed.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAdmin(req);
    const { id } = await params;
    const data = await parseJsonBody(req, updateInvoiceSchema);
    const auditContext = buildAuditContext(req, user, { invoiceId: id });

    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) {
      return jsonError(404, "Invoice not found", "INVOICE_NOT_FOUND");
    }

    // IMMUTABILITY GUARD: If invoice is finalized, only allow status transitions
    if (isInvoiceImmutable(existing.status)) {
      // Only status changes allowed on immutable invoices
      if (!data.status) {
        return NextResponse.json(
          {
            error: `Invoice ${existing.invoiceNumber} is ${existing.status} and cannot be modified. Use credit notes for corrections.`,
          },
          { status: 403 },
        );
      }

      // Validate allowed status transition
      if (!isValidInvoiceTransition(existing.status, data.status)) {
        return NextResponse.json(
          {
            error: `Cannot transition from ${existing.status} to ${data.status}`,
          },
          { status: 400 },
        );
      }

      // Only apply the status change
      const invoice = await prisma.$transaction(async (tx) => {
        const updateData: any = { status: data.status };
        if (data.status === "VOIDED") updateData.voidedAt = new Date();

        const inv = await tx.invoice.update({
          where: { id },
          data: updateData,
          include: {
            customer: true,
            lineItems: true,
            audit: true,
            creditNotes: true,
          },
        });

        await tx.invoiceAuditEvent.create({
          data: {
            invoiceId: id,
            type: data.status!,
            actor: auditContext.actor,
            message: `Status changed from ${existing.status} to ${data.status}`,
          },
        });

        await tx.auditLog.create({
          data: {
            entityType: "Invoice",
            entityId: id,
            action: "status_changed",
            actor: auditContext.actor,
            before: { status: existing.status },
            after: { status: data.status },
            metadata: auditContext.metadata,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
          },
        });

        return inv;
      });

      return NextResponse.json(invoice);
    }

    // DRAFT/PENDING INVOICES: Allow full modification
    const invoice = await prisma.$transaction(async (tx) => {
      // Update line items if provided
      if (data.lineItems) {
        await tx.invoiceLineItem.deleteMany({ where: { invoiceId: id } });
        await tx.invoiceLineItem.createMany({
          data: data.lineItems.map((li) => ({
            invoiceId: id,
            name: li.name,
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            taxRatePct: li.taxRatePct,
            hsnCode: li.hsnCode,
          })),
        });
      }

      const { lineItems: _, ...invoiceData } = data;
      const statusChanged = data.status && data.status !== existing.status;

      const updateData: any = { ...invoiceData, lastUpdatedAt: new Date() };
      if (data.dueDate) updateData.dueDate = new Date(data.dueDate);

      // Set timestamp fields on status change
      if (statusChanged) {
        if (data.status === "PAID") updateData.paidAt = new Date();
        if (data.status === "CANCELLED") updateData.cancelledAt = new Date();
        if (data.status === "REFUNDED") updateData.refundedAt = new Date();
        if (data.status === "PENDING") updateData.sentAt = new Date();
        if (data.status === "VOIDED") updateData.voidedAt = new Date();
      }

      const inv = await tx.invoice.update({
        where: { id },
        data: updateData,
        include: {
          customer: true,
          lineItems: true,
          audit: true,
          creditNotes: true,
        },
      });

      // Add audit event
      await tx.invoiceAuditEvent.create({
        data: {
          invoiceId: id,
          type: statusChanged ? data.status! : "updated",
          actor: auditContext.actor,
          message: statusChanged
            ? `Status changed from ${existing.status} to ${data.status}`
            : "Invoice updated",
        },
      });

      return inv;
    });

    return NextResponse.json(invoice);
  } catch (error) {
    return handleApiError(error);
  }
}

// NOTE: DELETE endpoint has been REMOVED for compliance.
// Invoices must never be deleted. Use voiding + credit notes instead.
