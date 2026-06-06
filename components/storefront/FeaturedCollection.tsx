"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Tag } from "lucide-react";
import { Product } from "@/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

function PriceBadge({ price, compareAtPrice }: { price: number; compareAtPrice: number }) {
  const hasDiscount = compareAtPrice > price;
  const pct = hasDiscount ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;
  return (
    <div className="flex items-baseline gap-2 mt-auto pt-3 border-t border-stone-100/80">
      <span className="text-sm font-extrabold text-stone-900">
        ₹{price.toLocaleString("en-IN")}
      </span>
      {hasDiscount && (
        <>
          <span className="text-xs text-stone-400 line-through">
            ₹{compareAtPrice.toLocaleString("en-IN")}
          </span>
          <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-full border border-emerald-150 shadow-sm animate-pulse">
            <Tag className="size-2.5" />
            -{pct}%
          </span>
        </>
      )}
    </div>
  );
}

function ProductTile({
  product,
  size = "sm",
  priority = false,
}: {
  product: Product;
  size?: "sm" | "md" | "lg";
  priority?: boolean;
}) {
  const img = product.media?.[0]?.url ?? product.image ?? "/placeholder.png";
  const price = Number(product.price ?? 0);
  const compareAtPrice = Number(product.compareAtPrice ?? 0);
  const isOOS = product.stockStatus === "OUT_OF_STOCK";

  return (
    <motion.div
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="h-full"
    >
      <Link
        href={`/products/${product.slug || product.id}`}
        className={cn(
          "group flex flex-col h-full rounded-2xl border border-stone-200 bg-white/70 backdrop-blur-md overflow-hidden hover:border-indigo-300 hover:shadow-[0_12px_30px_rgba(99,102,241,0.06)] transition-all duration-300",
          size === "lg" && "h-full"
        )}
      >
        <div
          className={cn(
            "relative bg-stone-50/70 overflow-hidden bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:16px_16px]",
            size === "lg" ? "aspect-[4/3]" : "aspect-square"
          )}
        >
          {isOOS && (
            <div className="absolute inset-0 z-10 bg-white/75 backdrop-blur-[1px] flex items-center justify-center">
              <span className="text-[10px] font-bold text-stone-400 tracking-wider uppercase bg-white/90 border border-stone-200/50 px-2.5 py-1 rounded-full shadow-sm">
                Out of stock
              </span>
            </div>
          )}
          <div className="relative w-full h-full p-6 flex items-center justify-center">
            <Image
              src={img}
              alt={product.name}
              fill
              priority={priority}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.04]"
            />
          </div>
        </div>
        
        <div className={cn("flex flex-col flex-1 p-5", size === "lg" ? "p-6" : "p-5")}>
          {product.brand?.name && (
            <span className="inline-block text-[9px] font-black uppercase tracking-widest text-indigo-600/80 mb-1">
              {product.brand.name}
            </span>
          )}
          <h3 className={cn(
            "font-bold text-stone-800 line-clamp-2 group-hover:text-indigo-600 transition-colors leading-snug mb-3",
            size === "lg" ? "text-base sm:text-lg" : "text-sm"
          )}>
            {product.name}
          </h3>
          <PriceBadge price={price} compareAtPrice={compareAtPrice} />
        </div>
      </Link>
    </motion.div>
  );
}

export function FeaturedCollection({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  const [hero, ...rest] = products;
  const sideProducts = rest.slice(0, 2);
  const smallGrid = rest.slice(2, 6);

  // Stagger loading animation for grid
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 90, damping: 14 } },
  };

  return (
    <section className="border-t border-stone-150/50 py-16">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-2.5 py-0.5 rounded-full mb-1">
            New Arrivals
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            Latest additions
          </h2>
        </div>
        <Link
          href="/products?sort=newest"
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors group/link"
        >
          View all
          <ArrowRight className="size-4 group-hover/link:translate-x-1 transition-transform duration-200" aria-hidden />
        </Link>
      </div>

      {/* Magazine grid with Framer Motion entry */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Hero tile — spans 2 rows on lg */}
        {hero && (
          <motion.div variants={itemVariants} className="lg:row-span-2">
            <ProductTile product={hero} size="lg" priority />
          </motion.div>
        )}

        {/* Two medium tiles */}
        {sideProducts.map((p, i) => (
          <motion.div key={p.id} variants={itemVariants}>
            <ProductTile product={p} size="md" priority={i === 0} />
          </motion.div>
        ))}

        {/* Small 4-col grid below */}
        {smallGrid.length > 0 && (
          <div className="lg:col-span-2 grid grid-cols-2 gap-6">
            {smallGrid.slice(0, 2).map((p) => (
              <motion.div key={p.id} variants={itemVariants}>
                <ProductTile product={p} size="sm" />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Remaining small tiles in full width row */}
      {smallGrid.length > 2 && (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-6"
        >
          {smallGrid.map((p, index) => {
            // Avoid duplicate rendering of the first 2 small cards
            if (index < 2) return null;
            return (
              <motion.div key={p.id} variants={itemVariants}>
                <ProductTile product={p} size="sm" />
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Mobile "View all" */}
      <div className="mt-8 sm:hidden">
        <Link
          href="/products?sort=newest"
          className="flex w-full items-center justify-center gap-1.5 py-3.5 rounded-xl border border-stone-200 bg-white text-sm font-bold text-stone-700 hover:bg-stone-50 transition-colors shadow-sm"
        >
          View all new arrivals
          <ArrowRight className="size-4 animate-pulse" aria-hidden />
        </Link>
      </div>
    </section>
  );
}