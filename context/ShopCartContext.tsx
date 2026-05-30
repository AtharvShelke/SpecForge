"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  ReactNode,
} from "react";
import type { Product, CartItem } from "@/types";
import { sameCategory } from "@/lib/categoryUtils";

interface ShopCartContextType {
  // Cart
  cart: CartItem[];
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (product: Product, preventOpenDrawer?: boolean) => void;
  loadCart: (items: CartItem[]) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;

  // Compare
  compareItems: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const ShopCartContext = createContext<ShopCartContextType | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function ShopCartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);
  const [compareItems, setCompareItems] = useState<Product[]>([]);

  // ── Cart Actions ──────────────────────────────────────────────────────

  const addToCart = useCallback(
    (product: Product, preventOpenDrawer?: boolean) => {
      setCart((prev) => {
        const existing = prev.find((item) => item.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          );
        }
        const categoryName = typeof product.category === 'string'
          ? product.category
          : (product.category as any)?.name ?? '';
        return [
          ...prev,
          {
            ...product,
            category: categoryName,
            quantity: 1,
            price: Number(product.price ?? 0),
          } as CartItem,
        ];
      });
      if (!preventOpenDrawer) setCartOpen(true);
    },
    [],
  );

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const loadCart = useCallback((items: CartItem[]) => {
    setCart(Array.isArray(items) ? items : []);
  }, []);

  const updateQuantity = useCallback(
    (id: string, qty: number) => {
      if (qty < 1) {
        setCart((prev) => prev.filter((item) => item.id !== id));
        return;
      }
      setCart((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, quantity: qty } : item,
        ),
      );
    },
    [],
  );

  const clearCart = useCallback(() => setCart([]), []);

  // ── Compare Actions ───────────────────────────────────────────────────

  const addToCompare = useCallback((product: Product) => {
    setCompareItems((prev) => {
      if (prev.some((item) => item.id === product.id)) return prev;

      const sameGroupItems = prev.filter((item) => {
        const itemCatName =
          typeof item.category === "string"
            ? item.category
            : item.category?.name;
        const productCatName =
          typeof product.category === "string"
            ? product.category
            : product.category?.name;
        return sameCategory(itemCatName, productCatName);
      });
      return [...sameGroupItems, product].slice(-4);
    });
  }, []);

  const removeFromCompare = useCallback((id: string) => {
    setCompareItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCompare = useCallback(() => setCompareItems([]), []);

  // ── Derived ───────────────────────────────────────────────────────────

  const cartTotal = useMemo(
    () =>
      cart.reduce((acc, item) => {
        const price = Number(item.price ?? 0);
        return acc + price * item.quantity;
      }, 0),
    [cart],
  );

  const cartCount = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart],
  );

  // ── Persistence ───────────────────────────────────────────────────────

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

  // Sync to localStorage
  useEffect(() => {
    window.localStorage.setItem("md-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    window.localStorage.setItem("md-compare", JSON.stringify(compareItems));
  }, [compareItems]);

  // ── Provider ──────────────────────────────────────────────────────────

  return (
    <ShopCartContext.Provider
      value={{
        cart,
        isCartOpen,
        setCartOpen,
        addToCart,
        loadCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        compareItems,
        addToCompare,
        removeFromCompare,
        clearCompare,
      }}
    >
      {children}
    </ShopCartContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useCart() {
  const ctx = useContext(ShopCartContext);
  if (!ctx)
    throw new Error("useCart must be used within ShopCartProvider");
  return ctx;
}
