"use client";

import { FormEvent, useMemo, useState } from "react";
import { Check, Search, SlidersHorizontal, X } from "lucide-react";

import { DynamicCatalogFilter } from "@/types";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

type FilterMap = Record<string, string[]>;

interface CatalogFiltersSidebarProps {
  filters: DynamicCatalogFilter[];
  selectedFilters: FilterMap;
  minPrice: number | null;
  maxPrice: number | null;
  activeCount: number;
  total: number;
  onPriceChange: (minPrice: number | null, maxPrice: number | null) => void;
  onFilterToggle: (filterId: string, value: string) => void;
  onClear: () => void;
}

function FilterGroup({
  filter,
  selectedValues,
  onToggle,
}: {
  filter: DynamicCatalogFilter;
  selectedValues: string[];
  onToggle: (value: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const options = showAll ? filter.options : filter.options.slice(0, 8);

  if (filter.options.length === 0) {
    return null;
  }

  return (
    <section className="border-b border-slate-200 py-5 last:border-b-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-slate-900">{filter.label}</h3>
        <span className="text-xs text-slate-400">{filter.options.length}</span>
      </div>

      <div className="space-y-2.5">
        {options.map((option) => {
          const checked = selectedValues.includes(option.value);
          const id = `filter-${filter.id}-${option.value}`;

          return (
            <label
              key={option.value}
              htmlFor={id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors",
                checked ? "bg-slate-100 text-slate-950" : "text-slate-700 hover:bg-slate-50",
              )}
            >
              <span className="relative flex size-4 shrink-0 items-center justify-center">
                <input
                  id={id}
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(option.value)}
                  className="peer size-4 appearance-none rounded-[4px] border border-slate-300 bg-white checked:border-slate-900 checked:bg-slate-900"
                />
                <Check className="pointer-events-none absolute hidden size-3 text-white peer-checked:block" />
              </span>
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              {typeof option.count === "number" ? (
                <span className="text-xs text-slate-400">{option.count}</span>
              ) : null}
            </label>
          );
        })}
      </div>

      {filter.options.length > 8 ? (
        <button
          type="button"
          onClick={() => setShowAll((current) => !current)}
          className="mt-3 text-sm font-medium text-slate-600 hover:text-slate-950"
        >
          {showAll ? "Show less" : `Show ${filter.options.length - 8} more`}
        </button>
      ) : null}
    </section>
  );
}

export default function CatalogFiltersSidebar({
  filters,
  selectedFilters,
  minPrice,
  maxPrice,
  activeCount,
  total,
  onPriceChange,
  onFilterToggle,
  onClear,
}: CatalogFiltersSidebarProps) {
  const activeChips = useMemo(
    () =>
      Object.entries(selectedFilters).flatMap(([filterId, values]) =>
        values.map((value) => ({ filterId, value })),
      ),
    [selectedFilters],
  );

  const applyPrice = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextMin = String(formData.get("minPrice") ?? "").trim();
    const nextMax = String(formData.get("maxPrice") ?? "").trim();

    onPriceChange(
      nextMin ? Number(nextMin) : null,
      nextMax ? Number(nextMax) : null,
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-slate-500" />
            <div>
              <p className="text-sm font-semibold text-slate-950">Filters</p>
              <p className="text-xs text-slate-500">{activeCount} active</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClear} className="h-8 px-2 text-slate-600">
            Reset
          </Button>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-5 px-5 py-5">
          <section className="border-b border-slate-200 pb-5">
            <h3 className="mb-3 text-sm font-medium text-slate-900">Price</h3>
            <form
              key={`${minPrice ?? ""}-${maxPrice ?? ""}`}
              onSubmit={applyPrice}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-2">
                  <span className="text-xs text-slate-500">Min</span>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    name="minPrice"
                    defaultValue={minPrice ?? ""}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-900"
                    placeholder="0"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs text-slate-500">Max</span>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    name="maxPrice"
                    defaultValue={maxPrice ?? ""}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-900"
                    placeholder="50000"
                  />
                </label>
              </div>
              <Button type="submit" variant="outline" className="h-10 w-full">
                Apply price
              </Button>
            </form>
          </section>

          {activeChips.length > 0 ? (
            <section className="border-b border-slate-200 pb-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium text-slate-900">Active filters</h3>
                <span className="text-xs text-slate-400">{activeChips.length}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeChips.map((chip) => (
                  <button
                    key={`${chip.filterId}-${chip.value}`}
                    type="button"
                    onClick={() => onFilterToggle(chip.filterId, chip.value)}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                  >
                    <span>{chip.value}</span>
                    <X className="size-3" />
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {filters.length > 0 ? (
            filters.map((filter) => (
              <FilterGroup
                key={filter.id}
                filter={filter}
                selectedValues={selectedFilters[filter.id] ?? []}
                onToggle={(value) => onFilterToggle(filter.id, value)}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center">
              <Search className="mb-3 size-4 text-slate-400" />
              <p className="text-sm font-medium text-slate-900">No filters available</p>
              <p className="mt-1 text-xs text-slate-500">
                This selection does not expose spec-based filters yet.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Showing results</p>
            <p className="text-sm font-semibold text-slate-950">{total.toLocaleString()} products</p>
          </div>
          <Button variant="outline" size="sm" onClick={onClear} className="h-9">
            Reset all
          </Button>
        </div>
      </div>
    </div>
  );
}
