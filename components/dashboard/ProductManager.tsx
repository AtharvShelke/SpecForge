'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
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
    ChevronLeft,
    ChevronRight,
    Image as ImageIcon,
    X,
    LayoutGrid,
    Settings2,
    Save,
    ArrowLeft,
    Tag,
    TrendingUp,
    BarChart3,
    Star,
    ShoppingCart,
} from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import ImageUploader from '../uploadthing/ImageUploader';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// ─────────────────────────────────────────────────────────────
// SHARED PRIMITIVES
// ─────────────────────────────────────────────────────────────

const SectionLabel = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="flex items-center gap-1.5">
        <span className="text-stone-400">{icon}</span>
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em]">{children}</span>
    </div>
);

const FieldLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">
        {children}{required && <span className="text-rose-400 ml-0.5">*</span>}
    </label>
);

const StockPill = ({ product, variant }: { product: Product; variant: any }) => {
    const totalStock = variant?.warehouseInventories?.reduce((a: number, inv: any) => a + inv.quantity, 0) || 0;
    if (totalStock <= 0) return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-rose-50 text-rose-600 ring-1 ring-rose-200 whitespace-nowrap">
            <span className="w-1 h-1 rounded-full bg-current opacity-60" />Out of Stock
        </span>
    );
    if (totalStock <= 5) return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-50 text-amber-700 ring-1 ring-amber-200 whitespace-nowrap">
            <span className="w-1 h-1 rounded-full bg-current opacity-60" />Low Stock
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 whitespace-nowrap">
            <span className="w-1 h-1 rounded-full bg-current opacity-60" />In Stock
        </span>
    );
};

interface ProductFormState extends Omit<Partial<Product>, 'specs'> {
    specs: ProductSpecsFlat;
    price?: number;
    stock?: number;
    sku?: string;
    images: string[];
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
const ProductManager = () => {
    const { products, addProduct, updateProduct, deleteProduct, categories, brands, schemas } = useAdmin();

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [newSpecKey, setNewSpecKey] = useState('');
    const [newSpecValue, setNewSpecValue] = useState('');

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
        if (debouncedSearch !== currentSearchQuery) updateQueryParams({ q: debouncedSearch });
    }, [debouncedSearch]);

    useEffect(() => {
        if (isEditing) return;
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
            } catch (err) { console.error("Failed to fetch paginated products:", err); }
            finally { setIsLoadingProducts(false); }
        };
        fetchPaginatedProducts();
    }, [searchParams, isEditing, refreshTrigger]);

    const updateQueryParams = (newParams: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        if (!newParams.page && (newParams.category !== undefined || newParams.q !== undefined || newParams.f_stock_status !== undefined || newParams.minPrice !== undefined || newParams.maxPrice !== undefined)) {
            params.set("page", "1");
        }
        Object.entries(newParams).forEach(([key, value]) => {
            if (value === null || value === "all" || value === "") params.delete(key);
            else params.set(key, value);
        });
        router.push(`${pathname}?${params.toString()}`);
    };

    const [currentProduct, setCurrentProduct] = useState<ProductFormState>({
        id: '', sku: '', name: '', price: 0, stock: 0,
        category: Category.PROCESSOR,
        images: ['https://picsum.photos/300/300'],
        specs: { brand: '' }, description: ''
    });
    const [newProductCost, setNewProductCost] = useState(0);

    const currentSchema = useMemo(() => {
        const schema = schemas.find(s => s.category === currentProduct.category);
        if (!schema) return [];
        return schema.attributes.filter(attr => {
            if (!attr.dependencyKey) return true;
            const depVal = currentProduct.specs?.[attr.key === 'socket' ? 'brand' : attr.dependencyKey];
            return Array.isArray(depVal) ? depVal.includes(attr.dependencyValue || '') : depVal === attr.dependencyValue;
        });
    }, [currentProduct.category, currentProduct.specs, schemas]);

    const availableBrands = useMemo(() =>
        brands.filter(b => b.categories.includes(currentProduct.category as Category)),
        [currentProduct.category, brands]
    );

    const handleUploadComplete = (url: string) => {
        setPreviewUrl(url);
        setUploadError(null);
        setCurrentProduct(prev => ({
            ...prev,
            images: [...prev.images.filter(img => img !== 'https://picsum.photos/300/300'), url]
        }));
    };

    const generateSKU = (product: ProductFormState): string => {
        if (product.sku?.trim()) return product.sku.trim();
        const catPrefix = product.category?.substring(0, 3).toUpperCase() || 'PRD';
        const brandPrefix = String(product.specs?.brand || '').substring(0, 3).toUpperCase() || 'XXX';
        return `${catPrefix}-${brandPrefix}-${Date.now().toString().slice(-6)}`;
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentProduct.name?.trim()) { alert('Product name is required'); return; }
        if (!currentProduct.specs?.brand) { alert('Brand is required'); return; }
        const apiSpecs = flatToSpecs(currentProduct.specs) as ProductSpec[];
        if (currentProduct.id && products.find(p => p.id === currentProduct.id)) {
            await updateProduct({ ...currentProduct, specs: apiSpecs, price: currentProduct.price, stock: currentProduct.stock, images: currentProduct.images } as any);
        } else {
            const newProduct: Product = {
                ...currentProduct, id: `prod-${Date.now()}`,
                sku: generateSKU(currentProduct),
                name: currentProduct.name || '', price: currentProduct.price || 0,
                stock: currentProduct.stock || 0,
                category: currentProduct.category || Category.PROCESSOR,
                images: currentProduct.images.length > 0 ? currentProduct.images : ['https://picsum.photos/300/300'],
                description: currentProduct.description || '', specs: apiSpecs
            } as Product;
            await addProduct(newProduct, currentProduct.stock || 0, newProductCost);
        }
        setRefreshTrigger(p => !p);
        setIsEditing(false);
        resetForm();
    };

    const handleEdit = (product: Product) => {
        const firstVariant = product.variants?.[0];
        const mainStock = firstVariant?.warehouseInventories?.find((inv: any) => inv.warehouse?.code === 'MAIN')?.quantity
            || firstVariant?.warehouseInventories?.[0]?.quantity || 0;
        setCurrentProduct({
            ...product,
            sku: firstVariant?.sku || '', price: firstVariant?.price || 0, stock: mainStock,
            images: product.media?.length ? product.media.map((m: any) => m.url) : [product.image || 'https://picsum.photos/300/300'],
            specs: specsToFlat(product.specs)
        });
        setPreviewUrl(product.media?.[0]?.url || product.image || null);
        setIsEditing(true);
    };

    const handleDelete = async (productId: string) => {
        await deleteProduct(productId);
        setRefreshTrigger(p => !p);
    };

    const resetForm = () => {
        setCurrentProduct({ id: '', sku: '', name: '', price: 0, stock: 0, category: Category.PROCESSOR, images: ['https://picsum.photos/300/300'], specs: { brand: '' }, description: '' });
        setNewProductCost(0); setPreviewUrl(null); setNewSpecKey(''); setNewSpecValue('');
    };

    const handleCancel = () => { setIsEditing(false); resetForm(); };
    const handleAddNew = () => { resetForm(); setIsEditing(true); };
    const handleCategoryChange = (val: string) => {
        setCurrentProduct({ ...currentProduct, category: val as Category, specs: { brand: '' } });
    };
    const handleSpecChange = (key: string, value: string | number | string[]) => {
        let newSpecs = { ...currentProduct.specs, [key]: value };
        const schema = schemas.find(s => s.category === currentProduct.category);
        if (schema) {
            schema.attributes.forEach(attr => {
                const depKey = attr.key === 'socket' ? 'brand' : attr.dependencyKey;
                if (depKey === key) {
                    const isSatisfied = Array.isArray(value) ? value.includes(attr.dependencyValue || '') : value === attr.dependencyValue;
                    if (!isSatisfied && newSpecs[attr.key] !== undefined) delete newSpecs[attr.key];
                }
            });
        }
        setCurrentProduct({ ...currentProduct, specs: newSpecs });
    };
    const handleMultiSelectToggle = (key: string, option: string) => {
        const curr = (currentProduct.specs?.[key] as string[]) || [];
        handleSpecChange(key, curr.includes(option) ? curr.filter(v => v !== option) : [...curr, option]);
    };
    const addCustomSpec = () => {
        if (newSpecKey.trim() && newSpecValue.trim()) {
            handleSpecChange(newSpecKey.trim(), newSpecValue.trim());
            setNewSpecKey(''); setNewSpecValue('');
        }
    };
    const removeCustomSpec = (key: string) => {
        const newSpecs = { ...currentProduct.specs };
        delete newSpecs[key];
        setCurrentProduct({ ...currentProduct, specs: newSpecs });
    };

    const schemaKeys = currentSchema.map(attr => attr.key);
    const customSpecs = Object.entries(currentProduct.specs || {}).filter(([key]) => !schemaKeys.includes(key) && key !== 'brand');

    // ── Catalog insights (list view only) ──
    const totalCatalogValue = useMemo(() =>
        products.reduce((s, p) => s + (p.variants?.[0]?.price || 0), 0),
        [products]
    );
    const outOfStockCount = useMemo(() =>
        products.filter(p => (p.variants?.[0]?.warehouseInventories?.reduce((a: number, inv: any) => a + inv.quantity, 0) || 0) <= 0).length,
        [products]
    );
    const categoryCount = useMemo(() => new Set(products.map(p => p.category)).size, [products]);
    const brandCount = useMemo(() => new Set(products.map(p => p.brand?.name || p.specs?.find((s: any) => s.key === 'brand')?.value || '')).size, [products]);

    const categoryBreakdown = useMemo(() => {
        const map: Record<string, { count: number; value: number }> = {};
        products.forEach(p => {
            const cat = p.category || 'Other';
            if (!map[cat]) map[cat] = { count: 0, value: 0 };
            map[cat].count++;
            map[cat].value += p.variants?.[0]?.price || 0;
        });
        return Object.entries(map).sort((a, b) => b[1].count - a[1].count).slice(0, 5);
    }, [products]);

    const priceRange = useMemo(() => {
        if (!products.length) return { min: 0, max: 0, avg: 0 };
        const prices = products.map(p => p.variants?.[0]?.price || 0).filter(Boolean);
        return {
            min: Math.min(...prices),
            max: Math.max(...prices),
            avg: Math.round(prices.reduce((a, b) => a + b, 0) / (prices.length || 1))
        };
    }, [products]);

    // ─────────────────────────────────────────────────────────
    // EDIT VIEW
    // ─────────────────────────────────────────────────────────
    if (isEditing) {
        return (
            <div
                className="space-y-5"
                style={{ fontFamily: "'DM Sans', 'Geist', 'system-ui', sans-serif" }}
            >
                {/* Edit Header */}
                <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-2.5">
                        <div className="w-1 h-5 rounded-full bg-indigo-500" />
                        <div>
                            <h2 className="text-base font-bold text-stone-900 tracking-tight">
                                {currentProduct.id ? 'Edit Product' : 'New Product'}
                            </h2>
                            <p className="text-xs text-stone-400 mt-0.5">
                                {currentProduct.id ? `Editing: ${currentProduct.name}` : 'Fill in the details below to add to your catalogue'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleCancel}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-stone-50 text-stone-600 border border-stone-200 text-xs font-semibold transition-colors"
                    >
                        <ArrowLeft size={13} /> Back
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    {/* ── LEFT: General + Specs ── */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* General Info */}
                        <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                            <div className="h-0.5 w-full bg-gradient-to-r from-indigo-400 via-indigo-500 to-violet-400" />
                            <div className="px-5 py-4 border-b border-stone-100 bg-stone-50/50">
                                <SectionLabel icon={<LayoutGrid size={12} />}>General Information</SectionLabel>
                            </div>
                            <div className="p-5">
                                <form onSubmit={handleSave} id="product-form" className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <FieldLabel required>Product Name</FieldLabel>
                                            <Input
                                                required
                                                value={currentProduct.name}
                                                onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                                                placeholder="Enter identifying name…"
                                                className="h-9 text-sm border-stone-200 focus-visible:ring-indigo-400 focus-visible:border-indigo-300 rounded-lg shadow-none"
                                            />
                                        </div>
                                        <div>
                                            <FieldLabel>SKU</FieldLabel>
                                            <Input
                                                value={currentProduct.sku}
                                                onChange={e => setCurrentProduct({ ...currentProduct, sku: e.target.value })}
                                                placeholder="Leave empty for auto-generation"
                                                className="h-9 text-sm font-mono border-stone-200 focus-visible:ring-indigo-400 focus-visible:border-indigo-300 rounded-lg shadow-none"
                                            />
                                        </div>
                                        <div>
                                            <FieldLabel required>Category</FieldLabel>
                                            <Select value={currentProduct.category} onValueChange={handleCategoryChange}>
                                                <SelectTrigger className="h-9 text-sm border-stone-200 focus:ring-indigo-400 rounded-lg shadow-none bg-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-stone-200 shadow-md">
                                                    {Object.values(Category).map(cat => (
                                                        <SelectItem key={cat} value={cat} className="text-xs focus:bg-stone-50">{cat}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <FieldLabel required>Brand</FieldLabel>
                                            <Select value={currentProduct.specs?.brand as string || ''} onValueChange={val => handleSpecChange('brand', val)}>
                                                <SelectTrigger className="h-9 text-sm border-stone-200 focus:ring-indigo-400 rounded-lg shadow-none bg-white">
                                                    <SelectValue placeholder="Select brand…" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-stone-200 shadow-md">
                                                    {availableBrands.map(brand => (
                                                        <SelectItem key={brand.id} value={brand.name} className="text-xs focus:bg-stone-50">{brand.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <FieldLabel>Description</FieldLabel>
                                            <Textarea
                                                value={currentProduct.description}
                                                onChange={e => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                                                placeholder="Technical details and overview…"
                                                className="min-h-[90px] text-sm border-stone-200 focus-visible:ring-indigo-400 focus-visible:border-indigo-300 rounded-lg shadow-none resize-none"
                                            />
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Specifications */}
                        <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-stone-100 bg-stone-50/50">
                                <SectionLabel icon={<Settings2 size={12} />}>Specifications</SectionLabel>
                            </div>
                            <div className="p-5 space-y-5">
                                {currentSchema.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {currentSchema.map(attr => (
                                            <div key={attr.key}>
                                                <FieldLabel>
                                                    {attr.label}{attr.unit && <span className="normal-case text-stone-300 ml-1">({attr.unit})</span>}
                                                </FieldLabel>
                                                {attr.type === 'multi-select' ? (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {attr.options?.map(option => {
                                                            const isSelected = ((currentProduct.specs?.[attr.key] as string[]) || []).includes(option);
                                                            return (
                                                                <button
                                                                    key={option}
                                                                    type="button"
                                                                    onClick={() => handleMultiSelectToggle(attr.key, option)}
                                                                    className={cn(
                                                                        'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors',
                                                                        isSelected
                                                                            ? 'bg-indigo-600 text-white ring-1 ring-indigo-600'
                                                                            : 'bg-stone-50 text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100'
                                                                    )}
                                                                >
                                                                    {option}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                ) : attr.type === 'select' ? (
                                                    <Select value={(currentProduct.specs?.[attr.key] as string) || ''} onValueChange={val => handleSpecChange(attr.key, val)}>
                                                        <SelectTrigger className="h-9 text-xs border-stone-200 focus:ring-indigo-400 rounded-lg shadow-none bg-white">
                                                            <SelectValue placeholder="Select…" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white border-stone-200 shadow-md">
                                                            {attr.options?.map(option => (
                                                                <SelectItem key={option} value={option} className="text-xs focus:bg-stone-50">{option}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <Input
                                                        type={attr.type === 'number' ? 'number' : 'text'}
                                                        className="h-9 text-sm border-stone-200 focus-visible:ring-indigo-400 rounded-lg shadow-none"
                                                        value={currentProduct.specs?.[attr.key] || ''}
                                                        onChange={e => handleSpecChange(attr.key, attr.type === 'number' ? Number(e.target.value) : e.target.value)}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Custom Specs */}
                                <div className="pt-4 border-t border-stone-100 space-y-3">
                                    <SectionLabel icon={<Plus size={11} />}>Custom Specifications</SectionLabel>
                                    {customSpecs.length > 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {customSpecs.map(([key, value]) => (
                                                <div key={key} className="flex items-center gap-2">
                                                    <span className="text-xs text-stone-400 truncate w-24 shrink-0 font-mono" title={key}>{key}</span>
                                                    <Input
                                                        className="h-8 text-xs border-stone-200 focus-visible:ring-indigo-400 rounded-lg shadow-none flex-1"
                                                        value={String(value)}
                                                        onChange={e => handleSpecChange(key, e.target.value)}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeCustomSpec(key)}
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors shrink-0"
                                                    >
                                                        <Trash size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 bg-stone-50 border border-stone-100 rounded-lg p-3 max-w-md">
                                        <Input
                                            placeholder="Key (e.g. Material)"
                                            className="h-8 text-xs border-stone-200 focus-visible:ring-indigo-400 rounded-lg shadow-none w-1/2"
                                            value={newSpecKey}
                                            onChange={e => setNewSpecKey(e.target.value)}
                                        />
                                        <Input
                                            placeholder="Value (e.g. Aluminium)"
                                            className="h-8 text-xs border-stone-200 focus-visible:ring-indigo-400 rounded-lg shadow-none w-1/2"
                                            value={newSpecValue}
                                            onChange={e => setNewSpecValue(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomSpec(); } }}
                                        />
                                        <button
                                            type="button"
                                            onClick={addCustomSpec}
                                            className="h-8 px-3 rounded-lg bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors shrink-0"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT: Media + Pricing + Actions ── */}
                    <div className="space-y-4">

                        {/* Media */}
                        <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-stone-100 bg-stone-50/50">
                                <SectionLabel icon={<ImageIcon size={12} />}>Product Images</SectionLabel>
                            </div>
                            <div className="p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    {currentProduct.images.map((img, index) => (
                                        <div key={index} className="relative group aspect-square bg-stone-50 rounded-lg border border-stone-200 overflow-hidden">
                                            <img src={img} alt={`Product ${index + 1}`} className="w-full h-full object-contain p-2" />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newImages = currentProduct.images.filter((_, i) => i !== index);
                                                    setCurrentProduct({ ...currentProduct, images: newImages.length > 0 ? newImages : ['https://picsum.photos/300/300'] });
                                                }}
                                                className="absolute top-1.5 right-1.5 p-1 bg-white border border-rose-100 text-rose-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-rose-50"
                                            >
                                                <Trash size={11} />
                                            </button>
                                            {index === 0 && (
                                                <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold uppercase tracking-widest bg-white/90 text-stone-600 border border-stone-200 px-1.5 py-0.5 rounded-full">
                                                    Primary
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                    <div className="aspect-square border-2 border-dashed border-stone-200 hover:border-indigo-300 rounded-lg transition-colors flex items-center justify-center bg-stone-50/30">
                                        <ImageUploader
                                            onUploadComplete={handleUploadComplete}
                                            onUploadError={(err: Error) => setUploadError(err.message)}
                                            endpoint="imageUploader"
                                        />
                                    </div>
                                </div>
                                {uploadError && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wide">{uploadError}</p>}
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-stone-100 bg-stone-50/50">
                                <SectionLabel icon={<DollarSign size={12} />}>Pricing & Stock</SectionLabel>
                            </div>
                            <div className="p-5 space-y-4">
                                <div>
                                    <FieldLabel required>Selling Price (₹)</FieldLabel>
                                    <Input
                                        type="number" step="0.01"
                                        className="h-9 text-sm font-mono border-stone-200 focus-visible:ring-indigo-400 rounded-lg shadow-none"
                                        value={currentProduct.price}
                                        onChange={e => setCurrentProduct({ ...currentProduct, price: Number(e.target.value) })}
                                    />
                                </div>
                                {!currentProduct.id && (
                                    <>
                                        <div>
                                            <FieldLabel>Cost Price (₹)</FieldLabel>
                                            <Input
                                                type="number" step="0.01"
                                                className="h-9 text-sm font-mono border-stone-200 focus-visible:ring-indigo-400 rounded-lg shadow-none"
                                                value={newProductCost}
                                                onChange={e => setNewProductCost(Number(e.target.value))}
                                            />
                                        </div>
                                        {newProductCost > 0 && (currentProduct.price || 0) > 0 && (
                                            <div className="px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Est. Margin</span>
                                                <span className="text-sm font-extrabold text-emerald-700 font-mono">
                                                    {Math.round((((currentProduct.price || 0) - newProductCost) / (currentProduct.price || 1)) * 100)}%
                                                </span>
                                            </div>
                                        )}
                                        <div>
                                            <FieldLabel>Initial Stock</FieldLabel>
                                            <Input
                                                type="number"
                                                className="h-9 text-sm font-mono border-stone-200 focus-visible:ring-indigo-400 rounded-lg shadow-none"
                                                value={currentProduct.stock}
                                                onChange={e => setCurrentProduct({ ...currentProduct, stock: Number(e.target.value) })}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Save / Cancel */}
                        <div className="space-y-2">
                            <button
                                type="submit"
                                form="product-form"
                                onClick={handleSave}
                                className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm"
                            >
                                <Save size={13} /> Save Product
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg bg-white hover:bg-stone-50 text-stone-600 border border-stone-200 text-xs font-semibold transition-colors"
                            >
                                <ArrowLeft size={13} /> Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────
    // LIST VIEW
    // ─────────────────────────────────────────────────────────
    return (
        <div
            className="space-y-5"
            style={{ fontFamily: "'DM Sans', 'Geist', 'system-ui', sans-serif" }}
        >
            {/* ─── HEADER ─── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
                <div className="flex items-center gap-2.5">
                    <div className="w-1 h-5 rounded-full bg-indigo-500" />
                    <div>
                        <h2 className="text-base font-bold text-stone-900 tracking-tight">Products</h2>
                        <p className="text-xs text-stone-400 mt-0.5 font-mono">
                            {totalProducts} SKUs in catalogue
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm"
                >
                    <Plus size={13} /> Add Product
                </button>
            </div>

            {/* ─── KPI CARDS ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    {
                        label: 'Catalogue Size',
                        value: products.length,
                        sub: `${categoryCount} categories · ${brandCount} brands`,
                        icon: <Package size={14} />,
                        accent: 'border-l-indigo-400',
                    },
                    {
                        label: 'Avg Selling Price',
                        value: `₹${priceRange.avg.toLocaleString('en-IN')}`,
                        sub: `Range ₹${priceRange.min.toLocaleString('en-IN')} – ₹${priceRange.max.toLocaleString('en-IN')}`,
                        icon: <DollarSign size={14} />,
                        accent: 'border-l-teal-400',
                    },
                    {
                        label: 'Out of Stock',
                        value: outOfStockCount,
                        sub: 'Need immediate attention',
                        icon: <AlertCircle size={14} />,
                        accent: 'border-l-rose-400',
                        alert: outOfStockCount > 0,
                    },
                    {
                        label: 'Catalogue Value',
                        value: `₹${totalCatalogValue.toLocaleString('en-IN')}`,
                        sub: 'Sum of selling prices',
                        icon: <TrendingUp size={14} />,
                        accent: 'border-l-violet-400',
                    },
                ].map((card, idx) => (
                    <div
                        key={idx}
                        className={cn('rounded-xl bg-white border border-stone-200 border-l-4 shadow-sm p-4', card.accent)}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{card.label}</span>
                            <span className={cn('p-1 rounded-md', (card as any).alert ? 'text-rose-400 bg-rose-50' : 'text-stone-400 bg-stone-50')}>
                                {card.icon}
                            </span>
                        </div>
                        <p className="text-2xl font-extrabold text-stone-900 tabular-nums tracking-tight">{card.value}</p>
                        <p className="text-[11px] text-stone-400 mt-0.5">{card.sub}</p>
                    </div>
                ))}
            </div>

            {/* ─── INSIGHTS ROW ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                {/* Category Breakdown */}
                <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                    <div className="h-0.5 w-full bg-gradient-to-r from-indigo-400 via-indigo-500 to-violet-400" />
                    <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/50">
                        <SectionLabel icon={<Tag size={12} />}>Products by Category</SectionLabel>
                    </div>
                    <div className="divide-y divide-stone-50">
                        {categoryBreakdown.length === 0 ? (
                            <div className="px-4 py-5 text-center text-xs text-stone-400">No data</div>
                        ) : categoryBreakdown.map(([cat, data], idx) => {
                            const pct = products.length > 0 ? Math.round((data.count / products.length) * 100) : 0;
                            return (
                                <div key={idx} className="px-4 py-2.5">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="text-xs font-semibold text-stone-700 truncate">{cat}</span>
                                        <span className="text-[10px] font-mono font-bold text-stone-400 tabular-nums shrink-0">
                                            {data.count} SKU{data.count !== 1 ? 's' : ''} · {pct}%
                                        </span>
                                    </div>
                                    <div className="h-1 w-full bg-stone-100 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full bg-indigo-400 transition-all" style={{ width: `${pct}%` }} />
                                    </div>
                                    <p className="text-[10px] text-stone-400 mt-0.5">
                                        Avg ₹{Math.round(data.value / data.count).toLocaleString('en-IN')} / product
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Price Distribution */}
                <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                    <div className="h-0.5 w-full bg-gradient-to-r from-teal-400 via-emerald-400 to-emerald-300" />
                    <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/50">
                        <SectionLabel icon={<BarChart3 size={12} />}>Price & Margin Overview</SectionLabel>
                    </div>
                    <div className="px-4 py-4 space-y-3">
                        {[
                            { label: 'Lowest Price',   value: `₹${priceRange.min.toLocaleString('en-IN')}`,   color: 'text-stone-600', bar: priceRange.max > 0 ? (priceRange.min / priceRange.max) * 100 : 0, barColor: 'bg-stone-300' },
                            { label: 'Average Price',  value: `₹${priceRange.avg.toLocaleString('en-IN')}`,   color: 'text-indigo-600', bar: priceRange.max > 0 ? (priceRange.avg / priceRange.max) * 100 : 0, barColor: 'bg-indigo-400' },
                            { label: 'Highest Price',  value: `₹${priceRange.max.toLocaleString('en-IN')}`,   color: 'text-teal-600',  bar: 100, barColor: 'bg-teal-400' },
                        ].map(({ label, value, color, bar, barColor }) => (
                            <div key={label}>
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{label}</span>
                                    <span className={cn('text-sm font-extrabold font-mono tabular-nums', color)}>{value}</span>
                                </div>
                                <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                                    <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${bar}%` }} />
                                </div>
                            </div>
                        ))}
                        <div className="pt-3 border-t border-stone-100 grid grid-cols-2 gap-3">
                            <div className="px-3 py-2.5 bg-stone-50 border border-stone-100 rounded-lg">
                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">Active Categories</p>
                                <p className="text-lg font-extrabold text-stone-800 tabular-nums">{categoryCount}</p>
                            </div>
                            <div className="px-3 py-2.5 bg-stone-50 border border-stone-100 rounded-lg">
                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">Active Brands</p>
                                <p className="text-lg font-extrabold text-stone-800 tabular-nums">{brandCount}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── PRODUCT TABLE ─── */}
            <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                <div className="h-0.5 w-full bg-gradient-to-r from-indigo-400 via-indigo-500 to-violet-400" />

                {/* Filters */}
                <div className="px-5 py-4 border-b border-stone-100 bg-stone-50/50">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <SectionLabel icon={<Package size={12} />}>Catalogue</SectionLabel>
                            <span className="text-[10px] font-mono font-bold text-stone-400 bg-white border border-stone-200 px-2 py-0.5 rounded-md">
                                {totalProducts}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative">
                                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                <Input
                                    placeholder="Search catalogue…"
                                    className="pl-8 h-8 text-xs bg-white border-stone-200 text-stone-800 placeholder:text-stone-400 focus-visible:ring-indigo-400 focus-visible:border-indigo-300 shadow-none rounded-lg w-44 sm:w-56"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select value={currentCategory} onValueChange={val => updateQueryParams({ category: val })}>
                                <SelectTrigger className="h-8 text-xs w-36 bg-white border-stone-200 text-stone-700 focus:ring-indigo-400 shadow-none rounded-lg">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-stone-200 shadow-md">
                                    <SelectItem value="all" className="text-xs focus:bg-stone-50">All Categories</SelectItem>
                                    {Object.values(Category).map(cat => (
                                        <SelectItem key={cat} value={cat} className="text-xs focus:bg-stone-50">{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={currentStockStatus} onValueChange={val => updateQueryParams({ f_stock_status: val })}>
                                <SelectTrigger className="h-8 text-xs w-36 bg-white border-stone-200 text-stone-700 focus:ring-indigo-400 shadow-none rounded-lg">
                                    <SelectValue placeholder="Availability" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-stone-200 shadow-md">
                                    <SelectItem value="all"          className="text-xs focus:bg-stone-50">Any Availability</SelectItem>
                                    <SelectItem value="In Stock"     className="text-xs focus:bg-stone-50">In Stock</SelectItem>
                                    <SelectItem value="Out of Stock" className="text-xs focus:bg-stone-50">Out of Stock</SelectItem>
                                </SelectContent>
                            </Select>
                            {/* Price range */}
                            <div className="flex items-center gap-1.5 h-8 px-3 bg-white border border-stone-200 rounded-lg">
                                <DollarSign size={12} className="text-stone-400" />
                                <input
                                    type="number"
                                    placeholder="Min"
                                    className="w-14 text-xs font-mono outline-none placeholder:text-stone-400 text-stone-700 bg-transparent"
                                    value={currentMinPrice}
                                    onChange={e => updateQueryParams({ minPrice: e.target.value })}
                                />
                                <span className="text-stone-300 text-sm">—</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    className="w-14 text-xs font-mono outline-none placeholder:text-stone-400 text-stone-700 bg-transparent"
                                    value={currentMaxPrice}
                                    onChange={e => updateQueryParams({ maxPrice: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-stone-100 bg-stone-50/30">
                                <th className="px-5 py-3 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Product</th>
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Category</th>
                                <th className="hidden md:table-cell px-4 py-3 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Brand</th>
                                <th className="hidden lg:table-cell px-4 py-3 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Variants</th>
                                <th className="px-4 py-3 text-right text-[10px] font-bold text-stone-400 uppercase tracking-widest">Price</th>
                                <th className="px-4 py-3 text-right text-[10px] font-bold text-stone-400 uppercase tracking-widest">Stock</th>
                                <th className="px-5 py-3 text-right text-[10px] font-bold text-stone-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                            {isLoadingProducts ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-12 text-center text-xs text-stone-400">Loading products…</td>
                                </tr>
                            ) : paginatedProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-16 text-center">
                                        <Package size={28} className="mx-auto text-stone-300 mb-3" />
                                        <p className="text-xs text-stone-400 mb-2">No products found</p>
                                        <button
                                            onClick={() => router.push(pathname)}
                                            className="text-xs text-indigo-600 font-semibold hover:underline"
                                        >
                                            Clear filters
                                        </button>
                                    </td>
                                </tr>
                            ) : paginatedProducts.map(product => {
                                const firstVar = product.variants?.[0];
                                const brand = product.brand?.name || product.specs?.find((s: any) => s.key === 'brand')?.value || 'Generic';
                                const variantCount = product.variants?.length || 0;
                                const totalStock = firstVar?.warehouseInventories?.reduce((a: number, inv: any) => a + inv.quantity, 0) || 0;

                                return (
                                    <tr key={product.id} className="hover:bg-stone-50/60 transition-colors group">
                                        {/* Product */}
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 shrink-0 bg-stone-100 border border-stone-200 rounded-lg overflow-hidden">
                                                    <img
                                                        className="h-full w-full object-contain p-1"
                                                        src={product.media?.[0]?.url || '/placeholder.png'}
                                                        alt={product.name}
                                                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/300/300'; }}
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-stone-800 truncate tracking-tight leading-tight" title={product.name}>
                                                        {product.name}
                                                    </p>
                                                    <p className="text-[10px] font-mono text-stone-400 mt-0.5">{firstVar?.sku || 'NO-SKU'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Category */}
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full">
                                                {product.category}
                                            </span>
                                        </td>
                                        {/* Brand */}
                                        <td className="hidden md:table-cell px-4 py-3.5 whitespace-nowrap text-xs font-semibold text-stone-500">
                                            {brand}
                                        </td>
                                        {/* Variants */}
                                        <td className="hidden lg:table-cell px-4 py-3.5 whitespace-nowrap">
                                            <span className="text-xs font-mono font-semibold text-stone-500 tabular-nums">
                                                {variantCount} var{variantCount !== 1 ? 's' : ''}
                                            </span>
                                        </td>
                                        {/* Price */}
                                        <td className="px-4 py-3.5 whitespace-nowrap text-right">
                                            <span className="text-sm font-bold text-stone-900 font-mono tabular-nums">
                                                ₹{(firstVar?.price || 0).toLocaleString('en-IN')}
                                            </span>
                                        </td>
                                        {/* Stock status */}
                                        <td className="px-4 py-3.5 whitespace-nowrap text-right">
                                            <div className="flex flex-col items-end gap-0.5">
                                                <StockPill product={product} variant={firstVar} />
                                                <span className="text-[10px] font-mono text-stone-400 tabular-nums">{totalStock} units</span>
                                            </div>
                                        </td>
                                        {/* Actions */}
                                        <td className="px-5 py-3.5 whitespace-nowrap text-right">
                                            <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-white border border-stone-200 hover:bg-stone-50 text-stone-500 transition-colors"
                                                >
                                                    <Edit size={13} />
                                                </button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <button className="h-8 w-8 flex items-center justify-center rounded-lg bg-white border border-stone-200 hover:bg-rose-50 hover:border-rose-200 text-stone-400 hover:text-rose-500 transition-colors">
                                                            <Trash size={13} />
                                                        </button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="bg-white border-stone-200 rounded-xl shadow-xl">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle className="text-base font-bold text-stone-900">Delete product?</AlertDialogTitle>
                                                            <AlertDialogDescription className="text-xs text-stone-400">
                                                                This action cannot be undone. <span className="font-semibold text-stone-700">{product.name}</span> will be permanently removed.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel className="text-xs font-semibold border-stone-200 text-stone-600 hover:bg-stone-50 rounded-lg">Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg"
                                                                onClick={() => handleDelete(product.id)}
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
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!isLoadingProducts && totalProducts > 0 && (
                    <div className="px-5 py-3.5 border-t border-stone-100 bg-stone-50/40 flex items-center justify-between">
                        <p className="text-xs text-stone-400 font-mono tabular-nums">
                            <span className="text-stone-600 font-semibold">{(currentPage - 1) * currentLimit + 1}</span>–<span className="text-stone-600 font-semibold">{Math.min(currentPage * currentLimit, totalProducts)}</span> of <span className="text-stone-600 font-semibold">{totalProducts}</span>
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button
                                disabled={currentPage <= 1}
                                onClick={() => updateQueryParams({ page: String(currentPage - 1) })}
                                className="h-8 w-8 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <span className="px-3 h-8 flex items-center text-xs font-mono font-bold text-stone-600 border border-stone-200 rounded-lg bg-white tabular-nums">
                                {currentPage} / {Math.max(1, Math.ceil(totalProducts / currentLimit))}
                            </span>
                            <button
                                disabled={currentPage >= Math.ceil(totalProducts / currentLimit)}
                                onClick={() => updateQueryParams({ page: String(currentPage + 1) })}
                                className="h-8 w-8 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductManager;