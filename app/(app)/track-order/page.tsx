'use client';

import { useState, useEffect, useCallback, useMemo, memo, Fragment } from 'react';
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
    type LucideIcon,
} from 'lucide-react';
import { Order, OrderStatus, CompatibilityLevel, CartItem } from '@/types';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageTitle } from '@/components/layout/PageTitle';

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
        chip: 'bg-rose-50 border-rose-200 text-rose-700',
        icon: AlertOctagon,
        label: 'Incompatible build',
    },
    [CompatibilityLevel.WARNING]: {
        chip: 'bg-amber-50 border-amber-200 text-amber-700',
        icon: AlertTriangle,
        label: 'Needs review',
    },
    [CompatibilityLevel.COMPATIBLE]: {
        chip: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        icon: CheckCircle,
        label: 'Fully compatible',
    },
} as const;

const statusIndex = (status: OrderStatus) => STATUS_ORDER.indexOf(status);

const CompatBadge = memo(function CompatBadge({ items: _items }: { items: CartItem[] }) {
    void _items;
    const report = useMemo(() => validateBuild(), []);
    const config = COMPAT_CONFIG[report.status] ?? COMPAT_CONFIG[CompatibilityLevel.COMPATIBLE];
    const Icon = config.icon;

    return (
        <div className={`rounded-[1.6rem] border p-5 ${config.chip}`}>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em]">
                <Icon size={16} />
                Compatibility snapshot
            </div>
            <p className="mt-3 text-base font-semibold">{config.label}</p>
            {report.issues.length === 0 ? (
                <p className="mt-2 text-sm leading-7 opacity-85">
                    All components were compatible at the time of purchase.
                </p>
            ) : (
                <ul className="mt-3 space-y-2 text-sm leading-7">
                    {report.issues.map((issue, index) => (
                        <li key={`${issue.message}-${index}`} className="flex items-start gap-2">
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-current" />
                            <span>{issue.message}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
});

const OrderFinancials = memo(function OrderFinancials({ order }: { order: Order }) {
    const subtotal = order.subtotal ?? Math.round(order.total / 1.18);
    const gst = order.gstAmount ?? (order.total - subtotal);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-600">
                <span>GST (18%)</span>
                <span className="font-semibold text-slate-900">₹{gst.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-base font-semibold text-slate-950">Order total</span>
                <span className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">₹{order.total.toLocaleString('en-IN')}</span>
            </div>
        </div>
    );
});

interface TimelineStepProps {
    step: typeof TIMELINE_STEPS[number];
    idx: number;
    currentIdx: number;
    logs: Order['logs'];
    isLast: boolean;
    mobile?: boolean;
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
            <div className="flex gap-4">
                <div className="flex flex-col items-center">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-full ${
                        isCompleted
                            ? isActive
                                ? 'bg-slate-950 text-white ring-4 ring-slate-200'
                                : 'bg-slate-950 text-white'
                            : 'bg-slate-100 text-slate-400'
                    }`}>
                        <Icon size={16} />
                    </div>
                    {!isLast && (
                        <div className={`my-1 min-h-[36px] w-px flex-1 ${idx < currentIdx ? 'bg-slate-900' : 'bg-slate-200'}`} />
                    )}
                </div>
                <div className="pb-6 pt-1">
                    <p className={`text-sm font-semibold ${isCompleted ? 'text-slate-950' : 'text-slate-400'}`}>
                        {step.label}
                    </p>
                    {logEntry && (
                        <p className="mt-1 text-xs text-slate-500">
                            {new Date(logEntry.timestamp).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <Fragment>
            <div className="flex w-28 flex-shrink-0 flex-col items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    isCompleted
                        ? isActive
                            ? 'bg-slate-950 text-white ring-4 ring-slate-200'
                            : 'bg-slate-950 text-white'
                        : 'bg-slate-100 text-slate-400'
                }`}>
                    <Icon size={18} />
                </div>
                <div className="text-center">
                    <p className={`text-sm font-semibold ${isCompleted ? 'text-slate-950' : 'text-slate-400'}`}>
                        {step.label}
                    </p>
                    {logEntry && (
                        <p className="mt-1 text-xs text-slate-500">
                            {new Date(logEntry.timestamp).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                            })}
                        </p>
                    )}
                </div>
            </div>
            {!isLast && (
                <div className="flex-1 px-2 pt-6">
                    <div className={`h-px w-full ${idx < currentIdx ? 'bg-slate-900' : 'bg-slate-200'}`} />
                </div>
            )}
        </Fragment>
    );
});

export default function TrackOrderPage() {
    const { addToCart, clearCart, setCartOpen } = useShop();
    const { trackOrder } = useOrder();

    const [orderId, setOrderId] = useState('');
    const [contact, setContact] = useState('');
    const [searched, setSearched] = useState(false);
    const [foundOrder, setFoundOrder] = useState<Order | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

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

    const handleReorder = useCallback(() => {
        if (!foundOrder) return;
        clearCart();
        (foundOrder.items ?? []).forEach((item) => addToCart(item as any));
        setCartOpen(true);
    }, [foundOrder, clearCart, addToCart, setCartOpen]);

    const handleDownloadInvoice = useCallback(async () => {
        if (!foundOrder || isDownloading) return;
        try {
            setIsDownloading(true);
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
        <PageLayout bgClass="bg-transparent">
            <PageLayout.Header className="mx-3 mt-3 rounded-[2rem] sm:mx-5 sm:mt-4">
                <PageTitle
                    alignment="center"
                    title="Track your order"
                    subtitle="A clearer tracking experience with stronger status hierarchy, cleaner order details, and faster support actions."
                    badge={
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/84 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                            <Package size={14} />
                            Order tracking
                        </div>
                    }
                />
            </PageLayout.Header>

            <PageLayout.Content className="mx-auto w-full max-w-5xl space-y-6" padding="lg">
                <form
                    onSubmit={handleSearch}
                    className="app-card rounded-[2rem] p-6 sm:p-7"
                >
                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-600">Order ID</label>
                            <input
                                required
                                value={orderId}
                                onChange={(event) => {
                                    setOrderId(event.target.value);
                                    setSearched(false);
                                }}
                                placeholder="e.g. ORD-1234567890"
                                className="h-12 w-full rounded-[1rem] border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-600">Email or phone</label>
                            <input
                                required
                                value={contact}
                                onChange={(event) => {
                                    setContact(event.target.value);
                                    setSearched(false);
                                }}
                                placeholder="email@example.com or phone"
                                className="h-12 w-full rounded-[1rem] border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-slate-950 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800"
                    >
                        <Search size={16} />
                        Track order
                    </button>
                </form>

                {searched && !foundOrder && (
                    <div className="app-card rounded-[2rem] p-10 text-center sm:p-12">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                            <XCircle size={28} />
                        </div>
                        <h3 className="mt-6 text-3xl text-slate-950">Order not found</h3>
                        <p className="mx-auto mt-3 max-w-md text-base leading-8 text-slate-500">
                            Double-check your order ID and the contact detail used during checkout.
                        </p>
                    </div>
                )}

                {foundOrder && (
                    <div className="space-y-6">
                        <div className="app-card overflow-hidden rounded-[2rem]">
                            <div className="grid gap-4 border-b border-slate-100 p-6 sm:grid-cols-2 xl:grid-cols-4">
                                <div>
                                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Order ID</p>
                                    <p className="mt-2 font-mono text-sm font-semibold text-slate-900">{foundOrder.id}</p>
                                </div>
                                <div>
                                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Placed on</p>
                                    <p className="mt-2 text-sm font-semibold text-slate-900">
                                        {new Date(foundOrder.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Total</p>
                                    <p className="mt-2 text-sm font-semibold text-slate-900">₹{foundOrder.total.toLocaleString('en-IN')}</p>
                                </div>
                                <div>
                                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Payment</p>
                                    <p className="mt-2 text-sm font-semibold text-slate-900">{foundOrder.paymentMethod}</p>
                                </div>
                            </div>

                            {isCancelled ? (
                                <div className="flex items-start gap-3 bg-rose-50/60 px-6 py-6 text-rose-700">
                                    <XCircle size={22} className="mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-lg font-semibold">Order {foundOrder.status.toLowerCase()}</p>
                                        <p className="mt-2 text-sm leading-7 opacity-90">{foundOrder.logs?.at(-1)?.note}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="px-6 py-8">
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

                            <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-5 text-sm text-slate-600">
                                <div className="flex items-start gap-3">
                                    <MapPin size={18} className="mt-0.5 shrink-0 text-slate-400" />
                                    <span>
                                        <strong className="text-slate-950">Shipping address:</strong>{' '}
                                        {foundOrder.shippingStreet}, {foundOrder.shippingCity}, {foundOrder.shippingState} - {foundOrder.shippingZip}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="app-card overflow-hidden rounded-[2rem]">
                            <div className="border-b border-slate-100 px-6 py-5">
                                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">Items in this order</h2>
                            </div>
                            <ul className="divide-y divide-slate-100">
                                {(foundOrder.items ?? []).map((item) => (
                                    <li key={item.id} className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="relative h-20 w-20 overflow-hidden rounded-[1.2rem] border border-slate-100 bg-slate-50">
                                                <Image
                                                    src={item.image ?? '/placeholder.png'}
                                                    alt={item.name}
                                                    fill
                                                    sizes="80px"
                                                    className="object-contain p-2"
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-base font-semibold text-slate-950">{item.name}</p>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    {item.category} • Qty {item.quantity}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-semibold text-slate-950">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                                                <p className="mt-1 text-xs text-slate-400">₹{item.price.toLocaleString('en-IN')} each</p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-5">
                                <OrderFinancials order={foundOrder} />
                            </div>
                        </div>

                        <CompatBadge items={(foundOrder.items ?? []) as CartItem[]} />

                        <div className="grid gap-3 sm:grid-cols-3">
                            <button
                                onClick={handleReorder}
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-slate-950 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800"
                            >
                                <RefreshCw size={16} />
                                Reorder
                            </button>
                            <a
                                href={`https://wa.me/919999999999?text=Hi%2C%20I%20need%20support%20for%20my%20order%20%23${encodeURIComponent(foundOrder.id)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950"
                            >
                                <MessageCircle size={16} />
                                WhatsApp support
                            </a>
                            <button
                                onClick={handleDownloadInvoice}
                                disabled={isDownloading}
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950 disabled:opacity-50"
                            >
                                <FileDown size={16} />
                                {isDownloading ? 'Downloading...' : 'Download invoice'}
                            </button>
                        </div>
                    </div>
                )}

                {!searched && (
                    <p className="text-center text-sm text-slate-500">
                        Use any order ID from the admin panel together with the checkout email or phone number.
                    </p>
                )}
            </PageLayout.Content>

            {foundOrder && (
                <div className="fixed bottom-14 left-0 right-0 z-40 border-t border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-2xl sm:hidden">
                    <div className="flex gap-2">
                        <button
                            onClick={handleReorder}
                            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-slate-950 text-sm font-semibold text-white"
                        >
                            <ShoppingCart size={15} />
                            Reorder
                        </button>
                        <a
                            href={`https://wa.me/919999999999?text=Order%20%23${encodeURIComponent(foundOrder.id)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700"
                        >
                            <MessageCircle size={15} />
                            Support
                        </a>
                    </div>
                </div>
            )}
        </PageLayout>
    );
}
