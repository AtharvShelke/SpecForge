/**
 * Product Calculations
 * 
 * Consolidated product scoring and filtering calculations.
 */

import { Product } from '@/types';
import { getGpuTier, GpuTier } from './pricing';

/**
 * Calculate product score based on media and price.
 */
export function getProductScore(product: Product) {
  const price = product.price || 0;
  const mediaScore = product.media?.length ? 10 : 0;
  const priceScore = price < 50000 ? 5 : 2;

  return mediaScore + priceScore;
}

/**
 * Filter products by GPU tier.
 */
export function filterGpuTier(products: Product[], tier: GpuTier) {
  return products.filter(p => {
    if (p.category?.name !== 'GPU') return false;

    const price = p.price || 0;

    return getGpuTier(price) === tier;
  });
}

/**
 * Get featured products (latest from key categories).
 */
export function getFeaturedProducts(products: Product[]) {
  // Get the latest product from each category
  const categoryMap = new Map<string, Product>();

  products.forEach(product => {
    const categoryName = product.category?.name;
    const createdAt = product.createdAt;

    if (!categoryName || !createdAt) return;

    const existing = categoryMap.get(categoryName);

    if (
      !existing ||
      new Date(createdAt).getTime() >
        new Date(existing.createdAt ?? 0).getTime()
    ) {
      categoryMap.set(categoryName, product);
    }
  });

  return Array.from(categoryMap.values())
    .sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime()
    )
    .slice(0, 3);
}