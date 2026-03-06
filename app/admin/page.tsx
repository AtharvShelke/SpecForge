'use client'
import React, { useState } from 'react';
import OrderManager from '@/components/dashboard/OrderManager';
import InventoryManager from '@/components/dashboard/InventoryManager';
import ProductManager from '@/components/dashboard/ProductManager';
import BrandManager from '@/components/dashboard/BrandManager';
import CategoryManager from '@/components/dashboard/CategoryManager';
import Overview from '@/components/dashboard/Overview';
import BillingInvoices from '@/components/dashboard/BillingInvoices';
import CMSManager from '@/components/dashboard/CMSManager';
import ProcurementManager from '@/components/dashboard/ProcurementManager';
import { MarketingManager } from '@/components/dashboard/MarketingManager';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useAdmin } from '@/context/AdminContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageTitle } from '@/components/layout/PageTitle';
import { LogOut } from 'lucide-react';
import { useRouter, useSearchParams } from "next/navigation";

const ADMIN_TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'orders', label: 'Orders' },
    { key: 'products', label: 'Products' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'procurement', label: 'Procurement' },
    { key: 'categories', label: 'Categories' },
    { key: 'brands', label: 'Brands' },
    { key: 'billing', label: 'Billing & Invoices' },
    { key: 'cms', label: 'CMS' },
    { key: 'marketing', label: 'Marketing' },
] as const;

import { Suspense } from 'react';

const AdminDashboard: React.FC = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AdminDashboardContent />
        </Suspense>
    );
};

const AdminDashboardContent: React.FC = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const {
        activeTab,
        setActiveTab,
        refreshInvoices,
        refreshCustomers,
        refreshBillingProfile,
        refreshCMSVersions,
        refreshOrders,
        refreshReviews
    } = useAdmin();

    // Data fetching is now handled correctly via lazy loading in AdminContext.tsx 
    // depending on the `activeTab`.

    return (
        <div className="space-y-6">
            {activeTab === 'overview' && <Overview />}
            {activeTab === 'orders' && <OrderManager />}
            {activeTab === 'products' && <ProductManager />}
            {activeTab === 'inventory' && <InventoryManager />}
            {activeTab === 'procurement' && <ProcurementManager />}
            {activeTab === 'categories' && <CategoryManager />}
            {activeTab === 'brands' && <BrandManager />}
            {activeTab === 'billing' && <BillingInvoices />}
            {activeTab === 'cms' && <CMSManager />}
            {activeTab === 'marketing' && <MarketingManager />}
        </div>
    );
};

export default AdminDashboard;
