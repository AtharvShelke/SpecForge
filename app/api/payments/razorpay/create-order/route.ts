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
    const data = razorpayCheckoutSchema.parse(await req.json());
    const { keyId, keySecret } = getRazorpayConfig();

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay keys are not configured." },
        { status: 500 },
      );
    }

    const productIds = data.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { variants: true, media: true, subCategory: true },
    });

    const productMap = new Map(
      products.map((product) => [product.id, product]),
    );
    const calculationItems: { price: number; quantity: number }[] = [];
    const orderItemsPayload = [];

    for (const item of data.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 404 },
        );
      }

      const variant =
        product.variants.find((entry) => entry.id === item.variantId) ||
        product.variants[0];
      if (!variant) {
        return NextResponse.json(
          { error: `Product variant missing for ${product.name}` },
          { status: 400 },
        );
      }

      calculationItems.push({
        price: Number(variant.price),
        quantity: item.quantity,
      });
      orderItemsPayload.push({
        variantId: variant.id,
        name: product.name,
        category: product.subCategory?.name || "Uncategorized",
        price: Number(variant.price),
        quantity: item.quantity,
        image: product.media?.[0]?.url || "",
        sku: variant.sku,
      });
    }

    const { subtotal, gstAmount, total } =
      calculateOrderFinancials(calculationItems);
    const localOrderId = `ORD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

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

    await createOrder({
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
    });

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
    console.error("[RAZORPAY_CREATE_ORDER]", error);
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
