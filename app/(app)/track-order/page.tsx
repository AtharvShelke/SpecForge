'use client';

import { useState, useEffect, useCallback, useMemo, memo, Fragment } from 'react';
import { useShop } from '@/context/ShopContext';
import { validateBuild } from '@/lib/calculations/compatibility';
import {
    Package, Search, Clock, CheckCircle2, Truck, PackageCheck,
    XCircle, MapPin, CreditCard, MessageCircle, ShoppingCart,
    AlertOctagon, AlertTriangle, CheckCircle, FileDown, RefreshCw,
    Hash, Mail, // Added new icons for the form
    type LucideIcon,
} from 'lucide-react';
import { Order, OrderStatus, CompatibilityLevel, CartItem } from '@/types';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageTitle } from '@/components/layout/PageTitle';

// ── Constants ─────────────────────────────────────────────────────────────────

const TIMELINE_STEPS: { status: OrderStatus; label: string; icon: LucideIcon }[] = [
    { status: OrderStatus.PENDING,    label: 'Order Placed',      icon: Clock        },
    { status: OrderStatus.PAID,       label: 'Payment Confirmed', icon: CreditCard   },
    { status: OrderStatus.PROCESSING, label: 'Being Packed',      icon: PackageCheck },
    { status: OrderStatus.SHIPPED,    label: 'Shipped',           icon: Truck        },
    { status: OrderStatus.DELIVERED,  label: 'Delivered',         icon: CheckCircle2 },
];

const STATUS_ORDER: OrderStatus[] = [
    OrderStatus.PENDING,
    OrderStatus.PAID,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
];

const CANCEL_STATUSES = new Set([OrderStatus.CANCELLED, OrderStatus.RETURNED]);

const COMPAT_CONFIG = {
    [CompatibilityLevel.INCOMPATIBLE]: {
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
    },
} as const;

const statusIndex = (s: OrderStatus) => STATUS_ORDER.indexOf(s);

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
            </div>
            {report.issues.length === 0 ? (
                <p className="text-sm font-medium opacity-80 leading-relaxed">
                    All components were validated and fully compatible at the time of purchase.
                </p>
            ) : (
                <ul className="space-y-2 mt-3 text-sm font-medium">
                    {report.issues.map((issue, i) => (
                        <li key={i} className="opacity-90 flex items-start gap-2">
                            <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                            {issue.message}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
});

// ── OrderFinancials ──────────────────────────────────────────────────────────

const OrderFinancials = memo(function OrderFinancials({ order }: { order: Order }) {
    const subtotal = order.subtotal ?? Math.round(order.total / 1.18);
    const gst      = order.gstAmount ?? (order.total - subtotal);

    return (
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
            </div>
        </div>
    );
});

// ── TimelineStep ──────────────────────────────────────────────────────────────

interface TimelineStepProps {
    step: typeof TIMELINE_STEPS[number]
    idx: number
    currentIdx: number
    logs: Order['logs']
    isLast: boolean
    mobile?: boolean
}

const TimelineStep = memo(function TimelineStep({
    step, idx, currentIdx, logs, isLast, mobile = false,
}: TimelineStepProps) {
    const isCompleted = idx <= currentIdx;
    const isActive    = idx === currentIdx;
    const logEntry    = logs?.find(l => l.status === step.status);
    const Icon        = step.icon;

    if (mobile) {
        return (
            <div className="flex gap-5">
                <div className="flex flex-col items-center">
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
                            })}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <Fragment>
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
                        </p>
                    )}
                </div>
            </div>
            {!isLast && (
                <div className="flex-1 px-2 mt-6 relative z-0">
                    <div className="h-1 w-full rounded-full bg-zinc-100 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ease-out ${
                            idx < currentIdx ? 'bg-indigo-500 w-full' : 'bg-transparent w-0'
                        }`} />
                    </div>
                </div>
            )}
        </Fragment>
    );
});

// ── TrackOrderPage ────────────────────────────────────────────────────────────

export default function TrackOrderPage() {
    const { addToCart, clearCart, setCartOpen } = useShop();
    const [orders, setOrders] = useState<Order[]>([]);

    const refreshOrders = useCallback(async (email?: string) => {
        try {
            const url = email ? `/api/orders?email=${encodeURIComponent(email)}` : '/api/orders';
            const res = await fetch(url);
            const data = await res.json();
            if (data.orders) setOrders(data.orders);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        }
    }, []);

    useEffect(() => { refreshOrders(); }, [refreshOrders]);

    const [orderId,       setOrderId]       = useState('');
    const [contact,       setContact]       = useState('');
    const [searched,      setSearched]      = useState(false);
    const [foundOrder,    setFoundOrder]    = useState<Order | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        const trimId      = orderId.trim().toUpperCase();
        const trimContact = contact.trim().toLowerCase();
        const match = orders.find(o =>
            o.id.toUpperCase() === trimId &&
            (o.email.toLowerCase() === trimContact || (o as any).phone?.toLowerCase() === trimContact)
        );
        setFoundOrder(match ?? null);
        setSearched(true);
    }, [orderId, contact, orders]);

    const handleOrderIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setOrderId(e.target.value); setSearched(false);
    }, []);

    const handleContactChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setContact(e.target.value); setSearched(false);
    }, []);

    const handleReorder = useCallback(() => {
        if (!foundOrder) return;
        clearCart();
        foundOrder.items.forEach(item => addToCart(item as any));
        setCartOpen(true);
    }, [foundOrder, clearCart, addToCart, setCartOpen]);

    const handleDownloadInvoice = useCallback(async () => {
        if (!foundOrder || isDownloading) return;
        try {
            setIsDownloading(true);
            const res = await fetch(`/api/orders/${foundOrder.id}/invoice/pdf`);
            if (!res.ok) throw new Error('Failed to download invoice');
            const blob = await res.blob();
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = `Invoice-${foundOrder.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading invoice:', error);
            alert('Failed to download invoice. Please try again later.');
        } finally {
            setIsDownloading(false);
        }
    }, [foundOrder, isDownloading]);

    const currentStepIdx = useMemo(
        () => foundOrder ? statusIndex(foundOrder.status) : -1,
        [foundOrder]
    );

    const isCancelled = foundOrder ? CANCEL_STATUSES.has(foundOrder.status) : false;

    return (
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
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full h-14 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/30 hover:-translate-y-0.5 active:translate-y-0 uppercase tracking-widest"
                    >
                        <Search size={18} /> Track Order
                    </button>
                </form>

                {/* Not Found State */}
                {searched && !foundOrder && (
                    <div className="bg-white rounded-3xl ring-1 ring-red-950/5 p-12 text-center shadow-xl shadow-red-900/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
                            <XCircle className="text-red-500" size={36} />
                        </div>
                        <h3 className="text-2xl font-bold text-zinc-900 mb-2 heading-font">Order Not Found</h3>
                        <p className="text-base text-zinc-500 max-w-sm mx-auto font-medium">
                            We couldn't find an order matching these details. Please double-check your Order ID and email.
                        </p>
                    </div>
                )}

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
                                                    src={item.image}
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
                                                        {(item.category as any)?.name || (item.category as any)}
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
                                    <CompatBadge items={foundOrder.items as any} />
                                </div>
                            </div>
                        </div>

                        {/* Desktop Actions */}
                        <div className="hidden sm:flex gap-4 pt-4">
                            <button
                                onClick={handleReorder}
                                className="flex-1 flex items-center justify-center gap-2 h-14 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-2xl text-sm transition-all shadow-xl shadow-zinc-900/20 hover:-translate-y-0.5 active:translate-y-0 uppercase tracking-widest"
                            >
                                <RefreshCw size={18} /> Reorder This Build
                            </button>
                            <a
                                href={`https://wa.me/919999999999?text=Hi%2C%20I%20need%20support%20for%20my%20order%20%23${encodeURIComponent(foundOrder.id)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl text-sm transition-all shadow-xl shadow-emerald-500/20 hover:-translate-y-0.5 active:translate-y-0 uppercase tracking-widest"
                            >
                                <MessageCircle size={18} /> WhatsApp Support
                            </a>
                            <button
                                onClick={handleDownloadInvoice}
                                disabled={isDownloading}
                                className="px-6 h-14 flex items-center justify-center min-w-[160px] gap-2 border-2 border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-zinc-700 font-bold rounded-2xl text-sm transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDownloading ? (
                                    <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
                                ) : (
                                    <><FileDown size={18} /> Download</>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {!searched && (
                    <p className="text-center text-xs font-semibold text-zinc-400 uppercase tracking-widest mt-8">
                        Demo: use any Order ID from the admin panel with its associated email.
                    </p>
                )}
            </PageLayout.Content>

            {/* Mobile Sticky Footer */}
            {foundOrder && (
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
                </div>
            )}
        </PageLayout>
    );
}