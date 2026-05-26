"use client";

import {
<<<<<<< HEAD
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
=======
    createContext, useContext, useState, useEffect,
    useCallback, useMemo, type ReactNode,
} from 'react';
import { CartItem, Product } from '../types';
import { useToast } from '@/hooks/use-toast';
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50

import {
  Product,
  ProductVariant,
  SubCategory,
  SpecDefinition,
  Category,
  Brand,
  Order,
} from "../types";
import { sameCategory } from "../lib/categoryUtils";
import { apiFetch } from "@/lib/helpers";
import { useLoadingCounter } from "@/hooks/useLoadingCounter";

interface ShopContextType {
<<<<<<< HEAD
  products: Product[];
  categories: Category[];
  brands: Brand[];
  subCategories: SubCategory[];
  specs: SpecDefinition[];

  cart: any[];
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (
    product: Product,
    selectedVariant?: ProductVariant,
    preventOpenDrawer?: boolean,
  ) => void;
  loadCart: (items: any[]) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  cartTotal: number;

  orders: Order[];
  refreshOrders: () => Promise<void>;

  compareItems: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;

  selectedSubCategory: string | null;
  filters: Record<string, string[]>;
  filterConfigs: [];

  setSubCategory: (id: string) => void;
  setFilter: (specId: string, values: string[]) => void;
  clearFilters: () => void;

  refreshProducts: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshFilterConfigs: () => Promise<void>;

  isLoading: boolean;
  error: Error | null;
=======
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
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
}

const ShopContext = createContext<ShopContextType | null>(null);

<<<<<<< HEAD
export const ShopProvider = ({
  children,
  autoLoad = false,
}: {
  children: ReactNode;
  autoLoad?: boolean;
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [specs, setSpecs] = useState<SpecDefinition[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(
    null,
  );
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const { loading, start, stop } = useLoadingCounter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<Error | null>(null);
=======
const CART_KEY = 'specforge_cart';
const COMPARE_KEY = 'specforge_compare';

function getCategoryKey(product: Product) {
    if (typeof product.category === 'string') return product.category;
    return product.category?.code ?? product.category?.slug ?? product.category?.name ?? '';
}
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50

  // Cart State
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);
  const [compareItems, setCompareItems] = useState<Product[]>([]);

  const fetchProducts = useCallback(
    async (subCategoryId?: string, filtersObj?: Record<string, string[]>) => {
      setError(null);
      start();
      try {
        const formattedFilters = Object.entries(filtersObj ?? {}).map(
          ([specId, values]) => ({ specId, values }),
        );

        const data = await apiFetch<any>("/api/catalog/products/filter", {
          method: "POST",
          body: JSON.stringify({
            subCategoryId,
            filters: formattedFilters,
          }),
        });
        setProducts(Array.isArray(data) ? data : (data?.products ?? []));
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        stop();
      }
    },
    [start, stop],
  );

  const setSubCategory = useCallback(
    async (id: string) => {
      setSelectedSubCategory(id);
      setFilters({});

      setError(null);
      start();
      try {
        const specData = await apiFetch<SpecDefinition[]>(
          `/api/catalog/specs?subCategoryId=${id}`,
        );
        setSpecs(specData);

        await fetchProducts(id, {});
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        stop();
      }
    },
    [fetchProducts, start, stop],
  );

  const setFilter = (specId: string, values: string[]) => {
    setFilters((prev) => ({
      ...prev,
      [specId]: values,
    }));
  };

  const clearFilters = () => setFilters({});

  const refreshProducts = useCallback(async () => {
    if (!selectedSubCategory) return;
    await fetchProducts(selectedSubCategory, filters);
  }, [selectedSubCategory, filters, fetchProducts]);

  const refreshOrders = useCallback(async () => {
    setError(null);
    start();
    try {
      const data = await apiFetch<any[]>("/api/orders");
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      stop();
    }
  }, [start, stop]);

  const refreshCategories = useCallback(async () => {
    setError(null);
    start();
    try {
      const [subCats, cats, brnds] = await Promise.all([
        apiFetch<SubCategory[]>("/api/catalog/subcategories"),
        apiFetch<Category[]>("/api/catalog/categories"),
        apiFetch<Brand[]>("/api/catalog/brands"),
      ]);
      setSubCategories(subCats);
      setCategories(cats);
      setBrands(brnds);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      stop();
    }
  }, [start, stop]);

  const refreshFilterConfigs = useCallback(async () => {}, []);

<<<<<<< HEAD
  // Cart Actions
  const addToCart = useCallback(
    (
      product: Product,
      selectedVariant?: ProductVariant,
      preventOpenDrawer?: boolean,
    ) => {
      setCart((prev) => {
        const variantToUse = selectedVariant ?? product.variants?.[0];
        const existing = prev.find((item) => item.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.id === product.id
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                  selectedVariant: variantToUse,
                }
              : item,
          );
        }
        return [
          ...prev,
          {
            ...product,
            quantity: 1,
            selectedVariant: variantToUse,
          },
        ];
      });
      if (!preventOpenDrawer) {
        setCartOpen(true);
      }
    },
    [],
  );

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }, []);
=======
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
            const isOut = product.stockStatus === 'OUT_OF_STOCK';

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
            return [...prev, { ...product, quantity: 1 }];
        });
    }, [toast]);

    const removeFromCart = useCallback((productId: string) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    }, []);

    const updateQuantity = useCallback((productId: string, quantity: number) => {
        setCart(prev => prev.map(item => {
            if (item.id !== productId) return item;
            if (item.stockStatus === 'OUT_OF_STOCK') {
                queueMicrotask(() => toast({ title: 'Insufficient stock', variant: 'destructive' }));
                return item;
            }
            return { ...item, quantity: Math.max(1, quantity) };
        }));
    }, [toast]);

    const clearCart = useCallback(() => setCart([]), []);

    const loadCart = useCallback((items: CartItem[]) => setCart(items), []);

    const cartTotal = useMemo(
        () => cart.reduce((sum, item) => sum + ((item.price ?? 0) * item.quantity), 0),
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
            if (prev.length > 0 && getCategoryKey(prev[0]) !== getCategoryKey(product)) {
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
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50

  const loadCart = useCallback((items: any[]) => {
    setCart(Array.isArray(items) ? items : []);
  }, []);

  const updateQuantity = useCallback(
    (id: string, qty: number) => {
      if (qty < 1) {
        removeFromCart(id);
        return;
      }
      setCart((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, quantity: qty } : item,
        ),
      );
    },
    [removeFromCart],
  );

  const clearCart = useCallback(() => setCart([]), []);

  const addToCompare = useCallback((product: Product) => {
    setCompareItems((prev) => {
      if (prev.some((item) => item.id === product.id)) return prev;

      const sameGroupItems = prev.filter((item) =>
        sameCategory(item.category, product.category),
      );
      return [...sameGroupItems, product].slice(-4);
    });
  }, []);

  const removeFromCompare = useCallback((id: string) => {
    setCompareItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCompare = useCallback(() => setCompareItems([]), []);

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const price =
        item.selectedVariant?.price || item.variants?.[0]?.price || 0;
      return acc + Number(price) * item.quantity;
    }, 0);
  }, [cart]);

  useEffect(() => {
    if (!autoLoad) return;
    void Promise.allSettled([refreshCategories()]);
  }, [autoLoad, refreshCategories]);

  useEffect(() => {
    try {
      const savedCart = window.localStorage.getItem("md-cart");
      const savedCompare = window.localStorage.getItem("md-compare");

      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        setCart(Array.isArray(parsed) ? parsed : []);
      }
      if (savedCompare) {
        const parsed = JSON.parse(savedCompare);
        setCompareItems(Array.isArray(parsed) ? parsed : []);
      }
    } catch (err) {
      console.error("Failed to restore persisted shop state", err);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("md-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    window.localStorage.setItem("md-compare", JSON.stringify(compareItems));
  }, [compareItems]);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  return (
    <ShopContext.Provider
      value={{
        products,
        categories,
        brands,
        subCategories,
        specs,
        cart,
        isCartOpen,
        setCartOpen,
        addToCart,
        loadCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        orders,
        refreshOrders,
        compareItems,
        addToCompare,
        removeFromCompare,
<<<<<<< HEAD
        clearCompare,
        selectedSubCategory,
        filters,
        filterConfigs: [],
        setSubCategory,
        setFilter,
        clearFilters,
        refreshProducts,
        refreshCategories,
        refreshFilterConfigs,
        isLoading: loading,
        error,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used within ShopProvider");
  return ctx;
=======
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
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
};
