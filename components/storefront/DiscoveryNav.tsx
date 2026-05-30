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
  default: { label: "Explore", color: "text-indigo-700", bg: "bg-indigo-50/50", border: "border-indigo-100" },
  trending: { label: "Trending", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-100" },
  new: { label: "New", color: "text-emerald-700", bg: "bg-emerald-50/80", border: "border-emerald-100" },
  staff: { label: "Staff Pick", color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-100" },
  loved: { label: "Most Loved", color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-100" },
};

const STATIC_COLLECTIONS = [
  { id: "trending", displayName: "Trending Now", description: "What the community is buying this week", tag: "trending", href: "/products?sort=popular" },
  { id: "new-arrivals", displayName: "New This Week", description: "Fresh stock just landed", tag: "new", href: "/products?sort=newest" },
  { id: "staff-picks", displayName: "Staff Picks", description: "Curated by our expert team", tag: "staff", href: "/products?tag=staff-pick" },
  { id: "most-loved", displayName: "Most Loved", description: "Highest rated across all categories", tag: "loved", href: "/products?sort=rating" },
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
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
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
            className="inline-flex size-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all"
            aria-label="Scroll left"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            className="inline-flex size-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all"
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
              className="flex-none w-52 sm:w-60 rounded-xl border border-stone-200 bg-white p-5 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-50/20 transition-all duration-300 group"
              style={{ scrollSnapAlign: "start" }}
            >
              <div className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.color} ${meta.bg} border ${meta.border}`}>
                {meta.label}
              </div>
              <p className="mt-3 text-sm font-semibold text-stone-900 group-hover:text-indigo-600 transition-colors">
                {card.displayName}
              </p>
              <p className="mt-1 text-xs text-stone-400 leading-snug">
                {card.description}
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-stone-500 group-hover:text-indigo-600 transition-colors">
                <span>Explore</span>
                <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform duration-200" aria-hidden />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}