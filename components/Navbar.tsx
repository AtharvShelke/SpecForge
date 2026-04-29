"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Cpu, Home, MapPin, Search, ShoppingCart, Sparkles, User2, Wrench } from "lucide-react";
import { useState } from "react";
import { useShop } from "@/context/ShopContext";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/products", label: "Products" },
  { href: "/builds/new", label: "Build PC" },
  { href: "/build-guides", label: "Guides" },
  { href: "/track-order", label: "Track Order" },
] as const;

const MOBILE_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/products", label: "Products", icon: Sparkles },
  { href: "/builds/new", label: "Build", icon: Wrench },
  { href: "/track-order", label: "Track", icon: MapPin },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const { cart, setCartOpen } = useShop();
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 18);
  });

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4"
      >
        <div
          className={cn(
            "mx-auto max-w-[1440px] rounded-[1.75rem] border bg-white/78 shadow-[0_22px_60px_-46px_rgba(20,30,59,0.35)] backdrop-blur-2xl transition-all duration-500",
            isScrolled ? "border-white/80" : "border-slate-200/70",
          )}
        >
          <div className="hairline px-4 py-2.5 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="flex items-center gap-3 shrink-0">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-[0_18px_32px_-22px_rgba(15,23,42,0.9)]">
                  <Cpu className="size-4" />
                </div>
                <div className="leading-none">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-500">
                    MD
                  </p>
                  <p className="text-base font-semibold tracking-[-0.03em] text-slate-950 sm:text-lg">
                    Computers
                  </p>
                </div>
              </Link>

              <nav className="hidden items-center gap-1 md:flex">
                {NAV_LINKS.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-semibold tracking-[-0.02em] transition-all duration-300",
                        active
                          ? "bg-slate-950 text-white shadow-[0_14px_28px_-22px_rgba(15,23,42,0.9)]"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              <form action="/products" className="hidden flex-1 max-w-md xl:block">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    name="q"
                    placeholder="Search products"
                    className="h-10 w-full rounded-full border border-slate-200 bg-white/90 pl-10 pr-4 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-300"
                  />
                </label>
              </form>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCartOpen(true)}
                  className="relative flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white/85 text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950"
                  aria-label="Open cart"
                >
                  <ShoppingCart className="size-4" />
                  <AnimatePresence>
                    {cartItemCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -right-1 -top-1 min-w-5 rounded-full bg-slate-950 px-1.5 py-0.5 text-[0.65rem] font-bold text-white"
                      >
                        {cartItemCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>

                <Link
                  href="/products"
                  className="flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white/85 text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950 xl:hidden"
                  aria-label="Search products"
                >
                  <Search className="size-4" />
                </Link>

                <Link
                  href="/admin"
                  className="hidden h-10 items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-4 text-sm font-semibold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950 sm:inline-flex"
                >
                  <User2 className="size-4" />
                  Admin
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center md:hidden">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/80 bg-white/85 p-2 shadow-[0_24px_60px_-36px_rgba(20,30,59,0.35)] backdrop-blur-2xl"
        >
          {MOBILE_LINKS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex size-11 items-center justify-center rounded-full transition-all duration-300",
                  active
                    ? "bg-slate-950 text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-950",
                )}
                aria-label={label}
              >
                <Icon className="size-4" />
              </Link>
            );
          })}

          <button
            onClick={() => setCartOpen(true)}
            className="relative flex size-11 items-center justify-center rounded-full text-slate-500 transition-all duration-300 hover:bg-slate-100 hover:text-slate-950"
            aria-label="Open cart"
          >
            <ShoppingCart className="size-4" />
            {cartItemCount > 0 && (
              <span className="absolute right-1.5 top-1.5 min-w-4 rounded-full bg-slate-950 px-1 py-0.5 text-[0.6rem] font-bold leading-none text-white">
                {cartItemCount}
              </span>
            )}
          </button>
        </motion.div>
      </div>
    </>
  );
}
