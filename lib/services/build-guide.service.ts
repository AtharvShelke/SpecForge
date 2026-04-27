/**
 * build-guide.service.ts — Business logic for PC Build Guides.
 */

import { prisma } from "@/lib/prisma";
import { ServiceError } from "./catalog.service";

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

  const variantIds = [...new Set(items.map((item) => item.variantId))];
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    select: {
      id: true,
      price: true,
      product: {
        select: {
          subCategory: {
            select: {
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (variants.length !== variantIds.length) {
    throw new ServiceError("One or more selected variants were not found", 400);
  }

  const variantMap = new Map(variants.map((variant) => [variant.id, variant]));
  const total =
    data.total ??
    items.reduce((sum, item) => {
      const variant = variantMap.get(item.variantId);
      const quantity = Math.max(1, Number(item.quantity ?? 1));
      return sum + Number(variant?.price ?? 0) * quantity;
    }, 0);

  const category =
    data.category?.trim() ||
    variantMap.get(items[0].variantId)?.product.subCategory?.category?.name ||
    "Custom";

  return prisma.buildGuide.create({
    data: {
      title,
      description: data.description ?? null,
      category,
      total,
      items: {
        create: items.map((item) => ({
          variantId: item.variantId,
          quantity: Math.max(1, Number(item.quantity ?? 1)),
        })),
      },
    },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: {
                  media: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function listBuildGuides() {
  return prisma.buildGuide.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: {
                  media: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function getBuildGuideById(id: string) {
  const guide = await prisma.buildGuide.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: {
                  media: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!guide) throw new ServiceError("Build guide not found", 404);
  return guide;
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
    return await prisma.buildGuide.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        total: data.total,
      },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    media: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
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
