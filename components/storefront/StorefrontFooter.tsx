'use client';

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Cpu, Twitter, Github, Youtube, Instagram, ArrowRight, ShieldCheck, Zap, LaptopMinimal } from "lucide-react";

export default function StorefrontFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative  text-white overflow-hidden mt-auto pb-16 md:pb-0">
            {/* Subtle Animated Background Gradient */}
            <div className="absolute inset-0 pointer-events-none opacity-40">
                <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[40%] sm:w-[50%] sm:h-[50%] blur-[80px] sm:blur-[120px] rounded-full bg-indigo-900/40" />
                <div className="absolute top-[60%] -right-[10%] w-[60%] h-[40%] sm:w-[40%] sm:h-[60%] blur-[80px] sm:blur-[120px] rounded-full bg-violet-900/30" />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">

                {/* Top Section / Call to Action */}
                <div className="mb-10 sm:mb-14 md:mb-20 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 md:gap-12 items-center border-b border-white/10 pb-10 sm:pb-14 md:pb-16">
                    <div>
                        <h2 className="text-2xl md:text-3xl lg:text-5xl font-black tracking-tight text-white mb-4 sm:mb-6">
                            Build your<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400">
                                dream PC
                            </span>
                        </h2>
                        <p className="text-zinc-400 text-xs sm:text-sm sm:text-base md:text-xl lg:text-2xl font-light leading-relaxed">
                            High-performance components, flawless compatibility, and enthusiast-grade custom builds. Join the elite.
                        </p>
                    </div>
                    <div className="flex md:justify-end">
                        <Link
                            href="/builds/new"
                            className="group relative inline-flex items-center gap-3 px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 rounded-lg sm:rounded-full font-semibold bg-white text-zinc-950 uppercase tracking-wide overflow-hidden hover:scale-105 active:scale-95 transition-all duration-300"
                        >
                            <span className="relative z-10">Start Custom Build</span>
                            <motion.div
                                className="relative z-10 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-zinc-100 flex items-center justify-center group-hover:bg-zinc-200 transition-colors"
                            >
                                <ArrowRight size={16} />
                            </motion.div>
                            <div className="absolute inset-0 bg-gradient-to-r from-white via-zinc-200 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </Link>
                    </div>
                </div>

                {/* Links & Brand Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-12 lg:gap-8 border-b border-white/10 pb-10 sm:pb-14 md:pb-16 mb-4 sm:mb-6 sm:mb-8">

                    <div className="md:col-span-1 border-r-0 md:border-r border-white/10 pr-8">
                        <Link href="/" className="flex items-center gap-2.5 group mb-4 sm:mb-6">
                            <div className="flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-xl bg-white/10 border border-white/20 shadow-sm transition-transform group-hover:scale-110">
                                <Cpu className="h-5 w-5 text-indigo-400" />
                            </div>
                            <span className="font-bold tracking-tight text-lg sm:text-xl text-white">
                                Nexus
                            </span>
                        </Link>
                        <p className="text-zinc-500 text-xs sm:text-sm mb-4 sm:mb-6 leading-relaxed">
                            We empower gamers and professionals with the best hardware choices on the planet. Built by enthusiasts, for enthusiasts.
                        </p>
                        <div className="flex gap-2 sm:gap-4 text-zinc-400">
                            <a href="#" className="hover:text-white transition-colors"><Twitter size={18} /></a>
                            <a href="#" className="hover:text-white transition-colors"><Github size={18} /></a>
                            <a href="#" className="hover:text-white transition-colors"><Youtube size={18} /></a>
                            <a href="#" className="hover:text-white transition-colors"><Instagram size={18} /></a>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white tracking-wider uppercase text-xs sm:text-sm mb-4 sm:mb-6 flex items-center gap-2">
                            <LaptopMinimal size={16} className="text-zinc-600" /> Equipment
                        </h3>
                        <ul className="space-y-2 sm:space-y-4 text-xs sm:text-sm text-zinc-400">
                            <li><Link href="/products?category=GPU" className="hover:text-indigo-400 transition-colors">Graphics Cards</Link></li>
                            <li><Link href="/products?category=CPU" className="hover:text-indigo-400 transition-colors">Processors</Link></li>
                            <li><Link href="/products?category=MOTHERBOARD" className="hover:text-indigo-400 transition-colors">Motherboards</Link></li>
                            <li><Link href="/products" className="hover:text-indigo-400 transition-colors">All Components</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white tracking-wider uppercase text-xs sm:text-sm mb-4 sm:mb-6 flex items-center gap-2">
                            <Zap size={16} className="text-zinc-600" /> Ecosystem
                        </h3>
                        <ul className="space-y-2 sm:space-y-4 text-xs sm:text-sm text-zinc-400">
                            <li><Link href="/builds/new" className="hover:text-indigo-400 transition-colors">Custom PC Builder</Link></li>
                            <li><Link href="/build-guides" className="hover:text-indigo-400 transition-colors">Prebuilt Systems</Link></li>
                            <li><Link href="/builds" className="hover:text-indigo-400 transition-colors">Community Builds</Link></li>
                            <li><Link href="/admin" className="hover:text-indigo-400 transition-colors">Admin Dashboard</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white tracking-wider uppercase text-xs sm:text-sm mb-4 sm:mb-6 flex items-center gap-2">
                            <ShieldCheck size={16} className="text-zinc-600" /> Support
                        </h3>
                        <ul className="space-y-2 sm:space-y-4 text-xs sm:text-sm text-zinc-400">
                            <li><Link href="/track-order" className="hover:text-indigo-400 transition-colors">Track Order</Link></li>
                            <li><a href="#" className="hover:text-indigo-400 transition-colors">Warranty Info</a></li>
                            <li><a href="#" className="hover:text-indigo-400 transition-colors">Return Policy</a></li>
                            <li><a href="#" className="hover:text-indigo-400 transition-colors">Contact Us</a></li>
                        </ul>
                    </div>

                </div>

                {/* Bottom Banner */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-2 sm:gap-4 text-[10px] sm:text-xs font-medium text-zinc-500">
                    <p>© {currentYear} Nexus Hardware. All rights reserved.</p>
                    <div className="flex items-center gap-1.5">
                        <span>Designed & Built by</span>
                        <a
                            href="https://atharv-shelke-portfolio.vercel.app"
                            className="text-white hover:text-indigo-400 underline decoration-zinc-700 underline-offset-4 transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Atharv Shelke
                        </a>
                    </div>
                </div>

            </div>
        </footer>
    );
}
