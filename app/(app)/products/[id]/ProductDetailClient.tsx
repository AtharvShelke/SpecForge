"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Lock, ShieldCheck, Truck, Heart, Share2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/ShopCartContext";
import { Product, specsToFlat } from "@/types";
import { cn } from "@/lib/utils";

interface ProductDetailClientProps {
  product: Product;
}

function getAvailableQuantity(product: Product) {
  return (product.inventoryItems ?? []).reduce((total, item) => {
    return (
      total +
      Math.max(
        0,
        Number(item.quantityOnHand ?? item.quantity ?? 0) -
          Number(item.quantityReserved ?? item.reserved ?? 0),
      )
    );
  }, 0);
}

function StarRating({ count = 124, rating = 4 }: { count?: number; rating?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "size-3.5",
              i < rating ? "fill-amber-400 text-amber-400" : "text-stone-200"
            )}
            aria-hidden
          />
        ))}
      </div>
      <span className="text-xs text-stone-400">{count} reviews</span>
    </div>
  );
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { addToCart, cart } = useCart();
  const images =
    product.media?.map((m) => m.url) ??
    (product.image ? [product.image] : ["/placeholder.png"]);
  const flatSpecs = useMemo(() => specsToFlat(product.specs), [product.specs]);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [specsOpen, setSpecsOpen] = useState(true);

  const galleryRef = useRef<HTMLDivElement | null>(null);
  const primaryButtonRef = useRef<HTMLButtonElement | null>(null);

  const price = Number(product.price ?? 0);
  const compareAtPrice = Number(product.compareAtPrice ?? 0);
  const hasDiscount = compareAtPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;
  const availableQuantity = getAvailableQuantity(product);
  const isOutOfStock =
    product.stockStatus === "OUT_OF_STOCK" ||
    (availableQuantity === 0 && (product.inventoryItems?.length ?? 0) > 0);
  const isLowStock = availableQuantity > 0 && availableQuantity < 5;
  const inCart = cart.some((item) => item.id === product.id);
  const brandOrCategory =
    product.brand?.name ??
    (typeof product.category === "string" ? product.category : product.category?.name);

  useEffect(() => {
    const button = primaryButtonRef.current;
    if (!button) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0.2 }
    );
    observer.observe(button);
    return () => observer.disconnect();
  }, []);

  const handleMobileGalleryScroll = () => {
    const gallery = galleryRef.current;
    if (!gallery) return;
    setSelectedImageIndex(Math.round(gallery.scrollLeft / gallery.clientWidth));
  };

  const specEntries = Object.entries(flatSpecs);

  return (
    <div className="bg-white pb-28 lg:pb-16">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

       

        {/* Main grid */}
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">

          {/* ── Gallery column ── */}
          <div>
            {/* Mobile: swipeable */}
            <div
              ref={galleryRef}
              onScroll={handleMobileGalleryScroll}
              className="flex snap-x snap-mandatory gap-3 overflow-x-auto lg:hidden"
              style={{ scrollbarWidth: "none" }}
            >
              {images.map((src, i) => (
                <div
                  key={`${src}-${i}`}
                  className="relative aspect-square min-w-full snap-center rounded-xl border border-stone-200 bg-stone-50 overflow-hidden"
                >
                  <Image
                    src={src}
                    alt={product.name}
                    fill
                    priority={i === 0}
                    sizes="100vw"
                    className="object-contain p-8"
                  />
                </div>
              ))}
            </div>

            {/* Mobile dots */}
            {images.length > 1 && (
              <div className="mt-3 flex items-center justify-center gap-1.5 lg:hidden">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "rounded-full transition-all",
                      i === selectedImageIndex
                        ? "size-1.5 bg-stone-900"
                        : "size-1.5 bg-stone-300"
                    )}
                  />
                ))}
              </div>
            )}

            {/* Desktop: sticky gallery */}
            <div className="hidden lg:sticky lg:top-24 lg:block">
              {/* Main image */}
              <div className="relative aspect-square rounded-xl border border-stone-200 bg-stone-50 overflow-hidden">
                <Image
                  src={images[selectedImageIndex] ?? "/placeholder.png"}
                  alt={product.name}
                  fill
                  priority
                  sizes="50vw"
                  className="object-contain p-12"
                />
                {isOutOfStock && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                    <span className="rounded-full bg-stone-800/80 px-4 py-1.5 text-xs font-semibold text-white">
                      Out of stock
                    </span>
                  </div>
                )}
                {hasDiscount && !isOutOfStock && (
                  <div className="absolute left-3 top-3 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-bold text-white">
                    -{discountPercent}%
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {images.map((src, i) => (
                    <button
                      key={`thumb-${i}`}
                      type="button"
                      onClick={() => setSelectedImageIndex(i)}
                      className={cn(
                        "relative aspect-square rounded-lg border overflow-hidden bg-stone-50 transition-all",
                        i === selectedImageIndex
                          ? "border-stone-900 ring-1 ring-stone-900"
                          : "border-stone-200 hover:border-stone-400"
                      )}
                      aria-label={`View image ${i + 1}`}
                    >
                      <Image
                        src={src}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-contain p-2"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Info column ── */}
          <div>
            {/* Brand + actions row */}
            <div className="flex items-center justify-between">
              {brandOrCategory && (
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
                  {brandOrCategory}
                </p>
              )}
              
            </div>

            {/* Name */}
            <h1 className="mt-2 text-2xl font-bold text-stone-900 tracking-tight sm:text-3xl leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="mt-3">
              <StarRating />
            </div>

            {/* SKU */}
            {product.sku && (
              <p className="mt-2 text-xs text-stone-400">SKU: {product.sku}</p>
            )}

            {/* Price */}
            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-stone-900 tracking-tight">
                ₹{price.toLocaleString("en-IN")}
              </span>
              {hasDiscount && (
                <span className="text-base text-stone-400 line-through">
                  ₹{compareAtPrice.toLocaleString("en-IN")}
                </span>
              )}
              {hasDiscount && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                  Save {discountPercent}%
                </span>
              )}
            </div>

            {/* Stock status */}
            <div className="mt-3">
              {isLowStock ? (
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                  <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" aria-hidden />
                  Only {availableQuantity} left — order soon
                </p>
              ) : isOutOfStock ? (
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 bg-stone-100 rounded-full px-3 py-1">
                  Currently out of stock
                </p>
              ) : (
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                  <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
                  In stock
                </p>
              )}
            </div>

            {/* CTA */}
            <div className="mt-6 space-y-3">
              <Button
                ref={primaryButtonRef}
                size="lg"
                className="h-12 w-full rounded-xl bg-stone-900 text-white hover:bg-stone-700 text-sm font-semibold transition-colors disabled:opacity-50"
                onClick={() => addToCart(product)}
                disabled={isOutOfStock}
              >
                {isOutOfStock
                  ? "Out of stock"
                  : inCart
                  ? "Add another to cart"
                  : "Add to cart"}
              </Button>
              
            </div>

            {/* Trust indicators */}
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                { icon: Lock, label: "Secure checkout" },
                { icon: Truck, label: "Free delivery" },
                { icon: ShieldCheck, label: "1 year warranty" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 rounded-lg bg-stone-50 border border-stone-100 px-2 py-3 text-center"
                >
                  <Icon className="size-4 text-stone-500" aria-hidden />
                  <span className="text-[11px] font-medium text-stone-500 leading-tight">{label}</span>
                </div>
              ))}
            </div>

            {/* Description */}
            {product.description && (
              <div className="mt-8 border-t border-stone-100 pt-6">
                <h2 className="text-sm font-semibold text-stone-900 mb-3">Overview</h2>
                <p className="text-sm leading-relaxed text-stone-500">
                  {product.description}
                </p>
              </div>
            )}

            {/* Specs */}
            {specEntries.length > 0 && (
              <div className="mt-6 border-t border-stone-100 pt-6">
                <button
                  type="button"
                  onClick={() => setSpecsOpen((v) => !v)}
                  className="flex w-full items-center justify-between text-sm font-semibold text-stone-900 hover:text-stone-600 transition-colors"
                  aria-expanded={specsOpen}
                >
                  Specifications
                  <span
                    className={cn(
                      "text-stone-400 transition-transform duration-200",
                      specsOpen ? "rotate-180" : ""
                    )}
                    aria-hidden
                  >
                    ▾
                  </span>
                </button>

                {specsOpen && (
                  <div className="mt-4 rounded-xl border border-stone-200 overflow-hidden">
                    {specEntries.map(([key, value], i) => (
                      <div
                        key={key}
                        className={cn(
                          "grid grid-cols-[160px_minmax(0,1fr)] text-sm",
                          i % 2 === 0 ? "bg-white" : "bg-stone-50/50",
                          i !== 0 && "border-t border-stone-100"
                        )}
                      >
                        <span className="px-4 py-3 text-stone-400 font-medium">
                          {key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (c) => c.toUpperCase())}
                        </span>
                        <span className="px-4 py-3 text-stone-900">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sticky bar */}
      {showStickyBar && !isOutOfStock && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur-sm px-4 py-3 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-stone-900 leading-tight">
                {product.name}
              </p>
              <p className="text-sm font-bold text-stone-900">
                ₹{price.toLocaleString("en-IN")}
              </p>
            </div>
            <Button
              className="h-11 min-w-36 rounded-xl bg-stone-900 text-white hover:bg-stone-700 text-sm font-semibold transition-colors shrink-0"
              onClick={() => addToCart(product)}
            >
              {inCart ? "Add another" : "Add to cart"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}