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
    <section className="border-t border-stone-100 py-12 sm:py-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
            Categories
          </p>
          <p className="mt-2 text-sm text-stone-500">
            Explore the catalog by category and jump directly into relevant product filters.
          </p>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline" className="hover:text-indigo-600 hover:border-indigo-200 transition-colors">
            <Link href="/products">Browse all</Link>
          </Button>

          {categories.length > 4 && (
            <Button
              variant="ghost"
              onClick={() => setShowAll((prev) => !prev)}
              className="hover:text-indigo-600 transition-colors"
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
            className="group rounded-xl border border-stone-200 bg-white p-5 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-50/20 transition-all duration-300"
          >
            <Link
              href={`/products?category=${encodeURIComponent(category.name)}`}
              className="text-lg font-bold text-stone-900 transition-colors group-hover:text-indigo-600"
            >
              {category.displayName}
            </Link>

            <p className="mt-1 text-sm text-stone-400">
              {category.subCategories.length} subcategories to explore
            </p>

            {category.subCategories.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 opacity-100 transition duration-250 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                {category.subCategories.map((subCategory) => (
                  <Link
                    key={subCategory.id}
                    href={`/products?category=${encodeURIComponent(
                      category.name
                    )}&subCategoryId=${encodeURIComponent(subCategory.id)}`}
                    className="rounded-full border border-indigo-100 bg-indigo-50/30 px-3 py-1 text-xs text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 transition-all"
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