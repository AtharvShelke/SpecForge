// app/admin/layout.tsx
'use client';

import React, { useState } from 'react';
import { AdminProvider, useAdmin } from "@/context/AdminContext";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { AdminHeader } from "@/components/dashboard/AdminHeader";
import { useRouter } from "next/navigation";

function AdminShell({ children }: { children: React.ReactNode }) {
    const { activeTab, setActiveTab } = useAdmin();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const router = useRouter();

    async function handleLogout() {
        await fetch("/api/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
    }

    const tabLabels: Record<string, string> = {
        overview: 'Overview',
        orders: 'Orders',
        products: 'Products',
        inventory: 'Inventory',
        procurement: 'Procurement',
        categories: 'Categories',
        brands: 'Brands',
        billing: 'Billing & Invoices',
        cms: 'CMS',
    };

    return (
        <div className="flex h-screen bg-[#FDFDFD] overflow-hidden selection:bg-black selection:text-white font-sans antialiased">
            <AdminSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onLogout={handleLogout}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
            />

            <div className="flex-1 flex flex-col min-w-0 relative">
                <AdminHeader
                    onLogout={handleLogout}
                    onMenuClick={() => setIsSidebarOpen(true)}
                    title={tabLabels[activeTab] || 'Admin Dashboard'}
                />

                <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#FDFDFD]">
                    <div className="p-8 max-w-[1400px] mx-auto 2xl:max-w-[1600px] transition-all duration-300">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AdminProvider>
            <AdminShell>
                {children}
            </AdminShell>
        </AdminProvider>
    );
}