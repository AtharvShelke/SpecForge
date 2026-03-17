'use client';

import { useState, useEffect, useCallback, useMemo, memo, Fragment } from 'react';
import { useShop } from '@/context/ShopContext';
import { validateBuild } from '@/services/compatibility';
import {
    Package, Search, Clock, CheckCircle2, Truck, PackageCheck,
    XCircle, MapPin, CreditCard, MessageCircle, ShoppingCart,
    AlertOctagon, AlertTriangle, CheckCircle, FileDown, RefreshCw,
    type LucideIcon,
} from 'lucide-react';
import { Order, OrderStatus, CompatibilityLevel, CartItem } from '@/types';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageTitle } from '@/components/layout/PageTitle';

// ── Constants (module scope — never recreated) ────────────────────────────────

const TIMELINE_STEPS: { status: OrderStatus; label: string; icon: LucideIcon }[] = [
    { status: OrderStatus.PENDING,    label: 'Order Placed',       icon: Clock        },
    { status: OrderStatus.PAID,       label: 'Payment Confirmed',  icon: CreditCard   },
    { status: OrderStatus.PROCESSING, label: 'Being Packed',       icon: PackageCheck },
    { status: OrderStatus.SHIPPED,    label: 'Shipped',            icon: Truck        },
    { status: OrderStatus.DELIVERED,  label: 'Delivered',          icon: CheckCircle2 },
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
        bg: 'bg-red-50 border-red-200', text: 'text-red-700',
        icon: AlertOctagon, label: 'Incompatible Build',
    },
    [CompatibilityLevel.WARNING]: {
        bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700',
        icon: AlertTriangle, label: 'Minor Issues',
    },
    [CompatibilityLevel.COMPATIBLE]: {
        bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700',
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
        <div className={`${cfg.bg} ${cfg.text} border rounded-2xl p-4 shadow-sm`}>
            <div className="flex items-center gap-2 font-bold text-sm mb-2 uppercase tracking-wide">
                <Icon size={18} />
                Compatibility Snapshot — {cfg.label}
            </div>
            {report.issues.length === 0 ? (
                <p className="text-sm font-medium opacity-80">All components were compatible at the time of purchase.</p>
            ) : (
                <ul className="space-y-1.5 mt-2 text-sm font-medium">
                    {report.issues.map((issue, i) => (
                        <li key={i} className="opacity-90">• {issue.message}</li>
                    ))}
                </ul>
            )}
        </div>
    );
});

// ── OrderFinancials — extracted to avoid IIFE in JSX ─────────────────────────

const OrderFinancials = memo(function OrderFinancials({ order }: { order: Order }) {
    const subtotal = order.subtotal ?? Math.round(order.total / 1.18);
    const gst      = order.gstAmount ?? (order.total - subtotal);

    return (
        <>
            <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500 font-bold uppercase tracking-wider">Subtotal</span>
                <span className="text-base font-bold text-zinc-700">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500 font-bold uppercase tracking-wider">GST (18%)</span>
                <span className="text-base font-bold text-zinc-700">₹{gst.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center pt-3 mt-3 border-t border-zinc-200">
                <span className="text-lg text-zinc-950 font-black uppercase tracking-wider">Order Total</span>
                <span className="text-2xl font-black text-indigo-600">₹{order.total.toLocaleString('en-IN')}</span>
            </div>
        </>
    );
});

// ── TimelineStep — extracted to prevent re-renders on unrelated state ─────────

interface TimelineStepProps {
    step:          typeof TIMELINE_STEPS[number]
    idx:           number
    currentIdx:    number
    logs:          Order['logs']
    isLast:        boolean
    mobile?:       boolean
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
            <div className="flex gap-4">
                <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isCompleted ? isActive ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-md shadow-indigo-600/20' : 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                        <Icon size={16} />
                    </div>
                    {!isLast && (
                        <div className={`w-0.5 flex-1 min-h-[32px] my-1 rounded-full ${idx < currentIdx ? 'bg-indigo-500' : 'bg-zinc-200'}`} />
                    )}
                </div>
                <div className="pb-6 pt-1">
                    <p className={`text-sm font-bold leading-tight ${isCompleted ? 'text-zinc-950' : 'text-zinc-400'}`}>
                        {step.label}
                    </p>
                    {logEntry && (
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mt-1">
                            {new Date(logEntry.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <Fragment>
            <div className="flex flex-col items-center gap-2 min-w-0 flex-shrink-0 w-20">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isCompleted ? isActive ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-lg shadow-indigo-600/30' : 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                    <Icon size={20} />
                </div>
                <p className={`text-xs font-bold text-center leading-tight mt-1 ${isCompleted ? 'text-zinc-900' : 'text-zinc-400'}`}>
                    {step.label}
                </p>
                {logEntry && (
                    <p className="text-[10px] font-semibold text-zinc-400 text-center uppercase tracking-wide">
                        {new Date(logEntry.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                )}
            </div>
            {!isLast && (
                <div className="flex-1 px-1 mt-6">
                    <div className={`h-1 w-full rounded-full transition-all duration-500 ${idx < currentIdx ? 'bg-indigo-500' : 'bg-zinc-200'}`} />
                </div>
            )}
        </Fragment>
    );
});

// ── TrackOrderPage ────────────────────────────────────────────────────────────

export default function TrackOrderPage() {
    const { orders, refreshOrders, addToCart, clearCart, setCartOpen } = useShop();

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
        <PageLayout bgClass="bg-zinc-50">
            <PageLayout.Header>
                <PageTitle
                    alignment="center"
                    title="Track Your Order"
                    subtitle="Enter your Order ID and the email address you used during checkout to get real-time status updates."
                    badge={
                        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
                            <Package size={14} /> Order Tracking
                        </div>
                    }
                />
            </PageLayout.Header>

            <PageLayout.Content className="max-w-3xl mx-auto w-full space-y-8" padding="lg">
                {/* Lookup Form */}
                <form
                    onSubmit={handleSearch}
                    className="bg-white rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-200/40 p-6 sm:p-10 space-y-6"
                >
                    <div className="grid sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Order ID</label>
                            <input
                                required
                                value={orderId}
                                onChange={handleOrderIdChange}
                                placeholder="e.g. ORD-1234567890"
                                className="w-full h-12 px-4 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all bg-zinc-50 focus:bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Email Address</label>
                            <input
                                required
                                value={contact}
                                onChange={handleContactChange}
                                placeholder="email@example.com"
                                className="w-full h-12 px-4 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all bg-zinc-50 focus:bg-white"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full h-12 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-sm transition-all shadow-xl shadow-indigo-600/20 hover:scale-[1.01] active:scale-[0.99] uppercase tracking-wide"
                    >
                        <Search size={18} /> Track Order
                    </button>
                </form>

                {/* Not Found */}
                {searched && !foundOrder && (
                    <div className="bg-white rounded-3xl border border-red-100 p-12 text-center shadow-lg shadow-red-100/50">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="text-red-400" size={36} />
                        </div>
                        <h3 className="text-2xl font-bold text-zinc-900 mb-2 heading-font">Order Not Found</h3>
                        <p className="text-base text-zinc-500 max-w-sm mx-auto font-medium">
                            Please double-check your Order ID and the email address used during checkout.
                        </p>
                    </div>
                )}

                {/* Order Found */}
                {foundOrder && (
                    <div className="space-y-6">
                        {/* Order Header */}
                        <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-200/40 overflow-hidden">
                            <div className="bg-zinc-50 px-6 py-5 border-b border-zinc-100 flex flex-wrap justify-between items-start gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Order ID</p>
                                    <p className="font-mono font-bold text-zinc-950 text-base">{foundOrder.id}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Date</p>
                                    <p className="text-base font-semibold text-zinc-900">
                                        {new Date(foundOrder.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Total</p>
                                    <p className="text-base font-black text-zinc-950">₹{foundOrder.total.toLocaleString('en-IN')}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Payment</p>
                                    <p className="text-base font-semibold text-zinc-900">{foundOrder.paymentMethod}</p>
                                </div>
                            </div>

                            {/* Timeline */}
                            {isCancelled ? (
                                <div className="px-6 py-8 flex items-center gap-4 text-red-600 bg-red-50/30">
                                    <XCircle size={28} />
                                    <div>
                                        <p className="text-lg font-bold">Order {foundOrder.status}</p>
                                        <p className="text-sm font-medium opacity-80 mt-1">
                                            {foundOrder.logs?.at(-1)?.note}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="px-6 py-10">
                                    {/* Desktop */}
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
                                    {/* Mobile */}
                                    <div className="sm:hidden space-y-0">
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

                            {/* Shipping address */}
                            <div className="px-6 py-5 border-t border-zinc-100 bg-zinc-50 flex items-start sm:items-center gap-3 text-sm text-zinc-600 font-medium">
                                <MapPin size={20} className="text-zinc-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                                <span>
                                    <strong className="text-zinc-900">Shipping Address:</strong>{' '}
                                    {foundOrder.shippingStreet}, {foundOrder.shippingCity}, {foundOrder.shippingState} – {foundOrder.shippingZip}
                                </span>
                            </div>
                        </div>

                        {/* Product List */}
                        <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-200/40 overflow-hidden">
                            <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50">
                                <h2 className="font-bold text-zinc-950 text-lg heading-font">Items in This Order</h2>
                            </div>
                            <ul className="divide-y divide-zinc-100">
                                {foundOrder.items.map((item) => (
                                    <li key={item.id} className="flex items-center gap-4 px-6 py-5 hover:bg-zinc-50/50 transition-colors">
                                        <div className="w-20 h-20 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                loading="lazy"
                                                decoding="async"
                                                className="w-full h-full object-contain p-2 hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-zinc-950 text-base truncate">{item.name}</p>
                                            <p className="text-sm font-semibold text-zinc-500 mt-1 uppercase tracking-wider">{item.category} · Qty {item.quantity}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="font-black text-zinc-950 text-lg">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                                            {item.quantity > 1 && (
                                                <p className="text-xs font-semibold text-zinc-400 line-through">₹{item.price.toLocaleString('en-IN')} each</p>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <div className="px-6 py-5 border-t border-zinc-100 bg-zinc-50 space-y-2">
                                <OrderFinancials order={foundOrder} />
                            </div>
                        </div>

                        {/* Compatibility Snapshot */}
                        <div>
                            <h2 className="font-bold text-zinc-950 text-lg heading-font mb-4">Build Compatibility Snapshot</h2>
                            <CompatBadge items={foundOrder.items as any} />
                        </div>

                        {/* Desktop Actions */}
                        <div className="hidden sm:flex gap-4">
                            <button
                                onClick={handleReorder}
                                className="flex-1 flex items-center justify-center gap-2 h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-sm transition-all shadow-xl shadow-indigo-600/20 hover:-translate-y-0.5 active:translate-y-0 uppercase tracking-widest"
                            >
                                <RefreshCw size={18} /> Reorder This Build
                            </button>
                            <a
                                href={`https://wa.me/919999999999?text=Hi%2C%20I%20need%20support%20for%20my%20order%20%23${encodeURIComponent(foundOrder.id)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-sm transition-all shadow-xl shadow-emerald-600/20 hover:-translate-y-0.5 active:translate-y-0 uppercase tracking-widest"
                            >
                                <MessageCircle size={18} /> WhatsApp Support
                            </a>
                            <button
                                onClick={handleDownloadInvoice}
                                disabled={isDownloading}
                                className="px-6 h-14 flex items-center justify-center min-w-[140px] gap-2 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-bold rounded-2xl text-sm transition-all shadow-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="sm:hidden fixed bottom-14 left-0 right-0 z-40 bg-white/80 backdrop-blur-lg border-t border-zinc-200 px-4 py-3 flex gap-2">
                    <button
                        onClick={handleReorder}
                        className="flex-1 flex items-center justify-center gap-1.5 h-12 bg-indigo-600 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-600/20"
                    >
                        <ShoppingCart size={16} /> Reorder
                    </button>
                    <a
                        href={`https://wa.me/919999999999?text=Order%20%23${encodeURIComponent(foundOrder.id)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 h-12 bg-emerald-600 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-600/20"
                    >
                        <MessageCircle size={16} /> WhatsApp
                    </a>
                    <button
                        onClick={handleDownloadInvoice}
                        disabled={isDownloading}
                        className="h-12 w-12 flex-shrink-0 border border-zinc-200 bg-white rounded-xl flex items-center justify-center text-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isDownloading ? (
                            <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
                        ) : (
                            <FileDown size={18} />
                        )}
                    </button>
                </div>
            )}
        </PageLayout>
    );
}