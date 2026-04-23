"use client";

import { useMemo, useEffect, useState, lazy, Suspense } from "react";

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
      className="w-full py-24 flex items-center justify-center"
      aria-hidden="true"
    >
      <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-white/40 animate-spin" />
    </div>
  );
}

// ── Loading screen ────────────────────────────────────────────────────────────

function StoreLoadingScreen() {
  return (
    <PageLayout bgClass="bg-zinc-950">
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-white/60 animate-spin" />
        </div>
        <p className="text-zinc-500 text-sm font-medium">Loading Store...</p>
      </div>
    </PageLayout>
  );
}

// ── StorefrontPage ────────────────────────────────────────────────────────────

export default function StorefrontPage() {
  const { products, categories, brands, addToCart, isLoading } = useShop();

  const { builds } = useBuild();
  const featuredBuilds = builds.slice(0, 4);

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
    <PageLayout bgClass="bg-zinc-950">
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
