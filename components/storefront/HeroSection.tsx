"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Shield, Truck, RotateCcw, Sparkles } from "lucide-react";
import { Product } from "@/types";
import { motion } from "framer-motion";

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

  // Stagger variants for enter animation
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 80, damping: 15 } },
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-stone-50/90 via-stone-50/40 to-transparent border-b border-stone-200/50 py-8 lg:py-0">
      {/* Decorative ambient bg element */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_120%,rgba(99,102,241,0.06)_0%,transparent_50%)] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 min-h-[580px] lg:min-h-[660px]">
          
          {/* Left — copy & CTAs */}
          <motion.div 
            className="lg:col-span-6 flex flex-col justify-center py-10 lg:py-16 lg:pr-8"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {/* Eyebrow */}
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 mb-6 self-start">
              <span className="relative flex size-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50/80 px-2.5 py-1 rounded-full border border-indigo-100/60">
                New Arrivals · 2026
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1 
              variants={itemVariants} 
              className="text-4xl sm:text-5xl lg:text-[3.75rem] font-black text-stone-900 leading-[1.05] tracking-tight"
            >
              Build the PC
              <br />
              <span className="relative inline-block mt-1">
                <span className="absolute -inset-1 rounded-lg bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-cyan-500/10 blur-sm pointer-events-none" />
                <span className="relative bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 bg-clip-text text-transparent">
                  you deserve.
                </span>
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p 
              variants={itemVariants} 
              className="mt-6 text-base sm:text-lg text-stone-500 leading-relaxed max-w-md"
            >
              Hand-picked components from top brands. Real-time compatibility
              checks so every build just works — right out of the box.
            </motion.p>

            {/* Actions */}
            <motion.div 
              variants={itemVariants} 
              className="mt-8 flex flex-wrap items-center gap-3.5"
            >
              <Link
                href="/builds/new"
                className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 text-white text-sm font-semibold transition-all shadow-md shadow-indigo-200/50 hover:shadow-lg hover:shadow-indigo-300/60 hover:-translate-y-0.5 active:translate-y-0"
              >
                {/* Micro-sparkle effect on CTA */}
                <Sparkles className="size-4 text-indigo-200 animate-pulse group-hover:rotate-12 transition-transform" />
                Start your build
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" aria-hidden />
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-stone-200 bg-white/80 backdrop-blur-sm text-stone-700 text-sm font-semibold hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/20 hover:-translate-y-0.5 transition-all duration-300 shadow-sm"
              >
                Browse catalog
              </Link>
            </motion.div>

            {/* Trust bar */}
            <motion.div 
              variants={itemVariants} 
              className="mt-12 pt-8 border-t border-stone-200/60 flex flex-wrap gap-x-6 gap-y-3"
            >
              {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 bg-stone-100/40 border border-stone-200/20 px-3 py-1.5 rounded-lg backdrop-blur-sm shadow-sm">
                  <Icon className="size-3.5 text-indigo-500 shrink-0" aria-hidden />
                  <span className="text-[11px] font-semibold text-stone-600">{label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — editorial product collage */}
          <div
            className="lg:col-span-6 relative flex items-center justify-center min-h-[360px] lg:min-h-0 py-8 pointer-events-none"
            aria-hidden="true"
          >
            {/* Background texture & glowing halo */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.12)_0%,rgba(139,92,246,0.06)_30%,transparent_60%)] animate-pulse [animation-duration:10s]" />

            {/* Main product card (Floating center) */}
            {main && (
              <motion.div
                className="absolute z-20 pointer-events-auto"
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  y: [0, -12, 0],
                }}
                transition={{
                  scale: { duration: 0.6, ease: "easeOut" },
                  y: { repeat: Infinity, duration: 6, ease: "easeInOut" }
                }}
              >
                <Link
                  href={`/products/${main.slug || main.id}`}
                  className="block group"
                >
                  <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-2xl bg-white/80 backdrop-blur-md border border-white/80 shadow-[0_8px_32px_rgba(99,102,241,0.08)] overflow-hidden flex items-center justify-center p-6 group-hover:border-indigo-400/80 group-hover:shadow-[0_12px_40px_rgba(99,102,241,0.16)] transition-all duration-300">
                    <div className="relative w-full h-full">
                      <Image
                        src={main.media?.[0]?.url ?? main.image ?? "/placeholder.png"}
                        alt={main.name}
                        fill
                        className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500"
                        priority
                      />
                    </div>
                  </div>
                  <div className="mt-3 text-center bg-white/60 backdrop-blur-sm border border-stone-200/40 rounded-xl py-1.5 px-3 max-w-[200px] mx-auto shadow-sm">
                    <p className="text-[11px] font-bold text-stone-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {main.name}
                    </p>
                    <p className="text-xs font-black text-indigo-600 mt-0.5">
                      ₹{Number(main.price ?? 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                </Link>
              </motion.div>
            )}

            {/* Second product card — top-right offset */}
            {second && (
              <motion.div
                className="absolute top-4 right-2 sm:right-6 lg:right-4 z-10 pointer-events-auto"
                initial={{ opacity: 0, x: 20, y: -20 }}
                animate={{ 
                  opacity: 1, 
                  x: 0, 
                  y: [0, 8, 0],
                }}
                transition={{
                  x: { duration: 0.6, delay: 0.2, ease: "easeOut" },
                  y: { repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.5 }
                }}
              >
                <Link
                  href={`/products/${second.slug || second.id}`}
                  className="block group"
                >
                  <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-xl bg-white/60 backdrop-blur-md border border-white/50 shadow-[0_8px_24px_rgba(0,0,0,0.03)] overflow-hidden flex items-center justify-center p-4 group-hover:border-indigo-300/80 group-hover:shadow-[0_12px_32px_rgba(99,102,241,0.1)] transition-all duration-300">
                    <div className="relative w-full h-full">
                      <Image
                        src={second.media?.[0]?.url ?? second.image ?? "/placeholder.png"}
                        alt={second.name}
                        fill
                        className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500"
                        priority
                      />
                    </div>
                  </div>
                  <div className="mt-1.5 text-center">
                    <p className="text-[10px] font-bold text-stone-700 group-hover:text-indigo-600 transition-colors line-clamp-1 max-w-[130px] mx-auto">
                      {second.name}
                    </p>
                  </div>
                </Link>
              </motion.div>
            )}

            {/* Third product card — bottom-left offset */}
            {third && (
              <motion.div
                className="absolute bottom-4 left-2 sm:left-6 lg:left-4 z-10 pointer-events-auto"
                initial={{ opacity: 0, x: -20, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  x: 0, 
                  y: [0, -8, 0],
                }}
                transition={{
                  x: { duration: 0.6, delay: 0.3, ease: "easeOut" },
                  y: { repeat: Infinity, duration: 7, ease: "easeInOut", delay: 0.2 }
                }}
              >
                <Link
                  href={`/products/${third.slug || third.id}`}
                  className="block group"
                >
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl bg-white/60 backdrop-blur-md border border-white/50 shadow-[0_8px_24px_rgba(0,0,0,0.03)] overflow-hidden flex items-center justify-center p-4 group-hover:border-indigo-300/80 group-hover:shadow-[0_12px_32px_rgba(99,102,241,0.1)] transition-all duration-300">
                    <div className="relative w-full h-full">
                      <Image
                        src={third.media?.[0]?.url ?? third.image ?? "/placeholder.png"}
                        alt={third.name}
                        fill
                        className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  </div>
                  <div className="mt-1.5 text-center">
                    <p className="text-[10px] font-bold text-stone-700 group-hover:text-indigo-600 transition-colors line-clamp-1 max-w-[120px] mx-auto">
                      {third.name}
                    </p>
                  </div>
                </Link>
              </motion.div>
            )}

            {/* Premium status badge */}
            <motion.div 
              className="absolute bottom-6 right-2 sm:right-6 lg:right-0 z-30 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 px-4 py-2.5 shadow-[0_8px_24px_rgba(16,185,129,0.12)] flex flex-col pointer-events-auto select-none"
              animate={{ 
                y: [0, -4, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 4,
                ease: "easeInOut"
              }}
            >
              <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <span className="relative flex size-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                New This Week
              </p>
              <p className="text-[10px] text-emerald-600/90 font-semibold mt-0.5">50+ parts added recently</p>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}