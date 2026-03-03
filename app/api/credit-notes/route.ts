import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createCreditNote } from "@/services/invoiceService";

const creditNoteLineItemSchema = z.object({
    name: z.string().min(1),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
    taxRatePct: z.number().min(0).default(18),
    hsnCode: z.string().optional(),
});

const createCreditNoteSchema = z.object({
    originalInvoiceId: z.string().uuid(),
    orderId: z.string().optional(),
    reason: z.string().min(1),
    items: z.array(creditNoteLineItemSchema).min(1),
});

// ── GET /api/credit-notes ───────────────────────────────
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const invoiceId = searchParams.get("invoiceId");
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "50", 10);

        const where: any = {};
        if (invoiceId) where.originalInvoiceId = invoiceId;

        const [creditNotes, total] = await Promise.all([
            prisma.creditNote.findMany({
                where,
                include: {
                    lineItems: true,
                    originalInvoice: { select: { invoiceNumber: true, status: true } },
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.creditNote.count({ where }),
        ]);

        return NextResponse.json({ creditNotes, total, page, limit });
    } catch (error) {
        console.error("GET /api/credit-notes error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── POST /api/credit-notes ──────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const data = createCreditNoteSchema.parse(body);

        // Verify invoice exists and is in an appropriate status
        const invoice = await prisma.invoice.findUnique({
            where: { id: data.originalInvoiceId },
        });
        if (!invoice) {
            return NextResponse.json({ error: "Original invoice not found" }, { status: 404 });
        }
        if (invoice.status === "draft" || invoice.status === "cancelled") {
            return NextResponse.json(
                { error: `Cannot issue credit note against a ${invoice.status} invoice` },
                { status: 400 }
            );
        }

        const creditNote = await prisma.$transaction(async (tx) => {
            const cn = await createCreditNote(tx, {
                originalInvoiceId: data.originalInvoiceId,
                orderId: data.orderId,
                reason: data.reason,
                items: data.items,
            });

            // Log to unified audit
            await tx.auditLog.create({
                data: {
                    entityType: 'CreditNote',
                    entityId: cn.id,
                    action: 'created',
                    actor: 'System',
                    after: {
                        creditNoteNumber: cn.creditNoteNumber,
                        originalInvoiceId: data.originalInvoiceId,
                        total: cn.total,
                        reason: data.reason,
                    },
                },
            });

            return cn;
        });

        return NextResponse.json(creditNote, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("POST /api/credit-notes error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
