import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        subcategories: {
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });
    
    // Transform categories into the format expected by the frontend
    const transformedCategories = categories.map(category => ({
      id: String(category.id),
      name: category.name,
      description: category.description,
      slug: category.slug || category.name.toLowerCase().replace(/\s+/g, '-'),
      subCategories: ((category as any).subcategories ?? []).map((sub: any) => ({
        id: String(sub.id),
        name: sub.name,
        slug: sub.slug,
        description: sub.description,
        categoryId: String(sub.categoryId),
        isActive: sub.isActive,
      })),
      subcategories: ((category as any).subcategories ?? []).map((sub: any) => ({
        id: String(sub.id),
        name: sub.name,
        slug: sub.slug,
        description: sub.description,
        categoryId: String(sub.categoryId),
        isActive: sub.isActive,
      })),
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
