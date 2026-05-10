'use client';

import { AlertTriangle, GitCompareArrows, ShieldCheck } from 'lucide-react';

interface CompatibilityManagerProps {
  comparableCount: number;
  attributeCount: number;
}

export function CompatibilityManager({ comparableCount, attributeCount }: CompatibilityManagerProps) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <GitCompareArrows size={18} />
        </div>
        <div className="space-y-2">
          <div>
            <h3 className="text-sm font-bold text-stone-900">Compatibility Foundation</h3>
            <p className="text-xs text-stone-600">
              Category attributes are now the shared foundation for product data, storefront filters, and future schema-backed compatibility rules.
            </p>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="rounded-xl border border-white/80 bg-white/80 px-3 py-2 text-xs text-stone-700">
              <div className="mb-1 flex items-center gap-1.5 font-semibold text-stone-900">
                <ShieldCheck size={13} className="text-emerald-600" />
                Comparable attributes
              </div>
              <p>{comparableCount} of {attributeCount} attributes are marked comparable.</p>
            </div>
            <div className="rounded-xl border border-white/80 bg-white/80 px-3 py-2 text-xs text-stone-700">
              <div className="mb-1 flex items-center gap-1.5 font-semibold text-stone-900">
                <AlertTriangle size={13} className="text-amber-600" />
                Next step
              </div>
              <p>Use stable keys like `socket`, `ramType`, and `tdp` so compatibility logic can target attributes reliably.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
