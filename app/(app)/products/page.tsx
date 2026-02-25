'use client'
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Category, Product, CompatibilityLevel } from '@/types';
import { useShop } from '@/context/ShopContext';
import { Search, Plus, CheckCircle, AlertTriangle, XCircle, Heart, Star, Filter, Grid3x3, Grid2x2, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { validateBuild } from '@/services/compatibility';
// import { Link, useSearchParams } from 'react-router-dom';
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar';
import { CategoryNode, BUILD_SEQUENCE } from '@/data/categoryTree';

const DEFAULT_MAX_PRICE = 500000;

const Products: React.FC = () => {
    const {
        addToCart,
        cart,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        getProductRating,
        isBuildMode,
        toggleBuildMode,
        categories,
        products
    } = useShop();

    const searchParams = useSearchParams();
    const initialCategoryParam = searchParams.get('category');
    const initialModeParam = searchParams.get('mode');

    const initialTab = useMemo(() => {
        if (initialCategoryParam && categories.length > 0) {
            const found = categories.find(n => n.label === initialCategoryParam || n.category === initialCategoryParam);
            if (found) return found;
        }
        return categories.length > 0 ? categories[0] : null;
    }, [initialCategoryParam, categories]);

    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<CategoryNode | null>(initialTab);
    const [selectedNode, setSelectedNode] = useState<CategoryNode | null>(null);
    const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
    const [priceRange, setPriceRange] = useState({ min: 0, max: DEFAULT_MAX_PRICE });
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [gridDensity, setGridDensity] = useState<"comfortable" | "compact">("comfortable");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 12;

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
            setActiveTab(categories[0]);
        } else if (initialCategoryParam && categories.length > 0) {
            const found = categories.find(n => n.label === initialCategoryParam || n.category === initialCategoryParam);
            if (found) setActiveTab(found);
        }
    }, [categories, initialCategoryParam]);

    useEffect(() => {
        if (initialModeParam === 'build' && !isBuildMode) {
            toggleBuildMode();
        }
    }, [initialModeParam]);

    useEffect(() => {
        setSelectedNode(null);
        setSelectedFilters({});
        setPriceRange({ min: 0, max: DEFAULT_MAX_PRICE });
        setCurrentPage(1);
    }, [activeTab]);

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
    };

    const filteredProducts = useMemo(() => {
        let result = products;

        if (!activeTab) return [];

        result = result.filter(product => product.category === activeTab.category);

        if (isBuildMode) {
            const cpu = cart.find(i => i.category === Category.PROCESSOR);
            const mobo = cart.find(i => i.category === Category.MOTHERBOARD);
            const activeCategory = activeTab.category;

            if (activeCategory === Category.MOTHERBOARD && cpu) {
                result = result.filter(p => p.specs.socket === cpu.specs.socket);
            }
            if (activeCategory === Category.PROCESSOR && mobo) {
                result = result.filter(p => p.specs.socket === mobo.specs.socket);
            }
            if (activeCategory === Category.RAM && (cpu || mobo)) {
                const type = mobo?.specs.ramType || cpu?.specs.ramType;
                if (type) result = result.filter(p => p.specs.ramType === type);
            }
        }

        if (selectedNode) {
            result = result.filter(product => {
                let matches = true;
                if (selectedNode.brand && product.specs.brand!.toLowerCase() !== selectedNode.brand.toLowerCase()) matches = false;
                if (matches && selectedNode.query) {
                    const query = selectedNode.query.toLowerCase();
                    const inName = product.name.toLowerCase().includes(query);
                    const inSpecs = Object.values(product.specs).some(val =>
                        val && String(val).toLowerCase().includes(query)
                    );
                    if (!inName && !inSpecs) matches = false;
                }
                return matches;
            });
        }

        Object.entries(selectedFilters).forEach(([key, selectedValues]) => {
            if (selectedValues.length === 0) return;

            if (key === 'stock_status') {
                result = result.filter(p => {
                    const status = p.stock > 0 ? 'In Stock' : 'Out of Stock';
                    return selectedValues.includes(status);
                });
            } else if (key.startsWith('specs.')) {
                const specKey = key.split('.')[1];
                result = result.filter(p => {
                    const val = p.specs[specKey];
                    return val && selectedValues.includes(String(val));
                });
            }
        });

        if (priceRange.min > 0 || priceRange.max < DEFAULT_MAX_PRICE) {
            result = result.filter(p => p.price >= priceRange.min && p.price <= priceRange.max);
        }

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(p => p.name.toLowerCase().includes(lower));
        }

        return result;
    }, [searchTerm, activeTab, selectedNode, selectedFilters, priceRange, isBuildMode, cart, products]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filteredProducts.length]);

    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredProducts.slice(startIndex, endIndex);
    }, [filteredProducts, currentPage, ITEMS_PER_PAGE]);

    const checkCompatibility = (product: Product) => {
        const hypotheticalCart = [...cart, { ...product, quantity: 1 }];
        const report = validateBuild(hypotheticalCart);
        return report;
    };

    const handleWishlistToggle = (e: React.MouseEvent, productId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (isInWishlist(productId)) {
            removeFromWishlist(productId);
        } else {
            addToWishlist(productId);
        }
    };

    const handlePriceChange = (min: number, max: number) => {
        setPriceRange({ min, max });
    };

    const hasActiveFilters = selectedNode || Object.keys(selectedFilters).length > 0 || priceRange.min > 0 || priceRange.max < DEFAULT_MAX_PRICE;

    const categoryBaseProducts = useMemo(() => {
        if (!activeTab) return [];
        return products.filter(p => p.category === activeTab.category);
    }, [products, activeTab]);

    return (
        <div className="h-full bg-zinc-50 flex flex-col">
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
            transform: translateY(-4px);
            box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.08);
          }
        }
        
        .product-image-wrapper {
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        @media (min-width: 1024px) {
          .product-card:hover .product-image-wrapper {
            transform: scale(1.05);
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
          position: relative;
          transition: all 0.2s ease;
        }
        
        .category-tab::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 2px;
          background: #18181b;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .category-tab.active::after {
          width: 100%;
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
            <header className="bg-white/90 backdrop-blur-xl border-b border-zinc-200/80 flex-shrink-0 z-30 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-6">
                        {/* Refined Search */}
                        <div className="relative flex-1 max-w-2xl group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-zinc-400 group-focus-within:text-zinc-600 transition-colors" strokeWidth={2} />
                            </div>
                            <input
                                type="text"
                                className="w-full h-12 pl-12 pr-4 bg-white border border-zinc-200 rounded-xl text-sm
                          placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 
                          focus:border-zinc-300 transition-all"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                                >
                                    <XCircle size={18} />
                                </button>
                            )}
                        </div>

                        {isBuildMode && (
                            <div className="hidden lg:flex items-center gap-2 text-sm font-medium px-4 py-2.5 
                            bg-blue-600/90 text-white rounded-xl">
                                <CheckCircle size={16} strokeWidth={2.5} />
                                Build Mode
                            </div>
                        )}

                        <button
                            onClick={() => setIsMobileFiltersOpen(true)}
                            className="lg:hidden flex items-center gap-2 h-12 px-4 bg-white border border-zinc-200 
                        rounded-xl text-zinc-700 font-medium hover:bg-zinc-50 transition-all"
                        >
                            <Filter size={18} />
                            Filters
                        </button>
                    </div>

                    {/* Refined Category Navigation */}
                    <div className="border-t border-zinc-100">
                        <nav className="flex overflow-x-auto scrollbar-hide -mb-px">
                            <div className="flex items-center gap-1 py-2">
                                {categories.map((node) => (
                                    <button
                                        key={node.label}
                                        onClick={() => setActiveTab(node)}
                                        className={`category-tab whitespace-nowrap px-5 py-3 text-sm font-medium rounded-t-lg transition-colors ${activeTab?.label === node.label
                                            ? 'active text-zinc-900'
                                            : 'text-zinc-500 hover:text-zinc-700'
                                            }`}
                                    >
                                        {node.label}
                                    </button>
                                ))}
                            </div>
                        </nav>
                    </div>


                </div>
            </header>

            {isBuildMode && (
                <div className="lg:hidden bg-blue-600/90 text-white px-4 py-2.5 text-sm font-medium text-center">
                    Build Mode Active
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 min-h-0 overflow-hidden">
                <div className="h-full max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
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
                                    selectedFilters={selectedFilters}
                                    onFilterChange={handleFilterChange}
                                    onClearFilters={clearAllFilters}
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
                                        selectedFilters={selectedFilters}
                                        onFilterChange={handleFilterChange}
                                        onClearFilters={clearAllFilters}
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
                                            {filteredProducts.length}{" "}
                                            {filteredProducts.length === 1 ? "product" : "products"}
                                        </span>
                                    </div>

                                    {/* <div className="self-start sm:self-auto flex items-center gap-1 bg-zinc-100 rounded-lg p-1">
                    <button
                      onClick={() => setGridDensity("comfortable")}
                      className={`p-2 sm:px-3 sm:py-2 rounded-md transition-all ${!isCompact ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600"
                        }`}
                    >
                      <Grid2x2 size={14} />
                    </button>
                    <button
                      onClick={() => setGridDensity("compact")}
                      className={`p-2 sm:px-3 sm:py-2 rounded-md transition-all ${isCompact ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600"
                        }`}
                    >
                      <Grid3x3 size={14} />
                    </button>
                  </div> */}
                                </div>

                                {/* Active Filters */}
                                {hasActiveFilters && (
                                    <div className="flex flex-col gap-3 mb-6 p-4 bg-white rounded-xl border border-zinc-200">
                                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                            Active Filters
                                        </span>

                                        <div className="flex gap-2 overflow-x-auto scrollbar-none">
                                            {selectedNode && (
                                                <span className="inline-flex shrink-0 items-center gap-2 bg-blue-600/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                                                    {selectedNode.label}
                                                    <button onClick={() => setSelectedNode(null)}>
                                                        <XCircle size={14} />
                                                    </button>
                                                </span>
                                            )}

                                            {Object.entries(selectedFilters).map(([key, values]) =>
                                                values.map((val) => (
                                                    <span
                                                        key={`${key}-${val}`}
                                                        className="inline-flex shrink-0 items-center gap-2 bg-zinc-100 text-zinc-700 px-3 py-1.5 rounded-lg text-sm font-medium"
                                                    >
                                                        {val}
                                                        <button onClick={() => handleFilterChange(key, val)}>
                                                            <XCircle size={14} />
                                                        </button>
                                                    </span>
                                                ))
                                            )}

                                            {(priceRange.min > 0 ||
                                                priceRange.max < DEFAULT_MAX_PRICE) && (
                                                    <span className="inline-flex shrink-0 items-center gap-2 bg-zinc-100 text-zinc-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                                                        ₹{priceRange.min.toLocaleString()} - ₹
                                                        {priceRange.max.toLocaleString()}
                                                        <button
                                                            onClick={() =>
                                                                setPriceRange({ min: 0, max: DEFAULT_MAX_PRICE })
                                                            }
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
                                            const inWishlist = isInWishlist(product.id);
                                            const { average, count } = getProductRating(product.id);

                                            return (
                                                <div
                                                    key={product.id}
                                                    className="group bg-white border border-zinc-200 rounded-2xl overflow-hidden"
                                                >
                                                    {/* Image */}
                                                    <Link
                                                        href={`/products/${product.id}`}
                                                        className="relative block bg-zinc-50 h-40 sm:h-48"
                                                    >
                                                        <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
                                                            <img
                                                                src={product.image}
                                                                alt={product.name}
                                                                className="max-w-full max-h-full object-contain"
                                                            />
                                                        </div>

                                                        <button
                                                            onClick={(e) => handleWishlistToggle(e, product.id)}
                                                            className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-sm"
                                                        >
                                                            <Heart
                                                                size={18}
                                                                fill={inWishlist ? "#ef4444" : "none"}
                                                                color={inWishlist ? "#ef4444" : "#71717a"}
                                                            />
                                                        </button>
                                                    </Link>

                                                    {/* Content */}
                                                    <div className="p-4 sm:p-5">
                                                        <Link href={`/products/${product.id}`}>
                                                            <h3 className="font-semibold text-zinc-900 text-sm sm:text-base line-clamp-2 mb-3">
                                                                {product.name}
                                                            </h3>
                                                        </Link>

                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-zinc-100">
                                                            <span className="text-lg sm:text-xl font-bold text-zinc-900 heading-font">
                                                                ₹{product.price}
                                                            </span>

                                                            <button
                                                                onClick={() => addToCart(product)}
                                                                disabled={isIncompatible && !inCart}
                                                                className={`w-full sm:w-auto px-4 py-2 rounded-xl text-sm font-medium transition-all ${inCart
                                                                    ? "bg-blue-600/90 text-white"
                                                                    : "bg-blue-600/90 text-white hover:bg-zinc-800"
                                                                    } ${isIncompatible && !inCart
                                                                        ? "opacity-50 cursor-not-allowed"
                                                                        : ""
                                                                    }`}
                                                            >
                                                                {inCart ? `In Cart (${inCart.quantity})` : "Add"}
                                                            </button>
                                                        </div>

                                                        {!inCart && cart.length > 0 && (
                                                            <div
                                                                className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${isIncompatible
                                                                    ? "bg-red-50 text-red-700"
                                                                    : isWarning
                                                                        ? "bg-amber-50 text-amber-700"
                                                                        : "bg-emerald-50 text-emerald-700"
                                                                    }`}
                                                            >
                                                                {isIncompatible
                                                                    ? "Incompatible"
                                                                    : isWarning
                                                                        ? "Check"
                                                                        : "Compatible"}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Pagination */}
                                    {filteredProducts.length > 0 && totalPages > 1 && (
                                        <div className="mt-8 flex justify-center items-center gap-3">
                                            <button
                                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                                className="p-3 rounded-lg"
                                            >
                                                <ChevronLeft size={20} />
                                            </button>

                                            <span className="sm:hidden text-sm font-medium text-zinc-700">
                                                Page {currentPage} / {totalPages}
                                            </span>

                                            <button
                                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                                className="p-3 rounded-lg"
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
            </div>
        </div>
    );
};

export default Products;