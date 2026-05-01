"use client";

import { memo, useMemo, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import type {
  CompatibilityResult,
  CompatibilityCheck,
  CompatibilitySeverity,
} from "@/types";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Layers,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────*/

type DetailRow = NonNullable<CompatibilityResult["details"]>[number];

interface CompatibilityDetailsProps {
  details?: CompatibilityResult["details"];
  /** Fallback: if details is absent, fall back to rendering checks */
  checks?: CompatibilityCheck[];
}

/* ─────────────────────────────────────────────────────────────
   SEVERITY CONFIG
───────────────────────────────────────────────────────────────*/

const SEVERITY_ORDER: Record<string, number> = {
  ERROR: 0,
  WARNING: 1,
  INFO: 2,
};

interface SeverityCfg {
  label: string;
  icon: React.ElementType;
  badgeCls: string;
  headerCls: string;
  rowBorder: string;
}

const SEVERITY_CONFIG: Record<string, SeverityCfg> = {
  ERROR: {
    label: "Error",
    icon: XCircle,
    badgeCls: "bg-red-50 text-red-700 ring-1 ring-red-200",
    headerCls: "bg-red-50/60 border-red-100 text-red-800",
    rowBorder: "border-l-red-400",
  },
  WARNING: {
    label: "Warning",
    icon: AlertTriangle,
    badgeCls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    headerCls: "bg-amber-50/60 border-amber-100 text-amber-800",
    rowBorder: "border-l-amber-400",
  },
  INFO: {
    label: "Info",
    icon: Info,
    badgeCls: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    headerCls: "bg-blue-50/60 border-blue-100 text-blue-800",
    rowBorder: "border-l-blue-300",
  },
};

const PASS_CFG: SeverityCfg = {
  label: "Passed",
  icon: CheckCircle2,
  badgeCls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  headerCls: "bg-emerald-50/40 border-emerald-100 text-emerald-800",
  rowBorder: "border-l-emerald-400",
};

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────*/

function safeString(value: any): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Normalise detail rows from checks (fallback path) */
function checksToDetails(checks: CompatibilityCheck[]): DetailRow[] {
  return checks.map((c) => ({
    ruleId: c.ruleId,
    ruleName: c.rule?.name ?? c.ruleId,
    sourceVariantId: c.sourceVariantId ?? "",
    targetVariantId: c.targetVariantId ?? "",
    passed: c.passed,
    message: c.message,
    severity: c.severity,
    sourceSpecName: c.rule?.sourceSpec?.name ?? "Source Spec",
    targetSpecName: c.rule?.targetSpec?.name ?? "Target Spec",
    sourceValue: undefined,
    targetValue: undefined,
  }));
}

type GroupedRows = {
  key: string;
  cfg: SeverityCfg;
  rows: DetailRow[];
};

function groupBySeverity(rows: DetailRow[]): GroupedRows[] {
  const groups = new Map<string, DetailRow[]>();

  // Sort rows: failing ERROR first, then WARNING, then passing
  const sorted = [...rows].sort((a, b) => {
    if (a.passed !== b.passed) return a.passed ? 1 : -1;
    const sa = SEVERITY_ORDER[a.severity] ?? 99;
    const sb = SEVERITY_ORDER[b.severity] ?? 99;
    return sa - sb;
  });

  for (const row of sorted) {
    const key = row.passed ? "PASSED" : row.severity || "INFO";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  // Build ordered result
  const result: GroupedRows[] = [];
  for (const sev of ["ERROR", "WARNING", "INFO"]) {
    if (groups.has(sev)) {
      result.push({
        key: sev,
        cfg: SEVERITY_CONFIG[sev] ?? SEVERITY_CONFIG.INFO,
        rows: groups.get(sev)!,
      });
    }
  }
  if (groups.has("PASSED")) {
    result.push({
      key: "PASSED",
      cfg: PASS_CFG,
      rows: groups.get("PASSED")!,
    });
  }

  return result;
}

/* ─────────────────────────────────────────────────────────────
   SUB-COMPONENT: Collapsible Group
───────────────────────────────────────────────────────────────*/

interface GroupSectionProps {
  group: GroupedRows;
  defaultOpen?: boolean;
}

const GroupSection: React.FC<GroupSectionProps> = memo(
  ({ group, defaultOpen = true }) => {
    const [open, setOpen] = useState(defaultOpen);
    const Icon = group.cfg.icon;
    const toggle = useCallback(() => setOpen((o) => !o), []);

    return (
      <div className="rounded-xl border border-stone-200 overflow-hidden">
        {/* Group Header */}
        <button
          type="button"
          onClick={toggle}
          className={cn(
            "w-full flex items-center gap-2 px-4 py-2.5 text-left border-b transition-colors",
            group.cfg.headerCls,
          )}
        >
          <Icon size={14} className="opacity-80 flex-shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider flex-1">
            {group.cfg.label}
          </span>
          <span className="text-[10px] font-bold tabular-nums opacity-70">
            {group.rows.length} rule{group.rows.length !== 1 ? "s" : ""}
          </span>
          {open ? (
            <ChevronDown size={14} className="opacity-50" />
          ) : (
            <ChevronRight size={14} className="opacity-50" />
          )}
        </button>

        {/* Rows */}
        {open && (
          <div className="divide-y divide-stone-100 bg-white">
            {group.rows.map((row, idx) => (
              <DetailRowCard
                key={`${row.ruleId}-${idx}`}
                row={row}
                cfg={group.cfg}
              />
            ))}
          </div>
        )}
      </div>
    );
  },
);

GroupSection.displayName = "GroupSection";

/* ─────────────────────────────────────────────────────────────
   SUB-COMPONENT: Individual Row Card
───────────────────────────────────────────────────────────────*/

interface DetailRowCardProps {
  row: DetailRow;
  cfg: SeverityCfg;
}

const DetailRowCard: React.FC<DetailRowCardProps> = memo(({ row, cfg }) => {
  const hasValues =
    row.sourceValue !== undefined || row.targetValue !== undefined;

  return (
    <div
      className={cn(
        "px-4 py-3 border-l-[3px] transition-colors hover:bg-stone-50/50",
        cfg.rowBorder,
      )}
    >
      {/* Top row: Rule name + pass/fail icon */}
      <div className="flex items-start gap-2 mb-1">
        {row.passed ? (
          <CheckCircle2
            size={14}
            className="text-emerald-500 mt-0.5 flex-shrink-0"
          />
        ) : (
          <XCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-stone-800 leading-tight">
              {row.ruleName}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest whitespace-nowrap",
                cfg.badgeCls,
              )}
            >
              {cfg.label}
            </span>
          </div>
        </div>
      </div>

      {/* Message */}
      <p className="text-[11px] text-stone-500 leading-relaxed ml-[22px] mb-1.5">
        {row.message}
      </p>

      {/* Spec comparison row */}
      {hasValues && (
        <div className="ml-[22px] flex items-center gap-2 flex-wrap">
          {/* Source */}
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-stone-50 border border-stone-150 text-[10px]">
            <span className="text-stone-400 font-medium">
              {row.sourceSpecName}:
            </span>
            <span className="font-semibold text-stone-700 tabular-nums">
              {safeString(row.sourceValue)}
            </span>
          </div>

          <ArrowRight size={10} className="text-stone-300 flex-shrink-0" />

          {/* Target */}
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-stone-50 border border-stone-150 text-[10px]">
            <span className="text-stone-400 font-medium">
              {row.targetSpecName}:
            </span>
            <span className="font-semibold text-stone-700 tabular-nums">
              {safeString(row.targetValue)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

DetailRowCard.displayName = "DetailRowCard";

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────*/

const CompatibilityDetails: React.FC<CompatibilityDetailsProps> = memo(
  ({ details, checks }) => {
    const rows = useMemo<DetailRow[]>(() => {
      if (details && details.length > 0) return details;
      if (checks && checks.length > 0) return checksToDetails(checks);
      return [];
    }, [details, checks]);

    if (rows.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center mb-3">
            <Layers size={18} className="text-stone-300" />
          </div>
          <p className="text-xs font-semibold text-stone-500 mb-0.5">
            No Details Available
          </p>
          <p className="text-[11px] text-stone-400">
            Per-rule breakdown data was not returned for this check.
          </p>
        </div>
      );
    }

    const groups = groupBySeverity(rows);

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Layers size={14} className="text-stone-400" />
          <h4 className="text-xs font-bold text-stone-600 uppercase tracking-wider">
            Rule Breakdown
          </h4>
          <span className="text-[10px] font-semibold tabular-nums text-stone-400">
            ({rows.length} rule{rows.length !== 1 ? "s" : ""})
          </span>
        </div>

        {groups.map((group) => (
          <GroupSection
            key={group.key}
            group={group}
            defaultOpen={group.key !== "PASSED"}
          />
        ))}
      </div>
    );
  },
);

CompatibilityDetails.displayName = "CompatibilityDetails";
export default CompatibilityDetails;
