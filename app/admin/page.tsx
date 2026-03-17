// app/admin/page.tsx
'use client';

import { lazy, Suspense, memo, type ReactNode } from 'react';
import { useAdmin } from '@/context/AdminContext';

// ── Lazy-loaded tab components ────────────────────────────────────────────────
// Each tab becomes its own JS chunk — only downloaded when first visited.

const Overview           = lazy(() => import('@/components/dashboard/Overview'));
const OrderManager       = lazy(() => import('@/components/dashboard/OrderManager'));
const ProductManager     = lazy(() => import('@/components/dashboard/ProductManager'));
const InventoryManager   = lazy(() => import('@/components/dashboard/InventoryManager'));
const CategoryManager    = lazy(() => import('@/components/dashboard/CategoryManager'));
const BrandManager       = lazy(() => import('@/components/dashboard/BrandManager'));
const SavedBuildsManager = lazy(() => import('@/components/dashboard/SavedBuildsManager'));
const BillingInvoices    = lazy(() => import('@/components/dashboard/BillingInvoices'));
const MarketingManager   = lazy(() => import('@/components/dashboard/MarketingManager'));

// ── Constants ─────────────────────────────────────────────────────────────────

// Pre-built skeleton keys — avoids Array(4) allocation on every render
const SKELETON_KEYS = [0, 1, 2, 3] as const;

const SKELETON_STYLE = {
    fontFamily: "'DM Sans', 'Geist', 'system-ui', sans-serif",
} as const;

// ── TabSkeleton ───────────────────────────────────────────────────────────────

const TabSkeleton = memo(function TabSkeleton() {
    return (
        <div className="space-y-4 animate-pulse" style={SKELETON_STYLE}>
            <div className="h-5 w-36 bg-stone-200 rounded-lg" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {SKELETON_KEYS.map(i => (
                    <div key={i} className="h-24 bg-stone-200 rounded-xl" />
                ))}
            </div>
            <div className="h-64 bg-stone-200 rounded-xl" />
        </div>
    );
});

// ── AdminDashboardContent ─────────────────────────────────────────────────────

const AdminDashboardContent = memo(function AdminDashboardContent() {
    const { activeTab } = useAdmin();

    return (
        <div className="space-y-5">
            {activeTab === 'overview'     && <Overview />}
            {activeTab === 'orders'       && <OrderManager />}
            {activeTab === 'products'     && <ProductManager />}
            {activeTab === 'inventory'    && <InventoryManager />}
            {activeTab === 'categories'   && <CategoryManager />}
            {activeTab === 'brands'       && <BrandManager />}
            {activeTab === 'saved-builds' && <SavedBuildsManager />}
            {activeTab === 'billing'      && <BillingInvoices />}
            {activeTab === 'marketing'    && <MarketingManager />}
        </div>
    );
});

// ── AdminDashboard ────────────────────────────────────────────────────────────

const AdminDashboard = memo(function AdminDashboard() {
    return (
        <Suspense fallback={<TabSkeleton />}>
            <AdminDashboardContent />
        </Suspense>
    );
});

export default AdminDashboard;