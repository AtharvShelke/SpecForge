'use client'
import React, { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { Category, Product, CompatibilityLevel, specsToFlat } from '@/types';
import { useShop } from '@/context/ShopContext';
import { useBuild } from '@/context/BuildContext';
import {
    Search, Plus, CheckCircle, AlertTriangle, XCircle, Filter,
    Grid2x2, ChevronLeft, ChevronRight, ChevronDown, List,
    BarChart2, ArrowUpDown, ArrowLeft, SlidersHorizontal, X, Zap,
    Check, Hammer
} from 'lucide-react';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { validateBuild } from '@/services/compatibility';
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar';
import { CategoryNode, BUILD_SEQUENCE } from '@/data/categoryTree';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageTitle } from '@/components/layout/PageTitle';
import Image from 'next/image';
import BuildProgressSidebar from '@/components/build/BuildProgressSidebar';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_MAX_PRICE = 500000;

/* ─────────────────────────────── Skeleton Card ─────────────────────────────── */
const SkeletonCard = () => (
    <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden animate-pulse">
        <div className="aspect-square bg-gradient-to-br from-zinc-100 to-zinc-50" />
        <div className="p-4 space-y-3">
            <div className="h-3 bg-zinc-100 rounded-full w-1/3" />
            <div className="h-4 bg-zinc-100 rounded-full w-full" />
            <div className="h-3 bg-zinc-100 rounded-full w-2/3" />
            <div className="pt-2 flex items-center justify-between">
                <div className="h-5 bg-zinc-100 rounded-full w-1/4" />
                <div className="h-8 w-20 bg-zinc-100 rounded-xl" />
            </div>
        </div>
    </div>
);

const SkeletonList = () => (
    <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden animate-pulse flex h-[150px]">
        <div className="w-40 bg-gradient-to-br from-zinc-100 to-zinc-50 flex-shrink-0" />
        <div className="p-5 flex-1 space-y-3 flex flex-col justify-center">
            <div className="h-3 bg-zinc-100 rounded-full w-1/4" />
            <div className="h-4 bg-zinc-100 rounded-full w-3/4" />
            <div className="h-3 bg-zinc-100 rounded-full w-1/2" />
            <div className="flex items-center justify-between pt-1">
                <div className="h-5 bg-zinc-100 rounded-full w-1/5" />
                <div className="h-8 w-20 bg-zinc-100 rounded-xl" />
            </div>
        </div>
    </div>
);

/* ─────────────────────────────── Product Card ─────────────────────────────── */
const ProductCard = ({
    product, inCart, cartQuantity, isIncompatible, isWarning, addToCart, onRemove, onUpdateQty, handleCompareToggle, compareItems, viewMode, index
}: any) => {
    const price = product.variants?.[0]?.price || 0;
    const compareAt = product.variants?.[0]?.compareAtPrice;
    const status = product.variants?.[0]?.status;
    const isOutOfStock = status === 'OUT_OF_STOCK';
    const isLowStock = status === 'LOW_STOCK';
    const image = product.media?.[0]?.url;
    const flatSpecs = specsToFlat(product.specs);
    const specKeys = Object.keys(flatSpecs).slice(0, 3);
    const isCompared = !!compareItems.find((i: any) => i.id === product.id);
    const discount = compareAt && compareAt > price ? Math.round((1 - price / compareAt) * 100) : null;

    const compatDot = isIncompatible
        ? 'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]'
        : isWarning
            ? 'bg-amber-400 shadow-[0_0_4px_rgba(245,158,11,0.4)]'
            : 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.4)]';

    const compatLabel = isIncompatible ? 'Incompatible' : isWarning ? 'Check specs' : 'Compatible';

    /* ── LIST VIEW ── */
    if (viewMode === 'list') {
        return (
            <div
                className="group bg-white border border-zinc-100 rounded-2xl overflow-hidden flex transition-all duration-200 hover:border-zinc-200 hover:shadow-[0_6px_24px_rgba(0,0,0,0.06)] card-enter"
                style={{ animationDelay: `${index * 30}ms` }}
            >
                {/* Image */}
                <Link
                    href={`/products/${product.id}`}
                    className="relative w-36 flex-shrink-0 bg-zinc-50 flex items-center justify-center overflow-hidden"
                >
                    {image ? (
                        <Image
                            src={image}
                            alt={product.name}
                            fill
                            sizes="144px"
                            className="object-contain p-3 mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.05]"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-200 text-xs">No Image</div>
                    )}
                    {(isOutOfStock || isLowStock) && (
                        <span className={`absolute top-2 left-2 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide z-10 ${isOutOfStock ? 'bg-red-500' : 'bg-amber-500'}`}>
                            {isOutOfStock ? 'Out of Stock' : 'Low Stock'}
                        </span>
                    )}
                </Link>

                {/* Content */}
                <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                    <div>
                        <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${inCart ? 'text-indigo-500' : 'text-zinc-400'}`}>
                            {product.category}
                        </p>
                        <Link href={`/products/${product.id}`}>
                            <h3 className="font-semibold text-zinc-900 text-sm leading-snug line-clamp-2 hover:text-indigo-600 transition-colors">
                                {product.name}
                            </h3>
                        </Link>
                        {specKeys.length > 0 && (
                            <p className="text-[10px] text-zinc-400 mt-1 truncate">
                                {specKeys.map(k => String(flatSpecs[k])).join(' · ')}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-between mt-3 gap-2">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-base font-bold text-zinc-900 tracking-tight">
                                ₹{price.toLocaleString('en-IN')}
                            </span>
                            {discount && (
                                <span className="text-[10px] text-zinc-400 line-through">
                                    ₹{compareAt!.toLocaleString('en-IN')}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${compatDot}`} title={compatLabel} />

                            <button
                                onClick={(e) => handleCompareToggle(e, product)}
                                className={`h-7 px-3 text-[10px] font-bold rounded-xl border transition-all ${isCompared
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                        : 'border-zinc-200 text-zinc-400 hover:border-zinc-300 hover:text-zinc-700'
                                    }`}
                            >
                                {isCompared ? '✓ Compared' : 'Compare'}
                            </button>

                            {inCart ? (
                                <div className="flex items-center gap-1 h-7 bg-emerald-50 border border-emerald-200 rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => cartQuantity <= 1 ? onRemove(product.id) : onUpdateQty(product.id, cartQuantity - 1)}
                                        className="w-7 h-7 flex items-center justify-center text-emerald-700 hover:bg-emerald-100 transition-colors font-bold text-sm"
                                    >
                                        −
                                    </button>
                                    <span className="text-[11px] font-bold text-emerald-700 min-w-[16px] text-center">{cartQuantity}</span>
                                    <button
                                        onClick={() => addToCart(product)}
                                        className="w-7 h-7 flex items-center justify-center text-emerald-700 hover:bg-emerald-100 transition-colors font-bold text-sm"
                                    >
                                        +
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => addToCart(product)}
                                    disabled={isOutOfStock || (isIncompatible && !inCart)}
                                    className={`h-7 px-3.5 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all duration-200 flex items-center gap-1 ${isOutOfStock || (isIncompatible && !inCart)
                                            ? 'bg-zinc-50 text-zinc-300 cursor-not-allowed border border-zinc-100'
                                            : 'bg-zinc-900 text-white hover:bg-indigo-600 hover:shadow-md hover:shadow-indigo-200/50 active:scale-95'
                                        }`}
                                >
                                    {isOutOfStock ? 'Sold Out' : <><Plus size={10} strokeWidth={3} /> Add</>}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ── GRID VIEW ── */
    return (
        <div
            className={`group bg-white border rounded-2xl overflow-hidden flex flex-col h-full relative card-enter transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 ${inCart
                    ? 'border-indigo-200 shadow-[0_0_0_2px_#c7d2fe]'
                    : 'border-zinc-100 hover:border-zinc-200'
                } ${isIncompatible && !inCart ? 'opacity-45' : ''}`}
            style={{ animationDelay: `${index * 40}ms` }}
        >
            {/* Image Zone */}
            <div className="relative overflow-hidden bg-zinc-50 aspect-square flex items-center justify-center">
                <Link href={`/products/${product.id}`} className="absolute inset-0 z-10">
                    <span className="sr-only">View {product.name}</span>
                </Link>

                {image ? (
                    <div className="w-full h-full relative transition-transform duration-400 group-hover:scale-[1.05]">
                        <Image
                            src={image}
                            alt={product.name}
                            fill
                            sizes="(max-width: 768px) 50vw, 25vw"
                            className="object-contain p-4 mix-blend-multiply"
                            loading="lazy"
                        />
                    </div>
                ) : (
                    <div className="text-zinc-200 text-xs">No Image</div>
                )}

                {/* Discount badge — top left */}
                {discount && !isOutOfStock && (
                    <span className="absolute top-2.5 left-2.5 z-20 bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                        -{discount}%
                    </span>
                )}

                {/* Stock badge — top left */}
                {(isOutOfStock || isLowStock) && (
                    <span className={`absolute top-2.5 left-2.5 z-20 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${isOutOfStock ? 'bg-red-500' : 'bg-amber-500'}`}>
                        {isOutOfStock ? 'Out of Stock' : 'Low Stock'}
                    </span>
                )}

                {/* Selected checkmark — top right */}
                <AnimatePresence>
                    {inCart && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                            className="absolute top-2.5 right-2.5 z-20 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/30"
                        >
                            <Check size={11} strokeWidth={3} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Compare button — top right, fades in on hover (hidden when in cart) */}
                {!inCart && (
                    <button
                        onClick={(e) => handleCompareToggle(e, product)}
                        className={`absolute top-2.5 right-2.5 z-20 h-7 px-2.5 rounded-full text-[9px] font-bold uppercase tracking-wider border shadow-sm transition-all duration-200 ${isCompared
                                ? 'opacity-100 bg-indigo-600 text-white border-indigo-600'
                                : 'opacity-0 group-hover:opacity-100 bg-white/95 text-zinc-500 border-zinc-200 hover:text-zinc-900 hover:border-zinc-300'
                            }`}
                    >
                        {isCompared ? '✓' : '⊕'} Compare
                    </button>
                )}

                {/* Compat dot — bottom right */}
                <div
                    className={`absolute bottom-2.5 right-2.5 z-20 w-2 h-2 rounded-full border-2 border-white ${compatDot}`}
                    title={compatLabel}
                />
            </div>

            {/* Content */}
            <div className="p-3.5 flex flex-col flex-1">
                <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${inCart ? 'text-indigo-500' : 'text-zinc-400'}`}>
                    {product.category}
                </p>

                <Link href={`/products/${product.id}`}>
                    <h3 className="font-semibold text-zinc-900 text-[12px] leading-snug line-clamp-2 min-h-[32px] hover:text-indigo-600 transition-colors">
                        {product.name}
                    </h3>
                </Link>

                {specKeys.length > 0 && (
                    <p className="text-[10px] text-zinc-400 mt-1.5 truncate">
                        {specKeys.map(k => String(flatSpecs[k])).join(' · ')}
                    </p>
                )}

                <div className="mt-auto pt-2.5 border-t border-zinc-50 flex items-center justify-between gap-1.5">
                    <div>
                        <span className="text-sm font-bold text-zinc-900 tracking-tight">
                            ₹{price.toLocaleString('en-IN')}
                        </span>
                        {discount && (
                            <span className="ml-1 text-[10px] text-zinc-400 line-through">
                                ₹{compareAt!.toLocaleString('en-IN')}
                            </span>
                        )}
                    </div>

                    {inCart ? (
                        <div className="flex items-center gap-0.5 h-7 bg-emerald-50 border border-emerald-200 rounded-xl overflow-hidden">
                            <button
                                onClick={() => cartQuantity <= 1 ? onRemove(product.id) : onUpdateQty(product.id, cartQuantity - 1)}
                                className="w-7 h-7 flex items-center justify-center text-emerald-700 hover:bg-emerald-100 transition-colors font-bold text-sm"
                            >
                                −
                            </button>
                            <span className="text-[11px] font-bold text-emerald-700 min-w-[16px] text-center">{cartQuantity}</span>
                            <button
                                onClick={() => addToCart(product)}
                                className="w-7 h-7 flex items-center justify-center text-emerald-700 hover:bg-emerald-100 transition-colors font-bold text-sm"
                            >
                                +
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => addToCart(product)}
                            disabled={(isIncompatible && !inCart) || isOutOfStock}
                            className={`h-7 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all duration-200 flex items-center gap-1 ${isOutOfStock || (isIncompatible && !inCart)
                                    ? 'bg-zinc-50 text-zinc-300 cursor-not-allowed border border-zinc-100'
                                    : 'bg-zinc-900 text-white hover:bg-indigo-600 hover:shadow-md hover:shadow-indigo-200/50 active:scale-95'
                                }`}
                        >
                            {isOutOfStock ? 'Sold Out' : <><Plus size={10} strokeWidth={3} /> Add</>}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ─────────────────────────────── Main Component ─────────────────────────────── */
const ProductsContent: React.FC<{ initialData?: any }> = ({ initialData }) => {
    const {
        addToCart,
        removeFromCart,
        updateQuantity,
        cart,
        compareItems,
        addToCompare,
        removeFromCompare,
        categories
    } = useShop();
    const { isBuildMode, toggleBuildMode } = useBuild();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const initialCategoryParam = searchParams.get('category');
    const initialQueryParam = searchParams.get('q');
    const initialModeParam = searchParams.get('mode');

    const initialTab = useMemo(() => {
        if (initialQueryParam) return null;
        if (initialCategoryParam && categories.length > 0) {
            const found = categories.find(n => n.label === initialCategoryParam || n.category === initialCategoryParam);
            if (found) return found;
        }
        return categories.length > 0 ? categories[0] : null;
    }, [initialCategoryParam, categories, initialQueryParam]);

    const [searchTerm, setSearchTerm] = useState(searchParams?.get('q') || '');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const [activeTab, setActiveTab] = useState<CategoryNode | null>(initialTab);
    const [selectedNode, setSelectedNode] = useState<CategoryNode | null>(null);
    const [sidebarSearchTerm, setSidebarSearchTerm] = useState('');
    const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>(() => {
        const filters: Record<string, string[]> = {};
        searchParams.forEach((value, key) => {
            if (key.startsWith('f_')) {
                const actualKey = key.slice(2);
                if (!filters[actualKey]) filters[actualKey] = [];
                filters[actualKey].push(value);
            }
        });
        return filters;
    });
    const [priceRange, setPriceRange] = useState({
        min: Number(searchParams.get('minPrice')) || 0,
        max: Number(searchParams.get('maxPrice')) || DEFAULT_MAX_PRICE
    });
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
    const ITEMS_PER_PAGE = 12;

    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [fetchedProducts, setFetchedProducts] = useState<Product[]>(initialData?.products || []);
    const [totalCount, setTotalCount] = useState(initialData?.total || 0);
    const [availableFilters, setAvailableFilters] = useState<{ brands: string[], specs: Record<string, string[]> } | null>(initialData?.filterOptions || null);

    const [sortOption, setSortOption] = useState(searchParams?.get('sort') || 'price-asc');
    const [viewMode, setViewMode] = useState(searchParams?.get('view') || 'grid');

    const categoryNavRef = useRef<HTMLDivElement | null>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const updateScrollButtons = () => {
        const el = categoryNavRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 0);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };

    useEffect(() => { updateScrollButtons(); }, [categories]);

    const scrollCategories = (direction: "left" | "right") => {
        const el = categoryNavRef.current;
        if (!el) return;
        el.scrollBy({ left: direction === "left" ? -el.clientWidth * 0.6 : el.clientWidth * 0.6, behavior: "smooth" });
    };

    const hasInitializedCategories = useRef(false);
    useEffect(() => {
        if (categories.length > 0 && !hasInitializedCategories.current) {
            hasInitializedCategories.current = true;
            const q = searchParams.get('q');
            if (q) { setActiveTab(null); return; }
            if (initialCategoryParam) {
                const found = categories.find(n => n.label === initialCategoryParam || n.category === initialCategoryParam);
                if (found) { setActiveTab(found); return; }
            }
            setActiveTab(categories[0]);
        }
    }, [categories, initialCategoryParam, searchParams]);

    useEffect(() => {
        if (!activeTab && categories.length > 0 && !searchTerm && hasInitializedCategories.current) {
            setActiveTab(categories[0]);
        }
    }, [activeTab, categories, searchTerm]);

    useEffect(() => {
        if (initialModeParam === 'build' && !isBuildMode) toggleBuildMode();
    }, [initialModeParam]);

    const prevActiveTab = useRef<Category | undefined>(undefined);
    useEffect(() => {
        if (!activeTab) return;
        if (prevActiveTab.current === undefined) { prevActiveTab.current = activeTab.category; return; }
        if (prevActiveTab.current !== activeTab.category) {
            prevActiveTab.current = activeTab.category;
            setSelectedNode(null);
            setSelectedFilters({});
            setPriceRange({ min: 0, max: DEFAULT_MAX_PRICE });
            setCurrentPage(1);
        }
    }, [activeTab]);

    const hasHydratedNode = useRef(false);
    useEffect(() => {
        const subLabel = searchParams?.get('sub');
        if (subLabel && activeTab?.children && !hasHydratedNode.current) {
            const findNode = (nodes: CategoryNode[]): CategoryNode | null => {
                for (const n of nodes) {
                    if (n.label === subLabel) return n;
                    if (n.children) { const f = findNode(n.children); if (f) return f; }
                }
                return null;
            };
            const foundNode = findNode(activeTab.children);
            if (foundNode) setSelectedNode(foundNode);
            hasHydratedNode.current = true;
        }
    }, [activeTab, searchParams]);

    const prevUrlState = useRef<string>('');
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams();
        if (activeTab) params.set('category', activeTab.label);
        if (selectedNode) params.set('sub', selectedNode.label);
        if (isBuildMode) params.set('mode', 'build');
        if (debouncedSearchTerm) params.set('q', debouncedSearchTerm);
        if (sidebarSearchTerm) params.set('sq', sidebarSearchTerm);
        if (priceRange.min > 0) params.set('minPrice', priceRange.min.toString());
        if (priceRange.max < DEFAULT_MAX_PRICE) params.set('maxPrice', priceRange.max.toString());
        Object.keys(selectedFilters).sort().forEach(key => {
            [...selectedFilters[key]].sort().forEach(v => params.append(`f_${key}`, v));
        });
        if (currentPage > 1) params.set('page', currentPage.toString());
        if (sortOption !== 'price-asc') params.set('sort', sortOption);
        if (viewMode !== 'grid') params.set('view', viewMode);
        params.sort();
        const newUrlStr = params.toString();
        if (prevUrlState.current !== newUrlStr) {
            prevUrlState.current = newUrlStr;
            const currentParams = new URLSearchParams(window.location.search);
            currentParams.delete('_rsc');
            currentParams.sort();
            if (currentParams.toString() !== newUrlStr) {
                window.history.replaceState(null, '', `${pathname}?${newUrlStr}`);
            }
        }
    }, [activeTab, selectedNode, isBuildMode, debouncedSearchTerm, sidebarSearchTerm, priceRange, selectedFilters, currentPage, pathname, sortOption, viewMode]);

    const prevCartLength = useRef(cart.length);
    const prevBuildMode = useRef(isBuildMode);
    useEffect(() => {
        if (!isBuildMode) { prevBuildMode.current = false; return; }
        const cartAdded = cart.length > prevCartLength.current;
        const modeToggled = isBuildMode && !prevBuildMode.current;
        if (cartAdded || modeToggled) {
            const nextMissingCat = BUILD_SEQUENCE.find(cat => !cart.some(item => item.category === cat));
            if (nextMissingCat) {
                const nextNode = categories.find(node => node.category === nextMissingCat);
                if (nextNode) { setActiveTab(nextNode); setSelectedFilters({}); }
            }
        }
        prevCartLength.current = cart.length;
        prevBuildMode.current = isBuildMode;
    }, [cart, isBuildMode, categories]);

    const handleBuildCategorySelect = (category: Category) => {
        const node = categories.find(n => n.category === category);
        if (node) setActiveTab(node);
    };

    const handleFilterChange = (key: string, value: string) => {
        setSelectedFilters(prev => {
            const current = prev[key] || [];
            const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
            if (updated.length === 0) { const { [key]: _, ...rest } = prev; return rest; }
            return { ...prev, [key]: updated };
        });
    };

    const clearAllFilters = () => {
        setSelectedNode(null);
        setSelectedFilters({});
        setPriceRange({ min: 0, max: DEFAULT_MAX_PRICE });
        setSidebarSearchTerm('');
    };

    const prevParamsRef = useRef<string>('');
    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoadingProducts(true);
            try {
                const params = new URLSearchParams();
                if (activeTab) params.set('category', String(activeTab.category));
                if (selectedNode?.brand) params.set('nodeBrand', selectedNode.brand);
                if (selectedNode?.query) params.set('nodeQuery', selectedNode.query);
                if (isBuildMode) {
                    const cpu = cart.find(i => i.category === Category.PROCESSOR);
                    const mobo = cart.find(i => i.category === Category.MOTHERBOARD);
                    const activeCategory = activeTab?.category;
                    const cpuSpecs = cpu ? specsToFlat(cpu.specs) : null;
                    const moboSpecs = mobo ? specsToFlat(mobo.specs) : null;
                    if (activeCategory === Category.MOTHERBOARD && cpuSpecs?.socket) params.set('f_specs.socket', cpuSpecs.socket as string);
                    if (activeCategory === Category.PROCESSOR && moboSpecs?.socket) params.set('f_specs.socket', moboSpecs.socket as string);
                    if (activeCategory === Category.RAM && (cpuSpecs || moboSpecs)) {
                        const type = moboSpecs?.ramType || cpuSpecs?.ramType;
                        if (type) params.set('f_specs.ramType', type as string);
                    }
                }
                if (debouncedSearchTerm) params.set('q', debouncedSearchTerm);
                if (sidebarSearchTerm) params.set('sq', sidebarSearchTerm);
                Object.keys(selectedFilters).sort().forEach(key => {
                    [...selectedFilters[key]].sort().forEach(v => params.append(key.startsWith('specs.') ? `f_${key}` : `f_${key}`, v));
                });
                if (priceRange.min > 0) params.set('minPrice', priceRange.min.toString());
                if (priceRange.max < DEFAULT_MAX_PRICE) params.set('maxPrice', priceRange.max.toString());
                if (sortOption !== 'popularity') params.set('sort', sortOption);
                params.set('page', currentPage.toString());
                params.set('limit', ITEMS_PER_PAGE.toString());
                params.sort();
                const queryString = params.toString();
                if (prevParamsRef.current === queryString) { setIsLoadingProducts(false); return; }
                prevParamsRef.current = queryString;
                const res = await fetch(`/api/products?${queryString}&getFilters=true`);
                const data = await res.json();
                if (data.products) {
                    setFetchedProducts(data.products);
                    setTotalCount(data.total || 0);
                    if (data.filterOptions) setAvailableFilters(data.filterOptions);
                }
            } catch (err) {
                console.error("Failed to fetch products:", err);
            } finally {
                setIsLoadingProducts(false);
            }
        };
        fetchProducts();
    }, [activeTab, selectedNode, isBuildMode, cart, debouncedSearchTerm, sidebarSearchTerm, selectedFilters, priceRange, sortOption, currentPage]);

    useEffect(() => { setCurrentPage(1); }, [activeTab, selectedNode, debouncedSearchTerm, sidebarSearchTerm, selectedFilters, priceRange, sortOption]);

    const paginatedProducts = fetchedProducts;
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    const checkCompatibility = (product: Product) => {
        const hypotheticalCart = [...cart, { ...product, quantity: 1, selectedVariant: product.variants?.[0] || {} as any }];
        return validateBuild(hypotheticalCart);
    };

    const handleCompareToggle = (e: React.MouseEvent, product: Product) => {
        e.preventDefault();
        e.stopPropagation();
        compareItems.find(item => item.id === product.id)
            ? removeFromCompare(product.id)
            : addToCompare(product);
    };

    const handlePriceChange = (min: number, max: number) => setPriceRange({ min, max });

    const hasActiveFilters = selectedNode || Object.keys(selectedFilters).length > 0 || priceRange.min > 0 || priceRange.max < DEFAULT_MAX_PRICE;
    const categoryBaseProducts = useMemo(() => [], [activeTab]);

    const activeFilterCount = (selectedNode ? 1 : 0)
        + Object.values(selectedFilters).reduce((a, v) => a + v.length, 0)
        + (priceRange.min > 0 || priceRange.max < DEFAULT_MAX_PRICE ? 1 : 0);

    return (
        <PageLayout bgClass="bg-stone-50">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Instrument+Serif:ital@0;1&display=swap');

                * { font-family: 'DM Sans', system-ui, sans-serif; }
                .display-font { font-family: 'Instrument Serif', Georgia, serif; }

                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

                .scrollbar-thin::-webkit-scrollbar { width: 4px; }
                .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
                .scrollbar-thin::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 4px; }

                .card-enter {
                    animation: cardFadeUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
                }
                @keyframes cardFadeUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .category-pill {
                    transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
                }
                .filter-chip {
                    animation: chipIn 0.2s ease both;
                }
                @keyframes chipIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }

                /* Subtle dot grid pattern */
                .dot-grid-bg {
                    background-image: radial-gradient(circle, #d4d4d8 1px, transparent 1px);
                    background-size: 24px 24px;
                }
            `}</style>

            {/* ── TOP NAV BAR ── */}
            <PageLayout.Header compact>
                <div className="flex flex-col gap-0">

                    {/* Row 1: Category pills + Search + Controls */}
                    <div className="flex items-center gap-2">

                        {/* Category pills — scrollable, takes remaining space */}
                        <div className="relative flex-1 min-w-0 group/nav">
                            {canScrollLeft && (
                                <button onClick={() => scrollCategories('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-white shadow-md border border-zinc-200 rounded-full flex items-center justify-center text-zinc-600 hover:text-zinc-900 opacity-0 group-hover/nav:opacity-100 transition-opacity">
                                    <ChevronLeft size={12} />
                                </button>
                            )}
                            <nav ref={categoryNavRef} onScroll={updateScrollButtons} className="flex overflow-x-auto scrollbar-hide gap-1 ">
                                {categories.map((node) => {
                                    const isActive = activeTab?.label === node.label;
                                    const hasChildren = node.children && node.children.length > 0;

                                    if (!hasChildren) {
                                        return (
                                            <button
                                                key={node.label}
                                                onClick={() => { setSearchTerm(''); setActiveTab(node); }}
                                                className={`category-pill flex-shrink-0 whitespace-nowrap px-3.5 py-1.5 text-sm font-medium rounded-full transition-all ${isActive
                                                    ? 'bg-zinc-900 text-white shadow-sm'
                                                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-white hover:shadow-sm border border-transparent hover:border-zinc-200'
                                                    }`}
                                            >
                                                {node.label}
                                            </button>
                                        );
                                    }

                                    return (
                                        <HoverCard key={node.label} openDelay={100} closeDelay={150}>
                                            <HoverCardTrigger asChild>
                                                <button
                                                    onClick={() => { setSearchTerm(''); setActiveTab(node); setSelectedNode(null); }}
                                                    className={`category-pill flex-shrink-0 whitespace-nowrap flex items-center gap-1 px-3.5 py-1.5 text-sm font-medium rounded-full transition-all ${isActive
                                                        ? 'bg-zinc-900 text-white shadow-sm'
                                                        : 'text-zinc-500 hover:text-zinc-900 hover:bg-white hover:shadow-sm border border-transparent hover:border-zinc-200'
                                                        }`}
                                                >
                                                    {node.label}
                                                    <ChevronDown size={12} className="opacity-50" />
                                                </button>
                                            </HoverCardTrigger>
                                            <HoverCardContent align="start" className="w-[180px] bg-white border border-zinc-100 shadow-xl rounded-2xl p-1.5 z-50 flex flex-col gap-0.5">
                                                <button
                                                    onClick={() => { setSearchTerm(''); setActiveTab(node); setSelectedNode(null); }}
                                                    className={`w-full text-left text-sm font-medium rounded-xl px-3 py-2 transition-colors ${!selectedNode && isActive ? 'bg-indigo-50 text-indigo-700' : 'text-zinc-700 hover:bg-zinc-50'}`}
                                                >
                                                    All {node.label}
                                                </button>
                                                {node.children?.map((subNode) => (
                                                    <button
                                                        key={subNode.label}
                                                        onClick={() => { setSearchTerm(''); setActiveTab(node); setSelectedNode(subNode); }}
                                                        className={`w-full text-left text-sm rounded-xl px-3 py-2 transition-colors ${selectedNode?.label === subNode.label && isActive ? 'bg-indigo-50 text-indigo-700' : 'text-zinc-600 hover:bg-zinc-50'}`}
                                                    >
                                                        {subNode.label}
                                                    </button>
                                                ))}
                                            </HoverCardContent>
                                        </HoverCard>
                                    );
                                })}
                            </nav>
                            {canScrollRight && (
                                <button onClick={() => scrollCategories('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-white shadow-md border border-zinc-200 rounded-full flex items-center justify-center text-zinc-600 hover:text-zinc-900 opacity-0 group-hover/nav:opacity-100 transition-opacity">
                                    <ChevronRight size={12} />
                                </button>
                            )}
                        </div>





                        

                            

                        {/* Mobile: search + filter */}
                        <div className="flex sm:hidden items-center gap-2">
                            <div className="relative group">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" strokeWidth={2} />
                                <input
                                    type="text"
                                    className="w-36 h-8 pl-8 pr-7 bg-white border border-zinc-200 rounded-xl text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all shadow-sm"
                                    placeholder="Search…"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        if (e.target.value.length > 0 && activeTab) { setActiveTab(null); clearAllFilters(); }
                                    }}
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400"><X size={11} /></button>
                                )}
                            </div>
                            <button
                                onClick={() => setIsMobileFiltersOpen(true)}
                                className="relative flex items-center gap-1 h-8 px-2.5 bg-white border border-zinc-200 rounded-xl text-zinc-700 text-xs font-medium hover:bg-zinc-50 transition-all shadow-sm"
                            >
                                <SlidersHorizontal size={13} />
                                {activeFilterCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Desktop mobile-filter btn (lg hidden) */}
                        <button
                            onClick={() => setIsMobileFiltersOpen(true)}
                            className="lg:hidden sm:flex hidden relative items-center gap-1.5 h-8 px-2.5 bg-white border border-zinc-200 rounded-xl text-zinc-700 font-medium text-xs hover:bg-zinc-50 transition-all shadow-sm flex-shrink-0"
                        >
                            <SlidersHorizontal size={13} />
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </PageLayout.Header>

            <PageLayout.Content className="flex-1 overflow-hidden" padding="sm" container={false}>
                <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 h-full">
                    <div className="flex h-full gap-6">

                        {/* ── SIDEBAR ── */}
                        <aside className="hidden lg:block w-72 flex-shrink-0 h-full">
                            {activeTab && (
                                <Sidebar
                                    nodes={activeTab.children || []}
                                    onSelect={setSelectedNode}
                                    selectedNode={selectedNode}
                                    priceRange={priceRange}
                                    onPriceChange={handlePriceChange}
                                    activeCategory={activeTab.category}
                                    onBuildStepChange={handleBuildCategorySelect}
                                    currentProducts={categoryBaseProducts}
                                    dynamicFilters={availableFilters}
                                    selectedFilters={selectedFilters}
                                    onFilterChange={handleFilterChange}
                                    onClearFilters={clearAllFilters}
                                    sidebarSearchTerm={sidebarSearchTerm}
                                    onSidebarSearchChange={setSidebarSearchTerm}
                                />
                            )}
                        </aside>

                        {/* ── MOBILE SIDEBAR ── */}
                        {isMobileFiltersOpen && activeTab && (
                            <div className="fixed inset-0 z-50 lg:hidden">
                                <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileFiltersOpen(false)} />
                                <div className="absolute inset-y-0 left-0 w-full max-w-sm bg-white shadow-2xl h-full rounded-r-2xl overflow-hidden">
                                    <Sidebar
                                        nodes={activeTab.children || []}
                                        onSelect={setSelectedNode}
                                        selectedNode={selectedNode}
                                        onCloseMobile={() => setIsMobileFiltersOpen(false)}
                                        priceRange={priceRange}
                                        onPriceChange={handlePriceChange}
                                        activeCategory={activeTab.category}
                                        onBuildStepChange={handleBuildCategorySelect}
                                        currentProducts={categoryBaseProducts}
                                        dynamicFilters={availableFilters}
                                        selectedFilters={selectedFilters}
                                        onFilterChange={handleFilterChange}
                                        onClearFilters={clearAllFilters}
                                        sidebarSearchTerm={sidebarSearchTerm}
                                        onSidebarSearchChange={setSidebarSearchTerm}
                                    />
                                </div>
                            </div>
                        )}

                        {/* ── MAIN CONTENT ── */}
                        <main className="flex-1 min-h-0 min-w-0 flex flex-col">

                            {/* Toolbar */}
                            <div className="flex-shrink-0 mb-5">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                    <div className="flex items-baseline gap-3">
                                        <h2 className="text-lg font-semibold text-zinc-900">
                                            {activeTab?.label || (searchTerm ? `"${searchTerm}"` : 'All Products')}
                                        </h2>
                                        <span className="text-sm text-zinc-400 font-medium">
                                            {totalCount.toLocaleString()} {totalCount === 1 ? 'product' : 'products'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">

                                        {/* Search */}
                                        <div className="relative w-52 flex-shrink-0 group hidden sm:block">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 group-focus-within:text-zinc-600 transition-colors" strokeWidth={2} />
                                            <input
                                                type="text"
                                                className="w-full h-8 pl-9 pr-8 bg-white border border-zinc-200 rounded-xl text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all shadow-sm"
                                                placeholder="Search…"
                                                value={searchTerm}
                                                onChange={(e) => {
                                                    setSearchTerm(e.target.value);
                                                    if (e.target.value.length > 0 && activeTab) {
                                                        setActiveTab(null);
                                                        clearAllFilters();
                                                    }
                                                }}
                                            />
                                            {searchTerm && (
                                                <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors">
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Sort */}
                                        <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3 py-2 shadow-sm text-sm text-zinc-600">
                                            <ArrowUpDown size={14} className="text-zinc-400" />
                                            <select
                                                className="bg-transparent font-medium text-zinc-700 focus:outline-none cursor-pointer text-sm"
                                                value={sortOption}
                                                onChange={(e) => setSortOption(e.target.value)}
                                            >
                                                <option value="price-asc">Price: Low → High</option>
                                                <option value="price-desc">Price: High → Low</option>
                                                <option value="name-asc">Name: A → Z</option>
                                                <option value="name-desc">Name: Z → A</option>
                                            </select>
                                        </div>

                                        {/* View Toggle */}
                                        <div className="flex items-center bg-white border border-zinc-200 rounded-xl p-1 shadow-sm gap-0.5">
                                            <button
                                                onClick={() => setViewMode("grid")}
                                                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-700'}`}
                                                title="Grid View"
                                            >
                                                <Grid2x2 size={15} />
                                            </button>
                                            <button
                                                onClick={() => setViewMode("list")}
                                                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-700'}`}
                                                title="List View"
                                            >
                                                <List size={15} />
                                            </button>
                                        </div>
                                        {/* Start a Build */}
                        <Link
                            href="/builds/new"
                            className="hidden lg:inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm flex-shrink-0"
                        >
                            <Hammer size={11} />
                            Build
                        </Link>
                                    </div>
                                </div>

                                {/* Active Filter chips */}
                                {hasActiveFilters && (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Filters:</span>
                                        {selectedNode && (
                                            <span className="filter-chip inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 text-white text-xs font-medium rounded-full">
                                                {selectedNode.label}
                                                <button onClick={() => setSelectedNode(null)} className="hover:text-zinc-300 transition-colors"><X size={11} /></button>
                                            </span>
                                        )}
                                        {Object.entries(selectedFilters).map(([key, values]) =>
                                            values.map(val => (
                                                <span key={`${key}-${val}`} className="filter-chip inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-full border border-zinc-200">
                                                    {val}
                                                    <button onClick={() => handleFilterChange(key, val)} className="text-zinc-400 hover:text-zinc-700"><X size={11} /></button>
                                                </span>
                                            ))
                                        )}
                                        {(priceRange.min > 0 || priceRange.max < DEFAULT_MAX_PRICE) && (
                                            <span className="filter-chip inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-full border border-zinc-200">
                                                ₹{priceRange.min.toLocaleString()} – ₹{priceRange.max.toLocaleString()}
                                                <button onClick={() => setPriceRange({ min: 0, max: DEFAULT_MAX_PRICE })} className="text-zinc-400 hover:text-zinc-700"><X size={11} /></button>
                                            </span>
                                        )}
                                        <button onClick={clearAllFilters} className="text-xs font-medium text-zinc-400 hover:text-zinc-700 transition-colors underline underline-offset-2 ml-1">
                                            Clear all
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* ── PRODUCT GRID / LIST ── */}
                            <div className="flex-1 overflow-y-auto scrollbar-thin pb-10">

                                {/* Loading skeleton */}
                                {isLoadingProducts && (
                                    <div className={`grid gap-4 ${viewMode === 'list'
                                        ? 'grid-cols-1'
                                        : isBuildMode
                                            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
                                            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                                        }`}>
                                        {Array.from({ length: 8 }).map((_, i) =>
                                            viewMode === 'list' ? <SkeletonList key={i} /> : <SkeletonCard key={i} />
                                        )}
                                    </div>
                                )}

                                {/* Empty State */}
                                {!isLoadingProducts && paginatedProducts.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-24 text-center">
                                        <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-4">
                                            <Search size={24} className="text-zinc-300" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-zinc-900 mb-2">No products found</h3>
                                        <p className="text-zinc-400 text-sm max-w-xs">Try adjusting your filters or search terms to find what you're looking for.</p>
                                        <button
                                            onClick={() => { clearAllFilters(); setSearchTerm(''); }}
                                            className="mt-6 px-6 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors"
                                        >
                                            Clear all filters
                                        </button>
                                    </div>
                                )}

                                {/* Products */}
                                {!isLoadingProducts && paginatedProducts.length > 0 && (
                                    <div className={`grid gap-4 ${viewMode === 'list'
                                        ? isBuildMode ? 'grid-cols-1' : 'grid-cols-1 2xl:grid-cols-2'
                                        : isBuildMode
                                            ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3'
                                            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                                        }`}>
                                        {paginatedProducts.map((product, index) => {
                                            const compatReport = checkCompatibility(product);
                                            const isIncompatible = compatReport.status === CompatibilityLevel.INCOMPATIBLE;
                                            const isWarning = compatReport.status === CompatibilityLevel.WARNING;
                                            const inCart = cart.find((c) => c.id === product.id);

                                            return (
                                                <ProductCard
                                                    key={product.id}
                                                    product={product}
                                                    inCart={!!inCart}
                                                    cartQuantity={inCart?.quantity ?? 0}
                                                    isIncompatible={isIncompatible}
                                                    isWarning={isWarning}
                                                    addToCart={addToCart}
                                                    onRemove={removeFromCart}
                                                    onUpdateQty={updateQuantity}
                                                    handleCompareToggle={handleCompareToggle}
                                                    compareItems={compareItems}
                                                    viewMode={viewMode}
                                                    index={index}
                                                />
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Pagination */}
                                {!isLoadingProducts && paginatedProducts.length > 0 && totalPages > 1 && (
                                    <div className="mt-12 flex items-center justify-center gap-2">
                                        <button
                                            disabled={currentPage <= 1}
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                                        >
                                            <ChevronLeft size={15} /> Prev
                                        </button>

                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                                let page = i + 1;
                                                if (totalPages > 7) {
                                                    if (currentPage <= 4) page = i + 1;
                                                    else if (currentPage >= totalPages - 3) page = totalPages - 6 + i;
                                                    else page = currentPage - 3 + i;
                                                }
                                                return (
                                                    <button
                                                        key={page}
                                                        onClick={() => setCurrentPage(page)}
                                                        className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${currentPage === page
                                                            ? 'bg-zinc-900 text-white shadow-sm'
                                                            : 'text-zinc-500 hover:text-zinc-900 hover:bg-white hover:shadow-sm'
                                                            }`}
                                                    >
                                                        {page}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <button
                                            disabled={currentPage >= totalPages}
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                                        >
                                            Next <ChevronRight size={15} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </main>

                        <BuildProgressSidebar
                            activeCategory={activeTab?.category}
                            onStepClick={handleBuildCategorySelect}
                        />
                    </div>
                </div>

                {/* ── COMPARE BAR ── */}
                {compareItems.length > 0 && (
                    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-zinc-100 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
                        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="flex items-center gap-4 w-full sm:w-auto overflow-x-auto scrollbar-hide">
                                <div className="flex-shrink-0">
                                    <p className="font-semibold text-zinc-900 text-sm">Compare</p>
                                    <p className="text-[11px] text-zinc-400">{compareItems.length} selected</p>
                                </div>
                                <div className="w-px h-6 bg-zinc-100 hidden sm:block" />
                                <div className="flex items-center gap-2">
                                    {compareItems.map((item: any) => (
                                        <div key={item.id} className="relative w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center group flex-shrink-0">
                                            <Image src={item.media?.[0]?.url || '/placeholder.png'} alt={item.name} fill sizes="40px" className="p-1.5 object-contain mix-blend-multiply" />
                                            <button
                                                onClick={() => removeFromCompare(item.id)}
                                                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white border border-zinc-200 rounded-full text-zinc-400 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                            >
                                                <X size={9} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                    onClick={() => compareItems.forEach((item: any) => removeFromCompare(item.id))}
                                    className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors px-3 py-2 font-medium"
                                >
                                    Clear
                                </button>
                                <Link
                                    href="/compare"
                                    className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${compareItems.length >= 2
                                        ? 'bg-zinc-900 text-white hover:bg-indigo-600 shadow-sm'
                                        : 'bg-zinc-100 text-zinc-300 cursor-not-allowed'
                                        }`}
                                    onClick={(e) => { if (compareItems.length < 2) e.preventDefault(); }}
                                >
                                    <BarChart2 size={15} />
                                    Compare {compareItems.length >= 2 ? 'Now' : `(${compareItems.length}/2)`}
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </PageLayout.Content>
        </PageLayout>
    );
};

const ProductsClient: React.FC<{ initialData?: any }> = ({ initialData }) => (
    <Suspense fallback={
        <div className="h-screen flex items-center justify-center bg-stone-50">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-800 rounded-full animate-spin" />
                <p className="text-sm text-zinc-400 font-medium">Loading catalog…</p>
            </div>
        </div>
    }>
        <ProductsContent initialData={initialData} />
    </Suspense>
);

export default ProductsClient;