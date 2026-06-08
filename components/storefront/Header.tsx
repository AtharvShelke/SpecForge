"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ShoppingCart, User, Search, Menu, X, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/context/ShopCartContext";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, setCartOpen, cartCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);

  const query = searchParams.get("q") || "";
  const [searchValue, setSearchValue] = useState(query);

  useEffect(() => {
    setSearchValue(query);
  }, [query]);

  const handleSearchChange = (val: string) => {
    setSearchValue(val);
    const params = new URLSearchParams(searchParams.toString());
    if (val.trim()) {
      params.set("q", val.trim());
    } else {
      params.delete("q");
    }

    if (pathname === "/products" || pathname === "/builds/new") {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    } else {
      router.push(`/products?${params.toString()}`);
    }
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/products");
    }
  };

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
            {/* Contextual Back Button */}
            {(pathname.startsWith("/products") || pathname.startsWith("/builds")) && (
              <button
                onClick={handleBack}
                className="shrink-0 flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-indigo-600 transition-colors group"
                aria-label="Go back"
              >
                <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}

            {/* Logo */}
            <Link
              href="/products"
              className="shrink-0 flex items-center gap-2.5 group"
              aria-label="Computer Store home"
            >
              <div className="size-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-sm shadow-indigo-200 group-hover:scale-105 transition-transform duration-200">
                <span className="text-white text-xs font-black tracking-wider">CS</span>
              </div>
              <span className="text-sm font-bold bg-gradient-to-r from-stone-900 to-stone-700 bg-clip-text text-transparent group-hover:from-indigo-600 group-hover:to-indigo-500 transition-colors tracking-tight hidden sm:block">
                Computer Store
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));

                if (link.label === "Products") {
                  return (
                    <div
                      key={link.href}
                      onMouseEnter={() => setMegaMenuOpen(true)}
                      onMouseLeave={() => setMegaMenuOpen(false)}
                      className="relative py-2"
                    >
                      <Link
                        href={link.href}
                        className={`relative px-3.5 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${isActive || megaMenuOpen
                            ? "text-indigo-600 bg-indigo-50"
                            : "text-stone-600 hover:text-indigo-600 hover:bg-indigo-50/30"
                          }`}
                      >
                        {link.label}
                      </Link>

                      {/* Mega Menu Dropdown */}
                      {megaMenuOpen && (
                        <div className="absolute left-0 top-full mt-2 w-[540px] rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xl shadow-stone-200/60 z-50 grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div>
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-3 px-1">Shop Components</span>
                            <div className="grid grid-cols-1 gap-1">
                              {[
                                { name: "Graphics Cards", href: "/products?category=Graphics%20Cards" },
                                { name: "Processors", href: "/products?category=Processors" },
                                { name: "Motherboards", href: "/products?category=Motherboards" },
                                { name: "Memory (RAM)", href: "/products?category=Memory%20(RAM)" },
                                { name: "Storage (SSD/HDD)", href: "/products?category=Storage%20(SSD/HDD)" },
                                { name: "Power Supplies", href: "/products?category=Power%20Supplies" },
                                { name: "CPU Coolers", href: "/products?category=CPU%20Coolers" },
                                { name: "PC Cases", href: "/products?category=PC%20Cases" },
                              ].map((item) => (
                                <Link
                                  key={item.name}
                                  href={item.href}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-600 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors"
                                >
                                  {item.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                          <div className="border-l border-stone-100 pl-6 flex flex-col justify-between">
                            <div className="space-y-3">
                              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block px-1">Featured Action</span>
                              <div className="rounded-xl bg-gradient-to-tr from-indigo-900 to-slate-950 p-4 text-white space-y-2.5 shadow-sm">
                                <h4 className="text-xs font-bold tracking-tight">Need a custom build?</h4>
                                <p className="text-[10px] text-stone-400 leading-normal">
                                  Use our automated compatibility matrix to choose matching parts and check system bottlenecks instantly.
                                </p>
                                <Link
                                  href="/builds/new"
                                  className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-1.5 text-[10px] font-bold hover:bg-indigo-500 transition-colors"
                                >
                                  Start PC Builder &rarr;
                                </Link>
                              </div>
                            </div>
                            <div className="pt-4 border-t border-stone-100 text-[10px] text-stone-400 font-medium px-1 flex items-center justify-between">
                              <span>Free Shipping on Orders</span>
                              <span className="text-emerald-600 font-bold">In Stock</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-3.5 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${isActive
                        ? "text-indigo-600 bg-indigo-50"
                        : "text-stone-600 hover:text-indigo-600 hover:bg-indigo-50/30"
                      }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Search bar – desktop */}
            <div className="hidden md:flex flex-1 max-w-xs relative">
              {(pathname.startsWith("/products") || pathname.startsWith("/builds")) ? (
                <>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-stone-400" aria-hidden />
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search components…"
                    className="w-full pl-9 pr-8 py-2 rounded-lg border border-stone-200 bg-stone-50 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-indigo-300 focus:bg-white focus:ring-1 focus:ring-indigo-300 transition-all duration-300"
                  />
                  {searchValue && (
                    <button
                      onClick={() => handleSearchChange("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </>
              ) : (
                <Link
                  href="/products"
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 rounded-lg border border-stone-200 bg-stone-50 text-sm text-stone-400 hover:border-indigo-300 hover:bg-white hover:text-indigo-600 transition-all duration-300 group"
                >
                  <Search className="size-3.5 shrink-0 group-hover:text-indigo-500 transition-colors" aria-hidden />
                  <span className="flex-1">Search components…</span>
                  <kbd className="hidden xl:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium text-stone-400 border border-stone-200 bg-white font-mono">
                    /
                  </kbd>
                </Link>
              )}
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
                className="hidden sm:inline-flex size-10 items-center justify-center rounded-lg text-stone-600 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all duration-300"
                aria-label="Account"
              >
                <User className="size-4" />
              </Link>

              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="relative inline-flex size-10 items-center justify-center rounded-lg text-stone-600 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all duration-300"
                aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
              >
                <ShoppingCart className="size-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 size-4 flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[9px] font-bold leading-none shadow-sm shadow-indigo-200">
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
              {(pathname.startsWith("/products") || pathname.startsWith("/builds")) ? (
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-stone-400" aria-hidden />
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search components…"
                    className="w-full pl-9 pr-8 py-2.5 rounded-lg border border-stone-200 bg-stone-50 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-indigo-300 focus:bg-white focus:ring-1 focus:ring-indigo-300 transition-all duration-300"
                  />
                  {searchValue && (
                    <button
                      onClick={() => handleSearchChange("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <Link
                  href="/products"
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-stone-200 bg-stone-50 text-sm text-stone-400"
                >
                  <Search className="size-3.5 shrink-0" aria-hidden />
                  <span>Search components…</span>
                </Link>
              )}
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
                    className={`px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors ${isActive
                        ? "text-stone-900 bg-stone-100"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
                      }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              
              {/* Mobile categories sub-menu */}
              <div className="border-t border-stone-100 my-2 pt-2">
                <span className="px-3.5 text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Categories</span>
                <div className="grid grid-cols-2 gap-0.5">
                  {[
                    { name: "GPUs", href: "/products?category=Graphics%20Cards" },
                    { name: "CPUs", href: "/products?category=Processors" },
                    { name: "Motherboards", href: "/products?category=Motherboards" },
                    { name: "RAM", href: "/products?category=Memory%20(RAM)" },
                    { name: "Storage", href: "/products?category=Storage%20(SSD/HDD)" },
                    { name: "PSUs", href: "/products?category=Power%20Supplies" },
                    { name: "Coolers", href: "/products?category=CPU%20Coolers" },
                    { name: "Cases", href: "/products?category=PC%20Cases" },
                  ].map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3.5 py-2 text-xs font-semibold text-stone-500 hover:text-indigo-600 rounded-lg"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

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