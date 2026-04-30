"use client";

import { useEffect, useMemo, useState } from "react";

import { CatalogListingResult, DynamicCatalogFilter, Product } from "@/types";

type CatalogResponse = CatalogListingResult & {
  nextCursor?: string | null;
};

export function useCatalogListing({
  searchKey,
  limit,
  page,
  endpoint = "/api/catalog/products",
}: {
  searchKey: string;
  limit: number;
  page: number;
  endpoint?: string;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<DynamicCatalogFilter[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / Math.max(1, limit))), [
    total,
    limit,
  ]);

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      setIsLoading(true);

      try {
        const params = new URLSearchParams(searchKey);
        params.set("limit", String(limit));
        params.set("cursor", String((page - 1) * limit));

        const response = await fetch(`${endpoint}?${params.toString()}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load catalog");
        }

        const payload = (await response.json()) as CatalogResponse;
        if (cancelled) return;

        setProducts(payload.products);
        setFilters(payload.filters);
        setTotal(payload.total);
      } catch {
        if (cancelled) return;
        setProducts([]);
        setFilters([]);
        setTotal(0);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [endpoint, limit, page, searchKey]);

  return { products, filters, total, isLoading, totalPages };
}

