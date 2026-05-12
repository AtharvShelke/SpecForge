import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getBaseUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { calculateOrderFinancials } from "@/lib/tax-engine";
import {
  InsufficientStockError,
  reserveInventory,
} from "@/lib/services/inventory";
import { sendMail } from "@/lib/services/mail";
import { createPaymentTransaction } from "@/lib/services/payment";
import { createOrderInvoiceAccessToken } from "@/lib/security/documents";
import { handleApiError, jsonError } from "@/lib/security/errors";
import { escapeHtml } from "@/lib/security/html";
import {
  enforceRateLimit,
  withRateLimitHeaders,
} from "@/lib/security/rate-limit";
import { buildAuditContext } from "@/lib/security/request";
import { parseJsonBody } from "@/lib/security/validation";

const OrderStatusEnum = z.enum([
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
]);

const SalesChannelEnum = z.enum(["ONLINE", "POS", "MANUAL", "API", "PHONE"]);
const PaymentMethodEnum = z.enum([
  "CARD",
  "UPI",
  "BANK_TRANSFER",
  "CASH",
  "WALLET",
]);

const orderItemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  categoryId: z.number().int().positive(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  image: z.string().optional(),
  sku: z.string().optional(),
});

const createOrderSchema = z.object({
  id: z.string().min(1),
  channel: SalesChannelEnum.default("ONLINE"),
  customerName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  total: z.number().positive(),
  shippingStreet: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingZip: z.string().optional(),
  shippingCountry: z.string().optional(),
  paymentMethod: PaymentMethodEnum.optional(),
  paymentTransactionId: z.string().optional(),
  paymentStatus: z.string().optional(),
  idempotencyKey: z.string().optional(),
  source: z.record(z.string(), z.any()).optional(),
  items: z.array(orderItemSchema).min(1),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireAdmin(req);
    const rateLimit = enforceRateLimit(req, "adminAction", user.id);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const channel = searchParams.get("channel");
    const email = searchParams.get("email");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const where: any = {};
    if (status && OrderStatusEnum.safeParse(status).success) {
      where.status = status;
    }
    if (channel && SalesChannelEnum.safeParse(channel).success) {
      where.channel = channel;
    }
    if (email) {
      where.email = email;
    }
    if (search) {
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true,
          channel: true,
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
          customerId: true,
          paymentMethod: true,
          paymentStatus: true,
          createdAt: true,
          items: {
            select: {
              id: true,
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
          logs: {
            select: { id: true, status: true, timestamp: true, note: true },
            orderBy: { timestamp: "asc" as const },
          },
          shippingStreet: true,
          shippingCity: true,
          shippingState: true,
          shippingZip: true,
          shippingCountry: true,
        },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return withRateLimitHeaders(
      NextResponse.json({ orders, total, page, limit }),
      rateLimit
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const rateLimit = enforceRateLimit(req, "orderPlacement");
    const data = await parseJsonBody(req, createOrderSchema);
    const auditContext = buildAuditContext(req, null, {
      channel: data.channel,
      orderId: data.id,
    });

    if (data.idempotencyKey) {
      const existingOrder = await prisma.order.findUnique({
        where: { idempotencyKey: data.idempotencyKey },
        include: { items: true, logs: true },
      });

      if (existingOrder) {
        return withRateLimitHeaders(
          NextResponse.json(existingOrder, { status: 200 }),
          rateLimit
        );
      }
    }

    const order = await prisma.$transaction(
      async (tx) => {
        const calculationItems = data.items.map((item) => ({
          price: item.price,
          quantity: item.quantity,
        }));
        const { subtotal, gstAmount, taxAmount, total } =
          calculateOrderFinancials(calculationItems);

        let customer = await tx.customer.findFirst({
          where: { email: data.email },
        });
        if (!customer) {
          customer = await tx.customer.create({
            data: {
              name: data.customerName,
              email: data.email,
              phone: data.phone,
            },
          });
        }

        const reservations = await reserveInventory(
          tx,
          data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          data.id
        );
        const reservationMap = new Map(
          reservations.map((entry) => [entry.productId, entry])
        );

        const createdOrder = await tx.order.create({
          data: {
            id: data.id,
            channel: data.channel,
            customerName: data.customerName,
            email: data.email,
            phone: data.phone,
            customerId: customer.id,
            subtotal,
            gstAmount,
            taxAmount,
            discountAmount: 0,
            total,
            status: "PENDING",
            shippingStreet: data.shippingStreet,
            shippingCity: data.shippingCity,
            shippingState: data.shippingState,
            shippingZip: data.shippingZip,
            shippingCountry: data.shippingCountry,
            paymentMethod: data.paymentMethod,
            paymentTransactionId: data.paymentTransactionId,
            paymentStatus: data.paymentStatus,
            idempotencyKey: data.idempotencyKey,
            source: data.source,
            items: {
              create: data.items.map((item) => ({
                productId: item.productId,
                name: item.name,
                categoryId: item.categoryId,
                price: item.price,
                quantity: item.quantity,
                image: item.image,
                sku: item.sku,
                assignedUnits: {
                  create: (
                    reservationMap.get(item.productId)?.units ?? []
                  ).map((unit) => ({
                    inventoryItemId: unit.inventoryItemId,
                    serialNumber: unit.serialNumber,
                    partNumber: unit.partNumber,
                  })),
                },
              })),
            },
            logs: {
              create: {
                status: "PENDING",
                note: `Order placed via ${data.channel} channel.`,
              },
            },
          },
          include: {
            items: { include: { assignedUnits: true } },
            logs: true,
          },
        });

        if (data.channel === "POS" && data.paymentMethod) {
          await createPaymentTransaction(tx, {
            orderId: data.id,
            method: data.paymentMethod as any,
            amount: total,
            idempotencyKey: `pay-${data.id}-${Date.now()}`,
            status: "COMPLETED",
            metadata: { channel: data.channel },
          });

          await tx.order.update({
            where: { id: data.id },
            data: {
              status: "PAID",
              paymentStatus: "COMPLETED",
              logs: {
                create: {
                  status: "PAID",
                  note: "POS payment auto-confirmed.",
                },
              },
            },
          });
        }

        await tx.auditLog.create({
          data: {
            entityType: "Order",
            entityId: createdOrder.id,
            action: "created",
            actor: auditContext.actor,
            after: {
              status: createdOrder.status,
              total: createdOrder.total,
              channel: createdOrder.channel,
            },
            metadata: auditContext.metadata,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
          },
        });

        return createdOrder;
      },
      {
        maxWait: 5000,
        timeout: 15000,
      }
    );

    const accessToken = await createOrderInvoiceAccessToken({
      orderId: order.id,
      email: order.email,
    });
    const baseUrl = getBaseUrl();
    const invoiceLink = baseUrl
      ? `${baseUrl}/api/orders/${encodeURIComponent(
          order.id
        )}/invoice/pdf?accessToken=${encodeURIComponent(accessToken)}`
      : null;
    const trackingLink = baseUrl ? `${baseUrl}/track-order` : null;

    sendMail({
      to: order.email,
      subject: `Order Confirmation - ${order.id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #0056b3;">Thank you for your order, ${escapeHtml(order.customerName)}!</h2>
          <p>Your order <strong>${escapeHtml(order.id)}</strong> has been successfully placed.</p>
          <p><strong>Total Amount:</strong> Rs.${escapeHtml(order.total.toFixed(2))}</p>
          <h3 style="border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 20px;">Order Summary</h3>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
            <ul style="list-style: none; padding: 0; margin: 0;">
              ${order.items
                .map(
                  (item: any) => `
                    <li style="margin-bottom: 10px; border-bottom: 1px solid #eaeaea; padding-bottom: 10px;">
                      <strong>${escapeHtml(item.name)}</strong><br />
                      <span>Quantity: ${escapeHtml(item.quantity)}</span> | <span>Price: Rs.${escapeHtml(
                        (item.price * item.quantity).toFixed(2)
                      )}</span>
                    </li>
                  `
                )
                .join("")}
            </ul>
          </div>
          ${invoiceLink ? `<p style="margin-top: 20px;"><a href="${escapeHtml(invoiceLink)}">Download your invoice</a></p>` : ""}
          ${trackingLink ? `<p><a href="${escapeHtml(trackingLink)}">Track your order</a></p>` : ""}
          <p style="margin-top: 20px; color: #666; font-size: 14px;">We will notify you once your order has been processed and shipped.</p>
        </div>
      `,
    }).catch((err) => {
      console.error("Failed to send order confirmation email:", err);
    });

    return withRateLimitHeaders(
      NextResponse.json(order, { status: 201 }),
      rateLimit
    );
  } catch (error: any) {
    if (error instanceof InsufficientStockError) {
      return jsonError(409, error.message, "INSUFFICIENT_STOCK");
    }

    if (error?.message?.includes("Insufficient stock")) {
      return jsonError(409, error.message, "INSUFFICIENT_STOCK");
    }

    return handleApiError(error);
  }
}
