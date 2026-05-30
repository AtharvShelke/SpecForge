"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, User, Search, Menu, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/context/ShopCartContext";

export default function Header() {
  const pathname = usePathname();
  const { cart, setCartOpen, cartCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const navLinks = [
    { href: "/products", label: "Products" },
    { href: "/builds/new", label: "Build a PC" },
    { href: "/track-order", label: "Track Order" },
  ];

  if (pathname === "/checkout") return null;



  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-6">
            {/* Logo */}
            <Link
              href="/"
              className="shrink-0 flex items-center gap-2.5 group"
              aria-label="Computer Store home"
            >
              <div className="size-7 rounded-lg bg-stone-900 flex items-center justify-center">
                <span className="text-white text-xs font-bold tracking-tight">CS</span>
              </div>
              <span className="text-sm font-semibold text-stone-900 tracking-tight hidden sm:block">
                Computer Store
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? "text-stone-900 bg-stone-100"
                        : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Search bar – desktop */}
            <div className="hidden md:flex flex-1 max-w-xs">
              <Link
                href="/products"
                className="flex w-full items-center gap-2.5 px-3.5 py-2 rounded-lg border border-stone-200 bg-stone-50 text-sm text-stone-400 hover:border-stone-300 hover:bg-white transition-colors group"
              >
                <Search className="size-3.5 shrink-0" aria-hidden />
                <span className="flex-1">Search components…</span>
                <kbd className="hidden xl:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium text-stone-400 border border-stone-200 bg-white font-mono">
                  /
                </kbd>
              </Link>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1.5 ml-auto md:ml-0">
              {/* Mobile search */}
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className="md:hidden inline-flex size-10 items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                aria-label="Search"
              >
                <Search className="size-4" />
              </button>

              <Link
                href="/admin"
                className="hidden sm:inline-flex size-10 items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                aria-label="Account"
              >
                <User className="size-4" />
              </Link>

              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="relative inline-flex size-10 items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
              >
                <ShoppingCart className="size-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 size-4 flex items-center justify-center rounded-full bg-stone-900 text-white text-[9px] font-semibold leading-none">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>

              {/* Mobile menu toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden inline-flex size-10 items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="size-4" />
                ) : (
                  <Menu className="size-4" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile search bar */}
          {searchOpen && (
            <div className="md:hidden pb-3">
              <Link
                href="/products"
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-stone-200 bg-stone-50 text-sm text-stone-400"
              >
                <Search className="size-3.5 shrink-0" aria-hidden />
                <span>Search components…</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone-100 bg-white">
            <nav className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-0.5" aria-label="Mobile navigation">
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? "text-stone-900 bg-stone-100"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3.5 py-2.5 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-colors flex items-center gap-2"
              >
                <User className="size-4" aria-hidden />
                Account
              </Link>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}