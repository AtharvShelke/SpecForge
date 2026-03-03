import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { PurchaseOrderStatus } from "@/generated/prisma/enums";


const createPoItemSchema = z.object({
    variantId: z.string().uuid(),
    quantityOrdered: z.number().int().positive(),
    unitCost: z.number().positive(),
});

const createPurchaseOrderSchema = z.object({
    supplierId: z.string().uuid(),
    warehouseId: z.string().uuid(),
    expectedDelivery: z.string().optional().nullable(),
    items: z.array(createPoItemSchema).min(1),
});

// ── GET /api/inventory/purchase-orders ─────────────────
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status") as PurchaseOrderStatus | null;

        const where = status ? { status } : undefined;

        const orders = await prisma.purchaseOrder.findMany({
            where,
            include: {
                supplier: true,
                warehouse: true,
                items: {
                    include: {
                        variant: {
                            include: { product: { select: { name: true } } },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error("GET /api/inventory/purchase-orders error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── POST /api/inventory/purchase-orders ────────────────
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const data = createPurchaseOrderSchema.parse(body);

        const po = await prisma.purchaseOrder.create({
            data: {
                supplierId: data.supplierId,
                warehouseId: data.warehouseId,
                expectedDelivery: data.expectedDelivery ? new Date(data.expectedDelivery) : null,
                items: {
                    create: data.items,
                },
            },
            include: {
                supplier: true,
                warehouse: true,
                items: {
                    include: {
                        variant: {
                            include: { product: { select: { name: true } } },
                        },
                    },
                },
            },
        });

        return NextResponse.json(po, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("POST /api/inventory/purchase-orders error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
