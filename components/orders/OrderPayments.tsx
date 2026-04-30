"use client";

import React, { memo, useMemo, useState } from "react";
import Image from "next/image";
import { PaymentMethodType, PaymentStatus, PaymentTransaction } from "@/types";
import { cn } from "@/lib/utils";
import { CheckCircle2, CreditCard, ExternalLink, XCircle } from "lucide-react";

const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  [PaymentMethodType.RAZORPAY]: "Razorpay",
  [PaymentMethodType.UPI]: "UPI",
  [PaymentMethodType.BANK_TRANSFER]: "Bank Transfer",
};

const PAYMENT_STATUS_MAP: Record<
  PaymentStatus,
  { label: string; cls: string }
> = {
  [PaymentStatus.INITIATED]: {
    label: "Initiated",
    cls: "bg-stone-100 text-stone-600 ring-stone-200",
  },
  [PaymentStatus.PENDING]: {
    label: "Pending",
    cls: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  [PaymentStatus.COMPLETED]: {
    label: "Completed",
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  [PaymentStatus.FAILED]: {
    label: "Failed",
    cls: "bg-rose-50 text-rose-700 ring-rose-200",
  },
  [PaymentStatus.REFUNDED]: {
    label: "Refunded",
    cls: "bg-violet-50 text-violet-700 ring-violet-200",
  },
  [PaymentStatus.PARTIALLY_REFUNDED]: {
    label: "Partial Refund",
    cls: "bg-orange-50 text-orange-700 ring-orange-200",
  },
};

const DATE_OPTS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

interface OrderPaymentsProps {
  payments: PaymentTransaction[];
  canReviewManualPayments?: boolean;
  onReviewPayment?: (
    paymentId: string,
    status: PaymentStatus.COMPLETED | PaymentStatus.FAILED,
  ) => Promise<void> | void;
}

const PaymentProofPreview = ({ url }: { url: string }) => {
  const fileExt = url.split(".").pop()?.split("?")[0]?.toUpperCase() ?? "IMG";

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group relative flex flex-col overflow-hidden rounded-[1.25rem] border border-stone-200/60 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,23,42,0.10)] hover:border-stone-300/80"
    >
      {/* ── Image area ── */}
      <div className="relative h-32 w-full overflow-hidden bg-stone-100/80">
        <Image
          src={url}
          alt="Payment proof"
          fill
          unoptimized
          className="object-cover text-transparent transition-transform duration-500 ease-out group-hover:scale-110"
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-stone-900/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/25 text-white shadow-sm backdrop-blur-md">
            <ExternalLink size={16} strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-bold tracking-widest text-white drop-shadow-sm">
            VIEW FULL
          </span>
        </div>

        {/* File type badge */}
        <div className="absolute right-2.5 top-2.5 rounded-md bg-stone-900/60 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white backdrop-blur-sm">
          {fileExt}
        </div>
      </div>

      {/* ── Info bar ── */}
      <div className="flex items-center gap-3 border-t border-stone-100 px-3.5 py-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
          <CreditCard size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-bold uppercase tracking-[0.15em] text-stone-500">
            Payment Proof
          </p>
          <p className="mt-0.5 truncate text-[11px] font-medium text-stone-400">
            Click to expand
          </p>
        </div>
      </div>
    </a>
  );
};

const ReviewActions = ({
  paymentId,
  onReviewPayment,
}: {
  paymentId: string;
  onReviewPayment?: (
    paymentId: string,
    status: PaymentStatus.COMPLETED | PaymentStatus.FAILED,
  ) => Promise<void> | void;
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const runReview = async (
    status: PaymentStatus.COMPLETED | PaymentStatus.FAILED,
  ) => {
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
        className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/90 px-3.5 py-2 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
      >
        <CheckCircle2 size={13} />
        Verify
      </button>
      <button
        type="button"
        disabled={isUpdating}
        onClick={() => runReview(PaymentStatus.FAILED)}
        className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50/90 px-3.5 py-2 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
      >
        <XCircle size={13} />
        Reject
      </button>
    </div>
  );
};

const OrderPayments: React.FC<OrderPaymentsProps> = memo(
  ({ payments, canReviewManualPayments = false, onReviewPayment }) => {
    const sortedPayments = useMemo(
      () =>
        [...payments].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      [payments],
    );

    if (sortedPayments.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center px-4 py-12">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/80 bg-white/90 text-stone-400 shadow-sm">
            <CreditCard size={18} />
          </div>
          <p className="text-sm font-semibold text-stone-700">
            No payment transactions yet
          </p>
          <p className="mt-1 text-center text-[12px] leading-6 text-stone-500">
            Payment records will appear here as soon as the order enters
            checkout or manual review.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3 p-1">
        {sortedPayments.map((payment) => {
          const methodLabel =
            PAYMENT_METHOD_LABELS[payment.method] ?? payment.method;
          const statusCfg = PAYMENT_STATUS_MAP[payment.status] ?? {
            label: payment.status,
            cls: "bg-stone-100 text-stone-600 ring-stone-200",
          };
          const proofUrls = payment.paymentProofs
            ?.map((proof) => proof.proofUrl)
            .filter(Boolean) as string[];
          const showReviewActions =
            canReviewManualPayments &&
            (payment.method === PaymentMethodType.UPI ||
              payment.method === PaymentMethodType.BANK_TRANSFER) &&
            payment.status === PaymentStatus.PENDING;

          return (
            <div
              key={payment.id}
              className="overflow-hidden rounded-[1.5rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(246,243,237,0.92))] shadow-[0_16px_40px_rgba(15,23,42,0.06)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 px-4 py-4 sm:px-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50/80 text-sky-700 shadow-sm">
                    <CreditCard size={16} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-stone-900">
                        {methodLabel}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ring-1",
                          statusCfg.cls,
                        )}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-500">
                      <span className="rounded-full border border-stone-200/80 bg-white/80 px-2.5 py-1 font-medium">
                        Rs. {payment.amount.toLocaleString("en-IN")}
                      </span>
                      <span>
                        {new Date(payment.createdAt).toLocaleDateString(
                          "en-IN",
                          DATE_OPTS,
                        )}
                      </span>
                      {payment.gatewayTxnId && (
                        <code className="rounded-full border border-stone-200/80 bg-white/80 px-2.5 py-1 font-mono text-[10px]">
                          {payment.gatewayTxnId}
                        </code>
                      )}
                    </div>
                  </div>
                </div>
                {showReviewActions && (
                  <ReviewActions
                    paymentId={payment.id}
                    onReviewPayment={onReviewPayment}
                  />
                )}
              </div>

              {proofUrls.length > 0 && (
                <div className="border-t border-stone-200/70 bg-white/45 px-4 py-4 sm:px-5">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-400">
                    Supporting proof
                  </p>
                  <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
                    {proofUrls.map((url) => (
                      <PaymentProofPreview key={url} url={url} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  },
);

OrderPayments.displayName = "OrderPayments";

export default OrderPayments;
