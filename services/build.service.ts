/**
 * build.service.ts — Business logic for PC Builds and BuildItems.
 */

import { prisma } from "@/lib/prisma";
import { ServiceError } from "./catalog.service";

// ─────────────────────────────────────────────────────────────────────────────
// BUILDS
// ─────────────────────────────────────────────────────────────────────────────

export async function createBuild(data: { name?: string }) {
  const buildName =
    data.name || `Custom Build ${new Date().toLocaleDateString()}`;

  return prisma.build.create({
    data: { name: buildName },
    include: { items: true },
  });
}

export async function listBuilds() {
  return prisma.build.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: true,
            },
          },
          slot: true,
        },
      },
    },
  });
}

export async function getBuildById(id: string) {
  const build = await prisma.build.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: { include: { media: true } },
            },
          },
          slot: true,
        },
      },
      buildCompatibilityResults: true,
    },
  });
  if (!build) throw new ServiceError("Build not found", 404);
  return build;
}

export async function deleteBuild(id: string) {
  const build = await prisma.build.findUnique({ where: { id } });
  if (!build) throw new ServiceError("Build not found", 404);

  await prisma.$transaction([
    prisma.buildItem.deleteMany({ where: { buildId: id } }),
    prisma.buildCompatibilityResult.deleteMany({ where: { buildId: id } }),
    prisma.build.delete({ where: { id } }),
  ]);
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

  return prisma.buildItem.upsert({
    where: {
      buildId_slotId: { buildId, slotId: data.slotId },
    },
    update: { variantId: data.variantId },
    create: {
      buildId,
      variantId: data.variantId,
      slotId: data.slotId,
    },
    include: {
      variant: { include: { product: true } },
    },
  });
}

export async function removeBuildItem(buildId: string, itemId: string) {
  const buildItem = await prisma.buildItem.findUnique({
    where: { id: itemId },
  });

  if (!buildItem || buildItem.buildId !== buildId)
    throw new ServiceError(
      "Build item not found or does not belong to this build",
      404,
    );

  await prisma.buildItem.delete({ where: { id: itemId } });
}
