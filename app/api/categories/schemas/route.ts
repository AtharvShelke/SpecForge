import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const attributeSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.string().min(1),
  required: z.boolean().default(false),
  options: z.array(z.string()).default([]),
  unit: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

const updateSchemaBody = z.object({
  categoryCode: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  attributes: z.array(attributeSchema),
}).superRefine((value, ctx) => {
  if (!value.categoryCode && !value.category) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'categoryCode is required',
      path: ['categoryCode'],
    });
  }
});

const ATTRIBUTE_SELECT = {
  id: true,
  key: true,
  label: true,
  type: true,
  required: true,
  options: true,
  unit: true,
  sortOrder: true,
} as const;

const SCHEMA_SELECT = {
  id: true,
  categoryDefinition: {
    select: {
      id: true,
      code: true,
      label: true,
      shortLabel: true,
    },
  },
  attributes: {
    select: ATTRIBUTE_SELECT,
    orderBy: { sortOrder: 'asc' as const },
  },
} as const;

function mapSchema(schema: {
  id: string;
  categoryDefinition: {
    id: string;
    code: string;
    label: string;
    shortLabel: string | null;
  };
  attributes: Array<{
    id: string;
    key: string;
    label: string;
    type: string;
    required: boolean;
    options: string[];
    unit: string | null;
    sortOrder: number;
  }>;
}) {
  return {
    id: schema.id,
    categoryCode: schema.categoryDefinition.code,
    category: schema.categoryDefinition.code,
    categoryDefinition: schema.categoryDefinition,
    attributes: schema.attributes,
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

    const schemas = await prisma.categorySchema.findMany({
      where,
      select: SCHEMA_SELECT,
    });

    return NextResponse.json(schemas.map(mapSchema));
  } catch (error) {
    console.error('GET /api/categories/schemas error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = updateSchemaBody.parse(await req.json());
    const categoryCode = data.categoryCode ?? data.category!;

    const categoryDefinition = await prisma.categoryDefinition.findUnique({
      where: { code: categoryCode },
      select: { id: true },
    });

    if (!categoryDefinition) {
      return NextResponse.json({ error: 'Unknown category code' }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const schema = await tx.categorySchema.upsert({
        where: { categoryDefinitionId: categoryDefinition.id },
        create: { categoryDefinitionId: categoryDefinition.id },
        update: {},
        select: { id: true },
      });

      await tx.attributeDefinition.deleteMany({
        where: { categorySchemaId: schema.id },
      });

      if (data.attributes.length > 0) {
        await tx.attributeDefinition.createMany({
          data: data.attributes.map((attribute) => ({
            categorySchemaId: schema.id,
            key: attribute.key,
            label: attribute.label,
            type: attribute.type,
            required: attribute.required,
            options: attribute.options,
            unit: attribute.unit ?? null,
            sortOrder: attribute.sortOrder,
          })),
        });
      }

      return tx.categorySchema.findUnique({
        where: { id: schema.id },
        select: SCHEMA_SELECT,
      });
    });

    return NextResponse.json(result ? mapSchema(result) : null);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    console.error('PUT /api/categories/schemas error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
