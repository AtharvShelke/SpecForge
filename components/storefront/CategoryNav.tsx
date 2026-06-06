// components/storefront/CategoryNav.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const CATEGORIES = [
  { name: "Graphics Cards", count: "High-Performance GPUs", href: "/products?category=Graphics Cards" },
  { name: "Processors", count: "Intel & AMD CPUs", href: "/products?category=Processors" },
  { name: "Motherboards", count: "LGA1700 & AM5 Chipsets", href: "/products?category=Motherboards" },
  { name: "Memory (RAM)", count: "DDR4 & DDR5 Modules", href: "/products?category=Memory (RAM)" },
  { name: "Storage (SSD/HDD)", count: "NVMe & SATA Drives", href: "/products?category=Storage (SSD/HDD)" },
  { name: "Power Supplies", count: "80+ Gold Modular PSUs", href: "/products?category=Power Supplies" },
  { name: "CPU Coolers", count: "AIO Liquid & Air Coolers", href: "/products?category=CPU Coolers" },
  { name: "PC Cases", count: "ATX Mid & Full Towers", href: "/products?category=PC Cases" },
];

export function CategoryNav() {
  return (
    <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-stone-50">
      <div className="mb-12">
        <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-stone-400 mb-2">Systems & Components</h2>
        <p className="text-3xl font-black tracking-tight text-stone-900">Shop By Category</p>
      </div>

      <motion.div 
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        variants={{
          show: { transition: { staggerChildren: 0.04 } }
        }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        {CATEGORIES.map((cat) => (
          <motion.div
            key={cat.name}
            variants={{
              hidden: { opacity: 0, y: 15 },
              show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120 } }
            }}
          >
            <Link 
              href={cat.href}
              className="group block relative rounded-2xl bg-white border border-stone-200/60 p-6 h-40 flex flex-col justify-between transition-all duration-300 hover:border-stone-300 hover:shadow-xl hover:shadow-stone-200/50"
            >
              <div>
                <h3 className="font-bold text-stone-900 text-lg tracking-tight group-hover:text-indigo-600 transition-colors duration-200">
                  {cat.name}
                </h3>
                <p className="text-xs font-medium text-stone-400 mt-1">{cat.count}</p>
              </div>
              <div className="text-xs font-bold text-stone-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all duration-200 flex items-center gap-1">
                Explore Components &rarr;
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}