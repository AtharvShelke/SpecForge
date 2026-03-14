'use client';

import React, { useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Search, User, Cpu, Menu, X } from "lucide-react";
import { useShop } from "@/context/ShopContext";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
    { href: "/products", label: "Products" },
    { href: "/builds/new", label: "Build PC" },
    { href: "/builds", label: "Saved Builds" },
    { href: "/track-order", label: "Track Order" },
];

export default function StorefrontNavbar() {
    const { cart, setCartOpen } = useShop();
    const pathname = usePathname();

    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        setIsScrolled(latest > 50);
    });

    const cartItemCount = cart.reduce(
        (acc, item) => acc + item.quantity,
        0
    );

    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur-xl border-b border-white/5"
        >
            {/* gradient */}
            <div className="absolute inset-0 pointer-events-none opacity-50">
                <div className="absolute -top-[50%] -left-[10%] w-[120%] h-[200%] rounded-full bg-indigo-950/50 blur-[100px]" />
                <div className="absolute top-[0%] -right-[20%] w-[80%] h-[150%] rounded-full bg-violet-950/40 blur-[100px]" />
            </div>

            <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
                <div className="flex h-14 sm:h-20 items-center justify-between gap-2 sm:gap-4 relative z-10">

                    {/* LOGO */}
                    <Link href="/" className="flex items-center gap-2 shrink-0">
                        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-white/10 border border-white/20">
                            <Cpu className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-400" />
                        </div>

                        <span className="font-semibold text-white text-xs sm:text-lg tracking-tight">
                            Nexus Hardware
                        </span>
                    </Link>

                    {/* DESKTOP NAV */}
                    <div className="hidden md:flex flex-1 justify-center">
                        <div className="flex gap-1 rounded-full p-1.5 bg-white/5 border border-white/10">
                            {NAV_LINKS.map(({ href, label }) => {
                                const active = pathname === href;

                                return (
                                    <Link
                                        key={href}
                                        href={href}
                                        className={cn(
                                            "px-5 py-2 text-sm rounded-full font-semibold",
                                            active
                                                ? "bg-white/10 text-white"
                                                : "text-zinc-400 hover:text-white"
                                        )}
                                    >
                                        {label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex items-center gap-1 sm:gap-3">



                        {/* SEARCH */}
                        <Link
                            href="/products"
                            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center text-zinc-400 hover:text-white"
                        >
                            <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Link>

                        {/* CART */}
                        <button
                            onClick={() => setCartOpen(true)}
                            className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center text-zinc-400 hover:text-white"
                        >
                            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />

                            {cartItemCount > 0 && (
                                <span className="absolute -top-1 -right-1 text-[10px] bg-indigo-500 text-white rounded-full px-1">
                                    {cartItemCount}
                                </span>
                            )}
                        </button>
                        {/* MOBILE MENU BUTTON */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="md:hidden flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center text-zinc-300"
                        >
                            {mobileOpen ? <X /> : <Menu />}
                        </button>
                        {/* PROFILE */}
                        <Link
                            href="/admin"
                            className="hidden sm:flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center text-zinc-400 hover:text-white"
                        >
                            <User className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Link>

                    </div>
                </div>
            </div>

            {/* MOBILE MENU */}
            {mobileOpen && (
                <div className="md:hidden border-t border-white/10 bg-zinc-950/95 backdrop-blur-xl">

                    <div className="flex flex-col p-3 gap-2">

                        {NAV_LINKS.map(({ href, label }) => (
                            <Link
                                key={href}
                                href={href}
                                onClick={() => setMobileOpen(false)}
                                className="px-4 py-3 rounded-lg text-zinc-300 hover:bg-white/5"
                            >
                                {label}
                            </Link>
                        ))}

                    </div>

                </div>
            )}
        </motion.nav>
    );
}