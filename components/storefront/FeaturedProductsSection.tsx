"use client";

import Link from "next/link";
import { memo, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Plus, ArrowRight, Package } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Product } from "@/types";

// ── Animation variants ────────────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const VIEWPORT = { once: true, margin: "-40px" } as const;

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  products: Product[];
  addToCart: (p: Product) => void;
}

// ── ProductCard ───────────────────────────────────────────────────────────────

const ProductCard = memo(function ProductCard({
  product,
  onAddToCart,
  index,
}: {
  product: Product;
  onAddToCart: (p: Product) => void;
  index: number;
}) {
  const price = product.variants?.[0]?.price ?? 0;

  const image = product.media?.[0]?.url;
  const brand = product.brand?.name;
  const isOutOfStock = product.variants?.[0]?.status === "OUT_OF_STOCK";

  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onAddToCart(product);
    },
    [onAddToCart, product],
  );

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      transition={{
        delay: Math.min(index % 8, 7) * 0.05,
        duration: 0.45,
        ease: "easeOut",
      }}
      className="group relative flex flex-col bg-white rounded-2xl overflow-hidden hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] transition-all duration-300 border border-zinc-100 hover:border-zinc-200"
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
        {index < 4 && (
          <span className="px-2 py-0.5 bg-zinc-950 text-white text-[9px] font-black tracking-widest uppercase rounded-full flex items-center gap-1">
            <TrendingUp size={9} /> Hot
          </span>
        )}
      </div>

      {/* Out of stock overlay */}
      {isOutOfStock && (
        <div className="absolute inset-0 z-20 bg-white/70 flex items-center justify-center rounded-2xl">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Out of Stock
          </span>
        </div>
      )}

      {/* Image */}
      <Link
        href={`/products/${product.id}`}
        className="relative bg-zinc-50 aspect-square overflow-hidden flex items-center justify-center p-4 sm:p-6"
      >
        {image ? (
          <img
            src={image}
            alt={product.name}
            width={300}
            height={300}
            loading={index < 6 ? "eager" : "lazy"}
            fetchPriority={index < 2 ? "high" : "auto"}
            decoding="async"
            className="w-full h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          />
        ) : (
          <Package size={28} className="text-zinc-300" />
        )}

        {/* Floating add to cart */}
        {!isOutOfStock && (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-3 right-3 w-9 h-9 bg-zinc-950 text-white rounded-xl flex items-center justify-center shadow-lg
                       sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100
                       hover:bg-indigo-600 active:scale-95 transition-all duration-200 z-30"
            aria-label="Add to cart"
          >
            <Plus size={15} strokeWidth={2.5} />
          </button>
        )}
      </Link>

      {/* Info */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        {brand && (
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
            {brand}
          </p>
        )}
        <Link href={`/products/${product.id}`}>
          <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 line-clamp-2 leading-snug mb-3 group-hover:text-indigo-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="mt-auto flex items-end gap-2">
          <span className="text-sm sm:text-base font-black text-zinc-950 tracking-tight">
            ₹{price.toLocaleString("en-IN")}
          </span>
        </div>
      </div>
    </motion.div>
  );
});

// ── Tab pill ──────────────────────────────────────────────────────────────────

function TabPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all duration-200 ${
        active
          ? "bg-zinc-950 text-white border-zinc-950"
          : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400 hover:text-zinc-900"
      }`}
    >
      {label}
      <span className="text-[10px] font-bold opacity-60">{count}</span>
    </button>
  );
}

// ── FeaturedProductsSection ───────────────────────────────────────────────────

export default function FeaturedProductsSection({
  products,
  addToCart,
}: Props) {
  // Filter to only ACTIVE products

  // Build category map in fixed order — only cats with products
  const categoryMap = products.reduce<
    Record<
      string,
      {
        id: string;
        label: string;
        products: Product[];
      }
    >
  >((acc, product) => {
    const category = product.subCategory?.category;
    if (!category) return acc;

    const key = category.id;

    if (!acc[key]) {
      acc[key] = {
        id: category.id,
        label: category.name,
        products: [],
      };
    }

    acc[key].products.push(product);

    return acc;
  }, {});

  const availableCats = Object.values(categoryMap);

  const [activeTab, setActiveTab] = useState<"ALL" | string>("ALL");

  const shownProducts =
    activeTab === "ALL"
      ? products.slice(0, 24)
      : activeTab === "ALL"
        ? products.slice(0, 24)
        : (categoryMap[activeTab]?.products ?? []);

  if (products.length === 0) return null;

  return (
    <section
      className="py-10 sm:py-16 md:py-20 bg-white"
      id="featured-products"
    >
      <Container>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-zinc-950 tracking-tighter">
              Shop by Category
            </h2>
            <p className="text-zinc-500 text-sm mt-1">
              {products.length} products available
            </p>
          </div>
          <Link
            href="/products"
            className="group inline-flex items-center gap-2 text-sm font-bold text-zinc-900 border-b-2 border-zinc-900 pb-0.5 hover:text-indigo-600 hover:border-indigo-600 transition-colors shrink-0"
          >
            Browse full catalog
            <ArrowRight
              size={14}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </Link>
        </div>

        {/* Category tabs */}
        <div
          className="flex gap-2 overflow-x-auto pb-3 mb-6 sm:mb-8"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <TabPill
            label="All"
            count={products.length}
            active={activeTab === "ALL"}
            onClick={() => setActiveTab("ALL")}
          />
          {availableCats.map((cat) => (
            <TabPill
              key={cat.id}
              label={cat.label}
              count={cat.products.length}
              active={activeTab === cat.id}
              onClick={() => setActiveTab(cat.id)}
            />
          ))}
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {shownProducts.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={addToCart}
              index={i}
            />
          ))}
        </div>

        {/* See all CTA */}
        {activeTab !== "ALL" &&
          (categoryMap[activeTab]?.products.length ?? 0) > 0 && (
            <div className="mt-8 text-center">
              <Link
                href={`/products?category=${activeTab}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-all"
              >
                See all {categoryMap[activeTab]?.label} (
                {categoryMap[activeTab]?.products.length})
                <ArrowRight size={14} />
              </Link>
            </div>
          )}

        {activeTab === "ALL" && products.length > 24 && (
          <div className="mt-8 text-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-all"
            >
              View all {products.length} products
              <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </Container>
    </section>
  );
}
