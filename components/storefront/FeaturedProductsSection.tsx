"use client";

import Link from "next/link";
import { memo, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Package, Plus } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Product } from "@/types";
import Image from "next/image";

interface Props {
  products: Product[];
  addToCart: (product: Product) => void;
}

const ProductCard = memo(function ProductCard({
  product,
  onAddToCart,
  index,
}: {
  product: Product;
  onAddToCart: (product: Product) => void;
  index: number;
}) {
  const price = product.variants?.[0]?.price ?? 0;
  const image = product.media?.[0]?.url;
  const brand = product.brand?.name;
  const isOutOfStock = product.variants?.[0]?.status === "OUT_OF_STOCK";

  const handleAddToCart = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      onAddToCart(product);
    },
    [onAddToCart, product],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, delay: Math.min(index, 6) * 0.04 }}
      className="group app-card overflow-hidden rounded-[1.8rem]"
    >
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-[1.45rem] bg-[linear-gradient(180deg,#fcfcfb,#f1f2f6)] m-3">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 20vw"
              className="h-full w-full object-contain p-7 transition-transform duration-500 group-hover:scale-[1.04]"
              priority={index < 6}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-300">
              <Package className="size-7" />
            </div>
          )}

          {!isOutOfStock && (
            <button
              onClick={handleAddToCart}
              className="absolute bottom-4 right-4 flex size-10 items-center justify-center rounded-full bg-slate-950 text-white shadow-[0_18px_32px_-22px_rgba(15,23,42,0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800"
              aria-label="Add to cart"
            >
              <Plus className="size-4" />
            </button>
          )}
        </div>

        <div className="px-5 pb-5 pt-1">
          {brand && (
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
              {brand}
            </p>
          )}
          <h3 className="mt-2 line-clamp-2 text-lg font-semibold tracking-[-0.03em] text-slate-950">
            {product.name}
          </h3>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Starting at
              </p>
              <p className="mt-1 text-xl font-semibold tracking-[-0.04em] text-slate-950">
                ₹{price.toLocaleString("en-IN")}
              </p>
            </div>
            {isOutOfStock && (
              <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                Out of stock
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
});

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
      className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
        active
          ? "bg-slate-950 text-white shadow-[0_16px_32px_-24px_rgba(15,23,42,0.9)]"
          : "border border-slate-200 bg-white/84 text-slate-600 hover:border-slate-300 hover:text-slate-950"
      }`}
    >
      {label}
      <span className="ml-2 text-xs opacity-70">{count}</span>
    </button>
  );
}

export default function FeaturedProductsSection({ products, addToCart }: Props) {
  const categoryMap = products.reduce<
    Record<string, { id: string; label: string; products: Product[] }>
  >((acc, product) => {
    const category = product.subCategory?.category;
    if (!category) return acc;

    if (!acc[category.id]) {
      acc[category.id] = {
        id: category.id,
        label: category.name,
        products: [],
      };
    }

    acc[category.id].products.push(product);
    return acc;
  }, {});

  const availableCats = Object.values(categoryMap);
  const [activeTab, setActiveTab] = useState<"ALL" | string>("ALL");

  const shownProducts =
    activeTab === "ALL"
      ? products.slice(0, 10)
      : (categoryMap[activeTab]?.products ?? []).slice(0, 10);

  if (products.length === 0) return null;

  return (
    <section className="px-3 py-16 sm:px-5 sm:py-20">
      <Container maxWidth="2xl">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="section-kicker">Featured products</p>
            <h2 className="mt-3 text-4xl text-slate-950 sm:text-5xl">
              Best sellers, cleaner surfaced.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600 sm:text-lg">
              Better hierarchy and calmer cards make it easier to compare products quickly and act with confidence.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white/84 px-5 text-sm font-semibold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950"
          >
            Browse full catalog
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {shownProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={addToCart}
              index={index}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
