import { HeroSection } from "@/components/storefront/HeroSection";

import { FeaturedCollection } from "@/components/storefront/FeaturedCollection";
import { BestSellersRanked } from "@/components/storefront/BestSellersRanked";
import { TrustSection } from "@/components/storefront/TrustSection";
import { SocialProof } from "@/components/storefront/SocialProof";
import {
  getBestSellers,
  getHomepageCategories,
  getNewArrivals,
} from "@/lib/helpers";
import { DiscoveryNav } from "@/components/storefront/DiscoveryNav";

export default async function StorefrontPage() {
  const [newArrivals, bestSellers, homepageCategories] = await Promise.all([
    getNewArrivals(),
    getBestSellers(),
    getHomepageCategories(),
  ]);

  return (
    <div className="relative bg-white overflow-hidden">
      {/* Premium ambient glow effects */}
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] rounded-full bg-indigo-200/20 blur-[100px] pointer-events-none" />
      <div className="absolute top-[800px] left-[-200px] -z-10 w-[600px] h-[600px] rounded-full bg-violet-200/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[200px] right-[-100px] -z-10 w-[500px] h-[500px] rounded-full bg-cyan-200/20 blur-[100px] pointer-events-none" />

      <HeroSection featuredProducts={newArrivals.slice(0, 3)} />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <DiscoveryNav categories={homepageCategories} />
        <FeaturedCollection products={newArrivals} />
        <BestSellersRanked products={bestSellers} />
        <TrustSection />
        <SocialProof />
      </div>
    </div>
  );
}