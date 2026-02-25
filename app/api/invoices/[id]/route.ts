import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const InvoiceStatusEnum = z.enum(["draft", "pending", "paid", "overdue", "cancelled", "refunded"]);

const lineItemSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
    taxRatePct: z.number().min(0).default(18),
});

const updateInvoiceSchema = z.object({
    status: InvoiceStatusEnum.optional(),
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
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                customer: true,
                lineItems: true,
                audit: { orderBy: { createdAt: "asc" } },
            },
        });

        if (!invoice) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        return NextResponse.json(invoice);
    } catch (error) {
        console.error("GET /api/invoices/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── PUT /api/invoices/[id] ──────────────────────────────
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const data = updateInvoiceSchema.parse(body);

        const existing = await prisma.invoice.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

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
                    })),
                });
            }

            const { lineItems: _, ...invoiceData } = data;
            const statusChanged = data.status && data.status !== existing.status;

            const updateData: any = { ...invoiceData, lastUpdatedAt: new Date() };
            if (data.dueDate) updateData.dueDate = new Date(data.dueDate);

            // Set timestamp fields on status change
            if (statusChanged) {
                if (data.status === "paid") updateData.paidAt = new Date();
                if (data.status === "cancelled") updateData.cancelledAt = new Date();
                if (data.status === "refunded") updateData.refundedAt = new Date();
                if (data.status === "pending") updateData.sentAt = new Date();
            }

            const inv = await tx.invoice.update({
                where: { id },
                data: updateData,
                include: { customer: true, lineItems: true, audit: true },
            });

            // Add audit event
            await tx.invoiceAuditEvent.create({
                data: {
                    invoiceId: id,
                    type: statusChanged ? data.status! : "updated",
                    actor: "System",
                    message: statusChanged
                        ? `Status changed from ${existing.status} to ${data.status}`
                        : "Invoice updated",
                },
            });

            return inv;
        });

        return NextResponse.json(invoice);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("PUT /api/invoices/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
