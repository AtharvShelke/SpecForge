import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── GET /api/inventory/movements ────────────────────────
export async function GET(req: NextRequest) {
    try {
        const movements = await prisma.stockMovement.findMany({
            include: {
                inventoryItem: {
                    select: {
                        sku: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
        });

        // Map database fields to frontend expectations (date/sku)
        const formattedMovements = movements.map((m) => ({
            id: m.id,
            inventoryItemId: m.inventoryItemId,
            type: m.type,
            quantity: m.quantity,
            reason: m.reason,
            performedBy: m.performedBy,
            createdAt: m.createdAt.toISOString(),
            date: m.createdAt.toISOString(), // Added for frontend compatibility
            sku: m.inventoryItem.sku,        // Added for frontend compatibility
        }));

        return NextResponse.json(formattedMovements);
    } catch (error) {
        console.error("GET /api/inventory/movements error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
