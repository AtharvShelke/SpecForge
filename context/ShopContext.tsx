'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  CartItem, Product, CompatibilityReport, CompatibilityLevel, Review, ReviewStatus, SavedBuild,
  CategoryNode, Brand, CategorySchema, Category, AttributeDefinition,
  InventoryItem, StockMovement, StockMovementType, Order, OrderStatus, OrderLog,
  CategoryFilterConfig, FilterDefinition
} from '../types';
import { validateBuild } from '../services/compatibility';
import { useToast } from '@/hooks/use-toast';

interface ShopContextType {
  // Cart
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  isCartOpen: boolean;
  setCartOpen: (isOpen: boolean) => void;

  // Orders
  orders: Order[];
  placeOrder: (customerName: string, email: string, shipping?: any, payment?: any) => Promise<void>;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, note?: string) => Promise<void>;

  // Compatibility
  compatibilityReport: CompatibilityReport;

  // Build Mode
  isBuildMode: boolean;
  toggleBuildMode: () => void;

  // Wishlist
  wishlist: string[];
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  // Saved Builds
  savedBuilds: SavedBuild[];
  saveCurrentBuild: (name: string) => Promise<void>;
  loadBuild: (buildId: string) => Promise<void>;
  deleteBuild: (buildId: string) => Promise<void>;

  // Reviews
  reviews: Review[];
  addReview: (review: Omit<Review, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  approveReview: (id: string) => Promise<void>;
  rejectReview: (id: string) => Promise<void>;
  getProductReviews: (productId: string) => Review[];
  getProductRating: (productId: string) => { average: number; count: number };

  // --- DYNAMIC CATALOG MANAGEMENT ---
  products: Product[];
  refreshProducts: () => Promise<void>;
  addProduct: (product: Partial<Product>, initialStock: number, costPrice: number) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;

  categories: CategoryNode[];
  refreshCategories: () => Promise<void>;
  updateCategories: (nodes: CategoryNode[]) => Promise<void>;

  brands: Brand[];
  refreshBrands: () => Promise<void>;
  addBrand: (brand: Partial<Brand>) => Promise<void>;
  updateBrand: (brand: Brand) => Promise<void>;
  deleteBrand: (brandId: string) => Promise<void>;

  schemas: CategorySchema[];
  refreshSchemas: () => Promise<void>;
  updateSchema: (category: Category, attributes: AttributeDefinition[]) => Promise<void>;

  // --- DYNAMIC FILTER MANAGEMENT ---
  filterConfigs: CategoryFilterConfig[];
  refreshFilterConfigs: () => Promise<void>;
  updateFilterConfig: (category: Category, filters: FilterDefinition[]) => Promise<void>;

  // --- INVENTORY MANAGEMENT ---
  inventory: InventoryItem[];
  refreshInventory: () => Promise<void>;
  stockMovements: StockMovement[];
  adjustStock: (inventoryItemId: string, quantity: number, type: StockMovementType, reason: string) => Promise<void>;
  getInventoryItem: (sku: string) => InventoryItem | undefined;

  // Loading states
  isLoading: boolean;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  // --- STATE INITIALIZATION ---
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [compatibilityReport, setCompatibilityReport] = useState<CompatibilityReport>({
    status: CompatibilityLevel.COMPATIBLE,
    issues: []
  });
  const [isCartOpen, setCartOpen] = useState(false);
  const [isBuildMode, setIsBuildMode] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [savedBuilds, setSavedBuilds] = useState<SavedBuild[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [schemas, setSchemas] = useState<CategorySchema[]>([]);
  const [filterConfigs, setFilterConfigs] = useState<CategoryFilterConfig[]>([]);



  // --- DATA FETCHING ---

  const refreshProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products');
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

  const refreshCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories/hierarchy');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  const refreshInventory = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      setInventory(data);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    }
  }, []);

  const refreshSavedBuilds = useCallback(async () => {
    try {
      const res = await fetch('/api/builds');
      const data = await res.json();
      setSavedBuilds(data);
    } catch (err) {
      console.error('Failed to fetch builds:', err);
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
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
      setReviews(data);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    }
  }, []);

  const refreshSchemas = useCallback(async () => {
    try {
      const res = await fetch('/api/categories/schemas');
      const data = await res.json();
      setSchemas(data);
    } catch (err) {
      console.error('Failed to fetch schemas:', err);
    }
  }, []);

  const refreshFilterConfigs = useCallback(async () => {
    try {
      const res = await fetch('/api/categories/filters');
      const data = await res.json();
      setFilterConfigs(data);
    } catch (err) {
      console.error('Failed to fetch filters:', err);
    }
  }, []);

  // Initial Fetch
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([
        refreshProducts(),
        refreshBrands(),
        refreshCategories(),
        refreshInventory(),
        refreshSavedBuilds(),
        refreshOrders(),
        refreshReviews(),
        refreshSchemas(),
        refreshFilterConfigs()
      ]);
      setIsLoading(false);
    };
    init();
  }, [refreshProducts, refreshBrands, refreshCategories, refreshInventory, refreshSavedBuilds, refreshOrders, refreshReviews, refreshSchemas, refreshFilterConfigs]);

  // --- SYNC PRODUCTS STOCK WITH INVENTORY ---
  useEffect(() => {
    if (inventory.length > 0) {
      setProducts(prev => prev.map(p => {
        const inv = inventory.find(i => i.productId === p.id);
        if (inv && inv.quantity !== p.stock) {
          return { ...p, stock: inv.quantity };
        }
        return p;
      }));
    }
  }, [inventory]);

  // --- CART EFFECTS ---
  useEffect(() => {
    const report = validateBuild(cart);
    setCompatibilityReport(report);
  }, [cart]);



  // --- INVENTORY ACTIONS ---

  const adjustStock = async (inventoryItemId: string, quantity: number, type: StockMovementType, reason: string) => {
    try {
      const res = await fetch(`/api/inventory/${inventoryItemId}/movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, quantity, reason }),
      });
      if (res.ok) {
        await refreshInventory();
        await refreshProducts();
      } else {
        const err = await res.json();
        toast({ title: "Stock update failed", description: err.error, variant: "destructive" });
      }
    } catch (err) {
      console.error('Failed to adjust stock:', err);
    }
  };

  const getInventoryItem = (sku: string) => inventory.find(i => i.sku === sku);



  // --- ORDER MANAGEMENT ACTIONS ---

  const placeOrder = async (customerName: string, email: string, shipping?: any, payment?: any) => {
    try {
      const orderId = `ORD-${Date.now()}`;
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          customerName,
          email,
          total: cartTotal,
          items: cart.map(i => ({
            productId: i.id,
            name: i.name,
            category: i.category,
            price: i.price,
            quantity: i.quantity,
            image: i.image,
            sku: i.sku
          })),
          shippingStreet: shipping?.street || '123 Tech Street',
          shippingCity: shipping?.city || 'Bangalore',
          shippingState: shipping?.state || 'Karnataka',
          shippingZip: shipping?.zip || '560001',
          shippingCountry: shipping?.country || 'India',
          paymentMethod: payment?.method || 'Credit Card',
          paymentStatus: 'Success'
        }),
      });

      if (res.ok) {
        toast({ title: "Order placed", description: `Order ${orderId} placed successfully!` });
        await refreshOrders();
        await refreshInventory();
        await refreshProducts();
        clearCart();
        setCartOpen(false);
      } else {
        const err = await res.json();
        toast({ title: "Order failed", description: err.error, variant: "destructive" });
      }
    } catch (err) {
      console.error('Failed to place order:', err);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus, note?: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note }),
      });
      if (res.ok) {
        await refreshOrders();
        await refreshInventory();
        await refreshProducts();
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };



  // --- CATALOG MANAGEMENT ACTIONS ---

  const addProduct = async (product: Partial<Product>, initialStock: number, costPrice: number) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, stock: initialStock, costPrice }),
      });
      if (res.ok) {
        await refreshProducts();
        await refreshInventory();
      }
    } catch (err) {
      console.error('Failed to add product:', err);
    }
  };

  const updateProduct = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (res.ok) {
        await refreshProducts();
      }
    } catch (err) {
      console.error('Failed to update product:', err);
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      if (res.ok) {
        await refreshProducts();
      } else {
        const err = await res.json();
        toast({ title: "Delete failed", description: err.error, variant: "destructive" });
      }
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };



  const updateCategories = async (nodes: CategoryNode[]) => {
    try {
      const res = await fetch('/api/categories/hierarchy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nodes),
      });
      if (res.ok) await refreshCategories();
    } catch (err) {
      console.error('Failed to update categories:', err);
    }
  };

  const addBrand = async (brand: Partial<Brand>) => {
    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brand),
      });
      if (res.ok) await refreshBrands();
    } catch (err) {
      console.error('Failed to add brand:', err);
    }
  };

  const updateBrand = async (brand: Brand) => {
    try {
      const res = await fetch(`/api/brands/${brand.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brand),
      });
      if (res.ok) await refreshBrands();
    } catch (err) {
      console.error('Failed to update brand:', err);
    }
  };

  const deleteBrand = async (brandId: string) => {
    try {
      const res = await fetch(`/api/brands/${brandId}`, { method: 'DELETE' });
      if (res.ok) await refreshBrands();
    } catch (err) {
      console.error('Failed to delete brand:', err);
    }
  };

  const updateSchema = async (category: Category, attributes: AttributeDefinition[]) => {
    try {
      const res = await fetch('/api/categories/schemas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, attributes }),
      });
      if (res.ok) await refreshSchemas();
    } catch (err) {
      console.error('Failed to update schema:', err);
    }
  };

  const updateFilterConfig = async (category: Category, filters: FilterDefinition[]) => {
    try {
      const res = await fetch('/api/categories/filters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, filters }),
      });
      if (res.ok) await refreshFilterConfigs();
    } catch (err) {
      console.error('Failed to update filters:', err);
    }
  };



  // --- CART ACTIONS ---

  const addToCart = (product: Product) => {
    const inv = inventory.find(i => i.productId === product.id);
    const available = inv ? inv.quantity : 0;

    let shouldToastOutOfStock = false;
    let shouldToastAdded = false;

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      const currentQty = existing ? existing.quantity : 0;

      if (currentQty + 1 > available) {
        shouldToastOutOfStock = true;
        return prev;
      }

      if (existing) {
        shouldToastAdded = true;
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      shouldToastAdded = true;
      return [...prev, { ...product, quantity: 1 }];
    });

    if (shouldToastOutOfStock) {
      toast({
        title: "Out of stock",
        description: `Only ${available} units available.`,
        variant: "destructive",
      });
    }

    if (shouldToastAdded) {
      toast({
        title: "Added to cart",
        description: `${product.name} added successfully.`,
      });
    }
  };




  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const inv = inventory.find(i => i.productId === productId);
    const available = inv ? inv.quantity : 0;

    if (quantity > available) {
      alert(`Cannot add more. Only ${available} units available.`);
      return;
    }

    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item =>
      item.id === productId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => setCart([]);

  const toggleBuildMode = () => setIsBuildMode(prev => !prev);
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // --- OTHER ACTIONS ---
  const addToWishlist = (productId: string) => {
    setWishlist(prev => {
      if (!prev.includes(productId)) return [...prev, productId];
      return prev;
    });
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist(prev => prev.filter(id => id !== productId));
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);


  const saveCurrentBuild = async (name: string) => {
    if (cart.length === 0) return;
    try {
      const res = await fetch('/api/builds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          total: cartTotal,
          items: cart.map(i => ({ productId: i.id, quantity: i.quantity }))
        }),
      });
      if (res.ok) await refreshSavedBuilds();
    } catch (err) {
      console.error('Failed to save build:', err);
    }
  };

  const loadBuild = async (buildId: string) => {
    const build = savedBuilds.find(b => b.id === buildId);
    if (build) {
      const newCart: CartItem[] = [];
      for (const item of build.items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          newCart.push({ ...product, quantity: item.quantity });
        }
      }
      setCart(newCart);
      setCartOpen(true);
    }
  };

  const deleteBuild = async (buildId: string) => {
    try {
      const res = await fetch(`/api/builds/${buildId}`, { method: 'DELETE' });
      if (res.ok) await refreshSavedBuilds();
    } catch (err) {
      console.error('Failed to delete build:', err);
    }
  };

  const addReview = async (reviewData: Omit<Review, 'id' | 'status' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData),
      });
      if (res.ok) await refreshReviews();
    } catch (err) {
      console.error('Failed to add review:', err);
    }
  };

  const approveReview = async (id: string) => {
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: ReviewStatus.APPROVED }),
      });
      if (res.ok) await refreshReviews();
    } catch (err) {
      console.error('Failed to approve review:', err);
    }
  };

  const rejectReview = async (id: string) => {
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: ReviewStatus.REJECTED }),
      });
      if (res.ok) await refreshReviews();
    } catch (err) {
      console.error('Failed to reject review:', err);
    }
  };

  const getProductReviews = (productId: string) => {
    return reviews.filter(r => r.productId === productId && r.status === ReviewStatus.APPROVED);
  };


  const getProductRating = (productId: string) => {
    const productReviews = getProductReviews(productId);
    if (productReviews.length === 0) return { average: 0, count: 0 };
    const sum = productReviews.reduce((acc, r) => acc + r.rating, 0);
    return { average: parseFloat((sum / productReviews.length).toFixed(1)), count: productReviews.length };
  };




  return (
    <ShopContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      orders,
      placeOrder,
      updateOrderStatus,
      compatibilityReport,
      cartTotal,
      isCartOpen,
      setCartOpen,
      isBuildMode,
      toggleBuildMode,
      wishlist,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      savedBuilds,
      saveCurrentBuild,
      loadBuild,
      deleteBuild,
      reviews,
      addReview,
      approveReview,
      rejectReview,
      getProductReviews,
      getProductRating,
      products,
      refreshProducts,
      addProduct,
      updateProduct,
      deleteProduct,
      categories,
      refreshCategories,
      updateCategories,
      brands,
      refreshBrands,
      addBrand,
      updateBrand,
      deleteBrand,
      schemas,
      refreshSchemas,
      updateSchema,
      filterConfigs,
      refreshFilterConfigs,
      updateFilterConfig,
      inventory,
      refreshInventory,
      stockMovements,
      adjustStock,
      getInventoryItem,
      isLoading
    }}>

      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) throw new Error("useShop must be used within ShopProvider");
  return context;
};
