const fs = require('fs');
const file = 'e:\\web-dev\\pc-system\\md_client\\app\\(app)\\products\\page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove products from useShop destructuring
content = content.replace(
    '        categories,\r\n        products\r\n    } = useShop();',
    '        categories\r\n    } = useShop();'
);
content = content.replace(
    '        categories,\n        products\n    } = useShop();',
    '        categories\n    } = useShop();'
);

// 2. Add new states for network fetch
const stateAdditions = `    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [fetchedProducts, setFetchedProducts] = useState<Product[]>([]);
    const [totalCount, setTotalCount] = useState(0);
`;
content = content.replace(
    '    const ITEMS_PER_PAGE = 12;',
    `    const ITEMS_PER_PAGE = 12;\n${stateAdditions}`
);

// 3. Remove filteredProducts and paginatedProducts
const useMemoStartPattern = '    const filteredProducts = useMemo(() => {';
const useMemoEndPattern = '    }, [filteredProducts, currentPage, ITEMS_PER_PAGE]);';

const startIndex = content.indexOf(useMemoStartPattern);
const endIndex = content.indexOf(useMemoEndPattern) + useMemoEndPattern.length;

if (startIndex !== -1 && endIndex !== -1) {
    content = content.substring(0, startIndex) + content.substring(endIndex + 1);
}

// 4. Add the data fetching useEffect
const useEffectFetch = `
    const prevParamsRef = useRef<string>('');

    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoadingProducts(true);
            try {
                const params = new URLSearchParams();
                
                // Base
                if (activeTab) params.set('category', activeTab.category);
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
                        if (type) params.set('f_specs.Ram Type', type as string);
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
                    values.forEach(v => params.append(key.startsWith('specs.') ? \`f_\${key}\` : \`f_\${key}\`, v));
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

                const res = await fetch(\`/api/products?\${queryString}\`);
                const data = await res.json();
                
                if (data.products) {
                    setFetchedProducts(data.products);
                    setTotalCount(data.total || 0);
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
`;

content = content.replace(
    '    const checkCompatibility = (product: Product) => {',
    useEffectFetch + '\n    const checkCompatibility = (product: Product) => {'
);


// 5. Fix UI elements (counters & loading state)
content = content.replace(
    '                                            {filteredProducts.length}{" "}\r\n                                            {filteredProducts.length === 1 ? "product" : "products"}',
    '                                            {totalCount}{" "}\r\n                                            {totalCount === 1 ? "product" : "products"}'
);
content = content.replace(
    '                                            {filteredProducts.length}{" "}\n                                            {filteredProducts.length === 1 ? "product" : "products"}',
    '                                            {totalCount}{" "}\n                                            {totalCount === 1 ? "product" : "products"}'
);

content = content.replace(
    '                                <div className="pb-8">',
    '                                <div className="pb-8">\n                                    {isLoadingProducts && (\n                                        <div className="flex flex-col items-center justify-center py-20">\n                                            <div className="w-10 h-10 border-4 border-zinc-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>\n                                            <p className="text-zinc-500 font-medium tracking-wide text-sm">Loading Products...</p>\n                                        </div>\n                                    )}\n                                    {!isLoadingProducts && paginatedProducts.length === 0 && (\n                                        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-zinc-200">\n                                            <Grid3x3 size={32} className="text-zinc-300 mb-4" />\n                                            <h3 className="text-lg font-bold text-zinc-900 mb-1">No products found</h3>\n                                            <p className="text-zinc-500">Try adjusting your filters or search terms.</p>\n                                            <button onClick={clearAllFilters} className="mt-4 px-6 py-2 bg-blue-50 text-blue-700 font-medium rounded-xl hover:bg-blue-100 transition-colors">\n                                                Clear all filters\n                                            </button>\n                                        </div>\n                                    )}\n                                    {!isLoadingProducts && paginatedProducts.length > 0 && ('
);

content = content.replace(
    '                                            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"\r\n                                            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"\r\n                                            }\`}\r\n                                    >',
    '                                            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"\r\n                                            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"\r\n                                            }\`}\r\n                                    >'
);

// We need to properly wrap the product grid.
const endOfGrid = '                                        {totalPages > 1 && (';
if (content.indexOf(endOfGrid) !== -1) {
    content = content.replace(
        '                                        {totalPages > 1 && (',
        '                                    )}' + '\\n' + '                                        {totalPages > 1 && ('
    );
}

// 6. Fix the categoryBaseProducts initialization (prevent passing missing "products" variable)
content = content.replace(
    '    const categoryBaseProducts = useMemo(() => {\r\n        if (!activeTab) return [];\r\n        return products.filter(p => p.category === activeTab.category);\r\n    }, [products, activeTab]);',
    '    const categoryBaseProducts = useMemo(() => {\r\n        return [];\r\n    }, [activeTab]); // We removed global products array, so sidebar stats might be affected. We keep this empty for now.'
);
content = content.replace(
    '    const categoryBaseProducts = useMemo(() => {\n        if (!activeTab) return [];\n        return products.filter(p => p.category === activeTab.category);\n    }, [products, activeTab]);',
    '    const categoryBaseProducts = useMemo(() => {\n        return [];\n    }, [activeTab]); // We removed global products array, so sidebar stats might be affected. We keep this empty for now.'
);

fs.writeFileSync(file, content);
console.log('Modified page.tsx');
