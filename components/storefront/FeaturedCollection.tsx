"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Tag, Sparkles } from "lucide-react";
import { Product } from "@/types";
import { cn } from "@/lib/utils";
import { motion, Variants } from "framer-motion";

function PriceBadge({ price }: { price: number }) {
  return (
    <div className="flex items-center gap-2 mt-auto pt-4">
      <span className="text-base font-semibold text-zinc-900">
        ₹{price.toLocaleString("en-IN")}
      </span>
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

function ProductTile({
  product,
  size = "sm",
  priority = false,
}: {
  product: Product;
  size?: "sm" | "lg";
  priority?: boolean;
}) {
  const img = getProductImage(product);
  const price = Number(product.price ?? 0);
  const isOOS = product.stockStatus === "OUT_OF_STOCK";

  return (
    <Link
      href={`/products/${product.slug || product.id}`}
      className="group flex flex-col h-full rounded-[2rem] bg-white border border-zinc-200/60 overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-zinc-300 transition-all duration-300 ease-out"
    >
      <div className="relative flex-1 w-full bg-zinc-50/50 group-hover:bg-zinc-100/50 transition-colors duration-500 overflow-hidden min-h-[240px] flex items-center justify-center p-8">
        {isOOS && (
          <div className="absolute top-4 left-4 z-10">
            <span className="inline-flex items-center justify-center text-[10px] font-bold text-zinc-600 tracking-wider uppercase bg-white/80 backdrop-blur-md border border-zinc-200/80 px-3 py-1.5 rounded-full shadow-sm">
              Out of stock
            </span>
          </div>
        )}
        <div className="relative w-full h-full flex items-center justify-center">
          <Image
            src={img}
            alt={product.name}
            fill
            priority={priority}
            sizes={size === "lg" ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
            className="object-contain p-2 transition-transform duration-700 ease-out group-hover:scale-110"
          />
        </div>
      </div>
      
      <div className={cn("flex flex-col bg-white", size === "lg" ? "p-8" : "p-6")}>
        {product.brand?.name && (
          <span className="inline-block text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1.5">
            {product.brand.name}
          </span>
        )}
        <h3 className={cn(
          "font-medium text-zinc-800 line-clamp-2 group-hover:text-black transition-colors leading-snug",
          size === "lg" ? "text-xl sm:text-2xl" : "text-base"
        )}>
          {product.name}
        </h3>
        <PriceBadge price={price} />
      </div>
    </Link>
  );
}

export function FeaturedCollection({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  // Staggered loading animations tailored for the bento grid
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 100, damping: 20 } 
    },
  };

  return (
    <section className="py-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-tight text-zinc-700 bg-zinc-100/80 px-3 py-1 rounded-full">
            <Sparkles className="size-3.5 text-zinc-900" />
            New Arrivals
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900">
            Latest additions
          </h2>
        </div>
        
        <Link
          href="/products?sort=newest"
          className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-black transition-colors group/link bg-white px-5 py-2.5 rounded-full border border-zinc-200 hover:border-zinc-300 shadow-sm"
        >
          Explore collection
          <ArrowRight className="size-4 group-hover/link:translate-x-1 transition-transform duration-300 ease-out" aria-hidden />
        </Link>
      </div>

      {/* Modern Bento Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
      >
        {products.slice(0, 7).map((product, index) => {
          const isHero = index === 0;
          return (
            <motion.div 
              key={product.id} 
              variants={itemVariants}
              className={cn(
                "h-full",
                // The hero product spans 2 columns and 2 rows on larger screens
                isHero ? "col-span-2 row-span-2" : "col-span-1 row-span-1",
                // On mobile, force small items to span full width if they're odd out, or keep them side-by-side
                !isHero && "max-sm:col-span-1"
              )}
            >
              <ProductTile 
                product={product} 
                size={isHero ? "lg" : "sm"} 
                priority={index < 3} 
              />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Mobile "View all" */}
      <div className="mt-10 sm:hidden">
        <Link
          href="/products?sort=newest"
          className="flex w-full items-center justify-center gap-2 py-4 rounded-2xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-800 hover:bg-zinc-50 transition-colors shadow-sm active:scale-[0.98]"
        >
          Explore collection
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}