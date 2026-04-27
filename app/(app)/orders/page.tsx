'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useOrder } from '@/context/OrderContext';
import {
    Package,
    Truck,
    CheckCircle,
    Clock,
    XCircle,
    MapPin,
    CreditCard,
    type LucideIcon,
    ArrowRight,
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageTitle } from '@/components/layout/PageTitle';

const STATUS_META: Record<OrderStatus, { icon: LucideIcon; tone: string; chip: string }> = {
    [OrderStatus.PENDING]: { icon: Clock, tone: 'text-amber-700', chip: 'bg-amber-50 border-amber-200 text-amber-700' },
    [OrderStatus.PAID]: { icon: CheckCircle, tone: 'text-sky-700', chip: 'bg-sky-50 border-sky-200 text-sky-700' },
    [OrderStatus.PROCESSING]: { icon: Package, tone: 'text-violet-700', chip: 'bg-violet-50 border-violet-200 text-violet-700' },
    [OrderStatus.SHIPPED]: { icon: Truck, tone: 'text-indigo-700', chip: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
    [OrderStatus.DELIVERED]: { icon: CheckCircle, tone: 'text-emerald-700', chip: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    [OrderStatus.CANCELLED]: { icon: XCircle, tone: 'text-rose-700', chip: 'bg-rose-50 border-rose-200 text-rose-700' },
    [OrderStatus.RETURNED]: { icon: XCircle, tone: 'text-orange-700', chip: 'bg-orange-50 border-orange-200 text-orange-700' },
};

const getExpectedDelivery = (order: Order) => {
    const logs = order.logs ?? [];
    const delivered = logs.find((log) => log.status === OrderStatus.DELIVERED);
    const shipped = logs.find((log) => log.status === OrderStatus.SHIPPED);

    if (delivered) {
        return `Delivered on ${new Date(delivered.timestamp).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })}`;
    }

    if (shipped) {
        const eta = new Date(shipped.timestamp);
        eta.setDate(eta.getDate() + 3);
        return `Expected by ${eta.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })}`;
    }

    return 'Status updates will appear as the order progresses.';
};

const Orders: React.FC = () => {
    const { orders, refreshOrders } = useOrder();

    React.useEffect(() => {
        refreshOrders();
    }, [refreshOrders]);

    const myOrders = orders.filter((order) => order.customerName === 'Rahul Sharma');

    return (
        <PageLayout bgClass="bg-transparent">
            <PageLayout.Header className="mx-3 mt-3 rounded-[2rem] sm:mx-5 sm:mt-4">
                <PageTitle
                    title="Orders"
                    subtitle="A calmer timeline for everything you have purchased, with clearer status, item summaries, and next steps."
                    badge={
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/84 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                            <Package size={14} />
                            Purchase history
                        </div>
                    }
                    actions={
                        <Link
                            href="/products"
                            className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white/84 px-5 text-sm font-semibold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950"
                        >
                            Continue shopping
                            <ArrowRight size={15} />
                        </Link>
                    }
                />
            </PageLayout.Header>

            <PageLayout.Content className="mx-auto w-full max-w-6xl" padding="lg">
                {myOrders.length === 0 ? (
                    <div className="app-card rounded-[2rem] p-10 text-center sm:p-14">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                            <Package size={26} />
                        </div>
                        <h2 className="mt-6 text-3xl text-slate-950">No orders yet</h2>
                        <p className="mx-auto mt-3 max-w-md text-base leading-8 text-slate-500">
                            Your order history will appear here once you complete a purchase.
                        </p>
                        <Link
                            href="/products"
                            className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-slate-950 px-6 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800"
                        >
                            Browse products
                            <ArrowRight size={15} />
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {myOrders.map((order) => {
                            const status = STATUS_META[order.status];
                            const StatusIcon = status.icon;

                            return (
                                <Link
                                    key={order.id}
                                    href={`/orders/${order.id}`}
                                    className="group block"
                                >
                                    <article className="app-card overflow-hidden rounded-[2rem] p-5 sm:p-6">
                                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="space-y-4">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${status.chip}`}>
                                                        <StatusIcon size={14} className={status.tone} />
                                                        {order.status}
                                                    </span>
                                                    <span className="rounded-full border border-slate-200 bg-white/84 px-3 py-1.5 text-xs font-semibold text-slate-500">
                                                        {new Date(order.date).toLocaleDateString('en-IN', {
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric',
                                                        })}
                                                    </span>
                                                </div>

                                                <div>
                                                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                                                        Order ID
                                                    </p>
                                                    <p className="mt-2 font-mono text-sm font-semibold text-slate-900">
                                                        {order.id}
                                                    </p>
                                                    <p className="mt-2 text-sm leading-7 text-slate-500">
                                                        {getExpectedDelivery(order)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid gap-4 sm:grid-cols-3 lg:min-w-[420px]">
                                                <div className="rounded-[1.4rem] border border-white/90 bg-white/78 p-4">
                                                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                                        Total
                                                    </p>
                                                    <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                                                        ₹{order.total.toLocaleString('en-IN')}
                                                    </p>
                                                </div>
                                                <div className="rounded-[1.4rem] border border-white/90 bg-white/78 p-4">
                                                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                                        Shipping
                                                    </p>
                                                    <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                                                        <MapPin size={14} className="text-slate-400" />
                                                        <span>{order.shippingCity}, {order.shippingState}</span>
                                                    </div>
                                                </div>
                                                <div className="rounded-[1.4rem] border border-white/90 bg-white/78 p-4">
                                                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                                        Payment
                                                    </p>
                                                    <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                                                        <CreditCard size={14} className="text-slate-400" />
                                                        <span>{order.paymentMethod}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                            {(order.items ?? []).slice(0, 3).map((item) => (
                                                <div key={item.id} className="rounded-[1.4rem] border border-white/90 bg-white/78 p-3">
                                                    <div className="flex gap-3">
                                                        <div className="relative h-16 w-16 overflow-hidden rounded-[1rem] border border-slate-100 bg-slate-50">
                                                            <Image
                                                                src={item.image ?? '/placeholder.png'}
                                                                alt={item.name}
                                                                fill
                                                                sizes="64px"
                                                                className="object-contain p-2"
                                                            />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                                                                {item.name}
                                                            </p>
                                                            <p className="mt-1 text-xs font-medium text-slate-500">
                                                                Qty {item.quantity}
                                                            </p>
                                                            <p className="mt-2 text-sm font-semibold text-slate-900">
                                                                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm">
                                            <span className="text-slate-500">
                                                {order.items?.length ?? 0} item{(order.items?.length ?? 0) === 1 ? '' : 's'} in this order
                                            </span>
                                            <span className="font-semibold text-slate-950 transition-transform duration-300 group-hover:translate-x-1">
                                                View order details
                                            </span>
                                        </div>
                                    </article>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </PageLayout.Content>
        </PageLayout>
    );
};

export default Orders;
