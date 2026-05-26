import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ProductDetailClient from "./ProductDetailClient";
import { normalizeCatalogProduct } from "@/lib/catalogFrontend";

<<<<<<< HEAD
export const dynamic = "force-dynamic";
=======
const PRODUCT_SELECT = {
    id:             true,
    name:           true,
    description:    true,
    category:       true,
    status:         true,
    stockStatus:    true,
    sku:            true,
    price:          true,
    compareAtPrice: true,
    media:          { select: { url: true } },
    brand:          { select: { id: true, name: true } },
    specs:          {
        select: {
            id: true,
            productId: true,
            attributeId: true,
            optionId: true,
            value: true,
            valueNumber: true,
            valueBoolean: true,
            isHighlighted: true,
            attribute: { select: { key: true } },
        },
    },
} as const;
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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
  const title = product.metaTitle || `${product.name} | Computer Store`;
  const description =
    product.metaDescription || product.description || `Buy ${product.name} from Computer Store.`;

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

<<<<<<< HEAD
  return <ProductDetailClient product={normalizedProduct} />;
=======
    // ── JSON-LD (built once server-side, never re-computed on client) ──────────
    const jsonLd = {
        '@context':   'https://schema.org',
        '@type':      'Product',
        name:         product.name,
        image:        product.media?.[0]?.url ?? '',
        description:  product.description ?? product.name,
        sku:          product.sku ?? '',
        offers: {
            '@type':        'Offer',
            priceCurrency:  'INR',
            price:          product.price ?? 0,
            availability:   product.stockStatus === 'OUT_OF_STOCK'
                                ? 'https://schema.org/OutOfStock'
                                : 'https://schema.org/InStock',
            itemCondition:  'https://schema.org/NewCondition',
        },
    };

    // Serialise once — avoids JSON.stringify running in the browser
    const jsonLdString = JSON.stringify(jsonLd);
    const detailProduct = {
        ...product,
        specs: product.specs.map((spec) => ({
            id: spec.id,
            productId: spec.productId,
            attributeId: spec.attributeId,
            optionId: spec.optionId,
            key: spec.attribute?.key ?? '',
            value: spec.value,
            valueNumber: spec.valueNumber,
            valueBoolean: spec.valueBoolean,
            isHighlighted: spec.isHighlighted,
        })),
    };

    return (
        <section>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLdString }}
            />
            <ProductDetailClient product={detailProduct} />
        </section>
    );
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
}
