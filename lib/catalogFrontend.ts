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

type RawVariantSpec = {
  spec?: { name?: string | null } | null;
  option?: { label?: string | null; value?: string | null } | null;
  valueString?: string | null;
  valueNumber?: number | null;
  valueBool?: boolean | null;
};

type RawVariant = {
  price?: number | string | any | null;
  compareAtPrice?: number | string | any | null;
  variantSpecs?: RawVariantSpec[];
  inventoryItems?: Array<{
    quantityOnHand?: number | null;
    quantityReserved?: number | null;
  }>;
  status?: string | null;
  [key: string]: any;
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

  return (
    cleaned[0] +
    cleaned
      .slice(1)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("")
  );
}

function getSpecValue(spec: RawVariantSpec) {
  if (spec.option?.label) return spec.option.label;
  if (spec.option?.value) return spec.option.value;
  if (spec.valueString !== undefined && spec.valueString !== null)
    return spec.valueString;
  if (spec.valueNumber !== undefined && spec.valueNumber !== null)
    return spec.valueNumber;
  if (spec.valueBool !== undefined && spec.valueBool !== null)
    return spec.valueBool;
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
    // Prefer the parent category (e.g. "Processor") over stored subcategory labels
    // (e.g. "Desktop CPU") so category-based UIs like PC Builder can match reliably.
    product.subCategory?.category?.name ||
    product.category ||
    product.subCategory?.name ||
    "Uncategorized"
  );
}

function variantAvailableQuantity(variant: RawVariant): number {
  if (Array.isArray(variant.inventoryItems) && variant.inventoryItems.length > 0) {
    return variant.inventoryItems.reduce(
      (sum, item) =>
        sum +
        Math.max(
          0,
          Number(item?.quantityOnHand ?? 0) - Number(item?.quantityReserved ?? 0),
        ),
      0,
    );
  }

  return 0;
}

export function normalizeCatalogProduct(product: RawProduct): Product {
  const normalizedMedia = (product.media ?? [])
    .map((media) => ({ ...media, url: sanitizeImageUrl(media.url) }))
    .filter((media) => Boolean(media.url));

  const normalizedVariants = (product.variants ?? []).map((v) => {
    const availableQty = variantAvailableQuantity(v);
    return {
      ...v,
      price: v.price ? Number(v.price.toString()) : 0,
      compareAtPrice: v.compareAtPrice
        ? Number(v.compareAtPrice.toString())
        : null,
      status: availableQty > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
    };
  });

  return {
    ...product,
    variants: normalizedVariants,
    category: normalizeCategory(product),
    image: sanitizeImageUrl(product.image),
    media: normalizedMedia,
    specs:
      product.specs && product.specs.length > 0
        ? product.specs
        : normalizeSpecs(product),
  } as unknown as Product;
}

function matchesSearch(product: Product, query: string) {
  if (!query) return true;
  const q = query.toLowerCase();
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
    (product as Product & { subCategory?: { name?: string | null } })
      .subCategory?.name ?? ""
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
  const variants = (product.variants ?? []) as RawVariant[];
  const quantity = variants.reduce((sum, variant) => {
    return sum + variantAvailableQuantity(variant);
  }, 0);

  if (stockStatus === "In Stock") {
    return quantity > 0;
  }

  if (stockStatus === "Out of Stock") {
    return quantity <= 0;
  }

  return true;
}

function matchesPrice(
  product: Product,
  minPrice?: string | null,
  maxPrice?: string | null,
) {
  const price = Number(product.variants?.[0]?.price ?? 0);
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
      next.sort(
        (a, b) =>
          Number(b.variants?.[0]?.price ?? 0) -
          Number(a.variants?.[0]?.price ?? 0),
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
        (a, b) =>
          Number(a.variants?.[0]?.price ?? 0) -
          Number(b.variants?.[0]?.price ?? 0),
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

  const filtered = normalizedProducts.filter((product: Product) => {
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
  const filters = buildFilterOptions(filtered);

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
    filters,
  };
}
