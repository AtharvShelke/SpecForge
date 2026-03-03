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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useAdmin } from '@/context/AdminContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageTitle } from '@/components/layout/PageTitle';
import { LogOut } from 'lucide-react';
import { useRouter } from "next/navigation";

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
] as const;

const AdminDashboard: React.FC = () => {
    const {
        activeTab,
        refreshInvoices,
        refreshCustomers,
        refreshBillingProfile,
        refreshCMSVersions,
        refreshOrders,
        refreshReviews
    } = useAdmin();

    React.useEffect(() => {
        const fetchAdminData = async () => {
            await Promise.all([
                refreshInvoices(),
                refreshCustomers(),
                refreshBillingProfile(),
                refreshCMSVersions(),
                refreshOrders(),
                refreshReviews()
            ]);
        };
        fetchAdminData();
    }, [refreshInvoices, refreshCustomers, refreshBillingProfile, refreshCMSVersions, refreshOrders, refreshReviews]);

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
        </div>
    );
};

export default AdminDashboard;
