// components/storefront/FeaturedBuilds.tsx
"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const BUILDS = [
  { name: "Budget Gaming", score: "Perf Index: 74/100", price: "₹64,999", specs: "RTX 4060 · Core i5 · 16GB DDR5", image: "/images/green-pc.jpg" },
  { name: "Performance Gaming", score: "Perf Index: 89/100", price: "₹1,45,000", specs: "RTX 4070 Ti · Ryzen 7 · 32GB DDR5", image: "/images/red-pc.jpg" },
  { name: "Creator Workstation", score: "Perf Index: 95/100", price: "₹2,89,000", specs: "RTX 4080 Super · Ryzen 9 · 64GB DDR5", image: "/images/white-pc.jpg" },
  { name: "Enthusiast Build", score: "Perf Index: 99/100", price: "₹4,20,000", specs: "RTX 4090 · Core i9 · 64GB DDR5", image: "/images/hero2.jpg" },
];

export function FeaturedBuilds() {
  return (
    <section className="py-24 bg-stone-900 text-white border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-stone-500 mb-2">Turnkey Deployment</h2>
            <p className="text-3xl font-black tracking-tight text-stone-100">Featured Builds</p>
          </div>
          <span className="text-sm font-medium text-stone-400 max-w-xs">Fully assembled, stress-tested over 72 hours, and guaranteed benchmark targets.</span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {BUILDS.map((build) => (
            <div key={build.name} className="group bg-stone-950 border border-stone-850 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:border-stone-700">
              <div>
                <div className="relative w-full aspect-square bg-stone-900 rounded-xl mb-6 overflow-hidden">
                  <Image 
                    src={build.image} 
                    alt={build.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="inline-block px-2.5 py-1 rounded bg-stone-900 text-[10px] font-mono font-bold tracking-wide text-indigo-400 border border-stone-800">
                  {build.score}
                </div>
                <h3 className="text-xl font-bold tracking-tight text-stone-100 mt-4">{build.name}</h3>
                <p className="text-xs text-stone-400 mt-1 font-medium">{build.specs}</p>
              </div>
              
              <div className="mt-8 pt-4 border-t border-stone-900 flex items-center justify-between">
                <span className="text-lg font-black text-stone-200">{build.price}</span>
                <button className="text-xs font-bold bg-stone-800 hover:bg-indigo-600 text-stone-200 hover:text-white transition-all duration-200 px-4 py-2 rounded-lg">
                  Configure
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}