import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ShopProvider } from "@/context/ShopContext";
import { BuildProvider } from "@/context/BuildContext";
import Navbar from "@/components/Navbar";

import { Toaster } from "@/components/ui/toaster";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | MD Computers",
    default: "MD Computers - Best PC Components & Custom Builds",
  },
  description: "Shop for the best PC components, processors, motherboards, graphics cards, RAM, and more at the best prices with MD Computers.",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://mdcomputers.example.com",
    title: "MD Computers - Best PC Components",
    description: "Shop for the best PC components, processors, motherboards, graphics cards, RAM, and more at the best prices with MD Computers.",
    siteName: "MD Computers"
  },
  twitter: {
    card: "summary_large_image",
    title: "MD Computers",
    description: "Shop for the best PC components at the best prices.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ShopProvider>
          <BuildProvider>

            <main className="min-h-screen pb-16 md:pb-0">
              {children}
            </main>
            <CartDrawer />

            <Toaster />
          </BuildProvider>
        </ShopProvider>
      </body>
    </html>
  );
}
