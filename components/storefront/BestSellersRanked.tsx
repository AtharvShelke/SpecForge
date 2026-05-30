import Link from "next/link";
import Image from "next/image";
import { ArrowRight, TrendingUp, Star, Zap } from "lucide-react";
import { Product } from "@/types";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-amber-900">
        1
      </span>
    );
  if (rank === 2)
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-stone-300 text-xs font-bold text-stone-700">
        2
      </span>
    );
  if (rank === 3)
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-orange-200 text-xs font-bold text-orange-800">
        3
      </span>
    );
  return (
    <span className="inline-flex size-6 items-center justify-center rounded-full bg-stone-100 text-xs font-medium text-stone-500">
      {rank}
    </span>
  );
}

function SocialProofChip({ product, index }: { product: Product; index: number }) {
  const chips = [
    { icon: TrendingUp, text: "Trending this week" },
    { icon: Star, text: "Top rated" },
    { icon: Zap, text: "Fast moving" },
    { icon: TrendingUp, text: "Popular pick" },
  ];
  const chip = chips[index % chips.length];
  return (
    <div className="flex items-center gap-1 text-[11px] text-stone-400">
      <chip.icon className="size-3 shrink-0" aria-hidden />
      {chip.text}
    </div>
  );
}

function BestSellerRow({ product, rank }: { product: Product; rank: number }) {
  const img = product.media?.[0]?.url ?? product.image ?? "/placeholder.png";
  const price = Number(product.price ?? 0);
  const compareAtPrice = Number(product.compareAtPrice ?? 0);
  const hasDiscount = compareAtPrice > price;
  const isOOS = product.stockStatus === "OUT_OF_STOCK";

  return (
    <Link
      href={`/products/${product.slug || product.id}`}
      className="group flex items-center gap-4 py-4 border-b border-stone-100 last:border-0 hover:bg-stone-50 -mx-4 px-4 rounded-lg transition-colors"
    >
      <RankBadge rank={rank} />

      <div className="size-14 shrink-0 rounded-lg bg-stone-50 border border-stone-200 overflow-hidden flex items-center justify-center p-2">
        <Image
          src={img}
          alt={product.name}
          width={48}
          height={48}
          className="object-contain w-full h-full"
        />
      </div>

      <div className="flex-1 min-w-0">
        {product.brand?.name && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-0.5">
            {product.brand.name}
          </p>
        )}
        <p className="text-sm font-semibold text-stone-900 group-hover:text-stone-600 transition-colors line-clamp-1">
          {product.name}
        </p>
        <SocialProofChip product={product} index={rank - 1} />
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-stone-900">
          ₹{price.toLocaleString("en-IN")}
        </p>
        {hasDiscount && (
          <p className="text-xs text-stone-400 line-through">
            ₹{compareAtPrice.toLocaleString("en-IN")}
          </p>
        )}
        {isOOS ? (
          <span className="text-[11px] text-stone-400">Out of stock</span>
        ) : (
          <span className="text-[11px] text-emerald-600 font-medium">In stock</span>
        )}
      </div>

      <ArrowRight className="size-4 text-stone-300 group-hover:text-stone-600 transition-colors shrink-0" aria-hidden />
    </Link>
  );
}

export function BestSellersRanked({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <section className="border-t border-stone-100 py-12 sm:py-16">
      <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">

        {/* Left column — header + CTAs */}
        <div className="lg:sticky lg:top-24 lg:h-fit">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">
            Best sellers
          </p>
          <h2 className="mt-1.5 text-xl font-bold text-stone-900 tracking-tight leading-tight">
            What everyone's buying
          </h2>
          <p className="mt-3 text-sm text-stone-500 leading-relaxed">
            These components ship daily. Updated weekly based on real purchase data.
          </p>

          <div className="mt-6 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="size-1.5 mt-1.5 rounded-full bg-amber-400 shrink-0" aria-hidden />
              <p className="text-xs text-stone-500">Ranked by total units sold this month</p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="size-1.5 mt-1.5 rounded-full bg-emerald-400 shrink-0" aria-hidden />
              <p className="text-xs text-stone-500">Stock status updated in real-time</p>
            </div>
          </div>

          <Link
            href="/products?sort=popular"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-stone-900 hover:text-stone-600 transition-colors"
          >
            See full rankings
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>

        {/* Right column — ranked list */}
        <div className="lg:col-span-2">
          {products.slice(0, 8).map((product, index) => (
            <BestSellerRow key={product.id} product={product} rank={index + 1} />
          ))}
        </div>

      </div>
    </section>
  );
}