'use client';

import React from "react";
import {
  ShoppingCart,
  Save,
  Monitor,
  BookOpen,
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

  // Helper for active link styling
  const isActive = (path: string) => pathname === path;

  /* ---------- Shared badge ---------- */
  const CountBadge = ({ count }: { count: number }) =>
    count > 0 ? (
      <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-zinc-900 px-1 text-[10px] font-semibold text-white leading-none shadow-sm ring-2 ring-white">
        {count > 99 ? "99+" : count}
      </span>
    ) : null;

  /* ---------------- Desktop Navbar ---------------- */
  const DesktopNavbar = (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-8">

          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 shadow-sm transition-transform group-hover:scale-105">
              <Cpu className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold tracking-tight text-zinc-950">
              Nexus Hardware
            </span>
          </Link>

          {/* Mobile Admin Link */}
          <Link
            href="/admin"
            className="md:hidden p-2 -mr-2 text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <User size={20} />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex flex-1 items-center justify-center">
            <div className="flex items-center gap-1 rounded-full border border-zinc-200/60 bg-zinc-50/50 p-1 shadow-sm">
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
                    isActive(to)
                      ? "bg-white text-zinc-950 shadow-sm ring-1 ring-zinc-200/50"
                      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50"
                  )}
                >
                  <Icon size={14} className={isActive(to) ? "text-zinc-950" : "text-zinc-400"} />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <button
              onClick={() => setCartOpen(true)}
              className="group relative flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950"
              aria-label="Open cart"
            >
              <ShoppingCart size={16} />
              <CountBadge count={cartItemCount} />
            </button>

            <div className="h-4 w-[1px] bg-zinc-200" aria-hidden="true" />

            <Link
              href="/admin"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950"
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200/80 bg-white/80 backdrop-blur-xl md:hidden pb-safe">
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
              isActive(to) ? "text-zinc-950" : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
              isActive(to) ? "bg-zinc-100" : "bg-transparent"
            )}>
              <Icon size={18} strokeWidth={isActive(to) ? 2.5 : 2} />
            </div>
            {label}
          </Link>
        ))}

        {/* Mobile Cart */}
        <button
          onClick={() => setCartOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium text-zinc-500 transition-colors hover:text-zinc-900"
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

  if (pathname === '/') return null;

  return (
    <>
      {DesktopNavbar}
      {MobileBottomNav}
    </>
  );
};

export default Navbar;