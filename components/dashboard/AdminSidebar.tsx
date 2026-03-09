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
    Megaphone,
    X,
    Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NavItem {
    label: string;
    icon: React.ElementType;
    key: string;
    group?: 'primary' | 'secondary';
}

const NAV_ITEMS: NavItem[] = [
    { label: 'Overview', icon: LayoutDashboard, key: 'overview', group: 'primary' },
    { label: 'Orders', icon: ShoppingBag, key: 'orders', group: 'primary' },
    { label: 'Products', icon: Package, key: 'products', group: 'primary' },
    { label: 'Inventory', icon: Layers, key: 'inventory', group: 'primary' },
    // { label: 'Procurement', icon: Truck, key: 'procurement', group: 'primary' },
    { label: 'Categories', icon: Tag, key: 'categories', group: 'secondary' },
    { label: 'Brands', icon: Bookmark, key: 'brands', group: 'secondary' },
    { label: 'Saved Builds', icon: Layers, key: 'saved-builds', group: 'secondary' },
    // { label: 'Billing & Invoices', icon: CreditCard, key: 'billing', group: 'secondary' },
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
    setIsOpen,
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
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 group',
                    isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100/80'
                )}
            >
                <Icon
                    className={cn(
                        'w-3.5 h-3.5 shrink-0 transition-colors',
                        isActive ? 'text-white/90' : 'text-stone-400 group-hover:text-stone-700'
                    )}
                    strokeWidth={isActive ? 2.5 : 1.75}
                />
                <span className="tracking-tight truncate">{item.label}</span>
            </button>
        );
    };

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-stone-900/20 backdrop-blur-[2px] z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 w-56 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 h-screen',
                    'bg-white border-r border-stone-100',
                    isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
                )}
            >
                {/* Brand */}
                <div className="px-5 h-[60px] flex items-center gap-3 shrink-0 border-b border-stone-100">
                    <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                        <Layers className="w-3.5 h-3.5 text-white" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-sm font-bold text-stone-900 tracking-tight leading-none">Nexus OS</h1>
                        <p className="text-[10px] text-stone-400 mt-0.5 font-bold tracking-[0.12em] uppercase">Admin Hub</p>
                    </div>
                    <button
                        className="ml-auto lg:hidden p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        <X className="w-3.5 h-3.5 text-stone-400" />
                    </button>
                </div>

                <ScrollArea className="flex-1">
                    <div className="px-3 py-4 space-y-5">

                        {/* Operations group */}
                        <div>
                            <p className="px-3 mb-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em]">
                                Operations
                            </p>
                            <div className="space-y-0.5">
                                {NAV_ITEMS.filter(i => i.group === 'primary').map(renderNavItem)}
                            </div>
                        </div>

                        <div className="mx-3 h-px bg-stone-100" />

                        {/* Management group */}
                        <div>
                            <p className="px-3 mb-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em]">
                                Management
                            </p>
                            <div className="space-y-0.5">
                                {NAV_ITEMS.filter(i => i.group === 'secondary').map(renderNavItem)}
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                {/* Version tag */}
                <div className="px-5 py-3 border-t border-stone-100 shrink-0">
                    <p className="text-[10px] font-mono text-stone-300 tabular-nums">v1.0.0 · Admin</p>
                </div>
            </aside>
        </>
    );
};