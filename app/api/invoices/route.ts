import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { calculateTax, type TaxLineInput } from "@/lib/tax-engine";
import { handleApiError, jsonError } from "@/lib/security/errors";
import { buildAuditContext } from "@/lib/security/request";
import { parseJsonBody } from "@/lib/security/validation";

const CurrencyEnum = z.enum(["INR", "USD", "EUR", "GBP"]);

const lineItemSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
    taxRatePct: z.number().min(0).default(18),
    hsnCode: z.string().optional(),
});

const createInvoiceSchema = z.object({
    customerId: z.string().uuid(),
    orderId: z.string().optional(),
    currency: CurrencyEnum.default("INR"),
    discountPct: z.number().min(0).max(100).default(0),
    shipping: z.number().min(0).default(0),
    notes: z.string().optional(),
    dueDate: z.string(),
    lineItems: z.array(lineItemSchema).min(1),
});

// ── GET /api/invoices ───────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const customerId = searchParams.get("customerId");
        const search = searchParams.get("search");
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "50", 10);

        const where: any = {};
        if (status) where.status = status;
        if (customerId) where.customerId = customerId;
        if (search) {
            where.OR = [
                { invoiceNumber: { contains: search, mode: "insensitive" } },
            ];
        }

        const [invoices, total] = await Promise.all([
            prisma.invoice.findMany({
                where,
                select: {
                    id: true,
                    invoiceNumber: true,
                    orderId: true,
                    type: true,
                    status: true,
                    currency: true,
                    subtotal: true,
                    taxTotal: true,
                    discountPct: true,
                    shipping: true,
                    total: true,
                    amountPaid: true,
                    amountDue: true,
                    notes: true,
                    createdAt: true,
                    dueDate: true,
                    paidAt: true,
                    customer: { select: { id: true, name: true, email: true } },
                    _count: { select: { lineItems: true } },
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.invoice.count({ where }),
        ]);

        return NextResponse.json({ invoices, total, page, limit });
    } catch (error) {
        console.error("GET /api/invoices error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── POST /api/invoices ──────────────────────────────────
// Manual invoice creation (for manual/billing-only invoices, not order-linked)
// Invoice number is generated server-side (sequential)
export async function POST(req: NextRequest) {
    try {
        const user = await requireAdmin(req);
        const data = await parseJsonBody(req, createInvoiceSchema);
        const auditContext = buildAuditContext(req, user, {
            orderId: data.orderId ?? null,
            customerId: data.customerId,
        });

        // Check customer exists
        const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
        if (!customer) {
            return jsonError(404, "Customer not found", "CUSTOMER_NOT_FOUND");
        }

        const invoice = await prisma.$transaction(async (tx) => {
            // Server-side sequential invoice number
            const seq = await tx.invoiceSequence.upsert({
                where: { id: 'invoice_seq' },
                update: { currentValue: { increment: 1 } },
                create: { id: 'invoice_seq', currentValue: 1 },
            });
            const now = new Date();
            const yy = String(now.getFullYear()).slice(-2);
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const invoiceNumber = `INV-${yy}${mm}-${String(seq.currentValue).padStart(6, '0')}`;

            // Calculate totals via unified tax engine
            const taxInputs: TaxLineInput[] = data.lineItems.map(li => ({
                unitPrice: li.unitPrice,
                quantity: li.quantity,
                taxRatePct: li.taxRatePct,
                hsnCode: li.hsnCode,
            }));
            const taxResult = calculateTax({ items: taxInputs });

            // Apply discount
            const discountAmount = taxResult.subtotal * (data.discountPct / 100);
            const totalAfterDiscount = taxResult.grandTotal - discountAmount + data.shipping;

            const inv = await tx.invoice.create({
                data: {
                    invoiceNumber,
                    orderId: data.orderId,
                    type: 'STANDARD',
                    status: "DRAFT",
                    customerId: data.customerId,
                    currency: data.currency,
                    subtotal: taxResult.subtotal,
                    taxTotal: taxResult.totalTax,
                    discountPct: data.discountPct,
                    shipping: data.shipping,
                    total: Math.round(totalAfterDiscount * 100) / 100,
                    amountPaid: 0,
                    amountDue: Math.round(totalAfterDiscount * 100) / 100,
                    notes: data.notes,
                    dueDate: new Date(data.dueDate),
                    lineItems: {
                        create: data.lineItems.map((li) => ({
                            name: li.name,
                            description: li.description,
                            quantity: li.quantity,
                            unitPrice: li.unitPrice,
                            taxRatePct: li.taxRatePct,
                            hsnCode: li.hsnCode,
                        })),
                    },
                    audit: {
                        create: {
                            type: "created",
                            actor: auditContext.actor,
                            message: "Invoice created (manual)",
                        },
                    },
                },
                include: { customer: true, lineItems: true, audit: true },
            });

            // Log to unified audit
            await tx.auditLog.create({
                data: {
                    entityType: 'Invoice',
                    entityId: inv.id,
                    action: 'created',
                    actor: auditContext.actor,
                    after: { invoiceNumber, status: 'DRAFT', total: totalAfterDiscount },
                    metadata: auditContext.metadata,
                    ipAddress: auditContext.ipAddress,
                    userAgent: auditContext.userAgent,
                },
            });

            return inv;
        });

        return NextResponse.json(invoice, { status: 201 });
    } catch (error) {
        return handleApiError(error);
    }
}
