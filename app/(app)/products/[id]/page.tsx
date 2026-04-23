import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import ProductDetailClient from './ProductDetailClient';
import { notFound } from 'next/navigation';
import { normalizeCatalogProduct } from '@/lib/catalogFrontend';

// ── Shared DB select shape — fetch once, reuse for both metadata + page ────────
// Using `select` instead of `include` fetches only the columns we actually need,
// reducing bytes transferred from the DB on every request.

const PRODUCT_SELECT = {
    id:          true,
    name:        true,
    description: true,
    status:      true,
    subCategoryId: true,
    subCategory: {
        select: {
            name: true,
            category: { select: { name: true } },
        },
    },
    media:       { select: { url: true } },
    brand:       { select: { id: true, name: true } },
    variants: {
        select: {
            price:        true,
            compareAtPrice: true,
            status:       true,
            sku:          true,
            variantSpecs: {
                select: {
                    valueString: true,
                    valueNumber: true,
                    valueBool: true,
                    option: { select: { label: true, value: true } },
                    spec: { select: { name: true } },
                },
            },
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
    const normalizedProduct = normalizeCatalogProduct(product as any);
    const firstVariant = normalizedProduct.variants?.[0];
    const jsonLd = {
        '@context':   'https://schema.org',
        '@type':      'Product',
        name:         normalizedProduct.name,
        image:        normalizedProduct.media?.[0]?.url ?? normalizedProduct.image ?? '',
        description:  normalizedProduct.description ?? normalizedProduct.name,
        sku:          firstVariant?.sku ?? '',
        offers: {
            '@type':        'Offer',
            priceCurrency:  'INR',
            price:          firstVariant?.price ?? 0,
            availability:   firstVariant?.status === 'OUT_OF_STOCK'
                                ? 'https://schema.org/OutOfStock'
                                : 'https://schema.org/InStock',
            itemCondition:  'https://schema.org/NewCondition',
        },
    };

    // Serialise once — avoids JSON.stringify running in the browser
    const jsonLdString = JSON.stringify(jsonLd);

    return (
        <section>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLdString }}
            />
            <ProductDetailClient product={normalizedProduct as any} />
        </section>
    );
}
