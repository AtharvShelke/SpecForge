"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { Settings, Save, RotateCcw, Check, DollarSign } from "lucide-react";
import { apiFetch } from "@/lib/helpers";

const Toggle = memo(
  ({
    label,
    desc,
    checked,
    onChange,
  }: {
    label: string;
    desc: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-100 hover:border-zinc-200 transition-colors cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`mt-0.5 relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-indigo-600" : "bg-zinc-200"}`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[18px]" : "translate-x-[3px]"}`}
        />
      </button>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-zinc-800">{label}</p>
        <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>
      </div>
    </label>
  ),
);
Toggle.displayName = "Toggle";

interface TaxSettingsData {
  taxRatePct: number;
  taxName: string;
  taxDescription: string | null;
  enabled: boolean;
}

const TaxSettingsTab = memo(function TaxSettingsTab() {
  const [settings, setSettings] = useState<TaxSettingsData>({
    taxRatePct: 18,
    taxName: "GST",
    taxDescription: "",
    enabled: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<TaxSettingsData>("/api/admin/tax-settings")
      .then((data) => setSettings(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await apiFetch("/api/admin/tax-settings", {
        method: "POST",
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }, [settings]);

  const handleReset = useCallback(() => {
    setSettings({
      taxRatePct: 18,
      taxName: "GST",
      taxDescription: "",
      enabled: true,
    });
  }, []);

  const update = useCallback((key: keyof TaxSettingsData, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-zinc-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign size={18} className="text-emerald-500" />
          <h3 className="text-lg font-bold text-zinc-900">Tax Settings</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-500 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            <RotateCcw size={12} /> Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saved ? (
              <>
                <Check size={12} /> Saved
              </>
            ) : (
              <>
                <Save size={12} /> {saving ? "Saving…" : "Save"}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        <Toggle
          label="Enable Tax Calculation"
          desc="Apply tax to orders and invoices"
          checked={settings.enabled}
          onChange={(v) => update("enabled", v)}
        />
      </div>

      <div className="grid gap-4">
        <div>
          <label className="text-sm font-semibold text-zinc-700 mb-2 block">
            Tax Rate (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={settings.taxRatePct}
            onChange={(e) => update("taxRatePct", Number(e.target.value))}
            className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
            placeholder="e.g. 18"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-zinc-700 mb-2 block">
            Tax Name
          </label>
          <input
            type="text"
            value={settings.taxName}
            onChange={(e) => update("taxName", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
            placeholder="e.g. GST, VAT, Sales Tax"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-zinc-700 mb-2 block">
            Description (Optional)
          </label>
          <textarea
            value={settings.taxDescription ?? ""}
            onChange={(e) => update("taxDescription", e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 resize-none"
            placeholder="Additional description for invoices"
          />
        </div>
      </div>

      <details className="group">
        <summary className="text-xs font-semibold text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-zinc-600">
          JSON Preview
        </summary>
        <pre className="mt-2 p-3 text-xs bg-zinc-50 border border-zinc-100 rounded-lg overflow-auto max-h-48 text-zinc-600">
          {JSON.stringify(settings, null, 2)}
        </pre>
      </details>
    </div>
  );
});

export default TaxSettingsTab;
