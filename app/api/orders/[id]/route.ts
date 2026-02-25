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

        const order = await prisma.$transaction(async (tx) => {
            const existing = await tx.order.findUnique({
                where: { id },
                include: { items: true },
            });
            if (!existing) throw new Error("NOT_FOUND");

            const oldStatus = existing.status;
            const newStatus = data.status;

            // Handle inventory transitions
            if (newStatus === "SHIPPED" && oldStatus !== "SHIPPED") {
                // Stock leaves: reduce reservations
                for (const item of existing.items) {
                    const inv = await tx.inventoryItem.findUnique({
                        where: { productId: item.productId },
                    });
                    if (inv) {
                        await tx.inventoryItem.update({
                            where: { id: inv.id },
                            data: {
                                reserved: { decrement: item.quantity },
                                lastUpdated: new Date(),
                            },
                        });
                        await tx.stockMovement.create({
                            data: {
                                inventoryItemId: inv.id,
                                type: "SALE",
                                quantity: item.quantity,
                                reason: `Order ${id} shipped`,
                                performedBy: "System",
                            },
                        });
                    }
                }
            } else if (newStatus === "CANCELLED" && oldStatus !== "CANCELLED") {
                // Return stock
                for (const item of existing.items) {
                    const inv = await tx.inventoryItem.findUnique({
                        where: { productId: item.productId },
                    });
                    if (inv) {
                        const isPreShip = ["PENDING", "PAID", "PROCESSING"].includes(oldStatus);
                        if (isPreShip) {
                            // Stock was in reserved → return to available
                            await tx.inventoryItem.update({
                                where: { id: inv.id },
                                data: {
                                    quantity: { increment: item.quantity },
                                    reserved: { decrement: item.quantity },
                                    lastUpdated: new Date(),
                                },
                            });
                        } else {
                            // Already shipped → add back to available
                            await tx.inventoryItem.update({
                                where: { id: inv.id },
                                data: {
                                    quantity: { increment: item.quantity },
                                    lastUpdated: new Date(),
                                },
                            });
                        }
                        await tx.stockMovement.create({
                            data: {
                                inventoryItemId: inv.id,
                                type: "RETURN",
                                quantity: item.quantity,
                                reason: `Order ${id} cancelled from ${oldStatus}`,
                                performedBy: "System",
                            },
                        });
                    }
                }
            } else if (newStatus === "RETURNED" && oldStatus !== "RETURNED") {
                // Return stock after delivery
                for (const item of existing.items) {
                    const inv = await tx.inventoryItem.findUnique({
                        where: { productId: item.productId },
                    });
                    if (inv) {
                        await tx.inventoryItem.update({
                            where: { id: inv.id },
                            data: {
                                quantity: { increment: item.quantity },
                                lastUpdated: new Date(),
                            },
                        });
                        await tx.stockMovement.create({
                            data: {
                                inventoryItemId: inv.id,
                                type: "RETURN",
                                quantity: item.quantity,
                                reason: `Order ${id} returned`,
                                performedBy: "System",
                            },
                        });
                    }
                }
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

            // Sync product stock count
            for (const item of existing.items) {
                const inv = await tx.inventoryItem.findUnique({
                    where: { productId: item.productId },
                });
                if (inv) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: inv.quantity },
                    });
                }
            }

            return updated;
        });

        return NextResponse.json(order);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        if (error?.message === "NOT_FOUND") {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }
        console.error("PATCH /api/orders/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
