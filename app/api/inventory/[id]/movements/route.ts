import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { StockMovementTypeSchema } from "@/lib/contracts/validation";

const createMovementSchema = z.object({
    type: StockMovementTypeSchema,
    quantity: z.number().int().positive(),
    reason: z.string().nullable().optional(),
});

async function refreshProductStockStatus(productId: string, tx: Pick<typeof prisma, 'inventoryItem' | 'product'>) {
    const count = await tx.inventoryItem.count({
        where: { productId, quantity: { gt: 0 } },
    });

    await tx.product.update({
        where: { id: productId },
        data: { stockStatus: count > 0 ? "IN_STOCK" : "OUT_OF_STOCK" },
    });
}

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const movements = await prisma.stockMovement.findMany({
            where: { inventoryItemId: id },
            orderBy: { createdAt: "desc" },
            take: 100,
        });

        return NextResponse.json(movements);
    } catch (error) {
        console.error("GET /api/inventory/[id]/movements error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const data = createMovementSchema.parse(body);

        const movement = await prisma.$transaction(async (tx) => {
            const inv = await tx.inventoryItem.findUnique({
                where: { id },
            });
            if (!inv) throw new Error("NOT_FOUND");

            const isUnitTracked = !!(inv.serialNumber || inv.partNumber);
            const movementQty = isUnitTracked ? 1 : data.quantity;

            if (isUnitTracked && data.quantity !== 1) {
                throw new Error("UNIT_QUANTITY_ONLY");
            }

            let nextQuantity = inv.quantity;
            let nextReserved = inv.reserved;

            switch (data.type) {
                case "INWARD":
                case "PURCHASE":
                case "RETURN":
                    if (isUnitTracked) {
                        nextQuantity = 1;
                        nextReserved = 0;
                    } else {
                        nextQuantity = inv.quantity + movementQty;
                    }
                    break;
                case "OUTWARD":
                case "ADJUSTMENT":
                    if (isUnitTracked) {
                        nextQuantity = 0;
                        nextReserved = 0;
                    } else {
                        nextQuantity = Math.max(0, inv.quantity - movementQty);
                    }
                    break;
                case "RESERVE":
                    if (isUnitTracked) {
                        if (inv.quantity <= 0 || inv.reserved > 0) throw new Error("UNIT_NOT_AVAILABLE");
                        nextQuantity = 0;
                        nextReserved = 1;
                    } else {
                        if (inv.quantity < movementQty) throw new Error("INSUFFICIENT_STOCK");
                        nextQuantity = inv.quantity - movementQty;
                        nextReserved = inv.reserved + movementQty;
                    }
                    break;
                case "SALE":
                    if (isUnitTracked) {
                        if (inv.reserved <= 0) throw new Error("UNIT_NOT_RESERVED");
                        nextQuantity = 0;
                        nextReserved = 0;
                    } else {
                        if (inv.reserved < movementQty) throw new Error("INSUFFICIENT_RESERVED");
                        nextReserved = inv.reserved - movementQty;
                    }
                    break;
            }

            await tx.inventoryItem.update({
                where: { id },
                data: {
                    quantity: nextQuantity,
                    reserved: nextReserved,
                    lastUpdated: new Date(),
                },
            });

            await refreshProductStockStatus(inv.productId, tx);

            return tx.stockMovement.create({
                data: {
                    productId: inv.productId,
                    inventoryItemId: inv.id,
                    type: data.type,
                    quantity: movementQty,
                    note: data.reason,
                },
            });
        });

        return NextResponse.json(movement, { status: 201 });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        if (error?.message === "NOT_FOUND") {
            return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
        }
        if (error?.message === "UNIT_QUANTITY_ONLY") {
            return NextResponse.json({ error: "Unit-tracked inventory can only be adjusted one unit at a time" }, { status: 400 });
        }
        if (error?.message === "UNIT_NOT_AVAILABLE") {
            return NextResponse.json({ error: "This unit is not currently available" }, { status: 409 });
        }
        if (error?.message === "UNIT_NOT_RESERVED") {
            return NextResponse.json({ error: "This unit is not currently reserved" }, { status: 409 });
        }
        console.error("POST /api/inventory/[id]/movements error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
