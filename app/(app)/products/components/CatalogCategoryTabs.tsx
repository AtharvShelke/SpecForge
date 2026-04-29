"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";

import { Category } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CatalogCategoryTabsProps {
  categories: Category[];
  selectedCategory: string | null;
  selectedCategoryLabel: string;
  total: number;
  query: string;
  searchInput: string;
  sort: string;
  activeFilterCount: number;
  pageStart: number;
  pageEnd: number;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  onSortChange: (value: string) => void;
  onOpenMobileFilters: () => void;
  onCategoryChange: (value: string | null) => void;
}

export default function CatalogCategoryTabs({
  categories,
  selectedCategory,
  selectedCategoryLabel,
  total,
  query,
  searchInput,
  sort,
  activeFilterCount,
  pageStart,
  pageEnd,
  onSearchChange,
  onSearchClear,
  onSortChange,
  onOpenMobileFilters,
  onCategoryChange,
}: CatalogCategoryTabsProps) {
  return (
    <div className="w-full border border-gray-200 bg-white px-4 py-4 shadow-sm sm:px-5 lg:px-6">
      {/* Header */}
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          {query ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Search results
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
                &ldquo;{query}&rdquo;
              </h1>
            </>
          ) : (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Product catalog
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
                {selectedCategoryLabel}
              </h1>
            </>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Showing {pageStart}-{pageEnd} of {total.toLocaleString()}{" "}
            {total === 1 ? "product" : "products"}
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
          <div className="relative w-full sm:w-[320px] lg:w-[360px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search products, brands, models..."
              className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-9 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
            {searchInput && (
              <button
                type="button"
                onClick={onSearchClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="lg:hidden border-gray-200 bg-white hover:bg-gray-50"
            onClick={onOpenMobileFilters}
          >
            <SlidersHorizontal className="mr-2 size-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1.5 rounded-full bg-gray-900 px-1.5 py-0.5 text-xs text-white">
                {activeFilterCount}
              </span>
            )}
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Sort by</span>
            <Select value={sort} onValueChange={onSortChange}>
              <SelectTrigger className="h-9 w-[170px] border-gray-200 bg-white text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="name-asc">Name: A to Z</SelectItem>
                <SelectItem value="name-desc">Name: Z to A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="border border-gray-200 bg-gray-50/80 p-1.5">
        <div className="flex overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max gap-1.5">
            <button
              type="button"
              onClick={() => onCategoryChange(null)}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                !selectedCategory
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100 hover:text-gray-900"
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
                    "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-gray-900 text-white shadow-sm"
                      : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100 hover:text-gray-900"
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
    </div>
  );
}