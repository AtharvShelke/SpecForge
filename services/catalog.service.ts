/**
 * catalog.service.ts — Business logic for Categories, SubCategories,
 * SpecDefinitions, SpecOptions, Products, Variants, VariantSpecs, and Brands.
 *
 * 🔥 CRITICAL RELATION FLOWS
 * 1. Product Creation:  Product → Variant → VariantSpec → SpecDefinition
 * 2. Filtering:         SubCategory → SpecDefinition → SpecOption → VariantSpec
 * 3. Compatibility:     SpecDefinition → CompatibilityRule → Build → Check
 */

import { prisma } from "@/lib/prisma";
import {
  AdvancedFilter,
  CreateProduct,
  CreateSpecWithOptions,
  CreateVariant,
  CreateVariantSpec,
} from "@/types";
import { serializeProducts } from "@/lib/adminSerializers";
import { buildDynamicCatalogResult } from "@/lib/dynamicCatalogFilters";
import { ServiceError } from "@/lib/errors";
export class CatalogService {
  // =====================================================
  // PRODUCT
  // =====================================================

  static async getProducts(filter?: AdvancedFilter) {
    if (!filter) {
      return prisma.product.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          brandId: true,
          subCategoryId: true,
          brand: { select: { id: true, name: true } },
          subCategory: { 
            select: { 
              id: true, 
              name: true, 
              category: { select: { id: true, name: true } } 
            } 
          },
          media: { 
            where: { sortOrder: 0 },
            take: 1,
            select: { id: true, url: true, altText: true } 
          },
          variants: {
            where: { deletedAt: null },
            select: {
              id: true,
              price: true,
              compareAtPrice: true,
              status: true,
            },
            orderBy: { price: "asc" },
          },
        },
      });
    }

    // Advanced Filtering
    const { subCategoryId, filters, priceMin, priceMax, brandId, status } =
      filter;

    // Build Prisma query dynamically
    const where: any = { deletedAt: null };

    if (subCategoryId) where.subCategoryId = subCategoryId;
    if (brandId) where.brandId = brandId;
    if (status) where.status = status;

    // Filter by Price or Specs needs to be inside variants
    let variantFilter: any = {};
    if (priceMin !== undefined || priceMax !== undefined) {
      variantFilter.price = {};
      if (priceMin !== undefined) variantFilter.price.gte = priceMin;
      if (priceMax !== undefined) variantFilter.price.lte = priceMax;
    }

    if (filters && filters.length > 0) {
      // Must match ALL spec filters (AND)
      variantFilter.AND = filters.map((f) => {
        // If values array has items, they must match AT LEAST ONE value in the spec (OR logic within the specific spec)
        // Since we are matching VariantSpec, we check if the variant has a VariantSpec with specId and optionId IN values
        return {
          variantSpecs: {
            some: {
              specId: f.specId,
              optionId: { in: f.values },
            },
          },
        };
      });
    }

    if (Object.keys(variantFilter).length > 0) {
      where.variants = { some: variantFilter };
    }

    return prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        brandId: true,
        subCategoryId: true,
        brand: { select: { id: true, name: true } },
        subCategory: { 
          select: { 
            id: true, 
            name: true, 
            category: { select: { id: true, name: true } } 
          } 
        },
        media: { 
          where: { sortOrder: 0 },
          take: 1,
          select: { id: true, url: true, altText: true } 
        },
        variants: {
          where: { deletedAt: null },
          select: {
            id: true,
            price: true,
            compareAtPrice: true,
            status: true,
          },
          orderBy: { price: "asc" },
        },
      },
    });
  }

  static async getProductById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          include: {
            variantSpecs: {
              include: {
                spec: true,
                option: true,
              },
            },
            inventoryItems: true,
          },
        },
        brand: true,
        subCategory: { include: { category: true } },
        media: { orderBy: { sortOrder: "asc" } },
      },
    });
  }

  static async createProduct(data: CreateProduct) {
    return prisma.$transaction(async (tx) => {
      // Create Product
      const product = await tx.product.create({
        data: {
          name: data.name,
          slug:
            data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          subCategoryId: data.subCategoryId,
          brandId: data.brandId,
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          description: data.description,
          status: (data.status as any) || "ACTIVE",
          media:
            data.images && data.images.length > 0
              ? {
                  create: data.images.map((url, index) => ({
                    url,
                    sortOrder: index,
                  })),
                }
              : undefined,
        },
      });

      // Attach Variants
      if (data.variants && data.variants.length > 0) {
        for (const variantData of data.variants) {
          const variant = await tx.productVariant.create({
            data: {
              productId: product.id,
              sku: variantData.sku,
              price: variantData.price,
              compareAtPrice: variantData.compareAtPrice,
              attributes: variantData.attributes || {},
              status: (variantData.status as any) || "IN_STOCK",
            },
          });

          // Attach VariantSpecs
          if (variantData.specs && variantData.specs.length > 0) {
            for (const specData of variantData.specs) {
              await tx.variantSpec.create({
                data: {
                  variantId: variant.id,
                  specId: specData.specId,
                  optionId: specData.optionId,
                  valueString: specData.valueString,
                  valueNumber: specData.valueNumber,
                  valueBool: specData.valueBool,
                },
              });
            }
          }
        }
      }

      return product;
    });
  }

  static async updateProduct(id: string, data: Partial<CreateProduct>) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          subCategoryId: data.subCategoryId,
          brandId: data.brandId,
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          description: data.description,
          status: data.status as any,
          slug: data.slug,
        },
      });

      if (data.images !== undefined) {
        await tx.productMedia.deleteMany({ where: { productId: id } });
        if (data.images.length > 0) {
          await tx.productMedia.createMany({
            data: data.images.map((url, index) => ({
              productId: id,
              url,
              sortOrder: index,
            })),
          });
        }
      }

      return product;
    });
  }

  static async deleteProduct(id: string) {
    return prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // =====================================================
  // VARIANTS
  // =====================================================

  static async createVariant(productId: string, data: CreateVariant) {
    return prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.create({
        data: {
          productId,
          sku: data.sku,
          price: data.price,
          compareAtPrice: data.compareAtPrice,
          attributes: data.attributes || {},
          status: (data.status as any) || "IN_STOCK",
        },
      });

      if (data.specs && data.specs.length > 0) {
        for (const specData of data.specs) {
          await tx.variantSpec.create({
            data: {
              variantId: variant.id,
              specId: specData.specId,
              optionId: specData.optionId,
              valueString: specData.valueString,
              valueNumber: specData.valueNumber,
              valueBool: specData.valueBool,
            },
          });
        }
      }
      return variant;
    });
  }

  static async getVariants(productId: string) {
    return prisma.productVariant.findMany({
      where: { productId, deletedAt: null },
      include: {
        variantSpecs: {
          include: {
            spec: true,
            option: true,
          },
        },
      },
    });
  }

  static async getVariantById(id: string) {
    return prisma.productVariant.findUnique({
      where: { id },
      include: {
        variantSpecs: {
          include: {
            spec: true,
            option: true,
          },
        },
      },
    });
  }

  // =====================================================
  // SPECS
  // =====================================================

  static async getSpecs(subCategoryId?: string) {
    if (!subCategoryId) {
      return prisma.specDefinition.findMany({
        orderBy: [{ filterOrder: "asc" }, { name: "asc" }],
        select: {
          id: true,
          subCategoryId: true,
          name: true,
          valueType: true,
          isFilterable: true,
          isRange: true,
          isMulti: true,
          filterGroup: true,
          filterOrder: true,
        },
      });
    }

    return prisma.specDefinition.findMany({
      where: { subCategoryId },
      orderBy: [{ filterOrder: "asc" }, { name: "asc" }],
      include: {
        options: {
          orderBy: { order: "asc" },
          include: {
            childOptionDeps: {
              include: {
                parentSpec: true,
                parentOption: true,
              },
            },
          },
        },
        childOptionDeps: {
          include: {
            parentSpec: true,
            parentOption: true,
            childOption: true,
          },
        },
      },
    });
  }

  static async createSpec(data: CreateSpecWithOptions) {
    return prisma.$transaction(async (tx) => {
      const spec = await tx.specDefinition.create({
        data: {
          subCategoryId: data.subCategoryId,
          name: data.name,
          valueType: data.valueType as any,
          isFilterable: data.isFilterable ?? true,
          isRange: data.isRange ?? false,
          isMulti: data.isMulti ?? false,
          filterGroup: data.filterGroup,
          filterOrder: data.filterOrder,
        },
      });

      if (data.options && data.options.length > 0) {
        for (const [index, opt] of data.options.entries()) {
          await tx.specOption.create({
            data: {
              specId: spec.id,
              value: opt.value,
              label: opt.label || opt.value,
              order: opt.order ?? index,
            },
          });
        }
      }

      return spec;
    });
  }

  static async getSpecOptions(specId: string) {
    return prisma.specOption.findMany({
      where: { specId },
      orderBy: { order: "asc" },
    });
  }

  // =====================================================
  // CATEGORIES & BRANDS (Helper for UI)
  // =====================================================

  static async getCategories() {
    return prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        subCategories: {
          where: { deletedAt: null },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            description: true,
            categoryId: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
          },
        },
      },
    });
  }

  static async getSubCategories(categoryId?: string) {
    return prisma.subCategory.findMany({
      where: categoryId ? { categoryId, deletedAt: null } : { deletedAt: null },
      include: { category: true },
    });
  }

  static async getBrands() {
    const brands = await prisma.brand.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    if (brands.length === 0) return brands;

    const uniqueCategoryPairs = await prisma.product.findMany({
      where: {
        deletedAt: null,
        brandId: { in: brands.map((brand) => brand.id) },
      },
      distinct: ["brandId", "subCategoryId"],
      select: {
        brandId: true,
        subCategory: {
          select: {
            category: {
              select: { name: true },
            },
          },
        },
      },
    });

    const categoriesByBrandId = uniqueCategoryPairs.reduce<
      Map<string, Set<string>>
    >((map, product) => {
      if (!product.brandId) return map;
      const categoryName = product.subCategory?.category?.name;
      if (!categoryName) return map;
      const set = map.get(product.brandId) ?? new Set<string>();
      set.add(categoryName);
      map.set(product.brandId, set);
      return map;
    }, new Map<string, Set<string>>());

    return brands.map((brand) => ({
      ...brand,
      categories: Array.from(categoriesByBrandId.get(brand.id) ?? []),
    }));
  }

  /**
   * Fetches the full CategoryHierarchy tree (root nodes with recursive children).
   * Limited to 5 levels of nesting to prevent runaway rendering on malformed data.
   * Returns nodes sorted by sortOrder at every level.
   */
  static async getCategoryHierarchy() {
    // Build a 5-level deep include for recursive children
    const childrenInclude = (depth: number): any => {
      if (depth <= 0) return { category: true };
      return {
        category: true,
        children: {
          orderBy: { sortOrder: "asc" as const },
          include: childrenInclude(depth - 1),
        },
      };
    };

    return prisma.categoryHierarchy.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: "asc" },
      include: childrenInclude(4), // 4 more levels below root = 5 total
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BRANDS
// ─────────────────────────────────────────────────────────────────────────────

export async function listBrands() {
  return prisma.brand.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });
}

export async function createBrand(data: { name: string; slug?: string }) {
  if (!data.name) throw new ServiceError("Name is required");

  const slug =
    data.slug ||
    data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  try {
    return await prisma.brand.create({ data: { name: data.name, slug } });
  } catch (err: any) {
    if (err.code === "P2002")
      throw new ServiceError("Brand or slug already exists", 409);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────

export async function listCategories() {
  return prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { subCategories: true },
  });
}

export async function getCategoryById(id: string) {
  const category = await prisma.category.findUnique({
    where: { id, deletedAt: null },
    include: { subCategories: true },
  });
  if (!category) throw new ServiceError("Category not found", 404);
  return category;
}

export async function createCategory(data: {
  name: string;
  description?: string;
}) {
  if (!data.name) throw new ServiceError("Name is required");

  const existing = await prisma.category.findUnique({
    where: { name: data.name },
  });
  if (existing) throw new ServiceError("Category already exists", 409);

  return prisma.category.create({
    data: { name: data.name, description: data.description },
  });
}

export async function updateCategory(
  id: string,
  data: { name?: string; description?: string },
) {
  try {
    return await prisma.category.update({
      where: { id },
      data: { name: data.name, description: data.description },
    });
  } catch (err: any) {
    if (err.code === "P2025") throw new ServiceError("Category not found", 404);
    throw err;
  }
}

export async function deleteCategory(id: string) {
  try {
    return await prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  } catch (err: any) {
    if (err.code === "P2025") throw new ServiceError("Category not found", 404);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBCATEGORIES
// ─────────────────────────────────────────────────────────────────────────────

export async function listSubCategories(categoryId?: string) {
  const where: any = { deletedAt: null };
  if (categoryId) where.categoryId = categoryId;

  return prisma.subCategory.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });
}

export async function createSubCategory(data: {
  name: string;
  description?: string;
  categoryId: string;
}) {
  if (!data.name || !data.categoryId)
    throw new ServiceError("Name and categoryId are required");

  const existing = await prisma.subCategory.findUnique({
    where: {
      categoryId_name: { categoryId: data.categoryId, name: data.name },
    },
  });
  if (existing)
    throw new ServiceError("Subcategory already exists in this category", 409);

  return prisma.subCategory.create({
    data: {
      name: data.name,
      description: data.description,
      categoryId: data.categoryId,
    },
  });
}

export async function updateSubCategory(
  id: string,
  data: {
    name?: string;
    description?: string;
    isBuilderEnabled?: boolean;
    isCore?: boolean;
    isRequired?: boolean;
    allowMultiple?: boolean;
    builderOrder?: number;
    icon?: string | null;
    shortLabel?: string | null;
  },
) {
  try {
    return await prisma.subCategory.update({
      where: { id },
      data,
    });
  } catch (err: any) {
    if (err.code === "P2025")
      throw new ServiceError("SubCategory not found", 404);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SPEC DEFINITIONS (with nested options create)
// ─────────────────────────────────────────────────────────────────────────────

export async function listSpecs(subCategoryId?: string) {
  const query: any = {
    include: { options: { orderBy: { order: "asc" } } },
  };
  if (subCategoryId) query.where = { subCategoryId };
  return prisma.specDefinition.findMany(query);
}

/**
 * Creates a SpecDefinition with optional nested SpecOptions in one call.
 * Flow: SubCategory → SpecDefinition → SpecOption
 */
export async function createSpec(data: CreateSpecWithOptions) {
  if (!data.subCategoryId || !data.name || !data.valueType)
    throw new ServiceError("subCategoryId, name, and valueType are required");

  const existing = await prisma.specDefinition.findUnique({
    where: {
      subCategoryId_name: {
        subCategoryId: data.subCategoryId,
        name: data.name,
      },
    },
  });
  if (existing)
    throw new ServiceError(
      "Spec definition already exists for this subcategory",
      409,
    );

  const createData: any = {
    subCategoryId: data.subCategoryId,
    name: data.name,
    valueType: data.valueType as any,
    isFilterable: data.isFilterable ?? true,
    isRange: data.isRange ?? false,
    isMulti: data.isMulti ?? false,
    filterGroup: data.filterGroup,
    filterOrder: data.filterOrder,
  };

  // Nested create of options if provided
  if (data.options && data.options.length > 0) {
    createData.options = {
      create: data.options.map((opt, idx) => ({
        value: opt.value,
        label: opt.label,
        order: opt.order ?? idx,
      })),
    };
  }

  return prisma.specDefinition.create({
    data: createData,
    include: { options: true },
  });
}

export async function updateSpec(
  id: string,
  data: {
    name?: string;
    valueType?: string;
    isFilterable?: boolean;
    isRange?: boolean;
    isMulti?: boolean;
    filterGroup?: string | null;
    filterOrder?: number | null;
    options?: Array<{
      id?: string;
      value: string;
      label?: string;
      order?: number;
    }>;
    dependencies?: Array<{
      parentSpecId: string;
      parentOptionValue: string;
      childOptionValue?: string | null;
    }>;
  },
) {
  const existing = await prisma.specDefinition.findUnique({
    where: { id },
    include: {
      options: {
        orderBy: { order: "asc" },
        include: {
          variantSpecs: true,
          childOptionDeps: true,
          parentOptionDeps: true,
        },
      },
      childOptionDeps: true,
    },
  });

  if (!existing) {
    throw new ServiceError("SpecDefinition not found", 404);
  }

  return prisma.$transaction(async (tx) => {
    await tx.specDefinition.update({
      where: { id },
      data: {
        name: data.name,
        valueType: data.valueType as any,
        isFilterable: data.isFilterable,
        isRange: data.isRange,
        isMulti: data.isMulti,
        filterGroup: data.filterGroup,
        filterOrder: data.filterOrder,
      },
    });

    const currentOptions = await tx.specOption.findMany({
      where: { specId: id },
      orderBy: { order: "asc" },
      include: {
        variantSpecs: true,
        childOptionDeps: true,
        parentOptionDeps: true,
      },
    });

    const submittedOptions = data.options ?? [];
    const seenOptionIds = new Set<string>();
    const nextOptionIdsByValue = new Map<string, string>();

    for (const [index, option] of submittedOptions.entries()) {
      let saved;
      if (option.id) {
        seenOptionIds.add(option.id);
        saved = await tx.specOption.update({
          where: { id: option.id },
          data: {
            value: option.value,
            label: option.label ?? option.value,
            order: option.order ?? index,
          },
        });
      } else {
        const existingByValue = currentOptions.find(
          (current) => current.value === option.value,
        );
        if (existingByValue) {
          seenOptionIds.add(existingByValue.id);
          saved = await tx.specOption.update({
            where: { id: existingByValue.id },
            data: {
              value: option.value,
              label: option.label ?? option.value,
              order: option.order ?? index,
            },
          });
        } else {
          saved = await tx.specOption.create({
            data: {
              specId: id,
              value: option.value,
              label: option.label ?? option.value,
              order: option.order ?? index,
            },
          });
          seenOptionIds.add(saved.id);
        }
      }

      nextOptionIdsByValue.set(saved.value, saved.id);
    }

    const removableOptions = currentOptions.filter(
      (option) => !seenOptionIds.has(option.id),
    );
    for (const option of removableOptions) {
      if (
        option.variantSpecs.length > 0 ||
        option.childOptionDeps.length > 0 ||
        option.parentOptionDeps.length > 0
      ) {
        throw new ServiceError(
          `Cannot remove option "${option.value}" because it is already used by products or dependencies.`,
          409,
        );
      }

      await tx.specOption.delete({ where: { id: option.id } });
    }

    await tx.specOptionDependency.deleteMany({
      where: {
        OR: [{ childSpecId: id }, { childOption: { specId: id } }],
      },
    });

    for (const dependency of data.dependencies ?? []) {
      const parentOption = await tx.specOption.findFirst({
        where: {
          specId: dependency.parentSpecId,
          value: dependency.parentOptionValue,
        },
      });

      if (!parentOption) {
        throw new ServiceError(
          `Parent option "${dependency.parentOptionValue}" was not found.`,
          400,
        );
      }

      let childOptionId: string | null = null;
      if (dependency.childOptionValue) {
        childOptionId =
          nextOptionIdsByValue.get(dependency.childOptionValue) ?? null;
        if (!childOptionId) {
          const childOption = await tx.specOption.findFirst({
            where: { specId: id, value: dependency.childOptionValue },
          });
          childOptionId = childOption?.id ?? null;
        }
        if (!childOptionId) {
          throw new ServiceError(
            `Child option "${dependency.childOptionValue}" was not found.`,
            400,
          );
        }
      }

      await tx.specOptionDependency.create({
        data: {
          parentSpecId: dependency.parentSpecId,
          parentOptionId: parentOption.id,
          childSpecId: id,
          childOptionId,
        },
      });
    }

    return tx.specDefinition.findUnique({
      where: { id },
      include: {
        options: {
          orderBy: { order: "asc" },
          include: {
            childOptionDeps: {
              include: {
                parentSpec: true,
                parentOption: true,
              },
            },
          },
        },
        childOptionDeps: {
          include: {
            parentSpec: true,
            parentOption: true,
            childOption: true,
          },
        },
      },
    });
  });
}

export async function deleteSpec(id: string) {
  const existing = await prisma.specDefinition.findUnique({
    where: { id },
    include: {
      options: {
        include: {
          variantSpecs: true,
          childOptionDeps: true,
          parentOptionDeps: true,
        },
      },
      variantSpecs: true,
      childOptionDeps: true,
      parentOptionDeps: true,
    },
  });

  if (!existing) {
    throw new ServiceError("SpecDefinition not found", 404);
  }

  if (
    existing.variantSpecs.length > 0 ||
    existing.childOptionDeps.length > 0 ||
    existing.parentOptionDeps.length > 0 ||
    existing.options.some(
      (option) =>
        option.variantSpecs.length > 0 ||
        option.childOptionDeps.length > 0 ||
        option.parentOptionDeps.length > 0,
    )
  ) {
    throw new ServiceError(
      "This filter is already used by products or dependencies and cannot be deleted.",
      409,
    );
  }

  return prisma.$transaction(async (tx) => {
    await tx.specOption.deleteMany({ where: { specId: id } });
    await tx.specDefinition.delete({ where: { id } });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SPEC OPTIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function createSpecOption(data: {
  specId: string;
  value: string;
  label?: string;
  order?: number;
  parentOptionId?: string;
}) {
  if (!data.specId || !data.value)
    throw new ServiceError("specId and value are required");

  return prisma.specOption.create({
    data: {
      specId: data.specId,
      value: data.value,
      label: data.label,
      order: data.order ?? 0,
      parentOptionId: data.parentOptionId,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 🔥 PRODUCTS — Deep relational create
// Product → Variant → VariantSpec → SpecDefinition
// ─────────────────────────────────────────────────────────────────────────────

export async function listProducts(filters?: {
  subCategoryId?: string;
  status?: string;
}) {
  const where: any = { deletedAt: null };
  if (filters?.subCategoryId) where.subCategoryId = filters.subCategoryId;
  if (filters?.status) where.status = filters.status;

  return prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      subCategory: { include: { category: true } },
      brand: true,
      variants: {
        where: { deletedAt: null },
        include: {
          variantSpecs: {
            include: { spec: true, option: true },
          },
        },
      },
      media: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id, deletedAt: null },
    include: {
      subCategory: {
        include: {
          category: true,
          specDefinitions: {
            include: { options: { orderBy: { order: "asc" } } },
          },
        },
      },
      brand: true,
      variants: {
        where: { deletedAt: null },
        include: {
          variantSpecs: { include: { spec: true, option: true } },
        },
      },
      media: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!product) throw new ServiceError("Product not found", 404);
  return product;
}

/**
 * Creates a Product with optional nested Variants and their VariantSpecs.
 *
 * 🔥 Flow: Product → Variant → VariantSpec → (SpecDefinition + SpecOption)
 *
 * Example payload:
 * {
 *   name: "AMD Ryzen 7 7800X3D",
 *   subCategoryId: "...",
 *   brandId: "...",
 *   variants: [{
 *     sku: "CPU-AMD-7800X3D",
 *     price: 34999,
 *     specs: [
 *       { specId: "<socket-spec-id>", optionId: "<am5-option-id>" },
 *       { specId: "<core-count-spec-id>", valueNumber: 8 },
 *       { specId: "<tdp-spec-id>", valueNumber: 120 }
 *     ]
 *   }]
 * }
 */
export async function createProduct(data: CreateProduct) {
  if (!data.name || !data.subCategoryId)
    throw new ServiceError("Name and subCategoryId are required");

  // Validate subCategory exists
  const subCategory = await prisma.subCategory.findUnique({
    where: { id: data.subCategoryId },
    include: { specDefinitions: true },
  });
  if (!subCategory) throw new ServiceError("SubCategory not found", 404);

  // Generate unique slug
  let productSlug =
    data.slug ||
    data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const existingSlug = await prisma.product.findUnique({
    where: { slug: productSlug },
  });
  if (existingSlug) {
    productSlug = `${productSlug}-${Math.random().toString(36).substring(2, 7)}`;
  }

  // Validate variant SKU uniqueness upfront
  if (data.variants && data.variants.length > 0) {
    const skus = data.variants.map((v) => v.sku);
    const duplicateSkus = await prisma.productVariant.findMany({
      where: { sku: { in: skus } },
      select: { sku: true },
    });
    if (duplicateSkus.length > 0) {
      throw new ServiceError(
        `SKU(s) already exist: ${duplicateSkus.map((d) => d.sku).join(", ")}`,
        409,
      );
    }

    // Validate that variant specs reference valid specDefinitions for this subCategory
    const validSpecIds = new Set(subCategory.specDefinitions.map((s) => s.id));
    for (const variant of data.variants) {
      if (variant.specs) {
        for (const spec of variant.specs) {
          if (!validSpecIds.has(spec.specId)) {
            throw new ServiceError(
              `SpecDefinition "${spec.specId}" does not belong to SubCategory "${subCategory.name}"`,
              400,
            );
          }
        }
      }
    }
  }

  // Deep create: Product → Variant → VariantSpec
  const productData: any = {
    name: data.name,
    subCategoryId: data.subCategoryId,
    slug: productSlug,
    brandId: data.brandId,
    metaTitle: data.metaTitle,
    metaDescription: data.metaDescription,
    description: data.description,
    status: (data.status as any) || "DRAFT",
    media:
      data.images && data.images.length > 0
        ? {
            create: data.images.map((url, index) => ({
              url,
              sortOrder: index,
            })),
          }
        : undefined,
  };

  if (data.variants && data.variants.length > 0) {
    productData.variants = {
      create: data.variants.map((v) => ({
        sku: v.sku,
        price: v.price,
        compareAtPrice: v.compareAtPrice,
        attributes: v.attributes,
        status: (v.status as any) || "IN_STOCK",
        variantSpecs:
          v.specs && v.specs.length > 0
            ? {
                create: v.specs.map((s) => ({
                  specId: s.specId,
                  optionId: s.optionId,
                  valueString: s.valueString,
                  valueNumber: s.valueNumber,
                  valueBool: s.valueBool,
                })),
              }
            : undefined,
      })),
    };
  }

  return prisma.product.create({
    data: productData,
    include: {
      subCategory: { include: { category: true } },
      brand: true,
      variants: {
        include: {
          variantSpecs: { include: { spec: true, option: true } },
        },
      },
    },
  });
}

export async function updateProduct(
  id: string,
  data: {
    name?: string;
    slug?: string;
    brandId?: string;
    subCategoryId?: string;
    metaTitle?: string;
    metaDescription?: string;
    description?: string;
    status?: string;
    images?: string[];
  },
) {
  const patch: any = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.slug !== undefined) patch.slug = data.slug;
  if (data.brandId !== undefined) patch.brandId = data.brandId;
  if (data.subCategoryId !== undefined)
    patch.subCategoryId = data.subCategoryId;
  if (data.metaTitle !== undefined) patch.metaTitle = data.metaTitle;
  if (data.metaDescription !== undefined)
    patch.metaDescription = data.metaDescription;
  if (data.description !== undefined) patch.description = data.description;
  if (data.status !== undefined) patch.status = data.status;

  try {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({ where: { id }, data: patch });

      if (data.images !== undefined) {
        await tx.productMedia.deleteMany({ where: { productId: id } });
        if (data.images.length > 0) {
          await tx.productMedia.createMany({
            data: data.images.map((url, index) => ({
              productId: id,
              url,
              sortOrder: index,
            })),
          });
        }
      }

      return product;
    });
  } catch (err: any) {
    if (err.code === "P2025") throw new ServiceError("Product not found", 404);
    throw err;
  }
}

export async function deleteProduct(id: string) {
  try {
    const product = await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await prisma.productVariant.updateMany({
      where: { productId: id },
      data: { deletedAt: new Date() },
    });

    return product;
  } catch (err: any) {
    if (err.code === "P2025") throw new ServiceError("Product not found", 404);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 🔥 FILTERING — SubCategory → SpecDefinition → SpecOption → VariantSpec
// Returns products filtered by spec option values within a subcategory.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gets the filterable spec schema for a subcategory (for building filter UI)
 * Flow: SubCategory → SpecDefinition(isFilterable) → SpecOption
 */
export async function getFilterSchema(subCategoryId: string) {
  if (!subCategoryId) throw new ServiceError("subCategoryId is required");

  return prisma.specDefinition.findMany({
    where: { subCategoryId, isFilterable: true },
    orderBy: [{ filterOrder: "asc" }, { name: "asc" }],
    include: {
      options: {
        orderBy: { order: "asc" },
        include: {
          childOptionDeps: {
            include: {
              parentSpec: true,
              parentOption: true,
            },
          },
        },
      },
      childOptionDeps: {
        include: {
          parentSpec: true,
          parentOption: true,
          childOption: true,
        },
      },
    },
  });
}

export async function getCatalogListing(query: AdvancedFilter) {
  if (!query.subCategoryId) {
    throw new ServiceError("subCategoryId is required");
  }

  const [products, filterSchema] = await Promise.all([
    prisma.product.findMany({
      where: {
        deletedAt: null,
        subCategoryId: query.subCategoryId,
        ...(query.status ? { status: query.status as any } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        subCategory: { include: { category: true } },
        brand: true,
        variants: {
          where: { deletedAt: null },
          include: {
            variantSpecs: { include: { spec: true, option: true } },
            inventoryItems: true,
          },
        },
        media: { orderBy: { sortOrder: "asc" } },
      },
    }),
    getFilterSchema(query.subCategoryId),
  ]);

  const serializedProducts = serializeProducts(products as any[]);
  return buildDynamicCatalogResult({
    products: serializedProducts as any[],
    filterSchema: filterSchema as any[],
    query,
  });
}

/**
 * Advanced Filters products by spec IDs within a subcategory.
 * Flow: SubCategory → SpecDefinition → SpecOption → VariantSpec → Variant → Product
 */
export async function filterProducts(query: AdvancedFilter) {
  if (!query.subCategoryId) throw new ServiceError("subCategoryId is required");

  const where: any = {
    deletedAt: null,
    subCategoryId: query.subCategoryId,
  };

  if (query.brandId) where.brandId = query.brandId;
  if (query.status) where.status = query.status;

  // Build spec-based filter conditions on variants
  if (query.filters && query.filters.length > 0) {
    const specFilters: any[] = [];

    for (const filter of query.filters) {
      if (!filter.values || filter.values.length === 0) continue;

      specFilters.push({
        variants: {
          some: {
            deletedAt: null,
            variantSpecs: {
              some: {
                specId: filter.specId,
                OR: [
                  { option: { value: { in: filter.values } } },
                  { valueString: { in: filter.values } },
                ],
              },
            },
          },
        },
      });
    }

    if (specFilters.length > 0) {
      where.AND = [...(where.AND || []), ...specFilters];
    }
  }

  // Price filter on variants
  if (query.priceMin !== undefined || query.priceMax !== undefined) {
    const priceWhere: any = {};
    if (query.priceMin !== undefined) priceWhere.gte = query.priceMin;
    if (query.priceMax !== undefined) priceWhere.lte = query.priceMax;

    where.AND = [
      ...(where.AND || []),
      {
        variants: {
          some: { deletedAt: null, price: priceWhere },
        },
      },
    ];
  }

  return prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      subCategory: { include: { category: true } },
      brand: true,
      variants: {
        where: { deletedAt: null },
        include: {
          variantSpecs: { include: { spec: true, option: true } },
        },
      },
      media: { orderBy: { sortOrder: "asc" } },
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// VARIANTS (standalone create / update — still available for single-variant ops)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a variant with optional nested specs in one call.
 * Flow: Variant → VariantSpec → (SpecDefinition + SpecOption)
 */
export async function createVariant(productId: string, data: CreateVariant) {
  if (!data.sku || data.price === undefined)
    throw new ServiceError("SKU and price are required");

  const existingSku = await prisma.productVariant.findUnique({
    where: { sku: data.sku },
  });
  if (existingSku) throw new ServiceError("SKU must be unique", 409);

  const variantData: any = {
    productId,
    sku: data.sku,
    price: data.price,
    compareAtPrice: data.compareAtPrice,
    attributes: data.attributes,
    status: (data.status as any) || "IN_STOCK",
  };

  // Deep create: Variant → VariantSpec
  if (data.specs && data.specs.length > 0) {
    variantData.variantSpecs = {
      create: data.specs.map((s) => ({
        specId: s.specId,
        optionId: s.optionId,
        valueString: s.valueString,
        valueNumber: s.valueNumber,
        valueBool: s.valueBool,
      })),
    };
  }

  return prisma.productVariant.create({
    data: variantData,
    include: {
      variantSpecs: { include: { spec: true, option: true } },
    },
  });
}

export async function updateVariant(
  id: string,
  data: {
    sku?: string;
    price?: number;
    compareAtPrice?: number;
    attributes?: any;
    status?: string;
  },
) {
  const patch: any = {};
  if (data.sku !== undefined) patch.sku = data.sku;
  if (data.price !== undefined) patch.price = data.price;
  if (data.compareAtPrice !== undefined)
    patch.compareAtPrice = data.compareAtPrice;
  if (data.attributes !== undefined) patch.attributes = data.attributes;
  if (data.status !== undefined) patch.status = data.status;

  try {
    return await prisma.productVariant.update({ where: { id }, data: patch });
  } catch (err: any) {
    if (err.code === "P2002") throw new ServiceError("SKU must be unique", 409);
    if (err.code === "P2025") throw new ServiceError("Variant not found", 404);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VARIANT SPECS
// ─────────────────────────────────────────────────────────────────────────────

export async function upsertVariantSpec(
  variantId: string,
  data: CreateVariantSpec,
) {
  if (!data.specId) throw new ServiceError("specId is required");

  return prisma.variantSpec.upsert({
    where: {
      variantId_specId: { variantId, specId: data.specId },
    },
    update: {
      optionId: data.optionId,
      valueString: data.valueString,
      valueNumber: data.valueNumber,
      valueBool: data.valueBool,
    },
    create: {
      variantId,
      specId: data.specId,
      optionId: data.optionId,
      valueString: data.valueString,
      valueNumber: data.valueNumber,
      valueBool: data.valueBool,
    },
  });
}
