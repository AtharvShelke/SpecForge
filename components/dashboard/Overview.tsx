'use client';

import React from 'react';
import { useShop } from '@/context/ShopContext';
import { useAdmin } from '@/context/AdminContext';
import { OrderStatus } from '@/types';
import {
  AlertTriangle,
  ClipboardList,
  DollarSign,
  TrendingUp,
  Package,
  Star,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const Overview = () => {
  const { products } = useShop();
  const { reviews, orders } = useAdmin();

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING).length;
  const lowStockProducts = products.filter(p => p.variants?.[0]?.status === 'LOW_STOCK' || p.variants?.[0]?.status === 'OUT_OF_STOCK');
  const pendingReviews = reviews.filter(r => r.status === 'PENDING');

  const salesData = [
    { name: 'Mon', sales: 42000 },
    { name: 'Tue', sales: 35000 },
    { name: 'Wed', sales: 28000 },
    { name: 'Thu', sales: 31000 },
    { name: 'Fri', sales: 22000 },
    { name: 'Sat', sales: 29000 },
    { name: 'Sun', sales: 38000 },
  ];

  const avgDailySales =
    salesData.reduce((sum, day) => sum + day.sales, 0) / salesData.length;
  const todaySales = salesData[salesData.length - 1].sales;
  const salesTrendPct = Math.abs(
    ((todaySales - avgDailySales) / avgDailySales) * 100
  ).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Dashboard Overview</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            Real-time operational metrics and performance data
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Total Revenue",
            value: `₹${totalRevenue.toLocaleString('en-IN')}`,
            icon: DollarSign,
            trend: todaySales >= avgDailySales ? "up" : "down",
            trendValue: `${salesTrendPct}%`,
            iconColor: "text-emerald-600",
            iconBg: "bg-emerald-50",
          },
          {
            title: "Pending Orders",
            value: pendingOrders,
            icon: ClipboardList,
            trend: "neutral",
            trendValue: "",
            iconColor: "text-zinc-600",
            iconBg: "bg-zinc-100",
          },
          {
            title: "Low Stock Items",
            value: lowStockProducts.length,
            icon: AlertTriangle,
            trend: lowStockProducts.length > 0 ? "down" : "up",
            trendValue: lowStockProducts.length > 0 ? "Reorder needed" : "All stocked",
            iconColor: lowStockProducts.length > 0 ? "text-amber-600" : "text-emerald-600",
            iconBg: lowStockProducts.length > 0 ? "bg-amber-50" : "bg-emerald-50",
          },
          {
            title: "Active Users",
            value: "1.2k",
            icon: TrendingUp,
            trend: "up",
            trendValue: "+12%",
            iconColor: "text-indigo-600",
            iconBg: "bg-indigo-50",
          }
        ].map((stat, i) => (
          <Card key={i} className="border-zinc-200 rounded-lg shadow-sm bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-zinc-500">{stat.title}</span>
                <div className={cn("p-2 rounded-md", stat.iconBg)}>
                  <stat.icon size={16} className={stat.iconColor} />
                </div>
              </div>
              <div className="text-2xl font-semibold text-zinc-900 tabular-nums">{stat.value}</div>
              {stat.trendValue && (
                <div className="flex items-center gap-1 mt-1.5">
                  {stat.trend === 'up' && <ArrowUpRight size={14} className="text-emerald-600" />}
                  {stat.trend === 'down' && <ArrowDownRight size={14} className="text-red-500" />}
                  <span className={cn(
                    "text-xs font-medium",
                    stat.trend === 'up' ? "text-emerald-600" : stat.trend === 'down' ? "text-red-500" : "text-zinc-400"
                  )}>
                    {stat.trendValue}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 border-zinc-200 rounded-lg shadow-sm bg-white">
          <CardHeader className="px-5 py-4 border-b border-zinc-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                  <TrendingUp size={16} className="text-zinc-500" />
                  Revenue Trend
                </CardTitle>
                <p className="text-xs text-zinc-500 mt-1">7-day performance</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fontWeight: 500, fill: '#71717a' }}
                  dy={12}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`}
                  tick={{ fontSize: 12, fontWeight: 500, fill: '#71717a' }}
                />
                <Tooltip
                  cursor={{ stroke: '#e4e4e7', strokeWidth: 1 }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e4e4e7', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '10px 14px' }}
                  labelStyle={{ fontWeight: 600, fontSize: '12px', color: '#18181b', marginBottom: '4px' }}
                  itemStyle={{ fontSize: '13px', fontWeight: 500, color: '#3f3f46', padding: '0' }}
                  formatter={(v?: number) => [
                    v ? `₹${v.toLocaleString('en-IN')}` : '₹0',
                    'Revenue',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ r: 0 }}
                  activeDot={{ r: 5, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
                  animationDuration={1000}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Low Stock List */}
          <Card className="border-zinc-200 rounded-lg shadow-sm bg-white">
            <CardHeader className="px-5 py-4 border-b border-zinc-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-zinc-900">Stock Alerts</CardTitle>
                <AlertTriangle size={14} className="text-amber-500" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[240px]">
                {lowStockProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <Package size={24} className="text-zinc-300 mb-2" />
                    <p className="text-sm text-zinc-400">All items in stock</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {lowStockProducts.map(product => (
                      <div
                        key={product.id}
                        className="px-5 py-3 flex items-center justify-between hover:bg-zinc-50 transition-colors duration-150"
                      >
                        <div className="min-w-0 pr-3">
                          <p className="text-sm font-medium text-zinc-900 truncate">{product.name}</p>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            SKU: {product.variants?.[0]?.sku || '—'}
                          </p>
                        </div>
                        <span className={cn(
                          "text-xs font-medium px-2 py-1 rounded-md whitespace-nowrap",
                          product.variants?.[0]?.status === 'OUT_OF_STOCK'
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700"
                        )}>
                          {product.variants?.[0]?.status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Reviews Summary */}
          <Card className="border-zinc-200 rounded-lg shadow-sm bg-white">
            <CardContent className="p-5">
              <div className="flex items-center gap-1 mb-3 text-amber-500">
                {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} fill="currentColor" />)}
              </div>
              <div className="text-2xl font-semibold text-zinc-900 tabular-nums">
                {pendingReviews.length}
              </div>
              <p className="text-sm text-zinc-500 mt-1">Pending reviews</p>
              <div className="grid grid-cols-2 gap-4 pt-4 mt-4 border-t border-zinc-100">
                <div>
                  <p className="text-xs text-zinc-400">Avg. Rating</p>
                  <p className="text-sm font-semibold text-zinc-900 mt-0.5">4.8 / 5.0</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-400">This week</p>
                  <p className="text-sm font-semibold text-emerald-600 mt-0.5">+12</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Overview;
