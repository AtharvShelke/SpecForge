"use client";

import { Star, CheckCircle, Flame, Clock } from "lucide-react";
import { motion } from "framer-motion";

const REVIEWS = [
  {
    id: 1,
    name: "Arjun S.",
    location: "Pune",
    rating: 5,
    text: "Build PC feature is phenomenal. It flagged an incompatibility I would have missed. My i9 + RTX 4080 build runs flawlessly.",
    product: "Custom Gaming Build",
    timeAgo: "2 days ago",
  },
  {
    id: 2,
    name: "Priya M.",
    location: "Bangalore",
    rating: 5,
    text: "Prices are genuinely competitive. Got my RAM delivered next day. Packaging was secure and the product is 100% genuine.",
    product: "DDR5 32GB Kit",
    timeAgo: "1 week ago",
  },
  {
    id: 3,
    name: "Rohan K.",
    location: "Delhi",
    rating: 5,
    text: "Great selection of GPUs. Support team helped me choose between two options over chat. Very knowledgeable staff.",
    product: "RTX 4070 Super",
    timeAgo: "3 days ago",
  },
] as const;

const ACTIVITY = [
  { city: "Mumbai", product: "Ryzen 7 7800X3D", timeAgo: "3 min ago" },
  { city: "Hyderabad", product: "RTX 4070 Ti Super", timeAgo: "8 min ago" },
  { city: "Chennai", product: "Samsung 990 Pro 2TB", timeAgo: "12 min ago" },
  { city: "Kolkata", product: "ASUS ROG Maximus Z790", timeAgo: "18 min ago" },
] as const;

function StarRating({ rating, inverted = false }: { rating: number; inverted?: boolean }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-3.5 ${
            i < rating 
              ? inverted 
                ? "fill-amber-300 text-amber-300" 
                : "fill-amber-400 text-amber-400" 
              : inverted 
              ? "text-indigo-400/40" 
              : "text-stone-200"
          }`}
          aria-hidden
        />
      ))}
    </div>
  );
}

export function SocialProof() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 90, damping: 14 } },
  };

  return (
    <section className="border-t border-stone-150/50 py-16" aria-label="Customer reviews and activity">
      <div className="grid lg:grid-cols-12 gap-12 lg:gap-8">

        {/* Left: heading + summary stat + recent purchases */}
        <div className="lg:col-span-4 space-y-6">
          <div>
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-2.5 py-0.5 rounded-full mb-1">
              Reviews
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-tight">
              Trusted by builders across India
            </h2>
          </div>

          {/* Premium aggregate rating card (Glowing Indigo/Violet gradient) */}
          <div className="relative rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white p-6 shadow-[0_12px_36px_rgba(99,102,241,0.2)] border border-indigo-500/40 overflow-hidden">
            <div className="absolute top-[-30%] right-[-30%] w-[180px] h-[180px] rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tracking-tight text-white">4.8</span>
                <span className="text-sm font-bold text-indigo-200">/ 5</span>
              </div>
              <div className="mt-2">
                <StarRating rating={5} inverted />
              </div>
              <p className="mt-4 text-xs font-bold text-indigo-100 flex items-center gap-1.5 bg-indigo-500/30 border border-indigo-400/20 px-3 py-1.5 rounded-xl w-fit">
                <CheckCircle className="size-3.5 text-cyan-300" />
                Based on 2,400+ verified orders
              </p>
            </div>
          </div>

          {/* Live activity card */}
          <div className="rounded-2xl border border-stone-200 bg-white/70 backdrop-blur-md p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-stone-150/60">
              <p className="text-xs font-black uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Flame className="size-3.5 text-orange-500 animate-bounce" />
                Live Purchases
              </p>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-stone-400">
                <Clock className="size-3" /> Real-time
              </span>
            </div>
            
            <div className="space-y-4">
              {ACTIVITY.map((item) => (
                <div key={item.product} className="flex items-start gap-3 group">
                  <span className="relative flex h-2 w-2 mt-1.5 shrink-0" aria-hidden>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 animate-pulse"></span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-stone-850 line-clamp-1 group-hover:text-indigo-650 transition-colors">{item.product}</p>
                    <p className="text-[10px] text-stone-400 font-semibold mt-0.5">
                      {item.city} · {item.timeAgo}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: review cards grid with entry stagger */}
        <motion.div 
          className="lg:col-span-8 flex flex-col gap-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {REVIEWS.map((review) => (
            <motion.article
              key={review.id}
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="rounded-2xl border border-stone-200 bg-white/70 backdrop-blur-md p-6 hover:border-indigo-300 hover:shadow-[0_12px_30px_rgba(99,102,241,0.06)] transition-all duration-300 group cursor-default"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`size-9 rounded-full bg-gradient-to-tr border flex items-center justify-center text-xs font-black shadow-inner ${
                    review.id % 3 === 0
                      ? "from-indigo-50 to-violet-50 text-indigo-600 border-indigo-100"
                      : review.id % 3 === 1
                      ? "from-emerald-50 to-teal-50 text-emerald-600 border-emerald-100"
                      : "from-amber-50 to-orange-50 text-amber-600 border-amber-100"
                  }`}>
                    {review.name[0]}
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-stone-800 group-hover:text-indigo-650 transition-colors">{review.name}</p>
                    <p className="text-[10px] text-stone-450 font-semibold">{review.location} · {review.timeAgo}</p>
                  </div>
                </div>
                <StarRating rating={review.rating} />
              </div>

              <blockquote className="mt-4 text-xs sm:text-sm text-stone-600 leading-relaxed font-medium italic">
                "{review.text}"
              </blockquote>

              <div className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50/70 border border-indigo-150 px-2.5 py-1 rounded-full shadow-sm">
                <CheckCircle className="size-3 text-indigo-550" />
                Verified Purchase: {review.product}
              </div>
            </motion.article>
          ))}
        </motion.div>

      </div>
    </section>
  );
}