'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronRight, X, Wrench, Check, Filter, SlidersHorizontal, Search } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Product, FilterDefinition, CategoryFilterConfig, CategoryNode } from '../types';
import { useSearchParams, useRouter } from 'next/navigation';

interface SidebarProps {
  nodes: CategoryNode[];
  onSelect: (node: CategoryNode) => void;
  selectedNode: CategoryNode | null;
  onCloseMobile?: () => void;
  priceRange: { min: number; max: number };
  onPriceChange: (min: number, max: number) => void;
  activeCategory?: string;
  onBuildStepChange?: (category: string) => void;
  currentProducts: Product[];
  dynamicFilters?: { brands: string[], specs: Record<string, string[]> } | null;
  selectedFilters: Record<string, string[]>;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  sidebarSearchTerm: string;
  onSidebarSearchChange: (value: string) => void;
}

// ─── FilterGroup ─────────────────────────────────────────────────────────────
const FilterGroup: React.FC<{
  filter: FilterDefinition;
  products: Product[];
  dynamicOptions?: string[];
  selectedValues: string[];
  onChange: (value: string) => void;
}> = ({ filter, products, dynamicOptions, selectedValues, onChange }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const getProductValue = (p: Product, key: string): string | undefined => {
    if (key === 'stock_status') return p.status === 'IN_STOCK' ? 'In Stock' : 'Out of Stock';
    if (key.startsWith('specs.')) {
      const specKey = key.split('.')[1];
      const spec = p.specs.find(s => s.key === specKey);
      return spec?.value;
    }
    return undefined;
  };

  const options = useMemo(() => {
    if (dynamicOptions && dynamicOptions.length > 0) {
      return dynamicOptions.map(opt => ({ value: opt, count: '' }));
    }
    const counts = new Map<string, number>();
    products.forEach(p => {
      const val = getProductValue(p, filter.key);
      if (val) counts.set(val, (counts.get(val) || 0) + 1);
    });
    const baseOptions = filter.options || Array.from(counts.keys()).sort();
    return baseOptions
      .map(opt => ({ value: opt, count: counts.get(opt) || 0 }))
      // BUG FIX: was `|| filter.options` which is always truthy (array).
      // Should be `|| !filter.options` — only show zero-count rows when
      // options are dynamically derived (no static list provided).
      .filter(o => o.count > 0 || !filter.options);
  }, [products, filter, dynamicOptions]);

  const visibleOptions = showAll ? options : options.slice(0, 5);

  if (options.length === 0) return null;

  return (
    <div className="mb-4 pb-4 border-b border-border/50 last:border-0 last:mb-0 last:pb-0">
      <button
        className="flex items-center justify-between w-full text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5 hover:text-foreground transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span>{filter.label}</span>
        <ChevronDown
          size={13}
          strokeWidth={2.5}
          className={`transition-transform duration-200 text-muted-foreground ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
        />
      </button>

      {isExpanded && (
        <div className="space-y-1.5">
          {visibleOptions.map(option => {
            const checked = selectedValues.includes(option.value);
            // Use a stable unique id so <label htmlFor> wires to the input,
            // and the click reaches onChange exactly ONCE (not twice).
            const inputId = `filter-${filter.key}-${option.value}`;
            return (
              <div key={option.value} className="flex items-center gap-2.5 group/opt">
                {/* BUG FIX: previously had both a div onClick AND a label→input onChange.
                    Both fired on every click → double-toggle → net effect = nothing checked.
                    Now: single native input, label linked by htmlFor, no duplicate handler. */}
                <input
                  type="checkbox"
                  id={inputId}
                  checked={checked}
                  onChange={() => onChange(option.value)}
                  className="sr-only"
                />
                {/* Visual custom checkbox — clicking this label fires the input once */}
                <label
                  htmlFor={inputId}
                  className={`
                    w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                    transition-all cursor-pointer
                    ${checked
                      ? 'bg-primary border-primary'
                      : 'border-input bg-background group-hover/opt:border-primary/60'
                    }
                  `}
                >
                  {checked && <Check size={10} strokeWidth={3} className="text-primary-foreground" />}
                </label>
                <label
                  htmlFor={inputId}
                  className="flex-1 flex justify-between items-center min-w-0 cursor-pointer"
                >
                  <span className={`text-[13px] truncate transition-colors ${checked ? 'text-foreground font-medium' : 'text-foreground/75 group-hover/opt:text-foreground'}`}>
                    {option.value}
                  </span>
                  {option.count !== '' && (
                    <span className={`text-[11px] ml-1.5 tabular-nums flex-shrink-0 ${checked ? 'text-primary/70' : 'text-muted-foreground'}`}>
                      {option.count}
                    </span>
                  )}
                </label>
              </div>
            );
          })}

          {options.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-[12px] text-primary font-medium hover:text-primary/80 pt-1 transition-colors"
            >
              {showAll ? '↑ Show less' : `+ ${options.length - 5} more`}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const Sidebar: React.FC<SidebarProps> = ({
  nodes,
  onSelect,
  selectedNode,
  onCloseMobile,
  priceRange,
  onPriceChange,
  activeCategory,
  onBuildStepChange,
  currentProducts,
  dynamicFilters,
  selectedFilters,
  onFilterChange,
  onClearFilters,
  sidebarSearchTerm,
  onSidebarSearchChange,
}) => {
  const { cart } = useShop();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isBuildMode = searchParams.get('mode') === 'build';

  const [filterConfigs, setFilterConfigs] = useState<CategoryFilterConfig[]>([]);

  // Fetch filter configs
  useEffect(() => {
    if (!activeCategory) {
      setFilterConfigs([]);
      return;
    }

    fetch(`/api/categories/filters?category=${activeCategory}`)
      .then(res => res.json())
      .then(setFilterConfigs)
      .catch(err => console.error('Failed to fetch filter configs:', err));
  }, [activeCategory]);

  const toggleBuildMode = useCallback(() => {
    if (isBuildMode) {
      router.push(window.location.pathname);
    } else {
      router.push(`${window.location.pathname}?mode=build`);
    }
  }, [isBuildMode, router]);

  const categoryFilters = useMemo(() => {
    if (!activeCategory) {
      return [
        { label: 'Brand', key: 'brand', type: 'checkbox' },
        { label: 'Availability', key: 'stock_status', type: 'checkbox', options: ['In Stock', 'Out of Stock'] }
      ] as FilterDefinition[];
    }
    return filterConfigs.find((c: CategoryFilterConfig) => (typeof c.category === 'string' ? c.category : c.category?.slug) === activeCategory)?.filters || [];
  }, [activeCategory, filterConfigs]);

  const visibleFilters = useMemo(() => {
    return categoryFilters.filter((filter: FilterDefinition) => {
      // Support both formats: dependency object (frontend) and dependencyKey/dependencyValue (DB)
      const depKey = filter.dependency?.key || filter.dependencyKey;
      const depValue = filter.dependency?.value || filter.dependencyValue;
      if (!depKey || !depValue) return true;
      const parentSelection = selectedFilters[depKey] || [];
      if (parentSelection.length === 0) return true;
      return parentSelection.includes(depValue);
    });
  }, [categoryFilters, selectedFilters, dynamicFilters]);

  const activeFilterCount = useMemo(() => {
    return Object.values(selectedFilters).reduce((acc, vals) => acc + vals.length, 0);
  }, [selectedFilters]);



  return (
    <div className="h-full flex flex-col bg-card border border-border rounded-lg overflow-hidden">
      {/* ── Scrollbar styles ── */}
      <style>{`
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 4px; }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground) / 0.5); }
      `}</style>

      {/* ── Mobile header ── */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <span className="font-semibold text-sm text-foreground flex items-center gap-2">
          <SlidersHorizontal size={15} strokeWidth={2} />
          Filters
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </span>
        <button
          onClick={onCloseMobile}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Close filters"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>

      {/* ── Mode toggle: Browse / Build ── */}
      {/* <div className="px-3 pt-3 pb-2.5 border-b border-border flex-shrink-0">
        <div className={`
          relative flex p-1 rounded-lg border transition-colors
          ${isBuildMode ? 'bg-primary/5 border-primary/20' : 'bg-muted/50 border-border'}
        `}>
         
          <div
            className={`
              absolute inset-1 w-[calc(50%-2px)] rounded-md bg-background shadow-sm border border-border/50
              transition-transform duration-200
              ${isBuildMode ? 'translate-x-[calc(100%+2px)]' : 'translate-x-0'}
            `}
          />
          <button
            onClick={() => isBuildMode && toggleBuildMode()}
            className={`
              relative flex-1 py-2 text-xs font-medium rounded-md z-10 transition-colors
              ${!isBuildMode ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/70'}
            `}
          >
            Browse
          </button>
          <button
            onClick={() => !isBuildMode && toggleBuildMode()}
            className={`
              relative flex-1 py-2 text-xs font-medium rounded-md z-10 transition-colors flex items-center justify-center gap-1.5
              ${isBuildMode ? 'text-primary' : 'text-muted-foreground hover:text-foreground/70'}
            `}
          >
            <Wrench size={12} strokeWidth={2.5} />
            Build
          </button>
        </div>
      </div> */}

      {/* ── Scrollable body ── */}
      <div className="flex-1 min-h-0 overflow-y-auto sidebar-scroll">
        <div className="p-3">
          {/* Category-Scoped Search */}
          <div className="mb-5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5 px-1">
              Search within {activeCategory ? activeCategory.charAt(0) + activeCategory.slice(1).toLowerCase() : 'Category'}
            </p>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                type="text"
                value={sidebarSearchTerm}
                onChange={e => onSidebarSearchChange(e.target.value)}
                placeholder="Search category..."
                className="
                      w-full rounded-md border border-input bg-background pl-8 pr-3 py-2
                      text-[13px] text-foreground placeholder:text-muted-foreground
                      focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring
                      transition-colors
                    "
              />
              {sidebarSearchTerm && (
                <button
                  onClick={() => onSidebarSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Divider before filters */}
          <div className="border-t border-border/50 mb-5" />

          {/* Filters header */}
          <div className="flex justify-between items-center mb-4">
            <span className="text-[13px] font-semibold text-foreground flex items-center gap-1.5">
              <Filter size={13} strokeWidth={2.5} className="text-muted-foreground" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center px-1.5 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </span>
            {activeFilterCount > 0 && (
              <button
                onClick={onClearFilters}
                className="text-[11px] text-muted-foreground hover:text-destructive transition-colors font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Price Range */}
          <div className="mb-4 pb-4 border-b border-border/50">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">
              Price Range
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={priceRange.min}
                onChange={e => onPriceChange(Number(e.target.value), priceRange.max)}
                className="
                      w-full rounded-md border border-input bg-background px-2.5 py-1.5
                      text-[13px] text-foreground placeholder:text-muted-foreground
                      focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring
                      transition-colors
                    "
                placeholder="Min"
              />
              <span className="text-muted-foreground text-sm flex-shrink-0">—</span>
              <input
                type="number"
                min={0}
                value={priceRange.max}
                onChange={e => onPriceChange(priceRange.min, Number(e.target.value))}
                className="
                      w-full rounded-md border border-input bg-background px-2.5 py-1.5
                      text-[13px] text-foreground placeholder:text-muted-foreground
                      focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring
                      transition-colors
                    "
                placeholder="Max"
              />
            </div>
          </div>

          {/* Dynamic category filters (checkbox, dropdown, etc.) */}
          {visibleFilters
            .filter((f: FilterDefinition) => f.type !== 'search')
            .map((filter: FilterDefinition) => {
              // For filters with duplicate keys (e.g. AMD vs Intel family),
              // use key + dependency value as the unique key
              const depValue = filter.dependency?.value || filter.dependencyValue || '';
              const uniqueKey = depValue ? `${filter.key}__${depValue}` : filter.key;
              const dynamicOpts = filter.key === 'brand' ? dynamicFilters?.brands :
                filter.key.startsWith('specs.') ? dynamicFilters?.specs?.[filter.key.split('.')[1]] : dynamicFilters?.specs?.[filter.key];
              return (
                <FilterGroup
                  key={uniqueKey}
                  filter={filter}
                  products={currentProducts}
                  dynamicOptions={dynamicOpts}
                  selectedValues={selectedFilters[filter.key] || []}
                  onChange={val => onFilterChange(filter.key, val)}
                />
              );
            })}

          {/* Empty state */}
          {visibleFilters.length === 0 && (
            <div className="py-8 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted mb-3">
                <Filter size={16} className="text-muted-foreground" strokeWidth={1.5} />
              </div>
              <p className="text-[12px] text-muted-foreground">
                No filters available
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
