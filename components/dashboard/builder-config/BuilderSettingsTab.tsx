"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { Settings, Save, RotateCcw, Check, Plus, Trash2, Zap, DollarSign } from "lucide-react";
import type { BuilderSettings } from "@/types";
import { DEFAULT_BUILDER_SETTINGS } from "@/types";
import { apiFetch } from "@/lib/helpers";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const POWER_MODES = [
  { value: "static", label: "Static", desc: "Fixed wattage per category" },
  {
    value: "spec_based",
    label: "Spec-Based",
    desc: "Uses product spec values",
  },
  {
    value: "rule_based",
    label: "Rule-Based",
    desc: "Compatibility rules engine",
  },
] as const;

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

const BuilderSettingsTab = memo(function BuilderSettingsTab() {
  const [settings, setSettings] = useState<BuilderSettings>(
    DEFAULT_BUILDER_SETTINGS,
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ settings: BuilderSettings }>("/api/admin/builder-config")
      .then((r) => setSettings({ ...DEFAULT_BUILDER_SETTINGS, ...r.settings }))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await apiFetch("/api/admin/builder-config", {
        method: "POST",
        body: JSON.stringify({ settings }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }, [settings]);

  const handleReset = useCallback(
    () => setSettings(DEFAULT_BUILDER_SETTINGS),
    [],
  );

  const update = useCallback((key: keyof BuilderSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updatePowerDefault = useCallback((key: keyof BuilderSettings["powerDefaults"], value: number) => {
    setSettings((prev) => ({
      ...prev,
      powerDefaults: { ...prev.powerDefaults, [key]: value },
    }));
  }, []);

  const updateTdpBand = useCallback((band: keyof BuilderSettings["tdpBands"], field: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      tdpBands: {
        ...prev.tdpBands,
        [band]: { ...prev.tdpBands[band], [field]: value },
      },
    }));
  }, []);

  const addPricePreset = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      pricePresets: [
        ...prev.pricePresets,
        { id: `custom-${Date.now()}`, label: "New Preset" },
      ],
    }));
  }, []);

  const updatePricePreset = useCallback((index: number, field: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      pricePresets: prev.pricePresets.map((preset, i) =>
        i === index ? { ...preset, [field]: value } : preset
      ),
    }));
  }, []);

  const removePricePreset = useCallback((index: number) => {
    setSettings((prev) => ({
      ...prev,
      pricePresets: prev.pricePresets.filter((_, i) => i !== index),
    }));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
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
            <Settings size={16} />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Builder Settings</h3>
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
        {/* Core Behavior Toggles */}
        <div>
          <h4 className="mb-4 text-sm font-semibold text-slate-900">Core Behavior</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Toggle
              label="Auto-Open Next Category"
              desc="Automatically expand the next category when a component is selected"
              checked={settings.autoOpenNextCategory}
              onChange={(v) => update("autoOpenNextCategory", v)}
            />
            <Toggle
              label="Enforce Compatibility"
              desc="Block incompatible component selections"
              checked={settings.enforceCompatibility}
              onChange={(v) => update("enforceCompatibility", v)}
            />
            <Toggle
              label="Show Warnings"
              desc="Display compatibility warnings for borderline matches"
              checked={settings.showWarnings}
              onChange={(v) => update("showWarnings", v)}
            />
            <Toggle
              label="Allow Incompatible Checkout"
              desc="Let users proceed to checkout even with compatibility issues"
              checked={settings.allowIncompatibleCheckout}
              onChange={(v) => update("allowIncompatibleCheckout", v)}
            />
          </div>
        </div>

        {/* Power Settings */}
        <div className="border-t border-slate-200 pt-8">
          <div className="mb-4 flex items-center gap-2">
            <Zap size={16} className="text-slate-400" />
            <h4 className="text-sm font-semibold text-slate-900">Power Settings</h4>
          </div>

          <div className="space-y-6">
            <div>
              <p className="mb-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Calculation Mode</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {POWER_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => update("powerCalculationMode", mode.value)}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-md border p-4 text-left transition-colors",
                      settings.powerCalculationMode === mode.value
                        ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <p className={cn("text-sm font-medium", settings.powerCalculationMode === mode.value ? "text-slate-900" : "text-slate-700")}>
                      {mode.label}
                    </p>
                    <p className="text-xs text-slate-500">{mode.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Default Wattages (W)</p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                {[
                  { key: "baseWattage", label: "Base System" },
                  { key: "cpuDefaultWattage", label: "CPU Default" },
                  { key: "gpuDefaultWattage", label: "GPU Default" },
                  { key: "ramWattagePerStick", label: "RAM (Per Stick)" },
                  { key: "storageWattagePerDrive", label: "Storage (Per Drive)" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="mb-1.5 block text-xs font-medium text-slate-700">{label}</label>
                    <Input
                      type="number"
                      value={(settings.powerDefaults as any)[key]}
                      onChange={(e) => updatePowerDefault(key as any, Number(e.target.value))}
                      className="h-9 rounded-md border-slate-200 text-sm font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-medium text-slate-500 uppercase tracking-wider">TDP Bands</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <p className="text-sm font-medium text-slate-900">Low Power Band</p>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Max Wattage (W)</label>
                    <Input
                      type="number"
                      value={settings.tdpBands.low.max}
                      onChange={(e) => updateTdpBand("low", "max", Number(e.target.value))}
                      className="h-8 rounded-md border-slate-200 text-xs font-mono bg-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Label</label>
                    <Input
                      type="text"
                      value={settings.tdpBands.low.label}
                      onChange={(e) => updateTdpBand("low", "label", e.target.value)}
                      className="h-8 rounded-md border-slate-200 text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <p className="text-sm font-medium text-slate-900">Balanced Power Band</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">Min (W)</label>
                      <Input
                        type="number"
                        value={settings.tdpBands.balanced.min}
                        onChange={(e) => updateTdpBand("balanced", "min", Number(e.target.value))}
                        className="h-8 rounded-md border-slate-200 text-xs font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">Max (W)</label>
                      <Input
                        type="number"
                        value={settings.tdpBands.balanced.max}
                        onChange={(e) => updateTdpBand("balanced", "max", Number(e.target.value))}
                        className="h-8 rounded-md border-slate-200 text-xs font-mono bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Label</label>
                    <Input
                      type="text"
                      value={settings.tdpBands.balanced.label}
                      onChange={(e) => updateTdpBand("balanced", "label", e.target.value)}
                      className="h-8 rounded-md border-slate-200 text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <p className="text-sm font-medium text-slate-900">High Power Band</p>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Min Wattage (W)</label>
                    <Input
                      type="number"
                      value={settings.tdpBands.high.min}
                      onChange={(e) => updateTdpBand("high", "min", Number(e.target.value))}
                      className="h-8 rounded-md border-slate-200 text-xs font-mono bg-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Label</label>
                    <Input
                      type="text"
                      value={settings.tdpBands.high.label}
                      onChange={(e) => updateTdpBand("high", "label", e.target.value)}
                      className="h-8 rounded-md border-slate-200 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Store Settings */}
        <div className="border-t border-slate-200 pt-8">
          <div className="mb-4 flex items-center gap-2">
            <DollarSign size={16} className="text-slate-400" />
            <h4 className="text-sm font-semibold text-slate-900">Store Settings</h4>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Price Presets</p>
              <div className="space-y-3">
                {settings.pricePresets.map((preset, index) => (
                  <div key={preset.id} className="flex items-center gap-3 rounded-md border border-slate-200 p-2">
                    <Input
                      type="text"
                      value={preset.label}
                      onChange={(e) => updatePricePreset(index, "label", e.target.value)}
                      className="h-8 flex-1 rounded-md border-slate-200 text-xs"
                      placeholder="Label"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono">₹</span>
                      <Input
                        type="number"
                        value={preset.min ?? ""}
                        onChange={(e) => updatePricePreset(index, "min", e.target.value ? Number(e.target.value) : undefined)}
                        className="h-8 w-24 rounded-md border-slate-200 text-xs font-mono"
                        placeholder="Min"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono">- ₹</span>
                      <Input
                        type="number"
                        value={preset.max ?? ""}
                        onChange={(e) => updatePricePreset(index, "max", e.target.value ? Number(e.target.value) : undefined)}
                        className="h-8 w-24 rounded-md border-slate-200 text-xs font-mono"
                        placeholder="Max"
                      />
                    </div>
                    <button
                      onClick={() => removePricePreset(index)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addPricePreset}
                  className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 text-sm font-medium text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900"
                >
                  <Plus size={14} /> Add Preset
                </button>
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-medium text-slate-500 uppercase tracking-wider">UI Defaults</p>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Default Expanded Category</label>
                <Input
                  type="text"
                  value={settings.defaultExpandedCategory ?? ""}
                  onChange={(e) => update("defaultExpandedCategory", e.target.value || null)}
                  placeholder="e.g. Processor (leave empty for none)"
                  className="h-10 rounded-md border-slate-200 text-sm"
                />
              </div>
            </div>
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

export default BuilderSettingsTab;