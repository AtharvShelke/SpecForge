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
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const Overview = () => {
  const { products } = useShop();
  const { reviews, orders } = useAdmin();

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING).length;
  const lowStockProducts = products.filter(p => p.variants?.[0]?.status === 'LOW_STOCK' || p.variants?.[0]?.status === 'OUT_OF_STOCK');
  const pendingReviews = reviews.filter(r => r.status === 'PENDING');

  const salesData = [
    { name: 'Mon', sales: 40000 },
    { name: 'Tue', sales: 30000 },
    { name: 'Wed', sales: 20000 },
    { name: 'Thu', sales: 27800 },
    { name: 'Fri', sales: 18900 },
    { name: 'Sat', sales: 23900 },
    { name: 'Sun', sales: 34900 },
  ];

  const avgDailySales =
    salesData.reduce((sum, day) => sum + day.sales, 0) / salesData.length;
  const todaySales = salesData[salesData.length - 1].sales;
  const salesTrend = todaySales > avgDailySales ? 'up' : 'down';
  const salesTrendPct = Math.abs(
    ((todaySales - avgDailySales) / avgDailySales) * 100
  ).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">Dashboard Overview</h2>
        <p className="text-sm text-muted-foreground">
          Monitor store performance and operational health
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </div>
            <Badge variant="secondary" className="mt-2 text-green-600">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              +12% from last month
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Orders
            </CardTitle>
            <ClipboardList className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting fulfillment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockProducts.length}</div>
            <Badge
              variant="secondary"
              className={`mt-2 ${lowStockProducts.length > 0
                ? 'text-red-600'
                : 'text-green-600'
                }`}
            >
              {lowStockProducts.length > 0
                ? 'Reorder required'
                : 'All healthy'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Store Traffic
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,240</div>
            <Badge variant="secondary" className="mt-2 text-purple-600">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              +5% this week
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Sales</CardTitle>
            <CardDescription>
              Revenue trend over the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v?: number) => [
                    v ? `₹${v.toLocaleString('en-IN')}` : '₹0',
                    'Sales',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#2563eb"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Low Stock */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Low Stock Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent className="space-y-3">
              {lowStockProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">
                  All stock levels are healthy
                </p>
              ) : (
                lowStockProducts.slice(0, 5).map(product => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.variants?.[0]?.sku || ''}
                      </p>
                    </div>
                    <Badge variant="destructive">
                      {product.variants?.[0]?.status?.replace(/_/g, ' ') || 'Check stock'}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pending Reviews</CardTitle>
              <Star className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-center">
                {pendingReviews.length}
              </div>
              <p className="text-sm text-muted-foreground text-center mt-1">
                Awaiting moderation
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Overview;
