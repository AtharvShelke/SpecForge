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

// ── Shared helpers ───────────────────────────────────────────────────────────

function buildTextOR(term: string, includeDescription = false, includeSKU = false) {
    const conditions: any[] = [
        { name: { contains: term, mode: "insensitive" } },
        { specs: { some: { value: { contains: term, mode: "insensitive" } } } },
    ];
    if (includeSKU)
        conditions.push({ variants: { some: { sku: { contains: term, mode: "insensitive" } } } });
    if (includeDescription)
        conditions.push({ description: { contains: term, mode: "insensitive" } });
    return { OR: conditions };
}

// ── Select shapes ────────────────────────────────────────────────────────────

const MINIMAL_SELECT = {
    id: true, slug: true, name: true, category: true, status: true, createdAt: true,
    brand: { select: { id: true, name: true } },
    variants: {
        select: { id: true, sku: true, price: true, status: true, warehouseInventories: { select: { quantity: true } } },
        take: 1,
    },
    media: { select: { url: true }, take: 1, orderBy: { sortOrder: "asc" as const } },
} as const;

const FULL_SELECT = {
    id: true, slug: true, name: true, category: true, description: true, status: true, createdAt: true,
    specs: { select: { id: true, key: true, value: true } },
    brand: { select: { id: true, name: true } },
    variants: {
        select: {
            id: true, sku: true, price: true, compareAtPrice: true, status: true, attributes: true,
            warehouseInventories: { select: { id: true, quantity: true, reserved: true, warehouseId: true } },
        },
    },
    media: {
        select: { id: true, url: true, altText: true, sortOrder: true },
        orderBy: { sortOrder: "asc" as const },
        take: 4,
    },
} as const;

// ── Main handler ─────────────────────────────────────────────────────────────

export async function getProductsData(searchParams: URLSearchParams) {
    try {
        // ── Parse params ──────────────────────────────────────────────────────
        const category    = searchParams.get("category");
        const brandId     = searchParams.get("brandId");
        const minPrice    = searchParams.get("minPrice");
        const maxPrice    = searchParams.get("maxPrice");
        const sort        = searchParams.get("sort") ?? "popularity";
        const page        = parseInt(searchParams.get("page") ?? "1", 10);
        const limit       = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 5000);
        const fields      = searchParams.get("fields");
        const globalSearch  = searchParams.get("q");
        const sidebarSearch = searchParams.get("sq");
        const nodeBrand   = searchParams.get("nodeBrand");
        const nodeQuery   = searchParams.get("nodeQuery");

        // ── Base where ────────────────────────────────────────────────────────
        const where: any = {};
        if (!globalSearch) {
            if (category && CategoryEnum.safeParse(category).success) where.category = category;
            if (brandId) where.brandId = brandId;
        }

        // ── AND conditions ────────────────────────────────────────────────────
        const andConditions: any[] = [];

        // Price range
        if (minPrice || maxPrice) {
            andConditions.push({
                variants: {
                    some: {
                        price: {
                            ...(minPrice && { gte: parseFloat(minPrice) }),
                            ...(maxPrice && { lte: parseFloat(maxPrice) }),
                        },
                    },
                },
            });
        }

        // Text searches
        if (globalSearch)
            andConditions.push(buildTextOR(globalSearch.toLowerCase(), true, true));
        if (sidebarSearch)
            andConditions.push(buildTextOR(sidebarSearch.toLowerCase()));
        if (nodeQuery)
            andConditions.push(buildTextOR(nodeQuery.toLowerCase()));
        if (nodeBrand)
            andConditions.push({ brand: { name: { equals: nodeBrand, mode: "insensitive" } } });

        // Dynamic spec/brand/stock filters
        for (const key of searchParams.keys()) {
            if (key === "f_stock_status") {
                const vals = searchParams.getAll(key);
                const inStock  = vals.includes("In Stock");
                const outStock = vals.includes("Out of Stock");
                if (inStock && !outStock)
                    andConditions.push({ variants: { some: { warehouseInventories: { some: { quantity: { gt: 0 } } } } } });
                else if (!inStock && outStock)
                    andConditions.push({ variants: { none: { warehouseInventories: { some: { quantity: { gt: 0 } } } } } });
            } else if (key === "f_brand") {
                const vals = searchParams.getAll(key);
                if (vals.length)
                    andConditions.push({ brand: { name: { in: vals, mode: "insensitive" } } });
            } else if (key.startsWith("f_specs.")) {
                const vals = searchParams.getAll(key);
                if (vals.length)
                    andConditions.push({ specs: { some: { key: key.slice(8), value: { in: vals } } } });
            }
        }

        if (andConditions.length) where.AND = andConditions;

        // ── Filter options (optional) ─────────────────────────────────────────
        let filterOptions: { brands: string[]; specs: Record<string, string[]> } | undefined;
        if (searchParams.get("getFilters") === "true") {
            const [brandResults, specPairs] = await Promise.all([
                prisma.product.findMany({
                    where,
                    select: { brand: { select: { name: true } } },
                    distinct: ["brandId"],
                }),
                prisma.productSpec.findMany({
                    where: { product: where },
                    select: { key: true, value: true },
                    distinct: ["key", "value"],
                }),
            ]);

            const specsMap: Record<string, Set<string>> = {};
            for (const s of specPairs) {
                (specsMap[s.key] ??= new Set()).add(s.value);
            }

            filterOptions = {
                brands: brandResults.flatMap(p => p.brand?.name ? [p.brand.name] : []).sort(),
                specs: Object.fromEntries(
                    Object.entries(specsMap).map(([k, v]) => [k, [...v].sort()])
                ),
            };
        }

        // ── Sorting + pagination ──────────────────────────────────────────────
        const isPriceSort = sort === "price-asc" || sort === "price-desc";
        const productSelect = fields === "minimal" ? MINIMAL_SELECT : FULL_SELECT;
        const orderBy = sort === "name-desc" ? { name: "desc" as const } : { name: "asc" as const };

        let products: any[];
        let total: number;

        if (isPriceSort) {
            const allLightweight = await prisma.product.findMany({
                where,
                select: {
                    id: true,
                    variants: { select: { price: true }, orderBy: { price: "asc" as const }, take: 1 },
                },
            });

            total = allLightweight.length;

            allLightweight.sort((a, b) => {
                const diff = (a.variants[0]?.price ?? 0) - (b.variants[0]?.price ?? 0);
                return sort === "price-asc" ? diff : -diff;
            });

            const paginatedIds = allLightweight
                .slice((page - 1) * limit, page * limit)
                .map(p => p.id);

            products = await prisma.product.findMany({
                where: { id: { in: paginatedIds } },
                select: productSelect,
            });

            const idOrder = new Map(paginatedIds.map((id, i) => [id, i]));
            products.sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0));
        } else {
            [products, total] = await Promise.all([
                prisma.product.findMany({ where, select: productSelect, orderBy, skip: (page - 1) * limit, take: limit }),
                prisma.product.count({ where }),
            ]);
        }

        return NextResponse.json({ products, total, page, limit, filterOptions });
    } catch (error) {
        console.error("getProductsData error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── GET /api/products ────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    return getProductsData(new URL(req.url).searchParams);
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
                include: {
                    specs: true,
                    brand: true,
                    variants: {
                        include: {
                            warehouseInventories: true
                        }
                    },
                    media: true
                },
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
