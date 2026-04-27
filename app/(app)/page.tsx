import Image from "next/image";
import Link from "next/link";

import ProductCard from "@/components/cards/ProductCard";
import { Button } from "@/components/ui/button";
import { normalizeCatalogProduct } from "@/lib/catalogFrontend";
import { Product } from "@/types";

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
  const [newArrivals, bestSellers] = await Promise.all([
    getNewArrivals(),
    getBestSellers(),
  ]);

  return (
    <div className="bg-white">
      <section className="border-b border-gray-200">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:items-center lg:px-8 lg:py-10">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-500">
              Performance hardware
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-gray-900 sm:text-5xl">
              PC components presented with less friction and more clarity.
            </h1>
            <p className="mt-4 text-base leading-7 text-gray-600">
              Shop processors, graphics cards, motherboards, memory, storage,
              and accessories in a storefront designed to help you compare faster
              and check out with confidence.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/products">Shop products</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/build-guides">Browse build guides</Link>
              </Button>
            </div>
          </div>

          <div className="relative overflow-hidden border border-gray-200 bg-gray-50">
            <div className="relative aspect-[4/3]">
              <Image
                src="/images/hero3.jpg"
                alt="Custom gaming PC"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
