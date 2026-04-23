/**
 * useProduct.ts — React hook for a single Product.
 *
 * Provides:
 *   - product         — Product with variants[].variantSpecs[] populated
 *   - loading         — initial fetch in-progress
 *   - error           — last error message (null if none)
 *   - refresh()       — manually re-fetch
 *   - update()        — PATCH top-level product fields
 *   - remove()        — soft-delete
 *   - addVariant()    — POST a new variant with optional nested specs
 *
 * VariantSpec contract (per variant):
 *   - variantSpecs[]  — typed spec values; only ONE of valueString/valueNumber/valueBool/optionId is set
 *   - attributes      — freeform JSON; kept separate from variantSpecs
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getProduct,
  updateProduct,
  deleteProduct,
  createVariant,
  ProductServiceError,
} from "@/lib/services/product.service";
import type {
  Product,
  ProductVariant,
  CreateProduct,
  CreateVariant,
} from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface UseProductReturn {
  /** Full product record with variants[].variantSpecs[] */
  product: Product | null;
  loading: boolean;
  error: string | null;
  /** Re-fetches the product from the server */
  refresh: () => Promise<void>;
  /** PATCH top-level product fields — does NOT modify variants or specs */
  update: (data: Partial<CreateProduct>) => Promise<Product>;
  /** Soft-deletes the product */
  remove: () => Promise<void>;
  /**
   * Creates a new variant under this product.
   * Pass `specs` in the CreateVariant payload to attach VariantSpecs atomically.
   */
  addVariant: (data: CreateVariant) => Promise<ProductVariant>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param id  Product ID to fetch. Pass null / undefined to skip fetching.
 */
export function useProduct(id: string | null | undefined): UseProductReturn {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getProduct(id);
      // Ensure variantSpecs defaults to [] so consumers never receive undefined
      const normalized: Product = {
        ...data,
        variants: (data.variants ?? []).map((v) => ({
          ...v,
          variantSpecs: v.variantSpecs ?? [],
          attributes: v.attributes ?? null,
        })),
      };
      setProduct(normalized);
    } catch (err) {
      const msg =
        err instanceof ProductServiceError
          ? err.message
          : "Failed to load product";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const update = useCallback(
    async (data: Partial<CreateProduct>): Promise<Product> => {
      if (!id) throw new ProductServiceError("No product ID provided", 400);
      const updated = await updateProduct(id, data);
      // Merge into local state — preserve relations not returned by PATCH
      setProduct((prev) =>
        prev ? { ...prev, ...updated } : updated
      );
      return updated;
    },
    [id]
  );

  const remove = useCallback(async (): Promise<void> => {
    if (!id) throw new ProductServiceError("No product ID provided", 400);
    await deleteProduct(id);
    setProduct(null);
  }, [id]);

  const addVariant = useCallback(
    async (data: CreateVariant): Promise<ProductVariant> => {
      if (!id) throw new ProductServiceError("No product ID provided", 400);
      const variant = await createVariant(id, data);
      // Normalize variantSpecs on the new variant before appending
      const normalized: ProductVariant = {
        ...variant,
        variantSpecs: variant.variantSpecs ?? [],
        attributes: variant.attributes ?? null,
      };
      setProduct((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          variants: [...(prev.variants ?? []), normalized],
        };
      });
      return normalized;
    },
    [id]
  );

  return {
    product,
    loading,
    error,
    refresh: fetchProduct,
    update,
    remove,
    addVariant,
  };
}
