import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// ── GET /api/marketing/logs ─────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "15", 10);

        const logs = await prisma.emailLog.findMany({
            orderBy: { sentAt: 'desc' },
            take: limit,
            include: {
                lead: { select: { email: true, name: true } },
                campaign: { select: { name: true } }
            }
        });

        return NextResponse.json(logs);

    } catch (error) {
        console.error("Error fetching marketing logs:", error);
        return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 });
    }
}
