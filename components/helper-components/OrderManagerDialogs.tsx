import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
<<<<<<< HEAD
import { InventorySkuSummary, Order, OrderStatus } from '@/types';
import { StatusBadge } from './OrderManagerHelper';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CheckCircle2, RefreshCw, Trash2, AlertTriangle, Warehouse } from 'lucide-react';
=======
import { Order, OrderStatus, InventoryItem } from '@/types';
import { StatusBadge } from './OrderManagerHelper';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, RefreshCw, Warehouse, FileText, Download, Printer, Trash2, AlertTriangle, Edit2 } from 'lucide-react';
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
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
  setConfirmDialog: React.Dispatch<
    React.SetStateAction<{
      open: boolean;
      orderId: string;
      newStatus: OrderStatus;
      note: string;
    }>
  >;
  confirmStatusUpdate: () => void;
  selectedOrder: Order | null;
  inventoryArray: InventorySkuSummary[];
  isUpdating: boolean;
}

const inventoryMessage = (status: OrderStatus) => {
  if (status === OrderStatus.SHIPPED) {
    return {
      tone: 'border-blue-200 bg-blue-50 text-blue-700',
      body: 'Reserved stock will be finalized as shipped and logged as a sale movement.',
    };
<<<<<<< HEAD
  }

  if (status === OrderStatus.CANCELLED) {
    return {
      tone: 'border-amber-200 bg-amber-50 text-amber-700',
      body: 'Reserved stock will be released back into available inventory.',
    };
  }

  if (status === OrderStatus.RETURNED) {
    return {
      tone: 'border-slate-200 bg-slate-50 text-slate-700',
      body: 'Returned items will be added back to stock and recorded as return movements.',
    };
  }

  return null;
=======
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
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
}

export const ConfirmStatusDialog = ({
  confirmDialog,
  setConfirmDialog,
  confirmStatusUpdate,
  selectedOrder,
  inventoryArray,
  isUpdating,
}: ConfirmStatusDialogProps) => {
  const message = inventoryMessage(confirmDialog.newStatus);

  return (
    <Dialog open={confirmDialog.open} onOpenChange={(open: boolean) => !isUpdating && setConfirmDialog((dialog) => ({ ...dialog, open }))}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 border-slate-200 bg-white shadow-lg sm:max-w-xl sm:rounded-lg">

<<<<<<< HEAD
        {/* Fixed Header */}
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600">
              <RefreshCw size={18} />
            </div>
            <div className="space-y-1.5">
              <DialogTitle className="text-lg font-semibold text-slate-900">Update Order Status</DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Confirm the next step for <span className="font-mono font-medium text-slate-900">{confirmDialog.orderId}</span>. The order
                will be updated to the selected status and all linked inventory actions will follow automatically.
              </DialogDescription>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">New status</span>
            <StatusBadge status={confirmDialog.newStatus} />
          </div>

          {message && (
            <div className={cn('mt-3 rounded-md border px-4 py-3 text-sm', message.tone)}>
              <span className="block text-xs font-semibold uppercase tracking-wider">Inventory effect</span>
              <span className="mt-1 block">{message.body}</span>
            </div>
          )}
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700">Internal Note</label>
            <Textarea
              placeholder={
                confirmDialog.newStatus === OrderStatus.SHIPPED
                  ? 'Example: Shipped with BlueDart, AWB 123456789.'
                  : confirmDialog.newStatus === OrderStatus.CANCELLED
                    ? 'Example: Cancellation requested by customer after payment failure.'
                    : `Notes for ${confirmDialog.newStatus.toLowerCase()}.`
              }
              value={confirmDialog.note}
              onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                setConfirmDialog((dialog) => ({ ...dialog, note: event.target.value }))
              }
              className="min-h-[100px] rounded-md border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-0"
            />
          </div>

          {(confirmDialog.newStatus === OrderStatus.SHIPPED ||
            confirmDialog.newStatus === OrderStatus.CANCELLED ||
            confirmDialog.newStatus === OrderStatus.RETURNED) &&
            selectedOrder && (
              <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                  <Warehouse size={14} className="text-slate-500" />
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Inventory Changes</p>
=======
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
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
                </div>
                <div className="divide-y divide-slate-100">
                  {(() => {
                    const variantTotals = new Map<string, { quantity: number; reserved: number; sku?: string }>();

                    inventoryArray.forEach((item) => {
                      const existing = variantTotals.get(item.variantId);
                      if (existing) {
                        existing.quantity += item.quantity;
                        existing.reserved += item.reserved || 0;
                      } else {
                        variantTotals.set(item.variantId, {
                          quantity: item.quantity,
                          reserved: item.reserved || 0,
                          sku: item.variant?.sku,
                        });
                      }
                    });

                    const lookupMap = new Map<string, { quantity: number; reserved: number }>();
                    variantTotals.forEach((data, variantId) => {
                      lookupMap.set(variantId, data);
                      if (data.sku) lookupMap.set(data.sku, data);
                    });

                    return (selectedOrder.items ?? []).map((item) => {
                      const inventory = lookupMap.get(item.variantId) || (item.sku ? lookupMap.get(item.sku) : undefined);
                      const current = inventory?.quantity ?? 0;

                      let changeLabel = '';
                      let changeClass = '';
                      let stockAfter = current;

                      if (confirmDialog.newStatus === OrderStatus.SHIPPED) {
                        changeLabel = `Reserved -${item.quantity}`;
                        changeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                      } else if (confirmDialog.newStatus === OrderStatus.CANCELLED) {
                        stockAfter = current + item.quantity;
                        changeLabel = `+${item.quantity} released`;
                        changeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      } else {
                        stockAfter = current + item.quantity;
                        changeLabel = `+${item.quantity} returned`;
                        changeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                      }

                      return (
                        <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">{item.name}</p>
                            <p className="mt-0.5 font-mono text-xs text-slate-500">{item.sku || 'No SKU'}</p>
                            <p className="mt-1 text-xs text-slate-500">Current stock: {current} | After update: {stockAfter}</p>
                          </div>
                          <span className={cn('rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap', changeClass)}>
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

        {/* Fixed Footer */}
        <DialogFooter className="shrink-0 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmDialog((dialog) => ({ ...dialog, open: false }))}
            disabled={isUpdating}
            className="rounded-md border-slate-200 text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className={cn(
              'gap-2 rounded-md px-4',
              confirmDialog.newStatus === OrderStatus.CANCELLED
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'bg-slate-900 text-white hover:bg-slate-800',
            )}
            onClick={confirmStatusUpdate}
            disabled={isUpdating}
          >
            {isUpdating ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
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
  isDeleting,
}: DeleteOrderDialogProps) => {
  const activeWarning = orderStatus !== OrderStatus.CANCELLED;

  return (
    <Dialog open={open} onOpenChange={(value) => !isDeleting && onOpenChange(value)}>
      <DialogContent className="flex max-h-[90vh] flex-col p-0 overflow-hidden border-slate-200 bg-white shadow-lg sm:max-w-lg sm:rounded-lg">

<<<<<<< HEAD
        {/* Fixed Header */}
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-600">
              <Trash2 size={18} />
            </div>
            <div className="space-y-1.5">
              <DialogTitle className="text-lg font-semibold text-slate-900">Delete Order</DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                This permanently removes <span className="font-mono font-medium text-slate-900">{orderId}</span> from the admin system.
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
          {activeWarning ? (
            <div className="flex gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-4">
              <AlertTriangle size={18} className="shrink-0 text-amber-600" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-900">Active order</p>
                <p className="text-sm text-amber-700">
                  This order is still active. Deleting it will first cancel the order so reserved stock is safely restored before the record is removed.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
              <Trash2 size={18} className="shrink-0 text-slate-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-900">Already cancelled</p>
                <p className="text-sm text-slate-600">
                  Inventory is already settled for this order. Deleting now only removes the record from the dashboard and history views.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        <DialogFooter className="shrink-0 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="rounded-md border-slate-200 text-slate-700 hover:bg-slate-100"
          >
            Keep Order
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="gap-2 rounded-md px-4"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {isDeleting ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
=======
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
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
