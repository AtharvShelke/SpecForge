'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Order, OrderStatus } from '@/types';
import { STATUS_CONFIG } from '@/data/constants';
import { cn } from '@/lib/utils';
import OrderLogs from '@/components/orders/OrderLogs';
import OrderShipments from '@/components/orders/OrderShipments';
import OrderPayments from '@/components/orders/OrderPayments';
import {
  ArrowLeft,
  Clock,
  CreditCard,
  MapPin,
  Package,
  Truck,
  User,
  Mail,
  Hash,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';

/* ─────────────────────────────────────────────────────────────
   STATUS PILL (same pattern as OrderManager)
───────────────────────────────────────────────────────────────*/
const STATUS_PILL_MAP: Record<string, { label: string; cls: string }> = {
  [OrderStatus.PENDING]:    { label: 'Pending',    cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  [OrderStatus.PAID]:       { label: 'Paid',       cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  [OrderStatus.PROCESSING]: { label: 'Processing', cls: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' },
  [OrderStatus.SHIPPED]:    { label: 'Shipped',    cls: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200' },
  [OrderStatus.DELIVERED]:  { label: 'Delivered',  cls: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200' },
  [OrderStatus.CANCELLED]:  { label: 'Cancelled',  cls: 'bg-rose-50 text-rose-600 ring-1 ring-rose-200' },
  [OrderStatus.RETURNED]:   { label: 'Returned',   cls: 'bg-stone-100 text-stone-600 ring-1 ring-stone-200' },
};

const DATE_OPTS: Intl.DateTimeFormatOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
const TIME_OPTS: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
const FALLBACK_IMG = 'https://picsum.photos/300/300';
const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  (e.target as HTMLImageElement).src = FALLBACK_IMG;
};

/* ─────────────────────────────────────────────────────────────
   COLLAPSIBLE SECTION
───────────────────────────────────────────────────────────────*/
const CollapsibleSection = ({
  icon, title, badge, children, defaultOpen = true,
}: {
  icon: React.ReactNode; title: string; badge?: React.ReactNode;
  children: React.ReactNode; defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
      <button
        className="w-full px-4 py-3 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400">{icon}</span>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em]">{title}</span>
          </div>
          {badge}
        </div>
        <ChevronDown size={14} className={cn('text-stone-400 transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && <div>{children}</div>}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   ORDER DETAIL PAGE
───────────────────────────────────────────────────────────────*/
export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/orders/${orderId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Order not found' : 'Failed to load order');
        return res.json();
      })
      .then((data: Order) => {
        setOrder({
          ...data,
          logs: data.logs ?? [],
          shipments: data.shipments ?? [],
          payments: data.payments ?? [],
          invoices: data.invoices ?? [],
          reservations: data.reservations ?? [],
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [orderId]);

  const financials = useMemo(() => {
    if (!order) return null;
    const items = order.items ?? [];
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    return { subtotal, tax: order.gstAmount ?? Math.round(subtotal * 0.18), total: order.total };
  }, [order]);

  const formattedDate = useMemo(
    () => order ? new Date(order.date).toLocaleDateString('en-IN', DATE_OPTS) : '',
    [order]
  );
  const formattedTime = useMemo(
    () => order ? new Date(order.date).toLocaleTimeString('en-IN', TIME_OPTS) : '',
    [order]
  );

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="text-indigo-500 animate-spin" />
          <p className="text-sm text-stone-500">Loading order details…</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white border border-stone-200 rounded-2xl max-w-sm shadow-sm">
          <div className="w-12 h-12 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Package size={22} className="text-rose-400" />
          </div>
          <h3 className="text-sm font-semibold text-stone-800 mb-1">{error ?? 'Order not found'}</h3>
          <p className="text-xs text-stone-400 mb-4">The order you&apos;re looking for doesn&apos;t exist or couldn&apos;t be loaded.</p>
          <Link href="/orders" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
            ← Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const pillCfg = STATUS_PILL_MAP[order.status] ?? { label: order.status, cls: 'bg-stone-100 text-stone-600 ring-1 ring-stone-200' };
  const items = order.items ?? [];
  const logs = order.logs ?? [];
  const shipments = order.shipments ?? [];
  const payments = order.payments ?? [];

  return (
    <div className="min-h-screen bg-stone-50/40 py-6 sm:py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">

        {/* Back link */}
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
        >
          <ArrowLeft size={13} /> Back to Orders
        </Link>

        {/* ── ORDER HEADER CARD ── */}
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          <div className="h-0.5 w-full bg-gradient-to-r from-indigo-400 via-indigo-500 to-violet-400" />
          <div className="p-4 sm:p-6">
            {/* Top row */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <h1 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight font-mono truncate">
                    {order.id}
                  </h1>
                  <span className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap',
                    pillCfg.cls
                  )}>
                    <span className="w-1 h-1 rounded-full bg-current opacity-60" />
                    {pillCfg.label}
                  </span>
                  {/* Version indicator */}
                  <span className="text-[10px] text-stone-400 font-mono bg-stone-50 border border-stone-100 px-1.5 py-0.5 rounded">
                    Rev. {order.version}
                  </span>
                </div>
                <p className="text-[10px] text-stone-400 font-mono tabular-nums">
                  {formattedDate} · {formattedTime}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Total</p>
                <p className="text-lg font-extrabold text-stone-900 font-mono tabular-nums">
                  ₹{order.total.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Customer meta grid */}
            <div className="mt-3 pt-3 border-t border-stone-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: <User size={11} />, label: 'Customer', value: order.customerName },
                { icon: <Mail size={11} />, label: 'Email', value: order.email },
                { icon: <CreditCard size={11} />, label: 'Payment', value: order.paymentMethod ?? '—' },
                { icon: <Hash size={11} />, label: 'Items', value: `${items.length} item${items.length !== 1 ? 's' : ''}` },
              ].map(({ icon, label, value }) => (
                <div key={label}>
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-stone-400">{icon}</span>
                    <span className="text-[9px] uppercase tracking-widest font-bold text-stone-400">{label}</span>
                  </div>
                  <div className="text-xs font-semibold text-stone-800 truncate">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── ORDER ITEMS ── */}
        <CollapsibleSection
          icon={<Package size={12} />}
          title="Order Items"
          badge={
            <span className="text-[10px] font-mono font-bold text-stone-400 bg-white border border-stone-200 px-2 py-0.5 rounded-md">
              {items.length}
            </span>
          }
        >
          {items.length > 0 ? (
            <>
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
                    {items.map(item => (
                      <tr key={item.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-stone-100 border border-stone-200 flex-shrink-0 overflow-hidden">
                              <img src={item.image ?? FALLBACK_IMG} alt={item.name} className="h-full w-full object-contain" onError={handleImgError} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-stone-800 text-xs leading-tight line-clamp-1 tracking-tight">{item.name}</p>
                              {item.sku && <p className="text-[10px] text-stone-400 font-mono mt-0.5">{item.sku}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-stone-100 text-stone-700 font-bold text-xs border border-stone-200">{item.quantity}</span>
                        </td>
                        <td className="px-3 py-3 text-right text-stone-500 text-xs font-mono tabular-nums">₹{item.price.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right font-bold text-stone-900 text-xs font-mono tabular-nums">₹{(item.price * item.quantity).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="sm:hidden divide-y divide-stone-100">
                {items.map(item => (
                  <div key={item.id} className="p-3 flex gap-3">
                    <div className="h-12 w-12 rounded-lg bg-stone-100 border border-stone-200 flex-shrink-0 overflow-hidden">
                      <img src={item.image ?? FALLBACK_IMG} alt={item.name} className="h-full w-full object-contain" onError={handleImgError} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-stone-800 text-xs tracking-tight leading-tight">{item.name}</p>
                      {item.sku && <p className="text-[10px] text-stone-400 font-mono mt-0.5">{item.sku}</p>}
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-stone-400">×<strong className="text-stone-700">{item.quantity}</strong> · ₹{item.price.toLocaleString('en-IN')}</span>
                        <span className="font-bold text-stone-900 text-sm font-mono">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {financials && (
                <div className="px-4 py-3 border-t border-stone-100 bg-stone-50/50">
                  <div className="ml-auto max-w-[200px] space-y-1">
                    <div className="flex justify-between text-xs font-mono tabular-nums">
                      <span className="text-stone-400">Subtotal</span>
                      <span className="text-stone-600">₹{financials.subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono tabular-nums">
                      <span className="text-stone-400">GST</span>
                      <span className="text-stone-600">₹{financials.tax.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-stone-200 mt-1">
                      <span className="font-bold text-stone-700 text-xs">Total</span>
                      <span className="text-sm font-extrabold text-stone-900 font-mono tabular-nums">₹{financials.total.toLocaleString('en-IN')}</span>
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

        {/* ── BOTTOM GRID: Shipping, Timeline, Shipments, Payments ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Shipping Address */}
          <CollapsibleSection icon={<MapPin size={12} />} title="Shipping Address">
            <div className="px-4 py-3">
              {order.shippingStreet ? (
                <div className="text-xs text-stone-500 leading-relaxed space-y-0.5">
                  <p className="font-bold text-stone-800 text-sm tracking-tight">{order.customerName}</p>
                  <p>{order.shippingStreet}</p>
                  <p>{order.shippingCity}, {order.shippingState}</p>
                  <p className="font-mono text-[10px] text-stone-400 pt-0.5">{order.shippingZip} · {order.shippingCountry}</p>
                </div>
              ) : (
                <p className="text-xs text-stone-400 italic">No address provided</p>
              )}
            </div>
          </CollapsibleSection>

          {/* Status Timeline */}
          <CollapsibleSection
            icon={<Clock size={12} />}
            title="Status History"
            badge={
              <span className="text-[10px] font-mono font-bold text-stone-400 bg-white border border-stone-200 px-2 py-0.5 rounded-md">
                {logs.length}
              </span>
            }
          >
            <OrderLogs logs={logs} />
          </CollapsibleSection>

          {/* Shipment Tracking */}
          <CollapsibleSection
            icon={<Truck size={12} />}
            title="Shipments"
            badge={
              <span className="text-[10px] font-mono font-bold text-stone-400 bg-white border border-stone-200 px-2 py-0.5 rounded-md">
                {shipments.length}
              </span>
            }
            defaultOpen={shipments.length > 0}
          >
            <OrderShipments shipments={shipments} />
          </CollapsibleSection>

          {/* Payment Transactions */}
          <CollapsibleSection
            icon={<CreditCard size={12} />}
            title="Payments"
            badge={
              <span className="text-[10px] font-mono font-bold text-stone-400 bg-white border border-stone-200 px-2 py-0.5 rounded-md">
                {payments.length}
              </span>
            }
            defaultOpen={payments.length > 0}
          >
            <OrderPayments payments={payments} />
          </CollapsibleSection>

        </div>
      </div>
    </div>
  );
}
