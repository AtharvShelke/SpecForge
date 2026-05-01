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
}

const CatalogContext = createContext<CatalogContextType | null>(null);

async function fetchJSON(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    let msg = "Request failed";
    try {
      msg = await res.text();
    } catch (e) {}
    throw new Error(msg);
  }
  return res.json();
}

export const CatalogProvider = ({
  children,
  autoLoad = true,
}: {
  children: ReactNode;
  autoLoad?: boolean;
}) => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [specs, setSpecs] = useState<SpecDefinition[]>([]);
  const [categoryHierarchy, setCategoryHierarchy] = useState<CategoryNode[]>(
    [],
  );

  const refreshProducts = useCallback(async (filters?: AdvancedFilter) => {
    let url = "/api/catalog/products";
    if (filters) {
      url = "/api/catalog/products/filter";
      const data = await fetchJSON(url, {
        method: "POST",
        body: JSON.stringify(filters),
      });
      setProducts(Array.isArray(data) ? data : (data?.products ?? []));
      return;
    }
    const data = await fetchJSON(url);
    setProducts(Array.isArray(data) ? data : (data?.products ?? []));
  }, []);

  const refreshCategories = useCallback(async () => {
    const data = await fetchJSON("/api/catalog/categories");
    setCategories(data);
  }, []);

  const refreshCategoryHierarchy = useCallback(async () => {
    const data = await fetchJSON("/api/catalog/categories/hierarchy");
    setCategoryHierarchy(Array.isArray(data) ? data : []);
  }, []);

  const updateCategoryHierarchy = useCallback(
    async (categories: CategoryNode[]) => {
      const data = await fetchJSON("/api/catalog/categories/hierarchy", {
        method: "PUT",
        body: JSON.stringify(categories),
      });
      const next = Array.isArray(data) ? data : [];
      setCategoryHierarchy(next);
      return next;
    },
    [],
  );

  const refreshSubCategories = useCallback(async (categoryId?: string) => {
    const url = categoryId
      ? `/api/catalog/subcategories?categoryId=${categoryId}`
      : "/api/catalog/subcategories";
    const data = await fetchJSON(url);
    setSubCategories(data);
  }, []);

  const refreshBrands = useCallback(async () => {
    const data = await fetchJSON("/api/catalog/brands");
    setBrands(data);
  }, []);

  const refreshSpecs = useCallback(async (subCategoryId?: string) => {
    const url = subCategoryId
      ? `/api/catalog/specs?subCategoryId=${subCategoryId}`
      : "/api/catalog/specs";
    const data = await fetchJSON(url);
    setSpecs(data);
  }, []);

  const createProduct = async (data: CreateProduct) => {
    await fetchJSON("/api/catalog/products", {
      method: "POST",
      body: JSON.stringify(data),
    });
    await refreshProducts();
  };

  const updateProduct = async (id: string, data: Partial<CreateProduct>) => {
    await fetchJSON(`/api/catalog/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    await refreshProducts();
  };

  const deleteProduct = async (id: string) => {
    await fetchJSON(`/api/catalog/products/${id}`, { method: "DELETE" });
    await refreshProducts();
  };

  const createVariant = async (productId: string, data: CreateVariant) => {
    await fetchJSON(`/api/catalog/products/${productId}/variants`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    await refreshProducts();
  };

  const createSpec = async (data: import("../types").CreateSpecWithOptions) => {
    await fetchJSON("/api/catalog/specs", {
      method: "POST",
      body: JSON.stringify(data),
    });
    await refreshSpecs(data.subCategoryId);
  };

  const updateSpec = async (id: string, data: UpdateSpecInput) => {
    const result = await fetchJSON(`/api/catalog/specs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    const nextSubCategoryId = (result as SpecDefinition | undefined)
      ?.subCategoryId;
    await refreshSpecs(nextSubCategoryId);
  };

  const deleteSpec = async (id: string, subCategoryId?: string) => {
    await fetchJSON(`/api/catalog/specs/${id}`, { method: "DELETE" });
    await refreshSpecs(subCategoryId);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        refreshProducts(),
        refreshCategories(),
        refreshCategoryHierarchy(),
        refreshSubCategories(),
        refreshBrands(),
        refreshSpecs(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [
    refreshProducts,
    refreshCategories,
    refreshCategoryHierarchy,
    refreshSubCategories,
    refreshBrands,
    refreshSpecs,
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
