import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCategoryDefinitions } from '@/lib/services/categoryService';

const categoryPayloadSchema = z.object({
  code: z.string().min(1).transform((value) => value.trim().toUpperCase()),
  label: z.string().min(1).transform((value) => value.trim()),
  shortLabel: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  image: z.string().trim().optional().nullable(),
  icon: z.string().trim().optional().nullable(),
  displayOrder: z.number().int().min(0).default(0),
  featuredOrder: z.number().int().min(0).optional().nullable(),
  isActive: z.boolean().default(true),
  showInFeatured: z.boolean().default(false),
});

const categoryUpdateSchema = categoryPayloadSchema.extend({
  id: z.number().int().positive(),
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

    const slug = payload.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const category = await prisma.category.create({
      data: {
        code: payload.code,
        name: payload.label,
        slug,
        shortLabel: payload.shortLabel,
        description: payload.description,
        image: payload.image,
        icon: payload.icon,
        displayOrder: payload.displayOrder,
        featuredOrder: payload.featuredOrder,
        isActive: payload.isActive,
        showInFeatured: payload.showInFeatured,
      },
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
      label: category.name,
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

    const slug = data.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const category = await prisma.category.update({
      where: { id },
      data: {
        code: data.code,
        name: data.label,
        slug,
        shortLabel: data.shortLabel,
        description: data.description,
        image: data.image,
        icon: data.icon,
        displayOrder: data.displayOrder,
        featuredOrder: data.featuredOrder,
        isActive: data.isActive,
        showInFeatured: data.showInFeatured,
      },
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
      label: category.name,
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
export const runtime = "nodejs";