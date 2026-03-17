import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ── Schemas (module-level) ────────────────────────────────────
// Defined once at cold-start, never re-allocated per request.
const buildItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.number().int().positive().default(1),
});

const createBuildSchema = z.object({
  name: z.string().min(1),
  total: z.number().min(0),
  items: z.array(buildItemSchema).min(1),
});

// ── Shared select shapes (module-level) ───────────────────────
// Centralising select objects in constants serves two purposes:
//   1. They're allocated once, not rebuilt on every request.
//   2. GET and POST return identical shapes — a single definition
//      prevents the two from silently drifting apart over time.
//
// Deep-nesting (BuildGuide → items → variant → product → brand/media)
// is intentional: Prisma resolves each relation as a JOIN rather than
// a separate round-trip, so one query fetches the full graph.
// This is the correct way to eliminate N+1 on nested relations.
const ITEM_SELECT = {
  id: true,
  variantId: true,
  quantity: true,
  variant: {
    select: {
      id: true,
      sku: true,
      price: true,
      status: true,
      product: {
        select: {
          id: true,
          name: true,
          category: true,
          specs: true,
          brand: { select: { id: true, name: true } },
          // take:1 + orderBy keeps this a single extra JOIN rather than
          // fetching all media rows and discarding them in JS.
          media: {
            select: { url: true },
            take: 1,
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  },
} as const;

// POST response omits `status` on variant (not in original POST select).
// A separate constant keeps the POST payload lean without touching GET.
const ITEM_SELECT_POST = {
  ...ITEM_SELECT,
  variant: {
    select: {
      id: true,
      sku: true,
      price: true,
      // status intentionally omitted — matches original POST response shape
      product: ITEM_SELECT.variant.select.product,
    },
  },
} as const;

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
      // Hard cap at 50 rows — unchanged from original.
      // For large datasets consider cursor-based pagination instead.
      take: 50,
    });

    // Cache-Control strategy:
    //   - s-maxage=30   → CDN / Vercel Edge serves from cache for 30 s
    //   - stale-while-revalidate=60 → after 30 s, serve stale instantly
    //                                  while refreshing in the background
    // Safe here because build-guide lists are read-heavy and
    // tolerate a few seconds of eventual consistency.
    // Remove or lower s-maxage if real-time accuracy is required.
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

    // De-duplicate variantIds before the existence check.
    // Without this, a payload with repeated IDs passes the
    // `variants.length !== variantIds.length` guard even when
    // a variant is genuinely missing.
    const variantIds = [...new Set(data.items.map((i) => i.variantId))];

    // Run variant existence check and build creation in a single
    // transaction so we never create a build whose variants are
    // deleted between the check and the insert.
    //
    // The existence check uses `select: { id: true }` — the minimal
    // projection. Postgres only touches the index, never the heap.
    //
    // maxWait / timeout are conservative for a two-statement tx.
    const build = await prisma.$transaction(
      async (tx) => {
        const variants = await tx.productVariant.findMany({
          where: { id: { in: variantIds } },
          select: { id: true },
        });

        if (variants.length !== variantIds.length) {
          // Throwing inside the transaction automatically rolls it back.
          throw new VariantNotFoundError();
        }

        return tx.buildGuide.create({
          data: {
            title: data.name,
            total: data.total,
            items: {
              // createMany would be faster for large item arrays, but
              // Prisma's nested `create` is used here because it returns
              // the created rows in the same round-trip (createMany does not).
              // For >20 items, consider createMany + a follow-up findUnique.
              create: data.items.map((i) => ({
                variantId: i.variantId,
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
    if (error instanceof VariantNotFoundError) {
      return NextResponse.json(
        { error: "One or more products/variants not found" },
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

// ── Sentinel error (avoids stringly-typed throws) ────────────
// A dedicated class lets the catch block distinguish a business-logic
// 404 from an unexpected DB error without inspecting error messages.
class VariantNotFoundError extends Error {
  constructor() {
    super("One or more variants not found");
    this.name = "VariantNotFoundError";
  }
}