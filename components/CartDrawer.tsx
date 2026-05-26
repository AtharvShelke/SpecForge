"use client";

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
