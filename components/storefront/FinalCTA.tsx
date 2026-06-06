// components/storefront/FinalCTA.tsx
import Link from "next/link";

export function FinalCTA() {
  return (
    <section className="bg-stone-950 text-white py-24 border-t border-stone-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.05)_0%,transparent_50%)] pointer-events-none" />
      
      <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
        <h2 className="text-4xl sm:text-5xl font-black tracking-tight leading-none">
          Ready to Build Your Dream PC?
        </h2>
        <p className="text-stone-400 text-base max-w-md mx-auto leading-relaxed">
          Step into our compatibility engine deployment matrix or explore our standalone hardware component inventory vaults.
        </p>
        <div className="flex flex-wrap justify-center items-center gap-4 pt-4">
          <Link href="/configurator" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-8 py-4 rounded-full transition-all duration-300">
            Start a Build
          </Link>
          <Link href="/components" className="bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-200 font-semibold text-sm px-8 py-4 rounded-full transition-all duration-300">
            Browse Components
          </Link>
        </div>
      </div>
    </section>
  );
}