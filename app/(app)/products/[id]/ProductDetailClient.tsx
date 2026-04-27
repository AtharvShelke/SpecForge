"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Lock, ShieldCheck, Truck } from "lucide-react";

import VariantSelector from "@/components/storefront/VariantSelector";
import { Button } from "@/components/ui/button";
import { useShop } from "@/context/ShopContext";
import { Product, ProductVariant, specsToFlat } from "@/types";

interface ProductDetailClientProps {
  product: Product;
}

function getAvailableQuantity(variant?: ProductVariant) {
  return (variant?.inventoryItems ?? []).reduce((total, item) => {
    return total + Math.max(0, Number(item.quantityOnHand ?? 0) - Number(item.quantityReserved ?? 0));
  }, 0);
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { addToCart, cart } = useShop();
  const images =
    product.media?.map((media) => media.url) ??
    (product.image ? [product.image] : ["/placeholder.png"]);
  const flatSpecs = useMemo(() => specsToFlat(product.specs), [product.specs]);
  const variants = product.variants ?? [];
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id ?? "");
  const [showStickyBar, setShowStickyBar] = useState(false);
  const galleryRef = useRef<HTMLDivElement | null>(null);
  const primaryButtonRef = useRef<HTMLButtonElement | null>(null);

  const selectedVariant =
    variants.find((variant) => variant.id === selectedVariantId) ?? variants[0];
  const price = Number(selectedVariant?.price ?? 0);
  const compareAtPrice = Number(selectedVariant?.compareAtPrice ?? 0);
  const hasDiscount = compareAtPrice > price;
  const availableQuantity = getAvailableQuantity(selectedVariant);
  const isOutOfStock =
    selectedVariant?.status === "OUT_OF_STOCK" ||
    (availableQuantity === 0 && (selectedVariant?.inventoryItems?.length ?? 0) > 0);
  const isLowStock = availableQuantity > 0 && availableQuantity < 5;
  const inCart = cart.some((item) => item.id === product.id);

  useEffect(() => {
    const button = primaryButtonRef.current;
    if (!button) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyBar(!entry.isIntersecting);
      },
      { threshold: 0.2 },
    );

    observer.observe(button);
    return () => observer.disconnect();
  }, []);

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    addToCart(product, selectedVariant);
  };

  const handleMobileGalleryScroll = () => {
    const gallery = galleryRef.current;
    if (!gallery) return;
    const nextIndex = Math.round(gallery.scrollLeft / gallery.clientWidth);
    setSelectedImageIndex(nextIndex);
  };

  return (
    <div className="bg-white pb-24">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-900"
        >
          <ArrowLeft className="size-4" />
          Back to products
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(380px,480px)] lg:items-start">
          <div className="space-y-4">
            <div
              ref={galleryRef}
              onScroll={handleMobileGalleryScroll}
              className="flex snap-x snap-mandatory gap-4 overflow-x-auto lg:hidden"
            >
              {images.map((image, index) => (
                <div
                  key={`${image}-${index}`}
                  className="relative aspect-square min-w-full snap-center border border-gray-200 bg-gray-50"
                >
                  <Image
                    src={image}
                    alt={product.name}
                    fill
                    priority={index === 0}
                    sizes="100vw"
                    className="object-contain p-6"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 lg:hidden">
              {images.map((_, index) => (
                <span
                  key={index}
                  className={`h-1.5 w-1.5 rounded-full ${
                    index === selectedImageIndex ? "bg-gray-900" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>

            <div className="hidden lg:sticky lg:top-24 lg:block">
              <div className="border border-gray-200 bg-gray-50">
                <div className="relative aspect-square">
                  <Image
                    src={images[selectedImageIndex] ?? "/placeholder.png"}
                    alt={product.name}
                    fill
                    priority
                    sizes="50vw"
                    className="object-contain p-10"
                  />
                </div>
              </div>
              {images.length > 1 ? (
                <div className="mt-4 grid grid-cols-5 gap-3">
                  {images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative aspect-square overflow-hidden border bg-gray-50 ${
                        index === selectedImageIndex ? "border-gray-900" : "border-gray-200"
                      }`}
                    >
                      <Image
                        src={image}
                        alt={product.name}
                        fill
                        sizes="96px"
                        className="object-contain p-3"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-gray-500">
              {product.brand?.name ?? product.category}
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-gray-900 sm:text-4xl">
              {product.name}
            </h1>
            <div className="mt-4 flex items-end gap-3">
              <p className="text-2xl font-semibold text-gray-900 sm:text-3xl">
                Rs. {price.toLocaleString("en-IN")}
              </p>
              {hasDiscount ? (
                <p className="pb-1 text-sm text-gray-400 line-through">
                  Rs. {compareAtPrice.toLocaleString("en-IN")}
                </p>
              ) : null}
            </div>

            {isLowStock ? (
              <p className="mt-3 text-sm text-red-600">
                Only {availableQuantity} left in stock - order soon
              </p>
            ) : null}

            {variants.length > 1 ? (
              <div className="mt-8 border-t border-gray-200 pt-8">
                <VariantSelector
                  variants={variants}
                  selectedVariantId={selectedVariant?.id ?? ""}
                  onVariantChange={(variant) => setSelectedVariantId(variant.id)}
                />
              </div>
            ) : null}

            <div className="mt-8 border-t border-gray-200 pt-8">
              <Button
                ref={primaryButtonRef}
                size="lg"
                className="h-12 w-full"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? "Out of stock" : inCart ? "Add another to cart" : "Add to cart"}
              </Button>

              <div className="mt-4 grid gap-3 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Lock className="size-4" />
                  Secure checkout
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="size-4" />
                  Free delivery
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4" />
                  1 year warranty
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-8">
              <h2 className="text-sm font-medium text-gray-900">Overview</h2>
              <p className="mt-3 text-sm leading-7 text-gray-600">
                {product.description || "Product details will be updated soon."}
              </p>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-8">
              <h2 className="text-sm font-medium text-gray-900">Specifications</h2>
              <div className="mt-4 divide-y divide-gray-200 border border-gray-200">
                {Object.entries(flatSpecs).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-[140px_minmax(0,1fr)] gap-4 px-4 py-3 text-sm">
                    <span className="text-gray-500">
                      {key.replace(/([A-Z])/g, " $1").replace(/^./, (entry) => entry.toUpperCase())}
                    </span>
                    <span className="text-gray-900">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showStickyBar && !isOutOfStock ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white p-4 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{product.name}</p>
              <p className="text-sm text-gray-500">Rs. {price.toLocaleString("en-IN")}</p>
            </div>
            <Button className="h-12 min-w-36" onClick={handleAddToCart}>
              Add to cart
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
