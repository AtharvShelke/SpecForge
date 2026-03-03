'use client';

import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { WarehouseInventory, Category } from '@/types';

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

    // Pagination & Filtering State
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [paginatedInventory, setPaginatedInventory] = useState<WarehouseInventory[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoadingInventory, setIsLoadingInventory] = useState(true);

    const currentPage = parseInt(searchParams.get("page") || "1", 10);
    const currentLimit = parseInt(searchParams.get("limit") || "10", 10);
    const currentCategory = searchParams.get("category") || "all";
    const currentSearch = searchParams.get("q") || "";
    const currentStockStatus = searchParams.get("f_stock_status") || "all";

    React.useEffect(() => {
        const fetchPaginatedInventory = async () => {
            setIsLoadingInventory(true);
            try {
                const query = new URLSearchParams(searchParams.toString());
                if (!query.has("limit")) query.set("limit", "10");
                if (!query.has("page")) query.set("page", "1");

                const res = await fetch(`/api/inventory?${query.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    // Defensively map items to array
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
    }, [searchParams]);

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

    const handleAdjustment = (e: React.FormEvent) => {
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
            // Refresh local paginated view after adjustment
            router.refresh();
        }
    };

    const handleTransfer = async (e: React.FormEvent) => {
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
                router.refresh();
            } catch (err) {
                console.error("Transfer failed", err);
            }
        }
    };

    // Calculate Global KPIs safely based off context 'inventory'
    const lowStockCount = inventory.filter(i => i.quantity > 0 && i.quantity <= i.reorderLevel).length;
    const outOfStockCount = inventory.filter(i => i.quantity === 0).length;
    const totalStockValue = inventory.reduce(
        (sum, item) => sum + item.quantity * item.costPrice,
        0
    );

    const getStockStatusClass = (quantity: number, reorderLevel: number): string => {
        if (quantity === 0) return 'bg-red-100 text-red-800';
        if (quantity <= reorderLevel) return 'bg-yellow-100 text-yellow-800';
        return 'bg-green-100 text-green-800';
    };

    const getStockStatusLabel = (quantity: number, reorderLevel: number): string => {
        if (quantity === 0) return 'Out of Stock';
        if (quantity <= reorderLevel) return 'Low Stock';
        return 'In Stock';
    };

    return (
        <div className="space-y-6">

            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Track stock levels and movements across all products
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Stock Value</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                ₹{totalStockValue.toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <DollarSign size={24} className="text-blue-600" />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <TrendingUp size={12} className="text-green-600" />
                        <span>Across {inventory.length} SKUs</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Low Stock Items</p>
                            <p className="text-2xl font-bold text-yellow-600 mt-1">
                                {lowStockCount}
                            </p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <AlertTriangle size={24} className="text-yellow-600" />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <TrendingDown size={12} className="text-yellow-600" />
                        <span>Requires attention</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Out of Stock</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">
                                {outOfStockCount}
                            </p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-lg">
                            <AlertTriangle size={24} className="text-red-600" />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span>Immediate reorder needed</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total SKUs</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {inventory.length}
                            </p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Package size={24} className="text-purple-600" />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span>Active inventory items</span>
                    </div>
                </div>
            </div>

            {/* Stock Levels Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">Stock Levels</h3>
                            <p className="text-sm text-gray-500">
                                {totalItems} items matching filters
                            </p>
                        </div>

                        {/* Filters Bar natively integrated */}
                        <div className="flex flex-wrap gap-3 items-center">
                            <div className="relative max-w-xs w-full sm:flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search SKU or product..."
                                    className="pl-9 pr-3 py-2 w-full text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={currentSearch}
                                    onChange={(e) => updateQueryParams({ q: e.target.value })}
                                />
                            </div>

                            <select
                                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                value={currentCategory}
                                onChange={(e) => updateQueryParams({ category: e.target.value })}
                            >
                                <option value="all">All Categories</option>
                                {Object.values(Category).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>

                            <select
                                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                value={currentStockStatus}
                                onChange={(e) => updateQueryParams({ f_stock_status: e.target.value })}
                            >
                                <option value="all">Any Stock Status</option>
                                <option value="in">In Stock (&gt;0)</option>
                                <option value="low">Low Stock (≤ Reorder Level)</option>
                                <option value="out">Out of Stock (=0)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    SKU
                                </th>
                                <th className="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Location
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Available
                                </th>
                                <th className="hidden sm:table-cell px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Reserved
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoadingInventory ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                                        Loading inventory items...
                                    </td>
                                </tr>
                            ) : paginatedInventory.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <Package size={48} className="mx-auto text-gray-300 mb-3" />
                                        <p className="text-gray-500">
                                            {currentSearch || currentStockStatus !== 'all' || currentCategory !== 'all'
                                                ? 'No items match your filters'
                                                : 'No inventory items yet'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedInventory.map((item: WarehouseInventory & { product?: any }) => {
                                    const product = products.find(p => p.variants?.some(v => v.id === item.variantId));
                                    const variant = product?.variants?.find(v => v.id === item.variantId);

                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-4 sm:px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
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
                                                        <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]" title={product?.name}>
                                                            {product?.name || 'Unknown Product'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {product?.category}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                                                {variant?.sku || 'Unknown'}
                                            </td>
                                            <td className="hidden md:table-cell px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {item.location}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                                                {item.quantity}
                                            </td>
                                            <td className="hidden sm:table-cell px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-orange-600">
                                                {item.reserved}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                                                <span className={`inline-flex px-2.5 py-1 text-xs rounded-full font-medium ${getStockStatusClass(item.quantity, item.reorderLevel)}`}>
                                                    {getStockStatusLabel(item.quantity, item.reorderLevel)}
                                                </span>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        onClick={() =>
                                                            setTransferModal({
                                                                isOpen: true,
                                                                sku: variant?.sku || item.variantId,
                                                                variantId: item.variantId,
                                                                sourceWarehouseId: item.warehouseId,
                                                                currentQty: item.quantity,
                                                            })
                                                        }
                                                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                                                    >
                                                        Transfer
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setAdjustmentModal({
                                                                isOpen: true,
                                                                sku: variant?.sku || item.variantId,
                                                                currentQty: item.quantity,
                                                            })
                                                        }
                                                        className="text-blue-600 hover:text-blue-900 font-medium"
                                                    >
                                                        Adjust
                                                    </button>
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
                    <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-white">
                        <div className="text-sm text-gray-500">
                            Showing <span className="font-semibold text-gray-900">{(currentPage - 1) * currentLimit + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(currentPage * currentLimit, totalItems)}</span> of <span className="font-semibold text-gray-900">{totalItems}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                disabled={currentPage <= 1}
                                onClick={() => updateQueryParams({ page: String(currentPage - 1) })}
                                className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <div className="px-4 py-1.5 text-sm font-medium border border-gray-200 rounded-md bg-gray-50">
                                Page {currentPage} of {Math.max(1, Math.ceil(totalItems / currentLimit))}
                            </div>
                            <button
                                disabled={currentPage >= Math.ceil(totalItems / currentLimit)}
                                onClick={() => updateQueryParams({ page: String(currentPage + 1) })}
                                className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Stock Movement History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Stock Movements</h3>
                </div>
                <div className="overflow-x-auto max-h-80">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    SKU
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quantity
                                </th>
                                <th className="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Reason
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {stockMovements.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                                        No stock movements recorded yet
                                    </td>
                                </tr>
                            ) : (
                                stockMovements.slice(0, 20).map(mov => (
                                    <tr key={mov.id} className="hover:bg-gray-50">
                                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-xs text-gray-600">
                                            {new Date(mov.date).toLocaleDateString('en-IN', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-xs font-mono text-gray-900">
                                            {mov.sku}
                                        </td>
                                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-xs">
                                            <span className={`flex items-center gap-1.5 ${mov.type === 'INWARD'
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                                }`}>
                                                {mov.type === 'INWARD' ? (
                                                    <ArrowDownRight size={14} />
                                                ) : (
                                                    <ArrowUpRight size={14} />
                                                )}
                                                {mov.type}
                                            </span>
                                        </td>
                                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-xs text-right font-semibold text-gray-900">
                                            {mov.quantity}
                                        </td>
                                        <td className="hidden md:table-cell px-4 sm:px-6 py-3 text-xs text-gray-600">
                                            <span className="line-clamp-1">{mov.reason}</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Adjustment Modal */}
            {adjustmentModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Adjust Stock
                            </h3>
                            <button
                                onClick={() => setAdjustmentModal(null)}
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleAdjustment} className="p-6 space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm font-medium text-blue-900">
                                    SKU: {adjustmentModal.sku}
                                </p>
                                <p className="text-xs text-blue-700 mt-1">
                                    Current stock: {adjustmentModal.currentQty} units
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Movement Type
                                </label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={adjType}
                                    onChange={e =>
                                        setAdjType(e.target.value as StockMovementType)
                                    }
                                >
                                    <option value="INWARD">Add Stock (Inward)</option>
                                    <option value="ADJUSTMENT">
                                        Correction (Reduce/Add)
                                    </option>
                                    <option value="OUTWARD">
                                        Remove Stock (Damage/Loss)
                                    </option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Quantity
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={adjQty}
                                    onChange={e => setAdjQty(Number(e.target.value))}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason
                                </label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={3}
                                    value={adjReason}
                                    onChange={e => setAdjReason(e.target.value)}
                                    placeholder="e.g., New shipment, Damaged goods..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setAdjustmentModal(null)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Save Adjustment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Transfer Modal */}
            {transferModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Transfer Stock
                            </h3>
                            <button
                                onClick={() => setTransferModal(null)}
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleTransfer} className="p-6 space-y-4">
                            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                                <p className="text-sm font-medium text-indigo-900">
                                    SKU: {transferModal.sku}
                                </p>
                                <p className="text-xs text-indigo-700 mt-1">
                                    Available to transfer: {transferModal.currentQty} units
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Target Warehouse ID
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={transferTarget}
                                    onChange={e => setTransferTarget(e.target.value)}
                                    placeholder="Enter Destination Warehouse ID"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Quantity to Transfer
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max={transferModal.currentQty}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={transferQty}
                                    onChange={e => setTransferQty(Number(e.target.value))}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason (Optional)
                                </label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={2}
                                    value={transferReason}
                                    onChange={e => setTransferReason(e.target.value)}
                                    placeholder="e.g., Rebalancing stock..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setTransferModal(null)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                    disabled={transferQty < 1 || transferQty > transferModal.currentQty || !transferTarget}
                                >
                                    Execute Transfer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryManager;