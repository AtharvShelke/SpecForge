# Razorpay Integration Plan for Next.js

This document provides a foolproof, step-by-step guide to integrating Razorpay as your payment gateway within this Next.js (App Router) + Prisma stack.

## Phase 1: Preparation & Setup

### 1. Create a Razorpay Account
- Sign up for a [Razorpay Account](https://razorpay.com/).
- Navigate to **Settings > API Keys** and generate test API keys. You will get a `Key ID` and `Key Secret`.
- Keep these secure; never expose the `Key Secret` to the frontend.

### 2. Environment Variables
Add the necessary environment variables to your [.env](file:///e:/web-dev/pc-system/md_client/.env) and [.env.local](file:///e:/web-dev/pc-system/nexus-hardware/.env.local) files:

```env
RAZORPAY_KEY_ID=rzp_test_yourkeyid
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

### 3. Install Dependencies
Install the official Razorpay Node.js SDK and cryptographic utilities (if necessary, though Node.js built-in `crypto` is usually sufficient). We will also install `crypto` types if missing.

```bash
npm install razorpay
npm install -D @types/razorpay
```

---

## Phase 2: Backend Implementation (Next.js App Router API)

### 1. Initialize Razorpay Client (`lib/razorpay.ts`)
Create a utility file to export an instance of the Razorpay client to be reused across API routes.

```typescript
// lib/razorpay.ts
import Razorpay from "razorpay";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});
```

### 2. Create Razorpay Order API (`app/api/payment/create-order/route.ts`)
Before the client can open the payment modal, you must request an order ID from Razorpay from your backend. Here we tie the Razorpay order to your Prisma `Order` and `PaymentTransaction` models.

```typescript
// app/api/payment/create-order/route.ts
import { NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";
import prisma from "@/lib/db"; // Assuming your db export is here

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    // 1. Fetch exact total from DB to prevent tampering
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Razorpay amount is in paise (Multiply by 100)
    const amountInPaise = Math.round(order.total * 100);

    // 2. Create the Razorpay Order
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: order.id,
      payment_capture: true, // Auto-capture payment after authorization
    });

    // 3. Optional: Create an INITIATED PaymentTransaction in Prisma
    await prisma.paymentTransaction.create({
      data: {
        orderId: order.id,
        method: "CARD", // or dynamically determined 
        amount: order.total,
        status: "INITIATED",
        idempotencyKey: razorpayOrder.id, // Or generate a UUID
        metadata: { razorpayOrderId: razorpayOrder.id }
      }
    });

    // 4. Send Order ID back to client
    return NextResponse.json({
       orderId: razorpayOrder.id,
       currency: "INR",
       amount: amountInPaise,
    });

  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
```

### 3. Verification Route (`app/api/payment/verify/route.ts`)
When the payment modal succeeds, the client sends the signature back to the server for verification.

```typescript
// app/api/payment/verify/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = await req.json();

    // Generate expected signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
      .update(body.toString())
      .digest("hex");

    // Compare signatures
    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      // Mark transaction as failed
      await prisma.paymentTransaction.updateMany({
        where: { orderId: orderId, idempotencyKey: razorpay_order_id },
        data: { status: "FAILED" }
      });
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    // Mark as SUCCESS
    await prisma.paymentTransaction.updateMany({
      where: { orderId: orderId, idempotencyKey: razorpay_order_id },
      data: {
        status: "COMPLETED",
        gatewayTxnId: razorpay_payment_id
      }
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { status: "PAID", paymentTransactionId: razorpay_payment_id }
    });

    return NextResponse.json({ success: true, message: "Payment verified successfully" });

  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

---

## Phase 3: Frontend Implementation

### 1. Load the Razorpay Script
Use Next.js `<Script>` to load the Razorpay checkout file, ideally in the `layout.tsx` or the specific Checkout component.

```tsx
// app/checkout/page.tsx (or relevant file)
import Script from "next/script";

export default function CheckoutPage() {
  return (
    <>
      {/* Load Razorpay script asynchronously */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <CheckoutForm />
    </>
  );
}
```

### 2. The Payment Flow Trigger Component
A component where a user triggers the "Pay Now" logic.

```tsx
"use client";

export function CheckoutForm({ dbOrderId, totalAmount }) {
  const handlePayment = async () => {
    // 1. Fetch Razorpay order from our backend
    const createRes = await fetch("/api/payment/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: dbOrderId }),
    });

    const orderData = await createRes.json();

    if (!createRes.ok) {
      alert("Failed to create order");
      return;
    }

    // 2. Configure Razorpay UI options
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Use NEXT_PUBLIC variable containing your key ID
      amount: orderData.amount,
      currency: orderData.currency,
      name: "Nexus Hardware",
      description: "Order Payment",
      order_id: orderData.orderId,
      handler: async function (response: any) {
        // 3. Verify Payment on Success
        const verifyRes = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            orderId: dbOrderId, // Internal DB ID 
          }),
        });

        const verifyData = await verifyRes.json();
        if (verifyData.success) {
           alert("Payment Successful!");
           // Redirect to success route
           window.location.href = `/order-success/${dbOrderId}`;
        } else {
           alert("Payment Verification Failed!");
        }
      },
      prefill: {
        name: "User Name", 
        email: "user@example.com",
        contact: "9999999999",
      },
      theme: {
        color: "#3399cc",
      },
    };

    // 4. Open the Razorpay Payment Modal
    const paymentObject = new (window as any).Razorpay(options);
    paymentObject.open();

    paymentObject.on("payment.failed", function (response: any) {
        alert("Payment Failed - " + response.error.description);
    });
  };

  return (
    <button onClick={handlePayment} className="bg-blue-600 text-white p-3 rounded">
      Pay Now
    </button>
  );
}
```

---

## Phase 4: Webhook Implementation (Foolproof Fallback)

Relying entirely on the client jumping to the success handler isn't foolproof (e.g., users close the browser right after paying). Implementing Webhooks ensures your server catches guaranteed events.

### 1. Setup Webhook Endpoint (`app/api/webhooks/razorpay/route.ts`)

```typescript
// app/api/webhooks/razorpay/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/db";

export async function POST(req: Request) {
  try {
    const textBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET as string)
      .update(textBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(textBody);

    // Handle payment capture
    if (event.event === "payment.captured") {
       const paymentEntity = event.payload.payment.entity;
       const razorpayOrderId = paymentEntity.order_id;
       const razorpayPaymentId = paymentEntity.id;

       // Find related transactions in Prisma
       const transaction = await prisma.paymentTransaction.findUnique({
          where: { idempotencyKey: razorpayOrderId }
       });

       if (transaction && transaction.status !== "COMPLETED") {
          await prisma.paymentTransaction.update({
            where: { id: transaction.id },
            data: { status: "COMPLETED", gatewayTxnId: razorpayPaymentId }
          });
          
          await prisma.order.update({
             where: { id: transaction.orderId },
             data: { status: "PAID" }
          });
       }
    }

    // Handle payment failure logic if needed (payment.failed)
    
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    return NextResponse.json({ error: "Webhook Error" }, { status: 500 });
  }
}
```

### 2. Configure Webhook in Razorpay Dashboard
Go back to the Razorpay Dashboard.
- Open **Settings > Webhooks > Add New Webhook**.
- URL: `https://your-production-url.com/api/webhooks/razorpay`
- Secret: Paste the value of `RAZORPAY_WEBHOOK_SECRET`.
- Active Events: Select `payment.captured` and `payment.failed`.

---

## Final Checklist for Foolproof Implementation
1. **Never pass the Amount from Client:** Notice in `/api/payment/create-order`, the backend pulls `order.total` from the exact database record. Never trust client payloads containing `amount`.
2. **Handle Webhooks Properly:** Always implement webhooks alongside frontend handlers so internet drops during redirection won't leave orders unpaid in the DB.
3. **TypeScript Compliance:** Extend `window` interface to support the injected Razorpay script across your application safely.
4. **Idempotency:** Using `razorpay_order_id` as an `idempotencyKey` prevents duplicate transaction entries in case webhooks fire repeatedly.
