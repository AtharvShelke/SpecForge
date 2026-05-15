'use server';

import { OrderStatus } from "@/generated/prisma/client";
import { getBaseUrl } from "@/lib/env";
import { OrderPaymentMethodSchema } from "@/lib/contracts/validation";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { calculateOrderFinancials } from '@/lib/tax-engine';
import { sendMail } from "@/lib/services/mail";
import { reserveInventory } from "@/lib/services/inventory";
import { createOrderInvoiceAccessToken } from "@/lib/security/documents";
import { escapeHtml } from "@/lib/security/html";

const orderItemSchema = z.object({
    productId: z.string().min(1),
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
    paymentMethod: OrderPaymentMethodSchema.optional(),
    paymentTransactionId: z.string().optional(),
    paymentStatus: z.string().optional(),
    isPosOverride: z.boolean().optional(),
    items: z.array(orderItemSchema).min(1),
});

export async function processCheckout(payload: z.infer<typeof checkoutSchema>) {
    try {
        const data = checkoutSchema.parse(payload);

        // Use a transaction for the entire checkout flow
        const order = await prisma.$transaction(async (tx) => {
            // 1. Bulk fetch all products to verify existence, stock, and calculate TOTAL on SERVER
            const productIds = data.items.map(i => i.productId);
            const products = await tx.product.findMany({
                where: { id: { in: productIds } },
                include: { inventoryItems: true, media: true }
            });

            // Fast lookup map
            const productMap = new Map(products.map(p => [p.id, p]));

            // 2. Validate stock and prepare item pricing
            const calculationItems: { price: number; quantity: number }[] = [];

            for (const item of data.items) {
                const product = productMap.get(item.productId);
                if (!product) {
                    throw new Error(`Product not found: ${item.productId}`);
                }

                const availableUnits = product.inventoryItems.filter((inv) => inv.quantity > 0 && inv.reserved === 0);
                if (availableUnits.length < item.quantity) {
                    throw new Error(`Insufficient stock for product ${product.name}`);
                }

                const price = product.price || 0;
                calculationItems.push({ price: price, quantity: item.quantity });
            }

            // 3. Create the order

            // 3. Create the order
            const orderId = `ORD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

            const { subtotal, gstAmount, total } = calculateOrderFinancials(calculationItems);

            const orderStatus = data.isPosOverride ? "PAID" : "PENDING";

            // 3. Create the order shell first so foreign keys in StockMovement (created by reserveInventory) are valid
            await tx.order.create({
                data: {
                    id: orderId,
                    customerName: data.customerName,
                    email: data.email,
                    phone: data.phone,
                    subtotal,
                    gstAmount,
                    total, // Calculated purely on the server!
                    status: orderStatus,
                    shippingStreet: data.shippingStreet,
                    shippingCity: data.shippingCity,
                    shippingState: data.shippingState,
                    shippingZip: data.shippingZip,
                    shippingCountry: data.shippingCountry,
                    paymentMethod: data.isPosOverride ? "CASH" : (data.paymentMethod || "Razorpay Online"),
                    paymentTransactionId: data.isPosOverride ? `POS-${Date.now()}` : (data.paymentTransactionId || `MOCK-RPY-${Date.now()}`),
                    paymentStatus: data.isPosOverride ? "COMPLETED" : (data.paymentStatus || "SUCCESS"),
                }
            });

            const reservations = await reserveInventory(
                tx,
                data.items.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                })),
                orderId,
            );
            const reservationMap = new Map(reservations.map((entry) => [entry.productId, entry]));

            const newOrder = await tx.order.update({
                where: { id: orderId },
                data: {
                    items: {
                        create: data.items.map((item) => {
                            const product = productMap.get(item.productId)!;
                            const reservation = reservationMap.get(item.productId);

                            return {
                                productId: product.id,
                                name: product.name,
                                categoryId: product.categoryId,
                                price: product.price || 0,
                                quantity: item.quantity,
                                image: product.media?.[0]?.url || '',
                                sku: product.sku,
                                assignedUnits: {
                                    create: (reservation?.units ?? []).map((unit) => ({
                                        inventoryItemId: unit.inventoryItemId,
                                        serialNumber: unit.serialNumber,
                                        partNumber: unit.partNumber,
                                    })),
                                },
                            };
                        }),
                    },
                    logs: {
                        create: {
                            status: orderStatus,
                            note: data.isPosOverride ? "Order placed via POS override." : "Order placed successfully.",
                        },
                    },
                }
            });

            return newOrder;
        }, {
            maxWait: 5000,
            timeout: 10000
        });

        const accessToken = await createOrderInvoiceAccessToken({
            orderId: order.id,
            email: data.email,
        });
        const baseUrl = getBaseUrl();
        const invoiceLink = baseUrl
            ? `${baseUrl}/api/orders/${order.id}/invoice/pdf?accessToken=${encodeURIComponent(accessToken)}`
            : null;
        const trackingLink = baseUrl ? `${baseUrl}/track-order` : null;

        console.log(`[MOCK NOTIFICATION] ORDER ${order.id}`);
        console.log(`========================================`);
        console.log(`✅ Sent WhatsApp Confirmation to: ${data.phone}`);
        console.log(`Message: Thank you for ordering... here's your invoice (a downloadable pdf) ${invoiceLink ?? "not configured"}`);
        console.log(`and here's the link for your order ${trackingLink ?? "not configured"}`);
        console.log(`========================================\n`);

        try {
            await sendMail({
                to: data.email,
                subject: `Order Confirmation - ${order.id}`,
                text: `thank you for ordering... here's your invoice (a downloadable pdf) ${invoiceLink ?? "Contact support for invoice access"} and here's the link for your order ${trackingLink ?? "Track order unavailable"}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                        ${invoiceLink ? `<p>thank you for ordering... here's your invoice (a downloadable pdf) <a href="${escapeHtml(invoiceLink)}">${escapeHtml(invoiceLink)}</a></p>` : ""}
                        ${trackingLink ? `<p>and here's the link for your order <a href="${escapeHtml(trackingLink)}">${escapeHtml(trackingLink)}</a></p>` : ""}
                    </div>
                `,
            });
            console.log(`✅ Real Email Receipt Sent to: ${data.email}`);
        } catch (mailError) {
            console.error("Failed to send real email confirmation:", mailError);
        }

        return { success: true, orderId: order.id, order };
    } catch (error: any) {
        console.error("Checkout action error:", error);

        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message, details: error.issues };
        }

        if (error.message?.includes("Insufficient stock") || error.message?.includes("not found")) {
            return { success: false, error: error.message };
        }

        return { success: false, error: "Failed to process checkout. Please try again." };
    }
}
