import { HeroSection } from "@/components/storefront/HeroSection";

import { FeaturedCollection } from "@/components/storefront/FeaturedCollection";
import { BestSellersRanked } from "@/components/storefront/BestSellersRanked";
import { TrustSection } from "@/components/storefront/TrustSection";
import { SocialProof } from "@/components/storefront/SocialProof";
import {
  getBestSellers,
  getHomepageCategories,
  getNewArrivals,
} from "@/lib/storefront-queries";
import { DiscoveryNav } from "@/components/storefront/DiscoveryNav";

export default async function StorefrontPage() {
  const [newArrivals, bestSellers, homepageCategories] = await Promise.all([
    getNewArrivals(),
    getBestSellers(),
    getHomepageCategories(),
  ]);

  return (
    <div className="relative min-h-screen bg-stone-50/20 overflow-hidden">
      {/* Cyber-tech digital grid overlay */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      
      {/* Premium ambient glow effects */}
      <div className="absolute top-[-10%] right-[-10%] -z-10 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-indigo-500/10 to-cyan-400/5 blur-[120px] pointer-events-none animate-pulse [animation-duration:8s]" />
      <div className="absolute top-[40%] left-[-20%] -z-10 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-violet-500/8 to-fuchsia-400/5 blur-[140px] pointer-events-none animate-pulse [animation-duration:12s]" />
      <div className="absolute bottom-[10%] right-[-15%] -z-10 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-cyan-500/10 to-indigo-400/5 blur-[110px] pointer-events-none animate-pulse [animation-duration:10s]" />

      <HeroSection featuredProducts={newArrivals.slice(0, 3)} />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
        <DiscoveryNav categories={homepageCategories} />
        <FeaturedCollection products={newArrivals} />
        <BestSellersRanked products={bestSellers} />
        <TrustSection />
        <SocialProof />
      </div>
    </div>
  );
}