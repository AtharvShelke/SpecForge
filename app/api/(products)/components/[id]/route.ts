/**
 * GET /api/components/:id
 *
 * Get a single component (product) with full specs and inventory data.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        brand: true,
        subcategory: {
          include: {
            category: true,
          },
        },
        category: true,
        media: { orderBy: { sortOrder: "asc" } },
        specs: {
          include: { attribute: true, option: true },
        },
        inventoryItems: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Component not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(product);
  } catch (error: any) {
    console.error("[GET_COMPONENT_ID]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
