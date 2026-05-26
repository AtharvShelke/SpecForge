import { NextRequest, NextResponse } from "next/server";
import {
  getInventoryItems,
  createInventoryItem,
  adjustStockBySku,
} from "@/services/inventory.service";
import { ServiceError } from "@/lib/errors";
import { serializeInventoryItems } from "@/lib/adminSerializers";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const items = await getInventoryItems({
      productId: searchParams.get("variantId") || searchParams.get("productId") || undefined,
    });
    return NextResponse.json(serializeInventoryItems(items as any[]));
  } catch (error: any) {
    if (error instanceof ServiceError)
      return new NextResponse(error.message, { status: error.statusCode });
    console.error("[GET_INVENTORY_ITEMS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "ADJUST" || body.type) {
      const { variantId, quantity, type } = body;
      if (!variantId || typeof quantity !== "number" || !type) {
        throw new ServiceError(
          "variantId, quantity, and type are required for adjustment",
          400,
        );
      }
      const item = await adjustStockBySku(variantId, quantity, type);
      return NextResponse.json(item, { status: 200 });
    }

    const item = await createInventoryItem(body);
    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    if (error instanceof ServiceError)
      return new NextResponse(error.message, { status: error.statusCode });
    console.error("[POST_INVENTORY_ITEMS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
