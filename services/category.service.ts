import { CategoryHierarchy } from "@/types";
import { apiFetch } from "@/lib/helpers";

const API_BASE = "/api/catalog/categories/hierarchy";

/**
 * Client-side service for fetching the CategoryHierarchy tree.
 * Used by the sidebar/category tree navigation component.
 */

/**
 * Fetches the full category hierarchy (pre-nested tree sorted by sortOrder).
 * Falls back to client-side sort as a safety net.
 */
export async function getCategoryHierarchy(): Promise<CategoryHierarchy[]> {
  const data = await apiFetch<CategoryHierarchy[]>(API_BASE);

  // Safety-net: sort by sortOrder at every level (API should already return sorted)
  return sortHierarchy(data);
}

/**
 * Recursively sorts hierarchy nodes and their children by sortOrder.
 */
function sortHierarchy(nodes: CategoryHierarchy[]): CategoryHierarchy[] {
  return [...nodes]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((node) => ({
      ...node,
      children: node.children?.length ? sortHierarchy(node.children) : [],
    }));
}
