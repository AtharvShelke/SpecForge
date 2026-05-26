import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createBrandSchema = z.object({
  name: z.string().min(1).trim(),
  categories: z.array(z.string().min(1)).default([]),
});

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
};

function normalizeIdentifier(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function loadCategoryResolver() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true, slug: true, shortLabel: true },
  });

  return {
    resolveCategoryIds(inputs: string[]) {
      const requested = new Set(inputs.map((input) => normalizeIdentifier(input)).filter(Boolean));
      const matches = new Set<number>();

      for (const category of categories) {
        const candidateKeys = new Set([
          normalizeIdentifier(category.code),
          normalizeIdentifier(category.name),
          normalizeIdentifier(category.slug),
          normalizeIdentifier(category.shortLabel),
          normalizeIdentifier(slugify(category.name)),
        ]);

        if ([...candidateKeys].some((key) => requested.has(key))) {
          matches.add(category.id);
        }
      }

      return [...matches];
    },
  };
}

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { name: "asc" },
      include: {
        brandCategories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: { select: { products: true } },
      },
    });

    return NextResponse.json(
      brands.map(({ brandCategories, ...brand }) => ({
        ...brand,
        categories: brandCategories.map((item) => item.category),
      })),
      { headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error("GET /api/brands error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createBrandSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const resolver = await loadCategoryResolver();
    const categoryIds = resolver.resolveCategoryIds(parsed.data.categories);

    try {
      const brand = await prisma.brand.create({
        data: {
          name: parsed.data.name,
          brandCategories: categoryIds.length
            ? {
                create: categoryIds.map((categoryId) => ({
                  category: { connect: { id: categoryId } },
                })),
              }
            : undefined,
        },
        include: {
          brandCategories: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      });

      return NextResponse.json({
        id: brand.id,
        name: brand.name,
        createdAt: brand.createdAt,
        updatedAt: brand.updatedAt,
        categories: brand.brandCategories.map((item) => item.category),
      }, { status: 201 });
    } catch (dbError: unknown) {
      if (
        typeof dbError === "object" &&
        dbError !== null &&
        "code" in dbError &&
        (dbError as { code: string }).code === "P2002"
      ) {
        return NextResponse.json({ error: "Brand name already exists" }, { status: 409 });
      }
      throw dbError;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("POST /api/brands error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
