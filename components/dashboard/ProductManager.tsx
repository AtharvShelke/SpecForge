'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useShop } from '@/context/ShopContext';
import { useAdmin } from '@/context/AdminContext';
import { Category, Product, ProductSpecsFlat, specsToFlat, flatToSpecs, ProductSpec } from '@/types';
import {
    Edit,
    Plus,
    Trash,
    AlertCircle,
    Package,
    DollarSign,
    Layers,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Image as ImageIcon,
    CheckCircle2,
    X,
    MoreHorizontal,
    LayoutGrid,
    Settings2,
    Save,
    ArrowLeft
} from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import ImageUploader from '../uploadthing/ImageUploader';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const MAX_IMAGE_SIZE_MB = 2;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface ProductFormState extends Omit<Partial<Product>, 'specs'> {
    specs: ProductSpecsFlat;
    price?: number;
    stock?: number;
    sku?: string;
    images: string[];
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

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Pagination & Filtering State
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [paginatedProducts, setPaginatedProducts] = useState<Product[]>([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(false);

    const currentPage = parseInt(searchParams.get("page") || "1", 10);
    const currentLimit = parseInt(searchParams.get("limit") || "10", 10);
    const currentCategory = searchParams.get("category") || "all";
    const currentSearchQuery = searchParams.get("q") || "";
    const [searchTerm, setSearchTerm] = useState(currentSearchQuery);
    const debouncedSearch = useDebounce(searchTerm, 500);

    const currentStockStatus = searchParams.get("f_stock_status") || "all";
    const currentMinPrice = searchParams.get("minPrice") || "";
    const currentMaxPrice = searchParams.get("maxPrice") || "";

    useEffect(() => {
        if (debouncedSearch !== currentSearchQuery) {
            updateQueryParams({ q: debouncedSearch });
        }
    }, [debouncedSearch]);

    useEffect(() => {
        const fetchPaginatedProducts = async () => {
            setIsLoadingProducts(true);
            try {
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

        if (!isEditing) {
            fetchPaginatedProducts();
        }
    }, [searchParams, isEditing, refreshTrigger]);

    const updateQueryParams = (newParams: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());

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
        images: ['https://picsum.photos/300/300'],
        specs: { brand: '' },
        description: ''
    });
    const [newProductCost, setNewProductCost] = useState(0);

    const currentSchema = useMemo(() => {
        const schema = schemas.find(s => s.category === currentProduct.category);
        if (!schema) return [];

        return schema.attributes.filter(attr => {
            if (!attr.dependencyKey) return true;
            const dependencyVal = currentProduct.specs?.[attr.key === 'socket' ? 'brand' : attr.dependencyKey];
            if (Array.isArray(dependencyVal)) {
                return dependencyVal.includes(attr.dependencyValue || '');
            }
            return dependencyVal === attr.dependencyValue;
        });
    }, [currentProduct.category, currentProduct.specs, schemas]);

    const availableBrands = useMemo(() => {
        return brands.filter(b =>
            b.categories.includes(currentProduct.category as Category)
        );
    }, [currentProduct.category, brands]);

    const handleUploadComplete = (url: string) => {
        setPreviewUrl(url);
        setUploadError(null);
        setCurrentProduct(prev => ({
            ...prev,
            images: [...prev.images.filter(img => img === 'https://picsum.photos/300/300' ? false : true), url]
        }));
    };

    const handleUploadError = (err: Error) => {
        setUploadError(err.message);
    };

    const generateSKU = (product: ProductFormState): string => {
        if (product.sku && product.sku.trim()) return product.sku.trim();
        const catPrefix = product.category?.substring(0, 3).toUpperCase() || 'PRD';
        const brandPrefix = String(product.specs?.brand || '').substring(0, 3).toUpperCase() || 'XXX';
        const timestamp = Date.now().toString().slice(-6);
        return `${catPrefix}-${brandPrefix}-${timestamp}`;
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentProduct.name?.trim()) {
            alert('Product name is required');
            return;
        }
        if (!currentProduct.specs?.brand) {
            alert('Brand is required');
            return;
        }

        const apiSpecs = flatToSpecs(currentProduct.specs) as ProductSpec[];

        if (currentProduct.id && products.find(p => p.id === currentProduct.id)) {
            updateProduct({
                ...currentProduct,
                specs: apiSpecs,
                price: currentProduct.price,
                stock: currentProduct.stock,
                images: currentProduct.images
            } as any).then(() => setRefreshTrigger(prev => !prev));
        } else {
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
                images: currentProduct.images.length > 0 ? currentProduct.images : ['https://picsum.photos/300/300'],
                description: currentProduct.description || '',
                specs: apiSpecs
            } as Product;
            addProduct(newProduct, currentProduct.stock || 0, newProductCost).then(() => setRefreshTrigger(prev => !prev));
        }

        setIsEditing(false);
        resetForm();
    };

    const handleEdit = (product: Product) => {
        const firstVariant = product.variants?.[0];
        const firstMedia = product.media?.[0];
        const mainStock = firstVariant?.warehouseInventories?.find(inv => inv.warehouse?.code === 'MAIN')?.quantity
            || firstVariant?.warehouseInventories?.[0]?.quantity
            || 0;

        setCurrentProduct({
            ...product,
            sku: firstVariant?.sku || '',
            price: firstVariant?.price || 0,
            stock: mainStock,
            images: product.media?.length ? product.media.map(m => m.url) : [product.image || 'https://picsum.photos/300/300'],
            specs: specsToFlat(product.specs)
        });

        setPreviewUrl(firstMedia?.url || product.image || null);
        setIsEditing(true);
    };

    const handleDelete = (productId: string) => {
        deleteProduct(productId).then(() => setRefreshTrigger(prev => !prev));
    };

    const resetForm = () => {
        setCurrentProduct({
            id: '',
            sku: '',
            name: '',
            price: 0,
            stock: 0,
            category: Category.PROCESSOR,
            images: ['https://picsum.photos/300/300'],
            specs: { brand: '' },
            description: ''
        });
        setNewProductCost(0);
        setPreviewUrl(null);
    };

    const handleCancel = () => {
        setIsEditing(false);
        resetForm();
    };

    const handleAddNew = () => {
        resetForm();
        setIsEditing(true);
    };

    const handleCategoryChange = (val: string) => {
        setCurrentProduct({
            ...currentProduct,
            category: val as Category,
            specs: { brand: '' }
        });
    };

    const handleSpecChange = (key: string, value: string | number | string[]) => {
        let newSpecs = {
            ...currentProduct.specs,
            [key]: value
        };

        const schema = schemas.find(s => s.category === currentProduct.category);
        if (schema) {
            schema.attributes.forEach(attr => {
                const depKey = attr.key === 'socket' ? 'brand' : attr.dependencyKey;
                if (depKey === key) {
                    const isSatisfied = Array.isArray(value)
                        ? value.includes(attr.dependencyValue || '')
                        : value === attr.dependencyValue;
                    if (!isSatisfied && newSpecs[attr.key] !== undefined) {
                        delete newSpecs[attr.key];
                    }
                }
            });
        }

        setCurrentProduct({ ...currentProduct, specs: newSpecs });
    };

    const handleMultiSelectToggle = (key: string, option: string) => {
        const currentVals = (currentProduct.specs?.[key] as string[]) || [];
        const newVals = currentVals.includes(option)
            ? currentVals.filter(v => v !== option)
            : [...currentVals, option];
        handleSpecChange(key, newVals);
    };

    const getStatusStyles = (product: Product, variant: any) => {
        // Calculate real stock from all warehouses
        const totalStock = variant?.warehouseInventories?.reduce((acc: number, inv: any) => acc + inv.quantity, 0) || 0;

        if (totalStock <= 0) {
            return 'bg-red-50 text-red-700 border-red-100';
        }
        if (totalStock <= 5) {
            return 'bg-amber-50 text-amber-700 border-amber-100';
        }
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    };

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-zinc-900">Products</h2>
                    <p className="text-sm text-zinc-500 mt-0.5">
                        Product management · {totalProducts} active SKUs
                    </p>
                </div>
                {!isEditing && (
                    <Button
                        onClick={handleAddNew}
                        size="sm"
                        className="h-8 text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 gap-2 rounded-md"
                    >
                        <Plus size={14} /> Add Product
                    </Button>
                )}
            </div>

            {isEditing ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border shadow-sm">
                            <CardHeader className="px-6 py-5 border-b border-zinc-100 bg-zinc-50/50">
                                <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                                    <LayoutGrid size={16} className="text-zinc-500" />
                                    General Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form onSubmit={handleSave} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-zinc-700">Name</Label>
                                            <Input
                                                required
                                                value={currentProduct.name}
                                                onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                                                placeholder="Enter identifying name..."
                                                className="h-9 text-xs border-zinc-200 focus-visible:ring-zinc-900"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-zinc-700">SKU</Label>
                                            <Input
                                                value={currentProduct.sku}
                                                onChange={e => setCurrentProduct({ ...currentProduct, sku: e.target.value })}
                                                placeholder="Leave empty for auto-generation"
                                                className="h-9 text-xs border-zinc-200 focus-visible:ring-zinc-900 font-mono"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-zinc-700">Category</Label>
                                            <Select value={currentProduct.category} onValueChange={handleCategoryChange}>
                                                <SelectTrigger className="h-9 text-xs border-zinc-200 focus:ring-zinc-900">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.values(Category).map(cat => (
                                                        <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-zinc-700">Brand</Label>
                                            <Select value={currentProduct.specs?.brand as string || ''} onValueChange={val => handleSpecChange('brand', val)}>
                                                <SelectTrigger className="h-9 text-xs border-zinc-200 focus:ring-zinc-900">
                                                    <SelectValue placeholder="Select Brand..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableBrands.map(brand => (
                                                        <SelectItem key={brand.id} value={brand.name} className="text-xs">{brand.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="md:col-span-2 space-y-2">
                                            <Label className="text-sm font-medium text-zinc-700">Description</Label>
                                            <Textarea
                                                value={currentProduct.description}
                                                onChange={e => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                                                placeholder="Technical details and overview..."
                                                className="min-h-[100px] text-xs border-zinc-200 focus-visible:ring-zinc-900 resize-none"
                                            />
                                        </div>
                                    </div>
                                    <Separator className="bg-zinc-100" />

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Settings2 size={16} className="text-zinc-500" />
                                            <h3 className="text-sm font-semibold text-zinc-900">Specifications</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {currentSchema.map(attr => (
                                                <div key={attr.key} className="space-y-2">
                                                    <Label className="text-sm font-medium text-zinc-700 flex items-center gap-1">
                                                        {attr.label}
                                                        {attr.unit && <span className="normal-case opacity-50">({attr.unit})</span>}
                                                    </Label>

                                                    {attr.type === 'multi-select' ? (
                                                        <div className="flex flex-wrap gap-2">
                                                            {attr.options?.map(option => {
                                                                const isSelected = ((currentProduct.specs?.[attr.key] as string[]) || []).includes(option);
                                                                return (
                                                                    <Badge
                                                                        key={option}
                                                                        variant={isSelected ? "default" : "outline"}
                                                                        className={cn(
                                                                            "text-[11px] font-medium uppercase tracking-wide cursor-pointer h-6",
                                                                            isSelected ? "bg-zinc-900 text-white" : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                                                                        )}
                                                                        onClick={() => handleMultiSelectToggle(attr.key, option)}
                                                                    >
                                                                        {option}
                                                                    </Badge>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : attr.type === 'select' ? (
                                                        <Select value={(currentProduct.specs?.[attr.key] as string) || ''} onValueChange={val => handleSpecChange(attr.key, val)}>
                                                            <SelectTrigger className="h-9 text-xs border-zinc-200">
                                                                <SelectValue placeholder="Select..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {attr.options?.map(option => (
                                                                    <SelectItem key={option} value={option} className="text-xs">{option}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <Input
                                                            type={attr.type === 'number' ? 'number' : 'text'}
                                                            className="h-9 text-xs border-zinc-200"
                                                            value={currentProduct.specs?.[attr.key] || ''}
                                                            onChange={e => handleSpecChange(attr.key, attr.type === 'number' ? Number(e.target.value) : e.target.value)}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        {/* Media Gallery */}
                        <Card className="border shadow-sm">
                            <CardHeader className="px-6 py-5 border-b border-zinc-100 bg-zinc-50/50">
                                <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                                    <ImageIcon size={16} className="text-zinc-500" />
                                    Images
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    {currentProduct.images.map((img, index) => (
                                        <div key={index} className="relative group aspect-square bg-zinc-50 rounded-lg border border-zinc-200 overflow-hidden">
                                            <img
                                                src={img}
                                                alt={`Product ${index + 1}`}
                                                className="w-full h-full object-contain p-2"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newImages = currentProduct.images.filter((_, i) => i !== index);
                                                    setCurrentProduct({ ...currentProduct, images: newImages.length > 0 ? newImages : ['https://picsum.photos/300/300'] });
                                                }}
                                                className="absolute top-1.5 right-1.5 p-1 bg-white border border-red-100 text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50"
                                            >
                                                <Trash size={12} />
                                            </button>
                                            {index === 0 && (
                                                <Badge className="absolute bottom-1.5 left-1.5 text-[10px] font-medium h-4 px-1.5 bg-white/80 backdrop-blur-sm text-zinc-900 border-zinc-200 rounded">
                                                    Primary
                                                </Badge>
                                            )}
                                        </div>
                                    ))}
                                    <div className="aspect-square border-2 border-dashed border-zinc-200 rounded-lg hover:border-zinc-300 transition-colors flex items-center justify-center bg-zinc-50/30">
                                        <ImageUploader
                                            onUploadComplete={handleUploadComplete}
                                            onUploadError={handleUploadError}
                                            endpoint="imageUploader"
                                        />
                                    </div>
                                </div>
                                {uploadError && <p className="text-[10px] font-bold text-red-500 uppercase">{uploadError}</p>}
                            </CardContent>
                        </Card>

                        {/* Financial Registry */}
                        <Card className="border shadow-sm">
                            <CardHeader className="px-6 py-5 border-b border-zinc-100 bg-zinc-50/50">
                                <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                                    <DollarSign size={16} className="text-zinc-500" />
                                    Pricing
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-zinc-700">Selling Price (₹)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        className="h-9 text-xs border-zinc-200"
                                        value={currentProduct.price}
                                        onChange={e => setCurrentProduct({ ...currentProduct, price: Number(e.target.value) })}
                                    />
                                </div>

                                {!currentProduct.id && (
                                    <>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-zinc-700">Cost Price (₹)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                className="h-9 text-xs border-zinc-200"
                                                value={newProductCost}
                                                onChange={e => setNewProductCost(Number(e.target.value))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-zinc-700">Initial Stock</Label>
                                            <Input
                                                type="number"
                                                className="h-9 text-xs border-zinc-200"
                                                value={currentProduct.stock}
                                                onChange={e => setCurrentProduct({ ...currentProduct, stock: Number(e.target.value) })}
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="pt-4 flex flex-col gap-2">
                                    <Button onClick={handleSave} className="h-9 text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 gap-2 rounded-md">
                                        <Save size={14} /> Save Product
                                    </Button>
                                    <Button variant="outline" onClick={handleCancel} className="h-9 text-xs font-medium border-zinc-200 gap-2 rounded-md">
                                        <ArrowLeft size={14} /> Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Catalog Controls */}
                    <Card className="border shadow-sm">
                        <CardHeader className="px-6 py-5 border-b border-zinc-100 bg-zinc-100/30">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="relative group max-w-sm">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" size={14} />
                                        <Input
                                            placeholder="Search catalog..."
                                            className="pl-9 h-9 text-xs bg-white border-zinc-200 focus-visible:ring-zinc-900 shadow-none transition-all w-48 sm:w-64"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <Select value={currentCategory} onValueChange={val => updateQueryParams({ category: val })}>
                                        <SelectTrigger className="h-9 text-xs font-medium w-36 border-zinc-200 bg-white shadow-none">
                                            <SelectValue placeholder="Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all" className="text-xs">All Categories</SelectItem>
                                            {Object.values(Category).map(cat => (
                                                <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={currentStockStatus} onValueChange={val => updateQueryParams({ f_stock_status: val })}>
                                        <SelectTrigger className="h-9 text-xs font-medium w-36 border-zinc-200 bg-white shadow-none">
                                            <SelectValue placeholder="Availability" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all" className="text-xs">Any Availability</SelectItem>
                                            <SelectItem value="In Stock" className="text-xs">In Stock</SelectItem>
                                            <SelectItem value="Out of Stock" className="text-xs">Out of Stock</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-zinc-200 rounded-md">
                                    <DollarSign size={14} className="text-zinc-400" />
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        className="w-14 text-[10px] font-bold outline-none placeholder:font-normal"
                                        value={currentMinPrice}
                                        onChange={e => updateQueryParams({ minPrice: e.target.value })}
                                    />
                                    <span className="text-zinc-200 mx-1">—</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        className="w-14 text-[10px] font-bold outline-none placeholder:font-normal"
                                        value={currentMaxPrice}
                                        onChange={e => updateQueryParams({ maxPrice: e.target.value })}
                                    />
                                </div>
                            </div>
                        </CardHeader>

                        {/* Table Engine */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-zinc-200">
                                <thead className="bg-zinc-50/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Product</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">Brand</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wide">Price</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wide">Stock</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wide">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-zinc-200">
                                    {isLoadingProducts ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-sm text-zinc-400 animate-pulse">
                                                Loading products...
                                            </td>
                                        </tr>
                                    ) : paginatedProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-16 text-center">
                                                <Package size={32} className="mx-auto text-zinc-200 mb-4" />
                                                <p className="text-sm text-zinc-400">No products found</p>
                                                <Button
                                                    variant="link"
                                                    className="text-indigo-600 font-medium text-xs mt-2"
                                                    onClick={() => router.push(pathname)}
                                                >
                                                    Clear Filters
                                                </Button>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedProducts.map(product => {
                                            const firstVar = product.variants?.[0];
                                            const brand = product.brand?.name || product.specs.find(s => s.key === 'brand')?.value || 'Generic';

                                            return (
                                                <tr key={product.id} className="hover:bg-zinc-50/50 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-12 w-12 shrink-0 bg-zinc-100 rounded-lg overflow-hidden border border-zinc-200 p-1">
                                                                <img
                                                                    className="h-full w-full object-contain"
                                                                    src={product.media?.[0]?.url || '/placeholder.png'}
                                                                    alt={product.name}
                                                                />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-sm font-semibold text-zinc-900 truncate leading-tight" title={product.name}>
                                                                    {product.name}
                                                                </div>
                                                                <div className="text-[10px] font-mono font-bold text-zinc-400 mt-0.5">
                                                                    {firstVar?.sku || 'NO-SKU'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <Badge variant="outline" className="text-[11px] font-medium uppercase rounded tracking-wide bg-white border-zinc-200 text-zinc-600 px-1.5 h-5">
                                                            {product.category}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-zinc-500">
                                                        {brand}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-zinc-900">
                                                        ₹{(firstVar?.price || 0).toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <Badge className={cn(
                                                            "text-[11px] font-medium uppercase tracking-wide h-5 px-1.5 border rounded",
                                                            getStatusStyles(product, firstVar)
                                                        )}>
                                                            {(firstVar?.warehouseInventories?.reduce((acc: number, inv: any) => acc + inv.quantity, 0) || 0) <= 0 ? 'OUT OF STOCK' : firstVar?.status?.replace(/_/g, ' ') || 'UNKNOWN'}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-7 w-7 p-0 border-zinc-200 hover:bg-zinc-100"
                                                                onClick={() => handleEdit(product)}
                                                            >
                                                                <Edit size={16} className="text-zinc-600" />
                                                            </Button>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="h-7 w-7 p-0 border-zinc-200 hover:bg-red-50 hover:border-red-200"
                                                                    >
                                                                        <Trash size={16} className="text-red-500" />
                                                                    </Button>
                                                                </AlertDialogTrigger>

                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Delete product?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            This action cannot be undone. This will permanently delete the product.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>

                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            className="bg-red-600 hover:bg-red-700"
                                                                            onClick={() => deleteProduct(product.id)}
                                                                        >
                                                                            Delete
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Inventory Pagination */}
                        {!isLoadingProducts && totalProducts > 0 && (
                            <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/30 flex items-center justify-between">
                                <div className="text-xs font-medium text-zinc-400">
                                    Displaying <span className="text-zinc-900">{(currentPage - 1) * currentLimit + 1}</span> to <span className="text-zinc-900">{Math.min(currentPage * currentLimit, totalProducts)}</span> of <span className="text-zinc-900">{totalProducts}</span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={currentPage <= 1}
                                        onClick={() => updateQueryParams({ page: String(currentPage - 1) })}
                                        className="h-8 w-8 p-0 border-zinc-200"
                                    >
                                        <ChevronLeft size={16} />
                                    </Button>
                                    <div className="px-3 h-8 flex items-center text-xs font-medium border border-zinc-200 rounded-md bg-white text-zinc-600">
                                        {currentPage} / {Math.ceil(totalProducts / currentLimit)}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={currentPage >= Math.ceil(totalProducts / currentLimit)}
                                        onClick={() => updateQueryParams({ page: String(currentPage + 1) })}
                                        className="h-8 w-8 p-0 border-zinc-200"
                                    >
                                        <ChevronRight size={16} />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
};

export default ProductManager;