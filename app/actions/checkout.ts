'use server';

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { calculateOrderFinancials } from "@/lib/tax-engine"; // Fixed import
import { PaymentMethodType, PaymentStatus } from "@/types";

const orderItemSchema = z.object({
    productId: z.string().min(1),
    variantId: z.string(),
    quantity: z.number().int().positive(),
});

const checkoutSchema = z.object({
    customerName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    shippingStreet: z.string().optional(),
    shippingCity: z.string().optional(),
    shippingState: z.string().optional(),
    shippingZip: z.string().optional(),
    shippingCountry: z.string().optional(),
    paymentMethod: z.nativeEnum(PaymentMethodType).optional(),
    paymentTransactionId: z.string().optional(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
    paymentProofUrl: z.string().url().optional(),
    paymentReference: z.string().optional(),
    isPosOverride: z.boolean().optional(),
    items: z.array(orderItemSchema).min(1),
});

export async function processCheckout(payload: z.infer<typeof checkoutSchema>) {
    try {
        const data = checkoutSchema.parse(payload);

        // 1. Bulk fetch all products to retrieve server-side pricing and metadata
        const productIds = data.items.map(i => i.productId);
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            include: { variants: true, media: true, subCategory: true }
        });

        const productMap = new Map(products.map(p => [p.id, p]));

        const calculationItems: { price: number; quantity: number }[] = [];
        const orderItemsPayload = [];

        for (const item of data.items) {
            const product = productMap.get(item.productId);
            if (!product) {
                throw new Error(`Product not found: ${item.productId}`);
            }

            const variant = product.variants.find(v => v.id === item.variantId) || product.variants[0];
            if (!variant) throw new Error(`Product variant missing for ${product.name}`);

            calculationItems.push({ price: Number(variant.price), quantity: item.quantity });

            orderItemsPayload.push({
                productId: product.id,
                variantId: variant.id,
                name: product.name,
                category: product.subCategory?.name || "Uncategorized", // Replaced Enum with String (subCategoryId map)
                price: Number(variant.price),
                quantity: item.quantity,
                image: product.media?.[0]?.url || '',
                sku: variant.sku,
            });
        }

        // 2. Calculate Total (Requires for Orders API payload)
        const { subtotal, gstAmount, total } = calculateOrderFinancials(calculationItems);
        const orderId = `ORD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
        const isDiscountedManualPayment =
            data.paymentMethod === PaymentMethodType.UPI ||
            data.paymentMethod === PaymentMethodType.BANK_TRANSFER;
        const discountAmount = isDiscountedManualPayment ? Number((total * 0.02).toFixed(2)) : 0;
        const payableTotal = Number((total - discountAmount).toFixed(2));

        // 3. Assemble API Payload targeting self endpoint
        const apiPayload = {
            id: orderId,
            customerName: data.customerName,
            email: data.email,
            phone: data.phone,
            subtotal,
            gstAmount,
            taxAmount: gstAmount,
            discountAmount,
            total: payableTotal,
            shippingStreet: data.shippingStreet,
            shippingCity: data.shippingCity,
            shippingState: data.shippingState,
            shippingZip: data.shippingZip,
            shippingCountry: data.shippingCountry,
            paymentMethod: data.isPosOverride
                ? PaymentMethodType.BANK_TRANSFER
                : (data.paymentMethod || PaymentMethodType.RAZORPAY),
            paymentTransactionId: data.isPosOverride
                ? `POS-${Date.now()}`
                : (data.paymentTransactionId || data.paymentReference),
            paymentStatus: data.isPosOverride
                ? PaymentStatus.COMPLETED
                : (data.paymentStatus || PaymentStatus.PENDING),
            paymentProofUrl: data.paymentProofUrl,
            paymentMetadata: {
                originalTotal: total,
                payableTotal,
                discountAmount,
                paymentReference: data.paymentReference,
            },
            source: {
                channel: data.isPosOverride ? "POS" : "STOREFRONT",
                paymentType: data.paymentMethod || PaymentMethodType.RAZORPAY,
            },
            items: orderItemsPayload,
        };

        // 4. Fire API Wrapper call
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const response = await fetch(`${baseUrl}/api/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(apiPayload),
            cache: "no-store" // Ensure it bypasses fetch cache
        });

        let responseData;
        try {
            responseData = await response.json();
        } catch (e) {
            console.error("Failed to parse API response", e);
            throw new Error("Invalid response from Orders API");
        }

        if (!response.ok) {
            console.error("Orders API returned error:", responseData);
            return { success: false, error: responseData.error || "Failed to process order via API." };
        }

        // 5. MOCK EXTERNAL NOTIFICATIONS
        const invoiceLink = `${baseUrl}/api/orders/${orderId}/invoice`;
        const trackingLink = `${baseUrl}/track-order`;

        console.log(`\n========================================`);
        console.log(`[MOCK NOTIFICATION] ORDER ${orderId}`);
        console.log(`========================================`);
        console.log(`✅ Sent WhatsApp Confirmation to: ${data.phone}`);
        console.log(`Message: Thank you for ordering... here's your invoice (a downloadable pdf) ${invoiceLink}`);
        console.log(`and here's the link for your order ${trackingLink}`);
        console.log(`========================================\n`);

        return { success: true, orderId, order: responseData };

    } catch (error: unknown) {
        console.error("Checkout action error:", error);

        if (error instanceof z.ZodError) {
            return { success: false, error: "Invalid checkout data provided", details: error.issues };
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to process checkout. Please try again.",
        };
    }
}
