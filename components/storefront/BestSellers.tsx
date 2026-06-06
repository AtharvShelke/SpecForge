// components/storefront/BestSellers.tsx
"use client";

import Image from "next/image";
import { TrendingUp, Star } from "lucide-react";

const BEST_SELLERS = [
  { rank: 1, name: "Samsung 990 Pro NVMe M.2 SSD 2TB", price: "₹19,200", badge: "Trending This Week" },
  { rank: 2, name: "Corsair RM850e 850W ATX 3.0 Power Supply", price: "₹11,499", badge: "Customer Favorite" },
  { rank: 3, name: "NZXT Kraken Elite 360 RGB AIO Cooler", price: "₹24,800", badge: "Top Rated" },
  { rank: 4, name: "G.Skill Trident Z5 Neo RGB 32GB DDR5", price: "₹14,250", badge: "Fast Moving" },
];

export function BestSellers() {
  return (
    <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-stone-50">
      <div className="mb-12">
        <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-stone-400 mb-2">High Demand Velocity</h2>
        <p className="text-3xl font-black tracking-tight text-stone-900">Best Sellers</p>
      </div>

      <div className="flex overflow-x-auto gap-6 pb-6 scrollbar-thin scrollbar-thumb-stone-200">
        {BEST_SELLERS.map((item) => (
          <div key={item.rank} className="flex-none w-80 bg-white border border-stone-200/60 rounded-2xl p-6 transition-all duration-300 hover:border-stone-300">
            <div className="flex items-start justify-between">
              <span className="text-xs font-mono font-bold text-stone-300">#0{item.rank}</span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-600 uppercase tracking-wide">
                <TrendingUp className="size-3" />
                {item.badge}
              </div>
            </div>

            <div className="relative w-full h-40 my-4 flex items-center justify-center bg-stone-50/50 rounded-xl p-4">
              <Image 
                src="/images/bestseller-placeholder.png" 
                alt={item.name}
                fill
                className="object-contain p-2"
              />
            </div>

            <div className="mt-4">
              <h3 className="font-bold text-stone-900 text-sm tracking-tight line-clamp-2 h-10">
                {item.name}
              </h3>
              <p className="mt-4 text-lg font-black text-stone-950">{item.price}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}