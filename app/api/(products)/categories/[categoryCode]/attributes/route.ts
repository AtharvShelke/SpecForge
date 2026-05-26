import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  AttributeInputTypeSchema,
  FilterTypeSchema,
} from '@/lib/contracts/validation';
import { mapCategoryAttributesConfig } from '@/lib/contracts/server-mappers';

const attributeSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: AttributeInputTypeSchema,
  required: z.boolean().default(false),
  options: z.array(z.string()).default([]),
  unit: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  dependencyKey: z.string().optional(),
  dependencyValue: z.string().optional(),
  isFilterable: z.boolean().default(true),
  isComparable: z.boolean().default(true),
  filterType: FilterTypeSchema.optional().nullable(),
  helpText: z.string().optional().nullable(),
});

const updateAttributesBody = z.object({
  attributes: z.array(attributeSchema),
});

function toSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function loadCategory(code: string, subcategorySlug?: string | null) {
  const category = await prisma.category.findFirst({
    where: {
      OR: [
        { code: code },
        { slug: code.toLowerCase() },
        { name: { equals: code, mode: 'insensitive' } },
      ],
    },
    include: {
      attributes: {
        where: subcategorySlug ? {
          subcategoryId: null,
        } : {}, // If no subcategory selected, get all attributes for this category
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
      const subcategoryAttrKeys = new Set(subcategory.attributes.map((attribute) => attribute.key));
      const mergedAttributes = [
        ...category.attributes.filter((attribute) => !subcategoryAttrKeys.has(attribute.key)),
        ...subcategory.attributes,
      ];
      
      return {
        ...category,
        attributes: mergedAttributes,
      };
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

    return NextResponse.json(mapCategoryAttributesConfig(result));
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
            type: attribute.type,
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
    return NextResponse.json(updated ? mapCategoryAttributesConfig(updated) : null);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    console.error('PUT /api/categories/[categoryCode]/attributes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
