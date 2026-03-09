import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── PATCH /api/marketing/campaigns/[id] ──────────────────────
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { isActive, name, rulesConfig } = body;

        const updated = await prisma.marketingCampaign.update({
            where: { id },
            data: {
                ...(isActive !== undefined && { isActive }),
                ...(name && { name }),
                ...(rulesConfig && { rulesConfig }),
            }
        });

        // Log action to audit if needed (optional)

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating campaign:", error);
        return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
    }
}

// ── DELETE /api/marketing/campaigns/[id] ─────────────────────
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Use a transaction to cleanup or just delete (Prisma Cascade should handle logs if configured)
        await prisma.marketingCampaign.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting campaign:", error);
        return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
    }
}
