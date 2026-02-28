import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ── Validation ──────────────────────────────────────────
const CategoryEnum = z.enum([
    "PROCESSOR", "GPU", "MOTHERBOARD", "RAM", "STORAGE",
    "PSU", "CABINET", "COOLER", "MONITOR", "PERIPHERAL", "NETWORKING",
]);

const specSchema = z.object({
    key: z.string().min(1),
    value: z.string().min(1),
});

const createProductSchema = z.object({
    sku: z.string().min(1),
    name: z.string().min(1),
    category: CategoryEnum,
    price: z.number().positive(),
    stock: z.number().int().min(0).default(0),
    image: z.string().min(1),
    description: z.string().optional(),
    brandId: z.string().uuid().optional(),
    specs: z.array(specSchema).default([]),
    // Inventory fields for initial stock
    costPrice: z.number().min(0).default(0),
    reorderLevel: z.number().int().min(0).default(5),
    location: z.string().default(""),
});

// ── GET /api/products ───────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get("category");
        const brandId = searchParams.get("brandId");
        const search = searchParams.get("search");
        const minPrice = searchParams.get("minPrice");
        const maxPrice = searchParams.get("maxPrice");
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "50", 10);

        const where: any = {};
        if (category && CategoryEnum.safeParse(category).success) {
            where.category = category;
        }
        if (brandId) where.brandId = brandId;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
            ];
        }
        if (minPrice) where.price = { ...where.price, gte: parseFloat(minPrice) };
        if (maxPrice) where.price = { ...where.price, lte: parseFloat(maxPrice) };

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: { specs: true, brand: true },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.product.count({ where }),
        ]);

        return NextResponse.json({ products, total, page, limit });
    } catch (error) {
        console.error("GET /api/products error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── POST /api/products ──────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const data = createProductSchema.parse(body);

        // Check SKU uniqueness
        const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
        if (existing) {
            return NextResponse.json({ error: "SKU already exists" }, { status: 409 });
        }

        // Create product with specs and inventory in a transaction
        const product = await prisma.$transaction(async (tx) => {
            const p = await tx.product.create({
                data: {
                    sku: data.sku,
                    name: data.name,
                    category: data.category,
                    price: data.price,
                    stock: data.stock,
                    image: data.image,
                    description: data.description,
                    brandId: data.brandId,
                    specs: {
                        create: data.specs.map((s) => ({ key: s.key, value: s.value })),
                    },
                },
                include: { specs: true, brand: true },
            });

            // Create inventory item
            const inv = await tx.inventoryItem.create({
                data: {
                    productId: p.id,
                    sku: data.sku,
                    productName: data.name,
                    quantity: data.stock,
                    reserved: 0,
                    reorderLevel: data.reorderLevel,
                    costPrice: data.costPrice,
                    location: data.location,
                },
            });

            // Log initial stock movement if stock > 0
            if (data.stock > 0) {
                await tx.stockMovement.create({
                    data: {
                        inventoryItemId: inv.id,
                        type: "INWARD" as const,
                        quantity: data.stock,
                        reason: "Initial stock entry",
                        performedBy: "System",
                    },
                });
            }

            return p;
        });

        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("POST /api/products error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
