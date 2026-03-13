'use client'

import React, { useMemo, useEffect, useState } from 'react'
import Head from 'next/head'

import { PageLayout } from '@/components/layout/PageLayout'
import { useShop } from '@/context/ShopContext'
import { getFeaturedProducts } from '@/services/featuredProducts'

// Storefront sections
import HeroSection from '@/components/storefront/HeroSection'
import CategorySection from '@/components/storefront/CategorySection'
import BrandShowcase from '@/components/storefront/BrandShowcase'
import FeaturedProductsSection from '@/components/storefront/FeaturedProductsSection'
import GpuTierSection from '@/components/storefront/GpuTierSection'
import FeaturedBuildsSection from '@/components/storefront/FeaturedBuildsSection'
import CustomBuilderSection from '@/components/storefront/CustomBuilderSection'
import TrustSection from '@/components/storefront/TrustSection'
import CtaBanner from '@/components/storefront/CtaBanner'
import StorefrontNavbar from '@/components/storefront/StorefrontNavbar'
import StorefrontFooter from '@/components/storefront/StorefrontFooter'

export default function StorefrontPage() {
  const { products, categories, brands, addToCart, isLoading } = useShop()

  const [builds, setBuilds] = useState([])

  useEffect(() => {
    fetch('/api/build-guides')
      .then(res => res.json())
      .then(data => setBuilds(data?.slice(0, 4) || []))
      .catch(() => { })
  }, [])

  const featuredProducts = useMemo(() => {
    return getFeaturedProducts(products)
  }, [products])

  // Calculate product counts per category for category section
  const productCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    products.forEach(p => {
      if (p.status === 'ACTIVE') {
        counts[p.category] = (counts[p.category] || 0) + 1
      }
    })
    return counts
  }, [products])

  if (isLoading) {
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

  return (
    <>
      <Head>
        <title>Premium PC Components & Custom Builds | Your Store</title>
        <meta
          name="description"
          content="Shop the latest GPUs, CPUs, motherboards, RAM, and SSDs. Build your dream PC with our compatibility-checked custom builder or choose from expert-curated prebuilt systems."
        />
        <meta name="keywords" content="PC components, graphics cards, processors, custom PC build, gaming PC, RTX GPU, DDR5 RAM, NVMe SSD" />
        <meta property="og:title" content="Premium PC Components & Custom Builds" />
        <meta property="og:description" content="Hand-picked gaming hardware with real-time compatibility checks. From budget builds to enthusiast powerhouses." />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="/" />
      </Head>
      <PageLayout bgClass="bg-zinc-950">
        <StorefrontNavbar />
        <HeroSection />
        <CategorySection
          categories={categories}
          productCounts={productCounts}
        /> 
        <BrandShowcase brands={brands} />        
        <FeaturedProductsSection
          products={featuredProducts}
          addToCart={addToCart}
        />
        <GpuTierSection />
        <FeaturedBuildsSection builds={builds} />
        <CustomBuilderSection />
        <TrustSection />
        {/* <CtaBanner /> */}
        <StorefrontFooter />
      </PageLayout>
    </>
  )
}