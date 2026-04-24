'use client';

import { memo } from 'react';
import Link from 'next/link';
import { ArrowRight, Cpu, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import { Container } from '@/components/layout/Container';

const CURRENT_YEAR = new Date().getFullYear();

const FOOTER_COLUMNS = [
    {
        title: 'Shop',
        links: [
            { href: '/products', label: 'All Components' },
            { href: '/products?category=Graphics Card', label: 'Graphics Cards' },
            { href: '/products?category=Processor', label: 'Processors' },
        ],
    },
    {
        title: 'Build',
        links: [
            { href: '/builds/new', label: 'Custom PC Builder' },
            { href: '/build-guides', label: 'Build Guides' },
            { href: '/track-order', label: 'Track Order' },
        ],
    },
] as const;

export default memo(function StorefrontFooter() {
    return (
        <footer className="px-3 pb-10 pt-8 sm:px-5 sm:pb-12">
            <Container maxWidth="2xl">
                <div className="overflow-hidden rounded-[2.25rem] border border-slate-200/80 bg-slate-950 text-white shadow-[0_36px_90px_-60px_rgba(15,23,42,0.72)]">
                    <div className="grid gap-10 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12 lg:px-10">
                        <div>
                            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/50">
                                Premium commerce experience
                            </p>
                            <h2 className="mt-4 text-4xl sm:text-5xl">
                                Buying a PC should feel as polished as unboxing one.
                            </h2>
                            <p className="mt-4 max-w-2xl text-base leading-8 text-white/68">
                                Clean navigation, fast product discovery, and a more deliberate visual system help customers move with less friction from browsing to checkout.
                            </p>

                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link
                                    href="/builds/new"
                                    className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-slate-950 transition-all duration-300 hover:-translate-y-0.5"
                                >
                                    Start a custom build
                                    <ArrowRight className="size-4" />
                                </Link>
                                <Link
                                    href="/products"
                                    className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 bg-white/8 px-6 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/12"
                                >
                                    Browse components
                                </Link>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-[1.6rem] border border-white/10 bg-white/6 p-5">
                                <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-white text-slate-950">
                                    <Cpu className="size-5" />
                                </div>
                                <p className="text-xl font-semibold tracking-[-0.03em]">MD Computers</p>
                                <p className="mt-3 text-sm leading-7 text-white/62">
                                    Refined storefront design for serious hardware buyers and a clearer admin experience for the team behind it.
                                </p>
                            </div>

                            <div className="grid gap-4">
                                <div className="rounded-[1.6rem] border border-white/10 bg-white/6 p-5">
                                    <div className="flex items-center gap-3 text-sm font-semibold text-white">
                                        <ShieldCheck className="size-4 text-white/65" />
                                        Clearer trust signals
                                    </div>
                                    <p className="mt-3 text-sm leading-7 text-white/62">
                                        Better hierarchy, stronger contrast, less noise.
                                    </p>
                                </div>
                                <div className="rounded-[1.6rem] border border-white/10 bg-white/6 p-5">
                                    <div className="flex items-center gap-3 text-sm font-semibold text-white">
                                        <Sparkles className="size-4 text-white/65" />
                                        Modern presentation
                                    </div>
                                    <p className="mt-3 text-sm leading-7 text-white/62">
                                        Purposeful motion and premium spacing across every major surface.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-8 border-t border-white/10 px-6 py-6 text-sm text-white/65 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:px-10">
                        <div className="grid gap-8 sm:grid-cols-2">
                            {FOOTER_COLUMNS.map((column) => (
                                <div key={column.title}>
                                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-white/40">
                                        {column.title}
                                    </p>
                                    <div className="mt-4 space-y-3">
                                        {column.links.map((link) => (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                className="block transition-colors duration-300 hover:text-white"
                                            >
                                                {link.label}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col gap-2 text-white/45 lg:items-end">
                            <div className="inline-flex items-center gap-2">
                                <Wrench className="size-4" />
                                <span>Designed & built by Atharv Shelke</span>
                            </div>
                            <p>© {CURRENT_YEAR} MD Computers. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </Container>
        </footer>
    );
});
