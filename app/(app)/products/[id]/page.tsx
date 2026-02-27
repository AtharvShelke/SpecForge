'use client';

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
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
import { CompatibilityLevel, specsToFlat, Review } from '@/types';
import { validateBuild } from '@/services/compatibility';

const CATEGORY_HIGHLIGHTS: Record<string, string[]> = {
    PROCESSOR: [
        'cores',
        'socket',
        'wattage',
        'ramType',
        'series',
        'generation',
    ],

    GPU: [
        'memory',
        'wattage',
        'series',
    ],

    RAM: [
        'capacity',
        'frequency',
        'ramType',
    ],

    MOTHERBOARD: [
        'chipset',
        'socket',
        'formFactor',
        'ramType',
    ],

    COOLER: [
        'type',
        'size',
    ],

    STORAGE: [
        'type',
        'interface',
        'capacity',
    ],

    CABINET: [
        'formFactor',
        'color',
    ],

    PSU: [
        'wattage',
        'efficiency',
    ],

    MONITOR: [
        'size',
        'resolution',
        'type',
    ],

    PERIPHERAL: [
        'type',
        'connectivity',
    ],
};


const formatKey = (key: string) =>
    key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());

const ProductDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    const {
        products,
        cart,
        addToCart,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        getProductReviews,
        getProductRating,
        addReview,
        refreshReviews,
    } = useShop();

    React.useEffect(() => {
        refreshReviews();
    }, [refreshReviews]);

    const product = products.find((p) => p.id === id);
    const flatSpecs = useMemo(() => product ? specsToFlat(product.specs) : {}, [product]);

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
                <Link href="/catalog" className="text-blue-600 underline">
                    Go back
                </Link>
            </div>
        );
    }

    /* Compatibility */
    const hypotheticalCart = [...cart, { ...product, quantity: 1 }];
    const report = validateBuild(hypotheticalCart);
    const inCart = cart.find((c: any) => c.id === product.id);
    const inWishlist = isInWishlist(product.id);

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
        <div className="min-h-screen bg-zinc-50 pb-20 pt-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link
                    href="/catalog"
                    className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 mb-6"
                >
                    <ArrowLeft size={16} className="mr-1" /> Back to catalog
                </Link>

                {/* TOP SECTION */}
                <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden mb-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                        {/* IMAGE */}
                        <div className="p-8 bg-zinc-100 flex items-center justify-center">
                            <img
                                src={product.image}
                                alt={product.name}
                                className="max-h-96 object-contain"
                            />
                        </div>

                        {/* BUY BOX */}
                        <div className="p-8 flex flex-col gap-6">
                            <div>
                                <span className="text-xs uppercase font-semibold text-blue-600">
                                    {product.category}
                                </span>
                                <h1 className="text-3xl font-bold text-zinc-900 mt-2">
                                    {product.name}
                                </h1>

                                <div className="text-sm text-zinc-500 mt-2 space-y-1">
                                    <div>
                                        <strong>Brand:</strong> {flatSpecs.brand ?? 'N/A'}
                                    </div>
                                    <div>
                                        <strong>SKU:</strong> {product.sku}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mt-4">
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
                                ₹{product.price.toLocaleString('en-IN')}
                            </div>

                            <div
                                className={`text-sm font-medium ${product.stock > 0 ? 'text-emerald-600' : 'text-red-600'
                                    }`}
                            >
                                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => addToCart(product)}
                                    disabled={report.status === CompatibilityLevel.INCOMPATIBLE}
                                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-blue-700 transition"
                                >
                                    <ShoppingCart size={20} />
                                    {inCart ? 'In Cart' : 'Add to Build'}
                                </button>

                                <button
                                    onClick={() =>
                                        inWishlist
                                            ? removeFromWishlist(product.id)
                                            : addToWishlist(product.id)
                                    }
                                    className={`p-4 rounded-xl border ${inWishlist
                                        ? 'border-red-200 bg-red-50 text-red-500'
                                        : 'border-zinc-200 text-zinc-400'
                                        }`}
                                >
                                    <Heart
                                        size={22}
                                        className={inWishlist ? 'fill-current' : ''}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ABOUT */}
                <section className="mb-10">
                    <h2 className="text-xl font-bold mb-3">About this item</h2>
                    <p className="text-zinc-700 leading-relaxed">
                        {product.description}
                    </p>
                </section>

                {/* KEY FEATURES */}
                {highlights.length > 0 && (
                    <section className="mb-10">
                        <h2 className="text-xl font-bold mb-4">Key Features</h2>
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
                <section className="mb-12">
                    <h2 className="text-xl font-bold mb-4">Technical Details</h2>
                    <div className="border border-zinc-200 rounded-xl overflow-hidden">
                        {Object.entries(flatSpecs).map(([key, value], i) => (
                            <div
                                key={key}
                                className={`grid grid-cols-3 px-4 py-3 text-sm ${i % 2 === 0 ? 'bg-zinc-50' : 'bg-white'
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
                <section className="mb-12">
                    <div
                        className={`p-5 rounded-xl flex gap-3 ${report.status === CompatibilityLevel.INCOMPATIBLE
                            ? 'bg-red-50 text-red-700'
                            : report.status === CompatibilityLevel.WARNING
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                    >
                        {report.status === CompatibilityLevel.INCOMPATIBLE ? (
                            <XCircle />
                        ) : report.status === CompatibilityLevel.WARNING ? (
                            <AlertTriangle />
                        ) : (
                            <CheckCircle />
                        )}
                        <div>
                            <h4 className="font-semibold">Compatibility Status</h4>
                            <p className="text-sm mt-1">
                                {'This component fits your current build.'}
                            </p>
                        </div>
                    </div>
                </section>

                {/* REVIEWS */}
                <section className="bg-white border border-zinc-200 rounded-2xl p-8">
                    <div className="flex justify-between mb-6">
                        <h2 className="text-xl font-bold">Customer Reviews</h2>
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

export default ProductDetail;

