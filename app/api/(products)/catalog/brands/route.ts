import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CatalogService } from "@/services/catalog.service";
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
    if (!body.name) {
      throw new ServiceError("Brand name is required", 400);
    }
    const brand = await prisma.brand.create({
      data: { name: body.name },
    });
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
