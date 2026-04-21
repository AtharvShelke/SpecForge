import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { calculateOrderFinancials } from "@/lib/tax-engine";
import { reserveInventory, InsufficientStockError } from "@/services/inventoryService";
import { createPaymentTransaction } from "@/services/paymentService";
import { sendMail } from "@/services/mailService";

const OrderStatusEnum = z.enum([
    "PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED",
]);

const PaymentMethodEnum = z.enum(["RAZORPAY", "UPI", "BANK_TRANSFER"]);

const orderItemSchema = z.object({
    productId: z.string().min(1),
    variantId: z.string().min(1),
    name: z.string().min(1),
    category: z.string().min(1),
    price: z.number().positive(),
    quantity: z.number().int().positive(),
    image: z.string().optional(),
    sku: z.string().optional(),
});

const createOrderSchema = z.object({
    id: z.string().min(1),
    customerName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    total: z.number().positive(),
    shippingStreet: z.string().optional(),
    shippingCity: z.string().optional(),
    shippingState: z.string().optional(),
    shippingZip: z.string().optional(),
    shippingCountry: z.string().optional(),
    paymentMethod: PaymentMethodEnum.optional(),
    paymentTransactionId: z.string().optional(),
    paymentStatus: z.string().optional(),
    idempotencyKey: z.string().optional(),
    source: z.record(z.string(), z.any()).optional(),
    items: z.array(orderItemSchema).min(1),
});

// ── GET /api/orders ─────────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const email = searchParams.get("email");
        const search = searchParams.get("search");
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "50", 10);

        const where: any = {};
        if (status && OrderStatusEnum.safeParse(status).success) {
            where.status = status;
        }
        if (email) where.email = email;
        if (search) {
            where.OR = [
                { id: { contains: search, mode: "insensitive" } },
                { customerName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                select: {
                    id: true,
                    customerName: true,
                    email: true,
                    phone: true,
                    date: true,
                    subtotal: true,
                    gstAmount: true,
                    taxAmount: true,
                    discountAmount: true,
                    total: true,
                    status: true,
                    customerId: true,
                    paymentMethod: true,
                    paymentStatus: true,
                    createdAt: true,
                    items: {
                        select: { id: true, variantId: true, name: true, category: true, price: true, quantity: true, image: true, sku: true },
                    },
                    logs: {
                        select: { id: true, status: true, timestamp: true, note: true },
                        orderBy: { timestamp: 'asc' as const },
                    },
                    shippingStreet: true,
                    shippingCity: true,
                    shippingState: true,
                    shippingZip: true,
                    shippingCountry: true,
                },
                orderBy: { date: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.order.count({ where }),
        ]);

        return NextResponse.json({ orders, total, page, limit });
    } catch (error) {
        console.error("GET /api/orders error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── POST /api/orders ────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const data = createOrderSchema.parse(body);

        // Idempotency check
        if (data.idempotencyKey) {
            const existingOrder = await prisma.order.findUnique({
                where: { idempotencyKey: data.idempotencyKey },
                include: { items: true, logs: true },
            });
            if (existingOrder) return NextResponse.json(existingOrder, { status: 200 });
        }

        const order = await prisma.$transaction(async (tx) => {
            // Calculate financials using unified tax engine
            const calculationItems = data.items.map(i => ({
                price: i.price,
                quantity: i.quantity,
            }));
            const { subtotal, gstAmount, taxAmount, total } = calculateOrderFinancials(calculationItems);

            // Find or create customer
            let customer = await tx.customer.findFirst({ where: { email: data.email } });
            if (!customer) {
                customer = await tx.customer.create({
                    data: {
                        name: data.customerName,
                        email: data.email,
                        phone: data.phone,
                    },
                });
            }

            // Create the order
            const o = await tx.order.create({
                data: {
                    id: data.id,
                    customerName: data.customerName,
                    email: data.email,
                    phone: data.phone,
                    customerId: customer.id,
                    subtotal,
                    gstAmount,
                    taxAmount,
                    discountAmount: 0,
                    total: total,
                    status: "PENDING",
                    shippingStreet: data.shippingStreet,
                    shippingCity: data.shippingCity,
                    shippingState: data.shippingState,
                    shippingZip: data.shippingZip,
                    shippingCountry: data.shippingCountry,
                    paymentMethod: data.paymentMethod,
                    paymentTransactionId: data.paymentTransactionId,
                    paymentStatus: data.paymentStatus as any,
                    idempotencyKey: data.idempotencyKey,
                    source: data.source,
                    items: {
                        create: data.items.map((item) => ({
                            variantId: item.variantId,
                            name: item.name,
                            category: item.category,
                            price: item.price,
                            quantity: item.quantity,
                            image: item.image,
                            sku: item.sku,
                        })),
                    },
                    logs: {
                        create: {
                            status: "PENDING",
                            note: `Order placed.`,
                        },
                    },
                },
                include: { items: true, logs: true },
            });

            // Reserve inventory using centralized service
            const inventoryItems = data.items.map(i => ({
                variantId: i.variantId,
                quantity: i.quantity,
            }));
            await reserveInventory(tx, inventoryItems, data.id);

            return o;
        }, {
            maxWait: 5000,
            timeout: 15000,
        });

        // Send order confirmation email asynchronously
        sendMail({
            to: order.email,
            subject: `Order Confirmation - ${order.id}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <h2 style="color: #0056b3;">Thank you for your order, ${order.customerName}!</h2>
                    <p>Your order <strong>${order.id}</strong> has been successfully placed.</p>
                    <p><strong>Total Amount:</strong> ₹${order.total.toFixed(2)}</p>
                    
                    <h3 style="border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 20px;">Order Summary</h3>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
                        <ul style="list-style: none; padding: 0; margin: 0;">
                            ${order.items.map((item: any) => `
                                <li style="margin-bottom: 10px; border-bottom: 1px solid #eaeaea; padding-bottom: 10px;">
                                    <strong>${item.name}</strong><br />
                                    <span>Quantity: ${item.quantity}</span> | <span>Price: ₹${(item.price * item.quantity).toFixed(2)}</span>
                                </li>
                            `).join("")}
                        </ul>
                    </div>
                </div>
            `,
        }).catch((err) => {
            console.error("Failed to send order confirmation email:", err);
        });

        return NextResponse.json(order, { status: 201 });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        if (error instanceof InsufficientStockError || error?.message?.includes("Insufficient stock")) {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }
        console.error("POST /api/orders error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
