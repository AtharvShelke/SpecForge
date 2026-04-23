import type { Product } from "@/types";

type SpecEntry = {
  key: string;
  value: string | number | boolean;
  name?: string;
};

type CatalogQueryInput =
  | URLSearchParams
  | string
  | Record<string, string | number | boolean | undefined | null>;

type CatalogFilterOptions = {
  brands: string[];
  specs: Record<string, string[]>;
};

type CatalogResult = {
  products: Product[];
  total: number;
  filterOptions: CatalogFilterOptions;
};

type RawVariantSpec = {
  spec?: { name?: string | null } | null;
  option?: { label?: string | null; value?: string | null } | null;
  valueString?: string | null;
  valueNumber?: number | null;
  valueBool?: boolean | null;
};

type RawVariant = {
  price?: number | string | null;
  compareAtPrice?: number | string | null;
  variantSpecs?: RawVariantSpec[];
};

type RawProduct = Product & {
  brand?: { name?: string | null } | null;
  subCategory?: {
    name?: string | null;
    category?: { name?: string | null } | null;
  } | null;
  variants?: RawVariant[];
  media?: Array<{ url?: string | null }>;
  specs?: SpecEntry[];
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

function toCamelCase(value: string) {
  const cleaned = value
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((part) => part.toLowerCase());

  if (cleaned.length === 0) return "";

  return cleaned[0] + cleaned.slice(1).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("");
}

function getSpecValue(spec: RawVariantSpec) {
  if (spec.option?.label) return spec.option.label;
  if (spec.option?.value) return spec.option.value;
  if (spec.valueString !== undefined && spec.valueString !== null) return spec.valueString;
  if (spec.valueNumber !== undefined && spec.valueNumber !== null) return spec.valueNumber;
  if (spec.valueBool !== undefined && spec.valueBool !== null) return spec.valueBool;
  return "";
}

function normalizeSpecs(product: RawProduct): SpecEntry[] {
  const firstVariant = product.variants?.[0];
  const variantSpecs = firstVariant?.variantSpecs ?? [];

  const specs: SpecEntry[] = [];

  for (const entry of variantSpecs) {
      const name = entry.spec?.name?.trim();
      if (!name) continue;

      const specEntry = {
        key: toCamelCase(name),
        value: getSpecValue(entry),
        name,
      } satisfies SpecEntry;

      if (specEntry.key) specs.push(specEntry);
  }

  if (product.brand?.name && !specs.some((entry) => entry.key === "brand")) {
    specs.unshift({ key: "brand", value: product.brand.name, name: "Brand" });
  }

  return specs;
}

function normalizeCategory(product: RawProduct) {
  return (
    product.category ||
    product.subCategory?.category?.name ||
    product.subCategory?.name ||
    "Uncategorized"
  );
}

export function normalizeCatalogProduct(product: RawProduct): Product {
  const normalizedMedia = (product.media ?? [])
    .map((media) => ({ ...media, url: sanitizeImageUrl(media.url) }))
    .filter((media) => Boolean(media.url));

  return {
    ...product,
    category: normalizeCategory(product),
    image: sanitizeImageUrl(product.image),
    media: normalizedMedia,
    specs: product.specs && product.specs.length > 0 ? product.specs : normalizeSpecs(product),
  } as Product;
}

function matchesSearch(product: Product, query: string) {
  if (!query) return true;
  const q = query.toLowerCase();
  const specs = (product as Product & { specs?: SpecEntry[] }).specs ?? [];
  const brand = (product as Product & { brand?: { name?: string } }).brand?.name ?? "";

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
  const productCategory = ((product as Product & { category?: string }).category ?? "").toLowerCase();
  const subCategory = ((product as Product & { subCategory?: { name?: string | null } }).subCategory?.name ?? "").toLowerCase();
  const expected = category.toLowerCase();
  return productCategory === expected || subCategory === expected;
}

function matchesSubCategory(product: Product, subCategoryId?: string | null) {
  if (!subCategoryId) return true;
  return product.subCategoryId === subCategoryId;
}

function matchesNodeBrand(product: Product, brand?: string | null) {
  if (!brand) return true;
  const productBrand = ((product as Product & { brand?: { name?: string | null } }).brand?.name ?? "").toLowerCase();
  return productBrand === brand.toLowerCase();
}

function matchesNodeQuery(product: Product, query?: string | null) {
  if (!query) return true;
  return matchesSearch(product, query);
}

function matchesStock(product: Product, stockStatus?: string | null) {
  if (!stockStatus || stockStatus === "all") return true;
  const variants = (product.variants ?? []) as Array<{ inventoryItems?: Array<{ quantityOnHand?: number }>; status?: string | null }>;
  const quantity = variants.reduce((sum, variant) => {
    const itemQuantity = (variant.inventoryItems ?? []).reduce((inner, item) => inner + Number(item.quantityOnHand ?? 0), 0);
    return sum + itemQuantity;
  }, 0);

  if (stockStatus === "In Stock") {
    return quantity > 0 || variants.some((variant) => variant.status === "IN_STOCK");
  }

  if (stockStatus === "Out of Stock") {
    return quantity <= 0 || variants.every((variant) => variant.status === "OUT_OF_STOCK");
  }

  return true;
}

function matchesPrice(product: Product, minPrice?: string | null, maxPrice?: string | null) {
  const price = Number(product.variants?.[0]?.price ?? 0);
  const min = minPrice ? Number(minPrice) : null;
  const max = maxPrice ? Number(maxPrice) : null;

  if (min !== null && !Number.isNaN(min) && price < min) return false;
  if (max !== null && !Number.isNaN(max) && price > max) return false;
  return true;
}

function matchesSpecFilters(product: Product, params: URLSearchParams) {
  const specs = ((product as Product & { specs?: SpecEntry[] }).specs ?? []).reduce<Record<string, string>>((acc, spec) => {
    acc[spec.key] = String(spec.value).toLowerCase();
    return acc;
  }, {});

  for (const [key, value] of params.entries()) {
    if (!key.startsWith("f_specs.")) continue;
    const specKey = key.slice("f_specs.".length).toLowerCase();
    if (!specs[specKey]) return false;
    if (!specs[specKey].includes(String(value).toLowerCase())) return false;
  }

  return true;
}

function sortProducts(products: Product[], sort?: string | null) {
  const next = [...products];

  switch (sort) {
    case "price-desc":
      next.sort((a, b) => Number(b.variants?.[0]?.price ?? 0) - Number(a.variants?.[0]?.price ?? 0));
      break;
    case "name-asc":
      next.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "name-desc":
      next.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case "newest":
      next.sort((a, b) => new Date((b as Product & { createdAt?: string }).createdAt ?? 0).getTime() - new Date((a as Product & { createdAt?: string }).createdAt ?? 0).getTime());
      break;
    case "price-asc":
    default:
      next.sort((a, b) => Number(a.variants?.[0]?.price ?? 0) - Number(b.variants?.[0]?.price ?? 0));
      break;
  }

  return next;
}

function buildFilterOptions(products: Product[]): CatalogFilterOptions {
  const brandSet = new Set<string>();
  const specsMap = new Map<string, Set<string>>();

  for (const product of products) {
    const brandName = ((product as Product & { brand?: { name?: string | null } }).brand?.name ?? "").trim();
    if (brandName) brandSet.add(brandName);

    const specs = (product as Product & { specs?: SpecEntry[] }).specs ?? [];
    for (const spec of specs) {
      if (!specsMap.has(spec.key)) specsMap.set(spec.key, new Set());
      specsMap.get(spec.key)!.add(String(spec.value));
    }
  }

  return {
    brands: [...brandSet].sort((a, b) => a.localeCompare(b)),
    specs: Object.fromEntries(
      [...specsMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, values]) => [key, [...values].sort((a, b) => a.localeCompare(b))]),
    ),
  };
}

export async function fetchCatalogProducts(paramsInput?: CatalogQueryInput): Promise<CatalogResult> {
  const params = toSearchParams(paramsInput);
  const response = await fetch("/api/catalog/products", { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Failed to fetch catalog products");
  }

  const rawProducts = (await response.json()) as RawProduct[];
  const normalizedProducts = rawProducts.map(normalizeCatalogProduct);

  const filtered = normalizedProducts.filter((product) => {
    return (
      matchesCategory(product, params.get("category")) &&
      matchesSubCategory(product, params.get("subCategoryId")) &&
      matchesNodeBrand(product, params.get("nodeBrand")) &&
      matchesNodeQuery(product, params.get("nodeQuery")) &&
      matchesSearch(product, params.get("q") || params.get("sq") || "") &&
      matchesStock(product, params.get("f_stock_status")) &&
      matchesPrice(product, params.get("minPrice"), params.get("maxPrice")) &&
      matchesSpecFilters(product, params)
    );
  });

  const sorted = sortProducts(filtered, params.get("sort"));
  const total = sorted.length;
  const filterOptions = buildFilterOptions(filtered);

  const limitValue = params.get("limit");
  const limit = Number(limitValue ?? total ?? 0);
  const page = Number(params.get("page") ?? 1);

  const paginated =
    limit > 0
      ? sorted.slice((Math.max(page, 1) - 1) * limit, Math.max(page, 1) * limit)
      : sorted;

  return {
    products: paginated,
    total,
    filterOptions,
  };
}
