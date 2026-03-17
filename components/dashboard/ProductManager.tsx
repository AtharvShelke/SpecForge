'use client';

import React, { useState, useMemo, useEffect, memo, useCallback, useRef } from 'react';
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
    RefreshCw,
    ChevronDown,
    SlidersHorizontal,
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
import { ScrollArea } from '@/components/ui/scroll-area';

// ─────────────────────────────────────────────────────────────
// SHARED PRIMITIVES — memoized
// ─────────────────────────────────────────────────────────────

const SectionLabel = memo(({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="flex items-center gap-1.5">
        <span className="text-stone-400">{icon}</span>
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em]">{children}</span>
    </div>
));
SectionLabel.displayName = 'SectionLabel';

const FieldLabel = memo(({ children, required }: { children: React.ReactNode; required?: boolean }) => (
    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">
        {children}{required && <span className="text-rose-400 ml-0.5">*</span>}
    </label>
));
FieldLabel.displayName = 'FieldLabel';

// Compute stock once outside render — avoids repeated reduce in render
function getVariantStock(variant: any): number {
    return variant?.warehouseInventories?.reduce((a: number, inv: any) => a + inv.quantity, 0) || 0;
}

const StockPill = memo(({ product, variant }: { product: Product; variant: any }) => {
    const totalStock = getVariantStock(variant);
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
});
StockPill.displayName = 'StockPill';

// ─────────────────────────────────────────────────────────────
// COLLAPSIBLE SECTION — memoized
// ─────────────────────────────────────────────────────────────
const CollapsibleSection = memo(({
    icon,
    title,
    children,
    defaultOpen = true,
    accent,
}: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    accent?: string;
}) => {
    const [open, setOpen] = useState(defaultOpen);
    const toggle = useCallback(() => setOpen(o => !o), []);
    return (
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
            {accent && <div className={cn('h-0.5 w-full', accent)} />}
            <button
                type="button"
                className="w-full px-4 py-3 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between"
                onClick={toggle}
            >
                <SectionLabel icon={icon}>{title}</SectionLabel>
                <ChevronDown size={13} className={cn('text-stone-400 transition-transform duration-200', open && 'rotate-180')} />
            </button>
            {open && <div>{children}</div>}
        </div>
    );
});
CollapsibleSection.displayName = 'CollapsibleSection';

// ─────────────────────────────────────────────────────────────
// PRODUCT TABLE ROW COMPONENTS — memoized to prevent list re-renders
// ─────────────────────────────────────────────────────────────

const DesktopProductRow = memo(({ product, onEdit, onDelete }: {
    product: Product;
    onEdit: (p: Product) => void;
    onDelete: (id: string) => void;
}) => {
    const firstVar = product.variants?.[0];
    const brand = product.brand?.name || product.specs?.find((s: any) => s.key === 'brand')?.value || 'Generic';
    const variantCount = product.variants?.length || 0;
    const totalStock = getVariantStock(firstVar);
    const price = (firstVar?.price || 0).toLocaleString('en-IN');

    const handleEdit = useCallback(() => onEdit(product), [onEdit, product]);
    const handleDelete = useCallback(() => onDelete(product.id), [onDelete, product.id]);

    return (
        <tr className="hover:bg-stone-50/60 transition-colors group">
            <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 shrink-0 bg-stone-100 border border-stone-200 rounded-lg overflow-hidden">
                        <img
                            className="h-full w-full object-contain p-1"
                            src={product.media?.[0]?.url || '/placeholder.png'}
                            alt={product.name}
                            loading="lazy"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/300/300'; }}
                        />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-stone-800 truncate tracking-tight leading-tight" title={product.name}>
                            {product.name}
                        </p>
                        <p className="text-[10px] font-mono text-stone-400 mt-0.5">{firstVar?.sku || 'NO-SKU'}</p>
                    </div>
                </div>
            </td>
            <td className="px-3 py-3 whitespace-nowrap">
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500 bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded-full">
                    {product.category}
                </span>
            </td>
            <td className="hidden md:table-cell px-3 py-3 whitespace-nowrap text-xs font-semibold text-stone-500">
                {brand}
            </td>
            <td className="hidden lg:table-cell px-3 py-3 whitespace-nowrap">
                <span className="text-xs font-mono font-semibold text-stone-500 tabular-nums">
                    {variantCount} var{variantCount !== 1 ? 's' : ''}
                </span>
            </td>
            <td className="px-3 py-3 whitespace-nowrap text-right">
                <span className="text-xs font-bold text-stone-900 font-mono tabular-nums">₹{price}</span>
            </td>
            <td className="px-3 py-3 whitespace-nowrap text-right">
                <div className="flex flex-col items-end gap-0.5">
                    <StockPill product={product} variant={firstVar} />
                    <span className="text-[10px] font-mono text-stone-400 tabular-nums">{totalStock} units</span>
                </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-right">
                <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={handleEdit}
                        className="h-7 w-7 flex items-center justify-center rounded-lg bg-white border border-stone-200 hover:bg-stone-50 text-stone-500 transition-colors"
                    >
                        <Edit size={12} />
                    </button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <button className="h-7 w-7 flex items-center justify-center rounded-lg bg-white border border-stone-200 hover:bg-rose-50 hover:border-rose-200 text-stone-400 hover:text-rose-500 transition-colors">
                                <Trash size={12} />
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white border-stone-200 rounded-xl shadow-xl mx-4">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-sm font-bold text-stone-900">Delete product?</AlertDialogTitle>
                                <AlertDialogDescription className="text-xs text-stone-400">
                                    This cannot be undone. <span className="font-semibold text-stone-700">{product.name}</span> will be permanently removed.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="text-xs font-semibold border-stone-200 text-stone-600 hover:bg-stone-50 rounded-lg">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg"
                                    onClick={handleDelete}
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
});
DesktopProductRow.displayName = 'DesktopProductRow';

const MobileProductCard = memo(({ product, onEdit, onDelete }: {
    product: Product;
    onEdit: (p: Product) => void;
    onDelete: (id: string) => void;
}) => {
    const firstVar = product.variants?.[0];
    const totalStock = getVariantStock(firstVar);
    const price = (firstVar?.price || 0).toLocaleString('en-IN');

    const handleEdit = useCallback(() => onEdit(product), [onEdit, product]);
    const handleDelete = useCallback(() => onDelete(product.id), [onDelete, product.id]);

    return (
        <div className="flex items-center gap-3 px-3 py-3">
            <div className="h-12 w-12 shrink-0 bg-stone-100 border border-stone-200 rounded-lg overflow-hidden">
                <img
                    className="h-full w-full object-contain p-1"
                    src={product.media?.[0]?.url || '/placeholder.png'}
                    alt={product.name}
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/300/300'; }}
                />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-stone-800 truncate tracking-tight">{product.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500 bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded-full">
                        {product.category}
                    </span>
                    <StockPill product={product} variant={firstVar} />
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-stone-900 font-mono tabular-nums">₹{price}</span>
                    <span className="text-[10px] text-stone-400 font-mono">{totalStock} units</span>
                </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                    onClick={handleEdit}
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
                    <AlertDialogContent className="bg-white border-stone-200 rounded-xl shadow-xl mx-4">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-sm font-bold text-stone-900">Delete product?</AlertDialogTitle>
                            <AlertDialogDescription className="text-xs text-stone-400">
                                <span className="font-semibold text-stone-700">{product.name}</span> will be permanently removed.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="text-xs font-semibold border-stone-200 text-stone-600 hover:bg-stone-50 rounded-lg">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg"
                                onClick={handleDelete}
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
});
MobileProductCard.displayName = 'MobileProductCard';

interface ProductFormState extends Omit<Partial<Product>, 'specs'> {
    specs: ProductSpecsFlat;
    price?: number;
    stock?: number;
    sku?: string;
    images: string[];
}

const EMPTY_FORM: ProductFormState = {
    id: '', sku: '', name: '', price: 0, stock: 0,
    category: Category.PROCESSOR,
    images: ['https://picsum.photos/300/300'],
    specs: { brand: '' }, description: ''
};

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
const ProductManager = () => {
    const { products, addProduct, updateProduct, deleteProduct, categories, brands, schemas, syncData, isLoading } = useAdmin();

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [newSpecKey, setNewSpecKey] = useState('');
    const [newSpecValue, setNewSpecValue] = useState('');
    const [showFilters, setShowFilters] = useState(false);

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

    const [showDetail, setShowDetail] = useState(false);

    // Stable ref for search params string to avoid stale closure in fetch effect
    const searchParamsStr = searchParams.toString();

    useEffect(() => {
        if (debouncedSearch !== currentSearchQuery) updateQueryParams({ q: debouncedSearch });
    }, [debouncedSearch]);

    useEffect(() => {
        if (isEditing) return;
        let cancelled = false;
        const fetchPaginatedProducts = async () => {
            setIsLoadingProducts(true);
            try {
                const query = new URLSearchParams(searchParamsStr);
                if (!query.has("limit")) query.set("limit", "10");
                if (!query.has("page")) query.set("page", "1");
                const res = await fetch(`/api/products?${query.toString()}`);
                if (!cancelled && res.ok) {
                    const data = await res.json();
                    setPaginatedProducts(data.products);
                    setTotalProducts(data.total);
                }
            } catch (err) { console.error("Failed to fetch paginated products:", err); }
            finally { if (!cancelled) setIsLoadingProducts(false); }
        };
        fetchPaginatedProducts();
        return () => { cancelled = true; };
    }, [searchParamsStr, isEditing, refreshTrigger]);

    const updateQueryParams = useCallback((newParams: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        if (!newParams.page && (newParams.category !== undefined || newParams.q !== undefined || newParams.f_stock_status !== undefined || newParams.minPrice !== undefined || newParams.maxPrice !== undefined)) {
            params.set("page", "1");
        }
        Object.entries(newParams).forEach(([key, value]) => {
            if (value === null || value === "all" || value === "") params.delete(key);
            else params.set(key, value);
        });
        router.push(`${pathname}?${params.toString()}`);
    }, [searchParams, pathname, router]);

    const [currentProduct, setCurrentProduct] = useState<ProductFormState>(EMPTY_FORM);
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

    const handleUploadComplete = useCallback((url: string) => {
        setPreviewUrl(url);
        setUploadError(null);
        setCurrentProduct(prev => ({
            ...prev,
            images: [...prev.images.filter(img => img !== 'https://picsum.photos/300/300'), url]
        }));
    }, []);

    const generateSKU = useCallback((product: ProductFormState): string => {
        if (product.sku?.trim()) return product.sku.trim();
        const catPrefix = product.category?.substring(0, 3).toUpperCase() || 'PRD';
        const brandPrefix = String(product.specs?.brand || '').substring(0, 3).toUpperCase() || 'XXX';
        return `${catPrefix}-${brandPrefix}-${Date.now().toString().slice(-6)}`;
    }, []);

    const handleSave = useCallback(async (e: React.FormEvent) => {
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
    }, [currentProduct, products, updateProduct, addProduct, newProductCost, generateSKU]);

    const handleEdit = useCallback((product: Product) => {
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
    }, []);

    const handleDelete = useCallback(async (productId: string) => {
        await deleteProduct(productId);
        setRefreshTrigger(p => !p);
    }, [deleteProduct]);

    const resetForm = useCallback(() => {
        setCurrentProduct(EMPTY_FORM);
        setNewProductCost(0); setPreviewUrl(null); setNewSpecKey(''); setNewSpecValue('');
    }, []);

    const handleCancel = useCallback(() => { setIsEditing(false); resetForm(); }, [resetForm]);
    const handleAddNew = useCallback(() => { resetForm(); setIsEditing(true); }, [resetForm]);

    const handleCategoryChange = useCallback((val: string) => {
        setCurrentProduct(prev => ({ ...prev, category: val as Category, specs: { brand: '' } }));
    }, []);

    const handleSpecChange = useCallback((key: string, value: string | number | string[]) => {
        setCurrentProduct(prev => {
            let newSpecs = { ...prev.specs, [key]: value };
            const schema = schemas.find(s => s.category === prev.category);
            if (schema) {
                schema.attributes.forEach(attr => {
                    const depKey = attr.key === 'socket' ? 'brand' : attr.dependencyKey;
                    if (depKey === key) {
                        const isSatisfied = Array.isArray(value) ? value.includes(attr.dependencyValue || '') : value === attr.dependencyValue;
                        if (!isSatisfied && newSpecs[attr.key] !== undefined) delete newSpecs[attr.key];
                    }
                });
            }
            return { ...prev, specs: newSpecs };
        });
    }, [schemas]);

    const handleMultiSelectToggle = useCallback((key: string, option: string) => {
        setCurrentProduct(prev => {
            const curr = (prev.specs?.[key] as string[]) || [];
            const next = curr.includes(option) ? curr.filter(v => v !== option) : [...curr, option];
            return { ...prev, specs: { ...prev.specs, [key]: next } };
        });
    }, []);

    const addCustomSpec = useCallback(() => {
        if (newSpecKey.trim() && newSpecValue.trim()) {
            handleSpecChange(newSpecKey.trim(), newSpecValue.trim());
            setNewSpecKey(''); setNewSpecValue('');
        }
    }, [newSpecKey, newSpecValue, handleSpecChange]);

    const removeCustomSpec = useCallback((key: string) => {
        setCurrentProduct(prev => {
            const newSpecs = { ...prev.specs };
            delete newSpecs[key];
            return { ...prev, specs: newSpecs };
        });
    }, []);

    const toggleFilters = useCallback(() => setShowFilters(f => !f), []);
    const handleSyncData = useCallback(() => syncData(), [syncData]);
    const handleCloseDetail = useCallback(() => setShowDetail(false), []);
    const handleOpenDetail = useCallback(() => setShowDetail(true), []);
    const handleClearFilters = useCallback(() => router.push(pathname), [router, pathname]);

    const activeSchemaSpecs = useMemo(() =>
        currentSchema.filter(attr => attr.required || currentProduct.specs?.[attr.key] !== undefined),
        [currentSchema, currentProduct.specs]
    );

    const schemaKeys = useMemo(() => currentSchema.map(attr => attr.key), [currentSchema]);

    const customSpecs = useMemo(() =>
        Object.entries(currentProduct.specs || {}).filter(([key]) => !schemaKeys.includes(key) && key !== 'brand'),
        [currentProduct.specs, schemaKeys]
    );

    // ── Catalog insights — all in one pass ──
    const { totalCatalogValue, outOfStockCount, categoryCount, brandCount, categoryBreakdown, brandBreakdown, priceRange } = useMemo(() => {
        let totalVal = 0;
        let outOfStock = 0;
        const catMap: Record<string, { count: number; value: number }> = {};
        const brandMap: Record<string, number> = {};
        const catSet = new Set<string>();
        const brandSet = new Set<string>();
        const prices: number[] = [];

        for (const p of products) {
            const firstVar = p.variants?.[0];
            const price = firstVar?.price || 0;
            totalVal += price;
            if (price > 0) prices.push(price);

            const stock = firstVar?.warehouseInventories?.reduce((a: number, inv: any) => a + (inv.quantity || 0), 0) ?? 0;
            if (!firstVar || stock <= 0) outOfStock++;

            const cat = p.category || 'Other';
            catSet.add(cat);
            if (!catMap[cat]) catMap[cat] = { count: 0, value: 0 };
            catMap[cat].count++;
            catMap[cat].value += price;

            const b = p.brand?.name || 'Generic';
            if (p.brand?.name) brandSet.add(p.brand.name);
            brandMap[b] = (brandMap[b] || 0) + 1;
        }

        const sortedCats = Object.entries(catMap).sort((a, b) => b[1].count - a[1].count);
        const sortedBrands = Object.entries(brandMap).sort((a, b) => b[1] - a[1]);

        const priceMin = prices.length ? Math.min(...prices) : 0;
        const priceMax = prices.length ? Math.max(...prices) : 0;
        const priceAvg = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;

        return {
            totalCatalogValue: totalVal,
            outOfStockCount: outOfStock,
            categoryCount: catSet.size,
            brandCount: brandSet.size,
            categoryBreakdown: sortedCats,
            brandBreakdown: sortedBrands,
            priceRange: { min: priceMin, max: priceMax, avg: priceAvg },
        };
    }, [products]);

    // Pre-format values used in KPI cards
    const avgPriceFormatted = priceRange.avg > 999999
        ? `₹${(priceRange.avg / 100000).toFixed(1)}L`
        : `₹${priceRange.avg.toLocaleString('en-IN')}`;
    const totalValueFormatted = totalCatalogValue > 999999
        ? `₹${(totalCatalogValue / 100000).toFixed(1)}L`
        : `₹${totalCatalogValue.toLocaleString('en-IN')}`;
    const minPriceFormatted = `₹${priceRange.min.toLocaleString('en-IN')}`;

    // Profit margin — computed only when relevant inputs change
    const profitMargin = useMemo(() => {
        if (newProductCost <= 0 || !currentProduct.price) return null;
        return Math.round((((currentProduct.price || 0) - newProductCost) / (currentProduct.price || 1)) * 100);
    }, [newProductCost, currentProduct.price]);

    // ─────────────────────────────────────────────────────────
    // EDIT VIEW
    // ─────────────────────────────────────────────────────────
    if (isEditing) {
        return (
            <div
                className="space-y-3 md:space-y-5 pb-20"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
                {/* ─── EDIT HEADER ─── */}
                <div className="flex flex-row items-center justify-between gap-2 px-0.5 sticky top-0 z-20 bg-stone-50/80 backdrop-blur-md py-2 -mt-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-1 h-4 md:h-5 rounded-full bg-indigo-500 shrink-0" />
                        <div className="min-w-0">
                            <h2 className="text-sm md:text-base font-bold text-stone-900 tracking-tight truncate">
                                {currentProduct.id ? 'Edit Product' : 'New Product'}
                            </h2>
                            <p className="hidden md:block text-[11px] text-stone-400 mt-0.5 truncate">
                                {currentProduct.id ? `Editing: ${currentProduct.name}` : 'Add a new item to your catalogue'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <button
                            onClick={handleCancel}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white active:bg-stone-50 text-stone-600 border border-stone-200 text-[11px] font-bold transition-all"
                        >
                            <ArrowLeft size={12} /> <span className="hidden xs:inline">Back</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 active:bg-indigo-700 text-white text-[11px] font-bold transition-all shadow-sm shadow-indigo-100"
                        >
                            <Save size={12} /> Save
                        </button>
                    </div>
                </div>

                {/* ─── MAIN FORM GRID ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-5">

                    {/* ── LEFT: General + Specs ── */}
                    <div className="lg:col-span-2 space-y-3 md:space-y-4">

                        {/* General Information */}
                        <CollapsibleSection
                            icon={<LayoutGrid size={12} />}
                            title="General Details"
                            accent="bg-gradient-to-r from-indigo-400 to-violet-400"
                        >
                            <div className="p-3 md:p-5">
                                <form onSubmit={handleSave} id="product-form" className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                        <div className="sm:col-span-2 md:col-span-1">
                                            <FieldLabel required>Product Name</FieldLabel>
                                            <Input
                                                required
                                                value={currentProduct.name}
                                                onChange={e => setCurrentProduct(prev => ({ ...prev, name: e.target.value }))}
                                                placeholder="Identifying name..."
                                                className="h-10 md:h-9 text-sm rounded-xl border-stone-200 shadow-none focus-visible:ring-indigo-400"
                                            />
                                        </div>
                                        <div>
                                            <FieldLabel>SKU / Serial</FieldLabel>
                                            <Input
                                                value={currentProduct.sku}
                                                onChange={e => setCurrentProduct(prev => ({ ...prev, sku: e.target.value }))}
                                                placeholder="SKU-XXXXX"
                                                className="h-10 md:h-9 text-sm font-mono rounded-xl border-stone-200 shadow-none"
                                            />
                                        </div>
                                        <div>
                                            <FieldLabel required>Category</FieldLabel>
                                            <Select value={currentProduct.category} onValueChange={handleCategoryChange}>
                                                <SelectTrigger className="h-10 md:h-9 text-sm rounded-xl border-stone-200 bg-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-stone-200 shadow-xl rounded-xl">
                                                    {Object.values(Category).map(cat => (
                                                        <SelectItem key={cat} value={cat} className="text-xs py-2 focus:bg-stone-50">{cat}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <FieldLabel required>Brand</FieldLabel>
                                            <Select value={currentProduct.specs?.brand as string || ''} onValueChange={val => handleSpecChange('brand', val)}>
                                                <SelectTrigger className="h-10 md:h-9 text-sm rounded-xl border-stone-200 bg-white">
                                                    <SelectValue placeholder="Select brand..." />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-stone-200 shadow-xl rounded-xl">
                                                    {availableBrands.map(brand => (
                                                        <SelectItem key={brand.id} value={brand.name} className="text-xs py-2 focus:bg-stone-50">{brand.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <FieldLabel>Description</FieldLabel>
                                            <Textarea
                                                value={currentProduct.description}
                                                onChange={e => setCurrentProduct(prev => ({ ...prev, description: e.target.value }))}
                                                placeholder="Enter technical details and overview..."
                                                className="min-h-[100px] text-sm border-stone-200 rounded-xl shadow-none resize-none"
                                            />
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </CollapsibleSection>

                        {/* Specifications */}
                        <CollapsibleSection icon={<Settings2 size={12} />} title="Specifications">
                            <div className="p-3 md:p-5 space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                    {activeSchemaSpecs.map(attr => (
                                        <div key={attr.key} className="relative group">
                                            <FieldLabel required={attr.required}>
                                                {attr.label}{attr.unit && <span className="normal-case text-stone-400 ml-1">({attr.unit})</span>}
                                            </FieldLabel>
                                            {attr.type === 'multi-select' ? (
                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                    {attr.options?.map(option => (
                                                        <button
                                                            key={option} type="button"
                                                            onClick={() => handleMultiSelectToggle(attr.key, option)}
                                                            className={cn(
                                                                'px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all border',
                                                                ((currentProduct.specs?.[attr.key] as string[]) || []).includes(option)
                                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                                    : 'bg-white text-stone-500 border-stone-200 active:bg-stone-50'
                                                            )}
                                                        >
                                                            {option}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <Input
                                                    type={attr.type === 'number' ? 'number' : 'text'}
                                                    className="h-10 md:h-9 text-sm rounded-xl border-stone-200"
                                                    value={currentProduct.specs?.[attr.key] || ''}
                                                    onChange={e => handleSpecChange(attr.key, attr.type === 'number' ? Number(e.target.value) : e.target.value)}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 border-t border-stone-100 space-y-3">
                                    <SectionLabel icon={<Plus size={11} />}>Custom Specifications</SectionLabel>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {customSpecs.map(([key, value]) => (
                                            <div key={key} className="flex items-center gap-2 bg-stone-50/50 p-2 rounded-xl border border-stone-100">
                                                <span className="text-[10px] text-stone-400 font-mono shrink-0 w-16 truncate">{key}</span>
                                                <Input
                                                    className="h-8 text-xs border-stone-200 rounded-lg bg-white flex-1"
                                                    value={String(value)}
                                                    onChange={e => handleSpecChange(key, e.target.value)}
                                                />
                                                <button onClick={() => removeCustomSpec(key)} className="p-1.5 text-rose-400 active:text-rose-600">
                                                    <Trash size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                                        <Input
                                            placeholder="Spec Name (e.g. Weight)"
                                            className="h-9 text-xs border-stone-200 rounded-lg flex-1"
                                            value={newSpecKey}
                                            onChange={e => setNewSpecKey(e.target.value)}
                                        />
                                        <Input
                                            placeholder="Value (e.g. 1.2kg)"
                                            className="h-9 text-xs border-stone-200 rounded-lg flex-1"
                                            value={newSpecValue}
                                            onChange={e => setNewSpecValue(e.target.value)}
                                        />
                                        <button
                                            onClick={addCustomSpec}
                                            className="h-9 px-4 rounded-lg bg-white border border-stone-200 text-xs font-bold text-stone-600 active:bg-stone-100 transition-all"
                                        >
                                            Add Spec
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </CollapsibleSection>
                    </div>

                    {/* ─── RIGHT: Media + Pricing + Inventory ─── */}
                    <div className="space-y-3 md:space-y-4">

                        {/* ─── PRODUCT MEDIA SECTION ─── */}
                        <CollapsibleSection icon={<ImageIcon size={14} />} title="Product Media">
                            <div className="p-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
                                    {currentProduct.images.map((img, index) => (
                                        <div
                                            key={index}
                                            className={cn(
                                                "relative aspect-square rounded-2xl border-2 overflow-hidden bg-white group transition-all",
                                                index === 0 ? "border-indigo-200 shadow-md" : "border-stone-100 shadow-sm"
                                            )}
                                        >
                                            <img
                                                src={img}
                                                className="w-full h-full object-contain p-2"
                                                alt={`Product view ${index + 1}`}
                                                loading="lazy"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newImages = currentProduct.images.filter((_, i) => i !== index);
                                                    setCurrentProduct(prev => ({ ...prev, images: newImages.length > 0 ? newImages : [] }));
                                                }}
                                                className="absolute top-2 right-2 p-2 bg-white/95 backdrop-blur-md border border-rose-100 text-rose-500 rounded-xl shadow-lg opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all active:scale-90"
                                            >
                                                <Trash size={14} />
                                            </button>
                                            {index === 0 && (
                                                <div className="absolute bottom-2 left-2 px-2 py-1 bg-indigo-600 text-[9px] font-black uppercase tracking-widest text-white rounded-lg shadow-sm">
                                                    Primary Cover
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <div className={cn(
                                        "aspect-square border-2 border-dashed rounded-2xl flex items-center justify-center transition-all",
                                        "border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50 hover:border-indigo-400 active:scale-[0.98]",
                                        "relative overflow-hidden group/uploader"
                                    )}>
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="p-3 bg-white rounded-full shadow-sm border border-indigo-100 group-hover/uploader:scale-110 transition-transform">
                                                <Plus size={20} className="text-indigo-600" />
                                            </div>
                                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tight">Add Media</span>
                                        </div>
                                        <ImageUploader
                                            onUploadComplete={handleUploadComplete}
                                            endpoint="imageUploader"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-100">
                                    <p className="text-[10px] text-stone-500 font-medium text-center leading-relaxed">
                                        <span className="text-indigo-600 font-bold">Pro Tip:</span> The first image in the grid is automatically set as your primary thumbnail across the store.
                                    </p>
                                </div>
                            </div>
                        </CollapsibleSection>

                        {/* Pricing & Stock Card */}
                        <CollapsibleSection icon={<DollarSign size={12} />} title="Price & Inventory">
                            <div className="p-4 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                                    <div>
                                        <FieldLabel required>Selling Price (₹)</FieldLabel>
                                        <div className="relative mt-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-mono text-sm">₹</span>
                                            <Input
                                                type="number" step="0.01"
                                                className="h-11 md:h-10 pl-7 text-base md:text-sm font-mono rounded-xl border-stone-200 bg-white shadow-sm focus-visible:ring-indigo-400"
                                                value={currentProduct.price}
                                                onChange={e => setCurrentProduct(prev => ({ ...prev, price: Number(e.target.value) }))}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <FieldLabel>Current Stock Units</FieldLabel>
                                        <div className="relative mt-1">
                                            <Package size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                            <Input
                                                type="number"
                                                className="h-11 md:h-10 pl-9 text-base md:text-sm font-mono rounded-xl border-stone-200 bg-white shadow-sm focus-visible:ring-indigo-400"
                                                value={currentProduct.stock}
                                                onChange={e => setCurrentProduct(prev => ({ ...prev, stock: Number(e.target.value) }))}
                                            />
                                        </div>
                                    </div>
                                </div>
                                {profitMargin !== null && (
                                    <div className="px-3 py-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp size={14} className="text-emerald-600" />
                                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest leading-none">Est. Margin</span>
                                        </div>
                                        <span className="text-sm font-black text-emerald-700 font-mono leading-none">{profitMargin}%</span>
                                    </div>
                                )}
                            </div>
                        </CollapsibleSection>
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
            className="space-y-3"
            style={{ fontFamily: "'DM Sans', 'Geist', 'system-ui', sans-serif" }}
        >
            {/* ─── HEADER ─── */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-1 h-4 rounded-full bg-indigo-500 flex-shrink-0" />
                    <div className="min-w-0">
                        <h2 className="text-sm font-bold text-stone-900 tracking-tight">Products</h2>
                        <p className="text-[11px] text-stone-400 font-mono hidden sm:block">
                            {totalProducts} SKUs in catalogue
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSyncData}
                        disabled={isLoading}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-stone-50 text-stone-600 border border-stone-200 text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw size={11} className={isLoading ? "animate-spin" : ""} />
                        <span className="hidden sm:inline">Sync</span>
                    </button>
                    <button
                        onClick={handleAddNew}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm"
                    >
                        <Plus size={12} />
                        <span>Add</span>
                        <span className="hidden sm:inline"> Product</span>
                    </button>
                </div>
            </div>

            {/* ─── KPI CARDS ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 px-0.5">
                {[
                    {
                        label: 'Catalogue',
                        value: products.length,
                        sub: (
                            <button
                                onClick={handleOpenDetail}
                                className="hover:text-indigo-600 transition-colors flex items-center gap-0.5"
                            >
                                <span className="truncate">{categoryCount} cat · {brandCount} brands</span>
                                <ChevronRight size={8} className="shrink-0" />
                            </button>
                        ),
                        icon: <Package />,
                        accent: 'border-l-indigo-400',
                    },
                    {
                        label: 'Avg Price',
                        value: avgPriceFormatted,
                        sub: `Min ${minPriceFormatted}`,
                        icon: <DollarSign />,
                        accent: 'border-l-teal-400',
                    },
                    {
                        label: 'Out of Stock',
                        value: outOfStockCount,
                        sub: 'Need attention',
                        icon: <AlertCircle />,
                        accent: 'border-l-rose-400',
                        alert: outOfStockCount > 0,
                    },
                    {
                        label: 'Total Value',
                        value: totalValueFormatted,
                        sub: 'Catalogue Sum',
                        icon: <TrendingUp />,
                        accent: 'border-l-violet-400',
                    },
                ].map((card, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            'rounded-xl bg-white border border-stone-200 shadow-sm transition-all',
                            'p-2.5 sm:p-4 border-l-[3px] sm:border-l-4',
                            card.accent
                        )}
                    >
                        <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                            <span className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-tighter sm:tracking-widest truncate mr-1">
                                {card.label}
                            </span>
                            <span className={cn(
                                'p-1 rounded-md shrink-0',
                                (card as any).alert ? 'text-rose-500 bg-rose-50' : 'text-stone-400 bg-stone-50'
                            )}>
                                {React.isValidElement(card.icon)
                                    ? React.cloneElement(card.icon as React.ReactElement<{ size?: number }>, { size: 12 })
                                    : card.icon}
                            </span>
                        </div>
                        <p className="text-base sm:text-lg md:text-xl font-extrabold text-stone-900 tabular-nums tracking-tight leading-none">
                            {card.value}
                        </p>
                        <div className="text-[9px] sm:text-[10px] text-stone-400 mt-1 truncate font-medium">
                            {card.sub}
                        </div>
                    </div>
                ))}
            </div>

            {/* ─── INSIGHTS ROW ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                {/* Category Breakdown */}
                <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                    <div className="h-0.5 w-full bg-gradient-to-r from-indigo-400 via-indigo-500 to-violet-400" />
                    <div className="px-4 py-2.5 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
                        <SectionLabel icon={<Tag size={12} />}>SKUs by Category</SectionLabel>
                        <button onClick={handleOpenDetail} className="text-[10px] font-bold text-indigo-600 hover:underline">View All</button>
                    </div>
                    <ScrollArea className="h-[180px] sm:h-[220px]">
                        <div className="divide-y divide-stone-50 px-4">
                            {categoryBreakdown.length === 0 ? (
                                <div className="py-5 text-center text-xs text-stone-400">No data</div>
                            ) : categoryBreakdown.map(([cat, data], idx) => {
                                const pct = products.length > 0 ? Math.round((data.count / products.length) * 100) : 0;
                                return (
                                    <div key={idx} className="py-2.5">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <span className="text-xs font-semibold text-stone-700 truncate">{cat}</span>
                                            <span className="text-[10px] font-mono font-bold text-stone-400 tabular-nums shrink-0">
                                                {data.count} · {pct}%
                                            </span>
                                        </div>
                                        <div className="h-1 w-full bg-stone-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full bg-indigo-400 transition-all" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </div>

                {/* Brand Breakdown */}
                <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                    <div className="h-0.5 w-full bg-gradient-to-r from-teal-400 via-emerald-400 to-emerald-300" />
                    <div className="px-4 py-2.5 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
                        <SectionLabel icon={<Star size={12} />}>Top Brands</SectionLabel>
                        <button onClick={handleOpenDetail} className="text-[10px] font-bold text-teal-600 hover:underline">View All</button>
                    </div>
                    <ScrollArea className="h-[180px] sm:h-[220px]">
                        <div className="divide-y divide-stone-50 px-4">
                            {brandBreakdown.length === 0 ? (
                                <div className="py-5 text-center text-xs text-stone-400">No data</div>
                            ) : brandBreakdown.slice(0, 10).map(([brand, count], idx) => {
                                const pct = products.length > 0 ? Math.round((count / products.length) * 100) : 0;
                                return (
                                    <div key={idx} className="py-2.5">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <span className="text-xs font-semibold text-stone-700 truncate">{brand}</span>
                                            <span className="text-[10px] font-mono font-bold text-stone-400 tabular-nums shrink-0">
                                                {count} · {pct}%
                                            </span>
                                        </div>
                                        <div className="h-1 w-full bg-stone-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full bg-teal-400 transition-all" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            {/* ─── PRODUCT TABLE ─── */}
            <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                <div className="h-0.5 w-full bg-gradient-to-r from-indigo-400 via-indigo-500 to-violet-400" />

                {/* Filters */}
                <div className="px-3 sm:px-4 py-3 border-b border-stone-100 bg-stone-50/50 space-y-2">
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between px-0.5">
                        <div className="flex items-center justify-between sm:justify-start gap-3">
                            <div className="flex items-center gap-2">
                                <SectionLabel icon={<Package size={12} />}>Catalogue</SectionLabel>
                                <span className="text-[10px] font-mono font-bold text-stone-400 bg-white border border-stone-200 px-2 py-0.5 rounded-md shadow-sm">
                                    {totalProducts}
                                </span>
                            </div>
                            <button
                                onClick={toggleFilters}
                                className={cn(
                                    'sm:hidden flex items-center justify-center h-9 w-9 rounded-xl border transition-all active:scale-95 shadow-sm',
                                    showFilters
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                        : 'bg-white border-stone-200 text-stone-600'
                                )}
                            >
                                <SlidersHorizontal size={16} />
                            </button>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-64 md:w-80">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                <Input
                                    placeholder="Search catalogue..."
                                    className="pl-9 h-10 sm:h-9 text-xs bg-white border-stone-200 text-stone-800 placeholder:text-stone-400 focus-visible:ring-indigo-400 rounded-xl w-full shadow-sm"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={toggleFilters}
                                className={cn(
                                    'hidden sm:flex items-center gap-2 h-9 px-3.5 rounded-xl border text-xs font-bold transition-all active:scale-95 shadow-sm',
                                    showFilters
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                                )}
                            >
                                <SlidersHorizontal size={14} />
                                <span>Filters</span>
                            </button>
                        </div>
                    </div>

                    {showFilters && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            <Select value={currentCategory} onValueChange={val => updateQueryParams({ category: val })}>
                                <SelectTrigger className="h-8 text-xs w-32 sm:w-36 bg-white border-stone-200 text-stone-700 focus:ring-indigo-400 shadow-none rounded-lg">
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
                                <SelectTrigger className="h-8 text-xs w-32 sm:w-36 bg-white border-stone-200 text-stone-700 focus:ring-indigo-400 shadow-none rounded-lg">
                                    <SelectValue placeholder="Availability" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-stone-200 shadow-md">
                                    <SelectItem value="all" className="text-xs focus:bg-stone-50">Any Availability</SelectItem>
                                    <SelectItem value="In Stock" className="text-xs focus:bg-stone-50">In Stock</SelectItem>
                                    <SelectItem value="Out of Stock" className="text-xs focus:bg-stone-50">Out of Stock</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-1 h-8 px-2.5 bg-white border border-stone-200 rounded-lg">
                                <DollarSign size={11} className="text-stone-400" />
                                <input
                                    type="number"
                                    placeholder="Min"
                                    className="w-12 text-xs font-mono outline-none placeholder:text-stone-400 text-stone-700 bg-transparent"
                                    value={currentMinPrice}
                                    onChange={e => updateQueryParams({ minPrice: e.target.value })}
                                />
                                <span className="text-stone-300">—</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    className="w-12 text-xs font-mono outline-none placeholder:text-stone-400 text-stone-700 bg-transparent"
                                    value={currentMaxPrice}
                                    onChange={e => updateQueryParams({ maxPrice: e.target.value })}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-stone-100 bg-stone-50/30">
                                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Product</th>
                                <th className="px-3 py-2.5 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Category</th>
                                <th className="hidden md:table-cell px-3 py-2.5 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Brand</th>
                                <th className="hidden lg:table-cell px-3 py-2.5 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Variants</th>
                                <th className="px-3 py-2.5 text-right text-[10px] font-bold text-stone-400 uppercase tracking-widest">Price</th>
                                <th className="px-3 py-2.5 text-right text-[10px] font-bold text-stone-400 uppercase tracking-widest">Stock</th>
                                <th className="px-4 py-2.5 text-right text-[10px] font-bold text-stone-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                            {isLoadingProducts ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-10 text-center text-xs text-stone-400">Loading products…</td>
                                </tr>
                            ) : paginatedProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-12 text-center">
                                        <Package size={24} className="mx-auto text-stone-300 mb-2" />
                                        <p className="text-xs text-stone-400 mb-1.5">No products found</p>
                                        <button onClick={handleClearFilters} className="text-xs text-indigo-600 font-semibold hover:underline">
                                            Clear filters
                                        </button>
                                    </td>
                                </tr>
                            ) : paginatedProducts.map(product => (
                                <DesktopProductRow key={product.id} product={product} onEdit={handleEdit} onDelete={handleDelete} />
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="sm:hidden divide-y divide-stone-100">
                    {isLoadingProducts ? (
                        <div className="p-8 text-center text-xs text-stone-400">Loading products…</div>
                    ) : paginatedProducts.length === 0 ? (
                        <div className="p-10 text-center">
                            <Package size={24} className="mx-auto text-stone-300 mb-2" />
                            <p className="text-xs text-stone-400 mb-1.5">No products found</p>
                            <button onClick={handleClearFilters} className="text-xs text-indigo-600 font-semibold hover:underline">Clear filters</button>
                        </div>
                    ) : paginatedProducts.map(product => (
                        <MobileProductCard key={product.id} product={product} onEdit={handleEdit} onDelete={handleDelete} />
                    ))}
                </div>

                {/* Pagination */}
                {!isLoadingProducts && totalProducts > 0 && (
                    <div className="px-3 sm:px-5 py-3 border-t border-stone-100 bg-stone-50/40 flex items-center justify-between">
                        <p className="text-xs text-stone-400 font-mono tabular-nums">
                            <span className="text-stone-600 font-semibold">{(currentPage - 1) * currentLimit + 1}</span>–<span className="text-stone-600 font-semibold">{Math.min(currentPage * currentLimit, totalProducts)}</span>
                            <span className="hidden sm:inline"> of <span className="text-stone-600 font-semibold">{totalProducts}</span></span>
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button
                                disabled={currentPage <= 1}
                                onClick={() => updateQueryParams({ page: String(currentPage - 1) })}
                                className="h-8 w-8 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={13} />
                            </button>
                            <span className="px-3 h-8 flex items-center text-xs font-mono font-bold text-stone-600 border border-stone-200 rounded-lg bg-white tabular-nums">
                                {currentPage} / {Math.max(1, Math.ceil(totalProducts / currentLimit))}
                            </span>
                            <button
                                disabled={currentPage >= Math.ceil(totalProducts / currentLimit)}
                                onClick={() => updateQueryParams({ page: String(currentPage + 1) })}
                                className="h-8 w-8 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={13} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Breakdown Dialog ─── */}
            <AlertDialog open={showDetail} onOpenChange={setShowDetail}>
                <AlertDialogContent className="bg-white border-stone-200 rounded-2xl shadow-2xl w-[calc(100vw-2rem)] sm:max-w-4xl max-h-[90dvh] flex flex-col p-0 overflow-hidden">
                    <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-teal-500" />

                    <AlertDialogHeader className="px-4 sm:px-6 py-4 border-b border-stone-100 bg-stone-50/30 flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                                <BarChart3 size={16} />
                            </div>
                            <div>
                                <AlertDialogTitle className="text-base font-bold text-stone-900 tracking-tight">
                                    Catalogue Intelligence
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-[10px] text-stone-400 mt-0.5 font-medium uppercase tracking-wider">
                                    {products.length} SKUs · {categoryCount} categories · {brandCount} brands
                                </AlertDialogDescription>
                            </div>
                        </div>
                        <button onClick={handleCloseDetail} className="p-1.5 hover:bg-stone-100 rounded-full text-stone-400 transition-colors">
                            <X size={16} />
                        </button>
                    </AlertDialogHeader>

                    <div className="flex-1 overflow-auto">
                        <div className="grid grid-cols-3 gap-2 p-4 border-b border-stone-50 bg-white">
                            {[
                                { label: 'Total SKUs', value: products.length, cls: 'text-stone-800' },
                                { label: 'Categories', value: categoryCount, cls: 'text-indigo-600' },
                                { label: 'Brands', value: brandCount, cls: 'text-teal-600' },
                            ].map(item => (
                                <div key={item.label} className="p-3 rounded-xl border border-stone-100 bg-stone-50/20 text-center">
                                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{item.label}</p>
                                    <p className={cn('text-xl font-black tabular-nums', item.cls)}>{item.value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <SectionLabel icon={<Tag size={12} />}>By Category</SectionLabel>
                                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-stone-400 border-stone-200">
                                            {categoryCount} total
                                        </Badge>
                                    </div>
                                    <div className="space-y-3">
                                        {categoryBreakdown.map(([cat, data], i) => (
                                            <div key={i} className="group">
                                                <div className="flex items-center justify-between mb-1.5 px-0.5">
                                                    <span className="text-xs font-bold text-stone-700 tracking-tight group-hover:text-indigo-600 transition-colors">
                                                        {cat}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold text-stone-400">
                                                            {Math.round((data.count / products.length) * 100)}%
                                                        </span>
                                                        <span className="text-xs font-mono font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-lg min-w-[2rem] text-center">
                                                            {data.count}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="h-1.5 w-full bg-stone-50 rounded-full overflow-hidden border border-stone-100 shadow-inner">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-700 rounded-full"
                                                        style={{ width: `${(data.count / products.length) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <SectionLabel icon={<Star size={12} />}>By Brand</SectionLabel>
                                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-stone-400 border-stone-200">
                                            {brandCount} total
                                        </Badge>
                                    </div>
                                    <div className="space-y-3">
                                        {brandBreakdown.map(([brand, count], i) => (
                                            <div key={i} className="group">
                                                <div className="flex items-center justify-between mb-1.5 px-0.5">
                                                    <span className="text-xs font-bold text-stone-700 tracking-tight group-hover:text-teal-600 transition-colors">
                                                        {brand}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold text-stone-400">
                                                            {Math.round((count / products.length) * 100)}%
                                                        </span>
                                                        <span className="text-xs font-mono font-extrabold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-lg min-w-[2rem] text-center">
                                                            {count}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="h-1.5 w-full bg-stone-50 rounded-full overflow-hidden border border-stone-100 shadow-inner">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-700 rounded-full"
                                                        style={{ width: `${(count / products.length) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-stone-100 bg-stone-50/50 flex justify-end">
                        <AlertDialogCancel asChild>
                            <button
                                onClick={handleCloseDetail}
                                className="px-5 py-2 rounded-xl bg-white border border-stone-200 text-xs font-black text-stone-600 hover:bg-stone-50 transition-all shadow-sm active:scale-95"
                            >
                                Close
                            </button>
                        </AlertDialogCancel>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default ProductManager;