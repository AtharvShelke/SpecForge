'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { PurchaseOrder, Supplier, PurchaseOrderStatus } from '@/types';
import {
    PackagePlus, Truck, Search, Plus, ExternalLink, Calendar, PlusCircle, CheckCircle, PackageOpen, LayoutGrid, List, MoreVertical, Building2, UserCircle2, ArrowRightLeft, FileText, RefreshCw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Trash } from 'lucide-react';

const ProcurementManager = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [inventory, setInventory] = useState<any[]>([]);
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchProcurementData = useCallback(async () => {
        try {
            const [suppliersRes, poRes, inventoryRes, warehousesRes, productsRes] = await Promise.all([
                fetch('/api/procurement/suppliers'),
                fetch('/api/procurement/purchase-orders'),
                fetch('/api/inventory?limit=3000'),
                fetch('/api/warehouses'),
                fetch('/api/products?fields=minimal&limit=5000'),
            ]);
            setSuppliers(await suppliersRes.json());
            setPurchaseOrders(await poRes.json());
            const invData = await inventoryRes.json();
            setInventory(invData.items ?? (Array.isArray(invData) ? invData : []));
            setWarehouses(await warehousesRes.json());
            const prodData = await productsRes.json();
            setProducts(prodData.products ?? prodData);
        } catch (err) {
            console.error('Failed to fetch procurement data:', err);
        }
    }, []);

    const createPurchaseOrder = useCallback(async (po: Partial<PurchaseOrder>) => {
        try {
            const res = await fetch('/api/procurement/purchase-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(po),
            });
            if (res.ok) await fetchProcurementData();
        } catch (err) {
            console.error('Failed to create purchase order:', err);
        }
    }, [fetchProcurementData]);

    const receivePurchaseOrder = useCallback(async (id: string, items: any[]) => {
        try {
            const res = await fetch(`/api/procurement/purchase-orders/${id}/receive`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items }),
            });
            if (res.ok) await fetchProcurementData();
        } catch (err) {
            console.error('Failed to receive purchase order:', err);
        }
    }, [fetchProcurementData]);

    const createSupplier = useCallback(async (supplier: Partial<Supplier>) => {
        try {
            const res = await fetch('/api/procurement/suppliers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(supplier),
            });
            if (res.ok) await fetchProcurementData();
        } catch (err) {
            console.error('Failed to create supplier:', err);
        }
    }, [fetchProcurementData]);

    const updateSupplier = useCallback(async (id: string, supplier: Partial<Supplier>) => {
        try {
            const res = await fetch(`/api/procurement/suppliers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(supplier),
            });
            if (res.ok) await fetchProcurementData();
        } catch (err) {
            console.error('Failed to update supplier:', err);
        }
    }, [fetchProcurementData]);

    const syncData = useCallback(async () => {
        setIsLoading(true);
        await fetchProcurementData();
        setIsLoading(false);
    }, [fetchProcurementData]);

    useEffect(() => {
        fetchProcurementData();
    }, [fetchProcurementData]);

    const [activeTab, setActiveTab] = useState<'POs' | 'Suppliers'>('POs');

    // View State
    const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);
    const [receiveModal, setReceiveModal] = useState<PurchaseOrder | null>(null);

    // Modal States
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [isCreatePoModalOpen, setIsCreatePoModalOpen] = useState(false);

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'ALL'>('ALL');

    // Memos
    const filteredPOs = useMemo(() => {
        let result = purchaseOrders || [];
        if (statusFilter !== 'ALL') {
            result = result.filter(po => po.status === statusFilter);
        }
        if (searchQuery) {
            const lower = searchQuery.toLowerCase();
            result = result.filter(po =>
                po.id.toLowerCase().includes(lower) ||
                (po.supplier?.name.toLowerCase() || '').includes(lower)
            );
        }
        return result;
    }, [purchaseOrders, statusFilter, searchQuery]);

    const filteredSuppliers = useMemo(() => {
        let result = suppliers || [];
        if (searchQuery) {
            const lower = searchQuery.toLowerCase();
            result = result.filter(s =>
                s.name.toLowerCase().includes(lower) ||
                (s.email?.toLowerCase() || '').includes(lower)
            );
        }
        return result;
    }, [suppliers, searchQuery]);

    const getStatusVariant = (status: PurchaseOrderStatus | 'ALL') => {
        switch (status) {
            case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'PARTIAL': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'PENDING': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'CANCELLED': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-zinc-100 text-zinc-600 border-zinc-200';
        }
    };

    const handleOpenVendorModal = (supplier?: Supplier) => {
        if (supplier) {
            setEditingSupplier(supplier);
        } else {
            setEditingSupplier(null);
        }
        setIsVendorModalOpen(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* High-Impact Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                        <Truck className="w-5 h-5 text-zinc-400" />
                        Procurement
                    </h2>
                    <p className="text-sm text-zinc-500 mt-0.5">
                        Purchase orders · Vendor management · Inventory intake
                    </p>
                </div>

                <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-lg border border-zinc-200">
                    <Button
                        size="sm"
                        variant={activeTab === 'POs' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('POs')}
                        className={cn(
                            "h-8 text-sm font-medium gap-2 rounded-md",
                            activeTab === 'POs' ? "bg-white text-zinc-900 shadow-sm border border-zinc-200 hover:bg-white" : "text-zinc-500 hover:text-zinc-900 hover:bg-transparent"
                        )}
                    >
                        <FileText className="w-3.5 h-3.5" /> Purchase Orders
                    </Button>
                    <Button
                        size="sm"
                        variant={activeTab === 'Suppliers' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('Suppliers')}
                        className={cn(
                            "h-8 text-sm font-medium gap-2 rounded-md",
                            activeTab === 'Suppliers' ? "bg-white text-zinc-900 shadow-sm border border-zinc-200 hover:bg-white" : "text-zinc-500 hover:text-zinc-900 hover:bg-transparent"
                        )}
                    >
                        <Building2 className="w-3.5 h-3.5" /> Vendors ({suppliers?.length || 0})
                    </Button>
                    <div className="w-px h-4 bg-zinc-200 mx-0.5 hidden sm:block" />
                    <button
                        onClick={() => syncData()}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-50 text-zinc-600 border border-zinc-200 text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw size={12} className={cn(isLoading && "animate-spin")} /> Sync
                    </button>
                </div>
            </div>

            {/* Main Command Center */}
            <Card className="border shadow-sm overflow-hidden">
                <CardHeader className="flex flex-col sm:flex-row items-center justify-between px-6 py-5 border-b border-zinc-100 bg-zinc-50/50 gap-4">
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <Input
                                placeholder={`Search ${activeTab === 'POs' ? 'orders' : 'vendors'}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-9 bg-white border-zinc-200 text-sm placeholder:text-zinc-400 focus-visible:ring-indigo-500"
                            />
                        </div>
                        {activeTab === 'POs' && (
                            <div className="flex flex-wrap gap-1.5 ring-1 ring-zinc-200 p-1 rounded-lg bg-white/50">
                                {['ALL', 'PENDING', 'PARTIAL', 'COMPLETED', 'CANCELLED'].map(status => (
                                    <Badge
                                        key={status}
                                        variant="outline"
                                        className={cn(
                                            "cursor-pointer transition-all h-7 px-2.5 text-[11px] font-medium uppercase tracking-wide border-transparent rounded",
                                            statusFilter === status
                                                ? getStatusVariant(status as PurchaseOrderStatus | 'ALL') + " border-zinc-200 shadow-sm"
                                                : "text-zinc-400 hover:bg-zinc-50"
                                        )}
                                        onClick={() => setStatusFilter(status as PurchaseOrderStatus | 'ALL')}
                                    >
                                        {status}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    <Button
                        size="sm"
                        className="h-9 px-4 bg-indigo-600 text-white hover:bg-indigo-700 font-medium text-sm gap-2 rounded-md w-full sm:w-auto"
                        onClick={() => activeTab === 'POs' ? setIsCreatePoModalOpen(true) : handleOpenVendorModal()}
                    >
                        <Plus className="w-4 h-4" />
                        {activeTab === 'POs' ? 'New PO' : 'Add Vendor'}
                    </Button>
                </CardHeader>

                <CardContent className="p-0">
                    <ScrollArea className="h-[600px]">
                        {activeTab === 'POs' ? (
                            <div className="divide-y divide-zinc-100">
                                {filteredPOs.length === 0 ? (
                                    <div className="py-24 text-center">
                                        <FileText className="w-12 h-12 text-zinc-100 mx-auto mb-4" />
                                        <p className="text-sm text-zinc-400">No purchase orders found</p>
                                    </div>
                                ) : (
                                    filteredPOs.map(po => (
                                        <div key={po.id} className="p-5 flex items-center justify-between hover:bg-zinc-50/50 transition-all group">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-zinc-50 flex items-center justify-center shrink-0 border border-zinc-200 group-hover:border-zinc-300 group-hover:bg-white transition-all">
                                                    <PackagePlus className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold text-zinc-900 text-sm">PO-{po.id.substring(0, 8).toUpperCase()}</span>
                                                        <Badge variant="outline" className={cn("text-[11px] font-medium px-1.5 h-5 rounded", getStatusVariant(po.status))}>
                                                            {po.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs font-medium text-zinc-500 flex items-center gap-3">
                                                        <span className="text-zinc-900">{po.supplier?.name}</span>
                                                        <span className="text-zinc-200 tracking-normal opacity-50">•</span>
                                                        <span>{po.items?.length || 0} Line Items</span>
                                                        {po.expectedDelivery && (
                                                            <>
                                                                <span className="text-zinc-200 tracking-normal opacity-50">•</span>
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3 translate-y-[-1px]" />
                                                                    ETA: {new Date(po.expectedDelivery).toLocaleDateString()}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                {(po.status === 'PENDING' || po.status === 'PARTIAL') && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setReceiveModal(po)}
                                                        className="h-8 text-xs font-medium border-zinc-200 bg-white hover:bg-zinc-50 gap-2 shadow-sm rounded-md"
                                                    >
                                                        <PackageOpen className="w-3.5 h-3.5" />
                                                        Receive
                                                    </Button>
                                                )}
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => setSelectedPo(po)}
                                                    className="h-8 w-8 text-zinc-300 group-hover:text-zinc-900 transition-colors"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-100">
                                {filteredSuppliers.length === 0 ? (
                                    <div className="py-24 text-center text-zinc-300">
                                        <Building2 className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                        <p className="text-sm text-zinc-400">No vendors found</p>
                                    </div>
                                ) : (
                                    filteredSuppliers.map(sup => (
                                        <div key={sup.id} className="p-5 flex items-center justify-between hover:bg-zinc-50/50 transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400 group-hover:text-zinc-900 transition-colors">
                                                    <UserCircle2 className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-zinc-900 text-sm">{sup.name}</div>
                                                    <div className="text-xs text-zinc-500 mt-1">
                                                        {sup.email || 'No contact'} <span className="text-zinc-200 mx-1">•</span> {sup.phone || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-xs font-medium border-zinc-200 bg-white hover:bg-zinc-50 shadow-sm rounded-md"
                                                onClick={() => handleOpenVendorModal(sup)}
                                            >
                                                Edit
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* View PO Modal */}
            <Dialog open={!!selectedPo} onOpenChange={(open) => !open && setSelectedPo(null)}>
                <DialogContent className="sm:max-w-[750px] bg-white border-zinc-200 p-0 overflow-hidden shadow-2xl">
                    <DialogHeader className="p-8 border-b border-zinc-100 bg-zinc-50/50 pb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-lg font-semibold text-zinc-900">Purchase Order Details</DialogTitle>
                                <DialogDescription className="text-sm text-zinc-500 mt-1">
                                    PO ID: <span className="font-medium text-zinc-700">{selectedPo?.id}</span>
                                </DialogDescription>
                            </div>
                            {selectedPo && (
                                <Badge variant="outline" className={cn("text-[11px] font-medium px-3 h-6 rounded", getStatusVariant(selectedPo.status))}>
                                    {selectedPo.status}
                                </Badge>
                            )}
                        </div>
                    </DialogHeader>

                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-2 gap-12">
                            <div className="space-y-4">
                                <span className="text-xs font-medium text-zinc-400 border-b border-zinc-100 pb-2 block">Vendor</span>
                                <div className="space-y-2">
                                    <p className="text-sm font-semibold text-zinc-900">{selectedPo?.supplier?.name}</p>
                                    <Badge variant="secondary" className="bg-zinc-100 text-zinc-500 font-medium text-[11px] px-2 rounded">
                                        {selectedPo?.supplier?.email}
                                    </Badge>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <span className="text-xs font-medium text-zinc-400 border-b border-zinc-100 pb-2 block">Timeline</span>
                                <div className="space-y-2">
                                    <p className="text-xs text-zinc-500 flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 text-zinc-300" />
                                        Created: <span className="font-medium text-zinc-700">{selectedPo && new Date(selectedPo.createdAt).toLocaleDateString()}</span>
                                    </p>
                                    <p className="text-xs text-zinc-500 flex items-center gap-2">
                                        <Truck className="w-3.5 h-3.5 text-zinc-300" />
                                        Expected: <span className="font-semibold text-zinc-700">{selectedPo?.expectedDelivery ? new Date(selectedPo.expectedDelivery).toLocaleDateString() : 'TBD'}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-medium text-zinc-400 border-b border-zinc-100 pb-2">Line Items</h4>
                            <div className="border border-zinc-200 rounded-lg overflow-hidden bg-zinc-50/30">
                                <table className="w-full text-left">
                                    <thead className="bg-white border-b border-zinc-100">
                                        <tr className="text-xs text-zinc-500 uppercase tracking-wide">
                                            <th className="p-4 font-medium">Product / SKU</th>
                                            <th className="p-4 font-medium text-right">Unit Cost</th>
                                            <th className="p-4 font-medium text-center">Ordered / Received</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-200/50">
                                        {selectedPo?.items.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-white transition-colors">
                                                <td className="p-4">
                                                    <div className="font-medium text-zinc-900 text-xs">{item.variant?.product?.name || 'Unknown'}</div>
                                                    <div className="text-[11px] font-mono text-zinc-400 mt-0.5">{item.variantId.substring(0, 12).toUpperCase()}</div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className="font-medium text-zinc-700 text-xs tabular-nums">${item.unitCost.toFixed(2)}</span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center gap-4">
                                                        <span className="text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 tabular-nums">{item.quantityOrdered}</span>
                                                        <ArrowRightLeft className="w-3 h-3 text-zinc-300 shrink-0" />
                                                        <span className={cn(
                                                            "text-xs font-medium px-2 py-0.5 rounded border tabular-nums shadow-sm",
                                                            item.quantityReceived === item.quantityOrdered
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                : (item.quantityReceived > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-zinc-400 border-zinc-200')
                                                        )}>
                                                            {item.quantityReceived}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Vendor Modal */}
            <VendorModal
                isOpen={isVendorModalOpen}
                onClose={() => setIsVendorModalOpen(false)}
                supplier={editingSupplier}
                onSubmit={async (data: any) => {
                    if (editingSupplier) {
                        await updateSupplier(editingSupplier.id, data);
                    } else {
                        await createSupplier(data);
                    }
                    setIsVendorModalOpen(false);
                }}
            />

            {/* Create PO Modal */}
            <CreatePoModal
                isOpen={isCreatePoModalOpen}
                onClose={() => setIsCreatePoModalOpen(false)}
                onSubmit={async (data: any) => {
                    await createPurchaseOrder(data);
                    setIsCreatePoModalOpen(false);
                }}
                suppliers={suppliers}
                warehouses={warehouses}
                products={products}
            />

            {/* Receive Modal Placeholder - should be implemented if needed */}
            {/* ... similar refactoring for receiveModal if it has a custom component ... */}
        </div>
    );
};

// --- Sub-components ---

const VendorModal = ({ isOpen, onClose, supplier, onSubmit }: any) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });

    React.useEffect(() => {
        if (supplier) {
            setFormData({
                name: supplier.name || '',
                email: supplier.email || '',
                phone: supplier.phone || '',
                address: supplier.address || ''
            });
        } else {
            setFormData({ name: '', email: '', phone: '', address: '' });
        }
    }, [supplier, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-white border-zinc-200">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-zinc-900">
                        {supplier ? 'Edit Vendor' : 'Add Vendor'}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-zinc-500">
                        Vendor contact and logistics information.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-zinc-700">Name</Label>
                        <Input
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. SEMICONDUCTOR MANUFACTURING CORP"
                            className="h-10 text-xs font-bold border-zinc-200"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-zinc-700">Email</Label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="logistics@entity.com"
                                className="h-10 text-xs border-zinc-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-zinc-700">Phone</Label>
                            <Input
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+1 (INTL) 000-0000"
                                className="h-10 text-xs border-zinc-200"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-zinc-700">Address</Label>
                        <Input
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Full Logistics Intersection Point"
                            className="h-10 text-xs border-zinc-200"
                        />
                    </div>
                    <DialogFooter className="pt-4 gap-2">
                        <Button type="button" variant="outline" onClick={onClose} className="h-9 text-sm font-medium border-zinc-200 px-6 rounded-md">Cancel</Button>
                        <Button type="submit" className="h-9 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 px-6 rounded-md">
                            {supplier ? 'Save' : 'Add Vendor'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const CreatePoModal = ({ isOpen, onClose, onSubmit, suppliers, warehouses, products }: any) => {
    const [supplierId, setSupplierId] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [expectedDelivery, setExpectedDelivery] = useState('');
    const [items, setItems] = useState<any[]>([]);

    const handleAddItem = () => {
        setItems([...items, { variantId: '', quantityOrdered: 1, unitCost: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleUpdateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            supplierId,
            warehouseId,
            expectedDelivery: expectedDelivery || null,
            items: items.map(item => ({
                variantId: item.variantId,
                quantityOrdered: parseInt(item.quantityOrdered as any),
                unitCost: parseFloat(item.unitCost as any)
            }))
        });
    };

    const allVariants = useMemo(() => {
        return products?.flatMap((p: any) =>
            p.variants.map((v: any) => ({
                id: v.id,
                label: `${p.name} - ${v.sku}`,
                price: v.price
            }))
        ) || [];
    }, [products]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[850px] bg-white border-zinc-200 max-h-[95vh] flex flex-col p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="p-8 border-b border-zinc-100 bg-zinc-50/50">
                    <DialogTitle className="text-lg font-semibold text-zinc-900">Create Purchase Order</DialogTitle>
                    <DialogDescription className="text-sm text-zinc-500 mt-1">
                        Select supplier, destination, and items for this order.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                    <ScrollArea className="flex-1 p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-zinc-700">Supplier</Label>
                                    <select
                                        required
                                        className="w-full h-11 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-xs font-bold uppercase tracking-tight transition-all focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white"
                                        value={supplierId}
                                        onChange={(e) => setSupplierId(e.target.value)}
                                    >
                                        <option value="" className="text-zinc-300">SELECT SOURCE</option>
                                        {suppliers?.map((s: any) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-zinc-700">Destination Warehouse</Label>
                                    <select
                                        required
                                        className="w-full h-11 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-xs font-bold uppercase tracking-tight transition-all focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white"
                                        value={warehouseId}
                                        onChange={(e) => setWarehouseId(e.target.value)}
                                    >
                                        <option value="" className="text-zinc-300">SELECT HUB</option>
                                        {warehouses?.map((w: any) => (
                                            <option key={w.id} value={w.id}>{w.name} [{w.code}]</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-zinc-700">Expected Delivery Date</Label>
                                    <Input
                                        type="date"
                                        className="h-11 rounded-xl border-zinc-200 bg-zinc-50 font-bold text-xs focus:bg-white"
                                        value={expectedDelivery}
                                        onChange={(e) => setExpectedDelivery(e.target.value)}
                                    />
                                </div>
                                <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-xl">
                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                        Note: All inbound manifests are subjected to verification at the destination logistics hub. Discrepancies will be flagged for secondary audit.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                                <h4 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                                    <List className="w-4 h-4 text-zinc-400" /> Line Items
                                </h4>
                                <Button type="button" size="sm" onClick={handleAddItem} className="h-8 text-xs font-medium bg-zinc-100 text-zinc-900 hover:bg-zinc-200 border-zinc-200 shadow-none gap-2 rounded-md">
                                    <PlusCircle className="w-3.5 h-3.5" /> Add Item
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {items.length === 0 && (
                                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-zinc-200">
                                        <LayoutGrid className="w-10 h-10 text-zinc-100 mx-auto mb-3" />
                                        <p className="text-sm text-zinc-400">No items added yet</p>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    {items.map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-[1fr,120px,150px,50px] gap-4 items-end bg-zinc-50 hover:bg-zinc-100/5 transition-all p-4 rounded-2xl border border-zinc-100 shadow-sm relative group overflow-hidden">
                                            <div className="absolute top-0 left-0 w-[2px] h-full bg-zinc-200 group-hover:bg-zinc-900 transition-colors" />
                                            <div className="space-y-2">
                                                <Label className="text-xs font-medium text-zinc-500">Product / SKU</Label>
                                                <select
                                                    required
                                                    className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-0 text-xs font-bold uppercase tracking-tight focus:ring-1 focus:ring-zinc-900 transition-all"
                                                    value={item.variantId}
                                                    onChange={(e) => handleUpdateItem(idx, 'variantId', e.target.value)}
                                                >
                                                    <option value="">SELECT ASSET</option>
                                                    {allVariants.map((v: any) => (
                                                        <option key={v.id} value={v.id}>{v.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-medium text-zinc-500">Qty</Label>
                                                <Input
                                                    type="number"
                                                    className="h-10 text-xs font-bold text-center tabular-nums"
                                                    required
                                                    min="1"
                                                    value={item.quantityOrdered}
                                                    onChange={(e) => handleUpdateItem(idx, 'quantityOrdered', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-medium text-zinc-500">Unit Cost</Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        className="h-10 text-xs font-bold pl-7 tabular-nums"
                                                        required
                                                        min="0"
                                                        value={item.unitCost}
                                                        onChange={(e) => handleUpdateItem(idx, 'unitCost', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                className="h-10 w-10 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                                onClick={() => handleRemoveItem(idx)}
                                            >
                                                <Trash className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="p-8 border-t border-zinc-100 bg-zinc-50/50">
                        <Button type="button" variant="outline" onClick={onClose} className="h-10 text-sm font-medium border-zinc-200 px-6 rounded-md">Cancel</Button>
                        <Button type="submit" disabled={items.length === 0} className="h-10 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm px-6 rounded-md">
                            Create Order
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ProcurementManager;
