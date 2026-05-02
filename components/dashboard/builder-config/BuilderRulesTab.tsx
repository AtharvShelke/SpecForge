"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Save,
} from "lucide-react";
import type { BuilderUIRule } from "@/types";
import { BuilderRuleAction } from "@/types";
import { apiFetch } from "@/lib/helpers";
import { useAdmin } from "@/context/AdminContext";
import { cn } from "@/lib/utils";

const OPERATORS = [
  "equals",
  "notEquals",
  "contains",
  "greaterThan",
  "lessThan",
  "in",
];
const ACTIONS = Object.values(BuilderRuleAction);
const ACTION_COLORS: Record<string, string> = {
  HIGHLIGHT: "bg-amber-50 text-amber-700 border-amber-200",
  HIDE_FILTER: "bg-slate-50 text-slate-600 border-slate-200",
  LOCK_CATEGORY: "bg-rose-50 text-rose-700 border-rose-200",
  AUTO_SELECT: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SHOW_WARNING: "bg-orange-50 text-orange-700 border-orange-200",
};

interface RuleFormData {
  name: string;
  category: string;
  specKey: string;
  operator: string;
  value: string;
  action: BuilderRuleAction;
  priority: number;
}

const EMPTY_FORM: RuleFormData = {
  name: "",
  category: "",
  specKey: "",
  operator: "equals",
  value: "",
  action: BuilderRuleAction.HIGHLIGHT,
  priority: 0,
};

const BuilderRulesTab = memo(function BuilderRulesTab() {
  const { subCategories } = useAdmin();
  const [rules, setRules] = useState<BuilderUIRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<RuleFormData>(EMPTY_FORM);

  const groupedCategories = useMemo(() => {
    const map = new Map<string, { id: string; name: string }[]>();
    (subCategories ?? []).forEach((sub: any) => {
      const catName = sub.category?.name ?? "Uncategorized";
      if (!map.has(catName)) map.set(catName, []);
      map.get(catName)!.push({ id: sub.id, name: sub.name });
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [subCategories]);

  const loadRules = useCallback(async () => {
    try {
      const data = await apiFetch<BuilderUIRule[]>("/api/admin/builder-rules");
      setRules(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const handleCreate = useCallback(async () => {
    if (!form.name || !form.category || !form.specKey || !form.value) return;
    try {
      const created = await apiFetch<BuilderUIRule>(
        "/api/admin/builder-rules",
        {
          method: "POST",
          body: JSON.stringify(form),
        },
      );
      setRules((prev) => [created, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch { }
  }, [form]);

  const handleToggle = useCallback(async (rule: BuilderUIRule) => {
    try {
      const updated = await apiFetch<BuilderUIRule>(
        "/api/admin/builder-rules",
        {
          method: "PUT",
          body: JSON.stringify({ id: rule.id, enabled: !rule.enabled }),
        },
      );
      setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch { }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await apiFetch(`/api/admin/builder-rules?id=${id}`, {
        method: "DELETE",
      });
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch { }
  }, []);

  if (loading)
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-slate-100" />
        ))}
      </div>
    );

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Rules Engine</h3>
            <p className="text-xs text-slate-500">{rules.length} rules active</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex h-9 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
        >
          <Plus size={14} /> <span className="hidden sm:inline">New Rule</span>
        </button>
      </div>

      <div className="p-5">
        {showForm && (
          <div className="mb-6 rounded-md border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">Rule Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Highlight AM5"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                >
                  <option value="" disabled>Select category…</option>
                  {groupedCategories.map(([catName, subs]) => (
                    <optgroup key={catName} label={catName}>
                      {subs.map((sub) => (
                        <option key={sub.id} value={sub.name}>{sub.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">Target Spec Key</label>
                <input
                  value={form.specKey}
                  onChange={(e) => setForm((p) => ({ ...p, specKey: e.target.value }))}
                  placeholder="e.g. socket"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-mono focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">Operator</label>
                <select
                  value={form.operator}
                  onChange={(e) => setForm((p) => ({ ...p, operator: e.target.value }))}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                >
                  {OPERATORS.map((op) => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">Value</label>
                <input
                  value={form.value}
                  onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
                  placeholder="e.g. AM5"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>
            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">Action</label>
                <select
                  value={form.action}
                  onChange={(e) => setForm((p) => ({ ...p, action: e.target.value as BuilderRuleAction }))}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                >
                  {ACTIONS.map((a) => (
                    <option key={a} value={a}>{a.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">Priority (Higher runs first)</label>
                <input
                  type="number"
                  value={form.priority}
                  onChange={(e) => setForm((p) => ({ ...p, priority: Number(e.target.value) }))}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
              <button
                onClick={() => {
                  setShowForm(false);
                  setForm(EMPTY_FORM);
                }}
                className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
              >
                <Save size={14} /> Create Rule
              </button>
            </div>
          </div>
        )}

        {rules.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500 border border-dashed border-slate-200 rounded-md">
            No rules configured yet. Add your first rule above.
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={cn(
                  "flex items-center gap-4 rounded-md border p-4 transition-colors",
                  rule.enabled ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50 opacity-60"
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{rule.name}</p>
                    <span
                      className={cn(
                        "rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                        ACTION_COLORS[rule.action] || "border-slate-200 bg-slate-50 text-slate-600"
                      )}
                    >
                      {rule.action.replace("_", " ")}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{rule.category}</span> → {rule.specKey} {rule.operator} "{rule.value}"
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => handleToggle(rule)}
                    className="p-1.5 text-slate-400 transition-colors hover:text-slate-900"
                    title={rule.enabled ? "Disable rule" : "Enable rule"}
                  >
                    {rule.enabled ? <ToggleRight size={20} className="text-emerald-600" /> : <ToggleLeft size={20} />}
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="p-1.5 text-slate-400 transition-colors hover:text-rose-600"
                    title="Delete rule"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default BuilderRulesTab;