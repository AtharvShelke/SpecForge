// components/storefront/NewArrivals.tsx
"use client";

import Image from "next/image";
import { Plus, Heart } from "lucide-react";

const PRODUCTS = [
  { id: 1, name: "ASUS ROG Strix GeForce RTX 4070 Ti Super", price: "₹88,499", stock: "In Stock" },
  { id: 2, name: "AMD Ryzen 7 7800X3D Desktop Processor", price: "₹37,899", stock: "Low Stock" },
  { id: 3, name: "MSI MPG Z790 Carbon WiFi Motherboard", price: "₹41,200", stock: "In Stock" },
  { id: 4, name: "Corsair Dominator Titanium 32GB DDR5 CL30", price: "₹18,450", stock: "In Stock" },
];

export function NewArrivals() {
  return (
    <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-stone-50">
      <div className="mb-12 flex items-end justify-between">
        <div>
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-stone-400 mb-2">Fresh In Inventory</h2>
          <p className="text-3xl font-black tracking-tight text-stone-900">New Arrivals</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {PRODUCTS.map((prod) => (
          <div key={prod.id} className="group relative bg-white border border-stone-200/60 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:border-stone-300">
            
            {/* Quick Actions */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
              <button className="p-2 rounded-full bg-white border border-stone-100 hover:border-stone-300 text-stone-400 hover:text-stone-700 shadow-sm transition-colors duration-200">
                <Heart className="size-4" />
              </button>
            </div>

            <div>
              <div className="relative w-full aspect-square bg-stone-50/50 rounded-xl overflow-hidden mb-4 flex items-center justify-center p-6">
                <Image 
                  src="/images/product-placeholder.png" 
                  alt={prod.name}
                  fill
                  className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`size-1.5 rounded-full ${prod.stock === "In Stock" ? "bg-emerald-500" : "bg-amber-500"}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{prod.stock}</span>
              </div>
              
              <h3 className="font-bold text-stone-900 text-sm tracking-tight mt-2 line-clamp-2 group-hover:text-indigo-600 transition-colors duration-200">
                {prod.name}
              </h3>
            </div>

            <div className="mt-6 pt-3 border-t border-stone-100 flex items-center justify-between">
              <span className="font-black text-stone-900 text-base">{prod.price}</span>
              <button className="size-8 rounded-lg bg-stone-900 hover:bg-indigo-600 text-white flex items-center justify-center transition-all duration-200">
                <Plus className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}