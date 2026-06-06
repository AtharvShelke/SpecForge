// components/storefront/AnnouncementBar.tsx
import { Truck, ShieldCheck, CreditCard } from "lucide-react";

export function AnnouncementBar() {
  return (
    <div className="bg-stone-950 text-stone-400 text-[11px] font-medium tracking-widest uppercase border-b border-stone-900 py-3 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <Truck className="size-3.5 text-stone-500" />
          <span>Premium Insured Shipping Across India</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <CreditCard className="size-3.5 text-stone-500" />
            <span>No-Cost EMI up to 12 Months</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-stone-500" />
            <span>3-Year Direct Brand Warranty</span>
          </div>
        </div>
      </div>
    </div>
  );
}