import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── GET /api/inventory ──────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search");
        const lowStock = searchParams.get("lowStock");

        const items = await prisma.inventoryItem.findMany({
            where: search
                ? {
                    OR: [
                        { sku: { contains: search, mode: "insensitive" } },
                        { productName: { contains: search, mode: "insensitive" } },
                    ],
                }
                : undefined,
            include: {
                product: { include: { brand: true } },
            },
            orderBy: { productName: "asc" },
        });

        // Filter low-stock items in memory if needed
        const result = lowStock === "true"
            ? items.filter((i) => i.quantity <= i.reorderLevel)
            : items;

        return NextResponse.json(result);
    } catch (error) {
        console.error("GET /api/inventory error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
