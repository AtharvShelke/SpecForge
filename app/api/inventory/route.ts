import { NextRequest, NextResponse } from "next/server";
<<<<<<< HEAD
import { getInventoryItems } from "@/services/inventory.service";
import { serializeInventoryItems } from "@/lib/adminSerializers";
import { ServiceError } from "@/lib/errors";
=======
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createInventoryUnits } from "@/lib/services/inventory";

const inventoryUnitSchema = z.object({
    partNumber: z.string().min(1),
    serialNumber: z.string().min(1),
    costPrice: z.number().min(0).optional(),
    location: z.string().optional(),
    reorderLevel: z.number().int().min(0).optional(),
});

const createInventorySchema = z.object({
    productId: z.string().min(1),
    note: z.string().optional(),
    units: z.array(inventoryUnitSchema).min(1),
});
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit") ?? 10)),
    );
    const category = searchParams.get("category");
    const query = searchParams.get("q")?.trim().toLowerCase();
    const stockStatus = searchParams.get("f_stock_status");

    const items = await getInventoryItems({
      status: searchParams.get("status") || undefined,
    });

    const normalized = serializeInventoryItems(items as any[]);
    const grouped = Array.from(
      normalized
        .reduce((map, item: any) => {
          const key = item.variantId ?? item.sku ?? item.id;
          const existing = map.get(key);

<<<<<<< HEAD
          if (!existing) {
            map.set(key, { ...item });
            return map;
          }

          existing.quantityOnHand =
            Number(existing.quantityOnHand ?? 0) +
            Number(item.quantityOnHand ?? 0);
          existing.quantityReserved =
            Number(existing.quantityReserved ?? 0) +
            Number(item.quantityReserved ?? 0);
          existing.quantity =
            Number(existing.quantity ?? 0) + Number(item.quantity ?? 0);
          existing.reserved =
            Number(existing.reserved ?? 0) + Number(item.reserved ?? 0);
          existing.costPrice =
            Number(existing.costPrice ?? 0) > 0
              ? Number(existing.costPrice ?? 0)
              : Number(item.costPrice ?? 0);
          return map;
        }, new Map<string, any>())
        .values(),
    );

    const filtered = grouped.filter((item: any) => {
      const productCategory =
        item?.variant?.product?.subCategory?.category?.name ??
        item?.variant?.product?.category ??
        "";

      const haystack = [
        item?.sku,
        item?.variant?.sku,
        item?.variant?.product?.name,
        productCategory,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
=======
        // 1. Text Search
        if (search && search.trim() !== "") {
            dbWhere.OR = [
                { product: { sku: { contains: search, mode: "insensitive" } } },
                { product: { name: { contains: search, mode: "insensitive" } } },
                { serialNumber: { contains: search, mode: "insensitive" } },
                { partNumber: { contains: search, mode: "insensitive" } },
            ];
        }

        // 2. Category Filter
        if (category && category !== "all") {
            dbWhere.product = {
                ...(dbWhere.product || {}),
                category: {
                    OR: [
                        { slug: category },
                        { code: category }
                    ]
                }
            };
        }

        // 3. Stock Status Filter
        if (fStockStatus === "out") {
            dbWhere.quantity = 0;
        } else if (fStockStatus === "low") {
            // Use raw SQL to efficiently find items where quantity > 0 AND quantity <= reorderLevel
            const lowStockIds = await prisma.$queryRawUnsafe<{ id: string }[]>(
                `SELECT id FROM "InventoryItem" WHERE quantity > 0 AND quantity <= "reorderLevel"`
            );
            dbWhere.id = { in: lowStockIds.map(r => r.id) };
        } else if (fStockStatus === "in") {
            dbWhere.quantity = { gt: 0 };
        }

        // Execute count + paginated query in parallel
        const [total, items] = await Promise.all([
            prisma.inventoryItem.count({ where: dbWhere }),
            prisma.inventoryItem.findMany({
                where: dbWhere,
                select: {
                    id: true,
                    productId: true,
                    partNumber: true,
                    serialNumber: true,
                    quantity: true,
                    reserved: true,
                    reorderLevel: true,
                    costPrice: true,
                    location: true,
                    lastUpdated: true,
                    product: {
                        select: {
                            id: true,
                            sku: true,
                            name: true,
                            price: true,
                            stockStatus: true,
                            category: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                                }
                            },
                            brand: { select: { id: true, name: true } },
                            media: { select: { url: true }, take: 1, orderBy: { sortOrder: 'asc' } },
                        },
                    },
                },
                orderBy: [
                    { lastUpdated: "desc" },
                    { serialNumber: "asc" },
                ],
                skip,
                take: limit,
            }),
        ]);
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50

      if (category && category !== "all" && productCategory !== category) {
        return false;
      }
      if (query && !haystack.includes(query)) {
        return false;
      }
      if (stockStatus === "In Stock" && Number(item.quantity ?? 0) <= 0) {
        return false;
      }
      if (stockStatus === "Out of Stock" && Number(item.quantity ?? 0) > 0) {
        return false;
      }

      return true;
    });

    const start = (page - 1) * limit;

    return NextResponse.json({
      items: filtered.slice(start, start + limit),
      total: filtered.length,
      page,
      limit,
    });
  } catch (error: any) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const data = createInventorySchema.parse(body);

        await prisma.$transaction(async (tx) => {
            await createInventoryUnits(
                tx,
                data.productId,
                data.units,
                data.note || "Inventory units added",
            );
        });

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        console.error("POST /api/inventory error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
