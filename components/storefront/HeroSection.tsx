// components/storefront/HeroSection.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex items-center bg-stone-950 text-white overflow-hidden py-12 lg:py-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Editorial Text Block */}
        <div className="lg:col-span-6 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 text-xs tracking-[0.2em] uppercase font-bold text-indigo-400"
          >
            <span>Systems Architecture</span>
            <span className="size-1 rounded-full bg-stone-700" />
            <span className="text-stone-400">Live Inventory Counts</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl sm:text-6xl xl:text-[5rem] font-black tracking-tighter leading-[0.95]"
          >
            Build Without<br />Compromise<span className="text-indigo-500">.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-stone-400 text-lg sm:text-xl font-normal max-w-lg leading-relaxed"
          >
            High-performance components, compatibility-checked custom builds, and expert support.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-wrap items-center gap-4 pt-4"
          >
            <Link href="/configurator" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-8 py-4 rounded-full transition-all duration-300 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20">
              Build Your PC
            </Link>
            <Link href="/components" className="bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-200 font-semibold text-sm px-8 py-4 rounded-full transition-all duration-300">
              Shop Components
            </Link>
          </motion.div>

          {/* Micro Live Metrics Row */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="grid grid-cols-3 gap-6 pt-12 border-t border-stone-900 max-w-md"
          >
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Live Units</p>
              <p className="text-base font-bold text-stone-200 mt-1">4,281 Available</p>
            </div>
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Verified Users</p>
              <p className="text-base font-bold text-stone-200 mt-1">18K+ Actively Building</p>
            </div>
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Avg. Rating</p>
              <p className="text-base font-bold text-stone-200 mt-1">4.92 / 5.00</p>
            </div>
          </motion.div>
        </div>

        {/* Cinematic Hardware Showcase Frame */}
        <div className="lg:col-span-6 relative flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative w-full aspect-square max-w-[540px] rounded-3xl bg-stone-900/40 border border-stone-800/60 p-8 flex items-center justify-center group"
          >
            <motion.div 
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full h-full"
            >
              <Image 
                src="/images/hero.jpg" 
                alt="Cinematic Custom Hardware Rig Showcase"
                fill
                priority
                className="object-cover rounded-2xl filter drop-shadow-[0_25px_50px_rgba(0,0,0,0.5)] transition-transform duration-700 group-hover:scale-[1.02]"
              />
            </motion.div>
            
            {/* Minimal Hardware Detail Label overlays */}
            <div className="absolute bottom-6 left-6 bg-stone-950/80 border border-stone-800 backdrop-blur-md px-4 py-2 rounded-xl text-[11px] font-mono tracking-wider text-stone-400">
              SYS_REF: RTX-4090-FOUNDERS
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}