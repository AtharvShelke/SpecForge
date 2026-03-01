'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import {
  CartItem, Product, CategoryNode, Brand, Category,
  LandingPageCMS, Order, Review, CategoryFilterConfig,
} from '../types';
import { useToast } from '@/hooks/use-toast';

interface ShopContextType {
  // Cart
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  loadCart: (items: CartItem[]) => void;
  cartTotal: number;
  isCartOpen: boolean;
  setCartOpen: (isOpen: boolean) => void;

  // Compare
  compareItems: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;

  // Catalog
  products: Product[];
  refreshProducts: () => Promise<void>;
  categories: CategoryNode[];
  refreshCategories: () => Promise<void>;
  brands: Brand[];
  refreshBrands: () => Promise<void>;

  // Orders (User-facing)
  orders: Order[];
  refreshOrders: (email?: string) => Promise<void>;

  // Reviews
  reviews: Review[];
  refreshReviews: () => Promise<void>;
  addReview: (review: { productId: string; customerName: string; rating: number; comment: string }) => void;
  getProductReviews: (productId: string) => Review[];
  getProductRating: (productId: string) => { average: number; count: number };

  // Filter Configs (for storefront sidebar)
  filterConfigs: CategoryFilterConfig[];
  refreshFilterConfigs: () => Promise<void>;

  // Checkout
  placeOrder: (customerName: string, email: string) => void;

  // CMS
  cmsContent: LandingPageCMS | null;
  refreshCMS: () => Promise<void>;

  // Global Loading State
  isLoading: boolean;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  // --- STATE ---
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [compareItems, setCompareItems] = useState<Product[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cmsContent, setCmsContent] = useState<LandingPageCMS | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filterConfigs, setFilterConfigs] = useState<CategoryFilterConfig[]>([]);

  // --- REFRESH FUNCTIONS ---

  const refreshProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products?limit=1000');
      const data = await res.json();
      if (data.products) setProducts(data.products);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  }, []);

  const refreshCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories/hierarchy');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
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

  const refreshCMS = useCallback(async () => {
    try {
      const res = await fetch('/api/cms?published=true');
      const data = await res.json();
      setCmsContent(data);
    } catch (err) {
      console.error('Failed to fetch CMS content:', err);
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

  const refreshReviews = useCallback(async () => {
    try {
      const res = await fetch('/api/reviews');
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : data.reviews ?? []);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
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

  // --- INITIAL FETCH (Storefront Essentials Only) ---
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          refreshProducts(),
          refreshCategories(),
          refreshBrands(),
          refreshCMS(),
          refreshReviews(),
          refreshFilterConfigs(),
        ]);
      } catch (err) {
        console.error('Failed to initialize shop data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    init();

    // Load persisted state
    try {
      const savedCart = localStorage.getItem('nexus_cart');
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedCompare = localStorage.getItem('nexus_compare');
      if (savedCompare) setCompareItems(JSON.parse(savedCompare));
    } catch (err) {
      console.error('Failed to load persisted state:', err);
    }
  }, [refreshProducts, refreshCategories, refreshBrands, refreshCMS, refreshReviews, refreshFilterConfigs]);

  // --- PERSIST STATE ---
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('nexus_cart', JSON.stringify(cart));
    }
  }, [cart, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('nexus_compare', JSON.stringify(compareItems));
    }
  }, [compareItems, isLoading]);

  // --- CART ACTIONS ---

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);

      if (existing) {
        if (existing.quantity + 1 > product.stock) {
          setTimeout(() => toast({
            title: "Out of stock",
            description: `Only ${product.stock} units available.`,
            variant: "destructive",
          }), 0);
          return prev;
        }
        setTimeout(() => toast({ title: "Added to cart", description: `${product.name} quantity updated.` }), 0);
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      if (product.stock < 1) {
        setTimeout(() => toast({ title: "Out of stock", variant: "destructive" }), 0);
        return prev;
      }

      setTimeout(() => toast({ title: "Added to cart", description: `${product.name} added successfully.` }), 0);
      return [...prev, { ...product, quantity: 1 }];
    });
  }, [toast]);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        if (quantity > item.stock) {
          setTimeout(() => toast({ title: "Insufficient stock", variant: "destructive" }), 0);
          return item;
        }
        return { ...item, quantity: Math.max(1, quantity) };
      }
      return item;
    }));
  }, [toast]);

  const clearCart = useCallback(() => setCart([]), []);

  const loadCart = useCallback((items: CartItem[]) => setCart(items), []);

  const cartTotal = useMemo(() =>
    cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    [cart]);

  // --- COMPARE ACTIONS ---

  const addToCompare = useCallback((product: Product) => {
    setCompareItems(prev => {
      if (prev.find(item => item.id === product.id)) return prev;
      if (prev.length >= 4) {
        setTimeout(() => toast({ title: "Compare limit reached", description: "You can compare up to 4 items max.", variant: "destructive" }), 0);
        return prev;
      }
      if (prev.length > 0 && prev[0].category !== product.category) {
        setTimeout(() => toast({ title: "Different category", description: "You can only compare items from the same category.", variant: "destructive" }), 0);
        return prev;
      }
      setTimeout(() => toast({ title: "Added to compare", description: `${product.name} added to comparison.` }), 0);
      return [...prev, product];
    });
  }, [toast]);

  const removeFromCompare = useCallback((productId: string) => {
    setCompareItems(prev => prev.filter(item => item.id !== productId));
  }, []);

  // --- REVIEW HELPERS ---

  const addReview = useCallback((review: { productId: string; customerName: string; rating: number; comment: string }) => {
    fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review),
    }).then(() => refreshReviews()).catch(err => console.error('Failed to add review:', err));
  }, [refreshReviews]);

  const getProductReviews = useCallback((productId: string) => {
    return reviews.filter(r => r.productId === productId);
  }, [reviews]);

  const getProductRating = useCallback((productId: string) => {
    const productReviews = reviews.filter(r => r.productId === productId);
    if (productReviews.length === 0) return { average: 0, count: 0 };
    const sum = productReviews.reduce((a, r) => a + r.rating, 0);
    return { average: sum / productReviews.length, count: productReviews.length };
  }, [reviews]);

  // --- CHECKOUT ---

  const placeOrder = useCallback((customerName: string, email: string) => {
    if (cart.length === 0) return;
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        customerName,
        email,
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          sku: item.sku,
        })),
        total: cartTotal,
      }),
    }).then(res => {
      if (res.ok) {
        toast({ title: 'Order placed successfully!' });
        setCart([]);
        setCartOpen(false);
      }
    }).catch(err => console.error('Failed to place order:', err));
  }, [cart, cartTotal, toast]);

  // --- CONTEXT VALUE ---

  const value = useMemo(() => ({
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
    categories,
    refreshCategories,
    brands,
    refreshBrands,
    orders,
    refreshOrders,
    reviews,
    refreshReviews,
    addReview,
    getProductReviews,
    getProductRating,
    filterConfigs,
    refreshFilterConfigs,
    placeOrder,
    cmsContent,
    refreshCMS,
    isLoading
  }), [
    cart, addToCart, removeFromCart, updateQuantity, clearCart, loadCart, cartTotal,
    isCartOpen, setCartOpen, compareItems, addToCompare, removeFromCompare,
    products, refreshProducts, categories, refreshCategories,
    brands, refreshBrands, orders, refreshOrders,
    reviews, refreshReviews, addReview, getProductReviews, getProductRating,
    filterConfigs, refreshFilterConfigs, placeOrder,
    cmsContent, refreshCMS, isLoading
  ]);

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
