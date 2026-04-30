import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PRODUCT_SELECT = {
  id: true,
  slug: true,
  name: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  subCategoryId: true,
  subCategory: {
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
  variants: {
    where: {
      deletedAt: null,
    },
    include: {
      inventoryItems: {
        select: {
          quantityOnHand: true,
          quantityReserved: true,
          status: true,
          trackingType: true,
        },
      },
      variantSpecs: {
        include: {
          spec: true,
          option: true,
        },
      },
    },
  },
} as const;

export async function GET() {
  try {
    const topVariants = await prisma.orderItem.groupBy({
      by: ["variantId"],
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

    if (topVariants.length === 0) {
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

    const variants = await prisma.productVariant.findMany({
      where: {
        id: {
          in: topVariants.map((item) => item.variantId),
        },
      },
      select: {
        id: true,
        productId: true,
      },
    });

    const productIds = Array.from(new Set(variants.map((variant) => variant.productId)));
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
