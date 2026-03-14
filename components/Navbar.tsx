'use client';

import React from "react";
import {
  ShoppingCart,
  Save,
  MapPin,
  Store,
  User,
  Cpu,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useShop } from "@/context/ShopContext";
import { cn } from "@/lib/utils";

const Navbar: React.FC = () => {
  const { cart, setCartOpen } = useShop();
  const pathname = usePathname();

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const isActive = (path: string) => pathname === path;
  const isDark = pathname === "/";

  /* ---------- Premium Count Badge ---------- */
  const CountBadge = ({ count }: { count: number }) =>
    count > 0 ? (
      <span
        className={cn(
          "absolute -top-1 -right-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full px-1 text-[8px] font-bold leading-none ring-2",
          isDark
            ? "bg-indigo-500 text-white ring-zinc-950"
            : "bg-zinc-950 text-white ring-white"
        )}
      >
        {count > 99 ? "99" : count}
      </span>
    ) : null;

  return (
    <>
      {/* ---------------- Top Header (Desktop & Mobile) ---------------- */}
      <nav
        className={cn(
          "sticky top-0 z-50 w-full border-b backdrop-blur-md transition-all",
          isDark
            ? "border-white/5 bg-zinc-950/70"
            : "border-zinc-200/50 bg-white/70"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Mobile height: h-12 | Desktop height: h-16 */}
          <div className="flex h-12 md:h-16 items-center justify-between gap-4">
            
            {/* Brand - Scaled down for mobile */}
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div
                className={cn(
                  "flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg border transition-all duration-300 group-hover:rotate-6",
                  isDark
                    ? "bg-white/5 border-white/10"
                    : "bg-zinc-950 border-transparent"
                )}
              >
                <Cpu
                  className={cn(
                    "h-3 w-3 md:h-5 md:w-5",
                    isDark ? "text-indigo-400" : "text-white"
                  )}
                />
              </div>
              <span
                className={cn(
                  "font-bold tracking-tight text-lg md:text-xl",
                  isDark ? "text-white" : "text-zinc-950"
                )}
              >
                Nexus
              </span>
            </Link>

            {/* Desktop Center Navigation (Pill Style) */}
            <div className="hidden md:flex flex-1 items-center justify-center">
              <div className={cn(
                "flex items-center gap-1 rounded-full border p-1",
                isDark ? "border-white/10 bg-white/5" : "border-zinc-200/60 bg-zinc-50/50"
              )}>
                {[
                  { to: "/products", label: "Products", icon: Store },
                  { to: "/builds/new", label: "PC Builder", icon: Wrench },
                  { to: "/builds", label: "Saved", icon: Save },
                  { to: "/track-order", label: "Track", icon: MapPin },
                ].map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    href={to}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all",
                      isActive(to)
                        ? (isDark ? "bg-indigo-500/20 text-indigo-300" : "bg-white text-zinc-950 shadow-sm ring-1 ring-zinc-200")
                        : (isDark ? "text-zinc-400 hover:text-white" : "text-zinc-500 hover:text-zinc-900")
                    )}
                  >
                    <Icon size={14} />
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={() => setCartOpen(true)}
                className={cn(
                  "relative flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full transition-colors",
                  isDark ? "text-zinc-400 hover:text-white" : "text-zinc-500 hover:text-zinc-900"
                )}
              >
                <ShoppingCart size={18} className="md:w-5 md:h-5" />
                <CountBadge count={cartItemCount} />
              </button>
              
              <Link
                href="/admin"
                className={cn(
                  "flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full transition-colors",
                  isDark ? "text-zinc-400 hover:text-white" : "text-zinc-500 hover:text-zinc-900"
                )}
              >
                <User size={18} className="md:w-5 md:h-5" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ---------------- Mobile Bottom Navbar ---------------- */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-lg md:hidden",
          isDark
            ? "border-white/5 bg-zinc-950/80"
            : "border-zinc-200/50 bg-white/80"
        )}
      >
        {/* Safe area padding for iPhones with Home Indicator */}
        <div className="flex h-14 items-center justify-around px-2 pb-safe">
          {[
            { to: "/products", label: "Store", icon: Store },
            { to: "/builds/new", label: "Build", icon: Wrench },
            { to: "/builds", label: "Saved", icon: Save },
            { to: "/track-order", label: "Track", icon: MapPin },
          ].map(({ to, label, icon: Icon }) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                href={to}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center gap-1 transition-all",
                  active
                    ? (isDark ? "text-indigo-400" : "text-zinc-950")
                    : "text-zinc-500"
                )}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-semibold tracking-tight">{label}</span>
                {active && (
                    <span className={cn(
                        "absolute -bottom-1 h-1 w-1 rounded-full",
                        isDark ? "bg-indigo-400" : "bg-zinc-950"
                    )} />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Navbar;