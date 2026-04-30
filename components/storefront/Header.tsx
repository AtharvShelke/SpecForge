"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, User } from "lucide-react";

import { useShop } from "@/context/ShopContext";

export default function Header() {
  const pathname = usePathname();
  const { cart, setCartOpen } = useShop();
  const navLinks = [
    { href: "/products", label: "Products" },
    { href: "/builds/new", label: "Build" },
    { href: "/track-order", label: "Track Order" },
  ];

  if (pathname === "/checkout") {
    return null;
  }

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="flex w-full items-center gap-4 px-4 py-3 sm:px-5 lg:px-6">
        <Link href="/" className="shrink-0 text-base font-semibold text-gray-900">
          Computer Store
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/admin"
            className="inline-flex size-11 items-center justify-center rounded-md border border-gray-200 text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
            aria-label="Account"
          >
            <User className="size-4" />
          </Link>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative inline-flex size-11 items-center justify-center rounded-md border border-gray-200 text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
            aria-label="Open cart"
          >
            <ShoppingCart className="size-4" />
            {cartCount > 0 ? (
              <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-black px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-white">
                {cartCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200 px-4 py-3 sm:px-5 md:hidden">
        <nav className="flex items-center gap-2 overflow-x-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
