import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const filterSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['checkbox', 'range', 'boolean', 'search', 'dropdown']),
  options: z.array(z.string()).default([]),
  min: z.number().optional(),
  max: z.number().optional(),
  dependencyKey: z.string().optional(),
  dependencyValue: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

const updateFilterBody = z.object({
  categoryCode: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  filters: z.array(filterSchema),
}).superRefine((value, ctx) => {
  if (!value.categoryCode && !value.category) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'categoryCode is required',
      path: ['categoryCode'],
    });
  }
});

const FILTER_SELECT = {
  id: true,
  key: true,
  label: true,
  type: true,
  options: true,
  min: true,
  max: true,
  dependencyKey: true,
  dependencyValue: true,
  sortOrder: true,
} as const;

const CONFIG_SELECT = {
  id: true,
  categoryDefinition: {
    select: {
      id: true,
      code: true,
      label: true,
      shortLabel: true,
    },
  },
  filters: {
    select: FILTER_SELECT,
    orderBy: { sortOrder: 'asc' as const },
  },
} as const;

function mapConfig(config: {
  id: string;
  categoryDefinition: {
    id: string;
    code: string;
    label: string;
    shortLabel: string | null;
  };
  filters: Array<{
    id: string;
    key: string;
    label: string;
    type: string;
    options: string[];
    min: number | null;
    max: number | null;
    dependencyKey: string | null;
    dependencyValue: string | null;
    sortOrder: number;
  }>;
}) {
  return {
    id: config.id,
    categoryCode: config.categoryDefinition.code,
    category: config.categoryDefinition.code,
    categoryDefinition: config.categoryDefinition,
    filters: config.filters,
  };
}

export async function GET(req: NextRequest) {
  try {
    const categoryCode = req.nextUrl.searchParams.get('category');
    const where = categoryCode
      ? {
          categoryDefinition: {
            code: categoryCode,
          },
        }
      : undefined;

    const configs = await prisma.categoryFilterConfig.findMany({
      where,
      select: CONFIG_SELECT,
    });

    return NextResponse.json(configs.map(mapConfig));
  } catch (error) {
    console.error('GET /api/categories/filters error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = updateFilterBody.parse(await req.json());
    const categoryCode = data.categoryCode ?? data.category!;

    const categoryDefinition = await prisma.categoryDefinition.findUnique({
      where: { code: categoryCode },
      select: { id: true },
    });

    if (!categoryDefinition) {
      return NextResponse.json({ error: 'Unknown category code' }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const config = await tx.categoryFilterConfig.upsert({
        where: { categoryDefinitionId: categoryDefinition.id },
        create: { categoryDefinitionId: categoryDefinition.id },
        update: {},
        select: { id: true },
      });

      await tx.filterDefinition.deleteMany({
        where: { categoryFilterConfigId: config.id },
      });

      if (data.filters.length > 0) {
        await tx.filterDefinition.createMany({
          data: data.filters.map((filter) => ({
            categoryFilterConfigId: config.id,
            key: filter.key,
            label: filter.label,
            type: filter.type,
            options: filter.options,
            min: filter.min ?? null,
            max: filter.max ?? null,
            dependencyKey: filter.dependencyKey ?? null,
            dependencyValue: filter.dependencyValue ?? null,
            sortOrder: filter.sortOrder,
          })),
        });
      }

      return tx.categoryFilterConfig.findUnique({
        where: { id: config.id },
        select: CONFIG_SELECT,
      });
    });

    return NextResponse.json(result ? mapConfig(result) : null);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    console.error('PUT /api/categories/filters error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
