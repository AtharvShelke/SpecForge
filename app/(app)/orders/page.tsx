'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Package,
    Truck,
    CheckCircle2,
    Clock,
    XCircle,
    Download,
    ArrowRight,
    MapPin,
    CreditCard,
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import Link from 'next/link';

const Orders: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);

    const refreshOrders = useCallback(async () => {
        try {
            const res = await fetch('/api/orders');
            const data = await res.json();
            if (data.orders) setOrders(data.orders);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        }
    }, []);

    React.useEffect(() => {
        refreshOrders();
    }, [refreshOrders]);

    const myOrders = orders.filter(
        (o) => o.customerName === 'Rahul Sharma'
    );

    const statusMeta: Record<OrderStatus, { icon: any; color: string }> = {
        [OrderStatus.PENDING]: { icon: Clock, color: 'text-yellow-600' },
        [OrderStatus.PAID]: { icon: CheckCircle2, color: 'text-blue-600' },
        [OrderStatus.PROCESSING]: { icon: Package, color: 'text-purple-600' },
        [OrderStatus.SHIPPED]: { icon: Truck, color: 'text-indigo-600' },
        [OrderStatus.DELIVERED]: { icon: CheckCircle2, color: 'text-green-600' },
        [OrderStatus.CANCELLED]: { icon: XCircle, color: 'text-red-600' },
        [OrderStatus.RETURNED]: { icon: XCircle, color: 'text-orange-600' },
    };

    const getExpectedDelivery = (order: Order) => {
        const delivered = order.logs.find((l) => l.status === OrderStatus.DELIVERED);
        const shipped = order.logs.find((l) => l.status === OrderStatus.SHIPPED);

        if (delivered) {
            return `Delivered on ${new Date(delivered.timestamp).toLocaleDateString()}`;
        }

        if (shipped) {
            const eta = new Date(shipped.timestamp);
            eta.setDate(eta.getDate() + 3);
            return `Expected by ${eta.toLocaleDateString()}`;
        }

        return null;
    };

    return (
        <div className="min-h-screen bg-gray-50 py-10">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
                    <Package className="text-blue-600" /> My Orders
                </h1>

                {myOrders.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border">
                        <p className="text-gray-500 mb-6">You haven’t placed any orders yet.</p>
                        <Link
                            href="/"
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg"
                        >
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {myOrders.map(order => {
                            const StatusIcon = statusMeta[order.status].icon;
                            const deliveryText = getExpectedDelivery(order);

                            return (
                                <div
                                    key={order.id}
                                    className="bg-white rounded-xl border shadow-sm overflow-hidden"
                                >
                                    {/* Header */}
                                    <div className="bg-gray-50 px-6 py-4 border-b flex flex-wrap justify-between gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500">Order Placed</p>
                                            <p className="font-medium">
                                                {new Date(order.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Total</p>
                                            <p className="font-medium">₹{order.total.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Order ID</p>
                                            <p className="font-mono text-sm">{order.id}</p>
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="px-6 py-4 flex items-center gap-3">
                                        <StatusIcon
                                            className={`h-6 w-6 ${statusMeta[order.status].color}`}
                                        />
                                        <div>
                                            <p className="font-semibold">{order.status}</p>
                                            {deliveryText && (
                                                <p className="text-sm text-gray-500">{deliveryText}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Items */}
                                    <div className="px-6 space-y-4">
                                        {order.items.map((item: any) => (
                                            <div key={item.id} className="flex gap-4">
                                                <img
                                                    src={item.image}
                                                    className="h-20 w-20 rounded border object-contain"
                                                    alt={item.name}
                                                />
                                                <div className="flex-1">
                                                    <p className="font-medium">{item.name}</p>
                                                    <p className="text-sm text-gray-500">
                                                        Qty: {item.quantity}
                                                    </p>
                                                    {(item.assignedUnits?.length ?? 0) > 0 && (
                                                        <div className="mt-1 space-y-0.5">
                                                            {item.assignedUnits.map((unit: any) => (
                                                                <p key={unit.id} className="text-xs text-gray-500 font-mono">
                                                                    {unit.partNumber || 'No part'} · {unit.serialNumber || 'No serial'}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="font-medium">
                                                    ₹{(item.price * item.quantity).toLocaleString()}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Footer */}
                                    <div className="bg-gray-50 px-6 py-4 border-t flex flex-wrap justify-between gap-4">
                                        <div className="text-sm text-gray-600 flex items-center gap-2">
                                            <MapPin size={16} />
                                            {order.shippingCity}, {order.shippingState}
                                        </div>
                                        <div className="text-sm text-gray-600 flex items-center gap-2">
                                            <CreditCard size={16} />
                                            {order.paymentMethod}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;
