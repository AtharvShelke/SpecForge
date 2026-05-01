"use client";

/**
 * OrderContext — Enterprise-grade order state management.
 *
 * Features:
 *   • Full order lifecycle: PENDING → PAID → PROCESSING → SHIPPED → DELIVERED
 *   • CANCEL / RETURN support with inventory side effects
 *   • Order detail view with timeline (OrderLog), shipments, payments, invoices
 *   • O(1) order lookups by ID
 *   • Status-filtered order lists (memoised)
 *   • Create order with auto reservation
 *   • Strict enum-only status transitions
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { Order, OrderLog, OrderStatus, CreateOrder } from "../types";
import { apiFetch, useLoadingCounter, refreshAndSyncDetail } from "@/lib/helpers";
import { ORDER_VALID_TRANSITIONS } from "@/lib/orderTransitions";


// ─────────────────────────────────────────────────────────────────────────────
// Context Shape
// ─────────────────────────────────────────────────────────────────────────────

interface OrderContextType {
  /** Full order list (newest first) */
  orders: Order[];

  /** O(1) lookup by order ID */
  orderById: Map<string, Order>;

  /** Orders grouped by status (memoised) */
  ordersByStatus: Record<OrderStatus, Order[]>;

  /** Currently selected order (detail view) */
  selectedOrder: Order | null;

  /** Timeline events for the selected order */
  selectedTimeline: OrderLog[];

  /** Get valid next statuses for a given order */
  getNextStatuses: (orderId: string) => OrderStatus[];

  // ── Data Fetching ────────────────────────────────────────────────────
  refreshOrders: (filters?: {
    status?: string;
    customerId?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  getOrderDetail: (id: string) => Promise<void>;
  clearSelectedOrder: () => void;

  // ── Mutations ────────────────────────────────────────────────────────
  createOrder: (data: CreateOrder) => Promise<Order>;
  updateOrder: (
    id: string,
    data: Partial<Order> & { version: number },
  ) => Promise<void>;
  updateOrderStatus: (
    id: string,
    status: OrderStatus,
    note?: string,
  ) => Promise<void>;
  cancelOrder: (id: string, note?: string) => Promise<void>;
  trackOrder: (orderId: string, contact: string) => Promise<Order>;

  loading: boolean;
  error: Error | null;
}

const OrderContext = createContext<OrderContextType | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export const OrderProvider = ({
  children,
  autoLoad = true,
}: {
  children: ReactNode;
  autoLoad?: boolean;
}) => {
  // start/stop are guaranteed stable by useLoadingCounter's internal useCallback([],
  // so including them in dependency arrays is safe and prevents exhaustive-deps warnings.
  const { loading, start, stop } = useLoadingCounter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedTimeline, setSelectedTimeline] = useState<OrderLog[]>([]);
  const [error, setError] = useState<Error | null>(null);

  // ── O(1) Lookup Map ──────────────────────────────────────────────────

  const orderById = useMemo(() => {
    const map = new Map<string, Order>();
    orders.forEach((o) => map.set(o.id, o));
    return map;
  }, [orders]);

  // ── Status Groups ────────────────────────────────────────────────────

  const ordersByStatus = useMemo(() => {
    const groups = Object.values(OrderStatus).reduce(
      (acc, status) => ({ ...acc, [status]: [] }),
      {} as Record<OrderStatus, Order[]>,
    );
    orders.forEach((o) => {
      if (groups[o.status]) {
        groups[o.status].push(o);
      }
    });
    return groups;
  }, [orders]);

  // ── Status Transition Helper ─────────────────────────────────────────

  const getNextStatuses = useCallback(
    (orderId: string): OrderStatus[] => {
      const order = orderById.get(orderId);
      if (!order) return [];
      return ORDER_VALID_TRANSITIONS[order.status] || [];
    },
    [orderById],
  );

  // ── Data Fetching ────────────────────────────────────────────────────

  const refreshOrders = useCallback(
    async (filters?: {
      status?: string;
      customerId?: string;
      page?: number;
      limit?: number;
    }) => {
      setError(null);
      start();
      try {
        const params = new URLSearchParams();
        if (filters?.status) params.set("status", filters.status);
        if (filters?.customerId) params.set("customerId", filters.customerId);
        params.set("page", String(filters?.page ?? 1));
        params.set("limit", String(filters?.limit ?? 25));
        const qs = params.toString();
        const url = qs ? `/api/orders?${qs}` : "/api/orders";
        const data = await apiFetch<Order[]>(url);
        const normalizedData = data.map((o) => ({
          ...o,
          logs: o.logs || [],
          shipments: o.shipments || [],
          payments: o.payments || [],
          invoices: o.invoices || [],
          reservations: o.reservations || [],
        }));
        setOrders(normalizedData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        stop();
      }
    },
    [],
  );

  const getOrderDetail = useCallback(async (id: string) => {
    setError(null);
    start();
    try {
      const o = await apiFetch<Order>(`/api/orders/${id}`);
      const normalizedOrder = {
        ...o,
        logs: o.logs || [],
        shipments: o.shipments || [],
        payments: o.payments || [],
        invoices: o.invoices || [],
        reservations: o.reservations || [],
      };
      setSelectedOrder(normalizedOrder);
      setSelectedTimeline(normalizedOrder.logs);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      stop();
    }
  }, [start, stop]);

  const clearSelectedOrder = useCallback(() => {
    setSelectedOrder(null);
    setSelectedTimeline([]);
  }, []);

  // ── Mutations ────────────────────────────────────────────────────────

  const createOrder = useCallback(
    async (data: CreateOrder): Promise<Order> => {
      setError(null);
      start();
      try {
        const order = await apiFetch<Order>("/api/orders", {
          method: "POST",
          body: JSON.stringify(data),
        });
        await refreshOrders();
        return order;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        stop();
      }
    },
    [refreshOrders, start, stop],
  );

  const updateOrder = useCallback(
    async (id: string, data: Partial<Order> & { version: number }) => {
      setError(null);
      start();
      try {
        await apiFetch(`/api/orders/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
        await refreshAndSyncDetail(id, refreshOrders, selectedOrder?.id, getOrderDetail);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        stop();
      }
    },
    [refreshOrders, getOrderDetail, selectedOrder?.id],
  );

  const updateOrderStatus = useCallback(
    async (id: string, status: OrderStatus, note?: string) => {
      setError(null);
      start();
      try {
        await apiFetch(`/api/orders/${id}/status`, {
          method: "POST",
          body: JSON.stringify({ status, note }),
        });
        await refreshAndSyncDetail(id, refreshOrders, selectedOrder?.id, getOrderDetail);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        stop();
      }
    },
    [refreshOrders, getOrderDetail, selectedOrder?.id],
  );

  const cancelOrder = useCallback(
    async (id: string, note?: string) => {
      setError(null);
      start();
      try {
        await apiFetch(`/api/orders/${id}/cancel`, {
          method: "POST",
          body: JSON.stringify({ note }),
        });
        await refreshAndSyncDetail(id, refreshOrders, selectedOrder?.id, getOrderDetail);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        stop();
      }
    },
    [refreshOrders, getOrderDetail, selectedOrder?.id],
  );

  const trackOrder = useCallback(
    async (orderId: string, contact: string): Promise<Order> => {
      setError(null);
      start();
      try {
        const order = await apiFetch<Order>("/api/storefront/track-order", {
          method: "POST",
          body: JSON.stringify({ orderId, contact }),
        });
        return order;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        stop();
      }
    },
    [],
  );

  // ── Initial Load ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!autoLoad) return;
    void Promise.allSettled([refreshOrders()]);
  }, [autoLoad, refreshOrders]);

  // ── Provider Value ───────────────────────────────────────────────────

  const value = useMemo<OrderContextType>(
    () => ({
      orders,
      orderById,
      ordersByStatus,
      selectedOrder,
      selectedTimeline,
      getNextStatuses,
      refreshOrders,
      getOrderDetail,
      clearSelectedOrder,
      createOrder,
      updateOrder,
      updateOrderStatus,
      cancelOrder,
      trackOrder,
      loading,
      error,
    }),
    [
      orders,
      orderById,
      ordersByStatus,
      selectedOrder,
      selectedTimeline,
      getNextStatuses,
      refreshOrders,
      getOrderDetail,
      clearSelectedOrder,
      createOrder,
      updateOrder,
      updateOrderStatus,
      cancelOrder,
      trackOrder,
      loading,
      error,
    ],
  );

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────

export const useOrder = () => {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrder must be used within OrderProvider");
  return ctx;
};

/** Convenience hook: get a single order by ID (O(1) lookup) */
export const useOrderById = (id: string) => {
  const { orderById } = useOrder();
  return useMemo(() => orderById.get(id) ?? null, [orderById, id]);
};

/** Convenience hook: get valid next statuses for an order */
export const useOrderTransitions = (id: string) => {
  const { getNextStatuses } = useOrder();
  return useMemo(() => getNextStatuses(id), [getNextStatuses, id]);
};
