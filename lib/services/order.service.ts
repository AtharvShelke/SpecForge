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
import { ServiceError } from "./catalog.service";
import { Order, CreateOrder, CreateOrderItem } from "@/types";
import { createPaymentTransaction } from "@/services/paymentService";

async function allocateInventoryForOrderItem(
  tx: any,
  item: CreateOrderItem,
) {
  if (item.inventoryItemId) {
    if (item.quantity !== 1) {
      throw new ServiceError(
        "Serialized inventory items must be ordered with quantity 1 per unit.",
        400,
      );
    }

    const inventoryItem = await tx.inventoryItem.findUnique({
      where: { id: item.inventoryItemId },
      include: {
        variant: {
          select: {
            sku: true,
          },
        },
      },
    });

    if (!inventoryItem || inventoryItem.variantId !== item.variantId) {
      throw new ServiceError("Requested inventory item is not available for this variant.", 400);
    }
    if (inventoryItem.trackingType !== "SERIALIZED") {
      throw new ServiceError("Traceable order items must be allocated from serialized inventory.", 400);
    }
    if (!inventoryItem.serialNumber || !inventoryItem.partNumber) {
      throw new ServiceError("Serialized inventory item is missing part or serial number.", 400);
    }

    const available =
      Number(inventoryItem.quantityOnHand ?? 0) -
      Number(inventoryItem.quantityReserved ?? 0);
    if (available < 1 || inventoryItem.status === "SOLD") {
      throw new ServiceError("Requested inventory item is no longer available.", 409);
    }

    return [{
      inventoryItemId: inventoryItem.id,
      quantity: 1,
      productNumber: inventoryItem.variant?.sku || item.productNumber || item.sku || item.variantId,
      partNumber: inventoryItem.partNumber,
      serialNumber: inventoryItem.serialNumber,
    }];
  }

  const serializedItems = await tx.inventoryItem.findMany({
    where: {
      variantId: item.variantId,
      trackingType: "SERIALIZED",
      quantityOnHand: { gt: 0 },
      quantityReserved: 0,
      status: { in: ["IN_STOCK", "RETURNED"] },
    },
    include: {
      variant: {
        select: {
          sku: true,
        },
      },
    },
    orderBy: [{ receivedAt: "asc" }, { createdAt: "asc" }],
    take: item.quantity,
  });

  if (serializedItems.length === item.quantity) {
    const seenSerial = new Set<string>();
    const seenPart = new Set<string>();

    return serializedItems.map((inventoryItem: any) => {
      if (!inventoryItem.serialNumber || !inventoryItem.partNumber) {
        throw new ServiceError("Serialized inventory item is missing part or serial number.", 400);
      }
      if (seenSerial.has(inventoryItem.serialNumber) || seenPart.has(inventoryItem.partNumber)) {
        throw new ServiceError(
          `Inventory allocation conflict detected for variant ${item.variantId}.`,
          409,
        );
      }

      seenSerial.add(inventoryItem.serialNumber);
      seenPart.add(inventoryItem.partNumber);

      return {
        inventoryItemId: inventoryItem.id,
        quantity: 1,
        productNumber: inventoryItem.variant?.sku || item.productNumber || item.sku || item.variantId,
        partNumber: inventoryItem.partNumber,
        serialNumber: inventoryItem.serialNumber,
      };
    });
  }

  throw new ServiceError(
    `Insufficient serialized stock for variant ${item.variantId}. Each ordered unit must map to a unique serial and part number.`,
    409,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS TRANSITION MAP (strict DAG)
// ─────────────────────────────────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED"],
  // Terminal states
  CANCELLED: [],
  RETURNED: [],
};

function assertStatusTransition(from: string, to: string) {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    throw new ServiceError(
      `Invalid order status transition: ${from} → ${to}`,
      400
    );
  }
}

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
        take: 3,
        orderBy: { id: "asc" },
        select: {
          id: true,
          lineReference: true,
          orderId: true,
          variantId: true,
          inventoryItemId: true,
          productNumber: true,
          partNumber: true,
          serialNumber: true,
          name: true,
          category: true,
          price: true,
          quantity: true,
          image: true,
          sku: true,
          variantSnapshot: true,
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
          paymentProofs: true,
        },
        orderBy: { createdAt: "desc" },
      },
      invoices: false,
      reservations: false,
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
          variant: {
            include: { product: true },
          },
        },
      },
      logs: { orderBy: { timestamp: "desc" } },
      shipments: { orderBy: { createdAt: "desc" } },
      payments: {
        include: { paymentProofs: true },
        orderBy: { createdAt: "desc" },
      },
      invoices: {
        include: { lineItems: true },
        orderBy: { createdAt: "desc" },
      },
      reservations: true,
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
  if (!data.customerName || !data.email || data.total === undefined)
    throw new ServiceError("customerName, email, and total are required");

  const orderId =
    data.id || `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

  const order = await prisma.$transaction(async (tx) => {
    let customerId = data.customerId;
    if (!customerId) {
      const existingCustomer = await tx.customer.findFirst({
        where: { email: data.email },
        orderBy: { createdAt: "asc" },
      });

      if (existingCustomer) {
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

    const normalizedItems = data.items ?? [];
    const reservedInventory: Array<{
      inventoryItemId: string;
      quantity: number;
      productNumber: string;
      partNumber: string;
      serialNumber: string;
    }> = [];
    const orderLineItems: Array<Record<string, unknown>> = [];
    let lineCounter = 1;

    for (const item of normalizedItems) {
      const allocations = await allocateInventoryForOrderItem(tx, item);

      for (const allocation of allocations) {
        reservedInventory.push(allocation);
        orderLineItems.push({
          lineReference: `${orderId}-LI-${String(lineCounter).padStart(4, "0")}`,
          variantId: item.variantId,
          inventoryItemId: allocation.inventoryItemId,
          productNumber: allocation.productNumber,
          partNumber: allocation.partNumber,
          serialNumber: allocation.serialNumber,
          name: item.name,
          category: item.category || "General",
          price: item.price,
          quantity: allocation.quantity,
          image: item.image,
          sku: item.sku,
        });
        lineCounter += 1;
      }
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

    const newOrder = await tx.order.create({
      data: orderData,
      include: { items: true },
    });

    if (data.paymentMethod) {
      const payment = await createPaymentTransaction(tx as any, {
        orderId: newOrder.id,
        method: data.paymentMethod,
        amount: data.total,
        gatewayTxnId: data.paymentTransactionId || undefined,
        idempotencyKey:
          data.paymentIdempotencyKey || `${newOrder.id}-${data.paymentMethod}-${Date.now()}`,
        metadata: data.paymentMetadata,
        status: data.paymentStatus,
      });

      if (data.paymentProofUrl) {
        await tx.paymentProof.create({
          data: {
            transactionId: payment.id,
            proofUrl: data.paymentProofUrl,
          },
        });
      }
    }

    // Automatically create reservations for items with inventoryItemId
    if (reservedInventory.length > 0) {
      for (const item of reservedInventory) {
        const reservationWhere: any = {
          id: item.inventoryItemId,
          quantityOnHand: { gte: item.quantity },
          trackingType: "SERIALIZED",
          serialNumber: item.serialNumber,
          partNumber: item.partNumber,
          quantityReserved: 0,
          status: { in: ["IN_STOCK", "RETURNED"] },
        };

        const reserved = await tx.inventoryItem.updateMany({
          where: reservationWhere,
          data: {
            quantityReserved: { increment: item.quantity },
            status: "RESERVED",
          },
        });

        if (reserved.count === 0) {
          throw new ServiceError("One or more inventory units became unavailable during checkout.", 409);
        }

        await tx.reservation.create({
          data: {
            orderId: newOrder.id,
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity,
            status: "ACTIVE",
          },
        });
      }
    }

    await tx.orderLog.create({
      data: {
        orderId: newOrder.id,
        status: "PENDING",
        note: "Order created and items reserved",
      },
    });

    return newOrder as any as Order;
  });

  return order as any as Order;
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH (field-level update, no status change)
// ─────────────────────────────────────────────────────────────────────────────

export async function updateOrder(
  id: string,
  data: Partial<Order> & { version: number }
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
      throw new ServiceError("Order was modified by another user, please refresh.", 409);
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
  note?: string
) {
  if (!status) throw new ServiceError("Status is required");

  const order = await prisma.order.findUnique({
    where: { id, deletedAt: null },
    include: { reservations: true, items: true },
  });
  if (!order) throw new ServiceError("Order not found", 404);

  // Validate transition
  assertStatusTransition(order.status, status);

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

    // PAID: Convert reservations from ACTIVE → CONVERTED, deduct on-hand
    if (status === "PAID") {
      const activeReservations = order.reservations.filter(
        (r) => r.status === "ACTIVE"
      );
      for (const res of activeReservations) {
        await tx.reservation.update({
          where: { id: res.id },
          data: { status: "CONVERTED" },
        });
        const inventoryItem = await tx.inventoryItem.findUnique({
          where: { id: res.inventoryItemId },
          select: { quantityOnHand: true },
        });

        await tx.inventoryItem.update({
          where: { id: res.inventoryItemId },
          data: {
            quantityReserved: { decrement: res.quantity },
            quantityOnHand: { decrement: res.quantity },
            status:
              Number(inventoryItem?.quantityOnHand ?? 0) - Number(res.quantity) <= 0
                ? "SOLD"
                : "IN_STOCK",
          },
        });
      }
    }

    // DELIVERED: Mark inventory items as SOLD
    if (status === "DELIVERED") {
      for (const item of order.items) {
        if (item.inventoryItemId) {
          await tx.inventoryItem.update({
            where: { id: item.inventoryItemId },
            data: { status: "SOLD" },
          });
        }
      }
    }

    // RETURNED: Restore inventory
    if (status === "RETURNED") {
      for (const item of order.items) {
        if (item.inventoryItemId) {
          await tx.inventoryItem.update({
            where: { id: item.inventoryItemId },
            data: {
              quantityOnHand: { increment: item.quantity },
              status: "RETURNED",
            },
          });
        }
      }

      await tx.orderLog.create({
        data: {
          orderId: id,
          status: "RETURNED" as any,
          note: "Inventory restored for returned items",
        },
      });
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
    include: { reservations: true },
  });
  if (!order) throw new ServiceError("Order not found", 404);

  // Validate transition
  assertStatusTransition(order.status, "CANCELLED");

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

    // 3. Release active reservations and restore inventory
    const activeReservations = order.reservations.filter(
      (r) => r.status === "ACTIVE"
    );
    for (const res of activeReservations) {
      await tx.reservation.update({
        where: { id: res.id },
        data: { status: "RELEASED" },
      });
      await tx.inventoryItem.update({
        where: { id: res.inventoryItemId },
        data: {
          quantityReserved: { decrement: res.quantity },
          status: "IN_STOCK",
        },
      });
    }

    const convertedReservations = order.reservations.filter(
      (r) => r.status === "CONVERTED"
    );
    for (const res of convertedReservations) {
      await tx.reservation.update({
        where: { id: res.id },
        data: { status: "RELEASED" },
      });
      await tx.inventoryItem.update({
        where: { id: res.inventoryItemId },
        data: {
          quantityOnHand: { increment: res.quantity },
          status: "IN_STOCK",
        },
      });
    }

    // 4. Log reservation release
    if (activeReservations.length > 0 || convertedReservations.length > 0) {
      await tx.orderLog.create({
        data: {
          orderId: id,
          status: "CANCELLED",
          note: `Released ${activeReservations.length} active reservation(s) and restored ${convertedReservations.length} converted allocation(s)`,
        },
      });
    }

    return updatedOrder as any as Order;
  });
}
