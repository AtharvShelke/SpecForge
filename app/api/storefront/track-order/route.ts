import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/services/catalog.service";
import { measureRoute } from "@/lib/performance";

export async function POST(req: NextRequest) {
  return measureRoute("POST /api/storefront/track-order", async () => {
    try {
      const { orderId, contact } = await req.json();

      if (!orderId || !contact) {
        return NextResponse.json(
          { error: "Order ID and contact detail are required" },
          { status: 400 }
        );
      }

      const trimId = orderId.trim().toUpperCase();
      const trimContact = contact.trim().toLowerCase();

      const order = await prisma.order.findUnique({
        where: { id: trimId, deletedAt: null },
        include: {
          items: true,
          logs: { orderBy: { timestamp: "desc" } },
        },
      });

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      const emailMatch = order.email.toLowerCase() === trimContact;
      const phoneMatch = order.phone?.toLowerCase() === trimContact;

      if (!emailMatch && !phoneMatch) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      return NextResponse.json(order);
    } catch (error: any) {
      console.error("[TRACK_ORDER_API]", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}
