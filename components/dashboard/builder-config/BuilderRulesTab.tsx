"use client";

import { useState, useEffect, useCallback, memo } from "react";
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

async function fetchJSON<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts?.headers },
  });
  if (!res.ok) throw new Error("Request failed");
  if (res.status === 204) return undefined as T;
  return res.json();
}

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
  HIGHLIGHT: "bg-amber-100 text-amber-700",
  HIDE_FILTER: "bg-zinc-100 text-zinc-600",
  LOCK_CATEGORY: "bg-red-100 text-red-600",
  AUTO_SELECT: "bg-emerald-100 text-emerald-700",
  SHOW_WARNING: "bg-orange-100 text-orange-700",
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
  const [rules, setRules] = useState<BuilderUIRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<RuleFormData>(EMPTY_FORM);

  const loadRules = useCallback(async () => {
    try {
      const data = await fetchJSON<BuilderUIRule[]>("/api/admin/builder-rules");
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
      const created = await fetchJSON<BuilderUIRule>(
        "/api/admin/builder-rules",
        {
          method: "POST",
          body: JSON.stringify(form),
        },
      );
      setRules((prev) => [created, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch {}
  }, [form]);

  const handleToggle = useCallback(async (rule: BuilderUIRule) => {
    try {
      const updated = await fetchJSON<BuilderUIRule>(
        "/api/admin/builder-rules",
        {
          method: "PUT",
          body: JSON.stringify({ id: rule.id, enabled: !rule.enabled }),
        },
      );
      setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch {}
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await fetchJSON(`/api/admin/builder-rules?id=${id}`, {
        method: "DELETE",
      });
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch {}
  }, []);

  if (loading)
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-zinc-100" />
        ))}
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-indigo-500" />
          <h3 className="text-lg font-bold text-zinc-900">Rules Engine</h3>
          <span className="text-xs text-zinc-400">{rules.length} rules</span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          <Plus size={12} /> New Rule
        </button>
      </div>

      {showForm && (
        <div className="p-4 border border-indigo-100 bg-indigo-50/30 rounded-xl space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Rule name"
              className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <input
              value={form.category}
              onChange={(e) =>
                setForm((p) => ({ ...p, category: e.target.value }))
              }
              placeholder="Category (e.g. Processor)"
              className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input
              value={form.specKey}
              onChange={(e) =>
                setForm((p) => ({ ...p, specKey: e.target.value }))
              }
              placeholder="Spec key (e.g. socket)"
              className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <select
              value={form.operator}
              onChange={(e) =>
                setForm((p) => ({ ...p, operator: e.target.value }))
              }
              className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
            >
              {OPERATORS.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
            <input
              value={form.value}
              onChange={(e) =>
                setForm((p) => ({ ...p, value: e.target.value }))
              }
              placeholder="Value (e.g. AM5)"
              className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.action}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  action: e.target.value as BuilderRuleAction,
                }))
              }
              className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
            >
              {ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a.replace("_", " ")}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={form.priority}
              onChange={(e) =>
                setForm((p) => ({ ...p, priority: Number(e.target.value) }))
              }
              placeholder="Priority"
              className="px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowForm(false);
                setForm(EMPTY_FORM);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-zinc-500 border border-zinc-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg flex items-center gap-1.5"
            >
              <Save size={12} /> Create
            </button>
          </div>
        </div>
      )}

      {rules.length === 0 ? (
        <div className="text-center py-8 text-zinc-400 text-sm">
          No rules configured yet. Add your first rule above.
        </div>
      ) : (
        <div className="space-y-1.5">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${rule.enabled ? "border-zinc-100 bg-white" : "border-zinc-100 bg-zinc-50 opacity-60"}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-zinc-800">
                    {rule.name}
                  </p>
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full uppercase ${ACTION_COLORS[rule.action] || "bg-zinc-100 text-zinc-500"}`}
                  >
                    {rule.action.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                  {rule.category} → {rule.specKey} {rule.operator} &quot;
                  {rule.value}&quot;
                </p>
              </div>
              <button
                onClick={() => handleToggle(rule)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700"
              >
                {rule.enabled ? (
                  <ToggleRight size={18} className="text-indigo-500" />
                ) : (
                  <ToggleLeft size={18} />
                )}
              </button>
              <button
                onClick={() => handleDelete(rule.id)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default BuilderRulesTab;
