'use client';

import React from "react";
import { Cpu } from "lucide-react";
import { usePathname } from "next/navigation";

const Footer: React.FC = () => {
    const pathname = usePathname();
    if (pathname === '/') return null;

    return (
        <footer className="mt-auto hidden px-5 pb-8 pt-6 md:block lg:px-10">
            <div className="app-surface mx-auto flex max-w-[1440px] items-center justify-between gap-4 rounded-[1.75rem] px-6 py-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
                        <Cpu className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
                            MD Computers
                        </p>
                        <p className="text-sm text-slate-500">
                            © {new Date().getFullYear()} All rights reserved.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                    <span>Designed & built by</span>
                    <a
                        href="https://atharv-shelke-portfolio.vercel.app"
                        className="text-slate-950 underline decoration-slate-200 underline-offset-4 transition-colors hover:decoration-slate-950"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Atharv Shelke
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
