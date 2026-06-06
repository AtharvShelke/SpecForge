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
    const product = item.product || item.variant?.product || item;
    if (!product) continue;

    let categoryName = "";
    const slotId = item.slotId || (typeof product.category === "string" ? product.category : product.category?.code);
    if (slotId) {
      const slotMap: Record<string, string> = {
        CPU: "DESKTOP_CPU",
        MB: "ATX_MOTHERBOARD",
        RAM: "DDR4_RAM",
        SSD: "NVME_SSD",
        GPU: "NVIDIA_GPU",
        PSU: "ATX_PSU",
        COOL: "AIR_COOLER",
        CASE: "MID_TOWER_CASE",
      };
      categoryName = slotMap[slotId.toUpperCase()] || "";
    }

    if (!categoryName) {
      const subCat = product.subcategory || product.subCategory;
      categoryName = (subCat?.name || "")
        .toUpperCase()
        .replace(/\s+/g, "_");
    }

    if (!categoryName) {
      categoryName = "UNKNOWN";
    }

    const specs: Record<string, any> = {};

    // 1. Read specs directly from the single-product flat specs, with fallback key properties
    if (Array.isArray(product.specs)) {
      for (const spec of product.specs) {
        const specName = spec.name || spec.key || spec.attribute?.key || spec.attribute?.label;
        if (specName) {
          specs[specName] = spec.value;
        }
      }
    }

    // 2. Fallback to legacy variantSpecs if present
    const variantSpecs = item.variant?.variantSpecs || product.variants?.[0]?.variantSpecs;
    if (Array.isArray(variantSpecs)) {
      for (const vs of variantSpecs) {
        const specName = vs.spec?.name;
        if (!specName) continue;
        const value = vs.option?.value ?? vs.valueString ?? vs.valueNumber ?? vs.valueBool;
        specs[specName] = value;
      }
    }

    const price = Number(product.price || item.variant?.price || 0);

    context.components[categoryName] = {
      name: product.name || "Unknown",
      price: price,
      productId: product.id,
      ...specs,
    };

    // Aggregate totals
    const tdp = specs["TDP (W)"] || specs.TDP || specs.tdp || specs["TDP"] || 0;
    if (tdp) context.totals.totalTDP += Number(tdp);
    context.totals.totalPrice += price;
    if (categoryName.includes("STORAGE") || categoryName.includes("SSD")) context.totals.storageSlotsUsed += 1;
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
  // 1. Exact match search
  for (const name of categoryNames) {
    if (context.components[name]) {
      return wrapWithProxy(context.components[name]);
    }
  }

  // 2. Substring/Alias match fallback
  const compKeys = Object.keys(context.components);
  for (const name of categoryNames) {
    const nameLower = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const matchingKey = compKeys.find(key => {
      const keyLower = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      return keyLower.includes(nameLower) || nameLower.includes(keyLower) ||
             (nameLower.includes("cpu") && keyLower.includes("processor")) ||
             (nameLower.includes("motherboard") && keyLower.includes("mb")) ||
             (nameLower.includes("gpu") && keyLower.includes("graphics")) ||
             (nameLower.includes("cooler") && keyLower.includes("cool"));
    });
    if (matchingKey) {
      return wrapWithProxy(context.components[matchingKey]);
    }
  }

  return null;
}

function wrapWithProxy(comp: any): Record<string, any> {
  return new Proxy(comp, {
    get(target, prop) {
      if (typeof prop === "string") {
        const lowerProp = prop.toLowerCase();
        
        // Property key normalization aliases
        const propMap: Record<string, string[]> = {
          "socket": ["socket"],
          "memory type": ["type", "ddr_gen", "memory_type"],
          "wattage": ["wattage"],
          "card length (mm)": ["length", "card_length"],
          "max gpu length (mm)": ["max_gpu_length", "gpu_clearance"],
          "socket compatibility": ["socket_compat", "socket_compatibility"]
        };

        let targetKey: string | undefined;

        // A. Match defined aliases
        const aliases = propMap[lowerProp];
        if (aliases) {
          targetKey = Object.keys(target).find(k => aliases.includes(k.toLowerCase()));
        }

        // B. Exact case-insensitive match
        if (!targetKey) {
          targetKey = Object.keys(target).find(k => k.toLowerCase() === lowerProp);
        }

        // C. Substring matching
        if (!targetKey) {
          targetKey = Object.keys(target).find(k => {
            const lowerK = k.toLowerCase();
            return lowerK.includes(lowerProp) || lowerProp.includes(lowerK);
          });
        }

        if (targetKey) {
          const value = target[targetKey];

          // If numeric lookup, normalize values like "650W" or "320mm" to floats
          if (typeof value === "string" && ["wattage", "card length (mm)", "max gpu length (mm)"].includes(lowerProp)) {
            const parsed = parseFloat(value.replace(/[^0-9.]/g, ""));
            if (!isNaN(parsed)) return parsed;
          }

          if (value === "true") return true;
          if (value === "false") return false;

          return value;
        }
      }
      return target[prop as keyof typeof target];
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Derived Spec Evaluator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluates a derived specification formula against the build context
 */
export function evaluateDerivedSpec(formula: string, context: BuildContext): any {
  const parts = formula.match(/(\w+)\(([^)]+)\)/);
  if (!parts) return null;

  const [, func, args] = parts;
  const argList = args.split(',').map((a: string) => a.trim());

  const resolvedArgs = argList.map(arg => {
    if (!isNaN(Number(arg))) return Number(arg);
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
 */
export function resolveContextPath(path: string, context: BuildContext): any {
  const parts = path.split(".");

  if (parts[0] === "totals" && parts.length === 2) {
    return context.totals[parts[1]];
  }
  if (parts[0] === "global" && parts.length === 2) {
    return context.global[parts[1]];
  }
  if (parts[0] === "derived" && parts.length === 2) {
    return context.derived[parts[1]];
  }

  if (parts.length === 2) {
    return context.components[parts[0]]?.[parts[1]];
  }

  let current: any = context;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return current;
}

/**
 * Evaluates a message template with context variables.
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
