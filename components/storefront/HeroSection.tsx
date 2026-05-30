import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Shield, Truck, RotateCcw } from "lucide-react";
import { Product } from "@/types";

interface HeroSectionProps {
  featuredProducts: Product[];
}

const TRUST_ITEMS = [
  { icon: Truck, label: "Free shipping over ₹5,000" },
  { icon: RotateCcw, label: "15-day easy returns" },
  { icon: Shield, label: "Secure & verified payments" },
] as const;

export function HeroSection({ featuredProducts }: HeroSectionProps) {
  const [main, second, third] = featuredProducts;

  return (
    <section className="bg-gradient-to-b from-stone-50/70 to-white/30 border-b border-stone-100/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-0 min-h-[540px] lg:min-h-[600px]">

          {/* Left — copy & CTAs */}
          <div className="flex flex-col justify-center py-16 lg:py-20 lg:pr-16">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="relative flex size-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                New arrivals · 2026
              </span>
            </div>

            <h1 className="text-[2.5rem] sm:text-5xl lg:text-[3.25rem] font-bold text-stone-900 leading-[1.08] tracking-tight">
              Build the PC
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 bg-clip-text text-transparent">you deserve.</span>
            </h1>

            <p className="mt-5 text-base text-stone-500 leading-relaxed max-w-sm">
              Hand-picked components from top brands. Real-time compatibility
              checks so every build just works — right out of the box.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/builds/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 text-white text-sm font-semibold hover:opacity-95 transition-all shadow-md shadow-indigo-150/40 hover:shadow-indigo-200/50"
              >
                Start your build
                <ArrowRight className="size-3.5 animate-pulse" aria-hidden />
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-700 text-sm font-semibold hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/10 transition-all duration-300"
              >
                Browse catalog
              </Link>
            </div>

            {/* Trust bar */}
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2.5">
              {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="size-3.5 text-stone-400 shrink-0" aria-hidden />
                  <span className="text-xs text-stone-500">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — editorial product collage */}
          <div
            className="relative hidden lg:flex items-center justify-center py-12"
            aria-hidden="true"
          >
            {/* Background texture */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(99,102,241,0.08)_0%,rgba(139,92,246,0.05)_40%,transparent_60%)]" />

            {/* Main product */}
            {main && (
              <Link
                href={`/products/${main.slug || main.id}`}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 group"
                tabIndex={-1}
              >
                <div className="w-64 aspect-square rounded-2xl bg-white border border-stone-200 shadow-sm overflow-hidden flex items-center justify-center p-6 group-hover:border-indigo-300 group-hover:shadow-lg group-hover:shadow-indigo-50/50 transition-all duration-300">
                  <Image
                    src={main.media?.[0]?.url ?? main.image ?? "/placeholder.png"}
                    alt={main.name}
                    width={200}
                    height={200}
                    className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500"
                    priority
                  />
                </div>
                <div className="mt-2.5 text-center">
                  <p className="text-xs font-semibold text-stone-900 group-hover:text-indigo-600 transition-colors line-clamp-1 max-w-[200px] mx-auto">
                    {main.name}
                  </p>
                  <p className="text-xs font-bold text-indigo-600 mt-0.5">
                    ₹{Number(main.price ?? 0).toLocaleString("en-IN")}
                  </p>
                </div>
              </Link>
            )}

            {/* Second product — top-right offset */}
            {second && (
              <Link
                href={`/products/${second.slug || second.id}`}
                className="absolute top-16 right-8 z-10 group"
                tabIndex={-1}
              >
                <div className="w-36 aspect-square rounded-xl bg-white border border-stone-200 shadow-sm overflow-hidden flex items-center justify-center p-4 group-hover:border-indigo-200 group-hover:shadow-md group-hover:shadow-indigo-50/30 transition-all duration-300">
                  <Image
                    src={second.media?.[0]?.url ?? second.image ?? "/placeholder.png"}
                    alt={second.name}
                    width={120}
                    height={120}
                    className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500"
                    priority
                  />
                </div>
                <div className="mt-1.5 text-center">
                  <p className="text-[11px] font-medium text-stone-700 group-hover:text-indigo-600 transition-colors line-clamp-1 max-w-[130px] mx-auto">
                    {second.name}
                  </p>
                </div>
              </Link>
            )}

            {/* Third product — bottom-left offset */}
            {third && (
              <Link
                href={`/products/${third.slug || third.id}`}
                className="absolute bottom-16 left-10 z-10 group"
                tabIndex={-1}
              >
                <div className="w-32 aspect-square rounded-xl bg-white border border-stone-200 shadow-sm overflow-hidden flex items-center justify-center p-4 group-hover:border-indigo-200 group-hover:shadow-md group-hover:shadow-indigo-50/30 transition-all duration-300">
                  <Image
                    src={third.media?.[0]?.url ?? third.image ?? "/placeholder.png"}
                    alt={third.name}
                    width={110}
                    height={110}
                    className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="mt-1.5 text-center">
                  <p className="text-[11px] font-medium text-stone-700 group-hover:text-indigo-600 transition-colors line-clamp-1 max-w-[120px] mx-auto">
                    {third.name}
                  </p>
                </div>
              </Link>
            )}

            {/* Decorative badge */}
            <div className="absolute bottom-10 right-6 z-30 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 px-3.5 py-2 shadow-sm animate-bounce [animation-duration:4s]">
              <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                New this week
              </p>
              <p className="text-[11px] text-emerald-600/90 font-medium mt-0.5">50+ products added</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}