'use client';

import React, { useMemo } from 'react';
import { useShop } from '@/context/ShopContext';
import { specsToFlat, Product, Category } from '@/types';
import Link from 'next/link';
import { ArrowLeft, XCircle, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ComparePage() {
    const { compareItems, removeFromCompare, addToCart, cart } = useShop();
    const router = useRouter();

    const allSpecKeys = useMemo(() => {
        const keys = new Set<string>();
        compareItems.forEach(item => {
            const flat = specsToFlat(item.specs);
            Object.keys(flat).forEach(k => keys.add(k));
        });
        return Array.from(keys);
    }, [compareItems]);

    if (compareItems.length === 0) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
                <div className="text-center bg-white border border-zinc-200 rounded-2xl p-10 shadow-sm max-w-sm w-full">
                    <XCircle size={48} className="text-zinc-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-zinc-900 mb-2">Nothing to compare</h2>
                    <p className="text-zinc-500 text-sm mb-6">You haven't added any items to compare yet.</p>
                    <Link
                        href="/products"
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
                    >
                        Browse Products
                    </Link>
                </div>
            </div>
        );
    }

    // Since validation prevents different categories, we can assume all items are of the same category
    const categoryLabel = compareItems[0].category;

    return (
        <div className="min-h-screen bg-zinc-50 pt-8 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition mb-3"
                        >
                            <ArrowLeft size={16} /> Back
                        </button>
                        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">
                            Comparing {categoryLabel}
                        </h1>
                        <p className="text-zinc-500 text-sm mt-1">
                            {compareItems.length} {compareItems.length === 1 ? 'item' : 'items'} selected
                        </p>
                    </div>
                </div>

                {/* Compare Table */}
                <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr>
                                <th className="p-6 min-w-[200px] border-b border-zinc-200 bg-zinc-50 font-semibold text-zinc-500 align-top">
                                    Product Highlights
                                </th>
                                {compareItems.map(item => (
                                    <th key={item.id} className="p-6 min-w-[250px] w-64 border-b border-l border-zinc-200 align-top relative">
                                        <button
                                            onClick={() => removeFromCompare(item.id)}
                                            className="absolute top-4 right-4 text-zinc-400 hover:text-red-500 transition-colors"
                                            title="Remove from compare"
                                        >
                                            <XCircle size={20} />
                                        </button>
                                        <div className="w-24 h-24 mx-auto mb-4 bg-zinc-50 rounded-xl p-2 border border-zinc-100 flex items-center justify-center">
                                            <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                                        </div>
                                        <h3 className="font-bold text-zinc-900 text-sm line-clamp-2 leading-tight mb-2 min-h-[40px]">
                                            {item.name}
                                        </h3>
                                        <div className="text-lg font-bold text-blue-600 mb-3">
                                            ₹{item.price.toLocaleString('en-IN')}
                                        </div>
                                        <button
                                            onClick={() => addToCart(item)}
                                            disabled={item.stock <= 0}
                                            className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-colors ${item.stock <= 0 ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                        >
                                            <ShoppingCart size={16} />
                                            {item.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                                        </button>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                            {allSpecKeys.map(key => (
                                <tr key={key} className="hover:bg-zinc-50/50 transition-colors">
                                    <td className="p-4 sm:px-6 text-sm font-semibold text-zinc-700 bg-zinc-50 capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </td>
                                    {compareItems.map(item => {
                                        const flat = specsToFlat(item.specs);
                                        const val = flat[key];
                                        return (
                                            <td key={`${item.id}-${key}`} className="p-4 sm:px-6 text-sm text-zinc-600 border-l border-zinc-200">
                                                {val ? String(val) : <span className="text-zinc-300">—</span>}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {compareItems.length < 2 && (
                    <div className="mt-8 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl p-4 text-sm text-center flex flex-col items-center">
                        <p>Add at least one more item to see a useful side-by-side comparison.</p>
                        <Link href="/products" className="mt-2 font-semibold underline hover:text-blue-800">
                            Find more products
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
