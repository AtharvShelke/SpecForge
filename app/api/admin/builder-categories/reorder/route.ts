import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * PUT /api/admin/builder-categories/reorder
 * Accepts an array of { id, displayOrder } to bulk-reorder categories.
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'items (array of { id, displayOrder }) is required' },
        { status: 400 }
      );
    }

    // Run all updates in a transaction for atomicity
    await prisma.$transaction(
      items.map((item: { id: string; displayOrder: number }) =>
        prisma.builderCategoryConfig.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
        })
      )
    );

    // Return updated list
    const categories = await prisma.builderCategoryConfig.findMany({
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('[builder-categories/reorder] PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to reorder builder categories' },
      { status: 500 }
    );
  }
}
