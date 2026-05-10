import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ── Schemas (module-level) ────────────────────────────────────
// Defined once at cold-start, never re-allocated per request.
const buildItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().default(1),
});

const createBuildSchema = z.object({
  name: z.string().min(1),
  total: z.number().min(0),
  items: z.array(buildItemSchema).min(1),
});

const ITEM_SELECT = {
  id: true,
  productId: true,
  quantity: true,
  product: {
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      stockStatus: true,
      category: true,
      specs: true,
      brand: { select: { id: true, name: true } },
      media: {
        select: { url: true },
        take: 1,
        orderBy: { sortOrder: "asc" },
      },
    },
  },
} as const;

const ITEM_SELECT_POST = ITEM_SELECT;

const BUILD_SELECT_GET = {
  id: true,
  title: true,
  description: true,
  category: true,
  total: true,
  createdAt: true,
  items: { select: ITEM_SELECT },
} as const;

const BUILD_SELECT_POST = {
  id: true,
  title: true,
  total: true,
  createdAt: true,
  items: { select: ITEM_SELECT_POST },
} as const;

// ── GET /api/build-guides ─────────────────────────────────────
export async function GET() {
  try {
    const builds = await prisma.buildGuide.findMany({
      select: BUILD_SELECT_GET,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(builds, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("GET /api/build-guides error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── POST /api/build-guides ────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createBuildSchema.parse(body);

    const productIds = [...new Set(data.items.map((i) => i.productId))];

    const build = await prisma.$transaction(
      async (tx) => {
        const products = await tx.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true },
        });

        if (products.length !== productIds.length) {
          throw new ProductNotFoundError();
        }

        return tx.buildGuide.create({
          data: {
            title: data.name,
            total: data.total,
            items: {
              create: data.items.map((i) => ({
                productId: i.productId,
                quantity: i.quantity,
              })),
            },
          },
          select: BUILD_SELECT_POST,
        });
      },
      { maxWait: 3000, timeout: 10000 }
    );

    return NextResponse.json(build, { status: 201 });
  } catch (error) {
    if (error instanceof ProductNotFoundError) {
      return NextResponse.json(
        { error: "One or more products not found" },
        { status: 404 }
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("POST /api/build-guides error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

class ProductNotFoundError extends Error {
  constructor() {
    super("One or more products not found");
    this.name = "ProductNotFoundError";
  }
}