'use client';

import {
    createContext, useContext, useState, useEffect,
    useCallback, useMemo, type ReactNode,
} from 'react';
import { CartItem, Product } from '../types';
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
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CART_KEY = 'specforge_cart';
const COMPARE_KEY = 'specforge_compare';

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

    const [cart, setCart] = useState<CartItem[]>([]);
    const [compareItems, setCompareItems] = useState<Product[]>([]);
    const [isCartOpen, setCartOpen] = useState(false);

    // ── Load cart/compare from localStorage on mount ─────────────────────

    useEffect(() => {
        const savedCart = readStorage<CartItem[]>(CART_KEY);
        const savedCompare = readStorage<Product[]>(COMPARE_KEY);
        if (savedCart) setCart(savedCart);
        if (savedCompare) setCompareItems(savedCompare);
    }, []);

    // ── Persist cart / compare ────────────────────────────────────────────

    useEffect(() => {
        try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { }
    }, [cart]);

    useEffect(() => {
        try { localStorage.setItem(COMPARE_KEY, JSON.stringify(compareItems)); } catch { }
    }, [compareItems]);

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
            if (prev.length > 0 && prev[0].category !== product.category) {
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
    }), [
        cart, addToCart, removeFromCart, updateQuantity, clearCart, loadCart, cartTotal,
        isCartOpen, compareItems, addToCompare, removeFromCompare,
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
