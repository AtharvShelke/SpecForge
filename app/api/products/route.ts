import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ── Validation ──────────────────────────────────────────
const CategoryEnum = z.enum([
    "PROCESSOR", "GPU", "MOTHERBOARD", "RAM", "STORAGE",
    "PSU", "CABINET", "COOLER", "MONITOR", "PERIPHERAL", "NETWORKING", "LAPTOP",
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
    images: z.array(z.string().min(1)).min(1), // Support multiple images
    description: z.string().optional(),
    brandId: z.string().uuid().optional(),
    specs: z.array(specSchema).default([]),
    // Inventory fields for initial stock
    costPrice: z.number().min(0).default(0),
    reorderLevel: z.number().int().min(0).default(5),
    location: z.string().default(""),
});

export async function getProductsData(searchParams: URLSearchParams) {
    try {

        const category = searchParams.get("category");
        const brandId = searchParams.get("brandId");
        const search = searchParams.get("search");
        const minPrice = searchParams.get("minPrice");
        const maxPrice = searchParams.get("maxPrice");
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "50", 10);

        const sort = searchParams.get("sort") || "popularity";

        let nodeBrand = searchParams.get("nodeBrand");
        let nodeQuery = searchParams.get("nodeQuery");
        let globalSearch = searchParams.get("q");
        let sidebarSearch = searchParams.get("sq");

        const where: any = {};

        // 1. Initial category constraint logic
        if (category && CategoryEnum.safeParse(category).success && !globalSearch) {
            where.category = category;
        }
        if (brandId && !globalSearch) where.brandId = brandId;

        if (minPrice) where.price = { ...where.price, gte: parseFloat(minPrice) };
        if (maxPrice) where.price = { ...where.price, lte: parseFloat(maxPrice) };

        // 2. Add text search constraints
        const searchConditions: any[] = [];
        if (globalSearch) {
            const term = globalSearch.toLowerCase();
            // Global search overrides specific category if not in build mode, 
            // but since we accept 'category' explicit parameter we leave it in the AND chain.
            searchConditions.push({
                OR: [
                    { name: { contains: term, mode: "insensitive" } },
                    { variants: { some: { sku: { contains: term, mode: "insensitive" } } } },
                    { description: { contains: term, mode: "insensitive" } },
                    { specs: { some: { value: { contains: term, mode: "insensitive" } } } }
                ]
            });
        }

        if (sidebarSearch) {
            const term = sidebarSearch.toLowerCase();
            searchConditions.push({
                OR: [
                    { name: { contains: term, mode: "insensitive" } },
                    { specs: { some: { value: { contains: term, mode: "insensitive" } } } }
                ]
            });
        }

        if (nodeBrand) {
            // Need to match the actual Brand relations name. We can search brand string
            searchConditions.push({ brand: { name: { equals: nodeBrand, mode: "insensitive" } } });
        }

        if (nodeQuery) {
            const term = nodeQuery.toLowerCase();
            searchConditions.push({
                OR: [
                    { name: { contains: term, mode: "insensitive" } },
                    { specs: { some: { value: { contains: term, mode: "insensitive" } } } }
                ]
            });
        }

        // 3. Dynamic attributes from query string
        const specsConditions: any[] = [];
        Array.from(searchParams.keys()).forEach(key => {
            if (key === 'f_stock_status') {
                const vals = searchParams.getAll(key);
                if (vals.includes('In Stock') && !vals.includes('Out of Stock')) {
                    where.variants = { some: { warehouseInventories: { some: { quantity: { gt: 0 } } } } };
                } else if (!vals.includes('In Stock') && vals.includes('Out of Stock')) {
                    where.variants = { none: { warehouseInventories: { some: { quantity: { gt: 0 } } } } };
                }
            } else if (key === 'f_brand') {
                const vals = searchParams.getAll(key);
                if (vals.length > 0) {
                    specsConditions.push({ brand: { name: { in: vals, mode: "insensitive" } } });
                }
            } else if (key.startsWith('f_specs.')) {
                const specKey = key.replace('f_specs.', '');
                const specValues = searchParams.getAll(key);
                if (specValues.length > 0) {
                    // In Prisma, we want to match AT LEAST ONE of the selected values for this specific specKey
                    specsConditions.push({
                        specs: {
                            some: {
                                key: specKey,
                                value: { in: specValues }
                            }
                        }
                    });
                }
            }
        });

        // Combine constraints
        const andConditions = [...searchConditions, ...specsConditions];
        if (andConditions.length > 0) {
            where.AND = andConditions;
        }

        let orderBy: any = { createdAt: "desc" };
        if (sort === "price-asc") orderBy = { price: "asc" };
        else if (sort === "price-desc") orderBy = { price: "desc" };
        else if (sort === "newest") orderBy = { createdAt: "desc" };

        let filterOptions = undefined;
        if (searchParams.get("getFilters") === "true") {
            const allMatch = await prisma.product.findMany({
                where,
                select: {
                    brand: { select: { name: true } },
                    specs: { select: { key: true, value: true } }
                }
            });
            const brandsSet = new Set<string>();
            const specsMap: Record<string, Set<string>> = {};
            for (const p of allMatch) {
                if (p.brand?.name) brandsSet.add(p.brand.name);
                for (const s of p.specs) {
                    if (!specsMap[s.key]) specsMap[s.key] = new Set();
                    specsMap[s.key].add(s.value);
                }
            }
            const specsObj: Record<string, string[]> = {};
            for (const key in specsMap) {
                specsObj[key] = Array.from(specsMap[key]).sort();
            }
            filterOptions = {
                brands: Array.from(brandsSet).sort(),
                specs: specsObj
            };
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: { specs: true, brand: true, variants: true, media: true },
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.product.count({ where }),
        ]);

        return NextResponse.json({ products, total, page, limit, filterOptions });
    } catch (error) {
        console.error("getProductsData error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── GET /api/products ───────────────────────────────────
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    return getProductsData(searchParams);
}

// ── POST /api/products ──────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const data = createProductSchema.parse(body);

        // Check SKU uniqueness
        const existing = await prisma.productVariant.findUnique({ where: { sku: data.sku } });
        if (existing) {
            return NextResponse.json({ error: "SKU already exists" }, { status: 409 });
        }

        // Create product with specs and inventory in a transaction
        const product = await prisma.$transaction(async (tx) => {
            const p = await tx.product.create({
                data: {
                    slug: data.sku, // MOCK slug from sku for now
                    name: data.name,
                    category: data.category,
                    description: data.description,
                    brandId: data.brandId,
                    specs: {
                        create: data.specs.map((s) => ({ key: s.key, value: s.value })),
                    },
                    media: {
                        create: data.images.map((url, index) => ({
                            url,
                            sortOrder: index
                        }))
                    },
                    variants: {
                        create: [{ sku: data.sku, price: data.price, status: 'IN_STOCK' }]
                    }
                },
                include: { specs: true, brand: true, variants: true, media: true },
            });

            // Ensure a primary warehouse exists
            let defaultWarehouse = await tx.warehouse.findFirst({
                where: { code: "MAIN" }
            });
            if (!defaultWarehouse) {
                defaultWarehouse = await tx.warehouse.create({
                    data: {
                        name: "Main Warehouse",
                        code: "MAIN",
                        isActive: true,
                    }
                });
            }

            // Create inventory item
            const inv = await tx.warehouseInventory.create({
                data: {
                    variantId: p.variants[0].id,
                    warehouseId: defaultWarehouse.id,
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
                        warehouseInventoryId: inv.id,
                        warehouseId: defaultWarehouse.id,
                        type: "INWARD" as const,
                        quantity: data.stock,
                        newQuantity: data.stock,
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
