import { NextResponse } from "next/server";
import {
  CatalogService,
  createSubCategory,
} from "@/services/catalog.service";
import { ServiceError } from "@/lib/errors";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const subCategories = await CatalogService.getSubCategories(
      categoryId || undefined,
    );
    return NextResponse.json(subCategories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const subCategory = await createSubCategory(body);
    return NextResponse.json(subCategory, { status: 201 });
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
