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
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useShop } from "@/context/ShopContext";

// shadcn
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";

const Navbar: React.FC = () => {
  const { cart, setCartOpen } = useShop();
  const pathname = usePathname();

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const isActive = (path: string) =>
    pathname === path
      ? "text-blue-600"
      : "text-gray-600 hover:text-gray-900";

  /* ---------- Shared badge (desktop + mobile) ---------- */
  const CountBadge = ({ count }: { count: number }) =>
    count > 0 ? (
      <span
        className="
        absolute -top-1.5 -right-1.5
        min-w-[16px] h-4 px-1
        flex items-center justify-center
        rounded-full bg-red-600
        text-[10px] font-medium text-white
        leading-none
      "
      >
        {count > 99 ? "99+" : count}
      </span>
    ) : null;

  /* ---------------- Desktop Navbar ---------------- */

  const DesktopNavbar = (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-blue-600/90 p-1.5 rounded-lg shadow-sm">
              <Monitor className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-gray-900">
              PC Parts
            </span>
          </Link>
          <Link
            href="/admin"
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
          >
            <User size={20} />
          </Link>
          {/* Navigation */}
          <NavigationMenu className="hidden md:block">
            <NavigationMenuList className="gap-6">
              <NavigationMenuItem>
                <Link href="/products" className={`${isActive("/products")} flex items-center gap-1.5  text-sm`}>
                  <ShoppingCart size={15} />
                  Products
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link
                  href="/builds"
                  className={`${isActive("/builds")} flex items-center gap-1.5 text-sm`}
                >
                  <Save size={15} />
                  Saved Builds
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link
                  href="/build-guides"
                  className={`${isActive("/build-guides")} flex items-center gap-1.5 text-sm`}
                >
                  <BookOpen size={15} />
                  Build Guides
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link
                  href="/track-order"
                  className={`${isActive("/track-order")} flex items-center gap-1.5 text-sm`}
                >
                  <MapPin size={15} />
                  Track Order
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            {/* Cart */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
            >
              <span className="relative inline-flex">
                <ShoppingCart size={20} />
                <CountBadge count={cartItemCount} />
              </span>
            </button>


            {/* User (future auth) */}
            <Link
              href="/admin"
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
            >
              <User size={20} />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );

  /* ---------------- Mobile Bottom Navbar ---------------- */

  const MobileBottomNav = (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
      <div className="flex items-center justify-around h-14">
        {[
          { to: "/products", label: "Shop", icon: Store },
          { to: "/builds", label: "Builds", icon: Save },
          { to: "/build-guides", label: "Guides", icon: BookOpen },
          { to: "/track-order", label: "Track", icon: MapPin },
        ].map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            href={to}
            className={`flex flex-col items-center justify-center text-xs ${pathname === to
              ? "text-blue-600"
              : "text-gray-500"
              }`}
          >
            <div className="relative">
              <Icon size={20} />
            </div>
          </Link>
        ))}

        {/* Cart (mobile only) */}
        <button
          onClick={() => setCartOpen(true)}
          className="flex flex-col items-center justify-center text-xs text-gray-500"
        >
          <div className="relative">
            <ShoppingCart size={20} />
            <CountBadge count={cartItemCount} />
          </div>
        </button>
      </div>
    </nav>
  );

  return (
    <>
      {DesktopNavbar}
      {MobileBottomNav}
    </>
  );
};

export default Navbar;
