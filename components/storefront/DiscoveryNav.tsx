"use client";

import Link from "next/link";
import { useRef } from "react";
import { ChevronLeft, ChevronRight, Compass } from "lucide-react";
import { motion } from "framer-motion";

type HomepageCategory = {
  id: string;
  name: string;
  displayName: string;
  sortOrder: number;
  subCategories: Array<{ id: string; name: string }>;
};

const COLLECTION_META: Record<string, { label: string; color: string; bg: string; border: string; glow: string }> = {
  default: { label: "Explore", color: "text-indigo-700", bg: "bg-indigo-50/50", border: "border-indigo-100", glow: "group-hover:border-indigo-300 group-hover:shadow-[0_8px_30px_rgba(99,102,241,0.08)]" },
  trending: { label: "Trending", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-100", glow: "group-hover:border-amber-300 group-hover:shadow-[0_8px_30px_rgba(245,158,11,0.08)]" },
  new: { label: "New", color: "text-emerald-700", bg: "bg-emerald-50/80", border: "border-emerald-100", glow: "group-hover:border-emerald-300 group-hover:shadow-[0_8px_30px_rgba(16,185,129,0.08)]" },
  staff: { label: "Staff Pick", color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-100", glow: "group-hover:border-violet-300 group-hover:shadow-[0_8px_30px_rgba(139,92,246,0.08)]" },
  loved: { label: "Most Loved", color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-100", glow: "group-hover:border-rose-300 group-hover:shadow-[0_8px_30px_rgba(244,63,94,0.08)]" },
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

  // Container variants for stagger loading
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15 } },
  };

  return (
    <section className="py-12 border-t border-stone-150/50" aria-label="Browse collections">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 mb-1 bg-indigo-50/60 border border-indigo-100/50 px-2.5 py-0.5 rounded-full">
            <Compass className="size-3 text-indigo-600 animate-spin [animation-duration:10s]" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
              Discover
            </p>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            Browse collections
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            onClick={() => scroll("left")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex size-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/20 shadow-sm transition-all cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="size-4" />
          </motion.button>
          <motion.button
            type="button"
            onClick={() => scroll("right")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex size-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/20 shadow-sm transition-all cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="size-4" />
          </motion.button>
        </div>
      </div>

      {/* Scrollable row with framer motion animations */}
      <motion.div
        ref={scrollRef}
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="flex gap-4 overflow-x-auto scrollbar-none pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-0 lg:px-0"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {allCards.map((card) => {
          const meta = COLLECTION_META[card.tag] ?? COLLECTION_META.default;
          return (
            <motion.div
              key={card.id}
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="flex-none w-56 sm:w-64 scroll-snap-align-start"
              style={{ scrollSnapAlign: "start" }}
            >
              <Link
                href={card.href}
                className={`group flex flex-col h-full rounded-2xl border border-stone-200 bg-white/70 backdrop-blur-md p-5 transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.015)] ${meta.glow}`}
              >
                <div className={`self-start inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${meta.color} ${meta.bg} border ${meta.border} shadow-sm`}>
                  {meta.label}
                </div>
                <p className="mt-4 text-[15px] font-bold text-stone-900 group-hover:text-indigo-600 transition-colors leading-snug">
                  {card.displayName}
                </p>
                <p className="mt-1.5 text-xs text-stone-400 font-medium leading-relaxed flex-1">
                  {card.description}
                </p>
                <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-stone-500 group-hover:text-indigo-600 transition-colors">
                  <span>Explore</span>
                  <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform duration-250" aria-hidden />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}