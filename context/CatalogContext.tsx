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
  ProductVariant,
  SpecDefinition,
  SubCategory,
  Brand,
  Category,
  CategoryNode,
  CreateProduct,
  CreateVariant,
  AdvancedFilter,
  CreateSpecWithOptions,
  UpdateSpecInput,
} from "../types";
import { apiFetch, useLoadingCounter } from "@/lib/helpers";

interface CatalogContextType {
  products: Product[];
  categories: Category[];
  subCategories: SubCategory[];
  brands: Brand[];
  specs: SpecDefinition[];
  categoryHierarchy: CategoryNode[];

  refreshProducts: (filters?: AdvancedFilter) => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshCategoryHierarchy: () => Promise<void>;
  updateCategoryHierarchy: (
    categories: CategoryNode[],
  ) => Promise<CategoryNode[]>;
  refreshSubCategories: (categoryId?: string) => Promise<void>;
  refreshBrands: () => Promise<void>;
  refreshSpecs: (subCategoryId?: string) => Promise<void>;

  createProduct: (data: CreateProduct) => Promise<void>;
  updateProduct: (id: string, data: Partial<CreateProduct>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  createVariant: (productId: string, data: CreateVariant) => Promise<void>;
  createSpec: (data: CreateSpecWithOptions) => Promise<void>;
  updateSpec: (id: string, data: UpdateSpecInput) => Promise<void>;
  deleteSpec: (id: string, subCategoryId?: string) => Promise<void>;

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
  // start/stop are guaranteed stable by useLoadingCounter's internal useCallback([],
  // so including them in dependency arrays is safe and prevents exhaustive-deps warnings.
  const { loading, start, stop } = useLoadingCounter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [specs, setSpecs] = useState<SpecDefinition[]>([]);
  const [categoryHierarchy, setCategoryHierarchy] = useState<CategoryNode[]>(
    [],
  );
  const [error, setError] = useState<Error | null>(null);

  const refreshProducts = useCallback(async (filters?: AdvancedFilter) => {
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
    } finally {
      stop();
    }
  }, [start, stop]);

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

  const refreshSubCategories = useCallback(async (categoryId?: string) => {
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
  }, [start, stop]);

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

  const refreshSpecs = useCallback(async (subCategoryId?: string) => {
    setError(null);
    start();
    try {
      const url = subCategoryId
        ? `/api/catalog/specs?subCategoryId=${subCategoryId}`
        : "/api/catalog/specs";
      const data = await apiFetch<SpecDefinition[]>(url);
      setSpecs(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      stop();
    }
  }, [start, stop]);

  const createProduct = useCallback(async (data: CreateProduct) => {
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
    } finally {
      stop();
    }
  }, [refreshProducts, start, stop]);

  const updateProduct = useCallback(async (id: string, data: Partial<CreateProduct>) => {
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
    } finally {
      stop();
    }
  }, [refreshProducts, start, stop]);

  const deleteProduct = useCallback(async (id: string) => {
    setError(null);
    start();
    try {
      await apiFetch(`/api/catalog/products/${id}`, { method: "DELETE" });
      await refreshProducts();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      stop();
    }
  }, [refreshProducts, start, stop]);

  const createVariant = useCallback(async (productId: string, data: CreateVariant) => {
    setError(null);
    start();
    try {
      await apiFetch(`/api/catalog/products/${productId}/variants`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      await refreshProducts();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      stop();
    }
  }, [refreshProducts, start, stop]);

  const createSpec = useCallback(async (data: import("../types").CreateSpecWithOptions) => {
    setError(null);
    start();
    try {
      await apiFetch("/api/catalog/specs", {
        method: "POST",
        body: JSON.stringify(data),
      });
      await refreshSpecs(data.subCategoryId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      stop();
    }
  }, [refreshSpecs, start, stop]);

  const updateSpec = useCallback(async (id: string, data: UpdateSpecInput) => {
    setError(null);
    start();
    try {
      const result = await apiFetch(`/api/catalog/specs/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      const nextSubCategoryId = (result as SpecDefinition | undefined)
        ?.subCategoryId;
      await refreshSpecs(nextSubCategoryId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      stop();
    }
  }, [refreshSpecs, start, stop]);

  const deleteSpec = useCallback(async (id: string, subCategoryId?: string) => {
    setError(null);
    start();
    try {
      await apiFetch(`/api/catalog/specs/${id}`, { method: "DELETE" });
      await refreshSpecs(subCategoryId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      stop();
    }
  }, [refreshSpecs, start, stop]);

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
        refreshSpecs(),
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
    refreshSpecs,
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
        specs,
        categoryHierarchy,
        refreshProducts,
        refreshCategories,
        refreshCategoryHierarchy,
        updateCategoryHierarchy,
        refreshSubCategories,
        refreshBrands,
        refreshSpecs,
        createProduct,
        updateProduct,
        deleteProduct,
        createVariant,
        createSpec,
        updateSpec,
        deleteSpec,
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
