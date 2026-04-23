import { NextRequest, NextResponse } from "next/server";
import { filterProducts, ServiceError } from "@/lib/services/catalog.service";
import { serializeProducts } from "@/lib/api/adminSerializers";

/**
 * POST /api/catalog/products/filter
 * Advanced Filtering API
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const products = await filterProducts(body);
    return NextResponse.json(serializeProducts(products as any[]));
  } catch (error: any) {
    if (error instanceof ServiceError) return new NextResponse(error.message, { status: error.statusCode });
    console.error("[POST_PRODUCTS_FILTER]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
