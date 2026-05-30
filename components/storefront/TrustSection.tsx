import { Truck, RotateCcw, Shield, Headphones, CreditCard, Package } from "lucide-react";

const TRUST_ITEMS = [
  {
    icon: Truck,
    title: "Free shipping",
    description: "On orders over ₹5,000. Express options available at checkout.",
  },
  {
    icon: RotateCcw,
    title: "Easy returns",
    description: "15-day hassle-free return policy on all products.",
  },
  {
    icon: Shield,
    title: "Secure payments",
    description: "256-bit SSL encryption. UPI, cards, and net banking accepted.",
  },
  {
    icon: Headphones,
    title: "Expert support",
    description: "PC building help and after-sales support from our team.",
  },
  {
    icon: CreditCard,
    title: "EMI available",
    description: "No-cost EMI on 6 and 12 months with major banks.",
  },
  {
    icon: Package,
    title: "Genuine products",
    description: "100% authentic components. Official brand warranties honored.",
  },
] as const;

export function TrustSection() {
  return (
    <section className="border-t border-stone-100 py-12 sm:py-16" aria-label="Why shop with us">
      <div className="text-center mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">
          Why choose us
        </p>
        <h2 className="mt-1.5 text-xl font-bold text-stone-900 tracking-tight">
          Shop with confidence
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
        {TRUST_ITEMS.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex flex-col gap-3 rounded-xl border border-stone-100 bg-stone-50 p-5">
            <div className="size-9 rounded-lg bg-white border border-stone-200 flex items-center justify-center">
              <Icon className="size-4 text-stone-600" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900">{title}</p>
              <p className="mt-1 text-xs text-stone-500 leading-relaxed">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}