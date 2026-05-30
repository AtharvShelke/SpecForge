"use client";

import { Category, SubCategory } from "@/hooks/useCategories";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CatalogSubcategoryNavProps {
  category: Category | null;
  selectedSubCategoryId: string | null;
  onSubCategoryChange: (value: string | null) => void;
}

export default function CatalogSubcategoryNav({
  category,
  selectedSubCategoryId,
  onSubCategoryChange,
}: CatalogSubcategoryNavProps) {
  const subCategories = category?.subCategories ?? [];

  if (!category || subCategories.length === 0) {
    return null;
  }

  return (
    <div className="mt-3">
      {/* Mobile Select */}
      <div className="sm:hidden">
        <Select
          value={selectedSubCategoryId ?? "all"}
          onValueChange={(value) => onSubCategoryChange(value === "all" ? null : value)}
        >
          <SelectTrigger className="h-9 rounded-lg border-zinc-200 bg-white text-left text-sm">
            <SelectValue placeholder="Select subcategory" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All {category.name}</SelectItem>
            {subCategories.map((subCategory) => (
              <SelectItem key={subCategory.id} value={subCategory.id}>
                {subCategory.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop/Tablet Horizontal Scrollable Row */}
      <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-hide">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mr-2">
          Subcategories:
        </span>
        <button
          type="button"
          onClick={() => onSubCategoryChange(null)}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
            !selectedSubCategoryId
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-100"
              : "text-zinc-600 hover:text-indigo-600 hover:bg-indigo-50/30",
          )}
        >
          All {category.name}
        </button>
        {subCategories.map((subCategory: SubCategory) => {
          const isActive = selectedSubCategoryId === subCategory.id;

          return (
            <button
              key={subCategory.id}
              type="button"
              onClick={() =>
                onSubCategoryChange(isActive ? null : subCategory.id)
              }
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
                isActive
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-100"
                  : "text-zinc-600 hover:text-indigo-600 hover:bg-indigo-50/30",
              )}
              aria-pressed={isActive}
            >
              {subCategory.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
