'use client';

import React, { Suspense } from 'react';
import { useAdmin } from '@/context/AdminContext';

import Overview           from '@/components/dashboard/Overview';
import OrderManager        from '@/components/dashboard/OrderManager';
import ProductManager      from '@/components/dashboard/ProductManager';
import InventoryManager    from '@/components/dashboard/InventoryManager';
import ProcurementManager  from '@/components/dashboard/ProcurementManager';
import CategoryManager     from '@/components/dashboard/CategoryManager';
import BrandManager        from '@/components/dashboard/BrandManager';
import BillingInvoices     from '@/components/dashboard/BillingInvoices';
import CMSManager          from '@/components/dashboard/CMSManager';
import { MarketingManager } from '@/components/dashboard/MarketingManager';

// ── Loading skeleton ──────────────────────────────────────────
const TabSkeleton = () => (
    <div
        className="space-y-4 animate-pulse"
        style={{ fontFamily: "'DM Sans', 'Geist', 'system-ui', sans-serif" }}
    >
        <div className="h-5 w-36 bg-stone-200 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-stone-200 rounded-xl" />
            ))}
        </div>
        <div className="h-64 bg-stone-200 rounded-xl" />
    </div>
);

// ── Inner content (needs searchParams, wrapped in Suspense) ──
const AdminDashboardContent: React.FC = () => {
    const { activeTab } = useAdmin();

    return (
        <div className="space-y-5">
            {activeTab === 'overview'    && <Overview />}
            {activeTab === 'orders'      && <OrderManager />}
            {activeTab === 'products'    && <ProductManager />}
            {activeTab === 'inventory'   && <InventoryManager />}
            {activeTab === 'procurement' && <ProcurementManager />}
            {activeTab === 'categories'  && <CategoryManager />}
            {activeTab === 'brands'      && <BrandManager />}
            {activeTab === 'billing'     && <BillingInvoices />}
            {activeTab === 'cms'         && <CMSManager />}
            {activeTab === 'marketing'   && <MarketingManager />}
        </div>
    );
};

// ── Default export ────────────────────────────────────────────
const AdminDashboard: React.FC = () => (
    <Suspense fallback={<TabSkeleton />}>
        <AdminDashboardContent />
    </Suspense>
);

export default AdminDashboard;