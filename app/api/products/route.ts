import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const specSchema = z.object({
    specId: z.string().uuid(),
    optionId: z.string().uuid().optional().nullable(),
    valueString: z.string().optional().nullable(),
    valueNumber: z.number().optional().nullable(),
    valueBool: z.boolean().optional().nullable(),
});

const createProductSchema = z.object({
    sku: z.string().min(1),
    name: z.string().min(1),
    subCategoryId: z.string().uuid(),
    price: z.number().positive(),
    stock: z.number().int().min(0).default(0),
    images: z.array(z.string().min(1)).min(1),
    description: z.string().optional(),
    brandId: z.string().uuid().optional(),
    specs: z.array(specSchema).default([]),
    costPrice: z.number().min(0).default(0),
    reorderLevel: z.number().int().min(0).default(5),
    location: z.string().default(""), // Kept to avoid breaking older payloads
});

const toInt   = (v: string | null, fallback: number) => v ? (parseInt(v, 10) || fallback) : fallback;
const toFloat = (v: string | null) => v ? parseFloat(v) : undefined;

function buildTextOR(
    term: string,
    includeDescription = false,
    includeSKU = false,
) {
    const conditions: object[] = [
        { name: { contains: term, mode: "insensitive" } },
        { variants: { some: { variantSpecs: { some: { option: { value: { contains: term, mode: "insensitive" } } } } } } },
    ];
    if (includeSKU)
        conditions.push({ variants: { some: { sku: { contains: term, mode: "insensitive" } } } });
    if (includeDescription)
        conditions.push({ description: { contains: term, mode: "insensitive" } });
    return { OR: conditions };
}

const MINIMAL_SELECT = {
    id: true, slug: true, name: true, subCategoryId: true, status: true, createdAt: true,
    brand: { select: { id: true, name: true } },
    variants: {
        select: {
            id: true, sku: true, price: true, status: true,
            inventoryItems: { select: { quantityOnHand: true } },
        },
        take: 1,
    },
    media: { select: { url: true }, take: 1, orderBy: { sortOrder: "asc" as const } },
} as const;

const FULL_SELECT = {
    id: true, slug: true, name: true, subCategoryId: true, description: true,
    status: true, createdAt: true,
    brand:   { select: { id: true, name: true } },
    subCategory: { select: { id: true, name: true } },
    variants: {
        select: {
            id: true, sku: true, price: true, compareAtPrice: true,
            status: true, attributes: true,
            inventoryItems: {
                select: { id: true, trackingType: true, quantityOnHand: true, quantityReserved: true, status: true },
            },
            variantSpecs: {
                select: { 
                    id: true, specId: true, optionId: true, 
                    valueString: true, valueNumber: true, valueBool: true, 
                    spec: { select: { name: true, valueType: true } }, 
                    option: { select: { value: true, label: true } } 
                }
            }
        },
    },
    media: {
        select: { id: true, url: true, altText: true, sortOrder: true },
        orderBy: { sortOrder: "asc" as const },
        take: 4,
    },
} as const;

const POST_INCLUDE = {
    subCategory: true,
    brand: true,
    variants: { include: { inventoryItems: true, variantSpecs: true } },
    media: true,
} as const;

function buildWhereClause(searchParams: URLSearchParams) {
    const subCategoryId  = searchParams.get("subCategoryId");
    const category       = searchParams.get("category"); // Backwards compat fallback
    const filterCatId    = subCategoryId || category;
    
    const brandId      = searchParams.get("brandId");
    const minPrice     = searchParams.get("minPrice");
    const maxPrice     = searchParams.get("maxPrice");
    const globalSearch = searchParams.get("q");
    const sidebarSearch= searchParams.get("sq");
    const nodeQuery    = searchParams.get("nodeQuery");
    const nodeBrand    = searchParams.get("nodeBrand");

    const where: Record<string, unknown> = {};

    if (!globalSearch) {
        if (filterCatId)
            where.subCategoryId = filterCatId; // assumes UUID
        if (brandId)
            where.brandId = brandId;
    }

    const and: object[] = [];

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

    if (globalSearch)  and.push(buildTextOR(globalSearch.toLowerCase(),  true, true));
    if (sidebarSearch) and.push(buildTextOR(sidebarSearch.toLowerCase()));
    if (nodeQuery)     and.push(buildTextOR(nodeQuery.toLowerCase()));
    if (nodeBrand)
        and.push({ brand: { name: { equals: nodeBrand, mode: "insensitive" } } });

    for (const key of searchParams.keys()) {
        if (key === "f_stock_status") {
            const vals     = searchParams.getAll(key);
            const inStock  = vals.includes("In Stock");
            const outStock = vals.includes("Out of Stock");
            if (inStock && !outStock)
                and.push({ variants: { some: { inventoryItems: { some: { quantityOnHand: { gt: 0 } } } } } });
            else if (!inStock && outStock)
                and.push({ variants: { none: { inventoryItems: { some: { quantityOnHand: { gt: 0 } } } } } });
        } else if (key === "f_brand") {
            const vals = searchParams.getAll(key);
            if (vals.length)
                and.push({ brand: { name: { in: vals, mode: "insensitive" } } });
        } else if (key.startsWith("f_specs.")) {
            const vals = searchParams.getAll(key);
            if (vals.length)
                and.push({ variants: { some: { variantSpecs: { some: { specId: key.slice(8), optionId: { in: vals } } } } } });
        }
    }

    if (and.length) where.AND = and;
    return where;
}

async function resolveFilterOptions(where: Record<string, unknown>) {
    const [brandResults, specPairsFull] = await Promise.all([
        prisma.product.findMany({
            where,
            select: { brand: { select: { name: true } } },
            distinct: ["brandId"],
        }),
        prisma.variantSpec.findMany({
            where: { variant: { product: where } },
            select: { specId: true, optionId: true },
            distinct: ["specId", "optionId"],
        }),
    ]);

    const specsMap: Record<string, Set<string>> = {};
    for (const { specId, optionId } of specPairsFull) {
        if (optionId) {
            (specsMap[specId] ??= new Set()).add(optionId);
        }
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

async function fetchPriceSorted(
    where: Record<string, unknown>,
    sort: string,
    page: number,
    limit: number,
    productSelect: typeof MINIMAL_SELECT | typeof FULL_SELECT,
) {
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

    allLightweight.sort((a, b) => {
        const diff = Number(a.variants[0]?.price ?? 0) - Number(b.variants[0]?.price ?? 0);
        return sort === "price-asc" ? diff : -diff;
    });

    const paginatedIds = allLightweight
        .slice((page - 1) * limit, page * limit)
        .map(p => p.id);

    const products = await prisma.product.findMany({
        where: { id: { in: paginatedIds } },
        select: productSelect,
    });

    const idOrder = new Map(paginatedIds.map((id, i) => [id, i]));
    products.sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0));

    return { products, total };
}

export async function getProductsData(searchParams: URLSearchParams) {
    try {
        const sort   = searchParams.get("sort") ?? "popularity";
        const page   = Math.max(1, toInt(searchParams.get("page"),  1));
        const limit  = Math.min(toInt(searchParams.get("limit"), 50), 5000);
        const fields = searchParams.get("fields");

        const where          = buildWhereClause(searchParams);
        const productSelect  = fields === "minimal" ? MINIMAL_SELECT : FULL_SELECT;
        const isPriceSort    = sort === "price-asc" || sort === "price-desc";

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
            const orderBy = sort === "name-desc"
                ? { name: "desc" as const }
                : { name: "asc"  as const };

            [{ products, total }] = await Promise.all([
                prisma.product.findMany({
                    where,
                    select: productSelect,
                    orderBy,
                    skip:  (page - 1) * limit,
                    take:  limit,
                }).then(res => ({ products: res, total: 0 })),
                prisma.product.count({ where }),
            ]).then(async ([productsResult, countResult]) => {
                return [{ products: productsResult.products, total: countResult }];
            });
        }

        const filterOptions = await filterOptionsPromise;

        return NextResponse.json({ products, total, page, limit, filterOptions });
    } catch (error) {
        console.error("getProductsData error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    return getProductsData(new URL(req.url).searchParams);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const data = createProductSchema.parse(body);

        const existing = await prisma.productVariant.findUnique({
            where: { sku: data.sku },
            select: { id: true },
        });
        if (existing) {
            return NextResponse.json({ error: "SKU already exists" }, { status: 409 });
        }

        const product = await prisma.$transaction(
            async (tx) => {
                const variantSpecsCreate = data.specs.map(s => ({
                    specId: s.specId,
                    optionId: s.optionId ?? null,
                    valueString: s.valueString ?? null,
                    valueNumber: s.valueNumber ?? null,
                    valueBool: s.valueBool ?? null,
                }));

                const inventoryItemsCreate = [{
                    trackingType: "BULK" as const,
                    quantityOnHand: data.stock,
                    quantityReserved: 0,
                    status: "IN_STOCK" as const,
                    costPrice: data.costPrice,
                }];

                const p = await tx.product.create({
                    data: {
                        slug:        data.sku,
                        name:        data.name,
                        subCategoryId: data.subCategoryId,
                        description: data.description ?? null,
                        brandId:     data.brandId     ?? null,
                        media:  { create: data.images.map((url, i) => ({ url, sortOrder: i })) },
                        variants: {
                            create: [{ 
                                sku: data.sku, 
                                price: data.price, 
                                status: "IN_STOCK",
                                variantSpecs: { create: variantSpecsCreate },
                                inventoryItems: { create: inventoryItemsCreate },
                            }],
                        },
                    },
                    include: POST_INCLUDE,
                });

                return p;
            },
            { timeout: 10_000 }
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