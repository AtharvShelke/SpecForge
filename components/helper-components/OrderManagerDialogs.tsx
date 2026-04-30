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
      tone: 'border-sky-100 bg-sky-50/80 text-sky-700',
      body: 'Reserved stock will be finalized as shipped and logged as a sale movement.',
    };
  }

  if (status === OrderStatus.CANCELLED) {
    return {
      tone: 'border-amber-100 bg-amber-50/80 text-amber-700',
      body: 'Reserved stock will be released back into available inventory.',
    };
  }

  if (status === OrderStatus.RETURNED) {
    return {
      tone: 'border-stone-200 bg-stone-50/90 text-stone-700',
      body: 'Returned items will be added back to stock and recorded as return movements.',
    };
  }

  return null;
};

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
      <DialogContent className="max-h-[90vh] overflow-hidden border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,243,237,0.96))] p-0 shadow-[0_30px_90px_rgba(15,23,42,0.16)] sm:max-w-xl">
        <div className="h-px w-full bg-gradient-to-r from-sky-300 via-cyan-300 to-amber-200" />
        <DialogHeader className="space-y-4 px-6 pb-0 pt-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white/90 text-sky-700 shadow-sm">
              <RefreshCw size={18} />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-xl font-semibold text-stone-950">Update order status</DialogTitle>
              <DialogDescription className="text-sm leading-6 text-stone-600">
                Confirm the next step for <span className="font-mono font-semibold text-stone-900">{confirmDialog.orderId}</span>. The order
                will be updated to the selected status and all linked inventory actions will follow automatically.
              </DialogDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 rounded-[1.5rem] border border-white/80 bg-white/80 p-4 shadow-sm">
            <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-400">New status</span>
            <StatusBadge status={confirmDialog.newStatus} />
          </div>
          {message && (
            <div className={cn('rounded-[1.25rem] border px-4 py-3 text-sm leading-6', message.tone)}>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.22em]">Inventory effect</span>
              <span className="mt-1 block">{message.body}</span>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-5 overflow-y-auto px-6 py-6">
          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-400">Internal note</label>
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
              className="min-h-[104px] rounded-[1.25rem] border-stone-200 bg-white/90 px-4 py-3 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-sky-200"
            />
          </div>

          {(confirmDialog.newStatus === OrderStatus.SHIPPED ||
            confirmDialog.newStatus === OrderStatus.CANCELLED ||
            confirmDialog.newStatus === OrderStatus.RETURNED) &&
            selectedOrder && (
              <div className="overflow-hidden rounded-[1.5rem] border border-stone-200/80 bg-white/85 shadow-sm">
                <div className="flex items-center gap-2 border-b border-stone-200/70 bg-stone-50/80 px-4 py-3">
                  <Warehouse size={14} className="text-stone-500" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">Inventory changes</p>
                </div>
                <div className="divide-y divide-stone-100">
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
                        changeClass = 'bg-sky-50 text-sky-700';
                      } else if (confirmDialog.newStatus === OrderStatus.CANCELLED) {
                        stockAfter = current + item.quantity;
                        changeLabel = `+${item.quantity} released`;
                        changeClass = 'bg-emerald-50 text-emerald-700';
                      } else {
                        stockAfter = current + item.quantity;
                        changeLabel = `+${item.quantity} returned`;
                        changeClass = 'bg-stone-100 text-stone-700';
                      }

                      return (
                        <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-stone-800">{item.name}</p>
                            <p className="mt-1 text-[11px] text-stone-500">{item.sku || 'No SKU'}</p>
                            <p className="mt-1 text-[11px] text-stone-400">Current stock: {current} | After update: {stockAfter}</p>
                          </div>
                          <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]', changeClass)}>
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

        <DialogFooter className="border-t border-stone-200/70 bg-white/70 px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmDialog((dialog) => ({ ...dialog, open: false }))}
            disabled={isUpdating}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className={cn(
              'gap-2 rounded-full px-5',
              confirmDialog.newStatus === OrderStatus.CANCELLED
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'bg-stone-900 text-white hover:bg-stone-800',
            )}
            onClick={confirmStatusUpdate}
            disabled={isUpdating}
          >
            {isUpdating ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {isUpdating ? 'Updating...' : 'Confirm update'}
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
      <DialogContent className="overflow-hidden border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,243,237,0.96))] p-0 shadow-[0_30px_90px_rgba(15,23,42,0.16)] sm:max-w-lg">
        <div className="h-px w-full bg-gradient-to-r from-rose-300 via-amber-200 to-transparent" />
        <DialogHeader className="space-y-4 px-6 pb-0 pt-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600 shadow-sm">
              <Trash2 size={18} />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-xl font-semibold text-stone-950">Delete order</DialogTitle>
              <DialogDescription className="text-sm leading-6 text-stone-600">
                This permanently removes <span className="font-mono font-semibold text-stone-900">{orderId}</span> from the admin system.
                The action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-6">
          {activeWarning ? (
            <div className="flex gap-3 rounded-[1.5rem] border border-amber-100 bg-amber-50/80 px-4 py-4">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-700">Active order</p>
                <p className="text-sm leading-6 text-amber-800">
                  This order is still active. Deleting it will first cancel the order so reserved stock is safely restored before the record is removed.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 rounded-[1.5rem] border border-stone-200 bg-stone-50/80 px-4 py-4">
              <Trash2 size={18} className="mt-0.5 shrink-0 text-stone-500" />
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">Already cancelled</p>
                <p className="text-sm leading-6 text-stone-700">
                  Inventory is already settled for this order. Deleting now only removes the record from the dashboard and history views.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-stone-200/70 bg-white/70 px-6 py-4">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={isDeleting} className="rounded-full">
            Keep order
          </Button>
          <Button size="sm" variant="destructive" className="gap-2 rounded-full px-5" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {isDeleting ? 'Deleting...' : 'Delete permanently'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
