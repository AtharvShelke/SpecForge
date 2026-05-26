import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Only return active rules for public consumption
    const rules = await prisma.compatibilityRule.findMany({
      where: { isActive: true },
      include: {
        clauses: {
          include: {
            sourceAttribute: {
              select: { id: true, key: true, label: true }
            },
            targetAttribute: {
              select: { id: true, key: true, label: true }
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        sourceCategory: {
          select: { id: true, name: true, code: true }
        },
        targetCategory: {
          select: { id: true, name: true, code: true }
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error('GET /api/compatibility-rules/public error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
