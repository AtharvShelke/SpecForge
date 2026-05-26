"use client";

import { useMemo, useCallback } from "react";
import { CompatibilityLevel, CartItem, BuilderSettings } from "@/types";
import { buildCompatibilityContextSync } from "@/lib/compatibilityEngine";

type BuildIssue = {
  level: CompatibilityLevel;
  message: string;
};

/**
 * Hook for checking build compatibility using the dynamic rule engine.
 * This replaces hardcoded validation logic with admin-manageable rules.
 */
export function useBuildCompatibility() {
  /**
   * Validates a build using dynamic compatibility rules from the database.
   * Falls back to basic validation if rules aren't available.
   */
  const validateBuild = useCallback(
    async (items: CartItem[] = [], powerDefaults: BuilderSettings["powerDefaults"]): Promise<{
      status: CompatibilityLevel;
      issues: BuildIssue[];
    }> => {
      const issues: BuildIssue[] = [];

      // Try to use the dynamic compatibility service
      try {
        // Build compatibility context
        const context = buildCompatibilityContextSync(
          items.map((item) => ({
            ...item,
            productId: item.productId || item.id,
            variantId: item.productId || item.id,
            variant: {
              id: item.productId || item.id,
              price: item.price || 0,
              product: item,
            },
          }))
        );

        // Call the compatibility API to check rules
        const response = await fetch("/api/compatibility/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: items.map(i => i.id) }),
        });

        if (response.ok) {
          const result = await response.json();
          
          // Convert API results to BuildIssue format
          if (result.details) {
            for (const detail of result.details) {
              if (!detail.passed) {
                issues.push({
                  level: detail.severity === "ERROR" 
                    ? CompatibilityLevel.INCOMPATIBLE 
                    : CompatibilityLevel.WARNING,
                  message: detail.message,
                });
              }
            }
          }
        }
      } catch (error) {
        // Fall back to basic validation if API fails
        console.warn("Compatibility check failed, using fallback:", error);
        return validateBuildFallback(items, powerDefaults);
      }

      // If no issues from API, still do basic power check
      if (issues.length === 0) {
        const { wattage, psuCap } = estimatePowerStats(items, powerDefaults);
        
        if (psuCap !== null) {
          if (wattage > psuCap) {
            issues.push({
              level: CompatibilityLevel.INCOMPATIBLE,
              message: `Estimated ${wattage}W exceeds PSU capacity (${psuCap}W).`,
            });
          } else if (wattage > psuCap * 0.8) {
            issues.push({
              level: CompatibilityLevel.WARNING,
              message: `Estimated ${wattage}W is close to PSU capacity (${psuCap}W).`,
            });
          }
        }
      }

      const status = issues.some((i) => i.level === CompatibilityLevel.INCOMPATIBLE)
        ? CompatibilityLevel.INCOMPATIBLE
        : issues.length > 0
          ? CompatibilityLevel.WARNING
          : CompatibilityLevel.COMPATIBLE;

      return { status, issues };
    },
    [],
  );

  /**
   * Check compatibility for a single product against current cart.
   * Used for real-time compatibility indicators on product cards.
   */
  const checkProductCompatibility = useCallback(
    async (
      product: CartItem,
      cart: CartItem[],
      powerDefaults: BuilderSettings["powerDefaults"]
    ): Promise<{ level: CompatibilityLevel; message: string }> => {
      // If already in cart, it's compatible
      if (cart.some((i) => i.id === product.id)) {
        return { level: CompatibilityLevel.COMPATIBLE, message: "" };
      }

      // Create hypothetical cart with this product
      const hypoCart = [
        ...cart.filter((i) => i.category !== product.category),
        product,
      ];

      const result = await validateBuild(hypoCart, powerDefaults);
      
      return {
        level: result.status,
        message: result.issues[0]?.message || "",
      };
    },
    [validateBuild],
  );

  return {
    validateBuild,
    checkProductCompatibility,
  };
}

// Fallback validation for when API is unavailable
function validateBuildFallback(
  items: CartItem[] = [],
  powerDefaults: BuilderSettings["powerDefaults"]
): { status: CompatibilityLevel; issues: BuildIssue[] } {
  const issues: BuildIssue[] = [];
  
  const cpu = items.find((i) => i.category === "Processor");
  const mobo = items.find((i) => i.category === "Motherboard");
  const ram = items.find((i) => i.category === "RAM");
  const { wattage, psuCap } = estimatePowerStats(items, powerDefaults);

  // CPU socket check
  if (cpu && mobo) {
    const cpuSocket = getSpecValue(cpu.specs, "socket");
    const moboSocket = getSpecValue(mobo.specs, "socket");
    if (cpuSocket && moboSocket && cpuSocket !== moboSocket) {
      issues.push({
        level: CompatibilityLevel.INCOMPATIBLE,
        message: "CPU socket does not match motherboard socket.",
      });
    }
  }

  // RAM type check
  if (ram && (mobo || cpu)) {
    const ramType = getSpecValue(ram.specs, "memoryType") || getSpecValue(ram.specs, "ramType");
    const moboRamType = mobo ? getSpecValue(mobo.specs, "memoryType") || getSpecValue(mobo.specs, "ramType") : "";
    const cpuRamType = cpu ? getSpecValue(cpu.specs, "memoryType") || getSpecValue(cpu.specs, "ramType") : "";
    const expectedRamType = moboRamType || cpuRamType;
    
    if (ramType && expectedRamType && ramType.toLowerCase() !== expectedRamType.toLowerCase()) {
      issues.push({
        level: CompatibilityLevel.INCOMPATIBLE,
        message: "RAM type does not match motherboard/CPU supported type.",
      });
    }
  }

  // Power check
  if (psuCap !== null) {
    if (wattage > psuCap) {
      issues.push({
        level: CompatibilityLevel.INCOMPATIBLE,
        message: `Estimated ${wattage}W exceeds PSU capacity (${psuCap}W).`,
      });
    } else if (wattage > psuCap * 0.8) {
      issues.push({
        level: CompatibilityLevel.WARNING,
        message: `Estimated ${wattage}W is close to PSU capacity (${psuCap}W).`,
      });
    }
  }

  const status = issues.some((i) => i.level === CompatibilityLevel.INCOMPATIBLE)
    ? CompatibilityLevel.INCOMPATIBLE
    : issues.length > 0
      ? CompatibilityLevel.WARNING
      : CompatibilityLevel.COMPATIBLE;

  return { status, issues };
}

function estimatePowerStats(
  cart: CartItem[],
  powerDefaults: BuilderSettings["powerDefaults"]
): { wattage: number; psuCap: number | null } {
  let w = powerDefaults.baseWattage;
  let psuCap: number | null = null;
  
  for (const item of cart) {
    const wattage = getSpecValue(item.specs, "wattage") || getSpecValue(item.specs, "powerDraw");
    if (item.category === "Power Supply") {
      const cap = Number(wattage);
      if (!isNaN(cap)) psuCap = cap;
    }
    const n = Number(wattage);
    if (!isNaN(n) && n > 0) {
      w += n * item.quantity;
      continue;
    }
    if (item.category === "Processor") w += powerDefaults.cpuDefaultWattage;
    if (item.category === "Graphics Card") w += powerDefaults.gpuDefaultWattage;
    if (item.category === "RAM") w += powerDefaults.ramWattagePerStick * item.quantity;
    if (item.category === "Storage") w += powerDefaults.storageWattagePerDrive * item.quantity;
  }
  return { wattage: w, psuCap };
}

function getSpecValue(specs: any, ...keys: string[]): string {
  if (!specs || !Array.isArray(specs)) return "";
  for (const key of keys) {
    const spec = specs.find((s: any) => s.key === key);
    if (spec) {
      const value = spec.value;
      if (value === null || value === undefined || value === "") continue;
      return Array.isArray(value) ? value.join(", ") : String(value);
    }
  }
  return "";
}
