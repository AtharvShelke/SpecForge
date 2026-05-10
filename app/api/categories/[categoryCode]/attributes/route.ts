import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const attributeSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['text', 'number', 'select', 'multi-select', 'boolean']),
  required: z.boolean().default(false),
  options: z.array(z.string()).default([]),
  unit: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  dependencyKey: z.string().optional(),
  dependencyValue: z.string().optional(),
  isFilterable: z.boolean().default(true),
  isComparable: z.boolean().default(true),
  filterType: z.enum(['checkbox', 'range', 'boolean', 'search', 'dropdown']).optional().nullable(),
  helpText: z.string().optional().nullable(),
});

const updateAttributesBody = z.object({
  attributes: z.array(attributeSchema),
});

function toSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function mapAttributes(category: {
  id: number;
  code: string;
  name: string;
  slug: string;
  shortLabel: string | null;
  createdAt: Date;
  updatedAt: Date;
  attributes: Array<{
    id: string;
    key: string;
    label: string;
    type: string;
    isRequired: boolean;
    unit: string | null;
    sortOrder: number;
    isFilterable: boolean;
    isComparable: boolean;
    filterType: string | null;
    helpText: string | null;
    dependencyAttribute: { key: string } | null;
    dependencyOption: { value: string } | null;
    options: Array<{ value: string }>;
  }>;
}) {
  return {
    id: `attributes-${category.id}`,
    categoryCode: category.code,
    category: category.code,
    categoryDefinition: {
      id: category.id,
      code: category.code,
      slug: category.slug,
      label: category.name,
      name: category.name,
      shortLabel: category.shortLabel,
    },
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
    attributes: category.attributes.map((attribute) => ({
      id: attribute.id,
      key: attribute.key,
      label: attribute.label,
      type: attribute.type === 'multi_select' ? 'multi-select' : attribute.type,
      required: attribute.isRequired,
      options: attribute.options.map((option) => option.value),
      unit: attribute.unit ?? undefined,
      sortOrder: attribute.sortOrder,
      categoryId: category.id,
      categoryCode: category.code,
      dependencyKey: attribute.dependencyAttribute?.key ?? undefined,
      dependencyValue: attribute.dependencyOption?.value ?? undefined,
      isFilterable: attribute.isFilterable,
      isComparable: attribute.isComparable,
      filterType: attribute.filterType,
      helpText: attribute.helpText,
    })),
  };
}

async function loadCategory(code: string, subcategorySlug?: string | null) {
  const category = await prisma.category.findUnique({
    where: { code },
    include: {
      attributes: {
        where: {
          subcategoryId: null,
        },
        include: {
          dependencyAttribute: { select: { key: true } },
          dependencyOption: { select: { value: true } },
          options: {
            select: { value: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
      },
    },
  });

  if (!category) return null;

  // If subcategory is specified, also fetch subcategory-specific attributes
  if (subcategorySlug) {
    const subcategory = await prisma.subcategory.findUnique({
      where: { slug: subcategorySlug },
      include: {
        attributes: {
          include: {
            dependencyAttribute: { select: { key: true } },
            dependencyOption: { select: { value: true } },
            options: {
              select: { value: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
        },
      },
    });

    if (subcategory && subcategory.attributes.length > 0) {
      // Merge category-level and subcategory-level attributes
      // Subcategory attributes override category-level attributes with the same key
      const categoryAttrKeys = new Set(category.attributes.map(a => a.key));
      const mergedAttributes = [
        ...category.attributes.filter((a: any) => !categoryAttrKeys.has(a.key)),
        ...subcategory.attributes,
      ];
      
      return {
        ...category,
        attributes: mergedAttributes,
      } as any;
    }
  }

  return category;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ categoryCode: string }> }
) {
  try {
    const { categoryCode } = await context.params;
    const { searchParams } = new URL(req.url);
    const subcategorySlug = searchParams.get('subcategory') || null;
    
    const result = await loadCategory(categoryCode.toUpperCase(), subcategorySlug);

    if (!result) {
      return NextResponse.json({ error: 'Unknown category code' }, { status: 404 });
    }

    return NextResponse.json(mapAttributes(result));
  } catch (error) {
    console.error('GET /api/categories/[categoryCode]/attributes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ categoryCode: string }> }
) {
  try {
    const { categoryCode } = await context.params;
    const normalizedCode = categoryCode.toUpperCase();
    const data = updateAttributesBody.parse(await req.json());

    const category = await prisma.category.findUnique({
      where: { code: normalizedCode },
      select: { id: true },
    });

    if (!category) {
      return NextResponse.json({ error: 'Unknown category code' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.categoryAttribute.deleteMany({
        where: { categoryId: category.id },
      });

      const createdAttributes = new Map<string, string>();
      const createdOptions = new Map<string, string>();

      for (const attribute of data.attributes.sort((left, right) => left.sortOrder - right.sortOrder)) {
        const created = await tx.categoryAttribute.create({
          data: {
            categoryId: category.id,
            key: attribute.key,
            label: attribute.label,
            type: attribute.type === 'multi-select' ? 'multi_select' : attribute.type,
            isRequired: attribute.required,
            unit: attribute.unit ?? null,
            sortOrder: attribute.sortOrder,
            isFilterable: attribute.isFilterable,
            isComparable: attribute.isComparable,
            filterType: attribute.filterType ?? null,
            helpText: attribute.helpText ?? null,
          },
        });

        createdAttributes.set(attribute.key, created.id);

        for (const [index, option] of attribute.options.entries()) {
          const createdOption = await tx.attributeOption.create({
            data: {
              attributeId: created.id,
              value: option,
              slug: toSlug(option),
              sortOrder: index,
            },
          });
          createdOptions.set(`${attribute.key}:${option}`, createdOption.id);
        }
      }

      for (const attribute of data.attributes) {
        if (!attribute.dependencyKey || !attribute.dependencyValue) continue;

        const attrId = createdAttributes.get(attribute.key);
        if (!attrId) continue;

        await tx.categoryAttribute.update({
          where: { id: attrId },
          data: {
            dependencyAttributeId: createdAttributes.get(attribute.dependencyKey) ?? null,
            dependencyOptionId: createdOptions.get(`${attribute.dependencyKey}:${attribute.dependencyValue}`) ?? null,
          },
        });
      }
    });

    const updated = await loadCategory(normalizedCode);
    return NextResponse.json(updated ? mapAttributes(updated) : null);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    console.error('PUT /api/categories/[categoryCode]/attributes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
