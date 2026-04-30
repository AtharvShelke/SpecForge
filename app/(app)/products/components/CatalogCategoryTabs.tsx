"use client";

import Link from "next/link";
import { ArrowLeft, Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Category } from "@/types";

interface Props {
  categories: Category[];
  selectedCategory: string | null;
  selectedCategoryLabel: string;
  total: number;
  searchInput: string;
  sort: string;
  activeFilterCount: number;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  onSortChange: (value: string) => void;
  onOpenMobileFilters: () => void;
  onCategoryChange: (value: string | null) => void;
}

export default function CatalogTopBar({
  categories,
  selectedCategory,
  selectedCategoryLabel,
  total,
  searchInput,
  sort,
  activeFilterCount,
  onSearchChange,
  onSearchClear,
  onSortChange,
  onOpenMobileFilters,
  onCategoryChange,
}: Props) {
  return (
    <div className="border-b border-zinc-100 bg-white px-4 sm:px-5 lg:px-6">
      {/* Top Row */}
      <div className="flex items-center justify-between h-14 gap-3">
        {/* LEFT */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-900 group"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Back</span>
          </Link>

          <div className="h-5 w-px bg-zinc-100 hidden sm:block" />

          <h1 className="text-sm sm:text-base font-bold text-zinc-900 truncate">
            {selectedCategoryLabel}
          </h1>

          <span className="hidden md:inline text-xs text-zinc-400">
            {total.toLocaleString()} products
          </span>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <input
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search..."
              className="h-9 w-[220px] rounded-lg border border-zinc-200 pl-9 pr-8 text-sm focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400"
            />
            {searchInput && (
              <button
                onClick={onSearchClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filters */}
          <button
            onClick={onOpenMobileFilters}
            className="flex items-center gap-1.5 text-sm border border-zinc-200 px-3 h-9 rounded-lg hover:bg-zinc-50"
          >
            <SlidersHorizontal size={14} />
            {activeFilterCount > 0 && (
              <span className="text-xs bg-zinc-900 text-white px-1.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="h-9 text-sm border border-zinc-200 rounded-lg px-2 bg-white"
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price-asc">Price ↑</option>
            <option value="price-desc">Price ↓</option>
          </select>
        </div>
      </div>

      {/* CATEGORY TABS */}
      <div className="flex gap-2 overflow-x-auto py-2 scrollbar-hide">
        <button
          onClick={() => onCategoryChange(null)}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition",
            !selectedCategory
              ? "bg-zinc-900 text-white"
              : "text-zinc-600 hover:bg-zinc-100"
          )}
        >
          All
        </button>

        {categories.map((cat) => {
          const active = selectedCategory === cat.name;

          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(active ? null : cat.name)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition",
                active
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-100"
              )}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}