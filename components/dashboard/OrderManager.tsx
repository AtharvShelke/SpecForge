'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { Order, OrderStatus } from '@/types';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  CreditCard,
  Mail,
  MapPin,
  Package,
  User,
  AlertCircle,
  Clock,
  ChevronRight,
  FileText,
  Printer,
  Download,
  RefreshCw,
  Search,
  Hash,
  Warehouse,
  XCircle,
  RotateCcw,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { NEXT_STATUS_BUTTON, STATUS_CONFIG, STATUS_FLOW } from '@/data/constants';
import { generateInvoiceHTML } from '@/lib/invoice';
import { MetaItem, StatsBar, StatusBadge } from '../helper-components/OrderManagerHelper';
import { ConfirmStatusDialog, InvoicePreviewDialog } from '../helper-components/OrderManagerDialogs';

// ─────────────────────────────────────────────────────────────
// STATUS PILL
// ─────────────────────────────────────────────────────────────
const StatusPill = ({ status }: { status: OrderStatus }) => {
  const map: Record<string, { label: string; cls: string }> = {
    [OrderStatus.PENDING]:    { label: 'Pending',    cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
    [OrderStatus.PAID]:       { label: 'Paid',       cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
    [OrderStatus.PROCESSING]: { label: 'Processing', cls: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' },
    [OrderStatus.SHIPPED]:    { label: 'Shipped',    cls: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200' },
    [OrderStatus.DELIVERED]:  { label: 'Delivered',  cls: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200' },
    [OrderStatus.CANCELLED]:  { label: 'Cancelled',  cls: 'bg-rose-50 text-rose-600 ring-1 ring-rose-200' },
    [OrderStatus.RETURNED]:   { label: 'Returned',   cls: 'bg-stone-100 text-stone-600 ring-1 ring-stone-200' },
  };
  const cfg = map[status] ?? { label: status, cls: 'bg-stone-100 text-stone-600 ring-1 ring-stone-200' };
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap',
      cfg.cls
    )}>
      <span className="w-1 h-1 rounded-full bg-current opacity-60" />
      {cfg.label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────
// SECTION LABEL
// ─────────────────────────────────────────────────────────────
const SectionLabel = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="flex items-center gap-1.5">
    <span className="text-stone-400">{icon}</span>
    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em]">{children}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────
// MAIN ORDER MANAGER
// ─────────────────────────────────────────────────────────────
const OrderManager = () => {
  const { orders, updateOrderStatus, inventory, adjustStock } = useAdmin();
  const inventoryArray = Array.isArray(inventory) ? inventory : [];

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean; orderId: string; newStatus: OrderStatus; note: string;
  }>({ open: false, orderId: '', newStatus: OrderStatus.PENDING, note: '' });

  const [invoiceDialog, setInvoiceDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders]);

  useEffect(() => {
    if (!selectedId && sortedOrders.length > 0) setSelectedId(sortedOrders[0].id);
  }, [sortedOrders, selectedId]);

  const filteredOrders = useMemo(() => {
    return sortedOrders.filter(o => {
      const matchStatus = filterStatus === 'All' || o.status === filterStatus;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [sortedOrders, filterStatus, searchQuery]);

  const selectedOrder = useMemo(() => {
    return orders.find(o => o.id === selectedId) ?? sortedOrders[0] ?? null;
  }, [orders, selectedId, sortedOrders]);

  const openConfirmDialog = (orderId: string, newStatus: OrderStatus) => {
    setConfirmDialog({ open: true, orderId, newStatus, note: '' });
  };

  const confirmStatusUpdate = async () => {
    const { orderId, newStatus } = confirmDialog;
    setIsUpdating(true);
    try {
      if (updateOrderStatus.constructor.name === 'AsyncFunction') {
        await updateOrderStatus(orderId, newStatus);
      } else {
        updateOrderStatus(orderId, newStatus);
      }
      setConfirmDialog(d => ({ ...d, open: false }));
    } catch (error) {
      console.error('Failed to update order status', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrintInvoice = () => {
    if (!selectedOrder) return;
    const html = generateInvoiceHTML(selectedOrder);
    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) { win.document.write(html); win.document.close(); win.focus(); setTimeout(() => win.print(), 500); }
  };

  const handleDownloadInvoice = () => {
    if (!selectedOrder) return;
    const html = generateInvoiceHTML(selectedOrder);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Invoice-${selectedOrder.id}.html`; a.click();
    URL.revokeObjectURL(url);
  };

  const calcFinancials = (order: Order) => {
    const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  // ── Empty State ──
  if (sortedOrders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[500px] bg-stone-50">
        <div className="text-center p-16 bg-white border border-stone-200 rounded-2xl max-w-lg shadow-sm">
          <div className="w-16 h-16 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-center mx-auto mb-6">
            <Package size={28} className="text-stone-300" />
          </div>
          <h3 className="text-base font-semibold text-stone-800 mb-1 tracking-tight">No Orders Yet</h3>
          <p className="text-sm text-stone-400">Orders will appear here once customers start placing them</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div
        className="flex flex-col h-[calc(100vh-12rem)] min-h-[700px] overflow-hidden rounded-xl bg-white border border-stone-200 shadow-sm"
        style={{ fontFamily: "'DM Sans', 'Geist', 'system-ui', sans-serif" }}
      >

        {/* ─── HEADER ─── */}
        <div className="flex-shrink-0 border-b border-stone-100 px-6 py-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-1 h-5 rounded-full bg-indigo-500" />
                <h1 className="text-base font-bold text-stone-900 tracking-tight">Orders</h1>
              </div>
              <div className="hidden md:flex items-center gap-2.5 text-xs text-stone-400">
                <span className="w-px h-3 bg-stone-200" />
                <span className="tabular-nums">{sortedOrders.length} total</span>
                {sortedOrders.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.PAID).length > 0 && (
                  <>
                    <span className="w-px h-3 bg-stone-200" />
                    <span className="flex items-center gap-1 text-amber-600 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      {sortedOrders.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.PAID).length} need action
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </div>
          </div>
        </div>

        {/* ─── BODY ─── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ─── LEFT PANEL ─── */}
          <div className={cn(
            'flex flex-col bg-stone-50/60 border-r border-stone-100 flex-shrink-0',
            'w-full lg:w-[320px] xl:w-[356px]',
            showMobileDetail ? 'hidden lg:flex' : 'flex'
          )}>

            {/* Search + Filter */}
            <div className="px-3 py-3 space-y-2 border-b border-stone-100 bg-white">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <Input
                  placeholder="Search by ID, name, email…"
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-stone-50 border-stone-200 text-stone-800 placeholder:text-stone-400 focus-visible:ring-indigo-400 focus-visible:border-indigo-300 shadow-none rounded-lg"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-8 text-xs flex-1 bg-stone-50 border-stone-200 text-stone-700 focus:ring-indigo-400 shadow-none rounded-lg">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-stone-200 text-stone-800 shadow-md">
                    <SelectItem value="All" className="text-xs focus:bg-stone-50">All Orders</SelectItem>
                    {Object.values(OrderStatus).map(s => (
                      <SelectItem key={s} value={s} className="text-xs focus:bg-stone-50">
                        <div className="flex items-center gap-2">
                          <span className={cn('w-1.5 h-1.5 rounded-full', STATUS_CONFIG[s].dotClass)} />
                          {STATUS_CONFIG[s].label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-[10px] font-mono font-bold text-stone-400 bg-stone-100 border border-stone-200 px-2 py-1 rounded-md shrink-0 tabular-nums">
                  {filteredOrders.length}
                </span>
              </div>
            </div>

            {/* Order List */}
            <ScrollArea className="flex-1">
              {filteredOrders.length === 0 ? (
                <div className="p-10 text-center">
                  <AlertCircle size={28} className="mx-auto text-stone-300 mb-2" />
                  <p className="text-xs text-stone-400">No orders match your filters</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {filteredOrders.map(order => {
                    const isSelected = selectedId === order.id;
                    const needsAction = order.status === OrderStatus.PENDING || order.status === OrderStatus.PAID;
                    return (
                      <button
                        key={order.id}
                        onClick={() => { setSelectedId(order.id); setShowMobileDetail(true); }}
                        className={cn(
                          'w-full text-left px-4 py-3.5 transition-all group relative',
                          isSelected
                            ? 'bg-white border-l-2 border-l-indigo-500'
                            : 'hover:bg-white/70 border-l-2 border-l-transparent'
                        )}
                      >
                        {needsAction && !isSelected && (
                          <span className="absolute top-3.5 right-3.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
                        )}
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={cn(
                            'text-[10px] font-mono font-bold tracking-tight',
                            isSelected ? 'text-indigo-600' : 'text-stone-400'
                          )}>
                            {order.id}
                          </span>
                          <StatusPill status={order.status} />
                        </div>
                        <p className={cn(
                          'text-sm font-semibold truncate mb-1.5 tracking-tight',
                          isSelected ? 'text-stone-900' : 'text-stone-700'
                        )}>
                          {order.customerName}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-stone-400 font-mono tabular-nums">
                            {new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span className={cn(
                            'text-sm font-bold tabular-nums font-mono',
                            isSelected ? 'text-stone-900' : 'text-stone-700'
                          )}>
                            ₹{order.total.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* ─── RIGHT PANEL ─── */}
          {selectedOrder && (
            <div className={cn(
              'flex-1 overflow-y-auto bg-stone-50/40 min-w-0',
              !showMobileDetail && 'hidden lg:block'
            )}>
              <div className="p-4 sm:p-5 max-w-5xl mx-auto space-y-4">

                {/* Mobile back */}
                <button
                  className="lg:hidden flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-semibold mb-1"
                  onClick={() => setShowMobileDetail(false)}
                >
                  <ArrowLeft size={13} /> Back to orders
                </button>

                {/* ── ORDER HEADER CARD ── */}
                <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                  {/* Indigo top stripe */}
                  <div className="h-0.5 w-full bg-gradient-to-r from-indigo-400 via-indigo-500 to-violet-400" />

                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5 mb-1">
                          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight font-mono">
                            {selectedOrder.id}
                          </h2>
                          <StatusPill status={selectedOrder.status} />
                        </div>
                        <p className="text-xs text-stone-400 font-mono tabular-nums">
                          {new Date(selectedOrder.date).toLocaleDateString('en-IN', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                          })}
                          {' · '}
                          {new Date(selectedOrder.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        {NEXT_STATUS_BUTTON[selectedOrder.status] && (
                          <button
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm"
                            onClick={() => openConfirmDialog(selectedOrder.id, STATUS_FLOW[selectedOrder.status][0])}
                          >
                            {NEXT_STATUS_BUTTON[selectedOrder.status]!.icon}
                            {NEXT_STATUS_BUTTON[selectedOrder.status]!.label}
                          </button>
                        )}
                        {STATUS_FLOW[selectedOrder.status].includes(OrderStatus.CANCELLED) && (
                          <button
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-300 text-xs font-semibold transition-colors"
                            onClick={() => openConfirmDialog(selectedOrder.id, OrderStatus.CANCELLED)}
                          >
                            <XCircle size={13} /> Cancel
                          </button>
                        )}
                        {STATUS_FLOW[selectedOrder.status].includes(OrderStatus.RETURNED) &&
                          !STATUS_FLOW[selectedOrder.status].includes(OrderStatus.DELIVERED) && (
                            <button
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-stone-50 text-stone-600 border border-stone-200 text-xs font-semibold transition-colors"
                              onClick={() => openConfirmDialog(selectedOrder.id, OrderStatus.RETURNED)}
                            >
                              <RotateCcw size={13} /> Return
                            </button>
                          )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-stone-50 text-stone-600 border border-stone-200 text-xs font-semibold transition-colors">
                              <FileText size={13} /> Invoice <ChevronDown size={11} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 bg-white border-stone-200 shadow-md text-stone-700">
                            <DropdownMenuLabel className="text-[10px] text-stone-400 uppercase tracking-widest">Invoice</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-stone-100" />
                            <DropdownMenuItem onClick={() => setInvoiceDialog(true)} className="gap-2 cursor-pointer text-xs focus:bg-stone-50">
                              <FileText size={12} /> Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handlePrintInvoice} className="gap-2 cursor-pointer text-xs focus:bg-stone-50">
                              <Printer size={12} /> Print
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleDownloadInvoice} className="gap-2 cursor-pointer text-xs focus:bg-stone-50">
                              <Download size={12} /> Download HTML
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Customer Meta */}
                    <div className="mt-5 pt-5 border-t border-stone-100 grid grid-cols-2 sm:grid-cols-4 gap-5">
                      {[
                        { icon: <User size={12} />, label: 'Customer', value: selectedOrder.customerName },
                        { icon: <Mail size={12} />, label: 'Email', value: selectedOrder.email },
                        {
                          icon: <CreditCard size={12} />, label: 'Payment',
                          value: (
                            <span className="flex items-center gap-1.5 flex-wrap">
                              <span>{selectedOrder.paymentMethod}</span>
                              <span className={cn('text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide', {
                                'bg-emerald-50 text-emerald-700': selectedOrder.paymentStatus === 'Success',
                                'bg-amber-50 text-amber-700': selectedOrder.paymentStatus === 'Pending',
                                'bg-rose-50 text-rose-600': selectedOrder.paymentStatus === 'Failed',
                              })}>
                                {selectedOrder.paymentStatus}
                              </span>
                            </span>
                          )
                        },
                        {
                          icon: <Hash size={12} />, label: 'Items',
                          value: `${selectedOrder.items.length} item${selectedOrder.items.length !== 1 ? 's' : ''}`
                        },
                      ].map(({ icon, label, value }) => (
                        <div key={label}>
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-stone-400">{icon}</span>
                            <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400">{label}</span>
                          </div>
                          <div className="text-xs font-semibold text-stone-800 truncate">{value as React.ReactNode}</div>
                        </div>
                      ))}
                    </div>

                    {selectedOrder.paymentTransactionId && (
                      <div className="mt-4 flex items-center gap-2.5 px-3 py-2 bg-stone-50 border border-stone-100 rounded-lg">
                        <span className="text-[10px] text-stone-400 font-mono uppercase tracking-wider font-bold">TXN</span>
                        <span className="font-mono text-xs text-stone-600">{selectedOrder.paymentTransactionId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── MAIN CONTENT GRID ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                  {/* ── ORDER ITEMS (2 cols) ── */}
                  <div className="lg:col-span-2 rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                      <SectionLabel icon={<Package size={12} />}>Order Items</SectionLabel>
                      <span className="text-[10px] font-mono font-bold text-stone-400 bg-white border border-stone-200 px-2 py-0.5 rounded-md">
                        {selectedOrder.items.length}
                      </span>
                    </div>

                    {selectedOrder.items.length > 0 ? (
                      <>
                        {/* Desktop table */}
                        <div className="hidden sm:block overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-stone-100 bg-stone-50/30">
                                <th className="px-5 py-3 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Product</th>
                                <th className="px-4 py-3 text-center text-[10px] font-bold text-stone-400 uppercase tracking-widest">Qty</th>
                                <th className="px-4 py-3 text-right text-[10px] font-bold text-stone-400 uppercase tracking-widest">Unit</th>
                                <th className="px-5 py-3 text-right text-[10px] font-bold text-stone-400 uppercase tracking-widest">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50">
                              {selectedOrder.items.map(item => {
                                const inv = inventoryArray.find(i => i.variantId === item.variantId);
                                const isLow = inv && inv.quantity <= inv.reorderLevel;
                                return (
                                  <tr key={item.id} className="hover:bg-stone-50/60 transition-colors">
                                    <td className="px-5 py-3.5">
                                      <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-stone-100 border border-stone-200 flex-shrink-0 overflow-hidden">
                                          <img
                                            src={item.image}
                                            alt={item.name}
                                            className="h-full w-full object-contain"
                                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/300/300'; }}
                                          />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="font-semibold text-stone-800 text-sm leading-tight line-clamp-1 tracking-tight">{item.name}</p>
                                          <p className="text-[10px] text-stone-400 font-mono mt-0.5">{item.sku}</p>
                                          {isLow && (
                                            <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5 mt-0.5">
                                              <AlertTriangle size={9} /> Low stock: {inv.quantity} left
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-stone-100 text-stone-700 font-bold text-sm border border-stone-200">
                                        {item.quantity}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right text-stone-500 text-sm font-mono tabular-nums">
                                      ₹{item.price.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-5 py-3.5 text-right font-bold text-stone-900 font-mono tabular-nums">
                                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="sm:hidden divide-y divide-stone-100">
                          {selectedOrder.items.map(item => (
                            <div key={item.id} className="p-4 flex gap-3">
                              <div className="h-14 w-14 rounded-lg bg-stone-100 border border-stone-200 flex-shrink-0 overflow-hidden">
                                <img src={item.image} alt={item.name} className="h-full w-full object-contain"
                                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/300/300'; }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-stone-800 text-sm tracking-tight">{item.name}</p>
                                <p className="text-[10px] text-stone-400 font-mono">{item.sku}</p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-stone-400">Qty: <strong className="text-stone-700">{item.quantity}</strong></span>
                                  <span className="font-bold text-stone-900 text-sm font-mono">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Financials Footer */}
                        <div className="px-5 py-4 border-t border-stone-100 bg-stone-50/50">
                          {(() => {
                            const { subtotal, tax, total } = calcFinancials(selectedOrder);
                            return (
                              <div className="ml-auto max-w-xs space-y-1.5">
                                {[
                                  { label: 'Subtotal', value: `₹${subtotal.toLocaleString('en-IN')}`, cls: 'text-stone-600' },
                                  { label: 'Shipping', value: 'Free', cls: 'text-emerald-600 font-semibold' },
                                  { label: 'GST (18%)', value: `₹${tax.toLocaleString('en-IN')}`, cls: 'text-stone-600' },
                                ].map(row => (
                                  <div key={row.label} className="flex justify-between text-xs font-mono tabular-nums">
                                    <span className="text-stone-400">{row.label}</span>
                                    <span className={row.cls}>{row.value}</span>
                                  </div>
                                ))}
                                <div className="flex justify-between items-center pt-2.5 border-t border-stone-200 mt-1">
                                  <span className="font-bold text-stone-700 text-sm">Total</span>
                                  <span className="text-lg font-extrabold text-stone-900 font-mono tabular-nums">₹{total.toLocaleString('en-IN')}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </>
                    ) : (
                      <div className="p-10 text-center">
                        <Package size={28} className="mx-auto text-stone-300 mb-2" />
                        <p className="text-xs text-stone-400">No items in this order</p>
                      </div>
                    )}
                  </div>

                  {/* ── RIGHT COLUMN ── */}
                  <div className="flex flex-col gap-4">

                    {/* Shipping Address */}
                    <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/50">
                        <SectionLabel icon={<MapPin size={12} />}>Shipping</SectionLabel>
                      </div>
                      <div className="px-4 py-3.5">
                        {selectedOrder.shippingStreet ? (
                          <div className="text-xs text-stone-500 leading-relaxed space-y-0.5">
                            <p className="font-bold text-stone-800 text-sm tracking-tight">{selectedOrder.customerName}</p>
                            <p>{selectedOrder.shippingStreet}</p>
                            <p>{selectedOrder.shippingCity}, {selectedOrder.shippingState}</p>
                            <p className="font-mono text-[10px] text-stone-400 pt-0.5">{selectedOrder.shippingZip} · {selectedOrder.shippingCountry}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-stone-400 italic">No address provided</p>
                        )}
                      </div>
                    </div>

                    {/* Inventory Snapshot */}
                    <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/50">
                        <SectionLabel icon={<Warehouse size={12} />}>Inventory</SectionLabel>
                      </div>
                      <div className="px-4 py-3.5 space-y-3">
                        {selectedOrder.items.map(item => {
                          const inv = inventoryArray.find(i => i.variantId === item.variantId);
                          const available = inv?.quantity ?? 0;
                          const reserved = inv?.reserved ?? 0;
                          const isLow = available <= (inv?.reorderLevel ?? 5);
                          return (
                            <div key={item.id} className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-stone-700 truncate tracking-tight">{item.name}</p>
                                <p className="text-[10px] text-stone-400 font-mono">{item.sku}</p>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <Tooltip>
                                  <TooltipTrigger>
                                    <span className={cn(
                                      'text-xs font-bold px-2 py-0.5 rounded-md font-mono tabular-nums',
                                      isLow
                                        ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                                        : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                                    )}>
                                      {available}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="left" className="text-xs">
                                    {available} available · {reserved} reserved
                                  </TooltipContent>
                                </Tooltip>
                                {isLow && <AlertTriangle size={11} className="text-amber-500" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Order Timeline */}
                    <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden flex-1">
                      <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/50">
                        <SectionLabel icon={<Clock size={12} />}>Timeline</SectionLabel>
                      </div>
                      <div className="px-4 py-4">
                        <div className="relative pl-4 border-l-2 border-stone-100 space-y-5">
                          {(selectedOrder.logs || []).map((log, idx) => {
                            const isLatest = idx === (selectedOrder.logs || []).length - 1;
                            const cfg = STATUS_CONFIG[log.status];
                            return (
                              <div key={idx} className="relative">
                                <div className={cn(
                                  'absolute -left-[21px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ring-2',
                                  isLatest ? `${cfg.dotClass} ring-indigo-100` : 'bg-stone-200 ring-stone-50'
                                )} />
                                <div>
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className={cn(
                                      'text-xs font-bold tracking-tight',
                                      isLatest ? 'text-stone-900' : 'text-stone-500'
                                    )}>
                                      {cfg.label}
                                    </span>
                                    {isLatest && (
                                      <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Now</span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-stone-400 font-mono tabular-nums">
                                    {new Date(log.timestamp).toLocaleString('en-IN', {
                                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                    })}
                                  </p>
                                  {log.note && (
                                    <p className="text-[11px] text-stone-500 mt-1 bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-100 leading-relaxed">
                                      {log.note}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmStatusDialog
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
        confirmStatusUpdate={confirmStatusUpdate}
        selectedOrder={selectedOrder}
        inventoryArray={inventoryArray}
        isUpdating={isUpdating}
      />

      <InvoicePreviewDialog
        invoiceDialog={invoiceDialog}
        setInvoiceDialog={setInvoiceDialog}
        selectedOrder={selectedOrder}
        handlePrintInvoice={handlePrintInvoice}
        handleDownloadInvoice={handleDownloadInvoice}
        calcFinancials={calcFinancials}
      />
    </TooltipProvider>
  );
};

export default OrderManager;