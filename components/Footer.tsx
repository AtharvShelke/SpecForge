"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

const LINKS = {
  catalog: [
    { href: "/products", label: "All products" },
    { href: "/products?category=processors", label: "Processors" },
    { href: "/products?category=graphics-cards", label: "Graphics cards" },
    { href: "/products?category=motherboards", label: "Motherboards" },
    { href: "/products?category=ram", label: "Memory (RAM)" },
    { href: "/products?category=storage", label: "Storage" },
  ],
  build: [
    { href: "/builds/new", label: "Start a build" },
    { href: "/products?tag=staff-pick", label: "Staff picks" },
    { href: "/products?sort=popular", label: "Best sellers" },
    { href: "/products?sort=newest", label: "New arrivals" },
  ],
  help: [
    { href: "/track-order", label: "Track order" },
    { href: "/faq", label: "FAQs" },
    { href: "/returns", label: "Returns & refunds" },
    { href: "/contact", label: "Contact us" },
  ],
};

export default function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  if (pathname === "/checkout" || pathname === "/products") return null;

  const handleSubscribe = () => {
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="border-t border-stone-100 bg-stone-50" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Top section */}
        <div className="grid grid-cols-2 gap-8 pt-14 pb-10 md:grid-cols-4 lg:grid-cols-5">

          {/* Brand column */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/products" className="flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-stone-900 flex items-center justify-center">
                <span className="text-white text-xs font-bold tracking-tight">CS</span>
              </div>
              <span className="text-sm font-semibold text-stone-900 tracking-tight">Computer Store</span>
            </Link>

            <p className="mt-4 text-sm text-stone-500 leading-relaxed max-w-xs">
              Premium PC components and custom builds, delivered to your door. Build smarter with real-time compatibility checks.
            </p>

            {/* Newsletter */}
            <div className="mt-6">
              <p className="text-xs font-semibold text-stone-700 mb-2">Get deals & tech news</p>
              {subscribed ? (
                <p className="text-xs text-emerald-600 font-medium">
                  ✓ You're subscribed. Thanks!
                </p>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                    placeholder="your@email.com"
                    className="flex-1 min-w-0 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none transition-colors"
                    aria-label="Email address for newsletter"
                  />
                  <button
                    type="button"
                    onClick={handleSubscribe}
                    className="inline-flex items-center justify-center size-9 rounded-lg bg-stone-900 text-white hover:bg-stone-700 transition-colors shrink-0"
                    aria-label="Subscribe"
                  >
                    <ArrowRight className="size-4" aria-hidden />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Catalog */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4">Catalog</p>
            <ul className="space-y-2.5">
              {LINKS.catalog.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-stone-500 hover:text-stone-900 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Build */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4">Build</p>
            <ul className="space-y-2.5">
              {LINKS.build.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-stone-500 hover:text-stone-900 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4">Help</p>
            <ul className="space-y-2.5">
              {LINKS.help.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-stone-500 hover:text-stone-900 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-stone-200 py-6">
          <p className="text-xs text-stone-400">
            © {new Date().getFullYear()} Computer Store. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/privacy" className="text-xs text-stone-400 hover:text-stone-700 transition-colors">
              Privacy policy
            </Link>
            <Link href="/terms" className="text-xs text-stone-400 hover:text-stone-700 transition-colors">
              Terms of service
            </Link>
            <span className="text-xs text-stone-300">·</span>
            <span className="text-xs text-stone-400">Made in India 🇮🇳</span>
          </div>
        </div>

      </div>
    </footer>
  );
}