"use client";

import Link from "next/link";
import { useRef } from "react";
import { ChevronLeft, ChevronRight, Compass, ArrowRight } from "lucide-react";
import { motion, Variants } from "framer-motion";

export type HomepageCategory = {
  id: string;
  name: string;
  displayName: string;
  sortOrder: number;
  subCategories: Array<{ id: string; name: string }>;
};

type CollectionTag = "default" | "trending" | "new" | "staff" | "loved";

const COLLECTION_META: Record<CollectionTag, { label: string; text: string; bg: string; border: string; glow: string }> = {
  default: { label: "Explore", text: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200", glow: "group-hover:border-indigo-400 group-hover:shadow-indigo-500/10" },
  trending: { label: "Trending", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", glow: "group-hover:border-amber-400 group-hover:shadow-amber-500/10" },
  new: { label: "New", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", glow: "group-hover:border-emerald-400 group-hover:shadow-emerald-500/10" },
  staff: { label: "Staff Pick", text: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200", glow: "group-hover:border-violet-400 group-hover:shadow-violet-500/10" },
  loved: { label: "Most Loved", text: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200", glow: "group-hover:border-rose-400 group-hover:shadow-rose-500/10" },
};

export function DiscoveryNav({ categories }: { categories: HomepageCategory[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    // Scroll by 80% of the container's visible width for a better paginated feel
    const scrollAmount = scrollRef.current.clientWidth * 0.8; 
    scrollRef.current.scrollBy({ 
      left: dir === "right" ? scrollAmount : -scrollAmount, 
      behavior: "smooth" 
    });
  };

  const allCards = [
    
    ...categories.map((c) => ({
      id: c.id,
      displayName: c.displayName,
      description: `${c.subCategories.length} subcategories to explore`,
      tag: "default" as const,
      href: `/products?category=${encodeURIComponent(c.name)}`,
    })),
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  return (
    <section className="py-16 border-t border-stone-200/60" aria-label="Browse collections">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 mb-3 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
            <Compass className="size-3.5 text-indigo-600 animate-[spin_8s_linear_infinite]" />
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-700">
              Discover
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Browse collections
          </h2>
        </div>
        
        <div className="flex items-center gap-3 hidden sm:flex">
          <NavButton direction="left" onClick={() => scroll("left")} />
          <NavButton direction="right" onClick={() => scroll("right")} />
        </div>
      </div>

      <motion.div
        ref={scrollRef}
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="flex gap-5 overflow-x-auto scrollbar-none pb-8 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-0 lg:px-0"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {allCards.map((card) => (
          <DiscoveryCard key={card.id} card={card} />
        ))}
      </motion.div>
    </section>
  );
}

// --- Subcomponents ---

function NavButton({ direction, onClick }: { direction: "left" | "right"; onClick: () => void }) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="inline-flex size-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/50 shadow-sm transition-colors cursor-pointer"
      aria-label={`Scroll ${direction}`}
    >
      <Icon className="size-5" />
    </motion.button>
  );
}

function DiscoveryCard({ card }: { card: any }) {
  const meta = COLLECTION_META[card.tag as CollectionTag] ?? COLLECTION_META.default;

  const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } },
  };

  return (
    <motion.div
      variants={itemVariants}
      className="flex-none w-[260px] sm:w-[280px] scroll-snap-align-start"
      style={{ scrollSnapAlign: "start" }}
    >
      <Link
        href={card.href}
        className={`group flex flex-col h-full rounded-2xl border border-stone-200 bg-gradient-to-br from-white to-stone-50/50 p-6 transition-all duration-300 shadow-sm hover:-translate-y-1 hover:shadow-lg ${meta.glow}`}
      >
        <div className={`self-start inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold tracking-wide ${meta.text} ${meta.bg} border ${meta.border}`}>
          {meta.label}
        </div>
        
        <div className="mt-8 mb-2">
          <h3 className="text-lg font-bold text-stone-900 group-hover:text-indigo-600 transition-colors leading-tight">
            {card.displayName}
          </h3>
          <p className="mt-2 text-sm text-stone-500 font-medium leading-relaxed">
            {card.description}
          </p>
        </div>

        <div className="mt-auto pt-6 flex items-center gap-2 text-sm font-bold text-stone-400 group-hover:text-indigo-600 transition-colors">
          <span>Explore collection</span>
          <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform duration-300" aria-hidden />
        </div>
      </Link>
    </motion.div>
  );
}