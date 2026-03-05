import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "50", 10);

        const logs = await prisma.auditLog.findMany({
            orderBy: { createdAt: "desc" },
            take: limit,
        });

        return NextResponse.json(logs);
    } catch (error) {
        console.error("GET /api/audit-logs error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
