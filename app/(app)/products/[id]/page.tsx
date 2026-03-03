import React from 'react';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import ProductDetailClient from './ProductDetailClient';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const product = await prisma.product.findUnique({
        where: { id },
        include: { media: true }
    });

    if (!product) {
        return {
            title: 'Product Not Found',
        };
    }

    return {
        title: `${product.name} - MD Computers`,
        description: product.description || `Buy ${product.name} at the best price.`,
        openGraph: {
            title: product.name,
            description: product.description || `Buy ${product.name} at the best price.`,
            images: [{ url: product.media?.[0]?.url || '' }],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: product.name,
            description: product.description || '',
            images: [product.media?.[0]?.url || ''],
        }
    };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const product = await prisma.product.findUnique({
        where: { id },
        include: { brand: true, specs: true, variants: true, media: true }
    });

    if (!product) {
        notFound();
    }

    // JSON-LD for rich product snippets
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "image": product.media?.[0]?.url || '',
        "description": product.description || product.name,
        "sku": product.variants?.[0]?.sku || '',
        "offers": {
            "@type": "Offer",
            "priceCurrency": "INR",
            "price": product.variants?.[0]?.price || 0,
            "availability": product.variants?.[0]?.status === "OUT_OF_STOCK" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
            "itemCondition": "https://schema.org/NewCondition"
        }
    };

    return (
        <section>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ProductDetailClient product={product as any} />
        </section>
    );
}
