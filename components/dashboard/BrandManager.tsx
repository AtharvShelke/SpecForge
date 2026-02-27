'use client';

import React, { useState } from 'react';
import { useShop } from '@/context/ShopContext';
import { useAdmin } from '@/context/AdminContext';
import { Category } from '@/types';
import { Trash, Plus, Tag, AlertCircle } from 'lucide-react';

const BrandManager = () => {
    const { brands } = useShop();
    const { addBrand, deleteBrand } = useAdmin();

    const [newBrandName, setNewBrandName] = useState('');
    const [selectedCats, setSelectedCats] = useState<Category[]>([]);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBrandName.trim()) return;

        if (selectedCats.length === 0) {
            alert('Please select at least one category');
            return;
        }

        addBrand({
            id: `brand-${Date.now()}`,
            name: newBrandName.trim(),
            categories: selectedCats
        });

        setNewBrandName('');
        setSelectedCats([]);
    };

    const toggleCat = (cat: Category) => {
        if (selectedCats.includes(cat)) {
            setSelectedCats(selectedCats.filter(c => c !== cat));
        } else {
            setSelectedCats([...selectedCats, cat]);
        }
    };

    const handleDelete = (brandId: string, brandName: string) => {
        if (window.confirm(`Delete brand "${brandName}"? This action cannot be undone.`)) {
            deleteBrand(brandId);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Brand Management</h2>
                <p className="text-sm text-gray-500 mt-1">
                    {brands.length} brand{brands.length !== 1 ? 's' : ''} configured
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Add Brand Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden sticky top-6">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                                <Plus size={18} className="text-gray-600" />
                                <h3 className="font-semibold text-gray-900">Add New Brand</h3>
                            </div>
                        </div>

                        <form onSubmit={handleAdd} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Brand Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., ASUS, AMD, Intel"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={newBrandName}
                                    onChange={e => setNewBrandName(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Linked Categories <span className="text-red-500">*</span>
                                </label>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto">
                                    {Object.values(Category).length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-4">
                                            No categories available
                                        </p>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {Object.values(Category).map(cat => (
                                                <label
                                                    key={cat}
                                                    className="flex items-center gap-2 p-2 rounded-md hover:bg-white transition-colors cursor-pointer group"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCats.includes(cat)}
                                                        onChange={() => toggleCat(cat)}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                                                        {cat}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {selectedCats.length > 0 && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        {selectedCats.length} {selectedCats.length === 1 ? 'category' : 'categories'} selected
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                            >
                                <Plus size={16} />
                                Add Brand
                            </button>
                        </form>
                    </div>
                </div>

                {/* Brands List */}
                <div className="lg:col-span-2">
                    {brands.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12">
                            <div className="text-center">
                                <Tag size={48} className="mx-auto text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No Brands Yet
                                </h3>
                                <p className="text-gray-500 text-sm max-w-sm mx-auto">
                                    Add your first brand using the form on the left. Brands help organize products by manufacturer.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {brands.map(brand => (
                                <div
                                    key={brand.id}
                                    className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow group"
                                >
                                    <div className="flex justify-between items-start gap-3 mb-3">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-gray-900 text-base truncate">
                                                {brand.name}
                                            </h4>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {brand.categories.length} {brand.categories.length === 1 ? 'category' : 'categories'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(brand.id, brand.name)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            title="Delete brand"
                                        >
                                            <Trash size={16} />
                                        </button>
                                    </div>

                                    {brand.categories.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {brand.categories.map(cat => (
                                                <span
                                                    key={cat}
                                                    className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium"
                                                >
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2 py-1.5 rounded">
                                            <AlertCircle size={12} />
                                            No categories linked
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BrandManager;