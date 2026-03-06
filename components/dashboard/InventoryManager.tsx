'use client';

import React, { useState, useMemo, useEffect, FormEvent } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { StockMovementType } from '@/types';
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    DollarSign,
    Package,
    Search,
    X,
    TrendingDown,
    TrendingUp,
    Filter,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    MoveHorizontal,
    MoreVertical,
    History,
    Warehouse,
    BarChart3,
    ShieldAlert,
    Zap,
    Clock,
    Tag,
} from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { WarehouseInventory, Category } from '@/types';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useDebounce } from '@/hooks/useDebounce';

// ─────────────────────────────────────────────────────────────
// SHARED PRIMITIVES (matches OrderManager aesthetic)
// ─────────────────────────────────────────────────────────────

const SectionLabel = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="flex items-center gap-1.5">
        <span className="text-stone-400">{icon}</span>
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em]">{children}</span>
    </div>
);

const StockBadge = ({ qty, reorderLevel }: { qty: number; reorderLevel: number }) => {
    if (qty === 0) return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-rose-50 text-rose-600 ring-1 ring-rose-200">
            <span className="w-1 h-1 rounded-full bg-current opacity-60" /> Out of Stock
        </span>
    );
    if (qty <= reorderLevel) return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-50 text-amber-700 ring-1 ring-amber-200">
            <span className="w-1 h-1 rounded-full bg-current opacity-60" /> Low Stock
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
            <span className="w-1 h-1 rounded-full bg-current opacity-60" /> Optimal
        </span>
    );
};

const MovTypeBadge = ({ type }: { type: string }) => {
    const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
        INWARD:     { label: 'Inward',      cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', icon: <ArrowDownRight size={10} /> },
        OUTWARD:    { label: 'Outward',     cls: 'bg-rose-50 text-rose-600 ring-1 ring-rose-200',         icon: <ArrowUpRight size={10} /> },
        ADJUSTMENT: { label: 'Adjustment',  cls: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',   icon: <RefreshCw size={10} /> },
        TRANSFER:   { label: 'Transfer',    cls: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',   icon: <MoveHorizontal size={10} /> },
    };
    const cfg = map[type] ?? { label: type, cls: 'bg-stone-100 text-stone-600 ring-1 ring-stone-200', icon: null };
    return (
        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest', cfg.cls)}>
            {cfg.icon} {cfg.label}
        </span>
    );
};

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
const InventoryManager = () => {
    const { inventory, stockMovements, adjustStock, transferStock } = useAdmin();

    const [adjustmentModal, setAdjustmentModal] = useState<{
        isOpen: boolean; sku: string; currentQty: number;
    } | null>(null);

    const [transferModal, setTransferModal] = useState<{
        isOpen: boolean; sku: string; variantId: string; sourceWarehouseId: string; currentQty: number;
    } | null>(null);

    const [transferTarget, setTransferTarget] = useState<string>('');
    const [transferQty, setTransferQty] = useState<number>(0);
    const [transferReason, setTransferReason] = useState<string>('');
    const [adjType, setAdjType] = useState<StockMovementType>('INWARD');
    const [adjQty, setAdjQty] = useState(0);
    const [adjReason, setAdjReason] = useState('');

    const [auditLogModal, setAuditLogModal] = useState(false);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [isLoadingAudit, setIsLoadingAudit] = useState(false);

    const openAuditLog = async () => {
        setAuditLogModal(true);
        setIsLoadingAudit(true);
        try {
            const res = await fetch('/api/audit-logs');
            if (res.ok) setAuditLogs(await res.json());
        } catch (e) { console.error(e); }
        finally { setIsLoadingAudit(false); }
    };

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [paginatedInventory, setPaginatedInventory] = useState<WarehouseInventory[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoadingInventory, setIsLoadingInventory] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(false);

    const currentPage = parseInt(searchParams.get("page") || "1", 10);
    const currentLimit = parseInt(searchParams.get("limit") || "10", 10);
    const currentCategory = searchParams.get("category") || "all";
    const currentSearch = searchParams.get("q") || "";
    const currentStockStatus = searchParams.get("f_stock_status") || "all";

    const [searchTerm, setSearchTerm] = useState(currentSearch);
    useEffect(() => { setSearchTerm(currentSearch); }, [currentSearch]);

    const debouncedSearch = useDebounce(searchTerm, 500);
    useEffect(() => {
        if (debouncedSearch !== currentSearch) updateQueryParams({ q: debouncedSearch });
    }, [debouncedSearch]);

    useEffect(() => {
        const fetchPaginatedInventory = async () => {
            setIsLoadingInventory(true);
            try {
                const query = new URLSearchParams(searchParams.toString());
                if (!query.has("limit")) query.set("limit", "10");
                if (!query.has("page")) query.set("page", "1");
                const res = await fetch(`/api/inventory?${query.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    setPaginatedInventory(Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : []));
                    setTotalItems(data.total || 0);
                } else { setPaginatedInventory([]); setTotalItems(0); }
            } catch (err) {
                console.error("Failed to fetch paginated inventory:", err);
                setPaginatedInventory([]); setTotalItems(0);
            } finally { setIsLoadingInventory(false); }
        };
        fetchPaginatedInventory();
    }, [searchParams, refreshTrigger]);

    const updateQueryParams = (newParams: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        if (!newParams.page && (newParams.category !== undefined || newParams.q !== undefined || newParams.f_stock_status !== undefined)) {
            params.set("page", "1");
        }
        Object.entries(newParams).forEach(([key, value]) => {
            if (value === null || value === "all" || value === "") params.delete(key);
            else params.set(key, value);
        });
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleAdjustment = (e: FormEvent) => {
        e.preventDefault();
        if (adjustmentModal && adjQty > 0) {
            adjustStock(adjustmentModal.sku, adjQty, adjType, adjReason);
            setAdjustmentModal(null); setAdjQty(0); setAdjReason(''); setAdjType('INWARD');
            setRefreshTrigger(prev => !prev);
        }
    };

    const handleTransfer = async (e: FormEvent) => {
        e.preventDefault();
        if (transferModal && transferQty > 0 && transferTarget) {
            try {
                await transferStock(transferModal.sourceWarehouseId, transferTarget, transferModal.variantId, transferQty, transferReason);
                setTransferModal(null); setTransferQty(0); setTransferTarget(''); setTransferReason('');
                setRefreshTrigger(prev => !prev);
            } catch (err) { console.error("Transfer failed", err); }
        }
    };

    // ── Computed KPIs ──
    const lowStockCount    = inventory.filter(i => i.quantity > 0 && i.quantity <= i.reorderLevel).length;
    const outOfStockCount  = inventory.filter(i => i.quantity === 0).length;
    const totalStockValue  = inventory.reduce((s, i) => s + i.quantity * i.costPrice, 0);
    const totalUnits       = inventory.reduce((s, i) => s + i.quantity, 0);
    const totalReserved    = inventory.reduce((s, i) => s + (i.reserved || 0), 0);
    const healthyCount     = inventory.filter(i => i.quantity > i.reorderLevel).length;
    const healthPct        = inventory.length > 0 ? Math.round((healthyCount / inventory.length) * 100) : 0;

    // ── Top 5 critical (lowest stock relative to reorder level) ──
    const criticalItems = useMemo(() => {
        return [...inventory]
            .filter(i => i.quantity <= i.reorderLevel)
            .sort((a, b) => (a.quantity / Math.max(a.reorderLevel, 1)) - (b.quantity / Math.max(b.reorderLevel, 1)))
            .slice(0, 5);
    }, [inventory]);

    // ── Category breakdown ──
    const categoryBreakdown = useMemo(() => {
        const map: Record<string, { units: number; value: number; count: number }> = {};
        inventory.forEach(i => {
            const cat = i.variant?.product?.category || 'Uncategorised';
            if (!map[cat]) map[cat] = { units: 0, value: 0, count: 0 };
            map[cat].units += i.quantity;
            map[cat].value += i.quantity * i.costPrice;
            map[cat].count += 1;
        });
        return Object.entries(map).sort((a, b) => b[1].value - a[1].value).slice(0, 5);
    }, [inventory]);

    // ── Recent movements (last 5) ──
    const recentMovements = useMemo(() => stockMovements.slice(0, 5), [stockMovements]);

    return (
        <div
            className="space-y-5"
            style={{ fontFamily: "'DM Sans', 'Geist', 'system-ui', sans-serif" }}
        >

            {/* ─── HEADER ─── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
                <div className="flex items-center gap-2.5">
                    <div className="w-1 h-5 rounded-full bg-indigo-500" />
                    <div>
                        <h2 className="text-base font-bold text-stone-900 tracking-tight">Inventory</h2>
                        <p className="text-xs text-stone-400 mt-0.5 font-mono">
                            {inventory.length} active SKUs · Real-time tracking
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={openAuditLog}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-stone-50 text-stone-600 border border-stone-200 text-xs font-semibold transition-colors"
                    >
                        <History size={13} /> Audit Log
                    </button>
                    <button
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm"
                    >
                        <RefreshCw size={13} /> Sync
                    </button>
                </div>
            </div>

            {/* ─── KPI CARDS ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    {
                        label: 'Stock Valuation',
                        value: `₹${totalStockValue.toLocaleString('en-IN')}`,
                        sub: `${inventory.length} SKUs tracked`,
                        icon: <DollarSign size={14} />,
                        accent: 'border-l-indigo-400',
                    },
                    {
                        label: 'Low Stock',
                        value: lowStockCount,
                        sub: 'Needs reorder soon',
                        icon: <AlertTriangle size={14} />,
                        accent: 'border-l-amber-400',
                        alert: lowStockCount > 0,
                    },
                    {
                        label: 'Out of Stock',
                        value: outOfStockCount,
                        sub: 'Zero availability',
                        icon: <ShieldAlert size={14} />,
                        accent: 'border-l-rose-400',
                        alert: outOfStockCount > 0,
                    },
                    {
                        label: 'Stock Health',
                        value: `${healthPct}%`,
                        sub: `${healthyCount} of ${inventory.length} optimal`,
                        icon: <BarChart3 size={14} />,
                        accent: healthPct >= 80 ? 'border-l-emerald-400' : healthPct >= 50 ? 'border-l-amber-400' : 'border-l-rose-400',
                    },
                ].map((card, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            'rounded-xl bg-white border border-stone-200 border-l-4 shadow-sm p-4',
                            card.accent
                        )}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{card.label}</span>
                            <span className={cn(
                                'p-1 rounded-md',
                                card.alert ? 'text-amber-500 bg-amber-50' : 'text-stone-400 bg-stone-50'
                            )}>
                                {card.icon}
                            </span>
                        </div>
                        <p className="text-2xl font-extrabold text-stone-900 tabular-nums tracking-tight">{card.value}</p>
                        <p className="text-[11px] text-stone-400 mt-0.5">{card.sub}</p>
                    </div>
                ))}
            </div>

            {/* ─── SECONDARY STATS ROW ─── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                {/* Critical Alerts */}
                <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                    <div className="h-0.5 w-full bg-gradient-to-r from-rose-400 via-amber-400 to-amber-300" />
                    <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/50">
                        <SectionLabel icon={<AlertTriangle size={12} />}>Critical Reorder Alerts</SectionLabel>
                    </div>
                    <div className="divide-y divide-stone-50">
                        {criticalItems.length === 0 ? (
                            <div className="px-4 py-5 text-center text-xs text-stone-400">All levels healthy</div>
                        ) : criticalItems.map((item, idx) => {
                            const pct = Math.round((item.quantity / Math.max(item.reorderLevel, 1)) * 100);
                            const name = item.variant?.product?.name || item.variantId;
                            return (
                                <div key={idx} className="px-4 py-2.5">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="text-xs font-semibold text-stone-800 truncate">{name}</span>
                                        {item.quantity === 0
                                            ? <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full ring-1 ring-rose-200 whitespace-nowrap">OUT</span>
                                            : <span className="text-[10px] font-mono font-bold text-amber-700">{item.quantity}/{item.reorderLevel}</span>
                                        }
                                    </div>
                                    {/* Progress bar */}
                                    <div className="h-1 w-full bg-stone-100 rounded-full overflow-hidden">
                                        <div
                                            className={cn('h-full rounded-full transition-all', item.quantity === 0 ? 'bg-rose-400' : 'bg-amber-400')}
                                            style={{ width: `${Math.min(pct, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                    <div className="h-0.5 w-full bg-gradient-to-r from-indigo-400 via-indigo-500 to-violet-400" />
                    <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/50">
                        <SectionLabel icon={<Tag size={12} />}>Value by Category</SectionLabel>
                    </div>
                    <div className="divide-y divide-stone-50">
                        {categoryBreakdown.length === 0 ? (
                            <div className="px-4 py-5 text-center text-xs text-stone-400">No data</div>
                        ) : categoryBreakdown.map(([cat, data], idx) => {
                            const pct = totalStockValue > 0 ? Math.round((data.value / totalStockValue) * 100) : 0;
                            return (
                                <div key={idx} className="px-4 py-2.5">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="text-xs font-semibold text-stone-700 truncate">{cat}</span>
                                        <span className="text-[10px] font-mono font-bold text-stone-500 tabular-nums shrink-0">
                                            ₹{data.value.toLocaleString('en-IN')} · {pct}%
                                        </span>
                                    </div>
                                    <div className="h-1 w-full bg-stone-100 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full bg-indigo-400 transition-all" style={{ width: `${pct}%` }} />
                                    </div>
                                    <p className="text-[10px] text-stone-400 mt-0.5">{data.units} units · {data.count} SKUs</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Inventory Utilisation */}
                <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                    <div className="h-0.5 w-full bg-gradient-to-r from-teal-400 via-emerald-400 to-emerald-300" />
                    <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/50">
                        <SectionLabel icon={<Warehouse size={12} />}>Stock Utilisation</SectionLabel>
                    </div>
                    <div className="px-4 py-4 space-y-3">
                        {[
                            { label: 'Total Units on Hand',   value: totalUnits.toLocaleString('en-IN'),  sub: 'Gross available stock',       icon: <Package size={12} />, color: 'text-stone-600' },
                            { label: 'Reserved / Committed',  value: totalReserved.toLocaleString('en-IN'), sub: 'Pending order fulfilment',   icon: <Clock size={12} />,   color: 'text-amber-600' },
                            { label: 'Net Available',         value: Math.max(0, totalUnits - totalReserved).toLocaleString('en-IN'), sub: 'Free to allocate',     icon: <Zap size={12} />,    color: 'text-emerald-600' },
                            { label: 'Avg Cost / Unit',       value: inventory.length > 0 ? `₹${Math.round(totalStockValue / Math.max(totalUnits, 1)).toLocaleString('en-IN')}` : '—', sub: 'Weighted average',    icon: <DollarSign size={12} />, color: 'text-indigo-600' },
                        ].map(({ label, value, sub, icon, color }) => (
                            <div key={label} className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className={cn('shrink-0', color)}>{icon}</span>
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold truncate">{label}</p>
                                        <p className="text-[11px] text-stone-400">{sub}</p>
                                    </div>
                                </div>
                                <span className={cn('font-bold font-mono tabular-nums text-sm shrink-0', color)}>{value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── STOCK TABLE ─── */}
            <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                {/* Table header */}
                <div className="h-0.5 w-full bg-gradient-to-r from-indigo-400 via-indigo-500 to-violet-400" />
                <div className="px-5 py-4 border-b border-stone-100 bg-stone-50/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <SectionLabel icon={<Package size={12} />}>Stock Levels</SectionLabel>
                            <span className="text-[10px] font-mono font-bold text-stone-400 bg-white border border-stone-200 px-2 py-0.5 rounded-md">
                                {totalItems}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Search */}
                            <div className="relative">
                                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                <Input
                                    placeholder="SKU, name…"
                                    className="pl-8 h-8 text-xs bg-white border-stone-200 text-stone-800 placeholder:text-stone-400 focus-visible:ring-indigo-400 focus-visible:border-indigo-300 shadow-none rounded-lg w-44 sm:w-56"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            {/* Category */}
                            <Select value={currentCategory} onValueChange={(val) => updateQueryParams({ category: val })}>
                                <SelectTrigger className="h-8 text-xs w-36 bg-white border-stone-200 text-stone-700 focus:ring-indigo-400 shadow-none rounded-lg">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-stone-200 text-stone-800 shadow-md">
                                    <SelectItem value="all" className="text-xs focus:bg-stone-50">All Categories</SelectItem>
                                    {Object.values(Category).map(cat => (
                                        <SelectItem key={cat} value={cat} className="text-xs focus:bg-stone-50">{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {/* Stock status */}
                            <Select value={currentStockStatus} onValueChange={(val) => updateQueryParams({ f_stock_status: val })}>
                                <SelectTrigger className="h-8 text-xs w-36 bg-white border-stone-200 text-stone-700 focus:ring-indigo-400 shadow-none rounded-lg">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-stone-200 text-stone-800 shadow-md">
                                    <SelectItem value="all" className="text-xs focus:bg-stone-50">Any Status</SelectItem>
                                    <SelectItem value="in"  className="text-xs focus:bg-stone-50">In Stock</SelectItem>
                                    <SelectItem value="low" className="text-xs focus:bg-stone-50">Low Stock</SelectItem>
                                    <SelectItem value="out" className="text-xs focus:bg-stone-50">Out of Stock</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-stone-100 bg-stone-50/30">
                                <th className="px-5 py-3 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Product</th>
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">SKU</th>
                                <th className="hidden md:table-cell px-4 py-3 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Location</th>
                                <th className="px-4 py-3 text-right text-[10px] font-bold text-stone-400 uppercase tracking-widest">Available</th>
                                <th className="hidden sm:table-cell px-4 py-3 text-right text-[10px] font-bold text-stone-400 uppercase tracking-widest">Reserved</th>
                                <th className="hidden lg:table-cell px-4 py-3 text-right text-[10px] font-bold text-stone-400 uppercase tracking-widest">Cost Value</th>
                                <th className="px-4 py-3 text-right text-[10px] font-bold text-stone-400 uppercase tracking-widest">Status</th>
                                <th className="px-5 py-3 text-right text-[10px] font-bold text-stone-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                            {isLoadingInventory ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-12 text-center text-xs text-stone-400">
                                        Loading inventory…
                                    </td>
                                </tr>
                            ) : paginatedInventory.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-16 text-center">
                                        <Package size={28} className="mx-auto text-stone-300 mb-3" />
                                        <p className="text-xs text-stone-400">
                                            {currentSearch || currentStockStatus !== 'all' || currentCategory !== 'all'
                                                ? 'No items match current filters'
                                                : 'Inventory is empty'}
                                        </p>
                                    </td>
                                </tr>
                            ) : paginatedInventory.map((item: WarehouseInventory) => {
                                const variant = item.variant;
                                const product = variant?.product;
                                const costValue = item.quantity * item.costPrice;

                                return (
                                    <tr key={item.id} className="hover:bg-stone-50/60 transition-colors group">
                                        {/* Product */}
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 shrink-0 bg-stone-100 border border-stone-200 rounded-lg overflow-hidden">
                                                    <img
                                                        className="h-full w-full object-contain"
                                                        src={product?.media?.[0]?.url || '/placeholder.png'}
                                                        alt={product?.name || variant?.sku}
                                                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/300/300'; }}
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-stone-800 truncate tracking-tight leading-tight" title={product?.name}>
                                                        {product?.name || 'Undefined Product'}
                                                    </p>
                                                    <span className="text-[10px] text-stone-400 bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded font-medium">
                                                        {product?.category || 'Standard'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        {/* SKU */}
                                        <td className="px-4 py-3.5 whitespace-nowrap text-xs font-mono font-semibold text-stone-500">
                                            {variant?.sku || 'N/A'}
                                        </td>
                                        {/* Location */}
                                        <td className="hidden md:table-cell px-4 py-3.5 whitespace-nowrap text-xs font-mono text-stone-400 uppercase">
                                            {item.location || 'WH-01'}
                                        </td>
                                        {/* Availability */}
                                        <td className="px-4 py-3.5 whitespace-nowrap text-right">
                                            <span className={cn(
                                                'text-sm font-bold tabular-nums font-mono',
                                                item.quantity === 0 ? 'text-rose-600' :
                                                item.quantity <= item.reorderLevel ? 'text-amber-700' : 'text-stone-900'
                                            )}>
                                                {item.quantity}
                                            </span>
                                            <p className="text-[10px] text-stone-400 font-mono">/{item.reorderLevel} min</p>
                                        </td>
                                        {/* Reserved */}
                                        <td className="hidden sm:table-cell px-4 py-3.5 whitespace-nowrap text-right text-xs font-mono font-semibold text-amber-600 tabular-nums">
                                            {item.reserved || 0}
                                        </td>
                                        {/* Cost Value */}
                                        <td className="hidden lg:table-cell px-4 py-3.5 whitespace-nowrap text-right text-xs font-mono font-bold text-stone-700 tabular-nums">
                                            ₹{costValue.toLocaleString('en-IN')}
                                        </td>
                                        {/* Status */}
                                        <td className="px-4 py-3.5 whitespace-nowrap text-right">
                                            <StockBadge qty={item.quantity} reorderLevel={item.reorderLevel} />
                                        </td>
                                        {/* Actions */}
                                        <td className="px-5 py-3.5 whitespace-nowrap text-right">
                                            <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-stone-50 text-stone-600 border border-stone-200 text-[11px] font-semibold transition-colors"
                                                    onClick={() => setTransferModal({
                                                        isOpen: true,
                                                        sku: variant?.sku || item.variantId,
                                                        variantId: item.variantId,
                                                        sourceWarehouseId: item.warehouseId,
                                                        currentQty: item.quantity,
                                                    })}
                                                >
                                                    <MoveHorizontal size={11} /> Transfer
                                                </button>
                                                <button
                                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition-colors"
                                                    onClick={() => setAdjustmentModal({
                                                        isOpen: true,
                                                        sku: variant?.sku || item.variantId,
                                                        currentQty: item.quantity,
                                                    })}
                                                >
                                                    <RefreshCw size={11} /> Adjust
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!isLoadingInventory && totalItems > 0 && (
                    <div className="px-5 py-3.5 border-t border-stone-100 bg-stone-50/40 flex items-center justify-between">
                        <p className="text-xs text-stone-400 font-mono tabular-nums">
                            <span className="text-stone-600 font-semibold">{(currentPage - 1) * currentLimit + 1}</span>–<span className="text-stone-600 font-semibold">{Math.min(currentPage * currentLimit, totalItems)}</span> of <span className="text-stone-600 font-semibold">{totalItems}</span>
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button
                                disabled={currentPage <= 1}
                                onClick={() => updateQueryParams({ page: String(currentPage - 1) })}
                                className="h-8 w-8 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <span className="px-3 h-8 flex items-center text-xs font-mono font-bold text-stone-600 border border-stone-200 rounded-lg bg-white tabular-nums">
                                {currentPage} / {Math.max(1, Math.ceil(totalItems / currentLimit))}
                            </span>
                            <button
                                disabled={currentPage >= Math.ceil(totalItems / currentLimit)}
                                onClick={() => updateQueryParams({ page: String(currentPage + 1) })}
                                className="h-8 w-8 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── STOCK MOVEMENT HISTORY ─── */}
            <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
                    <SectionLabel icon={<History size={12} />}>Stock Movement History</SectionLabel>
                    <span className="text-[10px] font-mono font-bold text-stone-400 bg-white border border-stone-200 px-2 py-0.5 rounded-md">
                        Last {Math.min(stockMovements.length, 20)}
                    </span>
                </div>
                <div className="overflow-x-auto max-h-[320px]">
                    <table className="w-full">
                        <thead className="sticky top-0 bg-white z-10">
                            <tr className="border-b border-stone-100">
                                <th className="px-5 py-3 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Date</th>
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">SKU</th>
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Type</th>
                                <th className="px-4 py-3 text-right text-[10px] font-bold text-stone-400 uppercase tracking-widest">Qty</th>
                                <th className="hidden md:table-cell px-5 py-3 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Reason</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                            {stockMovements.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center text-xs text-stone-400">
                                        No stock movements recorded
                                    </td>
                                </tr>
                            ) : stockMovements.slice(0, 20).map(mov => (
                                <tr key={mov.id} className="hover:bg-stone-50/60 transition-colors">
                                    <td className="px-5 py-3 whitespace-nowrap text-[11px] font-mono text-stone-400 tabular-nums">
                                        {new Date(mov.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-xs font-mono font-semibold text-stone-700">
                                        {mov.sku}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <MovTypeBadge type={mov.type} />
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-bold font-mono text-stone-900 tabular-nums">
                                        {mov.quantity}
                                    </td>
                                    <td className="hidden md:table-cell px-5 py-3 text-xs text-stone-400 max-w-[200px]">
                                        <span className="line-clamp-1">{mov.reason || '—'}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ─── ADJUSTMENT DIALOG ─── */}
            <Dialog open={!!adjustmentModal} onOpenChange={() => setAdjustmentModal(null)}>
                <DialogContent className="sm:max-w-md bg-white border-stone-200 shadow-xl rounded-xl">
                    <div className="h-0.5 w-full bg-gradient-to-r from-indigo-400 to-violet-400 -mt-6 mb-4 rounded-t-xl" />
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-stone-900 tracking-tight">Stock Adjustment</DialogTitle>
                        <DialogDescription className="text-xs text-stone-400">
                            Adjusting SKU: <span className="font-mono font-semibold text-stone-600">{adjustmentModal?.sku}</span>
                        </DialogDescription>
                    </DialogHeader>
                    {adjustmentModal && (
                        <div className="space-y-4 py-1">
                            <div className="px-3 py-2.5 bg-stone-50 border border-stone-100 rounded-lg flex items-center justify-between">
                                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Current Stock</span>
                                <span className="text-sm font-bold text-stone-900 font-mono">{adjustmentModal.currentQty} units</span>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Type</label>
                                <Select value={adjType} onValueChange={(val: any) => setAdjType(val)}>
                                    <SelectTrigger className="h-9 text-xs border-stone-200 bg-white focus:ring-indigo-400 rounded-lg shadow-none">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-stone-200 shadow-md">
                                        <SelectItem value="INWARD"     className="text-xs focus:bg-stone-50">Inward (Replenishment)</SelectItem>
                                        <SelectItem value="ADJUSTMENT" className="text-xs focus:bg-stone-50">Manual Correction</SelectItem>
                                        <SelectItem value="OUTWARD"    className="text-xs focus:bg-stone-50">Outward (Loss / Damage)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Quantity</label>
                                <Input
                                    type="number"
                                    className="h-9 text-sm font-bold border-stone-200 focus-visible:ring-indigo-400 rounded-lg shadow-none"
                                    value={adjQty}
                                    onChange={e => setAdjQty(Number(e.target.value))}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Reason</label>
                                <textarea
                                    className="w-full min-h-[80px] px-3 py-2 text-xs border border-stone-200 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none bg-white resize-none text-stone-700 placeholder:text-stone-400"
                                    value={adjReason}
                                    onChange={e => setAdjReason(e.target.value)}
                                    placeholder="Brief explanation for this audit entry…"
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2 pt-1">
                        <button onClick={() => setAdjustmentModal(null)}
                            className="flex-1 h-9 rounded-lg border border-stone-200 bg-white text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleAdjustment}
                            className="flex-1 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm">
                            Save Adjustment
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── TRANSFER DIALOG ─── */}
            <Dialog open={!!transferModal} onOpenChange={() => setTransferModal(null)}>
                <DialogContent className="sm:max-w-md bg-white border-stone-200 shadow-xl rounded-xl">
                    <div className="h-0.5 w-full bg-gradient-to-r from-violet-400 to-indigo-400 -mt-6 mb-4 rounded-t-xl" />
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-stone-900 tracking-tight">Warehouse Transfer</DialogTitle>
                        <DialogDescription className="text-xs text-stone-400">
                            SKU: <span className="font-mono font-semibold text-stone-600">{transferModal?.sku}</span>
                        </DialogDescription>
                    </DialogHeader>
                    {transferModal && (
                        <div className="space-y-4 py-1">
                            <div className="px-3 py-2.5 bg-stone-50 border border-stone-100 rounded-lg flex items-center justify-between">
                                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Available at Source</span>
                                <span className="text-sm font-bold text-stone-900 font-mono">{transferModal.currentQty} units · <span className="text-stone-400 text-xs">{transferModal.sourceWarehouseId}</span></span>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Destination Warehouse</label>
                                <Input className="h-9 text-xs border-stone-200 focus-visible:ring-indigo-400 rounded-lg shadow-none"
                                    value={transferTarget} onChange={e => setTransferTarget(e.target.value)} placeholder="Facility ID…" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Quantity</label>
                                <Input type="number" max={transferModal.currentQty}
                                    className="h-9 text-sm font-bold border-stone-200 focus-visible:ring-indigo-400 rounded-lg shadow-none"
                                    value={transferQty} onChange={e => setTransferQty(Number(e.target.value))} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Reason</label>
                                <textarea
                                    className="w-full min-h-[80px] px-3 py-2 text-xs border border-stone-200 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none bg-white resize-none text-stone-700 placeholder:text-stone-400"
                                    value={transferReason} onChange={e => setTransferReason(e.target.value)}
                                    placeholder="Reason for transfer…" />
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2 pt-1">
                        <button onClick={() => setTransferModal(null)}
                            className="flex-1 h-9 rounded-lg border border-stone-200 bg-white text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleTransfer} disabled={!transferQty || !transferTarget}
                            className="flex-1 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                            Confirm Transfer
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── AUDIT LOG DIALOG ─── */}
            <Dialog open={auditLogModal} onOpenChange={setAuditLogModal}>
                <DialogContent className="sm:max-w-2xl bg-white border-stone-200 shadow-xl rounded-xl">
                    <div className="h-0.5 w-full bg-gradient-to-r from-stone-300 via-stone-400 to-stone-300 -mt-6 mb-4 rounded-t-xl" />
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-stone-900 tracking-tight">Audit Log</DialogTitle>
                        <DialogDescription className="text-xs text-stone-400">Recent system actions</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[400px] w-full rounded-lg border border-stone-100 bg-stone-50 p-3">
                        {isLoadingAudit ? (
                            <div className="text-center text-xs text-stone-400 mt-8">Loading logs…</div>
                        ) : auditLogs.length === 0 ? (
                            <div className="text-center text-xs text-stone-400 mt-8">No audit logs found.</div>
                        ) : (
                            <div className="space-y-2">
                                {auditLogs.map((log: any) => (
                                    <div key={log.id} className="bg-white border border-stone-100 rounded-lg px-3 py-2.5">
                                        <div className="flex items-center justify-between gap-2 mb-0.5">
                                            <span className="text-xs font-bold text-stone-800">{log.action || 'Action'}</span>
                                            <span className="text-[10px] font-mono text-stone-400 tabular-nums">{new Date(log.createdAt).toLocaleString('en-IN')}</span>
                                        </div>
                                        <p className="text-[11px] text-stone-500">by <span className="font-semibold text-stone-700">{log.actor}</span> · {log.entityType} <span className="font-mono text-stone-400">({log.entityId})</span></p>
                                        {log.metadata && (
                                            <pre className="text-[10px] mt-1.5 bg-stone-50 border border-stone-100 p-2 rounded break-all whitespace-pre-wrap text-stone-500 font-mono">
                                                {JSON.stringify(log.metadata, null, 2)}
                                            </pre>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default InventoryManager;