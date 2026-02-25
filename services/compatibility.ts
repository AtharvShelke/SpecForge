import { CartItem, Category, CompatibilityIssue, CompatibilityLevel, CompatibilityReport } from '../types';

export const validateBuild = (items: CartItem[]): CompatibilityReport => {
  const issues: CompatibilityIssue[] = [];
  
  // Extract components
  const cpu = items.find(i => i.category === Category.PROCESSOR);
  const mobo = items.find(i => i.category === Category.MOTHERBOARD);
  const ramList = items.filter(i => i.category === Category.RAM);
  const gpuList = items.filter(i => i.category === Category.GPU);
  const psu = items.find(i => i.category === Category.PSU);

  // 1. CPU <-> Motherboard Socket Compatibility
  if (cpu && mobo) {
    if (cpu.specs.socket !== mobo.specs.socket) {
      issues.push({
        level: CompatibilityLevel.INCOMPATIBLE,
        message: `CPU Socket (${cpu.specs.socket}) does not match Motherboard Socket (${mobo.specs.socket}).`,
        componentIds: [cpu.id, mobo.id]
      });
    }
  }

  // 2. RAM <-> Motherboard/CPU Compatibility
  if (mobo && ramList.length > 0) {
    const incompatibleRam = ramList.find(ram => ram.specs.ramType !== mobo.specs.ramType);
    if (incompatibleRam) {
      issues.push({
        level: CompatibilityLevel.INCOMPATIBLE,
        message: `Motherboard supports ${mobo.specs.ramType} but you selected ${incompatibleRam.specs.ramType} memory.`,
        componentIds: [mobo.id, incompatibleRam.id]
      });
    }
  } else if (cpu && ramList.length > 0) {
     // Fallback if no mobo selected yet, check CPU compat
     const incompatibleRam = ramList.find(ram => ram.specs.ramType !== cpu.specs.ramType);
     if (incompatibleRam) {
      issues.push({
        level: CompatibilityLevel.WARNING,
        message: `CPU utilizes ${cpu.specs.ramType} but you selected ${incompatibleRam.specs.ramType}. Ensure you pick a matching motherboard.`,
        componentIds: [cpu.id, incompatibleRam.id]
      });
    }
  }

  // 3. Power Supply Calculation
  if (psu) {
    let totalWattage = 0;
    // Base system overhead
    totalWattage += 50; 
    if (cpu?.specs.wattage) totalWattage += cpu.specs.wattage;
    gpuList.forEach(gpu => {
      if (gpu.specs.wattage) totalWattage += gpu.specs.wattage;
    });

    // Add buffer
    const recommendedWattage = totalWattage * 1.2;

    if (psu.specs.wattage && psu.specs.wattage < totalWattage) {
       issues.push({
        level: CompatibilityLevel.INCOMPATIBLE,
        message: `Critical: Estimated power draw (${totalWattage}W) exceeds PSU capacity (${psu.specs.wattage}W). System will fail.`,
        componentIds: [psu.id, ...gpuList.map(g => g.id), cpu ? cpu.id : '']
      });
    } else if (psu.specs.wattage && psu.specs.wattage < recommendedWattage) {
      issues.push({
        level: CompatibilityLevel.WARNING,
        message: `PSU capacity (${psu.specs.wattage}W) is close to estimated load (${totalWattage}W). Recommended: ${Math.ceil(recommendedWattage)}W+.`,
        componentIds: [psu.id]
      });
    }
  } else if (items.length > 2 && !psu) {
     // Friendly reminder if building a PC but forgot PSU
     issues.push({
        level: CompatibilityLevel.WARNING,
        message: "You haven't selected a Power Supply for this build.",
        componentIds: []
      });
  }

  let status = CompatibilityLevel.COMPATIBLE;
  if (issues.some(i => i.level === CompatibilityLevel.INCOMPATIBLE)) {
    status = CompatibilityLevel.INCOMPATIBLE;
  } else if (issues.length > 0) {
    status = CompatibilityLevel.WARNING;
  }

  return { status, issues };
};