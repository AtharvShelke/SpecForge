"use client";

import React, { memo, useCallback, useMemo } from "react";
import { useAdmin } from "@/context/AdminContext";
import { Order, OrderStatus, Product, WarehouseInventory } from "@/types";
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

type OrderItemSnapshot = {
  category?: string;
  price: number;
  quantity: number;
};

type InventorySnapshot = {
  quantity?: number;
};

const STRIPE_CLASSES: Record<string, string> = {
  sky: "from-sky-400 via-cyan-400 to-teal-300",
  gold: "from-amber-300 via-orange-300 to-rose-300",
  mint: "from-emerald-300 via-teal-300 to-cyan-300",
  slate: "from-stone-300 via-stone-200 to-white",
};

const STATUS_PILL_MAP: Record<string, string> = {
  [OrderStatus.PENDING]: "bg-amber-50 text-amber-700 ring-amber-200",
  [OrderStatus.PAID]: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  [OrderStatus.PROCESSING]: "bg-sky-50 text-sky-700 ring-sky-200",
  [OrderStatus.SHIPPED]: "bg-violet-50 text-violet-700 ring-violet-200",
  [OrderStatus.DELIVERED]: "bg-teal-50 text-teal-700 ring-teal-200",
  [OrderStatus.CANCELLED]: "bg-rose-50 text-rose-700 ring-rose-200",
  [OrderStatus.RETURNED]: "bg-stone-100 text-stone-600 ring-stone-200",
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
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/70 bg-white/85 text-stone-500 shadow-sm">
        {icon}
      </span>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-400">
          Snapshot
        </p>
        <p className="text-sm font-semibold text-stone-900">{children}</p>
      </div>
    </div>
  ),
);
SectionLabel.displayName = "SectionLabel";

const Surface = memo(
  ({
    children,
    className,
    stripe = "slate",
  }: {
    children: React.ReactNode;
    className?: string;
    stripe?: keyof typeof STRIPE_CLASSES;
  }) => (
    <div
      className={cn(
        "app-card overflow-hidden border-white/70 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl",
        className,
      )}
    >
      <div
        className={cn(
          "h-px w-full bg-gradient-to-r opacity-90",
          STRIPE_CLASSES[stripe],
        )}
      />
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
        "flex items-center justify-between gap-4 border-b border-stone-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,245,240,0.72))] px-4 py-4 sm:px-6",
        onClick && "cursor-pointer transition-colors hover:bg-white",
      )}
    >
      <SectionLabel icon={icon}>{title}</SectionLabel>
      <div className="flex items-center gap-3">
        <p className="hidden text-xs text-stone-500 sm:block">{subtitle}</p>
        {right}
      </div>
    </div>
  ),
);
SurfaceHeader.displayName = "SurfaceHeader";

const StatusPill = memo(({ status }: { status: string }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] ring-1",
      STATUS_PILL_MAP[status] ?? "bg-stone-100 text-stone-600 ring-stone-200",
    )}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
    {status}
  </span>
));
StatusPill.displayName = "StatusPill";

const ChartTooltip = memo(({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-white/80 bg-white/95 px-3 py-2 shadow-xl shadow-stone-900/10 backdrop-blur">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-400">
        {label}
      </p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm font-semibold text-stone-900">
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
      className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-stone-50/80"
    >
      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <p className="font-mono text-[11px] font-semibold text-sky-700">
            {order.id}
          </p>
          <StatusPill status={order.status} />
        </div>
        <p className="truncate text-sm font-medium text-stone-800">
          {order.customerName}
        </p>
        <p className="mt-1 text-[11px] text-stone-500">
          {new Date(order.date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}
        </p>
      </div>
      <p className="shrink-0 text-sm font-semibold text-stone-900">
        Rs. {order.total.toLocaleString("en-IN")}
      </p>
    </button>
  ),
);
MobileOrderRow.displayName = "MobileOrderRow";

const DesktopOrderRow = memo(({ order }: { order: OverviewOrderRow }) => (
  <tr className="border-b border-stone-100/80 transition-colors hover:bg-stone-50/70">
    <td className="px-5 py-4">
      <p className="font-mono text-[11px] font-semibold text-sky-700">
        {order.id}
      </p>
      <p className="mt-1 text-[11px] text-stone-500">
        {new Date(order.date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        })}
      </p>
    </td>
    <td className="px-5 py-4">
      <p className="max-w-[180px] truncate text-sm font-medium text-stone-800">
        {order.customerName}
      </p>
      <p className="max-w-[180px] truncate text-[11px] text-stone-500">
        {order.email}
      </p>
    </td>
    <td className="px-5 py-4">
      <StatusPill status={order.status} />
    </td>
    <td className="px-5 py-4 text-right text-sm font-semibold text-stone-900">
      Rs. {order.total.toLocaleString("en-IN")}
    </td>
  </tr>
));
DesktopOrderRow.displayName = "DesktopOrderRow";

const Overview = () => {
  const { orders, inventory, products, syncData, isLoading, setActiveTab } =
    useAdmin() as unknown as {
      orders: Order[];
      inventory: WarehouseInventory[];
      products: Product[];
      syncData: () => Promise<void>;
      isLoading: boolean;
      setActiveTab: (tab: string) => void;
    };

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

  const lowStockProducts = useMemo(
    () =>
      (Array.isArray(products) ? products : []).filter((product) => {
        const stock =
          (
            product.variants?.[0]?.warehouseInventories as
              | InventorySnapshot[]
              | undefined
          )?.reduce((total: number, inv) => total + (inv.quantity || 0), 0) ??
          0;
        return stock <= 5;
      }),
    [products],
  );

  const inventoryArray = useMemo(
    () => (Array.isArray(inventory) ? inventory : []),
    [inventory],
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
        barClass: "bg-teal-400",
        valueClass: "text-teal-700",
      },
      {
        label: "Shipped",
        count: shippedOrders.length,
        barClass: "bg-violet-400",
        valueClass: "text-violet-700",
      },
      {
        label: "Processing",
        count: processingOrders.length,
        barClass: "bg-sky-400",
        valueClass: "text-sky-700",
      },
      {
        label: "Pending",
        count: pendingOrders.length,
        barClass: "bg-amber-400",
        valueClass: "text-amber-700",
      },
      {
        label: "Cancelled",
        count: cancelledOrders.length,
        barClass: "bg-rose-400",
        valueClass: "text-rose-700",
      },
    ],
    [
      deliveredOrders.length,
      shippedOrders.length,
      processingOrders.length,
      pendingOrders.length,
      cancelledOrders.length,
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
        label: "Revenue",
        value: totalRevenueFormatted,
        sub: isRevUp
          ? `Up ${revTrendPct}% vs weekly avg`
          : `Down ${revTrendPct}% vs weekly avg`,
        icon: <DollarSign size={14} />,
        tab: "orders",
        tone: "sky" as const,
        breakdown: [
          { label: "Captured", val: successRevenueFormatted },
          { label: "Pending", val: pendingRevenueFormatted },
        ],
      },
      {
        label: "Average Order",
        value: avgOrderValueFormatted,
        sub: `${orders.length} orders tracked`,
        icon: <TrendingUp size={14} />,
        tab: "orders",
        tone: "gold" as const,
        breakdown: [
          { label: "Highest", val: highestOrderFormatted },
          { label: "Delivered", val: `${deliveredOrders.length}` },
        ],
      },
      {
        label: "Fulfilment",
        value: `${fulfilmentRate}%`,
        sub: `${processingOrders.length + shippedOrders.length} still moving`,
        icon: <ClipboardList size={14} />,
        tab: "orders",
        tone: "mint" as const,
        breakdown: [
          {
            label: "Pending",
            val: `${pendingOrders.length + paidOrders.length}`,
          },
          { label: "Returned", val: `${returnedOrders.length}` },
        ],
      },
      {
        label: "Inventory Health",
        value: `${inventoryHealthPct}%`,
        sub: `${lowStockCount} low and ${outOfStockCount} out`,
        icon: <Package size={14} />,
        tab: "inventory",
        tone: "slate" as const,
        breakdown: [
          { label: "Units", val: totalInventoryUnits.toLocaleString("en-IN") },
          { label: "Lines", val: `${inventoryArray.length}` },
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
    <div className="space-y-5">
      <section className="app-card relative overflow-hidden border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(244,241,235,0.88))] px-5 py-5 shadow-[0_28px_90px_rgba(15,23,42,0.10)] sm:px-7 sm:py-6">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300 to-transparent" />
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-sky-100/60 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-amber-100/50 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="">
            <span className="section-kicker">Admin command center</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-3 py-2 text-xs font-medium text-emerald-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Live data feed
            </div>
            <button
              type="button"
              onClick={handleSyncData}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white disabled:opacity-60"
            >
              <RefreshCw
                size={14}
                className={cn(isLoading && "animate-spin")}
              />
              Sync overview
            </button>
          </div>
        </div>
        <div className="relative mt-6 flex flex-wrap items-center gap-3 text-xs text-stone-500">
          <span className="rounded-full border border-stone-200/80 bg-white/80 px-3 py-1.5">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          <span className="rounded-full border border-stone-200/80 bg-white/80 px-3 py-1.5">
            {orders.length.toLocaleString("en-IN")} orders indexed
          </span>
          <span className="rounded-full border border-stone-200/80 bg-white/80 px-3 py-1.5">
            {(Array.isArray(products) ? products.length : 0).toLocaleString(
              "en-IN",
            )}{" "}
            products in catalog
          </span>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={() => setActiveTab(card.tab)}
            className="group app-card relative overflow-hidden border-white/70 bg-white/82 p-5 text-left shadow-[0_18px_60px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:bg-white"
          >
            <div
              className={cn(
                "absolute inset-x-0 top-0 h-px bg-gradient-to-r",
                STRIPE_CLASSES[card.tone],
              )}
            />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-400">
                  {card.label}
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-stone-950">
                  {card.value}
                </p>
                <p className="mt-2 text-sm text-stone-500">{card.sub}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-stone-50/90 text-stone-600 shadow-sm transition group-hover:text-sky-700">
                {card.icon}
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 border-t border-stone-200/70 pt-4">
              {card.breakdown.map((item) => (
                <div key={item.label}>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-stone-800">
                    {item.val}
                  </p>
                </div>
              ))}
            </div>
          </button>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Surface className="xl:col-span-2" stripe="sky">
          <SurfaceHeader
            icon={<TrendingUp size={14} />}
            title="Revenue trend"
            subtitle="Seven-day movement"
            onClick={handleSetOrdersTab}
            right={
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-semibold",
                  isRevUp ? "text-emerald-600" : "text-rose-600",
                )}
              >
                {isRevUp ? (
                  <ArrowUpRight size={14} />
                ) : (
                  <ArrowDownRight size={14} />
                )}
                {revTrendPct}% vs average
              </span>
            }
          />
          <div className="h-[260px] px-4 pb-4 pt-5 sm:px-6 sm:pb-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={salesData}
                margin={{ top: 8, right: 10, left: -24, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="overviewRevenueFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#0f766e" stopOpacity={0.22} />
                    <stop
                      offset="100%"
                      stopColor="#0f766e"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  stroke="#e7e2d9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#78716c" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#78716c" }}
                  tickFormatter={(value) => `Rs.${Math.round(value / 1000)}k`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="revenue"
                  stroke="#0f766e"
                  strokeWidth={2.5}
                  fill="url(#overviewRevenueFill)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "#0f766e",
                    stroke: "#ffffff",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Surface>

        <Surface stripe="gold">
          <SurfaceHeader
            icon={<ClipboardList size={14} />}
            title="Order pipeline"
            subtitle="Stage distribution"
            onClick={handleSetOrdersTab}
            right={
              <span className="rounded-full border border-stone-200/80 bg-white px-3 py-1 text-xs text-stone-500">
                {orders.length} total
              </span>
            }
          />
          <div className="space-y-4 px-4 py-5 sm:px-6">
            {statusBreakdown.map(({ label, count, barClass, valueClass }) => {
              const pct =
                orders.length > 0
                  ? Math.round((count / orders.length) * 100)
                  : 0;
              return (
                <div key={label} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2 text-stone-700">
                      <span className={cn("h-2 w-2 rounded-full", barClass)} />
                      <span>{label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn("font-semibold", valueClass)}>
                        {count}
                      </span>
                      <span className="w-10 text-right text-xs text-stone-400">
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        barClass,
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-2xl border border-rose-100 bg-rose-50/70 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.24em] text-rose-500">
                  Cancelled
                </p>
                <p className="mt-2 text-2xl font-semibold text-rose-700">
                  {cancelledOrders.length}
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50/80 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">
                  Returned
                </p>
                <p className="mt-2 text-2xl font-semibold text-stone-800">
                  {returnedOrders.length}
                </p>
              </div>
            </div>
          </div>
        </Surface>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Surface className="xl:col-span-2" stripe="slate">
          <SurfaceHeader
            icon={<ShoppingCart size={14} />}
            title="Recent orders"
            subtitle="Latest six records"
            onClick={handleSetOrdersTab}
            right={
              <span className="rounded-full border border-stone-200/80 bg-white px-3 py-1 text-xs text-stone-500">
                Latest 6
              </span>
            }
          />
          <div className="sm:hidden">
            {recentOrders.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-stone-500">
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
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200/70 bg-stone-50/60">
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-400">
                    Order
                  </th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-400">
                    Customer
                  </th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-400">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-400">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-10 text-center text-sm text-stone-500"
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

        <div className="space-y-4">
          <Surface stripe="mint">
            <SurfaceHeader
              icon={<Package size={14} />}
              title="Inventory health"
              subtitle="Fast restock view"
              onClick={handleSetInventoryTab}
            />
            <div className="space-y-5 px-4 py-5 sm:px-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-stone-400">
                    Healthy inventory
                  </p>
                  <p
                    className={cn(
                      "text-2xl font-semibold",
                      inventoryHealthPct >= 80
                        ? "text-emerald-700"
                        : inventoryHealthPct >= 50
                          ? "text-amber-700"
                          : "text-rose-700",
                    )}
                  >
                    {inventoryHealthPct}%
                  </p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      inventoryHealthPct >= 80
                        ? "bg-emerald-400"
                        : inventoryHealthPct >= 50
                          ? "bg-amber-400"
                          : "bg-rose-400",
                    )}
                    style={{ width: `${inventoryHealthPct}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Units",
                    value: totalInventoryUnits.toLocaleString("en-IN"),
                    valueClass: "text-stone-900",
                  },
                  {
                    label: "Low",
                    value: `${lowStockCount}`,
                    valueClass:
                      lowStockCount > 0 ? "text-amber-700" : "text-stone-900",
                  },
                  {
                    label: "Out",
                    value: `${outOfStockCount}`,
                    valueClass:
                      outOfStockCount > 0 ? "text-rose-700" : "text-stone-900",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-stone-200/80 bg-stone-50/70 px-3 py-3 text-center"
                  >
                    <p className={cn("text-xl font-semibold", item.valueClass)}>
                      {item.value}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-stone-400">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {lowStockProducts.slice(0, 3).map((product) => {
                  const stock =
                    (
                      product.variants?.[0]?.warehouseInventories as
                        | InventorySnapshot[]
                        | undefined
                    )?.reduce(
                      (total: number, inv) => total + (inv.quantity || 0),
                      0,
                    ) ?? 0;

                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-stone-800">
                          {product.name}
                        </p>
                        <p className="mt-1 text-[11px] text-stone-500">
                          {product.variants?.[0]?.sku || "No SKU"}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]",
                          stock <= 0
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-700",
                        )}
                      >
                        {stock <= 0 ? "Out" : "Low"}
                      </span>
                    </div>
                  );
                })}
                {lowStockProducts.length === 0 && (
                  <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <p className="text-sm font-medium text-emerald-800">
                      Everything currently sits above reorder level.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Surface>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Surface stripe="gold">
          <SurfaceHeader
            icon={<BarChart3 size={14} />}
            title="Daily order volume"
            subtitle="Seven-day count"
            onClick={handleSetOrdersTab}
          />
          <div className="h-[220px] px-4 pb-4 pt-5 sm:px-6 sm:pb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={salesData}
                margin={{ top: 8, right: 10, left: -24, bottom: 0 }}
                barSize={26}
              >
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  stroke="#e7e2d9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#78716c" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#78716c" }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="orders"
                  name="orders"
                  fill="#d97706"
                  radius={[10, 10, 4, 4]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Surface>

        <Surface stripe="mint">
          <SurfaceHeader
            icon={<Tag size={14} />}
            title="Revenue by category"
            subtitle="Top five contributors"
            onClick={handleSetProductsTab}
          />
          <div className="space-y-4 px-4 py-5 sm:px-6">
            {categoryRevenue.length === 0 ? (
              <div className="py-10 text-center text-sm text-stone-500">
                Category revenue will appear once completed orders include
                categorized items.
              </div>
            ) : (
              (() => {
                const maxValue = categoryRevenue[0][1];
                return categoryRevenue.map(([category, value]) => {
                  const pct =
                    maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
                  return (
                    <div key={category} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-medium text-stone-800">
                          {category}
                        </p>
                        <p className="shrink-0 text-sm font-semibold text-stone-900">
                          Rs. {value.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-500"
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
      </section>
    </div>
  );
};

export default Overview;
