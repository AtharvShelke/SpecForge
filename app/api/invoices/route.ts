import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { calculateTax, type TaxLineInput } from "@/lib/tax-engine";

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
                include: {
                    customer: true,
                    lineItems: true,
                    audit: { orderBy: { createdAt: "asc" } },
                    creditNotes: { include: { lineItems: true } },
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
        const body = await req.json();
        const data = createInvoiceSchema.parse(body);

        // Check customer exists
        const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
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
                    status: "draft",
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
                            actor: "System",
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
                    actor: 'System',
                    after: { invoiceNumber, status: 'draft', total: totalAfterDiscount },
                },
            });

            return inv;
        });

        return NextResponse.json(invoice, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("POST /api/invoices error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
