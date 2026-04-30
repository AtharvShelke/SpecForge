"use client";

import { useCallback, useEffect, useMemo, useRef, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const DEFAULT_LIMIT = 15;

export function useProductFilters() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const selectedFilters = useMemo(() => {
    const map: Record<string, string[]> = {};

    for (const [key, value] of searchParams.entries()) {
      if (!key.startsWith("f.")) continue;
      const filterId = key.slice(2);
      map[filterId] = [...(map[filterId] ?? []), value];
    }

    return map;
  }, [searchParams]);

  const updateParams = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      updater(params);
      params.delete("cursor");
      if (!params.get("limit")) {
        params.set("limit", String(DEFAULT_LIMIT));
      }

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  const toggleFilterValue = useCallback(
    (filterId: string, value: string) => {
      updateParams((params) => {
        const key = `f.${filterId}`;
        const values = params.getAll(key);
        params.delete(key);

        if (values.includes(value)) {
          values
            .filter((entry) => entry !== value)
            .forEach((entry) => params.append(key, entry));
          return;
        }

        [...values, value].forEach((entry) => params.append(key, entry));
      });
    },
    [updateParams],
  );

  const setSubCategoryId = useCallback(
    (value: string | null) => {
      updateParams((params) => {
        Array.from(params.keys()).forEach((key) => {
          if (key.startsWith("f.")) {
            params.delete(key);
          }
        });
        if (value) {
          params.set("subCategoryId", value);
        } else {
          params.delete("subCategoryId");
        }
      });
    },
    [updateParams],
  );

  const setCategory = useCallback(
    (value: string | null) => {
      updateParams((params) => {
        Array.from(params.keys()).forEach((key) => {
          if (key.startsWith("f.")) {
            params.delete(key);
          }
        });
        params.delete("subCategoryId");
        params.delete("minPrice");
        params.delete("maxPrice");

        if (value) {
          params.set("category", value);
        } else {
          params.delete("category");
        }
      });
    },
    [updateParams],
  );

  const setPriceRange = useCallback(
    (minPrice: number | null, maxPrice: number | null) => {
      updateParams((params) => {
        if (typeof minPrice === "number" && Number.isFinite(minPrice) && minPrice >= 0) {
          params.set("minPrice", String(minPrice));
        } else {
          params.delete("minPrice");
        }

        if (typeof maxPrice === "number" && Number.isFinite(maxPrice) && maxPrice >= 0) {
          params.set("maxPrice", String(maxPrice));
        } else {
          params.delete("maxPrice");
        }
      });
    },
    [updateParams],
  );

  const setSort = useCallback(
    (value: string) => {
      updateParams((params) => {
        params.set("sort", value);
      });
    },
    [updateParams],
  );

  const setSearchQuery = useCallback(
    (value: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        updateParams((params) => {
          if (value.trim()) {
            params.set("q", value.trim());
          } else {
            params.delete("q");
          }
        });
      }, 180);
    },
    [updateParams],
  );

  const clearFilters = useCallback(() => {
    updateParams((params) => {
      const preserved = {
        category: params.get("category"),
        subCategoryId: params.get("subCategoryId"),
        q: params.get("q"),
        sort: params.get("sort"),
      };

      params.forEach((_, key) => {
        params.delete(key);
      });

      if (preserved.category) {
        params.set("category", preserved.category);
      }
      if (preserved.subCategoryId) {
        params.set("subCategoryId", preserved.subCategoryId);
      }
      if (preserved.q) {
        params.set("q", preserved.q);
      }
      if (preserved.sort) {
        params.set("sort", preserved.sort);
      }
    });
  }, [updateParams]);

  const activeFilterCount = useMemo(() => {
    return Object.values(selectedFilters).reduce(
      (total, values) => total + values.length,
      (searchParams.get("minPrice") ? 1 : 0) + (searchParams.get("maxPrice") ? 1 : 0),
    );
  }, [searchParams, selectedFilters]);

  return {
    activeFilterCount,
    category: searchParams.get("category"),
    clearFilters,
    limit: Number(searchParams.get("limit") ?? DEFAULT_LIMIT),
    maxPrice: searchParams.get("maxPrice")
      ? Number(searchParams.get("maxPrice"))
      : null,
    minPrice: searchParams.get("minPrice")
      ? Number(searchParams.get("minPrice"))
      : null,
    query: searchParams.get("q") ?? "",
    selectedFilters,
    selectedSubCategoryId: searchParams.get("subCategoryId"),
    setCategory,
    setPriceRange,
    setSearchQuery,
    setSort,
    setSubCategoryId,
    sort: searchParams.get("sort") ?? "featured",
    toggleFilterValue,
  };
}
