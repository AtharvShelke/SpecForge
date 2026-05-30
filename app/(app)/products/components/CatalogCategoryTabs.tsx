"use client";

import { cn } from "@/lib/utils";
import { Category } from "@/hooks/useCategories";

interface Props {
  categories: Category[];
  selectedCategory: string | null;
  onCategoryChange: (value: string | null) => void;
}

export default function CatalogCategoryTabs({
  categories,
  selectedCategory,
  onCategoryChange,
}: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto py-2.5 scrollbar-hide border-b border-zinc-100 bg-white">
      <button
        onClick={() => onCategoryChange(null)}
        className={cn(
          "px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200",
          !selectedCategory
            ? "bg-indigo-600 text-white shadow-sm shadow-indigo-100"
            : "text-zinc-600 hover:text-indigo-600 hover:bg-indigo-50/30"
        )}
      >
        All Products
      </button>

      {categories.map((cat) => {
        const active = selectedCategory === cat.name;

        return (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(active ? null : cat.name)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200",
              active
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-100"
                : "text-zinc-600 hover:text-indigo-600 hover:bg-indigo-50/30"
            )}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}