// components/storefront/SocialProof.tsx
import { UserCheck } from "lucide-react";

const TESTIMONIALS = [
  { id: 1, author: "Vikram R.", role: "Architectural Designer", text: "The engineering layout configuration engine flagged a motherboard profile depth conflict before processing. Avoided significant hardware processing delay.", build: "Threadripper Pro Deployment" },
  { id: 2, author: "Ananya K.", role: "Competitive Player", text: "Absolute premium validation standard. System arrived tightly crated with flawless routing layouts. Benchmark runs matched predicted calculations exactly.", build: "Apex Core Configuration" }
];

export function SocialProof() {
  return (
    <section className="py-24 bg-white border-t border-stone-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-stone-400 mb-2">Verified Validation</h2>
          <p className="text-3xl font-black tracking-tight text-stone-900">Community Integration Feed</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {TESTIMONIALS.map((t) => (
            <div key={t.id} className="bg-stone-50 border border-stone-200/50 rounded-2xl p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 font-mono tracking-wide">
                  <UserCheck className="size-3.5" />
                  {t.build}
                </div>
                <p className="mt-4 text-stone-600 text-sm font-normal leading-relaxed">
                  "{t.text}"
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-stone-200/60 flex items-center justify-between">
                <div>
                  <p className="font-bold text-stone-900 text-sm tracking-tight">{t.author}</p>
                  <p className="text-xs text-stone-400 font-medium">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}