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

    // Reconstruct URLSearchParams with defaults matching client-side fetch
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined) return;
        if (Array.isArray(value)) {
            value.forEach((v) => urlParams.append(key, v));
        } else {
            urlParams.set(key, value as string);
        }
    });

    // Ensure defaults match what ProductsClient will request
    if (!urlParams.has('limit')) urlParams.set('limit', '12');
    if (!urlParams.has('page')) urlParams.set('page', '1');
    if (!urlParams.has('sort')) urlParams.set('sort', 'price-asc');
    urlParams.set('getFilters', 'true');

    // Only fetch server-side if we have a category (otherwise client will fetch after categories load)
    let initialData = null;
    if (urlParams.has('category')) {
        try {
            const res = await getProductsData(urlParams);
            initialData = await res.json();
        } catch (e) {
            console.error("Failed to fetch initial product data:", e);
        }
    }

    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
            <ProductsClient initialData={initialData} />
        </Suspense>
    );
}
