"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  Lock,
  Smartphone,
} from "lucide-react";

import { processCheckout } from "@/app/actions/checkout";
import ImageUploader from "@/components/uploadthing/ImageUploader";
import { Button } from "@/components/ui/button";
import { useShop } from "@/context/ShopContext";

import { PaymentMethodType, PaymentStatus } from "@/types";
import { calculateOrderFinancials } from "@/lib/tax-engine";

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
    id: PaymentMethodType.RAZORPAY,
    title: "Pay online",
    description: "Card, UPI, wallet, or netbanking.",
    icon: CreditCard,
  },
  {
    id: PaymentMethodType.UPI,
    title: "UPI transfer",
    description: "Pay first, then upload proof.",
    icon: Smartphone,
  },
  {
    id: PaymentMethodType.BANK_TRANSFER,
    title: "Bank transfer",
    description: "Share your payment reference after transfer.",
    icon: Building2,
  },
] as const;

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );
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

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-gray-200 bg-white p-6">
      <h2 className="text-base font-medium text-gray-900">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      ) : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm text-gray-700">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function CheckoutPage() {
  const { cart, clearCart, setCartOpen } = useShop();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethodType.RAZORPAY,
  );
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentConfig, setPaymentConfig] =
    useState<PaymentConfigResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setCartOpen(false);
  }, [setCartOpen]);

  useEffect(() => {
    fetch("/api/payments/config")
      .then((response) => response.json())
      .then((data: PaymentConfigResponse) => setPaymentConfig(data))
      .catch(() => {
        setPaymentConfig(null);
      });
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
    paymentMethod === PaymentMethodType.UPI ||
    paymentMethod === PaymentMethodType.BANK_TRANSFER;
  const discountAmount = isManualPayment
    ? Number((financials.total * MANUAL_DISCOUNT_RATE).toFixed(2))
    : 0;
  const payableTotal = Number((financials.total - discountAmount).toFixed(2));

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;
      setFormError("");

      if (name === "phone") {
        let nextValue = value;
        if (nextValue.startsWith("+91 ")) nextValue = nextValue.slice(4);
        else if (nextValue.startsWith("+91")) nextValue = nextValue.slice(3);
        else if (nextValue.startsWith("+9")) nextValue = nextValue.slice(2);
        else if (nextValue.startsWith("+")) nextValue = nextValue.slice(1);

        const digits = nextValue.replace(/\D/g, "").slice(0, 10);
        setFormData((current) => ({ ...current, phone: `+91 ${digits}` }));
        return;
      }

      setFormData((current) => ({ ...current, [name]: value }));
    },
    [],
  );

  const validateCheckoutForm = useCallback(() => {
    if (!formData.customerName || !formData.email) {
      return "Please complete your contact information.";
    }

    if (formData.phone.length !== 14) {
      return "Please enter a valid 10-digit phone number.";
    }

    if (isManualPayment && !paymentProofUrl) {
      return "Upload your payment proof before placing the order.";
    }

    return "";
  }, [formData, isManualPayment, paymentProofUrl]);

  const handleManualCheckout = useCallback(async () => {
    const response = await processCheckout({
      ...formData,
      paymentMethod,
      paymentStatus: PaymentStatus.PENDING,
      paymentTransactionId: paymentReference || undefined,
      paymentReference: paymentReference || undefined,
      paymentProofUrl: paymentProofUrl || undefined,
      items: cart.map((item) => ({
        productId: item.id,
        variantId: item.selectedVariant?.id || item.variants?.[0]?.id || "",
        quantity: item.quantity,
      })),
    });

    if (!response.success) {
      throw new Error(response.error ?? "We could not place your order.");
    }

    clearCart?.();
    setSuccessMessage(
      `Order #${response.orderId} has been placed. We will verify your payment and email you the next steps.`,
    );
  }, [
    cart,
    clearCart,
    formData,
    paymentMethod,
    paymentProofUrl,
    paymentReference,
  ]);

  const handleRazorpayCheckout = useCallback(async () => {
    const scriptLoaded = await loadRazorpayScript();
    const RazorpayCheckout = window.Razorpay;
    if (!scriptLoaded || !RazorpayCheckout) {
      throw new Error("Online payment is unavailable right now.");
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
      throw new Error(createPayload.error || "Unable to start online payment.");
    }

    await new Promise<void>((resolve, reject) => {
      const instance = new RazorpayCheckout({
        key: createPayload.keyId,
        amount: createPayload.amount,
        currency: createPayload.currency,
        order_id: createPayload.razorpayOrderId,
        name: "Computer Store",
        description: `Order ${createPayload.orderId}`,
        prefill: {
          name: formData.customerName,
          email: formData.email,
          contact: formData.phone.replace(/\s+/g, ""),
        },
        theme: {
          color: "#000000",
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
              reject(
                new Error(verifyPayload.error || "Unable to verify payment."),
              );
              return;
            }

            clearCart?.();
            setSuccessMessage(
              `Order #${createPayload.orderId} has been paid successfully.`,
            );
            resolve();
          } catch (error) {
            reject(error);
          }
        },
        modal: {
          ondismiss: () =>
            reject(new Error("Payment was cancelled before completion.")),
        },
      });

      instance.open();
    });
  }, [cart, clearCart, formData]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validateCheckoutForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError("");
    setIsSubmitting(true);

    try {
      if (isManualPayment) {
        await handleManualCheckout();
      } else {
        await handleRazorpayCheckout();
      }
    } catch (error: unknown) {
      setFormError(
        error instanceof Error
          ? error.message
          : "We could not complete checkout. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successMessage) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto flex min-h-screen max-w-2xl items-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full border border-gray-200 bg-white p-8 text-center">
            <p className="text-sm uppercase tracking-[0.16em] text-gray-500">
              Order confirmed
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-gray-900">
              Checkout complete
            </h1>
            <p className="mt-4 text-sm leading-7 text-gray-600">
              {successMessage}
            </p>
            <Button asChild className="mt-8 h-12 px-6">
              <Link href="/products">Continue shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto flex min-h-screen max-w-2xl items-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full border border-gray-200 bg-white p-8 text-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              Your cart is empty
            </h1>
            <p className="mt-3 text-sm text-gray-500">
              Add a few products before heading to checkout.
            </p>
            <Button asChild variant="outline" className="mt-8 h-12 px-6">
              <Link href="/products">Back to products</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <div className="inline-flex items-center gap-2 text-sm text-gray-500">
            <Lock className="size-4" />
            Secure checkout
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.16em] text-gray-500">
            Guest checkout
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-gray-900">
            Checkout
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Complete your order as a guest, or{" "}
            <Link
              href="/login"
              className="text-gray-900 underline underline-offset-4"
            >
              log in
            </Link>{" "}
            to use an existing account.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <form
            id="checkout-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <Section
              title="Contact information"
              description="We will use these details for order updates and delivery communication."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Full name" htmlFor="customerName">
                    <input
                      id="customerName"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      className="h-12 w-full border border-gray-200 px-4 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
                      required
                    />
                  </Field>
                </div>
                <Field label="Email address" htmlFor="email">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="h-12 w-full border border-gray-200 px-4 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
                    required
                  />
                </Field>
                <Field label="Phone number" htmlFor="phone">
                  <input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    minLength={14}
                    maxLength={14}
                    className="h-12 w-full border border-gray-200 px-4 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
                    required
                  />
                </Field>
              </div>
            </Section>

            <Section
              title="Shipping and billing"
              description="Billing is assumed to be the same as shipping unless we hear otherwise."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Street address" htmlFor="shippingStreet">
                    <input
                      id="shippingStreet"
                      name="shippingStreet"
                      value={formData.shippingStreet}
                      onChange={handleInputChange}
                      className="h-12 w-full border border-gray-200 px-4 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
                    />
                  </Field>
                </div>
                <Field label="City" htmlFor="shippingCity">
                  <input
                    id="shippingCity"
                    name="shippingCity"
                    value={formData.shippingCity}
                    onChange={handleInputChange}
                    className="h-12 w-full border border-gray-200 px-4 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
                  />
                </Field>
                <Field label="State" htmlFor="shippingState">
                  <input
                    id="shippingState"
                    name="shippingState"
                    value={formData.shippingState}
                    onChange={handleInputChange}
                    className="h-12 w-full border border-gray-200 px-4 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
                  />
                </Field>
                <Field label="PIN / ZIP" htmlFor="shippingZip">
                  <input
                    id="shippingZip"
                    name="shippingZip"
                    value={formData.shippingZip}
                    onChange={handleInputChange}
                    className="h-12 w-full border border-gray-200 px-4 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
                  />
                </Field>
                <Field label="Country" htmlFor="shippingCountry">
                  <input
                    id="shippingCountry"
                    name="shippingCountry"
                    value={formData.shippingCountry}
                    onChange={handleInputChange}
                    className="h-12 w-full border border-gray-200 px-4 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
                  />
                </Field>
              </div>
            </Section>

            <Section
              title="Payment method"
              description="Choose the fastest way to complete your order."
            >
              <div className="space-y-3">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  const active = paymentMethod === method.id;
                  const disabled =
                    method.id === PaymentMethodType.RAZORPAY &&
                    paymentConfig?.razorpay?.enabled === false;

                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(method.id);
                        setFormError("");
                      }}
                      disabled={disabled || isSubmitting}
                      className={`flex w-full items-start gap-4 border p-4 text-left transition-colors ${
                        active
                          ? "border-black bg-black text-white"
                          : "border-gray-200 bg-white text-gray-900 hover:border-gray-900"
                      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                      <span
                        className={`inline-flex size-10 items-center justify-center border ${
                          active
                            ? "border-white/20 bg-white/10 text-white"
                            : "border-gray-200 bg-gray-50 text-gray-700"
                        }`}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-medium">
                          {method.title}
                        </span>
                        <span
                          className={`mt-1 block text-sm ${active ? "text-gray-200" : "text-gray-500"}`}
                        >
                          {method.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {isManualPayment ? (
                <div className="mt-6 space-y-5 border-t border-gray-200 pt-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="border border-gray-200 p-4 text-sm text-gray-600">
                      <p className="font-medium text-gray-900">UPI details</p>
                      <p className="mt-3">
                        UPI ID:{" "}
                        {paymentConfig?.manualPaymentDetails?.upiId ||
                          "Not configured"}
                      </p>
                      <p className="mt-1">
                        Payee:{" "}
                        {paymentConfig?.manualPaymentDetails?.upiName ||
                          "Not configured"}
                      </p>
                    </div>
                    <div className="border border-gray-200 p-4 text-sm text-gray-600">
                      <p className="font-medium text-gray-900">Bank details</p>
                      <p className="mt-3">
                        Account:{" "}
                        {paymentConfig?.manualPaymentDetails?.bankAccountName ||
                          "Not configured"}
                      </p>
                      <p className="mt-1">
                        Number:{" "}
                        {paymentConfig?.manualPaymentDetails
                          ?.bankAccountNumber || "Not configured"}
                      </p>
                      <p className="mt-1">
                        IFSC:{" "}
                        {paymentConfig?.manualPaymentDetails?.bankIfsc ||
                          "Not configured"}
                      </p>
                    </div>
                  </div>

                  <div className="border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                    Pay manually to unlock a 2% discount. Your payable total is{" "}
                    <span className="font-medium text-gray-900">
                      Rs. {payableTotal.toLocaleString("en-IN")}
                    </span>
                    .
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                    <div>
                      <p className="mb-2 text-sm text-gray-700">
                        Payment proof
                      </p>
                      <ImageUploader
                        endpoint="paymentProofUploader"
                        previewUrl={paymentProofUrl || undefined}
                        onUploadComplete={(url) => {
                          setPaymentProofUrl(url);
                          setFormError("");
                        }}
                        onUploadError={(error) => setFormError(error.message)}
                      />
                    </div>
                    <Field
                      label="UTR / reference number"
                      htmlFor="paymentReference"
                    >
                      <input
                        id="paymentReference"
                        value={paymentReference}
                        onChange={(event) =>
                          setPaymentReference(event.target.value)
                        }
                        className="h-12 w-full border border-gray-200 px-4 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
                        placeholder={
                          paymentMethod === PaymentMethodType.UPI
                            ? "Enter UPI reference"
                            : "Enter bank reference"
                        }
                      />
                    </Field>
                  </div>
                </div>
              ) : null}
            </Section>
          </form>

          <aside className="lg:sticky lg:top-24">
            <div className="border border-gray-200 bg-white">
              <div className="border-b border-gray-200 p-6">
                <h2 className="text-base font-medium text-gray-900">
                  Order summary
                </h2>
              </div>

              <div className="max-h-[320px] overflow-y-auto p-6">
                <ul className="space-y-4">
                  {cart.map((item) => (
                    <li
                      key={`${item.id}-${item.selectedVariant?.id ?? "default"}`}
                      className="flex gap-3"
                    >
                      <div className="relative size-16 shrink-0 overflow-hidden border border-gray-200 bg-gray-50">
                        <Image
                          src={item.media?.[0]?.url ?? "/placeholder.png"}
                          alt={item.name}
                          fill
                          sizes="64px"
                          className="object-contain p-2"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm text-gray-900">
                          {item.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Qty {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        Rs.{" "}
                        {(
                          (item.selectedVariant?.price ?? 0) * item.quantity
                        ).toLocaleString("en-IN")}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-gray-200 p-6">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="text-gray-900">
                      Rs. {financials.subtotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span>GST</span>
                    <span className="text-gray-900">
                      Rs. {financials.gstAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="text-gray-900">Free</span>
                  </div>
                  {discountAmount > 0 ? (
                    <div className="flex items-center justify-between text-gray-600">
                      <span>Manual payment discount</span>
                      <span className="text-gray-900">
                        - Rs. {discountAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 border-t border-gray-200 pt-5">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-gray-900">
                      Total
                    </span>
                    <span className="text-2xl font-semibold text-gray-900">
                      Rs. {payableTotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {formError ? (
                    <p className="mt-4 text-sm text-red-600">{formError}</p>
                  ) : null}

                  <Button
                    type="submit"
                    form="checkout-form"
                    className="mt-5 h-12 w-full"
                    disabled={
                      isSubmitting ||
                      (paymentMethod === PaymentMethodType.RAZORPAY &&
                        paymentConfig?.razorpay?.enabled === false)
                    }
                  >
                    {isSubmitting
                      ? "Processing..."
                      : paymentMethod === PaymentMethodType.RAZORPAY
                        ? `Pay Rs. ${payableTotal.toLocaleString("en-IN")}`
                        : `Place order for Rs. ${payableTotal.toLocaleString("en-IN")}`}
                  </Button>

                  <p className="mt-3 text-xs leading-6 text-gray-500">
                    By placing your order, you agree to complete payment and
                    receive order updates by email or phone.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
