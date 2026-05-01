"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useMemo,
} from "react";
import { InventoryItem, InventorySkuSummary, Reservation } from "../types";

export interface InventorySummary {
  available: number;
  reserved: number;
  sold: number;
  totalOnHand: number;
  items: InventoryItem[];
  trackingType?: string;
}

interface InventoryContextType {
  inventory: InventoryItem[];
  reservations: Reservation[];
  auditLogs: any[];

  // O(1) lookup map (sku -> summary)
  inventoryBySku: Map<string, InventorySummary>;

  refreshInventory: () => Promise<void>;
  refreshReservations: () => Promise<void>;
  refreshAuditLogs: () => Promise<any[]>;
  fetchInventoryPage: (query?: URLSearchParams | string) => Promise<{
    items: InventorySkuSummary[];
    total: number;
    page: number;
    limit: number;
  }>;

  adjustStock: (
    variantId: string,
    quantity: number,
    type: string,
  ) => Promise<void>;
  createReservation: (
    orderId: string,
    variantId: string,
    quantity: number,
  ) => Promise<void>;
  releaseReservation: (id: string) => Promise<void>;

  loading: boolean;
}

const InventoryContext = createContext<InventoryContextType | null>(null);

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

export const InventoryProvider = ({
  children,
  autoLoad = true,
}: {
  children: ReactNode;
  autoLoad?: boolean;
}) => {
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const inventoryBySku = useMemo(() => {
    const map = new Map<string, InventorySummary>();

    inventory.forEach((item) => {
      const sku = item.variant?.sku || item.variantId;
      if (!map.has(sku)) {
        map.set(sku, {
          available: 0,
          reserved: 0,
          sold: 0,
          totalOnHand: 0,
          items: [],
          trackingType: item.trackingType,
        });
      }

      const summary = map.get(sku)!;
      summary.items.push(item);
      summary.totalOnHand += item.quantityOnHand || 0;
      summary.reserved += item.quantityReserved || 0;

      switch (item.status) {
        case "SOLD":
          summary.sold += item.trackingType === "SERIALIZED" ? 1 : 0;
          break;
        case "IN_STOCK":
        case "RESERVED":
        case "DAMAGED":
        case "RMA":
        case "IN_TRANSIT":
        case "RETURNED":
          break;
      }
    });

    // Calculate available for each summary
    for (const summary of map.values()) {
      summary.available = Math.max(0, summary.totalOnHand - summary.reserved);
    }

    return map;
  }, [inventory]);

  const refreshInventory = useCallback(async () => {
    const data = await fetchJSON("/api/inventory?limit=200&page=1");
    setInventory(Array.isArray(data?.items) ? data.items : []);
  }, []);

  const refreshReservations = useCallback(async () => {
    const data = await fetchJSON("/api/inventory/reservations");
    setReservations(data);
  }, []);

  const refreshAuditLogs = useCallback(async () => {
    const data = await fetchJSON("/api/audit-logs");
    const logs = Array.isArray(data) ? data : [];
    setAuditLogs(logs);
    return logs;
  }, []);

  const fetchInventoryPage = useCallback(
    async (query?: URLSearchParams | string) => {
      const qs = query?.toString();
      const data = await fetchJSON(
        qs ? `/api/inventory?${qs}` : "/api/inventory",
      );
      return {
        items: Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
            ? data
            : [],
        total: Number(data?.total ?? 0),
        page: Number(data?.page ?? 1),
        limit: Number(data?.limit ?? 10),
      };
    },
    [],
  );

  const adjustStock = async (
    variantId: string,
    quantity: number,
    type: string,
  ) => {
    await fetchJSON("/api/inventory/items", {
      method: "POST",
      body: JSON.stringify({ variantId, quantity, type, action: "ADJUST" }),
    });
    await refreshInventory();
  };

  const createReservation = async (
    orderId: string,
    variantId: string,
    quantity: number,
  ) => {
    await fetchJSON("/api/inventory/reservations", {
      method: "POST",
      body: JSON.stringify({ orderId, variantId, quantity }),
    });
    await refreshReservations();
    await refreshInventory();
  };

  const releaseReservation = async (id: string) => {
    await fetchJSON(`/api/inventory/reservations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "RELEASED" }),
    });
    await refreshReservations();
    await refreshInventory();
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([refreshInventory(), refreshReservations()]);
    } finally {
      setLoading(false);
    }
  }, [refreshInventory, refreshReservations]);

  useEffect(() => {
    if (!autoLoad) return;
    loadAll();
  }, [autoLoad, loadAll]);

  return (
    <InventoryContext.Provider
      value={{
        inventory,
        reservations,
        auditLogs,
        inventoryBySku,
        refreshInventory,
        refreshReservations,
        refreshAuditLogs,
        fetchInventoryPage,
        adjustStock,
        createReservation,
        releaseReservation,
        loading,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const ctx = useContext(InventoryContext);
  if (!ctx)
    throw new Error("useInventory must be used within InventoryProvider");
  return ctx;
};

export const useInventoryStats = (skuOrVariantId: string) => {
  const { inventoryBySku } = useInventory();
  return useMemo(() => {
    return (
      inventoryBySku.get(skuOrVariantId) || {
        available: 0,
        reserved: 0,
        sold: 0,
        totalOnHand: 0,
        items: [],
        trackingType: "BULK",
      }
    );
  }, [inventoryBySku, skuOrVariantId]);
};
