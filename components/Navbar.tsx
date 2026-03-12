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

  /* ---------- Shared badge ---------- */
  const CountBadge = ({ count }: { count: number }) =>
    count > 0 ? (
      <span
        className={cn(
          "absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none shadow-sm ring-2",
          isDark
            ? "bg-indigo-400 text-zinc-950 ring-zinc-950"
            : "bg-zinc-900 text-white ring-white"
        )}
      >
        {count > 99 ? "99+" : count}
      </span>
    ) : null;

  /* ---------------- Desktop Navbar ---------------- */
  const DesktopNavbar = (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full border-b backdrop-blur-xl",
        isDark
          ? "border-white/10 bg-zinc-950/80"
          : "border-zinc-200/80 bg-white/80"
      )}
    >
      {/* Subtle indigo glow — mirrors footer's top-left ambient blob */}
      {isDark && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -left-16 -top-10 h-40 w-72 rounded-full bg-indigo-900/30 blur-[80px]" />
        </div>
      )}

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-8">

          {/* Brand — matches footer logo treatment exactly */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl border shadow-sm transition-transform group-hover:scale-110",
                isDark
                  ? "bg-white/10 border-white/20"
                  : "bg-zinc-950 border-transparent"
              )}
            >
              <Cpu
                className={cn(
                  "h-5 w-5",
                  isDark ? "text-indigo-400" : "text-white"
                )}
              />
            </div>
            <span
              className={cn(
                "font-bold tracking-tight text-xl",
                isDark ? "text-white" : "text-zinc-950"
              )}
            >
              Nexus
            </span>
          </Link>

          {/* Mobile Admin Link */}
          <Link
            href="/admin"
            className={cn(
              "md:hidden p-2 -mr-2 transition-colors",
              isDark
                ? "text-zinc-400 hover:text-white"
                : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            <User size={20} />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex flex-1 items-center justify-center">
            <div
              className={cn(
                "flex items-center gap-1 rounded-full border p-1",
                isDark
                  ? "border-white/10 bg-white/5"
                  : "border-zinc-200/60 bg-zinc-50/50 shadow-sm"
              )}
            >
              {[
                { to: "/products", label: "Products", icon: Store },
                { to: "/builds/new", label: "PC Builder", icon: Wrench },
                { to: "/builds", label: "Saved Builds", icon: Save },
                { to: "/track-order", label: "Track Order", icon: MapPin },
              ].map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  href={to}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200",
                    isDark
                      ? isActive(to)
                        ? "bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30"
                        : "text-zinc-400 hover:text-white hover:bg-white/10"
                      : isActive(to)
                        ? "bg-white text-zinc-950 shadow-sm ring-1 ring-zinc-200/50"
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50"
                  )}
                >
                  <Icon
                    size={14}
                    className={
                      isDark
                        ? isActive(to) ? "text-indigo-400" : "text-zinc-500"
                        : isActive(to) ? "text-zinc-950" : "text-zinc-400"
                    }
                  />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <button
              onClick={() => setCartOpen(true)}
              className={cn(
                "group relative flex h-9 w-9 items-center justify-center rounded-full border transition-all focus:outline-none focus:ring-2",
                isDark
                  ? "border-white/10 bg-white/5 text-zinc-400 hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-indigo-300 focus:ring-indigo-500/50"
                  : "border-zinc-200 bg-white text-zinc-600 shadow-sm hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 focus:ring-zinc-950"
              )}
              aria-label="Open cart"
            >
              <ShoppingCart size={16} />
              <CountBadge count={cartItemCount} />
            </button>

            <div
              className={cn("h-4 w-[1px]", isDark ? "bg-white/10" : "bg-zinc-200")}
              aria-hidden="true"
            />

            <Link
              href="/admin"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border transition-all focus:outline-none focus:ring-2",
                isDark
                  ? "border-white/10 bg-white/5 text-zinc-400 hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-indigo-300 focus:ring-indigo-500/50"
                  : "border-zinc-200 bg-white text-zinc-600 shadow-sm hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 focus:ring-zinc-950"
              )}
              aria-label="Go to admin dashboard"
            >
              <User size={16} />
            </Link>
          </div>

        </div>
      </div>
    </nav>
  );

  /* ---------------- Mobile Bottom Navbar ---------------- */
  const MobileBottomNav = (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-xl md:hidden pb-safe",
        isDark
          ? "border-white/10 bg-zinc-950/90"
          : "border-zinc-200/80 bg-white/80"
      )}
    >
      <div className="flex h-16 items-center justify-around px-2">
        {[
          { to: "/products", label: "Shop", icon: Store },
          { to: "/builds/new", label: "Build", icon: Wrench },
          { to: "/builds", label: "Saves", icon: Save },
          { to: "/track-order", label: "Track", icon: MapPin },
        ].map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            href={to}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
              isDark
                ? isActive(to) ? "text-indigo-300" : "text-zinc-500 hover:text-zinc-200"
                : isActive(to) ? "text-zinc-950" : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                isActive(to)
                  ? isDark ? "bg-indigo-500/20" : "bg-zinc-100"
                  : "bg-transparent"
              )}
            >
              <Icon size={18} strokeWidth={isActive(to) ? 2.5 : 2} />
            </div>
            {label}
          </Link>
        ))}

        {/* Mobile Cart */}
        <button
          onClick={() => setCartOpen(true)}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
            isDark
              ? "text-zinc-500 hover:text-zinc-200"
              : "text-zinc-500 hover:text-zinc-900"
          )}
        >
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-transparent">
            <ShoppingCart size={18} />
            <CountBadge count={cartItemCount} />
          </div>
          Cart
        </button>
      </div>
    </nav>
  );
  if (pathname == '/') return null;
  return (
    <>
      {DesktopNavbar}
      {MobileBottomNav}
    </>
  );
};

export default Navbar;