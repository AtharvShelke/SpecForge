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
  const price = product.variants?.[0]?.price || 0;
  const mediaScore = product.media?.length ? 10 : 0;
  const priceScore = price < 50000 ? 5 : 2;

  return mediaScore + priceScore;
}

/**
 * Filter products by GPU tier.
 */
export function filterGpuTier(products: Product[], tier: GpuTier) {
  return products.filter(p => {
    if (p.category !== 'GPU') return false;
    const price = p.variants?.[0]?.price || 0;
    return getGpuTier(price) === tier;
  });
}

/**
 * Get featured products (latest from key categories).
 */
export function getFeaturedProducts(products: Product[]) {
  const categories = ['GPU', 'PROCESSOR', 'MOTHERBOARD'];

  const featuredProducts = categories
    .map(category => {
      return products
        .filter(p => p.category === category)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
    })
    .filter(Boolean);

  return featuredProducts;
}
