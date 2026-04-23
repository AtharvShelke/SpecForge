"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { CatalogProvider, useCatalog } from "./CatalogContext";
import { InventoryProvider, useInventory } from "./InventoryContext";
import { OrderProvider, useOrder } from "./OrderContext";
import { BillingProvider, useBilling } from "./BillingContext";
import { BuildProvider, useBuild } from "./BuildContext";
import { FILTER_CONFIG } from "@/data/filterConfig";
import type { CategoryFilterConfig, CategoryNode, FilterDefinition } from "@/types";

interface AdminContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  syncData: () => Promise<void>;
  isLoading: boolean;

  // Domain Contexts (Facades for convenience)
  catalog: ReturnType<typeof useCatalog>;
  inventory: any;
  orders: any;
  billing: ReturnType<typeof useBilling>;
  builds: ReturnType<typeof useBuild>;

  [key: string]: any;
}

const AdminContext = createContext<AdminContextType | null>(null);

async function fetchJSON<T = any>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let message = "Request failed";
    try {
      const data = await response.json();
      message = data.error || data.message || message;
    } catch {
      try {
        message = await response.text();
      } catch {}
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

const AdminInnerProvider = ({ children }: { children: ReactNode }) => {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [filterConfigs, setFilterConfigs] =
    useState<CategoryFilterConfig[]>(FILTER_CONFIG);

  const catalog = useCatalog();
  const inventory = useInventory();
  const orders = useOrder();
  const billing = useBilling();
  const builds = useBuild();

  const isLoading =
    catalog.loading ||
    inventory.loading ||
    orders.loading ||
    billing.loading ||
    builds.loading;

  const syncData = useCallback(async () => {
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
      billing.refreshInvoices(),
      builds.refreshBuilds(),
      builds.refreshBuildGuides(),
    ]);
  }, [catalog, inventory, orders, billing, builds]);

  const inventoryFacade = useMemo(
    () => Object.assign([...inventory.inventory], inventory),
    [inventory],
  );
  const ordersFacade = useMemo(
    () => Object.assign([...orders.orders], orders),
    [orders],
  );
  const noop = useCallback(async () => {}, []);

  const updateCategories = useCallback(
    async (categories: CategoryNode[]) => {
      await catalog.updateCategoryHierarchy(categories);
    },
    [catalog],
  );

  const updateFilterConfig = useCallback(
    async (category: string, filters: FilterDefinition[]) => {
      setFilterConfigs((prev) => {
        const next = [...prev];
        const existingIndex = next.findIndex((item) => item.category === category);
        const updated = { category, filters };

        if (existingIndex >= 0) {
          next[existingIndex] = updated;
          return next;
        }

        next.push(updated);
        return next;
      });
    },
    [],
  );

  const addBrand = useCallback(
    async (data: { name: string }) => {
      await fetchJSON("/api/catalog/brands", {
        method: "POST",
        body: JSON.stringify({ name: data.name }),
      });
      await catalog.refreshBrands();
    },
    [catalog],
  );

  const deleteBrand = useCallback(
    async (id: string) => {
      await fetchJSON(`/api/catalog/brands/${id}`, { method: "DELETE" });
      await catalog.refreshBrands();
    },
    [catalog],
  );

  const legacyAddProduct = useCallback(
    async (data: any) => {
      await catalog.createProduct(data);
    },
    [catalog],
  );

  const legacyUpdateProduct = useCallback(
    async (idOrData: any, maybeData?: any) => {
      if (typeof idOrData === "string") {
        await catalog.updateProduct(idOrData, maybeData);
        return;
      }

      if (idOrData?.id) {
        await catalog.updateProduct(idOrData.id, idOrData);
      }
    },
    [catalog],
  );

  const legacyDeleteProduct = useCallback(
    async (id: string) => {
      await catalog.deleteProduct(id);
    },
    [catalog],
  );

  const legacyAdjustStock = useCallback(
    async (skuOrVariantId: string, quantity: number, type: string) => {
      const matchedItem = inventory.inventory.find(
        (item: any) =>
          item.variantId === skuOrVariantId || item.variant?.sku === skuOrVariantId,
      );
      const variantId = matchedItem?.variantId ?? skuOrVariantId;
      await inventory.adjustStock(variantId, quantity, type);
    },
    [inventory],
  );

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      syncData,
      isLoading,
      catalog,
      inventory: inventoryFacade,
      orders: ordersFacade,
      billing,
      builds,

      products: catalog.products,
      categories: catalog.categories,
      categoryHierarchy: catalog.categoryHierarchy,
      subCategories: catalog.subCategories,
      brands: catalog.brands,
      specs: catalog.specs,
      schemas: [],
      addProduct: legacyAddProduct,
      updateProduct: legacyUpdateProduct,
      deleteProduct: legacyDeleteProduct,
      refreshProducts: catalog.refreshProducts,
      refreshCategories: catalog.refreshCategories,
      refreshCategoryHierarchy: catalog.refreshCategoryHierarchy,
      refreshBrands: catalog.refreshBrands,
      refreshSpecs: catalog.refreshSpecs,
      addBrand,
      deleteBrand,
      updateCategories,
      filterConfigs,
      updateFilterConfig,

      stockMovements: [],
      auditLogs: inventory.auditLogs,
      reservations: inventory.reservations,
      adjustStock: legacyAdjustStock,
      transferStock: noop,
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
      catalog,
      inventoryFacade,
      ordersFacade,
      billing,
      builds,
      inventory,
      orders,
      noop,
      addBrand,
      deleteBrand,
      updateCategories,
      filterConfigs,
      updateFilterConfig,
      legacyAddProduct,
      legacyUpdateProduct,
      legacyDeleteProduct,
      legacyAdjustStock,
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
    <CatalogProvider>
      <InventoryProvider>
        <OrderProvider>
          <BillingProvider>
            <BuildProvider>
              <AdminInnerProvider>{children}</AdminInnerProvider>
            </BuildProvider>
          </BillingProvider>
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
