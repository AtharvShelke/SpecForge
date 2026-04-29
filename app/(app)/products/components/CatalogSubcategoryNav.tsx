"use client";

import { Category, SubCategory } from "@/types";
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
    <div className="mt-3 border border-slate-200 bg-white">
      <div className="px-4 py-2.5 sm:px-5 lg:px-6">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Browse within {category.name}
          </p>
        </div>

        <div className="sm:hidden">
          <Select
            value={selectedSubCategoryId ?? "all"}
            onValueChange={(value) => onSubCategoryChange(value === "all" ? null : value)}
          >
            <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white text-left">
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

        <div className="hidden overflow-x-auto sm:block">
          <div className="flex min-w-max items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSubCategoryChange(null)}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                !selectedSubCategoryId
                  ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-600 hover:bg-white hover:text-slate-950",
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
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200"
                      : "text-slate-600 hover:bg-white hover:text-slate-950",
                  )}
                  aria-pressed={isActive}
                >
                  {subCategory.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
