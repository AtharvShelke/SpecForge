import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createOrder } from "@/services/order.service";
import { PaymentMethodType, PaymentStatus } from "@/types";
import { calculateOrderFinancials } from "@/lib/tax-engine";
import { getRazorpayConfig } from "@/lib/payments";

const orderItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.number().int().positive(),
});

const razorpayCheckoutSchema = z.object({
  customerName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  shippingStreet: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingZip: z.string().optional(),
  shippingCountry: z.string().optional(),
  items: z.array(orderItemSchema).min(1),
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const data = razorpayCheckoutSchema.parse(rawBody);
    console.log(`[RAZORPAY_CREATE_ORDER] POST entered for customer: ${data.email}`);
    const { keyId, keySecret } = getRazorpayConfig();

    if (!keyId || !keySecret) {
      console.error("[RAZORPAY_CREATE_ORDER] Razorpay keys not configured.");
      return NextResponse.json(
        { error: "Razorpay keys are not configured." },
        { status: 500 },
      );
    }

    const productIds = data.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { media: true, subcategory: true },
    });

    const productMap = new Map(
      products.map((product) => [product.id, product]),
    );
    const calculationItems: { price: number; quantity: number }[] = [];
    const orderItemsPayload = [];

    for (const item of data.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        console.error("[RAZORPAY_CREATE_ORDER] Product not found:", item.productId);
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 404 },
        );
      }

      calculationItems.push({
        price: Number(product.price || 0),
        quantity: item.quantity,
      });
      orderItemsPayload.push({
        productId: product.id,
        variantId: product.id,
        name: product.name,
        category: product.subcategory?.name || "Uncategorized",
        categoryId: product.categoryId,
        price: Number(product.price || 0),
        quantity: item.quantity,
        image: product.media?.[0]?.url || "",
        sku: product.sku || undefined,
      });
    }

    const { subtotal, gstAmount, total } =
      calculateOrderFinancials(calculationItems);
    const localOrderId = `ORD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    console.log("[RAZORPAY_CREATE_ORDER] Preparing to fetch razorpay order with total:", total);

    const gatewayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      },
      body: JSON.stringify({
        amount: Math.round(total * 100),
        currency: "INR",
        receipt: localOrderId,
        notes: {
          localOrderId,
          customerEmail: data.email,
          customerName: data.customerName,
        },
      }),
      cache: "no-store",
    });

    const gatewayPayload = await gatewayResponse.json();
    console.log("[RAZORPAY_CREATE_ORDER] Razorpay gateway response:", JSON.stringify(gatewayPayload, null, 2));

    if (!gatewayResponse.ok) {
      return NextResponse.json(
        {
          error:
            gatewayPayload?.error?.description ||
            "Failed to create Razorpay order.",
        },
        { status: gatewayResponse.status || 500 },
      );
    }

    const apiPayload = {
      id: localOrderId,
      customerName: data.customerName,
      email: data.email,
      phone: data.phone,
      shippingStreet: data.shippingStreet,
      shippingCity: data.shippingCity,
      shippingState: data.shippingState,
      shippingZip: data.shippingZip,
      shippingCountry: data.shippingCountry,
      subtotal,
      gstAmount,
      taxAmount: gstAmount,
      total,
      paymentMethod: PaymentMethodType.RAZORPAY,
      paymentStatus: PaymentStatus.INITIATED,
      paymentTransactionId: gatewayPayload.id,
      paymentIdempotencyKey: `razorpay-init-${localOrderId}`,
      paymentMetadata: {
        originalTotal: total,
        razorpayOrderId: gatewayPayload.id,
      },
      source: {
        channel: "STOREFRONT",
        paymentType: PaymentMethodType.RAZORPAY,
      },
      items: orderItemsPayload,
    };

    console.log(`[RAZORPAY_CREATE_ORDER] Calling createOrder for orderId: ${localOrderId}`);

    await createOrder(apiPayload);

    console.log(`[RAZORPAY_CREATE_ORDER] createOrder succeeded for order: ${localOrderId}`);

    return NextResponse.json({
      orderId: localOrderId,
      razorpayOrderId: gatewayPayload.id,
      amount: gatewayPayload.amount,
      currency: gatewayPayload.currency,
      keyId,
      customerName: data.customerName,
      email: data.email,
      phone: data.phone,
    });
  } catch (error: unknown) {
    console.error("[RAZORPAY_CREATE_ORDER] ERROR caught in route handler:", error);
    if (error instanceof Error) {
      console.error("[RAZORPAY_CREATE_ORDER] Error message:", error.message, "\nStack trace:\n", error.stack);
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to initialize Razorpay checkout.",
      },
      { status: 500 },
    );
  }
}
