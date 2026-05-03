/**
 * compatibilityEngine.ts — Build context aggregation & message formatting
 * for the Dynamic Compatibility Rule Engine (DCRE).
 */

import { derivedSpecService } from '@/services/derivedSpec.service';

export type BuildContext = {
  components: Record<string, Record<string, any>>;
  totals: Record<string, number>;
  global: Record<string, any>;
  derived: Record<string, any>;
};

/**
 * Aggregates build items into a flat context object for rule evaluation.
 */
export async function buildCompatibilityContext(items: any[], buildId?: string): Promise<BuildContext> {
  const context: BuildContext = {
    components: {},
    totals: {
      totalTDP: 0,
      totalPrice: 0,
      storageSlotsUsed: 0,
      ramSlotsUsed: 0,
    },
    global: {
      itemCount: items.length,
    },
    derived: {},
  };

  for (const item of items) {
    const subCat = item.variant?.product?.subCategory;
    const categoryName = (subCat?.name || "UNKNOWN")
      .toUpperCase()
      .replace(/\s+/g, "_");
    const specs: Record<string, any> = {};

    for (const vs of item.variant?.variantSpecs || []) {
      const specName = vs.spec?.name;
      if (!specName) continue;
      const value =
        vs.option?.value ?? vs.valueString ?? vs.valueNumber ?? vs.valueBool;
      specs[specName] = value;
    }

    context.components[categoryName] = {
      name: item.variant?.product?.name || "Unknown",
      price: Number(item.variant?.price || 0),
      variantId: item.variantId || item.variant?.id,
      ...specs,
    };

    // Aggregate totals
    if (specs.TDP) context.totals.totalTDP += Number(specs.TDP);
    context.totals.totalPrice += Number(item.variant?.price || 0);
    if (categoryName === "STORAGE") context.totals.storageSlotsUsed += 1;
    if (categoryName === "RAM" || categoryName === "MEMORY")
      context.totals.ramSlotsUsed += 1;
  }

  // Evaluate derived specifications if buildId is provided
  if (buildId) {
    try {
      const derivedSpecs = await derivedSpecService.getAll();
      for (const spec of derivedSpecs) {
        if (spec.enabled) {
          const value = evaluateDerivedSpec(spec.formula, context);
          context.derived[spec.name] = value;
          // Also add to totals for easy access in rules
          context.totals[spec.name] = value;
        }
      }
    } catch (error) {
      console.error("Failed to evaluate derived specs:", error);
    }
  }

  return context;
}

/**
 * Synchronous version for backward compatibility
 */
export function buildCompatibilityContextSync(items: any[]): BuildContext {
  const context: BuildContext = {
    components: {},
    totals: {
      totalTDP: 0,
      totalPrice: 0,
      storageSlotsUsed: 0,
      ramSlotsUsed: 0,
    },
    global: {
      itemCount: items.length,
    },
    derived: {},
  };

  for (const item of items) {
    const subCat = item.variant?.product?.subCategory;
    const categoryName = (subCat?.name || "UNKNOWN")
      .toUpperCase()
      .replace(/\s+/g, "_");
    const specs: Record<string, any> = {};

    for (const vs of item.variant?.variantSpecs || []) {
      const specName = vs.spec?.name;
      if (!specName) continue;
      const value =
        vs.option?.value ?? vs.valueString ?? vs.valueNumber ?? vs.valueBool;
      specs[specName] = value;
    }

    context.components[categoryName] = {
      name: item.variant?.product?.name || "Unknown",
      price: Number(item.variant?.price || 0),
      variantId: item.variantId || item.variant?.id,
      ...specs,
    };

    // Aggregate totals
    if (specs.TDP) context.totals.totalTDP += Number(specs.TDP);
    context.totals.totalPrice += Number(item.variant?.price || 0);
    if (categoryName === "STORAGE") context.totals.storageSlotsUsed += 1;
    if (categoryName === "RAM" || categoryName === "MEMORY")
      context.totals.ramSlotsUsed += 1;
  }

  return context;
}

/**
 * Evaluates a derived specification formula against the build context
 */
function evaluateDerivedSpec(formula: string, context: BuildContext): any {
  // Parse formula like "SUM(CPU.TDP, GPU.TDP)" or "SUBTRACT(totals.totalTDP, 100)"
  const parts = formula.match(/(\w+)\(([^)]+)\)/);
  if (!parts) return null;

  const [, func, args] = parts;
  const argList = args.split(',').map((a: string) => a.trim());

  // Resolve each argument against the context
  const resolvedArgs = argList.map(arg => {
    // Check if it's a number literal
    if (!isNaN(Number(arg))) return Number(arg);
    // Otherwise resolve as a path
    return resolveContextPath(arg, context);
  });

  switch (func.toUpperCase()) {
    case 'SUM':
      return resolvedArgs.reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
    case 'SUBTRACT':
      return resolvedArgs.length >= 2 ? Number(resolvedArgs[0]) - Number(resolvedArgs[1]) : 0;
    case 'MULTIPLY':
      return resolvedArgs.reduce((product: number, val: any) => product * (Number(val) || 1), 1);
    case 'DIVIDE':
      return resolvedArgs.length >= 2 && Number(resolvedArgs[1]) !== 0
        ? Number(resolvedArgs[0]) / Number(resolvedArgs[1])
        : 0;
    case 'MAX':
      return Math.max(...resolvedArgs.map(Number));
    case 'MIN':
      return Math.min(...resolvedArgs.map(Number));
    case 'AVG':
      return resolvedArgs.length > 0
        ? resolvedArgs.reduce((sum: number, val: any) => sum + Number(val), 0) / resolvedArgs.length
        : 0;
    default:
      return null;
  }
}

/**
 * Resolves a dot-notation path against the BuildContext.
 * e.g., "CPU.TDP" → context.components.CPU.TDP
 *        "totals.totalTDP" → context.totals.totalTDP
 *        "derived.Total_TDP" → context.derived.Total_TDP
 */
export function resolveContextPath(path: string, context: BuildContext): any {
  const parts = path.split(".");

  // Direct top-level keys
  if (parts[0] === "totals" && parts.length === 2) {
    return context.totals[parts[1]];
  }
  if (parts[0] === "global" && parts.length === 2) {
    return context.global[parts[1]];
  }
  if (parts[0] === "derived" && parts.length === 2) {
    return context.derived[parts[1]];
  }

  // Component reference: "CPU.TDP"
  if (parts.length === 2) {
    return context.components[parts[0]]?.[parts[1]];
  }

  // Fallback: walk entire context
  let current: any = context;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return current;
}

/**
 * Evaluates a message template with context variables.
 * Replaces {CPU.TDP}, {totals.totalTDP}, {derived.Total_TDP}, etc.
 */
export function formatCompatibilityMessage(
  template: string,
  context: BuildContext,
): string {
  return template.replace(/\{([\w.]+)\}/g, (match, path) => {
    const value = resolveContextPath(path, context);
    return value !== undefined ? String(value) : match;
  });
}
