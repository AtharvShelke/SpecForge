import { NextResponse } from "next/server";
import {
  createBuildGuide,
  listBuildGuides,
} from "@/services/build-guide.service";
import { ServiceError } from "@/lib/errors";
import {
  serializeBuildGuide,
  serializeBuildGuides,
} from "@/lib/adminSerializers";
import { getSessionUser } from "@/lib/auth";

<<<<<<< HEAD
export async function GET() {
  try {
    const guides = await listBuildGuides();
    return NextResponse.json(serializeBuildGuides(guides));
  } catch (error: unknown) {
    if (error instanceof ServiceError)
      return new NextResponse(error.message, { status: error.statusCode });
    console.error("[GET_BUILD_GUIDES]", error);
    return new NextResponse("Internal error", { status: 500 });
=======
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
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

<<<<<<< HEAD
    const body = await request.json();
    const guide = await createBuildGuide(body);
    return NextResponse.json(serializeBuildGuide(guide), { status: 201 });
  } catch (error: unknown) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
=======
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
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
      );
    }
    console.error("[POST_BUILD_GUIDES]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
<<<<<<< HEAD
=======

class ProductNotFoundError extends Error {
  constructor() {
    super("One or more products not found");
    this.name = "ProductNotFoundError";
  }
}
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
