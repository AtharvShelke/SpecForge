// components/storefront/BrandPartners.tsx
export function BrandPartners() {
  const BRANDS = ["NVIDIA", "AMD", "Intel", "ASUS", "MSI", "Corsair", "Samsung", "Kingston"];
  
  return (
    <section className="py-16 bg-stone-50 border-t border-stone-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-[10px] font-bold tracking-[0.25em] uppercase text-stone-400 mb-10">Authorized Direct Logistics Partner Ecosystem</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-8 items-center justify-items-center opacity-40 grayscale contrast-200">
          {BRANDS.map((brand) => (
            <span key={brand} className="font-black tracking-tighter text-xl text-stone-950 font-sans select-none">
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}