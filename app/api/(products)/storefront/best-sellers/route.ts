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
  stockStatus: true,
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
} as const;

export async function GET() {
  try {
    // Group best-selling products by productId from order items
    const topProducts = await prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 8,
    });

    if (topProducts.length === 0) {
      // Fallback to new arrivals
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
    }

    const productIds = topProducts.map((item) => item.productId);

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
        deletedAt: null,
        status: "ACTIVE",
      },
      select: PRODUCT_SELECT,
    });

    const productMap = new Map(products.map((product) => [product.id, product]));

    const sortedProducts = productIds
      .map((productId) => productMap.get(productId))
      .filter((product): product is NonNullable<typeof product> => Boolean(product));

    return NextResponse.json(sortedProducts);
  } catch (error) {
    console.error("Failed to fetch best sellers:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
