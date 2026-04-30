import type { Metadata } from "next";
import "./globals.css";

import CartDrawer from "@/components/CartDrawer";
import { PerformanceVitalsReporter } from "@/components/PerformanceVitalsReporter";
import { Toaster } from "@/components/ui/toaster";
import { BuildProvider } from "@/context/BuildContext";
import { OrderProvider } from "@/context/OrderContext";
import { ShopProvider } from "@/context/ShopContext";

export const metadata: Metadata = {
  title: {
    template: "%s | MD Computers",
    default: "MD Computers - Best PC Components & Custom Builds",
  },
  description:
    "Shop for the best PC components, processors, motherboards, graphics cards, RAM, and more at the best prices with MD Computers.",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://mdcomputers.example.com",
    title: "MD Computers - Best PC Components",
    description:
      "Shop for the best PC components, processors, motherboards, graphics cards, RAM, and more at the best prices with MD Computers.",
    siteName: "MD Computers",
  },
  twitter: {
    card: "summary_large_image",
    title: "MD Computers",
    description: "Shop for the best PC components at the best prices.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="app-shell antialiased">
        <ShopProvider>
          <OrderProvider>
            <BuildProvider>
              <PerformanceVitalsReporter />
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
