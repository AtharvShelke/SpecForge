"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  ChevronDown,
  X,
  Check,
  Filter,
  SlidersHorizontal,
  Search,
  RotateCcw,
} from "lucide-react";
import { CategoryNode } from "../data/categoryTree";
import { DynamicCatalogFilter, Product } from "../types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SidebarProps {
  nodes: CategoryNode[];
  onSelect: (node: CategoryNode | null) => void;
  selectedNode: CategoryNode | null;
  onCloseMobile?: () => void;
  priceRange: { min: number; max: number };
  onPriceChange: (min: number, max: number) => void;
  activeCategory?: string;
  onBuildStepChange?: (category: string) => void;
  currentProducts: Product[];
  dynamicFilters?: DynamicCatalogFilter[] | null;
  selectedFilters: Record<string, string[]>;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  sidebarSearchTerm: string;
  onSidebarSearchChange: (value: string) => void;
}

// ── FilterGroup ───────────────────────────────────────────────────────────────

const FilterGroup: React.FC<{
  filter: DynamicCatalogFilter;
  selectedValues: string[];
  onChange: (value: string) => void;
}> = ({ filter, selectedValues, onChange }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const options = useMemo(
    () =>
      (filter.options ?? []).filter(
        (o) => o.enabled !== false || selectedValues.includes(o.value),
      ),
    [filter.options, selectedValues],
  );

  const VISIBLE_LIMIT = 6;
  const visibleOptions = showAll ? options : options.slice(0, VISIBLE_LIMIT);

  if (options.length === 0) return null;

  return (
    <div className="py-4 border-b border-zinc-100 last:border-b-0 last:pb-0">
      {/* Section header */}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        aria-expanded={isExpanded}
        className="flex w-full items-center justify-between group mb-0"
      >
        <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-zinc-400 group-hover:text-zinc-600 transition-colors">
          {filter.label}
        </span>
        <span
          className={`flex items-center justify-center w-5 h-5 rounded-full text-zinc-300 group-hover:text-zinc-500 group-hover:bg-zinc-100 transition-all ${
            isExpanded ? "" : "rotate-[-90deg]"
          }`}
        >
          <ChevronDown size={12} strokeWidth={2.5} />
        </span>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-0.5">
          {visibleOptions.map((option) => {
            const checked = selectedValues.includes(option.value);
            const id = `filter-${filter.key}-${option.value}`;
            const disabled = option.enabled === false;

            return (
              <label
                key={option.value}
                htmlFor={id}
                className={`flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer group transition-colors select-none
                  ${checked ? "bg-zinc-50" : "hover:bg-zinc-50/70"}
                  ${disabled ? "opacity-40 pointer-events-none" : ""}`}
              >
                {/* Custom checkbox */}
                <input
                  type="checkbox"
                  id={id}
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onChange(option.value)}
                  className="sr-only"
                />
                <span
                  className={`flex-shrink-0 flex items-center justify-center w-[18px] h-[18px] rounded-[5px] border transition-all
                    ${
                      checked
                        ? "bg-zinc-900 border-zinc-900"
                        : "border-zinc-200 bg-white group-hover:border-zinc-300"
                    }`}
                >
                  {checked && (
                    <Check size={10} strokeWidth={3} className="text-white" />
                  )}
                </span>

                {/* Label */}
                <span
                  className={`flex-1 text-[0.85rem] leading-none transition-colors truncate
                    ${checked ? "text-zinc-900 font-medium" : "text-zinc-600 group-hover:text-zinc-800"}`}
                >
                  {option.label}
                </span>

                {/* Count badge */}
                {typeof option.count === "number" && (
                  <span
                    className={`flex-shrink-0 text-[0.65rem] font-semibold tabular-nums px-1.5 py-0.5 rounded-full
                      ${checked ? "bg-zinc-200 text-zinc-700" : "bg-zinc-100 text-zinc-400"}`}
                  >
                    {option.count}
                  </span>
                )}
              </label>
            );
          })}

          {options.length > VISIBLE_LIMIT && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="mt-1 flex items-center gap-1 pl-2 py-1 text-[0.78rem] font-semibold text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              <ChevronDown
                size={12}
                strokeWidth={2.5}
                className={`transition-transform ${showAll ? "rotate-180" : ""}`}
              />
              {showAll
                ? "Show less"
                : `+${options.length - VISIBLE_LIMIT} more`}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

function NoMatchingSpecs() {
  return (
    <div className="py-10 flex flex-col items-center text-center">
      <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
        <Filter size={15} strokeWidth={1.75} className="text-zinc-300" />
      </div>
      <p className="text-[0.82rem] font-medium text-zinc-400 leading-relaxed">
        No matching specs found
      </p>
      <p className="mt-1 text-[0.72rem] text-zinc-300">
        Try a different search term.
      </p>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

const Sidebar: React.FC<SidebarProps> = ({
  nodes,
  onSelect,
  selectedNode,
  onCloseMobile,
  priceRange,
  onPriceChange,
  activeCategory,
  dynamicFilters,
  selectedFilters,
  onFilterChange,
  onClearFilters,
  sidebarSearchTerm,
  onSidebarSearchChange,
}) => {
  // ── Derived state ──────────────────────────────────────────────────────────
  const normalizedSidebarSearchTerm = sidebarSearchTerm.trim().toLowerCase();

  const visibleFilters = useMemo(
    () =>
      (dynamicFilters ?? []).filter((filter) => {
        const passesDependency =
          !filter.dependencies?.length ||
          filter.dependencies.every((dep) => {
            const sel = selectedFilters[dep.filterId] ?? [];
            return sel.length === 0 || dep.values.some((v) => sel.includes(v));
          });

        if (!passesDependency) return false;
        if (!normalizedSidebarSearchTerm) return true;
        if (filter.label.toLowerCase().includes(normalizedSidebarSearchTerm)) {
          return true;
        }

        return (filter.options ?? []).some((option) =>
          option.label.toLowerCase().includes(normalizedSidebarSearchTerm),
        );
      }),
    [dynamicFilters, selectedFilters, normalizedSidebarSearchTerm],
  );

  const hasDynamicFilters = (dynamicFilters?.length ?? 0) > 0;
  const hasMatchingVisibleFilters = visibleFilters.length > 0;
  const hasSpecSearch = normalizedSidebarSearchTerm.length > 0;

  const activeFilterCount = useMemo(
    () => Object.values(selectedFilters).reduce((acc, v) => acc + v.length, 0),
    [selectedFilters],
  );

  const hasAnyFilter = activeFilterCount > 0 || sidebarSearchTerm.length > 0;

  // Auto-focus search on mount if it was pre-populated
  const searchRef = useRef<HTMLInputElement>(null);

  return (
    /*
     * KEY LAYOUT DECISION:
     * The sidebar uses `sticky top-4 h-[calc(100vh-2rem)]` so it stays
     * in the viewport while the product grid scrolls. Internally it uses
     * a flex-col layout: fixed header + independently scrollable body.
     * This eliminates the "scroll the whole page" problem.
     */
    <aside className="sticky top-4 flex flex-col h-[calc(100vh-2rem)] w-full">
      {/* ── Outer shell ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col h-full overflow-hidden rounded-2xl bg-white border border-zinc-200/80 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.12)]">
        {/* ── HEADER (non-scrolling) ─────────────────────────────────────────── */}
        <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-zinc-100">
          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal
                size={14}
                strokeWidth={2.25}
                className="text-zinc-400"
              />
              <span className="text-[0.8rem] font-bold text-zinc-800 tracking-[-0.01em]">
                Filters
              </span>
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-zinc-900 text-white text-[0.6rem] font-bold tabular-nums">
                  {activeFilterCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {hasAnyFilter && (
                <button
                  onClick={() => {
                    onClearFilters();
                    onSidebarSearchChange("");
                  }}
                  className="flex items-center gap-1 text-[0.72rem] font-semibold text-zinc-400 hover:text-rose-500 transition-colors"
                  title="Clear all filters"
                >
                  <RotateCcw size={11} strokeWidth={2.5} />
                  Reset
                </button>
              )}
              {/* Mobile close */}
              <button
                onClick={onCloseMobile}
                className="md:hidden flex items-center justify-center w-7 h-7 rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                aria-label="Close filters"
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Context chip */}
          <div className="flex items-center gap-2">
            <span className="text-[0.72rem] text-zinc-400 font-medium">
              Browsing
            </span>
            <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-[0.72rem] font-semibold text-zinc-700 truncate max-w-[140px]">
              {activeCategory || "All Products"}
            </span>
          </div>
        </div>

        {/* ── SCROLLABLE BODY ──────────────────────────────────────────────────
            This is the critical fix: only THIS section scrolls, not the page.
        ──────────────────────────────────────────────────────────────────── */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-5"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#e4e4e7 transparent",
          }}
        >
          {/* ── Subcategory selector ─────────────────────────────────────────── */}
          {nodes.length > 0 && (
            <section>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-zinc-400 mb-2">
                Subcategory
              </p>
              <div className="relative">
                <select
                  value={selectedNode?.subCategoryId ?? ""}
                  onChange={(e) => {
                    const next =
                      nodes.find((n) => n.subCategoryId === e.target.value) ??
                      null;
                    onSelect(next);
                  }}
                  className="h-10 w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 pr-9 text-[0.85rem] font-medium text-zinc-800 outline-none transition-all focus:border-zinc-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)] cursor-pointer"
                >
                  <option value="">All subcategories</option>
                  {nodes.map((n) => (
                    <option
                      key={n.subCategoryId ?? n.label}
                      value={n.subCategoryId ?? ""}
                    >
                      {n.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />
              </div>
            </section>
          )}

          {/* ── Search within category ──────────────────────────────────────── */}
          <section>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-zinc-400 mb-2">
              Search here
            </p>
            <div className="relative">
              <Search
                size={13}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300"
              />
              <input
                ref={searchRef}
                type="text"
                value={sidebarSearchTerm}
                onChange={(e) => onSidebarSearchChange(e.target.value)}
                placeholder="e.g. RTX 4070, DDR5…"
                className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-9 text-[0.85rem] text-zinc-800 placeholder:text-zinc-300 outline-none transition-all focus:border-zinc-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]"
              />
              {sidebarSearchTerm && (
                <button
                  onClick={() => onSidebarSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full text-zinc-300 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                  aria-label="Clear search"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          </section>

          {/* ── Divider ─────────────────────────────────────────────────────── */}
          <div className="border-t border-zinc-100" />

          {/* ── Price range ─────────────────────────────────────────────────── */}
          <section>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-zinc-400 mb-3">
              Price range
            </p>
            <div className="grid grid-cols-[1fr_16px_1fr] items-center gap-1">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[0.75rem] text-zinc-400 font-medium pointer-events-none">
                  ₹
                </span>
                <input
                  type="number"
                  min={0}
                  value={priceRange.min || ""}
                  onChange={(e) =>
                    onPriceChange(Number(e.target.value), priceRange.max)
                  }
                  placeholder="Min"
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-6 pr-2 text-[0.85rem] text-zinc-800 outline-none transition-all focus:border-zinc-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <span className="text-center text-zinc-300 text-sm font-light select-none">
                –
              </span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[0.75rem] text-zinc-400 font-medium pointer-events-none">
                  ₹
                </span>
                <input
                  type="number"
                  min={0}
                  value={priceRange.max || ""}
                  onChange={(e) =>
                    onPriceChange(priceRange.min, Number(e.target.value))
                  }
                  placeholder="Max"
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-6 pr-2 text-[0.85rem] text-zinc-800 outline-none transition-all focus:border-zinc-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          </section>

          {/* ── Dynamic filter groups ────────────────────────────────────────── */}
          {hasMatchingVisibleFilters ? (
            <section>
              {visibleFilters.map((filter, i) => (
                <FilterGroup
                  key={`${filter.id}-${i}`}
                  filter={filter}
                  selectedValues={selectedFilters[filter.id] ?? []}
                  onChange={(value) => onFilterChange(filter.id, value)}
                />
              ))}
            </section>
          ) : hasDynamicFilters && hasSpecSearch ? (
            <NoMatchingSpecs />
          ) : (
            /* Empty state — only shown when no filters exist at all */
            <div className="py-10 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
                <Filter
                  size={15}
                  strokeWidth={1.75}
                  className="text-zinc-300"
                />
              </div>
              <p className="text-[0.82rem] text-zinc-400 leading-relaxed">
                No filters available
                <br />
                for this category yet.
              </p>
            </div>
          )}

          {/* Bottom padding buffer so last item doesn't sit flush at scroll end */}
          <div className="h-2" />
        </div>

        {/* ── FOOTER — active filter summary (non-scrolling) ──────────────────
            Appears only when filters are active. Shows quick-remove chips
            so the user can see what's applied without scrolling back up.
        ──────────────────────────────────────────────────────────────────── */}
        {activeFilterCount > 0 && (
          <div className="flex-shrink-0 border-t border-zinc-100 px-4 py-3 bg-zinc-50/80">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-zinc-400">
                Active filters
              </p>
              <button
                onClick={onClearFilters}
                className="text-[0.7rem] font-semibold text-zinc-400 hover:text-rose-500 transition-colors"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(selectedFilters).map(([key, values]) =>
                values.map((val) => (
                  <button
                    key={`${key}-${val}`}
                    onClick={() => onFilterChange(key, val)}
                    className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full bg-zinc-900 text-white text-[0.68rem] font-medium transition-colors hover:bg-zinc-700 group"
                  >
                    <span className="max-w-[90px] truncate">{val}</span>
                    <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors">
                      <X size={8} strokeWidth={2.5} />
                    </span>
                  </button>
                )),
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
