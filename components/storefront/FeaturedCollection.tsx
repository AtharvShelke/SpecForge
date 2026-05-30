import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Product } from "@/types";
import { cn } from "@/lib/utils";

function PriceBadge({ price, compareAtPrice }: { price: number; compareAtPrice: number }) {
  const hasDiscount = compareAtPrice > price;
  const pct = hasDiscount ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;
  return (
    <div className="flex items-baseline gap-2 mt-auto pt-3">
      <span className="text-sm font-bold text-stone-900">
        ₹{price.toLocaleString("en-IN")}
      </span>
      {hasDiscount && (
        <>
          <span className="text-xs text-stone-400 line-through">
            ₹{compareAtPrice.toLocaleString("en-IN")}
          </span>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
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
    <Link
      href={`/products/${product.slug || product.id}`}
      className={cn(
        "group flex flex-col rounded-xl border border-stone-200 bg-white overflow-hidden hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50/20 transition-all duration-300",
        size === "lg" && "h-full"
      )}
    >
      <div
        className={cn(
          "relative bg-stone-50 overflow-hidden",
          size === "lg" ? "aspect-[4/3]" : size === "md" ? "aspect-square" : "aspect-square"
        )}
      >
        {isOOS && (
          <div className="absolute inset-0 z-10 bg-white/60 flex items-center justify-center">
            <span className="text-xs font-semibold text-stone-400 tracking-wide uppercase">
              Out of stock
            </span>
          </div>
        )}
        <Image
          src={img}
          alt={product.name}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className={cn("flex flex-col p-4", size === "lg" ? "p-5" : "p-4")}>
        {product.brand?.name && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600/80">
            {product.brand.name}
          </p>
        )}
        <h3 className={cn(
          "mt-1 font-semibold text-stone-900 line-clamp-2 group-hover:text-indigo-600 transition-colors leading-snug",
          size === "lg" ? "text-base" : "text-sm"
        )}>
          {product.name}
        </h3>
        <PriceBadge price={price} compareAtPrice={compareAtPrice} />
      </div>
    </Link>
  );
}

export function FeaturedCollection({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  const [hero, ...rest] = products;
  const sideProducts = rest.slice(0, 2);
  const smallGrid = rest.slice(2, 6);

  return (
    <section className="border-t border-stone-100 py-12 sm:py-16">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
            New Arrivals
          </p>
          <h2 className="mt-1.5 text-xl font-bold text-stone-900 tracking-tight">
            Latest additions
          </h2>
        </div>
        <Link
          href="/products?sort=newest"
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors group/link"
        >
          View all
          <ArrowRight className="size-3.5 group-hover/link:translate-x-0.5 transition-transform duration-200" aria-hidden />
        </Link>
      </div>

      {/* Magazine grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Hero tile — spans 2 rows on lg */}
        {hero && (
          <div className="lg:row-span-2">
            <ProductTile product={hero} size="lg" priority />
          </div>
        )}

        {/* Two medium tiles */}
        {sideProducts.map((p, i) => (
          <ProductTile key={p.id} product={p} size="md" priority={i === 0} />
        ))}
      </div>

      {/* Small 4-col grid below */}
      {smallGrid.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {smallGrid.map((p) => (
            <ProductTile key={p.id} product={p} size="sm" />
          ))}
        </div>
      )}

      {/* Mobile "View all" */}
      <div className="mt-6 sm:hidden">
        <Link
          href="/products?sort=newest"
          className="flex w-full items-center justify-center gap-1.5 py-3 rounded-xl border border-stone-200 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
        >
          View all new arrivals
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </section>
  );
}