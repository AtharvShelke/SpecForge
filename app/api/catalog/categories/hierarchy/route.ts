import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CatalogService } from "@/services/catalog.service";
import type { CategoryNode } from "@/types";

function serializeHierarchy(nodes: any[]): CategoryNode[] {
  return nodes.map((node) => ({
    label: node.label,
    category: node.category?.name ?? undefined,
    brand: node.brand ?? undefined,
    query: node.query ?? undefined,
    children: Array.isArray(node.children)
      ? serializeHierarchy(node.children)
      : [],
  }));
}

/**
 * GET /api/catalog/categories/hierarchy
 * Returns the full CategoryHierarchy tree (pre-nested, sorted by sortOrder).
 */
export async function GET() {
  try {
    const hierarchy = await CatalogService.getCategoryHierarchy();
    return NextResponse.json(serializeHierarchy(hierarchy));
  } catch (error: any) {
    console.error("[GET /api/catalog/categories/hierarchy]", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to fetch category hierarchy" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const nodes = Array.isArray(body) ? body : body?.categories;

    if (!Array.isArray(nodes)) {
      return NextResponse.json(
        { error: "Expected a category hierarchy array" },
        { status: 400 },
      );
    }

    const categories = await prisma.category.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
    });
    const categoryIdByName = new Map(
      categories.map((category) => [category.name, category.id]),
    );

    await prisma.$transaction(async (tx) => {
      await tx.categoryHierarchy.deleteMany({});

      const createNodes = async (
        items: CategoryNode[],
        parentId: string | null = null,
      ): Promise<void> => {
        for (const [index, item] of items.entries()) {
          const created = await tx.categoryHierarchy.create({
            data: {
              label: item.label,
              parentId,
              sortOrder: index,
              query: item.query ?? null,
              brand: item.brand ?? null,
              categoryId: item.category
                ? (categoryIdByName.get(item.category) ?? null)
                : null,
            },
          });

          if (Array.isArray(item.children) && item.children.length > 0) {
            await createNodes(item.children, created.id);
          }
        }
      };

      await createNodes(nodes);
    });

    const hierarchy = await CatalogService.getCategoryHierarchy();
    return NextResponse.json(serializeHierarchy(hierarchy));
  } catch (error: any) {
    console.error("[PUT /api/catalog/categories/hierarchy]", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to update category hierarchy" },
      { status: 500 },
    );
  }
}
