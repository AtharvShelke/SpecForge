'use client';

import React, { useState, useEffect } from 'react';
import { useShop } from '@/context/ShopContext';
import { useRouter } from 'next/navigation';
import { processCheckout } from '@/app/actions/checkout';
import { calculateOrderFinancials } from '@/lib/gst';
import { CreditCard, ShoppingBag, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
    const { cart, cartTotal, setCartOpen, clearCart } = useShop();
    const router = useRouter();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const [formData, setFormData] = useState({
        customerName: '',
        email: '',
        phone: '',
        shippingStreet: '',
        shippingCity: '',
        shippingState: '',
        shippingZip: '',
        shippingCountry: 'India'
    });

    // Close drawer if opened over this page
    useEffect(() => {
        setCartOpen(false);
    }, [setCartOpen]);

    if (successMessage) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full text-center space-y-8 bg-white p-10 rounded-2xl shadow-xl">
                    <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
                    <h2 className="text-3xl font-extrabold text-gray-900">Payment Successful!</h2>
                    <p className="text-gray-600 text-sm">
                        {successMessage}
                    </p>
                    <Link
                        href="/"
                        className="mt-6 w-full inline-flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>
        );
    }

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <ShoppingBag className="h-16 w-16 text-gray-400 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900">Your cart is empty</h2>
                <p className="text-gray-500 mt-2 mb-6">Add some products to your cart before checking out.</p>
                <Link
                    href="/products"
                    className="flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700"
                >
                    <ArrowLeft size={16} /> Back to Products
                </Link>
            </div>
        );
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await processCheckout({
                ...formData,
                items: cart.map(item => ({
                    productId: item.id,
                    quantity: item.quantity,
                }))
            });

            if (res.success) {
                // Mock clear cart if standard clearCart doesn't exist, though we typed it earlier.
                if (clearCart) clearCart();
                setSuccessMessage(`Order #${res.orderId} placed successfully. We've sent a confirmation to your Email and WhatsApp.`);
            } else {
                alert(res.error || 'Failed to place order.');
            }
        } catch (error) {
            console.error(error);
            alert('An unexpected error occurred during checkout.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const { subtotal, gstAmount, total } = calculateOrderFinancials(cart);

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft size={16} className="mr-1" /> Back
                    </button>
                    <h1 className="mt-4 text-3xl font-extrabold text-gray-900 tracking-tight">Checkout</h1>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Form Section */}
                    <div className="flex-1">
                        <form id="checkout-form" onSubmit={handleSubmit} className="bg-white shadow-sm rounded-2xl p-6 sm:p-8 border border-gray-100">

                            <h2 className="text-lg font-semibold text-gray-900 mb-6">Contact Information</h2>

                            <div className="grid grid-cols-1 gap-y-5 gap-x-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">Full Name *</label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="customerName"
                                            id="customerName"
                                            required
                                            value={formData.customerName}
                                            onChange={handleInputChange}
                                            className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-4 py-3 bg-gray-50"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address *</label>
                                    <div className="mt-1">
                                        <input
                                            type="email"
                                            name="email"
                                            id="email"
                                            required
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-4 py-3 bg-gray-50"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number (WhatsApp) *</label>
                                    <div className="mt-1">
                                        <input
                                            type="tel"
                                            name="phone"
                                            id="phone"
                                            required
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-4 py-3 bg-gray-50"
                                            placeholder="+91 9876543210"
                                        />
                                    </div>
                                </div>
                            </div>

                            <hr className="my-8 border-gray-100" />

                            <h2 className="text-lg font-semibold text-gray-900 mb-6">Shipping Details</h2>

                            <div className="grid grid-cols-1 gap-y-5 gap-x-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label htmlFor="shippingStreet" className="block text-sm font-medium text-gray-700">Street Address</label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="shippingStreet"
                                            id="shippingStreet"
                                            value={formData.shippingStreet}
                                            onChange={handleInputChange}
                                            className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-4 py-3 bg-gray-50"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="shippingCity" className="block text-sm font-medium text-gray-700">City</label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="shippingCity"
                                            id="shippingCity"
                                            value={formData.shippingCity}
                                            onChange={handleInputChange}
                                            className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-4 py-3 bg-gray-50"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="shippingState" className="block text-sm font-medium text-gray-700">State / Province</label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="shippingState"
                                            id="shippingState"
                                            value={formData.shippingState}
                                            onChange={handleInputChange}
                                            className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-4 py-3 bg-gray-50"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="shippingZip" className="block text-sm font-medium text-gray-700">ZIP / Postal Code</label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="shippingZip"
                                            id="shippingZip"
                                            value={formData.shippingZip}
                                            onChange={handleInputChange}
                                            className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-4 py-3 bg-gray-50"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="shippingCountry" className="block text-sm font-medium text-gray-700">Country</label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="shippingCountry"
                                            id="shippingCountry"
                                            value={formData.shippingCountry}
                                            onChange={handleInputChange}
                                            className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-4 py-3 bg-gray-50"
                                        />
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Order Summary & Pay */}
                    <div className="lg:w-[400px]">
                        <div className="bg-white shadow-sm rounded-2xl border border-gray-100 sticky top-8 overflow-hidden">
                            <div className="p-6 sm:p-8">
                                <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h2>

                                <ul className="divide-y divide-gray-100 flex-1 overflow-y-auto max-h-[40vh] pr-2">
                                    {cart.map((product) => (
                                        <li key={product.id} className="py-4 flex gap-4">
                                            <div className="h-16 w-16 flex-shrink-0 bg-gray-50 rounded-lg p-1 border border-gray-100">
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                            <div className="flex-1 flex flex-col justify-center">
                                                <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{product.name}</h3>
                                                <p className="mt-1 text-sm text-gray-500">Qty: {product.quantity}</p>
                                            </div>
                                            <div className="flex-shrink-0 text-sm font-medium text-gray-900 mt-0.5">
                                                ₹{(product.price * product.quantity).toLocaleString('en-IN')}
                                            </div>
                                        </li>
                                    ))}
                                </ul>

                                <div className="border-t border-gray-100 mt-6 pt-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-gray-600">Subtotal</p>
                                        <p className="text-sm font-medium text-gray-900">₹{subtotal.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-gray-600">GST (18%)</p>
                                        <p className="text-sm font-medium text-gray-900">₹{gstAmount.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-gray-600">Shipping</p>
                                        <p className="text-sm font-medium text-green-600">Free</p>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                                        <p className="text-base font-bold text-gray-900">Total</p>
                                        <p className="text-xl font-bold text-gray-900">₹{total.toLocaleString('en-IN')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-6 sm:p-8 border-t border-gray-100">
                                <button
                                    type="submit"
                                    form="checkout-form"
                                    disabled={isSubmitting}
                                    className="w-full flex items-center justify-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75 disabled:cursor-wait transition-all"
                                >
                                    {isSubmitting ? 'Processing...' : (
                                        <>
                                            <CreditCard size={20} />
                                            Pay ₹{total.toLocaleString('en-IN')} (Mock)
                                        </>
                                    )}
                                </button>
                                <p className="mt-4 text-xs text-center text-gray-500">
                                    By clicking pay, your order will be generated and confirmation will be sent to WhatsApp and Email.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
