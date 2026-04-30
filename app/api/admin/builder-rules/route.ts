import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/builder-rules
 * Returns all UI rules, ordered by priority (desc) then createdAt.
 */
export async function GET() {
  try {
    const rules = await prisma.builderUIRule.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json(rules);
  } catch (error) {
    console.error('[builder-rules] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch builder rules' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/builder-rules
 * Create a new UI rule.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      category,
      specKey,
      operator,
      value,
      action,
      priority = 0,
      enabled = true,
      metadata,
    } = body;

    if (!name || !category || !specKey || !operator || value === undefined || !action) {
      return NextResponse.json(
        { error: 'name, category, specKey, operator, value, and action are required' },
        { status: 400 }
      );
    }

    const sourceCategory = await prisma.category.findFirst({
      where: { name: category, deletedAt: null },
      select: { id: true },
    });
    if (!sourceCategory) {
      return NextResponse.json(
        { error: 'category must map to an existing Category.name' },
        { status: 400 },
      );
    }

    const rule = await prisma.builderUIRule.create({
      data: {
        name,
        category,
        specKey,
        operator,
        value: typeof value === 'string' ? value : JSON.stringify(value),
        action,
        priority,
        enabled,
        metadata: metadata || undefined,
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('[builder-rules] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create builder rule' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/builder-rules
 * Update an existing UI rule.
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

    if (data.category !== undefined) {
      const sourceCategory = await prisma.category.findFirst({
        where: { name: data.category, deletedAt: null },
        select: { id: true },
      });
      if (!sourceCategory) {
        return NextResponse.json(
          { error: 'category must map to an existing Category.name' },
          { status: 400 },
        );
      }
    }

    const updated = await prisma.builderUIRule.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.specKey !== undefined && { specKey: data.specKey }),
        ...(data.operator !== undefined && { operator: data.operator }),
        ...(data.value !== undefined && {
          value: typeof data.value === 'string' ? data.value : JSON.stringify(data.value),
        }),
        ...(data.action !== undefined && { action: data.action }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.enabled !== undefined && { enabled: data.enabled }),
        ...(data.metadata !== undefined && { metadata: data.metadata }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[builder-rules] PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update builder rule' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/builder-rules
 * Delete a UI rule. Pass ?id=... as query param.
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

    await prisma.builderUIRule.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[builder-rules] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete builder rule' },
      { status: 500 }
    );
  }
}
