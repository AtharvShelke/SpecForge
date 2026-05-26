import { NextRequest, NextResponse } from "next/server";
import { getCatalogListing } from "@/services/catalog.service";
import { ServiceError } from "@/lib/errors";

/**
 * POST /api/catalog/products/filter
 * Advanced Filtering API
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await getCatalogListing(body);
    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof ServiceError)
      return new NextResponse(error.message, { status: error.statusCode });
    console.error("[POST_PRODUCTS_FILTER]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
