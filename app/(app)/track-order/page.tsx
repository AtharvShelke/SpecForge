'use client';

import { useState, useCallback, useMemo, memo, Fragment } from 'react';
<<<<<<< HEAD
import Image from 'next/image';
import { useShop } from '@/context/ShopContext';
import { useOrder } from '@/context/OrderContext';

type CompatibilityIssue = { message: string };

import {
    Package,
    Search,
    Clock,
    CheckCircle2,
    Truck,
    PackageCheck,
    XCircle,
    MapPin,
    CreditCard,
    MessageCircle,
    ShoppingCart,
    AlertOctagon,
    AlertTriangle,
    CheckCircle,
    FileDown,
    RefreshCw,
=======
import { useShop } from '@/context/ShopContext';
import { validateBuild } from '@/lib/calculations/compatibility';
import {
    Package, Search, Clock, CheckCircle2, Truck, PackageCheck,
    XCircle, MapPin, CreditCard, MessageCircle, ShoppingCart,
    AlertOctagon, AlertTriangle, CheckCircle, FileDown, RefreshCw,
    Hash, Mail, // Added new icons for the form
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
    type LucideIcon,
} from 'lucide-react';
import { Order, OrderStatus, CompatibilityLevel, CartItem, orderItemToCartItem } from '@/types';
import { PageLayout } from '@/components/layout/PageLayout';
import { cn } from '@/lib/utils';

<<<<<<< HEAD
const validateBuild = (): { status: CompatibilityLevel; issues: CompatibilityIssue[] } => ({
    status: CompatibilityLevel.COMPATIBLE,
    issues: [],
});

const TIMELINE_STEPS: { status: OrderStatus; label: string; icon: LucideIcon }[] = [
    { status: OrderStatus.PENDING, label: 'Order Placed', icon: Clock },
    { status: OrderStatus.PAID, label: 'Payment Confirmed', icon: CreditCard },
    { status: OrderStatus.PROCESSING, label: 'Being Packed', icon: PackageCheck },
    { status: OrderStatus.SHIPPED, label: 'Shipped', icon: Truck },
    { status: OrderStatus.DELIVERED, label: 'Delivered', icon: CheckCircle2 },
=======
// ── Constants ─────────────────────────────────────────────────────────────────

const TIMELINE_STEPS: { status: OrderStatus; label: string; icon: LucideIcon }[] = [
    { status: OrderStatus.PENDING,    label: 'Order Placed',      icon: Clock        },
    { status: OrderStatus.PAID,       label: 'Payment Confirmed', icon: CreditCard   },
    { status: OrderStatus.PROCESSING, label: 'Being Packed',      icon: PackageCheck },
    { status: OrderStatus.SHIPPED,    label: 'Shipped',           icon: Truck        },
    { status: OrderStatus.DELIVERED,  label: 'Delivered',         icon: CheckCircle2 },
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
];

const STATUS_ORDER: OrderStatus[] = [
    OrderStatus.PENDING,
    OrderStatus.PAID,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
];

const CANCEL_STATUSES = new Set<OrderStatus>([OrderStatus.CANCELLED, OrderStatus.RETURNED]);

const COMPAT_CONFIG = {
    [CompatibilityLevel.INCOMPATIBLE]: {
<<<<<<< HEAD
        chip: 'border-rose-200 bg-rose-50 text-rose-700',
        icon: AlertOctagon,
        label: 'Incompatible build',
    },
    [CompatibilityLevel.WARNING]: {
        chip: 'border-amber-200 bg-amber-50 text-amber-700',
        icon: AlertTriangle,
        label: 'Needs review',
    },
    [CompatibilityLevel.COMPATIBLE]: {
        chip: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        icon: CheckCircle,
        label: 'Fully compatible',
=======
        bg: 'bg-red-50 border-red-200/60', text: 'text-red-700',
        icon: AlertOctagon, label: 'Incompatible Build',
    },
    [CompatibilityLevel.WARNING]: {
        bg: 'bg-amber-50 border-amber-200/60', text: 'text-amber-700',
        icon: AlertTriangle, label: 'Minor Issues',
    },
    [CompatibilityLevel.COMPATIBLE]: {
        bg: 'bg-emerald-50 border-emerald-200/60', text: 'text-emerald-700',
        icon: CheckCircle, label: 'Fully Compatible',
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
    },
} as const;

const statusIndex = (status: OrderStatus) => STATUS_ORDER.indexOf(status);

<<<<<<< HEAD
const CompatBadge = memo(function CompatBadge({ items: _items }: { items: CartItem[] }) {
    void _items;
    const report = useMemo(() => validateBuild(), []);
    const config = COMPAT_CONFIG[report.status] ?? COMPAT_CONFIG[CompatibilityLevel.COMPATIBLE];
    const Icon = config.icon;

    return (
        <div className={cn("rounded-lg border p-5", config.chip)}>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                <Icon size={16} />
                Compatibility Snapshot
=======
const getOrderItemCategoryLabel = (item: Order['items'][number]) => {
    if (typeof item.category === 'string') return item.category;
    return item.category?.name ?? `Category ${item.categoryId}`;
};

// ── CompatBadge ───────────────────────────────────────────────────────────────

const CompatBadge = memo(function CompatBadge({ items }: { items: CartItem[] }) {
    const report = useMemo(() => validateBuild(items), [items]);
    const cfg    = COMPAT_CONFIG[report.status] ?? COMPAT_CONFIG[CompatibilityLevel.COMPATIBLE];
    const { icon: Icon } = cfg;

    return (
        <div className={`${cfg.bg} ${cfg.text} border rounded-2xl p-5 shadow-sm transition-all`}>
            <div className="flex items-center gap-2.5 font-bold text-sm mb-2 uppercase tracking-wider">
                <Icon size={18} className={report.status === CompatibilityLevel.COMPATIBLE ? 'text-emerald-500' : ''} />
                Compatibility Snapshot — {cfg.label}
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
            </div>
            <p className="mt-2 text-sm font-semibold">{config.label}</p>
            {report.issues.length === 0 ? (
<<<<<<< HEAD
                <p className="mt-1 text-sm text-emerald-600/80">
                    All components were compatible at the time of purchase.
                </p>
            ) : (
                <ul className="mt-2 space-y-1 text-sm">
                    {report.issues.map((issue, index) => (
                        <li key={`${issue.message}-${index}`} className="flex items-start gap-2">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                            <span>{issue.message}</span>
=======
                <p className="text-sm font-medium opacity-80 leading-relaxed">
                    All components were validated and fully compatible at the time of purchase.
                </p>
            ) : (
                <ul className="space-y-2 mt-3 text-sm font-medium">
                    {report.issues.map((issue, i) => (
                        <li key={i} className="opacity-90 flex items-start gap-2">
                            <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                            {issue.message}
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
});

<<<<<<< HEAD
=======
// ── OrderFinancials ──────────────────────────────────────────────────────────

>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
const OrderFinancials = memo(function OrderFinancials({ order }: { order: Order }) {
    const subtotal = order.subtotal ?? Math.round(order.total / 1.18);
    const gst = order.gstAmount ?? (order.total - subtotal);

    return (
<<<<<<< HEAD
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span className="font-medium text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-600">
                <span>GST (18%)</span>
                <span className="font-medium text-slate-900">₹{gst.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <span className="text-base font-semibold text-slate-900">Order Total</span>
                <span className="text-xl font-bold text-slate-900">₹{order.total.toLocaleString('en-IN')}</span>
=======
        <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500 font-semibold uppercase tracking-wider">Subtotal</span>
                <span className="font-bold text-zinc-700">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500 font-semibold uppercase tracking-wider">GST (18%)</span>
                <span className="font-bold text-zinc-700">₹{gst.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center pt-4 mt-4 border-t border-zinc-200/60">
                <span className="text-sm sm:text-base text-zinc-900 font-bold uppercase tracking-wider">Order Total</span>
                <span className="text-xl sm:text-2xl font-black text-indigo-600">₹{order.total.toLocaleString('en-IN')}</span>
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
            </div>
        </div>
    );
});

<<<<<<< HEAD
interface TimelineStepProps {
    step: typeof TIMELINE_STEPS[number];
    idx: number;
    currentIdx: number;
    logs: Order['logs'];
    isLast: boolean;
    mobile?: boolean;
=======
// ── TimelineStep ──────────────────────────────────────────────────────────────

interface TimelineStepProps {
    step: typeof TIMELINE_STEPS[number]
    idx: number
    currentIdx: number
    logs: Order['logs']
    isLast: boolean
    mobile?: boolean
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
}

const TimelineStep = memo(function TimelineStep({
    step,
    idx,
    currentIdx,
    logs,
    isLast,
    mobile = false,
}: TimelineStepProps) {
    const isCompleted = idx <= currentIdx;
    const isActive = idx === currentIdx;
    const logEntry = logs?.find((log) => log.status === step.status);
    const Icon = step.icon;

    if (mobile) {
        return (
            <div className="flex gap-5">
                <div className="flex flex-col items-center">
<<<<<<< HEAD
                    <div 
                        className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-md border",
                            isCompleted
                                ? isActive
                                    ? 'border-slate-900 bg-slate-900 text-white'
                                    : 'border-slate-900 bg-slate-900 text-white'
                                : 'border-slate-200 bg-slate-50 text-slate-400'
                        )}
                    >
                        <Icon size={14} />
                    </div>
                    {!isLast && (
                        <div className={cn(
                            "my-1 min-h-[32px] w-px flex-1",
                            idx < currentIdx ? 'bg-slate-900' : 'bg-slate-200'
                        )} />
                    )}
                </div>
                <div className="pb-6 pt-1">
                    <p className={cn(
                        "text-sm font-medium",
                        isCompleted ? 'text-slate-900' : 'text-slate-500'
                    )}>
                        {step.label}
                    </p>
                    {logEntry && (
                        <p className="mt-0.5 font-mono text-xs text-slate-500">
                            {new Date(logEntry.timestamp).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
=======
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                        isCompleted 
                            ? isActive 
                                ? 'bg-indigo-600 text-white ring-4 ring-indigo-50 shadow-md animate-pulse' 
                                : 'bg-indigo-600 text-white' 
                            : 'bg-zinc-100 text-zinc-400 border border-zinc-200'
                    }`}>
                        <Icon size={18} />
                    </div>
                    {!isLast && (
                        <div className={`w-0.5 flex-1 min-h-[36px] my-1.5 rounded-full transition-colors duration-500 ${
                            idx < currentIdx ? 'bg-indigo-500' : 'bg-zinc-100'
                        }`} />
                    )}
                </div>
                <div className="pb-8 pt-1">
                    <p className={`text-sm font-bold leading-tight ${isCompleted ? 'text-zinc-900' : 'text-zinc-400'}`}>
                        {step.label}
                    </p>
                    {logEntry && (
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mt-1.5">
                            {new Date(logEntry.timestamp).toLocaleString('en-IN', { 
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
                            })}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <Fragment>
<<<<<<< HEAD
            <div className="flex w-28 flex-shrink-0 flex-col items-center gap-3">
                <div 
                    className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-md border transition-colors",
                        isCompleted
                            ? isActive
                                ? 'border-slate-900 bg-slate-900 text-white ring-2 ring-slate-100'
                                : 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 bg-slate-50 text-slate-400'
                    )}
                >
                    <Icon size={16} />
                </div>
                <div className="text-center">
                    <p className={cn(
                        "text-sm font-medium",
                        isCompleted ? 'text-slate-900' : 'text-slate-500'
                    )}>
                        {step.label}
                    </p>
                    {logEntry && (
                        <p className="mt-1 font-mono text-xs text-slate-500">
                            {new Date(logEntry.timestamp).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                            })}
=======
            <div className="flex flex-col items-center gap-3 min-w-0 flex-shrink-0 w-24">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 z-10 ${
                    isCompleted 
                        ? isActive 
                            ? 'bg-indigo-600 text-white ring-4 ring-indigo-50 shadow-lg shadow-indigo-600/20 scale-110' 
                            : 'bg-indigo-600 text-white' 
                        : 'bg-zinc-50 text-zinc-400 border-2 border-zinc-100'
                }`}>
                    <Icon size={20} className={isActive ? 'animate-pulse' : ''} />
                </div>
                <div className="text-center space-y-1">
                    <p className={`text-xs font-bold leading-tight ${isCompleted ? 'text-zinc-900' : 'text-zinc-400'}`}>
                        {step.label}
                    </p>
                    {logEntry && (
                        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
                            {new Date(logEntry.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
                        </p>
                    )}
                </div>
            </div>
            {!isLast && (
<<<<<<< HEAD
                <div className="flex-1 px-2 pt-5">
                    <div className={cn(
                        "h-px w-full",
                        idx < currentIdx ? 'bg-slate-900' : 'bg-slate-200'
                    )} />
=======
                <div className="flex-1 px-2 mt-6 relative z-0">
                    <div className="h-1 w-full rounded-full bg-zinc-100 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ease-out ${
                            idx < currentIdx ? 'bg-indigo-500 w-full' : 'bg-transparent w-0'
                        }`} />
                    </div>
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
                </div>
            )}
        </Fragment>
    );
});

export default function TrackOrderPage() {
    const { addToCart, clearCart, setCartOpen } = useShop();
<<<<<<< HEAD
    const { trackOrder } = useOrder();

    const [orderId, setOrderId] = useState('');
    const [contact, setContact] = useState('');
    const [searched, setSearched] = useState(false);
    const [foundOrder, setFoundOrder] = useState<Order | null>(null);
=======

    const [orderId,       setOrderId]       = useState('');
    const [contact,       setContact]       = useState('');
    const [searched,      setSearched]      = useState(false);
    const [foundOrder,    setFoundOrder]    = useState<Order | null>(null);
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
    const [isDownloading, setIsDownloading] = useState(false);
    const [invoiceAccessToken, setInvoiceAccessToken] = useState('');

<<<<<<< HEAD
    const handleSearch = useCallback(async (event: React.FormEvent) => {
        event.preventDefault();
        setSearched(false);
        try {
            const order = await trackOrder(orderId, contact);
            setFoundOrder(order);
        } catch (error) {
            console.error('Track order error:', error);
            setFoundOrder(null);
        } finally {
            setSearched(true);
        }
    }, [orderId, contact, trackOrder]);
=======
    const handleSearch = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/orders/lookup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: orderId.trim().toUpperCase(),
                    contact: contact.trim(),
                }),
            });
            const data = await res.json();
            setFoundOrder(data.order ?? null);
            setInvoiceAccessToken(data.invoiceAccessToken ?? '');
            setSearched(true);
        } catch (err) {
            console.error('Failed to lookup order:', err);
            setFoundOrder(null);
            setInvoiceAccessToken('');
            setSearched(true);
        }
    }, [orderId, contact]);

    const handleOrderIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setOrderId(e.target.value); setSearched(false); setInvoiceAccessToken('');
    }, []);

    const handleContactChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setContact(e.target.value); setSearched(false); setInvoiceAccessToken('');
    }, []);
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50

    const reorderItems = useMemo<CartItem[]>(
        () => foundOrder?.items.map(orderItemToCartItem) ?? [],
        [foundOrder]
    );

    const handleReorder = useCallback(() => {
        if (!foundOrder) return;
        clearCart();
<<<<<<< HEAD
        (foundOrder.items ?? []).forEach((item) => addToCart(item as any));
=======
        reorderItems.forEach((item) => addToCart(item));
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
        setCartOpen(true);
    }, [foundOrder, clearCart, reorderItems, addToCart, setCartOpen]);

    const handleDownloadInvoice = useCallback(async () => {
        if (!foundOrder || !invoiceAccessToken || isDownloading) return;
        try {
            setIsDownloading(true);
<<<<<<< HEAD
            const response = await fetch(`/api/orders/${foundOrder.id}/invoice/pdf`);
            if (!response.ok) throw new Error('Failed to download invoice');
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `Invoice-${foundOrder.id}.pdf`;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
=======
            const res = await fetch(`/api/orders/${foundOrder.id}/invoice/pdf?accessToken=${encodeURIComponent(invoiceAccessToken)}`);
            if (!res.ok) throw new Error('Failed to download invoice');
            const blob = await res.blob();
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = `Invoice-${foundOrder.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading invoice:', error);
            alert('Failed to download invoice. Please try again later.');
        } finally {
            setIsDownloading(false);
        }
    }, [foundOrder, invoiceAccessToken, isDownloading]);

    const currentStepIdx = useMemo(
        () => foundOrder ? statusIndex(foundOrder.status) : -1,
        [foundOrder]
    );

    const isCancelled = foundOrder ? CANCEL_STATUSES.has(foundOrder.status) : false;

    return (
<<<<<<< HEAD
        <PageLayout bgClass="bg-slate-50">
            <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">Track Order</h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Enter your order details below to check the current status and tracking information.
                    </p>
                </div>

                {/* Search Form */}
                <form
                    onSubmit={handleSearch}
                    className="mb-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">Order ID</label>
                            <input
                                required
                                value={orderId}
                                onChange={(event) => {
                                    setOrderId(event.target.value);
                                    setSearched(false);
                                }}
                                placeholder="e.g. ORD-1234567890"
                                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">Email or Phone</label>
                            <input
                                required
                                value={contact}
                                onChange={(event) => {
                                    setContact(event.target.value);
                                    setSearched(false);
                                }}
                                placeholder="Used during checkout"
                                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                            />
=======
        <PageLayout bgClass="bg-zinc-50/50">
            <PageLayout.Header>
                <PageTitle
                    alignment="center"
                    title="Track Your Order"
                    subtitle="Enter your Order ID and the email address you used during checkout to get real-time status updates."
                    badge={
                        <div className="inline-flex items-center gap-2 bg-indigo-50/80 text-indigo-700 text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-4 ring-1 ring-indigo-500/10">
                            <Package size={14} /> Order Tracking
                        </div>
                    }
                />
            </PageLayout.Header>

            <PageLayout.Content className="max-w-4xl mx-auto w-full space-y-8" padding="lg">
                {/* Lookup Form */}
                <form
                    onSubmit={handleSearch}
                    className="bg-white rounded-3xl ring-1 ring-zinc-950/5 shadow-xl shadow-indigo-900/5 p-6 sm:p-10 space-y-6"
                >
                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Order ID</label>
                            <div className="relative group">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <input
                                    required
                                    value={orderId}
                                    onChange={handleOrderIdChange}
                                    placeholder="e.g. ORD-1234567890"
                                    className="w-full h-14 pl-11 pr-4 rounded-2xl text-sm font-medium transition-all bg-zinc-50 border-0 ring-1 ring-inset ring-zinc-200 focus:ring-2 focus:ring-inset focus:ring-indigo-500 focus:bg-white placeholder:text-zinc-400"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <input
                                    required
                                    type="email"
                                    value={contact}
                                    onChange={handleContactChange}
                                    placeholder="email@example.com"
                                    className="w-full h-14 pl-11 pr-4 rounded-2xl text-sm font-medium transition-all bg-zinc-50 border-0 ring-1 ring-inset ring-zinc-200 focus:ring-2 focus:ring-inset focus:ring-indigo-500 focus:bg-white placeholder:text-zinc-400"
                                />
                            </div>
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
                        </div>
                    </div>
                    <button
                        type="submit"
<<<<<<< HEAD
                        className="mt-6 flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-md bg-slate-900 px-6 text-sm font-medium text-white transition-colors hover:bg-slate-800"
=======
                        className="w-full h-14 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/30 hover:-translate-y-0.5 active:translate-y-0 uppercase tracking-widest"
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
                    >
                        <Search size={16} />
                        Track Order
                    </button>
                </form>

                {/* Not Found State */}
                {searched && !foundOrder && (
<<<<<<< HEAD
                    <div className="rounded-lg border border-slate-200 bg-white p-12 text-center shadow-sm">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-600">
                            <XCircle size={24} />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-slate-900">Order not found</h3>
                        <p className="mt-2 text-sm text-slate-500">
                            Double-check your order ID and the contact detail used during checkout.
=======
                    <div className="bg-white rounded-3xl ring-1 ring-red-950/5 p-12 text-center shadow-xl shadow-red-900/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
                            <XCircle className="text-red-500" size={36} />
                        </div>
                        <h3 className="text-2xl font-bold text-zinc-900 mb-2 heading-font">Order Not Found</h3>
                        <p className="text-base text-zinc-500 max-w-sm mx-auto font-medium">
                            We couldn't find an order matching these details. Please double-check your Order ID and email.
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
                        </p>
                    </div>
                )}

<<<<<<< HEAD
                {/* Found Order Details */}
                {foundOrder && (
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <div className="grid gap-4 border-b border-slate-200 p-5 sm:grid-cols-2 xl:grid-cols-4 bg-slate-50/50">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Order ID</p>
                                    <p className="mt-1 font-mono text-sm font-semibold text-slate-900">{foundOrder.id}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Placed On</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                        {new Date(foundOrder.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">₹{foundOrder.total.toLocaleString('en-IN')}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Payment</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{foundOrder.paymentMethod}</p>
                                </div>
                            </div>

                            {isCancelled ? (
                                <div className="flex items-start gap-3 bg-rose-50 p-6 text-rose-700 border-b border-slate-200">
                                    <XCircle size={20} className="mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-base font-semibold">Order {foundOrder.status.toLowerCase()}</p>
                                        <p className="mt-1 text-sm">{foundOrder.logs?.at(-1)?.note}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 sm:p-8 border-b border-slate-200">
                                    <div className="hidden sm:flex items-start gap-0">
                                        {TIMELINE_STEPS.map((step, idx) => (
                                            <TimelineStep
                                                key={step.status}
                                                step={step}
                                                idx={idx}
                                                currentIdx={currentStepIdx}
                                                logs={foundOrder.logs}
                                                isLast={idx === TIMELINE_STEPS.length - 1}
                                            />
                                        ))}
                                    </div>
                                    <div className="space-y-0 sm:hidden">
                                        {TIMELINE_STEPS.map((step, idx) => (
                                            <TimelineStep
                                                key={step.status}
                                                step={step}
                                                idx={idx}
                                                currentIdx={currentStepIdx}
                                                logs={foundOrder.logs}
                                                isLast={idx === TIMELINE_STEPS.length - 1}
                                                mobile
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-white p-5 text-sm text-slate-600">
                                <div className="flex items-start gap-3">
                                    <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
                                    <span>
                                        <span className="font-medium text-slate-900">Shipping Address:</span>{' '}
                                        {foundOrder.shippingStreet}, {foundOrder.shippingCity}, {foundOrder.shippingState} - {foundOrder.shippingZip}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Items Card */}
                        <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <div className="border-b border-slate-200 bg-slate-50/50 p-5">
                                <h2 className="text-base font-semibold text-slate-900">Order Items</h2>
                            </div>
                            <ul className="divide-y divide-slate-100">
                                {(foundOrder.items ?? []).map((item) => (
                                    <li key={item.id} className="p-5">
                                        <div className="flex items-center gap-4">
                                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white">
                                                <Image
                                                    src={item.image ?? '/placeholder.png'}
                                                    alt={item.name}
                                                    fill
                                                    sizes="64px"
                                                    className="object-contain p-1"
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-slate-900">{item.name}</p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {item.category} • Qty {item.quantity}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-slate-900">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                                                <p className="mt-0.5 text-xs text-slate-500">₹{item.price.toLocaleString('en-IN')} each</p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <div className="border-t border-slate-200 bg-slate-50/50 p-5">
                                <OrderFinancials order={foundOrder} />
                            </div>
                        </div>

                        <CompatBadge items={(foundOrder.items ?? []) as CartItem[]} />

                        {/* Actions */}
                        <div className="grid gap-3 sm:grid-cols-3">
                            <button
                                onClick={handleReorder}
                                className="flex h-10 items-center justify-center gap-2 rounded-md bg-slate-900 text-sm font-medium text-white transition-colors hover:bg-slate-800"
=======
                {/* Order Found State */}
                {foundOrder && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Order Header / Stats */}
                        <div className="bg-white rounded-3xl ring-1 ring-zinc-950/5 shadow-xl shadow-indigo-900/5 overflow-hidden">
                            <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-zinc-100 bg-zinc-50/50">
                                <div className="p-6 space-y-1.5">
                                    <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest">Order ID</p>
                                    <p className="font-mono font-bold text-zinc-900 text-sm sm:text-base truncate">{foundOrder.id}</p>
                                </div>
                                <div className="p-6 space-y-1.5">
                                    <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest">Date</p>
                                    <p className="text-sm sm:text-base font-semibold text-zinc-900 truncate">
                                        {new Date(foundOrder.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                                <div className="p-6 space-y-1.5">
                                    <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest">Total</p>
                                    <p className="text-sm sm:text-base font-black text-indigo-600 truncate">
                                        ₹{foundOrder.total.toLocaleString('en-IN')}
                                    </p>
                                </div>
                                <div className="p-6 space-y-1.5">
                                    <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest">Payment</p>
                                    <p className="text-sm sm:text-base font-semibold text-zinc-900 truncate">{foundOrder.paymentMethod}</p>
                                </div>
                            </div>

                            <div className="border-t border-zinc-100">
                                {/* Timeline */}
                                {isCancelled ? (
                                    <div className="p-8 flex items-center gap-5 text-red-700 bg-red-50/50">
                                        <div className="p-3 bg-red-100 rounded-full">
                                            <XCircle size={28} />
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold">Order {foundOrder.status}</p>
                                            <p className="text-sm font-medium opacity-80 mt-1">
                                                {foundOrder.logs?.at(-1)?.note || 'This order has been cancelled or returned.'}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 sm:p-12">
                                        {/* Desktop Timeline */}
                                        <div className="hidden sm:flex items-start justify-between">
                                            {TIMELINE_STEPS.map((step, idx) => (
                                                <TimelineStep
                                                    key={step.status}
                                                    step={step}
                                                    idx={idx}
                                                    currentIdx={currentStepIdx}
                                                    logs={foundOrder.logs}
                                                    isLast={idx === TIMELINE_STEPS.length - 1}
                                                />
                                            ))}
                                        </div>
                                        {/* Mobile Timeline */}
                                        <div className="sm:hidden space-y-0 pl-2">
                                            {TIMELINE_STEPS.map((step, idx) => (
                                                <TimelineStep
                                                    key={step.status}
                                                    step={step}
                                                    idx={idx}
                                                    currentIdx={currentStepIdx}
                                                    logs={foundOrder.logs}
                                                    isLast={idx === TIMELINE_STEPS.length - 1}
                                                    mobile
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Shipping address */}
                            <div className="px-6 py-5 border-t border-zinc-100 bg-zinc-50 flex items-start sm:items-center gap-3.5 text-sm text-zinc-600 font-medium">
                                <div className="p-2 bg-white rounded-lg ring-1 ring-zinc-200/50 flex-shrink-0 mt-0.5 sm:mt-0">
                                    <MapPin size={18} className="text-zinc-500" />
                                </div>
                                <span className="leading-relaxed">
                                    <strong className="text-zinc-900 mr-1">Shipping Details:</strong>
                                    {foundOrder.shippingStreet}, {foundOrder.shippingCity}, {foundOrder.shippingState} – {foundOrder.shippingZip}
                                </span>
                            </div>
                        </div>

                        {/* Two Column Layout for Desktop */}
                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Product List */}
                            <div className="lg:col-span-2 bg-white rounded-3xl ring-1 ring-zinc-950/5 shadow-xl shadow-indigo-900/5 overflow-hidden flex flex-col">
                                <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50/50">
                                    <h2 className="font-bold text-zinc-900 text-lg heading-font">Items in Order</h2>
                                </div>
                                <ul className="divide-y divide-zinc-50 flex-1 overflow-y-auto">
                                    {foundOrder.items.map((item) => (
                                        <li key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-5 hover:bg-zinc-50/50 transition-colors">
                                            <div className="w-20 h-20 bg-white rounded-2xl ring-1 ring-zinc-200 flex items-center justify-center flex-shrink-0 overflow-hidden relative group">
                                                <img
                                                    src={item.image ?? '/placeholder.png'}
                                                    alt={item.name}
                                                    loading="lazy"
                                                    decoding="async"
                                                    className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-500"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-zinc-900 text-base line-clamp-2 sm:truncate">{item.name}</p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider bg-zinc-100 px-2 py-0.5 rounded-md">
                                                        {getOrderItemCategoryLabel(item)}
                                                    </span>
                                                    <span className="text-xs font-bold text-zinc-400">× {item.quantity}</span>
                                                </div>
                                            </div>
                                            <div className="sm:text-right flex-shrink-0 mt-2 sm:mt-0">
                                                <p className="font-black text-zinc-900 text-lg">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                                                {item.quantity > 1 && (
                                                    <p className="text-xs font-semibold text-zinc-400">₹{item.price.toLocaleString('en-IN')} each</p>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Sidebar: Financials & Compatibility */}
                            <div className="space-y-6">
                                <div className="bg-white rounded-3xl ring-1 ring-zinc-950/5 shadow-xl shadow-indigo-900/5 overflow-hidden">
                                    <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50/50">
                                        <h2 className="font-bold text-zinc-900 text-lg heading-font">Order Summary</h2>
                                    </div>
                                    <div className="p-6 bg-white">
                                        <OrderFinancials order={foundOrder} />
                                    </div>
                                </div>

                                <div>
                                    <CompatBadge items={reorderItems} />
                                </div>
                            </div>
                        </div>

                        {/* Desktop Actions */}
                        <div className="hidden sm:flex gap-4 pt-4">
                            <button
                                onClick={handleReorder}
                                className="flex-1 flex items-center justify-center gap-2 h-14 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-2xl text-sm transition-all shadow-xl shadow-zinc-900/20 hover:-translate-y-0.5 active:translate-y-0 uppercase tracking-widest"
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
                            >
                                <RefreshCw size={16} />
                                Reorder Items
                            </button>
                            <a
                                href={`https://wa.me/919999999999?text=Hi%2C%20I%20need%20support%20for%20my%20order%20%23${encodeURIComponent(foundOrder.id)}`}
                                target="_blank"
                                rel="noopener noreferrer"
<<<<<<< HEAD
                                className="flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
=======
                                className="flex-1 flex items-center justify-center gap-2 h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl text-sm transition-all shadow-xl shadow-emerald-500/20 hover:-translate-y-0.5 active:translate-y-0 uppercase tracking-widest"
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
                            >
                                <MessageCircle size={16} />
                                WhatsApp Support
                            </a>
                            <button
                                onClick={handleDownloadInvoice}
                                disabled={isDownloading}
<<<<<<< HEAD
                                className="flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
=======
                                className="px-6 h-14 flex items-center justify-center min-w-[160px] gap-2 border-2 border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-zinc-700 font-bold rounded-2xl text-sm transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
                            >
                                <FileDown size={16} />
                                {isDownloading ? 'Downloading...' : 'Download Invoice'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Sticky Actions */}
            {foundOrder && (
<<<<<<< HEAD
                <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white p-4 pb-safe sm:hidden">
                    <div className="flex gap-3">
                        <button
                            onClick={handleReorder}
                            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-slate-900 text-sm font-medium text-white"
                        >
                            <ShoppingCart size={16} />
                            Reorder
                        </button>
                        <a
                            href={`https://wa.me/919999999999?text=Order%20%23${encodeURIComponent(foundOrder.id)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700"
                        >
                            <MessageCircle size={16} />
                            Support
                        </a>
                    </div>
=======
                <div className="sm:hidden fixed bottom-0 pb-safe left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-zinc-200 p-4 flex gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                    <button
                        onClick={handleReorder}
                        className="flex-1 flex items-center justify-center gap-1.5 h-12 bg-zinc-900 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-zinc-900/20"
                    >
                        <ShoppingCart size={16} /> Reorder
                    </button>
                    <a
                        href={`https://wa.me/919999999999?text=Order%20%23${encodeURIComponent(foundOrder.id)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 h-12 bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-500/20"
                    >
                        <MessageCircle size={16} /> Support
                    </a>
                    <button
                        onClick={handleDownloadInvoice}
                        disabled={isDownloading}
                        className="h-12 w-12 flex-shrink-0 ring-1 ring-inset ring-zinc-200 bg-white rounded-xl flex items-center justify-center text-zinc-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Download Invoice"
                    >
                        {isDownloading ? (
                            <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
                        ) : (
                            <FileDown size={20} />
                        )}
                    </button>
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
                </div>
            )}
        </PageLayout>
    );
}
