/**
 * build.service.ts — Business logic for PC Builds and BuildItems.
 */

import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/errors";

interface BuildItem {
  id: string;
  buildId: string;
  productId: string;
  variantId: string; // fallback mapping to product ID for backward compatibility
  slotId: string;
  quantity: number;
}

interface Build {
  id: string;
  name: string;
  items: BuildItem[];
  createdAt: Date;
  updatedAt: Date;
}

// Global in-memory builds store
const buildsStore = new Map<string, Build>();

// ─────────────────────────────────────────────────────────────────────────────
// BUILDS
// ─────────────────────────────────────────────────────────────────────────────

export async function createBuild(data: { name?: string }) {
  const id = Math.random().toString(36).substring(2, 9);
  const buildName =
    data.name || `Custom Build ${new Date().toLocaleDateString()}`;

  const build: Build = {
    id,
    name: buildName,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  buildsStore.set(id, build);
  return build;
}

export async function updateBuild(id: string, data: { name?: string }) {
  const build = buildsStore.get(id);
  if (!build) throw new ServiceError("Build not found", 404);
  if (data.name) build.name = data.name;
  build.updatedAt = new Date();
  return build;
}

export async function listBuilds() {
  const builds = Array.from(buildsStore.values()).sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
  );

  return Promise.all(
    builds.map(async (build) => {
      const populatedItems = await Promise.all(
        build.items.map(async (item) => {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            include: {
              media: true,
              subcategory: {
                include: {
                  category: true,
                },
              },
              specs: {
                include: {
                  attribute: true,
                },
              },
            },
          });

          const mockVariant = product
            ? {
                id: product.id,
                productId: product.id,
                sku: product.sku || "",
                price: product.price || 0,
                compareAtPrice: product.compareAtPrice || null,
                status: product.stockStatus,
                product,
              }
            : null;

          return {
            ...item,
            variant: mockVariant,
          };
        }),
      );

      return {
        ...build,
        items: populatedItems.filter((item) => item.variant !== null),
      };
    }),
  );
}

export async function getBuildById(id: string) {
  const build = buildsStore.get(id);
  if (!build) throw new ServiceError("Build not found", 404);

  const populatedItems = await Promise.all(
    build.items.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          media: true,
          subcategory: {
            include: {
              category: true,
            },
          },
          specs: {
            include: {
              attribute: true,
            },
          },
        },
      });

      const mockVariant = product
        ? {
            id: product.id,
            productId: product.id,
            sku: product.sku || "",
            price: product.price || 0,
            compareAtPrice: product.compareAtPrice || null,
            status: product.stockStatus,
            product,
          }
        : null;

      return {
        ...item,
        variant: mockVariant,
      };
    }),
  );

  return {
    ...build,
    items: populatedItems.filter((item) => item.variant !== null),
  };
}

export async function deleteBuild(id: string) {
  const build = buildsStore.get(id);
  if (!build) throw new ServiceError("Build not found", 404);
  buildsStore.delete(id);
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILD ITEMS
// ─────────────────────────────────────────────────────────────────────────────

export async function addBuildItem(
  buildId: string,
  data: { variantId: string; slotId: string },
) {
  if (!data.variantId || !data.slotId)
    throw new ServiceError("variantId and slotId are required");

  const build = buildsStore.get(buildId);
  if (!build) throw new ServiceError("Build not found", 404);

  // In single-product mode, variantId is actually productId
  const productId = data.variantId;
  const itemId = Math.random().toString(36).substring(2, 9);

  // Enforce one item per slot
  build.items = build.items.filter((item) => item.slotId !== data.slotId);

  const newItem: BuildItem = {
    id: itemId,
    buildId,
    productId,
    variantId: productId,
    slotId: data.slotId,
    quantity: 1,
  };

  build.items.push(newItem);
  build.updatedAt = new Date();

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      media: true,
      subcategory: {
        include: {
          category: true,
        },
      },
      specs: {
        include: {
          attribute: true,
        },
      },
    },
  });

  const mockVariant = product
    ? {
        id: product.id,
        productId: product.id,
        sku: product.sku || "",
        price: product.price || 0,
        compareAtPrice: product.compareAtPrice || null,
        status: product.stockStatus,
        product,
      }
    : null;

  return {
    ...newItem,
    variant: mockVariant,
  };
}

export async function removeBuildItem(buildId: string, itemId: string) {
  const build = buildsStore.get(buildId);
  if (!build) throw new ServiceError("Build not found", 404);

  build.items = build.items.filter(
    (item) => item.id !== itemId && item.slotId !== itemId,
  );
  build.updatedAt = new Date();
}

