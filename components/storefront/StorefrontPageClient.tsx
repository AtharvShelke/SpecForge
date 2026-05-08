'use client'

import { lazy, Suspense, useMemo } from 'react'

import { PageLayout } from '@/components/layout/PageLayout'
import { useShop } from '@/context/ShopContext'
import { Brand, CategoryNode, Product } from '@/types'

import BrandShowcase from '@/components/storefront/BrandShowcase'
import CategorySection from '@/components/storefront/CategorySection'
import HeroSection from '@/components/storefront/HeroSection'

const FeaturedProductsSection = lazy(() => import('@/components/storefront/FeaturedProductsSection'))
const GpuTierSection = lazy(() => import('@/components/storefront/GpuTierSection'))
const FeaturedBuildsSection = lazy(() => import('@/components/storefront/FeaturedBuildsSection'))
const CustomBuilderSection = lazy(() => import('@/components/storefront/CustomBuilderSection'))
const TrustSection = lazy(() => import('@/components/storefront/TrustSection'))
const StorefrontFooter = lazy(() => import('@/components/storefront/StorefrontFooter'))
const ScrollTopButton = lazy(() => import('@/components/ui/ScrollTopButton'))

function SectionSkeleton() {
  return (
    <div className="w-full py-24 flex items-center justify-center" aria-hidden="true">
      <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-white/40 animate-spin" />
    </div>
  )
}

interface StorefrontPageClientProps {
  products: Product[]
  categories: CategoryNode[]
  brands: Brand[]
  buildGuides: any[]
}

export default function StorefrontPageClient({
  products,
  categories,
  brands,
  buildGuides,
}: StorefrontPageClientProps) {
  const { addToCart } = useShop()

  const builds = buildGuides.slice(0, 4)

  const productCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const product of products) {
      if (product.status === 'ACTIVE') {
        counts[product.category] = (counts[product.category] ?? 0) + 1
      }
    }
    return counts
  }, [products])

  return (
    <PageLayout bgClass="bg-zinc-950">
      <HeroSection />
      <CategorySection categories={categories} productCounts={productCounts} />
      <BrandShowcase brands={brands} />

      <Suspense fallback={<SectionSkeleton />}>
        <FeaturedProductsSection products={products} addToCart={addToCart} />
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
