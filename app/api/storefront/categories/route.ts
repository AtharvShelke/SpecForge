import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [categories, hierarchy] = await Promise.all([
      prisma.category.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          subCategories: {
            where: { deletedAt: null },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
          },
        },
      }),
      prisma.categoryHierarchy.findMany({
        where: {
          parentId: null,
          categoryId: { not: null },
        },
        select: {
          categoryId: true,
          label: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    const hierarchyByCategoryId = new Map(
      hierarchy
        .filter((entry): entry is { categoryId: string; label: string; sortOrder: number } =>
          Boolean(entry.categoryId),
        )
        .map((entry) => [entry.categoryId, { label: entry.label, sortOrder: entry.sortOrder }]),
    );

    const storefrontCategories = categories
      .map((category) => {
        const hierarchyEntry = hierarchyByCategoryId.get(category.id);
        return {
          id: category.id,
          name: category.name,
          displayName: hierarchyEntry?.label ?? category.name,
          sortOrder: hierarchyEntry?.sortOrder ?? Number.MAX_SAFE_INTEGER,
          subCategories: category.subCategories,
        };
      })
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }
        return a.displayName.localeCompare(b.displayName);
      });

    return NextResponse.json(storefrontCategories);
  } catch (error) {
    console.error("Failed to fetch storefront categories:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
