import type { Metadata } from "next";

import Footer from "@/components/Footer";
import Header from "@/components/storefront/Header";

export const metadata: Metadata = {
  title: {
    default: "Premium PC Components & Custom Builds | MD Systems",
    template: "%s | MD Systems",
  },
  description:
    "Shop the latest GPUs, CPUs, motherboards, RAM, and SSDs from top brands. Build your dream PC with our compatibility-checked custom builder or choose from expert-curated prebuilt systems.",
  keywords: [
    "PC components",
    "graphics cards",
    "processors",
    "custom PC build",
    "gaming PC",
    "RTX GPU",
    "DDR5 RAM",
    "NVMe SSD",
    "PC builder",
    "prebuilt gaming PC",
  ],
  openGraph: {
    title: "Premium PC Components & Custom Builds",
    description:
      "Hand-picked gaming hardware with real-time compatibility checks. From budget builds to enthusiast powerhouses.",
    type: "website",
    locale: "en_IN",
    siteName: "MD Systems",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
