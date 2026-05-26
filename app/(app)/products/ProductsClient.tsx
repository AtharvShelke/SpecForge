"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

import ProductCard from "@/components/cards/ProductCard";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useShop } from "@/context/ShopContext";
import { useProductFilters } from "@/hooks/useProductFilters";
import { useCatalogListing } from "@/hooks/useCatalogListing";
import { Category } from "@/types";

import CatalogEmptyState from "@/components/storefront/catalog/CatalogEmptyState";
import CatalogLoadingGrid from "@/components/storefront/catalog/CatalogLoadingGrid";
import CatalogPagination from "@/components/storefront/catalog/CatalogPagination";

import CatalogCategoryTabs from "./components/CatalogCategoryTabs";
import CatalogSubcategoryNav from "./components/CatalogSubcategoryNav";
import CatalogFiltersSidebar from "./components/CatalogFiltersSidebar";

function getActiveCategory(
  categories: Category[],
  categoryName: string | null,
  selectedSubCategoryId: string | null,
) {
  if (categoryName) {
    return (
      categories.find(
        (category) =>
          category.name.toLowerCase() === categoryName.toLowerCase(),
      ) ?? null
    );
  }

  if (!selectedSubCategoryId) {
    return null;
  }

  return (
    categories.find((category) =>
      (category.subCategories ?? []).some(
        (subCategory) => subCategory.id === selectedSubCategoryId,
      ),
    ) ?? null
  );
}

export default function ProductsClient() {
  const searchParams = useSearchParams();
  const { categories, refreshCategories } = useShop();

  useEffect(() => {
    if (categories.length === 0) {
      refreshCategories();
    }
  }, [categories.length, refreshCategories]);

  const {
    activeFilterCount,
    category,
    clearFilters,
    limit,
    maxPrice,
    minPrice,
    query,
    selectedFilters,
    selectedSubCategoryId,
    setCategory,
    setPriceRange,
    setSearchQuery,
    setSort,
    setSubCategoryId,
    sort,
    toggleFilterValue,
  } = useProductFilters();

  const [page, setPage] = useState(1);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(query);

  const searchKey = searchParams.toString();
  const activeCategory = useMemo(
    () => getActiveCategory(categories, category, selectedSubCategoryId),
    [categories, category, selectedSubCategoryId],
  );
  const activeCategoryLabel = activeCategory?.name ?? "All products";

  const { products, filters, total, isLoading, totalPages } = useCatalogListing(
    {
      searchKey,
      limit,
      page,
    },
  );

  useEffect(() => {
    setPage(1);
  }, [searchKey]);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="w-full px-4 py-4 sm:px-5 lg:px-6">
        <CatalogCategoryTabs
          categories={categories}
          selectedCategory={activeCategory?.name ?? null}
          selectedCategoryLabel={activeCategoryLabel}
          total={total}
          searchInput={searchInput}
          sort={sort}
          activeFilterCount={activeFilterCount}
          onSearchChange={(value) => {
            setSearchInput(value);
            setSearchQuery(value);
          }}
          onSearchClear={() => {
            setSearchInput("");
            setSearchQuery("");
          }}
          onSortChange={setSort}
          onOpenMobileFilters={() => setIsMobileFiltersOpen(true)}
          onCategoryChange={setCategory}
        />

        <CatalogSubcategoryNav
          category={activeCategory}
          selectedSubCategoryId={selectedSubCategoryId}
          onSubCategoryChange={setSubCategoryId}
        />

        <div className="mt-3 lg:mt-4">
          <div className="grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
            {/* Desktop Filters Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-20">
                <CatalogFiltersSidebar
                  filters={filters}
                  selectedFilters={selectedFilters}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  activeCount={activeFilterCount}
                  total={total}
                  onPriceChange={setPriceRange}
                  onFilterToggle={toggleFilterValue}
                  onClear={clearFilters}
                />
              </div>
            </aside>

            {/* Main Content */}
            <main className="min-w-0">
              {/* Products Grid */}
              {isLoading ? (
                <CatalogLoadingGrid />
              ) : products.length === 0 ? (
                <CatalogEmptyState onClear={clearFilters} />
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {products.map((product, index) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        priority={index < 4}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  <CatalogPagination
                    page={page}
                    totalPages={totalPages}
                    isLoading={isLoading}
                    onPrev={() => setPage((p) => Math.max(1, p - 1))}
                    onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                  />
                </>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Mobile Filters Sheet */}
      <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
        <SheetContent side="left" className="w-full max-w-sm p-0">
          <SheetHeader className="border-b border-gray-100 px-5 py-4">
            <SheetTitle className="flex items-center gap-2">
              <SlidersHorizontal className="size-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {activeFilterCount}
                </span>
              )}
            </SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100dvh-65px)]">
            <CatalogFiltersSidebar
              filters={filters}
              selectedFilters={selectedFilters}
              minPrice={minPrice}
              maxPrice={maxPrice}
              activeCount={activeFilterCount}
              total={total}
              onPriceChange={setPriceRange}
              onFilterToggle={toggleFilterValue}
              onClear={clearFilters}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
