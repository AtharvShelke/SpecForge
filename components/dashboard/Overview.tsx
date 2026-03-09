'use client';

import React, { useMemo } from 'react';
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
// SHARED PRIMITIVES (consistent with OrderManager system)
// ─────────────────────────────────────────────────────────────

const SectionLabel = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="flex items-center gap-1.5">
    <span className="text-stone-400">{icon}</span>
    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em]">{children}</span>
  </div>
);

const Panel = ({ children, className, stripe }: {
  children: React.ReactNode;
  className?: string;
  stripe?: 'indigo' | 'teal' | 'amber' | 'rose' | 'violet' | 'stone';
}) => {
  const stripes = {
    indigo: 'from-indigo-400 via-indigo-500 to-violet-400',
    teal: 'from-teal-400 via-emerald-400 to-emerald-300',
    amber: 'from-amber-400 via-amber-400 to-orange-300',
    rose: 'from-rose-400 via-rose-400 to-rose-300',
    violet: 'from-violet-400 via-violet-500 to-indigo-400',
    stone: 'from-stone-300 via-stone-400 to-stone-300',
  };
  return (
    <div className={cn('rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden', className)}>
      {stripe && <div className={cn('h-0.5 w-full bg-gradient-to-r', stripes[stripe])} />}
      {children}
    </div>
  );
};

const PanelHeader = ({ icon, children, right }: { icon: React.ReactNode; children: React.ReactNode; right?: React.ReactNode }) => (
  <div className="px-5 py-3.5 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
    <SectionLabel icon={icon}>{children}</SectionLabel>
    {right}
  </div>
);

// ─────────────────────────────────────────────────────────────
// STATUS PILL
// ─────────────────────────────────────────────────────────────
const StatusPill = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    [OrderStatus.PENDING]: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    [OrderStatus.PAID]: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    [OrderStatus.PROCESSING]: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
    [OrderStatus.SHIPPED]: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
    [OrderStatus.DELIVERED]: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
    [OrderStatus.CANCELLED]: 'bg-rose-50 text-rose-600 ring-1 ring-rose-200',
    [OrderStatus.RETURNED]: 'bg-stone-100 text-stone-600 ring-1 ring-stone-200',
  };
  const cls = map[status] ?? 'bg-stone-100 text-stone-600 ring-1 ring-stone-200';
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap', cls)}>
      <span className="w-1 h-1 rounded-full bg-current opacity-60" />
      {status}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────
// CUSTOM TOOLTIP
// ─────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
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
};

// ─────────────────────────────────────────────────────────────
// MAIN OVERVIEW
// ─────────────────────────────────────────────────────────────
const Overview = () => {
  const { orders, inventory, products } = useAdmin();

  // ── Derived metrics ──
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING);
  const paidOrders = orders.filter(o => o.status === OrderStatus.PAID);
  const shippedOrders = orders.filter(o => o.status === OrderStatus.SHIPPED);
  const deliveredOrders = orders.filter(o => o.status === OrderStatus.DELIVERED);
  const cancelledOrders = orders.filter(o => o.status === OrderStatus.CANCELLED);

  const lowStockProducts = products.filter(p => {
    const stock = p.variants?.[0]?.warehouseInventories?.reduce((a: number, inv: any) => a + (inv.quantity || 0), 0) ?? 0;
    return stock <= 5; // Use 5 as a standard threshold for "low" in overview
  });
  const outOfStockProducts = products.filter(p => {
    const stock = p.variants?.[0]?.warehouseInventories?.reduce((a: number, inv: any) => a + (inv.quantity || 0), 0) ?? 0;
    return stock <= 0;
  });

  // ── Order fulfilment rate ──
  const fulfilmentRate = orders.length > 0
    ? Math.round((deliveredOrders.length / orders.length) * 100)
    : 0;

  // ── Avg order value ──
  const avgOrderValue = orders.length > 0
    ? Math.round(totalRevenue / orders.length)
    : 0;

  // ── Revenue chart data (last 7 days — static demo, replace with real data) ──
  const salesData = [
    { name: 'Mon', revenue: 42000, orders: 14 },
    { name: 'Tue', revenue: 35000, orders: 11 },
    { name: 'Wed', revenue: 28000, orders: 9 },
    { name: 'Thu', revenue: 31000, orders: 10 },
    { name: 'Fri', revenue: 22000, orders: 7 },
    { name: 'Sat', revenue: 29000, orders: 13 },
    { name: 'Sun', revenue: 38000, orders: 16 },
  ];

  const avgDailyRevenue = salesData.reduce((s, d) => s + d.revenue, 0) / salesData.length;
  const todayRevenue = salesData[salesData.length - 1].revenue;
  const revTrendPct = Math.abs(((todayRevenue - avgDailyRevenue) / avgDailyRevenue) * 100).toFixed(1);
  const isRevUp = todayRevenue >= avgDailyRevenue;

  // ── Order status breakdown for donut-style bar ──
  const statusBreakdown = [
    { label: 'Delivered', count: deliveredOrders.length, color: 'bg-teal-400', textColor: 'text-teal-700' },
    { label: 'Shipped', count: shippedOrders.length, color: 'bg-violet-400', textColor: 'text-violet-700' },
    { label: 'Processing', count: orders.filter(o => o.status === OrderStatus.PROCESSING).length, color: 'bg-indigo-400', textColor: 'text-indigo-700' },
    { label: 'Pending', count: pendingOrders.length, color: 'bg-amber-400', textColor: 'text-amber-700' },
    { label: 'Cancelled', count: cancelledOrders.length, color: 'bg-rose-400', textColor: 'text-rose-600' },
  ];

  // ── Category revenue distribution ──
  const categoryRevenue = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach(o => {
      o.items?.forEach((item: any) => {
        const cat = item.category || 'Other';
        map[cat] = (map[cat] || 0) + item.price * item.quantity;
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [orders]);

  // ── Recent orders (last 5) ──
  const recentOrders = useMemo(() =>
    [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6),
    [orders]
  );

  // ── Inventory health ──
  const inventoryArray = Array.isArray(inventory) ? inventory : [];
  const totalInventoryUnits = inventoryArray.reduce((s, i) => s + i.quantity, 0);
  const lowStockCount = inventoryArray.filter(i => i.quantity > 0 && i.quantity <= i.reorderLevel).length;
  const outOfStockCount = inventoryArray.filter(i => i.quantity === 0).length;
  const inventoryHealthPct = inventoryArray.length > 0
    ? Math.round((inventoryArray.filter(i => i.quantity > i.reorderLevel).length / inventoryArray.length) * 100)
    : 100;

  return (
    <div
      className="space-y-5"
      style={{ fontFamily: "'DM Sans', 'Geist', 'system-ui', sans-serif" }}
    >

      {/* ─── HEADER ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 rounded-full bg-indigo-500" />
          <div>
            <h1 className="text-base font-bold text-stone-900 tracking-tight">Overview</h1>
            <p className="text-xs text-stone-400 mt-0.5">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </div>
      </div>

      {/* ─── KPI CARDS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Total Revenue',
            value: `₹${totalRevenue.toLocaleString('en-IN')}`,
            sub: isRevUp ? `↑ ${revTrendPct}% vs daily avg` : `↓ ${revTrendPct}% vs daily avg`,
            icon: <DollarSign size={14} />,
            accent: 'border-l-indigo-400',
            subColor: isRevUp ? 'text-emerald-600' : 'text-rose-500',
          },
          {
            label: 'Avg Order Value',
            value: `₹${avgOrderValue.toLocaleString('en-IN')}`,
            sub: `Across ${orders.length} orders`,
            icon: <ShoppingCart size={14} />,
            accent: 'border-l-teal-400',
            subColor: 'text-stone-400',
          },
          {
            label: 'Pending Actions',
            value: pendingOrders.length + paidOrders.length,
            sub: `${pendingOrders.length} pending · ${paidOrders.length} paid`,
            icon: <Zap size={14} />,
            accent: (pendingOrders.length + paidOrders.length) > 0 ? 'border-l-amber-400' : 'border-l-emerald-400',
            subColor: (pendingOrders.length + paidOrders.length) > 0 ? 'text-amber-600' : 'text-emerald-600',
          },
          {
            label: 'Fulfilment Rate',
            value: `${fulfilmentRate}%`,
            sub: `${deliveredOrders.length} of ${orders.length} delivered`,
            icon: <CheckCircle2 size={14} />,
            accent: fulfilmentRate >= 80 ? 'border-l-emerald-400' : fulfilmentRate >= 50 ? 'border-l-amber-400' : 'border-l-rose-400',
            subColor: 'text-stone-400',
          },
        ].map((card, i) => (
          <div key={i} className={cn('rounded-xl bg-white border border-stone-200 border-l-4 shadow-sm p-4', card.accent)}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{card.label}</span>
              <span className="p-1 rounded-md text-stone-400 bg-stone-50">{card.icon}</span>
            </div>
            <p className="text-2xl font-extrabold text-stone-900 tabular-nums tracking-tight">{card.value}</p>
            <p className={cn('text-[11px] mt-0.5 font-medium', card.subColor)}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ─── SECOND ROW: Chart + Order Pipeline ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">

        {/* Revenue + Orders Area Chart */}
        <Panel stripe="indigo" className="xl:col-span-2">
          <PanelHeader icon={<TrendingUp size={12} />} right={
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
          <div className="px-5 pb-5 pt-4 h-[240px]">
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
                  tick={{ fontSize: 11, fill: '#a8a29e', fontWeight: 600 }}
                />
                <YAxis
                  axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`}
                  tick={{ fontSize: 11, fill: '#a8a29e', fontWeight: 600 }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Order Pipeline */}
        <Panel stripe="violet">
          <PanelHeader icon={<ClipboardList size={12} />} right={
            <span className="text-[10px] font-mono font-bold text-stone-400 bg-white border border-stone-200 px-2 py-0.5 rounded-md">
              {orders.length} total
            </span>
          }>
            Order Pipeline
          </PanelHeader>
          <div className="px-4 py-3 space-y-2">
            {statusBreakdown.map(({ label, count, color, textColor }) => {
              const pct = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('w-1.5 h-1.5 rounded-full', color)} />
                      <span className="text-xs font-semibold text-stone-700">{label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn('text-xs font-bold tabular-nums font-mono', textColor)}>{count}</span>
                      <span className="text-[10px] text-stone-400 font-mono tabular-nums w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick stats footer */}
          <div className="mx-4 mb-4 mt-1 grid grid-cols-2 gap-2">
            <div className="px-3 py-2.5 bg-stone-50 border border-stone-100 rounded-lg">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Cancelled</p>
              <p className="text-lg font-extrabold text-rose-600 tabular-nums font-mono">{cancelledOrders.length}</p>
            </div>
            <div className="px-3 py-2.5 bg-stone-50 border border-stone-100 rounded-lg">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Returned</p>
              <p className="text-lg font-extrabold text-stone-700 tabular-nums font-mono">
                {orders.filter(o => o.status === OrderStatus.RETURNED).length}
              </p>
            </div>
          </div>
        </Panel>
      </div>

      {/* ─── THIRD ROW: Recent Orders + Stock Alerts + Reviews ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">

        {/* Recent Orders */}
        <Panel stripe="indigo" className="xl:col-span-2">
          <PanelHeader icon={<ShoppingCart size={12} />} right={
            <span className="text-[10px] font-mono font-bold text-stone-400 bg-white border border-stone-200 px-2 py-0.5 rounded-md">
              Latest 6
            </span>
          }>
            Recent Orders
          </PanelHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/30">
                  <th className="px-5 py-2.5 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Order</th>
                  <th className="hidden sm:table-cell px-4 py-2.5 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Customer</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Status</th>
                  <th className="px-5 py-2.5 text-right text-[10px] font-bold text-stone-400 uppercase tracking-widest">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-xs text-stone-400">No orders yet</td>
                  </tr>
                ) : recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-[10px] font-mono font-bold text-indigo-600">{order.id}</p>
                      <p className="text-[10px] text-stone-400 font-mono tabular-nums mt-0.5">
                        {new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3">
                      <p className="text-xs font-semibold text-stone-700 truncate max-w-[120px]">{order.customerName}</p>
                      <p className="text-[10px] text-stone-400 truncate max-w-[120px]">{order.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={order.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-sm font-bold text-stone-900 font-mono tabular-nums">
                        ₹{order.total.toLocaleString('en-IN')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Right column: Stock alerts */}
        <div className="flex flex-col gap-3">

          {/* Inventory Health */}
          <Panel stripe="teal">
            <PanelHeader icon={<Package size={12} />}>Inventory Health</PanelHeader>
            <div className="px-4 py-3 space-y-2.5">
              {/* Health bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Overall Health</span>
                  <span className={cn(
                    'text-sm font-extrabold font-mono tabular-nums',
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

              <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                  { label: 'Available', value: totalInventoryUnits.toLocaleString('en-IN'), color: 'text-stone-800' },
                  { label: 'Low Stock', value: lowStockCount, color: lowStockCount > 0 ? 'text-amber-600' : 'text-stone-800' },
                  { label: 'Out', value: outOfStockCount, color: outOfStockCount > 0 ? 'text-rose-600' : 'text-stone-800' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="px-2 py-2 bg-stone-50 border border-stone-100 rounded-lg text-center">
                    <p className={cn('text-base font-extrabold tabular-nums font-mono', color)}>{value}</p>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Top alerts */}
              {lowStockProducts.slice(0, 3).map(product => (
                <div key={product.id} className="flex items-center justify-between gap-2 px-2 py-1.5 bg-amber-50/60 border border-amber-100 rounded-lg">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-stone-700 truncate">{product.name}</p>
                    <p className="text-[10px] font-mono text-stone-400">{product.variants?.[0]?.sku || '—'}</p>
                  </div>
                  {(() => {
                    const stock = product.variants?.[0]?.warehouseInventories?.reduce((a: number, inv: any) => a + (inv.quantity || 0), 0) ?? 0;
                    return (
                      <span className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ring-1',
                        stock <= 0
                          ? 'bg-rose-50 text-rose-600 ring-rose-200'
                          : 'bg-amber-50 text-amber-700 ring-amber-200'
                      )}>
                        {stock <= 0 ? 'Out' : 'Low'}
                      </span>
                    );
                  })()}
                </div>
              ))}
              {lowStockProducts.length === 0 && (
                <div className="flex items-center gap-2 px-2 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                  <p className="text-xs font-semibold text-emerald-700">All products healthy</p>
                </div>
              )}
            </div>
          </Panel>

        </div>
      </div>

      {/* ─── FOURTH ROW: Daily Orders Bar + Category Revenue ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

        {/* Daily Order Volume */}
        <Panel stripe="violet">
          <PanelHeader icon={<BarChart3 size={12} />}>Daily Order Volume</PanelHeader>
          <div className="px-4 pb-4 pt-3 h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f0ee" />
                <XAxis
                  dataKey="name"
                  axisLine={false} tickLine={false}
                  tick={{ fontSize: 11, fill: '#a8a29e', fontWeight: 600 }}
                />
                <YAxis
                  axisLine={false} tickLine={false}
                  tick={{ fontSize: 11, fill: '#a8a29e', fontWeight: 600 }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="orders"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                  opacity={0.85}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Revenue by Category */}
        <Panel stripe="teal">
          <PanelHeader icon={<Tag size={12} />}>Revenue by Category</PanelHeader>
          <div className="px-4 py-3 space-y-2">
            {categoryRevenue.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-400">No category data yet</div>
            ) : (() => {
              const max = Math.max(...categoryRevenue.map(([, v]) => v));
              return categoryRevenue.map(([cat, value]) => {
                const pct = max > 0 ? Math.round((value / max) * 100) : 0;
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-stone-700 truncate">{cat}</span>
                      <span className="text-xs font-bold text-stone-600 font-mono tabular-nums shrink-0">
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
            {/* Fallback if no order items have category */}
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