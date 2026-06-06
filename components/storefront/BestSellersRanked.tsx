"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, TrendingUp, Star, Zap, Activity } from "lucide-react";
import { Product } from "@/types";
import { motion } from "framer-motion";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="relative flex size-7 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-yellow-500 text-xs font-black text-amber-950 shadow-md shadow-amber-300/30 border border-yellow-200/50 select-none">
        1
        <span className="absolute -inset-0.5 rounded-full border border-yellow-350 opacity-40 animate-pulse" />
      </span>
    );
  if (rank === 2)
    return (
      <span className="relative flex size-7 items-center justify-center rounded-full bg-gradient-to-r from-slate-300 via-stone-100 to-slate-400 text-xs font-black text-slate-800 shadow-md shadow-slate-200/30 border border-slate-350/40 select-none">
        2
      </span>
    );
  if (rank === 3)
    return (
      <span className="relative flex size-7 items-center justify-center rounded-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-xs font-black text-amber-50 shadow-md shadow-amber-700/20 border border-amber-600/30 select-none">
        3
      </span>
    );
  return (
    <span className="flex size-7 items-center justify-center rounded-full bg-stone-100/80 border border-stone-200 text-xs font-bold text-stone-500 select-none">
      {rank}
    </span>
  );
}

function SocialProofChip({ index }: { product: Product; index: number }) {
  const chips = [
    { icon: TrendingUp, text: "Trending this week", color: "text-amber-700 bg-amber-50/70 border-amber-150/60" },
    { icon: Star, text: "Top rated", color: "text-yellow-700 bg-yellow-50/70 border-yellow-150/60" },
    { icon: Zap, text: "Fast moving", color: "text-indigo-700 bg-indigo-50/70 border-indigo-150/60" },
    { icon: TrendingUp, text: "Popular pick", color: "text-violet-700 bg-violet-50/70 border-violet-150/60" },
  ];
  const chip = chips[index % chips.length];
  return (
    <div className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full mt-1 border shadow-sm ${chip.color}`}>
      <chip.icon className="size-2.5 shrink-0" aria-hidden />
      {chip.text}
    </div>
  );
}

function getProductImage(product: Product) {
  if (product.media?.[0]?.url) return product.media[0].url;
  if (product.image) return product.image;

  const subcategory = product.subcategory || (product as any).subCategory;
  const category = subcategory?.category || product.category;
  const catName = typeof category === "object" ? category?.name : typeof product.category === "string" ? product.category : "";
  const catCode = typeof category === "object" ? category?.code : "";

  const nameOrCode = (catCode || catName || "").toLowerCase();

  if (nameOrCode.includes("cpu") || nameOrCode.includes("processor")) {
    return "/images/category_section/proc.avif";
  }
  if (nameOrCode.includes("mb") || nameOrCode.includes("motherboard")) {
    return "/images/category_section/mobo.avif";
  }
  if (nameOrCode.includes("ram") || nameOrCode.includes("memory")) {
    return "/images/category_section/ram.webp";
  }
  if (nameOrCode.includes("gpu") || nameOrCode.includes("graphics") || nameOrCode.includes("nvidia") || nameOrCode.includes("radeon")) {
    return "/images/category_section/gpu.avif";
  }
  if (nameOrCode.includes("ssd") || nameOrCode.includes("storage") || nameOrCode.includes("drive") || nameOrCode.includes("hdd")) {
    return "/images/category_section/drive.avif";
  }
  if (nameOrCode.includes("case") || nameOrCode.includes("chassis") || nameOrCode.includes("cab")) {
    return "/images/category_section/cab.avif";
  }
  if (nameOrCode.includes("monitor") || nameOrCode.includes("screen")) {
    return "/images/category_section/mon.webp";
  }

  return "/placeholder.png";
}

function BestSellerRow({ product, rank }: { product: Product; rank: number }) {
  const img = getProductImage(product);
  const price = Number(product.price ?? 0);
  const isOOS = product.stockStatus === "OUT_OF_STOCK";

  return (
    <motion.div
      whileHover={{ x: 6, transition: { duration: 0.2 } }}
      className="w-full"
    >
      <Link
        href={`/products/${product.slug || product.id}`}
        className="group flex items-center gap-4 py-4 border-b border-stone-150/50 last:border-0 hover:bg-white/80 hover:shadow-[0_4px_20px_rgba(99,102,241,0.02)] backdrop-blur-sm -mx-4 px-4 rounded-xl transition-all duration-300"
      >
        <RankBadge rank={rank} />

        <div className="size-14 shrink-0 rounded-xl bg-stone-50 border border-stone-250/50 overflow-hidden flex items-center justify-center p-2 group-hover:border-indigo-300 group-hover:bg-white transition-all duration-300">
          <div className="relative w-full h-full">
            <Image
              src={img}
              alt={product.name}
              fill
              className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {product.brand?.name && (
            <p className="text-[9px] font-black uppercase tracking-wider text-indigo-600/80 mb-0.5">
              {product.brand.name}
            </p>
          )}
          <p className="text-sm font-bold text-stone-850 group-hover:text-indigo-600 transition-colors line-clamp-1">
            {product.name}
          </p>
          <SocialProofChip product={product} index={rank - 1} />
        </div>

        <div className="shrink-0 text-right pl-2">
          <p className="text-sm font-black text-stone-900">
            ₹{price.toLocaleString("en-IN")}
          </p>
          {isOOS ? (
            <span className="inline-block text-[9px] font-bold text-stone-400 bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded">Out of stock</span>
          ) : (
            <span className="inline-block text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">In stock</span>
          )}
        </div>

        <ArrowRight className="size-4 text-stone-300 group-hover:text-indigo-600 group-hover:translate-x-1.5 transition-all duration-300 shrink-0 ml-1" aria-hidden />
      </Link>
    </motion.div>
  );
}

export function BestSellersRanked({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  // Stagger variants for ranked list
  const listVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 100 } },
  };

  return (
    <section className="border-t border-stone-150/50 py-16">
      <div className="grid lg:grid-cols-12 gap-12 lg:gap-8">

        {/* Left column — header + CTAs + interactive visual widget */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 lg:h-fit">
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-2.5 py-0.5 rounded-full mb-1">
            Best Sellers
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-tight">
            What everyone is buying
          </h2>
          <p className="mt-3 text-sm text-stone-500 leading-relaxed font-medium">
            These components ship daily. Updated weekly based on real purchase data.
          </p>

          {/* Premium stats widget */}
          <div className="mt-6 rounded-2xl border border-stone-200 bg-white/70 backdrop-blur-md p-4 shadow-sm">
            <div className="flex items-center gap-2 text-stone-850 mb-3.5 pb-2.5 border-b border-stone-150/60">
              <Activity className="size-4 text-indigo-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider">Live Metrics</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="size-1.5 mt-2 rounded-full bg-amber-400 shrink-0" aria-hidden />
                <div>
                  <p className="text-xs font-extrabold text-stone-800">Sales Ranked Weekly</p>
                  <p className="text-[10px] text-stone-400 font-semibold mt-0.5">Calculated by total units sold in region</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="size-1.5 mt-2 rounded-full bg-emerald-400 shrink-0" aria-hidden />
                <div>
                  <p className="text-xs font-extrabold text-stone-800">Real-Time Inventory Check</p>
                  <p className="text-[10px] text-stone-400 font-semibold mt-0.5">Stock status synchronizes automatically</p>
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/products?sort=popular"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors group/link"
          >
            See full rankings
            <ArrowRight className="size-4 group-hover/link:translate-x-1 transition-transform duration-250" aria-hidden />
          </Link>
        </div>

        {/* Right column — ranked list with entry stagger */}
        <motion.div 
          className="lg:col-span-8 space-y-1.5"
          variants={listVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {products.slice(0, 8).map((product, index) => (
            <motion.div key={product.id} variants={itemVariants}>
              <BestSellerRow product={product} rank={index + 1} />
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}