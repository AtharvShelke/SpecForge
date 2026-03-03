'use client';

import React, { useState, useMemo } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { PurchaseOrder, Supplier, PurchaseOrderStatus } from '@/types';
import {
    PackagePlus, Truck, Search, Plus, ExternalLink, Calendar, PlusCircle, CheckCircle, PackageOpen
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

const ProcurementManager = () => {
    const { suppliers, purchaseOrders, inventory, createPurchaseOrder, receivePurchaseOrder } = useAdmin();

    const [activeTab, setActiveTab] = useState<'POs' | 'Suppliers'>('POs');

    // View State
    const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);
    const [receiveModal, setReceiveModal] = useState<PurchaseOrder | null>(null);

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

    // Derived Status Helpers
    const getStatusVariant = (status: PurchaseOrderStatus | 'ALL') => {
        switch (status) {
            case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20';
            case 'PARTIAL': return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
            case 'PENDING': return 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20';
            case 'CANCELLED': return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
            default: return 'bg-neutral-800 text-neutral-300';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        <Truck className="w-6 h-6 text-[#9ca3af]" />
                        Procurement & Suppliers
                    </h2>
                    <p className="text-sm text-neutral-400 mt-1">
                        Manage vendor relationships, purchase orders, and receive container freight.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant={activeTab === 'POs' ? 'default' : 'outline'} onClick={() => setActiveTab('POs')} className="text-xs">
                        Purchase Orders
                    </Button>
                    <Button variant={activeTab === 'Suppliers' ? 'default' : 'outline'} onClick={() => setActiveTab('Suppliers')} className="text-xs">
                        Vendors ({suppliers?.length || 0})
                    </Button>
                </div>
            </div>

            {/* Core Listing Dashboard */}
            <Card className="border-neutral-800 bg-[#0a0a0a]/80 backdrop-blur-xl">
                <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-neutral-800/50">
                    <div className="flex items-center gap-2">
                        <div className="relative w-64">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                            <Input
                                placeholder={`Search ${activeTab === 'POs' ? 'orders...' : 'suppliers...'}`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9 bg-neutral-900 border-neutral-800 text-sm focus-visible:ring-indigo-500"
                            />
                        </div>
                        {activeTab === 'POs' && (
                            <div className="flex gap-2">
                                {['ALL', 'PENDING', 'PARTIAL', 'COMPLETED'].map(status => (
                                    <Badge
                                        key={status}
                                        className={`cursor-pointer ${statusFilter === status ? getStatusVariant(status as any) : 'bg-neutral-900 text-neutral-500 hover:bg-neutral-800'}`}
                                        onClick={() => setStatusFilter(status as any)}
                                    >
                                        {status}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    <Button size="sm" className="bg-white text-black hover:bg-neutral-200">
                        <Plus className="w-4 h-4 mr-2" />
                        {activeTab === 'POs' ? 'Create PO' : 'Add Vendor'}
                    </Button>
                </CardHeader>

                <CardContent className="p-0">
                    <ScrollArea className="h-[600px]">
                        {activeTab === 'POs' ? (
                            <div className="divide-y divide-neutral-800/50">
                                {filteredPOs.length === 0 ? (
                                    <div className="py-12 text-center text-neutral-500">No Purchase Orders found.</div>
                                ) : (
                                    filteredPOs.map(po => (
                                        <div key={po.id} className="p-4 flex items-center justify-between hover:bg-neutral-900/50 transition-colors">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center shrink-0 border border-neutral-800">
                                                    <PackagePlus className="w-5 h-5 text-neutral-400" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-white text-sm">PO-{po.id.substring(0, 6).toUpperCase()}</span>
                                                        <Badge className={`${getStatusVariant(po.status)} text-[10px] px-1.5 py-0`}>
                                                            {po.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs text-neutral-500 mt-1 flex items-center gap-2">
                                                        <span>{po.supplier?.name}</span>
                                                        <span>•</span>
                                                        <span>{po.items?.length || 0} items</span>
                                                        {po.expectedDelivery && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    ETA: {new Date(po.expectedDelivery).toLocaleDateString()}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                {(po.status === 'PENDING' || po.status === 'PARTIAL') && (
                                                    <Button size="sm" variant="outline" onClick={() => setReceiveModal(po)} className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10">
                                                        <PackageOpen className="w-4 h-4 mr-2" />
                                                        Receive Freight
                                                    </Button>
                                                )}
                                                <Button size="icon" variant="ghost" onClick={() => setSelectedPo(po)}>
                                                    <ExternalLink className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="divide-y divide-neutral-800/50">
                                {filteredSuppliers.length === 0 ? (
                                    <div className="py-12 text-center text-neutral-500">No Vendors found.</div>
                                ) : (
                                    filteredSuppliers.map(sup => (
                                        <div key={sup.id} className="p-4 flex items-center justify-between hover:bg-neutral-900/50 transition-colors">
                                            <div>
                                                <div className="font-medium text-white text-sm">{sup.name}</div>
                                                <div className="text-xs text-neutral-500 mt-1">{sup.email || 'No email provided'} • {sup.phone || 'No phone provided'}</div>
                                            </div>
                                            <Button size="sm" variant="outline" className="text-xs">Edit Vendor</Button>
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
                <DialogContent className="sm:max-w-[700px] bg-[#0a0a0a] border-neutral-800 p-0 overflow-hidden">
                    <DialogHeader className="p-6 border-b border-neutral-800 bg-neutral-900/30">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-xl">Purchase Order Details</DialogTitle>
                            {selectedPo && (
                                <Badge className={getStatusVariant(selectedPo.status)}>
                                    {selectedPo.status}
                                </Badge>
                            )}
                        </div>
                        <DialogDescription className="text-neutral-400">
                            PO ID: {selectedPo?.id}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Vendor</span>
                                <p className="text-sm font-medium text-neutral-200">{selectedPo?.supplier?.name}</p>
                                <p className="text-xs text-neutral-400">{selectedPo?.supplier?.email}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Timeline</span>
                                <p className="text-sm font-medium text-neutral-200">Created: {selectedPo && new Date(selectedPo.createdAt).toLocaleDateString()}</p>
                                <p className="text-xs text-neutral-400">ETA: {selectedPo?.expectedDelivery ? new Date(selectedPo.expectedDelivery).toLocaleDateString() : 'Unspecified'}</p>
                            </div>
                        </div>

                        <Separator className="bg-neutral-800" />

                        <div>
                            <h4 className="text-sm font-semibold text-white mb-4">Ordered Manifest</h4>
                            <div className="border border-neutral-800 rounded-lg overflow-hidden bg-neutral-900/30">
                                <table className="w-full text-sm">
                                    <thead className="bg-neutral-900">
                                        <tr className="text-left text-xs text-neutral-400 uppercase tracking-wider">
                                            <th className="p-3 font-medium">SKU / Item</th>
                                            <th className="p-3 font-medium text-right">Cost</th>
                                            <th className="p-3 font-medium flex gap-2 justify-end">Ordered &rarr; Rcvd</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-800">
                                        {selectedPo?.items.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-neutral-800/20">
                                                <td className="p-3">
                                                    <div className="font-medium text-white">{item.variant?.product?.name || 'Unknown Product'}</div>
                                                    <div className="text-xs text-neutral-500">ID: {item.variantId.substring(0, 8)}...</div>
                                                </td>
                                                <td className="p-3 text-right text-neutral-300">
                                                    ${item.unitCost.toFixed(2)}
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center justify-end gap-3 text-sm">
                                                        <span className="text-neutral-400 w-8 text-right px-2 py-1 bg-neutral-900 rounded">{item.quantityOrdered}</span>
                                                        <span className="text-neutral-600">&rarr;</span>
                                                        <span className={`w-8 text-right font-medium px-2 py-1 rounded ${item.quantityReceived === item.quantityOrdered ? 'bg-emerald-500/20 text-emerald-400' : (item.quantityReceived > 0 ? 'bg-amber-500/20 text-amber-500' : 'bg-neutral-900 text-white')}`}>
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

        </div>
    );
};

export default ProcurementManager;
