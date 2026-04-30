"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type HomepageCategory = {
  id: string;
  name: string;
  displayName: string;
  sortOrder: number;
  subCategories: Array<{ id: string; name: string }>;
};

export default function CategoriesSection({
  categories,
}: {
  categories: HomepageCategory[];
}) {
  const [showAll, setShowAll] = useState(false);

  const visibleCategories = showAll ? categories : categories.slice(0, 3);

  return (
    <section className="border-t border-gray-200 py-12 sm:py-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-gray-500">
            Categories
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Explore the catalog by category and jump directly into relevant product filters.
          </p>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/products">Browse all</Link>
          </Button>

          {categories.length > 4 && (
            <Button
              variant="ghost"
              onClick={() => setShowAll((prev) => !prev)}
            >
              {showAll ? "Show less" : "View all"}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleCategories.map((category) => (
          <div
            key={category.id}
            className="group rounded-xl border border-gray-200 bg-white p-5 transition hover:border-gray-300 hover:shadow-sm"
          >
            <Link
              href={`/products?category=${encodeURIComponent(category.name)}`}
              className="text-lg font-semibold text-gray-900 transition group-hover:text-black"
            >
              {category.displayName}
            </Link>

            <p className="mt-1 text-sm text-gray-500">
              {category.subCategories.length} subcategories
            </p>

            {category.subCategories.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 opacity-100 transition duration-200 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                {category.subCategories.map((subCategory) => (
                  <Link
                    key={subCategory.id}
                    href={`/products?category=${encodeURIComponent(
                      category.name
                    )}&subCategoryId=${encodeURIComponent(subCategory.id)}`}
                    className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700 transition hover:bg-gray-100"
                  >
                    {subCategory.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}