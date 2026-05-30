import { Truck, RotateCcw, Shield, Headphones, CreditCard, Package } from "lucide-react";

const TRUST_ITEMS = [
  {
    icon: Truck,
    title: "Free shipping",
    description: "On orders over ₹5,000. Express options available at checkout.",
    color: "text-blue-600 bg-blue-50/70 border-blue-100",
  },
  {
    icon: RotateCcw,
    title: "Easy returns",
    description: "15-day hassle-free return policy on all products.",
    color: "text-emerald-600 bg-emerald-50/70 border-emerald-100",
  },
  {
    icon: Shield,
    title: "Secure payments",
    description: "256-bit SSL encryption. UPI, cards, and net banking accepted.",
    color: "text-indigo-600 bg-indigo-50/70 border-indigo-100",
  },
  {
    icon: Headphones,
    title: "Expert support",
    description: "PC building help and after-sales support from our team.",
    color: "text-violet-600 bg-violet-50/70 border-violet-100",
  },
  {
    icon: CreditCard,
    title: "EMI available",
    description: "No-cost EMI on 6 and 12 months with major banks.",
    color: "text-pink-600 bg-pink-50/70 border-pink-100",
  },
  {
    icon: Package,
    title: "Genuine products",
    description: "100% authentic components. Official brand warranties honored.",
    color: "text-cyan-600 bg-cyan-50/70 border-cyan-100",
  },
] as const;

export function TrustSection() {
  return (
    <section className="border-t border-stone-100 py-12 sm:py-16" aria-label="Why shop with us">
      <div className="text-center mb-10">
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
          Why choose us
        </p>
        <h2 className="mt-1.5 text-xl font-bold text-stone-900 tracking-tight">
          Shop with confidence
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
        {TRUST_ITEMS.map(({ icon: Icon, title, description, color }) => (
          <div key={title} className="flex flex-col gap-3 rounded-xl border border-stone-150 bg-stone-50/60 p-5 hover:border-indigo-200 hover:bg-white hover:shadow-md hover:shadow-indigo-50/20 transition-all duration-300 group">
            <div className={`size-9 rounded-lg border flex items-center justify-center group-hover:scale-105 transition-transform duration-300 ${color}`}>
              <Icon className="size-4" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900 group-hover:text-indigo-600 transition-colors">{title}</p>
              <p className="mt-1 text-xs text-stone-500 leading-relaxed">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}