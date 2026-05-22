'use client'

import { lazy, Suspense } from 'react'

import { PageLayout } from '@/components/layout/PageLayout'
import { useShop } from '@/context/ShopContext'

import HeroSection from '@/app/(app)/_components/HeroSection'
import CategorySection from '@/app/(app)/_components/CategorySection'
import BrandShowcase from '@/app/(app)/_components/BrandShowcase'

const FeaturedProductsSection = lazy(() => import('@/app/(app)/_components/FeaturedProductsSection'))
const GpuTierSection = lazy(() => import('@/app/(app)/_components/GpuTierSection'))
const FeaturedBuildsSection = lazy(() => import('@/app/(app)/_components/FeaturedBuildsSection'))
const CustomBuilderSection = lazy(() => import('@/app/(app)/_components/CustomBuilderSection'))
const RecentActivity = lazy(() => import('@/app/(app)/_components/RecentActivity'))

const TrustSection = lazy(() => import('@/app/(app)/_components/TrustSection'))
const StorefrontFooter = lazy(() => import('@/app/(app)/_components/StorefrontFooter'))
const ScrollTopButton = lazy(() => import('@/components/ui/ScrollTopButton'))

function SectionSkeleton() {
  return (
    <div className="w-full py-24 flex items-center justify-center" aria-hidden="true">
      <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-white/40 animate-spin" />
    </div>
  )
}

export default function StorefrontPageClient() {
  const { addToCart } = useShop()

  return (
    <PageLayout bgClass="bg-zinc-950">
      <HeroSection />

      <Suspense fallback={<SectionSkeleton />}>
        <RecentActivity />
      </Suspense>

      <CategorySection />

      <Suspense fallback={<SectionSkeleton />}>
        <FeaturedProductsSection addToCart={addToCart} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <GpuTierSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <FeaturedBuildsSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <CustomBuilderSection />
      </Suspense>

      <BrandShowcase />

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
