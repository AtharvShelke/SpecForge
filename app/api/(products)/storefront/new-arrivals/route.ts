import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PRODUCT_SELECT = {
  id: true,
  slug: true,
  name: true,
  description: true,
  status: true,
  price: true,
  compareAtPrice: true,
  sku: true,
  createdAt: true,
  updatedAt: true,
  subcategoryId: true,
  subcategory: {
    include: {
      category: true,
    },
  },
  brand: true,
  media: {
    orderBy: {
      sortOrder: "asc" as const,
    },
  },
  specs: {
    include: {
      attribute: true,
      option: true,
    },
  },
  inventoryItems: {
    select: {
      status: true,
    },
  },
} as const;

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        deletedAt: null,
        status: "ACTIVE",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
      select: PRODUCT_SELECT,
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Failed to fetch new arrivals:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
