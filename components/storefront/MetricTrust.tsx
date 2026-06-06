// components/storefront/MetricTrust.tsx
export function MetricTrust() {
  return (
    <section className="py-24 bg-white border-y border-stone-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 text-center sm:text-left">
          <div>
            <p className="text-4xl sm:text-5xl font-black text-stone-950 tracking-tighter">25,000+</p>
            <h3 className="text-sm font-bold tracking-wider uppercase text-stone-900 mt-3">Orders Delivered</h3>
            <p className="text-xs text-stone-400 mt-1.5 font-medium leading-relaxed">Securely packaged premium components shipped right to doors across the country.</p>
          </div>
          <div>
            <p className="text-4xl sm:text-5xl font-black text-stone-950 tracking-tighter">99.2%</p>
            <h3 className="text-sm font-bold tracking-wider uppercase text-stone-900 mt-3">Compatibility Rate</h3>
            <p className="text-xs text-stone-400 mt-1.5 font-medium leading-relaxed">Driven by our automated verification ruleset checking tolerances across all parts.</p>
          </div>
          <div>
            <p className="text-4xl sm:text-5xl font-black text-stone-950 tracking-tighter">4.8 / 5</p>
            <h3 className="text-sm font-bold tracking-wider uppercase text-stone-900 mt-3">Customer Rating</h3>
            <p className="text-xs text-stone-400 mt-1.5 font-medium leading-relaxed">Verified reviews certifying outstanding hardware handling and transit support.</p>
          </div>
          <div>
            <p className="text-4xl sm:text-5xl font-black text-indigo-600 tracking-tighter">100%</p>
            <h3 className="text-sm font-bold tracking-wider uppercase text-stone-900 mt-3">Genuine Warranty</h3>
            <p className="text-xs text-stone-400 mt-1.5 font-medium leading-relaxed">Only authorized channel stock with simple direct claims support pathways.</p>
          </div>
        </div>
      </div>
    </section>
  );
}