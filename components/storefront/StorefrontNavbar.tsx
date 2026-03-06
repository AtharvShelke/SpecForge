'use client';

import React, { useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Search, User, Cpu } from "lucide-react";
import { useShop } from "@/context/ShopContext";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
    { href: "/products", label: "Products" },
    { href: "/builds/new", label: "Build PC" },
    { href: "/build-guides", label: "Prebuilt Builds" },
    { href: "/track-order", label: "Track Order" },
];

export default function StorefrontNavbar() {
    const { cart, setCartOpen } = useShop();
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        setIsScrolled(latest > 50);
    });

    const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
                "top-0 left-0 right-0 z-50 transition-colors duration-300",
                isScrolled
                    ? "fixed bg-white/80 backdrop-blur-xl border-b border-zinc-200/80 shadow-sm"
                    : "bg-zinc-950 backdrop-blur-md"
            )}
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-20 items-center justify-between gap-8">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 group shrink-0">
                        <div className={cn(
                            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105",
                            isScrolled ? "bg-zinc-950 shadow-md" : "bg-white/10 border border-white/20 backdrop-blur-sm shadow-lg"
                        )}>
                            <Cpu className={cn("h-5 w-5 transition-colors", isScrolled ? "text-white" : "text-white/90")} />
                        </div>
                        <span className={cn(
                            "font-bold tracking-tight text-lg transition-colors duration-300",
                            isScrolled ? "text-zinc-950" : "text-white"
                        )}>
                            Nexus Hardware
                        </span>
                    </Link>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex flex-1 items-center justify-center">
                        <div className={cn(
                            "flex items-center gap-1 rounded-full p-1.5 transition-colors duration-300",
                            isScrolled ? "bg-zinc-50/80 border border-zinc-200/60" : "bg-black/20 border border-white/10"
                        )}>
                            {NAV_LINKS.map(({ href, label }) => {
                                const active = pathname === href;
                                return (
                                    <Link
                                        key={href}
                                        href={href}
                                        className={cn(
                                            "relative px-5 py-2 text-sm font-semibold rounded-full transition-colors duration-300",
                                            isScrolled
                                                ? active
                                                    ? "bg-white text-zinc-950 shadow-sm border border-zinc-200/50"
                                                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50"
                                                : active
                                                    ? "bg-white/20 text-white shadow-sm border border-white/20"
                                                    : "text-zinc-300 hover:text-white hover:bg-white/10"
                                        )}
                                    >
                                        {label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        {/* Search Icon */}
                        <Link
                            href="/products"
                            className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300",
                                isScrolled
                                    ? "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                                    : "text-zinc-300 hover:text-white hover:bg-white/10"
                            )}
                        >
                            <Search size={20} />
                        </Link>

                        {/* Cart Icon */}
                        <button
                            onClick={() => setCartOpen(true)}
                            className={cn(
                                "relative flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300",
                                isScrolled
                                    ? "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                                    : "text-zinc-300 hover:text-white hover:bg-white/10"
                            )}
                        >
                            <ShoppingCart size={20} />
                            {cartItemCount > 0 && (
                                <span className={cn(
                                    "absolute -top-1.5 -right-1.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none shadow-sm",
                                    isScrolled
                                        ? "bg-zinc-900 text-white ring-2 ring-white"
                                        : "bg-indigo-500 text-white ring-2 ring-black/20"
                                )}>
                                    {cartItemCount > 99 ? "99+" : cartItemCount}
                                </span>
                            )}
                        </button>

                        {/* Profile Icon */}
                        <Link
                            href="/admin"
                            className={cn(
                                "hidden sm:flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300",
                                isScrolled
                                    ? "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                                    : "text-zinc-300 hover:text-white hover:bg-white/10"
                            )}
                        >
                            <User size={20} />
                        </Link>
                    </div>
                </div>
            </div>
        </motion.nav>
    );
}
