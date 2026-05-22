import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
// NOTE: PurchaseOrder models don't exist in current schema
// import { PurchaseOrderStatus } from "@/generated/prisma/client";

const receiveItemSchema = z.object({
    itemId: z.string().uuid(),
    quantityReceiving: z.number().int().min(0),
});

const receivePoSchema = z.object({
    items: z.array(receiveItemSchema).min(1),
});

// ── GET /api/inventory/purchase-orders/[id] ────────────
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // NOTE: PurchaseOrder models don't exist in current schema
        return NextResponse.json({ 
            error: "Purchase Order functionality not available - models not implemented in current schema" 
        }, { status: 501 });
    } catch (error) {
        console.error("GET /api/inventory/purchase-orders/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── PATCH /api/inventory/purchase-orders/[id]/receive ──
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // NOTE: PurchaseOrder models don't exist in current schema
        return NextResponse.json({ 
            error: "Purchase Order functionality not available - models not implemented in current schema" 
        }, { status: 501 });
    } catch (error) {
        console.error("PATCH /api/inventory/purchase-orders/[id]/receive error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
