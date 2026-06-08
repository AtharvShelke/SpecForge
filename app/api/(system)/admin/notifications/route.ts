import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch products with low stock (count of AVAILABLE inventory items < 3)
    const products = await prisma.product.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        inventoryItems: {
          where: { status: "AVAILABLE" },
          select: { id: true }
        }
      }
    });

    const lowStockAlerts = products
      .filter(p => p.inventoryItems.length < 3)
      .map(p => ({
        id: `low-stock-${p.id}`,
        type: p.inventoryItems.length === 0 ? "error" as const : "warning" as const,
        title: p.inventoryItems.length === 0 ? "Out of Stock" : "Low Stock Alert",
        message: p.inventoryItems.length === 0 
          ? `${p.name} is completely out of stock.`
          : `${p.name} has only ${p.inventoryItems.length} available units left.`,
        link: `/admin?tab=products&q=${encodeURIComponent(p.name)}`,
        createdAt: new Date().toISOString()
      }));

    // 2. Fetch orders with pending manual payment proofs
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: "PENDING",
        payments: {
          some: {
            method: { in: ["UPI", "BANK_TRANSFER"] },
            status: { not: "COMPLETED" }
          }
        }
      },
      select: {
        id: true,
        customerName: true,
        total: true,
        date: true,
        payments: {
          select: {
            metadata: true
          }
        }
      },
      orderBy: { date: "desc" }
    });

    const paymentAlerts = pendingOrders
      .filter(order => 
        order.payments.some(payment => {
          const meta = payment.metadata as any;
          return meta && typeof meta === "object" && meta.proofUrl;
        })
      )
      .map(order => ({
        id: `payment-${order.id}`,
        type: "info" as const,
        title: "Payment Validation Awaiting Review",
        message: `Order ${order.id} (₹${order.total.toLocaleString("en-IN")}) by ${order.customerName} has upload proof awaiting verification.`,
        link: `/admin?tab=orders&q=${order.id}`,
        createdAt: order.date.toISOString()
      }));

    // 3. Fetch placeholder inventory units
    const placeholderCount = await prisma.inventoryItem.count({
      where: {
        serialNumber: { startsWith: "SN-" },
        OR: [
          { partNumber: null },
          { partNumber: "" }
        ]
      }
    });

    const placeholderAlerts = placeholderCount > 0 ? [{
      id: "placeholder-units-alert",
      type: "warning" as const,
      title: "Placeholder Inventory Details",
      message: `There are ${placeholderCount} inventory items using auto-generated serials and missing part numbers.`,
      link: "/admin?tab=inventory&placeholder=true",
      createdAt: new Date().toISOString()
    }] : [];

    // Combine and sort by severity
    // Priorities: error > warning > info
    const severityMap = { error: 3, warning: 2, info: 1, success: 0 };
    const notifications = [...lowStockAlerts, ...placeholderAlerts, ...paymentAlerts].sort(
      (a, b) => severityMap[b.type] - severityMap[a.type]
    );

    return NextResponse.json({
      notifications,
      totalCount: notifications.length
    });
  } catch (error: any) {
    console.error("[ADMIN_NOTIFICATIONS] Fetch error:", error);
    return NextResponse.json({ error: error.message || "Failed to load notifications." }, { status: 500 });
  }
}
