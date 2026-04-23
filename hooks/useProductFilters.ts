/**
 * useProductFilters.ts — React hook for managing product filter state.
 *
 * Provides:
 *   - AdvancedFilter object for typed spec-aware filtering
 *   - URL sync via useSearchParams for deep-linking and browser history
 *   - Methods to update spec filters, price range, brand, and status
 *   - clearFilters() to reset all state
 *
 * Filter semantics:
 *   - filters[].specId   — SpecDefinition ID
 *   - filters[].values   — string[] (backend coerces to NUMBER for numeric specs)
 *   - Multiple filters   → AND (product must match ALL)
 *   - Multiple values    → OR  (within a single spec)
 */

"use client";

import { useMemo, useCallback, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { AdvancedFilter } from "@/types";

const DEFAULT_MAX_PRICE = 500000;

export interface UseProductFiltersReturn {
  /** Current AdvancedFilter object derived from state */
  filter: AdvancedFilter;
  /** Subcategory ID */
  subCategoryId: string | null;
  /** Spec filters: Array of { specId, values[] } */
  specFilters: Array<{ specId: string; values: string[] }>;
  /** Price range */
  priceMin: number;
  priceMax: number;
  /** Brand filter */
  brandId: string | null;
  /** Status filter */
  status: string | null;
  /** Update spec filter — adds/replaces specId with values */
  setSpecFilter: (specId: string, values: string[]) => void;
  /** Remove a specific value from a spec filter */
  removeSpecValue: (specId: string, value: string) => void;
  /** Set price range */
  setPriceRange: (min: number, max: number) => void;
  /** Set brand filter */
  setBrandId: (brandId: string | null) => void;
  /** Set status filter */
  setStatus: (status: string | null) => void;
  /** Clear all filters including subcategory */
  clearFilters: () => void;
  /** Set subcategory — clears spec filters when changed */
  setSubCategoryId: (subCategoryId: string | null) => void;
}

/**
 * Hook for managing product filter state with URL sync.
 *
 * @param initialSubCategoryId Optional initial subcategory ID
 */
export function useProductFilters(
  initialSubCategoryId?: string | null
): UseProductFiltersReturn {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // ── Initialize state from URL params ────────────────────────────────────────

  const subCategoryIdFromUrl = searchParams.get("subCategoryId");
  const priceMinFromUrl = Number(searchParams.get("priceMin")) || 0;
  const priceMaxFromUrl =
    Number(searchParams.get("priceMax")) || DEFAULT_MAX_PRICE;
  const brandIdFromUrl = searchParams.get("brandId");
  const statusFromUrl = searchParams.get("status");

  // Parse spec filters from URL (f_spec.{specId}=value format)
  const specFiltersFromUrl = useMemo(() => {
    const filters: Array<{ specId: string; values: string[] }> = [];
    const specMap = new Map<string, Set<string>>();

    searchParams.forEach((value, key) => {
      if (key.startsWith("f_spec.")) {
        const specId = key.slice(7); // Remove "f_spec." prefix
        if (!specMap.has(specId)) {
          specMap.set(specId, new Set());
        }
        specMap.get(specId)!.add(value);
      }
    });

    specMap.forEach((values, specId) => {
      filters.push({ specId, values: Array.from(values) });
    });

    return filters;
  }, [searchParams]);

  // ── State ────────────────────────────────────────────────────────────────────

  const subCategoryId = subCategoryIdFromUrl || initialSubCategoryId || null;
  const priceMin = priceMinFromUrl;
  const priceMax = Math.min(priceMaxFromUrl, DEFAULT_MAX_PRICE);
  const brandId = brandIdFromUrl || null;
  const status = statusFromUrl || null;

  // ── Derived AdvancedFilter ───────────────────────────────────────────────────

  const filter: AdvancedFilter = useMemo(() => {
    const result: AdvancedFilter = {
      subCategoryId: subCategoryId || "",
      filters: specFiltersFromUrl,
    };

    if (priceMin > 0) result.priceMin = priceMin;
    if (priceMax < DEFAULT_MAX_PRICE) result.priceMax = priceMax;
    if (brandId) result.brandId = brandId;
    if (status) result.status = status;

    return result;
  }, [subCategoryId, specFiltersFromUrl, priceMin, priceMax, brandId, status]);

  // ── URL sync helpers ─────────────────────────────────────────────────────────

  const updateUrl = useCallback(
    (
      updates: Partial<{
        subCategoryId: string | null;
        specFilters: Array<{ specId: string; values: string[] }>;
        priceMin: number;
        priceMax: number;
        brandId: string | null;
        status: string | null;
      }>
    ) => {
      const params = new URLSearchParams(searchParams.toString());

      // Update subCategoryId
      if (updates.subCategoryId !== undefined) {
        if (updates.subCategoryId) {
          params.set("subCategoryId", updates.subCategoryId);
        } else {
          params.delete("subCategoryId");
        }
      }

      // Update spec filters — remove old, add new
      if (updates.specFilters !== undefined) {
        // Remove all existing f_spec.* params
        Array.from(params.keys()).forEach((key) => {
          if (key.startsWith("f_spec.")) params.delete(key);
        });
        // Add new spec filters
        for (const { specId, values } of updates.specFilters) {
          for (const value of values) {
            params.append(`f_spec.${specId}`, value);
          }
        }
      }

      // Update price range
      if (updates.priceMin !== undefined) {
        if (updates.priceMin > 0) {
          params.set("priceMin", updates.priceMin.toString());
        } else {
          params.delete("priceMin");
        }
      }
      if (updates.priceMax !== undefined) {
        if (updates.priceMax < DEFAULT_MAX_PRICE) {
          params.set("priceMax", updates.priceMax.toString());
        } else {
          params.delete("priceMax");
        }
      }

      // Update brandId
      if (updates.brandId !== undefined) {
        if (updates.brandId) {
          params.set("brandId", updates.brandId);
        } else {
          params.delete("brandId");
        }
      }

      // Update status
      if (updates.status !== undefined) {
        if (updates.status) {
          params.set("status", updates.status);
        } else {
          params.delete("status");
        }
      }

      // Clean up empty subCategoryId
      if (!params.get("subCategoryId")) {
        params.delete("subCategoryId");
      }

      const newUrl = `${pathname}?${params.toString()}`;
      router.replace(newUrl, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  // ── Filter actions ───────────────────────────────────────────────────────────

  const setSpecFilter = useCallback(
    (specId: string, values: string[]) => {
      const newSpecFilters = [...specFiltersFromUrl];
      const existingIndex = newSpecFilters.findIndex((f) => f.specId === specId);

      if (values.length === 0) {
        // Remove spec filter if no values
        if (existingIndex >= 0) {
          newSpecFilters.splice(existingIndex, 1);
        }
      } else {
        // Add or update spec filter
        if (existingIndex >= 0) {
          newSpecFilters[existingIndex] = { specId, values };
        } else {
          newSpecFilters.push({ specId, values });
        }
      }

      updateUrl({ specFilters: newSpecFilters });
    },
    [specFiltersFromUrl, updateUrl]
  );

  const removeSpecValue = useCallback(
    (specId: string, value: string) => {
      const newSpecFilters = specFiltersFromUrl.map((f) => {
        if (f.specId === specId) {
          return { ...f, values: f.values.filter((v) => v !== value) };
        }
        return f;
      }).filter((f) => f.values.length > 0);

      updateUrl({ specFilters: newSpecFilters });
    },
    [specFiltersFromUrl, updateUrl]
  );

  const setPriceRange = useCallback(
    (min: number, max: number) => {
      updateUrl({ priceMin: min, priceMax: max });
    },
    [updateUrl]
  );

  const setBrandId = useCallback(
    (brandId: string | null) => {
      updateUrl({ brandId });
    },
    [updateUrl]
  );

  const setStatus = useCallback(
    (status: string | null) => {
      updateUrl({ status });
    },
    [updateUrl]
  );

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams();
    // Preserve non-filter params if needed (e.g., page, sort, view)
    const preserveKeys = ["page", "sort", "view", "q", "mode"];
    preserveKeys.forEach((key) => {
      const val = searchParams.get(key);
      if (val) params.set(key, val);
    });

    const newUrl = `${pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [searchParams, pathname, router]);

  const setSubCategoryId = useCallback(
    (subCategoryId: string | null) => {
      // When subcategory changes, clear spec filters (specs are subcategory-specific)
      updateUrl({ subCategoryId, specFilters: [] });
    },
    [updateUrl]
  );

  // ── Return ───────────────────────────────────────────────────────────────────

  return {
    filter,
    subCategoryId,
    specFilters: specFiltersFromUrl,
    priceMin,
    priceMax,
    brandId,
    status,
    setSpecFilter,
    removeSpecValue,
    setPriceRange,
    setBrandId,
    setStatus,
    clearFilters,
    setSubCategoryId,
  };
}
