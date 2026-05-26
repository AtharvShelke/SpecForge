import { NextResponse } from "next/server";
import {
  CatalogService,
  
  createBrand,
} from "@/services/catalog.service";
import { serializeBrand, serializeBrands } from "@/lib/adminSerializers";
import { ServiceError } from "@/lib/errors";

export async function GET() {
  try {
    const brands = await CatalogService.getBrands();
    return NextResponse.json(serializeBrands(brands), {
      headers: {
        "Cache-Control":
          "public, max-age=0, s-maxage=300, stale-while-revalidate=1800",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const brand = await createBrand(body);
    return NextResponse.json(serializeBrand(brand), { status: 201 });
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
