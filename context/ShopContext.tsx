'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';

import { Product, SubCategory, SpecDefinition, Category, Brand, Order } from '../types';
import { sameCategory } from '../lib/categoryUtils';
import { FILTER_CONFIG } from '../data/filterConfig';

interface ShopContextType {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  subCategories: SubCategory[];
  specs: SpecDefinition[];

  cart: any[];
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (product: Product) => void;
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
  filterConfigs: typeof FILTER_CONFIG;

  setSubCategory: (id: string) => void;
  setFilter: (specId: string, values: string[]) => void;
  clearFilters: () => void;

  refreshProducts: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshFilterConfigs: () => Promise<void>;

  isLoading: boolean;
}

const ShopContext = createContext<ShopContextType | null>(null);

async function fetchJSON(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const ShopProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [specs, setSpecs] = useState<SpecDefinition[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  // Cart State
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);
  const [compareItems, setCompareItems] = useState<Product[]>([]);

  const setSubCategory = async (id: string) => {
    setSelectedSubCategory(id);
    setFilters({});

    const specData = await fetchJSON(`/api/catalog/specs?subCategoryId=${id}`);
    setSpecs(specData);

    await fetchProducts(id, {});
  };

  const setFilter = (specId: string, values: string[]) => {
    setFilters((prev) => ({
      ...prev,
      [specId]: values,
    }));
  };

  const clearFilters = () => setFilters({});

  const fetchProducts = async (subCategoryId?: string, filtersObj?: Record<string, string[]>) => {
    setLoading(true);
    try {
      // Transform Record<string, string[]> to Array<{ specId: string, values: string[] }>
      const formattedFilters = Object.entries(filtersObj || {}).map(([specId, values]) => ({
        specId,
        values
      }));

      const data = await fetchJSON('/api/catalog/products/filter', {
        method: 'POST',
        body: JSON.stringify({
          subCategoryId,
          filters: formattedFilters,
        }),
      });
      setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  const refreshProducts = useCallback(async () => {
    if (!selectedSubCategory) return;
    await fetchProducts(selectedSubCategory, filters);
  }, [selectedSubCategory, filters]);

  const refreshOrders = useCallback(async () => {
    const data = await fetchJSON('/api/orders');
    setOrders(Array.isArray(data) ? data : []);
  }, []);

  const refreshCategories = useCallback(async () => {
    const data = await fetchJSON('/api/catalog/categories');
    setCategories(Array.isArray(data) ? data : []);
  }, []);

  const refreshFilterConfigs = useCallback(async () => {}, []);

  // Cart Actions
  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      // Add product with quantity 1 and default selected variant
      return [...prev, { 
        ...product, 
        quantity: 1, 
        selectedVariant: product.variants?.[0] 
      }];
    });
    setCartOpen(true);
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const loadCart = useCallback((items: any[]) => {
    setCart(Array.isArray(items) ? items : []);
  }, []);

  const updateQuantity = useCallback((id: string, qty: number) => {
    if (qty < 1) {
      removeFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: qty } : item))
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => setCart([]), []);

  const addToCompare = useCallback((product: Product) => {
    setCompareItems((prev) => {
      if (prev.some((item) => item.id === product.id)) return prev;

      const sameGroupItems = prev.filter((item) => sameCategory(item.category, product.category));
      return [...sameGroupItems, product].slice(-4);
    });
  }, []);

  const removeFromCompare = useCallback((id: string) => {
    setCompareItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCompare = useCallback(() => setCompareItems([]), []);

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const price = item.selectedVariant?.price || item.variants?.[0]?.price || 0;
      return acc + Number(price) * item.quantity;
    }, 0);
  }, [cart]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [subCats, cats, brnds] = await Promise.all([
          fetchJSON('/api/catalog/subcategories'),
          fetchJSON('/api/catalog/categories'),
          fetchJSON('/api/catalog/brands')
        ]);
        setSubCategories(subCats);
        setCategories(cats);
        setBrands(brnds);
      } catch (err) {
        console.error("Failed to load shop data", err);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    try {
      const savedCart = window.localStorage.getItem('md-cart');
      const savedCompare = window.localStorage.getItem('md-compare');

      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        setCart(Array.isArray(parsed) ? parsed : []);
      }
      if (savedCompare) {
        const parsed = JSON.parse(savedCompare);
        setCompareItems(Array.isArray(parsed) ? parsed : []);
      }
    } catch (err) {
      console.error('Failed to restore persisted shop state', err);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('md-cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    window.localStorage.setItem('md-compare', JSON.stringify(compareItems));
  }, [compareItems]);

  useEffect(() => {
    refreshProducts();
  }, [filters, refreshProducts]);

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
        clearCompare,
        selectedSubCategory,
        filters,
        filterConfigs: FILTER_CONFIG,
        setSubCategory,
        setFilter,
        clearFilters,
        refreshProducts,
        refreshCategories,
        refreshFilterConfigs,
        isLoading: loading,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be used within ShopProvider');
  return ctx;
};

