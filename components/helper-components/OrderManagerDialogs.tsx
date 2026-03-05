import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Order, OrderStatus, WarehouseInventory } from '@/types';
import { StatusBadge } from './OrderManagerHelper';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, RefreshCw, Warehouse, FileText, Download, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    inventoryArray: WarehouseInventory[];
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
                                    {selectedOrder.items.map(item => {
                                        const inv = inventoryArray.find(i => i.variantId === item.variantId);
                                        const current = inv?.quantity ?? 0;
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
                                    })}
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

interface InvoicePreviewDialogProps {
    invoiceDialog: boolean;
    setInvoiceDialog: (open: boolean) => void;
    selectedOrder: Order | null;
    handlePrintInvoice: () => void;
    handleDownloadInvoice: () => void;
    calcFinancials: (order: Order) => { subtotal: number; tax: number; total: number };
}

export const InvoicePreviewDialog = ({
    invoiceDialog,
    setInvoiceDialog,
    selectedOrder,
    handlePrintInvoice,
    handleDownloadInvoice,
    calcFinancials
}: InvoicePreviewDialogProps) => {
    return (
        <Dialog open={invoiceDialog} onOpenChange={setInvoiceDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col bg-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText size={16} className="text-blue-600" />
                        Invoice — {selectedOrder?.id}
                    </DialogTitle>
                    <DialogDescription>
                        Preview your invoice before printing or downloading.
                    </DialogDescription>
                </DialogHeader>

                {selectedOrder && (
                    <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
                        {/* Invoice Preview */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                            {/* Header */}
                            <div className="flex justify-between items-start p-6 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
                                <div>
                                    <h3 className="text-xl font-extrabold tracking-tight">Nexus Hardware</h3>
                                    <p className="text-xs text-blue-200 mt-1">123, Tech Park, MG Road, Bengaluru<br />GSTIN: 29ABCDE1234F1Z5</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black tracking-tight opacity-90">INVOICE</p>
                                    <p className="text-xs text-blue-200 mt-1">INV-{selectedOrder.id}-{new Date().getFullYear()}</p>
                                    <p className="text-xs text-blue-200">{new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                </div>
                            </div>

                            {/* Bill To / Order Info */}
                            <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50 border-b border-slate-200">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Bill To</p>
                                    <p className="font-bold text-slate-800">{selectedOrder.customerName}</p>
                                    <p className="text-xs text-slate-500 mt-1">{selectedOrder.email}</p>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                        {selectedOrder.shippingStreet}<br />
                                        {selectedOrder.shippingCity}, {selectedOrder.shippingState} {selectedOrder.shippingZip}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Order Info</p>
                                    <div className="space-y-1">
                                        {[
                                            { label: 'Order ID', value: selectedOrder.id },
                                            { label: 'Date', value: new Date(selectedOrder.date).toLocaleDateString('en-IN') },
                                            { label: 'Payment', value: selectedOrder.paymentMethod },
                                            { label: 'Status', value: selectedOrder.paymentStatus },
                                        ].map(row => (
                                            <div key={row.label} className="flex items-center gap-2 text-xs">
                                                <span className="text-slate-400 w-16 flex-shrink-0">{row.label}</span>
                                                <span className="font-semibold text-slate-700">{row.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Line Items */}
                            <div className="p-6">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b-2 border-slate-200">
                                            <th className="text-left pb-2 text-xs font-bold text-slate-400 uppercase tracking-wide">Item</th>
                                            <th className="text-center pb-2 text-xs font-bold text-slate-400 uppercase tracking-wide">Qty</th>
                                            <th className="text-right pb-2 text-xs font-bold text-slate-400 uppercase tracking-wide">Price</th>
                                            <th className="text-right pb-2 text-xs font-bold text-slate-400 uppercase tracking-wide">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedOrder.items.map(item => (
                                            <tr key={item.id} className="border-b border-slate-100">
                                                <td className="py-3">
                                                    <p className="font-semibold text-slate-800">{item.name}</p>
                                                    <p className="text-xs text-slate-400 font-mono">{item.sku}</p>
                                                </td>
                                                <td className="py-3 text-center text-slate-600">{item.quantity}</td>
                                                <td className="py-3 text-right text-slate-600">₹{item.price.toLocaleString('en-IN')}</td>
                                                <td className="py-3 text-right font-bold text-slate-900">₹{(item.price * item.quantity).toLocaleString('en-IN')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Totals */}
                                {(() => {
                                    const { subtotal, tax, total } = calcFinancials(selectedOrder);
                                    return (
                                        <div className="mt-4 ml-auto max-w-xs space-y-1.5">
                                            <div className="flex justify-between text-sm text-slate-500">
                                                <span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-slate-500">
                                                <span>Shipping</span><span className="text-emerald-600 font-semibold">Free</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-slate-500">
                                                <span>GST (18%)</span><span>₹{tax.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="flex justify-between font-extrabold text-slate-900 text-base pt-2 border-t-2 border-slate-900 mt-2">
                                                <span>Total</span><span>₹{total.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-center">
                                <p className="text-xs text-slate-400">Thank you for your purchase! For queries, contact billing@nexushardware.com</p>
                            </div>
                        </div>
                    </ScrollArea>
                )}

                <DialogFooter className="gap-2 pt-4 border-t border-slate-100">
                    <Button variant="ghost" size="sm" onClick={() => setInvoiceDialog(false)}>Close</Button>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={handleDownloadInvoice}>
                        <Download size={13} /> Download
                    </Button>
                    <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white" onClick={handlePrintInvoice}>
                        <Printer size={13} /> Print Invoice
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};