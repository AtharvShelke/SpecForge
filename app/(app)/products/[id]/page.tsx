import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ProductDetailClient from "./ProductDetailClient";
import { normalizeCatalogProduct } from "@/lib/catalogFrontend";

export const dynamic = "force-dynamic";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

async function getProduct(identifier: string) {
  const res = await fetch(`${baseUrl}/api/storefront/products/${identifier}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: "Product not found",
    };
  }

  const imageUrl = product.media[0]?.url ?? "";
  const title = product.metaTitle || `${product.name} | MD Computers`;
  const description =
    product.metaDescription || product.description || `Buy ${product.name} from MD Computers.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const normalizedProduct = normalizeCatalogProduct(product as any);

  return <ProductDetailClient product={normalizedProduct} />;
}
