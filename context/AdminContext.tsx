"use client";

import React, {
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
import { BillingProvider, useBilling } from "./BillingContext";
import { BuildProvider, useBuild } from "./BuildContext";
import type { CategoryNode } from "@/types";

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
  const hydratedTabsRef = useRef<Set<string>>(new Set());

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
      billing: [
        billing.refreshInvoices,
        billing.refreshCustomers,
        billing.refreshBillingProfile,
      ],
      "builder-config": [],
    };

    void Promise.allSettled((loaders[activeTab] ?? []).map((loader) => loader()));
  }, [activeTab, billing, builds, catalog, inventory, orders]);

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
      const brandName =
        data?.specs?.brand ||
        data?.brand?.name ||
        data?.brandName;
      const brand = catalog.brands.find((entry) => entry.name === brandName);
      const directSubCategory = catalog.subCategories.find(
        (entry) => entry.id === data?.subCategoryId || entry.name === data?.category,
      );
      const categoryMatch = catalog.categories.find(
        (entry) => entry.name === data?.category,
      );
      const subCategoryId =
        directSubCategory?.id || categoryMatch?.subCategories?.[0]?.id;

      if (!subCategoryId) {
        throw new Error(`Unable to resolve a sub-category for "${data?.category ?? "this product"}".`);
      }

      await fetchJSON("/api/catalog/products", {
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

      await Promise.all([catalog.refreshProducts(), inventory.refreshInventory()]);
    },
    [catalog, inventory],
  );

  const legacyUpdateProduct = useCallback(
    async (idOrData: any, maybeData?: any) => {
      const data =
        typeof idOrData === "string"
          ? { ...(maybeData || {}), id: idOrData }
          : idOrData;

      if (!data?.id) return;

      const existingProduct = catalog.products.find((entry) => entry.id === data.id);
      const firstVariant = existingProduct?.variants?.[0];
      const brandName =
        data?.specs?.brand ||
        data?.brand?.name ||
        existingProduct?.brand?.name;
      const brand = catalog.brands.find((entry) => entry.name === brandName);
      const directSubCategory = catalog.subCategories.find(
        (entry) => entry.id === data?.subCategoryId || entry.name === data?.category,
      );
      const categoryMatch = catalog.categories.find(
        (entry) => entry.name === data?.category,
      );
      const subCategoryId =
        data?.subCategoryId ||
        directSubCategory?.id ||
        categoryMatch?.subCategories?.[0]?.id ||
        existingProduct?.subCategoryId;

      await fetchJSON(`/api/catalog/products/${data.id}`, {
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
        await fetchJSON(`/api/catalog/variants/${firstVariant.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            sku: data.sku || firstVariant.sku,
            price: data.price ?? firstVariant.price,
            status:
              data.status === "ARCHIVED" ? "DISCONTINUED" : firstVariant.status,
          }),
        });
      }

      await Promise.all([catalog.refreshProducts(), inventory.refreshInventory()]);
    },
    [catalog, inventory],
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
      updateSpec: catalog.updateSpec,
      deleteSpec: catalog.deleteSpec,
      addBrand,
      deleteBrand,
      updateCategories,

      stockMovements: [],
      auditLogs: inventory.auditLogs,
      reservations: inventory.reservations,
      adjustStock: legacyAdjustStock,
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
    <CatalogProvider autoLoad={false}>
      <InventoryProvider autoLoad={false}>
        <OrderProvider autoLoad={false}>
          <BillingProvider autoLoad={false}>
            <BuildProvider autoLoad={false}>
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
