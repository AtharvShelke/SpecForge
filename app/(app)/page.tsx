'use client'

import { useMemo, useEffect, useState, lazy, Suspense } from 'react'

import { PageLayout } from '@/components/layout/PageLayout'
import { useShop } from '@/context/ShopContext'
import { getFeaturedProducts } from '@/services/featuredProducts'

// Above-fold sections — eagerly imported (critical path)
import HeroSection from '@/components/storefront/HeroSection'
import CategorySection from '@/components/storefront/CategorySection'
import BrandShowcase from '@/components/storefront/BrandShowcase'

// Below-fold sections — lazily imported (deferred bundle chunks)
const FeaturedProductsSection = lazy(() => import('@/components/storefront/FeaturedProductsSection'))
const GpuTierSection           = lazy(() => import('@/components/storefront/GpuTierSection'))
const FeaturedBuildsSection    = lazy(() => import('@/components/storefront/FeaturedBuildsSection'))
const CustomBuilderSection     = lazy(() => import('@/components/storefront/CustomBuilderSection'))
const TrustSection             = lazy(() => import('@/components/storefront/TrustSection'))
const StorefrontFooter         = lazy(() => import('@/components/storefront/StorefrontFooter'))
const ScrollTopButton          = lazy(() => import('@/components/ui/ScrollTopButton'))

// ── Shared loading skeleton ───────────────────────────────────────────────────

function SectionSkeleton() {
  return (
    <div className="w-full py-24 flex items-center justify-center" aria-hidden="true">
      <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-white/40 animate-spin" />
    </div>
  )
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
  )
}

// ── StorefrontPage ────────────────────────────────────────────────────────────

export default function StorefrontPage() {
  const { products, categories, brands, addToCart, isLoading } = useShop()

  const [builds, setBuilds] = useState<any[]>([])

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/build-guides', { signal: controller.signal })
      .then(res => res.json())
      .then(data => setBuilds(data?.slice(0, 4) ?? []))
      .catch(() => {})
    return () => controller.abort()
  }, [])

  const featuredProducts = useMemo(
    () => getFeaturedProducts(products),
    [products]
  )

  const productCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const p of products) {
      if (p.status === 'ACTIVE') {
        counts[p.category] = (counts[p.category] ?? 0) + 1
      }
    }
    return counts
  }, [products])

  if (isLoading) return <StoreLoadingScreen />

  return (
    <PageLayout bgClass="bg-zinc-950">
      {/* Above fold — no Suspense boundary needed */}
      <HeroSection />
      <CategorySection
        categories={categories}
        productCounts={productCounts}
      />
      <BrandShowcase brands={brands} />

      {/* Below fold — lazy loaded, each in its own Suspense boundary
          so one slow section never blocks the others */}
      <Suspense fallback={<SectionSkeleton />}>
        <FeaturedProductsSection
          products={featuredProducts}
          addToCart={addToCart}
        />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <GpuTierSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <FeaturedBuildsSection builds={builds} />
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
  )
}