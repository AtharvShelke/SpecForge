import type { DynamicCatalogFilter, Product } from "@/types";

type SpecEntry = {
  key: string;
  value: string | number | boolean;
  name?: string;
};

type CatalogQueryInput =
  | URLSearchParams
  | string
  | Record<string, string | number | boolean | undefined | null>;

type CatalogResult = {
  products: Product[];
  total: number;
  filters: DynamicCatalogFilter[];
};

type RawProduct = Product & {
  brand?: { name?: string | null } | null;
  subCategory?: {
    name?: string | null;
    category?: { name?: string | null } | null;
  } | null;
  media?: Array<{ url?: string | null }>;
  specs?: any[];
  category?: string;
};

function sanitizeImageUrl(url?: string | null) {
  if (!url) return "/placeholder.png";

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();

    if (host.includes("placeholder") || path.includes("placeholder")) {
      return "/placeholder.png";
    }

    return url;
  } catch {
    return url.startsWith("/") ? url : "/placeholder.png";
  }
}

function toSearchParams(input?: CatalogQueryInput): URLSearchParams {
  if (!input) return new URLSearchParams();
  if (input instanceof URLSearchParams) return new URLSearchParams(input);
  if (typeof input === "string") return new URLSearchParams(input);

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  return params;
}

function normalizeCategory(product: RawProduct) {
  return (
    product.subcategory?.category?.name ||
    product.subCategory?.category?.name ||
    product.category ||
    product.subcategory?.name ||
    product.subCategory?.name ||
    "Uncategorized"
  );
}

export function normalizeCatalogProduct(product: RawProduct): Product {
  const normalizedMedia = (product.media ?? [])
    .map((media) => ({ ...media, url: sanitizeImageUrl(media.url) }))
    .filter((media) => Boolean(media.url));

  // Determine availability directly from inventoryItems or stockStatus
  const availableQty = Array.isArray(product.inventoryItems)
    ? product.inventoryItems.reduce(
        (sum, item) => sum + Math.max(0, (item?.quantity ?? 0) - (item?.reserved ?? 0)),
        0,
      )
    : 0;

  const resolvedStockStatus =
    product.stockStatus || (availableQty > 0 ? "IN_STOCK" : "OUT_OF_STOCK");

  // Map product specs from product.specs (ProductSpecRelation) to SpecEntry[]
  const mappedSpecs: SpecEntry[] = Array.isArray(product.specs)
    ? (product.specs as any[]).map((s: any) => ({
        key: String(s.attribute?.key || s.key || ""),
        value: s.value !== null && s.value !== undefined ? (Array.isArray(s.value) ? s.value.join(", ") : s.value) : "",
        name: String(s.attribute?.label || s.name || s.attribute?.key || s.key || ""),
      }))
    : [];

  if (product.brand?.name && !mappedSpecs.some((e) => e.key === "brand")) {
    mappedSpecs.unshift({ key: "brand", value: product.brand.name, name: "Brand" });
  }

  const priceNum = product.price ? Number(product.price.toString()) : 0;
  const compareAtPriceNum = product.compareAtPrice
    ? Number(product.compareAtPrice.toString())
    : null;

  // Mock variant for backward compatibility with any files calling variants[0]
  const mockVariant = {
    id: product.id,
    productId: product.id,
    sku: product.sku || "",
    price: priceNum,
    compareAtPrice: compareAtPriceNum,
    status: resolvedStockStatus,
    inventoryItems: product.inventoryItems || [],
  };

  return {
    ...product,
    price: priceNum,
    compareAtPrice: compareAtPriceNum,
    stockStatus: resolvedStockStatus,
    category: normalizeCategory(product),
    image: normalizedMedia[0]?.url || "/placeholder.png",
    media: normalizedMedia,
    specs: mappedSpecs,
    variants: [mockVariant],
  } as unknown as Product;
}

function matchesSearch(product: Product, query: string) {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  const specs = (product as Product & { specs?: SpecEntry[] }).specs ?? [];
  const brand =
    (product as Product & { brand?: { name?: string } }).brand?.name ?? "";

  return [
    product.name,
    (product as Product & { category?: string }).category ?? "",
    brand,
    ...specs.map((entry) => `${entry.name ?? entry.key} ${entry.value}`),
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

function matchesCategory(product: Product, category?: string | null) {
  if (!category) return true;
  const productCategory = (
    (product as Product & { category?: string }).category ?? ""
  ).toLowerCase();
  const subCategory = (
    (product as Product & { subCategory?: { name?: string | null }; subcategory?: { name?: string | null } })
      .subcategory?.name ??
    (product as Product & { subCategory?: { name?: string | null }; subcategory?: { name?: string | null } })
      .subCategory?.name ??
    ""
  ).toLowerCase();
  const expected = category.toLowerCase();
  return productCategory === expected || subCategory === expected;
}

function matchesSubCategory(product: Product, subCategoryId?: string | null) {
  if (!subCategoryId) return true;
  return product.subCategoryId === subCategoryId;
}

function matchesNodeBrand(product: Product, brand?: string | null) {
  if (!brand) return true;
  const productBrand = (
    (product as Product & { brand?: { name?: string | null } }).brand?.name ??
    ""
  ).toLowerCase();
  return productBrand === brand.toLowerCase();
}

function matchesNodeQuery(product: Product, query?: string | null) {
  if (!query) return true;
  return matchesSearch(product, query);
}

function matchesStock(product: Product, stockStatus?: string | null) {
  if (!stockStatus || stockStatus === "all") return true;

  const isAvailable = product.stockStatus === "IN_STOCK" || product.stockStatus === "ACTIVE";

  if (stockStatus === "In Stock") {
    return isAvailable;
  }

  if (stockStatus === "Out of Stock") {
    return !isAvailable;
  }

  return true;
}

function matchesPrice(
  product: Product,
  minPrice?: string | null,
  maxPrice?: string | null,
) {
  const price = Number(product.price ?? 0);
  const min = minPrice ? Number(minPrice) : null;
  const max = maxPrice ? Number(maxPrice) : null;

  if (min !== null && !Number.isNaN(min) && price < min) return false;
  if (max !== null && !Number.isNaN(max) && price > max) return false;
  return true;
}

function matchesSpecFilters(product: Product, params: URLSearchParams) {
  const specs = (
    (product as Product & { specs?: SpecEntry[] }).specs ?? []
  ).reduce<Record<string, string>>((acc, spec) => {
    acc[spec.key.toLowerCase()] = String(spec.value).toLowerCase();
    return acc;
  }, {});

  for (const [key, value] of params.entries()) {
    if (!key.startsWith("f.")) continue;
    const specKey = key.slice("f.".length).toLowerCase();
    if (specKey === "brand" || specKey === "stock_status") continue;
    if (!specs[specKey]) return false;
    if (!specs[specKey].includes(String(value).toLowerCase())) return false;
  }

  return true;
}

function sortProducts(products: Product[], sort?: string | null) {
  const next = [...products];

  switch (sort) {
    case "price-desc":
      next.sort(
        (a, b) => Number(b.price ?? 0) - Number(a.price ?? 0),
      );
      break;
    case "name-asc":
      next.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "name-desc":
      next.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case "newest":
      next.sort(
        (a, b) =>
          new Date(
            (b as Product & { createdAt?: string }).createdAt ?? 0,
          ).getTime() -
          new Date(
            (a as Product & { createdAt?: string }).createdAt ?? 0,
          ).getTime(),
      );
      break;
    case "price-asc":
    default:
      next.sort(
        (a, b) => Number(a.price ?? 0) - Number(b.price ?? 0),
      );
      break;
  }

  return next;
}

function buildFilterOptions(products: Product[]): DynamicCatalogFilter[] {
  const brandSet = new Set<string>();
  const specsMap = new Map<string, Set<string>>();

  for (const product of products) {
    const brandName = (
      (product as Product & { brand?: { name?: string | null } }).brand?.name ??
      ""
    ).trim();
    if (brandName) brandSet.add(brandName);

    const specs = (product as Product & { specs?: SpecEntry[] }).specs ?? [];
    for (const spec of specs) {
      if (spec.key === "brand") continue;
      if (!specsMap.has(spec.key)) specsMap.set(spec.key, new Set());
      specsMap.get(spec.key)!.add(String(spec.value));
    }
  }

  const filters: DynamicCatalogFilter[] = [];

  const brands = [...brandSet].sort((a, b) => a.localeCompare(b));
  if (brands.length > 0) {
    filters.push({
      id: "brand",
      key: "brand",
      label: "Brand",
      type: "checkbox",
      group: "General",
      order: -10,
      options: brands.map((value) => ({
        value,
        label: value,
        count: products.filter((product) => product.brand?.name === value)
          .length,
        enabled: true,
      })),
    });
  }

  for (const [key, values] of [...specsMap.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    const sortedValues = [...values].sort((a, b) => a.localeCompare(b));
    filters.push({
      id: key,
      key,
      label: key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (char) => char.toUpperCase()),
      type: "checkbox",
      group: "General",
      order: 0,
      options: sortedValues.map((value) => ({
        value,
        label: value,
        count: products.filter((product) =>
          ((product as Product & { specs?: SpecEntry[] }).specs ?? []).some(
            (spec) => spec.key === key && String(spec.value) === value,
          ),
        ).length,
        enabled: true,
      })),
    });
  }

  return filters;
}

export async function fetchCatalogProducts(
  paramsInput?: CatalogQueryInput,
): Promise<CatalogResult> {
  const params = toSearchParams(paramsInput);
  const qs = params.toString();
  const endpoint = qs ? `/api/catalog/products?${qs}` : "/api/catalog/products";
  const response = await fetch(endpoint, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Failed to fetch catalog products");
  }

  const data = await response.json();

  const rawProducts = Array.isArray(data) ? data : (data?.products ?? []);
  const normalizedProducts: Product[] = rawProducts.map(normalizeCatalogProduct);

  return {
    products: normalizedProducts,
    total: data.total ?? normalizedProducts.length,
    filters: data.filters ?? [],
  };
}
