"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import {
  ShoppingCart,
  MapPin,
  Store,
  User,
  Cpu,
  Wrench,
  Home,
  Search,
  Disc,
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
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

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
          "sticky top-0 left-0 right-0 z-50 transition-all duration-500 border-b",
          isLanding
            ? "bg-[#03060f] border-[#1a2744]/60 backdrop-blur-2xl text-white"
            : "bg-white/90 border-zinc-200/50 backdrop-blur-md text-zinc-950",
          isScrolled &&
            isLanding &&
            "bg-[#03060f] border-[#1e2f55]/80 shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
          isScrolled && !isLanding && "bg-white/95 border-zinc-200 shadow-sm",
        )}
      >
        {/* Subtle top accent line — only on landing */}
        {isLanding && (
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent pointer-events-none" />
        )}

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 md:h-[72px] items-center justify-between gap-4">
            {/* ── LOGO ── */}
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-300",
                  isLanding
                    ? "bg-blue-500/10 border-blue-500/25 group-hover:bg-blue-500/20 group-hover:border-blue-400/40"
                    : "bg-zinc-950 border-zinc-800",
                )}
              >
                <Cpu
                  className={cn(
                    "h-5 w-5 transition-colors duration-300",
                    isLanding ? "text-blue-400" : "text-white",
                  )}
                />
              </div>
              <span className="font-bold text-lg tracking-tight">
                Nexus
                <span
                  className={isLanding ? "text-blue-400" : "text-indigo-500"}
                >
                  Hardware
                </span>
              </span>
            </Link>

            {/* ── Desktop Nav pill ── */}
            <div className="hidden md:flex flex-1 justify-center">
              <div
                className={cn(
                  "flex gap-0.5 rounded-full p-1 border transition-all duration-300",
                  isLanding
                    ? "bg-[#0a1628]/70 border-[#1e3060]/60 backdrop-blur-xl"
                    : "bg-zinc-100/80 border-zinc-200/60",
                )}
              >
                {NAV_LINKS.map((l) => {
                  const active = pathname === l.href;
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      className={cn(
                        "px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200",
                        isLanding
                          ? active
                            ? "bg-gradient-to-b from-[#1a3a7a] to-[#0f2456] text-white shadow-[0_0_0_1px_rgba(99,152,255,0.2),0_2px_12px_rgba(37,99,235,0.3)] border border-blue-500/20"
                            : "text-blue-200/60 hover:text-blue-100 hover:bg-white/5"
                          : active
                            ? "bg-white shadow text-zinc-900"
                            : "text-zinc-500 hover:text-zinc-800",
                      )}
                    >
                      {l.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* ── Actions ── */}
            <div className="flex items-center gap-1">
              {/* Cart */}
              <button
                onClick={() => setCartOpen(true)}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200",
                  isLanding
                    ? "border-[#1e3060]/60 bg-[#0a1628]/50 text-blue-200/70 hover:text-white hover:bg-[#0f2050]/80 hover:border-blue-500/30"
                    : "border-transparent text-zinc-600 hover:bg-zinc-100",
                )}
              >
                <ShoppingCart size={18} />
                <AnimatePresence>
                  {cartItemCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className={cn(
                        "absolute -top-1 -right-1 text-[10px] px-1.5 rounded-full font-bold",
                        isLanding
                          ? "bg-blue-500 text-white shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                          : "bg-zinc-900 text-white",
                      )}
                    >
                      {cartItemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* User */}
              <Link
                href="/admin"
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200",
                  isLanding
                    ? "border-[#1e3060]/60 bg-[#0a1628]/50 text-blue-200/70 hover:text-white hover:bg-[#0f2050]/80 hover:border-blue-500/30"
                    : "border-transparent text-zinc-600 hover:bg-zinc-100",
                )}
              >
                <User size={18} />
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ---------------- MOBILE DOCK ---------------- */}
      <div className="fixed bottom-5 left-0 right-0 z-50 flex justify-center md:hidden pointer-events-none">
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          className={cn(
            "pointer-events-auto relative flex items-center gap-1 px-3 py-2 rounded-full",
            "backdrop-blur-3xl border",
            isLanding
              ? "bg-[#06101f]/85 border-[#1a2f5a]/70 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_0_1px_rgba(99,152,255,0.06)]"
              : "bg-white/90 border-zinc-200/70 text-zinc-900 shadow-[0_10px_40px_rgba(0,0,0,0.15)]",
          )}
        >
          {/* Inner glow */}
          <div className="absolute inset-0 rounded-full pointer-events-none overflow-hidden">
            {isLanding ? (
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/8 to-transparent" />
            ) : (
              <div className="absolute inset-0 bg-black/5 blur-xl opacity-40" />
            )}
          </div>

          {/* Top edge highlight */}
          {isLanding && (
            <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-blue-400/30 to-transparent rounded-full pointer-events-none" />
          )}

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
            : "text-zinc-600 hover:text-zinc-900",
      )}
    >
      {/* active pill */}
      {active && (
        <motion.div
          layoutId="active-pill"
          className={cn(
            "absolute inset-0 rounded-full",
            isLanding ? "bg-white/20" : "bg-zinc-900/10",
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
