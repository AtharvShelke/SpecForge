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
                warehouseInventoryId: true,
                warehouseId: true,
                type: true,
                quantity: true,
                previousQuantity: true,
                newQuantity: true,
                reason: true,
                performedBy: true,
                createdAt: true,
                warehouseInventory: {
                    select: {
                        variant: {
                            select: { sku: true }
                        }
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        });

        // Map database fields to frontend expectations
        const formattedMovements = movements.map((m) => ({
            id: m.id,
            warehouseInventoryId: m.warehouseInventoryId,
            warehouseId: m.warehouseId,
            type: m.type,
            quantity: m.quantity,
            previousQuantity: m.previousQuantity,
            newQuantity: m.newQuantity,
            reason: m.reason,
            performedBy: m.performedBy,
            createdAt: m.createdAt.toISOString(),
            date: m.createdAt.toISOString(),
            sku: m.warehouseInventory?.variant?.sku || 'N/A',
        }));

        return NextResponse.json(formattedMovements);
    } catch (error) {
        console.error("GET /api/inventory/movements error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
