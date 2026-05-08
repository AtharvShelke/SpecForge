import { CategoryNode } from '../types';

export type { CategoryNode } from '../types';

export async function fetchCategoryHierarchy(): Promise<CategoryNode[]> {
  const response = await fetch('/api/categories/hierarchy');
  if (!response.ok) {
    throw new Error('Failed to fetch category hierarchy');
  }

  return response.json();
}
