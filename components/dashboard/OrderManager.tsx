'use client';

import React, { useEffect, useMemo, useState, useCallback, memo } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { Order, OrderStatus } from '@/types';
import {
  ArrowLeft,
  Clock,
  FileText,
  Printer,
  RefreshCw,
  Search,
  Hash,
  Warehouse,
  XCircle,
  RotateCcw,
  ChevronDown,
  AlertTriangle,
  Trash2,
  Package,
  MapPin,
  User,
  Mail,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
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
import { ConfirmStatusDialog, DeleteOrderDialog } from '../helper-components/OrderManagerDialogs';

/* ─────────────────────────────────────────────────────────────
   MODULE-LEVEL CONSTANTS — never reallocated on render
───────────────────────────────────────────────────────────────*/

// Defined once at module scope — StatusPill was recreating this object on every render
const STATUS_PILL_MAP: Record<string, { label: string; cls: string }> = {
  [OrderStatus.PENDING]:    { label: 'Pending',    cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  [OrderStatus.PAID]:       { label: 'Paid',       cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  [OrderStatus.PROCESSING]: { label: 'Processing', cls: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' },
  [OrderStatus.SHIPPED]:    { label: 'Shipped',    cls: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200' },
  [OrderStatus.DELIVERED]:  { label: 'Delivered',  cls: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200' },
  [OrderStatus.CANCELLED]:  { label: 'Cancelled',  cls: 'bg-rose-50 text-rose-600 ring-1 ring-rose-200' },
  [OrderStatus.RETURNED]:   { label: 'Returned',   cls: 'bg-stone-100 text-stone-600 ring-1 ring-stone-200' },
};

const FALLBACK_IMG = 'https://picsum.photos/300/300';

// Stable onError handler — was an inline arrow per <img> per render
const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  (e.target as HTMLImageElement).src = FALLBACK_IMG;
};

// Pure function at module scope — called inside useMemo, never re-declared
function computeFinancials(order: Order) {
  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = Math.round(subtotal * 0.18);
  return { subtotal, tax, total: subtotal + tax };
}

// Date formatting helpers — avoid repeated option objects in hot render paths
const DATE_OPTS_SHORT: Intl.DateTimeFormatOptions = {
  day: 'numeric', month: 'short', year: 'numeric',
};
const DATE_OPTS_LONG: Intl.DateTimeFormatOptions = {
  weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
};
const TIME_OPTS: Intl.DateTimeFormatOptions = {
  hour: '2-digit', minute: '2-digit',
};
const TIMELINE_DATE_OPTS: Intl.DateTimeFormatOptions = {
  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
};

/* ─────────────────────────────────────────────────────────────
   STATUS PILL — memo prevents re-render when parent re-renders
   but status hasn't changed
───────────────────────────────────────────────────────────────*/
const StatusPill = memo(({ status }: { status: OrderStatus }) => {
  const cfg = STATUS_PILL_MAP[status] ?? { label: status, cls: 'bg-stone-100 text-stone-600 ring-1 ring-stone-200' };
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap',
      cfg.cls
    )}>
      <span className="w-1 h-1 rounded-full bg-current opacity-60" />
      {cfg.label}
    </span>
  );
});
StatusPill.displayName = 'StatusPill';

/* ─────────────────────────────────────────────────────────────
   SECTION LABEL — pure presentational, memo for safety
───────────────────────────────────────────────────────────────*/
const SectionLabel = memo(({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="flex items-center gap-1.5">
    <span className="text-stone-400">{icon}</span>
    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em]">{children}</span>
  </div>
));
SectionLabel.displayName = 'SectionLabel';

/* ─────────────────────────────────────────────────────────────
   COLLAPSIBLE SECTION — memo: only re-renders when children /
   title / badge change, not on parent order selection changes
───────────────────────────────────────────────────────────────*/
const CollapsibleSection = memo(({
  icon, title, badge, children, defaultOpen = true,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const toggle = useCallback(() => setOpen(o => !o), []);

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
      <button
        className="w-full px-4 py-3 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between"
        onClick={toggle}
      >
        <div className="flex items-center gap-2">
          <SectionLabel icon={icon}>{title}</SectionLabel>
          {badge}
        </div>
        <ChevronDown
          size={14}
          className={cn('text-stone-400 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
      {open && <div>{children}</div>}
    </div>
  );
});
CollapsibleSection.displayName = 'CollapsibleSection';

/* ─────────────────────────────────────────────────────────────
   ORDER LIST ROW — memo: skips re-render unless this specific
   order's data or selection state changes
───────────────────────────────────────────────────────────────*/
interface OrderRowProps {
  order: Order;
  isSelected: boolean;
  onClick: (id: string) => void;
}

const OrderRow = memo(({ order, isSelected, onClick }: OrderRowProps) => {
  const needsAction = order.status === OrderStatus.PENDING || order.status === OrderStatus.PAID;
  const handleClick = useCallback(() => onClick(order.id), [order.id, onClick]);

  // Memoize formatted date per row — avoids re-formatting on every parent render
  const formattedDate = useMemo(
    () => new Date(order.date).toLocaleDateString('en-IN', DATE_OPTS_SHORT),
    [order.date],
  );

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full text-left px-3 py-3 transition-all group relative',
        isSelected
          ? 'bg-white border-l-2 border-l-indigo-500'
          : 'hover:bg-white/70 border-l-2 border-l-transparent'
      )}
    >
      {needsAction && !isSelected && (
        <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-amber-400" />
      )}
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <span className={cn(
          'text-[10px] font-mono font-bold tracking-tight truncate',
          isSelected ? 'text-indigo-600' : 'text-stone-400'
        )}>
          {order.id}
        </span>
        <StatusPill status={order.status} />
      </div>
      <p className={cn(
        'text-sm font-semibold truncate mb-1 tracking-tight',
        isSelected ? 'text-stone-900' : 'text-stone-700'
      )}>
        {order.customerName}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-stone-400 font-mono tabular-nums">
          {formattedDate}
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
});
OrderRow.displayName = 'OrderRow';

/* ─────────────────────────────────────────────────────────────
   MAIN ORDER MANAGER
───────────────────────────────────────────────────────────────*/
const OrderManager = () => {
  const {
    orders, updateOrderStatus, deleteOrder,
    inventory, syncData, isLoading,
  } = useAdmin();

  // Aggregate inventory by variantId across all warehouses
  const aggregatedInventory = useMemo(() => {
    const variantTotals = new Map<string, { quantity: number; reserved: number; reorderLevel: number; sku?: string }>();
    const arr = Array.isArray(inventory) ? inventory : [];

    for (const item of arr) {
      const existing = variantTotals.get(item.variantId);
      if (existing) {
        existing.quantity += item.quantity;
        existing.reserved += (item.reserved || 0);
        existing.reorderLevel = Math.max(existing.reorderLevel, item.reorderLevel || 0);
      } else {
        variantTotals.set(item.variantId, {
          quantity: item.quantity,
          reserved: item.reserved || 0,
          reorderLevel: item.reorderLevel || 0,
          sku: item.variant?.sku,
        });
      }
    }

    const lookupMap = new Map<string, { quantity: number; reserved: number; reorderLevel: number }>();
    variantTotals.forEach((data, vid) => {
      lookupMap.set(vid, data);
      if (data.sku) lookupMap.set(data.sku, data);
    });
    return lookupMap;
  }, [inventory]);

  // Stable reference — avoids Array.isArray check on every render
  const inventoryArray = useMemo(
    () => Array.isArray(inventory) ? inventory : [],
    [inventory],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean; orderId: string; newStatus: OrderStatus; note: string;
  }>({ open: false, orderId: '', newStatus: OrderStatus.PENDING, note: '' });

  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [orders],
  );

  useEffect(() => {
    if (!selectedId && sortedOrders.length > 0) setSelectedId(sortedOrders[0].id);
  }, [sortedOrders, selectedId]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return sortedOrders.filter(o => {
      const matchStatus = filterStatus === 'All' || o.status === filterStatus;
      const matchSearch = !q ||
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [sortedOrders, filterStatus, searchQuery]);

  const selectedOrder = useMemo(
    () => orders.find(o => o.id === selectedId) ?? sortedOrders[0] ?? null,
    [orders, selectedId, sortedOrders],
  );

  // Computed once per selected order — was called twice (header + footer) per render
  const selectedFinancials = useMemo(
    () => selectedOrder ? computeFinancials(selectedOrder) : null,
    [selectedOrder],
  );

  // Count orders needing action once — was two separate inline .filter() calls in JSX
  const needsActionCount = useMemo(
    () => sortedOrders.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.PAID).length,
    [sortedOrders],
  );

  // Memoized date strings for selected order detail panel
  const selectedDateLong = useMemo(
    () => selectedOrder ? new Date(selectedOrder.date).toLocaleDateString('en-IN', DATE_OPTS_LONG) : '',
    [selectedOrder],
  );
  const selectedTime = useMemo(
    () => selectedOrder ? new Date(selectedOrder.date).toLocaleTimeString('en-IN', TIME_OPTS) : '',
    [selectedOrder],
  );

  /* ── Stable callbacks — none of these are recreated unless deps change ── */

  const openConfirmDialog = useCallback((orderId: string, newStatus: OrderStatus) => {
    setConfirmDialog({ open: true, orderId, newStatus, note: '' });
  }, []);

  const confirmStatusUpdate = useCallback(async () => {
    const { orderId, newStatus } = confirmDialog;
    setIsUpdating(true);
    try {
      // Removed the pointless constructor.name async check — updateOrderStatus is
      // always async (it's defined with async in AdminContext); just await it directly
      await updateOrderStatus(orderId, newStatus);
      setConfirmDialog(d => ({ ...d, open: false }));
    } catch (error) {
      console.error('Failed to update order status', error);
    } finally {
      setIsUpdating(false);
    }
  }, [confirmDialog, updateOrderStatus]);

  const handleDeleteOrder = useCallback(async () => {
    if (!selectedOrder) return;
    setIsDeleting(true);
    try {
      await deleteOrder(selectedOrder.id);
      setDeleteDialogOpen(false);
      setSelectedId(null);
    } catch (error) {
      console.error('Failed to delete order', error);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedOrder, deleteOrder]);

  const handlePrintInvoice = useCallback(() => {
    if (!selectedOrder) return;
    const html = generateInvoiceHTML(selectedOrder);
    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) { win.document.write(html); win.document.close(); win.focus(); setTimeout(() => win.print(), 500); }
  }, [selectedOrder]);

  const handleDownloadInvoice = useCallback(() => {
    if (!selectedOrder) return;
    const html = generateInvoiceHTML(selectedOrder);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Invoice-${selectedOrder.id}.html`; a.click();
    URL.revokeObjectURL(url);
  }, [selectedOrder]);

  const handleRowClick = useCallback((id: string) => {
    setSelectedId(id);
    setShowMobileDetail(true);
  }, []);

  const handleBackClick = useCallback(() => setShowMobileDetail(false), []);
  const handleOpenDeleteDialog = useCallback(() => setDeleteDialogOpen(true), []);

  const handleOpenConfirmNext = useCallback(() => {
    if (selectedOrder) openConfirmDialog(selectedOrder.id, STATUS_FLOW[selectedOrder.status][0]);
  }, [selectedOrder, openConfirmDialog]);

  const handleOpenConfirmReturn = useCallback(() => {
    if (selectedOrder) openConfirmDialog(selectedOrder.id, OrderStatus.RETURNED);
  }, [selectedOrder, openConfirmDialog]);

  const handleOpenConfirmCancel = useCallback(() => {
    if (selectedOrder) openConfirmDialog(selectedOrder.id, OrderStatus.CANCELLED);
  }, [selectedOrder, openConfirmDialog]);

  // ── Empty State ──
  if (sortedOrders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-stone-50 px-4">
        <div className="text-center p-8 bg-white border border-stone-200 rounded-2xl w-full max-w-sm shadow-sm">
          <div className="w-12 h-12 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Package size={22} className="text-stone-300" />
          </div>
          <h3 className="text-sm font-semibold text-stone-800 mb-1 tracking-tight">No Orders Yet</h3>
          <p className="text-xs text-stone-400">Orders will appear here once customers start placing them</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div
        className="flex flex-col h-[calc(100dvh-4rem)] overflow-hidden rounded-xl bg-white border border-stone-200 shadow-sm"
        style={{ fontFamily: "'DM Sans', 'Geist', 'system-ui', sans-serif" }}
      >

        {/* ─── HEADER ─── */}
        <div className="flex-shrink-0 border-b border-stone-100 px-3 sm:px-6 py-3 bg-white">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-indigo-500 flex-shrink-0" />
                <h1 className="text-sm font-bold text-stone-900 tracking-tight">Orders</h1>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-400">
                <span className="w-px h-3 bg-stone-200" />
                <span className="tabular-nums">{sortedOrders.length}</span>
                {needsActionCount > 0 && (
                  <>
                    <span className="w-px h-3 bg-stone-200 hidden sm:block" />
                    <span className="hidden sm:flex items-center gap-1 text-amber-600 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      {needsActionCount} need action
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">Live</span>
              </div>
              <button
                onClick={syncData}
                disabled={isLoading}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-stone-50 text-stone-600 border border-stone-200 text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
              >
                <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Sync</span>
              </button>
            </div>
          </div>
        </div>

        {/* ─── BODY ─── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ─── LEFT PANEL (order list) ─── */}
          <div className={cn(
            'flex flex-col bg-stone-50/60 border-r border-stone-100 flex-shrink-0',
            'w-full lg:w-[300px] xl:w-[340px]',
            showMobileDetail ? 'hidden lg:flex' : 'flex'
          )}>

            {/* Search + Filter */}
            <div className="px-3 py-2.5 space-y-2 border-b border-stone-100 bg-white">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <Input
                  placeholder="Search ID, name, email…"
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-7 h-8 text-xs bg-stone-50 border-stone-200 text-stone-800 placeholder:text-stone-400 focus-visible:ring-indigo-400 focus-visible:border-indigo-300 shadow-none rounded-lg"
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
                <div className="p-8 text-center">
                  <AlertCircle size={22} className="mx-auto text-stone-300 mb-2" />
                  <p className="text-xs text-stone-400">No orders match your filters</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {filteredOrders.map(order => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      isSelected={selectedId === order.id}
                      onClick={handleRowClick}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* ─── RIGHT PANEL (order detail) ─── */}
          {selectedOrder && (
            <div className={cn(
              'flex-1 overflow-y-auto bg-stone-50/40 min-w-0',
              !showMobileDetail && 'hidden lg:block'
            )}>
              <div className="p-3 sm:p-5 max-w-5xl mx-auto space-y-3">

                {/* Mobile back button */}
                <button
                  className="lg:hidden flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                  onClick={handleBackClick}
                >
                  <ArrowLeft size={13} /> Back to orders
                </button>

                {/* ── ORDER HEADER CARD ── */}
                <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                  <div className="h-0.5 w-full bg-gradient-to-r from-indigo-400 via-indigo-500 to-violet-400" />

                  <div className="p-3 sm:p-5">
                    {/* Top row: ID + status + amount */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <h2 className="text-base sm:text-xl font-bold text-stone-900 tracking-tight font-mono truncate">
                            {selectedOrder.id}
                          </h2>
                          <StatusPill status={selectedOrder.status} />
                        </div>
                        <p className="text-[10px] text-stone-400 font-mono tabular-nums">
                          {selectedDateLong}
                          {' · '}
                          {selectedTime}
                        </p>
                      </div>
                      {/* Total amount */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Total</p>
                        <p className="text-base font-extrabold text-stone-900 font-mono tabular-nums">
                          ₹{selectedFinancials?.total.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">

                      {/* Primary Action: Next Status */}
                      {NEXT_STATUS_BUTTON[selectedOrder.status] && (
                        <button
                          className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 active:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-sm shadow-indigo-100"
                          onClick={handleOpenConfirmNext}
                        >
                          {NEXT_STATUS_BUTTON[selectedOrder.status]!.icon}
                          <span>{NEXT_STATUS_BUTTON[selectedOrder.status]!.label}</span>
                        </button>
                      )}

                      {/* Utility Group */}
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">

                        {/* Invoice Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white active:bg-stone-50 text-stone-600 border border-stone-200 text-xs font-bold transition-all shadow-sm">
                              <FileText size={14} />
                              <span>Invoice</span>
                              <ChevronDown size={12} className="opacity-50" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 p-1 bg-white border-stone-200 shadow-xl rounded-xl">
                            <DropdownMenuLabel className="px-3 py-2 text-[10px] text-stone-400 uppercase tracking-widest">Documents</DropdownMenuLabel>
                            <DropdownMenuSeparator className="mx-1 bg-stone-100" />
                            <DropdownMenuItem onClick={handlePrintInvoice} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer text-xs rounded-lg focus:bg-stone-50 font-medium text-stone-700">
                              <Printer size={14} className="text-stone-400" /> Print Invoice
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Return Button (Conditional) */}
                        {STATUS_FLOW[selectedOrder.status].includes(OrderStatus.RETURNED) &&
                          !STATUS_FLOW[selectedOrder.status].includes(OrderStatus.DELIVERED) && (
                            <button
                              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white active:bg-stone-50 text-stone-600 border border-stone-200 text-xs font-bold transition-all shadow-sm"
                              onClick={handleOpenConfirmReturn}
                            >
                              <RotateCcw size={14} /> Return
                            </button>
                          )}

                        {/* Danger Zone */}
                        <div className="flex gap-2 w-full sm:w-auto">
                          {STATUS_FLOW[selectedOrder.status].includes(OrderStatus.CANCELLED) && (
                            <button
                              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-50/50 active:bg-rose-100 text-rose-600 border border-rose-100 text-xs font-bold transition-all"
                              onClick={handleOpenConfirmCancel}
                            >
                              <XCircle size={14} /> Cancel
                            </button>
                          )}
                          <button
                            className="flex items-center justify-center p-2.5 rounded-xl bg-white active:bg-rose-50 text-rose-400 border border-stone-200 hover:border-rose-200 hover:text-rose-600 transition-all shadow-sm"
                            onClick={handleOpenDeleteDialog}
                            aria-label="Delete Order"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Customer Meta — 2-col grid on mobile, 4-col on sm+ */}
                    <div className="mt-3 pt-3 border-t border-stone-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { icon: <User size={11} />, label: 'Customer', value: selectedOrder.customerName },
                        { icon: <Mail size={11} />, label: 'Email', value: selectedOrder.email },
                        {
                          icon: <CreditCard size={11} />, label: 'Payment',
                          value: (
                            <span className="flex items-center gap-1 flex-wrap">
                              <span>{selectedOrder.paymentMethod}</span>
                              <span className={cn('text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide', {
                                'bg-emerald-50 text-emerald-700': selectedOrder.paymentStatus === 'Success',
                                'bg-amber-50 text-amber-700': selectedOrder.paymentStatus === 'Pending',
                                'bg-rose-50 text-rose-600': selectedOrder.paymentStatus === 'Failed',
                              })}>
                                {selectedOrder.paymentStatus}
                              </span>
                            </span>
                          ),
                        },
                        {
                          icon: <Hash size={11} />, label: 'Items',
                          value: `${selectedOrder.items.length} item${selectedOrder.items.length !== 1 ? 's' : ''}`,
                        },
                      ].map(({ icon, label, value }) => (
                        <div key={label}>
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="text-stone-400">{icon}</span>
                            <span className="text-[9px] uppercase tracking-widest font-bold text-stone-400">{label}</span>
                          </div>
                          <div className="text-xs font-semibold text-stone-800 truncate">{value as React.ReactNode}</div>
                        </div>
                      ))}
                    </div>

                    {selectedOrder.paymentTransactionId && (
                      <div className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-stone-50 border border-stone-100 rounded-lg overflow-hidden">
                        <span className="text-[10px] text-stone-400 font-mono uppercase tracking-wider font-bold flex-shrink-0">TXN</span>
                        <span className="font-mono text-xs text-stone-600 truncate">{selectedOrder.paymentTransactionId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── ORDER ITEMS ── */}
                <CollapsibleSection
                  icon={<Package size={12} />}
                  title="Order Items"
                  badge={
                    <span className="text-[10px] font-mono font-bold text-stone-400 bg-white border border-stone-200 px-2 py-0.5 rounded-md">
                      {selectedOrder.items.length}
                    </span>
                  }
                >
                  {selectedOrder.items.length > 0 ? (
                    <>
                      {/* Desktop table */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-stone-100 bg-stone-50/30">
                              <th className="px-4 py-2.5 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Product</th>
                              <th className="px-3 py-2.5 text-center text-[10px] font-bold text-stone-400 uppercase tracking-widest">Qty</th>
                              <th className="px-3 py-2.5 text-right text-[10px] font-bold text-stone-400 uppercase tracking-widest">Unit</th>
                              <th className="px-4 py-2.5 text-right text-[10px] font-bold text-stone-400 uppercase tracking-widest">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-50">
                            {selectedOrder.items.map(item => {
                              const inv = aggregatedInventory.get(item.variantId) || (item.sku ? aggregatedInventory.get(item.sku) : undefined);
                              const isLow = inv && inv.quantity <= inv.reorderLevel;
                              return (
                                <tr key={item.id} className="hover:bg-stone-50/60 transition-colors">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                      <div className="h-9 w-9 rounded-lg bg-stone-100 border border-stone-200 flex-shrink-0 overflow-hidden">
                                        <img
                                          src={item.image}
                                          alt={item.name}
                                          className="h-full w-full object-contain"
                                          onError={handleImgError}
                                        />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-semibold text-stone-800 text-xs leading-tight line-clamp-1 tracking-tight">{item.name}</p>
                                        <p className="text-[10px] text-stone-400 font-mono mt-0.5">{item.sku}</p>
                                        {isLow && (
                                          <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5 mt-0.5">
                                            <AlertTriangle size={9} /> Low: {inv.quantity} left
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-3 py-3 text-center">
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-stone-100 text-stone-700 font-bold text-xs border border-stone-200">
                                      {item.quantity}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 text-right text-stone-500 text-xs font-mono tabular-nums">
                                    ₹{item.price.toLocaleString('en-IN')}
                                  </td>
                                  <td className="px-4 py-3 text-right font-bold text-stone-900 text-xs font-mono tabular-nums">
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
                          <div key={item.id} className="p-3 flex gap-3">
                            <div className="h-12 w-12 rounded-lg bg-stone-100 border border-stone-200 flex-shrink-0 overflow-hidden">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-contain"
                                onError={handleImgError}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-stone-800 text-xs tracking-tight leading-tight">{item.name}</p>
                              <p className="text-[10px] text-stone-400 font-mono mt-0.5">{item.sku}</p>
                              <div className="flex items-center justify-between mt-1.5">
                                <span className="text-xs text-stone-400">×<strong className="text-stone-700">{item.quantity}</strong> · ₹{item.price.toLocaleString('en-IN')}</span>
                                <span className="font-bold text-stone-900 text-sm font-mono">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Financials Footer — uses memoized selectedFinancials */}
                      {selectedFinancials && (
                        <div className="px-4 py-3 border-t border-stone-100 bg-stone-50/50">
                          <div className="ml-auto max-w-[200px] space-y-1">
                            {[
                              { label: 'Subtotal', value: `₹${selectedFinancials.subtotal.toLocaleString('en-IN')}`, cls: 'text-stone-600' },
                              { label: 'Shipping', value: 'Free', cls: 'text-emerald-600 font-semibold' },
                              { label: 'GST (18%)', value: `₹${selectedFinancials.tax.toLocaleString('en-IN')}`, cls: 'text-stone-600' },
                            ].map(row => (
                              <div key={row.label} className="flex justify-between text-xs font-mono tabular-nums">
                                <span className="text-stone-400">{row.label}</span>
                                <span className={row.cls}>{row.value}</span>
                              </div>
                            ))}
                            <div className="flex justify-between items-center pt-2 border-t border-stone-200 mt-1">
                              <span className="font-bold text-stone-700 text-xs">Total</span>
                              <span className="text-sm font-extrabold text-stone-900 font-mono tabular-nums">
                                ₹{selectedFinancials.total.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-8 text-center">
                      <Package size={22} className="mx-auto text-stone-300 mb-2" />
                      <p className="text-xs text-stone-400">No items in this order</p>
                    </div>
                  )}
                </CollapsibleSection>

                {/* ── BOTTOM GRID: Shipping, Inventory, Timeline ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

                  {/* Shipping Address */}
                  <CollapsibleSection icon={<MapPin size={12} />} title="Shipping">
                    <div className="px-4 py-3">
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
                  </CollapsibleSection>

                  {/* Inventory Snapshot */}
                  <CollapsibleSection icon={<Warehouse size={12} />} title="Inventory">
                    <div className="px-4 py-3 space-y-2.5">
                      {selectedOrder.items.map(item => {
                        const inv = aggregatedInventory.get(item.variantId) || (item.sku ? aggregatedInventory.get(item.sku) : undefined);
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
                                    'text-xs font-bold px-1.5 py-0.5 rounded-md font-mono tabular-nums',
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
                              {isLow && <AlertTriangle size={10} className="text-amber-500" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleSection>

                  {/* Order Timeline */}
                  <CollapsibleSection icon={<Clock size={12} />} title="Timeline" defaultOpen={false}>
                    <div className="px-4 py-3">
                      <div className="relative pl-4 border-l-2 border-stone-100 space-y-4">
                        {(selectedOrder.logs || []).map((log, idx) => {
                          const isLatest = idx === (selectedOrder.logs || []).length - 1;
                          const cfg = STATUS_CONFIG[log.status];
                          return (
                            <div key={idx} className="relative">
                              <div className={cn(
                                'absolute -left-[21px] top-0.5 h-3 w-3 rounded-full border-2 border-white ring-2',
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
                                  {new Date(log.timestamp).toLocaleString('en-IN', TIMELINE_DATE_OPTS)}
                                </p>
                                {log.note && (
                                  <p className="text-[11px] text-stone-500 mt-1 bg-stone-50 px-2 py-1.5 rounded-lg border border-stone-100 leading-relaxed">
                                    {log.note}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CollapsibleSection>

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

      {selectedOrder && (
        <DeleteOrderDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteOrder}
          orderId={selectedOrder.id}
          orderStatus={selectedOrder.status}
          isDeleting={isDeleting}
        />
      )}
    </TooltipProvider>
  );
};

export default OrderManager;