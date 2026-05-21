/**
 * compatibilityEngine.ts — Build context aggregation, rule evaluation,
 * and message formatting for the Dynamic Compatibility Rule Engine (DCRE).
 *
 * This module runs on BOTH client and server:
 *   - Client: builds context from local state for live preview
 *   - Server: full evaluation via compatibility.service.ts
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type BuildContext = {
  components: Record<string, Record<string, any>>;
  totals: Record<string, number>;
  global: Record<string, any>;
  derived: Record<string, any>;
};

export interface CompatibilityIssue {
  ruleId?: string;
  ruleName?: string;
  severity: "ERROR" | "WARNING" | "INFO";
  message: string;
  sourceComponent?: string;
  targetComponent?: string;
  passed: boolean;
}

export interface CompatibilityReport {
  compatible: boolean;
  issues: CompatibilityIssue[];
  context?: BuildContext;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context Builders
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Aggregates build items into a flat context object for rule evaluation.
 */
export async function buildCompatibilityContext(items: any[], buildId?: string): Promise<BuildContext> {
  return buildCompatibilityContextSync(items);
}

/**
 * Synchronous version for backward compatibility and client-side usage.
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
    const tdp = specs["TDP (W)"] || specs.TDP || 0;
    if (tdp) context.totals.totalTDP += Number(tdp);
    context.totals.totalPrice += Number(item.variant?.price || 0);
    if (categoryName.includes("STORAGE")) context.totals.storageSlotsUsed += 1;
    if (categoryName.includes("RAM") || categoryName.includes("DDR"))
      context.totals.ramSlotsUsed += 1;
  }

  return context;
}

// ─────────────────────────────────────────────────────────────────────────────
// Client-Side Validation (Quick Check)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Quick client-side compatibility validation.
 * Runs basic checks without hitting the server.
 * For full validation, use POST /api/build/validate.
 */
export function validateBuildSync(items: any[]): CompatibilityReport {
  const issues: CompatibilityIssue[] = [];
  const context = buildCompatibilityContextSync(items);

  if (items.length < 2) {
    return { compatible: true, issues: [], context };
  }

  // ── Socket Match: CPU ↔ Motherboard ─────────────────────────────────────
  const cpuComp = findComponent(context, ["DESKTOP_CPU", "HEDT_CPU"]);
  const moboComp = findComponent(context, ["ATX_MOTHERBOARD", "MICRO-ATX_MOTHERBOARD", "MINI-ITX_MOTHERBOARD"]);

  if (cpuComp && moboComp) {
    const cpuSocket = cpuComp.Socket;
    const moboSocket = moboComp.Socket;

    if (cpuSocket && moboSocket && cpuSocket !== moboSocket) {
      issues.push({
        severity: "ERROR",
        message: `CPU socket (${cpuSocket}) is incompatible with motherboard socket (${moboSocket}).`,
        sourceComponent: cpuComp.name,
        targetComponent: moboComp.name,
        passed: false,
      });
    }
  }

  // ── Memory Type: RAM ↔ Motherboard ──────────────────────────────────────
  const ramComp = findComponent(context, ["DDR5_RAM", "DDR4_RAM"]);

  if (ramComp && moboComp) {
    const ramType = ramComp["Memory Type"];
    const moboRamType = moboComp["Memory Type"];

    if (ramType && moboRamType && ramType !== moboRamType) {
      issues.push({
        severity: "ERROR",
        message: `RAM type (${ramType}) is incompatible with motherboard memory type (${moboRamType}).`,
        sourceComponent: ramComp.name,
        targetComponent: moboComp.name,
        passed: false,
      });
    }
  }

  // ── PSU Wattage Check ──────────────────────────────────────────────────
  const psuComp = findComponent(context, ["ATX_PSU", "SFX_PSU"]);

  if (psuComp && context.totals.totalTDP > 0) {
    const psuWattage = Number(psuComp.Wattage || 0);
    // Recommended: PSU should be ≥ 1.2× total TDP
    const recommendedWattage = Math.ceil(context.totals.totalTDP * 1.2);

    if (psuWattage > 0 && psuWattage < context.totals.totalTDP) {
      issues.push({
        severity: "ERROR",
        message: `PSU wattage (${psuWattage}W) is insufficient for total system TDP (${context.totals.totalTDP}W).`,
        sourceComponent: psuComp.name,
        passed: false,
      });
    } else if (psuWattage > 0 && psuWattage < recommendedWattage) {
      issues.push({
        severity: "WARNING",
        message: `PSU wattage (${psuWattage}W) is close to total system TDP (${context.totals.totalTDP}W). Recommended: ${recommendedWattage}W+.`,
        sourceComponent: psuComp.name,
        passed: false,
      });
    }
  }

  // ── GPU Length ↔ Case ──────────────────────────────────────────────────
  const gpuComp = findComponent(context, ["NVIDIA_GPU", "AMD_GPU", "INTEL_ARC_GPU"]);
  const caseComp = findComponent(context, ["MID_TOWER_CASE", "FULL_TOWER_CASE", "MINI-ITX_CASE"]);

  if (gpuComp && caseComp) {
    const gpuLength = Number(gpuComp["Card Length (mm)"] || 0);
    const maxGpuLength = Number(caseComp["Max GPU Length (mm)"] || 0);

    if (gpuLength > 0 && maxGpuLength > 0 && gpuLength > maxGpuLength) {
      issues.push({
        severity: "ERROR",
        message: `GPU length (${gpuLength}mm) exceeds case maximum (${maxGpuLength}mm).`,
        sourceComponent: gpuComp.name,
        targetComponent: caseComp.name,
        passed: false,
      });
    }
  }

  // ── Cooler Socket ↔ CPU Socket ─────────────────────────────────────────
  const coolerComp = findComponent(context, ["AIO_LIQUID_COOLER", "AIR_COOLER"]);

  if (coolerComp && cpuComp) {
    const cpuSocket = cpuComp.Socket;
    const coolerCompat = coolerComp["Socket Compatibility"];

    if (cpuSocket && coolerCompat && typeof coolerCompat === "string") {
      const supportedSockets = coolerCompat.split(",").map((s: string) => s.trim());
      if (!supportedSockets.includes(cpuSocket)) {
        issues.push({
          severity: "WARNING",
          message: `Cooler may not support CPU socket (${cpuSocket}). Supported: ${coolerCompat}.`,
          sourceComponent: coolerComp.name,
          targetComponent: cpuComp.name,
          passed: false,
        });
      }
    }
  }

  const compatible = !issues.some((i) => i.severity === "ERROR");

  return { compatible, issues, context };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function findComponent(
  context: BuildContext,
  categoryNames: string[],
): Record<string, any> | null {
  for (const name of categoryNames) {
    if (context.components[name]) return context.components[name];
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Derived Spec Evaluator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluates a derived specification formula against the build context
 */
export function evaluateDerivedSpec(formula: string, context: BuildContext): any {
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
