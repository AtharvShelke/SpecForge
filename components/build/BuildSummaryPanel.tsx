"use client";

import { memo, useMemo } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
  Cpu,
  HardDrive,
  MonitorSpeaker,
  Zap,
  Box,
  Fan,
  MemoryStick,
  CircuitBoard,
  Info,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Loader2,
} from "lucide-react";
import type { BuildItem } from "@/types";
import type { CompatibilityResult, OverallCompatibilityStatus } from "@/context/BuildContext";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface BuildSummaryPanelProps {
  items: BuildItem[];
  itemBySlot: Map<string, BuildItem>;
  steps: Array<{
    id: string;
    name: string;
    shortLabel?: string | null;
    icon?: string | null;
    subCategorySlots?: Array<{
      slotId: string;
    }>;
  }>;
  activeStep: string | null;
  totalPrice: number;
  compatibilityResult: CompatibilityResult | null;
  overallStatus: OverallCompatibilityStatus;
  compatibilityErrors: Array<{ message: string; severity: string }>;
  compatibilityWarnings: Array<{ message: string; severity: string }>;
  loading: boolean;
  onRemoveItem: (itemId: string) => void;
  onStepClick: (stepId: string) => void;
  onCheckCompatibility: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Icon Map
// ─────────────────────────────────────────────────────────────────────────────

const SLOT_ICONS: Record<string, React.ReactNode> = {
  CPU: <Cpu size={16} />,
  MOTHERBOARD: <CircuitBoard size={16} />,
  GPU: <MonitorSpeaker size={16} />,
  RAM: <MemoryStick size={16} />,
  STORAGE: <HardDrive size={16} />,
  PSU: <Zap size={16} />,
  CASE: <Box size={16} />,
  COOLER: <Fan size={16} />,
};

const STATUS_CONFIG = {
  COMPATIBLE: {
    icon: <ShieldCheck size={18} />,
    label: "Compatible",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  WARNING: {
    icon: <ShieldAlert size={18} />,
    label: "Warnings",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  INCOMPATIBLE: {
    icon: <ShieldX size={18} />,
    label: "Incompatible",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  UNCHECKED: {
    icon: <Info size={18} />,
    label: "Not Checked",
    color: "text-slate-400",
    bg: "bg-slate-50",
    border: "border-slate-200",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const BuildSummaryPanel = memo(function BuildSummaryPanel({
  items,
  itemBySlot,
  steps,
  activeStep,
  totalPrice,
  compatibilityResult,
  overallStatus,
  compatibilityErrors,
  compatibilityWarnings,
  loading,
  onRemoveItem,
  onStepClick,
  onCheckCompatibility,
}: BuildSummaryPanelProps) {
  const statusConfig = STATUS_CONFIG[overallStatus];

  const filledCount = useMemo(
    () => steps.filter((s) => itemBySlot.has(s.id)).length,
    [steps, itemBySlot],
  );

  const progressPct = steps.length > 0 ? (filledCount / steps.length) * 100 : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* ── Build Progress ────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900">Build Progress</h3>
          <span className="text-xs font-medium text-slate-500">
            {filledCount}/{steps.length} parts
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative h-2 w-full rounded-full bg-slate-100 overflow-hidden mb-4">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-slate-800 to-slate-600 transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Slot List */}
        <div className="space-y-1.5">
          {steps.map((step) => {
            const slotId = step.subCategorySlots?.[0]?.slotId;
            const item = slotId ? itemBySlot.get(slotId) : null;
            const isActive = step.id === activeStep;
            const isFilled = !!item;
            const product = item?.product;
            const price = product ? Number(product.price ?? 0) : 0;
            const image = product?.media?.[0]?.url ?? (product as { image?: string })?.image;

            return (
              <button
                key={step.id}
                onClick={() => onStepClick(step.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200",
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : isFilled
                      ? "bg-slate-50 text-slate-700 hover:bg-slate-100"
                      : "bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 border border-dashed border-slate-200",
                )}
              >
                {/* Icon */}
                <span
                  className={cn(
                    "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
                    isActive
                      ? "bg-white/10"
                      : isFilled
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-slate-100 text-slate-400",
                  )}
                >
                  {isFilled ? (
                    image ? (
                      <Image
                        src={image}
                        alt=""
                        width={24}
                        height={24}
                        className="rounded object-contain"
                      />
                    ) : (
                      <CheckCircle2 size={14} />
                    )
                  ) : (
                    SLOT_ICONS[step.name?.toUpperCase().replace(/\s+/g, "")] ||
                    SLOT_ICONS[(step.shortLabel ?? "").toUpperCase()] ||
                    <Box size={14} />
                  )}
                </span>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-xs font-medium truncate",
                      isActive ? "text-white/70" : "text-slate-500",
                    )}
                  >
                    {step.shortLabel || step.name}
                  </p>
                  {isFilled && product ? (
                    <p
                      className={cn(
                        "text-xs truncate mt-0.5",
                        isActive ? "text-white" : "text-slate-800",
                      )}
                    >
                      {product.name}
                    </p>
                  ) : (
                    <p className={cn("text-xs mt-0.5", isActive ? "text-white/50" : "text-slate-400")}>
                      Choose a component
                    </p>
                  )}
                </div>

                {/* Price / Remove */}
                {isFilled ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={cn(
                        "text-xs font-semibold tabular-nums",
                        isActive ? "text-white" : "text-slate-700",
                      )}
                    >
                      ₹{price.toLocaleString("en-IN")}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveItem(step.id);
                      }}
                      className={cn(
                        "rounded-md p-1 transition-colors",
                        isActive
                          ? "hover:bg-white/10 text-white/60 hover:text-white"
                          : "hover:bg-red-50 text-slate-400 hover:text-red-500",
                      )}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Total Price ───────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500">Estimated Total</span>
          <span className="text-xl font-bold text-slate-900 tabular-nums">
            ₹{totalPrice.toLocaleString("en-IN")}
          </span>
        </div>
        {items.length > 0 && (
          <p className="mt-1 text-xs text-slate-400">
            {items.length} component{items.length !== 1 ? "s" : ""} selected
          </p>
        )}
      </div>

      {/* ── Compatibility Status ──────────────────────────────────── */}
      {items.length >= 2 && (
        <div
          className={cn(
            "rounded-xl border p-5 shadow-sm",
            statusConfig.border,
            statusConfig.bg,
          )}
        >
          <div className="flex items-center gap-3 mb-3">
            <span className={statusConfig.color}>{statusConfig.icon}</span>
            <div className="flex-1">
              <h3 className={cn("text-sm font-semibold", statusConfig.color)}>
                {statusConfig.label}
              </h3>
              {compatibilityResult?.summary && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {compatibilityResult.summary.passed}/{compatibilityResult.summary.totalChecks} checks passed
                </p>
              )}
            </div>
            <button
              onClick={onCheckCompatibility}
              disabled={loading}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50",
                loading && "opacity-50 cursor-not-allowed",
              )}
            >
              {loading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                overallStatus === "UNCHECKED" ? "Check Now" : "Re-check"
              )}
            </button>
          </div>

          {/* Issues */}
          {(compatibilityErrors.length > 0 || compatibilityWarnings.length > 0) && (
            <div className="space-y-2 mt-3 pt-3 border-t border-current/10">
              {compatibilityErrors.map((issue, i) => (
                <div
                  key={`err-${i}`}
                  className="flex items-start gap-2 rounded-lg bg-white/80 px-3 py-2"
                >
                  <XCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700">{issue.message}</p>
                </div>
              ))}
              {compatibilityWarnings.map((issue, i) => (
                <div
                  key={`warn-${i}`}
                  className="flex items-start gap-2 rounded-lg bg-white/80 px-3 py-2"
                >
                  <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700">{issue.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default BuildSummaryPanel;
