"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useShop } from "@/context/ShopContext";
import { useRouter } from "next/navigation";
import { processCheckout } from "@/app/actions/checkout";
import { calculateOrderFinancials } from "@/lib/gst";
import { PaymentMethodType, PaymentStatus } from "@/types";
import {
  ArrowLeft,
  BadgePercent,
  Building2,
  CheckCircle2,
  CreditCard,
  IndianRupee,
  QrCode,
  ShieldAlert,
  ShoppingBag,
  Smartphone,
} from "lucide-react";
import Link from "next/link";
import ImageUploader from "@/components/uploadthing/ImageUploader";

type PaymentMethod = PaymentMethodType;

type PaymentConfigResponse = {
  manualPaymentDetails: {
    upiId?: string;
    upiName?: string;
    bankAccountName?: string;
    bankAccountNumber?: string;
    bankIfsc?: string;
    bankName?: string;
    bankBranch?: string;
  };
  razorpay: {
    keyId?: string;
    enabled: boolean;
  };
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

const INITIAL_FORM = {
  customerName: "",
  email: "",
  phone: "+91 ",
  shippingStreet: "",
  shippingCity: "",
  shippingState: "",
  shippingZip: "",
  shippingCountry: "India",
};

const MANUAL_DISCOUNT_RATE = 0.02;

const PAYMENT_METHODS = [
  {
    id: PaymentMethodType.UPI,
    title: "UPI Payment",
    description: "Upload your UPI screenshot for admin verification.",
    icon: Smartphone,
  },
  {
    id: PaymentMethodType.BANK_TRANSFER,
    title: "Direct Bank Transfer",
    description: "Transfer to the store account and upload proof.",
    icon: Building2,
  },
  {
    id: PaymentMethodType.RAZORPAY,
    title: "Razorpay",
    description: "Pay instantly with UPI, card, netbanking, or wallet.",
    icon: CreditCard,
  },
] as const;

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const { cart, clearCart, setCartOpen } = useShop();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethodType.RAZORPAY);
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfigResponse | null>(null);

  useEffect(() => {
    setIsAdmin(new URLSearchParams(window.location.search).get("admin") === "true");
  }, []);

  useEffect(() => {
    setCartOpen(false);
  }, [setCartOpen]);

  useEffect(() => {
    fetch("/api/payments/config")
      .then((res) => res.json())
      .then((data: PaymentConfigResponse) => setPaymentConfig(data))
      .catch((error) => {
        console.error("Failed to load payment config", error);
      });
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "phone") {
      let inputVal = value;
      if (inputVal.startsWith("+91 ")) inputVal = inputVal.slice(4);
      else if (inputVal.startsWith("+91")) inputVal = inputVal.slice(3);
      else if (inputVal.startsWith("+9")) inputVal = inputVal.slice(2);
      else if (inputVal.startsWith("+")) inputVal = inputVal.slice(1);

      const digits = inputVal.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, phone: "+91 " + digits }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const financials = useMemo(
    () =>
      calculateOrderFinancials(
        cart.map((item) => ({
          price: item.selectedVariant?.price ?? 0,
          quantity: item.quantity,
        })),
      ),
    [cart],
  );

  const isManualPayment =
    paymentMethod === PaymentMethodType.UPI || paymentMethod === PaymentMethodType.BANK_TRANSFER;
  const discountAmount = isManualPayment ? Number((financials.total * MANUAL_DISCOUNT_RATE).toFixed(2)) : 0;
  const payableTotal = Number((financials.total - discountAmount).toFixed(2));

  const validateCheckoutForm = useCallback(() => {
    if (formData.phone.length !== 14) {
      alert("Please enter a valid 10-digit phone number.");
      return false;
    }

    if (isManualPayment && !paymentProofUrl) {
      alert("Please upload the payment screenshot before placing the order.");
      return false;
    }

    return true;
  }, [formData.phone, isManualPayment, paymentProofUrl]);

  const handleManualCheckout = useCallback(async () => {
    const res = await processCheckout({
      ...formData,
      isPosOverride: isAdmin,
      paymentMethod,
      paymentStatus: isAdmin ? PaymentStatus.COMPLETED : PaymentStatus.PENDING,
      paymentTransactionId: paymentReference || undefined,
      paymentReference: paymentReference || undefined,
      paymentProofUrl: paymentProofUrl || undefined,
      items: cart.map((item) => ({
        productId: item.id,
        variantId: item.selectedVariant?.id || item.variants?.[0]?.id || "",
        quantity: item.quantity,
      })),
    });

    if (!res.success) {
      throw new Error(res.error ?? "Failed to place order.");
    }

    clearCart?.();
    setSuccessMessage(
      isAdmin
        ? `Order #${res.orderId} has been created and inventory was reserved successfully.`
        : `Order #${res.orderId} has been placed. Our admin team will verify your payment proof shortly.`,
    );
  }, [
    cart,
    clearCart,
    formData,
    isAdmin,
    paymentMethod,
    paymentProofUrl,
    paymentReference,
  ]);

  const handleRazorpayCheckout = useCallback(async () => {
    const scriptLoaded = await loadRazorpayScript();
    const RazorpayCheckout = window.Razorpay;
    if (!scriptLoaded || !RazorpayCheckout) {
      throw new Error("Unable to load Razorpay checkout.");
    }

    const createRes = await fetch("/api/payments/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        items: cart.map((item) => ({
          productId: item.id,
          variantId: item.selectedVariant?.id || item.variants?.[0]?.id || "",
          quantity: item.quantity,
        })),
      }),
    });

    const createPayload = await createRes.json();
    if (!createRes.ok) {
      throw new Error(createPayload.error || "Unable to initialize Razorpay payment.");
    }

    await new Promise<void>((resolve, reject) => {
      const instance = new RazorpayCheckout({
        key: createPayload.keyId,
        amount: createPayload.amount,
        currency: createPayload.currency,
        order_id: createPayload.razorpayOrderId,
        name: "MD Computers",
        description: `Order ${createPayload.orderId}`,
        prefill: {
          name: formData.customerName,
          email: formData.email,
          contact: formData.phone.replace(/\s+/g, ""),
        },
        theme: {
          color: "#2563eb",
        },
        handler: async (response: Record<string, string>) => {
          try {
            const verifyRes = await fetch("/api/payments/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: createPayload.orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            const verifyPayload = await verifyRes.json();
            if (!verifyRes.ok) {
              reject(new Error(verifyPayload.error || "Unable to verify payment."));
              return;
            }

            clearCart?.();
            setSuccessMessage(
              `Order #${createPayload.orderId} has been paid successfully through Razorpay.`,
            );
            resolve();
          } catch (error) {
            reject(error);
          }
        },
        modal: {
          ondismiss: () => reject(new Error("Razorpay checkout was closed before payment completed.")),
        },
      });

      if (!instance) {
        reject(new Error("Unable to initialize Razorpay checkout."));
        return;
      }

      instance.open();
    });
  }, [cart, clearCart, formData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateCheckoutForm()) return;

      setIsSubmitting(true);
      try {
        if (isAdmin || isManualPayment) {
          await handleManualCheckout();
        } else {
          await handleRazorpayCheckout();
        }
      } catch (error: unknown) {
        console.error(error);
        alert(error instanceof Error ? error.message : "An unexpected error occurred during checkout.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [handleManualCheckout, handleRazorpayCheckout, isAdmin, isManualPayment, validateCheckoutForm],
  );

  if (successMessage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center space-y-8 bg-white p-10 rounded-2xl shadow-xl">
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
          <h2 className="text-3xl font-extrabold text-gray-900">
            {paymentMethod === PaymentMethodType.RAZORPAY ? "Payment Successful!" : "Order Received!"}
          </h2>
          <p className="text-gray-600 text-sm">{successMessage}</p>
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
        <Link href="/products" className="flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700">
          <ArrowLeft size={16} /> Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
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
          <div className="flex-1">
            <form id="checkout-form" onSubmit={handleSubmit} className="bg-white shadow-sm rounded-2xl p-6 sm:p-8 border border-gray-100 space-y-8">
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Contact Information</h2>
                <div className="grid grid-cols-1 gap-y-5 gap-x-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">Full Name *</label>
                    <input type="text" name="customerName" id="customerName" required value={formData.customerName} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-4 py-3 bg-gray-50" placeholder="John Doe" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address *</label>
                    <input type="email" name="email" id="email" required value={formData.email} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-4 py-3 bg-gray-50" placeholder="john@example.com" />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number (WhatsApp) *</label>
                    <input type="tel" name="phone" id="phone" required value={formData.phone} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-4 py-3 bg-gray-50" placeholder="+91 9876543210" minLength={14} maxLength={14} />
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Shipping Details</h2>
                <div className="grid grid-cols-1 gap-y-5 gap-x-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="shippingStreet" className="block text-sm font-medium text-gray-700">Street Address</label>
                    <input type="text" name="shippingStreet" id="shippingStreet" value={formData.shippingStreet} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-4 py-3 bg-gray-50" />
                  </div>
                  <div>
                    <label htmlFor="shippingCity" className="block text-sm font-medium text-gray-700">City</label>
                    <input type="text" name="shippingCity" id="shippingCity" value={formData.shippingCity} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-4 py-3 bg-gray-50" />
                  </div>
                  <div>
                    <label htmlFor="shippingState" className="block text-sm font-medium text-gray-700">State / Province</label>
                    <input type="text" name="shippingState" id="shippingState" value={formData.shippingState} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-4 py-3 bg-gray-50" />
                  </div>
                  <div>
                    <label htmlFor="shippingZip" className="block text-sm font-medium text-gray-700">ZIP / Postal Code</label>
                    <input type="text" name="shippingZip" id="shippingZip" value={formData.shippingZip} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-4 py-3 bg-gray-50" />
                  </div>
                  <div>
                    <label htmlFor="shippingCountry" className="block text-sm font-medium text-gray-700">Country</label>
                    <input type="text" name="shippingCountry" id="shippingCountry" value={formData.shippingCountry} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-4 py-3 bg-gray-50" />
                  </div>
                </div>
              </section>

              {!isAdmin && (
                <section className="space-y-5">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Payment Method</h2>
                      <p className="text-sm text-gray-500 mt-1">Choose how you want to complete this order.</p>
                    </div>
                    {isManualPayment && (
                      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1.5 text-xs font-semibold">
                        <BadgePercent size={14} />
                        2% discount applied for UPI / bank transfer
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {PAYMENT_METHODS.map((method) => {
                      const Icon = method.icon;
                      const active = paymentMethod === method.id;
                      const disabled = method.id === PaymentMethodType.RAZORPAY && paymentConfig?.razorpay?.enabled === false;

                      return (
                        <button
                          key={method.id}
                          type="button"
                          disabled={disabled || isSubmitting}
                          onClick={() => setPaymentMethod(method.id)}
                          className={`rounded-2xl border p-4 text-left transition-all ${active ? "border-blue-500 bg-blue-50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`rounded-xl p-2 ${active ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                              <Icon size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{method.title}</p>
                              <p className="text-xs text-gray-500 mt-1">{method.description}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {isManualPayment && (
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 space-y-5">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl bg-white border border-gray-200 p-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <QrCode size={16} className="text-blue-600" />
                            UPI Details
                          </div>
                          <div className="mt-3 space-y-2 text-sm text-gray-600">
                            <p><span className="font-medium text-gray-900">UPI ID:</span> {paymentConfig?.manualPaymentDetails?.upiId || "Add NEXT_PUBLIC_STORE_UPI_ID"}</p>
                            <p><span className="font-medium text-gray-900">Payee:</span> {paymentConfig?.manualPaymentDetails?.upiName || "Add NEXT_PUBLIC_STORE_UPI_NAME"}</p>
                          </div>
                        </div>
                        <div className="rounded-2xl bg-white border border-gray-200 p-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <Building2 size={16} className="text-blue-600" />
                            Bank Transfer Details
                          </div>
                          <div className="mt-3 space-y-2 text-sm text-gray-600">
                            <p><span className="font-medium text-gray-900">Account Name:</span> {paymentConfig?.manualPaymentDetails?.bankAccountName || "Add NEXT_PUBLIC_STORE_BANK_ACCOUNT_NAME"}</p>
                            <p><span className="font-medium text-gray-900">Account Number:</span> {paymentConfig?.manualPaymentDetails?.bankAccountNumber || "Add NEXT_PUBLIC_STORE_BANK_ACCOUNT_NUMBER"}</p>
                            <p><span className="font-medium text-gray-900">IFSC:</span> {paymentConfig?.manualPaymentDetails?.bankIfsc || "Add NEXT_PUBLIC_STORE_BANK_IFSC"}</p>
                            <p><span className="font-medium text-gray-900">Bank:</span> {paymentConfig?.manualPaymentDetails?.bankName || "Add NEXT_PUBLIC_STORE_BANK_NAME"}</p>
                            <p><span className="font-medium text-gray-900">Branch:</span> {paymentConfig?.manualPaymentDetails?.bankBranch || "Add NEXT_PUBLIC_STORE_BANK_BRANCH"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <p className="text-sm font-semibold text-emerald-800">
                          Payable after 2% discount: Rs. {payableTotal.toLocaleString("en-IN")}
                        </p>
                        <p className="text-xs text-emerald-700 mt-1">
                          Complete the payment first, then upload the screenshot below so the admin can verify it.
                        </p>
                      </div>

                      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Screenshot *</label>
                          <ImageUploader
                            endpoint="paymentProofUploader"
                            previewUrl={paymentProofUrl || undefined}
                            onUploadComplete={(url) => setPaymentProofUrl(url)}
                            onUploadError={(error) => alert(error.message)}
                          />
                        </div>
                        <div>
                          <label htmlFor="paymentReference" className="block text-sm font-medium text-gray-700">UTR / Reference Number</label>
                          <input
                            type="text"
                            id="paymentReference"
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value)}
                            className="mt-2 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-4 py-3 bg-white"
                            placeholder={paymentMethod === PaymentMethodType.UPI ? "Enter UPI UTR" : "Enter bank reference"}
                          />
                          <p className="mt-2 text-xs text-gray-500">
                            This helps the admin match your screenshot faster during verification.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </form>
          </div>

          <div className="lg:w-[420px]">
            <div className="bg-white shadow-sm rounded-2xl border border-gray-100 sticky top-8 overflow-hidden">
              <div className="p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h2>
                <ul className="divide-y divide-gray-100 flex-1 overflow-y-auto max-h-[40vh] pr-2">
                  {cart.map((product) => (
                    <li key={product.id} className="py-4 flex gap-4">
                      <div className="h-16 w-16 flex-shrink-0 bg-gray-50 rounded-lg p-1 border border-gray-100">
                        <img
                          src={product.media?.[0]?.url ?? "/placeholder.png"}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{product.name}</h3>
                        <p className="mt-1 text-sm text-gray-500">Qty: {product.quantity}</p>
                      </div>
                      <div className="flex-shrink-0 text-sm font-medium text-gray-900 mt-0.5">
                        Rs. {((product.selectedVariant?.price ?? 0) * product.quantity).toLocaleString("en-IN")}
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-gray-100 mt-6 pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Subtotal</p>
                    <p className="text-sm font-medium text-gray-900">Rs. {financials.subtotal.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">GST (18%)</p>
                    <p className="text-sm font-medium text-gray-900">Rs. {financials.gstAmount.toLocaleString("en-IN")}</p>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-emerald-700">Manual payment discount (2%)</p>
                      <p className="text-sm font-semibold text-emerald-700">- Rs. {discountAmount.toLocaleString("en-IN")}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Shipping</p>
                    <p className="text-sm font-medium text-green-600">Free</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                    <p className="text-base font-bold text-gray-900">Total</p>
                    <p className="text-xl font-bold text-gray-900">Rs. {payableTotal.toLocaleString("en-IN")}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 sm:p-8 border-t border-gray-100">
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isSubmitting || (!isAdmin && paymentMethod === PaymentMethodType.RAZORPAY && paymentConfig?.razorpay?.enabled === false)}
                  className={`w-full flex items-center justify-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-75 disabled:cursor-wait transition-all ${isAdmin ? "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500" : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"}`}
                >
                  {isSubmitting ? (
                    "Processing..."
                  ) : isAdmin ? (
                    <><ShieldAlert size={20} /> Admin Manual Reserve</>
                  ) : paymentMethod === PaymentMethodType.RAZORPAY ? (
                    <><CreditCard size={20} /> Pay Rs. {payableTotal.toLocaleString("en-IN")} with Razorpay</>
                  ) : (
                    <><IndianRupee size={20} /> Submit Proof for Rs. {payableTotal.toLocaleString("en-IN")}</>
                  )}
                </button>
                <p className="mt-4 text-xs text-center text-gray-500">
                  {isAdmin
                    ? "This bypasses customer gateway payment and directly reserves inventory."
                    : paymentMethod === PaymentMethodType.RAZORPAY
                      ? "Razorpay will complete the payment instantly and mark the order as paid."
                      : "Your order is created immediately and moves to paid after the admin verifies your screenshot."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
