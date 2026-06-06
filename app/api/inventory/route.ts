import { NextRequest, NextResponse } from "next/server";
import { getInventoryItems, createInventoryUnit } from "@/services/inventory.service";
import { serializeInventoryItems } from "@/lib/adminSerializers";
import { ServiceError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limitParam = searchParams.get("limit");
    const limit = limitParam
      ? Math.min(10000, Math.max(1, Number(limitParam)))
      : 10;

    const productId = searchParams.get("productId") || undefined;
    const status = (searchParams.get("status") || undefined) as any;
    const serialNumber = searchParams.get("serialNumber") || undefined;
    const partNumber = searchParams.get("partNumber") || undefined;
    const location = searchParams.get("location") || undefined;
    const query = searchParams.get("q")?.trim().toLowerCase();

    // Fetch units from service
    const items = await getInventoryItems({
      productId,
      status,
      serialNumber,
      partNumber,
      location,
    });

    const serialized = serializeInventoryItems(items as any[]);

    // Apply client-side filters if general query string is provided
    const filtered = query
      ? serialized.filter((item: any) => {
          const haystack = [
            item.serialNumber,
            item.partNumber,
            item.location,
            item.status,
            item.product?.name,
            item.product?.sku,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(query);
        })
      : serialized;

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
    const { productId, serialNumber, partNumber, quantity, costPrice, location } = body;

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const qty = Math.max(1, Number(quantity ?? 1));

    if (serialNumber && serialNumber.trim()) {
      // Create single unit
      const item = await createInventoryUnit({
        productId,
        serialNumber: serialNumber.trim(),
        partNumber: partNumber?.trim() || undefined,
        costPrice: Number(costPrice ?? 0),
        location: location?.trim() || undefined,
      });
      return NextResponse.json(item, { status: 201 });
    } else {
      // Create multiple units with generated serial numbers
      const units = [];
      const skuSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      for (let i = 0; i < qty; i++) {
        const generatedSerial = `SN-${skuSuffix}-${Date.now().toString().slice(-6)}-${i + 1}`;
        const item = await createInventoryUnit({
          productId,
          serialNumber: generatedSerial,
          partNumber: partNumber?.trim() || undefined,
          costPrice: Number(costPrice ?? 0),
          location: location?.trim() || undefined,
        });
        units.push(item);
      }
      return NextResponse.json(units, { status: 201 });
    }
  } catch (error: any) {
    if (error instanceof ServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
