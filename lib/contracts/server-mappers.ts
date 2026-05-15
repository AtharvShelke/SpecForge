import { Prisma } from "@/generated/prisma/client";
import type {
  BuildSequenceItem,
  Category,
  CategoryAttributeDefinition,
  CategoryAttributesConfig,
  CategoryDefinition,
  Order,
  OrderItem,
  OrdersResponse,
  Product,
  ProductsResponse,
} from "@/lib/contracts/dtos";

export const categorySelect = Prisma.validator<Prisma.CategorySelect>()({
  id: true,
  code: true,
  name: true,
  slug: true,
  shortLabel: true,
  description: true,
  image: true,
  icon: true,
  displayOrder: true,
  featuredOrder: true,
  isActive: true,
  showInFeatured: true,
  createdAt: true,
  updatedAt: true,
});

export const baseProductInclude = Prisma.validator<Prisma.ProductInclude>()({
  category: {
    select: {
      id: true,
      code: true,
      name: true,
      slug: true,
      shortLabel: true,
      description: true,
      image: true,
      icon: true,
      displayOrder: true,
      featuredOrder: true,
      isActive: true,
      showInFeatured: true,
      createdAt: true,
      updatedAt: true,
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
      partNumber: true,
      serialNumber: true,
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
    orderBy: { sortOrder: "asc" },
  },
});

export const fullProductInclude = Prisma.validator<Prisma.ProductInclude>()({
  ...baseProductInclude,
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
});

export type ProductRow = Prisma.ProductGetPayload<{
  include: typeof fullProductInclude;
}>;

export type ProductBaseRow = Prisma.ProductGetPayload<{
  include: typeof baseProductInclude;
}>;

type CategoryWithSequence = Prisma.CategoryGetPayload<{
  select: typeof categorySelect & {
    buildSequence: { select: { stepOrder: true } };
  };
}>;

type BuildSequenceRow = Prisma.BuildSequenceGetPayload<{
  select: {
    id: true;
    categoryId: true;
    stepOrder: true;
    createdAt: true;
    updatedAt: true;
    category: { select: typeof categorySelect };
  };
}>;

type CategoryAttributesRow = Prisma.CategoryGetPayload<{
  include: {
    attributes: {
      include: {
        dependencyAttribute: { select: { key: true } };
        dependencyOption: { select: { value: true } };
        options: {
          select: { value: true };
          orderBy: { sortOrder: "asc" };
        };
      };
    };
  };
}>;

type OrderRow = Prisma.OrderGetPayload<{
  select: {
    id: true;
    channel: true;
    customerName: true;
    email: true;
    phone: true;
    date: true;
    subtotal: true;
    gstAmount: true;
    taxAmount: true;
    discountAmount: true;
    total: true;
    status: true;
    version: true;
    customerId: true;
    paymentMethod: true;
    paymentStatus: true;
    shippingStreet: true;
    shippingCity: true;
    shippingState: true;
    shippingZip: true;
    shippingCountry: true;
    source: true;
    createdAt: true;
    updatedAt: true;
    items: {
      select: {
        id: true;
        orderId: true;
        productId: true;
        name: true;
        categoryId: true;
        price: true;
        quantity: true;
        image: true;
        sku: true;
        assignedUnits: {
          select: {
            id: true;
            inventoryItemId: true;
            serialNumber: true;
            partNumber: true;
          };
        };
      };
    };
    logs: {
      select: {
        id: true;
        orderId: true;
        status: true;
        timestamp: true;
        note: true;
      };
    };
  };
}>;

export function mapCategoryDefinition(
  category: Pick<
    Category,
    | "id"
    | "code"
    | "name"
    | "slug"
    | "shortLabel"
    | "description"
    | "image"
    | "icon"
    | "displayOrder"
    | "featuredOrder"
    | "isActive"
    | "showInFeatured"
    | "createdAt"
    | "updatedAt"
  >,
  stepOrder: number | null
): CategoryDefinition {
  return {
    ...category,
    label: category.name,
    stepOrder,
    isInBuildSequence: stepOrder != null,
  };
}

export function mapCategoryWithSequence(
  category: CategoryWithSequence
): CategoryDefinition {
  return mapCategoryDefinition(
    {
      ...category,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    },
    category.buildSequence?.stepOrder ?? null
  );
}

export function mapBuildSequenceItem(entry: BuildSequenceRow): BuildSequenceItem {
  return {
    id: entry.id,
    categoryId: entry.categoryId,
    stepOrder: entry.stepOrder,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    category: mapCategoryDefinition(entry.category, entry.stepOrder),
  };
}

export function mapCategoryAttributesConfig(
  category: CategoryAttributesRow
): CategoryAttributesConfig {
  const deduped = Array.from(
    category.attributes.reduce((map, attribute) => {
      if (!map.has(attribute.key)) {
        map.set(attribute.key, attribute);
      }
      return map;
    }, new Map<string, CategoryAttributesRow["attributes"][number]>()).values()
  );

  const attributes: CategoryAttributeDefinition[] = deduped.map((attribute) => ({
    id: attribute.id,
    key: attribute.key,
    label: attribute.label,
    type: attribute.type,
    required: attribute.isRequired,
    options: attribute.options.map((option) => option.value),
    unit: attribute.unit ?? undefined,
    sortOrder: attribute.sortOrder,
    categoryId: category.id,
    categoryCode: category.code,
    dependencyKey: attribute.dependencyAttribute?.key ?? undefined,
    dependencyValue: attribute.dependencyOption?.value ?? undefined,
    isFilterable: attribute.isFilterable,
    isComparable: attribute.isComparable,
    filterType: attribute.filterType,
    helpText: attribute.helpText,
  }));

  return {
    id: `attributes-${category.id}`,
    categoryCode: category.code,
    category: category.code,
    categoryDefinition: {
      id: category.id,
      code: category.code,
      slug: category.slug,
      name: category.name,
      label: category.name,
      shortLabel: category.shortLabel,
    },
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
    attributes,
  };
}

export function mapProduct(
  product: ProductRow | ProductBaseRow
): Product {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    metaTitle: product.metaTitle ?? undefined,
    metaDescription: product.metaDescription ?? undefined,
    categoryId: product.categoryId,
    category: product.category
      ? {
          ...product.category,
          label: product.category.name,
        }
      : undefined,
    description: product.description ?? undefined,
    status: product.status,
    deletedAt: product.deletedAt ?? undefined,
    version: product.version,
    brandId: product.brandId ?? undefined,
    brand: product.brand ?? undefined,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    sku: product.sku,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? undefined,
    stockStatus: product.stockStatus,
    specs: "specs" in product
      ? product.specs.map((spec) => ({
          id: spec.id,
          productId: spec.productId,
          attributeId: spec.attributeId,
          optionId: spec.optionId,
          key: spec.attribute?.key ?? "",
          value: spec.value,
          valueNumber: spec.valueNumber ?? undefined,
          valueBoolean: spec.valueBoolean ?? undefined,
          isHighlighted: spec.isHighlighted,
        }))
      : [],
    inventoryItems: product.inventoryItems.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      reserved: item.reserved,
      partNumber: item.partNumber ?? undefined,
      serialNumber: item.serialNumber ?? undefined,
      reorderLevel: item.reorderLevel,
      costPrice: item.costPrice,
      location: item.location,
      lastUpdated: item.lastUpdated,
    })),
    media: product.media,
    tags: "tags" in product ? product.tags : [],
  };
}

export function mapOrderItem(
  item: OrderRow["items"][number]
): OrderItem {
  return {
    id: item.id,
    orderId: item.orderId,
    productId: item.productId,
    name: item.name,
    categoryId: item.categoryId,
    price: item.price,
    quantity: item.quantity,
    image: item.image ?? undefined,
    sku: item.sku ?? undefined,
    assignedUnits: item.assignedUnits,
  };
}

export function mapOrder(order: OrderRow): Order {
  return {
    id: order.id,
    channel: order.channel,
    customerName: order.customerName,
    email: order.email,
    phone: order.phone ?? undefined,
    date: order.date,
    subtotal: order.subtotal,
    gstAmount: order.gstAmount,
    taxAmount: order.taxAmount,
    discountAmount: order.discountAmount,
    total: order.total,
    status: order.status,
    version: order.version,
    customerId: order.customerId ?? undefined,
    shippingStreet: order.shippingStreet ?? undefined,
    shippingCity: order.shippingCity ?? undefined,
    shippingState: order.shippingState ?? undefined,
    shippingZip: order.shippingZip ?? undefined,
    shippingCountry: order.shippingCountry ?? undefined,
    paymentMethod: order.paymentMethod ?? undefined,
    paymentTransactionId: undefined,
    paymentStatus: order.paymentStatus ?? undefined,
    source: order.source ?? undefined,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: order.items.map(mapOrderItem),
    logs: order.logs,
  };
}

export function buildProductsResponse(
  products: Array<ProductRow | ProductBaseRow>,
  total: number,
  page: number,
  limit: number,
  filterOptions?: unknown
): ProductsResponse {
  return {
    products: products.map(mapProduct),
    total,
    page,
    limit,
    filterOptions,
  };
}

export function buildOrdersResponse(
  orders: OrderRow[],
  total: number,
  page: number,
  limit: number
): OrdersResponse {
  return {
    orders: orders.map(mapOrder),
    total,
    page,
    limit,
  };
}
