import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CategoryEnum = z.enum([
  "PROCESSOR", "GPU", "MOTHERBOARD", "RAM", "STORAGE",
  "PSU", "CABINET", "COOLER", "MONITOR", "PERIPHERAL", "NETWORKING", "LAPTOP",
]);

const createBrandSchema = z.object({
  name: z.string().min(1).trim(),
  categories: z.array(CategoryEnum).default([]),
});

// ── Stable cache headers for GET (revalidate every 30s via stale-while-revalidate) ──
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
};

// ── GET /api/brands ─────────────────────────────────────
export async function GET() {
  try {
    // Single optimized query — no N+1, minimal payload via select
    const brands = await prisma.brand.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        categories: true,
        createdAt: true,
        _count: { select: { products: true } },
      },
    });

    return NextResponse.json(brands, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error("GET /api/brands error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── POST /api/brands ────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // Parse body and validate in parallel-friendly flow (no blocking await before validation)
    const body = await req.json();
    const parsed = createBrandSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const data = parsed.data;

    // Use upsert-style conflict detection via a single atomic DB round-trip
    // instead of findUnique + create (two round-trips = 2x latency)
    try {
      const brand = await prisma.brand.create({
        data: { name: data.name, categories: data.categories },
        // Return only what the client needs — avoids fetching unused fields
        select: {
          id: true,
          name: true,
          categories: true,
          createdAt: true,
        },
      });

      return NextResponse.json(brand, { status: 201 });
    } catch (dbError: unknown) {
      // P2002 = Prisma unique constraint violation — catches the race condition
      // that the two-query pattern couldn't handle anyway
      if (
        typeof dbError === "object" &&
        dbError !== null &&
        "code" in dbError &&
        (dbError as { code: string }).code === "P2002"
      ) {
        return NextResponse.json({ error: "Brand name already exists" }, { status: 409 });
      }
      throw dbError; // re-throw anything else to the outer catch
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("POST /api/brands error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}