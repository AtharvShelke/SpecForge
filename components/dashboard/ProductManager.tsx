'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useShop } from '@/context/ShopContext';
import { useAdmin } from '@/context/AdminContext';
import { Category, Product, ProductSpecsFlat, specsToFlat, flatToSpecs, ProductSpec } from '@/types';
import { Edit, Plus, Trash, AlertCircle, Package, DollarSign, Layers, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

const MAX_IMAGE_SIZE_MB = 2;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface ProductFormState extends Omit<Partial<Product>, 'specs'> {
    specs: ProductSpecsFlat;
    price?: number;
    stock?: number;
    sku?: string;
    image?: string;
}

const ProductManager = () => {
    const {
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        categories,
        brands,
        schemas,
    } = useAdmin();

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const [isEditing, setIsEditing] = useState(false);

    // Pagination & Filtering State
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [paginatedProducts, setPaginatedProducts] = useState<Product[]>([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);

    const currentPage = parseInt(searchParams.get("page") || "1", 10);
    const currentLimit = parseInt(searchParams.get("limit") || "10", 10);
    const currentCategory = searchParams.get("category") || "all";
    const currentSearch = searchParams.get("q") || "";
    const currentStockStatus = searchParams.get("f_stock_status") || "all";
    const currentMinPrice = searchParams.get("minPrice") || "";
    const currentMaxPrice = searchParams.get("maxPrice") || "";

    useEffect(() => {
        const fetchPaginatedProducts = async () => {
            setIsLoadingProducts(true);
            try {
                // We use searchParams.toString() directly to reuse current query filters,
                // but we explicitly add default limit if not present.
                const query = new URLSearchParams(searchParams.toString());
                if (!query.has("limit")) query.set("limit", "10");
                if (!query.has("page")) query.set("page", "1");

                const res = await fetch(`/api/products?${query.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    setPaginatedProducts(data.products);
                    setTotalProducts(data.total);
                }
            } catch (err) {
                console.error("Failed to fetch paginated products:", err);
            } finally {
                setIsLoadingProducts(false);
            }
        };

        // Only fetch if NOT creating/editing a product
        if (!isEditing) {
            fetchPaginatedProducts();
        }
    }, [searchParams, isEditing]);

    const updateQueryParams = (newParams: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());

        // Reset page to 1 if any filter logic changes, except when explicitly changing page
        if (!newParams.page && (newParams.category !== undefined || newParams.q !== undefined || newParams.f_stock_status !== undefined || newParams.minPrice !== undefined || newParams.maxPrice !== undefined)) {
            params.set("page", "1");
        }

        Object.entries(newParams).forEach(([key, value]) => {
            if (value === null || value === "all" || value === "") {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        });

        router.push(`${pathname}?${params.toString()}`);
    };

    const [currentProduct, setCurrentProduct] = useState<ProductFormState>({
        id: '',
        sku: '',
        name: '',
        price: 0,
        stock: 0,
        category: Category.PROCESSOR,
        image: 'https://picsum.photos/300/300',
        imageFile: undefined,
        specs: { brand: '' },
        description: ''
    });
    const [newProductCost, setNewProductCost] = useState(0);

    // Get schema for current category and filter based on dependencies
    const currentSchema = useMemo(() => {
        const schema = schemas.find(s => s.category === currentProduct.category);
        if (!schema) return [];

        return schema.attributes.filter(attr => {
            if (!attr.dependencyKey) return true;

            // Check if the required dependency condition is met
            const dependencyVal = currentProduct.specs?.[attr.key === 'socket' ? 'brand' : attr.dependencyKey];

            // Allow checking against arrays (e.g if brand was somehow multi-select) or strings
            if (Array.isArray(dependencyVal)) {
                return dependencyVal.includes(attr.dependencyValue || '');
            }
            return dependencyVal === attr.dependencyValue;
        });
    }, [currentProduct.category, currentProduct.specs, schemas]);

    // Get available brands for current category
    const availableBrands = useMemo(() => {
        return brands.filter(b =>
            b.categories.includes(currentProduct.category as Category)
        );
    }, [currentProduct.category, brands]);

    // ----------------- image upload utils -------------------
    const validateImage = (file: File) => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            return "Only JPG, PNG, or WEBP images are allowed.";
        }

        if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
            return `Image must be under ${MAX_IMAGE_SIZE_MB}MB.`;
        }

        return null;
    };
    const simulateUpload = () => {
        setUploadProgress(0);

        const interval = setInterval(() => {
            setUploadProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 10;
            });
        }, 150);
    };
    const handleFile = (file: File) => {
        const validationError = validateImage(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        setError(null);
        setImageFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        simulateUpload();
    };

    // Auto-generate SKU if not provided
    const generateSKU = (product: ProductFormState): string => {
        if (product.sku && product.sku.trim()) return product.sku.trim();

        const catPrefix = product.category?.substring(0, 3).toUpperCase() || 'PRD';
        const brandPrefix = String(product.specs?.brand || '').substring(0, 3).toUpperCase() || 'XXX';
        const timestamp = Date.now().toString().slice(-6);

        return `${catPrefix}-${brandPrefix}-${timestamp}`;
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields
        if (!currentProduct.name?.trim()) {
            alert('Product name is required');
            return;
        }

        if (!currentProduct.specs?.brand) {
            alert('Brand is required');
            return;
        }

        // Convert flat specs to array for API
        const apiSpecs = flatToSpecs(currentProduct.specs) as ProductSpec[];

        // Check if editing existing product
        if (currentProduct.id && products.find(p => p.id === currentProduct.id)) {
            updateProduct({
                ...currentProduct,
                specs: apiSpecs
            } as Product);
        } else {
            // Creating new product
            const newId = `prod-${Date.now()}`;
            const generatedSKU = generateSKU(currentProduct);

            const newProduct: Product = {
                ...currentProduct,
                id: newId,
                sku: generatedSKU,
                name: currentProduct.name || '',
                price: currentProduct.price || 0,
                stock: currentProduct.stock || 0,
                category: currentProduct.category || Category.PROCESSOR,
                image: currentProduct.image || 'https://picsum.photos/300/300',
                description: currentProduct.description || '',
                specs: apiSpecs
            } as Product;

            addProduct(newProduct, currentProduct.stock || 0, newProductCost);
        }

        setIsEditing(false);
        resetForm();
    };

    const handleEdit = (product: Product) => {
        setCurrentProduct({
            ...product,
            specs: specsToFlat(product.specs)
        });
        setIsEditing(true);
    };

    const handleDelete = (productId: string) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            deleteProduct(productId);
        }
    };

    const resetForm = () => {
        setCurrentProduct({
            id: '',
            sku: '',
            name: '',
            price: 0,
            stock: 0,
            category: Category.PROCESSOR,
            image: 'https://picsum.photos/300/300',
            specs: { brand: '' },
            description: ''
        });
        setNewProductCost(0);
    };

    const handleCancel = () => {
        setIsEditing(false);
        resetForm();
    };

    const handleAddNew = () => {
        resetForm();
        setIsEditing(true);
    };

    const handleCategoryChange = (newCategory: Category) => {
        setCurrentProduct({
            ...currentProduct,
            category: newCategory,
            specs: { brand: '' } // Reset specs when category changes
        });
    };

    const handleSpecChange = (key: string, value: string | number | string[]) => {
        let newSpecs = {
            ...currentProduct.specs,
            [key]: value
        };

        // If the changed spec is a parent dependency (e.g. brand), we need to cascade and clear 
        // any child attributes that no longer match the new parent value.
        const schema = schemas.find(s => s.category === currentProduct.category);
        if (schema) {
            schema.attributes.forEach(attr => {
                // For socket, the seed data uses dependencyKey = 'brand'
                const depKey = attr.key === 'socket' ? 'brand' : attr.dependencyKey;

                if (depKey === key) {
                    // The parent was just changed! Check if the new value satisfies this attribute
                    const isSatisfied = Array.isArray(value)
                        ? value.includes(attr.dependencyValue || '')
                        : value === attr.dependencyValue;

                    // If it's no longer satisfied, clear the value from the specs
                    if (!isSatisfied && newSpecs[attr.key] !== undefined) {
                        delete newSpecs[attr.key];
                    }
                }
            });
        }

        setCurrentProduct({
            ...currentProduct,
            specs: newSpecs
        });
    };

    const handleMultiSelectToggle = (key: string, option: string) => {
        const currentVals = (currentProduct.specs?.[key] as string[]) || [];
        const newVals = currentVals.includes(option)
            ? currentVals.filter(v => v !== option)
            : [...currentVals, option];

        handleSpecChange(key, newVals);
    };

    const getStockBadgeClass = (status: string | undefined): string => {
        if (status === 'OUT_OF_STOCK') return 'bg-red-100 text-red-800';
        if (status === 'LOW_STOCK') return 'bg-orange-100 text-orange-800';
        return 'bg-green-100 text-green-800';
    };

    return (
        <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Product Management</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {totalProducts} product{totalProducts !== 1 ? 's' : ''} found in catalog matching filters
                    </p>
                </div>
                {!isEditing && (
                    <button
                        onClick={handleAddNew}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={16} /> Add Product
                    </button>
                )}
            </div>

            {isEditing ? (
                <form onSubmit={handleSave} className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2 mb-4">
                            <Package size={20} className="text-gray-600" />
                            <h3 className="text-sm font-bold text-gray-700 uppercase">Basic Information</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Product Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={currentProduct.name}
                                    onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                                    placeholder="e.g., AMD Ryzen 7 7800X3D"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    SKU (Auto-generated if empty)
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={currentProduct.sku}
                                    onChange={e => setCurrentProduct({ ...currentProduct, sku: e.target.value })}
                                    placeholder="Leave empty for auto-generation"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={currentProduct.category}
                                    onChange={e => handleCategoryChange(e.target.value as Category)}
                                >
                                    {Object.values(Category).map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Brand <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={currentProduct.specs?.brand || ''}
                                    onChange={e => handleSpecChange('brand', e.target.value)}
                                >
                                    <option value="">Select Brand</option>
                                    {availableBrands.map(brand => (
                                        <option key={brand.id} value={brand.name}>{brand.name}</option>
                                    ))}
                                </select>
                                {availableBrands.length === 0 && (
                                    <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                                        <AlertCircle size={12} />
                                        No brands available for this category
                                    </p>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={3}
                                    value={currentProduct.description}
                                    onChange={e => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                                    placeholder="Brief product description..."
                                />
                            </div>

                            <div>
                                <div
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const file = e.dataTransfer.files?.[0];
                                        if (file) handleFile(file);
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                    className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed
             border-gray-300 bg-gray-50 p-6 text-center transition
             hover:border-blue-400 hover:bg-blue-50"
                                >
                                    <p className="text-sm font-medium text-gray-700">
                                        Drag & drop an image here
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        JPG, PNG, WEBP · Max {MAX_IMAGE_SIZE_MB}MB
                                    </p>

                                    <label className="mt-4 cursor-pointer rounded-md bg-blue-600 px-4 py-2
                    text-sm font-medium text-white hover:bg-blue-700">
                                        Browse File
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleFile(file);
                                            }}
                                        />
                                    </label>
                                </div>
                                {uploadProgress > 0 && uploadProgress < 100 && (
                                    <div className="mt-4">
                                        <div className="h-2 w-full rounded-full bg-gray-200">
                                            <div
                                                className="h-2 rounded-full bg-blue-600 transition-all"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-gray-600">
                                            Uploading... {uploadProgress}%
                                        </p>
                                    </div>
                                )}
                                {previewUrl && uploadProgress === 100 && (
                                    <div className="mt-4 flex items-center gap-4">
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="h-24 w-24 rounded-lg border object-cover"
                                        />
                                        <span className="text-sm font-medium text-green-600">
                                            Image ready
                                        </span>
                                    </div>
                                )}
                                {error && (
                                    <p className="mt-3 text-sm text-red-600">
                                        {error}
                                    </p>
                                )}

                            </div>

                            <div>
                                {currentProduct.image && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Preview</label>
                                        <img
                                            src={currentProduct.image}
                                            alt="Product preview"
                                            className="h-16 w-16 object-contain bg-gray-100 rounded-lg border border-gray-200"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://picsum.photos/300/300';
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Pricing & Inventory */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2 mb-4">
                            <DollarSign size={20} className="text-gray-600" />
                            <h3 className="text-sm font-bold text-gray-700 uppercase">Pricing & Inventory</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Selling Price (₹) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={currentProduct.price}
                                    onChange={e => setCurrentProduct({ ...currentProduct, price: Number(e.target.value) })}
                                />
                            </div>

                            {!currentProduct.id && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Initial Stock <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            required
                                            type="number"
                                            min="0"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={currentProduct.stock}
                                            onChange={e => setCurrentProduct({ ...currentProduct, stock: Number(e.target.value) })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Cost Price (₹) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            required
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={newProductCost}
                                            onChange={e => setNewProductCost(Number(e.target.value))}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Technical Specifications */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2 mb-4">
                            <Layers size={20} className="text-gray-600" />
                            <h3 className="text-sm font-bold text-gray-700 uppercase">
                                Technical Specifications - {currentProduct.category}
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {currentSchema.map(attr => (
                                <div key={attr.key}>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        {attr.label}
                                        {attr.required && <span className="text-red-500 ml-1">*</span>}
                                        {attr.unit && <span className="text-gray-500 ml-1">({attr.unit})</span>}
                                    </label>

                                    {attr.type === 'multi-select' ? (
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {attr.options?.map(option => {
                                                const currentVals = (currentProduct.specs?.[attr.key] as string[]) || [];
                                                const isSelected = currentVals.includes(option);
                                                return (
                                                    <label key={option} className="flex items-center gap-1.5 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                            checked={isSelected}
                                                            onChange={() => handleMultiSelectToggle(attr.key, option)}
                                                        />
                                                        <span className="text-sm text-gray-700">{option}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    ) : attr.type === 'select' ? (
                                        <select
                                            required={attr.required}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={(currentProduct.specs?.[attr.key] as string) || ''}
                                            onChange={e => handleSpecChange(attr.key, e.target.value)}
                                        >
                                            <option value="">Select...</option>
                                            {attr.options?.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type={attr.type === 'number' ? 'number' : 'text'}
                                            required={attr.required}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={currentProduct.specs?.[attr.key] || ''}
                                            onChange={e => handleSpecChange(
                                                attr.key,
                                                attr.type === 'number' ? Number(e.target.value) : e.target.value
                                            )}
                                        />
                                    )}
                                </div>
                            ))}

                            {currentSchema.length === 0 && (
                                <div className="md:col-span-3">
                                    <p className="text-sm text-gray-400 italic flex items-center gap-2">
                                        <AlertCircle size={16} />
                                        No specific schema defined for this category
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            {currentProduct.id ? 'Update Product' : 'Create Product'}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="space-y-4">
                    {/* Filters Bar */}
                    <div className="flex flex-wrap gap-3 bg-gray-50 p-4 border border-gray-200 rounded-xl items-center justify-between">
                        {/* Search and Category */}
                        <div className="flex flex-wrap gap-3 flex-1">
                            <div className="relative max-w-xs w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    className="pl-9 pr-3 py-2 w-full text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={currentSearch}
                                    onChange={(e) => updateQueryParams({ q: e.target.value })}
                                />
                            </div>

                            <select
                                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                value={currentCategory}
                                onChange={(e) => updateQueryParams({ category: e.target.value })}
                            >
                                <option value="all">All Categories</option>
                                {Object.values(Category).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>

                            <select
                                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                value={currentStockStatus}
                                onChange={(e) => updateQueryParams({ f_stock_status: e.target.value })}
                            >
                                <option value="all">Any Stock Status</option>
                                <option value="In Stock">In Stock (&gt;0)</option>
                                <option value="Out of Stock">Out of Stock (=0)</option>
                            </select>
                        </div>

                        {/* Price Range */}
                        <div className="flex items-center gap-2 bg-white px-3 py-1 border border-gray-300 rounded-lg">
                            <DollarSign size={14} className="text-gray-400" />
                            <input
                                type="number"
                                placeholder="Min Price"
                                className="w-20 text-sm focus:outline-none py-1"
                                value={currentMinPrice}
                                onChange={(e) => updateQueryParams({ minPrice: e.target.value })}
                            />
                            <span className="text-gray-300">-</span>
                            <input
                                type="number"
                                placeholder="Max Price"
                                className="w-20 text-sm focus:outline-none py-1"
                                value={currentMaxPrice}
                                onChange={(e) => updateQueryParams({ maxPrice: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Brand
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Stock
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoadingProducts ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                                            Loading products...
                                        </td>
                                    </tr>
                                ) : paginatedProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Package size={48} className="text-gray-300" />
                                                <p className="text-gray-500">No products match your filters</p>
                                                {(currentCategory !== 'all' || currentSearch || currentStockStatus !== 'all' || currentMinPrice || currentMaxPrice) ? (
                                                    <button
                                                        onClick={() => router.push(pathname)}
                                                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                                                    >
                                                        Clear all filters
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={handleAddNew}
                                                        className="text-blue-600 hover:text-blue-700 font-medium"
                                                    >
                                                        Add your first product
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedProducts.map(product => (
                                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={product.media?.[0]?.url || '/placeholder.png'}
                                                        alt={product.name}
                                                        className="h-10 w-10 rounded-lg object-contain bg-gray-100 border border-gray-200"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = 'https://picsum.photos/300/300';
                                                        }}
                                                    />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 max-w-[200px] truncate" title={product.name}>
                                                            {product.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {product.variants?.[0]?.sku || ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className="px-2 py-1 bg-gray-100 rounded text-xs border border-gray-200">
                                                    {product.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {product.brand?.name || product.specs.find(s => s.key === 'brand')?.value || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                ₹{(product.variants?.[0]?.price || 0).toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStockBadgeClass(product.variants?.[0]?.status)}`}>
                                                    {product.variants?.[0]?.status?.replace(/_/g, ' ') || 'UNKNOWN'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button
                                                        onClick={() => handleEdit(product)}
                                                        className="text-blue-600 hover:text-blue-900 transition-colors"
                                                        title="Edit product"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product.id)}
                                                        className="text-red-600 hover:text-red-900 transition-colors"
                                                        title="Delete product"
                                                    >
                                                        <Trash size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {!isLoadingProducts && totalProducts > 0 && (
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
                            <div className="text-sm text-gray-500">
                                Showing <span className="font-semibold text-gray-900">{(currentPage - 1) * currentLimit + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(currentPage * currentLimit, totalProducts)}</span> of <span className="font-semibold text-gray-900">{totalProducts}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    disabled={currentPage <= 1}
                                    onClick={() => updateQueryParams({ page: String(currentPage - 1) })}
                                    className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <div className="px-4 py-1.5 text-sm font-medium border border-gray-200 rounded-md bg-gray-50">
                                    Page {currentPage} of {Math.max(1, Math.ceil(totalProducts / currentLimit))}
                                </div>
                                <button
                                    disabled={currentPage >= Math.ceil(totalProducts / currentLimit)}
                                    onClick={() => updateQueryParams({ page: String(currentPage + 1) })}
                                    className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProductManager;