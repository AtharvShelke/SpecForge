'use client';

import React, { memo, useMemo, useState } from 'react';
import { PaymentMethodType, PaymentStatus, PaymentTransaction } from '@/types';
import { cn } from '@/lib/utils';
import { CheckCircle2, CreditCard, ExternalLink, XCircle } from 'lucide-react';

const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  [PaymentMethodType.RAZORPAY]: 'Razorpay',
  [PaymentMethodType.UPI]: 'UPI',
  [PaymentMethodType.BANK_TRANSFER]: 'Bank Transfer',
};

const PAYMENT_STATUS_MAP: Record<PaymentStatus, { label: string; cls: string }> = {
  [PaymentStatus.INITIATED]: { label: 'Initiated', cls: 'bg-stone-50 text-stone-600 ring-1 ring-stone-200' },
  [PaymentStatus.PENDING]: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  [PaymentStatus.COMPLETED]: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  [PaymentStatus.FAILED]: { label: 'Failed', cls: 'bg-rose-50 text-rose-600 ring-1 ring-rose-200' },
  [PaymentStatus.REFUNDED]: { label: 'Refunded', cls: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200' },
  [PaymentStatus.PARTIALLY_REFUNDED]: { label: 'Partial Refund', cls: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200' },
};

const DATE_OPTS: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

interface OrderPaymentsProps {
  payments: PaymentTransaction[];
  canReviewManualPayments?: boolean;
  onReviewPayment?: (paymentId: string, status: PaymentStatus.COMPLETED | PaymentStatus.FAILED) => Promise<void> | void;
}

const PaymentProofPreview = ({ url }: { url: string }) => (
  <a
    href={url}
    target="_blank"
    rel="noreferrer"
    className="group flex items-center gap-2 rounded-xl border border-stone-200 bg-white p-2 hover:border-indigo-200"
  >
    <div className="h-14 w-14 overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
      <img src={url} alt="Payment proof" className="h-full w-full object-cover" />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-semibold text-stone-800">Payment proof</p>
      <p className="text-[10px] text-stone-500 truncate">Open screenshot</p>
    </div>
    <ExternalLink size={13} className="ml-auto text-stone-400 group-hover:text-indigo-600" />
  </a>
);

const ReviewActions = ({
  paymentId,
  onReviewPayment,
}: {
  paymentId: string;
  onReviewPayment?: (paymentId: string, status: PaymentStatus.COMPLETED | PaymentStatus.FAILED) => Promise<void> | void;
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const runReview = async (status: PaymentStatus.COMPLETED | PaymentStatus.FAILED) => {
    if (!onReviewPayment) return;
    setIsUpdating(true);
    try {
      await onReviewPayment(paymentId, status);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={isUpdating}
        onClick={() => runReview(PaymentStatus.COMPLETED)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 border border-emerald-100 disabled:opacity-50"
      >
        <CheckCircle2 size={13} />
        Verify
      </button>
      <button
        type="button"
        disabled={isUpdating}
        onClick={() => runReview(PaymentStatus.FAILED)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-[11px] font-semibold text-rose-700 border border-rose-100 disabled:opacity-50"
      >
        <XCircle size={13} />
        Reject
      </button>
    </div>
  );
};

const OrderPayments: React.FC<OrderPaymentsProps> = memo(({
  payments,
  canReviewManualPayments = false,
  onReviewPayment,
}) => {
  const sortedPayments = useMemo(
    () => [...payments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [payments],
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
    <div className="divide-y divide-stone-100">
      {sortedPayments.map((payment) => {
        const methodLabel = PAYMENT_METHOD_LABELS[payment.method] ?? payment.method;
        const statusCfg = PAYMENT_STATUS_MAP[payment.status] ?? {
          label: payment.status,
          cls: 'bg-stone-100 text-stone-600 ring-1 ring-stone-200',
        };
        const proofUrls = payment.paymentProofs?.map((proof) => proof.proofUrl).filter(Boolean) as string[];
        const showReviewActions =
          canReviewManualPayments &&
          (payment.method === PaymentMethodType.UPI || payment.method === PaymentMethodType.BANK_TRANSFER) &&
          payment.status === PaymentStatus.PENDING;

        return (
          <div key={payment.id} className="px-4 py-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                  <CreditCard size={15} className="text-indigo-500" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-stone-800">{methodLabel}</span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap',
                        statusCfg.cls,
                      )}
                    >
                      <span className="w-1 h-1 rounded-full bg-current opacity-60" />
                      {statusCfg.label}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-stone-500">
                    <span className="font-mono">Rs. {payment.amount.toLocaleString('en-IN')}</span>
                    <span>{new Date(payment.createdAt).toLocaleDateString('en-IN', DATE_OPTS)}</span>
                    {payment.gatewayTxnId && <code className="rounded bg-stone-50 px-1.5 py-0.5 border border-stone-100">{payment.gatewayTxnId}</code>}
                  </div>
                </div>
              </div>
              {showReviewActions && (
                <ReviewActions paymentId={payment.id} onReviewPayment={onReviewPayment} />
              )}
            </div>

            {proofUrls.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {proofUrls.map((url) => (
                  <PaymentProofPreview key={url} url={url} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

OrderPayments.displayName = 'OrderPayments';
export default OrderPayments;
