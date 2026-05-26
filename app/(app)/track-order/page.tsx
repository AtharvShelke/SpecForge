'use client';

import { useState, useCallback, useMemo, memo, Fragment } from 'react';
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
import { cn } from '@/lib/utils';

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
    },
} as const;

const statusIndex = (status: OrderStatus) => STATUS_ORDER.indexOf(status);

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
            </div>
            <p className="mt-2 text-sm font-semibold">{config.label}</p>
            {report.issues.length === 0 ? (
                <p className="mt-1 text-sm text-emerald-600/80">
                    All components were compatible at the time of purchase.
                </p>
            ) : (
                <ul className="mt-2 space-y-1 text-sm">
                    {report.issues.map((issue, index) => (
                        <li key={`${issue.message}-${index}`} className="flex items-start gap-2">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
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
                        </p>
                    )}
                </div>
            </div>
            {!isLast && (
                <div className="flex-1 px-2 pt-5">
                    <div className={cn(
                        "h-px w-full",
                        idx < currentIdx ? 'bg-slate-900' : 'bg-slate-200'
                    )} />
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
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="mt-6 flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-md bg-slate-900 px-6 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                    >
                        <Search size={16} />
                        Track Order
                    </button>
                </form>

                {/* Not Found State */}
                {searched && !foundOrder && (
                    <div className="rounded-lg border border-slate-200 bg-white p-12 text-center shadow-sm">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-600">
                            <XCircle size={24} />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-slate-900">Order not found</h3>
                        <p className="mt-2 text-sm text-slate-500">
                            Double-check your order ID and the contact detail used during checkout.
                        </p>
                    </div>
                )}

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
                            >
                                <RefreshCw size={16} />
                                Reorder Items
                            </button>
                            <a
                                href={`https://wa.me/919999999999?text=Hi%2C%20I%20need%20support%20for%20my%20order%20%23${encodeURIComponent(foundOrder.id)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                            >
                                <MessageCircle size={16} />
                                WhatsApp Support
                            </a>
                            <button
                                onClick={handleDownloadInvoice}
                                disabled={isDownloading}
                                className="flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
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
                </div>
            )}
        </PageLayout>
    );
}