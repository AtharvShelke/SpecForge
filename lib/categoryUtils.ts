// Fallback static category names for client-side use
export const FALLBACK_CATEGORY_NAMES = {
  PROCESSOR: 'Processor',
  MOTHERBOARD: 'Motherboard',
  RAM: 'RAM',
  GPU: 'Graphics Card',
  STORAGE: 'Storage',
  PSU: 'Power Supply',
  CABINET: 'Cabinet',
  COOLER: 'Cooler',
  MONITOR: 'Monitor',
  PERIPHERAL: 'Peripheral',
  NETWORKING: 'Networking',
} as const;

/** @alias FALLBACK_CATEGORY_NAMES — kept for backward compatibility */
export const CATEGORY_NAMES = FALLBACK_CATEGORY_NAMES;

export type CategoryName = string;

// Dynamic category labels - should be populated from API
export let CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  Object.values(FALLBACK_CATEGORY_NAMES).map((name) => [name, name]),
);

// Function to update category labels dynamically
export function updateCategoryLabels(categories: { name: string }[]) {
  CATEGORY_LABELS = Object.fromEntries(
    categories.map(cat => [cat.name, cat.name])
  );
}

export function normalizeCategoryName(value?: string | null) {
  return (value ?? '').trim().toLowerCase();
}

export function sameCategory(a?: string | null, b?: string | null) {
  return normalizeCategoryName(a) === normalizeCategoryName(b);
}

export function getProductCategoryName(product: {
  category?: string | null;
  subCategory?: { category?: { name?: string | null } | null; name?: string | null } | null;
}) {
  return product.category || product.subCategory?.category?.name || product.subCategory?.name || 'Uncategorized';
}
