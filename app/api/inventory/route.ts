import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── GET /api/inventory ──────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || searchParams.get("q");
        const category = searchParams.get("category");
        const fStockStatus = searchParams.get("f_stock_status");

        // Pagination parameters — default 50, max 200
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 5000);
        const skip = (page - 1) * limit;

        let dbWhere: any = {};

        // 1. Text Search
        if (search && search.trim() !== "") {
            dbWhere.OR = [
                { variant: { sku: { contains: search, mode: "insensitive" } } },
                { variant: { product: { name: { contains: search, mode: "insensitive" } } } }
            ];
        }

        // 2. Category Filter natively mapped via subCategoryId over to legacy format handling
        if (category && category !== "all") {
            dbWhere.variant = {
                ...(dbWhere.variant || {}),
                product: { subCategoryId: category }
            };
        }

        // 3. Stock Status Filter
        if (fStockStatus === "out") {
            dbWhere.quantityOnHand = 0;
        } else if (fStockStatus === "in") {
            dbWhere.quantityOnHand = { gt: 0 };
        }

        // Execute count + paginated query in parallel
        const [total, items] = await Promise.all([
            prisma.inventoryItem.count({ where: dbWhere }),
            prisma.inventoryItem.findMany({
                where: dbWhere,
                select: {
                    id: true,
                    variantId: true,
                    trackingType: true,
                    serialNumber: true,
                    partNumber: true,
                    quantityOnHand: true,
                    quantityReserved: true,
                    status: true,
                    costPrice: true,
                    batchNumber: true,
                    receivedAt: true,
                    notes: true,
                    createdAt: true,
                    updatedAt: true,
                    variant: {
                        select: {
                            id: true,
                            sku: true,
                            price: true,
                            status: true,
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    subCategoryId: true,
                                    brand: { select: { id: true, name: true } },
                                    media: { select: { url: true }, take: 1, orderBy: { sortOrder: 'asc' } },
                                },
                            },
                        },
                    },
                },
                orderBy: { updatedAt: "desc" },
                skip,
                take: limit,
            }),
        ]);

        return NextResponse.json({ items, total, page, limit });
    } catch (error) {
        console.error("GET /api/inventory error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
