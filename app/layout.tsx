import type { Metadata } from "next";
import "./globals.css";
<<<<<<< HEAD
import CartDrawer from "@/components/CartDrawer";
import { Toaster } from "@/components/ui/toaster";
import { BuildProvider } from "@/context/BuildContext";
import { OrderProvider } from "@/context/OrderContext";
import { ShopProvider } from "@/context/ShopContext";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    template: "%s | Computer Store",
    default: "Computer Store - Best PC Components & Custom Builds",
  },
  description:
    "Shop for the best PC components, processors, motherboards, graphics cards, RAM, and more at the best prices with Computer Store.",
=======
import { ShopProvider } from "@/context/ShopContext";
import Navbar from "@/components/Navbar";

import { Toaster } from "@/components/ui/toaster";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";

import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";

export const metadata: Metadata = {
  title: {
    template: "%s | SpecForge",
    default: "SpecForge - Best PC Components & Custom Builds",
  },
  description: "Shop for the best PC components, processors, motherboards, graphics cards, RAM, and more at the best prices with SpecForge.",
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://mdcomputers.example.com",
<<<<<<< HEAD
    title: "Computer Store - Best PC Components",
    description:
      "Shop for the best PC components, processors, motherboards, graphics cards, RAM, and more at the best prices with Computer Store.",
    siteName: "Computer Store",
  },
  twitter: {
    card: "summary_large_image",
    title: "Computer Store",
=======
    title: "SpecForge - Best PC Components",
    description: "Shop for the best PC components, processors, motherboards, graphics cards, RAM, and more at the best prices with SpecForge.",
    siteName: "SpecForge"
  },
  twitter: {
    card: "summary_large_image",
    title: "SpecForge",
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
    description: "Shop for the best PC components at the best prices.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
<<<<<<< HEAD
      <body className="app-shell antialiased">
        <ShopProvider autoLoad={false}>
          <OrderProvider autoLoad={false}>
            <BuildProvider autoLoad={false}>
              <main className="min-h-screen">{children}</main>
              <CartDrawer />
              <Toaster />
            </BuildProvider>
          </OrderProvider>
=======
      <body className="antialiased">
         <NextSSRPlugin
          /**
           * The `extractRouterConfig` will extract **only** the route configs
           * from the router to prevent additional information from being
           * leaked to the client. The data passed to the client is the same
           * as if you were to fetch `/api/uploadthing` directly.
           */
          routerConfig={extractRouterConfig(ourFileRouter)}
        />
        <ShopProvider>
          <main className="min-h-screen pb-16 md:pb-0">
            {children}
          </main>
          <CartDrawer />

          <Toaster />
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
        </ShopProvider>
      </body>
    </html>
  );
}
