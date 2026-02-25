'use client';

import React, { useState, useMemo } from 'react';
import { useShop } from '@/context/ShopContext';
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
    Filter
} from 'lucide-react';

const InventoryManager = () => {
    const {
        products,
        inventory,
        stockMovements,
        adjustStock,
    } = useShop();

    const [adjustmentModal, setAdjustmentModal] = useState<{
        isOpen: boolean;
        sku: string;
        currentQty: number;
    } | null>(null);
    const [adjType, setAdjType] = useState<StockMovementType>('INWARD');
    const [adjQty, setAdjQty] = useState(0);
    const [adjReason, setAdjReason] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

    const handleAdjustment = (e: React.FormEvent) => {
        e.preventDefault();
        if (adjustmentModal && adjQty > 0) {
            adjustStock(
                adjustmentModal.sku,
                adjQty,
                adjType,
                adjReason || 'Manual Adjustment'
            );
            setAdjustmentModal(null);
            setAdjQty(0);
            setAdjReason('');
            setAdjType('INWARD');
        }
    };

    const filteredInventory = useMemo(() => {
        return inventory.filter(item => {
            const product = products.find(p => p.id === item.productId);
            const searchStr = searchTerm.toLowerCase();
            const matchesSearch =
                item.sku.toLowerCase().includes(searchStr) ||
                (product && product.name.toLowerCase().includes(searchStr));

            if (!matchesSearch) return false;

            if (stockFilter === 'low') return item.quantity > 0 && item.quantity <= item.reorderLevel;
            if (stockFilter === 'out') return item.quantity === 0;
            return true;
        });
    }, [inventory, products, searchTerm, stockFilter]);

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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">Stock Levels</h3>

                        <div className="flex flex-col sm:flex-row gap-2">
                            {/* Stock Filter */}
                            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-1.5">
                                <Filter size={16} className="text-gray-400" />
                                <select
                                    value={stockFilter}
                                    onChange={e => setStockFilter(e.target.value as 'all' | 'low' | 'out')}
                                    className="text-sm border-0 focus:ring-0 bg-transparent pr-8"
                                >
                                    <option value="all">All Items</option>
                                    <option value="low">Low Stock</option>
                                    <option value="out">Out of Stock</option>
                                </select>
                            </div>

                            {/* Search */}
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search SKU or product..."
                                    className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
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
                            {filteredInventory.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <Package size={48} className="mx-auto text-gray-300 mb-3" />
                                        <p className="text-gray-500">
                                            {searchTerm || stockFilter !== 'all'
                                                ? 'No items match your filters'
                                                : 'No inventory items yet'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredInventory.map(item => {
                                    const product = products.find(p => p.id === item.productId);
                                    const isLow = item.quantity > 0 && item.quantity <= item.reorderLevel;
                                    const isOut = item.quantity === 0;

                                    return (
                                        <tr key={item.sku} className="hover:bg-gray-50">
                                            <td className="px-4 sm:px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                                        <img
                                                            className="h-full w-full object-contain"
                                                            src={product?.image}
                                                            alt={product?.name}
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = 'https://picsum.photos/300/300';
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                                                            {product?.name || 'Unknown Product'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {product?.category}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                                                {item.sku}
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
                                                <button
                                                    onClick={() =>
                                                        setAdjustmentModal({
                                                            isOpen: true,
                                                            sku: item.sku,
                                                            currentQty: item.quantity,
                                                        })
                                                    }
                                                    className="text-blue-600 hover:text-blue-900 font-medium"
                                                >
                                                    Adjust
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
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
                                    required
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
        </div>
    );
};

export default InventoryManager;