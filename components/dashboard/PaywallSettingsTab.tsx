"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { Save, RotateCcw, Check, Wrench } from "lucide-react";
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
    <label className="flex cursor-pointer items-start gap-4 rounded-md border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-slate-900" : "bg-slate-300"
          }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[18px]" : "translate-x-[3px]"
            }`}
        />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
      </div>
    </label>
  ),
);
Toggle.displayName = "Toggle";

interface PaywallSettingsData {
  enabled: boolean;
  price: number;
}

const PaywallSettingsTab = memo(function PaywallSettingsTab() {
  const [settings, setSettings] = useState<PaywallSettingsData>({
    enabled: false,
    price: 150,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<PaywallSettingsData>("/api/admin/paywall-settings")
      .then((data) => setSettings(data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await apiFetch("/api/admin/paywall-settings", {
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
      enabled: false,
      price: 150,
    });
  }, []);

  const update = useCallback((key: keyof PaywallSettingsData, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <Wrench size={16} />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Paywall Settings</h3>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <RotateCcw size={14} /> <span className="hidden sm:inline">Reset Defaults</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex h-9 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
          >
            {saved ? (
              <>
                <Check size={14} /> Saved
              </>
            ) : (
              <>
                <Save size={14} /> {saving ? "Saving…" : "Save Settings"}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-5 space-y-8">
        <div className="grid gap-5 max-w-2xl">
          <Toggle
            label="Enable Custom PC Builder Paywall"
            desc="Block non-admin users from accessing the PC custom builder page unless they have made a one-time configuration payment."
            checked={settings.enabled}
            onChange={(v) => update("enabled", v)}
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Paywall Price (INR)
            </label>
            <input
              type="number"
              step="1"
              min="0"
              value={settings.price}
              onChange={(e) => update("price", Number(e.target.value))}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              placeholder="e.g. 150"
            />
          </div>
        </div>

        {/* Developer Info */}
        <details className="group border-t border-slate-200 pt-6">
          <summary className="cursor-pointer text-xs font-medium uppercase tracking-wider text-slate-400 transition-colors hover:text-slate-600 focus:outline-none">
            Developer Info: JSON Payload
          </summary>
          <pre className="mt-4 max-h-64 overflow-auto rounded-md border border-slate-200 bg-slate-50 p-4 text-xs font-mono text-slate-600 shadow-inner">
            {JSON.stringify(settings, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
});

export default PaywallSettingsTab;
