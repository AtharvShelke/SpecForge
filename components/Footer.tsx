"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  if (pathname === "/checkout" || pathname === "/products") {
    return null;
  }

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} MD Computers. Secure hardware shopping.</p>
        <div className="flex items-center gap-4">
          <Link href="/products" className="transition-colors hover:text-gray-900">
            Catalog
          </Link>
          <Link href="/track-order" className="transition-colors hover:text-gray-900">
            Track Order
          </Link>
          <Link href="/build-guides" className="transition-colors hover:text-gray-900">
            Build Guides
          </Link>
        </div>
      </div>
    </footer>
  );
}
