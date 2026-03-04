'use server';

import { Category, OrderStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { calculateOrderFinancials } from "@/lib/gst";


const CategoryEnum = z.nativeEnum(Category);

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
                include: { variants: { include: { warehouseInventories: true } }, media: true }
            });

            // Fast lookup map
            const productMap = new Map(products.map(p => [p.id, p]));

            // 2. Validate stock and prepare items
            const orderItemsData = [];
            const inventoryUpdates = [];
            const stockMovements = [];
            const calculationItems: { price: number; quantity: number }[] = [];

            for (const item of data.items) {
                const product = productMap.get(item.productId);
                if (!product) {
                    throw new Error(`Product not found: ${item.productId}`);
                }

                const variant = product.variants?.[0]; // Defaulting to first variant mapped
                if (!variant) throw new Error(`Product variant missing for ${product.name}`);

                // For now grab the first warehouse inventory
                const inv = variant.warehouseInventories[0];
                if (!inv || inv.quantity < item.quantity) {
                    throw new Error(`Insufficient stock for product ${product.name}`);
                }

                // Push for GST calculation
                calculationItems.push({ price: variant.price, quantity: item.quantity });

                // Prepare item insertion
                orderItemsData.push({
                    variantId: variant.id,
                    name: product.name,
                    category: product.category,
                    price: variant.price,
                    quantity: item.quantity,
                    image: product.media?.[0]?.url || '',
                    sku: variant.sku,
                });

                // Prepare stock reduction
                inventoryUpdates.push({
                    id: inv.id,
                    quantity: inv.quantity - item.quantity,
                    reserved: inv.reserved + item.quantity
                });

                stockMovements.push({
                    warehouseInventoryId: inv.id,
                    warehouseId: inv.warehouseId,
                    type: "RESERVE" as const,
                    quantity: item.quantity,
                    previousQuantity: inv.quantity,
                    newQuantity: inv.quantity - item.quantity,
                    reason: `Order checkout`,
                    performedBy: "System",
                });
            }

            // 3. Create the order
            const orderId = `ORD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

            const { subtotal, gstAmount, total } = calculateOrderFinancials(calculationItems);

            const newOrder = await tx.order.create({
                data: {
                    id: orderId,
                    customerName: data.customerName,
                    email: data.email,
                    phone: data.phone,
                    subtotal,
                    gstAmount,
                    total, // Calculated purely on the server!
                    status: "PENDING",
                    shippingStreet: data.shippingStreet,
                    shippingCity: data.shippingCity,
                    shippingState: data.shippingState,
                    shippingZip: data.shippingZip,
                    shippingCountry: data.shippingCountry,
                    paymentMethod: data.paymentMethod,
                    paymentTransactionId: data.paymentTransactionId,
                    paymentStatus: data.paymentStatus,
                    items: {
                        create: orderItemsData,
                    },
                    logs: {
                        create: {
                            status: "PENDING",
                            note: "Order placed successfully.",
                        },
                    },
                }
            });

            // 4. Batch update inventory
            for (const update of inventoryUpdates) {
                await tx.warehouseInventory.update({
                    where: { id: update.id },
                    data: {
                        quantity: update.quantity,
                        reserved: update.reserved,
                        lastUpdated: new Date()
                    }
                });
            }

            // 5. Batch insert stock movements (raw to avoid multiple queries if Prisma allowed createMany on relations, but we can do it via model)
            if (stockMovements.length > 0) {
                await tx.stockMovement.createMany({
                    data: stockMovements.map(sm => ({
                        reason: `${sm.reason} ${orderId}`,
                        warehouseInventoryId: sm.warehouseInventoryId,
                        warehouseId: sm.warehouseId,
                        type: sm.type as "RESERVE",
                        quantity: sm.quantity,
                        previousQuantity: sm.previousQuantity,
                        newQuantity: sm.newQuantity,
                        performedBy: sm.performedBy
                    }))
                });
            }

            return newOrder;
        }, {
            // Prisma transaction options for longer timeout if many items
            maxWait: 5000,
            timeout: 10000
        });

        // MOCK EXTERNAL NOTIFICATIONS
        console.log(`\n========================================`);
        console.log(`[MOCK NOTIFICATION] ORDER ${order.id}`);
        console.log(`========================================`);
        console.log(`✅ Sent WhatsApp Confirmation to: ${data.phone}`);
        console.log(`✅ Sent Email Receipt to: ${data.email}`);
        console.log(`========================================\n`);

        return { success: true, orderId: order.id, order };
    } catch (error: any) {
        console.error("Checkout action error:", error);

        if (error instanceof z.ZodError) {
            return { success: false, error: "Invalid checkout data provided", details: error.issues };
        }

        if (error.message?.includes("Insufficient stock") || error.message?.includes("not found")) {
            return { success: false, error: error.message };
        }

        return { success: false, error: "Failed to process checkout. Please try again." };
    }
}
