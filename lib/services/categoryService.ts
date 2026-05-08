import { prisma } from '@/lib/prisma';
import { CategoryDefinition, BuildSequenceItem } from '@/types';

const categoryDefinitionSelect = {
  id: true,
  code: true,
  label: true,
  shortLabel: true,
  description: true,
  icon: true,
  displayOrder: true,
  featuredOrder: true,
  isActive: true,
  showInFeatured: true,
  createdAt: true,
  updatedAt: true,
} as const;

function toCategoryDefinition(
  category: {
    id: string;
    code: string;
    label: string;
    shortLabel: string | null;
    description: string | null;
    icon: string | null;
    displayOrder: number;
    featuredOrder: number | null;
    isActive: boolean;
    showInFeatured: boolean;
    createdAt: Date;
    updatedAt: Date;
  },
  stepOrder?: number | null
): CategoryDefinition {
  return {
    ...category,
    stepOrder: stepOrder ?? null,
    isInBuildSequence: stepOrder !== undefined && stepOrder !== null,
  };
}

export async function getCategoryDefinitions(includeInactive = false): Promise<CategoryDefinition[]> {
  const categories = await prisma.categoryDefinition.findMany({
    where: includeInactive ? undefined : { isActive: true },
    select: {
      ...categoryDefinitionSelect,
      buildSequence: {
        select: {
          stepOrder: true,
        },
      },
    },
    orderBy: [{ displayOrder: 'asc' }, { label: 'asc' }],
  });

  return categories
    .map((category) => toCategoryDefinition(category, category.buildSequence?.stepOrder ?? null))
    .sort((left, right) => {
      if (left.stepOrder != null && right.stepOrder != null) {
        return left.stepOrder - right.stepOrder;
      }
      if (left.stepOrder != null) return -1;
      if (right.stepOrder != null) return 1;
      if (left.displayOrder !== right.displayOrder) {
        return left.displayOrder - right.displayOrder;
      }
      return left.label.localeCompare(right.label);
    });
}

export async function getCategoryDefinitionByCode(code: string) {
  return prisma.categoryDefinition.findUnique({
    where: { code },
    select: {
      ...categoryDefinitionSelect,
      buildSequence: {
        select: {
          id: true,
          stepOrder: true,
        },
      },
    },
  });
}

export async function getBuildSequence(): Promise<CategoryDefinition[]> {
  const sequence = await prisma.buildSequence.findMany({
    orderBy: { stepOrder: 'asc' },
    select: {
      stepOrder: true,
      category: {
        select: categoryDefinitionSelect,
      },
    },
  });

  return sequence.map((entry) => toCategoryDefinition(entry.category, entry.stepOrder));
}

export async function getBuildSequenceItems(): Promise<BuildSequenceItem[]> {
  const sequence = await prisma.buildSequence.findMany({
    orderBy: { stepOrder: 'asc' },
    select: {
      id: true,
      categoryId: true,
      stepOrder: true,
      createdAt: true,
      updatedAt: true,
      category: {
        select: categoryDefinitionSelect,
      },
    },
  });

  return sequence.map((entry) => ({
    id: entry.id,
    categoryId: entry.categoryId,
    stepOrder: entry.stepOrder,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    category: toCategoryDefinition(entry.category, entry.stepOrder),
  }));
}
