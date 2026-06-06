/**
 * compatibility.service.ts — Dynamic Compatibility Rule Engine (DCRE)
 *
 * Evaluates build compatibility using CompatibilityRuleClause joins.
 */

import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/errors";
import {
  buildCompatibilityContext,
  validateBuildSync,
  type BuildContext,
} from "@/lib/compatibilityEngine";

// ─────────────────────────────────────────────────────────────────────────────
// SCOPES (Stubs for backward compatibility)
// ─────────────────────────────────────────────────────────────────────────────

export async function listScopes() {
  return [];
}

export async function createScope(_data: {
  sourceSubCategoryId: string;
  targetSubCategoryId: string;
}) {
  return { id: "mock-scope" };
}

// ─────────────────────────────────────────────────────────────────────────────
// RULES — CRUD
// ─────────────────────────────────────────────────────────────────────────────

export async function listRules() {
  return prisma.compatibilityRule.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      clauses: {
        include: {
          sourceAttribute: true,
          targetAttribute: true,
        },
      },
    },
  });
}

export async function getRuleById(id: string) {
  const rule = await prisma.compatibilityRule.findUnique({
    where: { id },
    include: {
      clauses: {
        include: {
          sourceAttribute: true,
          targetAttribute: true,
        },
      },
    },
  });
  if (!rule) throw new ServiceError("Rule not found", 404);
  return rule;
}

export async function createRule(data: {
  name: string;
  description?: string;
  sourceCategoryId: number;
  targetCategoryId: number;
  severity: string;
  sortOrder?: number;
  isActive?: boolean;
  clauses?: Array<{
    sourceAttributeId: string;
    targetAttributeId: string;
    operator: string;
    sourceValue?: string | null;
    targetValue?: string | null;
    sortOrder?: number;
  }>;
}) {
  if (!data.name || !data.severity || !data.sourceCategoryId || !data.targetCategoryId)
    throw new ServiceError("name, severity, sourceCategoryId, and targetCategoryId are required");

  return prisma.compatibilityRule.create({
    data: {
      name: data.name,
      severity: data.severity as any,
      sourceCategoryId: data.sourceCategoryId,
      targetCategoryId: data.targetCategoryId,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
      clauses: {
        create: data.clauses?.map((c, idx) => ({
          sourceAttributeId: c.sourceAttributeId,
          targetAttributeId: c.targetAttributeId,
          operator: c.operator,
          sourceValue: c.sourceValue || null,
          targetValue: c.targetValue || null,
          sortOrder: c.sortOrder ?? idx,
        })) || [],
      },
    },
    include: {
      clauses: {
        include: {
          sourceAttribute: true,
          targetAttribute: true,
        },
      },
    },
  });
}

export async function updateRule(
  id: string,
  data: {
    name?: string;
    severity?: string;
    sourceCategoryId?: number;
    targetCategoryId?: number;
    sortOrder?: number;
    isActive?: boolean;
    clauses?: Array<{
      sourceAttributeId: string;
      targetAttributeId: string;
      operator: string;
      sourceValue?: string | null;
      targetValue?: string | null;
      sortOrder?: number;
    }>;
  },
) {
  const existing = await prisma.compatibilityRule.findUnique({ where: { id } });
  if (!existing) throw new ServiceError("Rule not found", 404);

  if (data.clauses) {
    await prisma.compatibilityRuleClause.deleteMany({
      where: { ruleId: id },
    });
  }

  return prisma.compatibilityRule.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.severity !== undefined && { severity: data.severity as any }),
      ...(data.sourceCategoryId !== undefined && { sourceCategoryId: data.sourceCategoryId }),
      ...(data.targetCategoryId !== undefined && { targetCategoryId: data.targetCategoryId }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.clauses && {
        clauses: {
          create: data.clauses.map((c, idx) => ({
            sourceAttributeId: c.sourceAttributeId,
            targetAttributeId: c.targetAttributeId,
            operator: c.operator,
            sourceValue: c.sourceValue || null,
            targetValue: c.targetValue || null,
            sortOrder: c.sortOrder ?? idx,
          })),
        },
      }),
    },
    include: {
      clauses: {
        include: {
          sourceAttribute: true,
          targetAttribute: true,
        },
      },
    },
  });
}

export async function deleteRule(id: string) {
  const existing = await prisma.compatibilityRule.findUnique({ where: { id } });
  if (!existing) throw new ServiceError("Rule not found", 404);
  await prisma.compatibilityRule.delete({ where: { id } });
  return { success: true };
}

export async function toggleRule(id: string, enabled: boolean) {
  return updateRule(id, { isActive: enabled });
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECK — Full build compatibility evaluation
// ─────────────────────────────────────────────────────────────────────────────

interface CheckResult {
  ruleId: string;
  ruleName: string;
  sourceVariantId?: string;
  targetVariantId?: string;
  passed: boolean;
  message: string;
  severity: string;
  sourceValue?: any;
  targetValue?: any;
}

export async function checkBuildCompatibility(buildId: string) {
  if (!buildId) throw new ServiceError("buildId is required");

  // Load build items from in-memory service
  const { getBuildById } = await import("./build.service");
  const build = await getBuildById(buildId);

  const buildItems = build.items;
  const context = await buildCompatibilityContext(buildItems);

  if (buildItems.length < 2) {
    return {
      buildId,
      isCompatible: true,
      message: "Not enough items to check compatibility",
      checks: [],
      context,
      summary: {
        totalChecks: 0,
        passed: 0,
        failed: 0,
        errors: 0,
        warnings: 0,
      },
    };
  }

  const results = await evaluateAllRules(buildItems, context);

  // Run static engine rules as well
  const engineReport = validateBuildSync(buildItems);
  for (const issue of engineReport.issues) {
    results.push({
      ruleId: issue.ruleId || `static-${issue.severity.toLowerCase()}`,
      ruleName: issue.message,
      passed: false,
      message: issue.message,
      severity: issue.severity,
    });
  }

  const isCompatible = results.every((r) => r.passed || r.severity !== "ERROR");

  return {
    id: `bcr-${buildId}`,
    buildId,
    isCompatible,
    checks: results.map((r, idx) => ({
      id: `check-${buildId}-${idx}`,
      resultId: `bcr-${buildId}`,
      ruleId: r.ruleId,
      passed: r.passed,
      message: r.message,
      severity: r.severity as any,
    })),
    summary: {
      totalChecks: results.length,
      passed: results.filter((r) => r.passed).length,
      failed: results.filter((r) => !r.passed).length,
      errors: results.filter((r) => !r.passed && r.severity === "ERROR").length,
      warnings: results.filter((r) => !r.passed && r.severity === "WARNING").length,
    },
    details: results,
    context,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST — Dry-run without persisting
// ─────────────────────────────────────────────────────────────────────────────

export async function testRules(variantIds: string[]) {
  if (!variantIds || variantIds.length === 0)
    throw new ServiceError("variantIds array is required");

  const products = await prisma.product.findMany({
    where: { id: { in: variantIds } },
    include: {
      subcategory: { include: { category: true } },
      specs: { include: { attribute: true } },
    },
  });

  const mockItems = products.map((product) => {
    const mockVariant = {
      id: product.id,
      productId: product.id,
      sku: product.sku || "",
      price: product.price || 0,
      compareAtPrice: product.compareAtPrice || null,
      status: product.stockStatus,
      product,
    };
    return {
      id: `mock-item-${product.id}`,
      productId: product.id,
      variantId: product.id,
      variant: mockVariant,
    };
  });

  const context = await buildCompatibilityContext(mockItems);
  const results = await evaluateAllRules(mockItems, context);

  // Run static engine rules
  const engineReport = validateBuildSync(mockItems);
  for (const issue of engineReport.issues) {
    results.push({
      ruleId: issue.ruleId || `static-${issue.severity.toLowerCase()}`,
      ruleName: issue.message,
      passed: false,
      message: issue.message,
      severity: issue.severity,
    });
  }

  const isCompatible = results.every((r) => r.passed || r.severity !== "ERROR");

  return {
    isCompatible,
    context,
    summary: {
      totalChecks: results.length,
      passed: results.filter((r) => r.passed).length,
      failed: results.filter((r) => !r.passed).length,
      errors: results.filter((r) => !r.passed && r.severity === "ERROR").length,
      warnings: results.filter((r) => !r.passed && r.severity === "WARNING").length,
    },
    details: results,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DEBUG — Single rule evaluation with trace
// ─────────────────────────────────────────────────────────────────────────────

export async function debugRule(ruleId: string, variantIds: string[]) {
  const rule = await getRuleById(ruleId);

  const products = await prisma.product.findMany({
    where: { id: { in: variantIds } },
    include: {
      subcategory: { include: { category: true } },
      specs: { include: { attribute: true } },
    },
  });

  const mockItems = products.map((product) => {
    const mockVariant = {
      id: product.id,
      productId: product.id,
      sku: product.sku || "",
      price: product.price || 0,
      compareAtPrice: product.compareAtPrice || null,
      status: product.stockStatus,
      product,
    };
    return {
      id: `mock-item-${product.id}`,
      productId: product.id,
      variantId: product.id,
      variant: mockVariant,
    };
  });

  const context = await buildCompatibilityContext(mockItems);
  const trace: any[] = [];

  for (let i = 0; i < mockItems.length; i++) {
    for (let j = 0; j < mockItems.length; j++) {
      if (i === j) continue;
      const productA = mockItems[i].variant.product;
      const productB = mockItems[j].variant.product;

      if (
        productA.categoryId === rule.sourceCategoryId &&
        productB.categoryId === rule.targetCategoryId
      ) {
        let rulePassed = true;
        const clauseTraces: any[] = [];

        for (const clause of rule.clauses) {
          const { passed, sourceValue, targetValue } = evaluateClause(
            clause,
            productA.specs,
            productB.specs,
          );
          clauseTraces.push({
            passed,
            sourceValue,
            targetValue,
            operator: clause.operator,
          });
          if (!passed) rulePassed = false;
        }

        trace.push({
          sourceVariant: productA.name,
          targetVariant: productB.name,
          passed: rulePassed,
          clauses: clauseTraces,
          message: rulePassed ? "OK" : (rule.message || "Incompatible components"),
        });
      }
    }
  }

  return { rule, context, trace };
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL — Rule evaluation engine
// ─────────────────────────────────────────────────────────────────────────────

function resolveSpecValue(specs: any[], attributeId: string): any {
  const spec = specs.find((s: any) => s.attributeId === attributeId);
  if (!spec) return undefined;

  if (spec.valueBoolean !== null && spec.valueBoolean !== undefined) {
    return spec.valueBoolean;
  }
  if (spec.valueNumber !== null && spec.valueNumber !== undefined) {
    return spec.valueNumber;
  }
  return spec.value;
}

function evaluateClause(
  clause: any,
  sourceSpecs: any[],
  targetSpecs: any[],
): { passed: boolean; sourceValue: any; targetValue: any } {
  const sourceValue = resolveSpecValue(sourceSpecs, clause.sourceAttributeId);
  const targetValue = resolveSpecValue(targetSpecs, clause.targetAttributeId);

  const left = sourceValue;
  let right = targetValue;

  if (clause.sourceValue !== null && clause.sourceValue !== undefined && clause.sourceValue !== "") {
    if (String(sourceValue) !== String(clause.sourceValue)) {
      return { passed: true, sourceValue, targetValue };
    }
  }

  if (clause.targetValue !== null && clause.targetValue !== undefined && clause.targetValue !== "") {
    right = clause.targetValue;
  }

  if (left === undefined || right === undefined) {
    return { passed: false, sourceValue, targetValue };
  }

  let passed = false;
  switch (clause.operator) {
    case "EQUAL":
      passed = String(left) === String(right);
      break;
    case "NOT_EQUAL":
      passed = String(left) !== String(right);
      break;
    case "LESS_THAN":
      passed = Number(left) < Number(right);
      break;
    case "LESS_OR_EQUAL":
      passed = Number(left) <= Number(right);
      break;
    case "GREATER_THAN":
      passed = Number(left) > Number(right);
      break;
    case "GREATER_OR_EQUAL":
      passed = Number(left) >= Number(right);
      break;
    case "CONTAINS":
      passed =
        String(left).toLowerCase().includes(String(right).toLowerCase()) ||
        String(right).toLowerCase().includes(String(left).toLowerCase());
      break;
    case "IN_LIST": {
      const list = String(right)
        .split(",")
        .map((s) => s.trim().toLowerCase());
      passed = list.includes(String(left).toLowerCase());
      break;
    }
    default:
      passed = false;
  }

  return { passed, sourceValue: left, targetValue: right };
}

async function evaluateAllRules(buildItems: any[], _context: BuildContext): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  const allRules = await prisma.compatibilityRule.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }],
    include: {
      clauses: {
        include: {
          sourceAttribute: true,
          targetAttribute: true,
        },
      },
    },
  });

  for (const rule of allRules) {
    for (let i = 0; i < buildItems.length; i++) {
      for (let j = 0; j < buildItems.length; j++) {
        if (i === j) continue;
        const itemA = buildItems[i];
        const itemB = buildItems[j];

        const productA = itemA.variant?.product || itemA.product || itemA;
        const productB = itemB.variant?.product || itemB.product || itemB;

        if (
          productA.categoryId === rule.sourceCategoryId &&
          productB.categoryId === rule.targetCategoryId
        ) {
          let rulePassed = true;
          const sourceSpecs = productA.specs || [];
          const targetSpecs = productB.specs || [];

          for (const clause of rule.clauses) {
            const { passed } = evaluateClause(clause, sourceSpecs, targetSpecs);
            if (!passed) {
              rulePassed = false;
            }
          }

          results.push({
            ruleId: rule.id,
            ruleName: rule.name,
            sourceVariantId: productA.id,
            targetVariantId: productB.id,
            passed: rulePassed,
            message: rulePassed ? "OK" : (rule.message || "Incompatible components"),
            severity: rule.severity,
          });
        }
      }
    }
  }

  return results;
}

