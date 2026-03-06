import { CartItem, Category, CompatibilityIssue, CompatibilityLevel, CompatibilityReport, specsToFlat } from '../types';

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
      const supportedSockets = ctx.coolerSpecs.supportedSockets as string | undefined;

      if (supportedSockets && ctx.cpuSpecs.socket) {
        const sockets = supportedSockets.toLowerCase();

        if (!sockets.includes(ctx.cpuSpecs.socket.toLowerCase())) {
          issues.push({
            level: CompatibilityLevel.INCOMPATIBLE,
            message: `CPU Cooler does not support this CPU socket.`,
            reason: `Cooler supports [${supportedSockets}] but CPU uses ${ctx.cpuSpecs.socket}.`,
            resolution: `Choose a cooler compatible with ${ctx.cpuSpecs.socket}.`,
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
    } else if (ctx.items.length > 2 && !ctx.psu) {
      issues.push({
        level: CompatibilityLevel.WARNING,
        message: "Missing Power Supply.",
        reason: "A PC build requires a Power Supply Unit (PSU) to function.",
        resolution: "Please add a Power Supply to your build.",
        componentIds: []
      });
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
}


const RULES: CompatibilityRule[] = [
  socketRule,
  memoryRule,
  coolerSocketRule,
  powerDrawRule,
  formFactorRule,
  clearanceRule,
];

export const validateBuild = (items: CartItem[]): CompatibilityReport => {
  const context: ValidationContext = {
    items,
    cpu: items.find(i => i.category === Category.PROCESSOR),
    mobo: items.find(i => i.category === Category.MOTHERBOARD),
    ramList: items.filter(i => i.category === Category.RAM),
    gpuList: items.filter(i => i.category === Category.GPU),
    storageList: items.filter(i => i.category === Category.STORAGE),
    psu: items.find(i => i.category === Category.PSU),
    cabinet: items.find(i => i.category === Category.CABINET),
    cooler: items.find(i => i.category === Category.COOLER),

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

  for (const rule of RULES) {
    const ruleIssues = rule.evaluate(context);
    issues.push(...ruleIssues);
  }

  let status = CompatibilityLevel.COMPATIBLE;
  if (issues.some(i => i.level === CompatibilityLevel.INCOMPATIBLE)) {
    status = CompatibilityLevel.INCOMPATIBLE;
  } else if (issues.length > 0) {
    status = CompatibilityLevel.WARNING;
  }

  return { status, issues };
};