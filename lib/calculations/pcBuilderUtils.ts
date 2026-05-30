import { Product, BuildItem, SubCategory } from "@/types";

// Helper to extract a spec value by key
export function getSpecValue(specs: any[] | undefined, ...keys: string[]): string {
  if (!specs || !Array.isArray(specs)) return "";
  for (const key of keys) {
    const spec = specs.find((s: any) => s.key === key || s.name?.toLowerCase() === key.toLowerCase() || s.attribute?.key === key);
    if (spec) {
      const value = spec.value;
      if (value === null || value === undefined || value === "") continue;
      return Array.isArray(value) ? value.join(", ") : String(value);
    }
  }
  return "";
}

// Helper to check if a step is a required core PC builder component
export function isStepRequired(step: any): boolean {
  if (step.isRequired || step.isCore) return true;
  
  const name = String(step.name || "").toLowerCase();
  return (
    name.includes("processor") ||
    name.includes("cpu") ||
    name.includes("intel core") ||
    name.includes("amd ryzen") ||
    name.includes("motherboard") ||
    name.includes("intel lga") ||
    name.includes("amd am") ||
    name.includes("ram") ||
    name.includes("memory") ||
    name.includes("ddr4") ||
    name.includes("ddr5") ||
    name.includes("storage") ||
    name.includes("ssd") ||
    name.includes("hdd") ||
    name.includes("nvme") ||
    name.includes("power supply") ||
    name.includes("psu") ||
    name.includes("modular psu") ||
    name.includes("non-modular psu") ||
    name.includes("pc case") ||
    name.includes("case") ||
    name.includes("cabinet") ||
    name.includes("mid tower") ||
    name.includes("full tower") ||
    name.includes("mini itx")
  );
}

// 1. calculateBuildCompletion(items, steps)
export function calculateBuildCompletion(
  items: Array<{ slotId: string; productId: string; product?: any }>,
  steps: Array<{ id: string; name: string; isRequired?: boolean; isCore?: boolean; subCategorySlots?: Array<{ slotId: string }> }>
) {
  const requiredSteps = steps.filter(isStepRequired);
  const totalRequired = requiredSteps.length;
  
  // Set of slotIds that are filled in the current build
  const filledSlotIds = new Set(items.map(item => item.slotId));
  
  const selectedRequiredSteps = requiredSteps.filter(step => {
    const slotId = step.subCategorySlots?.[0]?.slotId;
    return slotId && filledSlotIds.has(slotId);
  });
  
  const selectedRequired = selectedRequiredSteps.length;
  const percentage = totalRequired > 0 ? Math.round((selectedRequired / totalRequired) * 100) : 0;
  
  const missingSteps = requiredSteps.filter(step => {
    const slotId = step.subCategorySlots?.[0]?.slotId;
    return !slotId || !filledSlotIds.has(slotId);
  }).map(step => ({
    id: step.id,
    name: step.name
  }));
  
  return {
    totalRequired,
    selectedRequired,
    percentage,
    missingSteps
  };
}

// 2. calculateEstimatedWattage(items, powerDefaults)
export function calculateEstimatedWattage(
  items: Array<{ product?: any }>,
  powerDefaults: {
    baseWattage: number;
    cpuDefaultWattage: number;
    gpuDefaultWattage: number;
    ramWattagePerStick: number;
    storageWattagePerDrive: number;
  }
) {
  let w = powerDefaults.baseWattage;
  let psuCap: number | null = null;
  
  for (const item of items) {
    const product = item.product;
    if (!product) continue;
    
    const categoryName = product.subcategory?.name || product.subCategory?.name || product.category || "";
    const specs = product.specs || [];
    
    // Look for explicit wattage specs
    const wattageStr = getSpecValue(specs, "wattage", "power-draw", "tdp", "powerDraw", "power_draw");
    const n = parseInt(wattageStr.replace(/[^0-9]/g, ""), 10);
    
    const upperCat = categoryName.toUpperCase();
    if (upperCat.includes("POWER_SUPPLY") || upperCat.includes("PSU")) {
      if (!isNaN(n) && n > 0) psuCap = n;
      continue; // PSU wattage is the supply capacity; skip adding it as load draw
    }
    
    if (!isNaN(n) && n > 0) {
      w += n;
      continue;
    }
    
    // Fallback defaults
    if (upperCat.includes("PROCESSOR") || upperCat.includes("CPU")) {
      w += powerDefaults.cpuDefaultWattage;
    } else if (upperCat.includes("GRAPHICS") || upperCat.includes("GPU") || upperCat.includes("VIDEO")) {
      w += powerDefaults.gpuDefaultWattage;
    } else if (upperCat.includes("RAM") || upperCat.includes("MEMORY")) {
      w += powerDefaults.ramWattagePerStick;
    } else if (upperCat.includes("STORAGE") || upperCat.includes("SSD") || upperCat.includes("HDD")) {
      w += powerDefaults.storageWattagePerDrive;
    }
  }
  
  return { wattage: w, psuCap };
}

// 3. calculatePSUHeadroom(items, powerDefaults)
export function calculatePSUHeadroom(
  items: Array<{ product?: any }>,
  powerDefaults: {
    baseWattage: number;
    cpuDefaultWattage: number;
    gpuDefaultWattage: number;
    ramWattagePerStick: number;
    storageWattagePerDrive: number;
  }
) {
  const { wattage, psuCap } = calculateEstimatedWattage(items, powerDefaults);
  const recommendedBuffer = Math.ceil(wattage * 1.2);
  
  let utilizationPercentage = 0;
  let headroomStatus: "safe" | "warning" | "danger" = "safe";
  
  if (psuCap) {
    utilizationPercentage = Math.round((wattage / psuCap) * 100);
    if (wattage > psuCap) {
      headroomStatus = "danger";
    } else if (wattage > psuCap * 0.8) {
      headroomStatus = "warning";
    } else {
      headroomStatus = "safe";
    }
  }
  
  return {
    estimatedWattage: wattage,
    psuCapacity: psuCap,
    utilizationPercentage,
    headroomStatus,
    recommendedBuffer,
    recommendedMinPsu: Math.ceil(wattage * 1.25)
  };
}

// 4. getCompatibilitySummary(compatibilityResult, items, powerDefaults)
export function getCompatibilitySummary(
  compatibilityResult: any,
  items: any[],
  powerDefaults: any
) {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (compatibilityResult?.checks) {
    for (const check of compatibilityResult.checks) {
      if (!check.passed) {
        if (check.severity === "ERROR") {
          errors.push(check.message);
        } else {
          warnings.push(check.message);
        }
      }
    }
  }
  
  const { headroomStatus, estimatedWattage, psuCapacity } = calculatePSUHeadroom(items, powerDefaults);
  if (psuCapacity && headroomStatus === "danger") {
    errors.push(`Estimated wattage (${estimatedWattage}W) exceeds PSU capacity (${psuCapacity}W).`);
  } else if (psuCapacity && headroomStatus === "warning") {
    warnings.push(`Estimated wattage (${estimatedWattage}W) is close to PSU capacity (${psuCapacity}W). Recommended overhead is 20%.`);
  }
  
  let status: "COMPATIBLE" | "WARNING" | "INCOMPATIBLE" | "UNCHECKED" = "COMPATIBLE";
  if (!compatibilityResult) {
    status = "UNCHECKED";
  } else if (errors.length > 0) {
    status = "INCOMPATIBLE";
  } else if (warnings.length > 0) {
    status = "WARNING";
  }
  
  return {
    status,
    errors,
    warnings,
    passedCount: compatibilityResult?.summary?.passed ?? 0,
    totalChecks: compatibilityResult?.summary?.totalChecks ?? 0
  };
}

// 5. getNextRecommendedStep(items, steps)
export function getNextRecommendedStep(
  items: Array<{ slotId: string; productId: string; product?: any }>,
  steps: Array<{ id: string; name: string; isRequired?: boolean; isCore?: boolean; subCategorySlots?: Array<{ slotId: string }> }>
) {
  const requiredSteps = steps.filter(isStepRequired);
  const filledSlotIds = new Set(items.map(item => item.slotId));
  
  const nextMissing = requiredSteps.find(step => {
    const slotId = step.subCategorySlots?.[0]?.slotId;
    return !slotId || !filledSlotIds.has(slotId);
  });
  
  if (!nextMissing) return null;
  
  let guidance = "Select a high-quality component for this slot.";
  const name = nextMissing.name.toLowerCase();
  
  if (name.includes("processor") || name.includes("cpu")) {
    guidance = "Select a high-performance processor matching your workload.";
  } else if (name.includes("motherboard")) {
    guidance = "Choose a motherboard matching your CPU socket and case form factor.";
  } else if (name.includes("ram") || name.includes("memory")) {
    guidance = "Pick RAM that fits your motherboard slots and matches its DDR standard.";
  } else if (name.includes("graphics") || name.includes("gpu") || name.includes("video")) {
    guidance = "Select a graphics card matching your gaming or rendering performance target.";
  } else if (name.includes("storage") || name.includes("ssd") || name.includes("hdd")) {
    guidance = "Add an NVMe SSD for fast boot times or high-capacity HDD for files.";
  } else if (name.includes("power supply") || name.includes("psu")) {
    guidance = "Choose a power supply with sufficient wattage capacity for your CPU and GPU.";
  } else if (name.includes("case") || name.includes("cabinet")) {
    guidance = "Choose a case that has enough space for your motherboard and GPU length.";
  } else if (name.includes("cooler") || name.includes("fan")) {
    guidance = "Pick a liquid or air cooler matching your CPU socket and TDP.";
  }
  
  return {
    stepId: nextMissing.id,
    stepName: nextMissing.name,
    guidance
  };
}

// 6. generateSharePayload(items)
export function generateSharePayload(items: Array<{ productId: string }>) {
  if (!items || items.length === 0) return "";
  const sharedData = items.map(item => ({
    id: item.productId,
    quantity: 1
  }));
  try {
    return btoa(JSON.stringify(sharedData));
  } catch (e) {
    console.error("Failed to generate share payload:", e);
    return "";
  }
}

// 7. validateBuildForCheckout(items, steps, compatibilityResult, estimatedPower)
export function validateBuildForCheckout(
  items: any[],
  steps: any[],
  compatibilityResult: any,
  estimatedPower: { estimatedWattage: number; psuCapacity: number | null; headroomStatus: "safe" | "warning" | "danger" }
) {
  const errors: string[] = [];
  
  // Required components selected
  const requiredSteps = steps.filter(isStepRequired);
  const filledSlotIds = new Set(items.map(item => item.slotId));
  const missingRequired = requiredSteps.filter(step => {
    const slotId = step.subCategorySlots?.[0]?.slotId;
    return !slotId || !filledSlotIds.has(slotId);
  });
  
  if (missingRequired.length > 0) {
    errors.push(`Missing required components: ${missingRequired.map(s => s.name).join(", ")}`);
  }
  
  // No blocking compatibility errors
  if (compatibilityResult?.checks) {
    const compErrors = compatibilityResult.checks.filter((c: any) => !c.passed && c.severity === "ERROR");
    if (compErrors.length > 0) {
      compErrors.forEach((c: any) => errors.push(c.message));
    }
  }
  
  // Wattage does not exceed PSU capacity
  if (estimatedPower.psuCapacity && estimatedPower.headroomStatus === "danger") {
    errors.push(`Total system wattage (${estimatedPower.estimatedWattage}W) exceeds PSU capacity (${estimatedPower.psuCapacity}W).`);
  }
  
  const ready = errors.length === 0;
  return {
    ready,
    status: (ready ? "READY" : "ACTION_REQUIRED") as "READY" | "ACTION_REQUIRED",
    errors
  };
}
