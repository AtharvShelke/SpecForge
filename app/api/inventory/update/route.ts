import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateUnitSchema = z.object({
    id: z.string().min(1),
    partNumber: z.string().min(1),
    serialNumber: z.string().min(1),
    costPrice: z.number().min(0),
});

const updateInventorySchema = z.object({
    units: z.array(updateUnitSchema).min(1),
});

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const data = updateInventorySchema.parse(body);

        await prisma.$transaction(async (tx) => {
            for (const unit of data.units) {
                await tx.inventoryItem.update({
                    where: { id: unit.id },
                    data: {
                        partNumber: unit.partNumber,
                        serialNumber: unit.serialNumber,
                        costPrice: unit.costPrice,
                        lastUpdated: new Date(),
                    },
                });
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        console.error("PATCH /api/inventory/update error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
