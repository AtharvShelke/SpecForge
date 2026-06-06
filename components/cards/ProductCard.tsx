import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Product } from "@/types";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
  onClick?: () => void;
  onAdd?: () => void;
  isSelected?: boolean;
  isCompatible?: boolean;
  compatibilityMessage?: string;
}

export default function ProductCard({
  product,
  priority = false,
  onClick,
  onAdd,
  isSelected = false,
  isCompatible,
  compatibilityMessage,
}: ProductCardProps) {
  const primaryImage =
    product.media?.[0]?.url ?? product.image ?? "/placeholder.png";
  const secondaryImage = product.media?.[1]?.url;
  const brand = product.brand?.name;
  const price = Number(product.price ?? 0);
  const compareAtPrice = Number(product.compareAtPrice ?? 0);
  const hasDiscount = compareAtPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;
  const isOutOfStock = product.stockStatus === "OUT_OF_STOCK";
  const href = `/products/${product.slug || product.id}`;

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border bg-white overflow-hidden transition-all duration-200 hover:shadow-md",
        isSelected
          ? "border-blue-400 ring-1 ring-blue-400"
          : "border-stone-200 hover:border-stone-300"
      )}
    >
      {/* Image area */}
      <Link
        href={href}
        onClick={onClick}
        className="relative aspect-square bg-stone-50 overflow-hidden block"
        tabIndex={0}
        aria-label={`View ${product.name}`}
      >
        {/* Discount badge */}
        {hasDiscount && !isOutOfStock && (
          <div className="absolute left-2.5 top-2.5 z-10 rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-semibold text-white">
            -{discountPercent}%
          </div>
        )}

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
            <span className="rounded-full bg-stone-800/80 px-3 py-1 text-xs font-semibold text-white">
              Out of stock
            </span>
          </div>
        )}

        <Image
          src={primaryImage}
          alt={product.name}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={cn(
            "object-contain p-4 transition-all duration-500",
            secondaryImage
              ? "group-hover:opacity-0 group-hover:scale-105"
              : "group-hover:scale-[1.03]"
          )}
        />
        {secondaryImage && (
          <Image
            src={secondaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-4 opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-105"
          />
        )}

        {/* Wishlist button */}
        <button
          type="button"
          className="absolute right-2.5 top-2.5 z-10 size-7 flex items-center justify-center rounded-full bg-white/80 border border-stone-200 text-stone-400 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:border-red-200 transition-all"
          aria-label="Save to wishlist"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <Heart className="size-3.5" />
        </button>
      </Link>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3.5">
        {brand && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
            {brand}
          </p>
        )}

        {/* Compatibility badge */}
        {isCompatible !== undefined && (
          <div className="mt-1 flex items-center gap-1.5">
            {isCompatible ? (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 border border-emerald-100">
                <span className="size-1.25 rounded-full bg-emerald-500" />
                Compatible
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-700 border border-rose-100">
                <span className="size-1.25 rounded-full bg-rose-500" />
                Incompatible
              </span>
            )}
          </div>
        )}

        <Link href={href} onClick={onClick}>
          <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-stone-900 leading-snug hover:text-stone-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        {isCompatible === false && compatibilityMessage && (
          <p className="mt-1.5 text-[10px] font-bold text-rose-600 bg-rose-50/50 border border-rose-100/50 rounded-lg px-2.5 py-1 leading-snug">
            {compatibilityMessage}
          </p>
        )}

        {/* Mock star rating */}
        <div className="mt-1.5 flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "size-2.5",
                  i < 4 ? "fill-amber-400 text-amber-400" : "text-stone-200"
                )}
                aria-hidden
              />
            ))}
          </div>
          <span className="text-[11px] text-stone-400">(124)</span>
        </div>

        {/* Price */}
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-sm font-bold text-stone-900">
            ₹{price.toLocaleString("en-IN")}
          </span>
          {hasDiscount && (
            <span className="text-xs text-stone-400 line-through">
              ₹{compareAtPrice.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        {/* CTA */}
        <div className="mt-3">
          {onAdd ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAdd();
              }}
              disabled={isOutOfStock}
              className={cn(
                "w-full flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                isSelected
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : isOutOfStock
                    ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                    : "bg-stone-900 text-white hover:bg-stone-700"
              )}
            >
              {isSelected ? (
                "Selected"
              ) : isOutOfStock ? (
                "Unavailable"
              ) : (
                <>
                  <ShoppingCart className="size-3.5" aria-hidden />
                  Add to build
                </>
              )}
            </button>
          ) : (
            <Link
              href={href}
              onClick={onClick}
              className={cn(
                "w-full flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold border transition-colors",
                isOutOfStock
                  ? "border-stone-200 text-stone-400 cursor-not-allowed pointer-events-none"
                  : "border-stone-200 text-stone-700 hover:border-stone-900 hover:text-stone-900"
              )}
              aria-disabled={isOutOfStock}
              tabIndex={isOutOfStock ? -1 : 0}
            >
              View details
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}