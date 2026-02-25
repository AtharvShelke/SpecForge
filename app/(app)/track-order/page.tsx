'use client';

import React, { useState } from 'react';
import { useShop } from '@/context/ShopContext';
import { validateBuild } from '@/services/compatibility';
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
    LucideIcon,
} from 'lucide-react';
import { Order, OrderStatus, CompatibilityLevel, CartItem } from '@/types';

// ---------- Timeline helpers ----------

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

const CANCEL_STATUSES = [OrderStatus.CANCELLED, OrderStatus.RETURNED];

const statusIndex = (s: OrderStatus) => STATUS_ORDER.indexOf(s);

// ---------- Compat badge ----------

const CompatBadge: React.FC<{ items: CartItem[] }> = ({ items }) => {
    const report = validateBuild(items);
    const isCompatible = report.status === CompatibilityLevel.COMPATIBLE;
    const isFatal = report.status === CompatibilityLevel.INCOMPATIBLE;

    const cfg = isFatal
        ? { bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: AlertOctagon, label: 'Incompatible Build' }
        : !isCompatible
            ? { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', icon: AlertTriangle, label: 'Minor Issues' }
            : { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: CheckCircle, label: 'Fully Compatible' };

    const Icon = cfg.icon;

    return (
        <div className={`${cfg.bg} ${cfg.text} border rounded-xl p-4`}>
            <div className="flex items-center gap-2 font-semibold text-sm mb-2">
                <Icon size={16} />
                Compatibility Snapshot — {cfg.label}
            </div>
            {report.issues.length === 0 ? (
                <p className="text-xs opacity-80">All components were compatible at the time of purchase.</p>
            ) : (
                <ul className="space-y-1">
                    {report.issues.map((issue, i) => (
                        <li key={i} className="text-xs opacity-90">• {issue.message}</li>
                    ))}
                </ul>
            )}
        </div>
    );
};

// ---------- Main Page ----------

export default function TrackOrderPage() {
    const { orders, addToCart, clearCart, setCartOpen } = useShop();

    const [orderId, setOrderId] = useState('');
    const [contact, setContact] = useState('');
    const [searched, setSearched] = useState(false);
    const [foundOrder, setFoundOrder] = useState<Order | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const trimId = orderId.trim().toUpperCase();
        const trimContact = contact.trim().toLowerCase();

        const match = orders.find(
            (o) =>
                o.id.toUpperCase() === trimId &&
                (o.email.toLowerCase() === trimContact ||
                    (o as any).phone?.toLowerCase() === trimContact)
        );

        setFoundOrder(match ?? null);
        setSearched(true);
    };

    const handleReorder = () => {
        if (!foundOrder) return;
        clearCart();
        foundOrder.items.forEach((item) => addToCart(item));
        setCartOpen(true);
    };

    const currentStepIdx = foundOrder ? statusIndex(foundOrder.status) : -1;
    const isCancelled = foundOrder ? CANCEL_STATUSES.includes(foundOrder.status) : false;

    return (
        <div className="min-h-screen bg-zinc-50">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; }
        h1,h2,h3,h4 { font-family: 'Space Grotesk', 'Inter', sans-serif; letter-spacing: -0.025em; }
        .timeline-connector { flex: 1; height: 2px; background: linear-gradient(to right, var(--from), var(--to)); }
      `}</style>

            {/* Hero */}
            <div className="bg-white border-b border-zinc-200">
                <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16 text-center">
                    <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                        <Package size={13} /> Order Tracking
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-3">
                        Track Your Order
                    </h1>
                    <p className="text-zinc-500 text-base">
                        Enter your Order ID and the email address you used during checkout.
                    </p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
                {/* Lookup Form */}
                <form
                    onSubmit={handleSearch}
                    className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 sm:p-8 space-y-4"
                >
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                                Order ID
                            </label>
                            <input
                                required
                                value={orderId}
                                onChange={(e) => { setOrderId(e.target.value); setSearched(false); }}
                                placeholder="e.g. ORD-1234567890"
                                className="w-full h-11 px-4 border border-zinc-200 rounded-xl text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                                Email Address
                            </label>
                            <input
                                required
                                value={contact}
                                onChange={(e) => { setContact(e.target.value); setSearched(false); }}
                                placeholder="email@example.com"
                                className="w-full h-11 px-4 border border-zinc-200 rounded-xl text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full h-11 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 
              text-white font-semibold rounded-xl text-sm transition-all"
                    >
                        <Search size={16} /> Track Order
                    </button>
                </form>

                {/* Not Found */}
                {searched && !foundOrder && (
                    <div className="bg-white rounded-2xl border border-zinc-200 p-10 text-center">
                        <XCircle className="mx-auto mb-3 text-zinc-300" size={40} />
                        <h3 className="text-lg font-semibold text-zinc-800 mb-1">Order Not Found</h3>
                        <p className="text-sm text-zinc-500">
                            Please double-check your Order ID and the email used at checkout.
                        </p>
                    </div>
                )}

                {/* Order Found */}
                {foundOrder && (
                    <div className="space-y-6">
                        {/* Order Header */}
                        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                            <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-100 flex flex-wrap gap-4 justify-between items-start">
                                <div>
                                    <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide mb-0.5">Order ID</p>
                                    <p className="font-mono font-bold text-zinc-900 text-sm">{foundOrder.id}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide mb-0.5">Date</p>
                                    <p className="text-sm font-semibold text-zinc-800">
                                        {new Date(foundOrder.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide mb-0.5">Total</p>
                                    <p className="text-sm font-bold text-zinc-900">₹{foundOrder.total.toLocaleString('en-IN')}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide mb-0.5">Payment</p>
                                    <p className="text-sm font-semibold text-zinc-800">{foundOrder.payment.method}</p>
                                </div>
                            </div>

                            {/* Timeline */}
                            {isCancelled ? (
                                <div className="px-6 py-5 flex items-center gap-3 text-red-600">
                                    <XCircle size={22} />
                                    <div>
                                        <p className="font-semibold">Order {foundOrder.status}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">
                                            {foundOrder.logs.at(-1)?.note}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="px-6 py-7">
                                    {/* Desktop timeline */}
                                    <div className="hidden sm:flex items-start gap-0">
                                        {TIMELINE_STEPS.map((step, idx) => {
                                            const isCompleted = idx <= currentStepIdx;
                                            const isActive = idx === currentStepIdx;
                                            const logEntry = foundOrder.logs.find((l) => l.status === step.status);
                                            const Icon = step.icon;

                                            return (
                                                <React.Fragment key={step.status}>
                                                    <div className="flex flex-col items-center gap-1.5 min-w-0 flex-shrink-0 w-16 sm:w-20">
                                                        <div
                                                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all
                                ${isCompleted
                                                                    ? isActive
                                                                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                                                                        : 'bg-blue-600 text-white'
                                                                    : 'bg-zinc-100 text-zinc-400'}`}
                                                        >
                                                            <Icon size={16} />
                                                        </div>
                                                        <p className={`text-[10px] font-semibold text-center leading-tight ${isCompleted ? 'text-zinc-800' : 'text-zinc-400'}`}>
                                                            {step.label}
                                                        </p>
                                                        {logEntry && (
                                                            <p className="text-[9px] text-zinc-400 text-center">
                                                                {new Date(logEntry.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {idx < TIMELINE_STEPS.length - 1 && (
                                                        <div
                                                            className={`flex-1 h-0.5 mt-[18px] mx-1 rounded-full transition-all
                                ${idx < currentStepIdx ? 'bg-blue-500' : 'bg-zinc-200'}`}
                                                        />
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>

                                    {/* Mobile timeline (vertical) */}
                                    <div className="sm:hidden space-y-0">
                                        {TIMELINE_STEPS.map((step, idx) => {
                                            const isCompleted = idx <= currentStepIdx;
                                            const isActive = idx === currentStepIdx;
                                            const logEntry = foundOrder.logs.find((l) => l.status === step.status);
                                            const Icon = step.icon;
                                            return (
                                                <div key={step.status} className="flex gap-4">
                                                    <div className="flex flex-col items-center">
                                                        <div
                                                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                                ${isCompleted
                                                                    ? isActive ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-blue-600 text-white'
                                                                    : 'bg-zinc-100 text-zinc-400'}`}
                                                        >
                                                            <Icon size={14} />
                                                        </div>
                                                        {idx < TIMELINE_STEPS.length - 1 && (
                                                            <div className={`w-0.5 flex-1 min-h-[24px] my-1 rounded-full ${idx < currentStepIdx ? 'bg-blue-500' : 'bg-zinc-200'}`} />
                                                        )}
                                                    </div>
                                                    <div className="pb-5">
                                                        <p className={`text-sm font-semibold leading-tight ${isCompleted ? 'text-zinc-900' : 'text-zinc-400'}`}>
                                                            {step.label}
                                                        </p>
                                                        {logEntry && (
                                                            <p className="text-xs text-zinc-400 mt-0.5">
                                                                {new Date(logEntry.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Shipping address */}
                            <div className="px-6 py-4 border-t border-zinc-100 flex items-center gap-2 text-sm text-zinc-500">
                                <MapPin size={15} className="text-zinc-400 flex-shrink-0" />
                                {foundOrder.shippingAddress.street}, {foundOrder.shippingAddress.city}, {foundOrder.shippingAddress.state} – {foundOrder.shippingAddress.zip}
                            </div>
                        </div>

                        {/* Product List */}
                        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-zinc-100">
                                <h2 className="font-bold text-zinc-900">Items in This Order</h2>
                            </div>
                            <ul className="divide-y divide-zinc-100">
                                {foundOrder.items.map((item) => (
                                    <li key={item.id} className="flex items-center gap-4 px-6 py-4">
                                        <div className="w-16 h-16 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-contain p-1.5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-zinc-900 text-sm truncate">{item.name}</p>
                                            <p className="text-xs text-zinc-400 mt-0.5">{item.category} · Qty {item.quantity}</p>
                                            {Object.entries(item.specs).slice(0, 2).map(([k, v]) =>
                                                v ? (
                                                    <span key={k} className="inline-block text-[10px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full mr-1 mt-1">
                                                        {k}: {v}
                                                    </span>
                                                ) : null
                                            )}
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="font-bold text-zinc-900 text-sm">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                                            <p className="text-xs text-zinc-400">₹{item.price.toLocaleString('en-IN')} each</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <div className="px-6 py-4 border-t border-zinc-100 flex justify-between items-center bg-zinc-50">
                                <span className="text-sm text-zinc-500 font-medium">Order Total</span>
                                <span className="text-lg font-bold text-zinc-900">₹{foundOrder.total.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        {/* Compatibility Snapshot */}
                        <div>
                            <h2 className="font-bold text-zinc-800 text-sm uppercase tracking-wider mb-3">Build Compatibility Snapshot</h2>
                            <CompatBadge items={foundOrder.items} />
                        </div>

                        {/* Desktop Actions */}
                        <div className="hidden sm:flex gap-3">
                            <button
                                onClick={handleReorder}
                                className="flex-1 flex items-center justify-center gap-2 h-12 bg-blue-600 hover:bg-blue-700 
                  text-white font-semibold rounded-xl text-sm transition-all"
                            >
                                <RefreshCw size={16} /> Reorder This Build
                            </button>
                            <a
                                href={`https://wa.me/919999999999?text=Hi%2C%20I%20need%20support%20for%20my%20order%20%23${encodeURIComponent(foundOrder.id)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 h-12 bg-emerald-600 hover:bg-emerald-700
                  text-white font-semibold rounded-xl text-sm transition-all"
                            >
                                <MessageCircle size={16} /> WhatsApp Support
                            </a>
                            <button
                                onClick={() => window.print()}
                                className="px-5 h-12 flex items-center gap-2 border border-zinc-200 bg-white 
                  text-zinc-700 font-semibold rounded-xl text-sm hover:bg-zinc-50 transition-all"
                            >
                                <FileDown size={16} /> Invoice
                            </button>
                        </div>
                    </div>
                )}

                {/* Demo hint */}
                {!searched && (
                    <p className="text-center text-xs text-zinc-400">
                        Demo: use any Order ID from the admin panel with its associated email.
                    </p>
                )}
            </div>

            {/* Mobile Sticky Footer */}
            {foundOrder && (
                <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-zinc-200 px-4 py-3 flex gap-2 mb-14">
                    <button
                        onClick={handleReorder}
                        className="flex-1 flex items-center justify-center gap-1.5 h-11 bg-blue-600 
              text-white font-semibold rounded-xl text-sm"
                    >
                        <ShoppingCart size={15} /> Reorder
                    </button>
                    <a
                        href={`https://wa.me/919999999999?text=Order%20%23${encodeURIComponent(foundOrder.id)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 h-11 bg-emerald-600 
              text-white font-semibold rounded-xl text-sm"
                    >
                        <MessageCircle size={15} /> WhatsApp
                    </a>
                    <button
                        onClick={() => window.print()}
                        className="h-11 px-4 border border-zinc-200 rounded-xl flex items-center gap-1.5 text-sm font-medium text-zinc-600"
                    >
                        <FileDown size={15} />
                    </button>
                </div>
            )}
        </div>
    );
}
