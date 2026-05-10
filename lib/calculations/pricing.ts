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
  price?: number | null;
  quantity: number;
  product?: {
    price?: number | null;
  } | null;
}

/**
 * Calculate total build price from items.
 */
export function calculateBuildPrice(items: BuildItem[]) {
  return items.reduce((total, item) => {
    const unitPrice = item.price ?? item.product?.price ?? 0;
    return total + unitPrice * item.quantity;
  }, 0);
}
