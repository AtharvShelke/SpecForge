import { NextResponse } from "next/server";
import { categoryService } from "@/services/category.service";

export async function GET() {
  try {
    const categories = await categoryService.getAll();
    
    // Transform categories into the format expected by the frontend
    const transformedCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      slug: category.name.toLowerCase().replace(/\s+/g, '-'),
    }));

    return NextResponse.json(transformedCategories);
  } catch (error) {
    console.error("[GET_CATEGORIES]", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
