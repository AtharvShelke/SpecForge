'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { Settings, Save, RotateCcw, Check } from 'lucide-react';
import type { BuilderSettings } from '@/types';
import { DEFAULT_BUILDER_SETTINGS } from '@/types';

async function fetchJSON<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', ...opts?.headers } });
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}

const POWER_MODES = [
  { value: 'static', label: 'Static', desc: 'Fixed wattage per category' },
  { value: 'spec_based', label: 'Spec-Based', desc: 'Uses product spec values' },
  { value: 'rule_based', label: 'Rule-Based', desc: 'Compatibility rules engine' },
] as const;

const Toggle = memo(({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-100 hover:border-zinc-200 transition-colors cursor-pointer">
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`mt-0.5 relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-zinc-200'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
    </button>
    <div className="min-w-0">
      <p className="text-sm font-semibold text-zinc-800">{label}</p>
      <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>
    </div>
  </label>
));
Toggle.displayName = 'Toggle';

const BuilderSettingsTab = memo(function BuilderSettingsTab() {
  const [settings, setSettings] = useState<BuilderSettings>(DEFAULT_BUILDER_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJSON<{ settings: BuilderSettings }>('/api/admin/builder-config')
      .then((r) => setSettings({ ...DEFAULT_BUILDER_SETTINGS, ...r.settings }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await fetchJSON('/api/admin/builder-config', {
        method: 'POST',
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

  const handleReset = useCallback(() => setSettings(DEFAULT_BUILDER_SETTINGS), []);

  const update = useCallback((key: keyof BuilderSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1,2,3,4].map(i => <div key={i} className="h-16 rounded-xl bg-zinc-100" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings size={18} className="text-indigo-500" />
          <h3 className="text-lg font-bold text-zinc-900">Builder Settings</h3>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-500 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
            <RotateCcw size={12} /> Reset
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {saved ? <><Check size={12} /> Saved</> : <><Save size={12} /> {saving ? 'Saving…' : 'Save'}</>}
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        <Toggle
          label="Auto-Open Next Category"
          desc="Automatically expand the next category when a component is selected"
          checked={settings.autoOpenNextCategory}
          onChange={(v) => update('autoOpenNextCategory', v)}
        />
        <Toggle
          label="Enforce Compatibility"
          desc="Block incompatible component selections"
          checked={settings.enforceCompatibility}
          onChange={(v) => update('enforceCompatibility', v)}
        />
        <Toggle
          label="Show Warnings"
          desc="Display compatibility warnings for borderline matches"
          checked={settings.showWarnings}
          onChange={(v) => update('showWarnings', v)}
        />
        <Toggle
          label="Allow Incompatible Checkout"
          desc="Let users proceed to checkout even with compatibility issues"
          checked={settings.allowIncompatibleCheckout}
          onChange={(v) => update('allowIncompatibleCheckout', v)}
        />
      </div>

      <div>
        <p className="text-sm font-semibold text-zinc-700 mb-2">Power Calculation Mode</p>
        <div className="grid gap-2">
          {POWER_MODES.map((mode) => (
            <button
              key={mode.value}
              onClick={() => update('powerCalculationMode', mode.value)}
              className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                settings.powerCalculationMode === mode.value
                  ? 'border-indigo-200 bg-indigo-50 ring-1 ring-indigo-200'
                  : 'border-zinc-100 hover:border-zinc-200'
              }`}
            >
              <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                settings.powerCalculationMode === mode.value ? 'border-indigo-600' : 'border-zinc-300'
              }`}>
                {settings.powerCalculationMode === mode.value && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-800">{mode.label}</p>
                <p className="text-xs text-zinc-400">{mode.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-zinc-700 mb-2">Default Expanded Category</p>
        <input
          type="text"
          value={settings.defaultExpandedCategory ?? ''}
          onChange={(e) => update('defaultExpandedCategory', e.target.value || null)}
          placeholder="e.g. Processor (leave empty for none)"
          className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
        />
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

export default BuilderSettingsTab;
