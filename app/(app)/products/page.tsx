import { Suspense } from 'react';
import { Metadata } from 'next';
import ProductsClient from './ProductsClient';

// ── Types ─────────────────────────────────────────────────────────────────────

type SearchParams = { [key: string]: string | string[] | undefined };

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata(
    { searchParams }: { searchParams: Promise<SearchParams> }
): Promise<Metadata> {
    const params = await searchParams;
    const category = Array.isArray(params.category) ? params.category[0] : params.category;
    const q        = Array.isArray(params.q)        ? params.q[0]        : params.q;

    const title = category
        ? `${category} | MD Computers`
        : q
            ? `Search Results for "${q}" | MD Computers`
            : 'PC Components & Accessories - MD Computers';

    const description = category
        ? `Browse our extensive collection of ${category}. Find the best prices and top brands.`
        : q
            ? `Find the best PC components matching "${q}".`
            : 'Shop the best PC components, processors, motherboards, graphics cards, RAM, and more at the best prices.';

    return {
        title,
        description,
        openGraph: { title, description, type: 'website' },
    };
}

// ── Page ──────────────────────────────────────────────────────────────────────

// Static fallback — rendered on both server and client for the Suspense boundary.
// Kept as a plain div (no extra components) for minimum TTFB.
function PageFallback() {
    return (
        <div className="h-screen flex items-center justify-center bg-stone-50">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-800 rounded-full animate-spin" />
                <p className="text-sm text-zinc-400 font-medium">Loading catalog…</p>
            </div>
        </div>
    );
}

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const params = await searchParams;

    // Build URLSearchParams in one pass — avoid forEach on entries + redundant has() checks
    const urlParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value === undefined) continue;
        if (Array.isArray(value)) {
            for (const v of value) urlParams.append(key, v);
        } else {
            urlParams.set(key, value);
        }
    }

    // Apply defaults only when missing
    if (!urlParams.has('limit'))  urlParams.set('limit',  '12');
    if (!urlParams.has('page'))   urlParams.set('page',   '1');
    if (!urlParams.has('sort'))   urlParams.set('sort',   'price-asc');
    urlParams.set('getFilters', 'true');

    return (
        <Suspense fallback={<PageFallback />}>
            <ProductsClient />
        </Suspense>
    );
}
