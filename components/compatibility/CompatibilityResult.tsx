"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import type { CompatibilityResult as CompatibilityResultType } from "@/types";
import CompatibilitySummary from "./CompatibilitySummary";
import CompatibilityDetails from "./CompatibilityDetails";
import { ShieldCheck, ShieldAlert, ShieldX, Shield } from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   STATUS CONFIG
───────────────────────────────────────────────────────────────*/

interface StatusCfg {
  label: string;
  icon: React.ElementType;
  containerCls: string;
  iconCls: string;
  textCls: string;
}

function deriveStatus(result: CompatibilityResultType): StatusCfg {
  if (result.isCompatible) {
    // Check if there are warnings
    const hasWarnings =
      (result.summary?.warnings ?? 0) > 0 ||
      result.checks?.some((c) => !c.passed && c.severity === "WARNING");

    if (hasWarnings) {
      return {
        label: "Compatible with Warnings",
        icon: ShieldAlert,
        containerCls: "bg-amber-50 border-amber-200",
        iconCls: "text-amber-600",
        textCls: "text-amber-800",
      };
    }

    return {
      label: "Fully Compatible",
      icon: ShieldCheck,
      containerCls: "bg-emerald-50 border-emerald-200",
      iconCls: "text-emerald-600",
      textCls: "text-emerald-800",
    };
  }

  return {
    label: "Incompatible",
    icon: ShieldX,
    containerCls: "bg-red-50 border-red-200",
    iconCls: "text-red-600",
    textCls: "text-red-800",
  };
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────*/

interface CompatibilityResultProps {
  result: CompatibilityResultType;
}

const CompatibilityResultView: React.FC<CompatibilityResultProps> = memo(
  ({ result }) => {
    const status = deriveStatus(result);
    const Icon = status.icon;

    return (
      <div className="space-y-5">
        {/* ── Pass/Fail Header ────────────────────────────────────── */}
        <div
          className={cn(
            "flex items-center gap-3 p-4 rounded-xl border transition-colors",
            status.containerCls,
          )}
        >
          <div className="flex-shrink-0">
            <Icon size={24} className={status.iconCls} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={cn("text-sm font-bold", status.textCls)}>
              {status.label}
            </h3>
            {result.createdAt && (
              <p className="text-[10px] text-stone-400 font-mono tabular-nums mt-0.5">
                Checked{" "}
                {new Date(result.createdAt).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
        </div>

        {/* ── Summary Section ─────────────────────────────────────── */}
        {result.summary && (
          <div className="bg-white border border-stone-200 rounded-xl p-4">
            <CompatibilitySummary summary={result.summary} />
          </div>
        )}

        {/* ── Details Section ─────────────────────────────────────── */}
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <CompatibilityDetails
            details={result.details}
            checks={result.checks}
          />
        </div>
      </div>
    );
  },
);

CompatibilityResultView.displayName = "CompatibilityResultView";
export default CompatibilityResultView;
