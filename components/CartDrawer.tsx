'use client';
import React, { useState, useEffect } from 'react';
import { useShop } from '@/context/ShopContext';
import { useBuild } from '@/context/BuildContext';
import { X, Trash2, AlertOctagon, CheckCircle2, AlertTriangle, CreditCard, Banknote, Save, ShoppingBag } from 'lucide-react';
import { CompatibilityLevel, CompatibilityIssue } from '@/types';
import Link from 'next/link';

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
  const {
    compatibilityReport,
    saveCurrentBuild,
  } = useBuild();

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
      <div className="absolute inset-0 bg-black/5 backdrop-blur-[2px] transition-opacity" onClick={() => setCartOpen(false)} />

      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md pointer-events-auto">
          <div className="h-full flex flex-col bg-white shadow-xl">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-6 sm:px-6 border-b border-gray-100">
              <h2 className="text-lg font-medium text-gray-900">Current Build / Cart</h2>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setCartOpen(false)}
              >
                <X size={24} />
              </button>
            </div>

            {/* Compatibility Banner */}
            {cart.length > 0 && (
              <div className={`px-4 py-3 sm:px-6 border-b ${isFatal ? 'bg-red-50 border-red-100' :
                !isCompatible ? 'bg-yellow-50 border-yellow-100' :
                  'bg-green-50 border-green-100'
                }`}>
                <div className="flex items-start gap-3">
                  {isFatal ? <AlertOctagon className="text-red-600 mt-0.5" size={20} /> :
                    !isCompatible ? <AlertTriangle className="text-yellow-600 mt-0.5" size={20} /> :
                      <CheckCircle2 className="text-green-600 mt-0.5" size={20} />}
                  <div>
                    <h3 className={`text-sm font-medium ${isFatal ? 'text-red-800' : !isCompatible ? 'text-yellow-800' : 'text-green-800'
                      }`}>
                      {isFatal ? 'Incompatible Build' : !isCompatible ? 'Check Issues' : 'Build is Compatible'}
                    </h3>
                    {compatibilityReport.issues.length > 0 && (
                      <ul className="mt-1 space-y-1">
                        {compatibilityReport.issues.map((issue: CompatibilityIssue, idx: number) => (
                          <li key={idx} className={`text-xs ${issue.level === CompatibilityLevel.INCOMPATIBLE ? 'text-red-700 font-medium' : 'text-yellow-700'
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
            <div className="flex-1 py-6 overflow-y-auto px-4 sm:px-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <CreditCard className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">Your cart is empty.</p>
                  <button onClick={() => setCartOpen(false)} className="mt-4 text-blue-600 font-medium hover:text-blue-500">
                    Continue Shopping &rarr;
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {cart.map((product) => (
                    <li key={product.id} className="py-6 flex">
                      <div className="flex-shrink-0 w-20 h-20 border border-gray-200 rounded-md overflow-hidden bg-gray-50">
                        <img
                          src={product.media?.[0]?.url || '/placeholder.png'}
                          alt={product.name}
                          className="w-full h-full object-center object-cover"
                        />
                      </div>
                      <div className="ml-4 flex-1 flex flex-col">
                        <div>
                          <div className="flex justify-between text-base font-medium text-gray-900">
                            <h3>{product.name}</h3>
                            <p className="ml-4">₹{((product.selectedVariant?.price || 0) * product.quantity).toLocaleString('en-IN')}</p>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">{product.category}</p>
                        </div>
                        <div className="flex-1 flex items-end justify-between text-sm">
                          <div className="flex items-center border border-gray-300 rounded">
                            <button
                              onClick={() => updateQuantity(product.id, product.quantity - 1)}
                              className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                            >-</button>
                            <span className="px-2 py-1 text-gray-900">{product.quantity}</span>
                            <button
                              onClick={() => updateQuantity(product.id, product.quantity + 1)}
                              className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                            >+</button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(product.id)}
                            className="font-medium text-red-500 hover:text-red-700 flex items-center gap-1"
                          >
                            <Trash2 size={16} /> Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer / Checkout */}
            {cart.length > 0 && (
              <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                <div className="flex justify-between text-base font-medium text-gray-900 mb-4">
                  <p>Subtotal</p>
                  <p>₹{cartTotal.toLocaleString('en-IN')}</p>
                </div>

                {isNaming ? (
                  <form onSubmit={handleSaveBuild} className="mb-4 flex gap-2">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Build Name (e.g., Gaming Rig)"
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={buildName}
                      onChange={(e) => setBuildName(e.target.value)}
                    />
                    <button type="submit" className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium">Save</button>
                    <button type="button" onClick={() => setIsNaming(false)} className="bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium">Cancel</button>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsNaming(true)}
                    className="w-full mb-3 flex justify-center items-center gap-2 px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Save size={18} /> Save Build for Later
                  </button>
                )}

                <div className="space-y-3">
                  {/* Clear cart */}
                  <button
                    onClick={() => {
                      if (confirm("Clear entire cart?")) {
                        clearCart();
                      }
                    }}
                    className="w-full flex justify-center items-center gap-2 px-6 py-3 border border-red-200 rounded-md text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100"
                  >
                    <Trash2 size={16} /> Clear Cart
                  </button>
                  <Link
                    href="/checkout"
                    onClick={() => setCartOpen(false)}
                    className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 pointer-events-auto"
                  >
                    <ShoppingBag size={18} className="mr-2" /> Proceed to Checkout
                  </Link>

                  <div className="grid grid-cols-2 gap-3">

                  </div>
                </div>

                <div className="mt-4 flex justify-center text-sm text-center text-gray-500">
                  <p className="text-xs">
                    GST Invoice available upon request after payment.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
