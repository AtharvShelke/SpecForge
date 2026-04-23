'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef, FormEvent, memo } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { StockMovementType } from '@/types';
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    DollarSign,
    Package,
    Search,
    TrendingDown,
    TrendingUp,
    Filter,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    MoveHorizontal,
    History,
    Warehouse,
    BarChart3,
    ShieldAlert,
    Zap,
    Clock,
    Tag,
    ChevronDown,
    SlidersHorizontal,
} from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { WarehouseInventory } from '@/types';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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

/* ─────────────────────────────────────────────────────────────
   MODULE-LEVEL CONSTANTS — never reallocated on render
───────────────────────────────────────────────────────────────*/

// Was recreated inside MovTypeBadge on every render
const MOV_TYPE_MAP: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    INWARD:     { label: 'In',       cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', icon: <ArrowDownRight size={10} /> },
    OUTWARD:    { label: 'Out',      cls: 'bg-rose-50 text-rose-600 ring-1 ring-rose-200',          icon: <ArrowUpRight size={10} /> },
    ADJUSTMENT: { label: 'Adj',      cls: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',    icon: <RefreshCw size={10} /> },
    TRANSFER:   { label: 'Transfer', cls: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',    icon: <MoveHorizontal size={10} /> },
};

type StockMovementRecord = {
    id: string;
    date: string;
    sku: string;
    type: StockMovementType | string;
    quantity: number;
    reason?: string | null;
};
const MOV_TYPE_FALLBACK = { label: '', cls: 'bg-stone-100 text-stone-600 ring-1 ring-stone-200', icon: null };

// Stable image fallback handler — was an inline arrow per <img> per render
const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.target as HTMLImageElement).src = 'https://picsum.photos/300/300';
};

// Static date format options — avoids object literals being passed to Intl on every render
const DATE_OPTS_MOV: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
const DATE_OPTS_MOV_MOBILE: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
const DATE_OPTS_AUDIT: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

/* ─────────────────────────────────────────────────────────────
   SHARED PRIMITIVES
───────────────────────────────────────────────────────────────*/

// memo: only re-renders if children or icon reference changes
const SectionLabel = memo(({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="flex items-center gap-1.5">
        <span className="text-stone-400">{icon}</span>
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em]">{children}</span>
    </div>
));
SectionLabel.displayName = 'SectionLabel';

// memo: pure function of qty + reorderLevel — skips re-render if values unchanged
const StockBadge = memo(({ qty, reorderLevel }: { qty: number; reorderLevel: number }) => {
    if (qty === 0) return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-rose-50 text-rose-600 ring-1 ring-rose-200 whitespace-nowrap">
            <span className="w-1 h-1 rounded-full bg-current opacity-60" /> Out
        </span>
    );
    if (qty <= reorderLevel) return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-50 text-amber-700 ring-1 ring-amber-200 whitespace-nowrap">
            <span className="w-1 h-1 rounded-full bg-current opacity-60" /> Low
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 whitespace-nowrap">
            <span className="w-1 h-1 rounded-full bg-current opacity-60" /> OK
        </span>
    );
});
StockBadge.displayName = 'StockBadge';

// memo + module-level map lookup — no object literal allocation per render
const MovTypeBadge = memo(({ type }: { type: string }) => {
    const cfg = MOV_TYPE_MAP[type] ?? { ...MOV_TYPE_FALLBACK, label: type };
    return (
        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap', cfg.cls)}>
            {cfg.icon} {cfg.label}
        </span>
    );
});
MovTypeBadge.displayName = 'MovTypeBadge';

/* ─────────────────────────────────────────────────────────────
   COLLAPSIBLE SECTION — memo: skips re-render when parent
   re-renders for unrelated state (pagination, search, etc.)
───────────────────────────────────────────────────────────────*/
const CollapsibleSection = memo(({
    icon, title, badge, children, defaultOpen = true, accentClass,
}: {
    icon: React.ReactNode;
    title: string;
    badge?: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
    accentClass?: string;
}) => {
    const [open, setOpen] = useState(defaultOpen);
    const toggle = useCallback(() => setOpen(o => !o), []);

    return (
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
            {accentClass && <div className={cn('h-0.5 w-full', accentClass)} />}
            <button
                type="button"
                className="w-full px-4 py-2.5 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between"
                onClick={toggle}
            >
                <div className="flex items-center gap-2">
                    <SectionLabel icon={icon}>{title}</SectionLabel>
                    {badge}
                </div>
                <ChevronDown size={13} className={cn('text-stone-400 transition-transform duration-200 flex-shrink-0', open && 'rotate-180')} />
            </button>
            {open && <div>{children}</div>}
        </div>
    );
});
CollapsibleSection.displayName = 'CollapsibleSection';

/* ─────────────────────────────────────────────────────────────
   MAIN
───────────────────────────────────────────────────────────────*/
const InventoryManager = () => {
    const {
        inventory,
        stockMovements,
        adjustStock,
        transferStock,
        refreshInventory,
        refreshAuditLogs,
        fetchInventoryPage,
        syncData,
        isLoading,
    } = useAdmin() as unknown as {
        inventory: WarehouseInventory[];
        stockMovements: StockMovementRecord[];
        adjustStock: (sku: string, quantity: number, type: StockMovementType, reason?: string) => Promise<void>;
        transferStock: (sourceWarehouseId: string, targetWarehouseId: string, variantId: string, quantity: number, reason?: string) => Promise<void>;
        refreshInventory: () => Promise<void>;
        refreshAuditLogs: () => Promise<any[]>;
        fetchInventoryPage: (query?: URLSearchParams | string) => Promise<{ items: WarehouseInventory[]; total: number; page: number; limit: number }>;
        syncData: () => Promise<void>;
        isLoading: boolean;
    };

    const [adjustmentModal, setAdjustmentModal] = useState<{
        isOpen: boolean; sku: string; currentQty: number;
    } | null>(null);

    const [transferModal, setTransferModal] = useState<{
        isOpen: boolean; sku: string; variantId: string; sourceWarehouseId: string; currentQty: number;
    } | null>(null);

    const [transferTarget, setTransferTarget] = useState<string>('');
    const [transferQty, setTransferQty] = useState<number>(0);
    const [transferReason, setTransferReason] = useState<string>('');
    const [adjType, setAdjType] = useState<StockMovementType>(StockMovementType.INWARD);
    const [adjQty, setAdjQty] = useState(0);
    const [adjReason, setAdjReason] = useState('');

    const [auditLogModal, setAuditLogModal] = useState(false);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [isLoadingAudit, setIsLoadingAudit] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Stable callback — was recreated every render, triggering button re-renders
    const openAuditLog = useCallback(async () => {
        setAuditLogModal(true);
        setIsLoadingAudit(true);
        try {
            setAuditLogs(await refreshAuditLogs());
        } catch (e) { console.error(e); }
        finally { setIsLoadingAudit(false); }
    }, [refreshAuditLogs]);

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

    // Stable — was recreated every render, causing all pagination/filter buttons
    // to receive new onClick props and forcing their re-render
    const updateQueryParams = useCallback((newParams: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        if (!newParams.page && (newParams.category !== undefined || newParams.q !== undefined || newParams.f_stock_status !== undefined)) {
            params.set("page", "1");
        }
        Object.entries(newParams).forEach(([key, value]) => {
            if (value === null || value === "all" || value === "") params.delete(key);
            else params.set(key, value);
        });
        router.push(`${pathname}?${params.toString()}`);
    }, [searchParams, router, pathname]);

    useEffect(() => {
        if (debouncedSearch !== currentSearch) updateQueryParams({ q: debouncedSearch });
    }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

    // Use AbortController to cancel in-flight fetch when params change,
    // preventing stale responses from updating state out of order
    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;

        const fetchPaginatedInventory = async () => {
            setIsLoadingInventory(true);
            try {
                const query = new URLSearchParams(searchParams.toString());
                if (!query.has("limit")) query.set("limit", "10");
                if (!query.has("page")) query.set("page", "1");
                const data = await fetchInventoryPage(query);
                if (signal.aborted) return;
                setPaginatedInventory(data.items);
                setTotalItems(data.total || 0);
            } catch (err: any) {
                // Ignore aborted requests — not a real error
                if (err.name !== 'AbortError') {
                    console.error("Failed to fetch paginated inventory:", err);
                    setPaginatedInventory([]); setTotalItems(0);
                }
            } finally {
                if (!signal.aborted) setIsLoadingInventory(false);
            }
        };

        fetchPaginatedInventory();

        // Polling interval: only set after initial fetch, reuses AbortController scope
        const interval = setInterval(fetchPaginatedInventory, 30000);

        return () => {
            controller.abort();       // cancel in-flight request on param change
            clearInterval(interval);  // clear stale polling interval
        };
    }, [searchParams, refreshTrigger]);

    const handleAdjustment = useCallback((e: FormEvent) => {
        e.preventDefault();
        if (adjustmentModal && adjQty > 0) {
            adjustStock(adjustmentModal.sku, adjQty, adjType, adjReason);
            setAdjustmentModal(null); setAdjQty(0); setAdjReason(''); setAdjType(StockMovementType.INWARD);
            setRefreshTrigger(prev => !prev);
        }
    }, [adjustmentModal, adjQty, adjType, adjReason, adjustStock]);

    const handleTransfer = useCallback(async (e: FormEvent) => {
        e.preventDefault();
        if (transferModal && transferQty > 0 && transferTarget) {
            try {
                await transferStock(transferModal.sourceWarehouseId, transferTarget, transferModal.variantId, transferQty, transferReason);
                setTransferModal(null); setTransferQty(0); setTransferTarget(''); setTransferReason('');
                setRefreshTrigger(prev => !prev);
            } catch (err) { console.error("Transfer failed", err); }
        }
    }, [transferModal, transferQty, transferTarget, transferReason, transferStock]);

    const handleCloseAdjustment = useCallback(() => setAdjustmentModal(null), []);
    const handleCloseTransfer = useCallback(() => setTransferModal(null), []);
    const handleToggleFilters = useCallback(() => setShowFilters(f => !f), []);

    const handleRefreshSync = useCallback(async () => {
        await refreshInventory();
        setRefreshTrigger(prev => !prev);
    }, [refreshInventory]);

    // Pagination handlers — stable references prevent button re-renders
    const handlePrevPage = useCallback(() => {
        updateQueryParams({ page: String(currentPage - 1) });
    }, [updateQueryParams, currentPage]);

    const handleNextPage = useCallback(() => {
        updateQueryParams({ page: String(currentPage + 1) });
    }, [updateQueryParams, currentPage]);

    const handleCategoryChange = useCallback((val: string) => {
        updateQueryParams({ category: val });
    }, [updateQueryParams]);

    const handleStockStatusChange = useCallback((val: string) => {
        updateQueryParams({ f_stock_status: val });
    }, [updateQueryParams]);

    /* ── KPIs — single combined pass instead of 6 separate .filter()/.reduce() calls ── */
    const kpis = useMemo(() => {
        let lowStockCount = 0;
        let outOfStockCount = 0;
        let totalStockValue = 0;
        let totalAvailable = 0;
        let totalReserved = 0;
        let healthyCount = 0;

        const arr = Array.isArray(inventory) ? inventory : [];
        for (const i of arr) {
            const qty = i.quantity;
            const reserved = i.reserved || 0;
            totalStockValue += qty * i.costPrice;
            totalAvailable += qty;
            totalReserved += reserved;
            if (qty === 0) outOfStockCount++;
            else if (qty <= i.reorderLevel) lowStockCount++;
            else healthyCount++;
        }

        const totalOnHand = totalAvailable + totalReserved;
        const healthPct = arr.length > 0 ? Math.round((healthyCount / arr.length) * 100) : 0;

        return { lowStockCount, outOfStockCount, totalStockValue, totalAvailable, totalReserved, totalOnHand, healthyCount, healthPct };
    }, [inventory]);

    const { lowStockCount, outOfStockCount, totalStockValue, totalAvailable, totalReserved, totalOnHand, healthyCount, healthPct } = kpis;

    const criticalItems = useMemo(() => {
        const arr = Array.isArray(inventory) ? inventory : [];
        return [...arr]
            .filter(i => i.quantity <= i.reorderLevel)
            .sort((a, b) => (a.quantity / Math.max(a.reorderLevel, 1)) - (b.quantity / Math.max(b.reorderLevel, 1)))
            .slice(0, 5);
    }, [inventory]);

    const categoryBreakdown = useMemo(() => {
        const map: Record<string, { units: number; value: number; count: number }> = {};
        const arr = Array.isArray(inventory) ? inventory : [];
        for (const i of arr) {
            const cat = i.variant?.product?.category || 'Uncategorised';
            if (!map[cat]) map[cat] = { units: 0, value: 0, count: 0 };
            map[cat].units += i.quantity;
            map[cat].value += i.quantity * i.costPrice;
            map[cat].count += 1;
        }
        return Object.entries(map).sort((a, b) => b[1].value - a[1].value).slice(0, 5);
    }, [inventory]);
    const inventoryCategories = useMemo(
        () => categoryBreakdown.map(([cat]) => cat),
        [categoryBreakdown],
    );

    // KPI card definitions — memoized so the array isn't reconstructed every render
    const kpiCards = useMemo(() => [
        {
            label: 'Valuation',
            value: totalStockValue > 999999
                ? `₹${(totalStockValue / 100000).toFixed(1)}L`
                : `₹${totalStockValue.toLocaleString('en-IN')}`,
            sub: `${Array.isArray(inventory) ? inventory.length : 0} SKUs`,
            icon: <DollarSign size={12} />,
            accent: 'border-l-indigo-400',
            alert: false,
        },
        {
            label: 'Low Stock',
            value: lowStockCount,
            sub: 'Action req.',
            icon: <AlertTriangle size={12} />,
            accent: 'border-l-amber-400',
            alert: lowStockCount > 0,
        },
        {
            label: 'Out of Stock',
            value: outOfStockCount,
            sub: 'Zero stock',
            icon: <ShieldAlert size={12} />,
            accent: 'border-l-rose-400',
            alert: outOfStockCount > 0,
        },
        {
            label: 'Health',
            value: `${healthPct}%`,
            sub: `${healthyCount} Optimal`,
            icon: <BarChart3 size={12} />,
            accent: healthPct >= 80 ? 'border-l-emerald-400' : healthPct >= 50 ? 'border-l-amber-400' : 'border-l-rose-400',
            alert: false,
        },
    ], [totalStockValue, inventory, lowStockCount, outOfStockCount, healthPct, healthyCount]);

    // Utilisation rows — memoized to prevent array construction on every render
    const utilisationRows = useMemo(() => [
        { label: 'On Hand',      value: totalOnHand.toLocaleString('en-IN'),   sub: 'Physical stock', icon: <Package size={12} />,    color: 'text-stone-600' },
        { label: 'Reserved',     value: totalReserved.toLocaleString('en-IN'), sub: 'Pending orders', icon: <Clock size={12} />,       color: 'text-amber-600' },
        { label: 'Available',    value: totalAvailable.toLocaleString('en-IN'),sub: 'Free to sell',   icon: <Zap size={12} />,         color: 'text-emerald-600' },
        {
            label: 'Avg Cost/Unit',
            value: Array.isArray(inventory) && inventory.length > 0
                ? `₹${Math.round(totalStockValue / Math.max(totalOnHand, 1)).toLocaleString('en-IN')}`
                : '—',
            sub: 'Weighted avg', icon: <DollarSign size={12} />, color: 'text-indigo-600',
        },
    ], [totalOnHand, totalReserved, totalAvailable, totalStockValue, inventory]);

    const totalPages = Math.max(1, Math.ceil(totalItems / currentLimit));

    return (
        <div
            className="space-y-3"
            style={{ fontFamily: "'DM Sans', 'Geist', 'system-ui', sans-serif" }}
        >
            {/* ─── HEADER ─── */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-1 h-4 rounded-full bg-indigo-500 flex-shrink-0" />
                    <div className="min-w-0">
                        <h2 className="text-sm font-bold text-stone-900 tracking-tight">Inventory</h2>
                        <p className="text-[11px] text-stone-400 font-mono hidden sm:block">
                            {Array.isArray(inventory) ? inventory.length : 0} SKUs · Live
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={openAuditLog}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-stone-50 text-stone-600 border border-stone-200 text-xs font-semibold transition-colors"
                    >
                        <History size={12} />
                        <span className="hidden sm:inline">Audit Log</span>
                    </button>
                    <button
                        onClick={handleRefreshSync}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm"
                    >
                        <RefreshCw size={12} />
                        <span className="hidden sm:inline">Sync</span>
                    </button>
                </div>
            </div>

            {/* ─── KPI CARDS ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                {kpiCards.map((card, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            'rounded-xl bg-white border border-stone-200 border-l-[3px] sm:border-l-4 shadow-sm p-2.5 sm:p-4 active:scale-[0.98] transition-transform',
                            card.accent
                        )}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[8px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-tighter sm:tracking-widest truncate mr-1">
                                {card.label}
                            </span>
                            <span className={cn(
                                'p-1 rounded-md shrink-0',
                                card.alert ? 'text-rose-500 bg-rose-50' : 'text-stone-400 bg-stone-50'
                            )}>
                                {card.icon}
                            </span>
                        </div>
                        <p className="text-base sm:text-lg md:text-xl font-black text-stone-900 tabular-nums tracking-tight leading-none">
                            {card.value}
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-stone-400 mt-1 truncate font-medium">
                            {card.sub}
                        </p>
                    </div>
                ))}
            </div>

            {/* ─── SECONDARY STATS ROW ─── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                {/* Critical Alerts */}
                <CollapsibleSection
                    icon={<AlertTriangle size={12} />}
                    title="Critical Alerts"
                    accentClass="bg-gradient-to-r from-rose-400 via-amber-400 to-amber-300"
                >
                    <div className="divide-y divide-stone-50">
                        {criticalItems.length === 0 ? (
                            <div className="px-4 py-4 text-center text-xs text-stone-400">All levels healthy</div>
                        ) : criticalItems.map((item, idx) => {
                            const pct = Math.round((item.quantity / Math.max(item.reorderLevel, 1)) * 100);
                            const name = item.variant?.product?.name || item.variantId;
                            return (
                                <div key={idx} className="px-4 py-2.5">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="text-xs font-semibold text-stone-800 truncate">{name}</span>
                                        {item.quantity === 0
                                            ? <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full ring-1 ring-rose-200 whitespace-nowrap flex-shrink-0">OUT</span>
                                            : <span className="text-[10px] font-mono font-bold text-amber-700 flex-shrink-0">{item.quantity}/{item.reorderLevel}</span>
                                        }
                                    </div>
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
                </CollapsibleSection>

                {/* Category Breakdown */}
                <CollapsibleSection
                    icon={<Tag size={12} />}
                    title="Value by Category"
                    accentClass="bg-gradient-to-r from-indigo-400 via-indigo-500 to-violet-400"
                >
                    <div className="divide-y divide-stone-50">
                        {categoryBreakdown.length === 0 ? (
                            <div className="px-4 py-4 text-center text-xs text-stone-400">No data</div>
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
                </CollapsibleSection>

                {/* Stock Utilisation */}
                <CollapsibleSection
                    icon={<Warehouse size={12} />}
                    title="Stock Utilisation"
                    accentClass="bg-gradient-to-r from-teal-400 via-emerald-400 to-emerald-300"
                >
                    <div className="px-4 py-3 space-y-2.5">
                        {utilisationRows.map(({ label, value, sub, icon, color }) => (
                            <div key={label} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className={cn('shrink-0', color)}>{icon}</span>
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold truncate">{label}</p>
                                        <p className="text-[10px] text-stone-400 hidden sm:block">{sub}</p>
                                    </div>
                                </div>
                                <span className={cn('font-bold font-mono tabular-nums text-sm shrink-0', color)}>{value}</span>
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>
            </div>

            {/* ─── STOCK TABLE ─── */}
            <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                <div className="h-0.5 w-full bg-gradient-to-r from-indigo-400 via-indigo-500 to-violet-400" />

                {/* Filters header */}
                <div className="px-3 sm:px-4 py-2.5 border-b border-stone-100 bg-stone-50/50 space-y-2">
                    <div className="flex items-center gap-2">
                        <SectionLabel icon={<Package size={12} />}>Stock Levels</SectionLabel>
                        <span className="text-[10px] font-mono font-bold text-stone-400 bg-white border border-stone-200 px-2 py-0.5 rounded-md">
                            {totalItems}
                        </span>
                        <button
                            onClick={syncData}
                            disabled={isLoading}
                            className="h-7 w-7 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={11} className={cn(isLoading && 'animate-spin')} />
                        </button>
                        <div className="flex-1" />
                        <div className="relative flex-1 max-w-[160px] sm:max-w-xs">
                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                            <Input
                                placeholder="SKU, name…"
                                className="pl-7 h-8 text-xs bg-white border-stone-200 text-stone-800 placeholder:text-stone-400 focus-visible:ring-indigo-400 focus-visible:border-indigo-300 shadow-none rounded-lg w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleToggleFilters}
                            className={cn(
                                'flex items-center gap-1 h-8 px-2.5 rounded-lg border text-xs font-semibold transition-colors flex-shrink-0',
                                showFilters
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                            )}
                        >
                            <SlidersHorizontal size={12} />
                            <span className="hidden sm:inline">Filters</span>
                        </button>
                    </div>

                    {showFilters && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            <Select value={currentCategory} onValueChange={handleCategoryChange}>
                                <SelectTrigger className="h-8 text-xs w-32 sm:w-36 bg-white border-stone-200 text-stone-700 focus:ring-indigo-400 shadow-none rounded-lg">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-stone-200 text-stone-800 shadow-md">
                                    <SelectItem value="all" className="text-xs focus:bg-stone-50">All Categories</SelectItem>
                                    {inventoryCategories.map(cat => (
                                        <SelectItem key={cat} value={cat} className="text-xs focus:bg-stone-50">{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={currentStockStatus} onValueChange={handleStockStatusChange}>
                                <SelectTrigger className="h-8 text-xs w-32 sm:w-36 bg-white border-stone-200 text-stone-700 focus:ring-indigo-400 shadow-none rounded-lg">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-stone-200 text-stone-800 shadow-md">
                                    <SelectItem value="all" className="text-xs focus:bg-stone-50">Any Status</SelectItem>
                                    <SelectItem value="in" className="text-xs focus:bg-stone-50">In Stock</SelectItem>
                                    <SelectItem value="low" className="text-xs focus:bg-stone-50">Low Stock</SelectItem>
                                    <SelectItem value="out" className="text-xs focus:bg-stone-50">Out of Stock</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-stone-100 bg-stone-50/30">
                                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Product</th>
                                <th className="px-3 py-2.5 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">SKU</th>
                                <th className="hidden md:table-cell px-3 py-2.5 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Location</th>
                                <th className="px-3 py-2.5 text-right text-[10px] font-bold text-stone-400 uppercase tracking-widest">Available</th>
                                <th className="hidden md:table-cell px-3 py-2.5 text-right text-[10px] font-bold text-stone-400 uppercase tracking-widest">Reserved</th>
                                <th className="hidden lg:table-cell px-3 py-2.5 text-right text-[10px] font-bold text-stone-400 uppercase tracking-widest">Cost Value</th>
                                <th className="px-3 py-2.5 text-right text-[10px] font-bold text-stone-400 uppercase tracking-widest">Status</th>
                                <th className="px-4 py-2.5 text-right text-[10px] font-bold text-stone-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                            {isLoadingInventory ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-10 text-center text-xs text-stone-400">Loading inventory…</td>
                                </tr>
                            ) : paginatedInventory.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-12 text-center">
                                        <Package size={24} className="mx-auto text-stone-300 mb-2" />
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
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="h-9 w-9 shrink-0 bg-stone-100 border border-stone-200 rounded-lg overflow-hidden">
                                                    <img
                                                        className="h-full w-full object-contain"
                                                        src={product?.media?.[0]?.url || '/placeholder.png'}
                                                        alt={product?.name || variant?.sku}
                                                        onError={handleImgError}
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-stone-800 truncate tracking-tight leading-tight" title={product?.name}>
                                                        {product?.name || 'Undefined Product'}
                                                    </p>
                                                    <span className="text-[10px] text-stone-400 bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded font-medium">
                                                        {product?.category || 'Standard'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-xs font-mono font-semibold text-stone-500">
                                            {variant?.sku || 'N/A'}
                                        </td>
                                        <td className="hidden md:table-cell px-3 py-3 whitespace-nowrap text-xs font-mono text-stone-400 uppercase">
                                            {item.location || 'WH-01'}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-right">
                                            <span className={cn(
                                                'text-sm font-bold tabular-nums font-mono',
                                                item.quantity === 0 ? 'text-rose-600' :
                                                    item.quantity <= item.reorderLevel ? 'text-amber-700' : 'text-stone-900'
                                            )}>
                                                {item.quantity}
                                            </span>
                                            <p className="text-[10px] text-stone-400 font-mono">/{item.reorderLevel} min</p>
                                        </td>
                                        <td className="hidden md:table-cell px-3 py-3 whitespace-nowrap text-right text-xs font-mono font-semibold text-amber-600 tabular-nums">
                                            {item.reserved || 0}
                                        </td>
                                        <td className="hidden lg:table-cell px-3 py-3 whitespace-nowrap text-right text-xs font-mono font-bold text-stone-700 tabular-nums">
                                            ₹{costValue.toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-right">
                                            <StockBadge qty={item.quantity} reorderLevel={item.reorderLevel} />
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white hover:bg-stone-50 text-stone-600 border border-stone-200 text-[11px] font-semibold transition-colors"
                                                    onClick={() => setTransferModal({
                                                        isOpen: true,
                                                        sku: variant?.sku || item.variantId,
                                                        variantId: item.variantId,
                                                        sourceWarehouseId: item.warehouseId ?? '',
                                                        currentQty: item.quantity,
                                                    })}
                                                >
                                                    <MoveHorizontal size={11} /> Transfer
                                                </button>
                                                <button
                                                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition-colors"
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

                {/* Mobile Cards */}
                <div className="sm:hidden divide-y divide-stone-100">
                    {isLoadingInventory ? (
                        <div className="p-8 text-center text-xs text-stone-400">Loading inventory…</div>
                    ) : paginatedInventory.length === 0 ? (
                        <div className="p-10 text-center">
                            <Package size={24} className="mx-auto text-stone-300 mb-2" />
                            <p className="text-xs text-stone-400">
                                {currentSearch || currentStockStatus !== 'all' || currentCategory !== 'all'
                                    ? 'No items match filters' : 'Inventory is empty'}
                            </p>
                        </div>
                    ) : paginatedInventory.map((item: WarehouseInventory) => {
                        const variant = item.variant;
                        const product = variant?.product;
                        const isLow = item.quantity > 0 && item.quantity <= item.reorderLevel;
                        const isOut = item.quantity === 0;
                        return (
                            <div key={item.id} className="px-3 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-11 w-11 shrink-0 bg-stone-100 border border-stone-200 rounded-lg overflow-hidden">
                                        <img
                                            className="h-full w-full object-contain"
                                            src={product?.media?.[0]?.url || '/placeholder.png'}
                                            alt={product?.name || variant?.sku}
                                            onError={handleImgError}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-stone-800 truncate tracking-tight">{product?.name || 'Undefined Product'}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                            <span className="text-[10px] font-mono font-bold text-stone-400">{variant?.sku || 'N/A'}</span>
                                            <StockBadge qty={item.quantity} reorderLevel={item.reorderLevel} />
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <span className={cn(
                                            'text-lg font-extrabold tabular-nums font-mono leading-none',
                                            isOut ? 'text-rose-600' : isLow ? 'text-amber-700' : 'text-stone-900'
                                        )}>
                                            {item.quantity}
                                        </span>
                                        <p className="text-[10px] text-stone-400 font-mono text-right">/{item.reorderLevel}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-2.5">
                                    <button
                                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white text-stone-600 border border-stone-200 text-xs font-semibold transition-colors active:bg-stone-50"
                                        onClick={() => setTransferModal({
                                            isOpen: true,
                                            sku: variant?.sku || item.variantId,
                                            variantId: item.variantId,
                                            sourceWarehouseId: item.warehouseId ?? '',
                                            currentQty: item.quantity,
                                        })}
                                    >
                                        <MoveHorizontal size={12} /> Transfer
                                    </button>
                                    <button
                                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold transition-colors active:bg-indigo-700"
                                        onClick={() => setAdjustmentModal({
                                            isOpen: true,
                                            sku: variant?.sku || item.variantId,
                                            currentQty: item.quantity,
                                        })}
                                    >
                                        <RefreshCw size={12} /> Adjust
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pagination */}
                {!isLoadingInventory && totalItems > 0 && (
                    <div className="px-3 sm:px-5 py-3 border-t border-stone-100 bg-stone-50/40 flex items-center justify-between">
                        <p className="text-xs text-stone-400 font-mono tabular-nums">
                            <span className="text-stone-600 font-semibold">{(currentPage - 1) * currentLimit + 1}</span>
                            –
                            <span className="text-stone-600 font-semibold">{Math.min(currentPage * currentLimit, totalItems)}</span>
                            <span className="hidden sm:inline"> of <span className="text-stone-600 font-semibold">{totalItems}</span></span>
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button
                                disabled={currentPage <= 1}
                                onClick={handlePrevPage}
                                className="h-8 w-8 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={13} />
                            </button>
                            <span className="px-3 h-8 flex items-center text-xs font-mono font-bold text-stone-600 border border-stone-200 rounded-lg bg-white tabular-nums">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                disabled={currentPage >= totalPages}
                                onClick={handleNextPage}
                                className="h-8 w-8 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={13} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── STOCK MOVEMENT HISTORY ─── */}
            <CollapsibleSection
                icon={<History size={12} />}
                title="Movement History"
                badge={
                    <span className="text-[10px] font-mono font-bold text-stone-400 bg-white border border-stone-200 px-2 py-0.5 rounded-md ml-1">
                        {Math.min(stockMovements.length, 20)}
                    </span>
                }
                defaultOpen={false}
            >
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto max-h-[300px]">
                    <table className="w-full">
                        <thead className="sticky top-0 bg-white z-10">
                            <tr className="border-b border-stone-100">
                                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Date</th>
                                <th className="px-3 py-2.5 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">SKU</th>
                                <th className="px-3 py-2.5 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Type</th>
                                <th className="px-3 py-2.5 text-right text-[10px] font-bold text-stone-400 uppercase tracking-widest">Qty</th>
                                <th className="hidden md:table-cell px-4 py-2.5 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Reason</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                            {stockMovements.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-8 text-center text-xs text-stone-400">No stock movements recorded</td>
                                </tr>
                            ) : stockMovements.slice(0, 20).map(mov => (
                                <tr key={mov.id} className="hover:bg-stone-50/60 transition-colors">
                                    <td className="px-4 py-2.5 whitespace-nowrap text-[11px] font-mono text-stone-400 tabular-nums">
                                        {new Date(mov.date).toLocaleDateString('en-IN', DATE_OPTS_MOV)}
                                    </td>
                                    <td className="px-3 py-2.5 whitespace-nowrap text-xs font-mono font-semibold text-stone-700">{mov.sku}</td>
                                    <td className="px-3 py-2.5 whitespace-nowrap"><MovTypeBadge type={mov.type} /></td>
                                    <td className="px-3 py-2.5 whitespace-nowrap text-right text-xs font-bold font-mono text-stone-900 tabular-nums">{mov.quantity}</td>
                                    <td className="hidden md:table-cell px-4 py-2.5 text-xs text-stone-400 max-w-[200px]">
                                        <span className="line-clamp-1">{mov.reason || '—'}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile movement cards */}
                <div className="sm:hidden divide-y divide-stone-100">
                    {stockMovements.length === 0 ? (
                        <div className="p-6 text-center text-xs text-stone-400">No stock movements recorded</div>
                    ) : stockMovements.slice(0, 20).map(mov => (
                        <div key={mov.id} className="flex items-center gap-3 px-3 py-2.5">
                            <MovTypeBadge type={mov.type} />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-mono font-semibold text-stone-700 truncate">{mov.sku}</p>
                                <p className="text-[10px] text-stone-400 font-mono">
                                    {new Date(mov.date).toLocaleDateString('en-IN', DATE_OPTS_MOV_MOBILE)}
                                    {mov.reason && <span> · {mov.reason}</span>}
                                </p>
                            </div>
                            <span className="text-sm font-bold font-mono text-stone-900 tabular-nums flex-shrink-0">{mov.quantity}</span>
                        </div>
                    ))}
                </div>
            </CollapsibleSection>

            {/* ─── ADJUSTMENT DIALOG ─── */}
            <Dialog open={!!adjustmentModal} onOpenChange={handleCloseAdjustment}>
                <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md bg-white border-stone-200 shadow-xl rounded-xl">
                    <div className="h-0.5 w-full bg-gradient-to-r from-indigo-400 to-violet-400 -mt-6 mb-4 rounded-t-xl" />
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold text-stone-900 tracking-tight">Stock Adjustment</DialogTitle>
                        <DialogDescription className="text-xs text-stone-400">
                            SKU: <span className="font-mono font-semibold text-stone-600">{adjustmentModal?.sku}</span>
                        </DialogDescription>
                    </DialogHeader>
                    {adjustmentModal && (
                        <div className="space-y-3 py-1">
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
                                        <SelectItem value="INWARD" className="text-xs focus:bg-stone-50">Inward (Replenishment)</SelectItem>
                                        <SelectItem value="ADJUSTMENT" className="text-xs focus:bg-stone-50">Manual Correction</SelectItem>
                                        <SelectItem value="OUTWARD" className="text-xs focus:bg-stone-50">Outward (Loss / Damage)</SelectItem>
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
                                    className="w-full min-h-[72px] px-3 py-2 text-xs border border-stone-200 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none bg-white resize-none text-stone-700 placeholder:text-stone-400"
                                    value={adjReason}
                                    onChange={e => setAdjReason(e.target.value)}
                                    placeholder="Brief explanation…"
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2 pt-1 flex-row">
                        <button onClick={handleCloseAdjustment}
                            className="flex-1 h-10 rounded-lg border border-stone-200 bg-white text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleAdjustment}
                            className="flex-1 h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm">
                            Save Adjustment
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── TRANSFER DIALOG ─── */}
            <Dialog open={!!transferModal} onOpenChange={handleCloseTransfer}>
                <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md bg-white border-stone-200 shadow-xl rounded-xl">
                    <div className="h-0.5 w-full bg-gradient-to-r from-violet-400 to-indigo-400 -mt-6 mb-4 rounded-t-xl" />
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold text-stone-900 tracking-tight">Warehouse Transfer</DialogTitle>
                        <DialogDescription className="text-xs text-stone-400">
                            SKU: <span className="font-mono font-semibold text-stone-600">{transferModal?.sku}</span>
                        </DialogDescription>
                    </DialogHeader>
                    {transferModal && (
                        <div className="space-y-3 py-1">
                            <div className="px-3 py-2.5 bg-stone-50 border border-stone-100 rounded-lg flex items-center justify-between gap-2">
                                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest flex-shrink-0">Available at Source</span>
                                <span className="text-sm font-bold text-stone-900 font-mono truncate">
                                    {transferModal.currentQty} units · <span className="text-stone-400 text-xs">{transferModal.sourceWarehouseId}</span>
                                </span>
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
                                    className="w-full min-h-[72px] px-3 py-2 text-xs border border-stone-200 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none bg-white resize-none text-stone-700 placeholder:text-stone-400"
                                    value={transferReason} onChange={e => setTransferReason(e.target.value)}
                                    placeholder="Reason for transfer…" />
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2 pt-1 flex-row">
                        <button onClick={handleCloseTransfer}
                            className="flex-1 h-10 rounded-lg border border-stone-200 bg-white text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleTransfer} disabled={!transferQty || !transferTarget}
                            className="flex-1 h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                            Confirm Transfer
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── AUDIT LOG DIALOG ─── */}
            <Dialog open={auditLogModal} onOpenChange={setAuditLogModal}>
                <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl bg-white border-stone-200 shadow-xl rounded-xl">
                    <div className="h-0.5 w-full bg-gradient-to-r from-stone-300 via-stone-400 to-stone-300 -mt-6 mb-4 rounded-t-xl" />
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold text-stone-900 tracking-tight">Audit Log</DialogTitle>
                        <DialogDescription className="text-xs text-stone-400">Recent system actions</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[60dvh] sm:h-[400px] w-full rounded-lg border border-stone-100 bg-stone-50 p-2.5">
                        {isLoadingAudit ? (
                            <div className="text-center text-xs text-stone-400 mt-8">Loading logs…</div>
                        ) : auditLogs.length === 0 ? (
                            <div className="text-center text-xs text-stone-400 mt-8">No audit logs found.</div>
                        ) : (
                            <div className="space-y-2">
                                {auditLogs.map((log: any) => (
                                    <div key={log.id} className="bg-white border border-stone-100 rounded-lg px-3 py-2.5">
                                        <div className="flex items-start justify-between gap-2 mb-0.5">
                                            <span className="text-xs font-bold text-stone-800">{log.action || 'Action'}</span>
                                            <span className="text-[10px] font-mono text-stone-400 tabular-nums flex-shrink-0">
                                                {new Date(log.createdAt).toLocaleDateString('en-IN', DATE_OPTS_AUDIT)}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-stone-500">by <span className="font-semibold text-stone-700">{log.actor}</span> · {log.entityType} <span className="font-mono text-stone-400 text-[10px]">({log.entityId})</span></p>
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
