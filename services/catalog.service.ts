/**
 * catalog.service.ts — Business logic for Categories, SubCategories,
 * CategoryAttributes, AttributeOptions, Products, ProductSpecs, and Brands.
 */

import { prisma } from "@/lib/prisma";
import {
  AdvancedFilter,
  CreateProduct,
  CreateCategoryAttribute,
  UpdateCategoryAttribute,
} from "@/types";
import { serializeProducts } from "@/lib/adminSerializers";
import { ServiceError } from "@/lib/errors";

export class CatalogService {
  // =====================================================
  // PRODUCT
  // =====================================================

  static async getProducts(filter?: AdvancedFilter) {
    const where: any = { deletedAt: null };

    if (filter) {
      const { categoryId, subcategoryId, subCategoryId, brandId, status, priceMin, priceMax } = filter;

      const resolvedSubCategoryId = subcategoryId || (subCategoryId ? Number(subCategoryId) : undefined);
      if (resolvedSubCategoryId) where.subcategoryId = resolvedSubCategoryId;
      
      const resolvedCategoryId = categoryId ? Number(categoryId) : undefined;
      if (resolvedCategoryId) where.categoryId = resolvedCategoryId;

      if (brandId) where.brandId = brandId;
      if (status) where.status = status;

      if (priceMin !== undefined || priceMax !== undefined) {
        where.price = {};
        if (priceMin !== undefined) where.price.gte = priceMin;
        if (priceMax !== undefined) where.price.lte = priceMax;
      }

      if (filter.filters && filter.filters.length > 0) {
        // Match product spec filters
        where.AND = filter.filters.map((f) => {
          return {
            specs: {
              some: {
                attributeId: f.attributeId,
                value: { in: f.values },
              },
            },
          };
        });
      }
    }

    return prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        sku: true,
        price: true,
        compareAtPrice: true,
        stockStatus: true,
        brandId: true,
        categoryId: true,
        subcategoryId: true,
        brand: { select: { id: true, name: true } },
        subcategory: {
          select: {
            id: true,
            name: true,
            category: { select: { id: true, name: true } },
          },
        },
        media: {
          where: { sortOrder: 0 },
          take: 1,
          select: { id: true, url: true, altText: true },
        },
        specs: {
          include: {
            attribute: true,
            option: true,
          },
        },
      },
    });
  }

  static async getProductById(id: string) {
    return prisma.product.findUnique({
      where: { id, deletedAt: null },
      include: {
        brand: true,
        subcategory: {
          include: {
            category: true,
            attributes: {
              include: { options: { orderBy: { sortOrder: "asc" } } },
            },
          },
        },
        category: true,
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
  }

  static async createProduct(data: CreateProduct) {
    return prisma.$transaction(async (tx) => {
      let categoryId = data.categoryId;
      const subcategoryId = data.subcategoryId ? Number(data.subcategoryId) : (data.subCategoryId ? Number(data.subCategoryId) : null);
      
      if (!categoryId && subcategoryId) {
        const sub = await tx.subcategory.findUnique({
          where: { id: subcategoryId },
          select: { categoryId: true },
        });
        if (sub) categoryId = sub.categoryId;
      }

      // Generate unique slug
      let productSlug =
        data.slug ||
        data.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

      const existingSlug = await tx.product.findUnique({
        where: { slug: productSlug },
      });
      if (existingSlug) {
        productSlug = `${productSlug}-${Math.random().toString(36).substring(2, 7)}`;
      }

      // Create Product
      const product = await tx.product.create({
        data: {
          name: data.name,
          slug: productSlug,
          categoryId: categoryId || 1,
          subcategoryId: subcategoryId,
          brandId: data.brandId || null,
          metaTitle: data.metaTitle || null,
          metaDescription: data.metaDescription || null,
          description: data.description || null,
          status: (data.status as any) || "ACTIVE",
          price: data.price || null,
          compareAtPrice: data.compareAtPrice || null,
          sku: data.sku || null,
          stockStatus: data.stockStatus || "IN_STOCK",
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

      // Attach specs (ProductSpec)
      if (data.specs && data.specs.length > 0) {
        for (const spec of data.specs) {
          await tx.productSpec.create({
            data: {
              productId: product.id,
              attributeId: spec.attributeId,
              optionId: spec.optionId || null,
              value: spec.value,
              valueNumber: spec.valueNumber || null,
              valueBoolean: spec.valueBoolean || null,
            },
          });
        }
      }

      return product;
    });
  }

  static async updateProduct(id: string, data: Partial<CreateProduct>) {
    return prisma.$transaction(async (tx) => {
      const existingProduct = await tx.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        throw new ServiceError("Product not found", 404);
      }

      let categoryId = data.categoryId;
      const subcategoryId = data.subcategoryId ? Number(data.subcategoryId) : (data.subCategoryId ? Number(data.subCategoryId) : undefined);
      
      if (!categoryId && subcategoryId) {
        const sub = await tx.subcategory.findUnique({
          where: { id: subcategoryId },
          select: { categoryId: true },
        });
        if (sub) categoryId = sub.categoryId;
      }

      const product = await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          slug: data.slug,
          categoryId: categoryId,
          subcategoryId: subcategoryId,
          brandId: data.brandId,
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          description: data.description,
          status: data.status as any,
          price: data.price,
          compareAtPrice: data.compareAtPrice,
          sku: data.sku,
          stockStatus: data.stockStatus,
        },
      });

      if (data.images !== undefined) {
        await tx.productMedia.deleteMany({
          where: { productId: id },
        });

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

      if (data.specs !== undefined) {
        await tx.productSpec.deleteMany({
          where: { productId: id },
        });

        for (const spec of data.specs) {
          await tx.productSpec.create({
            data: {
              productId: id,
              attributeId: spec.attributeId,
              optionId: spec.optionId || null,
              value: spec.value,
              valueNumber: spec.valueNumber || null,
              valueBoolean: spec.valueBoolean || null,
            },
          });
        }
      }

      return product;
    });
  }

  static async deleteProduct(id: string) {
    try {
      return await prisma.product.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (err: any) {
      if (err.code === "P2025") throw new ServiceError("Product not found", 404);
      throw err;
    }
  }

  // =====================================================
  // DYNAMIC CATEGORY ATTRIBUTES CRUD
  // =====================================================

  static async getAttributes(categoryId?: number, subcategoryId?: number) {
    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (subcategoryId) where.subcategoryId = subcategoryId;

    return prisma.categoryAttribute.findMany({
      where,
      include: {
        options: {
          orderBy: { sortOrder: "asc" },
        },
        category: true,
        subcategory: true,
      },
      orderBy: { sortOrder: "asc" },
    });
  }

  static async getAttributeById(id: string) {
    return prisma.categoryAttribute.findUnique({
      where: { id },
      include: {
        options: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });
  }

  static async createAttribute(data: CreateCategoryAttribute) {
    return prisma.categoryAttribute.create({
      data: {
        categoryId: Number(data.categoryId),
        subcategoryId: data.subcategoryId ? Number(data.subcategoryId) : null,
        key: data.key,
        label: data.label,
        type: data.type as any,
        isRequired: data.isRequired ?? false,
        isFilterable: data.isFilterable ?? true,
        isComparable: data.isComparable ?? true,
        filterType: data.filterType as any,
        unit: data.unit || null,
        helpText: data.helpText || null,
        sortOrder: data.sortOrder ?? 0,
        options:
          data.options && data.options.length > 0
            ? {
                create: data.options.map((opt, idx) => ({
                  value: opt.value,
                  slug: opt.slug || opt.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                  sortOrder: opt.sortOrder ?? idx,
                  metadata: opt.metadata || undefined,
                })),
              }
            : undefined,
      },
      include: {
        options: true,
      },
    });
  }

  static async updateAttribute(id: string, data: UpdateCategoryAttribute) {
    return prisma.$transaction(async (tx) => {
      await tx.categoryAttribute.update({
        where: { id },
        data: {
          key: data.key,
          label: data.label,
          type: data.type as any,
          isRequired: data.isRequired,
          isFilterable: data.isFilterable,
          isComparable: data.isComparable,
          filterType: data.filterType as any,
          unit: data.unit,
          helpText: data.helpText,
          sortOrder: data.sortOrder,
        },
      });

      if (data.options !== undefined) {
        // Delete options not in the update payload
        const activeOptionIds = data.options
          .map((o) => o.id)
          .filter(Boolean) as string[];

        await tx.attributeOption.deleteMany({
          where: {
            attributeId: id,
            id: { notIn: activeOptionIds },
          },
        });

        // Upsert options
        for (const [index, opt] of data.options.entries()) {
          const optSlug = opt.slug || opt.value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          if (opt.id) {
            await tx.attributeOption.update({
              where: { id: opt.id },
              data: {
                value: opt.value,
                slug: optSlug,
                sortOrder: opt.sortOrder ?? index,
                metadata: opt.metadata || undefined,
              },
            });
          } else {
            await tx.attributeOption.create({
              data: {
                attributeId: id,
                value: opt.value,
                slug: optSlug,
                sortOrder: opt.sortOrder ?? index,
                metadata: opt.metadata || undefined,
              },
            });
          }
        }
      }

      return tx.categoryAttribute.findUnique({
        where: { id },
        include: { options: true },
      });
    });
  }

  static async deleteAttribute(id: string) {
    return prisma.categoryAttribute.delete({
      where: { id },
    });
  }

  // =====================================================
  // CATEGORIES & BRANDS (Helpers for UI)
  // =====================================================

  static async getCategories() {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
        slug: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        subcategories: {
          where: { isActive: true },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            categoryId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  static async getSubCategories(categoryId?: string, _builderEnabled?: boolean) {
    const where: any = { isActive: true };
    if (categoryId) where.categoryId = Number(categoryId);

    return prisma.subcategory.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { name: "asc" },
    });
  }

  static async getBrands() {
    return prisma.brand.findMany({
      orderBy: { name: "asc" },
    });
  }

  // =====================================================
  // SPEC DEFINITIONS (mapped to CategoryAttribute)
  // =====================================================

  static async getSpecs(subcategoryId?: string) {
    const where: any = {};
    if (subcategoryId) where.subcategoryId = Number(subcategoryId);

    return prisma.categoryAttribute.findMany({
      where,
      include: {
        options: { orderBy: { sortOrder: "asc" } },
        category: true,
        subcategory: true,
      },
      orderBy: { sortOrder: "asc" },
    });
  }

  static async createSpec(data: any) {
    return prisma.categoryAttribute.create({
      data: {
        categoryId: Number(data.categoryId),
        subcategoryId: data.subcategoryId ? Number(data.subcategoryId) : null,
        key: data.key || data.name?.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
        label: data.label || data.name,
        type: data.type || "text",
        isRequired: data.isRequired ?? false,
        isFilterable: data.isFilterable ?? true,
        isComparable: data.isComparable ?? true,
        filterType: data.filterType || "checkbox",
        unit: data.unit || null,
        helpText: data.helpText || null,
        sortOrder: data.sortOrder ?? 0,
      },
      include: { options: true },
    });
  }

  static async getSpecOptions(attributeId: string) {
    return prisma.attributeOption.findMany({
      where: { attributeId },
      orderBy: { sortOrder: "asc" },
    });
  }

  // =====================================================
  // CATEGORY HIERARCHY
  // =====================================================

  static async getCategoryHierarchy() {
    const roots = await prisma.categoryHierarchy.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: "asc" },
      include: {
        category: true,
        children: {
          orderBy: { sortOrder: "asc" },
          include: {
            category: true,
            children: {
              orderBy: { sortOrder: "asc" },
              include: {
                category: true,
                children: {
                  orderBy: { sortOrder: "asc" },
                  include: { category: true },
                },
              },
            },
          },
        },
      },
    });
    return roots;
  }
}

// =====================================================
// STANDALONE EXPORTS (used by API routes that import by name)
// =====================================================

export async function createCategory(data: any) {
  return prisma.category.create({
    data: {
      code: data.code,
      name: data.name,
      slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: data.description || null,
      image: data.image || null,
      icon: data.icon || null,
      displayOrder: data.displayOrder ?? 0,
      isActive: data.isActive ?? true,
    },
  });
}

export async function getCatalogListing(filter: AdvancedFilter) {
  return CatalogService.getProducts(filter);
}

export async function updateSpec(id: string, data: any) {
  return prisma.categoryAttribute.update({
    where: { id },
    data: {
      key: data.key,
      label: data.label,
      type: data.type,
      isRequired: data.isRequired,
      isFilterable: data.isFilterable,
      isComparable: data.isComparable,
      filterType: data.filterType,
      unit: data.unit,
      helpText: data.helpText,
      sortOrder: data.sortOrder,
    },
    include: { options: true },
  });
}

export async function deleteSpec(id: string) {
  return prisma.categoryAttribute.delete({
    where: { id },
  });
}

export async function createSubCategory(data: any) {
  return prisma.subcategory.create({
    data: {
      categoryId: Number(data.categoryId),
      name: data.name,
      slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: data.description || null,
      image: data.image || null,
      isActive: data.isActive ?? true,
    },
    include: { category: true },
  });
}

export async function updateSubCategory(id: string, data: any) {
  return prisma.subcategory.update({
    where: { id: Number(id) },
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      image: data.image,
      isActive: data.isActive,
    },
    include: { category: true },
  });
}

export async function getCategoryById(id: string) {
  const category = await prisma.category.findUnique({
    where: { id: Number(id) },
    include: {
      subcategories: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
      attributes: {
        include: { options: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!category) throw new ServiceError("Category not found", 404);
  return category;
}

export async function updateCategory(id: string, data: any) {
  try {
    return await prisma.category.update({
      where: { id: Number(id) },
      data: {
        name: data.name,
        code: data.code,
        slug: data.slug,
        description: data.description,
        image: data.image,
        icon: data.icon,
        displayOrder: data.displayOrder,
        isActive: data.isActive,
      },
    });
  } catch (err: any) {
    if (err.code === "P2025") throw new ServiceError("Category not found", 404);
    throw err;
  }
}

export async function deleteCategory(id: string) {
  try {
    return await prisma.category.delete({
      where: { id: Number(id) },
    });
  } catch (err: any) {
    if (err.code === "P2025") throw new ServiceError("Category not found", 404);
    throw err;
  }
}
