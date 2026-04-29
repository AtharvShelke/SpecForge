"use client";

import { FormEvent, useMemo, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

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

interface PriceRangeSectionProps {
  minPrice: number | null;
  maxPrice: number | null;
  onPriceChange: (minPrice: number | null, maxPrice: number | null) => void;
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
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const options = showAll ? filter.options : filter.options.slice(0, 6);

  if (filter.options.length === 0) {
    return null;
  }

  const selectedCount = selectedValues.length;

  return (
    <div className="border-b border-gray-100 py-5 last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900">{filter.label}</h3>
          {selectedCount > 0 && (
            <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
              {selectedCount}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "size-4 text-gray-400 transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-1.5">
          {options.map((option) => {
            const checked = selectedValues.includes(option.value);
            const id = `filter-${filter.id}-${option.value}`;

            return (
              <label
                key={option.value}
                htmlFor={id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors",
                  checked
                    ? "bg-gray-50 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <div className="relative flex size-4 shrink-0 items-center justify-center">
                  <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(option.value)}
                    className="peer size-4 appearance-none rounded border border-gray-300 bg-white checked:border-gray-900 checked:bg-gray-900"
                  />
                  <Check className="pointer-events-none absolute hidden size-3 text-white peer-checked:block" />
                </div>
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {typeof option.count === "number" && (
                  <span className="text-xs text-gray-400">{option.count}</span>
                )}
              </label>
            );
          })}
        </div>
      )}

      {filter.options.length > 6 && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="mt-3 text-xs font-medium text-gray-500 hover:text-gray-900"
        >
          {showAll ? "Show less" : `Show ${filter.options.length - 6} more`}
        </button>
      )}
    </div>
  );
}

function PriceRangeSection({
  minPrice,
  maxPrice,
  onPriceChange,
}: PriceRangeSectionProps) {
  const [localMinPrice, setLocalMinPrice] = useState<string>(
    minPrice?.toString() ?? ""
  );
  const [localMaxPrice, setLocalMaxPrice] = useState<string>(
    maxPrice?.toString() ?? ""
  );

  const applyPrice = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onPriceChange(
      localMinPrice ? Number(localMinPrice) : null,
      localMaxPrice ? Number(localMaxPrice) : null
    );
  };

  return (
    <div className="border-b border-gray-100 pb-5">
      <h3 className="mb-3 text-sm font-medium text-gray-900">Price range</h3>
      <form onSubmit={applyPrice} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Min (₹)</label>
            <input
              type="number"
              min={0}
              step={100}
              value={localMinPrice}
              onChange={(e) => setLocalMinPrice(e.target.value)}
              placeholder="0"
              className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Max (₹)</label>
            <input
              type="number"
              min={0}
              step={100}
              value={localMaxPrice}
              onChange={(e) => setLocalMaxPrice(e.target.value)}
              placeholder="Any"
              className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="w-full border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          >
            Apply
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            onClick={() => {
              setLocalMinPrice("");
              setLocalMaxPrice("");
              onPriceChange(null, null);
            }}
          >
            Reset
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: "Under ₹25k", max: 25000 },
            { label: "Under ₹50k", max: 50000 },
            { label: "₹50k - ₹1L", min: 50000, max: 100000 },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setLocalMinPrice(
                  typeof preset.min === "number" ? String(preset.min) : ""
                );
                setLocalMaxPrice(
                  typeof preset.max === "number" ? String(preset.max) : ""
                );
                onPriceChange(preset.min ?? null, preset.max ?? null);
              }}
              className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </form>
    </div>
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
        values.map((value) => {
          const filter = filters.find((f) => f.id === filterId);
          const option = filter?.options.find((o) => o.value === value);
          return {
            filterId,
            value,
            label: option?.label ?? value,
          };
        })
      ),
    [selectedFilters, filters]
  );

  return (
    <div className="border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-100 px-4 py-4 xl:px-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Filters</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {activeCount} {activeCount === 1 ? "filter" : "filters"} active
            </p>
          </div>
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-8 text-xs text-gray-500 hover:text-gray-900"
            >
              Clear all
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-170px)]">
        <div className="px-4 py-4 xl:px-5">
          <PriceRangeSection
            key={`${minPrice ?? ""}-${maxPrice ?? ""}`}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onPriceChange={onPriceChange}
          />

          {/* Active Filters Chips */}
          {activeChips.length > 0 && (
            <div className="border-b border-gray-100 pb-5 mb-2">
              <h3 className="mb-3 text-sm font-medium text-gray-900">Active filters</h3>
              <div className="flex flex-wrap gap-2">
                {activeChips.map((chip) => (
                  <button
                    key={`${chip.filterId}-${chip.value}`}
                    onClick={() => onFilterToggle(chip.filterId, chip.value)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    {chip.label}
                    <X className="size-3" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic Filters */}
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
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/30 px-4 py-8 text-center">
              <Search className="mb-2 size-5 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">No filters available</p>
              <p className="mt-1 text-xs text-gray-400">
                Select a category to see filters
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3 xl:px-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total products</span>
          <span className="font-semibold text-gray-900">{total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}