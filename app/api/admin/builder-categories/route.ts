import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/builder-categories
 * Returns all builder category configs, ordered by displayOrder.
 */
export async function GET() {
  try {
    const categories = await prisma.builderCategoryConfig.findMany({
      orderBy: { displayOrder: 'asc' },
    });
    const validCategoryNames = new Set(
      (
        await prisma.category.findMany({
          where: { deletedAt: null },
          select: { name: true },
        })
      ).map((category) => category.name),
    );

    return NextResponse.json(
      categories.filter((category) => validCategoryNames.has(category.categoryName)),
    );
  } catch (error) {
    console.error('[builder-categories] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch builder categories' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/builder-categories
 * Create a new builder category config.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      categoryName,
      enabled = true,
      isCore = false,
      required = false,
      allowMultiple = false,
      displayOrder = 0,
      icon,
      shortLabel,
      description,
    } = body;

    if (!categoryName) {
      return NextResponse.json(
        { error: 'categoryName is required' },
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

    const category = await prisma.builderCategoryConfig.create({
      data: {
        categoryName,
        enabled,
        isCore,
        required,
        allowMultiple,
        displayOrder,
        icon: icon || null,
        shortLabel: shortLabel || null,
        description: description || null,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Category config already exists for this category name' },
        { status: 409 }
      );
    }
    console.error('[builder-categories] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create builder category' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/builder-categories
 * Bulk update builder category configs (for editing individual categories).
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    if (data.categoryName !== undefined) {
      const sourceCategory = await prisma.category.findFirst({
        where: { name: data.categoryName, deletedAt: null },
        select: { id: true },
      });
      if (!sourceCategory) {
        return NextResponse.json(
          { error: 'categoryName must map to an existing Category.name' },
          { status: 400 },
        );
      }
    }

    const updated = await prisma.builderCategoryConfig.update({
      where: { id },
      data: {
        ...(data.categoryName !== undefined && { categoryName: data.categoryName }),
        ...(data.enabled !== undefined && { enabled: data.enabled }),
        ...(data.isCore !== undefined && { isCore: data.isCore }),
        ...(data.required !== undefined && { required: data.required }),
        ...(data.allowMultiple !== undefined && { allowMultiple: data.allowMultiple }),
        ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.shortLabel !== undefined && { shortLabel: data.shortLabel }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[builder-categories] PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update builder category' },
      { status: 500 }
    );
  }
}
