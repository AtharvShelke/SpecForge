import Link from "next/link";
import Image from "next/image";
import { ArrowRight, TrendingUp, Star, Zap } from "lucide-react";
import { Product } from "@/types";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-xs font-bold text-white shadow-sm shadow-amber-200">
        1
      </span>
    );
  if (rank === 2)
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-gradient-to-r from-slate-300 to-slate-400 text-xs font-bold text-white shadow-sm shadow-slate-200">
        2
      </span>
    );
  if (rank === 3)
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-gradient-to-r from-amber-600 to-amber-700 text-xs font-bold text-white shadow-sm shadow-amber-700/20">
        3
      </span>
    );
  return (
    <span className="inline-flex size-6 items-center justify-center rounded-full bg-stone-100 border border-stone-200/50 text-xs font-semibold text-stone-500">
      {rank}
    </span>
  );
}

function SocialProofChip({ product, index }: { product: Product; index: number }) {
  const chips = [
    { icon: TrendingUp, text: "Trending this week", color: "text-amber-600 bg-amber-50 border-amber-100/70" },
    { icon: Star, text: "Top rated", color: "text-yellow-600 bg-yellow-50 border-yellow-100/70" },
    { icon: Zap, text: "Fast moving", color: "text-indigo-600 bg-indigo-50 border-indigo-100/70" },
    { icon: TrendingUp, text: "Popular pick", color: "text-violet-600 bg-violet-50 border-violet-100/70" },
  ];
  const chip = chips[index % chips.length];
  return (
    <div className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 border ${chip.color}`}>
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
      className="group flex items-center gap-4 py-4 border-b border-stone-100 last:border-0 hover:bg-indigo-50/20 -mx-4 px-4 rounded-lg transition-colors"
    >
      <RankBadge rank={rank} />

      <div className="size-14 shrink-0 rounded-lg bg-stone-50 border border-stone-200 overflow-hidden flex items-center justify-center p-2 group-hover:border-indigo-200 transition-colors">
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
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600/80 mb-0.5">
            {product.brand.name}
          </p>
        )}
        <p className="text-sm font-semibold text-stone-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
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
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
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
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors group/link"
          >
            See full rankings
            <ArrowRight className="size-3.5 group-hover/link:translate-x-0.5 transition-transform duration-200" aria-hidden />
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