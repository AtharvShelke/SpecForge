'use client';

import { usePathname } from 'next/navigation';
import {
    createContext, useContext, useState, useEffect,
    useRef, useCallback, useMemo, type ReactNode,
} from 'react';
import {
    CartItem, Product, Brand,
    Order,
} from '../types';
import { useToast } from '@/hooks/use-toast';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ShopContextType {
    cart: CartItem[];
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    loadCart: (items: CartItem[]) => void;
    cartTotal: number;
    isCartOpen: boolean;
    setCartOpen: (isOpen: boolean) => void;
    compareItems: Product[];
    addToCompare: (product: Product) => void;
    removeFromCompare: (productId: string) => void;
    products: Product[];
    refreshProducts: () => Promise<void>;
    brands: Brand[];
    refreshBrands: () => Promise<void>;
    orders: Order[];
    refreshOrders: (email?: string) => Promise<void>;
    filterConfigs: any[];
    refreshFilterConfigs: () => Promise<void>;
    placeOrder: (customerName: string, email: string) => void;
    isLoading: boolean;
    initBuildGuides: any[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CART_KEY = 'nexus_cart';
const COMPARE_KEY = 'nexus_compare';

// Reads from localStorage safely — returns null on SSR or parse failure
function readStorage<T>(key: string): T | null {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null;
    }
}

// ── Context ───────────────────────────────────────────────────────────────────

const ShopContext = createContext<ShopContextType | undefined>(undefined);

// ── ShopProvider ──────────────────────────────────────────────────────────────

export const ShopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { toast } = useToast();
    const pathname = usePathname();

    const [isLoading, setIsLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [compareItems, setCompareItems] = useState<Product[]>([]);
    const [isCartOpen, setCartOpen] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const [filterConfigs, setFilterConfigs] = useState<any[]>([]);
    const [initBuildGuides, setInitBuildGuides] = useState<any[]>([]);
    // ── Refresh functions ─────────────────────────────────────────────────────
    // Each has an empty dep array — they only call stable setter functions.

    const refreshProducts = useCallback(async () => {
        try {
            const res = await fetch('/api/products?limit=1000');
            const data = await res.json();
            if (data.products) setProducts(data.products);
        } catch (err) {
            console.error('Failed to fetch products:', err);
        }
    }, []);

        const refreshBrands = useCallback(async () => {
        try {
            const res = await fetch('/api/brands');
            const data = await res.json();
            setBrands(data);
        } catch (err) {
            console.error('Failed to fetch brands:', err);
        }
    }, []);

    const refreshOrders = useCallback(async (email?: string) => {
        try {
            const url = email ? `/api/orders?email=${encodeURIComponent(email)}` : '/api/orders';
            const res = await fetch(url);
            const data = await res.json();
            if (data.orders) setOrders(data.orders);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        }
    }, []);

    const refreshFilterConfigs = useCallback(async () => {
        try {
            const res = await fetch('/api/categories/filters');
            const data = await res.json();
            setFilterConfigs(data);
        } catch (err) {
            console.error('Failed to fetch filter configs:', err);
        }
    }, []);

    // ── Initialisation — runs once, skipped on admin routes ──────────────────

    // In ShopContext.tsx — replace the init useEffect block

    const hasInitialized = useRef(false);

    useEffect(() => {
        if (pathname?.startsWith('/admin')) {
            setIsLoading(false);
            return;
        }
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        const savedCart = readStorage<CartItem[]>(CART_KEY);
        const savedCompare = readStorage<Product[]>(COMPARE_KEY);
        if (savedCart) setCart(savedCart);
        if (savedCompare) setCompareItems(savedCompare);

        setIsLoading(true);
        fetch('/api/init')
            .then(res => res.json())
            .then(({ products, brands, filterConfigs, buildGuides }) => {
                if (products) setProducts(products);
                
                if (brands) setBrands(brands);
                if (filterConfigs) setFilterConfigs(filterConfigs);
                if (buildGuides) setInitBuildGuides(buildGuides);
            })
            .catch(err => console.error('Failed to initialize shop data:', err))
            .finally(() => setIsLoading(false));
    }, [pathname]);

    // pathname is stable across the session (provider mounts once) but listed
    // to satisfy the linter. The hasInitialized guard ensures single execution.

    // ── Persist cart / compare (skip during initial load to avoid flash) ──────

    useEffect(() => {
        if (isLoading) return;
        try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { }
    }, [cart, isLoading]);

    useEffect(() => {
        if (isLoading) return;
        try { localStorage.setItem(COMPARE_KEY, JSON.stringify(compareItems)); } catch { }
    }, [compareItems, isLoading]);

    // ── Cart actions ──────────────────────────────────────────────────────────

    const addToCart = useCallback((product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            const isOut = product.variants?.[0]?.status === 'OUT_OF_STOCK';

            if (isOut) {
                // Fire toast outside the setState callback to avoid state update during render
                queueMicrotask(() => toast({
                    title: 'Out of stock',
                    description: existing ? 'This product is no longer available.' : undefined,
                    variant: 'destructive',
                }));
                return prev;
            }

            if (existing) {
                queueMicrotask(() => toast({ title: 'Added to cart', description: `${product.name} quantity updated.` }));
                return prev.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }

            queueMicrotask(() => toast({ title: 'Added to cart', description: `${product.name} added successfully.` }));
            return [...prev, { ...product, quantity: 1, selectedVariant: product.variants?.[0] ?? ({} as any) }];
        });
    }, [toast]);

    const removeFromCart = useCallback((productId: string) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    }, []);

    const updateQuantity = useCallback((productId: string, quantity: number) => {
        setCart(prev => prev.map(item => {
            if (item.id !== productId) return item;
            if (item.selectedVariant?.status === 'OUT_OF_STOCK') {
                queueMicrotask(() => toast({ title: 'Insufficient stock', variant: 'destructive' }));
                return item;
            }
            return { ...item, quantity: Math.max(1, quantity) };
        }));
    }, [toast]);

    const clearCart = useCallback(() => setCart([]), []);

    const loadCart = useCallback((items: CartItem[]) => setCart(items), []);

    const cartTotal = useMemo(
        () => cart.reduce((sum, item) => sum + ((item.selectedVariant?.price ?? 0) * item.quantity), 0),
        [cart]
    );

    // ── Compare actions ───────────────────────────────────────────────────────

    const addToCompare = useCallback((product: Product) => {
        setCompareItems(prev => {
            if (prev.find(item => item.id === product.id)) return prev;

            if (prev.length >= 4) {
                queueMicrotask(() => toast({ title: 'Compare limit reached', description: 'You can compare up to 4 items max.', variant: 'destructive' }));
                return prev;
            }
            if (prev.length > 0 && prev[0].subCategoryId !== product.subCategoryId) {
                queueMicrotask(() => toast({ title: 'Different category', description: 'You can only compare items from the same category.', variant: 'destructive' }));
                return prev;
            }

            queueMicrotask(() => toast({ title: 'Added to compare', description: `${product.name} added to comparison.` }));
            return [...prev, product];
        });
    }, [toast]);

    const removeFromCompare = useCallback((productId: string) => {
        setCompareItems(prev => prev.filter(item => item.id !== productId));
    }, []);

    // ── Checkout ──────────────────────────────────────────────────────────────

    const placeOrder = useCallback((customerName: string, email: string) => {
        if (cart.length === 0) return;
        fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: `ORD-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
                customerName,
                email,
                items: cart.map(item => ({
                    productId: item.id,
                    variantId: item.selectedVariant?.id ?? '',
                    name: item.name,
                    category: item.subCategory?.name || "Uncategorized",
                    price: item.selectedVariant?.price ?? 0,
                    quantity: item.quantity,
                    image: item.media?.[0]?.url ?? '',
                    sku: item.selectedVariant?.sku ?? '',
                })),
                total: cartTotal,
            }),
        })
            .then(res => {
                if (res.ok) {
                    toast({ title: 'Order placed successfully!' });
                    setCart([]);
                    setCartOpen(false);
                }
            })
            .catch(err => console.error('Failed to place order:', err));
    }, [cart, cartTotal, toast]);

    // ── Context value ─────────────────────────────────────────────────────────

    const value = useMemo<ShopContextType>(() => ({
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        loadCart,
        cartTotal,
        isCartOpen,
        setCartOpen,
        compareItems,
        addToCompare,
        removeFromCompare,
        products,
        refreshProducts,
        brands,
        refreshBrands,
        orders,
        refreshOrders,
        filterConfigs,
        refreshFilterConfigs,
        placeOrder,
        isLoading,
        initBuildGuides,
    }), [
        cart, addToCart, removeFromCart, updateQuantity, clearCart, loadCart, cartTotal,
        isCartOpen, compareItems, addToCompare, removeFromCompare,
        products, refreshProducts, 
        brands, refreshBrands, orders, refreshOrders,
        filterConfigs, refreshFilterConfigs, placeOrder, isLoading,
        initBuildGuides,
    ]);

    return (
        <ShopContext.Provider value={value}>
            {children}
        </ShopContext.Provider>
    );
};

// ── useShop ───────────────────────────────────────────────────────────────────

export const useShop = (): ShopContextType => {
    const context = useContext(ShopContext);
    if (context === undefined) {
        throw new Error('useShop must be used within a ShopProvider');
    }
    return context;
};