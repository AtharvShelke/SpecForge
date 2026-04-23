/**
 * build-guide.service.ts — Business logic for PC Build Guides.
 */

import { prisma } from "@/lib/prisma";
import { ServiceError } from "./catalog.service";

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
  } catch (error: any) {
    if (error?.code === "P2025") {
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
