import { prisma } from "@/lib/prisma";
import type { BuildSequenceItem, CategoryDefinition } from "@/lib/contracts/dtos";
import {
  categorySelect,
  mapBuildSequenceItem,
  mapCategoryDefinition,
  mapCategoryWithSequence,
} from "@/lib/contracts/server-mappers";

export async function getCategoryDefinitions(
  includeInactive = false
): Promise<CategoryDefinition[]> {
  const categories = await prisma.category.findMany({
    where: includeInactive ? undefined : { isActive: true },
    select: {
      ...categorySelect,
      buildSequence: {
        select: {
          stepOrder: true,
        },
      },
    },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });

  return categories
    .map(mapCategoryWithSequence)
    .sort((left, right) => {
      if (left.stepOrder != null && right.stepOrder != null) {
        return left.stepOrder - right.stepOrder;
      }
      if (left.stepOrder != null) {
        return -1;
      }
      if (right.stepOrder != null) {
        return 1;
      }
      if ((left.displayOrder ?? 0) !== (right.displayOrder ?? 0)) {
        return (left.displayOrder ?? 0) - (right.displayOrder ?? 0);
      }
      return left.name.localeCompare(right.name);
    });
}

export async function getCategoryDefinitionByCode(code: string) {
  const category = await prisma.category.findUnique({
    where: { code },
    select: {
      ...categorySelect,
      buildSequence: {
        select: {
          id: true,
          stepOrder: true,
        },
      },
    },
  });

  if (!category) {
    return null;
  }

  return mapCategoryDefinition(category, category.buildSequence?.stepOrder ?? null);
}

export async function getBuildSequence(): Promise<CategoryDefinition[]> {
  const sequence = await prisma.buildSequence.findMany({
    orderBy: { stepOrder: "asc" },
    select: {
      stepOrder: true,
      category: {
        select: categorySelect,
      },
    },
  });

  return sequence.map((entry) =>
    mapCategoryDefinition(entry.category, entry.stepOrder)
  );
}

export async function getBuildSequenceItems(): Promise<BuildSequenceItem[]> {
  const sequence = await prisma.buildSequence.findMany({
    orderBy: { stepOrder: "asc" },
    select: {
      id: true,
      categoryId: true,
      stepOrder: true,
      createdAt: true,
      updatedAt: true,
      category: {
        select: categorySelect,
      },
    },
  });

  return sequence.map(mapBuildSequenceItem);
}
