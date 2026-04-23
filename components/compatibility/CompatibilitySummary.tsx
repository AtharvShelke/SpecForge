'use client';

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import type { CompatibilityResult } from '@/types';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Activity,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────*/

interface CompatibilitySummaryProps {
  summary: CompatibilityResult['summary'];
}

/* ─────────────────────────────────────────────────────────────
   STAT PILL CONFIG
───────────────────────────────────────────────────────────────*/

interface StatPill {
  label: string;
  value: number;
  icon: React.ElementType;
  bg: string;
  text: string;
  ring: string;
  dot: string;
}

function buildPills(summary: NonNullable<CompatibilityResult['summary']>): StatPill[] {
  return [
    {
      label: 'Total',
      value: summary.totalChecks,
      icon: Activity,
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      ring: 'ring-slate-200',
      dot: 'bg-slate-400',
    },
    {
      label: 'Passed',
      value: summary.passed,
      icon: CheckCircle2,
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      ring: 'ring-emerald-200',
      dot: 'bg-emerald-500',
    },
    {
      label: 'Failed',
      value: summary.failed,
      icon: XCircle,
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      ring: 'ring-rose-200',
      dot: 'bg-rose-500',
    },
    {
      label: 'Errors',
      value: summary.errors,
      icon: XCircle,
      bg: 'bg-red-50',
      text: 'text-red-700',
      ring: 'ring-red-200',
      dot: 'bg-red-500',
    },
    {
      label: 'Warnings',
      value: summary.warnings,
      icon: AlertTriangle,
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      ring: 'ring-amber-200',
      dot: 'bg-amber-500',
    },
  ];
}

/* ─────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────────*/

const CompatibilitySummary: React.FC<CompatibilitySummaryProps> = memo(({ summary }) => {
  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center py-6 px-4">
        <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center mb-3">
          <Info size={18} className="text-stone-300" />
        </div>
        <p className="text-xs font-semibold text-stone-500 mb-0.5">No Summary Available</p>
        <p className="text-[11px] text-stone-400">
          Compatibility summary data was not returned for this check.
        </p>
      </div>
    );
  }

  const pills = buildPills(summary);

  return (
    <div className="space-y-3">
      {/* ── Progress bar ─────────────────────────────────────────── */}
      {summary.totalChecks > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider">
            <span className="text-stone-500">Pass Rate</span>
            <span className={cn(
              'tabular-nums font-mono',
              summary.passed === summary.totalChecks ? 'text-emerald-600' : 'text-stone-600'
            )}>
              {Math.round((summary.passed / summary.totalChecks) * 100)}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
            <div className="h-full flex">
              {summary.passed > 0 && (
                <div
                  className="bg-emerald-500 transition-all duration-500 ease-out"
                  style={{ width: `${(summary.passed / summary.totalChecks) * 100}%` }}
                />
              )}
              {summary.warnings > 0 && (
                <div
                  className="bg-amber-400 transition-all duration-500 ease-out"
                  style={{ width: `${(summary.warnings / summary.totalChecks) * 100}%` }}
                />
              )}
              {summary.errors > 0 && (
                <div
                  className="bg-red-500 transition-all duration-500 ease-out"
                  style={{ width: `${(summary.errors / summary.totalChecks) * 100}%` }}
                />
              )}
              {(summary.failed - summary.errors - summary.warnings) > 0 && (
                <div
                  className="bg-rose-400 transition-all duration-500 ease-out"
                  style={{
                    width: `${((summary.failed - summary.errors - summary.warnings) / summary.totalChecks) * 100}%`,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Stat pills ───────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {pills.map((pill) => {
          const Icon = pill.icon;
          return (
            <div
              key={pill.label}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold ring-1 transition-colors',
                pill.bg,
                pill.text,
                pill.ring
              )}
            >
              <Icon size={12} className="opacity-70" />
              <span>{pill.label}</span>
              <span className={cn(
                'ml-0.5 min-w-[18px] h-[18px] rounded-md flex items-center justify-center text-[10px] font-bold text-white tabular-nums',
                pill.dot
              )}>
                {pill.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

CompatibilitySummary.displayName = 'CompatibilitySummary';
export default CompatibilitySummary;
