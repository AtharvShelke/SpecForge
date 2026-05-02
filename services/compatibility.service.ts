/**
 * compatibility.service.ts — Dynamic Compatibility Rule Engine (DCRE)
 *
 * Supports three rule types:
 *   PAIR      — Classic source-spec vs target-spec comparison
 *   COMPONENT — Single component constraints
 *   GLOBAL    — Full-build constraints (e.g., total TDP vs PSU)
 */

import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/errors";
import {
  buildCompatibilityContext,
  formatCompatibilityMessage,
  type BuildContext,
} from "@/lib/compatibilityEngine";

// ─────────────────────────────────────────────────────────────────────────────
// SCOPES
// ─────────────────────────────────────────────────────────────────────────────

export async function listScopes() {
  return prisma.compatibilityScope.findMany({
    include: {
      sourceSubCategory: true,
      targetSubCategory: true,
      rules: {
        include: { sourceSpec: true, targetSpec: true },
      },
    },
  });
}

export async function createScope(data: {
  sourceSubCategoryId: string;
  targetSubCategoryId: string;
}) {
  if (!data.sourceSubCategoryId || !data.targetSubCategoryId)
    throw new ServiceError(
      "sourceSubCategoryId and targetSubCategoryId are required",
    );

  return prisma.compatibilityScope.upsert({
    where: {
      sourceSubCategoryId_targetSubCategoryId: {
        sourceSubCategoryId: data.sourceSubCategoryId,
        targetSubCategoryId: data.targetSubCategoryId,
      },
    },
    update: {},
    create: {
      sourceSubCategoryId: data.sourceSubCategoryId,
      targetSubCategoryId: data.targetSubCategoryId,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// RULES — CRUD
// ─────────────────────────────────────────────────────────────────────────────

export async function listRules() {
  return prisma.compatibilityRule.findMany({
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    include: {
      scope: {
        include: { sourceSubCategory: true, targetSubCategory: true },
      },
      sourceSpec: true,
      targetSpec: true,
    },
  });
}

export async function getRuleById(id: string) {
  const rule = await prisma.compatibilityRule.findUnique({
    where: { id },
    include: {
      scope: {
        include: { sourceSubCategory: true, targetSubCategory: true },
      },
      sourceSpec: true,
      targetSpec: true,
    },
  });
  if (!rule) throw new ServiceError("Rule not found", 404);
  return rule;
}

export async function createRule(data: {
  name: string;
  description?: string;
  type?: string;
  scopeId?: string;
  sourceSpecId?: string;
  targetSpecId?: string;
  operator?: string;
  message?: string;
  messageTemplate?: string;
  severity: string;
  logic?: any;
  priority?: number;
  enabled?: boolean;
}) {
  const ruleType = (data.type as any) || "PAIR";

  if (!data.name || !data.severity)
    throw new ServiceError("name and severity are required");

  // PAIR rules require spec fields
  if (ruleType === "PAIR") {
    if (!data.scopeId || !data.sourceSpecId || !data.targetSpecId || !data.operator)
      throw new ServiceError("PAIR rules require scopeId, sourceSpecId, targetSpecId, and operator");

    const scope = await prisma.compatibilityScope.findUnique({
      where: { id: data.scopeId },
    });
    if (!scope) throw new ServiceError("Scope not found", 404);

    const sourceSpec = await prisma.specDefinition.findUnique({
      where: { id: data.sourceSpecId },
    });
    const targetSpec = await prisma.specDefinition.findUnique({
      where: { id: data.targetSpecId },
    });

    if (!sourceSpec)
      throw new ServiceError(`Source spec not found`, 404);
    if (!targetSpec)
      throw new ServiceError(`Target spec not found`, 404);

    if (sourceSpec.subCategoryId !== scope.sourceSubCategoryId)
      throw new ServiceError(
        `Source spec "${sourceSpec.name}" does not belong to source subcategory`,
      );
    if (targetSpec.subCategoryId !== scope.targetSubCategoryId)
      throw new ServiceError(
        `Target spec "${targetSpec.name}" does not belong to target subcategory`,
      );
  }

  return prisma.compatibilityRule.create({
    data: {
      name: data.name,
      description: data.description,
      type: ruleType,
      scopeId: data.scopeId || null,
      sourceSpecId: data.sourceSpecId || null,
      targetSpecId: data.targetSpecId || null,
      operator: (data.operator as any) || null,
      message: data.message || data.messageTemplate || "Compatibility issue",
      messageTemplate: data.messageTemplate,
      severity: data.severity as any,
      logic: data.logic || null,
      priority: data.priority ?? 0,
      enabled: data.enabled ?? true,
    },
    include: {
      sourceSpec: true,
      targetSpec: true,
      scope: {
        include: { sourceSubCategory: true, targetSubCategory: true },
      },
    },
  });
}

export async function updateRule(
  id: string,
  data: {
    name?: string;
    description?: string;
    type?: string;
    scopeId?: string | null;
    sourceSpecId?: string | null;
    targetSpecId?: string | null;
    operator?: string | null;
    message?: string;
    messageTemplate?: string | null;
    severity?: string;
    logic?: any;
    priority?: number;
    enabled?: boolean;
  },
) {
  const existing = await prisma.compatibilityRule.findUnique({ where: { id } });
  if (!existing) throw new ServiceError("Rule not found", 404);

  return prisma.compatibilityRule.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.type !== undefined && { type: data.type as any }),
      ...(data.scopeId !== undefined && { scopeId: data.scopeId }),
      ...(data.sourceSpecId !== undefined && { sourceSpecId: data.sourceSpecId }),
      ...(data.targetSpecId !== undefined && { targetSpecId: data.targetSpecId }),
      ...(data.operator !== undefined && { operator: data.operator as any }),
      ...(data.message !== undefined && { message: data.message }),
      ...(data.messageTemplate !== undefined && { messageTemplate: data.messageTemplate }),
      ...(data.severity !== undefined && { severity: data.severity as any }),
      ...(data.logic !== undefined && { logic: data.logic }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.enabled !== undefined && { enabled: data.enabled }),
    },
    include: {
      sourceSpec: true,
      targetSpec: true,
      scope: {
        include: { sourceSubCategory: true, targetSubCategory: true },
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
  return updateRule(id, { enabled });
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECK — Full build compatibility evaluation
// ─────────────────────────────────────────────────────────────────────────────

export async function checkBuildCompatibility(buildId: string) {
  if (!buildId) throw new ServiceError("buildId is required");

  const build = await prisma.build.findUnique({
    where: { id: buildId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: { subCategory: true },
              },
              variantSpecs: {
                include: { spec: true, option: true },
              },
            },
          },
          slot: true,
        },
      },
    },
  });

  if (!build) throw new ServiceError("Build not found", 404);

  const buildItems = build.items;
  const context = buildCompatibilityContext(buildItems);

  if (buildItems.length < 2) {
    return {
      buildId,
      isCompatible: true,
      message: "Not enough items to check compatibility",
      checks: [],
      context,
    };
  }

  const results = await evaluateAllRules(buildItems, context);

  const isCompatible = results.every((r) => r.passed || r.severity !== "ERROR");

  const finalResult = await prisma.buildCompatibilityResult.create({
    data: {
      buildId,
      isCompatible,
      checks: {
        create: results.map((r) => ({
          ruleId: r.ruleId,
          sourceVariantId: r.sourceVariantId || null,
          targetVariantId: r.targetVariantId || null,
          passed: r.passed,
          message: r.message,
          severity: r.severity as any,
        })),
      },
    },
    include: { checks: { include: { rule: true } } },
  });

  return {
    ...finalResult,
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
// TEST — Dry-run without persisting (for sandbox)
// ─────────────────────────────────────────────────────────────────────────────

export async function testRules(variantIds: string[]) {
  if (!variantIds || variantIds.length === 0)
    throw new ServiceError("variantIds array is required");

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: {
      product: { include: { subCategory: true } },
      variantSpecs: { include: { spec: true, option: true } },
    },
  });

  // Build mock build items
  const mockItems = variants.map((v) => ({
    variantId: v.id,
    variant: v,
  }));

  const context = buildCompatibilityContext(mockItems);
  const results = await evaluateAllRules(mockItems, context);

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

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: {
      product: { include: { subCategory: true } },
      variantSpecs: { include: { spec: true, option: true } },
    },
  });

  const mockItems = variants.map((v) => ({
    variantId: v.id,
    variant: v,
  }));

  const context = buildCompatibilityContext(mockItems);

  // Evaluate just this one rule
  const trace: any[] = [];

  if (rule.type === "PAIR" && rule.sourceSpecId && rule.targetSpecId) {
    for (let i = 0; i < mockItems.length; i++) {
      for (let j = 0; j < mockItems.length; j++) {
        if (i === j) continue;
        const sourceSpecs = mockItems[i].variant.variantSpecs;
        const targetSpecs = mockItems[j].variant.variantSpecs;
        const sourceValue = resolveSpecValue(sourceSpecs, rule.sourceSpecId);
        const targetValue = resolveSpecValue(targetSpecs, rule.targetSpecId);
        const { passed } = evaluatePairRule(rule, sourceSpecs, targetSpecs);

        trace.push({
          sourceVariant: mockItems[i].variant.product?.name,
          targetVariant: mockItems[j].variant.product?.name,
          sourceSpecName: rule.sourceSpec?.name,
          targetSpecName: rule.targetSpec?.name,
          sourceValue,
          targetValue,
          operator: rule.operator,
          passed,
          message: passed ? "OK" : formatCompatibilityMessage(rule.messageTemplate || rule.message, context),
        });
      }
    }
  } else if (rule.logic) {
    const passed = evaluateLogicNode(rule.logic, context);
    trace.push({
      logicNode: rule.logic,
      contextSnapshot: context,
      passed,
      message: passed ? "OK" : formatCompatibilityMessage(rule.messageTemplate || rule.message, context),
    });
  }

  return { rule, context, trace };
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL — Rule evaluation engine
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

async function evaluateAllRules(buildItems: any[], context: BuildContext): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  // Load all enabled rules ordered by priority
  const allRules = await prisma.compatibilityRule.findMany({
    where: { enabled: true },
    orderBy: [{ priority: "desc" }],
    include: {
      sourceSpec: true,
      targetSpec: true,
      scope: true,
    },
  });

  const subCategoryIds = [
    ...new Set(buildItems.map((item) => item.variant.product.subCategoryId || item.variant.product.subCategory?.id)),
  ].filter(Boolean);

  for (const rule of allRules) {
    if (rule.type === "PAIR") {
      // Existing PAIR logic — evaluate across directed component pairs
      if (!rule.scopeId || !rule.sourceSpecId || !rule.targetSpecId) continue;

      for (let i = 0; i < buildItems.length; i++) {
        for (let j = 0; j < buildItems.length; j++) {
          if (i === j) continue;
          const itemA = buildItems[i];
          const itemB = buildItems[j];
          const srcSubCat = itemA.variant.product.subCategoryId || itemA.variant.product.subCategory?.id;
          const tgtSubCat = itemB.variant.product.subCategoryId || itemB.variant.product.subCategory?.id;

          if (
            rule.scope &&
            srcSubCat === rule.scope.sourceSubCategoryId &&
            tgtSubCat === rule.scope.targetSubCategoryId
          ) {
            const { passed, sourceValue, targetValue } = evaluatePairRule(
              rule,
              itemA.variant.variantSpecs,
              itemB.variant.variantSpecs,
            );

            results.push({
              ruleId: rule.id,
              ruleName: rule.name,
              sourceVariantId: itemA.variantId,
              targetVariantId: itemB.variantId,
              passed,
              message: passed ? "OK" : formatCompatibilityMessage(rule.messageTemplate || rule.message, context),
              severity: rule.severity,
              sourceValue,
              targetValue,
            });
          }
        }
      }
    } else if (rule.type === "GLOBAL" || rule.type === "COMPONENT") {
      // GLOBAL/COMPONENT rules use the logic JSON against the full context
      if (!rule.logic) continue;
      const passed = evaluateLogicNode(rule.logic, context);

      results.push({
        ruleId: rule.id,
        ruleName: rule.name,
        passed,
        message: passed ? "OK" : formatCompatibilityMessage(rule.messageTemplate || rule.message, context),
        severity: rule.severity,
      });
    }
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// Spec resolver + PAIR evaluator
// ─────────────────────────────────────────────────────────────────────────────

function resolveSpecValue(specs: any[], specId: string): any {
  const spec = specs.find((s: any) => s.specId === specId);
  if (!spec) return undefined;

  if (spec.option?.value !== undefined) return spec.option.value;
  if (spec.valueString !== null && spec.valueString !== undefined)
    return spec.valueString;
  if (spec.valueNumber !== null && spec.valueNumber !== undefined)
    return Number(spec.valueNumber);
  if (spec.valueBool !== null && spec.valueBool !== undefined)
    return spec.valueBool;
  return undefined;
}

function evaluatePairRule(
  rule: any,
  sourceSpecs: any[],
  targetSpecs: any[],
): { passed: boolean; sourceValue: any; targetValue: any } {
  const sourceValue = resolveSpecValue(sourceSpecs, rule.sourceSpecId);
  const targetValue = resolveSpecValue(targetSpecs, rule.targetSpecId);

  if (sourceValue === undefined || targetValue === undefined) {
    return { passed: false, sourceValue, targetValue };
  }

  let passed = false;
  switch (rule.operator) {
    case "EQUAL":
      passed = String(sourceValue) === String(targetValue);
      break;
    case "NOT_EQUAL":
      passed = String(sourceValue) !== String(targetValue);
      break;
    case "LESS_THAN":
      passed = Number(sourceValue) < Number(targetValue);
      break;
    case "LESS_OR_EQUAL":
      passed = Number(sourceValue) <= Number(targetValue);
      break;
    case "GREATER_THAN":
      passed = Number(sourceValue) > Number(targetValue);
      break;
    case "GREATER_OR_EQUAL":
      passed = Number(sourceValue) >= Number(targetValue);
      break;
    case "CONTAINS":
      passed =
        String(sourceValue).includes(String(targetValue)) ||
        String(targetValue).includes(String(sourceValue));
      break;
    case "IN_LIST": {
      const list = String(sourceValue)
        .split(",")
        .map((s) => s.trim());
      passed = list.includes(String(targetValue));
      break;
    }
    default:
      passed = false;
  }

  return { passed, sourceValue, targetValue };
}

// ─────────────────────────────────────────────────────────────────────────────
// Logic evaluator — evaluates JSON condition trees for GLOBAL/COMPONENT rules
// ─────────────────────────────────────────────────────────────────────────────

function resolveContextRef(ref: string, context: BuildContext): any {
  const parts = ref.split(".");
  let current: any = context;

  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    // Check components, totals, global
    current = current[part] ?? current.components?.[part] ?? current.totals?.[part] ?? current.global?.[part];
  }
  return current;
}

function evaluateLogicNode(node: any, context: BuildContext): boolean {
  if (!node) return true;

  // Group operators
  if (node.and && Array.isArray(node.and)) {
    return node.and.every((child: any) => evaluateLogicNode(child, context));
  }
  if (node.or && Array.isArray(node.or)) {
    return node.or.some((child: any) => evaluateLogicNode(child, context));
  }
  if (node.not) {
    return !evaluateLogicNode(node.not, context);
  }

  // Comparison operators: { operator, left, right }
  if (node.operator) {
    const leftVal = node.left?.ref
      ? resolveContextRef(node.left.ref, context)
      : node.left?.value ?? node.left;
    const rightVal = node.right?.ref
      ? resolveContextRef(node.right.ref, context)
      : node.right?.value ?? node.right;

    const left = leftVal !== undefined ? leftVal : 0;
    const right = rightVal !== undefined ? rightVal : 0;
    const offset = node.right?.offset || 0;

    switch (node.operator) {
      case "EQUAL":
        return String(left) === String(right);
      case "NOT_EQUAL":
        return String(left) !== String(right);
      case "GREATER_THAN":
        return Number(left) > Number(right) + offset;
      case "GREATER_OR_EQUAL":
        return Number(left) >= Number(right) + offset;
      case "LESS_THAN":
        return Number(left) < Number(right) + offset;
      case "LESS_OR_EQUAL":
        return Number(left) <= Number(right) + offset;
      case "CONTAINS":
        return String(left).includes(String(right));
      case "IN_LIST": {
        const list = Array.isArray(right) ? right : String(right).split(",").map((s: string) => s.trim());
        return list.includes(String(left));
      }
      default:
        return false;
    }
  }

  return true;
}
