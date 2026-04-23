'use client';

import React, { memo, useMemo } from 'react';
import { PaymentMethodType, PaymentStatus, PaymentTransaction } from '@/types';
import { cn } from '@/lib/utils';
import { CreditCard } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   PAYMENT METHOD LABELS
───────────────────────────────────────────────────────────────*/

const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  [PaymentMethodType.RAZORPAY]: 'Razorpay',
  [PaymentMethodType.UPI]: 'UPI',
  [PaymentMethodType.BANK_TRANSFER]: 'Bank Transfer',
};

/* ─────────────────────────────────────────────────────────────
   PAYMENT STATUS CONFIG
───────────────────────────────────────────────────────────────*/

const PAYMENT_STATUS_MAP: Record<PaymentStatus, { label: string; cls: string }> = {
  [PaymentStatus.INITIATED]:          { label: 'Initiated',          cls: 'bg-stone-50 text-stone-600 ring-1 ring-stone-200' },
  [PaymentStatus.PENDING]:            { label: 'Pending',            cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  [PaymentStatus.COMPLETED]:          { label: 'Completed',          cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  [PaymentStatus.FAILED]:             { label: 'Failed',             cls: 'bg-rose-50 text-rose-600 ring-1 ring-rose-200' },
  [PaymentStatus.REFUNDED]:           { label: 'Refunded',           cls: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200' },
  [PaymentStatus.PARTIALLY_REFUNDED]: { label: 'Partial Refund',     cls: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200' },
};

const DATE_OPTS: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

/* ─────────────────────────────────────────────────────────────
   ORDER PAYMENTS COMPONENT
───────────────────────────────────────────────────────────────*/

interface OrderPaymentsProps {
  payments: PaymentTransaction[];
}

const OrderPayments: React.FC<OrderPaymentsProps> = memo(({ payments }) => {
  const sortedPayments = useMemo(
    () => [...payments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [payments]
  );

  if (sortedPayments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4">
        <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center mb-3">
          <CreditCard size={18} className="text-stone-300" />
        </div>
        <p className="text-xs font-semibold text-stone-500 mb-0.5">No Payment Transactions</p>
        <p className="text-[11px] text-stone-400">Payment records will appear here once a transaction is initiated.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50/30">
              <th className="px-4 py-2.5 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                Method
              </th>
              <th className="px-3 py-2.5 text-right text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                Amount
              </th>
              <th className="px-3 py-2.5 text-center text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                Status
              </th>
              <th className="px-3 py-2.5 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                Gateway ID
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {sortedPayments.map((payment) => {
              const methodLabel = PAYMENT_METHOD_LABELS[payment.method] ?? payment.method;
              const statusCfg = PAYMENT_STATUS_MAP[payment.status] ?? {
                label: payment.status,
                cls: 'bg-stone-100 text-stone-600 ring-1 ring-stone-200',
              };

              return (
                <tr key={payment.id} className="hover:bg-stone-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                        <CreditCard size={12} className="text-indigo-500" />
                      </div>
                      <span className="text-xs font-semibold text-stone-800">{methodLabel}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-sm font-bold text-stone-900 font-mono tabular-nums">
                      ₹{payment.amount.toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap',
                        statusCfg.cls
                      )}
                    >
                      <span className="w-1 h-1 rounded-full bg-current opacity-60" />
                      {statusCfg.label}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {payment.gatewayTxnId ? (
                      <code className="text-[11px] font-mono text-stone-500 bg-stone-50 px-1.5 py-0.5 rounded border border-stone-100">
                        {payment.gatewayTxnId}
                      </code>
                    ) : (
                      <span className="text-[11px] text-stone-300 italic">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-[11px] text-stone-500 font-mono tabular-nums">
                      {new Date(payment.createdAt).toLocaleDateString('en-IN', DATE_OPTS)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden divide-y divide-stone-100">
        {sortedPayments.map((payment) => {
          const methodLabel = PAYMENT_METHOD_LABELS[payment.method] ?? payment.method;
          const statusCfg = PAYMENT_STATUS_MAP[payment.status] ?? {
            label: payment.status,
            cls: 'bg-stone-100 text-stone-600 ring-1 ring-stone-200',
          };

          return (
            <div key={payment.id} className="px-4 py-3.5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                    <CreditCard size={14} className="text-indigo-500" />
                  </div>
                  <span className="text-sm font-bold text-stone-800">{methodLabel}</span>
                </div>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap flex-shrink-0',
                    statusCfg.cls
                  )}
                >
                  <span className="w-1 h-1 rounded-full bg-current opacity-60" />
                  {statusCfg.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-stone-900 font-mono tabular-nums">
                  ₹{payment.amount.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-stone-400 font-mono tabular-nums">
                  {new Date(payment.createdAt).toLocaleDateString('en-IN', DATE_OPTS)}
                </span>
              </div>
              {payment.gatewayTxnId && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="text-[9px] text-stone-400 uppercase tracking-wider font-bold">TXN</span>
                  <code className="text-[10px] font-mono text-stone-500 truncate">
                    {payment.gatewayTxnId}
                  </code>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
});

OrderPayments.displayName = 'OrderPayments';
export default OrderPayments;
