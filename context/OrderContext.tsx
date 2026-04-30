'use client';

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

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import {
  Order,
  OrderLog,
  OrderStatus,
  CreateOrder,
} from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Status Transition Map (client-side mirror of service DAG)
// ─────────────────────────────────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.RETURNED],
  [OrderStatus.DELIVERED]: [OrderStatus.RETURNED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.RETURNED]: [],
};

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
  refreshOrders: (filters?: { status?: string; customerId?: string; page?: number; limit?: number }) => Promise<void>;
  getOrderDetail: (id: string) => Promise<void>;
  clearSelectedOrder: () => void;

  // ── Mutations ────────────────────────────────────────────────────────
  createOrder: (data: CreateOrder) => Promise<Order>;
  updateOrder: (id: string, data: Partial<Order> & { version: number }) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus, note?: string) => Promise<void>;
  cancelOrder: (id: string, note?: string) => Promise<void>;
  trackOrder: (orderId: string, contact: string) => Promise<Order>;

  loading: boolean;
}

const OrderContext = createContext<OrderContextType | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Fetch Utility
// ─────────────────────────────────────────────────────────────────────────────

async function fetchJSON<T = any>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { ...options?.headers, 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const raw = await res.text();
      if (raw) {
        try {
          const errData = JSON.parse(raw);
          msg = errData.error || errData.message || raw;
        } catch {
          msg = raw;
        }
      }
    } catch {
      // Keep default message if the body cannot be read.
    }
    throw new Error(msg);
  }
  return res.json();
}

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
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedTimeline, setSelectedTimeline] = useState<OrderLog[]>([]);

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
      {} as Record<OrderStatus, Order[]>
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
      return VALID_TRANSITIONS[order.status] || [];
    },
    [orderById]
  );

  // ── Data Fetching ────────────────────────────────────────────────────

  const refreshOrders = useCallback(
    async (filters?: { status?: string; customerId?: string; page?: number; limit?: number }) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters?.status) params.set('status', filters.status);
        if (filters?.customerId) params.set('customerId', filters.customerId);
        params.set('page', String(filters?.page ?? 1));
        params.set('limit', String(filters?.limit ?? 25));
        const qs = params.toString();
        const url = qs ? `/api/orders?${qs}` : '/api/orders';
        const data = await fetchJSON<Order[]>(url);
        const normalizedData = data.map((o) => ({
          ...o,
          logs: o.logs || [],
          shipments: o.shipments || [],
          payments: o.payments || [],
          invoices: o.invoices || [],
          reservations: o.reservations || [],
        }));
        setOrders(normalizedData);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getOrderDetail = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const o = await fetchJSON<Order>(`/api/orders/${id}`);
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
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSelectedOrder = useCallback(() => {
    setSelectedOrder(null);
    setSelectedTimeline([]);
  }, []);

  // ── Mutations ────────────────────────────────────────────────────────

  const createOrder = useCallback(
    async (data: CreateOrder): Promise<Order> => {
      setLoading(true);
      try {
        const order = await fetchJSON<Order>('/api/orders', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        await refreshOrders();
        return order;
      } finally {
        setLoading(false);
      }
    },
    [refreshOrders]
  );

  const updateOrder = useCallback(
    async (id: string, data: Partial<Order> & { version: number }) => {
      setLoading(true);
      try {
        await fetchJSON(`/api/orders/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
        await refreshOrders();
        if (selectedOrder?.id === id) await getOrderDetail(id);
      } finally {
        setLoading(false);
      }
    },
    [refreshOrders, getOrderDetail, selectedOrder?.id]
  );

  const updateOrderStatus = useCallback(
    async (id: string, status: OrderStatus, note?: string) => {
      setLoading(true);
      try {
        await fetchJSON(`/api/orders/${id}/status`, {
          method: 'POST',
          body: JSON.stringify({ status, note }),
        });
        await refreshOrders();
        // Refresh detail if viewing this order
        if (selectedOrder?.id === id) await getOrderDetail(id);
      } finally {
        setLoading(false);
      }
    },
    [refreshOrders, getOrderDetail, selectedOrder?.id]
  );

  const cancelOrder = useCallback(
    async (id: string, note?: string) => {
      setLoading(true);
      try {
        await fetchJSON(`/api/orders/${id}/cancel`, {
          method: 'POST',
          body: JSON.stringify({ note }),
        });
        await refreshOrders();
        if (selectedOrder?.id === id) await getOrderDetail(id);
      } finally {
        setLoading(false);
      }
    },
    [refreshOrders, getOrderDetail, selectedOrder?.id]
  );

  const trackOrder = useCallback(
    async (orderId: string, contact: string): Promise<Order> => {
      setLoading(true);
      try {
        const order = await fetchJSON<Order>('/api/storefront/track-order', {
          method: 'POST',
          body: JSON.stringify({ orderId, contact }),
        });
        return order;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ── Initial Load ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!autoLoad) return;
    refreshOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad]);

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
    ]
  );

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────

export const useOrder = () => {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrder must be used within OrderProvider');
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
