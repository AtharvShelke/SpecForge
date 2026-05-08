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
                variantId: true,
                type: true,
                quantity: true,
                note: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        });

        // Map database fields to frontend expectations
        const formattedMovements = movements.map((m) => ({
            id: m.id,
            variantId: m.variantId,
            type: m.type,
            quantity: m.quantity,
            reason: m.note,
            createdAt: m.createdAt.toISOString(),
            date: m.createdAt.toISOString(),
            sku: 'N/A', // Would need separate query to get SKU
        }));

        return NextResponse.json(formattedMovements);
    } catch (error) {
        console.error("GET /api/inventory/movements error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
