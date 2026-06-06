/**
 * order.service.ts — Enterprise-grade Order Management.
 *
 * Order lifecycle:
 *   PENDING → PAID → PROCESSING → SHIPPED → DELIVERED
 *   CANCEL / RETURN support with inventory + billing side effects.
 *
 * Every status transition is validated, logged, and triggers side effects.
 */

import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/errors";
import { Order, CreateOrder, CreateOrderItem, OrderStatus } from "@/types";
import { createPaymentTransaction } from "@/services/payment";
import { assertOrderTransition } from "@/lib/orderTransitions";
import {
  reserveUnitsForOrder,
  shipOrderUnits,
  cancelOrderReservation,
  returnOrderUnits
} from "./inventory.service";

type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];



// ─────────────────────────────────────────────────────────────────────────────
// LIST / GET
// ─────────────────────────────────────────────────────────────────────────────

export async function listOrders(filters?: {
  status?: string;
  customerId?: string;
  page?: number;
  limit?: number;
}): Promise<Order[]> {
  const where: any = { deletedAt: null };
  if (filters?.status) where.status = filters.status;
  if (filters?.customerId) where.customerId = filters.customerId;
  const page = Math.max(1, Number(filters?.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(filters?.limit ?? 25)));

  const orders = await prisma.order.findMany({
    where,
    orderBy: { date: "desc" },
    skip: (page - 1) * limit,
    take: limit,
    select: {
      id: true,
      customerName: true,
      email: true,
      phone: true,
      date: true,
      subtotal: true,
      gstAmount: true,
      taxAmount: true,
      discountAmount: true,
      total: true,
      status: true,
      version: true,
      deletedAt: true,
      customerId: true,
      shippingStreet: true,
      shippingCity: true,
      shippingState: true,
      shippingZip: true,
      shippingCountry: true,
      paymentMethod: true,
      paymentTransactionId: true,
      paymentStatus: true,
      idempotencyKey: true,
      source: true,
      createdAt: true,
      updatedAt: true,
      items: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          orderId: true,
          productId: true,
          name: true,
          categoryId: true,
          price: true,
          quantity: true,
          image: true,
          sku: true,
          assignedUnits: {
            select: {
              id: true,
              inventoryItemId: true,
              serialNumber: true,
              partNumber: true,
            },
          },
        },
      },
      logs: { orderBy: { timestamp: "desc" } },
      shipments: { orderBy: { createdAt: "desc" } },
      payments: {
        select: {
          id: true,
          orderId: true,
          method: true,
          gatewayTxnId: true,
          amount: true,
          status: true,
          idempotencyKey: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
      invoices: false,
    },
  });
  return orders as any as Order[];
}

export async function getOrderById(id: string): Promise<Order> {
  const order = await prisma.order.findUnique({
    where: { id, deletedAt: null },
    include: {
      items: {
        include: {
          product: true,
          assignedUnits: true,
        },
      },
      logs: { orderBy: { timestamp: "desc" } },
      shipments: { orderBy: { createdAt: "desc" } },
      payments: {
        orderBy: { createdAt: "desc" },
      },
      invoices: {
        include: { lineItems: true },
        orderBy: { createdAt: "desc" },
      },
      customer: true,
    },
  });
  if (!order) throw new ServiceError("Order not found", 404);
  return order as any as Order;
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────────────────────

export async function createOrder(data: CreateOrder): Promise<Order> {
  const orderId =
    data.id || `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

  console.log(`[order.service.ts] createOrder called for customer: ${data.email}, calculated orderId: ${orderId}`);

  if (!data.customerName || !data.email || data.total === undefined) {
    console.error("[order.service.ts] Validation failed: customerName, email, or total is missing");
    throw new ServiceError("customerName, email, and total are required");
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      console.log("[order.service.ts] Inside transaction block. Resolving customerId...");
      let customerId = data.customerId;
      if (!customerId) {
        const existingCustomer = await tx.customer.findFirst({
          where: { email: data.email },
          orderBy: { createdAt: "asc" },
        });

        if (existingCustomer) {
          console.log("[order.service.ts] Found existing customer:", existingCustomer.id);
          const updatedCustomer = await tx.customer.update({
            where: { id: existingCustomer.id },
            data: {
              name: data.customerName,
              phone: data.phone,
              addressLine1: data.shippingStreet,
              city: data.shippingCity,
              state: data.shippingState,
              postalCode: data.shippingZip,
              country: data.shippingCountry,
            },
          });
          customerId = updatedCustomer.id;
        } else {
          console.log("[order.service.ts] Creating new customer record...");
          const createdCustomer = await tx.customer.create({
            data: {
              name: data.customerName,
              email: data.email,
              phone: data.phone,
              addressLine1: data.shippingStreet,
              city: data.shippingCity,
              state: data.shippingState,
              postalCode: data.shippingZip,
              country: data.shippingCountry,
            },
          });
          customerId = createdCustomer.id;
        }
      }
      console.log("[order.service.ts] Resolved customerId:", customerId);

      const normalizedItems = data.items ?? [];
      console.log("[order.service.ts] Creating order lines, count:", normalizedItems.length);
      const orderLineItems: Array<any> = [];

      for (const item of normalizedItems) {
        orderLineItems.push({
          productId: item.productId,
          name: item.name,
          categoryId: item.categoryId || 1,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          sku: item.sku,
        });
      }

      const orderData: any = {
        id: orderId,
        customerName: data.customerName,
        email: data.email,
        phone: data.phone,
        customerId,
        subtotal: data.subtotal ?? 0,
        gstAmount: data.gstAmount ?? 0,
        taxAmount: data.taxAmount ?? 0,
        discountAmount: data.discountAmount ?? 0,
        total: data.total,
        shippingStreet: data.shippingStreet,
        shippingCity: data.shippingCity,
        shippingState: data.shippingState,
        shippingZip: data.shippingZip,
        shippingCountry: data.shippingCountry,
        paymentMethod: data.paymentMethod,
        paymentTransactionId: data.paymentTransactionId,
        paymentStatus: data.paymentStatus,
        idempotencyKey: data.paymentIdempotencyKey,
        source: data.source,
        status: "PENDING",
      };

      if (orderLineItems.length > 0) {
        orderData.items = {
          create: orderLineItems,
        };
      }

      console.log(`[order.service.ts] Invoking tx.order.create for order ID: ${orderId}`);

      const newOrder = await tx.order.create({
        data: orderData,
        include: { items: true },
      });

      console.log(`[order.service.ts] tx.order.create succeeded for order: ${newOrder.id}`);

      if (data.paymentMethod) {
        console.log("[order.service.ts] Creating payment transaction record...");
        await createPaymentTransaction(tx as any, {
          orderId: newOrder.id,
          method: data.paymentMethod,
          amount: data.total,
          gatewayTxnId: data.paymentTransactionId || undefined,
          idempotencyKey:
            data.paymentIdempotencyKey ||
            `${newOrder.id}-${data.paymentMethod}-${Date.now()}`,
          metadata: {
            ...data.paymentMetadata,
            proofUrl: data.paymentProofUrl,
          },
          status: data.paymentStatus,
        });
      }

      // Atomically reserve inventory units for each created order line
      console.log("[order.service.ts] Reserving serialized inventory units...");
      for (const item of newOrder.items) {
        await reserveUnitsForOrder(tx, item.productId, item.quantity, newOrder.id, item.id);
      }

      console.log("[order.service.ts] Creating order log entry...");
      await tx.orderLog.create({
        data: {
          orderId: newOrder.id,
          status: "PENDING",
          note: "Order created and units reserved",
        },
      });

      return newOrder as any as Order;
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    console.log("[order.service.ts] Transaction committed successfully.");
    return order as any as Order;
  } catch (error) {
    console.error("[order.service.ts] ERROR inside createOrder transaction:", error);
    if (error instanceof Error) {
      console.error("[order.service.ts] Error stack trace:\n", error.stack);
    }
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH (field-level update, no status change)
// ─────────────────────────────────────────────────────────────────────────────

export async function updateOrder(
  id: string,
  data: Partial<Order> & { version: number },
): Promise<Order> {
  const patch: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && key !== "version") patch[key] = value;
  }
  patch.version = { increment: 1 };

  try {
    return (await prisma.order.update({
      where: { id, version: data.version },
      data: patch,
    })) as any as Order;
  } catch (err: any) {
    if (err.code === "P2025") {
      throw new ServiceError(
        "Order was modified by another user, please refresh.",
        409,
      );
    }
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS TRANSITION (with validation + side effects)
// ─────────────────────────────────────────────────────────────────────────────

export async function updateOrderStatus(
  id: string,
  status: string,
  note?: string,
) {
  if (!status) throw new ServiceError("Status is required");

  const order = await prisma.order.findUnique({
    where: { id, deletedAt: null },
    include: {
      items: {
        include: {
          assignedUnits: true,
        },
      },
    },
  });
  if (!order) throw new ServiceError("Order not found", 404);

  // Validate transition
  assertOrderTransition(order.status as OrderStatus, status as OrderStatus);

  return prisma.$transaction(async (tx) => {
    // 1. Update order status
    const updatedOrder = await tx.order.update({
      where: { id },
      data: { status: status as any, version: { increment: 1 } },
      include: {
        items: true,
        logs: { orderBy: { timestamp: "desc" } },
      },
    });

    // 2. Create status log
    await tx.orderLog.create({
      data: {
        orderId: id,
        status: status as any,
        note: note || `Status updated to ${status}`,
      },
    });

    // ── SIDE EFFECTS ──────────────────────────────────────────────

    // PROCESSING → SHIPPED: ship units
    if (status === "SHIPPED") {
      await shipOrderUnits(tx, id);
    }

    // CANCELLED: cancel reservation
    if (status === "CANCELLED") {
      await cancelOrderReservation(tx, id);
    }

    // RETURNED: return units to inventory
    if (status === "RETURNED") {
      await returnOrderUnits(tx, id);
    }

    return updatedOrder;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CANCEL (with reservation release + audit)
// ─────────────────────────────────────────────────────────────────────────────

export async function cancelOrder(id: string, note?: string) {
  const order = await prisma.order.findUnique({
    where: { id, deletedAt: null },
    include: {
      items: {
        include: {
          assignedUnits: true,
        },
      },
    },
  });
  if (!order) throw new ServiceError("Order not found", 404);

  // Validate transition
  assertOrderTransition(order.status as OrderStatus, OrderStatus.CANCELLED);

  return prisma.$transaction(async (tx) => {
    // 1. Update order status
    const updatedOrder = await tx.order.update({
      where: { id },
      data: { status: "CANCELLED", version: { increment: 1 } },
      include: {
        items: true,
        logs: { orderBy: { timestamp: "desc" } },
      },
    });

    // 2. Create cancel log
    await tx.orderLog.create({
      data: {
        orderId: id,
        status: "CANCELLED",
        note: note || "Order cancelled",
      },
    });

    // 3. Release reservations in inventory
    await cancelOrderReservation(tx, id);

    // 4. Log reservation release
    await tx.orderLog.create({
      data: {
        orderId: id,
        status: "CANCELLED",
        note: `Released allocated inventory unit(s) for order ${id}`,
      },
    });

    return updatedOrder as any as Order;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE (soft-delete with inventory release)
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteOrder(id: string) {
  const order = await prisma.order.findUnique({
    where: { id, deletedAt: null },
    include: {
      items: {
        include: {
          assignedUnits: true,
        },
      },
    },
  });
  if (!order) throw new ServiceError("Order not found", 404);

  return prisma.$transaction(async (tx) => {
    // Release inventory reservation if order is pending/paid/processing
    if (["PENDING", "PAID", "PROCESSING"].includes(order.status)) {
      await cancelOrderReservation(tx, id);
    }

    // Soft-delete the order
    const deleted = await tx.order.update({
      where: { id },
      data: { deletedAt: new Date(), version: { increment: 1 } },
    });

    await tx.orderLog.create({
      data: {
        orderId: id,
        status: order.status as any,
        note: "Order soft-deleted by admin",
      },
    });

    return deleted;
  });
}
