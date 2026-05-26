import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { CompatibilityLevelSchema } from '@/lib/contracts/validation';

const clauseSchema = z.object({
  sourceAttributeId: z.string().uuid(),
  targetAttributeId: z.string().uuid(),
  operator: z.string().min(1),
  sourceValue: z.string().optional().nullable(),
  targetValue: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
});

const ruleSchema = z.object({
  name: z.string().min(1),
  message: z.string().optional().nullable(),
  severity: CompatibilityLevelSchema,
  sourceCategoryId: z.number().int(),
  targetCategoryId: z.number().int(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  clauses: z.array(clauseSchema),
});

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin(req);
    
    const rules = await prisma.compatibilityRule.findMany({
      include: {
        clauses: {
          include: {
            sourceAttribute: true,
            targetAttribute: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        sourceCategory: true,
        targetCategory: true,
      },
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json(rules);
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Admin access required')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('GET /api/compatibility-rules error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin(req);
    
    const payload = ruleSchema.parse(await req.json());

    const rule = await prisma.compatibilityRule.create({
      data: {
        name: payload.name,
        message: payload.message,
        severity: payload.severity,
        sourceCategoryId: payload.sourceCategoryId,
        targetCategoryId: payload.targetCategoryId,
        isActive: payload.isActive,
        sortOrder: payload.sortOrder,
        clauses: {
          create: payload.clauses.map((clause) => ({
            sourceAttributeId: clause.sourceAttributeId,
            targetAttributeId: clause.targetAttributeId,
            operator: clause.operator,
            sourceValue: clause.sourceValue,
            targetValue: clause.targetValue,
            sortOrder: clause.sortOrder,
          })),
        },
      },
      include: {
        clauses: true,
      },
    });

    return NextResponse.json(rule);
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Admin access required')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('POST /api/compatibility-rules error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
