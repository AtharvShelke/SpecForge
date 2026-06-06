import { HomepageCategory } from "@/types";
import { normalizeCatalogProduct } from "./catalogFrontend";
import { prisma } from "./prisma";

export async function getNewArrivals() {
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
      include: {
        brand: true,
        subcategory: {
          include: {
            category: true,
          },
        },
        media: {
          orderBy: {
            sortOrder: "asc",
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
      },
    });

    return products.map((product: any) => normalizeCatalogProduct(product));
  } catch (error) {
    console.error("Direct getNewArrivals query failed, returning fallback:", error);
    return [];
  }
}

export async function getBestSellers() {
  try {
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
      return products.map((product: any) => normalizeCatalogProduct(product));
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

    return sortedProducts.map((product: any) => normalizeCatalogProduct(product));
  } catch (error) {
    console.error("Direct getBestSellers query failed, returning fallback:", error);
    return [];
  }
}

export async function getHomepageCategories(): Promise<HomepageCategory[]> {
  try {
    const [categories, hierarchy] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          subcategories: {
            where: { isActive: true },
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
        .filter((entry): entry is { categoryId: number; label: string; sortOrder: number } =>
          entry.categoryId !== null,
        )
        .map((entry) => [entry.categoryId, { label: entry.label, sortOrder: entry.sortOrder }]),
    );

    const storefrontCategories: HomepageCategory[] = categories
      .map((category) => {
        const hierarchyEntry = hierarchyByCategoryId.get(category.id);
        return {
          id: String(category.id),
          name: category.name,
          displayName: hierarchyEntry?.label ?? category.name,
          sortOrder: hierarchyEntry?.sortOrder ?? Number.MAX_SAFE_INTEGER,
          subCategories: category.subcategories.map((sub) => ({
            id: String(sub.id),
            name: sub.name,
          })),
        };
      })
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }
        return a.displayName.localeCompare(b.displayName);
      });

    return storefrontCategories;
  } catch (error) {
    console.error("Direct getHomepageCategories query failed, returning fallback:", error);
    return [];
  }
}
