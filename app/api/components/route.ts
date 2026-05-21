/**
 * GET /api/components?type=CPU&page=1&limit=20
 *
 * Public API to fetch components by type (subcategory slot name).
 * "type" maps to the PartSlot name (CPU, GPU, RAM, etc.)
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

    // If type is given, find the subcategories that belong to that slot
    let subCategoryIds: string[] = [];

    if (type) {
      const slot = await prisma.partSlot.findUnique({
        where: { name: type.toUpperCase() },
        include: { subCategorySlots: true },
      });

      if (!slot) {
        return NextResponse.json(
          { error: `Unknown component type: ${type}` },
          { status: 400 },
        );
      }

      subCategoryIds = slot.subCategorySlots.map((s) => s.subCategoryId);
    }

    // Build where clause
    const where: any = {
      deletedAt: null,
      status: "ACTIVE",
    };

    if (subCategoryIds.length > 0) {
      where.subCategoryId = { in: subCategoryIds };
    }

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    if (brandId) {
      where.brandId = brandId;
    }

    // Price filtering on variants
    const variantWhere: any = { deletedAt: null };
    if (minPrice) variantWhere.price = { ...variantWhere.price, gte: parseFloat(minPrice) };
    if (maxPrice) variantWhere.price = { ...variantWhere.price, lte: parseFloat(maxPrice) };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          brand: true,
          subCategory: { include: { category: true } },
          media: { orderBy: { sortOrder: "asc" }, take: 2 },
          variants: {
            where: variantWhere,
            include: {
              variantSpecs: {
                include: { spec: true, option: true },
              },
            },
            take: 1,
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
