'use client';

import React, { useState, useMemo } from 'react';
import { useShop } from '@/context/ShopContext';
import { Category, Product } from '@/types';
import { Edit, Plus, Trash, AlertCircle, Package, DollarSign, Layers } from 'lucide-react';

const MAX_IMAGE_SIZE_MB = 2;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const ProductManager = () => {
    const {
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        categories,
        brands,
        schemas,
    } = useShop();

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
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

    // Get schema for current category
    const currentSchema = useMemo(() => {
        const schema = schemas.find(s => s.category === currentProduct.category);
        return schema?.attributes || [];
    }, [currentProduct.category, schemas]);

    // Get available brands for current category
    const availableBrands = useMemo(() => {
        return brands.filter(b =>
            b.linkedCategories.includes(currentProduct.category as Category)
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
    const generateSKU = (product: Partial<Product>): string => {
        if (product.sku && product.sku.trim()) return product.sku.trim();

        const catPrefix = product.category?.substring(0, 3).toUpperCase() || 'PRD';
        const brandPrefix = product.specs?.brand?.substring(0, 3).toUpperCase() || 'XXX';
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

        // Check if editing existing product
        if (currentProduct.id && products.find(p => p.id === currentProduct.id)) {
            updateProduct(currentProduct as Product);
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
                specs: currentProduct.specs || { brand: '' }
            } as Product;

            addProduct(newProduct, currentProduct.stock || 0, newProductCost);
        }

        setIsEditing(false);
        resetForm();
    };

    const handleEdit = (product: Product) => {
        setCurrentProduct({ ...product });
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

    const handleSpecChange = (key: string, value: string | number) => {
        setCurrentProduct({
            ...currentProduct,
            specs: {
                ...currentProduct.specs,
                [key]: value
            }
        });
    };

    const getStockBadgeClass = (stock: number): string => {
        if (stock === 0) return 'bg-red-100 text-red-800';
        if (stock < 5) return 'bg-orange-100 text-orange-800';
        if (stock < 10) return 'bg-yellow-100 text-yellow-800';
        return 'bg-green-100 text-green-800';
    };

    return (
        <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Product Management</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {products.length} product{products.length !== 1 ? 's' : ''} in catalog
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

                                    {attr.type === 'select' ? (
                                        <select
                                            required={attr.required}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={currentProduct.specs?.[attr.key] || ''}
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
                <div className="overflow-x-auto">
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
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Package size={48} className="text-gray-300" />
                                            <p className="text-gray-500">No products yet</p>
                                            <button
                                                onClick={handleAddNew}
                                                className="text-blue-600 hover:text-blue-700 font-medium"
                                            >
                                                Add your first product
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                products.map(product => (
                                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="h-10 w-10 rounded-lg object-contain bg-gray-100 border border-gray-200"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'https://picsum.photos/300/300';
                                                    }}
                                                />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {product.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {product.sku}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                                {product.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {product.specs.brand || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            ₹{product.price.toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStockBadgeClass(product.stock)}`}>
                                                {product.stock} {product.stock === 1 ? 'unit' : 'units'}
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
            )}
        </div>
    );
};

export default ProductManager;