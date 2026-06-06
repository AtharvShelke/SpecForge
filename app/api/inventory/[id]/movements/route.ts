import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { StockMovementTypeSchema } from "@/lib/contracts/validation";
import { InventoryUnitStatus } from "@/generated/prisma";

const createMovementSchema = z.object({
    type: StockMovementTypeSchema,
    quantity: z.number().int().positive(),
    reason: z.string().nullable().optional(),
});

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

            let nextStatus: InventoryUnitStatus = inv.status;

            switch (data.type) {
                case "INWARD":
                case "RETURN":
                    nextStatus = "AVAILABLE";
                    break;
                case "OUTWARD":
                    nextStatus = "DAMAGED";
                    break;
                case "RESERVE":
                    if (inv.status !== "AVAILABLE") throw new Error("UNIT_NOT_AVAILABLE");
                    nextStatus = "RESERVED";
                    break;
                case "SALE":
                    if (inv.status !== "RESERVED") throw new Error("UNIT_NOT_RESERVED");
                    nextStatus = "SHIPPED";
                    break;
            }

            await tx.inventoryItem.update({
                where: { id },
                data: {
                    status: nextStatus,
                    lastUpdated: new Date(),
                },
            });

            return tx.stockMovement.create({
                data: {
                    productId: inv.productId,
                    inventoryItemId: inv.id,
                    type: data.type,
                    quantity: 1,
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
