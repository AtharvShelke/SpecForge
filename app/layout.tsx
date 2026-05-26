import type { Metadata } from "next";
import "./globals.css";
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
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://mdcomputers.example.com",
    title: "Computer Store - Best PC Components",
    description:
      "Shop for the best PC components, processors, motherboards, graphics cards, RAM, and more at the best prices with Computer Store.",
    siteName: "Computer Store",
  },
  twitter: {
    card: "summary_large_image",
    title: "Computer Store",
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
      <body className="app-shell antialiased">
        <ShopProvider autoLoad={false}>
          <OrderProvider autoLoad={false}>
            <BuildProvider autoLoad={false}>
              <main className="min-h-screen">{children}</main>
              <CartDrawer />
              <Toaster />
            </BuildProvider>
          </OrderProvider>
        </ShopProvider>
      </body>
    </html>
  );
}
