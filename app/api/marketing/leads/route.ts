import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// ── GET /api/marketing/leads ────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("q") || "";
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "20", 10);
        const skip = (page - 1) * limit;

        const where = search ? {
            OR: [
                { email: { contains: search, mode: 'insensitive' as const } },
                { name: { contains: search, mode: 'insensitive' as const } },
            ]
        } : {};

        const [total, items] = await Promise.all([
            prisma.lead.count({ where }),
            prisma.lead.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    _count: { select: { logs: true, events: true } },
                    customer: { select: { id: true, name: true } }
                }
            })
        ]);

        return NextResponse.json({ items, total, page, limit });

    } catch (error) {
        console.error("Error fetching leads:", error);
        return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
    }
}
