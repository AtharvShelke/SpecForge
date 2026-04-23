export const CATEGORY_NAMES = {
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

export type CategoryName = string;

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  Object.values(CATEGORY_NAMES).map((name) => [name, name]),
);

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
