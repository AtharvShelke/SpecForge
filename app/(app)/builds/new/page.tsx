"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useBuilderCategories } from "@/hooks/useCategories";
import { useProductFilters } from "@/hooks/useProductFilters";
import { useCatalogListing } from "@/hooks/useCatalogListing";
import { apiFetch } from "@/lib/helpers";
import {
  DEFAULT_BUILDER_SETTINGS,
  BuilderSettings,
  Build,
  BuildItem,
  CompatibilityResult,
  OverallCompatibilityStatus,
  CompatibilityCheck,
} from "@/types";

import CatalogFiltersSidebar from "@/app/(app)/products/components/CatalogFiltersSidebar";
import CatalogLoadingGrid from "@/components/storefront/catalog/CatalogLoadingGrid";
import CatalogEmptyState from "@/components/storefront/catalog/CatalogEmptyState";
import CatalogPagination from "@/components/storefront/catalog/CatalogPagination";
import BuildSummaryPanel from "@/components/build/BuildSummaryPanel";
import ProductCard from "@/components/cards/ProductCard";

import {
  CheckCircle2,
  ChevronRight,
  Cpu,
  Wrench,
  Share2,
  Save,
  Loader2,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Suspense } from "react";

function PCBuilderContent() {
  /* ─────────────────────────────── DATA ─────────────────────────────── */

  const { subCategories } = useBuilderCategories();

  const [build, setBuild] = useState<Build | null>(null);
  const [compatibilityResult, setCompatibilityResult] = useState<CompatibilityResult | null>(null);
  const [buildLoading, setBuildLoading] = useState(false);
  const [builderSettings, setBuilderSettings] = useState<BuilderSettings>(DEFAULT_BUILDER_SETTINGS);
  const [isBuildMode, setIsBuildMode] = useState(true);

  const toggleBuildMode = useCallback(() => {
    setIsBuildMode((v) => !v);
  }, []);

  const createBuild = useCallback(async (name?: string) => {
    setBuildLoading(true);
    try {
      const data = await apiFetch<Build>("/api/builds", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      setBuild(data);
      setCompatibilityResult(null);
    } catch (err) {
      console.error("Failed to create build:", err);
    } finally {
      setBuildLoading(false);
    }
  }, []);

  const addItem = useCallback(async (variantId: string, slotId: string) => {
    if (!build) return;
    setBuildLoading(true);
    try {
      await apiFetch(`/api/builds/${build.id}/items`, {
        method: "POST",
        body: JSON.stringify({ variantId, slotId }),
      });
      const refreshed = await apiFetch<Build>(`/api/builds/${build.id}`);
      setBuild(refreshed);
      setCompatibilityResult(null);
    } catch (err) {
      console.error("Failed to add item to build:", err);
    } finally {
      setBuildLoading(false);
    }
  }, [build]);

  const removeItem = useCallback(async (slotId: string) => {
    if (!build) return;
    const item = build.items?.find((i: any) => i.slotId === slotId);
    if (!item) return;
    setBuildLoading(true);
    try {
      await apiFetch(`/api/builds/${build.id}/items/${item.id}`, {
        method: "DELETE",
      });
      const refreshed = await apiFetch<Build>(`/api/builds/${build.id}`);
      setBuild(refreshed);
      setCompatibilityResult(null);
    } catch (err) {
      console.error("Failed to remove item from build:", err);
    } finally {
      setBuildLoading(false);
    }
  }, [build]);

  const checkCompatibility = useCallback(async (): Promise<CompatibilityResult | null> => {
    if (!build) return null;

    if (!builderSettings.enforceCompatibility) {
      const skipped: CompatibilityResult = {
        id: "skipped",
        buildId: build.id,
        isCompatible: true,
        createdAt: new Date().toISOString(),
        checks: [],
        summary: { totalChecks: 0, passed: 0, failed: 0, errors: 0, warnings: 0 },
      };
      setCompatibilityResult(skipped);
      return skipped;
    }

    setBuildLoading(true);
    try {
      const result = await apiFetch<CompatibilityResult>("/api/compatibility/check", {
        method: "POST",
        body: JSON.stringify({ buildId: build.id }),
      });
      setCompatibilityResult(result);
      return result;
    } catch (err) {
      console.error("Failed to check compatibility:", err);
      return null;
    } finally {
      setBuildLoading(false);
    }
  }, [build, builderSettings.enforceCompatibility]);

  const generateShareLink = useCallback(() => {
    if (!build?.id || typeof window === "undefined") return null;
    return `${window.location.origin}/builds/${build.id}`;
  }, [build?.id]);

  const itemBySlot = useMemo(() => {
    const map = new Map<string, BuildItem>();
    if (build?.items) {
      build.items.forEach((item: BuildItem) => {
        map.set(item.slotId, item);
      });
    }
    return map;
  }, [build]);

  const overallStatus = useMemo<OverallCompatibilityStatus>(() => {
    if (!compatibilityResult) return "UNCHECKED";
    if (compatibilityResult.isCompatible) {
      const hasWarnings = compatibilityResult.checks?.some(
        (c) => !c.passed && c.severity === "WARNING",
      );
      return hasWarnings ? "WARNING" : "COMPATIBLE";
    }
    return "INCOMPATIBLE";
  }, [compatibilityResult]);

  const compatibilityErrors = useMemo(() => {
    if (!compatibilityResult?.checks) return [];
    return compatibilityResult.checks.filter(
      (c) => !c.passed && c.severity === "ERROR",
    );
  }, [compatibilityResult]);

  const compatibilityWarnings = useMemo(() => {
    if (!compatibilityResult?.checks) return [];
    return compatibilityResult.checks.filter(
      (c) => !c.passed && c.severity === "WARNING",
    );
  }, [compatibilityResult]);

  useEffect(() => {
    apiFetch<BuilderSettings>("/api/builder-settings")
      .then((s) => setBuilderSettings({ ...DEFAULT_BUILDER_SETTINGS, ...s }))
      .catch(() => {});
  }, []);

  const cart = build?.items ?? [];

  const {
    selectedSubCategoryId,
    setSubCategoryId,
    clearFilters,
    limit,
    query,
    setSearchQuery,
    sort,
    setSort,
    activeFilterCount,
    selectedFilters,
    minPrice,
    maxPrice,
    toggleFilterValue,
    setPriceRange,
  } = useProductFilters();

  const [page, setPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [savingBuild, setSavingBuild] = useState(false);

  const searchKey = `${selectedSubCategoryId}-${query}-${sort}-${page}`;

  const { products, total, isLoading, totalPages, filters } =
    useCatalogListing({
      searchKey,
      limit,
      page,
    });

  /* ─────────────────────────────── STEPS ─────────────────────────────── */

  const steps = useMemo(() => {
    return [...subCategories]
      .filter((sc) => sc.isBuilderEnabled)
      .sort((a, b) => (a.builderOrder ?? 0) - (b.builderOrder ?? 0));
  }, [subCategories]);

  const [activeStep, setActiveStep] = useState<string | null>(null);

  useEffect(() => {
    if (!activeStep && steps.length > 0) {
      setActiveStep(steps[0].id);
    }
  }, [steps, activeStep]);

  /* ─────────────────────────────── SYNC ─────────────────────────────── */

  useEffect(() => {
    if (activeStep) {
      setSubCategoryId(activeStep);
      setPage(1);
    }
  }, [activeStep, setSubCategoryId]);

  useEffect(() => {
    if (!isBuildMode) toggleBuildMode();
  }, [isBuildMode, toggleBuildMode]); // run once

  // Auto-create build if none exists
  useEffect(() => {
    if (!build && steps.length > 0) {
      createBuild("My PC Build");
    }
  }, [build, steps.length, createBuild]);

  /* ─────────────────────────────── COMPUTED ─────────────────────────── */

  const totalPrice = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + Number(item.product?.price ?? 0),
      0,
    );
  }, [cart]);

  const activeStepIndex = useMemo(
    () => steps.findIndex((s) => s.id === activeStep),
    [steps, activeStep],
  );

  /* ─────────────────────────────── HANDLERS ─────────────────────────── */

  const handleSelect = useCallback(
    async (product: import("@/types").Product) => {
      if (!activeStep) return;

      const productId = product.id;
      if (!productId) return;

      // Find the slot for the active subcategory
      const currentSubCat = subCategories.find((sc) => sc.id === activeStep);
      const slotId = currentSubCat?.subCategorySlots?.[0]?.slotId;

      if (!slotId) {
        console.error("No slot found for subcategory:", activeStep);
        return;
      }

      await addItem(productId, slotId);

      // Auto-advance to next unfilled step
      const currentIdx = steps.findIndex((s) => s.id === activeStep);
      if (currentIdx >= 0 && currentIdx < steps.length - 1) {
        const nextUnfilled = steps.find((s, i) => {
          if (i <= currentIdx) return false;
          const sSlotId = s.subCategorySlots?.[0]?.slotId;
          return sSlotId && !itemBySlot.has(sSlotId);
        });

        if (nextUnfilled) {
          setActiveStep(nextUnfilled.id);
        }
      }
    },
    [activeStep, addItem, steps, itemBySlot, subCategories],
  );

  const handleRemove = useCallback(
    async (subCategoryId: string) => {
      const subCat = subCategories.find((sc) => sc.id === subCategoryId);
      const slotId = subCat?.subCategorySlots?.[0]?.slotId;
      if (slotId) {
        await removeItem(slotId);
      }
    },
    [removeItem, subCategories],
  );

  const handleStepClick = useCallback((stepId: string) => {
    setActiveStep(stepId);
    setShowMobileSummary(false);
  }, []);

  const handleNextStep = useCallback(() => {
    if (activeStepIndex < steps.length - 1) {
      setActiveStep(steps[activeStepIndex + 1].id);
    }
  }, [activeStepIndex, steps]);

  const handlePrevStep = useCallback(() => {
    if (activeStepIndex > 0) {
      setActiveStep(steps[activeStepIndex - 1].id);
    }
  }, [activeStepIndex, steps]);

  const handleSaveBuild = useCallback(async () => {
    if (!build) return;
    setSavingBuild(true);
    try {
      await fetch("/api/build/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buildId: build.id, runCheck: true }),
      });
    } finally {
      setSavingBuild(false);
    }
  }, [build]);

  const handleShare = useCallback(() => {
    const link = generateShareLink();
    if (link && typeof navigator !== "undefined") {
      navigator.clipboard.writeText(link);
    }
  }, [generateShareLink]);

  /* ─────────────────────────────── RENDER ─────────────── */

  return (
    <div className="min-h-screen bg-white">
    

      {/* ───────── MAIN CONTENT ───────── */}
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-6">
        <div className="grid lg:grid-cols-[260px_1fr_320px] gap-6">
          {/* ─── FILTERS (Desktop) ─── */}
          <aside className="hidden lg:block">
            <div className="sticky top-6">
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

          {/* ─── PRODUCTS ─── */}
          <main className="min-w-0">
            {/* Controls bar */}
            <div className="flex items-center justify-between gap-3 mb-2 border-b border-zinc-100 pb-3">
              {/* Mobile Filter Button */}
              <button
                onClick={() => setShowMobileFilters(true)}
                className="flex lg:hidden items-center gap-1.5 text-sm border border-zinc-200 bg-white px-3 h-9 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                <SlidersHorizontal size={14} />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="text-xs bg-indigo-600 text-white px-1.5 rounded-full font-semibold">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Step name / Product count */}
              <div className="flex items-baseline gap-2">
                <h2 className="text-sm font-bold text-zinc-900">
                  {steps.find((s) => s.id === activeStep)?.name ?? "Build"}
                </h2>
                <span className="hidden lg:inline text-xs text-zinc-400">
                  ({total.toLocaleString()} products)
                </span>
              </div>

              {/* Sort dropdown */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs sm:text-sm text-zinc-500 font-medium">Sort By:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="h-9 text-xs sm:text-sm border border-zinc-200 rounded-lg px-2 sm:px-3 bg-white hover:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                >
                  <option value="featured">Featured</option>
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Navigation between steps */}
            <div className="flex items-center justify-between py-3">
              <button
                onClick={handlePrevStep}
                disabled={activeStepIndex <= 0}
                className="text-xs font-medium text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              <p className="text-xs text-slate-400">
                Step {activeStepIndex + 1} of {steps.length}
              </p>
              <button
                onClick={handleNextStep}
                disabled={activeStepIndex >= steps.length - 1}
                className="text-xs font-medium text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>

            {/* Product Grid */}
            {isLoading ? (
              <CatalogLoadingGrid />
            ) : products.length === 0 ? (
              <CatalogEmptyState
                title="No products found"
                description="Try adjusting your filters or search query"
                onClear={clearFilters}
              />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((product: import("@/types").Product) => {
                  const productId = product.id;
                  const activeSubCategory = subCategories.find((sc) => sc.id === activeStep);
                  const activeSlotId = activeSubCategory?.subCategorySlots?.[0]?.slotId;

                  const selected =
                    activeSlotId &&
                    productId &&
                    itemBySlot.get(activeSlotId)?.productId === productId;

                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAdd={() => handleSelect(product)}
                      isSelected={!!selected}
                    />
                  );
                })}
              </div>
            )}

            <div className="mt-6">
              <CatalogPagination
                page={page}
                totalPages={totalPages}
                isLoading={isLoading}
                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() =>
                  setPage((p) => Math.min(totalPages, p + 1))
                }
              />
            </div>
          </main>

          {/* ─── BUILD SUMMARY (Desktop) ─── */}
          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <BuildSummaryPanel
                items={build?.items || []}
                itemBySlot={itemBySlot}
                steps={steps}
                activeStep={activeStep}
                onStepClick={setActiveStep}
                totalPrice={totalPrice}
                compatibilityResult={compatibilityResult}
                overallStatus={overallStatus}
                compatibilityErrors={compatibilityErrors}
                compatibilityWarnings={compatibilityWarnings}
                loading={buildLoading}
                onRemoveItem={handleRemove}
                onCheckCompatibility={checkCompatibility}
              />
            </div>
          </aside>
        </div>
      </div>

      {/* ─── Mobile Filters Overlay ─── */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-full max-w-sm overflow-y-auto bg-white shadow-2xl animate-in slide-in-from-left duration-300">
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
            <button
              onClick={() => setShowMobileFilters(false)}
              className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ─── Mobile Summary Overlay ─── */}
      {showMobileSummary && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowMobileSummary(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm overflow-y-auto bg-white p-4 shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">
                Your Build
              </h2>
              <button
                onClick={() => setShowMobileSummary(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <BuildSummaryPanel
              items={build?.items || []}
              itemBySlot={itemBySlot}
              steps={steps}
              activeStep={activeStep}
              onStepClick={setActiveStep}
              totalPrice={totalPrice}
              compatibilityResult={compatibilityResult}
              overallStatus={overallStatus}
              compatibilityErrors={compatibilityErrors}
              compatibilityWarnings={compatibilityWarnings}
              loading={buildLoading}
              onRemoveItem={handleRemove}
              onCheckCompatibility={checkCompatibility}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function PCBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
      }
    >
      <PCBuilderContent />
    </Suspense>
  );
}