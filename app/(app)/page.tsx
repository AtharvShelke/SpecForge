import CategoriesSection from "@/components/storefront/CategoriesSection";
import {
  getBestSellers,
  getHomepageCategories,
  getNewArrivals,
} from "@/lib/storefront/utils";
import { ProductSection } from "@/components/storefront/ProductSection";

export default async function StorefrontPage() {
  const [newArrivals, bestSellers, homepageCategories] = await Promise.all([
    getNewArrivals(),
    getBestSellers(),
    getHomepageCategories(),
  ]);

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {homepageCategories.length > 0 && (
          <CategoriesSection categories={homepageCategories} />
        )}

        <ProductSection
          title="New Arrivals"
          description="The latest additions across the catalog."
          products={newArrivals}
        />
        <ProductSection
          title="Best Sellers"
          description="Products customers are buying most often."
          products={bestSellers}
        />
      </div>
    </div>
  );
}
