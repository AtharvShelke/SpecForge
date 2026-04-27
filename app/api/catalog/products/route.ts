import { NextRequest, NextResponse } from "next/server";

import { normalizeCatalogProduct } from "@/lib/catalogFrontend";
import { CatalogService } from "@/lib/services/catalog.service";
import { DynamicCatalogFilter, Product } from "@/types";

function matchesSearch(product: Product, query: string) {
  if (!query) return true;
  const needle = query.toLowerCase();
  const specs = (product.specs ?? []).map(
    (spec) => `${spec.name ?? spec.key} ${String(spec.value ?? "")}`,
  );

  return [
    product.name,
    product.brand?.name ?? "",
    product.category,
    product.subCategory?.name ?? "",
    ...specs,
  ]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

function matchesSubCategory(product: Product, subCategoryId: string | null) {
  if (!subCategoryId) return true;
  return product.subCategoryId === subCategoryId;
}

function matchesCategory(product: Product, category: string | null) {
  if (!category) return true;
  return product.category?.toLowerCase() === category.toLowerCase();
}

function matchesPrice(
  product: Product,
  minPrice: number | null,
  maxPrice: number | null,
) {
  const price = Number(product.variants?.[0]?.price ?? 0);
  if (minPrice !== null && price < minPrice) return false;
  if (maxPrice !== null && price > maxPrice) return false;
  return true;
}

function matchesFilters(
  product: Product,
  selectedFilters: Map<string, string[]>,
) {
  if (selectedFilters.size === 0) return true;

  const specs = (product.specs ?? []).reduce<Record<string, string>>((acc, spec) => {
    acc[spec.key] = String(spec.value ?? "").toLowerCase();
    return acc;
  }, {});

  for (const [filterId, values] of selectedFilters.entries()) {
    if (filterId === "brand") {
      const brandName = (product.brand?.name ?? "").toLowerCase();
      if (!values.some((value) => brandName === value.toLowerCase())) {
        return false;
      }
      continue;
    }

    const currentValue = specs[filterId]?.toLowerCase();
    if (!currentValue) return false;
    if (!values.some((value) => currentValue.includes(value.toLowerCase()))) {
      return false;
    }
  }

  return true;
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
    case "newest":
      next.sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      );
      break;
    case "name-asc":
      next.sort((left, right) => left.name.localeCompare(right.name));
      break;
    case "name-desc":
      next.sort((left, right) => right.name.localeCompare(left.name));
      break;
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

function buildFilters(products: Product[]): DynamicCatalogFilter[] {
  const brandCounts = new Map<string, number>();
  const specMap = new Map<string, { label: string; counts: Map<string, number> }>();

  for (const product of products) {
    const brandName = product.brand?.name?.trim();
    if (brandName) {
      brandCounts.set(brandName, (brandCounts.get(brandName) ?? 0) + 1);
    }

    for (const spec of product.specs ?? []) {
      const filterId = spec.key;
      const optionValue = String(spec.value ?? "").trim();
      if (!filterId || !optionValue || filterId === "brand") continue;

      if (!specMap.has(filterId)) {
        specMap.set(filterId, {
          label: spec.name ?? filterId,
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

  for (const [filterId, entry] of Array.from(specMap.entries()).sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    filters.push({
      id: filterId,
      key: filterId,
      label: entry.label,
      type: "checkbox",
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
  try {
    const searchParams = request.nextUrl.searchParams;
    const allProducts = await CatalogService.getProducts();
    const normalizedProducts = allProducts.map((product) =>
      normalizeCatalogProduct(product as any),
    );

    const subCategoryId = searchParams.get("subCategoryId");
    const category = searchParams.get("category");
    const query = searchParams.get("q")?.trim() ?? "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sort = searchParams.get("sort") ?? "featured";
    const limit = Math.max(1, Number(searchParams.get("limit") ?? 12));
    const cursor = Math.max(0, Number(searchParams.get("cursor") ?? 0));
    const filters = selectedFilterMap(searchParams);

    const filtered = normalizedProducts.filter((product) => {
      return (
        matchesCategory(product, category) &&
        matchesSubCategory(product, subCategoryId) &&
        matchesSearch(product, query) &&
        matchesPrice(
          product,
          minPrice ? Number(minPrice) : null,
          maxPrice ? Number(maxPrice) : null,
        ) &&
        matchesFilters(product, filters)
      );
    });

    const sorted = sortProducts(filtered, sort);
    const paginated = sorted.slice(cursor, cursor + limit);
    const nextCursor = cursor + limit < sorted.length ? String(cursor + limit) : null;

    return NextResponse.json({
      products: paginated,
      total: sorted.length,
      filters: buildFilters(filtered),
      nextCursor,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load products";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const product = await CatalogService.createProduct(data);
    return NextResponse.json(product, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
