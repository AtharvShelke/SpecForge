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
    { href: "/builds", label: "Saved Builds" },
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
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 overflow-hidden",
                isScrolled
                    ? "bg-zinc-950/90 backdrop-blur-xl border-b border-white/5 shadow-2xl py-0"
                    : "bg-zinc-950 backdrop-blur-md py-2"
            )}
        >
            {/* Footer-matching Night Blueish Gradient Blobs */}
            <div className="absolute inset-0 pointer-events-none opacity-50">
                <div className="absolute -top-[50%] -left-[10%] w-[120%] h-[200%] rounded-full bg-indigo-950/50 blur-[100px]" />
                <div className="absolute top-[0%] -right-[20%] w-[80%] h-[150%] rounded-full bg-violet-950/40 blur-[100px]" />
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-20 items-center justify-between gap-8 relative z-10">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 group shrink-0">
                        <div className={cn(
                            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110",
                            "bg-white/10 border border-white/20 backdrop-blur-sm shadow-lg shadow-indigo-500/10"
                        )}>
                            <Cpu className="h-5 w-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                        </div>
                        <span className="font-bold tracking-tight text-lg text-white group-hover:text-indigo-100 transition-colors">
                            Nexus Hardware
                        </span>
                    </Link>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex flex-1 items-center justify-center">
                        <div className="flex items-center gap-1 rounded-full p-1.5 bg-white/5 border border-white/10 backdrop-blur-md">
                            {NAV_LINKS.map(({ href, label }) => {
                                const active = pathname === href;
                                return (
                                    <Link
                                        key={href}
                                        href={href}
                                        className={cn(
                                            "relative px-5 py-2 text-sm font-semibold rounded-full transition-all duration-300",
                                            active
                                                ? "bg-white/10 text-white shadow-sm ring-1 ring-white/20"
                                                : "text-zinc-400 hover:text-white hover:bg-white/5"
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
                            className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-all duration-300"
                        >
                            <Search size={20} />
                        </Link>

                        {/* Cart Icon */}
                        <button
                            onClick={() => setCartOpen(true)}
                            className="relative flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-all duration-300"
                        >
                            <ShoppingCart size={20} />
                            {cartItemCount > 0 && (
                                <span className={cn(
                                    "absolute -top-1.5 -right-1.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none shadow-sm",
                                    "bg-indigo-500 text-white ring-2 ring-zinc-950"
                                )}>
                                    {cartItemCount > 99 ? "99+" : cartItemCount}
                                </span>
                            )}
                        </button>

                        {/* Profile Icon */}
                        <Link
                            href="/admin"
                            className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-all duration-300"
                        >
                            <User size={20} />
                        </Link>
                    </div>
                </div>
            </div>
        </motion.nav>
    );
}
