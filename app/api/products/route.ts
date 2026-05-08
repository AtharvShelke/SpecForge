import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const specSchema = z.object({
    key: z.string().min(1),
    value: z.string().min(1),
});

const createProductSchema = z.object({
    sku: z.string().min(1),
    name: z.string().min(1),
    category: z.string().min(1),
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

const toInt = (value: string | null, fallback: number) => value ? (parseInt(value, 10) || fallback) : fallback;
const toFloat = (value: string | null) => value ? parseFloat(value) : undefined;

function normalizeIdentifier(value: string | null | undefined) {
    return (value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function slugify(value: string) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

async function loadCategoryMetadata() {
    const [definitions, categories] = await Promise.all([
        prisma.categoryDefinition.findMany({
            where: { isActive: true },
            select: { code: true, label: true, shortLabel: true },
        }),
        prisma.category.findMany({
            select: { id: true, name: true, slug: true },
        }),
    ]);

    const codeByCategoryId = new Map<number, string>();
    const categoryIdsByKey = new Map<string, number[]>();

    for (const category of categories) {
        const categoryKeys = new Set([
            normalizeIdentifier(category.name),
            normalizeIdentifier(category.slug),
        ]);

        const definition = definitions.find((item) => {
            const definitionKeys = [
                normalizeIdentifier(item.label),
                normalizeIdentifier(item.shortLabel),
                normalizeIdentifier(item.code),
                normalizeIdentifier(slugify(item.label)),
            ].filter(Boolean);

            return definitionKeys.some((key) => categoryKeys.has(key));
        });

        if (definition) {
            codeByCategoryId.set(category.id, definition.code);

            for (const key of [
                normalizeIdentifier(definition.code),
                normalizeIdentifier(definition.label),
                normalizeIdentifier(definition.shortLabel),
                normalizeIdentifier(category.name),
                normalizeIdentifier(category.slug),
            ]) {
                if (!key) continue;
                categoryIdsByKey.set(key, [...(categoryIdsByKey.get(key) ?? []), category.id]);
            }
        } else {
            for (const key of [normalizeIdentifier(category.name), normalizeIdentifier(category.slug)]) {
                if (!key) continue;
                categoryIdsByKey.set(key, [...(categoryIdsByKey.get(key) ?? []), category.id]);
            }
        }
    }

    return {
        codeByCategoryId,
        resolveCategoryIds(inputs: string[]) {
            const ids = new Set<number>();
            for (const input of inputs) {
                const key = normalizeIdentifier(input);
                for (const id of categoryIdsByKey.get(key) ?? []) {
                    ids.add(id);
                }
            }
            return [...ids];
        },
    };
}

const BASE_PRODUCT_INCLUDE = {
    category: {
        select: {
            id: true,
            name: true,
            slug: true,
        },
    },
    brand: {
        select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true,
        },
    },
    variants: {
        select: {
            id: true,
            productId: true,
            sku: true,
            price: true,
            compareAtPrice: true,
            attributes: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            inventoryItems: {
                select: {
                    id: true,
                    variantId: true,
                    quantity: true,
                    reserved: true,
                    reorderLevel: true,
                    costPrice: true,
                    location: true,
                    lastUpdated: true,
                },
            },
        },
    },
    media: {
        select: {
            id: true,
            productId: true,
            url: true,
            altText: true,
            sortOrder: true,
        },
        orderBy: { sortOrder: "asc" as const },
    },
} as const;

const FULL_PRODUCT_INCLUDE = {
    ...BASE_PRODUCT_INCLUDE,
    tags: true,
    specs: {
        select: {
            id: true,
            productId: true,
            value: true,
            isHighlighted: true,
            filterValue: {
                select: {
                    id: true,
                    value: true,
                    filterDefinition: {
                        select: {
                            key: true,
                        },
                    },
                },
            },
        },
    },
} as const;

function mapProduct(product: any, codeByCategoryId: Map<number, string>) {
    return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        metaTitle: product.metaTitle ?? undefined,
        metaDescription: product.metaDescription ?? undefined,
        category: product.category ?? undefined,
        description: product.description ?? undefined,
        status: product.status,
        deletedAt: product.deletedAt ?? undefined,
        version: product.version,
        brandId: product.brandId ?? undefined,
        brand: product.brand ?? undefined,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        specs: (product.specs ?? []).map((spec: any) => ({
            id: spec.id,
            productId: spec.productId,
            key: spec.filterValue?.filterDefinition?.key ?? "",
            value: spec.value,
            isHighlighted: spec.isHighlighted,
        })),
        variants: product.variants.map((variant: any) => ({
            id: variant.id,
            productId: variant.productId,
            sku: variant.sku,
            price: variant.price,
            compareAtPrice: variant.compareAtPrice ?? undefined,
            attributes: variant.attributes ?? undefined,
            status: variant.status,
            createdAt: variant.createdAt,
            updatedAt: variant.updatedAt,
            warehouseInventories: variant.inventoryItems.map((item: any) => ({
                id: item.id,
                variantId: item.variantId,
                quantity: item.quantity,
                reserved: item.reserved,
                reorderLevel: item.reorderLevel,
                costPrice: item.costPrice,
                location: item.location,
                lastUpdated: item.lastUpdated,
            })),
        })),
        media: product.media,
        tags: product.tags ?? [],
    };
}

function buildTextOR(term: string) {
    return {
        OR: [
            { name: { contains: term, mode: "insensitive" as const } },
            { specs: { some: { value: { contains: term, mode: "insensitive" as const } } } },
            { variants: { some: { sku: { contains: term, mode: "insensitive" as const } } } },
            { description: { contains: term, mode: "insensitive" as const } },
        ],
    };
}

function buildWhereClause(
    searchParams: URLSearchParams,
    categoryIdsForFilter: number[]
) {
    const brandId = searchParams.get("brandId");
    const minPrice = toFloat(searchParams.get("minPrice"));
    const maxPrice = toFloat(searchParams.get("maxPrice"));
    const globalSearch = searchParams.get("q");
    const sidebarSearch = searchParams.get("sq");
    const nodeQuery = searchParams.get("nodeQuery");
    const nodeBrand = searchParams.get("nodeBrand");

    const where: Record<string, unknown> = {};
    const and: object[] = [];

    if (!globalSearch && categoryIdsForFilter.length > 0) {
        where.categoryId = categoryIdsForFilter.length === 1
            ? categoryIdsForFilter[0]
            : { in: categoryIdsForFilter };
    }

    if (brandId) {
        where.brandId = brandId;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
        and.push({
            variants: {
                some: {
                    price: {
                        ...(minPrice !== undefined ? { gte: minPrice } : {}),
                        ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
                    },
                },
            },
        });
    }

    if (globalSearch) and.push(buildTextOR(globalSearch.toLowerCase()));
    if (sidebarSearch) and.push(buildTextOR(sidebarSearch.toLowerCase()));
    if (nodeQuery) and.push(buildTextOR(nodeQuery.toLowerCase()));
    if (nodeBrand) {
        and.push({ brand: { name: { equals: nodeBrand, mode: "insensitive" as const } } });
    }

    for (const key of searchParams.keys()) {
        if (key === "f_stock_status") {
            const values = searchParams.getAll(key);
            const inStock = values.includes("In Stock");
            const outOfStock = values.includes("Out of Stock");

            if (inStock && !outOfStock) {
                and.push({ variants: { some: { inventoryItems: { some: { quantity: { gt: 0 } } } } } });
            } else if (!inStock && outOfStock) {
                and.push({ variants: { none: { inventoryItems: { some: { quantity: { gt: 0 } } } } } });
            }
        } else if (key === "f_brand") {
            const values = searchParams.getAll(key);
            if (values.length) {
                and.push({ brand: { name: { in: values, mode: "insensitive" as const } } });
            }
        } else if (key.startsWith("f_specs.")) {
            const values = searchParams.getAll(key);
            if (values.length) {
                and.push({
                    specs: {
                        some: {
                            filterValue: {
                                filterDefinition: {
                                    key: key.slice(8),
                                },
                            },
                            value: { in: values },
                        },
                    },
                });
            }
        }
    }

    if (and.length) {
        where.AND = and;
    }

    return where;
}

async function resolveFilterOptions(where: Record<string, unknown>, categoryCode: string | null) {
    const [brandResults, specResults, filterConfig] = await Promise.all([
        prisma.product.findMany({
            where,
            select: { brand: { select: { name: true } } },
            distinct: ["brandId"],
        }),
        prisma.productSpec.findMany({
            where: { product: where },
            select: {
                value: true,
                filterValue: {
                    select: {
                        id: true,
                        slug: true,
                        value: true,
                        filterDefinition: {
                            select: {
                                id: true,
                                key: true,
                                label: true,
                                type: true,
                                options: true,
                                min: true,
                                max: true,
                            },
                        },
                    },
                },
            },
        }),
        categoryCode
            ? prisma.categoryFilterConfig.findFirst({
                where: {
                    categoryDefinition: {
                        code: categoryCode,
                    },
                },
                include: {
                    filters: {
                        orderBy: { sortOrder: 'asc' },
                    },
                },
            })
            : null,
    ]);

    const specs: Record<string, Set<string>> = {};
    const specMetadata: Record<string, any> = {};
    
    for (const spec of specResults) {
        const key = spec.filterValue?.filterDefinition?.key;
        if (!key) continue;
        (specs[key] ??= new Set()).add(spec.value);
        
        // Store metadata for each spec key
        if (!specMetadata[key]) {
            specMetadata[key] = {
                ...spec.filterValue.filterDefinition,
                availableValues: [],
            };
        }
    }

    // Populate available values from filter config
    if (filterConfig) {
        for (const filter of filterConfig.filters) {
            if (filter.type === 'dropdown' || filter.type === 'checkbox') {
                const values = await prisma.filterValue.findMany({
                    where: {
                        filterDefinitionId: filter.id,
                    },
                    select: {
                        value: true,
                        slug: true,
                    },
                    orderBy: { displayOrder: 'asc' },
                });
                
                if (specMetadata[filter.key]) {
                    specMetadata[filter.key].availableValues = values;
                    specMetadata[filter.key].config = filter;
                }
            }
        }
    }

    return {
        brands: brandResults.flatMap((item) => item.brand?.name ? [item.brand.name] : []).sort(),
        specs: Object.fromEntries(
            Object.entries(specs).map(([key, values]) => [key, [...values].sort()])
        ),
        specMetadata,
        filterConfig: filterConfig
            ? {
                id: filterConfig.id,
                categoryCode,
                filters: filterConfig.filters,
            }
            : null,
    };
}

async function fetchPriceSorted(
    where: Record<string, unknown>,
    sort: string,
    page: number,
    limit: number,
    fields: string | null,
    codeByCategoryId: Map<number, string>
) {
    const lightweight = await prisma.product.findMany({
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

    lightweight.sort((a, b) => {
        const diff = (a.variants[0]?.price ?? 0) - (b.variants[0]?.price ?? 0);
        return sort === "price-asc" ? diff : -diff;
    });

    const paginatedIds = lightweight
        .slice((page - 1) * limit, page * limit)
        .map((product) => product.id);

    const products = await prisma.product.findMany({
        where: { id: { in: paginatedIds } },
        include: fields === "minimal" ? BASE_PRODUCT_INCLUDE : FULL_PRODUCT_INCLUDE,
    });

    const order = new Map(paginatedIds.map((id, index) => [id, index]));
    return {
        products: products
            .map((product) => mapProduct(product, codeByCategoryId))
            .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)),
        total: lightweight.length,
    };
}

export async function getProductsData(searchParams: URLSearchParams) {
    try {
        const sort = searchParams.get("sort") ?? "name-asc";
        const page = Math.max(1, toInt(searchParams.get("page"), 1));
        const limit = Math.min(toInt(searchParams.get("limit"), 50), 5000);
        const fields = searchParams.get("fields");
        const categoryParam = searchParams.get("category");

        const { codeByCategoryId, resolveCategoryIds } = await loadCategoryMetadata();
        const categoryIdsForFilter = categoryParam ? resolveCategoryIds([categoryParam]) : [];
        const where = buildWhereClause(searchParams, categoryIdsForFilter);
        const filterOptionsPromise = searchParams.get("getFilters") === "true"
            ? resolveFilterOptions(where, categoryParam)
            : Promise.resolve(undefined);

        let products: any[] = [];
        let total = 0;

        if (sort === "price-asc" || sort === "price-desc") {
            ({ products, total } = await fetchPriceSorted(where, sort, page, limit, fields, codeByCategoryId));
        } else {
            const orderBy = sort === "name-desc"
                ? { name: "desc" as const }
                : { name: "asc" as const };

            const [rows, count] = await Promise.all([
                prisma.product.findMany({
                    where,
                    include: fields === "minimal" ? BASE_PRODUCT_INCLUDE : FULL_PRODUCT_INCLUDE,
                    orderBy,
                    skip: (page - 1) * limit,
                    take: limit,
                }),
                prisma.product.count({ where }),
            ]);

            products = rows.map((product) => mapProduct(product, codeByCategoryId));
            total = count;
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

        const { codeByCategoryId, resolveCategoryIds } = await loadCategoryMetadata();
        const categoryIds = resolveCategoryIds([data.category]);
        const categoryId = categoryIds[0];

        if (!categoryId) {
            return NextResponse.json({ error: "Invalid category" }, { status: 400 });
        }

        const existing = await prisma.productVariant.findUnique({
            where: { sku: data.sku },
            select: { id: true },
        });

        if (existing) {
            return NextResponse.json({ error: "SKU already exists" }, { status: 409 });
        }

        const product = await prisma.$transaction(async (tx) => {
            const created = await tx.product.create({
                data: {
                    slug: data.sku,
                    name: data.name,
                    description: data.description ?? null,
                    categoryId,
                    brandId: data.brandId ?? null,
                    media: {
                        create: data.images.map((url, index) => ({
                            url,
                            sortOrder: index,
                        })),
                    },
                    variants: {
                        create: [{
                            sku: data.sku,
                            price: data.price,
                            status: "IN_STOCK",
                        }],
                    },
                },
                include: FULL_PRODUCT_INCLUDE,
            });

            const variantId = created.variants[0]?.id;
            if (variantId) {
                await tx.inventoryItem.create({
                    data: {
                        variantId,
                        quantity: data.stock,
                        reserved: 0,
                        reorderLevel: data.reorderLevel,
                        costPrice: data.costPrice,
                        location: data.location,
                    },
                });

                if (data.stock > 0) {
                    await tx.stockMovement.create({
                        data: {
                            variantId,
                            type: "INWARD",
                            quantity: data.stock,
                            note: "Initial stock entry",
                        },
                    });
                }
            }

            // Validate specs against category schema
            const categoryDef = await tx.categoryDefinition.findFirst({
                where: {
                    categories: {
                        some: { id: categoryId },
                    },
                },
                include: {
                    categorySchema: {
                        include: {
                            attributes: true,
                        },
                    },
                },
            });

            if (categoryDef?.categorySchema) {
                const schemaAttrs = new Map(
                    categoryDef.categorySchema.attributes.map((attr) => [attr.key, attr])
                );

                for (const spec of data.specs) {
                    const attrDef = schemaAttrs.get(spec.key);
                    if (!attrDef) {
                        throw new Error(`Unknown specification key for category: ${spec.key}`);
                    }

                    // Validate against options if provided
                    if (attrDef.options && attrDef.options.length > 0) {
                        if (!attrDef.options.includes(spec.value)) {
                            throw new Error(
                                `Invalid value for ${spec.key}. Allowed values: ${attrDef.options.join(', ')}`
                            );
                        }
                    }
                }
            }

            for (const spec of data.specs) {
                const filterDefinition = await tx.filterDefinition.findFirst({
                    where: { key: spec.key },
                    select: { id: true },
                });

                if (!filterDefinition) {
                    throw new Error(`Unknown specification key: ${spec.key}`);
                }

                const filterValue = await tx.filterValue.upsert({
                    where: {
                        filterDefinitionId_slug: {
                            filterDefinitionId: filterDefinition.id,
                            slug: slugify(spec.value),
                        },
                    },
                    update: { value: spec.value },
                    create: {
                        filterDefinitionId: filterDefinition.id,
                        value: spec.value,
                        slug: slugify(spec.value),
                    },
                    select: { id: true },
                });

                await tx.productSpec.create({
                    data: {
                        productId: created.id,
                        filterValueId: filterValue.id,
                        value: spec.value,
                    },
                });

                await tx.productFilterValue.upsert({
                    where: {
                        productId_filterValueId: {
                            productId: created.id,
                            filterValueId: filterValue.id,
                        },
                    },
                    update: {},
                    create: {
                        productId: created.id,
                        filterValueId: filterValue.id,
                    },
                });
            }

            return tx.product.findUniqueOrThrow({
                where: { id: created.id },
                include: FULL_PRODUCT_INCLUDE,
            });
        });

        return NextResponse.json(mapProduct(product, codeByCategoryId), { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }

        console.error("POST /api/products error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
