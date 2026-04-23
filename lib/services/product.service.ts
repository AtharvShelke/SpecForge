/**
 * product.service.ts — Client-side HTTP service for Products, Variants, and VariantSpecs.
 *
 * 🔥 CRITICAL RELATION FLOWS (client → API → catalog.service.ts → Prisma)
 *   getProducts()       → GET  /api/catalog/products
 *   getProduct(id)      → GET  /api/catalog/products/:id     (returns variants with variantSpecs)
 *   createProduct()     → POST /api/catalog/products          (supports nested variants[].specs[])
 *   updateProduct()     → PATCH /api/catalog/products/:id
 *   deleteProduct()     → DELETE /api/catalog/products/:id
 *   filterProducts()    → POST /api/catalog/products/filter   (AdvancedFilter)
 *   getVariants()       → GET  /api/catalog/products/:id/variants
 *   createVariant()     → POST /api/catalog/products/:id/variants
 *   createSpec()        → POST /api/catalog/specs
 *
 * TYPE CONTRACT
 *   ProductVariant.attributes  — freeform JSON (Record<string,any> | null)
 *   ProductVariant.variantSpecs — typed spec system (VariantSpec[])
 *   Only ONE of valueString / valueNumber / valueBool is set per VariantSpec.
 *   Use SpecDefinition.valueType to determine which field carries the value.
 *
 * AdvancedFilter.filters[].values — always string[], backend coerces for NUMBER specs.
 * CreateVariantSpec.optionId     — used when spec has predefined SpecOptions (dropdown).
 */

import type {
  Product,
  ProductVariant,
  VariantSpec,
  SpecDefinition,
  AdvancedFilter,
  CreateProduct,
  CreateVariant,
  CreateVariantSpec,
  CreateSpecWithOptions,
} from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

const BASE = "/api/catalog";

async function apiFetch<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new ProductServiceError(message, res.status);
  }

  return res.json() as Promise<T>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Error class
// ─────────────────────────────────────────────────────────────────────────────

export class ProductServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "ProductServiceError";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT — List / Get / Create / Update / Delete
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lists all products (unfiltered).
 * Each Product's variants[] will include variantSpecs[] if the backend includes them.
 * For filtered results use filterProducts().
 */
export async function getProducts(): Promise<Product[]> {
  return apiFetch<Product[]>(`${BASE}/products`);
}

/**
 * Fetches a single product by ID.
 * The returned Product always contains:
 *   - variants[].variantSpecs[]   — typed spec values (valueString | valueNumber | valueBool | optionId)
 *   - variants[].attributes       — freeform JSON (separate from variantSpecs)
 *   - subCategory.specDefinitions — the spec schema for filter UI
 */
export async function getProduct(id: string): Promise<Product> {
  return apiFetch<Product>(`${BASE}/products/${id}`);
}

/**
 * Creates a product with optional nested variants and their spec values.
 *
 * 🔥 Deep create flow: Product → Variant → VariantSpec → (SpecDefinition + SpecOption)
 *
 * @example
 * createProduct({
 *   name: "AMD Ryzen 7 7800X3D",
 *   subCategoryId: "<subcategory-id>",
 *   brandId: "<brand-id>",
 *   status: "DRAFT",
 *   variants: [{
 *     sku: "CPU-AMD-7800X3D-BOX",
 *     price: 34999,
 *     attributes: { color: "Black" },     // freeform — still supported
 *     specs: [
 *       { specId: "<socket-spec-id>", optionId: "<am5-option-id>" },  // select-type
 *       { specId: "<cores-spec-id>",  valueNumber: 8 },               // free-entry NUMBER
 *       { specId: "<unlocked-spec>",  valueBool: true },              // BOOLEAN spec
 *     ]
 *   }]
 * })
 */
export async function createProduct(data: CreateProduct): Promise<Product> {
  return apiFetch<Product>(`${BASE}/products`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Partially updates a product's top-level fields.
 * Does NOT update variants or variantSpecs — use createVariant / upsertVariantSpec for those.
 */
export async function updateProduct(
  id: string,
  data: Partial<CreateProduct>
): Promise<Product> {
  return apiFetch<Product>(`${BASE}/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * Soft-deletes a product (sets deletedAt timestamp).
 * All variants under the product are also soft-deleted by the server.
 */
export async function deleteProduct(id: string): Promise<void> {
  await apiFetch<void>(`${BASE}/products/${id}`, { method: "DELETE" });
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT — Advanced Filter
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Filters products using a structured AdvancedFilter object.
 *
 * Filter semantics:
 *   - filters[].specId   — the SpecDefinition to filter on
 *   - filters[].values   — always string[]; backend handles coercion for NUMBER specs
 *   - Multiple filters   → AND (product must match ALL)
 *   - Multiple values    → OR  (within a single spec)
 *
 * All returned Product objects include variants[].variantSpecs[] with full spec + option data.
 *
 * @example
 * filterProducts({
 *   subCategoryId: "<cpu-subcategory-id>",
 *   priceMin: 10000,
 *   priceMax: 50000,
 *   brandId: "<amd-brand-id>",
 *   filters: [
 *     { specId: "<socket-spec-id>", values: ["<am5-option-id>", "<am4-option-id>"] },
 *     { specId: "<tdp-spec-id>",    values: ["120"] },  // number spec → string value
 *   ]
 * })
 */
export async function filterProducts(filter: AdvancedFilter): Promise<Product[]> {
  return apiFetch<Product[]>(`${BASE}/products/filter`, {
    method: "POST",
    body: JSON.stringify(filter),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// VARIANTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lists all variants for a product (deletedAt: null).
 * Each variant includes variantSpecs[] with spec + option details.
 */
export async function getVariants(productId: string): Promise<ProductVariant[]> {
  return apiFetch<ProductVariant[]>(`${BASE}/products/${productId}/variants`);
}

/**
 * Creates a standalone variant under a product with optional nested VariantSpecs.
 *
 * Use this for adding variants after initial product creation.
 * For deep creation alongside the product, embed variants[] in createProduct().
 *
 * 🔥 VariantSpec field rules:
 *   - optionId      → set when spec has predefined SpecOptions (dropdown/checkbox)
 *   - valueString   → set for free-entry STRING specs
 *   - valueNumber   → set for free-entry NUMBER specs (backend stores as Float)
 *   - valueBool     → set for BOOLEAN specs
 *   Only ONE of these should be populated per spec entry.
 */
export async function createVariant(
  productId: string,
  data: CreateVariant
): Promise<ProductVariant> {
  return apiFetch<ProductVariant>(`${BASE}/products/${productId}/variants`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SPECS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a SpecDefinition with optional nested SpecOptions in one call.
 *
 * Flow: SubCategory → SpecDefinition → SpecOption[]
 *
 * Use SpecDefinition.valueType to determine how variantSpecs are stored:
 *   STRING  → VariantSpec.valueString
 *   NUMBER  → VariantSpec.valueNumber
 *   BOOLEAN → VariantSpec.valueBool
 *   (select types additionally set optionId)
 */
export async function createSpec(data: CreateSpecWithOptions): Promise<SpecDefinition> {
  return apiFetch<SpecDefinition>(`${BASE}/specs`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Re-exports for convenience (types only — no runtime cost)
// ─────────────────────────────────────────────────────────────────────────────

export type {
  Product,
  ProductVariant,
  VariantSpec,
  SpecDefinition,
  AdvancedFilter,
  CreateProduct,
  CreateVariant,
  CreateVariantSpec,
  CreateSpecWithOptions,
};
