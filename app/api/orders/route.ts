import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CategoryEnum = z.enum([
    "PROCESSOR", "GPU", "MOTHERBOARD", "RAM", "STORAGE",
    "PSU", "CABINET", "COOLER", "MONITOR", "PERIPHERAL", "NETWORKING",
]);

const OrderStatusEnum = z.enum([
    "PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED",
]);

const orderItemSchema = z.object({
    productId: z.string().min(1),
    name: z.string().min(1),
    category: CategoryEnum,
    price: z.number().positive(),
    quantity: z.number().int().positive(),
    image: z.string().optional(),
    sku: z.string().optional(),
});

const createOrderSchema = z.object({
    id: z.string().min(1), // Must be provided (e.g. ORD-xxx)
    customerName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    total: z.number().positive(),
    shippingStreet: z.string().optional(),
    shippingCity: z.string().optional(),
    shippingState: z.string().optional(),
    shippingZip: z.string().optional(),
    shippingCountry: z.string().optional(),
    paymentMethod: z.string().optional(),
    paymentTransactionId: z.string().optional(),
    paymentStatus: z.string().optional(),
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
                include: { items: true, logs: { orderBy: { timestamp: "asc" } } },
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

        const order = await prisma.$transaction(async (tx) => {
            // Bulk fetch inventory
            const productIds = data.items.map(i => i.productId);
            const products = await tx.product.findMany({
                where: { id: { in: productIds } },
                include: { inventoryItem: true }
            });
            const productMap = new Map(products.map(p => [p.id, p]));

            const inventoryUpdates = [];
            const stockMovements = [];
            let total = 0;

            for (const item of data.items) {
                const product = productMap.get(item.productId);
                if (!product || !product.inventoryItem) {
                    throw new Error(`Insufficient stock or product not found: ${item.productId}`);
                }
                if (product.inventoryItem.quantity < item.quantity) {
                    throw new Error(`Insufficient stock for product ${item.productId}`);
                }

                total += product.price * item.quantity;

                inventoryUpdates.push({
                    id: product.inventoryItem.id,
                    quantity: product.inventoryItem.quantity - item.quantity,
                    reserved: product.inventoryItem.reserved + item.quantity
                });

                stockMovements.push({
                    inventoryItemId: product.inventoryItem.id,
                    type: "RESERVE" as const,
                    quantity: item.quantity,
                    reason: `Order ${data.id} placed`,
                    performedBy: "System",
                });
            }

            // Create the order
            const o = await tx.order.create({
                data: {
                    id: data.id,
                    customerName: data.customerName,
                    email: data.email,
                    phone: data.phone,
                    total: data.total, // Depending on trust level, can use total from server calculation here instead
                    status: "PENDING",
                    shippingStreet: data.shippingStreet,
                    shippingCity: data.shippingCity,
                    shippingState: data.shippingState,
                    shippingZip: data.shippingZip,
                    shippingCountry: data.shippingCountry,
                    paymentMethod: data.paymentMethod,
                    paymentTransactionId: data.paymentTransactionId,
                    paymentStatus: data.paymentStatus,
                    items: {
                        create: data.items.map((item) => ({
                            productId: item.productId,
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
                            note: "Order placed successfully.",
                        },
                    },
                },
                include: { items: true, logs: true },
            });

            // Apply updates in batch
            for (const update of inventoryUpdates) {
                await tx.inventoryItem.update({
                    where: { id: update.id },
                    data: {
                        quantity: update.quantity,
                        reserved: update.reserved,
                        lastUpdated: new Date()
                    }
                });
            }

            if (stockMovements.length > 0) {
                await tx.stockMovement.createMany({
                    data: stockMovements
                });
            }

            return o;
        });

        return NextResponse.json(order, { status: 201 });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        if (error?.message?.includes("Insufficient stock")) {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }
        console.error("POST /api/orders error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
