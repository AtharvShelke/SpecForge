/**
 * useProducts.ts — React hook for the product listing page.
 *
 * Provides:
 *   - products         — Product[] (each with variants[].variantSpecs[])
 *   - loading          — initial fetch in-progress
 *   - error            — last error message (null if none)
 *   - refresh()        — re-fetch with current filter
 *   - filterBy()       — apply an AdvancedFilter and replace the product list
 *   - clearFilter()    — reset to unfiltered list
 *   - create()         — POST a new product (supports deep creation with variants[].specs[])
 *
 * Filter semantics (AdvancedFilter):
 *   - subCategoryId            — required when filtering by specs
 *   - filters[].specId         — SpecDefinition ID
 *   - filters[].values         — string[] (backend coerces to NUMBER for numeric specs)
 *   - Multiple filters         → AND
 *   - Multiple values per spec → OR
 *   - priceMin / priceMax      — filter on cheapest variant price
 *   - brandId                  — filter by brand
 *   - status                   — ProductStatus enum value ("ACTIVE" | "DRAFT" | "ARCHIVED")
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getProducts,
  filterProducts,
  createProduct,
  ProductServiceError,
} from "@/lib/services/product.service";
import type { Product, AdvancedFilter, CreateProduct } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface UseProductsReturn {
  /** Product list — each item has variants[].variantSpecs[] and variants[].attributes */
  products: Product[];
  loading: boolean;
  error: string | null;
  /** Active filter (null = unfiltered) */
  activeFilter: AdvancedFilter | null;
  /** Re-fetches with the currently active filter */
  refresh: () => Promise<void>;
  /**
   * Applies an AdvancedFilter to the product list.
   * Sends POST /api/catalog/products/filter with the structured filter object.
   *
   * values[] are always strings — backend coerces to Float for NUMBER specs.
   */
  filterBy: (filter: AdvancedFilter) => Promise<void>;
  /** Clears any active filter and re-fetches the full product list */
  clearFilter: () => Promise<void>;
  /**
   * Creates a product with optional deeply-nested variants and variantSpecs.
   *
   * CreateProduct supports:
   *   variants[].specs[].specId       — SpecDefinition ID
   *   variants[].specs[].optionId     — for select-type specs (predefined SpecOptions)
   *   variants[].specs[].valueString  — for STRING specs
   *   variants[].specs[].valueNumber  — for NUMBER specs
   *   variants[].specs[].valueBool    — for BOOLEAN specs
   *   variants[].attributes           — freeform JSON (separate from specs)
   */
  create: (data: CreateProduct) => Promise<Product>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalizer — ensure all relational arrays default to []
// ─────────────────────────────────────────────────────────────────────────────

function normalizeProduct(p: Product): Product {
  return {
    ...p,
    variants: (p.variants ?? []).map((v) => ({
      ...v,
      variantSpecs: v.variantSpecs ?? [],
      attributes: v.attributes ?? null,
    })),
    media: p.media ?? [],
  };
}

function normalizeProducts(data: Product[]): Product[] {
  return data.map(normalizeProduct);
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param initialFilter  Optional initial AdvancedFilter to apply on mount.
 *                       Pass null / undefined for an unfiltered list.
 */
export function useProducts(
  initialFilter?: AdvancedFilter | null
): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<AdvancedFilter | null>(
    initialFilter ?? null
  );

  // Keep a ref to avoid stale closures in refresh
  const activeFilterRef = useRef<AdvancedFilter | null>(activeFilter);
  activeFilterRef.current = activeFilter;

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data: Product[];
      if (activeFilterRef.current) {
        data = await filterProducts(activeFilterRef.current);
      } else {
        data = await getProducts();
      }
      setProducts(normalizeProducts(data));
    } catch (err) {
      const msg =
        err instanceof ProductServiceError
          ? err.message
          : "Failed to load products";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []); // intentionally stable — reads filter from ref

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only on mount; callers use filterBy/clearFilter/refresh explicitly

  // ── Filter actions ─────────────────────────────────────────────────────────

  const filterBy = useCallback(
    async (filter: AdvancedFilter): Promise<void> => {
      setActiveFilter(filter);
      activeFilterRef.current = filter;
      setLoading(true);
      setError(null);
      try {
        const data = await filterProducts(filter);
        setProducts(normalizeProducts(data));
      } catch (err) {
        const msg =
          err instanceof ProductServiceError
            ? err.message
            : "Failed to filter products";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearFilter = useCallback(async (): Promise<void> => {
    setActiveFilter(null);
    activeFilterRef.current = null;
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts();
      setProducts(normalizeProducts(data));
    } catch (err) {
      const msg =
        err instanceof ProductServiceError
          ? err.message
          : "Failed to load products";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const create = useCallback(async (data: CreateProduct): Promise<Product> => {
    const raw = await createProduct(data);
    const normalized = normalizeProduct(raw);
    setProducts((prev) => [normalized, ...prev]);
    return normalized;
  }, []);

  return {
    products,
    loading,
    error,
    activeFilter,
    refresh: fetchProducts,
    filterBy,
    clearFilter,
    create,
  };
}
