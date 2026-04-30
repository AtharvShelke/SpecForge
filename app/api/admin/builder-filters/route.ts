import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/builder-filters
 * Returns all filter overrides, optionally filtered by categoryName.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryName = searchParams.get('category');

    const overrides = await prisma.filterOverride.findMany({
      where: categoryName ? { categoryName } : undefined,
      include: {
        specDefinition: {
          select: {
            id: true,
            name: true,
            valueType: true,
            isFilterable: true,
            isRange: true,
            isMulti: true,
            filterGroup: true,
            filterOrder: true,
            subCategory: {
              select: {
                id: true,
                name: true,
                category: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json(overrides);
  } catch (error) {
    console.error('[builder-filters] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter overrides' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/builder-filters
 * Create or update a filter override (upsert by specDefinitionId + categoryName).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      specDefinitionId,
      categoryName,
      labelOverride,
      hidden = false,
      displayOrder = 0,
      groupOverride,
    } = body;

    if (!specDefinitionId || !categoryName) {
      return NextResponse.json(
        { error: 'specDefinitionId and categoryName are required' },
        { status: 400 }
      );
    }

    const sourceCategory = await prisma.category.findFirst({
      where: { name: categoryName, deletedAt: null },
      select: { id: true },
    });
    if (!sourceCategory) {
      return NextResponse.json(
        { error: 'categoryName must map to an existing Category.name' },
        { status: 400 },
      );
    }

    const spec = await prisma.specDefinition.findUnique({
      where: { id: specDefinitionId },
      select: {
        id: true,
        subCategory: {
          select: {
            category: { select: { name: true } },
          },
        },
      },
    });
    if (!spec) {
      return NextResponse.json(
        { error: 'specDefinitionId must reference an existing SpecDefinition' },
        { status: 400 },
      );
    }
    if (spec.subCategory.category.name !== categoryName) {
      return NextResponse.json(
        { error: 'specDefinitionId must belong to the provided categoryName' },
        { status: 400 },
      );
    }

    const override = await prisma.filterOverride.upsert({
      where: {
        specDefinitionId_categoryName: { specDefinitionId, categoryName },
      },
      update: {
        labelOverride: labelOverride ?? null,
        hidden,
        displayOrder,
        groupOverride: groupOverride ?? null,
      },
      create: {
        specDefinitionId,
        categoryName,
        labelOverride: labelOverride ?? null,
        hidden,
        displayOrder,
        groupOverride: groupOverride ?? null,
      },
      include: {
        specDefinition: {
          select: {
            id: true,
            name: true,
            valueType: true,
            isFilterable: true,
          },
        },
      },
    });

    return NextResponse.json(override);
  } catch (error) {
    console.error('[builder-filters] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save filter override' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/builder-filters
 * Delete a filter override. Pass ?id=... as query param.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id query param is required' },
        { status: 400 }
      );
    }

    await prisma.filterOverride.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[builder-filters] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete filter override' },
      { status: 500 }
    );
  }
}
