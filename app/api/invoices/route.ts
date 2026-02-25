import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CurrencyEnum = z.enum(["INR", "USD", "EUR", "GBP"]);
const InvoiceStatusEnum = z.enum(["draft", "pending", "paid", "overdue", "cancelled", "refunded"]);

const lineItemSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
    taxRatePct: z.number().min(0).default(18),
});

const createInvoiceSchema = z.object({
    invoiceNumber: z.string().min(1),
    customerId: z.string().uuid(),
    currency: CurrencyEnum.default("INR"),
    subtotal: z.number().min(0),
    taxTotal: z.number().min(0),
    discountPct: z.number().min(0).max(100).default(0),
    shipping: z.number().min(0).default(0),
    total: z.number().min(0),
    amountPaid: z.number().min(0).default(0),
    amountDue: z.number().min(0),
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
        if (status && InvoiceStatusEnum.safeParse(status).success) {
            where.status = status;
        }
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
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const data = createInvoiceSchema.parse(body);

        // Check unique invoice number
        const existing = await prisma.invoice.findUnique({
            where: { invoiceNumber: data.invoiceNumber },
        });
        if (existing) {
            return NextResponse.json({ error: "Invoice number already exists" }, { status: 409 });
        }

        // Check customer exists
        const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber: data.invoiceNumber,
                status: "draft",
                customerId: data.customerId,
                currency: data.currency,
                subtotal: data.subtotal,
                taxTotal: data.taxTotal,
                discountPct: data.discountPct,
                shipping: data.shipping,
                total: data.total,
                amountPaid: data.amountPaid,
                amountDue: data.amountDue,
                notes: data.notes,
                dueDate: new Date(data.dueDate),
                lineItems: {
                    create: data.lineItems.map((li) => ({
                        name: li.name,
                        description: li.description,
                        quantity: li.quantity,
                        unitPrice: li.unitPrice,
                        taxRatePct: li.taxRatePct,
                    })),
                },
                audit: {
                    create: {
                        type: "created",
                        actor: "System",
                        message: "Invoice created",
                    },
                },
            },
            include: { customer: true, lineItems: true, audit: true },
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
