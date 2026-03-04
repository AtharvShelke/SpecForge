// components/dashboard/AdminSidebar.tsx
'use client';
import React from 'react';
import {
    LayoutDashboard,
    ShoppingBag,
    Package,
    Truck,
    Layers,
    Bookmark,
    CreditCard,
    FileText,
    LogOut,
    Megaphone,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NavItem {
    label: string;
    icon: React.ElementType;
    key: string;
    group?: 'primary' | 'secondary' | 'system';
}

const NAV_ITEMS: NavItem[] = [
    { label: 'Overview', icon: LayoutDashboard, key: 'overview', group: 'primary' },
    { label: 'Orders', icon: ShoppingBag, key: 'orders', group: 'primary' },
    { label: 'Products', icon: Package, key: 'products', group: 'primary' },
    { label: 'Inventory', icon: Layers, key: 'inventory', group: 'primary' },
    { label: 'Procurement', icon: Truck, key: 'procurement', group: 'primary' },
    { label: 'Categories', icon: Bookmark, key: 'categories', group: 'secondary' },
    { label: 'Brands', icon: Bookmark, key: 'brands', group: 'secondary' },
    { label: 'Billing & Invoices', icon: CreditCard, key: 'billing', group: 'secondary' },
    { label: 'CMS', icon: FileText, key: 'cms', group: 'secondary' },
    { label: 'Marketing', icon: Megaphone, key: 'marketing', group: 'secondary' },
];

interface AdminSidebarProps {
    activeTab: string;
    setActiveTab: (tab: any) => void;
    onLogout: () => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
    activeTab,
    setActiveTab,
    isOpen,
    setIsOpen
}) => {
    const renderNavItem = (item: NavItem) => {
        const isActive = activeTab === item.key;
        const Icon = item.icon;

        return (
            <button
                key={item.key}
                onClick={() => {
                    setActiveTab(item.key);
                    if (window.innerWidth < 1024) setIsOpen(false);
                }}
                className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group relative",
                    isActive
                        ? "bg-black text-white shadow-sm"
                        : "text-zinc-500 hover:text-black hover:bg-zinc-100/80"
                )}
            >
                <Icon className={cn(
                    "w-4 h-4 shrink-0 transition-colors duration-200",
                    isActive ? "text-white" : "text-zinc-400 group-hover:text-black"
                )} strokeWidth={isActive ? 2 : 1.5} />
                <span className="tracking-tight">{item.label}</span>
            </button>
        );
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-100 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 h-screen",
                isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
            )}>
                {/* Brand Logo Area */}
                <div className="px-6 h-20 flex items-center gap-3 shrink-0">
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shadow-sm">
                        <Layers className="w-4 h-4 text-white" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-sm font-semibold text-black tracking-tight leading-none">Nexus OS</h1>
                        <p className="text-[11px] text-zinc-400 mt-1 font-medium tracking-wide uppercase">Admin Hub</p>
                    </div>
                    <button
                        className="ml-auto lg:hidden p-2 -mr-2 rounded-full hover:bg-zinc-100 transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        <X className="w-4 h-4 text-zinc-500" />
                    </button>
                </div>

                <ScrollArea className="flex-1">
                    <div className="px-4 py-4 space-y-8">
                        {/* Operations Group */}
                        <div>
                            <p className="px-3 mb-3 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
                                Operations
                            </p>
                            <div className="space-y-1">
                                {NAV_ITEMS.filter(i => i.group === 'primary').map(renderNavItem)}
                            </div>
                        </div>

                        {/* Management Group */}
                        <div>
                            <p className="px-3 mb-3 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
                                Management
                            </p>
                            <div className="space-y-1">
                                {NAV_ITEMS.filter(i => i.group === 'secondary').map(renderNavItem)}
                            </div>
                        </div>
                    </div>
                </ScrollArea>


            </aside>
        </>
    );
};