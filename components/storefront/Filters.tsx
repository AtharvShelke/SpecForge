"use client";

import { Check } from "lucide-react";

import { DynamicCatalogFilter, Category } from "@/types";

type FilterMap = Record<string, string[]>;

interface FiltersProps {
  categories: Category[];
  filters: DynamicCatalogFilter[];
  selectedFilters: FilterMap;
  selectedSubCategoryId: string | null;
  onSubCategoryChange: (value: string | null) => void;
  onFilterToggle: (filterId: string, value: string) => void;
  onClear: () => void;
  activeCount: number;
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-gray-200 py-5 last:border-b-0">
      <h3 className="mb-3 text-sm font-medium text-gray-900">{title}</h3>
      {children}
    </section>
  );
}

export default function Filters({
  categories,
  filters,
  selectedFilters,
  selectedSubCategoryId,
  onSubCategoryChange,
  onFilterToggle,
  onClear,
  activeCount,
}: FiltersProps) {
  return (
    <div className="bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <p className="text-sm font-medium text-gray-900">Filters</p>
          <p className="text-xs text-gray-500">{activeCount} active</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-sm text-gray-500 transition-colors hover:text-gray-900"
        >
          Clear
        </button>
      </div>

      <FilterSection title="Category">
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => onSubCategoryChange(null)}
            className={`text-sm transition-colors ${
              selectedSubCategoryId === null
                ? "text-gray-900"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            All products
          </button>
          {categories.map((category) => (
            <div key={category.id}>
              <p className="mb-2 text-xs uppercase tracking-[0.16em] text-gray-500">
                {category.name}
              </p>
              <div className="space-y-2">
                {(category.subCategories ?? []).map((subCategory) => {
                  const isActive = selectedSubCategoryId === subCategory.id;
                  return (
                    <button
                      key={subCategory.id}
                      type="button"
                      onClick={() =>
                        onSubCategoryChange(isActive ? null : subCategory.id)
                      }
                      className={`block text-left text-sm transition-colors ${
                        isActive
                          ? "text-gray-900"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      {subCategory.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </FilterSection>

      {filters.map((filter, index) => (
        <FilterSection key={`${filter.id}-${index}`} title={filter.label}>
          <div className="space-y-3">
            {filter.options.map((option) => {
              const checked = (selectedFilters[filter.id] ?? []).includes(
                option.value,
              );
              const inputId = `filter-${filter.id}-${option.value}`;

              return (
                <label
                  key={option.value}
                  htmlFor={inputId}
                  className="flex cursor-pointer items-center gap-3 text-sm text-gray-700"
                >
                  <span className="relative flex size-4 shrink-0 items-center justify-center">
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={checked}
                      onChange={() => onFilterToggle(filter.id, option.value)}
                      className="peer size-4 appearance-none rounded-[3px] border border-gray-300 bg-white checked:border-black checked:bg-black"
                    />
                    <Check className="pointer-events-none absolute hidden size-3 text-white peer-checked:block" />
                  </span>
                  <span className="flex-1">{option.label}</span>
                  {typeof option.count === "number" ? (
                    <span className="text-xs text-gray-400">
                      {option.count}
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>
        </FilterSection>
      ))}
    </div>
  );
}
