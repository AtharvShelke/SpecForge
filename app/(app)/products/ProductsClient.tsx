'use client'
import React, { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { Category, Product, CompatibilityLevel, specsToFlat } from '@/types';
import { useShop } from '@/context/ShopContext';
import { useBuild } from '@/context/BuildContext';
import { Search, Plus, CheckCircle, AlertTriangle, XCircle, Star, Filter, Grid3x3, Grid2x2, ChevronLeft, ChevronRight, ShoppingCart, ArrowUpDown, List, Columns, BarChart2 } from 'lucide-react';
import { validateBuild } from '@/services/compatibility';
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar';
import { CategoryNode, BUILD_SEQUENCE } from '@/data/categoryTree';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageTitle } from '@/components/layout/PageTitle';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

const DEFAULT_MAX_PRICE = 500000;

const ProductsContent: React.FC<{ initialData?: any }> = ({ initialData }) => {
    const {
        addToCart,
        cart,
        compareItems,
        addToCompare,
        removeFromCompare,
        getProductRating,
        categories
    } = useShop();
    const { isBuildMode, toggleBuildMode } = useBuild();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const initialCategoryParam = searchParams.get('category');
    const initialModeParam = searchParams.get('mode');

    const initialTab = useMemo(() => {
        if (initialCategoryParam && categories.length > 0) {
            const found = categories.find(n => n.label === initialCategoryParam || n.category === initialCategoryParam);
            if (found) return found;
        }
        return categories.length > 0 ? categories[0] : null;
    }, [initialCategoryParam, categories]);

    const [searchTerm, setSearchTerm] = useState(searchParams?.get('q') || '');
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
    const [gridDensity, setGridDensity] = useState<"comfortable" | "compact">("comfortable");
    const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
    const ITEMS_PER_PAGE = 12;

    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [fetchedProducts, setFetchedProducts] = useState<Product[]>(initialData?.products || []);
    const [totalCount, setTotalCount] = useState(initialData?.total || 0);
    const [availableFilters, setAvailableFilters] = useState<{ brands: string[], specs: Record<string, string[]> } | null>(initialData?.filterOptions || null);

    // New Hybrid Layout States
    const [sortOption, setSortOption] = useState(searchParams?.get('sort') || 'popularity');
    const [viewMode, setViewMode] = useState(searchParams?.get('view') || 'grid');

    const isCompact = gridDensity === "compact";
    const categoryNavRef = useRef<HTMLDivElement | null>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const updateScrollButtons = () => {
        const el = categoryNavRef.current;
        if (!el) return;

        setCanScrollLeft(el.scrollLeft > 0);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };

    useEffect(() => {
        updateScrollButtons();
    }, [categories]);

    const scrollCategories = (direction: "left" | "right") => {
        const el = categoryNavRef.current;
        if (!el) return;

        const scrollAmount = el.clientWidth * 0.6;

        el.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        });
    };

    useEffect(() => {
        if (!activeTab && categories.length > 0) {
            if (initialCategoryParam) {
                const found = categories.find(n => n.label === initialCategoryParam || n.category === initialCategoryParam);
                if (found) {
                    setActiveTab(found);
                    return;
                }
            }
            setActiveTab(categories[0]);
        }
    }, [activeTab, categories, initialCategoryParam]);

    useEffect(() => {
        if (initialModeParam === 'build' && !isBuildMode) {
            toggleBuildMode();
        }
    }, [initialModeParam]);

    const prevActiveTab = useRef<Category | undefined>(undefined);
    useEffect(() => {
        if (!activeTab) return;
        if (prevActiveTab.current === undefined) {
            prevActiveTab.current = activeTab.category;
            return;
        }
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
                    if (n.children) {
                        const found = findNode(n.children);
                        if (found) return found;
                    }
                }
                return null;
            };
            const foundNode = findNode(activeTab.children);
            if (foundNode) {
                setSelectedNode(foundNode);
            }
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
        if (searchTerm) params.set('q', searchTerm);
        if (sidebarSearchTerm) params.set('sq', sidebarSearchTerm);
        if (priceRange.min > 0) params.set('minPrice', priceRange.min.toString());
        if (priceRange.max < DEFAULT_MAX_PRICE) params.set('maxPrice', priceRange.max.toString());

        const filterKeys = Object.keys(selectedFilters).sort();
        filterKeys.forEach(key => {
            const values = [...selectedFilters[key]].sort();
            values.forEach(v => params.append(`f_${key}`, v));
        });

        if (currentPage > 1) params.set('page', currentPage.toString());
        if (sortOption !== 'popularity') params.set('sort', sortOption);
        if (viewMode !== 'grid') params.set('view', viewMode);

        params.sort();
        const newUrlStr = params.toString();

        if (prevUrlState.current !== newUrlStr) {
            prevUrlState.current = newUrlStr;
            const currentParams = new URLSearchParams(window.location.search);
            // remove internal Next.js params
            currentParams.delete('_rsc');
            currentParams.sort();

            if (currentParams.toString() !== newUrlStr) {
                const href = `${pathname}?${newUrlStr}`;
                window.history.replaceState(null, '', href);
            }
        }
    }, [activeTab, selectedNode, isBuildMode, searchTerm, sidebarSearchTerm, priceRange, selectedFilters, currentPage, pathname, sortOption, viewMode]);

    const prevCartLength = useRef(cart.length);
    const prevBuildMode = useRef(isBuildMode);

    useEffect(() => {
        if (!isBuildMode) {
            prevBuildMode.current = false;
            return;
        }

        const cartAdded = cart.length > prevCartLength.current;
        const modeToggled = isBuildMode && !prevBuildMode.current;

        if (cartAdded || modeToggled) {
            const nextMissingCat = BUILD_SEQUENCE.find(cat => !cart.some(item => item.category === cat));
            if (nextMissingCat) {
                const nextNode = categories.find(node => node.category === nextMissingCat);
                if (nextNode) {
                    setActiveTab(nextNode);
                    setSelectedFilters({});
                }
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
            const updated = current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value];

            if (updated.length === 0) {
                const { [key]: unused, ...rest } = prev;
                return rest;
            }
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

                // Base
                if (activeTab) params.set('category', String(activeTab.category));
                if (selectedNode?.brand) params.set('nodeBrand', selectedNode.brand);
                if (selectedNode?.query) params.set('nodeQuery', selectedNode.query);

                // Build Mode Constraints
                if (isBuildMode) {
                    const cpu = cart.find(i => i.category === Category.PROCESSOR);
                    const mobo = cart.find(i => i.category === Category.MOTHERBOARD);
                    const activeCategory = activeTab?.category;

                    const cpuSpecs = cpu ? specsToFlat(cpu.specs) : null;
                    const moboSpecs = mobo ? specsToFlat(mobo.specs) : null;

                    if (activeCategory === Category.MOTHERBOARD && cpuSpecs?.socket) {
                        params.set('f_specs.socket', cpuSpecs.socket as string);
                    }
                    if (activeCategory === Category.PROCESSOR && moboSpecs?.socket) {
                        params.set('f_specs.socket', moboSpecs.socket as string);
                    }
                    if (activeCategory === Category.RAM && (cpuSpecs || moboSpecs)) {
                        const type = moboSpecs?.ramType || cpuSpecs?.ramType;
                        if (type) params.set('f_specs.ramType', type as string);
                    }
                } else {
                    if (searchTerm) params.set('q', searchTerm);
                }

                // Search
                if (sidebarSearchTerm) params.set('sq', sidebarSearchTerm);

                // Filters
                const filterKeys = Object.keys(selectedFilters).sort();
                filterKeys.forEach(key => {
                    const values = [...selectedFilters[key]].sort();
                    values.forEach(v => params.append(key.startsWith('specs.') ? `f_${key}` : `f_${key}`, v));
                });

                // Price Range
                if (priceRange.min > 0) params.set('minPrice', priceRange.min.toString());
                if (priceRange.max < DEFAULT_MAX_PRICE) params.set('maxPrice', priceRange.max.toString());

                // Pagination & Sorting
                if (sortOption !== 'popularity') params.set('sort', sortOption);
                params.set('page', currentPage.toString());
                params.set('limit', ITEMS_PER_PAGE.toString());

                params.sort();
                const queryString = params.toString();

                // Prevent duplicate fetches for same exact params
                if (prevParamsRef.current === queryString) {
                    setIsLoadingProducts(false);
                    return;
                }
                prevParamsRef.current = queryString;

                const res = await fetch(`/api/products?${queryString}&getFilters=true`);
                const data = await res.json();

                if (data.products) {
                    setFetchedProducts(data.products);
                    setTotalCount(data.total || 0);
                    if (data.filterOptions) {
                        setAvailableFilters(data.filterOptions);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch products:", err);
            } finally {
                setIsLoadingProducts(false);
            }
        };

        fetchProducts();
    }, [activeTab, selectedNode, isBuildMode, cart, searchTerm, sidebarSearchTerm, selectedFilters, priceRange, sortOption, currentPage]);

    // Changing filters resets page to 1
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, selectedNode, searchTerm, sidebarSearchTerm, selectedFilters, priceRange, sortOption]);

    const paginatedProducts = fetchedProducts;
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    const checkCompatibility = (product: Product) => {
        const hypotheticalCart = [...cart, { ...product, quantity: 1, selectedVariant: product.variants?.[0] || {} as any }];
        const report = validateBuild(hypotheticalCart);
        return report;
    };

    const handleCompareToggle = (e: React.MouseEvent, product: Product) => {
        e.preventDefault();
        e.stopPropagation();
        if (compareItems.find(item => item.id === product.id)) {
            removeFromCompare(product.id);
        } else {
            addToCompare(product);
        }
    };

    const handlePriceChange = (min: number, max: number) => {
        setPriceRange({ min, max });
    };

    const hasActiveFilters = selectedNode || Object.keys(selectedFilters).length > 0 || priceRange.min > 0 || priceRange.max < DEFAULT_MAX_PRICE;

    const categoryBaseProducts = useMemo(() => {
        return [];
    }, [activeTab]);

    return (
        <PageLayout bgClass="bg-white">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
        
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        h1, h2, h3, h4, h5, h6, .heading-font {
          font-family: 'Space Grotesk', 'Inter', sans-serif;
          letter-spacing: -0.025em;
        }
        
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        .scrollbar-thin::-webkit-scrollbar { width: 6px; height: 6px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { 
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.15); }
        
        .product-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @media (min-width: 1024px) {
          .product-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.04), 0 4px 12px -4px rgba(0, 0, 0, 0.02);
          }
        }
        
        .product-image-wrapper {
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        @media (min-width: 1024px) {
          .product-card:hover .product-image-wrapper {
            transform: scale(1.03);
          }
        }
        
        .filter-chip {
          animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .category-tab {
          transition: all 0.2s ease;
        }
        
        .fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

            {/* Elegant Header */}
            <PageLayout.Header compact>
                <div className="flex flex-col gap-2">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                        <PageTitle
                            title={isBuildMode ? `Select ${initialCategoryParam || 'Component'}` : 'Components catalog'}
                            subtitle={isBuildMode
                                ? 'Choose the perfect component for your custom PC build.'
                                : 'Explore our vast collection of PC components.'}
                            actions={
                                isBuildMode ? (
                                    <button
                                        onClick={() => router.push('/builds/new')}
                                        className="px-2.5 py-1 border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md font-medium text-xs transition-colors flex items-center gap-1.5"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" />
                                        Back to Build
                                    </button>
                                ) : null
                            }
                            className=""
                        />

                        <div className="flex items-center gap-2 w-full lg:w-auto flex-shrink-0">
                            {/* Refined Search */}
                            <div className="relative flex-1 lg:w-72 group">
                                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                    <Search className="h-3.5 w-3.5 text-zinc-400 group-focus-within:text-zinc-600 transition-colors" strokeWidth={2} />
                                </div>
                                <input
                                    type="text"
                                    className="w-full h-8 pl-8 pr-3 bg-white border border-zinc-200 rounded-md text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 transition-all"
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                                    >
                                        <XCircle size={14} />
                                    </button>
                                )}
                            </div>

                            {isBuildMode && (
                                <div className="hidden lg:flex items-center gap-1.5 text-xs font-medium px-3 h-8 bg-blue-600/90 text-white rounded-md">
                                    <CheckCircle size={14} strokeWidth={2.5} />
                                    Build Mode
                                </div>
                            )}

                            <button
                                onClick={() => setIsMobileFiltersOpen(true)}
                                className="lg:hidden flex items-center gap-1.5 h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-zinc-700 font-medium text-xs hover:bg-zinc-50 transition-all whitespace-nowrap"
                            >
                                <Filter size={14} />
                                Filters
                            </button>
                        </div>
                    </div>

                    {/* Refined Category Navigation */}
                    <div className="border-t border-zinc-100 relative group">
                        {canScrollLeft && (
                            <button
                                onClick={() => scrollCategories('left')}
                                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 m-0.5 bg-white/90 shadow-sm border border-zinc-200 rounded-full text-zinc-600 hover:text-zinc-900 transition-opacity opacity-0 group-hover:opacity-100"
                                aria-label="Scroll left"
                            >
                                <ChevronLeft size={16} />
                            </button>
                        )}
                        <nav
                            ref={categoryNavRef}
                            onScroll={updateScrollButtons}
                            className="flex overflow-x-auto scrollbar-hide -mb-px px-1"
                        >
                            <div className="flex items-center gap-0.5 py-1">
                                {categories.map((node) => (
                                    <button
                                        key={node.label}
                                        onClick={() => setActiveTab(node)}
                                        className={`category-tab whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-t-md transition-colors ${activeTab?.label === node.label
                                            ? 'active text-zinc-900 font-semibold'
                                            : 'text-zinc-500 hover:text-zinc-800'
                                            }`}
                                    >
                                        {node.label}
                                    </button>
                                ))}
                            </div>
                        </nav>
                        {canScrollRight && (
                            <button
                                onClick={() => scrollCategories('right')}
                                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 m-0.5 bg-white/90 shadow-sm border border-zinc-200 rounded-full text-zinc-600 hover:text-zinc-900 transition-opacity opacity-0 group-hover:opacity-100"
                                aria-label="Scroll right"
                            >
                                <ChevronRight size={16} />
                            </button>
                        )}
                    </div>

                    {/* Subcategories Row (Dynamic) */}
                    {activeTab && activeTab.children && activeTab.children.length > 0 && (
                        <div className="bg-white border-t border-zinc-100 -mx-4 sm:-mx-6 lg:-mx-8 relative">
                            <div className="flex overflow-x-auto scrollbar-hide py-2 px-4 sm:px-6 lg:px-8 gap-3 snap-x snap-mandatory">
                                <button
                                    onClick={() => setSelectedNode(null)}
                                    className={`snap-start whitespace-nowrap px-2 py-1 text-[11px] sm:text-xs font-semibold rounded-md transition-all ${!selectedNode
                                        ? 'text-zinc-900 bg-zinc-100'
                                        : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                                        }`}
                                >
                                    All {activeTab.label}
                                </button>
                                {activeTab.children.map((subNode) => (
                                    <button
                                        key={subNode.label}
                                        onClick={() => setSelectedNode(subNode)}
                                        className={`snap-start whitespace-nowrap px-2 py-1 text-[11px] sm:text-xs font-semibold rounded-md transition-all ${selectedNode?.label === subNode.label
                                            ? 'text-zinc-900 bg-zinc-100'
                                            : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                                            }`}
                                    >
                                        {subNode.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </PageLayout.Header>

            {isBuildMode && (
                <div className="lg:hidden bg-blue-600/90 text-white px-4 py-2.5 text-sm font-medium text-center">
                    Build Mode Active
                </div>
            )}

            {/* Main Content */}
            <PageLayout.Content className="flex-1 overflow-hidden" padding="sm" container={false}>
                <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 h-full">
                    <div className="flex gap-6 h-full">
                        {/* Sidebar */}
                        <aside className="hidden lg:block w-80 flex-shrink-0 h-full">
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

                        {/* Mobile Sidebar — behaves identically to desktop: selecting a filter/node
                never auto-closes the drawer. Only the X button or backdrop click closes it. */}
                        {isMobileFiltersOpen && activeTab && (
                            <div className="fixed inset-0 z-50 lg:hidden">
                                <div className="absolute inset-0 bg-black/30" onClick={() => setIsMobileFiltersOpen(false)} />
                                <div className="absolute inset-y-0 left-0 w-full max-w-sm bg-white shadow-2xl h-full">
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

                        {/* Products Section */}
                        <main className="flex-1 min-h-0 min-w-0 flex flex-col">
                            {/* Header */}
                            <div className="flex-shrink-0">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                                        <h2 className="text-xl sm:text-2xl font-semibold text-zinc-900 heading-font">
                                            {activeTab?.label}
                                        </h2>
                                        <span className="text-xs sm:text-sm text-zinc-500 font-medium">
                                            {totalCount}{" "}
                                            {totalCount === 1 ? "product" : "products"}
                                        </span>
                                    </div>

                                    {/* Top Control Bar */}
                                    <div className="flex items-center gap-3 self-start sm:self-auto">
                                        <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3 py-1.5 shadow-sm">
                                            <ArrowUpDown size={14} className="text-zinc-500" />
                                            <select
                                                className="bg-transparent text-sm font-medium text-zinc-700 focus:outline-none cursor-pointer"
                                                value={sortOption}
                                                onChange={(e) => setSortOption(e.target.value)}
                                            >
                                                <option value="popularity">Popularity</option>
                                                <option value="price-asc">Price: Low to High</option>
                                                <option value="price-desc">Price: High to Low</option>
                                                <option value="newest">Newest</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-1">
                                            <button
                                                onClick={() => setViewMode("grid")}
                                                className={`p-1.5 sm:px-3 sm:py-2 rounded-md transition-all ${viewMode === 'grid' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900"}`}
                                                title="Grid View"
                                            >
                                                <Grid2x2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => setViewMode("list")}
                                                className={`p-1.5 sm:px-3 sm:py-2 rounded-md transition-all ${viewMode === 'list' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900"}`}
                                                title="List View"
                                            >
                                                <List size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Active Filters */}
                                {hasActiveFilters && (
                                    <div className="flex flex-col gap-3 mb-6 p-4 bg-white rounded-xl border border-zinc-200">
                                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                            Active Filters
                                        </span>

                                        <div className="flex gap-2 overflow-x-auto scrollbar-none">
                                            {selectedNode && (
                                                <span className="inline-flex shrink-0 items-center gap-1.5 text-zinc-800 text-sm font-medium">
                                                    {selectedNode.label}
                                                    <button onClick={() => setSelectedNode(null)} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                                                        <XCircle size={14} />
                                                    </button>
                                                </span>
                                            )}

                                            {Object.entries(selectedFilters).map(([key, values]) =>
                                                values.map((val) => (
                                                    <span
                                                        key={`${key}-${val}`}
                                                        className="inline-flex shrink-0 items-center gap-1.5 text-zinc-600 text-sm font-medium"
                                                    >
                                                        {val}
                                                        <button onClick={() => handleFilterChange(key, val)} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                                                            <XCircle size={14} />
                                                        </button>
                                                    </span>
                                                ))
                                            )}

                                            {(priceRange.min > 0 ||
                                                priceRange.max < DEFAULT_MAX_PRICE) && (
                                                    <span className="inline-flex shrink-0 items-center gap-1.5 text-zinc-600 text-sm font-medium">
                                                        ₹{priceRange.min.toLocaleString()} - ₹
                                                        {priceRange.max.toLocaleString()}
                                                        <button
                                                            onClick={() =>
                                                                setPriceRange({ min: 0, max: DEFAULT_MAX_PRICE })
                                                            }
                                                            className="text-zinc-400 hover:text-zinc-900 transition-colors"
                                                        >
                                                            <XCircle size={14} />
                                                        </button>
                                                    </span>
                                                )}
                                        </div>

                                        <button
                                            onClick={clearAllFilters}
                                            className="self-start text-sm font-medium text-zinc-600 hover:text-zinc-900"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Product Grid */}
                            <div className="flex-1 overflow-y-auto scrollbar-thin">
                                <div className="pb-8">
                                    {isLoadingProducts && (
                                        <div className="flex flex-col items-center justify-center py-20">
                                            <div className="w-10 h-10 border-4 border-zinc-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                                            <p className="text-zinc-500 font-medium tracking-wide text-sm">Loading Products...</p>
                                        </div>
                                    )}
                                    {!isLoadingProducts && paginatedProducts.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-zinc-200">
                                            <Grid3x3 size={32} className="text-zinc-300 mb-4" />
                                            <h3 className="text-lg font-bold text-zinc-900 mb-1">No products found</h3>
                                            <p className="text-zinc-500">Try adjusting your filters or search terms.</p>
                                            <button onClick={clearAllFilters} className="mt-4 px-6 py-2 bg-blue-50 text-blue-700 font-medium rounded-xl hover:bg-blue-100 transition-colors">
                                                Clear all filters
                                            </button>
                                        </div>
                                    )}
                                    {!isLoadingProducts && paginatedProducts.length > 0 && (
                                        <div
                                            className={`grid gap-4 sm:gap-5 ${isCompact
                                                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
                                                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                                                }`}
                                        >
                                            {paginatedProducts.map((product) => {
                                                const compatReport = checkCompatibility(product);
                                                const isCompatible =
                                                    compatReport.status === CompatibilityLevel.COMPATIBLE;
                                                const isWarning =
                                                    compatReport.status === CompatibilityLevel.WARNING;
                                                const isIncompatible =
                                                    compatReport.status === CompatibilityLevel.INCOMPATIBLE;
                                                const inCart = cart.find((c) => c.id === product.id);

                                                // Determine 3 specs to show
                                                const flatSpecs = specsToFlat(product.specs);
                                                const specKeys = Object.keys(flatSpecs).slice(0, 3);

                                                return (
                                                    <div
                                                        key={product.id}
                                                        className={`group bg-white border border-zinc-200/80 rounded-2xl overflow-hidden flex transition-all duration-500 hover:border-zinc-300 hover:shadow-xl hover:shadow-zinc-200/40 relative ${viewMode === 'list' && !isCompact ? 'flex-row h-[190px]' : 'flex-col h-full'}`}
                                                    >
                                                        {/* Image Area */}
                                                        <div className={`relative shrink-0 overflow-hidden bg-zinc-50/40 group-hover:bg-zinc-50 transition-colors duration-500 flex items-center justify-center ${viewMode === 'list' && !isCompact ? 'w-48 h-full border-r border-zinc-100 p-4' : 'h-40 sm:h-44 p-4 border-b border-zinc-100'}`}>
                                                            <Link
                                                                href={`/products/${product.id}`}
                                                                className="absolute inset-0 z-0"
                                                            >
                                                                <span className="sr-only">View {product.name}</span>
                                                            </Link>

                                                            <Image
                                                                src={product.media?.[0]?.url || '/placeholder.png'}
                                                                alt={product.name}
                                                                fill
                                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                                className="object-contain mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-110 relative z-10 pointer-events-none"
                                                            />

                                                            {/* Stock Badge */}
                                                            <div className="absolute top-3 left-3 flex flex-col gap-2 z-20 pointer-events-none">
                                                                {product.variants?.[0]?.status !== 'IN_STOCK' && (
                                                                    <span className={`backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm ${product.variants?.[0]?.status === 'OUT_OF_STOCK'
                                                                        ? "bg-red-500/90"
                                                                        : product.variants?.[0]?.status === 'LOW_STOCK'
                                                                            ? "bg-amber-500/90"
                                                                            : "bg-blue-500/90"
                                                                        }`}>
                                                                        {product.variants?.[0]?.status?.replace(/_/g, ' ') || 'OUT OF STOCK'}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Compare Button (hover only) */}
                                                            <button
                                                                onClick={(e) => handleCompareToggle(e as any, product)}
                                                                className={`absolute top-3 right-3 z-20 flex items-center justify-center gap-1.5 h-7 px-3 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 shadow-sm border ${!!compareItems.find(i => i.id === product.id)
                                                                    ? 'opacity-100 bg-zinc-900 text-white border-zinc-900'
                                                                    : 'opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 bg-white/90 backdrop-blur-md text-zinc-600 border-zinc-200 hover:text-zinc-900 hover:border-zinc-300 hover:shadow-md'
                                                                    }`}
                                                            >
                                                                {!!compareItems.find(i => i.id === product.id) ? (
                                                                    <>
                                                                        <CheckCircle size={12} strokeWidth={2.5} />
                                                                        <span>Compared</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <BarChart2 size={12} strokeWidth={2.5} />
                                                                        <span>Compare</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>

                                                        {/* Content */}
                                                        <div className="p-3.5 flex flex-col flex-1 relative bg-white z-10 w-full">
                                                            <Link href={`/products/${product.id}`} className="block mb-1 group/title">
                                                                <h3 className="font-medium text-zinc-900 text-[13px] leading-snug line-clamp-2 min-h-[36px] group-hover/title:text-blue-600 transition-colors duration-300">
                                                                    {product.name}
                                                                </h3>
                                                            </Link>

                                                            {/* 3 Key Specs - Dot separated text */}
                                                            <div className="mb-2 text-[11px] text-zinc-500 font-medium truncate">
                                                                {specKeys.map(key => String(flatSpecs[key])).join(' • ')}
                                                            </div>

                                                            {/* Footer actions pushed to bottom */}
                                                            <div className="mt-auto flex flex-col gap-2 pt-2.5 border-t border-zinc-100/80">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-base font-bold text-zinc-900 heading-font tracking-tight">
                                                                            ₹{(product.variants?.[0]?.price || 0).toLocaleString('en-IN')}
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex flex-col items-end gap-2">
                                                                        <div className="flex items-center gap-2.5">
                                                                            {!inCart && (
                                                                                <div className="flex flex-col justify-center items-center">
                                                                                    <div
                                                                                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isIncompatible
                                                                                            ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]"
                                                                                            : isWarning
                                                                                                ? "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]"
                                                                                                : "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                                                                                            }`}
                                                                                        title={isIncompatible ? "Incompatible" : isWarning ? "Warning" : "Compatible"}
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                            <button
                                                                                onClick={() => addToCart(product)}
                                                                                disabled={(isIncompatible && !inCart) || product.variants?.[0]?.status === 'OUT_OF_STOCK'}
                                                                                className={`h-7 px-3 rounded-md text-[11px] font-bold uppercase tracking-wide transition-all duration-300 flex items-center justify-center min-w-[64px] ${inCart
                                                                                    ? "bg-zinc-100 text-zinc-900 border border-zinc-200"
                                                                                    : product.variants?.[0]?.status === 'OUT_OF_STOCK'
                                                                                        ? "bg-zinc-50 text-zinc-400 cursor-not-allowed border border-zinc-100"
                                                                                        : "bg-zinc-900 text-white hover:bg-black hover:shadow-md hover:shadow-black/10 hover:-translate-y-0.5"
                                                                                    } ${(isIncompatible && !inCart)
                                                                                        ? "opacity-50 cursor-not-allowed"
                                                                                        : ""
                                                                                    }`}
                                                                            >
                                                                                {inCart ? "In" : product.variants?.[0]?.status === 'OUT_OF_STOCK' ? "Out" : "Add"}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Pagination */}
                                    {fetchedProducts.length > 0 && totalPages > 1 && (
                                        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
                                            <button
                                                disabled={currentPage <= 1}
                                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                                className="p-2 sm:p-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                                aria-label="Previous Page"
                                            >
                                                <ChevronLeft size={20} />
                                            </button>

                                            <span className="text-sm font-semibold text-zinc-800 bg-white px-5 py-2 sm:py-2.5 rounded-xl border border-zinc-200 shadow-sm min-w-[120px] text-center">
                                                Page {currentPage} of {totalPages}
                                            </span>

                                            <button
                                                disabled={currentPage >= totalPages}
                                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                                className="p-2 sm:p-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                                aria-label="Next Page"
                                            >
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </main>
                    </div>
                </div>

                {/* Sticky Compare Bar */}
                {compareItems.length > 0 && (
                    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-zinc-200 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] transform transition-transform duration-300">
                        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4 w-full sm:w-auto overflow-x-auto scrollbar-hide">
                                <div className="flex-shrink-0">
                                    <h4 className="font-semibold text-zinc-900 text-sm">Compare</h4>
                                    <p className="text-[11px] text-zinc-500">{compareItems.length} selected</p>
                                </div>
                                <div className="h-6 w-px bg-zinc-200 hidden sm:block"></div>
                                <div className="flex items-center gap-2">
                                    {compareItems.map(item => (
                                        <div key={item.id} className="relative w-10 h-10 rounded-lg bg-white flex items-center justify-center group flex-shrink-0">
                                            <Image src={item.media?.[0]?.url || '/placeholder.png'} alt={item.name} fill sizes="40px" className="p-1 object-contain mix-blend-multiply" />
                                            <button
                                                onClick={() => removeFromCompare(item.id)}
                                                className="absolute -top-1.5 -right-1.5 bg-white rounded-full text-zinc-400 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity border border-zinc-100"
                                            >
                                                <XCircle size={14} className="fill-white bg-white rounded-full" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <button
                                    onClick={() => compareItems.forEach(item => removeFromCompare(item.id))}
                                    className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors px-3 py-2"
                                >
                                    Clear All
                                </button>
                                <Link
                                    href="/compare"
                                    className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${compareItems.length >= 2 ? 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-md shadow-zinc-900/10' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'}`}
                                    onClick={(e) => {
                                        if (compareItems.length < 2) e.preventDefault();
                                    }}
                                >
                                    <BarChart2 size={16} />
                                    Compare {compareItems.length >= 2 ? 'Now' : 'More'}
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </PageLayout.Content>
        </PageLayout>
    );
};

const ProductsClient: React.FC<{ initialData?: any }> = ({ initialData }) => {
    return (
        <Suspense fallback={<div className="h-full flex items-center justify-center p-8 text-zinc-500">Loading products...</div>}>
            <ProductsContent initialData={initialData} />
        </Suspense>
    );
};

export default ProductsClient;