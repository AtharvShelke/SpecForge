import Image from "next/image";
import Link from "next/link";

import { Product } from "@/types";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export default function ProductCard({
  product,
  priority = false,
}: ProductCardProps) {
  const primaryImage =
    product.media?.[0]?.url ?? product.image ?? "/placeholder.png";
  const secondaryImage = product.media?.[1]?.url;
  const brand = product.brand?.name;
  const variant = product.variants?.[0];
  const price = Number(variant?.price ?? 0);
  const compareAtPrice = Number(variant?.compareAtPrice ?? 0);
  const hasDiscount = compareAtPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;
  const isOutOfStock = variant?.status === "OUT_OF_STOCK";
  const href = `/products/${product.slug || product.id}`;

  return (
    <Link
      href={href}
      className="group relative flex h-full flex-col overflow-hidden border border-gray-200 bg-white transition-all duration-300 hover:border-gray-300 hover:shadow-md"
    >
      {/* Discount Badge */}
      {hasDiscount && !isOutOfStock && (
        <div className="absolute left-2.5 top-2.5 z-10 rounded-sm bg-emerald-500 px-1.5 py-0.5 text-xs font-semibold text-white shadow-sm">
          -{discountPercent}%
        </div>
      )}

      {/* Out of Stock Overlay */}
      {isOutOfStock && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
          <span className="rounded-full bg-black/80 px-3 py-1 text-xs font-medium text-white">
            Out of Stock
          </span>
        </div>
      )}

      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
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
              : "group-hover:scale-105",
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
      </div>

      {/* Product Info */}
      <div className="flex flex-1 flex-col p-3.5">
        {brand && (
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            {brand}
          </p>
        )}
        <h3 className="mt-1 line-clamp-2 text-sm font-medium text-gray-900 group-hover:text-gray-700">
          {product.name}
        </h3>

        {/* Price Section */}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-semibold text-gray-900">
            ₹{price.toLocaleString("en-IN")}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">
              ₹{compareAtPrice.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        {/* Quick Action Hint */}
        <div className="mt-2.5">
          <span className="text-xs text-gray-400">Click to view details →</span>
        </div>
      </div>
    </Link>
  );
}
