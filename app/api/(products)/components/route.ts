/**
 * GET /api/components?type=CPU&page=1&limit=20
 *
 * Public API to fetch components by category code.
 * "type" maps to the Category code (CPU, GPU, RAM, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // e.g., "CPU", "GPU"
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
    const search = searchParams.get("search") ?? "";
    const brandId = searchParams.get("brandId");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    // Build where clause
    const where: any = {
      deletedAt: null,
      status: "ACTIVE",
    };

    // If type is given, find products belonging to that category code
    if (type) {
      const category = await prisma.category.findFirst({
        where: { code: type.toUpperCase(), isActive: true },
        select: { id: true },
      });

      if (!category) {
        return NextResponse.json(
          { error: `Unknown component type: ${type}` },
          { status: 400 },
        );
      }

      where.categoryId = category.id;
    }

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    if (brandId) {
      where.brandId = brandId;
    }

    // Price filtering on the product level
    if (minPrice) where.price = { ...where.price, gte: parseFloat(minPrice) };
    if (maxPrice) where.price = { ...where.price, lte: parseFloat(maxPrice) };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          brand: true,
          subcategory: { include: { category: true } },
          media: { orderBy: { sortOrder: "asc" }, take: 2 },
          specs: {
            include: { attribute: true, option: true },
          },
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("[GET_COMPONENTS]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
