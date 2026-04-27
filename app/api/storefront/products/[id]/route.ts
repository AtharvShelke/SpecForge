import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PRODUCT_SELECT = {
  id: true,
  slug: true,
  name: true,
  description: true,
  metaTitle: true,
  metaDescription: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  subCategoryId: true,
  subCategory: {
    select: {
      name: true,
      category: {
        select: {
          name: true,
        },
      },
    },
  },
  brand: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  media: {
    select: {
      id: true,
      productId: true,
      url: true,
      altText: true,
      sortOrder: true,
    },
    orderBy: {
      sortOrder: "asc" as const,
    },
  },
  variants: {
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      productId: true,
      sku: true,
      price: true,
      compareAtPrice: true,
      attributes: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      inventoryItems: {
        select: {
          quantityOnHand: true,
          quantityReserved: true,
        },
      },
      variantSpecs: {
        select: {
          valueString: true,
          valueNumber: true,
          valueBool: true,
          option: {
            select: {
              label: true,
              value: true,
            },
          },
          spec: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  },
} as const;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const product = await prisma.product.findFirst({
      where: {
        deletedAt: null,
        OR: [{ id }, { slug: id }],
      },
      select: PRODUCT_SELECT,
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
