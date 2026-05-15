import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Order, OrderStatus, InventoryItem } from '@/types';
import { StatusBadge } from './OrderManagerHelper';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, RefreshCw, Warehouse, FileText, Download, Printer, Trash2, AlertTriangle, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { AssignedInventoryUnit } from '@/types';

interface ConfirmStatusDialogProps {
    confirmDialog: {
        open: boolean;
        orderId: string;
        newStatus: OrderStatus;
        note: string;
    };
    setConfirmDialog: React.Dispatch<React.SetStateAction<{
        open: boolean;
        orderId: string;
        newStatus: OrderStatus;
        note: string;
    }>>;
    confirmStatusUpdate: () => void;
    selectedOrder: Order | null;
    inventoryArray: InventoryItem[];
    isUpdating: boolean;
}

export const ConfirmStatusDialog = ({
    confirmDialog,
    setConfirmDialog,
    confirmStatusUpdate,
    selectedOrder,
    inventoryArray,
    isUpdating
}: ConfirmStatusDialogProps) => {
    return (
        <Dialog open={confirmDialog.open} onOpenChange={(open: boolean) => !isUpdating && setConfirmDialog(d => ({ ...d, open }))}>
            <DialogContent className="sm:max-w-md bg-white max-h-[90vh] flex flex-col overflow-hidden">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <RefreshCw size={16} className="text-blue-600" />
                        Update Order Status
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                        You're updating <span className="font-mono font-semibold text-slate-800">{confirmDialog.orderId}</span> to{' '}
                        <StatusBadge status={confirmDialog.newStatus} />.
                        {confirmDialog.newStatus === OrderStatus.SHIPPED && (
                            <span className="block mt-2 p-2.5 bg-indigo-50 text-indigo-700 text-xs rounded-lg border border-indigo-200">
                                <strong>Inventory Update:</strong> Stock will be deducted from reserved and marked as shipped (SALE movement logged).
                            </span>
                        )}
                        {confirmDialog.newStatus === OrderStatus.CANCELLED && (
                            <span className="block mt-2 p-2.5 bg-amber-50 text-amber-700 text-xs rounded-lg border border-amber-200">
                                <strong>Inventory Update:</strong> Reserved stock will be released back to available quantity.
                            </span>
                        )}
                        {confirmDialog.newStatus === OrderStatus.RETURNED && (
                            <span className="block mt-2 p-2.5 bg-slate-50 text-slate-600 text-xs rounded-lg border border-slate-200">
                                <strong>Inventory Update:</strong> Items will be added back to stock as RETURN movement.
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2 overflow-y-auto flex-1 px-1 -mx-1">
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                            Add a note (optional)
                        </label>
                        <Textarea
                            placeholder={
                                confirmDialog.newStatus === OrderStatus.SHIPPED
                                    ? 'e.g. Shipped via BlueDart. AWB: BD2025011182345'
                                    : confirmDialog.newStatus === OrderStatus.CANCELLED
                                        ? 'e.g. Payment failed / Customer requested cancellation'
                                        : `Notes for status: ${confirmDialog.newStatus}`
                            }
                            value={confirmDialog.note}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setConfirmDialog(d => ({ ...d, note: e.target.value }))}
                            className="resize-none h-20 text-sm border-slate-200 focus-visible:ring-1 focus-visible:ring-blue-500"
                        />
                    </div>

                    {/* Inventory Preview */}
                    {(confirmDialog.newStatus === OrderStatus.SHIPPED ||
                        confirmDialog.newStatus === OrderStatus.CANCELLED ||
                        confirmDialog.newStatus === OrderStatus.RETURNED) && selectedOrder && (
                            <div className="rounded-lg border border-slate-200 overflow-hidden">
                                <div className="bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200 flex items-center gap-1.5">
                                    <Warehouse size={11} /> Inventory Changes
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {(() => {
                                        // Group by productId first, then populate lookup map with both ID and SKU
                                        const productTotals = new Map<string, { quantity: number; reserved: number; sku?: string | null }>();
                                        inventoryArray.forEach(i => {
                                            const existing = productTotals.get(i.productId);
                                            if (existing) {
                                                existing.quantity += i.quantity;
                                                existing.reserved += (i.reserved || 0);
                                            } else {
                                                productTotals.set(i.productId, {
                                                    quantity: i.quantity,
                                                    reserved: i.reserved || 0,
                                                    sku: i.product?.sku
                                                });
                                            }
                                        });

                                        const lookupMap = new Map<string, { quantity: number; reserved: number }>();
                                        productTotals.forEach((data, pid) => {
                                            lookupMap.set(pid, data);
                                            if (data.sku) lookupMap.set(data.sku, data);
                                        });

                                        return selectedOrder.items.map(item => {
                                            const inv = lookupMap.get(item.productId) || (item.sku ? lookupMap.get(item.sku) : undefined);
                                            const current = inv?.quantity ?? 0;
                                            // ... rest of logic
                                            let after = current;
                                            let changeLabel = '';
                                            let changeColor = '';
                                            if (confirmDialog.newStatus === OrderStatus.SHIPPED) {
                                                after = current; // reserved → gone
                                                changeLabel = `Reserved −${item.quantity}`;
                                                changeColor = 'text-indigo-600';
                                            } else if (confirmDialog.newStatus === OrderStatus.CANCELLED) {
                                                after = current + item.quantity;
                                                changeLabel = `+${item.quantity} released`;
                                                changeColor = 'text-emerald-600';
                                            } else if (confirmDialog.newStatus === OrderStatus.RETURNED) {
                                                after = current + item.quantity;
                                                changeLabel = `+${item.quantity} returned`;
                                                changeColor = 'text-slate-600';
                                            }
                                            return (
                                                <div key={item.id} className="px-3 py-2 flex items-center justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-slate-700 truncate">{item.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-mono">{item.sku}</p>
                                                    </div>
                                                    <span className={cn('text-xs font-bold flex-shrink-0', changeColor)}>
                                                        {changeLabel}
                                                    </span>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0 flex-shrink-0 pt-3 border-t border-slate-100">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDialog(d => ({ ...d, open: false }))}
                        disabled={isUpdating}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        className={cn(
                            'gap-1.5',
                            confirmDialog.newStatus === OrderStatus.CANCELLED
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        )}
                        onClick={confirmStatusUpdate}
                        disabled={isUpdating}
                    >
                        {isUpdating ? (
                            <RefreshCw size={14} className="animate-spin" />
                        ) : (
                            <CheckCircle2 size={14} />
                        )}
                        {isUpdating ? 'Updating...' : 'Confirm Update'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


interface DeleteOrderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => Promise<void>;
    orderId: string;
    orderStatus: OrderStatus;
    isDeleting: boolean;
}

export const DeleteOrderDialog = ({
    open,
    onOpenChange,
    onConfirm,
    orderId,
    orderStatus,
    isDeleting
}: DeleteOrderDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={(val) => !isDeleting && onOpenChange(val)}>
            <DialogContent className="sm:max-w-md bg-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-rose-600">
                        <Trash2 size={18} />
                        Delete Order
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                        This action cannot be undone. This will permanently delete order <span className="font-mono font-bold text-slate-900">{orderId}</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {orderStatus !== OrderStatus.CANCELLED ? (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
                            <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-amber-800 uppercase tracking-tight">Order is not cancelled</p>
                                <p className="text-xs text-amber-700 leading-relaxed">
                                    Deleting an active order will <strong>automatically cancel</strong> it first to restore inventory and release reserved stock before removal.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex gap-3">
                            <Trash2 size={20} className="text-slate-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">Order is cancelled</p>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    This order is already cancelled. Deleting it will remove it from all records and the dashboard.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                    >
                        Keep Order
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1.5"
                        onClick={onConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <RefreshCw size={14} className="animate-spin" />
                        ) : (
                            <Trash2 size={14} />
                        )}
                        {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

interface EditSerialPartDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    unit: AssignedInventoryUnit | null;
    orderId: string;
    itemId: string;
    onSave: (unitId: string, serialNumber: string, partNumber: string) => Promise<void>;
    isSaving: boolean;
}

export const EditSerialPartDialog = ({
    open,
    onOpenChange,
    unit,
    orderId,
    itemId,
    onSave,
    isSaving
}: EditSerialPartDialogProps) => {
    const [serialNumber, setSerialNumber] = useState('');
    const [partNumber, setPartNumber] = useState('');

    // Reset form when dialog opens/closes or unit changes
    React.useEffect(() => {
        if (open && unit) {
            setSerialNumber(unit.serialNumber || '');
            setPartNumber(unit.partNumber || '');
        } else if (!open) {
            setSerialNumber('');
            setPartNumber('');
        }
    }, [open, unit]);

    const handleSave = async () => {
        if (!unit) return;
        await onSave(unit.id, serialNumber, partNumber);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !isSaving && onOpenChange(val)}>
            <DialogContent className="sm:max-w-md bg-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Edit2 size={16} className="text-blue-600" />
                        Edit Serial & Part Numbers
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                        Update the serial and part numbers for this inventory unit.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                            Serial Number
                        </label>
                        <Input
                            placeholder="Enter serial number"
                            value={serialNumber}
                            onChange={(e) => setSerialNumber(e.target.value)}
                            className="text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                            Part Number
                        </label>
                        <Input
                            placeholder="Enter part number"
                            value={partNumber}
                            onChange={(e) => setPartNumber(e.target.value)}
                            className="text-sm"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <RefreshCw size={14} className="animate-spin" />
                        ) : (
                            <CheckCircle2 size={14} />
                        )}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
