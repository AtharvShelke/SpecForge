import { NextRequest, NextResponse } from "next/server";

import { normalizeCatalogProduct } from "@/lib/catalogFrontend";
import { measureRoute } from "@/lib/performance";
import { prisma } from "@/lib/prisma";
import { CatalogService } from "@/lib/services/catalog.service";
import { DynamicCatalogFilter, Product } from "@/types";

function hasInventoryUnitFields(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const data = payload as Record<string, unknown>;

  if (
    "inventoryUnits" in data ||
    "serialNumber" in data ||
    "partNumber" in data
  ) {
    return true;
  }

  const variants = Array.isArray(data.variants) ? data.variants : [];
  return variants.some((variant) => {
    if (!variant || typeof variant !== "object") return false;
    const v = variant as Record<string, unknown>;
    return "serialNumber" in v || "partNumber" in v || "inventoryUnits" in v;
  });
}

function toSpecKey(value: string) {
  const cleaned = value
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((part) => part.toLowerCase());

  if (cleaned.length === 0) return "";

  return (
    cleaned[0] +
    cleaned
      .slice(1)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("")
  );
}

const PRODUCT_SELECT = {
  id: true,
  slug: true,
  name: true,
  description: true,
  status: true,
  subCategoryId: true,
  createdAt: true,
  updatedAt: true,
  brand: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  subCategory: {
    select: {
      id: true,
      name: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  media: {
    orderBy: { sortOrder: "asc" as const },
    select: {
      id: true,
      url: true,
      altText: true,
      sortOrder: true,
    },
  },
  variants: {
    where: { deletedAt: null },
    orderBy: [{ price: "asc" as const }, { createdAt: "asc" as const }],
    select: {
      id: true,
      productId: true,
      sku: true,
      price: true,
      compareAtPrice: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      inventoryItems: {
        select: {
          id: true,
          quantityOnHand: true,
          quantityReserved: true,
          status: true,
        },
      },
      variantSpecs: {
        select: {
          id: true,
          valueString: true,
          valueNumber: true,
          valueBool: true,
          spec: { select: { id: true, name: true } },
          option: { select: { id: true, value: true, label: true } },
        },
      },
    },
  },
};

function buildSort(sort: string) {
  switch (sort) {
    case "name-asc":
      return [{ name: "asc" as const }];
    case "name-desc":
      return [{ name: "desc" as const }];
    case "price-asc":
    case "price-desc":
    case "newest":
    case "featured":
    default:
      return [{ createdAt: "desc" as const }];
  }
}

function sortProducts(products: Product[], sort: string) {
  const next = [...products];

  switch (sort) {
    case "price-asc":
      next.sort(
        (left, right) =>
          Number(left.variants?.[0]?.price ?? 0) -
          Number(right.variants?.[0]?.price ?? 0),
      );
      break;
    case "price-desc":
      next.sort(
        (left, right) =>
          Number(right.variants?.[0]?.price ?? 0) -
          Number(left.variants?.[0]?.price ?? 0),
      );
      break;
    case "name-asc":
      next.sort((left, right) => left.name.localeCompare(right.name));
      break;
    case "name-desc":
      next.sort((left, right) => right.name.localeCompare(left.name));
      break;
    case "newest":
    case "featured":
    default:
      next.sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      );
      break;
  }

  return next;
}

async function buildFilters(products: Product[]): Promise<DynamicCatalogFilter[]> {
  const brandCounts = new Map<string, number>();
  const specMap = new Map<
    string,
    { label: string; group: string | null; order: number | null; counts: Map<string, number> }
  >();
  const subCategoryIds = Array.from(
    new Set(products.map((product) => product.subCategoryId).filter(Boolean)),
  );
  const filterableSpecs = await prisma.specDefinition.findMany({
    where: {
      isFilterable: true,
      subCategoryId: { in: subCategoryIds },
    },
    select: {
      id: true,
      name: true,
      filterGroup: true,
      filterOrder: true,
      subCategoryId: true,
    },
  });
  const specNameBySubCategory = new Map<string, Set<string>>();
  for (const spec of filterableSpecs) {
    const specSet = specNameBySubCategory.get(spec.subCategoryId) ?? new Set<string>();
    specSet.add(spec.name.toLowerCase());
    specNameBySubCategory.set(spec.subCategoryId, specSet);
  }

  for (const product of products) {
    const brandName = product.brand?.name?.trim();
    if (brandName) {
      brandCounts.set(brandName, (brandCounts.get(brandName) ?? 0) + 1);
    }

    for (const spec of product.specs ?? []) {
      const filterId = spec.key;
      const optionValue = String(spec.value ?? "").trim();
      if (!filterId || !optionValue || filterId === "brand") continue;
      const allowedSpecNames = specNameBySubCategory.get(product.subCategoryId);
      const specName = (spec.name ?? "").toLowerCase();
      if (allowedSpecNames && !allowedSpecNames.has(specName)) continue;

      const schemaSpec = filterableSpecs.find(
        (entry) => entry.subCategoryId === product.subCategoryId && entry.name.toLowerCase() === specName,
      );

      if (!specMap.has(filterId)) {
        specMap.set(filterId, {
          label: schemaSpec?.name ?? spec.name ?? filterId,
          group: schemaSpec?.filterGroup ?? null,
          order: schemaSpec?.filterOrder ?? null,
          counts: new Map<string, number>(),
        });
      }

      const entry = specMap.get(filterId);
      if (!entry) continue;
      entry.counts.set(optionValue, (entry.counts.get(optionValue) ?? 0) + 1);
    }
  }

  const filters: DynamicCatalogFilter[] = [];

  if (brandCounts.size > 0) {
    filters.push({
      id: "brand",
      key: "brand",
      label: "Brand",
      type: "checkbox",
      options: Array.from(brandCounts.entries())
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([value, count]) => ({
          value,
          label: value,
          count,
          enabled: true,
        })),
    });
  }

  for (const [filterId, entry] of Array.from(specMap.entries()).sort(([, left], [, right]) => {
    const leftOrder = left.order ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.order ?? Number.MAX_SAFE_INTEGER;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    return left.label.localeCompare(right.label);
  })) {
    filters.push({
      id: filterId,
      key: filterId,
      label: entry.label,
      type: "checkbox",
      group: entry.group,
      order: entry.order,
      options: Array.from(entry.counts.entries())
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([value, count]) => ({
          value,
          label: value,
          count,
          enabled: true,
        })),
    });
  }

  return filters;
}

function selectedFilterMap(searchParams: URLSearchParams) {
  const map = new Map<string, string[]>();

  for (const [key, value] of searchParams.entries()) {
    if (!key.startsWith("f.")) continue;
    const filterId = key.slice(2);
    map.set(filterId, [...(map.get(filterId) ?? []), value]);
  }

  return map;
}

export async function GET(request: NextRequest) {
  return measureRoute("GET /api/catalog/products", async () => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const subCategoryId = searchParams.get("subCategoryId");
      const category = searchParams.get("category");
      const query = searchParams.get("q")?.trim() ?? "";
      const minPrice = searchParams.get("minPrice");
      const maxPrice = searchParams.get("maxPrice");
      const sort = searchParams.get("sort") ?? "featured";
      const limitParam = searchParams.get("limit");
      const limit = limitParam ? Math.min(60, Math.max(1, Number(limitParam))) : null;
      const cursor = Math.max(0, Number(searchParams.get("cursor") ?? 0));
      const stockStatus = searchParams.get("f_stock_status");
      const filters = selectedFilterMap(searchParams);
      const requiresInMemorySort = sort === "price-asc" || sort === "price-desc";

      const where: Record<string, unknown> = { deletedAt: null };
      const andClauses: Array<Record<string, unknown>> = [];

      if (subCategoryId) {
        where.subCategoryId = subCategoryId;
      }

      if (category) {
        andClauses.push({
          subCategory: {
            category: {
              name: {
                equals: category,
                mode: "insensitive",
              },
            },
          },
        });
      }

      if (query) {
        andClauses.push({
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } },
            { brand: { name: { contains: query, mode: "insensitive" } } },
            {
              variants: {
                some: {
                  deletedAt: null,
                  sku: { contains: query, mode: "insensitive" },
                },
              },
            },
          ],
        });
      }

      const variantClause: Record<string, unknown> = { deletedAt: null };
      let hasVariantFilters = false;

      if (minPrice || maxPrice) {
        variantClause.price = {
          ...(minPrice ? { gte: Number(minPrice) } : {}),
          ...(maxPrice ? { lte: Number(maxPrice) } : {}),
        };
        hasVariantFilters = true;
      }

      if (stockStatus === "In Stock") {
        variantClause.inventoryItems = {
          some: {
            quantityOnHand: { gt: 0 },
            status: { in: ["IN_STOCK", "RETURNED", "RESERVED"] },
          },
        };
        hasVariantFilters = true;
      }

      if (stockStatus === "Out of Stock") {
        andClauses.push({
          variants: {
            none: {
              deletedAt: null,
              inventoryItems: {
                some: {
                  quantityOnHand: { gt: 0 },
                  status: { in: ["IN_STOCK", "RETURNED", "RESERVED"] },
                },
              },
            },
          },
        });
      }

      const specFilterIds = Array.from(filters.keys()).filter((key) => key !== "brand");
      if (filters.get("brand")?.length) {
        andClauses.push({
          brand: {
            name: {
              in: filters.get("brand"),
            },
          },
        });
      }

      if (specFilterIds.length > 0) {
        const filterableSpecs = await prisma.specDefinition.findMany({
          where: {
            isFilterable: true,
            ...(subCategoryId ? { subCategoryId } : {}),
          },
          select: {
            id: true,
            name: true,
          },
        });

        const specIdsByKey = filterableSpecs.reduce<Map<string, string[]>>((map, spec) => {
          const key = toSpecKey(spec.name);
          map.set(key, [...(map.get(key) ?? []), spec.id]);
          return map;
        }, new Map<string, string[]>());

        for (const filterId of specFilterIds) {
          const values = filters.get(filterId) ?? [];
          const specIds = specIdsByKey.get(filterId) ?? [];
          if (values.length === 0 || specIds.length === 0) continue;

          const numericValues = values
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value));

          andClauses.push({
            variants: {
              some: {
                deletedAt: null,
                variantSpecs: {
                  some: {
                    specId: { in: specIds },
                    OR: [
                      { option: { value: { in: values } } },
                      { option: { label: { in: values } } },
                      { valueString: { in: values } },
                      ...(numericValues.length > 0
                        ? [{ valueNumber: { in: numericValues } }]
                        : []),
                    ],
                  },
                },
              },
            },
          });
        }
      }

      if (hasVariantFilters) {
        andClauses.push({
          variants: {
            some: variantClause,
          },
        });
      }

      if (andClauses.length > 0) {
        where.AND = andClauses;
      }

      const [products, total, filterSeed] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy: buildSort(sort),
          ...(limit !== null && !requiresInMemorySort ? { skip: cursor, take: limit } : {}),
          select: PRODUCT_SELECT,
        }),
        prisma.product.count({ where }),
        prisma.product.findMany({
          where,
          orderBy: buildSort(sort),
          take: 200,
          select: PRODUCT_SELECT,
        }),
      ]);

      const sortedProducts = sortProducts(
        products.map((product) => normalizeCatalogProduct(product as any)),
        sort,
      );
      const normalizedProducts =
        limit !== null && requiresInMemorySort
          ? sortedProducts.slice(cursor, cursor + limit)
          : sortedProducts;
      const normalizedFilterSeed = sortProducts(
        filterSeed.map((product) => normalizeCatalogProduct(product as any)),
        sort,
      );
      const nextCursor =
        limit !== null && cursor + limit < total ? String(cursor + limit) : null;

      return NextResponse.json(
        {
          products: normalizedProducts,
          total,
          filters: await buildFilters(normalizedFilterSeed),
          nextCursor,
        },
        {
          headers: {
            "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
          },
        },
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load products";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (hasInventoryUnitFields(data)) {
      return NextResponse.json(
        {
          error:
            "serialNumber and partNumber are inventory-level fields. Use inventory APIs/pages to manage physical units.",
        },
        { status: 400 },
      );
    }
    const product = await CatalogService.createProduct(data);
    return NextResponse.json(product, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
