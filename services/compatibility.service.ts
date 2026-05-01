/**
 * compatibility.service.ts — Business logic for the PC build compatibility engine.
 *
 * 🔥 CRITICAL FLOW: SpecDefinition → CompatibilityRule → Build → Check
 *
 * The rule engine operates on VariantSpec values. Each CompatibilityRule points to
 * a sourceSpecId and targetSpecId (both SpecDefinition records). When checking a
 * build, we resolve each BuildItem's variant specs and evaluate rules across
 * component pairs scoped by their SubCategories.
 */

import { prisma } from "@/lib/prisma";
import { ServiceError } from "./catalog.service";

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
      "sourceSubCategoryId and targetSubCategoryId are required"
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
// RULES — SpecDefinition → CompatibilityRule
// ─────────────────────────────────────────────────────────────────────────────

export async function listRules() {
  return prisma.compatibilityRule.findMany({
    include: {
      scope: {
        include: { sourceSubCategory: true, targetSubCategory: true },
      },
      sourceSpec: true,
      targetSpec: true,
    },
  });
}

/**
 * Creates a compatibility rule linking two SpecDefinitions.
 *
 * 🔥 Flow: SpecDefinition(source) + SpecDefinition(target) → CompatibilityRule
 *
 * Validates that:
 * - The scope exists and the source/target specs belong to the scope's subcategories
 */
export async function createRule(data: {
  name: string;
  scopeId: string;
  sourceSpecId: string;
  targetSpecId: string;
  operator: string;
  message?: string;
  severity: string;
}) {
  if (
    !data.name ||
    !data.scopeId ||
    !data.sourceSpecId ||
    !data.targetSpecId ||
    !data.operator ||
    !data.severity
  )
    throw new ServiceError("Missing required fields");

  // Validate scope and spec ownership
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
    throw new ServiceError(`Source spec "${data.sourceSpecId}" not found`, 404);
  if (!targetSpec)
    throw new ServiceError(`Target spec "${data.targetSpecId}" not found`, 404);

  // Ensure specs belong to correct subcategories in the scope
  if (sourceSpec.subCategoryId !== scope.sourceSubCategoryId)
    throw new ServiceError(
      `Source spec "${sourceSpec.name}" does not belong to source subcategory`
    );
  if (targetSpec.subCategoryId !== scope.targetSubCategoryId)
    throw new ServiceError(
      `Target spec "${targetSpec.name}" does not belong to target subcategory`
    );

  return prisma.compatibilityRule.create({
    data: {
      name: data.name,
      scopeId: data.scopeId,
      sourceSpecId: data.sourceSpecId,
      targetSpecId: data.targetSpecId,
      operator: data.operator as any,
      message: data.message || "Compatibility issue between specs",
      severity: data.severity as any,
    },
    include: { sourceSpec: true, targetSpec: true },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 🔥 CHECK — SpecDefinition → CompatibilityRule → Build → Check
//
// Steps:
// 1. Load Build → BuildItems → Variants → VariantSpecs (resolves spec values)
// 2. For every directed pair of items, find CompatibilityScopes
// 3. For each scope, load rules (SpecDef source + SpecDef target)
// 4. Evaluate each rule against the resolved VariantSpec values
// 5. Persist BuildCompatibilityResult → CompatibilityChecks
// ─────────────────────────────────────────────────────────────────────────────

export async function checkBuildCompatibility(buildId: string) {
  if (!buildId) throw new ServiceError("buildId is required");

  // Step 1: Deep-load the build's components with their spec values
  const build = await prisma.build.findUnique({
    where: { id: buildId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: { select: { id: true, name: true, subCategoryId: true } },
              variantSpecs: {
                include: {
                  spec: true,   // SpecDefinition (name, valueType)
                  option: true, // SpecOption (value, label)
                },
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
  if (buildItems.length < 2) {
    return {
      buildId,
      isCompatible: true,
      message: "Not enough items to check compatibility",
      checks: [],
    };
  }

  // Step 2–4: Evaluate every directed pair
  const results: Array<{
    ruleId: string;
    ruleName: string;
    sourceVariantId: string;
    targetVariantId: string;
    passed: boolean;
    message: string;
    severity: string;
    sourceSpecName: string;
    targetSpecName: string;
    sourceValue: any;
    targetValue: any;
  }> = [];

  // Pre-load all relevant scopes+rules in one query to avoid N+1
  const subCategoryIds = [
    ...new Set(buildItems.map((item) => item.variant.product.subCategoryId)),
  ];
  const allScopes = await prisma.compatibilityScope.findMany({
    where: {
      sourceSubCategoryId: { in: subCategoryIds },
      targetSubCategoryId: { in: subCategoryIds },
    },
    include: {
      rules: {
        include: { sourceSpec: true, targetSpec: true },
      },
    },
  });

  // Index scopes by source→target for O(1) lookup
  const scopeMap = new Map<string, typeof allScopes>();
  for (const scope of allScopes) {
    const key = `${scope.sourceSubCategoryId}→${scope.targetSubCategoryId}`;
    if (!scopeMap.has(key)) scopeMap.set(key, []);
    scopeMap.get(key)!.push(scope);
  }

  for (let i = 0; i < buildItems.length; i++) {
    for (let j = 0; j < buildItems.length; j++) {
      if (i === j) continue;

      const itemA = buildItems[i];
      const itemB = buildItems[j];
      const key = `${itemA.variant.product.subCategoryId}→${itemB.variant.product.subCategoryId}`;
      const scopes = scopeMap.get(key) || [];

      for (const scope of scopes) {
        for (const rule of scope.rules) {
          const { passed, sourceValue, targetValue } = evaluateRule(
            rule,
            itemA.variant.variantSpecs,
            itemB.variant.variantSpecs
          );

          results.push({
            ruleId: rule.id,
            ruleName: rule.name,
            sourceVariantId: itemA.variantId,
            targetVariantId: itemB.variantId,
            passed,
            message: passed ? "OK" : rule.message,
            severity: rule.severity,
            sourceSpecName: rule.sourceSpec.name,
            targetSpecName: rule.targetSpec.name,
            sourceValue,
            targetValue,
          });
        }
      }
    }
  }

  const isCompatible = results.every(
    (r) => r.passed || r.severity !== "ERROR"
  );

  // Step 5: Persist result
  const finalResult = await prisma.buildCompatibilityResult.create({
    data: {
      buildId,
      isCompatible,
      checks: {
        create: results.map((r) => ({
          ruleId: r.ruleId,
          sourceVariantId: r.sourceVariantId,
          targetVariantId: r.targetVariantId,
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
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Rule evaluator — resolves VariantSpec values by specId and compares
// ─────────────────────────────────────────────────────────────────────────────

function resolveSpecValue(specs: any[], specId: string): any {
  const spec = specs.find((s: any) => s.specId === specId);
  if (!spec) return undefined;

  // Prefer option value (for enum/select specs), then typed value fields
  if (spec.option?.value !== undefined) return spec.option.value;
  if (spec.valueString !== null && spec.valueString !== undefined) return spec.valueString;
  if (spec.valueNumber !== null && spec.valueNumber !== undefined) return Number(spec.valueNumber);
  if (spec.valueBool !== null && spec.valueBool !== undefined) return spec.valueBool;
  return undefined;
}

function evaluateRule(
  rule: any,
  sourceSpecs: any[],
  targetSpecs: any[]
): { passed: boolean; sourceValue: any; targetValue: any } {
  const sourceValue = resolveSpecValue(sourceSpecs, rule.sourceSpecId);
  const targetValue = resolveSpecValue(targetSpecs, rule.targetSpecId);

  // If either side is missing the spec, the rule fails
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
