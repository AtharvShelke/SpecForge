"use client";

import { Category } from "@/types";
import { cn } from "@/lib/utils";

interface CatalogCategoryTabsProps {
  categories: Category[];
  selectedCategory: string | null;
  selectedCategoryLabel: string;
  total: number;
  query: string;
  onCategoryChange: (value: string | null) => void;
}

export default function CatalogCategoryTabs({
  categories,
  selectedCategory,
  selectedCategoryLabel,
  total,
  query,
  onCategoryChange,
}: CatalogCategoryTabsProps) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex items-end justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Product Catalog
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-2xl font-semibold text-slate-950 sm:text-[30px]">
              {query ? `Search results for "${query}"` : selectedCategoryLabel}
            </h1>
            <span className="text-sm text-slate-500">{total.toLocaleString()} products</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto px-4 pb-4 sm:px-6 lg:px-8">
        <div className="flex min-w-max items-center gap-2">
          <button
            type="button"
            onClick={() => onCategoryChange(null)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              !selectedCategory
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100",
            )}
          >
            All Categories
          </button>
          {categories.map((category) => {
            const isActive = selectedCategory === category.name;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onCategoryChange(isActive ? null : category.name)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                )}
                aria-pressed={isActive}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
