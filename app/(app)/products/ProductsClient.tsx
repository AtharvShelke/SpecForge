"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";

import ProductCard from "@/components/cards/ProductCard";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useShop } from "@/context/ShopContext";
import { useProductFilters } from "@/hooks/useProductFilters";
import { CatalogListingResult, Category, DynamicCatalogFilter, Product } from "@/types";

import CatalogCategoryTabs from "./components/CatalogCategoryTabs";
import CatalogSubcategoryNav from "./components/CatalogSubcategoryNav";
import CatalogFiltersSidebar from "./components/CatalogFiltersSidebar";

type CatalogResponse = CatalogListingResult & {
  nextCursor?: string | null;
};

function LoadingGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
        >
          <div className="aspect-square animate-pulse bg-gradient-to-br from-gray-50 to-gray-100" />
          <div className="space-y-3 p-4">
            <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/30 px-6 text-center">
      <div className="rounded-full bg-gray-100 p-4">
        <SlidersHorizontal className="size-6 text-gray-400" />
      </div>
      <p className="mt-4 text-lg font-medium text-gray-900">No products found</p>
      <p className="mt-1 text-sm text-gray-500">
        Try adjusting your filters or search term
      </p>
      <Button
        variant="outline"
        className="mt-6 border-gray-200 bg-white hover:bg-gray-50"
        onClick={onClear}
      >
        Clear all filters
      </Button>
    </div>
  );
}

function getActiveCategory(
  categories: Category[],
  categoryName: string | null,
  selectedSubCategoryId: string | null,
) {
  if (categoryName) {
    return (
      categories.find(
        (category) => category.name.toLowerCase() === categoryName.toLowerCase(),
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
  const { categories } = useShop();
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
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<DynamicCatalogFilter[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(query);

  const searchKey = searchParams.toString();
  const activeCategory = useMemo(
    () => getActiveCategory(categories, category, selectedSubCategoryId),
    [categories, category, selectedSubCategoryId],
  );
  const activeCategoryLabel = activeCategory?.name ?? "All products";
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const pageStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const pageEnd = Math.min(page * limit, total);

  useEffect(() => {
    setPage(1);
  }, [searchKey]);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      setIsLoading(true);

      try {
        const params = new URLSearchParams(searchKey);
        params.set("limit", String(limit));
        params.set("cursor", String((page - 1) * limit));

        const response = await fetch(`/api/catalog/products?${params.toString()}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load catalog");
        }

        const payload = (await response.json()) as CatalogResponse;
        if (cancelled) {
          return;
        }

        setProducts(payload.products);
        setFilters(payload.filters);
        setTotal(payload.total);
      } catch {
        if (cancelled) {
          return;
        }

        setProducts([]);
        setFilters([]);
        setTotal(0);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [limit, page, searchKey]);

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
          query={query}
          searchInput={searchInput}
          sort={sort}
          activeFilterCount={activeFilterCount}
          pageStart={pageStart}
          pageEnd={pageEnd}
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
                <LoadingGrid />
              ) : products.length === 0 ? (
                <EmptyState onClear={clearFilters} />
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
                  {totalPages > 1 && (
                    <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                      <p className="text-sm text-gray-500">
                        Page {page} of {totalPages}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page <= 1 || isLoading}
                          className="border-gray-200 bg-white hover:bg-gray-50"
                        >
                          <ArrowLeft className="mr-1 size-3.5" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page >= totalPages || isLoading}
                          className="border-gray-200 bg-white hover:bg-gray-50"
                        >
                          Next
                          <ArrowRight className="ml-1 size-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
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