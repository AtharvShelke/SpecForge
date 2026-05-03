"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { CatalogProvider, useCatalog } from "./CatalogContext";
import { InventoryProvider, useInventory } from "./InventoryContext";
import { OrderProvider, useOrder } from "./OrderContext";
import { BuildProvider, useBuild } from "./BuildContext";
import type { CategoryNode } from "@/types";
import { apiFetch } from "@/lib/helpers";


interface AdminContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  syncData: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;

  // Domain Contexts (Facades for convenience)
  catalog: ReturnType<typeof useCatalog>;
  inventory: any;
  orders: any;
  builds: ReturnType<typeof useBuild>;

  [key: string]: any;
}

const AdminContext = createContext<AdminContextType | null>(null);

const AdminInnerProvider = ({ children }: { children: ReactNode }) => {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const hydratedTabsRef = useRef<Set<string>>(new Set());
  const [error, setError] = useState<Error | null>(null);

  const catalog = useCatalog();
  const inventory = useInventory();
  const orders = useOrder();
  const builds = useBuild();

  const isLoading =
    catalog.loading ||
    inventory.loading ||
    orders.loading ||
    builds.loading;

  const syncData = useCallback(async () => {
    setError(null);
    try {
      // Parallel refresh across all domains
      await Promise.allSettled([
        catalog.refreshProducts(),
        catalog.refreshCategories(),
        catalog.refreshCategoryHierarchy(),
        catalog.refreshBrands(),
        catalog.refreshSpecs(),
        inventory.refreshInventory(),
        inventory.refreshReservations(),
        orders.refreshOrders(),
        builds.refreshBuilds(),
        builds.refreshBuildGuides(),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [catalog, inventory, orders, builds]);

  useEffect(() => {
    if (hydratedTabsRef.current.has(activeTab)) return;

    hydratedTabsRef.current.add(activeTab);

    const loaders: Record<string, Array<() => Promise<unknown>>> = {
      overview: [orders.refreshOrders, inventory.refreshInventory],
      orders: [orders.refreshOrders, inventory.refreshInventory],
      products: [
        catalog.refreshProducts,
        catalog.refreshCategories,
        catalog.refreshSubCategories,
        catalog.refreshBrands,
      ],
      inventory: [inventory.refreshInventory, inventory.refreshReservations],
      categories: [
        catalog.refreshCategories,
        catalog.refreshSubCategories,
        catalog.refreshCategoryHierarchy,
        catalog.refreshSpecs,
      ],
      brands: [catalog.refreshBrands, catalog.refreshCategories],
      "saved-builds": [builds.refreshBuildGuides],
      "builder-config": [],
      compatibility: [],
      "tax-settings": [],
    };

    void Promise.allSettled(
      (loaders[activeTab] ?? []).map((loader) => loader()),
    );
  }, [activeTab, builds, catalog, inventory, orders]);

  const noop = useCallback(async () => {}, []);

  const updateCategories = useCallback(
    async (categories: CategoryNode[]) => {
      setError(null);
      try {
        await catalog.updateCategoryHierarchy(categories);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    },
    [catalog],
  );

  const addBrand = useCallback(
    async (data: { name: string }) => {
      setError(null);
      try {
        await apiFetch("/api/catalog/brands", {
          method: "POST",
          body: JSON.stringify({ name: data.name }),
        });
        await catalog.refreshBrands();
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    },
    [catalog],
  );

  const deleteBrand = useCallback(
    async (id: string) => {
      setError(null);
      try {
        await apiFetch(`/api/catalog/brands/${id}`, { method: "DELETE" });
        await catalog.refreshBrands();
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    },
    [catalog],
  );

  const addProduct = useCallback(
    async (data: any) => {
      setError(null);
      try {
        const brandName =
          data?.specs?.brand || data?.brand?.name || data?.brandName;
        const brand = catalog.brands.find((entry) => entry.name === brandName);
        const directSubCategory = catalog.subCategories.find(
          (entry) =>
            entry.id === data?.subCategoryId || entry.name === data?.category,
        );
        const categoryMatch = catalog.categories.find(
          (entry) => entry.name === data?.category,
        );
        const subCategoryId =
          directSubCategory?.id || categoryMatch?.subCategories?.[0]?.id;

        if (!subCategoryId) {
          throw new Error(
            `Unable to resolve a sub-category for "${data?.category ?? "this product"}".`,
          );
        }

        await apiFetch("/api/catalog/products", {
          method: "POST",
          body: JSON.stringify({
            name: data.name,
            slug: data.slug,
            subCategoryId,
            brandId: brand?.id,
            description: data.description,
            status: data.status || "ACTIVE",
            variants: [
              {
                sku: data.sku,
                price: data.price || 0,
                status: "IN_STOCK",
              },
            ],
            images: data.images,
          }),
        });

        await Promise.all([
          catalog.refreshProducts(),
          inventory.refreshInventory(),
        ]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    },
    [catalog, inventory],
  );

  const updateProduct = useCallback(
    async (idOrData: any, maybeData?: any) => {
      setError(null);
      try {
        const data =
          typeof idOrData === "string"
            ? { ...(maybeData || {}), id: idOrData }
            : idOrData;

        if (!data?.id) return;

        const existingProduct = catalog.products.find(
          (entry) => entry.id === data.id,
        );
        const firstVariant = existingProduct?.variants?.[0];
        const brandName =
          data?.specs?.brand ||
          data?.brand?.name ||
          existingProduct?.brand?.name;
        const brand = catalog.brands.find((entry) => entry.name === brandName);
        const directSubCategory = catalog.subCategories.find(
          (entry) =>
            entry.id === data?.subCategoryId || entry.name === data?.category,
        );
        const categoryMatch = catalog.categories.find(
          (entry) => entry.name === data?.category,
        );
        const subCategoryId =
          data?.subCategoryId ||
          directSubCategory?.id ||
          categoryMatch?.subCategories?.[0]?.id ||
          existingProduct?.subCategoryId;

        await apiFetch(`/api/catalog/products/${data.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: data.name,
            slug: data.slug,
            subCategoryId,
            brandId: brand?.id,
            description: data.description,
            status: data.status || existingProduct?.status,
            images: data.images,
          }),
        });

        if (firstVariant) {
          await apiFetch(`/api/catalog/variants/${firstVariant.id}`, {
            method: "PATCH",
            body: JSON.stringify({
              sku: data.sku || firstVariant.sku,
              price: data.price ?? firstVariant.price,
              status:
                data.status === "ARCHIVED"
                  ? "DISCONTINUED"
                  : firstVariant.status,
            }),
          });
        }

        await Promise.all([
          catalog.refreshProducts(),
          inventory.refreshInventory(),
        ]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [catalog, inventory],
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      setError(null);
      try {
        await catalog.deleteProduct(id);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    },
    [catalog],
  );

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      syncData,
      isLoading,
      error,
      catalog,
      inventory: inventory.inventory,
      inventoryContext: inventory,
      orders: orders.orders,
      ordersContext: orders,
      builds,

      products: catalog.products,
      categories: catalog.categories,
      categoryHierarchy: catalog.categoryHierarchy,
      subCategories: catalog.subCategories,
      brands: catalog.brands,
      specs: catalog.specs,
      schemas: [],
      addProduct: addProduct,
      updateProduct: updateProduct,
      deleteProduct: deleteProduct,
      refreshProducts: catalog.refreshProducts,
      refreshCategories: catalog.refreshCategories,
      refreshCategoryHierarchy: catalog.refreshCategoryHierarchy,
      refreshBrands: catalog.refreshBrands,
      refreshSpecs: catalog.refreshSpecs,
      updateSpec: catalog.updateSpec,
      deleteSpec: catalog.deleteSpec,
      addBrand,
      deleteBrand,
      updateCategories,

      stockMovements: [],
      auditLogs: inventory.auditLogs,
      reservations: inventory.reservations,
      adjustStock: inventory.adjustStock,
      refreshInventory: inventory.refreshInventory,
      refreshAuditLogs: inventory.refreshAuditLogs,
      fetchInventoryPage: inventory.fetchInventoryPage,

      updateOrderStatus: orders.updateOrderStatus,
      deleteOrder: orders.cancelOrder,
      refreshOrders: orders.refreshOrders,

      savedBuilds: builds.buildGuides,
      refreshSavedBuilds: builds.refreshBuildGuides,
      updateSavedBuild: builds.updateBuildGuide,
      deleteSavedBuild: builds.deleteBuildGuide,

      suppliers: [],
      purchaseOrders: [],
      warehouses: [],
      createPurchaseOrder: noop,
      receivePurchaseOrder: noop,
      createSupplier: noop,
      updateSupplier: noop,
    }),
    [
      activeTab,
      syncData,
      isLoading,
      error,
      catalog,
      builds,
      inventory,
      orders,
      noop,
      addBrand,
      deleteBrand,
      updateCategories,
      addProduct,
      updateProduct,
      deleteProduct,
    ],
  );

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
};

/**
 * AdminProvider — Enterprise-grade context composition.
 * Splitting the monolithic AdminContext into domain-driven providers.
 */
export const AdminProvider = ({ children }: { children: ReactNode }) => {
  return (
    <CatalogProvider autoLoad={false}>
      <InventoryProvider autoLoad={false}>
        <OrderProvider autoLoad={false}>
            <BuildProvider autoLoad={false}>
              <AdminInnerProvider>{children}</AdminInnerProvider>
            </BuildProvider>
        </OrderProvider>
      </InventoryProvider>
    </CatalogProvider>
  );
};

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
};
