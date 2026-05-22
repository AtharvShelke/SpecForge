import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createInventoryUnits } from "@/lib/services/inventory";
import { handleApiError, jsonError } from "@/lib/security/errors";
import { enforceRateLimit, withRateLimitHeaders } from "@/lib/security/rate-limit";
import { assertTrustedOrigin } from "@/lib/security/request";
import {
    baseProductInclude,
    buildProductsResponse,
    fullProductInclude,
    mapProduct,
    type ProductBaseRow,
    type ProductRow,
} from "@/lib/contracts/server-mappers";

const specSchema = z.object({
    key: z.string().min(1),
    value: z.string().min(1),
});

const inventoryUnitSchema = z.object({
    partNumber: z.string().min(1),
    serialNumber: z.string().min(1),
    costPrice: z.number().min(0).optional(),
    location: z.string().optional(),
    reorderLevel: z.number().int().min(0).optional(),
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
    inventoryUnits: z.array(inventoryUnitSchema).default([]),
});

const productIdsSchema = z.object({
    ids: z.array(z.string().min(1)).min(1).max(100),
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
    const categories = await prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, code: true, name: true, slug: true, shortLabel: true },
    });

    const codeByCategoryId = new Map<number, string>();
    const categoryIdsByKey = new Map<string, number[]>();

    for (const category of categories) {
        const categoryKeys = new Set([
            normalizeIdentifier(category.code),
            normalizeIdentifier(category.name),
            normalizeIdentifier(category.slug),
            normalizeIdentifier(category.shortLabel),
        ]);

        codeByCategoryId.set(category.id, category.code);

        for (const key of [...categoryKeys, normalizeIdentifier(slugify(category.name))]) {
            if (!key) continue;
            categoryIdsByKey.set(key, [...(categoryIdsByKey.get(key) ?? []), category.id]);
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

function buildTextOR(term: string) {
    return {
        OR: [
            { name: { contains: term, mode: "insensitive" as const } },
            { specs: { some: { value: { contains: term, mode: "insensitive" as const } } } },
            { sku: { contains: term, mode: "insensitive" as const } },
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
    const subcategoryParam = searchParams.get("subcategory");

    const where: Prisma.ProductWhereInput = {};
    const and: Prisma.ProductWhereInput[] = [];

    if (!globalSearch && categoryIdsForFilter.length > 0) {
        where.categoryId = categoryIdsForFilter.length === 1
            ? categoryIdsForFilter[0]
            : { in: categoryIdsForFilter };
    }

    if (subcategoryParam) {
        const isId = /^\d+$/.test(subcategoryParam);
        if (isId) {
            where.subcategoryId = Number(subcategoryParam);
        } else {
            where.subcategory = {
                is: {
                    slug: subcategoryParam,
                },
            };
        }
    }

    if (brandId) {
        where.brandId = brandId;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {
            ...(minPrice !== undefined ? { gte: minPrice } : {}),
            ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
        };
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
                where.stockStatus = "IN_STOCK";
            } else if (!inStock && outOfStock) {
                where.stockStatus = "OUT_OF_STOCK";
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
                            attribute: {
                                key: key.slice(8),
                            },
                            value: { in: values },
                        },
                    },
                });
            }
        } else if (key.startsWith("f_")) {
            const values = searchParams.getAll(key);
            const attributeKey = key.slice(2);
            if (values.length && attributeKey) {
                and.push({
                    specs: {
                        some: {
                            attribute: {
                                key: attributeKey,
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

async function resolveFilterOptions(
    where: Prisma.ProductWhereInput,
    categoryCode: string | null,
    subcategoryCode: string | null
) {
    const [brandResults, specResults, category] = await Promise.all([
        prisma.product.findMany({
            where,
            select: { brand: { select: { name: true } } },
            distinct: ["brandId"],
        }),
        prisma.productSpec.findMany({
            where: { product: where },
            select: {
                value: true,
                valueNumber: true,
                attribute: {
                    select: {
                        id: true,
                        key: true,
                        label: true,
                        type: true,
                        filterType: true,
                        unit: true,
                    },
                },
            },
        }),
        categoryCode
            ? prisma.category.findFirst({
                where: {
                    OR: [
                        { code: categoryCode },
                        { slug: categoryCode },
                        { name: { equals: categoryCode, mode: 'insensitive' } }
                    ]
                },
                include: {
                    attributes: {
                        where: { isFilterable: true },
                        include: {
                            dependencyAttribute: { select: { key: true } },
                            dependencyOption: { select: { value: true } },
                            options: { select: { value: true, slug: true }, orderBy: { sortOrder: 'asc' } },
                        },
                        orderBy: { sortOrder: 'asc' },
                    },
                    subcategories: subcategoryCode ? {
                        where: {
                            OR: [
                                { slug: subcategoryCode },
                                { name: { equals: subcategoryCode, mode: 'insensitive' } }
                            ]
                        },
                        include: {
                            attributes: {
                                where: { isFilterable: true },
                                include: {
                                    dependencyAttribute: { select: { key: true } },
                                    dependencyOption: { select: { value: true } },
                                    options: { select: { value: true, slug: true }, orderBy: { sortOrder: 'asc' } },
                                },
                                orderBy: { sortOrder: 'asc' },
                            }
                        }
                    } : false
                },
            })
            : null,
    ]);

    const specs: Record<string, Set<string>> = {};
    const specMetadata: Record<string, {
        id?: string;
        key?: string;
        label?: string;
        type?: string;
        filterType?: string | null;
        unit?: string | null;
        availableValues: Array<{ value: string; slug: string }>;
        config?: {
            id: string;
            key: string;
            label: string;
            type: string;
            sortOrder: number;
            dependencyKey: string | null;
            dependencyValue: string | null;
        };
    }> = {};
    
    for (const spec of specResults) {
        const key = spec.attribute?.key;
        if (!key) continue;
        (specs[key] ??= new Set()).add(spec.value);
        
        // Store metadata for each spec key
        if (!specMetadata[key]) {
            specMetadata[key] = {
                ...spec.attribute,
                availableValues: [],
            };
        }
    }

    if (category) {
        let attributes = category.attributes;
        const subcategory = category.subcategories?.[0];
        
        if (
            subcategory &&
            'attributes' in subcategory &&
            Array.isArray(subcategory.attributes) &&
            subcategory.attributes.length > 0
        ) {
            const subAttrKeys = new Set(subcategory.attributes.map((attribute) => attribute.key));
            attributes = [
                ...category.attributes.filter((attribute) => !subAttrKeys.has(attribute.key)),
                ...subcategory.attributes
            ];
        }

        for (const attribute of attributes) {
            if (specMetadata[attribute.key]) {
                specMetadata[attribute.key].availableValues = attribute.options;
                specMetadata[attribute.key].config = {
                    id: attribute.id,
                    key: attribute.key,
                    label: attribute.label,
                    type: attribute.filterType ?? (attribute.type === 'number' ? 'range' : attribute.type === 'boolean' ? 'boolean' : 'dropdown'),
                    sortOrder: attribute.sortOrder,
                    dependencyKey: attribute.dependencyAttribute?.key ?? null,
                    dependencyValue: attribute.dependencyOption?.value ?? null,
                };
            }
        }
    }

    return {
        brands: brandResults.flatMap((item) => item.brand?.name ? [item.brand.name] : []).sort(),
        specs: Object.fromEntries(
            Object.entries(specs).map(([key, values]) => [key, [...values].sort()])
        ),
        specMetadata,
    };
}

async function fetchPriceSorted(
    where: Prisma.ProductWhereInput,
    sort: string,
    page: number,
    limit: number,
    fields: string | null,
) {
    const products = await prisma.product.findMany({
        where,
        orderBy: { price: sort === "price-asc" ? "asc" as const : "desc" as const },
        include: fields === "minimal" ? baseProductInclude : fullProductInclude,
        skip: (page - 1) * limit,
        take: limit,
    });

    const total = await prisma.product.count({ where });

    return {
        products,
        total,
    };
}

export async function getProductsData(searchParams: URLSearchParams) {
    try {
        const sort = searchParams.get("sort") ?? "name-asc";
        const page = Math.max(1, toInt(searchParams.get("page"), 1));
        const limit = Math.min(toInt(searchParams.get("limit"), 50), 5000);
        const fields = searchParams.get("fields");
        const categoryParam = searchParams.get("category");
        const subcategoryParam = searchParams.get("subcategory");

        const { resolveCategoryIds } = await loadCategoryMetadata();
        const categoryIdsForFilter = categoryParam ? resolveCategoryIds([categoryParam]) : [];
        const where = buildWhereClause(searchParams, categoryIdsForFilter);
        const filterOptionsPromise = searchParams.get("getFilters") === "true"
            ? resolveFilterOptions(where, categoryParam, subcategoryParam)
            : Promise.resolve(undefined);

        let products: Array<ProductRow | ProductBaseRow> = [];
        let total = 0;

        if (sort === "price-asc" || sort === "price-desc") {
            ({ products, total } = await fetchPriceSorted(where, sort, page, limit, fields));
        } else {
            const orderBy = sort === "name-desc"
                ? { name: "desc" as const }
                : { name: "asc" as const };

            const [rows, count] = await Promise.all([
                prisma.product.findMany({
                    where,
                    include: fields === "minimal" ? baseProductInclude : fullProductInclude,
                    orderBy,
                    skip: (page - 1) * limit,
                    take: limit,
                }),
                prisma.product.count({ where }),
            ]);

            products = rows;
            total = count;
        }

        const filterOptions = await filterOptionsPromise;
        return NextResponse.json(
            buildProductsResponse(products, total, page, limit, filterOptions)
        );
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
        
        // Handle fetching products by IDs for share functionality
        const idsPayload = productIdsSchema.safeParse(body);
        if (idsPayload.success) {
            const products = await prisma.product.findMany({
                where: {
                    id: { in: idsPayload.data.ids },
                    deletedAt: null,
                },
                include: fullProductInclude,
            });
            
            return NextResponse.json({ 
                products: products.map(mapProduct)
            });
        }

        const user = await requireAdmin(req);
        assertTrustedOrigin(req);
        const rateLimit = enforceRateLimit(req, "adminAction", user.id);
        
        const data = createProductSchema.parse(body);

        const { resolveCategoryIds } = await loadCategoryMetadata();
        const categoryIds = resolveCategoryIds([data.category]);
        const categoryId = categoryIds[0];

        if (!categoryId) {
            return withRateLimitHeaders(
                jsonError(400, "Invalid category", "INVALID_CATEGORY"),
                rateLimit
            );
        }

        const existing = await prisma.product.findUnique({
            where: { sku: data.sku },
            select: { id: true },
        });

        if (existing) {
            return withRateLimitHeaders(
                jsonError(409, "SKU already exists", "SKU_EXISTS"),
                rateLimit
            );
        }

        if (data.stock > 0 && data.inventoryUnits.length !== data.stock) {
            return withRateLimitHeaders(
                jsonError(400, "Initial stock must match the number of unit records provided.", "INVALID_INITIAL_STOCK"),
                rateLimit
            );
        }

        const product = await prisma.$transaction(async (tx) => {
            const created = await tx.product.create({
                data: {
                    slug: data.sku,
                    name: data.name,
                    sku: data.sku,
                    price: data.price,
                    stockStatus: data.inventoryUnits.length > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
                    description: data.description ?? null,
                    categoryId,
                    brandId: data.brandId ?? null,
                    media: {
                        create: data.images.map((url, index) => ({
                            url,
                            sortOrder: index,
                        })),
                    },
                },
                include: fullProductInclude,
            });

            await createInventoryUnits(
                tx,
                created.id,
                data.inventoryUnits.map((unit) => ({
                    partNumber: unit.partNumber,
                    serialNumber: unit.serialNumber,
                    costPrice: unit.costPrice ?? data.costPrice,
                    location: unit.location ?? data.location,
                    reorderLevel: unit.reorderLevel ?? data.reorderLevel,
                })),
                "Initial stock entry",
            );

            const categoryAttributes = await tx.categoryAttribute.findMany({
                where: { categoryId },
                include: {
                    options: true,
                },
            });

            const schemaAttrs = new Map(categoryAttributes.map((attr) => [attr.key, attr]));

            for (const spec of data.specs) {
                const attrDef = schemaAttrs.get(spec.key);
                if (!attrDef) {
                    throw new Error(`Unknown specification key for category: ${spec.key}`);
                }

                const normalizedValue = spec.value.trim();
                const matchedOption = attrDef.options.find((option) => option.value === normalizedValue) ?? null;

                if ((attrDef.type === 'select' || attrDef.type === 'multi_select') && !matchedOption) {
                    throw new Error(`Invalid value for ${spec.key}. Admin must define this option before assigning it to products.`);
                }

                await tx.productSpec.create({
                    data: {
                        productId: created.id,
                        attributeId: attrDef.id,
                        optionId: matchedOption?.id ?? null,
                        value: normalizedValue,
                        valueNumber: attrDef.type === 'number' ? Number(normalizedValue) : null,
                        valueBoolean: attrDef.type === 'boolean' ? normalizedValue.toLowerCase() === 'true' : null,
                    },
                });
            }

            return tx.product.findUniqueOrThrow({
                where: { id: created.id },
                include: fullProductInclude,
            });
        });

        return withRateLimitHeaders(
            NextResponse.json(mapProduct(product), { status: 201 }),
            rateLimit
        );
    } catch (error) {
        return handleApiError(error);
    }
}
