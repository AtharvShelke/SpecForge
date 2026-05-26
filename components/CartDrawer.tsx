<<<<<<< HEAD
"use client";
=======
'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useShop } from '@/context/ShopContext';
import { useToast } from '@/hooks/use-toast';
import { X, Trash2, AlertOctagon, CheckCircle2, AlertTriangle, CreditCard, Save, ShoppingBag } from 'lucide-react';
import { CompatibilityLevel, CompatibilityIssue } from '@/types';
import Link from 'next/link';
import { validateBuild } from '@/lib/calculations/compatibility';
import { getBaseUrl } from '@/lib/utils';
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useShop } from "@/context/ShopContext";

export default function CartDrawer() {
  const {
    cart,
    cartTotal,
    clearCart,
    isCartOpen,
    removeFromCart,
    setCartOpen,
    updateQuantity,
  } = useShop();
  const { toast } = useToast();

<<<<<<< HEAD
=======
  // Compute compatibility report locally from cart
  const compatibilityReport = useMemo(() => validateBuild(cart), [cart]);

  // Save current build via direct API call
  const saveCurrentBuild = useCallback(async (title: string, description = '') => {
    if (cart.length === 0) return;
    try {
      const res = await fetch(`${getBaseUrl()}/api/build-guides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: title,
          total: cartTotal,
          items: cart.map(i => ({
            productId: i.id,
            quantity: i.quantity,
          })),
        }),
      });

      if (res.ok) {
        toast({ title: 'Build Guide saved successfully' });
      } else {
        const errData = await res.json();
        console.error('Failed to save build guide API:', errData);
        toast({
          title: 'Failed to save build guide',
          description: JSON.stringify(errData.error ?? errData),
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Failed to save build guide:', err);
      toast({ title: 'Error', description: 'Network error while saving build guide', variant: 'destructive' });
    }
  }, [cart, cartTotal, toast]);

  const [isNaming, setIsNaming] = useState(false);
  const [buildName, setBuildName] = useState('');

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const isCompatible = compatibilityReport.status === CompatibilityLevel.COMPATIBLE;
  const isFatal = compatibilityReport.status === CompatibilityLevel.INCOMPATIBLE;

  const handleSaveBuild = (e: React.FormEvent) => {
    e.preventDefault();
    if (buildName.trim()) {
      saveCurrentBuild(buildName);
      setIsNaming(false);
      setBuildName('');
      alert('Build Saved Successfully!');
    }
  };

>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
  return (
    <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
      <SheetContent side="right" className="w-full max-w-md border-gray-200">
        <SheetHeader className="border-b border-gray-200 pr-14">
          <SheetTitle>Cart</SheetTitle>
          <SheetDescription>
            Review your items and continue to checkout when ready.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cart.length === 0 ? (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full border border-gray-200 bg-gray-50 p-4">
                <ShoppingBag className="size-6 text-gray-400" />
              </div>
              <p className="text-base font-medium text-gray-900">Your cart is empty</p>
              <p className="mt-2 max-w-xs text-sm text-gray-500">
                Add a product to see it here instantly.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {cart.map((item) => {
                const unitPrice = Number(
                  item.selectedVariant?.price ?? item.variants?.[0]?.price ?? 0,
                );
                const lineTotal = unitPrice * item.quantity;

<<<<<<< HEAD
                return (
                  <li key={item.id} className="flex gap-3 border-b border-gray-200 pb-4">
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                      <Image
                        src={item.media?.[0]?.url ?? "/placeholder.png"}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-contain p-2"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-gray-500">{item.brand?.name ?? item.category}</p>
                          <p className="line-clamp-2 text-sm font-medium text-gray-900">
                            {item.name}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          Rs. {lineTotal.toLocaleString("en-IN")}
=======
            {/* Cart Items */}
            <div className="flex-1 py-4 overflow-y-auto px-4 sm:px-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <CreditCard className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">Your cart is empty.</p>
                  <button onClick={() => setCartOpen(false)} className="mt-4 text-blue-600 text-sm font-semibold hover:text-blue-500">
                    Continue Shopping &rarr;
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {cart.map((product) => (
                    <li key={product.id} className="py-4 flex gap-3">
                      <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 border border-gray-100 rounded-lg overflow-hidden bg-gray-50">
                        <img
                          src={product.media?.[0]?.url || '/placeholder.png'}
                          alt={product.name}
                          className="w-full h-full object-center object-cover"
                        />
                      </div>
                      <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 truncate pr-2 leading-tight">
                            {product.name}
                          </h3>
                          <p className="text-xs sm:text-sm font-bold text-gray-900 whitespace-nowrap">
                            ₹{((product.price || 0) * product.quantity).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider mt-0.5">
                          {product.category?.name || 'Uncategorized'}
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="inline-flex h-10 items-center rounded-md border border-gray-200">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="inline-flex size-10 items-center justify-center text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                            aria-label={`Decrease quantity for ${item.name}`}
                          >
                            <Minus className="size-4" />
                          </button>
                          <span className="min-w-10 px-2 text-center text-sm font-medium text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="inline-flex size-10 items-center justify-center text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                            aria-label={`Increase quantity for ${item.name}`}
                          >
                            <Plus className="size-4" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900"
                        >
                          <Trash2 className="size-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

<<<<<<< HEAD
        {cart.length > 0 ? (
          <SheetFooter className="sticky bottom-0 border-t border-gray-200 bg-white px-6 py-4">
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-semibold text-gray-900">
                Rs. {cartTotal.toLocaleString("en-IN")}
              </span>
            </div>
            <Button asChild className="h-12 w-full">
              <Link href="/checkout" onClick={() => setCartOpen(false)}>
                Proceed to Checkout
              </Link>
            </Button>
            <button
              type="button"
              onClick={clearCart}
              className="mt-3 w-full text-sm text-gray-500 transition-colors hover:text-gray-900"
            >
              Clear cart
            </button>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
=======
export default CartDrawer;
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
