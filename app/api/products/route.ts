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

const BASE_PRODUCT_INCLUDE = {
    category: {
        select: {
            id: true,
            code: true,
            name: true,
            slug: true,
            shortLabel: true,
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
    inventoryItems: {
        select: {
            id: true,
            productId: true,
            quantity: true,
            reserved: true,
            reorderLevel: true,
            costPrice: true,
            location: true,
            lastUpdated: true,
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
            attributeId: true,
            optionId: true,
            value: true,
            valueNumber: true,
            valueBoolean: true,
            isHighlighted: true,
            attribute: {
                select: {
                    key: true,
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
        // Moved from ProductVariant
        sku: product.sku,
        price: product.price,
        compareAtPrice: product.compareAtPrice ?? undefined,
        stockStatus: product.stockStatus,
        specs: (product.specs ?? []).map((spec: any) => ({
            id: spec.id,
            productId: spec.productId,
            attributeId: spec.attributeId,
            optionId: spec.optionId,
            key: spec.attribute?.key ?? "",
            value: spec.value,
            valueNumber: spec.valueNumber ?? undefined,
            valueBoolean: spec.valueBoolean ?? undefined,
            isHighlighted: spec.isHighlighted,
        })),
        inventoryItems: (product.inventoryItems ?? []).map((item: any) => ({
            id: item.id,
            productId: item.productId,
            quantity: item.quantity,
            reserved: item.reserved,
            reorderLevel: item.reorderLevel,
            costPrice: item.costPrice,
            location: item.location,
            lastUpdated: item.lastUpdated,
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

    const where: Record<string, unknown> = {};
    const and: object[] = [];

    if (!globalSearch && categoryIdsForFilter.length > 0) {
        where.categoryId = categoryIdsForFilter.length === 1
            ? categoryIdsForFilter[0]
            : { in: categoryIdsForFilter };
    }

    if (subcategoryParam) {
        const isId = /^\d+$/.test(subcategoryParam);
        where.subcategoryId = isId ? Number(subcategoryParam) : {
            slug: subcategoryParam
        };
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

async function resolveFilterOptions(where: Record<string, unknown>, categoryCode: string | null, subcategoryCode: string | null) {
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
    const specMetadata: Record<string, any> = {};
    
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
        const cat = category as any;
        let attributes = cat.attributes;
        const subcategory = cat.subcategories?.[0];
        
        if (subcategory && subcategory.attributes && subcategory.attributes.length > 0) {
            const subAttrKeys = new Set(subcategory.attributes.map((a: any) => a.key));
            attributes = [
                ...cat.attributes.filter((a: any) => !subAttrKeys.has(a.key)),
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
    where: Record<string, unknown>,
    sort: string,
    page: number,
    limit: number,
    fields: string | null,
    codeByCategoryId: Map<number, string>
) {
    const products = await prisma.product.findMany({
        where,
        orderBy: { price: sort === "price-asc" ? "asc" as const : "desc" as const },
        include: fields === "minimal" ? BASE_PRODUCT_INCLUDE : FULL_PRODUCT_INCLUDE,
        skip: (page - 1) * limit,
        take: limit,
    });

    const total = await prisma.product.count({ where });

    return {
        products: products.map((product) => mapProduct(product, codeByCategoryId)),
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

        const { codeByCategoryId, resolveCategoryIds } = await loadCategoryMetadata();
        const categoryIdsForFilter = categoryParam ? resolveCategoryIds([categoryParam]) : [];
        const where = buildWhereClause(searchParams, categoryIdsForFilter);
        const filterOptionsPromise = searchParams.get("getFilters") === "true"
            ? resolveFilterOptions(where, categoryParam, subcategoryParam)
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

        const existing = await prisma.product.findUnique({
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
                    sku: data.sku,
                    price: data.price,
                    stockStatus: data.stock > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
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
                include: FULL_PRODUCT_INCLUDE,
            });

            await tx.inventoryItem.create({
                data: {
                    productId: created.id,
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
                        productId: created.id,
                        type: "INWARD",
                        quantity: data.stock,
                        note: "Initial stock entry",
                    },
                });
            }

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
