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
    if (p.category.name !== 'GPU') return false;
    const price = p.price || 0;
    return getGpuTier(price) === tier;
  });
}

/**
 * Get featured products (latest from key categories).
 */
export function getFeaturedProducts(products: Product[]) {
  // Get the latest product from each category instead of hardcoded categories
  const categoryMap = new Map<string, Product>();
  
  products.forEach(product => {
    const categoryName = product.category.name;
    if (!categoryMap.has(categoryName) || 
        new Date(product.createdAt).getTime() > new Date(categoryMap.get(categoryName)!.createdAt).getTime()) {
      categoryMap.set(categoryName, product);
    }
  });

  return Array.from(categoryMap.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3); // Return top 3 latest products
}
