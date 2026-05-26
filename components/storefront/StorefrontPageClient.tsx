'use client'

import { lazy, Suspense, useMemo } from 'react'

import { PageLayout } from '@/components/layout/PageLayout'
import { useShop } from '@/context/ShopContext'
import { Brand, CategoryNode, Product } from '@/types'

import Link from 'next/link'

function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-zinc-950 py-20 sm:py-24 border-b border-white/5">
      {/* Cinematic grid lines and glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl leading-[1.15]">
            Unleash Pure <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">Performance</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg leading-relaxed text-zinc-400 font-light">
            Welcome to the ultimate hardware configurator. Build your dream custom desktop PC with real-time, database-driven specifications and absolute compatibility validation.
          </p>
          <div className="mt-8 flex items-center justify-center gap-x-4">
            <Link href="/products?mode=build" className="rounded-xl bg-white px-6 py-3 text-xs sm:text-sm font-semibold text-zinc-950 shadow-sm hover:bg-indigo-500 hover:text-white transition-all duration-300">
              Launch PC Builder
            </Link>
            <Link href="/products" className="rounded-xl border border-white/10 px-6 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-white/5 transition-all duration-300">
              Browse Components
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function BrandShowcase({ brands }: { brands: any[] }) {
  return (
    <div className="bg-zinc-900/20 py-8 border-y border-white/5">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <h2 className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-6">
          Premium Partners & Brands
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {brands.map((brand) => (
            <div key={brand.id} className="text-xs sm:text-sm font-semibold tracking-widest text-zinc-400/80 hover:text-white transition-colors duration-300 uppercase">
              {brand.name}
            </div>
          ))}
          {brands.length === 0 && (
            ['Intel', 'AMD', 'NVIDIA', 'ASUS', 'Corsair'].map((name) => (
              <div key={name} className="text-xs sm:text-sm font-semibold tracking-widest text-zinc-400/80 hover:text-white transition-colors duration-300 uppercase">
                {name}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function CustomBuilderSection() {
  return (
    <div className="bg-zinc-950 py-12 border-t border-white/5">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950/40 via-zinc-900/80 to-purple-950/40 px-6 py-16 shadow-2xl rounded-2xl sm:px-20 xl:py-24 border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none" />
          <div className="mx-auto max-w-2xl text-center relative z-10">
            <h2 className="text-2xl font-black tracking-tight text-white sm:text-4xl">Ready to construct your Custom PC?</h2>
            <p className="mx-auto mt-4 max-w-lg text-sm sm:text-base leading-relaxed text-zinc-400 font-light">
              Select parts sequentially, evaluate power supply parameters, and verify dynamic physical dimensions in real time.
            </p>
            <div className="mt-8 flex items-center justify-center">
              <Link href="/products?mode=build" className="rounded-xl bg-white px-8 py-3.5 text-xs sm:text-sm font-semibold text-zinc-950 shadow-sm hover:bg-indigo-500 hover:text-white active:scale-95 transition-all duration-300">
                Start Building Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustSection() {
  return (
    <div className="bg-zinc-950 py-16 border-t border-white/5">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-3xl">Cinematic Performance, Uncompromising Quality</h2>
          <p className="mt-4 text-xs sm:text-sm leading-relaxed text-zinc-400 font-light">
            All custom builds are hand-assembled, meticulously tested, and safely shipped with a premium system warranty.
          </p>
        </div>
      </div>
    </div>
  );
}
import CategorySection from '@/components/storefront/CategorySection'
const FeaturedProductsSection = lazy(() => import('@/components/storefront/FeaturedProductsSection'))
const GpuTierSection = lazy(() => import('@/components/storefront/GpuTierSection'))
const FeaturedBuildsSection = lazy(() => import('@/components/storefront/FeaturedBuildsSection'))
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
      if (product.status === 'ACTIVE' && product.category) {
        const categoryName = typeof product.category === 'string' ? product.category : product.category.name;
        if (categoryName) {
          counts[categoryName] = (counts[categoryName] ?? 0) + 1
        }
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
