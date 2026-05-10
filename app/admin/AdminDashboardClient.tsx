'use client';

import { lazy, memo } from 'react';
import { useSearchParams } from 'next/navigation';
import { getAdminTab } from '@/components/admin/adminTabs';

const Overview = lazy(() => import('@/components/dashboard/Overview'));
const OrderManager = lazy(() => import('@/components/dashboard/OrderManager'));
const ProductManager = lazy(() => import('@/components/dashboard/ProductManager'));
const InventoryManager = lazy(() => import('@/components/dashboard/InventoryManager'));
const CategoryManager = lazy(() => import('@/components/dashboard/CategoryManager'));
const BrandManager = lazy(() => import('@/components/dashboard/BrandManager'));
const SavedBuildsManager = lazy(() => import('@/components/dashboard/SavedBuildsManager'));
// const BillingInvoices = lazy(() => import('@/components/dashboard/BillingInvoices'));

const AdminDashboardClient = memo(function AdminDashboardClient() {
  const searchParams = useSearchParams();
  const activeTab = getAdminTab(searchParams.get('tab'));

  return (
    <div className="space-y-5">
      {activeTab === 'overview' && <Overview />}
      {activeTab === 'orders' && <OrderManager />}
      {activeTab === 'products' && <ProductManager />}
      {activeTab === 'inventory' && <InventoryManager />}
      {activeTab === 'categories' && <CategoryManager />}
      {activeTab === 'brands' && <BrandManager />}
      {activeTab === 'saved-builds' && <SavedBuildsManager />}
      {/* {activeTab === 'billing' && <BillingInvoices />} */}
    </div>
  );
});

export default AdminDashboardClient;
