// components/storefront/ConfiguratorHighlight.tsx
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, Cpu, Sparkles } from "lucide-react";

export function ConfiguratorHighlight() {
  return (
    <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-stone-50">
      <div className="bg-stone-950 rounded-[2.5rem] border border-stone-900 overflow-hidden grid lg:grid-cols-12 items-center relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.04)_0%,transparent_60%)] pointer-events-none" />
        
        {/* Value Proposition Framing */}
        <div className="p-8 sm:p-12 lg:p-16 lg:col-span-6 space-y-6 text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950 border border-indigo-900 text-xs font-bold tracking-wide text-indigo-400">
            <Sparkles className="size-3.5" />
            Compatibility Engine v4.2
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-none">
            Architect Your System Custom
          </h2>
          
          <p className="text-stone-400 text-sm sm:text-base font-normal leading-relaxed">
            Our real-time cross-checking layer analyses total voltage targets, exact logic card clearances, and chip speeds simultaneously to secure absolute stability.
          </p>

          <ul className="space-y-3 pt-2">
            {[
              "Automated component validation matching paths",
              "Real-time combined system power dynamic tracking",
              "Optional configuration routing to pro system builders"
            ].map((text) => (
              <li key={text} className="flex items-start gap-3 text-xs text-stone-300 font-medium">
                <CheckCircle2 className="size-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>{text}</span>
              </li>
            ))}
          </ul>

          <div className="pt-4">
            <Link href="/configurator" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-8 py-4 rounded-full transition-all duration-300">
              <Cpu className="size-4" />
              Start Building
            </Link>
          </div>
        </div>

        {/* Dashboard Mockup Representation Frame */}
        <div className="lg:col-span-6 p-8 lg:p-12 flex justify-center items-center bg-stone-900/40 border-t lg:border-t-0 lg:border-l border-stone-900 h-full">
          <div className="relative w-full aspect-[4/3] rounded-2xl border border-stone-800 bg-stone-950/60 p-4 shadow-2xl">
            {/* Minimal architectural abstract graphic representing the visual configurator wireframe UI */}
            <div className="w-full h-full flex flex-col justify-between font-mono text-[10px] text-stone-500">
              <div className="flex items-center justify-between pb-3 border-b border-stone-900">
                <span>SYSTEM_NODE: active</span>
                <span className="text-emerald-400">● PASSED</span>
              </div>
              <div className="flex-1 py-4 space-y-2">
                <div className="h-6 rounded bg-stone-900/60 border border-stone-850 flex items-center px-3 justify-between text-stone-300">
                  <span>01_GRAPHICS_CARD</span>
                  <span className="text-indigo-400">RTX 4090 FE</span>
                </div>
                <div className="h-6 rounded bg-stone-900/60 border border-stone-850 flex items-center px-3 justify-between text-stone-300">
                  <span>02_PROCESSOR</span>
                  <span className="text-indigo-400">RYZEN 7 7800X3D</span>
                </div>
                <div className="h-6 rounded bg-stone-900/60 border border-stone-850 flex items-center px-3 justify-between text-stone-400">
                  <span>03_MOTHERBOARD</span>
                  <span className="text-stone-600">Select Model...</span>
                </div>
              </div>
              <div className="pt-3 border-t border-stone-900 flex justify-between items-center text-stone-400">
                <span>Power Index: 450W / 850W</span>
                <span className="text-stone-300 font-bold">Total: ₹1,26,398</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}