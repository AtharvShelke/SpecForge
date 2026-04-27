import Image from "next/image";
import Link from "next/link";

import { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export default function ProductCard({
  product,
  priority = false,
}: ProductCardProps) {
  const primaryImage = product.media?.[0]?.url ?? product.image ?? "/placeholder.png";
  const secondaryImage = product.media?.[1]?.url;
  const brand = product.brand?.name;
  const variant = product.variants?.[0];
  const price = Number(variant?.price ?? 0);
  const compareAtPrice = Number(variant?.compareAtPrice ?? 0);
  const hasDiscount = compareAtPrice > price;
  const isOutOfStock = variant?.status === "OUT_OF_STOCK";
  const href = `/products/${product.slug || product.id}`;

  return (
    <Link
      href={href}
      className="group flex h-full flex-col bg-white text-left transition-colors"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <Image
          src={primaryImage}
          alt={product.name}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-contain p-5 ${secondaryImage ? "group-hover:hidden" : ""}`}
        />
        {secondaryImage ? (
          <Image
            src={secondaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="hidden object-contain p-5 group-hover:block"
          />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1 px-1 py-3">
        <p className="text-xs text-gray-500">{brand ?? product.category}</p>
        <h3 className="line-clamp-2 text-sm text-gray-900">{product.name}</h3>

        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-sm font-semibold text-gray-900">
            Rs. {price.toLocaleString("en-IN")}
          </span>
          {hasDiscount ? (
            <span className="text-xs text-gray-400 line-through">
              Rs. {compareAtPrice.toLocaleString("en-IN")}
            </span>
          ) : null}
        </div>

        {isOutOfStock ? (
          <p className="mt-1 text-xs text-gray-500">Out of stock</p>
        ) : null}
      </div>
    </Link>
  );
}
