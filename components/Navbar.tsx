'use client';

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import {
  ShoppingCart,
  MapPin,
  Store,
  User,
  Cpu,
  Wrench,
  Home,
  Search,
  Disc
} from "lucide-react";
import { useShop } from "@/context/ShopContext";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/products", label: "Products", icon: Store },
  { href: "/builds/new", label: "Build PC", icon: Wrench },
  { href: "/builds", label: "Saved", icon: Disc },
  { href: "/track-order", label: "Track", icon: MapPin },
];



export default function Navbar() {
  const { cart, setCartOpen } = useShop();
  const pathname = usePathname();
  const { scrollY } = useScroll();

  const [isScrolled, setIsScrolled] = useState(false);

  const isLanding = pathname === "/";
  const cartItemCount = cart.reduce(
    (acc, item) => acc + item.quantity,
    0
  );

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 20);
  });

  return (
    <>
      {/* ---------------- TOP NAV ---------------- */}

      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
          isLanding
            ? "bg-zinc-950/80 border-white/5 backdrop-blur-xl text-white"
            : "bg-white/80 border-zinc-200/50 backdrop-blur-md text-zinc-950",
          isScrolled &&
          isLanding &&
          "bg-zinc-950/95 border-white/10 shadow-2xl",
          isScrolled &&
          !isLanding &&
          "bg-white/95 border-zinc-200 shadow-sm"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 md:h-20 items-center justify-between gap-4">
            {/* LOGO */}

            <Link
              href="/"
              className="flex items-center gap-2.5 group shrink-0"
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl border",
                  isLanding
                    ? "bg-white/10 border-white/20"
                    : "bg-zinc-950"
                )}
              >
                <Cpu
                  className={cn(
                    "h-5 w-5",
                    isLanding
                      ? "text-indigo-400"
                      : "text-white"
                  )}
                />
              </div>

              <span className="font-bold text-lg">
                Nexus
                <span className="text-indigo-400">
                  Hardware
                </span>
              </span>
            </Link>

            {/* Desktop Nav */}

            <div className="hidden md:flex flex-1 justify-center">
              <div className="flex gap-1 rounded-full bg-zinc-100/50 border p-1">
                {NAV_LINKS.map((l) => {
                  const active =
                    pathname === l.href;

                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      className={cn(
                        "px-5 py-1.5 rounded-full text-sm font-semibold",
                        active
                          ? "bg-white shadow text-zinc-900"
                          : "text-zinc-500"
                      )}
                    >
                      {l.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Actions */}

            <div className="flex gap-2">
              <button
                onClick={() => setCartOpen(true)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full"
              >
                <ShoppingCart size={20} />

                <AnimatePresence>
                  {cartItemCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 text-[10px] px-1.5 rounded-full bg-black text-white"
                    >
                      {cartItemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <Link
                href="/admin"
                className="flex h-10 w-10 items-center justify-center"
              >
                <User size={20} />
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>



      {/* ---------------- DOCK ---------------- */}

<div className="fixed bottom-5 left-0 right-0 z-50 flex justify-center md:hidden pointer-events-none">
  <motion.div
    initial={{ y: 60, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ type: "spring", stiffness: 120, damping: 18 }}
    className={cn(
      "pointer-events-auto relative flex items-center gap-1 px-3 py-2 rounded-full",
      "backdrop-blur-3xl border shadow-[0_10px_40px_rgba(0,0,0,0.25)]",

      isLanding
        ? "bg-zinc-900/80 border-white/10 text-white"
        : "bg-white/90 border-zinc-200/70 text-zinc-900"
    )}
  >
    {/* glow */}
    <div className="absolute inset-0 rounded-full pointer-events-none overflow-hidden">
      {isLanding ? (
        <div className="absolute inset-0 bg-indigo-500/10 blur-xl opacity-40" />
      ) : (
        <div className="absolute inset-0 bg-black/5 blur-xl opacity-40" />
      )}
    </div>

    <DockTab
      href="/"
      icon={Home}
      active={pathname === "/"}
      isLanding={isLanding}
    />

    {NAV_LINKS.map((link) => (
      <DockTab
        key={link.href}
        href={link.href}
        icon={link.icon}
        active={pathname === link.href}
        isLanding={isLanding}
      />
    ))}
  </motion.div>
</div>
    </>
  );
}






/* ---------------- Dock Tab ---------------- */
function DockTab({
  href,
  icon: Icon,
  active,
  onClick,
  badge,
  isLanding,
}: {
  href?: string;
  icon: any;
  active?: boolean;
  onClick?: () => void;
  badge?: number;
  isLanding: boolean;
}) {
  const content = (
    <motion.div
      layout
      transition={{
        type: "spring",
        stiffness: 350,
        damping: 25,
      }}
      whileTap={{ scale: 0.9 }}
      className={cn(
        "relative flex items-center justify-center",
        "h-11 w-11 rounded-full transition-all",

        active
          ? isLanding
            ? "bg-white text-zinc-900 shadow-lg"
            : "bg-zinc-900 text-white shadow"
          : isLanding
          ? "text-zinc-300 hover:text-white"
          : "text-zinc-600 hover:text-zinc-900"
      )}
    >
      {/* active pill */}
      {active && (
        <motion.div
          layoutId="active-pill"
          className={cn(
            "absolute inset-0 rounded-full",
            isLanding
              ? "bg-white/20"
              : "bg-zinc-900/10"
          )}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
        />
      )}

      <Icon
        size={20}
        strokeWidth={active ? 2.5 : 2}
        className="relative z-10"
      />

      {badge && badge > 0 && (
        <span className="absolute -top-1 -right-1 text-[10px] px-1.5 rounded-full bg-indigo-500 text-white">
          {badge > 99 ? "99" : badge}
        </span>
      )}
    </motion.div>
  );

  if (onClick) {
    return (
      <button className="px-1" onClick={onClick}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href!} className="px-1">
      {content}
    </Link>
  );
}