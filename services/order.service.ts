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
import { createPaymentTransaction } from "../lib/payments";
import { assertOrderTransition } from "@/lib/orderTransitions";

type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function allocateInventoryForOrderItem(tx: PrismaTx, item: CreateOrderItem) {
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
        product: {
          select: {
            sku: true,
          },
        },
      },
    });

    if (!inventoryItem || inventoryItem.productId !== item.productId) {
      throw new ServiceError(
        "Requested inventory item is not available for this product.",
        400,
      );
    }
    if (!inventoryItem.serialNumber || !inventoryItem.partNumber) {
      throw new ServiceError(
        "Serialized inventory item is missing part or serial number.",
        400,
      );
    }

    const available = Number(inventoryItem.quantity ?? 0) - Number(inventoryItem.reserved ?? 0);
    if (available < 1) {
      throw new ServiceError(
        "Requested inventory item is no longer available.",
        409,
      );
    }

    return [
      {
        inventoryItemId: inventoryItem.id,
        quantity: 1,
        productNumber:
          inventoryItem.product?.sku ||
          item.productNumber ||
          item.sku ||
          item.productId,
        partNumber: inventoryItem.partNumber,
        serialNumber: inventoryItem.serialNumber,
      },
    ];
  }

  // Find serialized inventory items first
  const serializedItems = await tx.inventoryItem.findMany({
    where: {
      productId: item.productId,
      serialNumber: { not: null },
      quantity: { gt: 0 },
      reserved: 0,
    },
    include: {
      product: {
        select: {
          sku: true,
        },
      },
    },
    orderBy: [{ lastUpdated: "asc" }],
    take: item.quantity,
  });

  if (serializedItems.length === item.quantity) {
    const seenSerial = new Set<string>();
    const seenPart = new Set<string>();

    return serializedItems.map((inventoryItem: any) => {
      if (!inventoryItem.serialNumber || !inventoryItem.partNumber) {
        throw new ServiceError(
          "Serialized inventory item is missing part or serial number.",
          400,
        );
      }
      if (
        seenSerial.has(inventoryItem.serialNumber) ||
        seenPart.has(inventoryItem.partNumber)
      ) {
        throw new ServiceError(
          `Inventory allocation conflict detected for product ${item.productId}.`,
          409,
        );
      }

      seenSerial.add(inventoryItem.serialNumber);
      seenPart.add(inventoryItem.partNumber);

      return {
        inventoryItemId: inventoryItem.id,
        quantity: 1,
        productNumber:
          inventoryItem.product?.sku ||
          item.productNumber ||
          item.sku ||
          item.productId,
        partNumber: inventoryItem.partNumber,
        serialNumber: inventoryItem.serialNumber,
      };
    });
  }

  // Fallback to bulk inventory items
  const bulkItems = await tx.inventoryItem.findMany({
    where: {
      productId: item.productId,
      serialNumber: null,
    },
    include: {
      product: {
        select: {
          sku: true,
        },
      },
    },
  });

  let totalAvailableBulk = 0;
  for (const b of bulkItems) {
    totalAvailableBulk += (b.quantity ?? 0) - (b.reserved ?? 0);
  }

  if (totalAvailableBulk >= item.quantity) {
    let remainingToAllocate = item.quantity;
    const allocations = [];

    for (const b of bulkItems) {
      const avail = (b.quantity ?? 0) - (b.reserved ?? 0);
      if (avail <= 0) continue;

      const take = Math.min(avail, remainingToAllocate);
      allocations.push({
        inventoryItemId: b.id,
        quantity: take,
        productNumber: b.product?.sku || item.sku || item.productId,
        partNumber: b.partNumber || "",
        serialNumber: b.serialNumber || "",
      });

      remainingToAllocate -= take;
      if (remainingToAllocate === 0) break;
    }

    return allocations;
  }

  throw new ServiceError(
    `Insufficient stock for product ${item.productId}. Each ordered unit must map to unique serial/part numbers or bulk stock.`,
    409,
  );
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
    const orderLineItems: Array<any> = [];

    for (const item of normalizedItems) {
      const allocations = await allocateInventoryForOrderItem(tx, item);

      const assignedUnits = allocations.map((a) => ({
        inventoryItemId: a.inventoryItemId,
        serialNumber: a.serialNumber || null,
        partNumber: a.partNumber || null,
      }));

      for (const allocation of allocations) {
        reservedInventory.push(allocation);
      }

      orderLineItems.push({
        productId: item.productId,
        name: item.name,
        categoryId: item.categoryId || 1,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        sku: item.sku,
        assignedUnits: assignedUnits.length > 0 ? {
          create: assignedUnits,
        } : undefined,
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

    const newOrder = await tx.order.create({
      data: orderData,
      include: { items: true },
    });

    if (data.paymentMethod) {
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

    // Update reserved inventory
    if (reservedInventory.length > 0) {
      for (const item of reservedInventory) {
        const updated = await tx.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: {
            reserved: { increment: item.quantity },
          },
        });

        if ((updated.quantity ?? 0) < (updated.reserved ?? 0)) {
          throw new ServiceError(
            "One or more inventory units became unavailable during checkout.",
            409,
          );
        }
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

    // PAID: Convert reservations: decrement reserved and decrement quantity
    if (status === "PAID") {
      for (const item of order.items) {
        for (const unit of item.assignedUnits) {
          await tx.inventoryItem.update({
            where: { id: unit.inventoryItemId },
            data: {
              reserved: { decrement: 1 },
              quantity: { decrement: 1 },
            },
          });
        }
      }
    }

    // RETURNED: Restore inventory
    if (status === "RETURNED") {
      for (const item of order.items) {
        for (const unit of item.assignedUnits) {
          await tx.inventoryItem.update({
            where: { id: unit.inventoryItemId },
            data: {
              quantity: { increment: 1 },
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

    // 3. Release reservations and restore inventory
    if (order.status === "PAID" || order.status === "PROCESSING" || order.status === "SHIPPED") {
      // Restore inventory quantity (reserved was already decremented when transitioned to PAID)
      for (const item of order.items) {
        for (const unit of item.assignedUnits) {
          await tx.inventoryItem.update({
            where: { id: unit.inventoryItemId },
            data: {
              quantity: { increment: 1 },
            },
          });
        }
      }
    } else if (order.status === "PENDING") {
      // Release reservation: decrement reserved (quantity remains unchanged)
      for (const item of order.items) {
        for (const unit of item.assignedUnits) {
          await tx.inventoryItem.update({
            where: { id: unit.inventoryItemId },
            data: {
              reserved: { decrement: 1 },
            },
          });
        }
      }
    }

    // 4. Log reservation release
    const totalReleased = order.items.reduce((acc, item) => acc + item.assignedUnits.length, 0);
    if (totalReleased > 0) {
      await tx.orderLog.create({
        data: {
          orderId: id,
          status: "CANCELLED",
          note: `Released ${totalReleased} allocated inventory unit(s)`,
        },
      });
    }

    return updatedOrder as any as Order;
  });
}
