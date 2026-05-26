import { CartItem, CompatibilityIssue, CompatibilityLevel, CompatibilityReport, specsToFlat } from '../../types';

interface ValidationContext {
  cpu?: CartItem;
  mobo?: CartItem;
  ramList: CartItem[];
  gpuList: CartItem[];
  storageList: CartItem[];
  psu?: CartItem;
  cabinet?: CartItem;
  cooler?: CartItem;
  items: CartItem[];
  cpuSpecs: Record<string, any>;
  moboSpecs: Record<string, any>;
  psuSpecs: Record<string, any>;
  cabinetSpecs: Record<string, any>;
  coolerSpecs: Record<string, any>;
}

// Utility to handle missing or unparseable numeric specs safely.
const safeNumber = (val: any): number | null => {
  if (val === undefined || val === null || val === '') return null;
  const parsed = Number(val);
  return isNaN(parsed) ? null : parsed;
};

interface CompatibilityRule {
  name: string;
  evaluate(ctx: ValidationContext): CompatibilityIssue[];
}

const socketRule: CompatibilityRule = {
  name: 'Socket Compatibility',
  evaluate: (ctx) => {
    const issues: CompatibilityIssue[] = [];
    if (ctx.cpu && ctx.mobo) {
      if (ctx.cpuSpecs.socket && ctx.moboSpecs.socket && ctx.cpuSpecs.socket !== ctx.moboSpecs.socket) {
        issues.push({
          level: CompatibilityLevel.INCOMPATIBLE,
          message: `CPU and Motherboard sockets do not match.`,
          reason: `CPU requires ${ctx.cpuSpecs.socket} socket, but Motherboard has ${ctx.moboSpecs.socket} socket.`,
          resolution: `Change the Processor to an ${ctx.moboSpecs.socket} socket, or choose a Motherboard with an ${ctx.cpuSpecs.socket} socket.`,
          componentIds: [ctx.cpu.id, ctx.mobo.id]
        });
      }
    }
    return issues;
  }
};

const memoryRule: CompatibilityRule = {
  name: 'Memory Compatibility',
  evaluate: (ctx) => {
    const issues: CompatibilityIssue[] = [];
    if (ctx.mobo && ctx.ramList.length > 0) {
      for (const ram of ctx.ramList) {
        const ramSpecs = specsToFlat(ram.specs);
        if (ctx.moboSpecs.ramType && ramSpecs.ramType && ctx.moboSpecs.ramType !== ramSpecs.ramType) {
          issues.push({
            level: CompatibilityLevel.INCOMPATIBLE,
            message: `RAM type is not supported by Motherboard.`,
            reason: `Motherboard supports ${ctx.moboSpecs.ramType}, but you selected ${ramSpecs.ramType} RAM.`,
            resolution: `Select ${ctx.moboSpecs.ramType} RAM.`,
            componentIds: [ctx.mobo.id, ram.id]
          });
        }
      }
    } else if (ctx.cpu && ctx.ramList.length > 0) {
      for (const ram of ctx.ramList) {
        const ramSpecs = specsToFlat(ram.specs);
        if (ctx.cpuSpecs.ramType && ramSpecs.ramType && ctx.cpuSpecs.ramType !== ramSpecs.ramType) {
          issues.push({
            level: CompatibilityLevel.WARNING,
            message: `RAM type may not be optimal for CPU.`,
            reason: `CPU typically utilizes ${ctx.cpuSpecs.ramType}, but you selected ${ramSpecs.ramType} RAM. Check motherboard compatibility before proceeding.`,
            resolution: `Ensure you pick a motherboard that bridges this gap or switch to ${ctx.cpuSpecs.ramType} RAM.`,
            componentIds: [ctx.cpu.id, ram.id]
          });
        }
      }
    }
    return issues;
  }
};
const coolerSocketRule: CompatibilityRule = {
  name: 'CPU Cooler Socket Compatibility',
  evaluate: (ctx) => {
    const issues: CompatibilityIssue[] = [];

    if (ctx.cpu && ctx.cooler) {
      const supportedSockets = ctx.coolerSpecs.socketSupport;

      if (supportedSockets && ctx.cpuSpecs.socket) {
        // Handle both array and comma-separated string formats
        let supportedArr: string[];
        if (Array.isArray(supportedSockets)) {
          supportedArr = supportedSockets.map((value) => String(value).trim());
        } else if (typeof supportedSockets === 'string') {
          // Split comma-separated string and trim whitespace
          supportedArr = supportedSockets.split(',').map(s => s.trim());
        } else {
          supportedArr = [String(supportedSockets)];
        }

        // Check if cooler has universal support
        const isUniversal = supportedArr.some((s: string) => s.toLowerCase() === 'universal');
        const hasSupport = isUniversal || supportedArr.some((s: string) => s.toLowerCase() === String(ctx.cpuSpecs.socket).toLowerCase());

        if (!hasSupport) {
          issues.push({
            level: CompatibilityLevel.INCOMPATIBLE,
            message: `CPU Cooler does not support this CPU socket.`,
            reason: `Cooler supports [${supportedArr.join(', ')}] but CPU uses ${ctx.cpuSpecs.socket}.`,
            resolution: `Choose a cooler compatible with ${ctx.cpuSpecs.socket} or a universal cooler.`,
            componentIds: [ctx.cooler.id, ctx.cpu.id]
          });
        }
      }
    }

    return issues;
  }
};
const powerDrawRule: CompatibilityRule = {
  name: 'Power Draw',
  evaluate: (ctx) => {
    const issues: CompatibilityIssue[] = [];
    if (ctx.psu) {
      let totalWattage = 50; // Base overhead
      const cpuWattage = safeNumber(ctx.cpuSpecs.wattage);
      if (cpuWattage) totalWattage += cpuWattage;

      ctx.gpuList.forEach(gpu => {
        const gpuSpecs = specsToFlat(gpu.specs);
        const gpuWattage = safeNumber(gpuSpecs.wattage);
        if (gpuWattage) totalWattage += gpuWattage;
      });

      const recommendedWattage = totalWattage * 1.2;
      const psuCapacity = safeNumber(ctx.psuSpecs.wattage);

      if (psuCapacity) {
        if (psuCapacity < totalWattage) {
          issues.push({
            level: CompatibilityLevel.INCOMPATIBLE,
            message: `Insufficient Power Supply.`,
            reason: `Estimated required wattage is ${totalWattage}W, but the PSU only provides ${psuCapacity}W. System may crash under load.`,
            resolution: `Choose a higher capacity Power Supply (minimum ${Math.ceil(recommendedWattage)}W recommended).`,
            componentIds: [ctx.psu.id, ...(ctx.gpuList.map(g => g.id)), ctx.cpu?.id].filter(Boolean) as string[]
          });
        } else if (psuCapacity < recommendedWattage) {
          issues.push({
            level: CompatibilityLevel.WARNING,
            message: `Power capacity is cutting it close.`,
            reason: `PSU capacity (${psuCapacity}W) is very close to maximum load (${totalWattage}W). Spikes may cause system instability.`,
            resolution: `Upgrade PSU to at least ${Math.ceil(recommendedWattage)}W for a safer overhead.`,
            componentIds: [ctx.psu.id]
          });
        }
      }
    } else if (!ctx.psu) {
      // Check if there are components that actually require power
      const powerRequiringComponents = [
        ctx.cpu,
        ctx.mobo,
        ...ctx.gpuList,
        ...ctx.ramList,
        ...ctx.storageList,
        ctx.cooler
      ].filter(Boolean);

      if (powerRequiringComponents.length > 0) {
        issues.push({
          level: CompatibilityLevel.WARNING,
          message: "Missing Power Supply.",
          reason: "A PC build requires a Power Supply Unit (PSU) to function.",
          resolution: "Please add a Power Supply to your build.",
          componentIds: []
        });
      }
    }
    return issues;
  }
};

const formFactorRule: CompatibilityRule = {
  name: 'Form Factor Compatibility',
  evaluate: (ctx) => {
    const issues: CompatibilityIssue[] = [];
    if (ctx.cabinet && ctx.mobo) {
      const cabinetSupport = ctx.cabinetSpecs.motherboardSupport as string;
      const moboFactor = ctx.moboSpecs.formFactor as string;

      if (cabinetSupport && moboFactor) {
        // Simplify by checking if mobo factor is included in cabinet support string
        if (!cabinetSupport.toLowerCase().includes(moboFactor.toLowerCase())) {
          issues.push({
            level: CompatibilityLevel.INCOMPATIBLE,
            message: `Motherboard will not fit in the Cabinet.`,
            reason: `Cabinet supports [${cabinetSupport}] form factors, but Motherboard is [${moboFactor}].`,
            resolution: `Choose a larger cabinet or a smaller motherboard.`,
            componentIds: [ctx.cabinet.id, ctx.mobo.id]
          });
        }
      }
    }
    return issues;
  }
}

const clearanceRule: CompatibilityRule = {
  name: 'Clearance Checks',
  evaluate: (ctx) => {
    const issues: CompatibilityIssue[] = [];
    if (ctx.cabinet) {
      const maxGpuLength = safeNumber(ctx.cabinetSpecs.maxGpuLength);
      const maxCoolerHeight = safeNumber(ctx.cabinetSpecs.maxCoolerHeight);

      if (maxGpuLength && ctx.gpuList.length > 0) {
        for (const gpu of ctx.gpuList) {
          const gpuLength = safeNumber(specsToFlat(gpu.specs).length);
          if (gpuLength && gpuLength > maxGpuLength) {
            issues.push({
              level: CompatibilityLevel.INCOMPATIBLE,
              message: `GPU is too long for this cabinet.`,
              reason: `GPU is ${gpuLength}mm long, but the Cabinet only supports up to ${maxGpuLength}mm.`,
              resolution: `Select a larger cabinet or a shorter GPU.`,
              componentIds: [ctx.cabinet.id, gpu.id]
            });
          }
        }
      }

      if (maxCoolerHeight && ctx.cooler) {
        const coolerHeight = safeNumber(ctx.coolerSpecs.height);
        if (coolerHeight && coolerHeight > maxCoolerHeight) {
          issues.push({
            level: CompatibilityLevel.INCOMPATIBLE,
            message: `CPU Cooler is too tall for this cabinet.`,
            reason: `Cooler is ${coolerHeight}mm tall, but the Cabinet only supports up to ${maxCoolerHeight}mm.`,
            resolution: `Select a wider cabinet or a shorter/low-profile CPU Cooler.`,
            componentIds: [ctx.cabinet.id, ctx.cooler.id]
          });
        }
      }
    }
    return issues;
  }
};

const psuFormFactorRule: CompatibilityRule = {
  name: 'PSU Form Factor Compatibility',
  evaluate: (ctx) => {
    const issues: CompatibilityIssue[] = [];
    if (ctx.cabinet && ctx.psu) {
      const cabinetSupport = ctx.cabinetSpecs.psuFormFactorSupport;
      const psuFactor = ctx.psuSpecs.formFactor as string;

      if (cabinetSupport && psuFactor) {
        const supportedArr = Array.isArray(cabinetSupport) ? cabinetSupport : [cabinetSupport];
        if (!supportedArr.some((s: string) => s.toLowerCase() === psuFactor.toLowerCase())) {
          issues.push({
            level: CompatibilityLevel.INCOMPATIBLE,
            message: `Power Supply form factor unsupported by Cabinet.`,
            reason: `Cabinet supports [${supportedArr.join(', ')}] form factors, but PSU is ${psuFactor}.`,
            resolution: `Choose a different cabinet or a compatible PSU form factor.`,
            componentIds: [ctx.cabinet.id, ctx.psu.id]
          });
        }
      }
    }
    return issues;
  }
};

const RULES: CompatibilityRule[] = [
  socketRule,
  memoryRule,
  coolerSocketRule,
  powerDrawRule,
  formFactorRule,
  clearanceRule,
  psuFormFactorRule,
];

const evaluateDynamicRules = (ctx: ValidationContext, dynamicRules: any[]): CompatibilityIssue[] => {
  const issues: CompatibilityIssue[] = [];

  for (const rule of dynamicRules) {
    if (!rule.isActive) continue;

    // Find source components
    const sourceComponents = ctx.items.filter(i => i.category?.id === rule.sourceCategoryId);
    if (sourceComponents.length === 0) continue;

    // Find target components
    const targetComponents = ctx.items.filter(i => i.category?.id === rule.targetCategoryId);
    if (targetComponents.length === 0) continue;

    for (const source of sourceComponents) {
      const sourceSpecs = specsToFlat(source.specs);

      for (const target of targetComponents) {
        const targetSpecs = specsToFlat(target.specs);

        // Clause-less rules always trigger when source and target categories are present
        if (rule.clauses.length === 0) {
          issues.push({
            level: rule.severity,
            message: rule.name,
            reason: rule.message || `Rule triggered for ${rule.sourceCategory?.name} and ${rule.targetCategory?.name} combination.`,
            resolution: `Check ${rule.sourceCategory?.name} and ${rule.targetCategory?.name} compatibility.`,
            componentIds: [source.id, target.id]
          });
          continue;
        }

        // For rules with clauses, evaluate them
        let ruleViolated = false; // Rule is violated if any clause fails
        const clauseIssues: string[] = [];

        for (const clause of rule.clauses) {
          const sVal = sourceSpecs[clause.sourceAttribute?.key || ''];
          const tVal = targetSpecs[clause.targetAttribute?.key || ''];

          let clauseMet = false;
          switch (clause.operator) {
            case 'EQUALS':
              clauseMet = String(sVal) === String(tVal);
              break;
            case 'NOT_EQUALS':
              clauseMet = String(sVal) !== String(tVal);
              break;
            case 'CONTAINS':
              clauseMet = String(tVal).toLowerCase().includes(String(sVal).toLowerCase());
              break;
            case 'IN':
              // Assume tVal is comma-separated or array
              const vals = Array.isArray(tVal)
                ? tVal.map((value) => String(value).trim())
                : String(tVal).split(',').map(v => v.trim());
              clauseMet = vals.includes(String(sVal));
              break;
            case 'GREATER_THAN':
              clauseMet = safeNumber(sVal)! > safeNumber(tVal)!;
              break;
            case 'LESS_THAN':
              clauseMet = safeNumber(sVal)! < safeNumber(tVal)!;
              break;
            default:
              clauseMet = true;
          }

          if (!clauseMet) {
            ruleViolated = true;
            clauseIssues.push(`${clause.sourceAttribute?.label} (${sVal}) does not match ${clause.targetAttribute?.label} (${tVal})`);
            break; // One clause failed, rule is violated
          }
        }

        if (ruleViolated) {
          issues.push({
            level: rule.severity,
            message: rule.name,
            reason: rule.message || clauseIssues.join(', '),
            resolution: `Check ${rule.sourceCategory?.name} and ${rule.targetCategory?.name} compatibility.`,
            componentIds: [source.id, target.id]
          });
        }
      }
    }
  }

  return issues;
};

export const validateBuild = (items: CartItem[], dynamicRules: any[] = []): CompatibilityReport => {
  const context: ValidationContext = {
    items,
    cpu: items.find(i => i.category?.name.toUpperCase() === 'PROCESSOR' || i.category?.name.toUpperCase() === 'CPU'),
    mobo: items.find(i => i.category?.name.toUpperCase() === 'MOTHERBOARD'),
    ramList: items.filter(i => i.category?.name.toUpperCase() === 'RAM'),
    gpuList: items.filter(i => i.category?.name.toUpperCase() === 'GPU'),
    storageList: items.filter(i => i.category?.name.toUpperCase() === 'STORAGE'),
    psu: items.find(i => i.category?.name.toUpperCase() === 'PSU'),
    cabinet: items.find(i => i.category?.name.toUpperCase() === 'CABINET'),
    cooler: items.find(i => i.category?.name.toUpperCase() === 'COOLER'),

    cpuSpecs: {},
    moboSpecs: {},
    psuSpecs: {},
    cabinetSpecs: {},
    coolerSpecs: {},
  };

  if (context.cpu) context.cpuSpecs = specsToFlat(context.cpu.specs);
  if (context.mobo) context.moboSpecs = specsToFlat(context.mobo.specs);
  if (context.psu) context.psuSpecs = specsToFlat(context.psu.specs);
  if (context.cabinet) context.cabinetSpecs = specsToFlat(context.cabinet.specs);
  if (context.cooler) context.coolerSpecs = specsToFlat(context.cooler.specs);

  const issues: CompatibilityIssue[] = [];

  // Dynamic Rules First (Admin-controlled rules take precedence)
  const dynamicIssues: CompatibilityIssue[] = [];
  if (dynamicRules.length > 0) {
    const evaluatedDynamicIssues = evaluateDynamicRules(context, dynamicRules);
    issues.push(...evaluatedDynamicIssues);
    dynamicIssues.push(...evaluatedDynamicIssues);
  }

  // Static Rules (only apply if no dynamic rule produced an issue for the same component pair)
  const staticRuleIssues: CompatibilityIssue[] = [];
  for (const rule of RULES) {
    const ruleIssues = rule.evaluate(context);

    // For each static rule issue, check if there's a dynamic issue covering the same component pair
    const filteredRuleIssues = ruleIssues.filter(staticIssue => {
      const hasDynamicIssueForSamePair = dynamicIssues.some(dynamicIssue => {
        // Check if the component pairs overlap (same components involved)
        const staticComponentIds = new Set(staticIssue.componentIds);
        const dynamicComponentIds = new Set(dynamicIssue.componentIds);

        // If there's any overlap in component IDs, the dynamic rule takes precedence
        const hasOverlap = [...staticComponentIds].some(id => dynamicComponentIds.has(id));
        return hasOverlap;
      });

      // Only keep static issue if no dynamic issue covers the same component pair
      return !hasDynamicIssueForSamePair;
    });

    staticRuleIssues.push(...filteredRuleIssues);
  }
  issues.push(...staticRuleIssues);

  let status: CompatibilityLevel = CompatibilityLevel.COMPATIBLE;

  if (issues.some(i => i.level === CompatibilityLevel.INCOMPATIBLE)) {
    status = CompatibilityLevel.INCOMPATIBLE;
  } else if (issues.length > 0) {
    status = CompatibilityLevel.WARNING;
  }

  return { status, issues };
};
