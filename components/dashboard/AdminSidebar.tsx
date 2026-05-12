// components/dashboard/AdminSidebar.tsx
'use client';
import React, { memo, useCallback } from 'react';
import {
    LayoutDashboard,
    ShoppingBag,
    Package,
    Layers,
    Tag,
    Bookmark,
    Megaphone,
    X,
    CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

interface NavItem {
    label: string;
    icon: React.ElementType;
    key: string;
    group?: 'primary' | 'secondary';
}

// Defined outside component — never reallocated on render
const NAV_ITEMS: NavItem[] = [
    { label: 'Overview',     icon: LayoutDashboard, key: 'overview',     group: 'primary'   },
    { label: 'Orders',       icon: ShoppingBag,     key: 'orders',       group: 'primary'   },
    { label: 'Products',     icon: Package,         key: 'products',     group: 'primary'   },
    { label: 'Inventory',    icon: Layers,          key: 'inventory',    group: 'primary'   },
    { label: 'Categories',   icon: Tag,             key: 'categories',   group: 'secondary' },
    { label: 'Brands',       icon: Bookmark,        key: 'brands',       group: 'secondary' },
    { label: 'Saved Builds', icon: Layers,          key: 'saved-builds', group: 'secondary' },
    { label: 'Builder Config', icon: LayoutDashboard, key: 'builder-config', group: 'secondary' },
];

// Pre-split at module load — .filter() never runs inside the component
const PRIMARY_NAV   = NAV_ITEMS.filter(i => i.group === 'primary');
const SECONDARY_NAV = NAV_ITEMS.filter(i => i.group === 'secondary');

interface AdminSidebarProps {
    activeTab: string;
    setActiveTab: (tab: any) => void;
    onLogout: () => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

/* ─── Single nav button — memo prevents re-render of unchanged items ──────── */
interface NavButtonProps {
    item: NavItem;
    isActive: boolean;
    onClick: (key: string) => void;
}

const NavButton = memo<NavButtonProps>(({ item, isActive, onClick }) => {
    const Icon = item.icon;
    // Stable per-item handler — only re-created when `onClick` identity changes
    const handleClick = useCallback(() => onClick(item.key), [item.key, onClick]);

    return (
        <button
            onClick={handleClick}
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
});
NavButton.displayName = 'NavButton';

/* ─── Sidebar ─────────────────────────────────────────────────────────────── */
export const AdminSidebar = memo<AdminSidebarProps>(({
    activeTab,
    setActiveTab,
    isOpen,
    setIsOpen,
}) => {
    // Stable callback — closes sidebar on mobile after navigation
    const handleNavClick = useCallback((key: string) => {
        setActiveTab(key);
        if (window.innerWidth < 1024) setIsOpen(false);
    }, [setActiveTab, setIsOpen]);

    const handleOverlayClick = useCallback(() => setIsOpen(false), [setIsOpen]);

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-stone-900/20 backdrop-blur-[2px] z-40 lg:hidden"
                    onClick={handleOverlayClick}
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
                    <Link href="/"  className="min-w-0">
                        <h1 className="text-sm font-bold text-stone-900 tracking-tight leading-none">SpecForge</h1>
                        <p className="text-[10px] text-stone-400 mt-0.5 font-bold tracking-[0.12em] uppercase">Admin Hub</p>
                    </Link>
                    <button
                        className="ml-auto lg:hidden p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
                        onClick={handleOverlayClick}
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
                                {PRIMARY_NAV.map(item => (
                                    <NavButton
                                        key={item.key}
                                        item={item}
                                        isActive={activeTab === item.key}
                                        onClick={handleNavClick}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="mx-3 h-px bg-stone-100" />

                        {/* Management group */}
                        <div>
                            <p className="px-3 mb-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em]">
                                Management
                            </p>
                            <div className="space-y-0.5">
                                {SECONDARY_NAV.map(item => (
                                    <NavButton
                                        key={item.key}
                                        item={item}
                                        isActive={activeTab === item.key}
                                        onClick={handleNavClick}
                                    />
                                ))}
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
});
AdminSidebar.displayName = 'AdminSidebar';