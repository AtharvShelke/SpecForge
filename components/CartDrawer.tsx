'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useShop } from '@/context/ShopContext';
import { useToast } from '@/hooks/use-toast';
import { X, Trash2, AlertOctagon, CheckCircle2, AlertTriangle, CreditCard, Save, ShoppingBag } from 'lucide-react';
import { CompatibilityLevel, CompatibilityIssue } from '@/types';
import Link from 'next/link';
import { validateBuild } from '@/lib/calculations/compatibility';
import { getBaseUrl } from '@/lib/utils';

const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setCartOpen,
    cart,
    removeFromCart,
    updateQuantity,
    cartTotal,
    clearCart
  } = useShop();
  const { toast } = useToast();

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
            variantId: i.selectedVariant?.id ?? i.variants?.[0]?.id ?? '',
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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity" onClick={() => setCartOpen(false)} />

      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-[85vw] sm:max-w-md pointer-events-auto transition-transform duration-300 ease-in-out">
          <div className="h-full flex flex-col bg-white shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 sm:px-6 border-b border-gray-100">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Current Build</h2>
              <button
                type="button"
                className="p-1 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
                onClick={() => setCartOpen(false)}
              >
                <X size={22} />
              </button>
            </div>

            {/* Compatibility Banner */}
            {cart.length > 0 && (
              <div className={`px-4 py-2 sm:py-3 sm:px-6 border-b ${isFatal ? 'bg-red-50 border-red-100' :
                !isCompatible ? 'bg-yellow-50 border-yellow-100' :
                  'bg-green-50 border-green-100'
                }`}>
                <div className="flex items-start gap-2 sm:gap-3">
                  {isFatal ? <AlertOctagon className="text-red-600 mt-0.5" size={18} /> :
                    !isCompatible ? <AlertTriangle className="text-yellow-600 mt-0.5" size={18} /> :
                      <CheckCircle2 className="text-green-600 mt-0.5" size={18} />}
                  <div>
                    <h3 className={`text-xs sm:text-sm font-bold ${isFatal ? 'text-red-800' : !isCompatible ? 'text-yellow-800' : 'text-green-800'
                      }`}>
                      {isFatal ? 'Incompatible Build' : !isCompatible ? 'Check Issues' : 'Compatible Build'}
                    </h3>
                    {compatibilityReport.issues.length > 0 && (
                      <ul className="mt-0.5 space-y-0.5">
                        {compatibilityReport.issues.map((issue: CompatibilityIssue, idx: number) => (
                          <li key={idx} className={`text-[10px] sm:text-xs ${issue.level === CompatibilityLevel.INCOMPATIBLE ? 'text-red-700 font-medium' : 'text-yellow-700'
                            }`}>
                            • {issue.message}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

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
                            ₹{((product.selectedVariant?.price || 0) * product.quantity).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider mt-0.5">
                          {product.category?.name || 'Uncategorized'}
                        </p>

                        <div className="flex-1 flex items-end justify-between mt-2">
                          <div className="flex items-center border border-gray-200 rounded-md bg-gray-50 overflow-hidden">
                            <button
                              onClick={() => updateQuantity(product.id, product.quantity - 1)}
                              className="px-2 py-0.5 text-gray-500 hover:bg-gray-200 transition-colors"
                            >-</button>
                            <span className="px-2 py-0.5 text-xs font-bold text-gray-700 min-w-[24px] text-center">
                              {product.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(product.id, product.quantity + 1)}
                              className="px-2 py-0.5 text-gray-500 hover:bg-gray-200 transition-colors"
                            >+</button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(product.id)}
                            className="text-xs font-medium text-red-500 hover:text-red-600 flex items-center gap-1 p-1"
                          >
                            <Trash2 size={14} /> <span className="hidden sm:inline">Remove</span>
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="border-t border-gray-100 px-3 py-3 sm:px-6 bg-gray-50/40">
                <div className="flex justify-between items-center mb-2 px-1">
                  <p className="text-xs text-gray-500 font-medium">Subtotal</p>
                  <p className="text-base font-bold text-gray-900">₹{cartTotal.toLocaleString('en-IN')}</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  {isNaming ? (
                    <form onSubmit={handleSaveBuild} className="flex flex-col gap-1.5 mb-1">
                      <input
                        autoFocus
                        type="text"
                        placeholder="Build Name..."
                        className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                        value={buildName}
                        onChange={(e) => setBuildName(e.target.value)}
                      />
                      <div className="flex gap-1.5">
                        <button type="submit" className="flex-1 bg-blue-600 text-white py-1.5 rounded-md text-xs font-bold">Save</button>
                        <button type="button" onClick={() => setIsNaming(false)} className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-md text-xs font-medium">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setIsNaming(true)}
                      className="w-full flex justify-center items-center gap-2 px-3 py-2 border border-gray-200 rounded-md text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 active:scale-95 transition-all"
                    >
                      <Save size={14} /> Save Build
                    </button>
                  )}

                  <Link
                    href="/checkout"
                    onClick={() => setCartOpen(false)}
                    className="w-full flex justify-center items-center px-3 py-2.5 rounded-md shadow-sm text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all"
                  >
                    <ShoppingBag size={16} className="mr-2" /> Proceed to Checkout
                  </Link>

                  <button
                    onClick={() => clearCart()}
                    className="w-full py-1 text-[10px] font-bold text-red-400/80 hover:text-red-500 uppercase tracking-tighter transition-colors"
                  >
                    Clear Cart
                  </button>
                </div>

                <p className="mt-2 text-center text-[9px] text-gray-400 leading-none">
                  GST Invoice available upon request.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
