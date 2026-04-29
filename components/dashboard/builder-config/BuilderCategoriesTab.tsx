'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { Layers, Plus, GripVertical, Pencil, X, Check, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import type { BuilderCategoryConfig } from '@/types';

async function fetchJSON<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', ...opts?.headers } });
  if (!res.ok) throw new Error('Request failed');
  if (res.status === 204) return undefined as T;
  return res.json();
}

interface EditState {
  id: string;
  icon: string;
  shortLabel: string;
  description: string;
  required: boolean;
  allowMultiple: boolean;
  isCore: boolean;
}

const ICON_OPTIONS = [
  'cpu', 'layers', 'hard-drive', 'monitor', 'zap', 'box', 'fan',
  'keyboard', 'wifi', 'shield-question', 'memory-stick', 'server',
  'disc', 'battery', 'plug', 'screen', 'gamepad-2',
];

const CategoryRow = memo(function CategoryRow({
  cat, onToggle, onEdit, onDragStart, onDragOver, onDrop,
}: {
  cat: BuilderCategoryConfig;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (cat: BuilderCategoryConfig) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, cat.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, cat.id)}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
        cat.enabled ? 'border-zinc-100 bg-white' : 'border-zinc-100 bg-zinc-50 opacity-60'
      }`}
    >
      <GripVertical size={14} className="text-zinc-300 cursor-grab shrink-0" />
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 shrink-0">
        <span className="text-xs font-bold text-indigo-600">{cat.shortLabel || cat.categoryName.slice(0, 2)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-zinc-800 truncate">{cat.categoryName}</p>
          {cat.isCore && <span className="px-1.5 py-0.5 text-[9px] font-bold bg-indigo-100 text-indigo-600 rounded-full uppercase">Core</span>}
          {cat.required && <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-600 rounded-full uppercase">Required</span>}
          {cat.allowMultiple && <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-600 rounded-full uppercase">Multi</span>}
        </div>
        <p className="text-xs text-zinc-400 truncate mt-0.5">
          {cat.description || 'No description'} · Icon: {cat.icon || 'none'}
        </p>
      </div>
      <button onClick={() => onEdit(cat)} className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
        <Pencil size={13} />
      </button>
      <button onClick={() => onToggle(cat.id, !cat.enabled)} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 transition-colors">
        {cat.enabled ? <ToggleRight size={18} className="text-indigo-500" /> : <ToggleLeft size={18} />}
      </button>
    </div>
  );
});

const BuilderCategoriesTab = memo(function BuilderCategoriesTab() {
  const [categories, setCategories] = useState<BuilderCategoryConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchJSON<BuilderCategoryConfig[]>('/api/admin/builder-categories');
      setCategories(data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  const handleToggle = useCallback(async (id: string, enabled: boolean) => {
    try {
      await fetchJSON('/api/admin/builder-categories', { method: 'PUT', body: JSON.stringify({ id, enabled }) });
      setCategories(prev => prev.map(c => c.id === id ? { ...c, enabled } : c));
    } catch {}
  }, []);

  const handleEdit = useCallback((cat: BuilderCategoryConfig) => {
    setEditing({
      id: cat.id,
      icon: cat.icon || '',
      shortLabel: cat.shortLabel || '',
      description: cat.description || '',
      required: cat.required,
      allowMultiple: cat.allowMultiple,
      isCore: cat.isCore,
    });
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editing) return;
    try {
      const updated = await fetchJSON<BuilderCategoryConfig>('/api/admin/builder-categories', {
        method: 'PUT',
        body: JSON.stringify({
          id: editing.id,
          icon: editing.icon || null,
          shortLabel: editing.shortLabel || null,
          description: editing.description || null,
          required: editing.required,
          allowMultiple: editing.allowMultiple,
          isCore: editing.isCore,
        }),
      });
      setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
      setEditing(null);
    } catch {}
  }, [editing]);

  const handleAdd = useCallback(async () => {
    if (!newName.trim()) return;
    try {
      const created = await fetchJSON<BuilderCategoryConfig>('/api/admin/builder-categories', {
        method: 'POST',
        body: JSON.stringify({ categoryName: newName.trim(), displayOrder: categories.length }),
      });
      setCategories(prev => [...prev, created]);
      setNewName('');
      setShowAdd(false);
    } catch {}
  }, [newName, categories.length]);

  const handleDragStart = useCallback((_e: React.DragEvent, id: string) => setDragId(id), []);
  const handleDragOver = useCallback((e: React.DragEvent) => e.preventDefault(), []);

  const handleDrop = useCallback(async (_e: React.DragEvent, targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const items = [...categories];
    const fromIdx = items.findIndex(c => c.id === dragId);
    const toIdx = items.findIndex(c => c.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [moved] = items.splice(fromIdx, 1);
    items.splice(toIdx, 0, moved);
    const reordered = items.map((c, i) => ({ ...c, displayOrder: i }));
    setCategories(reordered);
    setDragId(null);
    try {
      await fetchJSON('/api/admin/builder-categories/reorder', {
        method: 'PUT',
        body: JSON.stringify({ items: reordered.map(c => ({ id: c.id, displayOrder: c.displayOrder })) }),
      });
    } catch {}
  }, [dragId, categories]);

  if (loading) return <div className="space-y-2 animate-pulse">{[1,2,3,4,5].map(i => <div key={i} className="h-14 rounded-xl bg-zinc-100" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-indigo-500" />
          <h3 className="text-lg font-bold text-zinc-900">Categories Manager</h3>
          <span className="text-xs text-zinc-400">Drag to reorder</span>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
          <Plus size={12} /> Add
        </button>
      </div>

      {showAdd && (
        <div className="flex gap-2 p-3 border border-indigo-100 bg-indigo-50/50 rounded-xl">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Category name…" className="flex-1 px-3 py-1.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200" onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          <button onClick={handleAdd} className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg"><Check size={12} /></button>
          <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-xs font-semibold text-zinc-500 border border-zinc-200 rounded-lg"><X size={12} /></button>
        </div>
      )}

      <div className="space-y-1.5">
        {categories.map(cat => (
          <CategoryRow key={cat.id} cat={cat} onToggle={handleToggle} onEdit={handleEdit} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} />
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl border shadow-2xl w-full max-w-md p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <h4 className="text-base font-bold text-zinc-900">Edit Category</h4>
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Icon (lucide name)</label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {ICON_OPTIONS.map(ic => (
                  <button key={ic} onClick={() => setEditing(prev => prev ? { ...prev, icon: ic } : null)} className={`px-2 py-1 text-[10px] rounded-md border font-mono ${editing.icon === ic ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50'}`}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Short Label</label>
              <input value={editing.shortLabel} onChange={e => setEditing(prev => prev ? { ...prev, shortLabel: e.target.value } : null)} className="mt-1 w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200" placeholder="e.g. CPU, GPU" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Description</label>
              <textarea value={editing.description} onChange={e => setEditing(prev => prev ? { ...prev, description: e.target.value } : null)} rows={2} className="mt-1 w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none" placeholder="Helper text for build wizard" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['isCore', 'required', 'allowMultiple'] as const).map(flag => (
                <label key={flag} className="flex items-center gap-2 p-2 rounded-lg border border-zinc-100 cursor-pointer hover:bg-zinc-50">
                  <input type="checkbox" checked={editing[flag]} onChange={e => setEditing(prev => prev ? { ...prev, [flag]: e.target.checked } : null)} className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-200" />
                  <span className="text-xs font-medium text-zinc-600 capitalize">{flag === 'isCore' ? 'Core' : flag === 'allowMultiple' ? 'Multi' : flag}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm font-semibold text-zinc-500 border border-zinc-200 rounded-lg hover:bg-zinc-50">Cancel</button>
              <button onClick={handleSaveEdit} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center gap-1.5"><Save size={13} /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default BuilderCategoriesTab;
