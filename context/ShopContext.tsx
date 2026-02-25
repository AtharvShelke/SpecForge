'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  CartItem, Product, CompatibilityReport, CompatibilityLevel, Review, SavedBuild,
  CategoryNode, Brand, CategorySchema, Category, AttributeDefinition,
  InventoryItem, StockMovement, StockMovementType, Order, OrderStatus, OrderLog,
  CategoryFilterConfig, FilterDefinition
} from '../types';
import { validateBuild } from '../services/compatibility';
import { MOCK_REVIEWS, MOCK_SAVED_BUILDS, PRODUCTS as MOCK_PRODUCTS, MOCK_ORDERS } from '../data/mockData';
import { CATEGORY_HIERARCHY as INITIAL_CATEGORY_TREE } from '../data/categoryTree';
import { FILTER_CONFIG as INITIAL_FILTER_CONFIG } from '../data/filterConfig';
import { useToast } from '@/hooks/use-toast';

// Initial Mock Data for Dynamic Features
const INITIAL_BRANDS: Brand[] = [
  { id: 'b1', name: 'Intel', linkedCategories: [Category.PROCESSOR, Category.GPU, Category.NETWORKING] },
  { id: 'b2', name: 'AMD', linkedCategories: [Category.PROCESSOR, Category.GPU, Category.MOTHERBOARD] },
  { id: 'b3', name: 'NVIDIA', linkedCategories: [Category.GPU] },
  { id: 'b4', name: 'ASUS', linkedCategories: [Category.MOTHERBOARD, Category.GPU, Category.MONITOR, Category.PSU, Category.PERIPHERAL] },
  { id: 'b5', name: 'MSI', linkedCategories: [Category.MOTHERBOARD, Category.GPU, Category.MONITOR, Category.PSU] },
  { id: 'b6', name: 'Corsair', linkedCategories: [Category.RAM, Category.PSU, Category.CABINET, Category.COOLER, Category.PERIPHERAL] },
];

const INITIAL_SCHEMAS: CategorySchema[] = [
  {
    category: Category.PROCESSOR,
    attributes: [
      { key: 'socket', label: 'Socket', type: 'text', required: true },
      { key: 'cores', label: 'Cores', type: 'number', required: true },
      { key: 'series', label: 'Series', type: 'text', required: false },
      { key: 'generation', label: 'Generation', type: 'text', required: false },
      { key: 'wattage', label: 'TDP (Watts)', type: 'number', required: true, unit: 'W' },
      { key: 'ramType', label: 'RAM Support', type: 'select', options: ['DDR4', 'DDR5'], required: true },
    ]
  },
  {
    category: Category.MOTHERBOARD,
    attributes: [
      { key: 'socket', label: 'Socket', type: 'text', required: true },
      { key: 'chipset', label: 'Chipset', type: 'text', required: true },
      { key: 'formFactor', label: 'Form Factor', type: 'select', options: ['ATX', 'Micro-ATX', 'E-ATX', 'ITX'], required: true },
      { key: 'ramType', label: 'RAM Slots', type: 'select', options: ['DDR4', 'DDR5'], required: true },
    ]
  },
  {
    category: Category.GPU,
    attributes: [
      { key: 'memory', label: 'VRAM', type: 'text', required: true },
      { key: 'wattage', label: 'TGP (Watts)', type: 'number', required: true, unit: 'W' },
      { key: 'series', label: 'Series', type: 'text', required: true },
    ]
  },
  {
    category: Category.RAM,
    attributes: [
      { key: 'ramType', label: 'Type', type: 'select', options: ['DDR4', 'DDR5'], required: true },
      { key: 'frequency', label: 'Speed', type: 'text', required: true },
      { key: 'capacity', label: 'Capacity', type: 'text', required: true },
    ]
  }
];

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
  placeOrder: (customerName: string, email: string) => void;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;

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
  saveCurrentBuild: (name: string) => void;
  loadBuild: (buildId: string) => void;
  deleteBuild: (buildId: string) => void;

  // Reviews
  reviews: Review[];
  addReview: (review: Omit<Review, 'id' | 'status' | 'date'>) => void;
  approveReview: (id: string) => void;
  rejectReview: (id: string) => void;
  getProductReviews: (productId: string) => Review[];
  getProductRating: (productId: string) => { average: number; count: number };

  // --- DYNAMIC CATALOG MANAGEMENT ---
  products: Product[];
  addProduct: (product: Product, initialStock: number, costPrice: number) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;

  categories: CategoryNode[];
  updateCategories: (nodes: CategoryNode[]) => void;

  brands: Brand[];
  addBrand: (brand: Brand) => void;
  updateBrand: (brand: Brand) => void;
  deleteBrand: (brandId: string) => void;

  schemas: CategorySchema[];
  updateSchema: (category: Category, attributes: AttributeDefinition[]) => void;

  // --- DYNAMIC FILTER MANAGEMENT ---
  filterConfigs: CategoryFilterConfig[];
  updateFilterConfig: (category: Category, filters: FilterDefinition[]) => void;

  // --- INVENTORY MANAGEMENT ---
  inventory: InventoryItem[];
  stockMovements: StockMovement[];
  adjustStock: (sku: string, quantity: number, type: StockMovementType, reason: string) => void;
  getInventoryItem: (sku: string) => InventoryItem | undefined;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();

  // --- STATE INITIALIZATION ---


  // 1. Initialize Products (Ensure they have SKUs)
  const [products, setProducts] = useState<Product[]>(() => {
    return MOCK_PRODUCTS.map(p => ({
      ...p,
      sku: p.sku || `SKU-${p.id.toUpperCase()}`
    }));
  });

  // 2. Initialize Inventory based on Products
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    return products.map(p => ({
      sku: p.sku || `SKU-${p.id.toUpperCase()}`,
      productId: p.id,
      quantity: p.stock,
      reserved: 0,
      reorderLevel: 5,
      costPrice: Math.round(p.price * 0.8), // Mock cost price
      location: 'Warehouse A',
      lastUpdated: new Date().toISOString()
    }));
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);

  // Other States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [compatibilityReport, setCompatibilityReport] = useState<CompatibilityReport>({
    status: CompatibilityLevel.COMPATIBLE,
    issues: []
  });
  const [isCartOpen, setCartOpen] = useState(false);
  const [isBuildMode, setIsBuildMode] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [savedBuilds, setSavedBuilds] = useState<SavedBuild[]>(MOCK_SAVED_BUILDS);
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [categories, setCategories] = useState<CategoryNode[]>(INITIAL_CATEGORY_TREE);
  const [brands, setBrands] = useState<Brand[]>(INITIAL_BRANDS);
  const [schemas, setSchemas] = useState<CategorySchema[]>(INITIAL_SCHEMAS);

  // Initialize Dynamic Filters from static config
  const [filterConfigs, setFilterConfigs] = useState<CategoryFilterConfig[]>(INITIAL_FILTER_CONFIG);

  // --- SYNC PRODUCTS STOCK WITH INVENTORY ---
  useEffect(() => {
    setProducts(prev => prev.map(p => {
      const inv = inventory.find(i => i.productId === p.id);
      if (inv && inv.quantity !== p.stock) {
        return { ...p, stock: inv.quantity };
      }
      return p;
    }));
  }, [inventory]);

  // --- CART EFFECTS ---
  useEffect(() => {
    const report = validateBuild(cart);
    setCompatibilityReport(report);
  }, [cart]);

  // --- INVENTORY ACTIONS ---

  const adjustStock = (sku: string, quantity: number, type: StockMovementType, reason: string) => {
    setInventory(prev => prev.map(item => {
      if (item.sku === sku) {
        let newQty = item.quantity;
        let newReserved = item.reserved;

        switch (type) {
          case 'INWARD':
          case 'RETURN':
            newQty += quantity;
            break;
          case 'OUTWARD':
          case 'ADJUSTMENT':
            newQty -= quantity;
            break;
          case 'RESERVE':
            newQty -= quantity;
            newReserved += quantity;
            break;
          case 'SALE': // Logic: Sale actually happens when item leaves, so we reduce Reserved
            newReserved -= quantity;
            break;
        }

        // Prevent negative stock for physical movements
        if (newQty < 0) newQty = 0;
        if (newReserved < 0) newReserved = 0;

        return { ...item, quantity: newQty, reserved: newReserved, lastUpdated: new Date().toISOString() };
      }
      return item;
    }));

    // Audit Log
    setStockMovements(prev => [{
      id: `mov-${Date.now()}`,
      sku,
      type,
      quantity,
      reason,
      date: new Date().toISOString(),
      performedBy: 'System'
    }, ...prev]);
  };

  const getInventoryItem = (sku: string) => inventory.find(i => i.sku === sku);

  // --- ORDER MANAGEMENT ACTIONS ---

  const placeOrder = (customerName: string, email: string) => {
    // 1. Validate Stock again
    for (const item of cart) {
      const inv = inventory.find(i => i.productId === item.id);
      if (!inv || inv.quantity < item.quantity) {
        alert(`Stock changed for ${item.name}. Please update cart.`);
        return;
      }
    }

    // 2. Create Order Object
    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      customerName,
      email,
      date: new Date().toISOString(),
      total: cart.reduce((acc, i) => acc + (i.price * i.quantity), 0),
      status: OrderStatus.PENDING,
      items: [...cart],
      shippingAddress: { // Mock address for guest checkout
        street: '123 Tech Street',
        city: 'Bangalore',
        state: 'Karnataka',
        zip: '560001',
        country: 'India'
      },
      payment: {
        method: 'Credit Card',
        status: 'Success'
      },
      logs: [{
        status: OrderStatus.PENDING,
        timestamp: new Date().toISOString(),
        note: 'Order placed successfully.'
      }]
    };

    // 3. Reserve Stock
    cart.forEach(item => {
      const inv = inventory.find(i => i.productId === item.id);
      if (inv) {
        adjustStock(inv.sku, item.quantity, 'RESERVE', `Order ${newOrder.id} Placed`);
      }
    });

    // 4. Update State
    setOrders(prev => [newOrder, ...prev]);
    clearCart();
    setCartOpen(false);
    alert(`Order ${newOrder.id} placed successfully!`);
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;

      const oldStatus = order.status;

      // Handle Inventory Logic based on Status Transition
      if (newStatus === OrderStatus.SHIPPED && oldStatus !== OrderStatus.SHIPPED) {
        // Deduct from Reserved -> Gone
        order.items.forEach(item => {
          const inv = inventory.find(i => i.productId === item.id);
          if (inv) adjustStock(inv.sku, item.quantity, 'SALE', `Order ${orderId} Shipped`);
        });
      } else if (newStatus === OrderStatus.CANCELLED && oldStatus !== OrderStatus.CANCELLED) {
        // Return Reserved -> Available
        order.items.forEach(item => {
          const inv = inventory.find(i => i.productId === item.id);
          // Custom logic for context to handle this transition cleanly manually
          setInventory(invPrev => invPrev.map(invItem => {
            if (invItem.productId === item.id) {
              // If not yet shipped, the stock is in 'reserved'
              if (oldStatus === OrderStatus.PENDING || oldStatus === OrderStatus.PROCESSING || oldStatus === OrderStatus.PAID) {
                return { ...invItem, quantity: invItem.quantity + item.quantity, reserved: invItem.reserved - item.quantity };
              }
              // If shipped, stock is gone, bring it back
              if (oldStatus === OrderStatus.SHIPPED || oldStatus === OrderStatus.DELIVERED) {
                return { ...invItem, quantity: invItem.quantity + item.quantity };
              }
            }
            return invItem;
          }));
        });
      }

      return {
        ...order,
        status: newStatus,
        logs: [
          ...order.logs,
          { status: newStatus, timestamp: new Date().toISOString(), note: `Status updated from ${oldStatus} to ${newStatus}` }
        ]
      };
    }));
  };

  // --- CATALOG MANAGEMENT ACTIONS ---

  const addProduct = (product: Product, initialStock: number, costPrice: number) => {
    // Generate SKU if missing
    const sku = product.sku || `SKU-${Date.now()}`;
    const newProduct = { ...product, sku, stock: initialStock };

    setProducts(prev => [newProduct, ...prev]);

    // Create Inventory Record
    setInventory(prev => [...prev, {
      sku,
      productId: newProduct.id,
      quantity: initialStock,
      reserved: 0,
      reorderLevel: 5,
      costPrice,
      location: 'Warehouse A',
      lastUpdated: new Date().toISOString()
    }]);

    // Log Initial Stock
    if (initialStock > 0) {
      setStockMovements(prev => [{
        id: `mov-init-${Date.now()}`,
        sku,
        type: 'INWARD',
        quantity: initialStock,
        reason: 'Initial Stock Entry',
        date: new Date().toISOString(),
        performedBy: 'System'
      }, ...prev]);
    }
  };

  const updateProduct = (product: Product) => {
    setProducts(prev => prev.map(p => p.id === product.id ? product : p));
  };

  const deleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  // --- DYNAMIC FILTER MANAGEMENT ACTIONS ---
  const updateFilterConfig = (category: Category, filters: FilterDefinition[]) => {
    setFilterConfigs(prev => {
      // Check if config exists
      const existingIndex = prev.findIndex(c => c.category === category);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { category, filters };
        return updated;
      }
      return [...prev, { category, filters }];
    });
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

    // ✅ side effects AFTER state update
    if (shouldToastOutOfStock) {
      toast({
        title: "Out of stock",
        description: `Only ${available} units available in stock.`,
        variant: "destructive",
        className: "bg-white text-red-600 border border-red-200",
      });
    }

    if (shouldToastAdded) {
      toast({
        title: "Added to cart",
        description: `${product.name} added successfully.`,
        className: "bg-white text-gray-900 border border-gray-200",
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

  const saveCurrentBuild = (name: string) => {
    if (cart.length === 0) return;
    const newBuild: SavedBuild = {
      id: `build-${Date.now()}`,
      name,
      date: new Date().toISOString().split('T')[0],
      items: [...cart],
      total: cartTotal
    };
    setSavedBuilds(prev => [newBuild, ...prev]);
  };

  const loadBuild = (buildId: string) => {
    const build = savedBuilds.find(b => b.id === buildId);
    if (build) {
      setCart(build.items);
      setCartOpen(true);
    }
  };

  const deleteBuild = (buildId: string) => {
    setSavedBuilds(prev => prev.filter(b => b.id !== buildId));
  };

  const addReview = (reviewData: Omit<Review, 'id' | 'status' | 'date'>) => {
    const newReview: Review = {
      ...reviewData,
      id: `rev-${Date.now()}`,
      status: 'pending',
      date: new Date().toISOString().split('T')[0]
    };
    setReviews(prev => [newReview, ...prev]);
  };

  const approveReview = (id: string) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
  };

  const rejectReview = (id: string) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
  };

  const getProductReviews = (productId: string) => {
    return reviews.filter(r => r.productId === productId && r.status === 'approved');
  };

  const getProductRating = (productId: string) => {
    const productReviews = getProductReviews(productId);
    if (productReviews.length === 0) return { average: 0, count: 0 };
    const sum = productReviews.reduce((acc, r) => acc + r.rating, 0);
    return { average: parseFloat((sum / productReviews.length).toFixed(1)), count: productReviews.length };
  };

  const updateCategories = (nodes: CategoryNode[]) => setCategories(nodes);
  const addBrand = (brand: Brand) => setBrands(prev => [...prev, brand]);
  const updateBrand = (brand: Brand) => setBrands(prev => prev.map(b => b.id === brand.id ? brand : b));
  const deleteBrand = (brandId: string) => setBrands(prev => prev.filter(b => b.id !== brandId));

  const updateSchema = (category: Category, attributes: AttributeDefinition[]) => {
    setSchemas(prev => {
      const existing = prev.find(s => s.category === category);
      if (existing) {
        return prev.map(s => s.category === category ? { ...s, attributes } : s);
      }
      return [...prev, { category, attributes }];
    });
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
      addProduct,
      updateProduct,
      deleteProduct,
      categories,
      updateCategories,
      brands,
      addBrand,
      updateBrand,
      deleteBrand,
      schemas,
      updateSchema,
      filterConfigs,
      updateFilterConfig,
      inventory,
      stockMovements,
      adjustStock,
      getInventoryItem
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
