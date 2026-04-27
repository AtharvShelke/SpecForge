"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpDown, SlidersHorizontal } from "lucide-react";

import ProductCard from "@/components/cards/ProductCard";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 12 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
          <div className="aspect-square animate-pulse bg-slate-100" />
          <div className="space-y-3 p-4">
            <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
      <div>
        <p className="text-lg font-semibold text-slate-950">No products found</p>
        <p className="mt-2 text-sm text-slate-500">
          Try removing a few filters or broadening your selection.
        </p>
        <Button variant="outline" className="mt-6" onClick={onClear}>
          Reset filters
        </Button>
      </div>
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
    <section className="bg-slate-100 [--products-shell-offset:7.75rem] md:[--products-shell-offset:4.75rem]">
      <div className="h-[calc(100dvh-var(--products-shell-offset))] overflow-hidden">
        <div className="flex h-full min-h-0 flex-col">
          <div className="sticky top-0 z-10 shrink-0 bg-white">
            <CatalogCategoryTabs
              categories={categories}
              selectedCategory={activeCategory?.name ?? null}
              selectedCategoryLabel={activeCategoryLabel}
              total={total}
              query={query}
              onCategoryChange={setCategory}
            />
            <CatalogSubcategoryNav
              category={activeCategory}
              selectedSubCategoryId={selectedSubCategoryId}
              onSubCategoryChange={setSubCategoryId}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-hidden px-4 py-4 sm:px-6 lg:px-8 lg:py-5">
            <div className="grid h-full min-h-0 gap-5 lg:grid-cols-[304px_minmax(0,1fr)]">
              <aside className="hidden h-full min-h-0 lg:block">
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
              </aside>

              <main className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="flex shrink-0 flex-col gap-4 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div>
                    <p className="text-sm font-medium text-slate-950">
                      {pageStart}-{pageEnd} of {total.toLocaleString()} products
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Filters stay isolated on the left so product browsing remains uninterrupted.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 lg:hidden"
                      onClick={() => setIsMobileFiltersOpen(true)}
                    >
                      <SlidersHorizontal className="mr-2 size-4" />
                      Filters
                      {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                    </Button>

                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="size-4 text-slate-400" />
                      <Select value={sort} onValueChange={setSort}>
                        <SelectTrigger className="h-10 w-[180px] rounded-lg border-slate-200">
                          <SelectValue placeholder="Sort products" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="featured">Featured</SelectItem>
                          <SelectItem value="newest">Newest</SelectItem>
                          <SelectItem value="price-asc">Price: Low to High</SelectItem>
                          <SelectItem value="price-desc">Price: High to Low</SelectItem>
                          <SelectItem value="name-asc">Name: A to Z</SelectItem>
                          <SelectItem value="name-desc">Name: Z to A</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <ScrollArea className="min-h-0 flex-1">
                  <div className="px-4 py-4 sm:px-5 sm:py-5">
                    {isLoading ? (
                      <LoadingGrid />
                    ) : products.length === 0 ? (
                      <EmptyState onClear={clearFilters} />
                    ) : (
                      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-4">
                        {products.map((product, index) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            priority={index < 4}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
                  <p className="text-sm text-slate-500">
                    Page {Math.min(page, totalPages)} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={page <= 1 || isLoading}
                    >
                      <ArrowLeft className="mr-2 size-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((current) => Math.min(totalPages, current + 1))
                      }
                      disabled={page >= totalPages || isLoading}
                    >
                      Next
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                  </div>
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>

      <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
        <SheetContent side="left" className="w-full max-w-md p-0">
          <SheetHeader className="border-b border-slate-200 px-5 py-4 text-left">
            <SheetTitle>Filters</SheetTitle>
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
    </section>
  );
}
