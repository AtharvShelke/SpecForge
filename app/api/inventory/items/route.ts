import { NextRequest, NextResponse } from "next/server";
import { getInventoryItems, createInventoryItem, adjustStockByVariant } from "@/lib/services/inventory.service";
import { ServiceError } from "@/lib/services/catalog.service";
import { serializeInventoryItems } from "@/lib/api/adminSerializers";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const items = await getInventoryItems({
      variantId: searchParams.get("variantId") || undefined,
      status: searchParams.get("status") || undefined,
    });
    return NextResponse.json(serializeInventoryItems(items as any[]));
  } catch (error: any) {
    if (error instanceof ServiceError) return new NextResponse(error.message, { status: error.statusCode });
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
         throw new ServiceError("variantId, quantity, and type are required for adjustment", 400);
      }
      const item = await adjustStockByVariant(variantId, quantity, type);
      return NextResponse.json(item, { status: 200 });
    }

    const item = await createInventoryItem(body);
    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    if (error instanceof ServiceError) return new NextResponse(error.message, { status: error.statusCode });
    console.error("[POST_INVENTORY_ITEMS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
