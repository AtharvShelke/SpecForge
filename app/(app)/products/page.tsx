import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { getProductsData } from '@/app/api/products/route';
import ProductsClient from './ProductsClient';

type SearchParams = { [key: string]: string | string[] | undefined };

export async function generateMetadata(
    { searchParams }: { searchParams: Promise<SearchParams> }
): Promise<Metadata> {
    const params = await searchParams;
    const category = Array.isArray(params.category) ? params.category[0] : params.category;
    const q = Array.isArray(params.q) ? params.q[0] : params.q;

    let title = 'PC Components & Accessories - MD Computers';
    let description = 'Shop the best PC components, processors, motherboards, graphics cards, RAM, and more at the best prices.';

    if (category) {
        title = `Buy ${category} | MD Computers`;
        description = `Browse our extensive collection of ${category}. Find the best prices and top brands.`;
    } else if (q) {
        title = `Search Results for "${q}" | MD Computers`;
        description = `Find the best PC components matching "${q}".`;
    }

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'website',
        },
    };
}

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const params = await searchParams;
    const urlParams = new URLSearchParams();

    // Reconstruct URLSearchParams
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined) return;
        if (Array.isArray(value)) {
            value.forEach((v) => urlParams.append(key, v));
        } else {
            urlParams.set(key, value as string);
        }
    });

    // Fetch Initial Data directly using our unified server helper
    let initialData = null;
    try {
        const res = await getProductsData(urlParams);
        initialData = await res.json();
    } catch (e) {
        console.error("Failed to fetch initial product data:", e);
    }

    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
            <ProductsClient initialData={initialData} />
        </Suspense>
    );
}
