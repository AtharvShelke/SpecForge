'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Filter, Eye, EyeOff, Save, Check } from 'lucide-react';
import type { FilterOverrideItem, SpecDefinition } from '@/types';

async function fetchJSON<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', ...opts?.headers } });
  if (!res.ok) throw new Error('Request failed');
  if (res.status === 204) return undefined as T;
  return res.json();
}

interface SpecWithCategory extends SpecDefinition {
  categoryName?: string;
}

const BuilderFiltersTab = memo(function BuilderFiltersTab() {
  const [specs, setSpecs] = useState<SpecWithCategory[]>([]);
  const [overrides, setOverrides] = useState<FilterOverrideItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchJSON<SpecWithCategory[]>('/api/catalog/specs').catch(() => []),
      fetchJSON<FilterOverrideItem[]>('/api/admin/builder-filters').catch(() => []),
    ]).then(([specsData, overridesData]) => {
      setSpecs(Array.isArray(specsData) ? specsData : []);
      setOverrides(Array.isArray(overridesData) ? overridesData : []);
    }).finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    specs.forEach(s => {
      const cat = (s as any).subCategory?.category?.name;
      if (cat) set.add(cat);
    });
    return Array.from(set).sort();
  }, [specs]);

  const filteredSpecs = useMemo(() => {
    if (!selectedCategory) return specs.filter(s => s.isFilterable);
    return specs.filter(s => {
      const cat = (s as any).subCategory?.category?.name;
      return cat === selectedCategory && s.isFilterable;
    });
  }, [specs, selectedCategory]);

  const overrideMap = useMemo(() => {
    const map = new Map<string, FilterOverrideItem>();
    overrides.forEach(o => map.set(`${o.specDefinitionId}:${o.categoryName}`, o));
    return map;
  }, [overrides]);

  const getOverride = useCallback((specId: string, category: string) => {
    return overrideMap.get(`${specId}:${category}`);
  }, [overrideMap]);

  const handleSaveOverride = useCallback(async (specId: string, categoryName: string, data: Partial<FilterOverrideItem>) => {
    const key = `${specId}:${categoryName}`;
    setSaving(key);
    try {
      const result = await fetchJSON<FilterOverrideItem>('/api/admin/builder-filters', {
        method: 'POST',
        body: JSON.stringify({ specDefinitionId: specId, categoryName, ...data }),
      });
      setOverrides(prev => {
        const idx = prev.findIndex(o => o.specDefinitionId === specId && o.categoryName === categoryName);
        if (idx >= 0) { const next = [...prev]; next[idx] = result; return next; }
        return [...prev, result];
      });
      setSaved(key);
      setTimeout(() => setSaved(null), 1500);
    } catch {} finally { setSaving(null); }
  }, []);

  if (loading) return <div className="space-y-2 animate-pulse">{[1,2,3,4].map(i => <div key={i} className="h-12 rounded-xl bg-zinc-100" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-indigo-500" />
          <h3 className="text-lg font-bold text-zinc-900">Filter Manager</h3>
          <span className="text-xs text-zinc-400">{filteredSpecs.length} filterable specs</span>
        </div>
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="px-3 py-1.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white min-w-[180px]"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {filteredSpecs.length === 0 ? (
        <div className="text-center py-8 text-zinc-400 text-sm">No filterable specs found. Select a category or add spec definitions.</div>
      ) : (
        <div className="space-y-1.5">
          {filteredSpecs.map(spec => {
            const catName = selectedCategory || (spec as any).subCategory?.category?.name || '';
            const override = catName ? getOverride(spec.id, catName) : null;
            const key = `${spec.id}:${catName}`;
            const isHidden = override?.hidden ?? false;

            return (
              <div key={spec.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isHidden ? 'border-zinc-100 bg-zinc-50 opacity-60' : 'border-zinc-100 bg-white'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-zinc-800">{override?.labelOverride || spec.name}</p>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-zinc-100 text-zinc-500 rounded-full uppercase">{spec.valueType}</span>
                    {spec.isRange && <span className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-100 text-blue-600 rounded-full uppercase">Range</span>}
                    {spec.filterGroup && <span className="px-1.5 py-0.5 text-[9px] font-bold bg-purple-100 text-purple-600 rounded-full uppercase">{override?.groupOverride || spec.filterGroup}</span>}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 font-mono">{(spec as any).subCategory?.category?.name} → {(spec as any).subCategory?.name}</p>
                </div>

                {catName && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="text"
                      placeholder="Label override"
                      defaultValue={override?.labelOverride || ''}
                      onBlur={e => {
                        if (e.target.value !== (override?.labelOverride || '')) {
                          handleSaveOverride(spec.id, catName, { labelOverride: e.target.value || null, hidden: isHidden });
                        }
                      }}
                      className="w-28 px-2 py-1 text-xs border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-200"
                    />
                    <button
                      onClick={() => handleSaveOverride(spec.id, catName, { hidden: !isHidden })}
                      className={`p-1.5 rounded-lg transition-colors ${isHidden ? 'text-zinc-400 hover:text-indigo-500' : 'text-indigo-500 hover:text-zinc-400'}`}
                      title={isHidden ? 'Show filter' : 'Hide filter'}
                    >
                      {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    {saving === key && <Save size={12} className="text-indigo-400 animate-pulse" />}
                    {saved === key && <Check size={12} className="text-emerald-500" />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default BuilderFiltersTab;
