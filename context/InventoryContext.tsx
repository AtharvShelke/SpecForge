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
import { apiFetch } from "@/lib/helpers";
import { useLoadingCounter } from "@/hooks/useLoadingCounter";

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
  error: Error | null;
}

const InventoryContext = createContext<InventoryContextType | null>(null);

export const InventoryProvider = ({
  children,
  autoLoad = true,
}: {
  children: ReactNode;
  autoLoad?: boolean;
}) => {
  // start/stop are guaranteed stable by useLoadingCounter's internal useCallback([],
  // so including them in dependency arrays is safe and prevents exhaustive-deps warnings.
  const { loading, start, stop } = useLoadingCounter();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [error, setError] = useState<Error | null>(null);

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
    setError(null);
    start();
    try {
      const data = await apiFetch<any>("/api/inventory?limit=200&page=1");
      setInventory(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      stop();
    }
  }, [start, stop]);

  const refreshReservations = useCallback(async () => {
    setError(null);
    start();
    try {
      const data = await apiFetch<Reservation[]>("/api/inventory/reservations");
      setReservations(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      stop();
    }
  }, [start, stop]);

  const refreshAuditLogs = useCallback(async () => {
    setError(null);
    start();
    try {
      const data = await apiFetch<any[]>("/api/audit-logs");
      const logs = Array.isArray(data) ? data : [];
      setAuditLogs(logs);
      return logs;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return [];
    } finally {
      stop();
    }
  }, [start, stop]);

  const fetchInventoryPage = useCallback(
    async (query?: URLSearchParams | string) => {
      setError(null);
      start();
      try {
        const qs = query?.toString();
        const data = await apiFetch<any>(
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
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        stop();
      }
    },
    [start, stop],
  );

  const adjustStock = useCallback(
    async (variantId: string, quantity: number, type: string) => {
      setError(null);
      start();
      try {
        await apiFetch("/api/inventory/items", {
          method: "POST",
          body: JSON.stringify({ variantId, quantity, type, action: "ADJUST" }),
        });
        await refreshInventory();
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        stop();
      }
    },
    [refreshInventory, start, stop],
  );

  const createReservation = useCallback(
    async (orderId: string, variantId: string, quantity: number) => {
      setError(null);
      start();
      try {
        await apiFetch("/api/inventory/reservations", {
          method: "POST",
          body: JSON.stringify({ orderId, variantId, quantity }),
        });
        await refreshReservations();
        await refreshInventory();
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        stop();
      }
    },
    [refreshReservations, refreshInventory, start, stop],
  );

  const releaseReservation = useCallback(
    async (id: string) => {
      setError(null);
      start();
      try {
        await apiFetch(`/api/inventory/reservations/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "RELEASED" }),
        });
        await refreshReservations();
        await refreshInventory();
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        stop();
      }
    },
    [refreshReservations, refreshInventory, start, stop],
  );

  const loadAll = useCallback(async () => {
    setError(null);
    start();
    try {
      await Promise.allSettled([refreshInventory(), refreshReservations()]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      stop();
    }
  }, [refreshInventory, refreshReservations, start, stop]);

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
        error,
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
