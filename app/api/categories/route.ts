import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCategoryDefinitions } from '@/lib/services/categoryService';

const categoryPayloadSchema = z.object({
  code: z.string().min(1).transform((value) => value.trim().toUpperCase()),
  label: z.string().min(1).transform((value) => value.trim()),
  shortLabel: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  icon: z.string().trim().optional().nullable(),
  displayOrder: z.number().int().min(0).default(0),
  featuredOrder: z.number().int().min(0).optional().nullable(),
  isActive: z.boolean().default(true),
  showInFeatured: z.boolean().default(false),
});

const categoryUpdateSchema = categoryPayloadSchema.extend({
  id: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const includeInactive = req.nextUrl.searchParams.get('includeInactive') === 'true';
  const categories = await getCategoryDefinitions(includeInactive);

  return NextResponse.json(categories, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const payload = categoryPayloadSchema.parse(await req.json());

    const category = await prisma.categoryDefinition.create({
      data: payload,
      include: {
        buildSequence: {
          select: {
            stepOrder: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...category,
      stepOrder: category.buildSequence?.stepOrder ?? null,
      isInBuildSequence: Boolean(category.buildSequence),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    console.error('POST /api/categories error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const payload = categoryUpdateSchema.parse(await req.json());
    const { id, ...data } = payload;

    const category = await prisma.categoryDefinition.update({
      where: { id },
      data,
      include: {
        buildSequence: {
          select: {
            stepOrder: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...category,
      stepOrder: category.buildSequence?.stepOrder ?? null,
      isInBuildSequence: Boolean(category.buildSequence),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    console.error('PATCH /api/categories error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
