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
    <div className="bg-white">
      <HeroSection featuredProducts={newArrivals.slice(0, 3)} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <DiscoveryNav categories={homepageCategories} />
        <FeaturedCollection products={newArrivals} />
        <BestSellersRanked products={bestSellers} />
        <TrustSection />
        <SocialProof />
      </div>
    </div>
  );
}