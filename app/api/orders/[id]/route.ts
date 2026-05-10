import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { confirmInventory, restoreInventory } from "@/lib/services/inventory";
import { generateOrderInvoice } from "@/lib/services/invoice";

const OrderStatusEnum = z.enum([
    "PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED",
]);

const updateOrderSchema = z.object({
    status: OrderStatusEnum,
    note: z.string().optional(),
});

// Valid order state transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
    PENDING: ["PAID", "CANCELLED"],
    PAID: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["DELIVERED"],
    DELIVERED: ["RETURNED"],
};

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
                items: { include: { assignedUnits: true } },
                logs: { orderBy: { timestamp: "asc" } },
                invoices: { include: { lineItems: true } },
                payments: { orderBy: { createdAt: "desc" } },
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
                include: { items: { include: { assignedUnits: true } } },
            });
            if (!existing) throw new Error("NOT_FOUND");

            const oldStatus = existing.status;
            const newStatus = data.status;

            // Validate state transition
            if (oldStatus === newStatus) {
                throw new Error("SAME_STATUS");
            }
            const allowed = VALID_TRANSITIONS[oldStatus] ?? [];
            if (!allowed.includes(newStatus)) {
                throw new Error(`INVALID_TRANSITION:${oldStatus}→${newStatus}`);
            }

            // Optimistic concurrency via version
            const versionCheck = await tx.order.updateMany({
                where: { id, version: existing.version },
                data: { version: { increment: 1 } },
            });
            if (versionCheck.count === 0) throw new Error("CONCURRENT_MODIFICATION");

            const assignedUnits = existing.items.flatMap((item) =>
                item.assignedUnits.map((unit) => ({
                    inventoryItemId: unit.inventoryItemId,
                    productId: item.productId,
                }))
            );

            // Handle inventory based on transition
            if (newStatus === "SHIPPED") {
                await confirmInventory(tx, assignedUnits, id);
            } else if (newStatus === "CANCELLED") {
                const isPreShip = ["PENDING", "PAID", "PROCESSING"].includes(oldStatus);
                await restoreInventory(
                    tx, assignedUnits, id, isPreShip,
                    `Order ${id} cancelled from ${oldStatus}`
                );
            } else if (newStatus === "RETURNED") {
                await restoreInventory(
                    tx, assignedUnits, id, false,
                    `Order ${id} returned`
                );
            }

            // Auto-generate invoice when order is PAID
            if (newStatus === "PAID") {
                try {
                    await generateOrderInvoice(tx, id);
                } catch (invoiceError) {
                    console.error(`[Invoice Generation] Failed for order ${id}:`, invoiceError);
                    // Don't block the order status change — invoice can be retried
                }
            }

            // Update order status
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
                include: {
                    items: { include: { assignedUnits: true } },
                    logs: { orderBy: { timestamp: "asc" } },
                    payments: { orderBy: { createdAt: "desc" } },
                },
            });

            // Log to unified audit
            await tx.auditLog.create({
                data: {
                    entityType: 'Order',
                    entityId: id,
                    action: 'status_changed',
                    actor: 'System',
                    before: { status: oldStatus },
                    after: { status: newStatus },
                },
            });

            return updated;
        }, {
            maxWait: 5000,
            timeout: 15000,
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
        if (error?.message === "SAME_STATUS") {
            return NextResponse.json({ error: "Order already has this status" }, { status: 400 });
        }
        if (error?.message?.startsWith("INVALID_TRANSITION")) {
            return NextResponse.json({ error: `Invalid status transition: ${error.message.split(':')[1]}` }, { status: 400 });
        }
        if (error?.message === "CONCURRENT_MODIFICATION") {
            return NextResponse.json({ error: "Order was modified by another request. Please retry." }, { status: 409 });
        }
        console.error(`[Order Transaction Error] PATCH /api/orders/[id] failed:`, error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── DELETE /api/orders/[id] ─────────────────────────────
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const startTime = Date.now();

        await prisma.$transaction(async (tx) => {
            const existing = await tx.order.findUnique({
                where: { id },
                include: { items: { include: { assignedUnits: true } } },
            });

            if (!existing) throw new Error("NOT_FOUND");

            // 1. If not already cancelled, cancel it first to restore inventory
            if (existing.status !== "CANCELLED") {
                const oldStatus = existing.status;
                const assignedUnits = existing.items.flatMap((item) =>
                    item.assignedUnits.map((unit) => ({
                        inventoryItemId: unit.inventoryItemId,
                        productId: item.productId,
                    }))
                );

                const isPreShip = ["PENDING", "PAID", "PROCESSING"].includes(oldStatus);

                // Restore inventory if it was reserved/outwarded
                await restoreInventory(
                    tx, assignedUnits, id, isPreShip,
                    `Order ${id} cancelled during deletion from ${oldStatus}`
                );
            }

            // 2. Delete the order (relations will cascade delete if configured in prisma schema)
            await tx.order.delete({
                where: { id },
            });

            // 3. Log to unified audit
            await tx.auditLog.create({
                data: {
                    entityType: 'Order',
                    entityId: id,
                    action: 'deleted',
                    actor: 'Admin',
                    before: { id: existing.id, status: existing.status, customerName: existing.customerName, total: existing.total },
                },
            });
        }, {
            maxWait: 5000,
            timeout: 15000,
        });

        const duration = Date.now() - startTime;
        console.log(`[Order Deletion] DELETE /api/orders/${id} completed in ${duration}ms`);

        return NextResponse.json({ success: true, message: `Order ${id} deleted` });
    } catch (error: any) {
        if (error?.message === "NOT_FOUND") {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }
        console.error(`[Order Deletion Error] DELETE /api/orders/[id] failed:`, error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
