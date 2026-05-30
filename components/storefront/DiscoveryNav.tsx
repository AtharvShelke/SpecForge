"use client";

import Link from "next/link";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type HomepageCategory = {
  id: string;
  name: string;
  displayName: string;
  sortOrder: number;
  subCategories: Array<{ id: string; name: string }>;
};

const COLLECTION_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  default: { label: "Explore", color: "text-stone-700", bg: "bg-stone-50", border: "border-stone-200" },
  trending: { label: "Trending", color: "text-amber-800", bg: "bg-amber-50", border: "border-amber-200" },
  new: { label: "New", color: "text-emerald-800", bg: "bg-emerald-50", border: "border-emerald-200" },
};

const STATIC_COLLECTIONS = [
  { id: "trending", displayName: "Trending Now", description: "What the community is buying this week", tag: "trending", href: "/products?sort=popular" },
  { id: "new-arrivals", displayName: "New This Week", description: "Fresh stock just landed", tag: "new", href: "/products?sort=newest" },
  { id: "staff-picks", displayName: "Staff Picks", description: "Curated by our expert team", tag: "default", href: "/products?tag=staff-pick" },
  { id: "most-loved", displayName: "Most Loved", description: "Highest rated across all categories", tag: "default", href: "/products?sort=rating" },
] as const;

export function DiscoveryNav({ categories }: { categories: HomepageCategory[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "right" ? 280 : -280, behavior: "smooth" });
  };

  const allCards = [
    ...STATIC_COLLECTIONS,
    ...categories.map((c) => ({
      id: c.id,
      displayName: c.displayName,
      description: `${c.subCategories.length} subcategories to explore`,
      tag: "default" as const,
      href: `/products?category=${encodeURIComponent(c.name)}`,
    })),
  ];

  return (
    <section className="py-12 sm:py-16" aria-label="Browse collections">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">
            Discover
          </p>
          <h2 className="mt-1.5 text-xl font-bold text-stone-900 tracking-tight">
            Browse collections
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => scroll("left")}
            className="inline-flex size-8 items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            className="inline-flex size-8 items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-none pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-0 lg:px-0"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {allCards.map((card) => {
          const meta = COLLECTION_META[card.tag] ?? COLLECTION_META.default;
          return (
            <Link
              key={card.id}
              href={card.href}
              className="flex-none w-52 sm:w-60 rounded-xl border border-stone-200 bg-white p-5 hover:border-stone-300 hover:shadow-sm transition-all group"
              style={{ scrollSnapAlign: "start" }}
            >
              <div className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.color} ${meta.bg} border ${meta.border}`}>
                {meta.label}
              </div>
              <p className="mt-3 text-sm font-semibold text-stone-900 group-hover:text-stone-700 transition-colors">
                {card.displayName}
              </p>
              <p className="mt-1 text-xs text-stone-400 leading-snug">
                {card.description}
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-stone-500 group-hover:text-stone-900 transition-colors">
                <span>Explore</span>
                <ChevronRight className="size-3.5" aria-hidden />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}