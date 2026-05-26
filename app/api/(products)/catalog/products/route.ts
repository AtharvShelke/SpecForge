import { NextRequest, NextResponse } from "next/server";
import { normalizeCatalogProduct } from "@/lib/catalogFrontend";
import { prisma } from "@/lib/prisma";
import { CatalogService } from "@/services/catalog.service";
import { DynamicCatalogFilter, Product } from "@/types";
import { requireAdmin } from "@/lib/api/requireAdmin";

function sortProducts(products: any[], sort: string) {
  const next = [...products];
  switch (sort) {
    case "price-asc":
      next.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0));
      break;
    case "price-desc":
      next.sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0));
      break;
    case "name-asc":
      next.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "name-desc":
      next.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case "newest":
      next.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    default:
      break;
  }
  return next;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const subCategoryId = searchParams.get("subCategoryId");
    const category = searchParams.get("category");
    const query = searchParams.get("q")?.trim() ?? "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sort = searchParams.get("sort") ?? "featured";
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(60, Math.max(1, Number(limitParam))) : 15;
    const cursor = Math.max(0, Number(searchParams.get("cursor") ?? 0));

    const where: any = { deletedAt: null };
    const andClauses: any[] = [];

    if (subCategoryId) {
      where.subcategoryId = Number(subCategoryId);
    } else if (category) {
      const cat = await prisma.category.findFirst({
        where: { name: { equals: category, mode: "insensitive" } },
        select: { id: true },
      });
      if (cat) {
        where.categoryId = cat.id;
      }
    }

    if (query) {
      andClauses.push({
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { sku: { contains: query, mode: "insensitive" } },
          { brand: { name: { contains: query, mode: "insensitive" } } },
        ],
      });
    }

    if (andClauses.length > 0) {
      where.AND = andClauses;
    }

    const candidateProducts = await prisma.product.findMany({
      where,
      include: {
        brand: true,
        subcategory: { include: { category: true } },
        media: { orderBy: { sortOrder: "asc" } },
        specs: {
          include: {
            attribute: true,
            option: true,
          },
        },
        inventoryItems: true,
      },
    });

    // Parse active filters from query parameters
    const selectedBrands = searchParams.getAll("f.brand");
    const selectedStockStatus = searchParams.getAll("f.stock_status");

    const selectedSpecs = new Map<string, string[]>();
    for (const [key, value] of searchParams.entries()) {
      if (key.startsWith("f.")) {
        const filterId = key.slice(2);
        if (filterId === "brand" || filterId === "stock_status") continue;
        selectedSpecs.set(filterId, searchParams.getAll(key));
      }
    }

    // Filter matching functions
    const matchesBrand = (product: any) =>
      selectedBrands.length === 0 || (product.brand?.name && selectedBrands.includes(product.brand.name));

    const matchesStock = (product: any) => {
      if (selectedStockStatus.length === 0) return true;
      const isAvailable = product.stockStatus === "IN_STOCK";
      if (selectedStockStatus.includes("In Stock") && isAvailable) return true;
      if (selectedStockStatus.includes("Out of Stock") && !isAvailable) return true;
      return false;
    };

    const matchesPrice = (product: any) => {
      const price = product.price || 0;
      if (minPrice && price < Number(minPrice)) return false;
      if (maxPrice && price > Number(maxPrice)) return false;
      return true;
    };

    const matchesSpec = (product: any, attributeKey: string) => {
      const selectedValues = selectedSpecs.get(attributeKey);
      if (!selectedValues || selectedValues.length === 0) return true;
      return product.specs.some((spec: any) => {
        return spec.attribute?.key === attributeKey && selectedValues.includes(spec.value);
      });
    };

    const matchesAllFiltersExcept = (product: any, exceptKey: string | null) => {
      if (exceptKey !== "brand" && !matchesBrand(product)) return false;
      if (exceptKey !== "stock_status" && !matchesStock(product)) return false;
      if (exceptKey !== "price" && !matchesPrice(product)) return false;
      for (const [attrKey] of selectedSpecs.entries()) {
        if (exceptKey !== attrKey && !matchesSpec(product, attrKey)) return false;
      }
      return true;
    };

    const matchesAllFilters = (product: any) => matchesAllFiltersExcept(product, null);

    // Filter and sort products
    const filteredProducts = candidateProducts.filter(matchesAllFilters);
    const sortedProducts = sortProducts(filteredProducts, sort);
    const total = sortedProducts.length;

    const pageProducts = sortedProducts.slice(cursor, cursor + limit);
    const nextCursor = cursor + limit < total ? String(cursor + limit) : null;
    const normalizedProducts = pageProducts.map((p) => normalizeCatalogProduct(p as any));

    // Calculate dynamic price boundaries (apply all filters except price)
    const priceSubset = candidateProducts.filter((p) => matchesAllFiltersExcept(p, "price"));
    const prices = priceSubset.map((p) => p.price).filter((p) => p !== null && p !== undefined) as number[];
    const absMinPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const absMaxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    // Fetch filters configuration schema
    const attributeSchema = await prisma.categoryAttribute.findMany({
      where: {
        categoryId: where.categoryId || undefined,
        subcategoryId: where.subcategoryId || undefined,
        isFilterable: true,
      },
      include: {
        options: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    const filters: DynamicCatalogFilter[] = [];

    // 1. Add Brand Filter (if brands are present)
    const brandSubset = candidateProducts.filter((p) => matchesAllFiltersExcept(p, "brand"));
    const brandNames = Array.from(
      new Set(candidateProducts.map((p) => p.brand?.name).filter(Boolean)),
    ) as string[];

    if (brandNames.length > 0) {
      filters.push({
        id: "brand",
        key: "brand",
        label: "Brand",
        type: "checkbox",
        group: "General",
        order: -10,
        options: brandNames.map((brandName) => {
          const count = brandSubset.filter((p) => p.brand?.name === brandName).length;
          return {
            value: brandName,
            label: brandName,
            count,
            selected: selectedBrands.includes(brandName),
            enabled: count > 0,
          };
        }),
      });
    }

    // 2. Add Stock Status Filter
    const stockSubset = candidateProducts.filter((p) => matchesAllFiltersExcept(p, "stock_status"));
    const inStockCount = stockSubset.filter((p) => p.stockStatus === "IN_STOCK").length;
    const outOfStockCount = stockSubset.filter((p) => p.stockStatus !== "IN_STOCK").length;

    filters.push({
      id: "stock_status",
      key: "stock_status",
      label: "Stock Status",
      type: "checkbox",
      group: "General",
      order: -5,
      options: [
        {
          value: "In Stock",
          label: "In Stock",
          count: inStockCount,
          selected: selectedStockStatus.includes("In Stock"),
          enabled: inStockCount > 0,
        },
        {
          value: "Out of Stock",
          label: "Out of Stock",
          count: outOfStockCount,
          selected: selectedStockStatus.includes("Out of Stock"),
          enabled: outOfStockCount > 0,
        },
      ],
    });

    // 3. Add Custom Specs Filters
    for (const attr of attributeSchema) {
      const subsetForAttr = candidateProducts.filter((p) => matchesAllFiltersExcept(p, attr.key));
      const optionsMap = new Map<string, { value: string; label: string; count: number }>();

      // Predefined options
      for (const opt of attr.options) {
        optionsMap.set(opt.value, { value: opt.value, label: opt.value, count: 0 });
      }

      // Dynamically discovered option values from subset
      for (const p of subsetForAttr) {
        const matchingSpecs = p.specs.filter((s) => s.attribute?.key === attr.key);
        for (const spec of matchingSpecs) {
          if (!optionsMap.has(spec.value)) {
            optionsMap.set(spec.value, { value: spec.value, label: spec.value, count: 0 });
          }
        }
      }

      const options = Array.from(optionsMap.values()).map((opt) => {
        const count = subsetForAttr.filter((p) =>
          p.specs.some((s) => s.attribute?.key === attr.key && s.value === opt.value),
        ).length;

        return {
          value: opt.value,
          label: opt.value,
          count,
          selected: selectedSpecs.get(attr.key)?.includes(opt.value) ?? false,
          enabled: count > 0,
        };
      });

      filters.push({
        id: attr.key,
        key: attr.key,
        label: attr.label,
        type: "checkbox",
        group: attr.sortOrder > 0 ? "Specifications" : "General",
        order: attr.sortOrder,
        options,
      });
    }

    return NextResponse.json({
      products: normalizedProducts,
      total,
      filters,
      priceRange: { min: absMinPrice, max: absMaxPrice },
      nextCursor,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load products";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) {
    return auth.error;
  }
  try {
    const data = await request.json();
    const product = await CatalogService.createProduct(data);
    return NextResponse.json(normalizeCatalogProduct(product as any), { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
