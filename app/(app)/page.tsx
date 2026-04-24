"use client";

import { useMemo, lazy, Suspense } from "react";

import { PageLayout } from "@/components/layout/PageLayout";
import { useShop } from "@/context/ShopContext";

// Above-fold sections — eagerly imported (critical path)
import HeroSection from "@/components/storefront/HeroSection";
import CategorySection from "@/components/storefront/CategorySection";
import BrandShowcase from "@/components/storefront/BrandShowcase";
import { useBuild } from "@/context/BuildContext";

// Below-fold sections — lazily imported (deferred bundle chunks)
const FeaturedProductsSection = lazy(
  () => import("@/components/storefront/FeaturedProductsSection"),
);
const GpuTierSection = lazy(
  () => import("@/components/storefront/GpuTierSection"),
);
const FeaturedBuildsSection = lazy(
  () => import("@/components/storefront/FeaturedBuildsSection"),
);
const CustomBuilderSection = lazy(
  () => import("@/components/storefront/CustomBuilderSection"),
);
const TrustSection = lazy(() => import("@/components/storefront/TrustSection"));
const StorefrontFooter = lazy(
  () => import("@/components/storefront/StorefrontFooter"),
);
const ScrollTopButton = lazy(() => import("@/components/ui/ScrollTopButton"));

// ── Shared loading skeleton ───────────────────────────────────────────────────

function SectionSkeleton() {
  return (
    <div
      className="flex w-full items-center justify-center py-24"
      aria-hidden="true"
    >
      <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
    </div>
  );
}

// ── Loading screen ────────────────────────────────────────────────────────────

function StoreLoadingScreen() {
  return (
    <PageLayout bgClass="bg-transparent">
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-500">Loading store...</p>
      </div>
    </PageLayout>
  );
}

// ── StorefrontPage ────────────────────────────────────────────────────────────

export default function StorefrontPage() {
  const { products, categories, brands, addToCart, isLoading } = useShop();

  const { buildGuides } = useBuild();
  const featuredBuilds = buildGuides.slice(0, 4);

  const productCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const p of products) {
      const categoryName = p.subCategory?.category?.name ?? "Unknown";
      counts[categoryName] = (counts[categoryName] ?? 0) + 1;
    }
    return counts;
  }, [products]);

  if (isLoading) return <StoreLoadingScreen />;
  const mappedCategories = categories.map((c, index) => ({
    id: c.id,
    label: c.name,
    categoryId: c.id,
    parentId: null,
    sortOrder: index,
  }));
  return (
    <PageLayout bgClass="bg-transparent">
      {/* Above fold — no Suspense boundary needed */}
      <HeroSection />
      <CategorySection
        categories={mappedCategories}
        productCounts={productCounts}
      />
      <BrandShowcase brands={brands} />

      {/* Below fold — lazy loaded, each in its own Suspense boundary
          so one slow section never blocks the others */}
      <Suspense fallback={<SectionSkeleton />}>
        <FeaturedProductsSection products={products} addToCart={addToCart} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <GpuTierSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <FeaturedBuildsSection builds={featuredBuilds} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <CustomBuilderSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <TrustSection />
      </Suspense>

      <Suspense fallback={null}>
        <StorefrontFooter />
        <ScrollTopButton />
      </Suspense>
    </PageLayout>
  );
}
