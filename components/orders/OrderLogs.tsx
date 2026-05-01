"use client";

import { memo, useMemo } from "react";
import { OrderLog, OrderStatus } from "@/types";
import { STATUS_CONFIG } from "@/data/constants";
import { cn } from "@/lib/utils";
import { Clock, FileText } from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   DATE FORMATTING
───────────────────────────────────────────────────────────────*/

const TIMELINE_DATE_OPTS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

/* ─────────────────────────────────────────────────────────────
   STATUS PILL (matches OrderManager pattern)
───────────────────────────────────────────────────────────────*/

const STATUS_PILL_MAP: Record<string, { label: string; cls: string }> = {
  [OrderStatus.PENDING]: {
    label: "Pending",
    cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  },
  [OrderStatus.PAID]: {
    label: "Paid",
    cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  },
  [OrderStatus.PROCESSING]: {
    label: "Processing",
    cls: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  },
  [OrderStatus.SHIPPED]: {
    label: "Shipped",
    cls: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  },
  [OrderStatus.DELIVERED]: {
    label: "Delivered",
    cls: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
  },
  [OrderStatus.CANCELLED]: {
    label: "Cancelled",
    cls: "bg-rose-50 text-rose-600 ring-1 ring-rose-200",
  },
  [OrderStatus.RETURNED]: {
    label: "Returned",
    cls: "bg-stone-100 text-stone-600 ring-1 ring-stone-200",
  },
};

/* ─────────────────────────────────────────────────────────────
   ORDER LOGS COMPONENT — Vertical timeline of status changes
───────────────────────────────────────────────────────────────*/

interface OrderLogsProps {
  logs: OrderLog[];
}

const OrderLogs: React.FC<OrderLogsProps> = memo(({ logs }) => {
  // Sort ascending by timestamp so timeline reads top-to-bottom
  const sortedLogs = useMemo(
    () =>
      [...logs].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      ),
    [logs],
  );

  if (sortedLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4">
        <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center mb-3">
          <Clock size={18} className="text-stone-300" />
        </div>
        <p className="text-xs font-semibold text-stone-500 mb-0.5">
          No Status History
        </p>
        <p className="text-[11px] text-stone-400">
          Status changes will appear here as the order progresses.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <div className="relative pl-5 border-l-2 border-stone-100 space-y-5">
        {sortedLogs.map((log, idx) => {
          const isLatest = idx === sortedLogs.length - 1;
          const cfg = STATUS_CONFIG[log.status];
          const pillCfg = STATUS_PILL_MAP[log.status] ?? {
            label: log.status,
            cls: "bg-stone-100 text-stone-600 ring-1 ring-stone-200",
          };

          return (
            <div key={log.id ?? idx} className="relative">
              {/* Dot on the timeline track */}
              <div
                className={cn(
                  "absolute -left-[23px] top-0.5 h-3 w-3 rounded-full border-2 border-white ring-2 transition-all",
                  isLatest
                    ? `${cfg.dotClass} ring-indigo-100`
                    : "bg-stone-200 ring-stone-50",
                )}
              />

              <div>
                {/* Status badge + "Now" marker */}
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap",
                      pillCfg.cls,
                    )}
                  >
                    <span className="w-1 h-1 rounded-full bg-current opacity-60" />
                    {pillCfg.label}
                  </span>
                  {isLatest && (
                    <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                      Current
                    </span>
                  )}
                </div>

                {/* Timestamp */}
                <p className="text-[10px] text-stone-400 font-mono tabular-nums">
                  {new Date(log.timestamp).toLocaleString(
                    "en-IN",
                    TIMELINE_DATE_OPTS,
                  )}
                </p>

                {/* Optional note */}
                {log.note && (
                  <div className="mt-1.5 flex items-start gap-1.5 bg-stone-50 px-2.5 py-2 rounded-lg border border-stone-100">
                    <FileText
                      size={10}
                      className="text-stone-400 mt-0.5 flex-shrink-0"
                    />
                    <p className="text-[11px] text-stone-500 leading-relaxed">
                      {log.note}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

OrderLogs.displayName = "OrderLogs";
export default OrderLogs;
