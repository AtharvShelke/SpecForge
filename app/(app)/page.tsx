// app/(storefront)/page.tsx
import { AnnouncementBar } from "@/components/storefront/AnnouncementBar";
import { HeroSection } from "@/components/storefront/HeroSection";
import { CategoryNav } from "@/components/storefront/CategoryNav";
import { FeaturedBuilds } from "@/components/storefront/FeaturedBuilds";
import { FeaturedCollection } from "@/components/storefront/FeaturedCollection";
import { MetricTrust } from "@/components/storefront/MetricTrust";
import { BestSellersRanked } from "@/components/storefront/BestSellersRanked";
import { ConfiguratorHighlight } from "@/components/storefront/ConfiguratorHighlight";
import { SocialProof } from "@/components/storefront/SocialProof";
import { BrandPartners } from "@/components/storefront/BrandPartners";
import { FinalCTA } from "@/components/storefront/FinalCTA";
import { getNewArrivals, getBestSellers } from "@/lib/storefront-queries";

export default async function StorefrontHomepage() {
  const [newArrivals, bestSellers] = await Promise.all([
    getNewArrivals(),
    getBestSellers(),
  ]);

  return (
    <div className="min-h-screen bg-stone-50 font-sans antialiased text-stone-900 selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      <AnnouncementBar />
      <HeroSection />
      <CategoryNav />
      <FeaturedBuilds />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FeaturedCollection products={newArrivals} />
        <MetricTrust />
        <BestSellersRanked products={bestSellers} />
      </div>
      <ConfiguratorHighlight />
      <SocialProof />
      <BrandPartners />
      <FinalCTA />
    </div>
  );
}