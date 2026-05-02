"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { ShipmentTracking } from "@/types";
import { cn } from "@/lib/utils";
import { Copy, ExternalLink, Package, Truck } from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   SHIPMENT STATUS CONFIG
───────────────────────────────────────────────────────────────*/

const SHIPMENT_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDING: {
    label: "Pending",
    cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  },
  PICKED_UP: {
    label: "Picked Up",
    cls: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  },
  IN_TRANSIT: {
    label: "In Transit",
    cls: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  },
  OUT_FOR_DELIVERY: {
    label: "Out for Delivery",
    cls: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  },
  DELIVERED: {
    label: "Delivered",
    cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  },
  FAILED: {
    label: "Failed",
    cls: "bg-rose-50 text-rose-600 ring-1 ring-rose-200",
  },
  RETURNED: {
    label: "Returned",
    cls: "bg-stone-100 text-stone-600 ring-1 ring-stone-200",
  },
};

const DATE_OPTS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

/* ─────────────────────────────────────────────────────────────
   CARRIER TRACKING URLS — for generating links
───────────────────────────────────────────────────────────────*/

const CARRIER_URLS: Record<string, (tn: string) => string> = {
  DELHIVERY: (tn) => `https://www.delhivery.com/track/package/${tn}`,
  BLUEDART: (tn) => `https://www.bluedart.com/tracking/${tn}`,
  DTDC: (tn) =>
    `https://www.dtdc.in/tracking/shipment-tracking.asp?strCnno=${tn}`,
  ECOM: (tn) => `https://ecomexpress.in/tracking/?awb_field=${tn}`,
  FEDEX: (tn) => `https://www.fedex.com/fedextrack/?trknbr=${tn}`,
  DHL: (tn) => `https://www.dhl.com/en/express/tracking.html?AWB=${tn}`,
};

function getTrackingUrl(
  carrier: string,
  trackingNumber: string,
): string | null {
  const key = carrier.toUpperCase().replace(/[^A-Z]/g, "");
  const builder = CARRIER_URLS[key];
  return builder ? builder(trackingNumber) : null;
}

/* ─────────────────────────────────────────────────────────────
   COPY BUTTON
───────────────────────────────────────────────────────────────*/

const CopyButton = memo(({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback: do nothing
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-all",
        copied
          ? "bg-emerald-50 text-emerald-600"
          : "bg-stone-50 text-stone-400 hover:text-stone-600 hover:bg-stone-100",
      )}
      title="Copy tracking number"
    >
      <Copy size={10} />
      {copied ? "Copied!" : "Copy"}
    </button>
  );
});
CopyButton.displayName = "CopyButton";

/* ─────────────────────────────────────────────────────────────
   ORDER SHIPMENTS COMPONENT
───────────────────────────────────────────────────────────────*/

interface OrderShipmentsProps {
  shipments: ShipmentTracking[];
}

const OrderShipments: React.FC<OrderShipmentsProps> = memo(({ shipments }) => {
  const sortedShipments = useMemo(
    () =>
      [...shipments].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [shipments],
  );

  if (sortedShipments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4">
        <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center mb-3">
          <Truck size={18} className="text-stone-300" />
        </div>
        <p className="text-xs font-semibold text-stone-500 mb-0.5">
          No Shipments Yet
        </p>
        <p className="text-[11px] text-stone-400">
          Shipment details will appear here once the order is shipped.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-stone-100">
      {sortedShipments.map((shipment) => {
        const statusCfg = SHIPMENT_STATUS_MAP[
          shipment.status.toUpperCase()
        ] ?? {
          label: shipment.status,
          cls: "bg-stone-100 text-stone-600 ring-1 ring-stone-200",
        };
        const trackUrl = getTrackingUrl(
          shipment.carrier,
          shipment.trackingNumber,
        );

        return (
          <div key={shipment.id} className="px-4 py-3.5">
            {/* Top row: carrier + status */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Package size={14} className="text-indigo-500" />
                </div>
                <span className="text-sm font-bold text-stone-800 tracking-tight truncate">
                  {shipment.carrier}
                </span>
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap flex-shrink-0",
                  statusCfg.cls,
                )}
              >
                <span className="w-1 h-1 rounded-full bg-current opacity-60" />
                {statusCfg.label}
              </span>
            </div>

            {/* Tracking number */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold flex-shrink-0">
                Tracking
              </span>
              <code className="text-xs font-mono text-stone-700 bg-stone-50 px-2 py-0.5 rounded border border-stone-100 truncate">
                {shipment.trackingNumber}
              </code>
              <CopyButton text={shipment.trackingNumber} />
              {trackUrl && (
                <a
                  href={trackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-[10px] text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                >
                  Track <ExternalLink size={9} />
                </a>
              )}
            </div>

            {/* Meta: dates */}
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <div>
                <span className="text-[9px] text-stone-400 uppercase tracking-widest font-bold">
                  Shipped
                </span>
                <p className="text-[11px] text-stone-600 font-mono tabular-nums">
                  {new Date(shipment.createdAt).toLocaleDateString(
                    "en-IN",
                    DATE_OPTS,
                  )}
                </p>
              </div>
              {shipment.estimatedDelivery && (
                <div>
                  <span className="text-[9px] text-stone-400 uppercase tracking-widest font-bold">
                    Est. Delivery
                  </span>
                  <p className="text-[11px] text-stone-600 font-mono tabular-nums">
                    {new Date(shipment.estimatedDelivery).toLocaleDateString(
                      "en-IN",
                      DATE_OPTS,
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});

OrderShipments.displayName = "OrderShipments";
export default OrderShipments;
