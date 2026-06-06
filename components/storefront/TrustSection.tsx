"use client";

import { Truck, RotateCcw, Shield, Headphones, CreditCard, Package } from "lucide-react";
import { motion } from "framer-motion";

const TRUST_ITEMS = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "On orders over ₹5,000. Express options available at checkout.",
    color: "text-blue-600 bg-blue-50/70 border-blue-100",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    description: "15-day hassle-free return policy on all products.",
    color: "text-emerald-600 bg-emerald-50/70 border-emerald-100",
  },
  {
    icon: Shield,
    title: "Secure Payments",
    description: "256-bit SSL encryption. UPI, cards, and net banking accepted.",
    color: "text-indigo-600 bg-indigo-50/70 border-indigo-100",
  },
  {
    icon: Headphones,
    title: "Expert Support",
    description: "PC building help and after-sales support from our team.",
    color: "text-violet-600 bg-violet-50/70 border-violet-100",
  },
  {
    icon: CreditCard,
    title: "EMI Available",
    description: "No-cost EMI on 6 and 12 months with major banks.",
    color: "text-pink-600 bg-pink-50/70 border-pink-100",
  },
  {
    icon: Package,
    title: "Genuine Products",
    description: "100% authentic components. Official brand warranties honored.",
    color: "text-cyan-600 bg-cyan-50/70 border-cyan-100",
  },
] as const;

export function TrustSection() {
  // Stagger entry animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } },
  };

  return (
    <section className="border-t border-stone-150/50 py-16" aria-label="Why shop with us">
      <div className="text-center mb-12">
        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-2.5 py-0.5 rounded-full mb-1">
          Why Choose Us
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
          Shop with confidence
        </h2>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {TRUST_ITEMS.map(({ icon: Icon, title, description, color }) => (
          <motion.div 
            key={title} 
            variants={itemVariants}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white/70 backdrop-blur-md p-6 hover:border-indigo-300 hover:shadow-[0_12px_30px_rgba(99,102,241,0.06)] transition-all duration-300 group cursor-default"
          >
            <div className={`size-10 rounded-xl border flex items-center justify-center shadow-sm group-hover:scale-105 transition-all duration-350 ${color}`}>
              <Icon className="size-5 transition-transform duration-500 group-hover:rotate-6" aria-hidden />
            </div>
            <div>
              <p className="text-[15px] font-bold text-stone-800 group-hover:text-indigo-600 transition-colors">{title}</p>
              <p className="mt-2 text-xs text-stone-500 font-medium leading-relaxed">{description}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}