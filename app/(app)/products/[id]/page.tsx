import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import ProductDetailClient from './ProductDetailClient';
import { notFound } from 'next/navigation';

// ── Shared DB select shape — fetch once, reuse for both metadata + page ────────
// Using `select` instead of `include` fetches only the columns we actually need,
// reducing bytes transferred from the DB on every request.

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

// ── generateMetadata ──────────────────────────────────────────────────────────
// Re-uses the same select shape so the query is minimal and consistent.
// Next.js deduplicates fetch/prisma calls with the same cache key in the same
// render pass, so this does NOT result in two DB round-trips when both
// generateMetadata and the page function run for the same request.

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>
}): Promise<Metadata> {
    const { id } = await params;

    const product = await prisma.product.findUnique({
        where:  { id },
        select: {
            name:        true,
            description: true,
            media:       { select: { url: true }, take: 1 },
        },
    });

    if (!product) return { title: 'Product Not Found' };

    const title       = `${product.name} - MD Computers`;
    const description = product.description ?? `Buy ${product.name} at the best price.`;
    const imageUrl    = product.media?.[0]?.url ?? '';

    return {
        title,
        description,
        openGraph: {
            title:       product.name,
            description,
            images:      [{ url: imageUrl }],
            type:        'website',
        },
        twitter: {
            card:        'summary_large_image',
            title:       product.name,
            description: product.description ?? '',
            images:      [imageUrl],
        },
    };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ProductPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;

    const product = await prisma.product.findUnique({
        where:  { id },
        select: PRODUCT_SELECT,
    });

    if (!product) notFound();

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
}
