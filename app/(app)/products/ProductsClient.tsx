'use client'

import { useState, useMemo, useEffect, useRef, useCallback, memo, Suspense } from 'react';
import { Category, CategoryNode, Product, CompatibilityLevel, specsToFlat } from '@/types';
import { useShop } from '@/context/ShopContext';
import {
    Search, Plus, CheckCircle, AlertTriangle, XCircle, Filter,
    Grid2x2, ChevronLeft, ChevronRight, ChevronDown, List,
    BarChart2, ArrowUpDown, ArrowLeft, SlidersHorizontal, X, Zap,
    Check, Hammer
} from 'lucide-react';
import { validateBuild } from '@/lib/calculations/compatibility';
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar';
import { PageLayout } from '@/components/layout/PageLayout';
import Image from 'next/image';
import BuildProgressSidebar from '@/components/build/BuildProgressSidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { useBuildSequence } from '@/hooks/useBuildSequence';

// ── Constants (module scope — never recreated) ────────────────────────────────

const DEFAULT_MAX_PRICE = 500000;
const ITEMS_PER_PAGE = 12;
const ALL_PRODUCTS_TAB: CategoryNode = { label: 'All' };

function getNodeCategoryCode(node?: CategoryNode | null) {
    if (!node?.category) return '';
    return typeof node.category === 'string'
        ? node.category
        : node.category.code ?? node.category.slug ?? '';
}

function getSubcategorySlug(node?: CategoryNode | null, parentTab?: CategoryNode | null) {
    if (!node?.label || !parentTab?.category) return '';
    const categoryCode = getNodeCategoryCode(parentTab);
    if (!categoryCode) return '';
    // Convert to slug format: categorycode-subcategoryname (lowercase, hyphens)
    return `${categoryCode.toLowerCase()}-${node.label.toLowerCase().replace(/\s+/g, '-')}`;
}

function getProductCategoryCode(product: Product | { category?: Category | string | null }) {
    if (!product?.category) return '';
    return typeof product.category === 'string'
        ? product.category
        : product.category.code ?? product.category.slug ?? '';
}

// Style string hoisted — never recreated on re-render
// @import removed from runtime <style>; move the two <link> tags to layout.tsx:
//   <link rel="preconnect" href="https://fonts.googleapis.com" />
//   <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
//   <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@...&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
const PAGE_STYLES = `
  *{font-family:'DM Sans',system-ui,sans-serif}
  .display-font{font-family:'Instrument Serif',Georgia,serif}
  .scrollbar-hide::-webkit-scrollbar{display:none}
  .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
  .scrollbar-thin::-webkit-scrollbar{width:4px}
  .scrollbar-thin::-webkit-scrollbar-track{background:transparent}
  .scrollbar-thin::-webkit-scrollbar-thumb{background:#e4e4e7;border-radius:4px}
  .card-enter{animation:cardFadeUp 0.35s cubic-bezier(0.22,1,0.36,1) both}
  @keyframes cardFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  .category-pill{transition:all 0.2s cubic-bezier(0.22,1,0.36,1)}
  .filter-chip{animation:chipIn 0.2s ease both}
  @keyframes chipIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}
  .dot-grid-bg{background-image:radial-gradient(circle,#d4d4d8 1px,transparent 1px);background-size:24px 24px}
  .subcategory-dropdown{animation:fadeSlideDown 0.15s ease-out both}
  @keyframes fadeSlideDown{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
` as const;

const EMPTY_ARRAY: Product[] = [];

// ── Skeleton components (stable, no props) ────────────────────────────────────

const SkeletonCard = memo(function SkeletonCard() {
    return (
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
});

const SkeletonList = memo(function SkeletonList() {
    return (
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
});

// Pre-built skeleton arrays — avoids Array.from({ length: 8 }) on every render
const SKELETON_KEYS = [0, 1, 2, 3, 4, 5, 6, 7] as const;

// ── ProductCard ───────────────────────────────────────────────────────────────

const ProductCard = memo(function ProductCard({ product, inCart, cartQuantity, isIncompatible, isWarning, addToCart, onRemove, onUpdateQty, handleCompareToggle, compareItems, viewMode, index }: any) {
    const price = product.price ?? 0;
    const compareAt = product.compareAtPrice;
    const status = product.stockStatus;
    const isOutOfStock = status === 'OUT_OF_STOCK';
    const image = product.media?.[0]?.url;
    const flatSpecs = useMemo(() => specsToFlat(product.specs), [product.specs]);
    const specKeys = useMemo(() => Object.keys(flatSpecs).slice(0, 2), [flatSpecs]);
    const isCompared = useMemo(() => !!compareItems.find((i: any) => i.id === product.id), [compareItems, product.id]);
    const discount = compareAt && compareAt > price ? Math.round((1 - price / compareAt) * 100) : null;
    const compatDot = isIncompatible ? 'bg-red-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-500';

    const handleDecrement = useCallback(() => {
        cartQuantity <= 1 ? onRemove(product.id) : onUpdateQty(product.id, cartQuantity - 1);
    }, [cartQuantity, onRemove, onUpdateQty, product.id]);

    const handleAdd = useCallback(() => addToCart(product), [addToCart, product]);

    if (viewMode === 'list') {
        return (
            <div
                className="group bg-white rounded-2xl border border-zinc-200/70 flex overflow-hidden transition hover:shadow-lg hover:-translate-y-[1px]"
                style={{ animationDelay: `${index * 30}ms` }}
            >
                <Link href={`/products/${product.id}`} className="w-36 bg-zinc-50 relative flex items-center justify-center">
                    {image ? (
                        <Image
                            src={image}
                            alt={product.name}
                            fill
                            sizes="144px"
                            loading="lazy"
                            className="object-contain p-4 transition group-hover:scale-[1.04]"
                        />
                    ) : (
                        <div className="text-zinc-300 text-xs">No Image</div>
                    )}
                </Link>
                <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                        <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">{product.category?.name || 'Uncategorized'}</p>
                        <h3 className="text-sm font-semibold text-zinc-900 mt-1 line-clamp-2">{product.name}</h3>
                        {specKeys.length > 0 && (
                            <p className="text-[11px] text-zinc-400 mt-1">{specKeys.map(k => flatSpecs[k]).join(' · ')}</p>
                        )}
                    </div>
                    <div className="flex items-center justify-between mt-4">
                        <div>
                            <div className="text-lg font-semibold text-zinc-900">₹{price.toLocaleString('en-IN')}</div>
                            {discount && <div className="text-xs text-zinc-400 line-through">₹{compareAt.toLocaleString('en-IN')}</div>}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${compatDot}`} />
                            {inCart ? (
                                <div className="flex items-center border rounded-full overflow-hidden">
                                    <button onClick={handleDecrement} className="px-2 text-sm">−</button>
                                    <span className="px-2 text-xs">{cartQuantity}</span>
                                    <button onClick={handleAdd} className="px-2 text-sm">+</button>
                                </div>
                            ) : (
                                <button onClick={handleAdd} disabled={isOutOfStock} className="h-8 px-4 rounded-full bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition">
                                    {isOutOfStock ? 'Sold out' : 'Add'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="group bg-white rounded-2xl border border-zinc-200/70 overflow-hidden flex flex-col transition hover:shadow-lg hover:-translate-y-[2px]">
            <Link href={`/products/${product.id}`} className="aspect-square bg-zinc-50 relative flex items-center justify-center">
                {image && (
                    <Image
                        src={image}
                        alt={product.name}
                        fill
                        sizes="50vw"
                        loading="lazy"
                        className="object-contain p-6 transition group-hover:scale-[1.05]"
                    />
                )}
            </Link>
            <div className="p-4 flex flex-col gap-1">
                <p className="text-[10px] uppercase text-zinc-400 font-semibold">{product.category?.name || 'Uncategorized'}</p>
                <h3 className="text-sm font-semibold text-zinc-900 line-clamp-2">{product.name}</h3>
                <div className="flex items-center justify-between mt-2">
                    <span className="text-base font-semibold">₹{price.toLocaleString('en-IN')}</span>
                    {inCart ? (
                        <button onClick={() => onRemove(product.id)} className="text-xs px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 font-medium">Added</button>
                    ) : (
                        <button onClick={handleAdd} className="text-xs px-3 py-1 rounded-full bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition">Add</button>
                    )}
                </div>
            </div>
        </div>
    );
});

// ── ProductsContent ───────────────────────────────────────────────────────────

const ProductsContent: React.FC<{ initialData?: any }> = ({ initialData }) => {
    const { addToCart, removeFromCart, updateQuantity, cart, compareItems, addToCompare, removeFromCompare } = useShop();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const { buildSequence } = useBuildSequence();
    const buildSequenceCodes = useMemo(
        () => buildSequence.map((item) => item.category.code),
        [buildSequence],
    );

    const [categories, setCategories] = useState<CategoryNode[]>([]);

    const fetchCategories = async () => {
        const res = await fetch("/api/categories/hierarchy")
        const data = await res.json()
        console.log("Categories Fetched: ", data)
        setCategories(data)
    }
    // Fetch categories
    useEffect(() => {
        fetchCategories();
    }, []);

    const isBuildMode = searchParams.get('mode') === 'build';

    const toggleBuildMode = useCallback(() => {
        if (isBuildMode) {
            router.push(pathname);
        } else {
            router.push(`${pathname}?mode=build`);
        }
    }, [isBuildMode, router, pathname]);

    const initialCategoryParam = searchParams.get('category');
    const initialQueryParam = searchParams.get('q');
    const initialModeParam = searchParams.get('mode');

    const initialTab = useMemo(() => {
        if (initialQueryParam) return null;
        if (initialCategoryParam && categories.length > 0) {
            const found = categories.find(n => getNodeCategoryCode(n) === initialCategoryParam);
            if (found) return found;
        }
        return categories.length > 0 ? ALL_PRODUCTS_TAB : null;
    }, [initialCategoryParam, categories, initialQueryParam]);

    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') ?? '');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
    const [activeTab, setActiveTab] = useState<CategoryNode | null>(initialTab);
    const [selectedNode, setSelectedNode] = useState<CategoryNode | null>(null);
    const [expandedSubcategory, setExpandedSubcategory] = useState<string | null>(null);
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
    const [priceRange, setPriceRange] = useState({ min: Number(searchParams.get('minPrice')) || 0, max: Number(searchParams.get('maxPrice')) || DEFAULT_MAX_PRICE });
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [fetchedProducts, setFetchedProducts] = useState<Product[]>(initialData?.products ?? []);
    const [totalCount, setTotalCount] = useState(initialData?.total ?? 0);
    const [availableFilters, setAvailableFilters] = useState<{ brands: string[], specs: Record<string, string[]> } | null>(initialData?.filterOptions ?? null);
    const [sortOption, setSortOption] = useState(searchParams.get('sort') ?? 'price-asc');
    const [viewMode, setViewMode] = useState(searchParams.get('view') ?? 'grid');

    // ── Debounce search ───────────────────────────────────────────────────────
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // ── Consolidated Tab/Category Change ──────────────────────────────────────
    const handleTabChange = useCallback((node: CategoryNode | null) => {
        setActiveTab(node);
        setSelectedNode(null);
        setSelectedFilters({});
        setPriceRange({ min: 0, max: DEFAULT_MAX_PRICE });
        setCurrentPage(1);
        setSidebarSearchTerm('');
        setExpandedSubcategory(null);
        // Reset fetch dedup so the new category always triggers a fresh fetch
        prevParamsRef.current = '';
    }, []);

    // ── Category nav scroll buttons ───────────────────────────────────────────
    const categoryNavRef = useRef<HTMLDivElement | null>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const updateScrollButtons = useCallback(() => {
        const el = categoryNavRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 0);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }, []);

    useEffect(() => { updateScrollButtons(); }, [categories, updateScrollButtons]);

    const scrollCategories = useCallback((direction: 'left' | 'right') => {
        const el = categoryNavRef.current;
        if (!el) return;
        el.scrollBy({ left: direction === 'left' ? -el.clientWidth * 0.6 : el.clientWidth * 0.6, behavior: 'smooth' });
    }, []);

    // ── Category initialisation ───────────────────────────────────────────────
    const hasInitializedCategories = useRef(false);

    useEffect(() => {
        if (categories.length > 0 && !hasInitializedCategories.current) {
            hasInitializedCategories.current = true;
            const q = searchParams.get('q');
            if (q) { handleTabChange(null); return; }
            if (initialCategoryParam) {
                const found = categories.find(n => 
                    getNodeCategoryCode(n) === initialCategoryParam ||
                    n.label === initialCategoryParam
                );
                if (found) { handleTabChange(found); return; }
            }
            handleTabChange(ALL_PRODUCTS_TAB);
        }
    }, [categories, initialCategoryParam, searchParams, handleTabChange]);

    useEffect(() => {
        if (!activeTab && categories.length > 0 && !searchTerm && hasInitializedCategories.current) {
            handleTabChange(ALL_PRODUCTS_TAB);
        }
    }, [activeTab, categories, searchTerm, handleTabChange]);

    useEffect(() => {
        if (initialModeParam === 'build' && !isBuildMode) toggleBuildMode();
    }, []); // intentionally empty — run once on mount


    // ── Hydrate selectedNode from URL ─────────────────────────────────────────
    const hasHydratedNode = useRef(false);

    useEffect(() => {
        const subLabel = searchParams.get('sub');
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

    // ── URL sync ──────────────────────────────────────────────────────────────
    const prevUrlState = useRef('');

    useEffect(() => {
        const params = new URLSearchParams();
        if (activeTab) {
            const categoryCode = getNodeCategoryCode(activeTab);
            params.set('category', categoryCode || activeTab.label);
        }
        if (selectedNode) params.set('sub', selectedNode.label);
        if (isBuildMode) params.set('mode', 'build');
        if (debouncedSearchTerm) params.set('q', debouncedSearchTerm);
        if (sidebarSearchTerm) params.set('sq', sidebarSearchTerm);
        if (priceRange.min > 0) params.set('minPrice', priceRange.min.toString());
        if (priceRange.max < DEFAULT_MAX_PRICE) params.set('maxPrice', priceRange.max.toString());
        for (const key of Object.keys(selectedFilters).sort()) {
            for (const v of [...selectedFilters[key]].sort()) params.append(`f_${key}`, v);
        }
        if (currentPage > 1) params.set('page', currentPage.toString());
        if (sortOption !== 'price-asc') params.set('sort', sortOption);
        if (viewMode !== 'grid') params.set('view', viewMode);
        params.sort();

        const newUrlStr = params.toString();
        if (prevUrlState.current === newUrlStr) return;
        prevUrlState.current = newUrlStr;

        const currentParams = new URLSearchParams(window.location.search);
        currentParams.delete('_rsc');
        currentParams.sort();
        if (currentParams.toString() !== newUrlStr) {
            window.history.replaceState(null, '', `${pathname}?${newUrlStr}`);
        }
    }, [activeTab, selectedNode, isBuildMode, debouncedSearchTerm, sidebarSearchTerm, priceRange, selectedFilters, currentPage, pathname, sortOption, viewMode]);

    // ── Build mode auto-advance ───────────────────────────────────────────────
    const prevCartLength = useRef(cart.length);
    const prevBuildMode = useRef(isBuildMode);

    useEffect(() => {
        if (!isBuildMode) { prevBuildMode.current = false; return; }
        const cartAdded = cart.length > prevCartLength.current;
        const modeToggled = isBuildMode && !prevBuildMode.current;
        if (cartAdded || modeToggled) {
            const nextMissingCat = buildSequenceCodes.find(cat => !cart.some(item => getProductCategoryCode(item) === cat));
            if (nextMissingCat) {
                const nextNode = categories.find(node => getNodeCategoryCode(node) === nextMissingCat);
                if (nextNode) { handleTabChange(nextNode); }
            }
        }
        prevCartLength.current = cart.length;
        prevBuildMode.current = isBuildMode;
    }, [buildSequenceCodes, cart, isBuildMode, categories]);

    // ── Handlers (stable references with useCallback) ─────────────────────────
    const handleBuildCategorySelect = useCallback((category: Category) => {
        const node = categories.find(n => getNodeCategoryCode(n) === category.code);
        if (node) handleTabChange(node);
    }, [categories, handleTabChange]);

    const handleFilterChange = useCallback((key: string, value: string) => {
        setSelectedFilters(prev => {
            const current = prev[key] ?? [];
            const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
            if (updated.length === 0) { const { [key]: _, ...rest } = prev; return rest; }
            return { ...prev, [key]: updated };
        });
    }, []);

    const clearAllFilters = useCallback(() => {
        setSelectedNode(null);
        setSelectedFilters({});
        setPriceRange({ min: 0, max: DEFAULT_MAX_PRICE });
        setSidebarSearchTerm('');
    }, []);

    const handlePriceChange = useCallback((min: number, max: number) => setPriceRange({ min, max }), []);

    const handleCompareToggle = useCallback((e: React.MouseEvent, product: Product) => {
        e.preventDefault();
        e.stopPropagation();
        compareItems.find(item => item.id === product.id)
            ? removeFromCompare(product.id)
            : addToCompare(product);
    }, [compareItems, removeFromCompare, addToCompare]);

    // ── Product fetch ─────────────────────────────────────────────────────────
    const prevParamsRef = useRef<string>((() => {
        if (initialData?.products?.length > 0 && initialCategoryParam) {
            const p = new URLSearchParams();
            p.set('category', initialCategoryParam);
            p.set('sort', sortOption);
            p.set('page', '1');
            p.set('limit', ITEMS_PER_PAGE.toString());
            p.sort();
            return p.toString();
        }
        return '';
    })());

    // Separate effect for build mode compatibility parameters
    const buildModeParams = useMemo(() => {
        if (!isBuildMode) return {};
        
        const cpu = cart.find(i => getProductCategoryCode(i) === 'PROCESSOR');
        const mobo = cart.find(i => getProductCategoryCode(i) === 'MOTHERBOARD');
        const activeCat = activeTab?.category;
        const activeCatCode = typeof activeCat === 'string' ? activeCat : activeCat?.code ?? activeCat?.slug;
        const cpuSpecs = cpu ? specsToFlat(cpu.specs) : null;
        const moboSpecs = mobo ? specsToFlat(mobo.specs) : null;
        
        const params: Record<string, string> = {};
        if (activeCatCode === 'MOTHERBOARD' && cpuSpecs?.socket) params['f_socket'] = cpuSpecs.socket as string;
        if (activeCatCode === 'PROCESSOR' && moboSpecs?.socket) params['f_socket'] = moboSpecs.socket as string;
        if (activeCatCode === 'RAM' && (cpuSpecs || moboSpecs)) {
            const type = moboSpecs?.ramType ?? cpuSpecs?.ramType;
            if (type) params['f_ramType'] = type as string;
        }
        
        return params;
    }, [isBuildMode, cart, activeTab]);

    useEffect(() => {
        // Always fetch if there's an active tab or search term
        if (!activeTab && !debouncedSearchTerm) return;

        const controller = new AbortController();

        const fetchProducts = async () => {
            setIsLoadingProducts(true);
            try {
                const params = new URLSearchParams();
                console.log("FETCHING - activeTab:", activeTab?.label, "activeTab.category:", activeTab?.category);
               
                if (activeTab?.category) {
                    params.set('category', getNodeCategoryCode(activeTab));
                }
                if (selectedNode?.brand) params.set('nodeBrand', selectedNode.brand);
                if (selectedNode?.query) params.set('nodeQuery', selectedNode.query);

                // Add build mode compatibility parameters
                Object.entries(buildModeParams).forEach(([key, value]) => {
                    params.set(key, value);
                });

                if (debouncedSearchTerm) params.set('q', debouncedSearchTerm);
                if (sidebarSearchTerm) params.set('sq', sidebarSearchTerm);

                for (const key of Object.keys(selectedFilters).sort()) {
                    for (const v of [...selectedFilters[key]].sort()) {
                        params.append(key.startsWith('specs.') ? `f_${key}` : `f_${key}`, v);
                    }
                }

                if (priceRange.min > 0) params.set('minPrice', priceRange.min.toString());
                if (priceRange.max < DEFAULT_MAX_PRICE) params.set('maxPrice', priceRange.max.toString());
                if (sortOption !== 'popularity') params.set('sort', sortOption);
                params.set('page', currentPage.toString());
                params.set('limit', ITEMS_PER_PAGE.toString());
                params.sort();

                const queryString = params.toString();
                if (prevParamsRef.current === queryString) { 
                    setIsLoadingProducts(false); 
                    return; 
                }
                
                const res = await fetch(`/api/products?${queryString}&getFilters=true`, { signal: controller.signal });
                const data = await res.json();
                
                // Only update the ref if the fetch was successful and not aborted
                prevParamsRef.current = queryString;
                console.log("FETCHED_PRODUCTS", data)
                console.log("Number of products received:", data.products?.length);
                if (data.products) {
                    console.log("Setting fetchedProducts state with", data.products.length, "products");
                    setFetchedProducts(data.products);
                    setTotalCount(data.total ?? 0);
                    if (data.filterOptions) setAvailableFilters(data.filterOptions);
                }
            } catch (err: any) {
                if (err?.name !== 'AbortError') console.error('Failed to fetch products:', err);
            } finally {
                setIsLoadingProducts(false);
            }
        };

        fetchProducts();
        return () => controller.abort();
    }, [activeTab, selectedNode, debouncedSearchTerm, sidebarSearchTerm, selectedFilters, priceRange, sortOption, currentPage, buildModeParams]);

    useEffect(() => { setCurrentPage(1); }, [activeTab, selectedNode, debouncedSearchTerm, sidebarSearchTerm, selectedFilters, priceRange, sortOption]);

    // Log when fetchedProducts changes
    useEffect(() => {
        console.log("fetchedProducts state changed, length:", fetchedProducts.length);
    }, [fetchedProducts]);

    // ── Derived values ────────────────────────────────────────────────────────
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    const checkCompatibility = useCallback((product: Product) => {
        const hypotheticalCart = [...cart, { ...product, quantity: 1 }];
        return validateBuild(hypotheticalCart);
    }, [cart]);

    const hasActiveFilters = !!(selectedNode || Object.keys(selectedFilters).length > 0 || priceRange.min > 0 || priceRange.max < DEFAULT_MAX_PRICE);

    // Stable empty array — avoids new reference on every render
    const categoryBaseProducts = EMPTY_ARRAY;

    const activeFilterCount = (selectedNode ? 1 : 0)
        + Object.values(selectedFilters).reduce((a, v) => a + v.length, 0)
        + (priceRange.min > 0 || priceRange.max < DEFAULT_MAX_PRICE ? 1 : 0);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <PageLayout bgClass="bg-stone-50">
            <style>{PAGE_STYLES}</style>

            {/* ── TOP NAV BAR ── */}
            <PageLayout.Header compact className="">
                <div className="sticky top-0 z-30">
                    <div
                        className="bg-white/[0.97] backdrop-blur-2xl border-b border-zinc-900/[0.07]"
                        style={{ boxShadow: '0 1px 0 0 rgba(0,0,0,0.04), 0 4px 24px -4px rgba(0,0,0,0.06)' }}
                    >
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                            {/* ROW 1 — breadcrumb + back */}
                            <div className="flex items-center justify-between h-9 border-b border-zinc-100">
                                <nav className="flex items-center gap-1.5 text-[11px] tracking-wide uppercase font-medium text-zinc-400 select-none">
                                    <Link href="/" className="hover:text-zinc-700 transition-colors duration-150">Home</Link>
                                    <span className="text-zinc-200 font-light">/</span>
                                    <Link href="/products" className="text-zinc-700 hover:text-zinc-900 transition-colors duration-150">Products</Link>
                                </nav>
                                <Link href="/products" className="group flex items-center gap-1.5 text-[11px] tracking-wide uppercase font-medium text-zinc-400 hover:text-zinc-800 transition-colors duration-150">
                                    <ArrowLeft size={11} className="group-hover:-translate-x-0.5 transition-transform duration-150" />
                                    <span className="hidden sm:inline">Back</span>
                                </Link>
                            </div>

                            {/* ROW 2 — search + filter */}
                            <div className="flex items-center gap-2.5 py-2.5">
                                <div className="relative flex-1 group">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-300 group-focus-within:text-zinc-500 transition-colors duration-200 pointer-events-none" />
                                    <input
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search hardware…"
                                        className="w-full h-9 pl-9 pr-8 rounded-full border border-zinc-200 bg-zinc-50 text-[13px] text-zinc-800 placeholder:text-zinc-300 transition-all duration-200 focus:outline-none focus:bg-white focus:border-zinc-400 focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]"
                                    />
                                    {searchTerm && (
                                        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500 transition-colors">
                                            <X size={13} />
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsMobileFiltersOpen(true)}
                                    className="h-9 px-4 flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 text-[13px] font-semibold text-zinc-600 hover:border-zinc-400 hover:bg-white hover:text-zinc-900 transition-all duration-200 lg:hidden shrink-0"
                                >
                                    <SlidersHorizontal size={13} />
                                    <span>Filters</span>
                                </button>
                            </div>

                            {/* ROW 3 — top-level categories only (nodes without a parentId) */}
                            <div className="flex overflow-x-auto no-scrollbar gap-1.5 py-2">
                                {[ALL_PRODUCTS_TAB, ...categories.filter(n => !n.parentId)].map((node) => {
                                    const isActive = activeTab?.label === node.label;
                                    return (
                                        <button
                                            key={node.label}
                                            onClick={() => handleTabChange(node)}
                                            className={`whitespace-nowrap px-4 h-8 text-[13px] font-semibold tracking-[-0.01em] rounded-full border transition-all duration-200 shrink-0 ${isActive ? 'bg-zinc-900 text-white border-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 hover:border-zinc-200'}`}
                                        >
                                            {node.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* ROW 4 — direct children of the active top-level tab */}
                            {activeTab?.children && activeTab.children.length > 0 && (
                                <div className="flex overflow-x-auto no-scrollbar gap-1.5 pb-2.5 pt-0.5 border-t border-zinc-100">
                                    {/* "All X" reset pill */}
                                    <button
                                        onClick={() => { setSelectedNode(null); setExpandedSubcategory(null); }}
                                        className={`px-3.5 h-7 text-[12px] font-semibold rounded-full border whitespace-nowrap shrink-0 transition-all duration-200 mt-2 ${!selectedNode ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-transparent border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50'}`}
                                    >
                                        All {activeTab.label}
                                    </button>

                                    {/* Only direct children of the active tab — not grandchildren */}
                                    {activeTab.children.map((child) => {
                                        const isSelected = selectedNode?.label === child.label;
                                        const hasNested = !!child.children?.length;
                                        const isExpanded = expandedSubcategory === child.label;
                                        return (
                                            <div key={child.label} className="relative mt-2 shrink-0">
                                                <button
                                                    onClick={() => {
                                                        if (hasNested) {
                                                            setExpandedSubcategory(isExpanded ? null : child.label);
                                                        } else {
                                                            setSelectedNode(child);
                                                            setExpandedSubcategory(null);
                                                        }
                                                    }}
                                                    className={`px-3.5 h-7 flex items-center gap-1 text-[12px] font-semibold rounded-full border whitespace-nowrap transition-all duration-200 ${isSelected ? 'bg-zinc-900 text-white border-zinc-900' : isExpanded ? 'bg-zinc-100 border-zinc-300 text-zinc-700' : 'bg-transparent border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50'}`}
                                                >
                                                    {child.label}
                                                    {hasNested && (
                                                        <ChevronDown size={11} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                                    )}
                                                </button>

                                                {/* Dropdown for grandchildren */}
                                                {hasNested && isExpanded && (
                                                    <div className="absolute top-full left-0 mt-2 z-50 min-w-[200px] bg-white border border-zinc-900/[0.08] rounded-2xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12),0_2px_8px_-2px_rgba(0,0,0,0.06)] py-1.5 overflow-hidden subcategory-dropdown">
                                                        {child.children?.map((nested) => {
                                                            const isNestedActive = selectedNode?.label === nested.label;
                                                            return (
                                                                <button
                                                                    key={nested.label}
                                                                    onClick={() => { setSelectedNode(nested); setExpandedSubcategory(null); }}
                                                                    className={`w-full text-left px-4 py-2 text-[13px] font-medium transition-colors duration-150 ${isNestedActive ? 'text-zinc-900 bg-zinc-50' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'}`}
                                                                >
                                                                    {nested.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </PageLayout.Header>

            <PageLayout.Content className="flex-1 overflow-hidden" padding="xs" container={false}>
                <div className="max-w-[1440px] mx-auto w-full px-2 sm:px-4 lg:px-8 h-full">
                    <div className="flex h-full gap-3 sm:gap-5 lg:gap-6">

                        {/* SIDEBAR */}
                        <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0 h-full">
                            {activeTab && (
                                <Sidebar
                                    nodes={activeTab.children ?? []}
                                    onSelect={setSelectedNode}
                                    selectedNode={selectedNode}
                                    priceRange={priceRange}
                                    onPriceChange={handlePriceChange}
                                    activeCategory={getNodeCategoryCode(activeTab)}
                                    activeSubcategory={getSubcategorySlug(selectedNode, activeTab)}
                                    onBuildStepChange={(categoryCode) => {
                                        const category = categories.find(n => getNodeCategoryCode(n) === categoryCode)?.category;
                                        if (category && typeof category !== 'string') handleBuildCategorySelect(category);
                                    }}
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

                        {/* MOBILE SIDEBAR */}
                        {isMobileFiltersOpen && activeTab && (
                            <div className="fixed inset-0 z-50 lg:hidden flex">
                                <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileFiltersOpen(false)} />
                                <div className="relative w-full max-w-[280px] sm:max-w-sm bg-white shadow-2xl h-full rounded-r-3xl overflow-hidden">
                                    <Sidebar
                                        nodes={activeTab.children ?? []}
                                        onSelect={setSelectedNode}
                                        selectedNode={selectedNode}
                                        onCloseMobile={() => setIsMobileFiltersOpen(false)}
                                        priceRange={priceRange}
                                        onPriceChange={handlePriceChange}
                                        activeCategory={getNodeCategoryCode(activeTab)}
                                        activeSubcategory={getSubcategorySlug(selectedNode, activeTab)}
                                        onBuildStepChange={(categoryCode) => {
                                            const category = categories.find(n => getNodeCategoryCode(n) === categoryCode)?.category;
                                            if (category && typeof category !== 'string') handleBuildCategorySelect(category);
                                        }}
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

                        {/* MAIN CONTENT */}
                        <main className="flex-1 min-h-0 min-w-0 flex flex-col px-0 sm:px-1">
                            {/* Toolbar */}
                            <div className="flex-shrink-0 mb-4">
                                <div className="flex items-center justify-between mb-2.5 gap-2">
                                    <div className="flex items-baseline gap-2 min-w-0">
                                        <h2 className="text-sm font-semibold text-zinc-900 truncate">
                                            {activeTab?.label ?? (searchTerm ? `"${searchTerm}"` : 'All Products')}
                                        </h2>
                                        <span className="text-xs text-zinc-400 font-medium flex-shrink-0">{totalCount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-xl px-2 py-1 shadow-sm">
                                            <ArrowUpDown size={11} className="text-zinc-400 flex-shrink-0" />
                                            <select className="bg-transparent font-medium text-zinc-700 focus:outline-none cursor-pointer text-xs max-w-[90px] sm:max-w-none" value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                                                <option value="price-asc">Low → High</option>
                                                <option value="price-desc">High → Low</option>
                                                <option value="name-asc">A → Z</option>
                                                <option value="name-desc">Z → A</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center bg-white border border-zinc-200 rounded-xl p-0.5 shadow-sm gap-0.5">
                                            <button onClick={() => setViewMode('grid')} className={`p-1 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:text-zinc-700'}`}><Grid2x2 size={13} /></button>
                                            <button onClick={() => setViewMode('list')} className={`p-1 rounded-lg transition-all ${viewMode === 'list' ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:text-zinc-700'}`}><List size={13} /></button>
                                        </div>
                                        <Link href="/builds/new" className="hidden lg:inline-flex items-center gap-1 px-2.5 h-7 rounded-full bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm flex-shrink-0">
                                            <Hammer size={10} /> Build
                                        </Link>
                                    </div>
                                </div>

                                {hasActiveFilters && (
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Filters:</span>
                                        {selectedNode && (
                                            <span className="filter-chip inline-flex items-center gap-1 px-2.5 py-0.5 bg-zinc-900 text-white text-[10px] font-medium rounded-full">
                                                {selectedNode.label}
                                                <button onClick={() => setSelectedNode(null)} className="hover:text-zinc-300"><X size={9} /></button>
                                            </span>
                                        )}
                                        {Object.entries(selectedFilters).map(([key, values]) =>
                                            values.map(val => (
                                                <span key={`${key}-${val}`} className="filter-chip inline-flex items-center gap-1 px-2.5 py-0.5 bg-zinc-100 text-zinc-700 text-[10px] font-medium rounded-full border border-zinc-200">
                                                    {val}
                                                    <button onClick={() => handleFilterChange(key, val)} className="text-zinc-400 hover:text-zinc-700"><X size={9} /></button>
                                                </span>
                                            ))
                                        )}
                                        {(priceRange.min > 0 || priceRange.max < DEFAULT_MAX_PRICE) && (
                                            <span className="filter-chip inline-flex items-center gap-1 px-2.5 py-0.5 bg-zinc-100 text-zinc-700 text-[10px] font-medium rounded-full border border-zinc-200">
                                                ₹{priceRange.min.toLocaleString()} – ₹{priceRange.max.toLocaleString()}
                                                <button onClick={() => setPriceRange({ min: 0, max: DEFAULT_MAX_PRICE })} className="text-zinc-400 hover:text-zinc-700"><X size={9} /></button>
                                            </span>
                                        )}
                                        <button onClick={clearAllFilters} className="text-[10px] font-medium text-zinc-400 hover:text-zinc-700 transition-colors underline underline-offset-2">Clear all</button>
                                    </div>
                                )}
                            </div>

                            {/* PRODUCT GRID / LIST */}
                            <div className="flex-1 overflow-y-auto scrollbar-thin pb-10">
                                {isLoadingProducts && (
                                    <div className={`grid gap-3 sm:gap-4 ${viewMode === 'list' ? 'grid-cols-1' : isBuildMode ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                                        {SKELETON_KEYS.map(i => viewMode === 'list' ? <SkeletonList key={i} /> : <SkeletonCard key={i} />)}
                                    </div>
                                )}

                                {!isLoadingProducts && fetchedProducts.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-24 text-center">
                                        <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-4">
                                            <Search size={24} className="text-zinc-300" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-zinc-900 mb-2">No products found</h3>
                                        <p className="text-zinc-400 text-sm max-w-xs">Try adjusting your filters or search terms to find what you're looking for.</p>
                                        <button onClick={() => { clearAllFilters(); setSearchTerm(''); }} className="mt-6 px-6 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors">
                                            Clear all filters
                                        </button>
                                    </div>
                                )}

                                {!isLoadingProducts && fetchedProducts.length > 0 && (
                                    <div className={`grid gap-2 sm:gap-3 ${viewMode === 'list' ? 'grid-cols-1' : isBuildMode ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4'}`}>
                                        {fetchedProducts.map((product, index) => {
                                            const compatReport = checkCompatibility(product);
                                            const isIncompatible = compatReport.status === CompatibilityLevel.INCOMPATIBLE;
                                            const isWarning = compatReport.status === CompatibilityLevel.WARNING;
                                            const inCart = cart.find(c => c.id === product.id);
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

                                {!isLoadingProducts && fetchedProducts.length > 0 && totalPages > 1 && (
                                    <div className="mt-6 sm:mt-8 flex items-center justify-center gap-1.5">
                                        <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm">
                                            <ChevronLeft size={13} /> Prev
                                        </button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                                let page = i + 1;
                                                if (totalPages > 5) {
                                                    if (currentPage <= 3) page = i + 1;
                                                    else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                                                    else page = currentPage - 2 + i;
                                                }
                                                return (
                                                    <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-xl text-xs font-medium transition-all ${currentPage === page ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 hover:bg-white hover:shadow-sm'}`}>
                                                        {page}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm">
                                            Next <ChevronRight size={13} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </main>

                        <BuildProgressSidebar
                            activeCategory={getNodeCategoryCode(activeTab)}
                            onStepClick={(categoryCode) => {
                                const category = categories.find(n => getNodeCategoryCode(n) === categoryCode)?.category;
                                if (category && typeof category !== 'string') handleBuildCategorySelect(category);
                            }}
                        />
                    </div>
                </div>

                {/* COMPARE BAR */}
                {compareItems.length > 0 && (
                    <div className="fixed bottom-3 left-2 right-2 z-50 bg-white/95 backdrop-blur-md border-t border-zinc-100 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
                        <div className="max-w-[1440px] mx-auto px-2 sm:px-4 lg:px-8 py-2.5 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
                            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto scrollbar-hide">
                                <div className="flex-shrink-0">
                                    <p className="font-semibold text-zinc-900 text-sm">Compare</p>
                                    <p className="text-[11px] text-zinc-400">{compareItems.length} selected</p>
                                </div>
                                <div className="w-px h-6 bg-zinc-100 hidden sm:block" />
                                <div className="flex items-center gap-2">
                                    {compareItems.map((item: any) => (
                                        <div key={item.id} className="relative w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center group flex-shrink-0">
                                            <Image src={item.media?.[0]?.url ?? '/placeholder.png'} alt={item.name} fill sizes="40px" className="p-1.5 object-contain mix-blend-multiply" />
                                            <button onClick={() => removeFromCompare(item.id)} className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white border border-zinc-200 rounded-full text-zinc-400 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <X size={9} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button onClick={() => compareItems.forEach((item: any) => removeFromCompare(item.id))} className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors px-3 py-2 font-medium">Clear</button>
                                <Link
                                    href="/compare"
                                    className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${compareItems.length >= 2 ? 'bg-zinc-900 text-white hover:bg-indigo-600 shadow-sm' : 'bg-zinc-100 text-zinc-300 cursor-not-allowed'}`}
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

// ── ProductsClient (public export) ────────────────────────────────────────────

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
