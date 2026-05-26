import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── GET /api/inventory/movements ────────────────────────
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

        const movements = await prisma.stockMovement.findMany({
            select: {
                id: true,
                productId: true,
                inventoryItemId: true,
                type: true,
                quantity: true,
                note: true,
                createdAt: true,
                product: { select: { sku: true, name: true } },
                inventoryItem: { select: { serialNumber: true, partNumber: true } },
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        });

        // Map database fields to frontend expectations
        const formattedMovements = movements.map((m) => ({
            id: m.id,
            productId: m.productId,
            inventoryItemId: m.inventoryItemId,
            type: m.type,
            quantity: m.quantity,
            note: m.note,
            reason: m.note,
            sku: m.product?.sku || m.product?.name || m.productId,
            serialNumber: m.inventoryItem?.serialNumber,
            partNumber: m.inventoryItem?.partNumber,
            createdAt: m.createdAt.toISOString(),
            date: m.createdAt.toISOString(),
        }));

        return NextResponse.json(formattedMovements);
    } catch (error) {
        console.error("GET /api/inventory/movements error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
