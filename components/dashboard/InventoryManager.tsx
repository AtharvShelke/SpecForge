'use client';

import React, { useState, useMemo, useEffect, FormEvent } from 'react';
import { useShop } from '@/context/ShopContext';
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
    History
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

const InventoryManager = () => {
    const { products } = useShop();
    const {
        inventory,
        stockMovements,
        adjustStock,
        transferStock,
    } = useAdmin();

    const [adjustmentModal, setAdjustmentModal] = useState<{
        isOpen: boolean;
        sku: string;
        currentQty: number;
    } | null>(null);

    // Transfer Modal State
    const [transferModal, setTransferModal] = useState<{
        isOpen: boolean;
        sku: string;
        variantId: string;
        sourceWarehouseId: string;
        currentQty: number;
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
            if (res.ok) {
                const logs = await res.json();
                setAuditLogs(logs);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingAudit(false);
        }
    };

    // Pagination & Filtering State
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

    useEffect(() => {
        setSearchTerm(currentSearch);
    }, [currentSearch]);

    const debouncedSearch = useDebounce(searchTerm, 500);
    useEffect(() => {
        if (debouncedSearch !== currentSearch) {
            updateQueryParams({ q: debouncedSearch });
        }
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
                } else {
                    setPaginatedInventory([]);
                    setTotalItems(0);
                }
            } catch (err) {
                console.error("Failed to fetch paginated inventory:", err);
                setPaginatedInventory([]);
                setTotalItems(0);
            } finally {
                setIsLoadingInventory(false);
            }
        };

        fetchPaginatedInventory();
    }, [searchParams, refreshTrigger]);

    const updateQueryParams = (newParams: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());

        if (!newParams.page && (newParams.category !== undefined || newParams.q !== undefined || newParams.f_stock_status !== undefined)) {
            params.set("page", "1");
        }

        Object.entries(newParams).forEach(([key, value]) => {
            if (value === null || value === "all" || value === "") {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        });

        router.push(`${pathname}?${params.toString()}`);
    };

    const handleAdjustment = (e: FormEvent) => {
        e.preventDefault();
        if (adjustmentModal && adjQty > 0) {
            adjustStock(
                adjustmentModal.sku,
                adjQty,
                adjType,
                adjReason
            );
            setAdjustmentModal(null);
            setAdjQty(0);
            setAdjReason('');
            setAdjType('INWARD');
            setRefreshTrigger(prev => !prev);
        }
    };

    const handleTransfer = async (e: FormEvent) => {
        e.preventDefault();
        if (transferModal && transferQty > 0 && transferTarget) {
            try {
                await transferStock(
                    transferModal.sourceWarehouseId,
                    transferTarget,
                    transferModal.variantId,
                    transferQty,
                    transferReason
                );
                setTransferModal(null);
                setTransferQty(0);
                setTransferTarget('');
                setTransferReason('');
                setRefreshTrigger(prev => !prev);
            } catch (err) {
                console.error("Transfer failed", err);
            }
        }
    };

    const lowStockCount = inventory.filter(i => i.quantity > 0 && i.quantity <= i.reorderLevel).length;
    const outOfStockCount = inventory.filter(i => i.quantity === 0).length;
    const totalStockValue = inventory.reduce(
        (sum, item) => sum + item.quantity * item.costPrice,
        0
    );

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-zinc-900">Inventory Management</h2>
                    <p className="text-sm text-zinc-500 mt-0.5">
                        Real-time stock tracking · {inventory.length} active SKUs
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={openAuditLog} className="h-8 text-sm font-medium gap-2 rounded-md">
                        <History size={14} /> Audit Log
                    </Button>
                    <Button size="sm" className="h-8 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 gap-2 rounded-md">
                        <RefreshCw size={14} /> Sync
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Valuation', value: `₹${totalStockValue.toLocaleString('en-IN')}`, sub: `Across ${inventory.length} SKUs`, icon: <DollarSign size={16} />, color: 'text-zinc-900 bg-white border-zinc-200' },
                    { label: 'Low Stock Items', value: lowStockCount, sub: 'Requires immediate reorder', icon: <AlertTriangle size={16} />, color: 'text-amber-600 bg-amber-50/50 border-amber-100' },
                    { label: 'Out of Stock', value: outOfStockCount, sub: 'Zero availability recorded', icon: <Package size={16} />, color: 'text-red-600 bg-red-50/50 border-red-100' },
                    { label: 'Total Stocked Units', value: inventory.reduce((s, i) => s + i.quantity, 0), sub: 'Gross inventory count', icon: <TrendingUp size={16} />, color: 'text-zinc-600 bg-white border-zinc-200' },
                ].map((item, idx) => (
                    <Card key={idx} className={cn("border shadow-sm", item.color)}>
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-medium text-zinc-500">{item.label}</p>
                                <div className="p-1.5 rounded-md bg-white/50 shrink-0">{item.icon}</div>
                            </div>
                            <p className="text-2xl font-semibold leading-tight tabular-nums">{item.value}</p>
                            <p className="text-xs text-zinc-400 mt-1">{item.sub}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Stock Levels Table */}
            <Card className="border shadow-sm overflow-hidden">
                <CardHeader className="px-6 py-5 border-b border-zinc-100 bg-zinc-50/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                                <Package size={16} className="text-zinc-500" />
                                Stock Levels
                            </CardTitle>
                            <CardDescription className="text-xs text-zinc-500 mt-1">
                                {totalItems} items matching current filters
                            </CardDescription>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative group max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" size={14} />
                                <Input
                                    placeholder="SKU, Name..."
                                    className="pl-9 h-9 text-xs bg-white border-zinc-200 focus-visible:ring-zinc-900 shadow-none transition-all w-48 sm:w-64"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <Select value={currentCategory} onValueChange={(val) => updateQueryParams({ category: val })}>
                                <SelectTrigger className="h-9 text-sm font-medium w-36 border-zinc-200 bg-white shadow-none">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-xs">All Categories</SelectItem>
                                    {Object.values(Category).map(cat => (
                                        <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={currentStockStatus} onValueChange={(val) => updateQueryParams({ f_stock_status: val })}>
                                <SelectTrigger className="h-9 text-[10px] font-bold uppercase tracking-wider w-36 border-zinc-200 bg-white shadow-none">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-xs">Any Availability</SelectItem>
                                    <SelectItem value="in" className="text-xs">In Stock</SelectItem>
                                    <SelectItem value="low" className="text-xs">Low Stock</SelectItem>
                                    <SelectItem value="out" className="text-xs">Out of Stock</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-200">
                        <thead className="bg-zinc-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">
                                    Product
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">
                                    SKU
                                </th>
                                <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">
                                    Location
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-zinc-500 uppercase tracking-wide">
                                    Availability
                                </th>
                                <th className="hidden sm:table-cell px-6 py-4 text-right text-xs font-medium text-zinc-500 uppercase tracking-wide">
                                    Reserved
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-zinc-500 uppercase tracking-wide">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-zinc-500 uppercase tracking-wide">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-zinc-200">
                            {isLoadingInventory ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-zinc-400">
                                        Loading inventory...
                                    </td>
                                </tr>
                            ) : paginatedInventory.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center">
                                        <Package size={32} className="mx-auto text-zinc-200 mb-4" />
                                        <p className="text-sm text-zinc-400">
                                            {currentSearch || currentStockStatus !== 'all' || currentCategory !== 'all'
                                                ? 'No items match current filters'
                                                : 'Inventory is empty'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedInventory.map((item: WarehouseInventory & { product?: any }) => {
                                    const product = products.find(p => p.variants?.some(v => v.id === item.variantId));
                                    const variant = product?.variants?.find(v => v.id === item.variantId);

                                    return (
                                        <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 shrink-0 bg-zinc-100 rounded-lg overflow-hidden border border-zinc-200 p-1">
                                                        <img
                                                            className="h-full w-full object-contain"
                                                            src={product?.media?.[0]?.url || '/placeholder.png'}
                                                            alt={product?.name || variant?.sku}
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = 'https://picsum.photos/300/300';
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-zinc-900 truncate leading-tight mb-0.5" title={product?.name}>
                                                            {product?.name || 'Undefined Product'}
                                                        </div>
                                                        <Badge variant="outline" className="text-[11px] h-5 font-medium rounded bg-zinc-50 border-zinc-200 text-zinc-500 px-1.5">
                                                            {product?.category || 'Standard'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-medium text-zinc-600">
                                                {variant?.sku || 'N/A'}
                                            </td>
                                            <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-xs font-medium text-zinc-500 uppercase tracking-tighter">
                                                {item.location || 'WAREHOUSE-01'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-zinc-900 tabular-nums">
                                                {item.quantity}
                                            </td>
                                            <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-right text-xs font-medium text-amber-600 tabular-nums">
                                                {item.reserved}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <Badge className={cn(
                                                    "text-[11px] font-medium h-6 px-2 rounded border",
                                                    item.quantity === 0 ? "bg-red-50 text-red-700 border-red-100" :
                                                        item.quantity <= item.reorderLevel ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                            "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                )}>
                                                    {item.quantity === 0 ? 'Out of Stock' :
                                                        item.quantity <= item.reorderLevel ? 'Low Level' :
                                                            'Optimal'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 text-xs font-medium px-2 gap-1.5 border-zinc-200 rounded-md"
                                                        onClick={() =>
                                                            setTransferModal({
                                                                isOpen: true,
                                                                sku: variant?.sku || item.variantId,
                                                                variantId: item.variantId,
                                                                sourceWarehouseId: item.warehouseId,
                                                                currentQty: item.quantity,
                                                            })
                                                        }
                                                    >
                                                        <MoveHorizontal size={12} /> Transfer
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 text-xs font-medium px-2 gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md"
                                                        onClick={() =>
                                                            setAdjustmentModal({
                                                                isOpen: true,
                                                                sku: variant?.sku || item.variantId,
                                                                currentQty: item.quantity,
                                                            })
                                                        }
                                                    >
                                                        <RefreshCw size={12} /> Adjust
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {!isLoadingInventory && totalItems > 0 && (
                    <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/30 flex items-center justify-between">
                        <div className="text-xs text-zinc-500">
                            Showing <span className="font-medium text-zinc-700">{(currentPage - 1) * currentLimit + 1}</span> to <span className="font-medium text-zinc-700">{Math.min(currentPage * currentLimit, totalItems)}</span> of <span className="font-medium text-zinc-700">{totalItems}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage <= 1}
                                onClick={() => updateQueryParams({ page: String(currentPage - 1) })}
                                className="h-8 w-8 p-0 border-zinc-200"
                            >
                                <ChevronLeft size={16} />
                            </Button>
                            <div className="px-3 h-8 flex items-center text-xs font-medium border border-zinc-200 rounded-md bg-white text-zinc-600">
                                {currentPage} / {Math.max(1, Math.ceil(totalItems / currentLimit))}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage >= Math.ceil(totalItems / currentLimit)}
                                onClick={() => updateQueryParams({ page: String(currentPage + 1) })}
                                className="h-8 w-8 p-0 border-zinc-200"
                            >
                                <ChevronRight size={16} />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Stock Movement History */}
            <Card className="border shadow-sm overflow-hidden">
                <CardHeader className="px-6 py-5 border-b border-zinc-100 bg-zinc-50/50">
                    <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                        <History size={16} className="text-zinc-500" />
                        Stock Movement History
                    </CardTitle>
                </CardHeader>
                <div className="overflow-x-auto max-h-[300px]">
                    <table className="min-w-full divide-y divide-zinc-200">
                        <thead className="bg-zinc-50/50 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">SKU</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Type</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wide">Qty</th>
                                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Reasoning</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-zinc-200">
                            {stockMovements.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-zinc-400">
                                        No stock movements recorded
                                    </td>
                                </tr>
                            ) : (
                                stockMovements.slice(0, 20).map(mov => (
                                    <tr key={mov.id} className="hover:bg-zinc-50/30 transition-colors">
                                        <td className="px-6 py-3 whitespace-nowrap text-xs font-medium text-zinc-500">
                                            {new Date(mov.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap text-xs font-mono font-medium text-zinc-900">
                                            {mov.sku}
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            <Badge variant="outline" className={cn(
                                                "text-[11px] font-medium h-5 px-1.5 rounded",
                                                mov.type === 'INWARD' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                                            )}>
                                                {mov.type === 'INWARD' ? <ArrowDownRight size={10} className="mr-1" /> : <ArrowUpRight size={10} className="mr-1" />}
                                                {mov.type}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap text-xs text-right font-semibold text-zinc-900 tabular-nums">
                                            {mov.quantity}
                                        </td>
                                        <td className="hidden md:table-cell px-6 py-3 text-xs font-medium text-zinc-500">
                                            <span className="line-clamp-1">{mov.reason}</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Adjustment Dialog */}
            <Dialog open={!!adjustmentModal} onOpenChange={() => setAdjustmentModal(null)}>
                <DialogContent className="sm:max-w-md bg-white border-zinc-200">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-zinc-900">Stock Adjustment</DialogTitle>
                        <DialogDescription className="text-sm text-zinc-500">
                            Adjusting stock for SKU: <span className="font-medium text-zinc-700">{adjustmentModal?.sku}</span>
                        </DialogDescription>
                    </DialogHeader>
                    {adjustmentModal && (
                        <div className="space-y-4 py-2">
                            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                                <p className="text-xs text-zinc-500">Current Stock</p>
                                <p className="text-sm font-semibold text-zinc-900 mt-1">{adjustmentModal.currentQty} units</p>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-zinc-700">Type</label>
                                <Select value={adjType} onValueChange={(val: any) => setAdjType(val)}>
                                    <SelectTrigger className="h-9 text-sm border-zinc-200 bg-white rounded-md">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="INWARD" className="text-xs">Inward (Replenishment)</SelectItem>
                                        <SelectItem value="ADJUSTMENT" className="text-xs">Manual Correction</SelectItem>
                                        <SelectItem value="OUTWARD" className="text-xs">Outward (Loss/Damage)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-zinc-700">Quantity</label>
                                <Input
                                    type="number"
                                    className="h-10 text-sm font-bold border-zinc-200"
                                    value={adjQty}
                                    onChange={e => setAdjQty(Number(e.target.value))}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-zinc-700">Reason</label>
                                <textarea
                                    className="w-full min-h-[80px] px-3 py-2 text-xs font-medium border border-zinc-200 rounded-lg focus-visible:ring-zinc-900 outline-none"
                                    value={adjReason}
                                    onChange={e => setAdjReason(e.target.value)}
                                    placeholder="Brief explanation for this audit entry..."
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter className="sm:justify-end gap-2">
                        <Button variant="outline" onClick={() => setAdjustmentModal(null)} className="h-9 text-sm font-medium border-zinc-200 rounded-md">
                            Cancel
                        </Button>
                        <Button onClick={handleAdjustment} className="h-9 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-md">
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Transfer Dialog */}
            <Dialog open={!!transferModal} onOpenChange={() => setTransferModal(null)}>
                <DialogContent className="sm:max-w-md bg-white border-zinc-200">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-zinc-900">Warehouse Transfer</DialogTitle>
                        <DialogDescription className="text-sm text-zinc-500">
                            Transfer stock for SKU: <span className="font-medium text-zinc-700">{transferModal?.sku}</span>
                        </DialogDescription>
                    </DialogHeader>
                    {transferModal && (
                        <div className="space-y-4 py-2">
                            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                                <p className="text-xs text-zinc-500">Available at Source</p>
                                <p className="text-sm font-semibold text-zinc-900 mt-1">{transferModal.currentQty} units in {transferModal.sourceWarehouseId}</p>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-zinc-700">Destination Warehouse</label>
                                <Input
                                    className="h-9 text-sm border-zinc-200 rounded-md"
                                    value={transferTarget}
                                    onChange={e => setTransferTarget(e.target.value)}
                                    placeholder="Enter Facility ID..."
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-zinc-700">Quantity</label>
                                <Input
                                    type="number"
                                    max={transferModal.currentQty}
                                    className="h-10 text-sm font-bold border-zinc-200"
                                    value={transferQty}
                                    onChange={e => setTransferQty(Number(e.target.value))}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-zinc-700">Reason</label>
                                <textarea
                                    className="w-full min-h-[80px] px-3 py-2 text-xs font-medium border border-zinc-200 rounded-lg focus-visible:ring-zinc-900 outline-none"
                                    value={transferReason}
                                    onChange={e => setTransferReason(e.target.value)}
                                    placeholder="Enter reasoning for transfer..."
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter className="sm:justify-end gap-2">
                        <Button variant="outline" onClick={() => setTransferModal(null)} className="h-9 text-sm font-medium border-zinc-200 rounded-md">
                            Cancel
                        </Button>
                        <Button onClick={handleTransfer} className="h-9 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-md" disabled={!transferQty || !transferTarget}>
                            Transfer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Audit Log Dialog */}
            <Dialog open={auditLogModal} onOpenChange={setAuditLogModal}>
                <DialogContent className="sm:max-w-2xl bg-white border-zinc-200">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-zinc-900">Audit Log</DialogTitle>
                        <DialogDescription className="text-sm text-zinc-500">
                            Recent system actions
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                            {isLoadingAudit ? (
                                <div className="text-center text-zinc-500 mt-4">Loading logs...</div>
                            ) : auditLogs.length === 0 ? (
                                <div className="text-center text-zinc-500 mt-4">No audit logs found.</div>
                            ) : (
                                <div className="space-y-4">
                                    {auditLogs.map((log: any) => (
                                        <div key={log.id} className="text-sm border-b pb-2">
                                            <div className="font-semibold">{log.action || 'Action'} by {log.actor}</div>
                                            <div className="text-xs text-zinc-500">{new Date(log.createdAt).toLocaleString()}</div>
                                            <div className="text-xs text-zinc-600">Entity: {log.entityType} ({log.entityId})</div>
                                            {log.metadata && <pre className="text-[10px] mt-1 bg-zinc-50 p-1 rounded break-all whitespace-pre-wrap">{JSON.stringify(log.metadata, null, 2)}</pre>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default InventoryManager;