import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createBrandSchema = z.object({
  name: z.string().min(1).trim(),
  slug: z.string().min(1).trim().optional(),
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
        slug: true,
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
    const body = await req.json();
    const parsed = createBrandSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const data = parsed.data;
    const finalSlug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    try {
      const brand = await prisma.brand.create({
        data: { name: data.name, slug: finalSlug },
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
        },
      });

      return NextResponse.json(brand, { status: 201 });
    } catch (dbError: any) {
      if (dbError?.code === "P2002") {
        return NextResponse.json({ error: "Brand name or slug already exists" }, { status: 409 });
      }
      throw dbError; // re-throw anything else to the outer catch
    }
  } catch (error) {
    console.error("POST /api/brands error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}