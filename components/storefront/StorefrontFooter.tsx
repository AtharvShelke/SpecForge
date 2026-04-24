'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Cpu, Twitter, Github, Youtube, Instagram, ArrowRight, ShieldCheck, Zap, LaptopMinimal } from 'lucide-react';

// ── Constants (module scope — never recreated) ────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();

const SOCIAL_LINKS = [
    { icon: Twitter,   label: 'Twitter'   },
    { icon: Github,    label: 'Github'    },
    { icon: Youtube,   label: 'Youtube'   },
    { icon: Instagram, label: 'Instagram' },
] as const;

const EQUIPMENT_LINKS = [
    { href: '/products?category=Graphics Card',         label: 'Graphics Cards' },
    { href: '/products?category=Processor',          label: 'Processors'     },
    { href: '/products?category=Motherboard',  label: 'Motherboards'   },
    { href: '/products',                       label: 'All Components' },
] as const;

const ECOSYSTEM_LINKS = [
    { href: '/builds/new',    label: 'Custom PC Builder'  },
    { href: '/build-guides',  label: 'Prebuilt Systems'   },
    { href: '/builds',        label: 'Community Builds'   },
    { href: '/admin',         label: 'Admin Dashboard'    },
] as const;

const SUPPORT_LINKS = [
    { href: '/track-order', label: 'Track Order',   external: false },
    { href: '#',            label: 'Warranty Info', external: false },
    { href: '#',            label: 'Return Policy', external: false },
    { href: '#',            label: 'Contact Us',    external: false },
] as const;

// ── Sub-components ────────────────────────────────────────────────────────────

const FooterLinkColumn = memo(function FooterLinkColumn({
    heading,
    icon: Icon,
    links,
}: {
    heading: string
    icon:    React.ElementType
    links:   readonly { href: string; label: string }[]
}) {
    return (
        <div>
            <h3 className="font-semibold text-white tracking-wider uppercase text-xs mb-4 sm:mb-6 flex items-center gap-2">
                <Icon size={16} className="text-zinc-600" /> {heading}
            </h3>
            <ul className="space-y-3 text-sm text-zinc-400">
                {links.map(({ href, label }) => (
                    <li key={label}>
                        <Link href={href} className="hover:text-indigo-400 transition-colors">
                            {label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
})

// ── StorefrontFooter ──────────────────────────────────────────────────────────

export default memo(function StorefrontFooter() {
    return (
        <footer className="relative text-white overflow-hidden mt-auto">
            {/* Subtle Background Gradient */}
            <div className="absolute inset-0 pointer-events-none opacity-40">
                <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[40%] sm:w-[50%] sm:h-[50%] blur-[80px] sm:blur-[120px] rounded-full bg-indigo-900/40" />
                <div className="absolute top-[60%] -right-[10%] w-[60%] h-[40%] sm:w-[40%] sm:h-[60%] blur-[80px] sm:blur-[120px] rounded-full bg-violet-900/30" />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

                {/* Top CTA */}
                <div className="mb-10 sm:mb-14 md:mb-20 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 md:gap-12 items-center border-b border-white/10 pb-10 sm:pb-14 md:pb-16">
                    <div>
                        <h2 className="text-2xl md:text-3xl lg:text-5xl font-black tracking-tight text-white mb-4 sm:mb-6">
                            Build your<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400">
                                dream PC
                            </span>
                        </h2>
                        <p className="text-zinc-400 text-sm md:text-xl lg:text-2xl font-light leading-relaxed">
                            High-performance components, flawless compatibility, and enthusiast-grade custom builds. Join the elite.
                        </p>
                    </div>
                    <div className="flex md:justify-end">
                        <Link
                            href="/builds/new"
                            className="group relative inline-flex items-center gap-3 px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 rounded-lg sm:rounded-full font-semibold bg-white text-zinc-950 uppercase tracking-wide overflow-hidden hover:scale-105 active:scale-95 transition-all duration-300"
                        >
                            <span className="relative z-10">Start Custom Build</span>
                            <div className="relative z-10 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-zinc-100 flex items-center justify-center group-hover:bg-zinc-200 transition-colors">
                                <ArrowRight size={16} />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-white via-zinc-200 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </Link>
                    </div>
                </div>

                {/* Links & Brand */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 lg:gap-8 border-b border-white/10 pb-10 sm:pb-14 md:pb-16 mb-6 sm:mb-8">

                    {/* Brand column */}
                    <div className="col-span-2 md:col-span-1 md:border-r border-white/10 md:pr-8">
                        <Link href="/" className="flex items-center gap-2.5 group mb-4 sm:mb-6">
                            <div className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-xl bg-white/10 border border-white/20 shadow-sm transition-transform group-hover:scale-110">
                                <Cpu className="h-5 w-5 text-indigo-400" />
                            </div>
                            <span className="font-bold tracking-tight text-xl text-white">Nexus</span>
                        </Link>
                        <p className="text-zinc-500 text-sm mb-4 sm:mb-6 leading-relaxed">
                            We empower gamers and professionals with the best hardware choices on the planet. Built by enthusiasts, for enthusiasts.
                        </p>
                        <div className="flex gap-4 text-zinc-400">
                            {SOCIAL_LINKS.map(({ icon: Icon, label }) => (
                                <a key={label} href="#" aria-label={label} className="hover:text-white transition-colors">
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    <FooterLinkColumn heading="Equipment" icon={LaptopMinimal} links={EQUIPMENT_LINKS} />
                    <FooterLinkColumn heading="Ecosystem"  icon={Zap}           links={ECOSYSTEM_LINKS} />
                    <FooterLinkColumn heading="Support"    icon={ShieldCheck}   links={SUPPORT_LINKS} />
                </div>

                {/* Bottom bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-2 sm:gap-4 text-xs font-medium text-zinc-500">
                    <p>© {CURRENT_YEAR} Nexus Hardware. All rights reserved.</p>
                    <div className="flex items-center gap-1.5">
                        <span>Designed & Built by</span>
                        <a
                            href="https://atharv-shelke.vercel.app"
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
});