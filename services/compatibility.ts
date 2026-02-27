import { CartItem, Category, CompatibilityIssue, CompatibilityLevel, CompatibilityReport, specsToFlat } from '../types';

export const validateBuild = (items: CartItem[]): CompatibilityReport => {
  const issues: CompatibilityIssue[] = [];

  // Extract components
  const cpu = items.find(i => i.category === Category.PROCESSOR);
  const mobo = items.find(i => i.category === Category.MOTHERBOARD);
  const ramList = items.filter(i => i.category === Category.RAM);
  const gpuList = items.filter(i => i.category === Category.GPU);
  const psu = items.find(i => i.category === Category.PSU);

  // Flatten specs for compatibility logic
  const cpuSpecs = cpu ? specsToFlat(cpu.specs) : {};
  const moboSpecs = mobo ? specsToFlat(mobo.specs) : {};

  // 1. CPU <-> Motherboard Socket Compatibility
  if (cpu && mobo) {
    if (cpuSpecs.socket !== moboSpecs.socket) {
      issues.push({
        level: CompatibilityLevel.INCOMPATIBLE,
        message: `CPU Socket (${cpuSpecs.socket}) does not match Motherboard Socket (${moboSpecs.socket}).`,
        componentIds: [cpu.id, mobo.id]
      });
    }
  }

  // 2. RAM <-> Motherboard/CPU Compatibility
  if (mobo && ramList.length > 0) {
    const incompatibleRam = ramList.find(ram => {
      const ramSpecs = specsToFlat(ram.specs);
      return ramSpecs.ramType !== moboSpecs.ramType;
    });
    if (incompatibleRam) {
      const ramSpecs = specsToFlat(incompatibleRam.specs);
      issues.push({
        level: CompatibilityLevel.INCOMPATIBLE,
        message: `Motherboard supports ${moboSpecs.ramType} but you selected ${ramSpecs.ramType} memory.`,
        componentIds: [mobo.id, incompatibleRam.id]
      });
    }
  } else if (cpu && ramList.length > 0) {
    // Fallback if no mobo selected yet, check CPU compat
    const incompatibleRam = ramList.find(ram => {
      const ramSpecs = specsToFlat(ram.specs);
      return ramSpecs.ramType !== cpuSpecs.ramType;
    });
    if (incompatibleRam) {
      const ramSpecs = specsToFlat(incompatibleRam.specs);
      issues.push({
        level: CompatibilityLevel.WARNING,
        message: `CPU utilizes ${cpuSpecs.ramType} but you selected ${ramSpecs.ramType}. Ensure you pick a matching motherboard.`,
        componentIds: [cpu.id, incompatibleRam.id]
      });
    }
  }

  // 3. Power Supply Calculation
  if (psu) {
    let totalWattage = 0;
    // Base system overhead
    totalWattage += 50;
    if (cpuSpecs.wattage) totalWattage += Number(cpuSpecs.wattage);
    gpuList.forEach(gpu => {
      const gpuSpecs = specsToFlat(gpu.specs);
      if (gpuSpecs.wattage) totalWattage += Number(gpuSpecs.wattage);
    });

    // Add buffer
    const recommendedWattage = totalWattage * 1.2;
    const psuSpecs = specsToFlat(psu.specs);

    if (psuSpecs.wattage && Number(psuSpecs.wattage) < totalWattage) {
      issues.push({
        level: CompatibilityLevel.INCOMPATIBLE,
        message: `Critical: Estimated power draw (${totalWattage}W) exceeds PSU capacity (${psuSpecs.wattage}W). System will fail.`,
        componentIds: [psu.id, ...gpuList.map(g => g.id), cpu ? cpu.id : '']
      });
    } else if (psuSpecs.wattage && Number(psuSpecs.wattage) < recommendedWattage) {
      issues.push({
        level: CompatibilityLevel.WARNING,
        message: `PSU capacity (${psuSpecs.wattage}W) is close to estimated load (${totalWattage}W). Recommended: ${Math.ceil(recommendedWattage)}W+.`,
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