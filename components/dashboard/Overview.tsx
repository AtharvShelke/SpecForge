"use client";

<<<<<<< HEAD
import { memo, useCallback, useMemo } from "react";
import { useAdmin } from "@/context/AdminContext";
import { InventorySkuSummary, Order, OrderStatus } from "@/types";
=======
import React, { useEffect, useState, memo, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Order, Product, InventoryItem } from '@/types';
import { OrderStatus } from '@/types';
import { useRouter } from 'next/navigation';
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  Package,
  RefreshCw,
  ShoppingCart,
  Tag,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

type ChartTooltipPayload = {
  name?: string;
  value?: number | string;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: ChartTooltipPayload[];
  label?: string;
};

type OverviewOrderRow = Pick<Order, "id" | "status" | "date" | "total"> & {
  customerName: string;
  email: string;
};

<<<<<<< HEAD
type OrderItemSnapshot = {
  category?: string;
  price: number;
  quantity: number;
};
=======
function getProductStock(product: any): number {
  if (typeof product?.stock === 'number') return product.stock;
  if (Array.isArray(product?.inventoryItems)) {
    return product.inventoryItems.reduce((a: number, inv: any) => a + Math.max(0, (inv.quantity || 0) - (inv.reserved || 0)), 0);
  }
  return 0;
}

// ─────────────────────────────────────────────────────────────
// STATUS PILL — memoized + precomputed class map
// ─────────────────────────────────────────────────────────────
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50

const STATUS_PILL_MAP: Record<string, string> = {
  [OrderStatus.PENDING]: "bg-amber-50 text-amber-700 border-amber-200",
  [OrderStatus.PAID]: "bg-emerald-50 text-emerald-700 border-emerald-200",
  [OrderStatus.PROCESSING]: "bg-blue-50 text-blue-700 border-blue-200",
  [OrderStatus.SHIPPED]: "bg-violet-50 text-violet-700 border-violet-200",
  [OrderStatus.DELIVERED]: "bg-teal-50 text-teal-700 border-teal-200",
  [OrderStatus.CANCELLED]: "bg-rose-50 text-rose-700 border-rose-200",
  [OrderStatus.RETURNED]: "bg-slate-100 text-slate-700 border-slate-200",
};

const SectionLabel = memo(
  ({
    icon,
    children,
  }: {
    icon: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div className="flex items-center gap-2">
      <span className="text-slate-500">{icon}</span>
      <h3 className="text-sm font-semibold text-slate-900">{children}</h3>
    </div>
  ),
);
SectionLabel.displayName = "SectionLabel";

const Surface = memo(
  ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div
      className={cn(
        "rounded-lg border border-slate-200 bg-white shadow-sm",
        "min-w-0 overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  ),
);
Surface.displayName = "Surface";

const SurfaceHeader = memo(
  ({
    icon,
    title,
    subtitle,
    onClick,
    right,
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onClick?: () => void;
    right?: React.ReactNode;
  }) => (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4",
        onClick && "cursor-pointer transition-colors hover:bg-slate-50",
      )}
    >
      <div>
        <SectionLabel icon={icon}>{title}</SectionLabel>
        <p className="mt-0.5 pl-6 text-xs text-slate-500 hidden sm:block">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">{right}</div>
    </div>
  ),
);
SurfaceHeader.displayName = "SurfaceHeader";

const StatusPill = memo(({ status }: { status: string }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
      STATUS_PILL_MAP[status] ?? "bg-slate-100 text-slate-700 border-slate-200",
    )}
  >
    {status}
  </span>
));
StatusPill.displayName = "StatusPill";

const ChartTooltip = memo(({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-md">
      <p className="mb-1 text-xs font-medium text-slate-500">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm font-semibold text-slate-900">
          {entry.name === "orders"
            ? entry.value
            : `Rs. ${Number(entry.value).toLocaleString("en-IN")}`}
        </p>
      ))}
    </div>
  );
});
ChartTooltip.displayName = "ChartTooltip";

const MobileOrderRow = memo(
  ({ order, onClick }: { order: OverviewOrderRow; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 text-left transition-colors hover:bg-slate-50 last:border-0"
    >
      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <p className="font-mono text-xs font-medium text-slate-500">
            {order.id}
          </p>
          <StatusPill status={order.status} />
        </div>
        <p className="truncate text-sm font-medium text-slate-900">
          {order.customerName}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {new Date(order.date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}
        </p>
      </div>
      <p className="shrink-0 text-sm font-semibold text-slate-900">
        Rs. {order.total.toLocaleString("en-IN")}
      </p>
    </button>
  ),
);
MobileOrderRow.displayName = "MobileOrderRow";

const DesktopOrderRow = memo(({ order }: { order: OverviewOrderRow }) => (
  <tr className="border-b border-slate-100 transition-colors hover:bg-slate-50 last:border-0">
    <td className="px-5 py-3">
      <p className="font-mono text-xs font-medium text-slate-500">
        {order.id}
      </p>
      <p className="mt-0.5 text-xs text-slate-500">
        {new Date(order.date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        })}
      </p>
    </td>
    <td className="px-5 py-3">
      <p className="max-w-[180px] truncate text-sm font-medium text-slate-900">
        {order.customerName}
      </p>
      <p className="max-w-[180px] truncate text-xs text-slate-500">
        {order.email}
      </p>
    </td>
    <td className="px-5 py-3">
      <StatusPill status={order.status} />
    </td>
    <td className="px-5 py-3 text-right text-sm font-medium text-slate-900">
      Rs. {order.total.toLocaleString("en-IN")}
    </td>
  </tr>
));
DesktopOrderRow.displayName = "DesktopOrderRow";

const Overview = () => {
<<<<<<< HEAD
  const { orders, inventory, syncData, isLoading, setActiveTab } =
    useAdmin() as unknown as {
      orders: Order[];
      inventory: InventorySkuSummary[];
      syncData: () => Promise<void>;
      isLoading: boolean;
      setActiveTab: (tab: string) => void;
    };
=======
  const { toast } = useToast();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  }, []);

  // Fetch inventory
  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory?limit=3000');
      const data = await res.json();
      setInventory(data.items ?? (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    }
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products?fields=minimal&limit=5000');
      const data = await res.json();
      setProducts(data.products ?? data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  }, []);

  // Sync data
  const syncData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchOrders(), fetchInventory(), fetchProducts()]);
    setIsLoading(false);
    toast({ title: 'Data synced' });
  }, [fetchOrders, fetchInventory, fetchProducts, toast]);

  // Set active tab (navigate to a tab)
  const setActiveTab = useCallback((tab: string) => {
    router.push(`/admin?tab=${tab}`);
  }, [router]);

  // Initial data fetch
  useEffect(() => {
    syncData();
  }, [syncData]);
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50

  const {
    totalRevenue,
    pendingOrders,
    paidOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    returnedOrders,
    processingOrders,
    successRevenue,
    pendingRevenue,
    highestOrderTotal,
    categoryRevenue,
  } = useMemo(() => {
    const pending: typeof orders = [];
    const paid: typeof orders = [];
    const shipped: typeof orders = [];
    const delivered: typeof orders = [];
    const cancelled: typeof orders = [];
    const returned: typeof orders = [];
    const processing: typeof orders = [];
    let totalRev = 0;
    let successRev = 0;
    let pendingRev = 0;
    let highest = 0;
    const catMap: Record<string, number> = {};

    for (const order of orders) {
      totalRev += order.total;
      if (order.total > highest) highest = order.total;
      if (String(order.paymentStatus) === "Success") successRev += order.total;
      else pendingRev += order.total;

      switch (order.status) {
        case OrderStatus.PENDING:
          pending.push(order);
          break;
        case OrderStatus.PAID:
          paid.push(order);
          break;
        case OrderStatus.SHIPPED:
          shipped.push(order);
          break;
        case OrderStatus.DELIVERED:
          delivered.push(order);
          break;
        case OrderStatus.CANCELLED:
          cancelled.push(order);
          break;
        case OrderStatus.RETURNED:
          returned.push(order);
          break;
        case OrderStatus.PROCESSING:
          processing.push(order);
          break;
      }

      (order.items as OrderItemSnapshot[] | undefined)?.forEach((item) => {
        const category = item.category || "Other";
        catMap[category] = (catMap[category] || 0) + item.price * item.quantity;
      });
    }

    return {
      totalRevenue: totalRev,
      pendingOrders: pending,
      paidOrders: paid,
      shippedOrders: shipped,
      deliveredOrders: delivered,
      cancelledOrders: cancelled,
      returnedOrders: returned,
      processingOrders: processing,
      successRevenue: successRev,
      pendingRevenue: pendingRev,
      highestOrderTotal: highest,
      categoryRevenue: Object.entries(catMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
    };
  }, [orders]);

<<<<<<< HEAD
  const inventoryArray = useMemo(
    () => (Array.isArray(inventory) ? inventory : []),
    [inventory],
  );

  const criticalInventoryItems = useMemo(
    () =>
      [...inventoryArray]
        .filter((item) => item.quantity <= item.reorderLevel)
        .sort((left, right) => left.quantity - right.quantity)
        .slice(0, 3),
    [inventoryArray],
=======
  const lowStockProducts = useMemo(() =>
    products.filter(p => getProductStock(p) <= 5),
    [products]
  );

  const outOfStockProducts = useMemo(() =>
    products.filter(p => getProductStock(p) <= 0),
    [products]
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
  );

  const fulfilmentRate =
    orders.length > 0
      ? Math.round((deliveredOrders.length / orders.length) * 100)
      : 0;
  const avgOrderValue =
    orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

  const salesData = useMemo(() => {
    if (orders.length === 0) return [];

    const dailyMap: Record<string, { revenue: number; orders: number }> = {};
    for (const order of orders) {
      const dateKey = new Date(order.date).toISOString().split("T")[0];
      if (!dailyMap[dateKey]) dailyMap[dateKey] = { revenue: 0, orders: 0 };
      dailyMap[dateKey].revenue += order.total;
      dailyMap[dateKey].orders += 1;
    }

    return Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([dateString, data]) => ({
        name: new Date(dateString).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        }),
        revenue: Math.round(data.revenue),
        orders: data.orders,
      }));
  }, [orders]);

  const { revTrendPct, isRevUp } = useMemo(() => {
    const averageRevenue =
      salesData.length > 0
        ? salesData.reduce((sum, day) => sum + day.revenue, 0) /
        salesData.length
        : 0;
    const todayRevenue =
      salesData.length > 0 ? salesData[salesData.length - 1].revenue : 0;
    const trend =
      averageRevenue > 0
        ? Math.abs(
          ((todayRevenue - averageRevenue) / averageRevenue) * 100,
        ).toFixed(1)
        : "0.0";
    return { revTrendPct: trend, isRevUp: todayRevenue >= averageRevenue };
  }, [salesData]);

  const statusBreakdown = useMemo(
    () => [
      {
        label: "Delivered",
        count: deliveredOrders.length,
        barClass: "bg-teal-500",
        valueClass: "text-slate-900",
      },
      {
        label: "Shipped",
        count: shippedOrders.length,
        barClass: "bg-violet-500",
        valueClass: "text-slate-900",
      },
      {
        label: "Processing",
        count: processingOrders.length,
        barClass: "bg-blue-500",
        valueClass: "text-slate-900",
      },
      {
        label: "Pending",
        count: pendingOrders.length,
        barClass: "bg-amber-500",
        valueClass: "text-slate-900",
      },
    ],
    [
      deliveredOrders.length,
      shippedOrders.length,
      processingOrders.length,
      pendingOrders.length,
    ],
  );

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 6),
    [orders],
  );

  const {
    totalInventoryUnits,
    lowStockCount,
    outOfStockCount,
    inventoryHealthPct,
  } = useMemo(() => {
    let units = 0;
    let low = 0;
    let out = 0;
    let healthy = 0;

    for (const item of inventoryArray) {
      units += item.quantity;
      if (item.quantity === 0) out += 1;
      else if (item.quantity <= item.reorderLevel) low += 1;
      if (item.quantity > item.reorderLevel) healthy += 1;
    }

    return {
      totalInventoryUnits: units,
      lowStockCount: low,
      outOfStockCount: out,
      inventoryHealthPct:
        inventoryArray.length > 0
          ? Math.round((healthy / inventoryArray.length) * 100)
          : 100,
    };
  }, [inventoryArray]);

  const handleSyncData = useCallback(() => syncData(), [syncData]);
  const handleSetOrdersTab = useCallback(
    () => setActiveTab("orders"),
    [setActiveTab],
  );
  const handleSetInventoryTab = useCallback(
    () => setActiveTab("inventory"),
    [setActiveTab],
  );
  const handleSetProductsTab = useCallback(
    () => setActiveTab("products"),
    [setActiveTab],
  );

  const totalRevenueFormatted = `Rs. ${totalRevenue.toLocaleString("en-IN")}`;
  const avgOrderValueFormatted = `Rs. ${avgOrderValue.toLocaleString("en-IN")}`;
  const highestOrderFormatted = `Rs. ${highestOrderTotal.toLocaleString("en-IN")}`;
  const successRevenueFormatted = `Rs. ${successRevenue.toLocaleString("en-IN")}`;
  const pendingRevenueFormatted = `Rs. ${pendingRevenue.toLocaleString("en-IN")}`;

  const kpiCards = useMemo(
    () => [
      {
        label: "Total Revenue",
        value: totalRevenueFormatted,
        sub: isRevUp
          ? `Up ${revTrendPct}% vs average`
          : `Down ${revTrendPct}% vs average`,
        icon: <DollarSign size={18} />,
        tab: "orders",
        breakdown: [
          { label: "Captured", val: successRevenueFormatted },
          { label: "Pending", val: pendingRevenueFormatted },
        ],
      },
      {
        label: "Average Order Value",
        value: avgOrderValueFormatted,
        sub: `${orders.length} total orders tracked`,
        icon: <TrendingUp size={18} />,
        tab: "orders",
        breakdown: [
          { label: "Highest Order", val: highestOrderFormatted },
          { label: "Delivered Count", val: `${deliveredOrders.length}` },
        ],
      },
      {
        label: "Fulfilment Rate",
        value: `${fulfilmentRate}%`,
        sub: `${processingOrders.length + shippedOrders.length} orders in progress`,
        icon: <ClipboardList size={18} />,
        tab: "orders",
        breakdown: [
          {
            label: "Pending Action",
            val: `${pendingOrders.length + paidOrders.length}`,
          },
          { label: "Total Returns", val: `${returnedOrders.length}` },
        ],
      },
      {
        label: "Inventory Health",
        value: `${inventoryHealthPct}%`,
        sub: `${lowStockCount} low stock, ${outOfStockCount} out of stock`,
        icon: <Package size={18} />,
        tab: "inventory",
        breakdown: [
          { label: "Total Units", val: totalInventoryUnits.toLocaleString("en-IN") },
          { label: "Active Lines", val: `${inventoryArray.length}` },
        ],
      },
    ],
    [
      avgOrderValueFormatted,
      deliveredOrders.length,
      fulfilmentRate,
      highestOrderFormatted,
      inventoryArray.length,
      inventoryHealthPct,
      isRevUp,
      lowStockCount,
      orders.length,
      outOfStockCount,
      paidOrders.length,
      pendingOrders.length,
      pendingRevenueFormatted,
      processingOrders.length,
      returnedOrders.length,
      revTrendPct,
      shippedOrders.length,
      successRevenueFormatted,
      totalInventoryUnits,
      totalRevenueFormatted,
    ],
  );

  return (
    <div className="space-y-6">
      {/* Page Header (Flattened and professionalized) */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Admin Overview</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>
              {new Date().toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            <span className="hidden sm:inline">&bull;</span>
            <span>{orders.length.toLocaleString("en-IN")} orders</span>
            <span className="hidden sm:inline">&bull;</span>
            <span>{inventoryArray.length.toLocaleString("en-IN")} inventory lines</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live System
          </div>
          <button
            type="button"
            onClick={handleSyncData}
            disabled={isLoading}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={cn(isLoading && "animate-spin")}
            />
            Sync Data
          </button>
        </div>
      </section>

      {/* KPI Grid */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={() => setActiveTab(card.tab)}
            className="group flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-slate-300"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {card.label}
                </p>
                <p className="mt-1.5 text-2xl font-semibold text-slate-900">
                  {card.value}
                </p>
                <p className="mt-1 text-xs text-slate-500">{card.sub}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-2 text-slate-500 transition-colors group-hover:bg-slate-100 group-hover:text-slate-900">
                {card.icon}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              {card.breakdown.map((item) => (
                <div key={item.label}>
                  <p className="text-xs font-medium text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-slate-900">
                    {item.val}
                  </p>
                </div>
              ))}
            </div>
          </button>
        ))}
      </section>

      {/* Charts Row */}
      <section className="grid gap-6 xl:grid-cols-3">
        <Surface className="xl:col-span-2">
          <SurfaceHeader
            icon={<TrendingUp size={16} />}
            title="Revenue Trend"
            subtitle="7-day movement"
            onClick={handleSetOrdersTab}
            right={
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-sm font-medium",
                  isRevUp ? "text-emerald-600" : "text-rose-600",
                )}
              >
                {isRevUp ? (
                  <ArrowUpRight size={16} />
                ) : (
                  <ArrowDownRight size={16} />
                )}
                {revTrendPct}% vs average
              </span>
            }
          />
          <div className="h-[300px] p-5">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={salesData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  tickFormatter={(value) => `Rs.${Math.round(value / 1000)}k`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0f172a"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  activeDot={{ r: 4, fill: "#0f172a", strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Surface>

        <Surface>
          <SurfaceHeader
            icon={<ClipboardList size={16} />}
            title="Order Pipeline"
            subtitle="Stage distribution"
            onClick={handleSetOrdersTab}
            right={
              <span className="rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
                {orders.length} total
              </span>
            }
          />
          <div className="flex flex-col gap-5 p-5">
            {statusBreakdown.map(({ label, count, barClass, valueClass }) => {
              const pct =
                orders.length > 0
                  ? Math.round((count / orders.length) * 100)
                  : 0;
              return (
                <div key={label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{label}</span>
                    <div className="flex items-center gap-3">
                      <span className={cn("font-medium", valueClass)}>
                        {count}
                      </span>
                      <span className="w-8 text-right text-xs text-slate-500">
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn("h-full rounded-full", barClass)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Failures split */}
            <div className="mt-2 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-500">Cancelled</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {cancelledOrders.length}
                </p>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-500">Returned</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {returnedOrders.length}
                </p>
              </div>
            </div>
          </div>
        </Surface>
      </section>

      {/* Secondary Data Row */}
      <section className="grid gap-6 xl:grid-cols-3">
        <Surface className="xl:col-span-2">
          <SurfaceHeader
            icon={<ShoppingCart size={16} />}
            title="Recent Orders"
            subtitle="Latest records"
            onClick={handleSetOrdersTab}
          />
          <div className="sm:hidden">
            {recentOrders.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                No orders yet.
              </div>
            ) : (
              recentOrders.map((order) => (
                <MobileOrderRow
                  key={order.id}
                  order={order}
                  onClick={handleSetOrdersTab}
                />
              ))
            )}
          </div>
          <div className="hidden sm:block">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Order details</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-8 text-center text-slate-500"
                    >
                      No orders yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <DesktopOrderRow key={order.id} order={order} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Surface>

        <div className="space-y-6">
          <Surface>
            <SurfaceHeader
              icon={<Package size={16} />}
              title="Inventory Actions"
              subtitle="Critical items requiring attention"
              onClick={handleSetInventoryTab}
            />
            <div className="p-5">
              <div className="mb-5 flex items-end justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">Health Score</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">
                    {inventoryHealthPct}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Total Units</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {totalInventoryUnits.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

<<<<<<< HEAD
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Requires Restock
                </p>
                {criticalInventoryItems.map((item) => {
                  const product = item.variant?.product;
                  const sku = item.variant?.sku || item.sku || item.variantId;
                  const stock = item.quantity;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-slate-100 bg-slate-50 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {product?.name || sku}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">{sku}</p>
                      </div>
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-xs font-medium",
                          stock <= 0
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-700",
                        )}
                      >
                        {stock <= 0 ? "Out" : "Low"}
=======
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-0.5">
                {[
                  { label: 'Available', value: totalInventoryUnitsFormatted, color: 'text-stone-800' },
                  { label: 'Low Stock', value: lowStockCount, color: lowStockCount > 0 ? 'text-amber-600' : 'text-stone-800' },
                  { label: 'Out', value: outOfStockCount, color: outOfStockCount > 0 ? 'text-rose-600' : 'text-stone-800' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="px-1.5 sm:px-2 py-2 bg-stone-50 border border-stone-100 rounded-lg text-center">
                    <p className={cn('text-sm sm:text-base font-extrabold tabular-nums font-mono', color)}>{value}</p>
                    <p className="text-[8px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-0.5 leading-tight">{label}</p>
                  </div>
                ))}
              </div>

              {/* Top alerts */}
              {lowStockProducts.slice(0, 3).map(product => {
                const stock = getProductStock(product);
                return (
                  <div key={product.id} className="flex items-center justify-between gap-2 px-2 py-2 bg-amber-50/60 border border-amber-100 rounded-lg">
                    <div className="min-w-0">
                      <p className="text-[11px] sm:text-xs font-semibold text-stone-700 truncate">{product.name}</p>
                      <p className="text-[9px] sm:text-[10px] font-mono text-stone-400">{product.sku || '—'}</p>
                    </div>
                    <span className={cn(
                      'text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ring-1',
                      stock <= 0
                        ? 'bg-rose-50 text-rose-600 ring-rose-200'
                        : 'bg-amber-50 text-amber-700 ring-amber-200'
                    )}>
                      {stock <= 0 ? 'Out' : 'Low'}
                    </span>
                  </div>
                );
              })}
              {lowStockProducts.length === 0 && (
                <div className="flex items-center gap-2 px-2 py-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                  <p className="text-[11px] sm:text-xs font-semibold text-emerald-700">All products healthy</p>
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>

      {/* ─── FOURTH ROW: Daily Orders Bar + Category Revenue ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">

        {/* Daily Order Volume */}
        <Panel stripe="violet">
          <PanelHeader
            icon={<BarChart3 size={12} />}
            onClick={handleSetOrdersTab}
          >
            Daily Order Volume
          </PanelHeader>
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-3 h-[160px] sm:h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f0ee" />
                <XAxis
                  dataKey="name"
                  axisLine={false} tickLine={false}
                  tick={{ fontSize: 10, fill: '#a8a29e', fontWeight: 600 }}
                />
                <YAxis
                  axisLine={false} tickLine={false}
                  tick={{ fontSize: 10, fill: '#a8a29e', fontWeight: 600 }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="orders" fill="#6366f1" radius={[4, 4, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Revenue by Category */}
        <Panel stripe="teal">
          <PanelHeader
            icon={<Tag size={12} />}
            onClick={handleSetProductsTab}
          >
            Revenue by Category
          </PanelHeader>
          <div className="px-3 sm:px-4 py-2.5 sm:py-3 space-y-2">
            {categoryRevenue.length === 0 ? (
              <div className="py-5 text-center text-xs text-stone-400">No category data yet</div>
            ) : (() => {
              const max = categoryRevenue[0][1]; // already sorted desc, first is max
              return categoryRevenue.map(([cat, value]) => {
                const pct = max > 0 ? Math.round((value / max) * 100) : 0;
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[11px] sm:text-xs font-semibold text-stone-700 truncate">{cat}</span>
                      <span className="text-[11px] sm:text-xs font-bold text-stone-600 font-mono tabular-nums shrink-0">
                        ₹{value.toLocaleString('en-IN')}
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
                      </span>
                    </div>
                  );
                })}
                {criticalInventoryItems.length === 0 && (
                  <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-emerald-700">
                    <CheckCircle2 size={16} />
                    <p className="text-sm font-medium">All items well stocked.</p>
                  </div>
                )}
              </div>
            </div>
          </Surface>

          {/* Moved Category Revenue to fit structurally as standard card */}
          <Surface>
            <SurfaceHeader
              icon={<Tag size={16} />}
              title="Top Categories"
              subtitle="By revenue volume"
              onClick={handleSetProductsTab}
            />
            <div className="flex flex-col gap-4 p-5">
              {categoryRevenue.length === 0 ? (
                <div className="py-4 text-center text-sm text-slate-500">
                  No categorized data yet.
                </div>
              ) : (
                (() => {
                  const maxValue = categoryRevenue[0][1];
                  return categoryRevenue.map(([category, value]) => {
                    const pct =
                      maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
                    return (
                      <div key={category} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <p className="truncate font-medium text-slate-700">
                            {category}
                          </p>
                          <p className="font-medium text-slate-900">
                            Rs. {value.toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-slate-800"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </Surface>
        </div>
      </section>
    </div>
  );
};

export default Overview;
