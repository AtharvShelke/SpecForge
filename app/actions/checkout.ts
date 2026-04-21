'use server';

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { calculateOrderFinancials } from "@/lib/tax-engine"; // Fixed import

const orderItemSchema = z.object({
    productId: z.string().min(1),
    variantId: z.string().min(1),
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
    paymentMethod: z.string().optional(),
    paymentTransactionId: z.string().optional(),
    paymentStatus: z.string().optional(),
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
        const { total } = calculateOrderFinancials(calculationItems);
        const orderId = `ORD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

        // 3. Assemble API Payload targeting self endpoint
        const apiPayload = {
            id: orderId,
            customerName: data.customerName,
            email: data.email,
            phone: data.phone,
            total,
            shippingStreet: data.shippingStreet,
            shippingCity: data.shippingCity,
            shippingState: data.shippingState,
            shippingZip: data.shippingZip,
            shippingCountry: data.shippingCountry,
            // Replaced legacy CASH with valid Enum mappings defined in Orders API
            paymentMethod: data.isPosOverride ? "BANK_TRANSFER" : (data.paymentMethod || "RAZORPAY"),
            paymentTransactionId: data.isPosOverride ? `POS-${Date.now()}` : (data.paymentTransactionId || `MOCK-RPY-${Date.now()}`),
            paymentStatus: data.isPosOverride ? "COMPLETED" : (data.paymentStatus || "COMPLETED"),
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

    } catch (error: any) {
        console.error("Checkout action error:", error);

        if (error instanceof z.ZodError) {
            return { success: false, error: "Invalid checkout data provided", details: error.issues };
        }

        return { success: false, error: error.message || "Failed to process checkout. Please try again." };
    }
}
