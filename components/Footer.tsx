"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  if (pathname === "/checkout" || pathname === "/products") {
    return null;
  }

<<<<<<< HEAD
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} Computer Store. Secure hardware shopping.</p>
        <div className="flex items-center gap-4">
          <Link href="/products" className="transition-colors hover:text-gray-900">
            Catalog
          </Link>
          <Link href="/track-order" className="transition-colors hover:text-gray-900">
            Track Order
          </Link>
          
        </div>
      </div>
    </footer>
  );
}
=======
                {/* Brand / Copyright */}
                <div className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-zinc-100">
                        <Cpu className="h-3.5 w-3.5 text-zinc-900" />
                    </div>
                    <p className="text-sm text-zinc-500 font-medium">
                        © {new Date().getFullYear()} SpecForge. All rights reserved.
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
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
