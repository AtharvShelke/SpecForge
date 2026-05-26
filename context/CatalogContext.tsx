"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  Product,
  SubCategory,
  Brand,
  Category,
  CategoryNode,
  CreateProduct,
  AdvancedFilter,
  CategoryAttribute,
  CreateCategoryAttribute,
  UpdateCategoryAttribute,
} from "../types";
import { apiFetch } from "@/lib/helpers";
import { useLoadingCounter } from "@/hooks/useLoadingCounter";

interface CatalogContextType {
  products: Product[];
  categories: Category[];
  subCategories: SubCategory[];
  brands: Brand[];
  attributes: CategoryAttribute[];
  categoryHierarchy: CategoryNode[];

  refreshProducts: (filters?: AdvancedFilter) => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshCategoryHierarchy: () => Promise<void>;
  updateCategoryHierarchy: (
    categories: CategoryNode[],
  ) => Promise<CategoryNode[]>;
  refreshSubCategories: (categoryId?: string) => Promise<void>;
  refreshBrands: () => Promise<void>;
  refreshAttributes: (categoryId?: number, subcategoryId?: number) => Promise<void>;

  createProduct: (data: CreateProduct) => Promise<void>;
  updateProduct: (id: string, data: Partial<CreateProduct>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  createAttribute: (data: CreateCategoryAttribute) => Promise<void>;
  updateAttribute: (id: string, data: UpdateCategoryAttribute) => Promise<void>;
  deleteAttribute: (id: string, categoryId?: number) => Promise<void>;

  loading: boolean;
  error: Error | null;
}

const CatalogContext = createContext<CatalogContextType | null>(null);

export const CatalogProvider = ({
  children,
  autoLoad = true,
}: {
  children: ReactNode;
  autoLoad?: boolean;
}) => {
  const { loading, start, stop } = useLoadingCounter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [attributes, setAttributes] = useState<CategoryAttribute[]>([]);
  const [categoryHierarchy, setCategoryHierarchy] = useState<CategoryNode[]>(
    [],
  );
  const [error, setError] = useState<Error | null>(null);

  const refreshProducts = useCallback(
    async (filters?: AdvancedFilter) => {
      setError(null);
      start();
      try {
        let url = "/api/catalog/products";
        if (filters) {
          url = "/api/catalog/products/filter";
          const data = await apiFetch<any>(url, {
            method: "POST",
            body: JSON.stringify(filters),
          });
          setProducts(Array.isArray(data) ? data : (data?.products ?? []));
          return;
        }
        const data = await apiFetch<any>(url);
        setProducts(Array.isArray(data) ? data : (data?.products ?? []));
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        stop();
      }
    },
    [start, stop],
  );

  const refreshCategories = useCallback(async () => {
    setError(null);
    start();
    try {
      const data = await apiFetch<Category[]>("/api/catalog/categories");
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      stop();
    }
  }, [start, stop]);

  const refreshCategoryHierarchy = useCallback(async () => {
    setError(null);
    start();
    try {
      const data = await apiFetch<CategoryNode[]>(
        "/api/catalog/categories/hierarchy",
      );
      setCategoryHierarchy(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      stop();
    }
  }, [start, stop]);

  const updateCategoryHierarchy = useCallback(
    async (categories: CategoryNode[]) => {
      setError(null);
      start();
      try {
        const data = await apiFetch<CategoryNode[]>(
          "/api/catalog/categories/hierarchy",
          {
            method: "PUT",
            body: JSON.stringify(categories),
          },
        );
        const next = Array.isArray(data) ? data : [];
        setCategoryHierarchy(next);
        return next;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        stop();
      }
    },
    [start, stop],
  );

  const refreshSubCategories = useCallback(
    async (categoryId?: string) => {
      setError(null);
      start();
      try {
        const url = categoryId
          ? `/api/catalog/subcategories?categoryId=${categoryId}`
          : "/api/catalog/subcategories";
        const data = await apiFetch<SubCategory[]>(url);
        setSubCategories(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        stop();
      }
    },
    [start, stop],
  );

  const refreshBrands = useCallback(async () => {
    setError(null);
    start();
    try {
      const data = await apiFetch<Brand[]>("/api/catalog/brands");
      setBrands(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      stop();
    }
  }, [start, stop]);

  const refreshAttributes = useCallback(
    async (categoryId?: number, subcategoryId?: number) => {
      setError(null);
      start();
      try {
        const params = new URLSearchParams();
        if (categoryId) params.set("categoryId", String(categoryId));
        if (subcategoryId) params.set("subcategoryId", String(subcategoryId));
        const qs = params.toString();
        const url = qs
          ? `/api/catalog/attributes?${qs}`
          : "/api/catalog/attributes";
        const data = await apiFetch<CategoryAttribute[]>(url);
        setAttributes(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        stop();
      }
    },
    [start, stop],
  );

  const createProduct = useCallback(
    async (data: CreateProduct) => {
      setError(null);
      start();
      try {
        await apiFetch("/api/catalog/products", {
          method: "POST",
          body: JSON.stringify(data),
        });
        await refreshProducts();
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        stop();
      }
    },
    [refreshProducts, start, stop],
  );

  const updateProduct = useCallback(
    async (id: string, data: Partial<CreateProduct>) => {
      setError(null);
      start();
      try {
        await apiFetch(`/api/catalog/products/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
        await refreshProducts();
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        stop();
      }
    },
    [refreshProducts, start, stop],
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      setError(null);
      start();
      try {
        await apiFetch(`/api/catalog/products/${id}`, { method: "DELETE" });
        await refreshProducts();
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        stop();
      }
    },
    [refreshProducts, start, stop],
  );

  const createAttribute = useCallback(
    async (data: CreateCategoryAttribute) => {
      setError(null);
      start();
      try {
        await apiFetch("/api/catalog/attributes", {
          method: "POST",
          body: JSON.stringify(data),
        });
        await refreshAttributes(data.categoryId, data.subcategoryId ?? undefined);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        stop();
      }
    },
    [refreshAttributes, start, stop],
  );

  const updateAttribute = useCallback(
    async (id: string, data: UpdateCategoryAttribute) => {
      setError(null);
      start();
      try {
        await apiFetch(`/api/catalog/attributes/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
        await refreshAttributes();
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        stop();
      }
    },
    [refreshAttributes, start, stop],
  );

  const deleteAttribute = useCallback(
    async (id: string, categoryId?: number) => {
      setError(null);
      start();
      try {
        await apiFetch(`/api/catalog/attributes/${id}`, { method: "DELETE" });
        await refreshAttributes(categoryId);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        stop();
      }
    },
    [refreshAttributes, start, stop],
  );

  const loadAll = useCallback(async () => {
    setError(null);
    start();
    try {
      await Promise.allSettled([
        refreshProducts(),
        refreshCategories(),
        refreshCategoryHierarchy(),
        refreshSubCategories(),
        refreshBrands(),
        refreshAttributes(),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      stop();
    }
  }, [
    refreshProducts,
    refreshCategories,
    refreshCategoryHierarchy,
    refreshSubCategories,
    refreshBrands,
    refreshAttributes,
    start,
    stop,
  ]);

  useEffect(() => {
    if (!autoLoad) return;
    loadAll();
  }, [autoLoad, loadAll]);

  return (
    <CatalogContext.Provider
      value={{
        products,
        categories,
        subCategories,
        brands,
        attributes,
        categoryHierarchy,
        refreshProducts,
        refreshCategories,
        refreshCategoryHierarchy,
        updateCategoryHierarchy,
        refreshSubCategories,
        refreshBrands,
        refreshAttributes,
        createProduct,
        updateProduct,
        deleteProduct,
        createAttribute,
        updateAttribute,
        deleteAttribute,
        loading,
        error,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
};

export const useCatalog = () => {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used within CatalogProvider");
  return ctx;
};
