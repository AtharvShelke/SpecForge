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
    X,
    Settings,
    User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
    onLogout,
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
                    "w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors duration-150 relative",
                    isActive
                        ? "bg-white/10 text-white"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                )}
            >
                {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-indigo-500 rounded-r-sm" />
                )}
                <Icon className={cn(
                    "w-4 h-4 shrink-0",
                    isActive ? "text-indigo-400" : "text-zinc-500"
                )} />
                <span>{item.label}</span>
            </button>
        );
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-200"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-60 bg-zinc-900 border-r border-zinc-800 flex flex-col transition-transform duration-200 ease-out lg:static lg:translate-x-0 h-screen",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Brand */}
                <div className="px-4 h-14 flex items-center gap-3 border-b border-zinc-800 shrink-0">
                    <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center">
                        <Layers className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-sm font-semibold text-white leading-none">Nexus Admin</h1>
                        <p className="text-[11px] text-zinc-500 mt-0.5">v2.4.0</p>
                    </div>
                    <button
                        className="ml-auto lg:hidden p-1 rounded hover:bg-zinc-800 transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        <X className="w-4 h-4 text-zinc-400" />
                    </button>
                </div>

                <ScrollArea className="flex-1">
                    <div className="px-3 py-4 space-y-6">
                        {/* Operations */}
                        <div>
                            <p className="px-3 mb-2 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Operations</p>
                            <div className="space-y-0.5">
                                {NAV_ITEMS.filter(i => i.group === 'primary').map(renderNavItem)}
                            </div>
                        </div>

                        {/* Management */}
                        <div>
                            <p className="px-3 mb-2 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Management</p>
                            <div className="space-y-0.5">
                                {NAV_ITEMS.filter(i => i.group === 'secondary').map(renderNavItem)}
                            </div>
                        </div>

                        {/* Configuration */}
                        <div>
                            <p className="px-3 mb-2 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Configuration</p>
                            <div className="space-y-0.5">
                                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors duration-150">
                                    <Settings className="w-4 h-4 text-zinc-500" />
                                    Settings
                                </button>
                                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors duration-150">
                                    <User className="w-4 h-4 text-zinc-500" />
                                    Access Control
                                </button>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                {/* Account Footer */}
                <div className="p-3 mt-auto shrink-0 border-t border-zinc-800">
                    <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-md bg-zinc-800/50">
                        <div className="w-8 h-8 rounded-md bg-zinc-700 flex items-center justify-center">
                            <User className="w-4 h-4 text-zinc-300" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium text-zinc-200 truncate">Admin</p>
                            <p className="text-[11px] text-zinc-500 truncate">Administrator</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full h-9 justify-center gap-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 text-[13px] font-medium rounded-md transition-colors duration-150"
                        onClick={onLogout}
                    >
                        <LogOut className="w-4 h-4" />
                        Log out
                    </Button>
                </div>
            </aside>
        </>
    );
};
