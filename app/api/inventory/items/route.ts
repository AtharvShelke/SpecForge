import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createInventoryUnit } from "@/services/inventory.service";
import { ServiceError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const productId = searchParams.get("productId") || searchParams.get("variantId") || undefined;

    const where: any = {};
    if (productId) where.productId = productId;

    const items = await prisma.inventoryItem.groupBy({
      by: ["productId"],
      where,
      _count: { id: true },
    });

    const res = await Promise.all(
      items.map(async (group) => {
        const available = await prisma.inventoryItem.count({
          where: { productId: group.productId, status: "AVAILABLE" },
        });
        const reserved = await prisma.inventoryItem.count({
          where: { productId: group.productId, status: "RESERVED" },
        });
        return {
          productId: group.productId,
          quantity: available,
          reserved: reserved,
          total: group._count.id,
        };
      })
    );

    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, serialNumber, partNumber, costPrice, location } = body;

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const genSerial = serialNumber || `SN-AUTO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const created = await createInventoryUnit({
      productId,
      serialNumber: genSerial,
      partNumber: partNumber || undefined,
      costPrice: Number(costPrice ?? 0),
      location: location || undefined,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    if (error instanceof ServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
