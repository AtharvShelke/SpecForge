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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useAdmin } from '@/context/AdminContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageTitle } from '@/components/layout/PageTitle';

const ADMIN_TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'orders', label: 'Orders' },
    { key: 'products', label: 'Products' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'categories', label: 'Categories' },
    { key: 'brands', label: 'Brands' },
    { key: 'billing', label: 'Billing & Invoices' },
    { key: 'cms', label: 'CMS' },
] as const;

const AdminDashboard: React.FC = () => {
    const {
        refreshInvoices,
        refreshCustomers,
        refreshBillingProfile,
        refreshCMSVersions,
        refreshOrders,
        refreshReviews
    } = useAdmin();
    const [activeTab, setActiveTab] = useState<
        'overview' | 'products' | 'categories' | 'brands' | 'inventory' | 'orders' | 'billing' | 'cms'
    >('overview');

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
        <PageLayout.Content padding="none" className="min-h-screen bg-transparent">
            <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-3 sm:px-6 lg:px-8 py-4 sm:py-6">

                {/* Header */}
                <div className="flex flex-col gap-3 mb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg font-bold text-zinc-900 tracking-tight heading-font">Admin Dashboard</h1>
                            <p className="text-xs text-zinc-500">Manage catalog, orders, and system settings.</p>
                        </div>
                    </div>

                    {/* Navigation Tabs */}

                    {/* Navigation */}
                    <div className="flex flex-col gap-3">

                        {/* Mobile: Dropdown */}

                        <div className="block md:hidden">
                            <p className="mb-1 text-xs font-medium text-gray-500">
                                Dashboard Section
                            </p>

                            <Select
                                value={activeTab}
                                onValueChange={(value) => setActiveTab(value as any)}
                            >
                                <SelectTrigger
                                    className="h-12 rounded-xl
        border border-gray-200
        bg-white
        px-4
        text-sm font-semibold
        shadow-sm
        focus:ring-2 focus:ring-blue-500
      "
                                >
                                    <SelectValue placeholder="Select section" />
                                </SelectTrigger>

                                <SelectContent
                                    className=" 
        rounded-xl
        border border-gray-200
        bg-white
        shadow-lg
      "
                                >
                                    {ADMIN_TABS.map(tab => (
                                        <SelectItem
                                            key={tab.key}
                                            value={tab.key}
                                            className="cursor-pointer py-3 text-sm"
                                        >
                                            {tab.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>


                        {/* 🖥 Desktop: Tabs */}
                        <div className="hidden md:flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                            {ADMIN_TABS.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key as any)}
                                    className={`
          px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition
          ${activeTab === tab.key
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-600 hover:text-gray-900'}
        `}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>



                    </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <div className="h-full rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                        <div className="h-full overflow-y-auto p-4 sm:p-6">
                            {activeTab === 'overview' && <Overview />}
                            {activeTab === 'orders' && <OrderManager />}
                            {activeTab === 'products' && <ProductManager />}
                            {activeTab === 'inventory' && <InventoryManager />}
                            {activeTab === 'categories' && <CategoryManager />}
                            {activeTab === 'brands' && <BrandManager />}
                            {activeTab === 'billing' && <BillingInvoices />}
                            {activeTab === 'cms' && <CMSManager />}
                        </div>
                    </div>
                </div>

            </div>
        </PageLayout.Content>
    );
};


export default AdminDashboard;
