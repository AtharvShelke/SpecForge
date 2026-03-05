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
// MAIN ORDER MANAGER
// ─────────────────────────────────────────────────────────────
const OrderManager = () => {
  const { orders, updateOrderStatus, inventory, adjustStock } = useAdmin();
  const inventoryArray = Array.isArray(inventory) ? inventory : [];

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  // Dialogs
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    orderId: string;
    newStatus: OrderStatus;
    note: string;
  }>({ open: false, orderId: '', newStatus: OrderStatus.PENDING, note: '' });

  const [invoiceDialog, setInvoiceDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Sort orders by date (newest first)
  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders]);

  // Auto-select latest
  useEffect(() => {
    if (!selectedId && sortedOrders.length > 0) {
      setSelectedId(sortedOrders[0].id);
    }
  }, [sortedOrders, selectedId]);

  // Filtered + searched orders
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

  // ── Handlers ──

  const openConfirmDialog = (orderId: string, newStatus: OrderStatus) => {
    setConfirmDialog({ open: true, orderId, newStatus, note: '', });
  };

  const confirmStatusUpdate = async () => {
    const { orderId, newStatus, note } = confirmDialog;
    setIsUpdating(true);
    try {
      if (updateOrderStatus.constructor.name === "AsyncFunction") {
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
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
  };

  const handleDownloadInvoice = () => {
    if (!selectedOrder) return;
    const html = generateInvoiceHTML(selectedOrder);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${selectedOrder.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate financials
  const calcFinancials = (order: Order) => {
    const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  // Timeline dot style
  const getTimelineDot = (status: OrderStatus, isLatest: boolean) => {
    const cfg = STATUS_CONFIG[status];
    if (isLatest) return `${cfg.dotClass} ring-4 ring-offset-1 ring-opacity-30 ring-${cfg.dotClass}`;
    return 'bg-slate-200';
  };

  // ── Empty State ──
  if (sortedOrders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[500px] animate-in fade-in duration-700">
        <div className="text-center p-16 bg-zinc-50 rounded-2xl border border-zinc-200 max-w-lg">
          <div className="w-20 h-20 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-6 border border-zinc-100">
            <Package size={36} className="text-zinc-200" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-1">No Orders Yet</h3>
          <p className="text-sm text-zinc-400">Orders will appear here once customers start placing them</p>
        </div>
      </div>
    );
  }

  // ── Main Layout ──
  return (
    <TooltipProvider>
      <div className="flex flex-col h-[calc(100vh-12rem)] min-h-[700px] overflow-hidden rounded-lg bg-white border border-zinc-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">

        {/* ─── HEADER BAR ─── */}
        <div className="flex-shrink-0 bg-white border-b border-zinc-200 px-6 py-5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-5 bg-indigo-600 rounded-full" />
                <h1 className="text-xl font-semibold text-zinc-900">Orders</h1>
              </div>
              <p className="text-sm text-zinc-500">
                {sortedOrders.length} orders · Live processing
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="h-8 px-4 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
                {sortedOrders.length} total
              </Badge>
            </div>
          </div>
        </div>

        {/* ─── BODY ─── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ─── LEFT PANEL: Order List ─── */}
          <div className={cn(
            'flex flex-col bg-white border-r border-slate-200 flex-shrink-0',
            'w-full lg:w-[340px] xl:w-[380px]',
            showMobileDetail ? 'hidden lg:flex' : 'flex'
          )}>

            {/* Search + Filter */}
            <div className="px-4 py-4 border-b border-zinc-100 space-y-3 bg-zinc-50/30">
              <div className="relative group">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
                <Input
                  placeholder="ID, Customer, Email..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm bg-white border-zinc-200 focus-visible:ring-zinc-900 shadow-none transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-9 text-xs font-medium flex-1 border-zinc-200 bg-white shadow-none">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Orders</SelectItem>
                    {Object.values(OrderStatus).map(s => (
                      <SelectItem key={s} value={s} className="text-xs font-medium">
                        <div className="flex items-center gap-2">
                          <span className={cn('w-1.5 h-1.5 rounded-full', STATUS_CONFIG[s].dotClass)} />
                          {STATUS_CONFIG[s].label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="px-2 py-1 bg-zinc-100 rounded text-[11px] font-medium text-zinc-500 tabular-nums shrink-0">
                  {filteredOrders.length} Hits
                </div>
              </div>
            </div>

            {/* Order List */}
            <ScrollArea className="flex-1">
              {filteredOrders.length === 0 ? (
                <div className="p-10 text-center">
                  <AlertCircle size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500">No orders match your filters.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredOrders.map(order => {
                    const isSelected = selectedId === order.id;
                    return (
                      <button
                        key={order.id}
                        onClick={() => {
                          setSelectedId(order.id);
                          setShowMobileDetail(true);
                        }}
                        className={cn(
                          'w-full text-left px-4 py-3.5 transition-all group hover:bg-slate-50 relative',
                          isSelected && 'bg-blue-50/70 border-l-[3px] !border-l-blue-600'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={cn(
                              'text-xs font-mono font-bold tracking-tight truncate',
                              isSelected ? 'text-blue-700' : 'text-slate-700'
                            )}>
                              {order.id}
                            </span>
                            <StatusBadge status={order.status} />
                          </div>
                          <ChevronRight
                            size={14}
                            className={cn(
                              'flex-shrink-0 transition-opacity mt-0.5',
                              isSelected ? 'text-blue-600 opacity-100' : 'text-slate-400 opacity-0 group-hover:opacity-100'
                            )}
                          />
                        </div>
                        <p className="text-sm font-semibold text-slate-800 truncate mb-0.5">{order.customerName}</p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar size={11} />
                            {new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="text-sm font-bold text-slate-900">₹{order.total.toLocaleString('en-IN')}</span>
                        </div>
                        {(order.status === OrderStatus.PENDING || order.status === OrderStatus.PAID) && (
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-amber-600">
                            <AlertTriangle size={10} />
                            Action required
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* ─── RIGHT PANEL: Order Detail ─── */}
          {selectedOrder && (
            <div className={cn(
              'flex-1 overflow-y-auto bg-zinc-50/30 min-w-0',
              !showMobileDetail && 'hidden lg:block'
            )}>
              <div className="p-4 sm:p-6 max-w-5xl mx-auto">

                {/* Mobile back */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden mb-4 -ml-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1.5"
                  onClick={() => setShowMobileDetail(false)}
                >
                  <ArrowLeft size={15} /> Back to orders
                </Button>

                {/* Stats Bar — only on lg+ */}
                <div className="hidden xl:block">
                  <StatsBar orders={orders} />
                </div>

                {/* ── ORDER HEADER CARD ── */}
                <Card className="mb-4 border-slate-200 shadow-sm">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">

                      {/* Left: ID & Status */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-mono">
                            {selectedOrder.id}
                          </h2>
                          <StatusBadge status={selectedOrder.status} />
                        </div>
                        <p className="text-sm text-slate-500">
                          Placed {new Date(selectedOrder.date).toLocaleDateString('en-IN', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                          })}
                          {' · '}
                          {new Date(selectedOrder.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {/* Right: Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Primary Next-Status CTA */}
                        {NEXT_STATUS_BUTTON[selectedOrder.status] && (
                          <Button
                            size="sm"
                            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                            onClick={() => openConfirmDialog(
                              selectedOrder.id,
                              STATUS_FLOW[selectedOrder.status][0]
                            )}
                          >
                            {NEXT_STATUS_BUTTON[selectedOrder.status]!.icon}
                            {NEXT_STATUS_BUTTON[selectedOrder.status]!.label}
                          </Button>
                        )}

                        {/* Cancel (if applicable) */}
                        {STATUS_FLOW[selectedOrder.status].includes(OrderStatus.CANCELLED) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                            onClick={() => openConfirmDialog(selectedOrder.id, OrderStatus.CANCELLED)}
                          >
                            <XCircle size={14} /> Cancel
                          </Button>
                        )}

                        {/* Return (if applicable) */}
                        {STATUS_FLOW[selectedOrder.status].includes(OrderStatus.RETURNED) &&
                          !STATUS_FLOW[selectedOrder.status].includes(OrderStatus.DELIVERED) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 text-slate-600 hover:bg-slate-100"
                              onClick={() => openConfirmDialog(selectedOrder.id, OrderStatus.RETURNED)}
                            >
                              <RotateCcw size={14} /> Return
                            </Button>
                          )}

                        {/* Invoice Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="gap-1.5 border-slate-200 bg-white">
                              <FileText size={14} /> Invoice
                              <ChevronDown size={12} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 bg-white">
                            <DropdownMenuLabel className="text-xs text-slate-500">Invoice Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setInvoiceDialog(true)} className="gap-2 cursor-pointer">
                              <FileText size={13} /> Preview Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handlePrintInvoice} className="gap-2 cursor-pointer">
                              <Printer size={13} /> Print Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleDownloadInvoice} className="gap-2 cursor-pointer">
                              <Download size={13} /> Download HTML
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Customer Meta */}
                    <Separator className="my-4" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                      <MetaItem icon={<User size={14} />} label="Customer" value={selectedOrder.customerName} />
                      <MetaItem icon={<Mail size={14} />} label="Email" value={selectedOrder.email} />
                      <MetaItem
                        icon={<CreditCard size={14} />}
                        label="Payment"
                        value={
                          <span className="flex items-center gap-1.5">
                            {selectedOrder.paymentMethod}
                            <span className={cn('text-xs px-1.5 py-0.5 rounded font-semibold', {
                              'bg-emerald-50 text-emerald-700': selectedOrder.paymentStatus === 'Success',
                              'bg-amber-50 text-amber-700': selectedOrder.paymentStatus === 'Pending',
                              'bg-red-50 text-red-600': selectedOrder.paymentStatus === 'Failed',
                            })}>
                              {selectedOrder.paymentStatus}
                            </span>
                          </span>
                        }
                      />
                      <MetaItem icon={<Hash size={14} />} label="Items" value={`${selectedOrder.items.length} item${selectedOrder.items.length !== 1 ? 's' : ''}`} />
                    </div>

                    {/* Transaction ID */}
                    {selectedOrder.paymentTransactionId && (
                      <div className="mt-3 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">TXN ID</span>
                        <span className="font-mono text-xs text-slate-600">{selectedOrder.paymentTransactionId}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* ── MAIN CONTENT GRID ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                  {/* ── ORDER ITEMS (spans 2 cols) ── */}
                  <Card className="lg:col-span-2 border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/80">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <Package size={15} className="text-slate-500" />
                          Order Items
                        </CardTitle>
                        <span className="text-xs text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded-md font-medium">
                          {selectedOrder.items.length} item{selectedOrder.items.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {selectedOrder.items.length > 0 ? (
                        <>
                          {/* Desktop table */}
                          <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-white border-b border-slate-100">
                                <tr>
                                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Product</th>
                                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">Qty</th>
                                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wide">Unit</th>
                                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wide">Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {selectedOrder.items.map(item => {
                                  const inv = inventoryArray.find(i => i.variantId === item.variantId);
                                  return (
                                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                                      <td className="px-4 sm:px-6 py-3.5">
                                        <div className="flex items-center gap-3">
                                          <div className="h-11 w-11 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0 overflow-hidden">
                                            <img
                                              src={item.image}
                                              alt={item.name}
                                              className="h-full w-full object-contain"
                                              onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/300/300'; }}
                                            />
                                          </div>
                                          <div className="min-w-0">
                                            <p className="font-semibold text-slate-800 text-sm leading-tight line-clamp-1">{item.name}</p>
                                            <p className="text-xs text-slate-400 font-mono mt-0.5">{item.sku}</p>
                                            {inv && inv.quantity <= inv.reorderLevel && (
                                              <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-0.5 mt-0.5">
                                                <AlertTriangle size={9} /> Low stock: {inv.quantity} left
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3.5 text-center">
                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm">
                                          {item.quantity}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3.5 text-right text-slate-600 text-sm">
                                        ₹{item.price.toLocaleString('en-IN')}
                                      </td>
                                      <td className="px-4 sm:px-6 py-3.5 text-right font-bold text-slate-900">
                                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* Mobile cards */}
                          <div className="sm:hidden divide-y divide-slate-100">
                            {selectedOrder.items.map(item => (
                              <div key={item.id} className="p-4">
                                <div className="flex gap-3">
                                  <div className="h-14 w-14 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0 overflow-hidden">
                                    <img src={item.image} alt={item.name} className="h-full w-full object-contain"
                                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/300/300'; }} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                                    <p className="text-xs text-slate-400 font-mono">{item.sku}</p>
                                    <div className="flex items-center justify-between mt-2">
                                      <span className="text-xs text-slate-500">Qty: <strong className="text-slate-800">{item.quantity}</strong></span>
                                      <span className="font-bold text-slate-900 text-sm">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Financials Footer */}
                          <div className="px-4 sm:px-6 py-4 bg-slate-50 border-t border-slate-100">
                            {(() => {
                              const { subtotal, tax, total } = calcFinancials(selectedOrder);
                              return (
                                <div className="ml-auto max-w-xs space-y-1.5">
                                  {[
                                    { label: 'Subtotal', value: `₹${subtotal.toLocaleString('en-IN')}`, className: 'text-slate-600' },
                                    { label: 'Shipping', value: 'Free', className: 'text-emerald-600 font-semibold' },
                                    { label: 'GST (18%)', value: `₹${tax.toLocaleString('en-IN')}`, className: 'text-slate-600' },
                                  ].map(row => (
                                    <div key={row.label} className="flex justify-between text-sm">
                                      <span className="text-slate-400">{row.label}</span>
                                      <span className={row.className}>{row.value}</span>
                                    </div>
                                  ))}
                                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 mt-1">
                                    <span className="font-bold text-slate-900">Total</span>
                                    <span className="text-lg font-extrabold text-slate-900">₹{total.toLocaleString('en-IN')}</span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </>
                      ) : (
                        <div className="p-10 text-center">
                          <Package size={36} className="mx-auto text-slate-300 mb-2" />
                          <p className="text-sm text-slate-400">No items in this order</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* ── RIGHT COLUMN ── */}
                  <div className="flex flex-col gap-4">

                    {/* Shipping Address */}
                    <Card className="border-slate-200 shadow-sm">
                      <CardHeader className="px-4 py-3 pb-2 border-b border-slate-100">
                        <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                          <MapPin size={13} /> Shipping Address
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 py-3">
                        {selectedOrder.shippingStreet ? (
                          <div className="text-sm text-slate-600 leading-relaxed space-y-0.5">
                            <p className="font-semibold text-slate-800">{selectedOrder.customerName}</p>
                            <p>{selectedOrder.shippingStreet}</p>
                            <p>{selectedOrder.shippingCity}, {selectedOrder.shippingState}</p>
                            <p className="font-mono text-xs text-slate-400">{selectedOrder.shippingZip} · {selectedOrder.shippingCountry}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400 italic">No address provided</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Inventory Impact */}
                    <Card className="border-slate-200 shadow-sm">
                      <CardHeader className="px-4 py-3 pb-2 border-b border-slate-100">
                        <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                          <Warehouse size={13} /> Inventory Snapshot
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 py-3">
                        <div className="space-y-2">
                          {selectedOrder.items.map(item => {
                            const inv = inventoryArray.find(i => i.variantId === item.variantId);
                            const available = inv?.quantity ?? 0;
                            const reserved = inv?.reserved ?? 0;
                            const isLow = available <= (inv?.reorderLevel ?? 5);
                            return (
                              <div key={item.id} className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-700 truncate">{item.name}</p>
                                  <p className="text-[10px] text-slate-400 font-mono">{item.sku}</p>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <span className={cn(
                                        'text-xs font-bold px-1.5 py-0.5 rounded',
                                        isLow ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
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
                      </CardContent>
                    </Card>

                    {/* Order Timeline */}
                    <Card className="border-slate-200 shadow-sm flex-1">
                      <CardHeader className="px-4 py-3 pb-2 border-b border-slate-100">
                        <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                          <Clock size={13} /> Order Timeline
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 py-4">
                        <div className="relative pl-4 border-l-2 border-slate-200 space-y-5">
                          {selectedOrder.logs.map((log, idx) => {
                            const isLatest = idx === selectedOrder.logs.length - 1;
                            const cfg = STATUS_CONFIG[log.status];
                            return (
                              <div key={idx} className="relative">
                                <div className={cn(
                                  'absolute -left-[21px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white',
                                  isLatest ? cfg.dotClass : 'bg-slate-200'
                                )} />
                                <div>
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className={cn(
                                      'text-xs font-bold',
                                      isLatest ? 'text-slate-900' : 'text-slate-500'
                                    )}>
                                      {cfg.label}
                                    </span>
                                    {isLatest && (
                                      <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-semibold">Latest</span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-400 tabular-nums">
                                    {new Date(log.timestamp).toLocaleString('en-IN', {
                                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                    })}
                                  </p>
                                  {log.note && (
                                    <p className="text-xs text-slate-500 mt-1 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100 leading-relaxed">
                                      {log.note}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
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