import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getBuildSequenceItems } from '@/lib/services/categoryService';

const reorderSchema = z.object({
  categoryIds: z.array(z.string().min(1)),
});

export async function GET() {
  const buildSequence = await getBuildSequenceItems();

  return NextResponse.json(buildSequence, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

export async function PUT(req: NextRequest) {
  try {
    const { categoryIds } = reorderSchema.parse(await req.json());

    await prisma.$transaction(async (tx) => {
      const existing = await tx.buildSequence.findMany({
        select: { categoryId: true },
      });

      const existingIds = new Set(existing.map((item) => item.categoryId));
      const requestedIds = new Set(categoryIds);

      for (const categoryId of categoryIds) {
        await tx.buildSequence.upsert({
          where: { categoryId },
          update: {
            stepOrder: categoryIds.indexOf(categoryId) + 1,
          },
          create: {
            categoryId,
            stepOrder: categoryIds.indexOf(categoryId) + 1,
          },
        });
      }

      const removedIds = [...existingIds].filter((categoryId) => !requestedIds.has(categoryId));
      if (removedIds.length > 0) {
        await tx.buildSequence.deleteMany({
          where: {
            categoryId: {
              in: removedIds,
            },
          },
        });
      }
    });

    return NextResponse.json(await getBuildSequenceItems());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    console.error('PUT /api/categories/build-sequence error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');

    if (!categoryId) {
      return NextResponse.json({ error: 'categoryId is required' }, { status: 400 });
    }

    await prisma.buildSequence.delete({
      where: { categoryId },
    });

    const remaining = await prisma.buildSequence.findMany({
      orderBy: { stepOrder: 'asc' },
      select: { id: true, categoryId: true },
    });

    await prisma.$transaction(
      remaining.map((entry, index) =>
        prisma.buildSequence.update({
          where: { id: entry.id },
          data: { stepOrder: index + 1 },
        })
      )
    );

    return NextResponse.json(await getBuildSequenceItems());
  } catch (error) {
    console.error('DELETE /api/categories/build-sequence error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
