import { Suspense } from "react";
import type { Metadata } from "next";

import ProductsClient from "./ProductsClient";

type SearchParams = { [key: string]: string | string[] | undefined };

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const q = Array.isArray(params.q) ? params.q[0] : params.q;

  const title = q ? `Search results for "${q}" | Computer Store` : "Products | Computer Store";
  const description = q
    ? `Browse products matching "${q}" from Computer Store.`
    : "Browse PC components and accessories from Computer Store.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full px-4 py-8 sm:px-5 lg:px-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index}>
                <div className="aspect-square animate-pulse bg-gray-100" />
                <div className="mt-3 h-3 w-20 animate-pulse bg-gray-100" />
                <div className="mt-2 h-4 w-full animate-pulse bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      }
    >
      <ProductsClient />
    </Suspense>
  );
}
