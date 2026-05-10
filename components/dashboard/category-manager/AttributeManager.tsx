'use client';

import { useEffect, useMemo, useState } from 'react';
import { BadgeHelp, Filter, GitCompareArrows, HelpCircle, Plus, Save, Sparkles, Wrench } from 'lucide-react';
import { Category, CategoryAttributeDefinition, CategoryAttributesConfig } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CompatibilityManager } from './CompatibilityManager';
import { AttributeEditorModal } from './AttributeEditorModal';

interface AttributeManagerProps {
  categories: Category[];
  selectedCategoryCode: string;
  attributesConfig: CategoryAttributesConfig | null;
  isSaving: boolean;
  onChangeCategory: (categoryCode: string) => void;
  onSave: (attributes: CategoryAttributeDefinition[]) => Promise<void>;
  onOpenHelp: (topic: 'attributes' | 'filters' | 'dependencies' | 'types') => void;
}

const EMPTY_ATTRIBUTE: CategoryAttributeDefinition = {
  key: '',
  label: '',
  type: 'text',
  options: [],
  required: false,
  unit: '',
  sortOrder: 0,
  isFilterable: true,
  isComparable: true,
  filterType: 'dropdown',
  helpText: '',
};

function CardStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-stone-500">
        {icon}
        <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-2xl font-black text-stone-900">{value}</div>
    </div>
  );
}

export function AttributeManager({
  categories,
  selectedCategoryCode,
  attributesConfig,
  isSaving,
  onChangeCategory,
  onSave,
  onOpenHelp,
}: AttributeManagerProps) {
  const [draftAttributes, setDraftAttributes] = useState<CategoryAttributeDefinition[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorValue, setEditorValue] = useState<CategoryAttributeDefinition>(EMPTY_ATTRIBUTE);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    setDraftAttributes(attributesConfig?.attributes ?? []);
  }, [attributesConfig]);

  const dependencyKeys = useMemo(
    () => draftAttributes.map((attribute) => attribute.key).filter(Boolean),
    [draftAttributes]
  );

  const dependencyOptions = useMemo(() => {
    if (!editorValue.dependencyKey) return [];
    return draftAttributes.find((attribute) => attribute.key === editorValue.dependencyKey)?.options ?? [];
  }, [draftAttributes, editorValue.dependencyKey]);

  const comparableCount = useMemo(
    () => draftAttributes.filter((attribute) => attribute.isComparable).length,
    [draftAttributes]
  );

  const filterableCount = useMemo(
    () => draftAttributes.filter((attribute) => attribute.isFilterable).length,
    [draftAttributes]
  );

  const openCreate = () => {
    setEditingIndex(null);
    setEditorValue({ ...EMPTY_ATTRIBUTE, sortOrder: draftAttributes.length });
    setEditorOpen(true);
  };

  const openEdit = (index: number) => {
    setEditingIndex(index);
    setEditorValue(draftAttributes[index]);
    setEditorOpen(true);
  };

  const handleDelete = (index: number) => {
    const target = draftAttributes[index];
    if (!window.confirm(`Delete attribute "${target.label}"?`)) return;
    setDraftAttributes((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleSaveEditor = () => {
    if (!editorValue.key.trim() || !editorValue.label.trim()) return;

    const nextValue: CategoryAttributeDefinition = {
      ...editorValue,
      key: editorValue.key.trim(),
      label: editorValue.label.trim(),
      unit: editorValue.unit?.trim() ?? '',
      helpText: editorValue.helpText?.trim() ?? '',
      options: editorValue.options,
    };

    setDraftAttributes((prev) => {
      if (editingIndex === null) return [...prev, nextValue];
      return prev.map((attribute, index) => (index === editingIndex ? nextValue : attribute));
    });
    setEditorOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-stone-900">Attributes</h2>
              <button type="button" onClick={() => onOpenHelp('attributes')} className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700">
                <HelpCircle size={14} />
              </button>
            </div>
            <p className="text-sm text-stone-500">
              One metadata-driven surface for product fields, filter behavior, comparison support, and attribute dependencies.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={selectedCategoryCode} onValueChange={onChangeCategory}>
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue placeholder="Choose category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.code} value={category.code}>
                    {category.code} · {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
            >
              <Plus size={14} />
              Add Attribute
            </button>
            <button
              type="button"
              onClick={() => onSave(draftAttributes)}
              disabled={isSaving || !selectedCategoryCode}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:opacity-60"
            >
              <Save size={14} />
              {isSaving ? 'Saving…' : 'Save Attributes'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <CardStat icon={<BadgeHelp size={14} />} label="Attributes" value={draftAttributes.length} />
        <CardStat icon={<Filter size={14} />} label="Filterable" value={filterableCount} />
        <CardStat icon={<GitCompareArrows size={14} />} label="Comparable" value={comparableCount} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.8fr_1fr]">
        <div className="space-y-3">
          {draftAttributes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-stone-400 shadow-sm">
                <Sparkles size={18} />
              </div>
              <h3 className="mb-1 text-sm font-bold text-stone-900">No attributes defined yet</h3>
              <p className="mb-4 text-sm text-stone-500">
                Add the first attribute for this category to define product fields and storefront behavior together.
              </p>
              <button type="button" onClick={openCreate} className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-700">
                Add First Attribute
              </button>
            </div>
          ) : (
            draftAttributes
              .slice()
              .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
              .map((attribute, index) => (
                <div key={`${attribute.key}-${index}`} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-stone-900">{attribute.label}</h3>
                        <span className="rounded-full border border-stone-200 bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-stone-600">
                          {attribute.key}
                        </span>
                        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-indigo-700">
                          {attribute.type}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-stone-600">
                        {attribute.required && <span className="rounded-full bg-rose-50 px-2 py-1 text-rose-600">Required</span>}
                        {attribute.isFilterable && <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">Filterable · {attribute.filterType}</span>}
                        {attribute.isComparable && <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">Comparable</span>}
                        {attribute.unit && <span className="rounded-full bg-stone-100 px-2 py-1 text-stone-600">Unit · {attribute.unit}</span>}
                      </div>
                      {attribute.helpText && (
                        <p className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-600">
                          {attribute.helpText}
                        </p>
                      )}
                      {attribute.options.length > 0 && (
                        <p className="text-xs text-stone-500">
                          Options: {attribute.options.join(', ')}
                        </p>
                      )}
                      {attribute.dependencyKey && attribute.dependencyValue && (
                        <p className="text-xs text-stone-500">
                          Dependency: show when <span className="font-semibold text-stone-700">{attribute.dependencyKey}</span> = <span className="font-semibold text-stone-700">{attribute.dependencyValue}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openEdit(index)} className="rounded-xl border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50">
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(index)} className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>

        <div className="space-y-4">
          <CompatibilityManager comparableCount={comparableCount} attributeCount={draftAttributes.length} />
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <Wrench size={15} className="text-stone-400" />
              <h3 className="text-sm font-bold text-stone-900">Admin Model</h3>
            </div>
            <div className="space-y-2 text-sm text-stone-600">
              <p>Attributes replace the old split between schema definitions and filter definitions.</p>
              <p>Every attribute can define data entry, storefront filtering, comparison behavior, and conditional visibility from one record.</p>
            </div>
          </div>
        </div>
      </div>

      <AttributeEditorModal
        open={editorOpen}
        value={editorValue}
        availableDependencyKeys={dependencyKeys}
        dependencyOptions={dependencyOptions}
        onOpenChange={setEditorOpen}
        onChange={setEditorValue}
        onSave={handleSaveEditor}
        onOpenHelp={onOpenHelp}
      />
    </div>
  );
}
