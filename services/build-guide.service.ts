/**
 * build-guide.service.ts — Business logic for PC Build Guides.
 */

import { ServiceError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

function normalizeBuildGuide(guide: any) {
  if (!guide) return null;
  return {
    ...guide,
    items: guide.items.map((item: any) => {
      const mockVariant = item.product
        ? {
            id: item.product.id,
            productId: item.product.id,
            sku: item.product.sku || "",
            price: item.product.price || 0,
            compareAtPrice: item.product.compareAtPrice || null,
            status: item.product.stockStatus,
            product: item.product,
          }
        : null;
      return {
        ...item,
        variant: mockVariant,
      };
    }),
  };
}

export async function createBuildGuide(data: {
  title?: string;
  description?: string | null;
  category?: string;
  total?: number;
  items?: Array<{
    variantId: string;
    quantity?: number;
  }>;
}) {
  const title = data.title?.trim();
  const items = Array.isArray(data.items)
    ? data.items.filter((item) => item?.variantId)
    : [];

  if (!title) throw new ServiceError("Title is required", 400);
  if (items.length === 0) {
    throw new ServiceError("At least one build item is required", 400);
  }

  const productIds = [...new Set(items.map((item) => item.variantId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      price: true,
      subcategory: {
        select: {
          category: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (products.length !== productIds.length) {
    throw new ServiceError("One or more selected products were not found", 400);
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  const total =
    data.total ??
    items.reduce((sum, item) => {
      const product = productMap.get(item.variantId);
      const quantity = Math.max(1, Number(item.quantity ?? 1));
      return sum + Number(product?.price ?? 0) * quantity;
    }, 0);

  const categoryNameStr =
    data.category?.trim() ||
    productMap.get(items[0].variantId)?.subcategory?.category?.name ||
    "Custom";

  let categoryId: number | undefined = undefined;
  if (categoryNameStr) {
    const matchedCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { name: { equals: categoryNameStr, mode: "insensitive" } },
          { slug: { equals: categoryNameStr.toLowerCase().replace(/[^a-z0-9]+/g, "-"), mode: "insensitive" } }
        ]
      },
      select: { id: true }
    });
    if (matchedCategory) {
      categoryId = matchedCategory.id;
    }
  }

  const guide = await prisma.buildGuide.create({
    data: {
      title,
      description: data.description ?? null,
      categoryId,
      total,
      items: {
        create: items.map((item) => ({
          productId: item.variantId,
          quantity: Math.max(1, Number(item.quantity ?? 1)),
        })),
      },
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              media: true,
            },
          },
        },
      },
    },
  });

  return normalizeBuildGuide(guide);
}

export async function listBuildGuides() {
  const guides = await prisma.buildGuide.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: {
            include: {
              media: true,
            },
          },
        },
      },
    },
  });
  return guides.map(normalizeBuildGuide);
}

export async function getBuildGuideById(id: string) {
  const guide = await prisma.buildGuide.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            include: {
              media: true,
            },
          },
        },
      },
    },
  });

  if (!guide) throw new ServiceError("Build guide not found", 404);
  return normalizeBuildGuide(guide);
}

export async function updateBuildGuide(
  id: string,
  data: {
    title?: string;
    description?: string | null;
    category?: string;
    total?: number;
  },
) {
  try {
    let categoryId: number | undefined = undefined;
    if (data.category) {
      const matchedCategory = await prisma.category.findFirst({
        where: {
          OR: [
            { name: { equals: data.category, mode: "insensitive" } },
            { slug: { equals: data.category.toLowerCase().replace(/[^a-z0-9]+/g, "-"), mode: "insensitive" } }
          ]
        },
        select: { id: true }
      });
      if (matchedCategory) {
        categoryId = matchedCategory.id;
      }
    }

    const updated = await prisma.buildGuide.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        categoryId: categoryId,
        total: data.total,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                media: true,
              },
            },
          },
        },
      },
    });
    return normalizeBuildGuide(updated);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as any).code === "P2025"
    ) {
      throw new ServiceError("Build guide not found", 404);
    }
    throw error;
  }
}

export async function deleteBuildGuide(id: string) {
  const guide = await prisma.buildGuide.findUnique({ where: { id } });
  if (!guide) throw new ServiceError("Build guide not found", 404);

  await prisma.buildGuide.delete({ where: { id } });
}

