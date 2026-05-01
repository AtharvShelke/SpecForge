import { NextRequest, NextResponse } from "next/server";
import { getInventoryItems } from "@/services/inventory.service";
import { serializeInventoryItems } from "@/lib/adminSerializers";
import { ServiceError } from "@/services/catalog.service";

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
