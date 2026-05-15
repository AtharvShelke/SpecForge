import type { ReactNode } from "react";
import {
  CompatibilityLevel as DomainCompatibilityLevel,
  OrderStatus as DomainOrderStatus,
} from "@/lib/contracts/domain";
import type {
  AttributeInputType,
  Currency,
  FilterType,
  InvoiceStatus,
  InvoiceType,
  OrderPaymentMethod,
  PaymentStatusType,
  PaymentTransactionMethod,
  ProductStatus,
  Role,
  SalesChannel,
  StockMovementType,
  StockStatus,
} from "@/lib/contracts/domain";
import type {
  AssignedInventoryUnit,
  AuditLog,
  BillingProfile,
  Brand,
  BuildGuide,
  BuildGuideItem,
  BuildSequenceItem,
  CartItem,
  Category,
  CategoryAttributeDefinition,
  CategoryAttributesConfig,
  CategoryDefinition,
  CategoryNode,
  CategoryRelationship,
  CheckoutPaymentMethodType,
  CompatibilityIssue,
  CompatibilityReport,
  CreateBrandRequest,
  CreditNote,
  CreditNoteLineItem,
  Customer,
  InventoryItem,
  Invoice,
  InvoiceAuditEvent,
  InvoiceAuditEventType,
  InvoiceLineItem,
  Order,
  OrderItem,
  OrderLog,
  PaymentMethod,
  PaymentTransaction,
  Product,
  ProductMedia,
  ProductSpec,
  ProductSpecScalar,
  ProductSpecsFlat,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  StockMovement,
  Subcategory,
  Supplier,
  Tag,
} from "@/lib/contracts/dtos";

export type {
  AssignedInventoryUnit,
  AttributeInputType,
  AuditLog,
  BillingProfile,
  Brand,
  BuildGuide,
  BuildGuideItem,
  BuildSequenceItem,
  CartItem,
  Category,
  CategoryAttributeDefinition,
  CategoryAttributesConfig,
  CategoryDefinition,
  CategoryNode,
  CategoryRelationship,
  CheckoutPaymentMethodType,
  CompatibilityIssue,
  CompatibilityReport,
  CreateBrandRequest,
  CreditNote,
  CreditNoteLineItem,
  Currency,
  Customer,
  FilterType,
  InventoryItem,
  Invoice,
  InvoiceAuditEvent,
  InvoiceAuditEventType,
  InvoiceLineItem,
  InvoiceStatus,
  InvoiceType,
  Order,
  OrderItem,
  OrderLog,
  OrderPaymentMethod,
  PaymentMethod,
  PaymentStatusType,
  PaymentTransaction,
  PaymentTransactionMethod,
  Product,
  ProductMedia,
  ProductSpec,
  ProductSpecScalar,
  ProductSpecsFlat,
  ProductStatus,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  Role,
  SalesChannel,
  StockMovement,
  StockMovementType,
  StockStatus,
  Subcategory,
  Supplier,
  Tag,
};
export const CompatibilityLevel = DomainCompatibilityLevel;
export type CompatibilityLevel =
  (typeof CompatibilityLevel)[keyof typeof CompatibilityLevel];

export const OrderStatus = DomainOrderStatus;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export function specsToFlat(specs: ProductSpec[]): ProductSpecsFlat {
  const flat: ProductSpecsFlat = {};
  for (const spec of specs) {
    const parsedValue: ProductSpecScalar =
      typeof spec.valueBoolean === "boolean"
        ? spec.valueBoolean
        : typeof spec.valueNumber === "number"
          ? spec.valueNumber
          : Number.isNaN(Number(spec.value))
            ? spec.value
            : Number(spec.value);

    const existingValue = flat[spec.key];
    flat[spec.key] =
      existingValue === undefined
        ? parsedValue
        : Array.isArray(existingValue)
          ? [...existingValue, parsedValue]
          : [existingValue, parsedValue];
  }

  return flat;
}

export function flatToSpecs(flat: ProductSpecsFlat): Partial<ProductSpec>[] {
  const specs: Partial<ProductSpec>[] = [];

  for (const [key, value] of Object.entries(flat)) {
    if (value === undefined || value === "") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        specs.push({ key, value: String(item) });
      }
      continue;
    }

    specs.push({ key, value: String(value) });
  }

  return specs;
}

export function toCartItem(product: Product, quantity = 1): CartItem {
  return {
    ...product,
    quantity,
  };
}

function slugifyLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getOrderItemCategory(item: OrderItem): Category {
  if (item.category && typeof item.category !== "string") {
    return item.category;
  }

  const categoryName =
    typeof item.category === "string" && item.category.trim()
      ? item.category.trim()
      : `Category ${item.categoryId}`;
  const slug = slugifyLabel(categoryName);

  return {
    id: item.categoryId,
    code: slug.toUpperCase().replace(/-/g, "_"),
    name: categoryName,
    slug,
  };
}

export function orderItemToCartItem(item: OrderItem): CartItem {
  return {
    id: item.productId,
    name: item.name,
    category: getOrderItemCategory(item),
    status: "ACTIVE",
    price: item.price,
    sku: item.sku,
    stockStatus: "IN_STOCK",
    specs: [],
    media: item.image
      ? [
          {
            url: item.image,
            altText: item.name,
            sortOrder: 0,
          },
        ]
      : [],
    tags: [],
    quantity: item.quantity,
  };
}

export interface FinalCTAContent {
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaLink: string;
  backgroundStyle: "gradient" | "solid" | "pattern";
}

export interface StatusConfig {
  label: string;
  badgeClass: string;
  dotClass: string;
  icon: ReactNode;
  description: string;
}
