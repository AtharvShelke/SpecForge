import Image from "next/image";
import Link from "next/link";

import ProductCard from "@/components/cards/ProductCard";
import { Button } from "@/components/ui/button";
import { normalizeCatalogProduct } from "@/lib/catalogFrontend";
import { Product } from "@/types";
import CategoriesSection from "@/components/storefront/CategoriesSection";

export const dynamic = "force-dynamic";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

async function getNewArrivals() {
  const res = await fetch(`${baseUrl}/api/storefront/new-arrivals`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const products = await res.json();
  return products.map((product: any) => normalizeCatalogProduct(product));
}

async function getBestSellers() {
  const res = await fetch(`${baseUrl}/api/storefront/best-sellers`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const products = await res.json();
  return products.map((product: any) => normalizeCatalogProduct(product));
}

type HomepageCategory = {
  id: string;
  name: string;
  displayName: string;
  sortOrder: number;
  subCategories: Array<{ id: string; name: string }>;
};

async function getHomepageCategories(): Promise<HomepageCategory[]> {
  const res = await fetch(`${baseUrl}/api/storefront/categories`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  return res.json();
}

function ProductSection({
  title,
  description,
  products,
}: {
  title: string;
  description: string;
  products: Product[];
}) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-gray-200 py-12 sm:py-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-gray-500">{title}</p>
          <p className="mt-2 text-sm text-gray-500">{description}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/products">Shop all products</Link>
        </Button>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} priority={index < 4} />
        ))}
      </div>
    </section>
  );
}

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
