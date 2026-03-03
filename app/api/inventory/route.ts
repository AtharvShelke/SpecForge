import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── GET /api/inventory ──────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || searchParams.get("q");
        const category = searchParams.get("category");
        const fStockStatus = searchParams.get("f_stock_status");

        // Pagination parameters
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "1000", 10);
        const skip = (page - 1) * limit;

        // Note: For 'low stock', since quantity <= reorderLevel requires a field comparison,
        // Prisma doesn't support comparing fields inside standard `where`. We will either query raw,
        // or just apply a programmatic filter over a wider result set. But wait, if someone asks for
        // paginated low stock items, doing it purely in memory breaks pagination limit accuracy.
        // A simple Prisma workaround: Since reorderLevel is generally consistent or small (e.g., 5-10),
        // we can fetch with a fixed ceiling or fall back to raw SQL to find the correctly paginated IDs.
        // For simplicity and assuming thousands of inventory rows, we'll try a fast fetch of item IDs first.

        let dbWhere: any = {};

        // 1. Text Search & 2. Category Filter
        let productFilter: any = {};
        if (search && search.trim() !== "") {
            productFilter.OR = [
                { sku: { contains: search, mode: "insensitive" } },
                { name: { contains: search, mode: "insensitive" } },
            ];
        }
        if (category && category !== "all") {
            productFilter.category = category;
        }

        if (Object.keys(productFilter).length > 0) {
            dbWhere.product = productFilter;
        }

        // 3. Stock Status Filter
        if (fStockStatus === "out") {
            dbWhere.quantity = 0;
        }

        let queryIds: { id: string }[] | null = null;

        // If 'low' stock is requested, we MUST do a raw SQL query or pull all matching records briefly
        // to filter `quantity <= reorderLevel` properly before taking the paginated slice.
        if (fStockStatus === "low") {
            const rawItems = await prisma.warehouseInventory.findMany({
                where: { ...dbWhere, quantity: { gt: 0 } },
                select: { id: true, quantity: true, reorderLevel: true }
            });
            const validLowStockIds = rawItems
                .filter(item => item.quantity <= item.reorderLevel)
                .map(item => item.id);

            dbWhere.id = { in: validLowStockIds };
        } else if (fStockStatus === "in") {
            dbWhere.quantity = { gt: 0 };
        }

        // Execute primary paginated query
        const total = await prisma.warehouseInventory.count({ where: dbWhere });

        const items = await prisma.warehouseInventory.findMany({
            where: dbWhere,
            include: {
                variant: { include: { product: { include: { brand: true } } } },
            },
            orderBy: { variant: { product: { name: "asc" } } },
            skip,
            take: limit
        });

        return NextResponse.json({
            items,
            total,
            page,
            limit
        });
    } catch (error) {
        console.error("GET /api/inventory error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
