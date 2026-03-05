import React from "react";
import { Cpu } from "lucide-react";

const Footer: React.FC = () => {
    return (
        <footer className="mt-auto border-t border-zinc-200 bg-white px-4 py-8 sm:px-6 lg:px-8 pb-24 md:pb-8">
            <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">

                {/* Brand / Copyright */}
                <div className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-zinc-100">
                        <Cpu className="h-3.5 w-3.5 text-zinc-900" />
                    </div>
                    <p className="text-sm text-zinc-500 font-medium">
                        © {new Date().getFullYear()} Nexus Hardware. All rights reserved.
                    </p>
                </div>

                {/* Creator Link */}
                <div className="flex items-center gap-1.5 text-sm text-zinc-400 font-medium">
                    <span>Designed & Built by</span>
                    <a
                        href="https://atharv-shelke-portfolio.vercel.app"
                        className="text-zinc-900 underline decoration-zinc-200 underline-offset-4 transition-colors hover:decoration-zinc-900"
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