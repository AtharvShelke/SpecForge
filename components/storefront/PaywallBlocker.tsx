"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Cpu, Sparkles, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface PaywallBlockerProps {
  isLoggedIn: boolean;
  price: number;
  userEmail?: string;
  userName?: string;
}

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

export default function PaywallBlocker({
  isLoggedIn,
  price,
  userEmail,
  userName,
}: PaywallBlockerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const scriptLoaded = await loadRazorpayScript();
      const RazorpayCheckout = window.Razorpay;
      if (!scriptLoaded || !RazorpayCheckout) {
        throw new Error("Razorpay SDK failed to load. Are you offline?");
      }

      // 1. Create order
      const createRes = await fetch("/api/payments/razorpay/paywall/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const createPayload = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createPayload.error || "Failed to initiate payment.");
      }

      // 2. Open Razorpay modal
      await new Promise<void>((resolve, reject) => {
        const instance = new RazorpayCheckout({
          key: createPayload.keyId,
          amount: createPayload.amount,
          currency: createPayload.currency,
          order_id: createPayload.razorpayOrderId,
          name: "Computer Store",
          description: "One-time PC Builder Access",
          prefill: {
            name: userName || "",
            email: userEmail || "",
          },
          theme: {
            color: "#4f46e5", // Indigo-600 matching brand identity
          },
          handler: async (response: Record<string, string>) => {
            try {
              // 3. Verify signature
              const verifyRes = await fetch("/api/payments/razorpay/paywall/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
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

              setSuccess(true);
              resolve();
              setTimeout(() => {
                router.refresh();
                window.location.reload();
              }, 1500);
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment was cancelled.")),
          },
        });

        instance.open();
      });
    } catch (err: any) {
      console.error("[PaywallBlocker] Error during payment flow:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [userName, userEmail, router]);

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-stone-200/80 shadow-xl shadow-stone-200/40 p-8 text-center relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500" />
        
        {/* Brand Icon */}
        <div className="mx-auto size-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-100 mb-6">
          <Cpu className="text-white size-8 animate-pulse" />
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight flex items-center justify-center gap-2">
          Unlock the PC Builder <Sparkles className="size-5 text-indigo-500 shrink-0" />
        </h1>

        {/* Description */}
        <p className="mt-4 text-stone-500 text-sm leading-relaxed max-w-sm mx-auto">
          Access our custom PC builder with real-time compatibility checks, bottleneck indicators, and automated component matching.
        </p>

        {/* Conditional content */}
        {!isLoggedIn ? (
          <div className="mt-8 space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/60 text-indigo-900 text-xs font-semibold leading-relaxed max-w-xs mx-auto">
              🔑 One-time configuration fee of ₹{price} applies. Log in or create an account to proceed.
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href={`/login?redirect=/builds/new`}
                className="flex-1 inline-flex items-center justify-center rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm h-12 transition-all active:scale-[0.98]"
              >
                Sign In
              </Link>
              <Link
                href={`/register?redirect=/builds/new`}
                className="flex-1 inline-flex items-center justify-center rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-bold text-sm h-12 transition-all active:scale-[0.98]"
              >
                Register
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {/* User Logged In Info */}
            <div className="text-xs text-stone-400 font-medium bg-stone-50 py-2.5 px-4 rounded-xl inline-block border border-stone-100">
              Logged in as <span className="text-stone-700 font-semibold">{userEmail}</span>
            </div>

            {/* Price Box */}
            <div className="border border-stone-100 rounded-2xl bg-stone-50/50 p-5 max-w-xs mx-auto text-center">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Lifetime Access</span>
              <span className="text-3xl font-extrabold text-stone-900">₹{price}</span>
              <span className="text-[10px] text-stone-400 block mt-1">One-time payment. No subscription.</span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-2.5 max-w-sm mx-auto text-left">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-red-800 leading-normal">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col items-center gap-2 max-w-sm mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 animate-bounce" />
                <p className="text-sm font-bold text-emerald-800 text-center">Payment verified! Unlocking PC Builder...</p>
              </div>
            ) : (
              /* Pay Button */
              <button
                onClick={handlePay}
                disabled={loading}
                className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black text-sm h-12 shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <Lock className="size-4" />
                    <span>Pay ₹{price} & Unlock Builder</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
