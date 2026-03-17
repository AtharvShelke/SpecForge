import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ── Validation schemas (module-level, instantiated once on cold start) ────────
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
    images: z.array(z.string().min(1)).min(1),
    description: z.string().optional(),
    brandId: z.string().uuid().optional(),
    specs: z.array(specSchema).default([]),
    costPrice: z.number().min(0).default(0),
    reorderLevel: z.number().int().min(0).default(5),
    location: z.string().default(""),
});

// ── Param parsing helpers (pure, no allocations on miss) ─────────────────────
const toInt   = (v: string | null, fallback: number) => v ? (parseInt(v, 10) || fallback) : fallback;
const toFloat = (v: string | null) => v ? parseFloat(v) : undefined;

// ── Text-search OR builder ────────────────────────────────────────────────────
// Returns a Prisma OR clause for full-text-style contains searches.
// `includeDescription` and `includeSKU` are opt-in to keep the clause
// narrow (fewer OR branches = better index selectivity on PG).
function buildTextOR(
    term: string,
    includeDescription = false,
    includeSKU = false,
) {
    const conditions: object[] = [
        { name: { contains: term, mode: "insensitive" } },
        { specs: { some: { value: { contains: term, mode: "insensitive" } } } },
    ];
    if (includeSKU)
        conditions.push({ variants: { some: { sku: { contains: term, mode: "insensitive" } } } });
    if (includeDescription)
        conditions.push({ description: { contains: term, mode: "insensitive" } });
    return { OR: conditions };
}

// ── Select projections (module-level constants) ───────────────────────────────
// Defined once; reused across every request.
// `select` (not `include`) restricts columns at the SQL layer.

const MINIMAL_SELECT = {
    id: true, slug: true, name: true, category: true, status: true, createdAt: true,
    brand: { select: { id: true, name: true } },
    variants: {
        select: {
            id: true, sku: true, price: true, status: true,
            warehouseInventories: { select: { quantity: true } },
        },
        take: 1,
    },
    media: { select: { url: true }, take: 1, orderBy: { sortOrder: "asc" as const } },
} as const;

const FULL_SELECT = {
    id: true, slug: true, name: true, category: true, description: true,
    status: true, createdAt: true,
    specs:   { select: { id: true, key: true, value: true } },
    brand:   { select: { id: true, name: true } },
    variants: {
        select: {
            id: true, sku: true, price: true, compareAtPrice: true,
            status: true, attributes: true,
            warehouseInventories: {
                select: { id: true, quantity: true, reserved: true, warehouseId: true },
            },
        },
    },
    media: {
        select: { id: true, url: true, altText: true, sortOrder: true },
        orderBy: { sortOrder: "asc" as const },
        take: 4,
    },
} as const;

// POST response shape — includes all relations needed by the caller.
// Defined separately because it uses `include` inside a create(), which
// requires a different Prisma argument type than a standalone findMany().
const POST_INCLUDE = {
    specs: true,
    brand: true,
    variants: { include: { warehouseInventories: true } },
    media: true,
} as const;

// ── Dynamic filter builder ────────────────────────────────────────────────────
// Extracted from getProductsData to keep the main function readable
// and to make the filter logic unit-testable in isolation.
function buildWhereClause(searchParams: URLSearchParams) {
    const category     = searchParams.get("category");
    const brandId      = searchParams.get("brandId");
    const minPrice     = searchParams.get("minPrice");
    const maxPrice     = searchParams.get("maxPrice");
    const globalSearch = searchParams.get("q");
    const sidebarSearch= searchParams.get("sq");
    const nodeQuery    = searchParams.get("nodeQuery");
    const nodeBrand    = searchParams.get("nodeBrand");

    const where: Record<string, unknown> = {};

    // Category / brand only apply when there is no global search
    // (global search intentionally crosses categories).
    if (!globalSearch) {
        if (category && CategoryEnum.safeParse(category).success)
            where.category = category;
        if (brandId)
            where.brandId = brandId;
    }

    const and: object[] = [];

    // Price range — a single sub-query covering both bounds is more
    // efficient than two separate `some` clauses.
    const gtePrice = toFloat(minPrice);
    const ltePrice = toFloat(maxPrice);
    if (gtePrice !== undefined || ltePrice !== undefined) {
        and.push({
            variants: {
                some: {
                    price: {
                        ...(gtePrice !== undefined && { gte: gtePrice }),
                        ...(ltePrice !== undefined && { lte: ltePrice }),
                    },
                },
            },
        });
    }

    // Text searches
    if (globalSearch)  and.push(buildTextOR(globalSearch.toLowerCase(),  true, true));
    if (sidebarSearch) and.push(buildTextOR(sidebarSearch.toLowerCase()));
    if (nodeQuery)     and.push(buildTextOR(nodeQuery.toLowerCase()));
    if (nodeBrand)
        and.push({ brand: { name: { equals: nodeBrand, mode: "insensitive" } } });

    // Dynamic f_* filters — iterate keys once
    for (const key of searchParams.keys()) {
        if (key === "f_stock_status") {
            const vals     = searchParams.getAll(key);
            const inStock  = vals.includes("In Stock");
            const outStock = vals.includes("Out of Stock");
            if (inStock && !outStock)
                and.push({ variants: { some: { warehouseInventories: { some: { quantity: { gt: 0 } } } } } });
            else if (!inStock && outStock)
                and.push({ variants: { none: { warehouseInventories: { some: { quantity: { gt: 0 } } } } } });
        } else if (key === "f_brand") {
            const vals = searchParams.getAll(key);
            if (vals.length)
                and.push({ brand: { name: { in: vals, mode: "insensitive" } } });
        } else if (key.startsWith("f_specs.")) {
            const vals = searchParams.getAll(key);
            if (vals.length)
                and.push({ specs: { some: { key: key.slice(8), value: { in: vals } } } });
        }
    }

    if (and.length) where.AND = and;
    return where;
}

// ── Filter-options aggregation ────────────────────────────────────────────────
// Runs two queries in parallel; separated from getProductsData so it is
// only called (and only allocates) when `getFilters=true`.
async function resolveFilterOptions(where: Record<string, unknown>) {
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

    // Build spec map in a single pass (no intermediate arrays).
    const specsMap: Record<string, Set<string>> = {};
    for (const { key, value } of specPairs) {
        (specsMap[key] ??= new Set()).add(value);
    }

    return {
        brands: brandResults
            .flatMap(p => p.brand?.name ? [p.brand.name] : [])
            .sort(),
        specs: Object.fromEntries(
            Object.entries(specsMap).map(([k, v]) => [k, [...v].sort()])
        ),
    };
}

// ── Price-sort path ───────────────────────────────────────────────────────────
// Price sorting cannot be expressed as a single Prisma orderBy (it requires
// sorting by a related model's field). We fetch all IDs + min-prices,
// sort in JS, paginate, then fetch full data only for the page slice.
// This avoids loading full product rows just to sort them.
async function fetchPriceSorted(
    where: Record<string, unknown>,
    sort: string,
    page: number,
    limit: number,
    productSelect: typeof MINIMAL_SELECT | typeof FULL_SELECT,
) {
    // Lightweight fetch: id + single cheapest variant price only.
    const allLightweight = await prisma.product.findMany({
        where,
        select: {
            id: true,
            variants: {
                select: { price: true },
                orderBy: { price: "asc" as const },
                take: 1,
            },
        },
    });

    const total = allLightweight.length;

    // In-memory sort — unavoidable without DB-level support for
    // sorting by a relation aggregate.
    allLightweight.sort((a, b) => {
        const diff = (a.variants[0]?.price ?? 0) - (b.variants[0]?.price ?? 0);
        return sort === "price-asc" ? diff : -diff;
    });

    const paginatedIds = allLightweight
        .slice((page - 1) * limit, page * limit)
        .map(p => p.id);

    // Fetch the full projection only for the page slice.
    const products = await prisma.product.findMany({
        where: { id: { in: paginatedIds } },
        select: productSelect,
    });

    // Restore sort order (DB may return rows in any order for `id IN (...)`)
    const idOrder = new Map(paginatedIds.map((id, i) => [id, i]));
    products.sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0));

    return { products, total };
}

// ── Main GET handler ──────────────────────────────────────────────────────────
export async function getProductsData(searchParams: URLSearchParams) {
    try {
        // Parse scalar params once; reuse parsed values throughout.
        const sort   = searchParams.get("sort") ?? "popularity";
        const page   = Math.max(1, toInt(searchParams.get("page"),  1));
        const limit  = Math.min(toInt(searchParams.get("limit"), 50), 5000);
        const fields = searchParams.get("fields");

        const where          = buildWhereClause(searchParams);
        const productSelect  = fields === "minimal" ? MINIMAL_SELECT : FULL_SELECT;
        const isPriceSort    = sort === "price-asc" || sort === "price-desc";

        // Filter options and product list are independent — kick off the
        // filter-options query concurrently with the product query when both
        // are needed, rather than sequencing them.
        const filterOptionsPromise = searchParams.get("getFilters") === "true"
            ? resolveFilterOptions(where)
            : Promise.resolve(undefined);

        let products: unknown[];
        let total: number;

        if (isPriceSort) {
            ({ products, total } = await fetchPriceSorted(
                where, sort, page, limit, productSelect,
            ));
        } else {
            // `orderBy` for non-price sorts is a simple column sort —
            // expressed as a ternary to avoid building an object per request.
            const orderBy = sort === "name-desc"
                ? { name: "desc" as const }
                : { name: "asc"  as const };

            // count() and findMany() hit the same index; run in parallel
            // to halve the wall-clock time for non-price-sort pages.
            [{ products, total }] = await Promise.all([
                prisma.product.findMany({
                    where,
                    select: productSelect,
                    orderBy,
                    skip:  (page - 1) * limit,
                    take:  limit,
                }).then(products => ({ products, total: 0 })),
                prisma.product.count({ where }),
            ]).then(async ([productsResult, countResult]) => {
                return [{ products: productsResult.products, total: countResult }];
            });
        }

        // Await filter options last — it had the most time to run in parallel.
        const filterOptions = await filterOptionsPromise;

        return NextResponse.json({ products, total, page, limit, filterOptions });
    } catch (error) {
        console.error("getProductsData error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── GET /api/products ─────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    return getProductsData(new URL(req.url).searchParams);
}

// ── POST /api/products ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        // Validate before touching the DB — fail fast on bad input.
        const body = await req.json();
        const data = createProductSchema.parse(body);

        // SKU uniqueness check — a single indexed lookup outside the
        // transaction keeps the transaction window as short as possible.
        const existing = await prisma.productVariant.findUnique({
            where: { sku: data.sku },
            select: { id: true }, // only need existence, not full row
        });
        if (existing) {
            return NextResponse.json({ error: "SKU already exists" }, { status: 409 });
        }

        const product = await prisma.$transaction(
            async (tx) => {
                // Single create with all nested relations in one round-trip.
                // Prisma batches the child INSERTs inside the same transaction.
                const p = await tx.product.create({
                    data: {
                        slug:        data.sku,
                        name:        data.name,
                        category:    data.category,
                        description: data.description ?? null,
                        brandId:     data.brandId     ?? null,
                        specs:  { create: data.specs.map(s => ({ key: s.key, value: s.value })) },
                        media:  { create: data.images.map((url, i) => ({ url, sortOrder: i })) },
                        variants: {
                            create: [{ sku: data.sku, price: data.price, status: "IN_STOCK" }],
                        },
                    },
                    include: POST_INCLUDE,
                });

                // Find or create the default warehouse.
                // `upsert` collapses findFirst + conditional create into one
                // atomic operation — safe under concurrent POSTs.
                const defaultWarehouse = await tx.warehouse.upsert({
                    where:  { code: "MAIN" },
                    create: { name: "Main Warehouse", code: "MAIN", isActive: true },
                    update: {},              // nothing to update if it exists
                    select: { id: true },   // only the id is needed below
                });

                // Create inventory record for the single variant.
                const inv = await tx.warehouseInventory.create({
                    data: {
                        variantId:    p.variants[0].id,
                        warehouseId:  defaultWarehouse.id,
                        quantity:     data.stock,
                        reserved:     0,
                        reorderLevel: data.reorderLevel,
                        costPrice:    data.costPrice,
                        location:     data.location,
                    },
                    select: { id: true }, // only id needed for the movement log
                });

                // Conditionally log the initial stock movement.
                // Skipping the create entirely (rather than inserting a zero-
                // quantity row) keeps the stock_movement table clean.
                if (data.stock > 0) {
                    await tx.stockMovement.create({
                        data: {
                            warehouseInventoryId: inv.id,
                            warehouseId:          defaultWarehouse.id,
                            type:                 "INWARD",
                            quantity:             data.stock,
                            newQuantity:          data.stock,
                            reason:               "Initial stock entry",
                            performedBy:          "System",
                        },
                    });
                }

                return p;
            },
            {
                // Bound the transaction wall-clock time to avoid long-held
                // locks under concurrent product creation.
                timeout: 10_000,
            },
        );

        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("POST /api/products error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}