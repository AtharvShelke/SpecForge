import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const OrderStatusEnum = z.enum([
    "PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED",
]);

const updateOrderSchema = z.object({
    status: OrderStatusEnum,
    note: z.string().optional(),
});

// ── GET /api/orders/[id] ────────────────────────────────
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: true,
                logs: { orderBy: { timestamp: "asc" } },
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error("GET /api/orders/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── PATCH /api/orders/[id] ──────────────────────────────
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const data = updateOrderSchema.parse(body);

        const startTime = Date.now();

        const order = await prisma.$transaction(async (tx) => {
            const existing = await tx.order.findUnique({
                where: { id },
                include: { items: true },
            });
            if (!existing) throw new Error("NOT_FOUND");

            const oldStatus = existing.status;
            const newStatus = data.status;

            // Only run inventory loops if the state is actually changing
            if (oldStatus !== newStatus) {
                // Pre-fetch all necessary inventory items to avoid N+1 queries
                const productIds = existing.items.map(i => i.productId);
                const inventoryItems = await tx.inventoryItem.findMany({
                    where: { productId: { in: productIds } },
                });
                const invMap = new Map(inventoryItems.map(i => [i.productId, i]));

                const inventoryUpdates: Promise<any>[] = [];
                const stockMovements: any[] = [];
                const productUpdates: Promise<any>[] = [];

                for (const item of existing.items) {
                    const inv = invMap.get(item.productId);
                    if (!inv) continue;

                    let newInvQuantity = inv.quantity;

                    // Handle inventory transitions
                    if (newStatus === "SHIPPED" && oldStatus !== "SHIPPED") {
                        inventoryUpdates.push(tx.inventoryItem.update({
                            where: { id: inv.id },
                            data: {
                                reserved: { decrement: item.quantity },
                                lastUpdated: new Date(),
                            },
                        }));
                        stockMovements.push({
                            inventoryItemId: inv.id,
                            type: "SALE",
                            quantity: item.quantity,
                            reason: `Order ${id} shipped`,
                            performedBy: "System",
                        });
                    } else if (newStatus === "CANCELLED" && oldStatus !== "CANCELLED") {
                        const isPreShip = ["PENDING", "PAID", "PROCESSING"].includes(oldStatus);
                        newInvQuantity = inv.quantity + item.quantity;

                        if (isPreShip) {
                            inventoryUpdates.push(tx.inventoryItem.update({
                                where: { id: inv.id },
                                data: {
                                    quantity: { increment: item.quantity },
                                    reserved: { decrement: item.quantity },
                                    lastUpdated: new Date(),
                                },
                            }));
                        } else {
                            inventoryUpdates.push(tx.inventoryItem.update({
                                where: { id: inv.id },
                                data: {
                                    quantity: { increment: item.quantity },
                                    lastUpdated: new Date(),
                                },
                            }));
                        }

                        stockMovements.push({
                            inventoryItemId: inv.id,
                            type: "RETURN",
                            quantity: item.quantity,
                            reason: `Order ${id} cancelled from ${oldStatus}`,
                            performedBy: "System",
                        });
                    } else if (newStatus === "RETURNED" && oldStatus !== "RETURNED") {
                        newInvQuantity = inv.quantity + item.quantity;
                        inventoryUpdates.push(tx.inventoryItem.update({
                            where: { id: inv.id },
                            data: {
                                quantity: { increment: item.quantity },
                                lastUpdated: new Date(),
                            },
                        }));
                        stockMovements.push({
                            inventoryItemId: inv.id,
                            type: "RETURN",
                            quantity: item.quantity,
                            reason: `Order ${id} returned`,
                            performedBy: "System",
                        });
                    }

                    // Sync product stock count based on the new quantity calculated in-memory
                    productUpdates.push(tx.product.update({
                        where: { id: item.productId },
                        data: { stock: newInvQuantity },
                    }));
                }

                // Execute all batched operations concurrently
                await Promise.all(inventoryUpdates);
                if (stockMovements.length > 0) {
                    await tx.stockMovement.createMany({ data: stockMovements });
                }
                await Promise.all(productUpdates);
            }

            // Update order status and add log
            const updated = await tx.order.update({
                where: { id },
                data: {
                    status: newStatus,
                    logs: {
                        create: {
                            status: newStatus,
                            note: data.note || `Status updated from ${oldStatus} to ${newStatus}`,
                        },
                    },
                },
                include: { items: true, logs: { orderBy: { timestamp: "asc" } } },
            });

            return updated;
        }, {
            maxWait: 5000, // wait up to 5s for a connection
            timeout: 10000, // allow transaction up to 10s to execute
        });

        const duration = Date.now() - startTime;
        console.log(`[Order Transaction] PATCH /api/orders/${id} completed in ${duration}ms`);

        return NextResponse.json(order);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        if (error?.message === "NOT_FOUND") {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }
        console.error(`[Order Transaction Error] PATCH /api/orders/[id] failed:`, error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
