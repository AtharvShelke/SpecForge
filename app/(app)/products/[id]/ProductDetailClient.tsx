'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useShop } from '@/context/ShopContext';
import {
    Star,
    ShoppingCart,
    Heart,
    CheckCircle,
    AlertTriangle,
    XCircle,
    ArrowLeft,
} from 'lucide-react';
import { CompatibilityLevel, specsToFlat, Review, Product } from '@/types';
import { validateBuild } from '@/services/compatibility';

const CATEGORY_HIGHLIGHTS: Record<string, string[]> = {
    PROCESSOR: ['cores', 'socket', 'wattage', 'ramType', 'series', 'generation'],
    GPU: ['memory', 'wattage', 'series'],
    RAM: ['capacity', 'frequency', 'ramType'],
    MOTHERBOARD: ['chipset', 'socket', 'formFactor', 'ramType'],
    COOLER: ['type', 'size'],
    STORAGE: ['type', 'interface', 'capacity'],
    CABINET: ['formFactor', 'color'],
    PSU: ['wattage', 'efficiency'],
    MONITOR: ['size', 'resolution', 'type'],
    PERIPHERAL: ['type', 'connectivity'],
};

const formatKey = (key: string) =>
    key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());

interface ProductDetailClientProps {
    product: Product & { brand?: any, specs: any };
}

const ProductDetailClient: React.FC<ProductDetailClientProps> = ({ product }) => {
    const {
        cart,
        addToCart,
        getProductReviews,
        getProductRating,
        addReview,
        refreshReviews,
    } = useShop();

    React.useEffect(() => {
        refreshReviews();
    }, [refreshReviews]);

    const flatSpecs = useMemo(() => product ? specsToFlat(product.specs) : {}, [product]);

    const [selectedImage, setSelectedImage] = useState(0);
    const media = useMemo(() => {
        const list = product.media?.length ? product.media.map(m => m.url) : [product.image || '/placeholder.png'];
        return list;
    }, [product]);

    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewForm, setReviewForm] = useState({
        name: '',
        rating: 5,
        comment: '',
    });

    if (!product) {
        return (
            <div className="p-10 text-center">
                Product not found.{' '}
                <Link href="/products" className="text-blue-600 underline">
                    Go back
                </Link>
            </div>
        );
    }

    /* Compatibility */
    const hypotheticalCart = [...cart, { ...product, quantity: 1 } as any];
    const report = validateBuild(hypotheticalCart);
    const inCart = cart.find((c: any) => c.id === product.id);

    const { average, count } = getProductRating(product.id);
    const reviews = getProductReviews(product.id);

    const highlights = CATEGORY_HIGHLIGHTS[product.category] || [];

    const handleReviewSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addReview({
            productId: product.id,
            customerName: reviewForm.name,
            rating: reviewForm.rating,
            comment: reviewForm.comment,
        });
        setReviewForm({ name: '', rating: 5, comment: '' });
        setShowReviewForm(false);
    };

    return (
        <div className="min-h-screen bg-zinc-50 pb-12 pt-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link
                    href="/products"
                    className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 mb-4"
                >
                    <ArrowLeft size={16} className="mr-1" /> Back to catalog
                </Link>

                {/* TOP SECTION */}
                <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden mb-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                        {/* GALLERY */}
                        <div className="p-6 bg-zinc-100 flex flex-col gap-4">
                            <div className="relative aspect-square w-full max-w-[500px] mx-auto bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden group">
                                <Image
                                    src={media[selectedImage] || '/placeholder.png'}
                                    alt={product.name}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    priority
                                    className="object-contain p-8 transition-transform duration-500 group-hover:scale-110"
                                />
                            </div>

                            {media.length > 1 && (
                                <div className="flex gap-3 justify-center overflow-x-auto py-2 px-1 no-scrollbar">
                                    {media.map((url, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedImage(idx)}
                                            className={`relative w-20 h-20 bg-white rounded-lg border-2 p-1 overflow-hidden transition-all hover:shadow-md ${selectedImage === idx ? 'border-blue-600 shadow-blue-100' : 'border-zinc-200 opacity-60 hover:opacity-100'
                                                }`}
                                        >
                                            <div className="w-full h-full relative">
                                                <Image
                                                    src={url}
                                                    alt={`View ${idx + 1}`}
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* BUY BOX */}
                        <div className="p-6 flex flex-col gap-4">
                            <div>
                                <span className="text-xs uppercase font-semibold text-blue-600">
                                    {product.category}
                                </span>
                                <h1 className="text-2xl font-bold text-zinc-900 mt-1">
                                    {product.name}
                                </h1>

                                <div className="text-sm text-zinc-500 mt-2 space-y-1">
                                    <div>
                                        <strong>Brand:</strong> {flatSpecs.brand ?? 'N/A'}
                                    </div>
                                    <div>
                                        <strong>SKU:</strong> {product.variants?.[0]?.sku}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mt-3">
                                    <div className="flex text-amber-400">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <Star
                                                key={i}
                                                size={18}
                                                className={
                                                    i <= Math.round(average)
                                                        ? 'fill-current'
                                                        : 'text-zinc-300'
                                                }
                                            />
                                        ))}
                                    </div>
                                    <span className="text-sm text-zinc-500">
                                        {average.toFixed(1)} ({count} reviews)
                                    </span>
                                </div>
                            </div>

                            <div className="text-3xl font-bold text-zinc-900">
                                ₹{(product.variants?.[0]?.price || 0).toLocaleString('en-IN')}
                            </div>

                            <div
                                className={`text-sm font-bold uppercase tracking-wider ${product.variants?.[0]?.status === 'IN_STOCK' ? 'text-emerald-600' :
                                    product.variants?.[0]?.status === 'LOW_STOCK' ? 'text-amber-600' :
                                        product.variants?.[0]?.status === 'OUT_OF_STOCK' ? 'text-red-600' :
                                            'text-blue-600'
                                    }`}
                            >
                                {product.variants?.[0]?.status?.replace(/_/g, ' ') || 'OUT OF STOCK'}
                            </div>

                            <div className="flex gap-4 mt-2">
                                <button
                                    onClick={() => addToCart(product as any)}
                                    disabled={report.status === CompatibilityLevel.INCOMPATIBLE}
                                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
                                >
                                    <ShoppingCart size={20} />
                                    {inCart ? 'In Cart' : 'Add to Build'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ABOUT */}
                <section className="mb-8">
                    <h2 className="text-lg font-bold mb-2">About this item</h2>
                    <p className="text-zinc-700 leading-relaxed">
                        {product.description || 'No description available for this product.'}
                    </p>
                </section>

                {/* KEY FEATURES */}
                {highlights.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-lg font-bold mb-3">Key Features</h2>
                        <ul className="list-disc pl-6 space-y-2 text-zinc-700">
                            {highlights.map(key =>
                                flatSpecs[key] ? (
                                    <li key={key}>
                                        <strong>{formatKey(key)}:</strong> {flatSpecs[key]}
                                    </li>
                                ) : null
                            )}
                        </ul>
                    </section>
                )}

                {/* TECHNICAL DETAILS */}
                <section className="mb-8">
                    <h2 className="text-lg font-bold mb-3">Technical Details</h2>
                    <div className="border border-zinc-200 rounded-xl overflow-hidden">
                        {Object.entries(flatSpecs).map(([key, value], i) => (
                            <div
                                key={key}
                                className={`grid grid-cols-3 px-4 py-2 text-sm ${i % 2 === 0 ? 'bg-zinc-50' : 'bg-white'
                                    }`}
                            >
                                <div className="font-medium text-zinc-600">
                                    {formatKey(key)}
                                </div>
                                <div className="col-span-2 text-zinc-900">{String(value)}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* COMPATIBILITY */}
                <section className="mb-8">
                    <div
                        className={`p-4 rounded-xl flex gap-3 ${report.status === CompatibilityLevel.INCOMPATIBLE
                            ? 'bg-red-50 text-red-700'
                            : report.status === CompatibilityLevel.WARNING
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                    >
                        {report.status === CompatibilityLevel.INCOMPATIBLE ? (
                            <XCircle className="shrink-0" />
                        ) : report.status === CompatibilityLevel.WARNING ? (
                            <AlertTriangle className="shrink-0" />
                        ) : (
                            <CheckCircle className="shrink-0" />
                        )}
                        <div>
                            <h4 className="font-semibold text-sm">Compatibility Status</h4>
                            <p className="text-xs mt-1">
                                {report.status === CompatibilityLevel.INCOMPATIBLE
                                    ? report.issues[0]?.message || 'Component is not compatible with your build.'
                                    : report.status === CompatibilityLevel.WARNING
                                        ? 'Component has some warnings. Double check specifications.'
                                        : 'This component fits your current build.'}
                            </p>
                        </div>
                    </div>
                </section>

                {/* REVIEWS */}
                <section className="bg-white border border-zinc-200 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold">Customer Reviews</h2>
                        <button
                            onClick={() => setShowReviewForm(!showReviewForm)}
                            className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm"
                        >
                            Write a review
                        </button>
                    </div>

                    {showReviewForm && (
                        <form
                            onSubmit={handleReviewSubmit}
                            className="mb-8 bg-zinc-50 p-6 rounded-xl"
                        >
                            <input
                                required
                                placeholder="Your name"
                                className="w-full mb-3 p-2 rounded border"
                                value={reviewForm.name}
                                onChange={e =>
                                    setReviewForm({ ...reviewForm, name: e.target.value })
                                }
                            />
                            <textarea
                                required
                                placeholder="Your review"
                                className="w-full mb-3 p-2 rounded border"
                                value={reviewForm.comment}
                                onChange={e =>
                                    setReviewForm({ ...reviewForm, comment: e.target.value })
                                }
                            />
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                                Submit
                            </button>
                        </form>
                    )}

                    {reviews.length === 0 ? (
                        <p className="text-zinc-500 italic">
                            No reviews yet. Be the first.
                        </p>
                    ) : (
                        reviews.map((r: Review) => (
                            <div key={r.id} className="border-t py-4">
                                <div className="font-semibold">{r.customerName}</div>
                                <div className="flex text-amber-400">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <Star
                                            key={i}
                                            size={14}
                                            className={
                                                i <= r.rating ? 'fill-current' : 'text-zinc-300'
                                            }
                                        />
                                    ))}
                                </div>
                                <p className="text-zinc-700 mt-2">{r.comment}</p>
                            </div>
                        ))
                    )}
                </section>
            </div>
        </div>
    );
};

export default ProductDetailClient;
