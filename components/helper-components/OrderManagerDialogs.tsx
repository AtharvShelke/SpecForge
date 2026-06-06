import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InventorySkuSummary, Order, OrderStatus } from '@/types';
import { StatusBadge } from './OrderManagerHelper';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CheckCircle2, RefreshCw, Trash2, AlertTriangle, Warehouse } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/helpers';
import { ScrollArea } from '@/components/ui/scroll-area';

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
                </div>
                <div className="divide-y divide-slate-100">
                  {(() => {
                    const variantTotals = new Map<string, { quantity: number; reserved: number; sku?: string }>();

                    inventoryArray.forEach((item) => {
                      const existing = variantTotals.get(item.productId);
                      if (existing) {
                        existing.quantity += item.quantity;
                        existing.reserved += item.reserved || 0;
                      } else {
                        variantTotals.set(item.productId, {
                          quantity: item.quantity,
                          reserved: item.reserved || 0,
                          sku: item.sku,
                        });
                      }
                    });

                    const lookupMap = new Map<string, { quantity: number; reserved: number }>();
                    variantTotals.forEach((data, productId) => {
                      lookupMap.set(productId, data);
                      if (data.sku) lookupMap.set(data.sku, data);
                    });

                    return (selectedOrder.items ?? []).map((item) => {
                      const inventory = lookupMap.get(item.productId) || (item.sku ? lookupMap.get(item.sku) : undefined);
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

interface ChangeUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  unitId: string;
  currentInventoryItemId?: string | null;
  currentSerialNumber?: string | null;
  currentPartNumber?: string | null;
  orderId: string;
  orderItemId: string;
  onSuccess: () => void;
}

export const ChangeUnitDialog = ({
  open,
  onOpenChange,
  productId,
  productName,
  unitId,
  currentInventoryItemId,
  currentSerialNumber,
  currentPartNumber,
  orderId,
  orderItemId,
  onSuccess,
}: ChangeUnitDialogProps) => {
  const [mode, setMode] = React.useState<'select' | 'edit'>('select');
  const [inventoryItems, setInventoryItems] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Edit fields
  const [customSerialNumber, setCustomSerialNumber] = React.useState('');
  const [customPartNumber, setCustomPartNumber] = React.useState('');

  // Selected existing inventory item ID
  const [selectedItemId, setSelectedItemId] = React.useState<string | null>(null);

  // Reset states when opening
  React.useEffect(() => {
    if (open) {
      setMode('select');
      setInventoryItems([]);
      setError('');
      setIsSubmitting(false);
      setSelectedItemId(null);
      setCustomSerialNumber(currentSerialNumber || '');
      setCustomPartNumber(currentPartNumber || '');

      const fetchStock = async () => {
        setIsLoading(true);
        try {
          const data = await apiFetch<any[]>(`/api/inventory/items?productId=${productId}`);
          const list = Array.isArray(data) ? data : [];
          setInventoryItems(list.filter(item => item.id !== currentInventoryItemId));
        } catch (err: any) {
          console.error('Failed to load inventory stock:', err);
          setError('Failed to load available inventory items.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchStock();
    }
  }, [open, productId, currentInventoryItemId, currentSerialNumber, currentPartNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      let body: any = {};
      if (mode === 'select') {
        if (!selectedItemId) {
          setError('Please select an inventory item.');
          setIsSubmitting(false);
          return;
        }
        body = { inventoryItemId: selectedItemId };
      } else {
        body = {
          serialNumber: customSerialNumber.trim() || null,
          partNumber: customPartNumber.trim() || null,
        };
      }

      await apiFetch(`/api/orders/${orderId}/items/${orderItemId}/units/${unitId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Failed to update order unit:', err);
      setError(err.message || 'Failed to update order unit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeStock = inventoryItems.filter(item => item.serialNumber);

  return (
    <Dialog open={open} onOpenChange={(val) => !isSubmitting && onOpenChange(val)}>
      <DialogContent className="flex max-h-[90vh] w-[95vw] sm:max-w-md flex-col overflow-hidden p-0 rounded-lg border-slate-200 bg-white shadow-lg">
        <DialogHeader className="shrink-0 border-b border-slate-100 px-6 py-4">
          <DialogTitle className="text-lg font-semibold text-slate-900">
            Reallocate Unit
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 truncate" title={productName}>
            Product: <span className="font-medium text-slate-900">{productName}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="rounded-md bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {error}
            </div>
          )}

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setMode('select')}
              className={cn(
                'rounded-md py-1.5 text-xs font-medium transition-all',
                mode === 'select'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              )}
            >
              Select from Stock
            </button>
            <button
              type="button"
              onClick={() => setMode('edit')}
              className={cn(
                'rounded-md py-1.5 text-xs font-medium transition-all',
                mode === 'edit'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              )}
            >
              Directly Edit Details
            </button>
          </div>

          {mode === 'select' ? (
            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-700">
                Available Serial Numbers in Stock
              </label>

              {isLoading ? (
                <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <RefreshCw size={14} className="animate-spin" />
                  Loading available stock...
                </div>
              ) : activeStock.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                  No other serialized stock items found for this product.
                </div>
              ) : (
                <ScrollArea className="h-[200px] rounded-md border border-slate-200 bg-white p-2">
                  <div className="space-y-1">
                    {activeStock.map((item) => {
                      const isAvailable = item.quantity > 0;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={!isAvailable && item.id !== selectedItemId}
                          onClick={() => setSelectedItemId(item.id)}
                          className={cn(
                            'w-full rounded px-3 py-2 text-left text-xs transition-colors flex items-center justify-between',
                            selectedItemId === item.id
                              ? 'bg-slate-900 text-white'
                              : 'hover:bg-slate-100 text-slate-700',
                            !isAvailable && item.id !== selectedItemId && 'opacity-40 cursor-not-allowed'
                          )}
                        >
                          <div>
                            <div className={cn('font-mono font-medium', selectedItemId === item.id ? 'text-white' : 'text-slate-900')}>
                              SN: {item.serialNumber}
                            </div>
                            <div className={cn('text-[10px] mt-0.5', selectedItemId === item.id ? 'text-slate-300' : 'text-slate-500')}>
                              {item.partNumber ? `PN: ${item.partNumber}` : 'No Part Number'}
                              {item.location ? ` · Loc: ${item.location}` : ''}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={cn(
                              'inline-block px-1.5 py-0.5 rounded text-[10px] font-medium',
                              selectedItemId === item.id
                                ? 'bg-white/20 text-white'
                                : isAvailable
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border border-rose-100'
                            )}>
                              {isAvailable ? 'Available' : 'Reserved'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  Serial Number
                </label>
                <Input
                  className="h-10 rounded-md border-slate-200 text-sm"
                  placeholder="e.g. SN12345"
                  value={customSerialNumber}
                  onChange={(e) => setCustomSerialNumber(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  Part Number
                </label>
                <Input
                  className="h-10 rounded-md border-slate-200 text-sm"
                  placeholder="e.g. PN98765"
                  value={customPartNumber}
                  onChange={(e) => setCustomPartNumber(e.target.value)}
                />
              </div>
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                Directly editing details will overwrite the current inventory item details associated with this unit.
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 shrink-0 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 px-6 py-4 flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-md border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || (mode === 'select' && !selectedItemId)}
              className="bg-slate-900 text-white hover:bg-slate-800 rounded-md gap-2"
            >
              {isSubmitting && <RefreshCw size={14} className="animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};