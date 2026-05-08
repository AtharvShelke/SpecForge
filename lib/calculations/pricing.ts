/**
 * Pricing Calculations
 * 
 * Consolidated pricing and tier calculations for products and builds.
 */

export type GpuTier = 'BUDGET' | 'MID' | 'ENTHUSIAST';

/**
 * Get GPU tier based on price.
 */
export function getGpuTier(price: number): GpuTier {
  if (price < 20000) return 'BUDGET';
  if (price < 60000) return 'MID';
  return 'ENTHUSIAST';
}

interface BuildItem {
  variant: {
    price: number;
  };
  quantity: number;
}

/**
 * Calculate total build price from items.
 */
export function calculateBuildPrice(items: BuildItem[]) {
  return items.reduce((total, item) => {
    return total + item.variant.price * item.quantity;
  }, 0);
}
