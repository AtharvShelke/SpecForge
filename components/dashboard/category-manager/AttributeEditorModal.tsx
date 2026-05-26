'use client';

import { HelpCircle } from 'lucide-react';
import { CategoryAttributeDefinition, FilterType } from '@/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AttributeEditorModalProps {
  open: boolean;
  value: CategoryAttributeDefinition;
  availableDependencyKeys: string[];
  dependencyOptions: string[];
  onOpenChange: (open: boolean) => void;
  onChange: (value: CategoryAttributeDefinition) => void;
  onSave: () => void;
  onOpenHelp: (topic: 'attributes' | 'filters' | 'dependencies' | 'types') => void;
}

const FILTER_OPTIONS: Array<{ value: FilterType; label: string }> = [
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox list' },
  { value: 'range', label: 'Range' },
  { value: 'boolean', label: 'Boolean toggle' },
  { value: 'search', label: 'Search' },
];

function HintLabel({
  label,
  hint,
}: {
  label: string;
  hint: string;
}) {
  return (
    <div className="mb-1 flex items-center gap-1">
      <span className="text-[11px] font-bold uppercase tracking-widest text-stone-500">{label}</span>
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="rounded-full p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700">
              <HelpCircle size={12} />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs">{hint}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export function AttributeEditorModal({
  open,
  value,
  availableDependencyKeys,
  dependencyOptions,
  onOpenChange,
  onChange,
  onSave,
  onOpenHelp,
}: AttributeEditorModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-stone-200 bg-white sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-stone-900">
            {value.id ? 'Edit Attribute' : 'Add Attribute'}
          </DialogTitle>
          <DialogDescription className="text-sm text-stone-500">
            Define the product metadata contract and filter behavior in one place.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <HintLabel label="Label" hint="Customer-facing field label used in admin forms and storefront filters." />
            <Input value={value.label} onChange={(event) => onChange({ ...value, label: event.target.value })} placeholder="Socket" />
          </div>
          <div className="space-y-1">
            <HintLabel label="Key" hint="Stable machine key stored with product specs. Avoid changing this casually after products exist." />
            <Input value={value.key} onChange={(event) => onChange({ ...value, key: event.target.value })} placeholder="socket" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <HintLabel label="Type" hint="Controls how values are stored and how product-entry UI should behave." />
              <button type="button" onClick={() => onOpenHelp('types')} className="text-xs font-semibold text-indigo-600 hover:underline">
                Type guide
              </button>
            </div>
            <Select value={value.type} onValueChange={(next) => onChange({ ...value, type: next as CategoryAttributeDefinition['type'] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="select">Select</SelectItem>
                <SelectItem value="multi_select">Multi-select</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <HintLabel label="Unit" hint="Optional display suffix for numeric values, such as W, mm, MHz, or cores." />
            <Input value={value.unit ?? ''} onChange={(event) => onChange({ ...value, unit: event.target.value })} placeholder="W" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm text-stone-700">
            <div className="mb-1 font-semibold text-stone-900">Required</div>
            <div className="mb-2 text-xs text-stone-500">Products in this category must provide a value.</div>
            <input type="checkbox" checked={value.required} onChange={(event) => onChange({ ...value, required: event.target.checked })} />
          </label>
          <label className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm text-stone-700">
            <div className="mb-1 flex items-center justify-between font-semibold text-stone-900">
              <span>Filterable</span>
              <button type="button" onClick={() => onOpenHelp('filters')} className="text-xs font-semibold text-indigo-600 hover:underline">
                How it works
              </button>
            </div>
            <div className="mb-2 text-xs text-stone-500">Expose this attribute in storefront filtering.</div>
            <input type="checkbox" checked={value.isFilterable} onChange={(event) => onChange({ ...value, isFilterable: event.target.checked })} />
          </label>
          <label className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm text-stone-700">
            <div className="mb-1 font-semibold text-stone-900">Comparable</div>
            <div className="mb-2 text-xs text-stone-500">Useful for product comparison and compatibility modeling.</div>
            <input type="checkbox" checked={value.isComparable} onChange={(event) => onChange({ ...value, isComparable: event.target.checked })} />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <HintLabel label="Filter Type" hint="Choose how this attribute should be presented when filterable is enabled." />
            <Select
              value={value.filterType ?? 'dropdown'}
              onValueChange={(next) => onChange({ ...value, filterType: next as FilterType })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <HintLabel label="Sort Order" hint="Lower numbers appear first in admin forms and storefront metadata ordering." />
            <Input
              type="number"
              value={value.sortOrder ?? 0}
              onChange={(event) => onChange({ ...value, sortOrder: Number(event.target.value) || 0 })}
              placeholder="0"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <HintLabel label="Dependency Attribute" hint="Optional parent attribute that gates whether this field should appear." />
              <button type="button" onClick={() => onOpenHelp('dependencies')} className="text-xs font-semibold text-indigo-600 hover:underline">
                Dependency guide
              </button>
            </div>
            <Select value={value.dependencyKey ?? 'none'} onValueChange={(next) => onChange({ ...value, dependencyKey: next === 'none' ? undefined : next, dependencyValue: next === 'none' ? undefined : value.dependencyValue })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No dependency</SelectItem>
                {availableDependencyKeys
                  .filter((key) => key !== value.key)
                  .map((key) => (
                    <SelectItem key={key} value={key}>{key}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <HintLabel label="Dependency Value" hint="Only show this attribute when the dependency attribute has this value." />
            <Select value={value.dependencyValue ?? 'none'} onValueChange={(next) => onChange({ ...value, dependencyValue: next === 'none' ? undefined : next })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No dependency value</SelectItem>
                {dependencyOptions.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <HintLabel label="Options" hint="Comma-separated allowed values for select and multi_select attributes." />
          <Textarea
            value={value.options.join(', ')}
            onChange={(event) => onChange({
              ...value,
              options: event.target.value.split(',').map((item) => item.trim()).filter(Boolean),
            })}
            placeholder="AM5, LGA1700"
          />
        </div>

        <div className="space-y-1">
          <HintLabel label="Help Text" hint="Optional guidance shown to admins entering product data for this field." />
          <Textarea
            value={value.helpText ?? ''}
            onChange={(event) => onChange({ ...value, helpText: event.target.value })}
            placeholder="Explain how this value should be entered."
          />
        </div>

        <DialogFooter>
          <button type="button" onClick={() => onOpenChange(false)} className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 transition hover:bg-stone-50">
            Cancel
          </button>
          <button type="button" onClick={onSave} className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-700">
            Save Attribute
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
