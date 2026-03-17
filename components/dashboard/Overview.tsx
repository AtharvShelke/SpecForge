'use client';

import React, { useMemo, memo, useCallback } from 'react';
import { useShop } from '@/context/ShopContext';
import { useAdmin } from '@/context/AdminContext';
import { OrderStatus } from '@/types';
import {
  AlertTriangle,
  ClipboardList,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Users,
  Zap,
  Clock,
  CheckCircle2,
  BarChart3,
  Tag,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from 'recharts';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

// ─────────────────────────────────────────────────────────────
// SHARED PRIMITIVES — memoized to prevent unnecessary re-renders
// ─────────────────────────────────────────────────────────────

const SectionLabel = memo(({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="flex items-center gap-1.5">
    <span className="text-stone-400">{icon}</span>
    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em]">{children}</span>
  </div>
));
SectionLabel.displayName = 'SectionLabel';

// Precompute stripe classes outside render to avoid object recreation
const STRIPE_CLASSES: Record<string, string> = {
  indigo: 'from-indigo-400 via-indigo-500 to-violet-400',
  teal: 'from-teal-400 via-emerald-400 to-emerald-300',
  amber: 'from-amber-400 via-amber-400 to-orange-300',
  rose: 'from-rose-400 via-rose-400 to-rose-300',
  violet: 'from-violet-400 via-violet-500 to-indigo-400',
  stone: 'from-stone-300 via-stone-400 to-stone-300',
};

const Panel = memo(({ children, className, stripe }: {
  children: React.ReactNode;
  className?: string;
  stripe?: 'indigo' | 'teal' | 'amber' | 'rose' | 'violet' | 'stone';
}) => (
  <div className={cn('rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden', className)}>
    {stripe && <div className={cn('h-0.5 w-full bg-gradient-to-r', STRIPE_CLASSES[stripe])} />}
    {children}
  </div>
));
Panel.displayName = 'Panel';

const PanelHeader = memo(({ icon, children, right, onClick }: {
  icon: React.ReactNode;
  children: React.ReactNode;
  right?: React.ReactNode;
  onClick?: () => void;
}) => (
  <div
    className={cn(
      "px-3 py-2.5 sm:px-5 sm:py-3.5 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between",
      onClick && "cursor-pointer hover:bg-stone-100/80 active:bg-stone-100 transition-colors group/header"
    )}
    onClick={onClick}
  >
    <div className="flex items-center gap-1.5">
      <SectionLabel icon={icon}>{children}</SectionLabel>
      {onClick && (
        <ArrowUpRight
          size={10}
          className="ml-0.5 text-stone-400 opacity-0 group-hover/header:opacity-100 group-hover/header:translate-x-0.5 group-hover/header:-translate-y-0.5 transition-all"
        />
      )}
    </div>
    {right}
  </div>
));
PanelHeader.displayName = 'PanelHeader';

// ─────────────────────────────────────────────────────────────
// STATUS PILL — memoized + precomputed class map
// ─────────────────────────────────────────────────────────────

const STATUS_PILL_MAP: Record<string, string> = {
  [OrderStatus.PENDING]: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  [OrderStatus.PAID]: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  [OrderStatus.PROCESSING]: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
  [OrderStatus.SHIPPED]: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  [OrderStatus.DELIVERED]: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
  [OrderStatus.CANCELLED]: 'bg-rose-50 text-rose-600 ring-1 ring-rose-200',
  [OrderStatus.RETURNED]: 'bg-stone-100 text-stone-600 ring-1 ring-stone-200',
};

const StatusPill = memo(({ status }: { status: string }) => {
  const cls = STATUS_PILL_MAP[status] ?? 'bg-stone-100 text-stone-600 ring-1 ring-stone-200';
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest whitespace-nowrap',
      cls
    )}>
      <span className="w-1 h-1 rounded-full bg-current opacity-60" />
      {status}
    </span>
  );
});
StatusPill.displayName = 'StatusPill';

// ─────────────────────────────────────────────────────────────
// CUSTOM TOOLTIP — memoized
// ─────────────────────────────────────────────────────────────
const ChartTooltip = memo(({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-lg px-3 py-2.5 text-xs">
      <p className="font-bold text-stone-400 uppercase tracking-widest text-[10px] mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-bold text-stone-900 tabular-nums font-mono">
          {p.name === 'orders' ? p.value : `₹${Number(p.value).toLocaleString('en-IN')}`}
        </p>
      ))}
    </div>
  );
});
ChartTooltip.displayName = 'ChartTooltip';

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS for order rows — memoized to avoid list re-renders
// ─────────────────────────────────────────────────────────────

const MobileOrderRow = memo(({ order, onClick }: { order: any; onClick: () => void }) => (
  <div
    onClick={onClick}
    className="flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-stone-50/60 active:bg-stone-100 transition-colors touch-manipulation cursor-pointer"
  >
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-1.5 mb-0.5">
        <p className="text-[10px] font-mono font-bold text-indigo-600 truncate">{order.id}</p>
        <StatusPill status={order.status} />
      </div>
      <p className="text-xs font-semibold text-stone-700 truncate">{order.customerName}</p>
      <p className="text-[10px] text-stone-400 font-mono tabular-nums">
        {new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
      </p>
    </div>
    <div className="shrink-0 text-right">
      <p className="text-sm font-bold text-stone-900 font-mono tabular-nums">
        ₹{order.total.toLocaleString('en-IN')}
      </p>
    </div>
  </div>
));
MobileOrderRow.displayName = 'MobileOrderRow';

const DesktopOrderRow = memo(({ order }: { order: any }) => (
  <tr className="hover:bg-stone-50/60 transition-colors">
    <td className="px-4 py-3">
      <p className="text-[10px] font-mono font-bold text-indigo-600">{order.id}</p>
      <p className="text-[10px] text-stone-400 font-mono tabular-nums mt-0.5">
        {new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
      </p>
    </td>
    <td className="px-4 py-3">
      <p className="text-xs font-semibold text-stone-700 truncate max-w-[120px]">{order.customerName}</p>
      <p className="text-[10px] text-stone-400 truncate max-w-[120px]">{order.email}</p>
    </td>
    <td className="px-4 py-3">
      <StatusPill status={order.status} />
    </td>
    <td className="px-4 py-3 text-right">
      <span className="text-sm font-bold text-stone-900 font-mono tabular-nums">
        ₹{order.total.toLocaleString('en-IN')}
      </span>
    </td>
  </tr>
));
DesktopOrderRow.displayName = 'DesktopOrderRow';

// ─────────────────────────────────────────────────────────────
// MAIN OVERVIEW
// ─────────────────────────────────────────────────────────────
const Overview = () => {
  const { orders, inventory, products, syncData, isLoading, setActiveTab } = useAdmin();

  // ── Derived metrics — all in one pass over orders to avoid multiple iterations ──
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

    for (const o of orders) {
      totalRev += o.total;
      if (o.total > highest) highest = o.total;
      if (o.paymentStatus === 'Success') successRev += o.total;
      else pendingRev += o.total;

      switch (o.status) {
        case OrderStatus.PENDING: pending.push(o); break;
        case OrderStatus.PAID: paid.push(o); break;
        case OrderStatus.SHIPPED: shipped.push(o); break;
        case OrderStatus.DELIVERED: delivered.push(o); break;
        case OrderStatus.CANCELLED: cancelled.push(o); break;
        case OrderStatus.RETURNED: returned.push(o); break;
        case OrderStatus.PROCESSING: processing.push(o); break;
      }

      o.items?.forEach((item: any) => {
        const cat = item.category || 'Other';
        catMap[cat] = (catMap[cat] || 0) + item.price * item.quantity;
      });
    }

    const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

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
      categoryRevenue: sortedCats,
    };
  }, [orders]);

  const lowStockProducts = useMemo(() =>
    products.filter(p => {
      const stock = p.variants?.[0]?.warehouseInventories?.reduce((a: number, inv: any) => a + (inv.quantity || 0), 0) ?? 0;
      return stock <= 5;
    }),
    [products]
  );

  const outOfStockProducts = useMemo(() =>
    products.filter(p => {
      const stock = p.variants?.[0]?.warehouseInventories?.reduce((a: number, inv: any) => a + (inv.quantity || 0), 0) ?? 0;
      return stock <= 0;
    }),
    [products]
  );

  const fulfilmentRate = orders.length > 0
    ? Math.round((deliveredOrders.length / orders.length) * 100)
    : 0;

  const avgOrderValue = orders.length > 0
    ? Math.round(totalRevenue / orders.length)
    : 0;

  const salesData = useMemo(() => {
    if (orders.length === 0) return [];
    const dailyMap: Record<string, { revenue: number; orders: number }> = {};
    for (const o of orders) {
      const dateKey = new Date(o.date).toISOString().split('T')[0];
      if (!dailyMap[dateKey]) dailyMap[dateKey] = { revenue: 0, orders: 0 };
      dailyMap[dateKey].revenue += o.total;
      dailyMap[dateKey].orders += 1;
    }
    const sorted = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7);
    return sorted.map(([dateStr, data]) => {
      const d = new Date(dateStr);
      const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      return { name: label, revenue: Math.round(data.revenue), orders: data.orders };
    });
  }, [orders]);

  const { avgDailyRevenue, todayRevenue, revTrendPct, isRevUp } = useMemo(() => {
    const avg = salesData.length > 0
      ? salesData.reduce((s, d) => s + d.revenue, 0) / salesData.length
      : 0;
    const today = salesData.length > 0 ? salesData[salesData.length - 1].revenue : 0;
    const pct = avg > 0 ? Math.abs(((today - avg) / avg) * 100).toFixed(1) : '0.0';
    return { avgDailyRevenue: avg, todayRevenue: today, revTrendPct: pct, isRevUp: today >= avg };
  }, [salesData]);

  const statusBreakdown = useMemo(() => [
    { label: 'Delivered', count: deliveredOrders.length, color: 'bg-teal-400', textColor: 'text-teal-700' },
    { label: 'Shipped', count: shippedOrders.length, color: 'bg-violet-400', textColor: 'text-violet-700' },
    { label: 'Processing', count: processingOrders.length, color: 'bg-indigo-400', textColor: 'text-indigo-700' },
    { label: 'Pending', count: pendingOrders.length, color: 'bg-amber-400', textColor: 'text-amber-700' },
    { label: 'Cancelled', count: cancelledOrders.length, color: 'bg-rose-400', textColor: 'text-rose-600' },
  ], [deliveredOrders.length, shippedOrders.length, processingOrders.length, pendingOrders.length, cancelledOrders.length]);

  const recentOrders = useMemo(() =>
    [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6),
    [orders]
  );

  const inventoryArray = useMemo(() => Array.isArray(inventory) ? inventory : [], [inventory]);

  const { totalInventoryUnits, lowStockCount, outOfStockCount, inventoryHealthPct } = useMemo(() => {
    let units = 0;
    let low = 0;
    let out = 0;
    let healthy = 0;
    for (const i of inventoryArray) {
      units += i.quantity;
      if (i.quantity === 0) out++;
      else if (i.quantity <= i.reorderLevel) low++;
      if (i.quantity > i.reorderLevel) healthy++;
    }
    const healthPct = inventoryArray.length > 0
      ? Math.round((healthy / inventoryArray.length) * 100)
      : 100;
    return { totalInventoryUnits: units, lowStockCount: low, outOfStockCount: out, inventoryHealthPct: healthPct };
  }, [inventoryArray]);

  // Stable callbacks to avoid re-renders in child handlers
  const handleSyncData = useCallback(() => syncData(), [syncData]);
  const handleSetOrdersTab = useCallback(() => setActiveTab('orders'), [setActiveTab]);
  const handleSetInventoryTab = useCallback(() => setActiveTab('inventory'), [setActiveTab]);
  const handleSetProductsTab = useCallback(() => setActiveTab('products'), [setActiveTab]);

  // Pre-format recurring values once
  const totalRevenueFormatted = `₹${totalRevenue.toLocaleString('en-IN')}`;
  const avgOrderValueFormatted = `₹${avgOrderValue.toLocaleString('en-IN')}`;
  const highestOrderFormatted = `₹${highestOrderTotal.toLocaleString('en-IN')}`;
  const successRevenueFormatted = `₹${successRevenue.toLocaleString('en-IN')}`;
  const pendingRevenueFormatted = `₹${pendingRevenue.toLocaleString('en-IN')}`;
  const totalInventoryUnitsFormatted = totalInventoryUnits.toLocaleString('en-IN');

  const kpiCards = useMemo(() => [
    {
      label: 'Total Revenue',
      value: totalRevenueFormatted,
      sub: isRevUp ? `↑ ${revTrendPct}% vs avg` : `↓ ${revTrendPct}% vs avg`,
      icon: <DollarSign size={13} />,
      accent: 'border-l-indigo-400',
      subColor: isRevUp ? 'text-emerald-600' : 'text-rose-500',
      tab: 'orders',
      breakdown: [
        { label: 'Success', val: successRevenueFormatted, color: 'text-emerald-600' },
        { label: 'Pending', val: pendingRevenueFormatted, color: 'text-amber-600' }
      ]
    },
    {
      label: 'Avg Order',
      value: avgOrderValueFormatted,
      sub: `${orders.length} orders`,
      icon: <ShoppingCart size={13} />,
      accent: 'border-l-teal-400',
      subColor: 'text-stone-400',
      tab: 'orders',
      breakdown: [
        { label: 'Total', val: orders.length, color: 'text-stone-600' },
        { label: 'Highest', val: highestOrderFormatted, color: 'text-indigo-600' }
      ]
    },
    {
      label: 'Pending',
      value: pendingOrders.length + paidOrders.length,
      sub: `${pendingOrders.length} new · ${paidOrders.length} paid`,
      icon: <Zap size={13} />,
      accent: (pendingOrders.length + paidOrders.length) > 0 ? 'border-l-amber-400' : 'border-l-emerald-400',
      subColor: (pendingOrders.length + paidOrders.length) > 0 ? 'text-amber-600' : 'text-emerald-600',
      tab: 'orders',
      breakdown: [
        { label: 'New', val: pendingOrders.length, color: 'text-amber-600' },
        { label: 'Process', val: paidOrders.length, color: 'text-indigo-600' }
      ]
    },
    {
      label: 'Inventory',
      value: inventoryHealthPct + '%',
      sub: `${lowStockCount} low · ${outOfStockCount} out`,
      icon: <Package size={13} />,
      accent: inventoryHealthPct >= 80 ? 'border-l-emerald-400' : inventoryHealthPct >= 50 ? 'border-l-amber-400' : 'border-l-rose-400',
      subColor: 'text-stone-400',
      tab: 'inventory',
      breakdown: [
        { label: 'Items', val: inventoryArray.length, color: 'text-stone-600' },
        { label: 'Units', val: totalInventoryUnitsFormatted, color: 'text-indigo-600' }
      ]
    },
  ], [
    totalRevenueFormatted, isRevUp, revTrendPct, successRevenueFormatted, pendingRevenueFormatted,
    avgOrderValueFormatted, orders.length, highestOrderFormatted,
    pendingOrders.length, paidOrders.length,
    inventoryHealthPct, lowStockCount, outOfStockCount, inventoryArray.length, totalInventoryUnitsFormatted
  ]);

  return (
    <div
      className="space-y-3 sm:space-y-5 px-0"
      style={{ fontFamily: "'DM Sans', 'Geist', 'system-ui', sans-serif" }}
    >

      {/* ─── HEADER ─── */}
      <div className="flex items-center justify-between gap-2 pb-0.5">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 sm:h-5 rounded-full bg-indigo-500 shrink-0" />
          <div>
            <h1 className="text-sm sm:text-base font-bold text-stone-900 tracking-tight leading-tight">Overview</h1>
            <p className="text-[10px] sm:text-xs text-stone-400 mt-0.5 leading-tight">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-emerald-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="hidden xs:inline">Live</span>
          </div>
          <button
            onClick={handleSyncData}
            disabled={isLoading}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white hover:bg-stone-50 active:bg-stone-100 text-stone-600 border border-stone-200 text-[11px] sm:text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 touch-manipulation"
          >
            <RefreshCw size={11} className={isLoading ? "animate-spin" : ""} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* ─── KPI CARDS — 2×2 on mobile, 4×1 on lg ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {kpiCards.map((card, i) => (
          <div
            key={i}
            onClick={() => setActiveTab(card.tab)}
            className={cn(
              'group rounded-xl bg-white border border-stone-200 border-l-4 shadow-sm p-3 sm:p-4 transition-all hover:border-indigo-300 hover:shadow-md active:scale-[0.98] cursor-pointer relative overflow-hidden touch-manipulation',
              card.accent
            )}
          >
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-widest leading-tight">{card.label}</span>
              <span className="p-1 rounded-md text-stone-400 bg-stone-50 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors shrink-0">
                {card.icon}
              </span>
            </div>

            <p className="text-lg sm:text-2xl font-extrabold text-stone-900 tabular-nums tracking-tight group-hover:text-indigo-600 transition-colors truncate">
              {card.value}
            </p>
            <p className={cn('text-[10px] mt-0.5 font-medium mb-2 sm:mb-3 truncate', card.subColor)}>{card.sub}</p>

            <div className="pt-2 sm:pt-3 border-t border-stone-100 grid grid-cols-2 gap-1.5 sm:gap-2">
              {card.breakdown.map((b, idx) => (
                <div key={idx} className="min-w-0">
                  <p className="text-[8px] sm:text-[9px] text-stone-400 uppercase font-bold tracking-tight truncate">{b.label}</p>
                  <p className={cn('text-[10px] sm:text-[11px] font-bold tabular-nums truncate', b.color)}>{b.val}</p>
                </div>
              ))}
            </div>

            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
              <ArrowUpRight size={12} className="text-indigo-400" />
            </div>
          </div>
        ))}
      </div>

      {/* ─── SECOND ROW: Chart + Order Pipeline ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-2 sm:gap-3">

        {/* Revenue Area Chart */}
        <Panel stripe="indigo" className="xl:col-span-2">
          <PanelHeader
            icon={<TrendingUp size={12} />}
            onClick={handleSetOrdersTab}
            right={
              <span className={cn(
                'flex items-center gap-1 text-[10px] font-bold',
                isRevUp ? 'text-emerald-600' : 'text-rose-500'
              )}>
                {isRevUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {revTrendPct}% vs avg
              </span>
            }>
            Revenue Trend
          </PanelHeader>
          <div className="px-3 sm:px-5 pb-3 sm:pb-5 pt-3 sm:pt-4 h-[180px] sm:h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f0ee" />
                <XAxis
                  dataKey="name"
                  axisLine={false} tickLine={false}
                  tick={{ fontSize: 10, fill: '#a8a29e', fontWeight: 600 }}
                />
                <YAxis
                  axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`}
                  tick={{ fontSize: 10, fill: '#a8a29e', fontWeight: 600 }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Order Pipeline */}
        <Panel stripe="violet">
          <PanelHeader
            icon={<ClipboardList size={12} />}
            onClick={handleSetOrdersTab}
            right={
              <span className="text-[10px] font-mono font-bold text-stone-400 bg-white border border-stone-200 px-2 py-0.5 rounded-md">
                {orders.length} total
              </span>
            }>
            Order Pipeline
          </PanelHeader>
          <div className="px-3 sm:px-4 py-2.5 sm:py-3 space-y-1.5 sm:space-y-2">
            {statusBreakdown.map(({ label, count, color, textColor }) => {
              const pct = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', color)} />
                      <span className="text-[11px] sm:text-xs font-semibold text-stone-700">{label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn('text-[11px] sm:text-xs font-bold tabular-nums font-mono', textColor)}>{count}</span>
                      <span className="text-[10px] text-stone-400 font-mono tabular-nums w-7 sm:w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mx-3 sm:mx-4 mb-3 sm:mb-4 mt-1 grid grid-cols-2 gap-2">
            <div className="px-2.5 sm:px-3 py-2 sm:py-2.5 bg-stone-50 border border-stone-100 rounded-lg">
              <p className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-widest">Cancelled</p>
              <p className="text-base sm:text-lg font-extrabold text-rose-600 tabular-nums font-mono">{cancelledOrders.length}</p>
            </div>
            <div className="px-2.5 sm:px-3 py-2 sm:py-2.5 bg-stone-50 border border-stone-100 rounded-lg">
              <p className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-widest">Returned</p>
              <p className="text-base sm:text-lg font-extrabold text-stone-700 tabular-nums font-mono">
                {returnedOrders.length}
              </p>
            </div>
          </div>
        </Panel>
      </div>

      {/* ─── THIRD ROW: Recent Orders + Inventory ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-2 sm:gap-3">

        {/* Recent Orders */}
        <Panel stripe="indigo" className="xl:col-span-2">
          <PanelHeader
            icon={<ShoppingCart size={12} />}
            onClick={handleSetOrdersTab}
            right={
              <span className="text-[10px] font-mono font-bold text-stone-400 bg-white border border-stone-200 px-2 py-0.5 rounded-md">
                Latest 6
              </span>
            }>
            Recent Orders
          </PanelHeader>

          {/* Mobile card list (hidden on sm+) */}
          <div className="sm:hidden divide-y divide-stone-50">
            {recentOrders.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-stone-400">No orders yet</div>
            ) : recentOrders.map(order => (
              <MobileOrderRow key={order.id} order={order} onClick={handleSetOrdersTab} />
            ))}
          </div>

          {/* Table (hidden on mobile, shown on sm+) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/30">
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Order</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Customer</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Status</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold text-stone-400 uppercase tracking-widest">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-xs text-stone-400">No orders yet</td>
                  </tr>
                ) : recentOrders.map(order => (
                  <DesktopOrderRow key={order.id} order={order} />
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Inventory Health */}
        <div className="flex flex-col gap-2 sm:gap-3">
          <Panel stripe="teal">
            <PanelHeader
              icon={<Package size={12} />}
              onClick={handleSetInventoryTab}
            >
              Inventory Health
            </PanelHeader>
            <div className="px-3 sm:px-4 py-3 space-y-2 sm:space-y-2.5">
              {/* Health bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-widest">Overall Health</span>
                  <span className={cn(
                    'text-sm sm:text-base font-extrabold font-mono tabular-nums',
                    inventoryHealthPct >= 80 ? 'text-emerald-600' : inventoryHealthPct >= 50 ? 'text-amber-600' : 'text-rose-600'
                  )}>
                    {inventoryHealthPct}%
                  </span>
                </div>
                <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', inventoryHealthPct >= 80 ? 'bg-emerald-400' : inventoryHealthPct >= 50 ? 'bg-amber-400' : 'bg-rose-400')}
                    style={{ width: `${inventoryHealthPct}%` }}
                  />
                </div>
              </div>

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
                const stock = product.variants?.[0]?.warehouseInventories?.reduce((a: number, inv: any) => a + (inv.quantity || 0), 0) ?? 0;
                return (
                  <div key={product.id} className="flex items-center justify-between gap-2 px-2 py-2 bg-amber-50/60 border border-amber-100 rounded-lg">
                    <div className="min-w-0">
                      <p className="text-[11px] sm:text-xs font-semibold text-stone-700 truncate">{product.name}</p>
                      <p className="text-[9px] sm:text-[10px] font-mono text-stone-400">{product.variants?.[0]?.sku || '—'}</p>
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
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-teal-400 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              });
            })()}
            {categoryRevenue.length === 0 && orders.length > 0 && (
              <div className="py-4 text-center">
                <p className="text-xs text-stone-400">Revenue data will appear once orders contain categorised items</p>
              </div>
            )}
          </div>
        </Panel>
      </div>

    </div>
  );
};

export default Overview;