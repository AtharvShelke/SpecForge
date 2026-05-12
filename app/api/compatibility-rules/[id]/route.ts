import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

const clauseSchema = z.object({
  id: z.string().uuid().optional(),
  sourceAttributeId: z.string().uuid(),
  targetAttributeId: z.string().uuid(),
  operator: z.string().min(1),
  sourceValue: z.string().optional().nullable(),
  targetValue: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
});

const ruleUpdateSchema = z.object({
  name: z.string().min(1),
  message: z.string().optional().nullable(),
  severity: z.enum(['COMPATIBLE', 'WARNING', 'INCOMPATIBLE']),
  sourceCategoryId: z.number().int(),
  targetCategoryId: z.number().int(),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
  clauses: z.array(clauseSchema),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // Verify admin authentication
    await requireAdmin(req);
    const payload = ruleUpdateSchema.parse(await req.json());

    // Use transaction to update rule and its clauses
    const updatedRule = await prisma.$transaction(async (tx) => {
      // 1. Update the rule itself
      const rule = await tx.compatibilityRule.update({
        where: { id },
        data: {
          name: payload.name,
          message: payload.message,
          severity: payload.severity,
          sourceCategoryId: payload.sourceCategoryId,
          targetCategoryId: payload.targetCategoryId,
          isActive: payload.isActive,
          sortOrder: payload.sortOrder,
        },
      });

      // 2. Handle clauses
      // Delete existing clauses not in the payload
      const payloadClauseIds = payload.clauses.map(c => c.id).filter(Boolean) as string[];
      await tx.compatibilityRuleClause.deleteMany({
        where: {
          ruleId: id,
          id: { notIn: payloadClauseIds }
        }
      });

      // Upsert current clauses
      for (const clause of payload.clauses) {
        if (clause.id) {
          await tx.compatibilityRuleClause.update({
            where: { id: clause.id },
            data: {
              sourceAttributeId: clause.sourceAttributeId,
              targetAttributeId: clause.targetAttributeId,
              operator: clause.operator,
              sourceValue: clause.sourceValue,
              targetValue: clause.targetValue,
              sortOrder: clause.sortOrder,
            }
          });
        } else {
          await tx.compatibilityRuleClause.create({
            data: {
              ruleId: id,
              sourceAttributeId: clause.sourceAttributeId,
              targetAttributeId: clause.targetAttributeId,
              operator: clause.operator,
              sourceValue: clause.sourceValue,
              targetValue: clause.targetValue,
              sortOrder: clause.sortOrder,
            }
          });
        }
      }

      return tx.compatibilityRule.findUnique({
        where: { id },
        include: { clauses: true }
      });
    });

    return NextResponse.json(updatedRule);
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Admin access required')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error(`PUT /api/compatibility-rules/${id} error:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // Verify admin authentication
    await requireAdmin(req);
    await prisma.compatibilityRule.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Admin access required')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error(`DELETE /api/compatibility-rules/${id} error:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
