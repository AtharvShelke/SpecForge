import type { Metadata } from "next";
import "./globals.css";
import { ShopProvider } from "@/context/ShopContext";
import { BuildProvider } from "@/context/BuildContext";
import { OrderProvider } from "@/context/OrderContext";
import Navbar from "@/components/Navbar";

import { Toaster } from "@/components/ui/toaster";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";

import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";

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
          <OrderProvider>
            <BuildProvider>

              <main className="min-h-screen pb-16 md:pb-0">
                {children}
              </main>
              <CartDrawer />

              <Toaster />
            </BuildProvider>
          </OrderProvider>
        </ShopProvider>
      </body>
    </html>
  );
}
