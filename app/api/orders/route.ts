import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { calculateOrderFinancials } from "@/lib/tax-engine";
import { reserveInventory, InsufficientStockError } from "@/services/inventoryService";
import { createPaymentTransaction } from "@/services/paymentService";
import { sendMail } from "@/services/mailService";

const CategoryEnum = z.enum([
    "PROCESSOR", "GPU", "MOTHERBOARD", "RAM", "STORAGE",
    "PSU", "CABINET", "COOLER", "MONITOR", "PERIPHERAL", "NETWORKING", "LAPTOP",
]);

const OrderStatusEnum = z.enum([
    "PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED",
]);

const SalesChannelEnum = z.enum(["ONLINE", "POS", "MANUAL", "API", "PHONE"]);
const PaymentMethodEnum = z.enum(["CARD", "UPI", "BANK_TRANSFER", "CASH", "WALLET"]);

const orderItemSchema = z.object({
    productId: z.string().min(1),
    variantId: z.string().min(1),
    name: z.string().min(1),
    category: CategoryEnum,
    price: z.number().positive(),
    quantity: z.number().int().positive(),
    image: z.string().optional(),
    sku: z.string().optional(),
});

const createOrderSchema = z.object({
    id: z.string().min(1),
    channel: SalesChannelEnum.default("ONLINE"),
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
        const channel = searchParams.get("channel");
        const email = searchParams.get("email");
        const search = searchParams.get("search");
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "50", 10);

        const where: any = {};
        if (status && OrderStatusEnum.safeParse(status).success) {
            where.status = status;
        }
        if (channel && SalesChannelEnum.safeParse(channel).success) {
            where.channel = channel;
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
                    channel: true,
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

            // Fetch variants to populate variantSnapshot
            const variantIds = data.items.map(i => i.variantId);
            const variants = await tx.productVariant.findMany({
                where: { id: { in: variantIds } },
                include: { product: true }
            });
            const variantMap = new Map(variants.map(v => [v.id, v]));

            // Create the order
            const o = await tx.order.create({
                data: {
                    id: data.id,
                    channel: data.channel,
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
                    paymentStatus: data.paymentStatus,
                    idempotencyKey: data.idempotencyKey,
                    source: data.source,
                    items: {
                        create: data.items.map((item) => {
                            const variant = variantMap.get(item.variantId);
                            // Only store essential serializable data
                            const variantSnapshot = variant ? {
                                id: variant.id,
                                sku: variant.sku,
                                price: variant.price,
                                productName: variant.product.name,
                                category: item.category,
                                attributes: variant.attributes
                            } : null;

                            return {
                                variantId: item.variantId,
                                name: item.name,
                                category: item.category,
                                price: item.price,
                                quantity: item.quantity,
                                image: item.image,
                                sku: item.sku,
                                variantSnapshot: variantSnapshot as any,
                            };
                        }),
                    },
                    logs: {
                        create: {
                            status: "PENDING",
                            note: `Order placed via ${data.channel} channel.`,
                        },
                    },
                },
                include: { items: true, logs: true },
            });

            // Reserve inventory using centralized service
            const inventoryItems = o.items.map(i => ({
                variantId: i.variantId,
                quantity: i.quantity,
                orderItemId: i.id,
            }));
            await reserveInventory(tx, inventoryItems, data.id);

            // For POS/CASH orders, create payment transaction and auto-mark as PAID
            if (data.channel === "POS" && data.paymentMethod) {
                await createPaymentTransaction(tx, {
                    orderId: data.id,
                    method: data.paymentMethod as any,
                    amount: total,
                    idempotencyKey: `pay-${data.id}-${Date.now()}`,
                    status: 'COMPLETED',
                    metadata: { channel: data.channel },
                });

                // Auto-transition POS orders to PAID
                await tx.order.update({
                    where: { id: data.id },
                    data: {
                        status: "PAID",
                        paymentStatus: "COMPLETED",
                        logs: {
                            create: {
                                status: "PAID",
                                note: "POS payment — auto-confirmed.",
                            },
                        },
                    },
                });
            }

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
                    
                    <p style="margin-top: 20px; color: #666; font-size: 14px;">We will notify you once your order has been processed and shipped.</p>
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
        if (error instanceof InsufficientStockError) {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }
        if (error?.message?.includes("Insufficient stock")) {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }
        console.error("POST /api/orders error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
