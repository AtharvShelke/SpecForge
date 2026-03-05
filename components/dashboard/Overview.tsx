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
  const lowStockProducts = products.filter(
    p =>
      p.variants?.[0]?.status === 'LOW_STOCK' ||
      p.variants?.[0]?.status === 'OUT_OF_STOCK'
  );
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
    salesData.reduce((sum, day) => sum + day.sales, 0) /
    salesData.length;

  const todaySales = salesData[salesData.length - 1].sales;

  const salesTrendPct = Math.abs(
    ((todaySales - avgDailySales) / avgDailySales) * 100
  ).toFixed(1);

  const isUp = todaySales >= avgDailySales;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Overview
        </h1>
        <p className="text-sm text-neutral-500 mt-2">
          Operational performance and real-time business metrics.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            title: "Revenue",
            value: `₹${totalRevenue.toLocaleString('en-IN')}`,
            trend: isUp ? "up" : "down",
            trendValue: `${salesTrendPct}% vs avg`,
            icon: DollarSign,
          },
          {
            title: "Pending Orders",
            value: pendingOrders,
            trend: null,
            trendValue: null,
            icon: ClipboardList,
          },
          {
            title: "Stock Alerts",
            value: lowStockProducts.length,
            trend: lowStockProducts.length > 0 ? "down" : "up",
            trendValue:
              lowStockProducts.length > 0
                ? "Action required"
                : "Healthy",
            icon: AlertTriangle,
          },
          {
            title: "Pending Reviews",
            value: pendingReviews.length,
            trend: null,
            trendValue: null,
            icon: Star,
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm"
          >
            <CardContent className="p-5 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-neutral-500">
                  {stat.title}
                </span>
                <stat.icon size={16} className="text-neutral-400" />
              </div>

              <div className="text-2xl font-bold tracking-tight text-neutral-900 tabular-nums">
                {stat.value}
              </div>

              {stat.trendValue && (
                <div className="flex items-center gap-1 mt-3 text-xs font-medium">
                  {stat.trend === 'up' && (
                    <ArrowUpRight size={14} className="text-emerald-600" />
                  )}
                  {stat.trend === 'down' && (
                    <ArrowDownRight size={14} className="text-red-500" />
                  )}
                  <span
                    className={cn(
                      stat.trend === 'up'
                        ? "text-emerald-600"
                        : "text-red-500"
                    )}
                  >
                    {stat.trendValue}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + Right Column */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <Card className="xl:col-span-2 rounded-2xl border border-neutral-200/60 bg-white shadow-sm">
          <CardHeader className="px-5 pt-5 pb-0">
            <CardTitle className="text-base font-semibold tracking-tight text-neutral-900 flex items-center gap-2">
              <TrendingUp size={16} className="text-neutral-400" />
              Revenue Trend
            </CardTitle>
            <p className="text-xs text-neutral-500 mt-1">
              Last 7 days performance
            </p>
          </CardHeader>

          <CardContent className="p-5 pt-3 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 12,
                    fill: '#6b7280',
                    fontWeight: 500,
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`}
                  tick={{
                    fontSize: 12,
                    fill: '#6b7280',
                    fontWeight: 500,
                  }}
                />
                <Tooltip
                  cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
                  }}
                  formatter={(v?: number) => [
                    v ? `₹${v.toLocaleString('en-IN')}` : '₹0',
                    'Revenue',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#0f172a"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 6,
                    fill: '#0f172a',
                    stroke: '#fff',
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Stock Alerts */}
          <Card className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm">
            <CardHeader className="px-5 pt-5 pb-2">
              <CardTitle className="text-base font-semibold tracking-tight text-neutral-900">
                Stock Alerts
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="h-[250px]">
                {lowStockProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                    <Package size={28} className="text-neutral-300 mb-3" />
                    <p className="text-sm text-neutral-500">
                      All products are sufficiently stocked.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100">
                    {lowStockProducts.map(product => (
                      <div
                        key={product.id}
                        className="px-5 py-3 flex items-center justify-between hover:bg-neutral-50 transition-colors border-b border-neutral-50 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-neutral-900">
                            {product.name}
                          </p>
                          <p className="text-xs text-neutral-400 mt-1">
                            SKU: {product.variants?.[0]?.sku || '—'}
                          </p>
                        </div>

                        <span className={cn(
                          "text-xs font-medium px-3 py-1 rounded-full",
                          product.variants?.[0]?.status === 'OUT_OF_STOCK'
                            ? "bg-red-50 text-red-600"
                            : "bg-amber-50 text-amber-600"
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
        </div>
      </div >
    </div >
  );
};

export default Overview;