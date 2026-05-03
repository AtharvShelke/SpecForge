import { normalizeCatalogProduct } from "@/lib/catalogFrontend";

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (value && typeof value === "object" && "toNumber" in value && typeof (value as { toNumber: () => number }).toNumber === "function") {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value ?? 0);
}

function serializeVariant(variant: any) {
  return {
    ...variant,
    price: toNumber(variant?.price),
    compareAtPrice:
      variant?.compareAtPrice == null ? null : toNumber(variant.compareAtPrice),
  };
}

function serializePaymentProof(proof: any) {
  return {
    ...proof,
  };
}

function serializePayment(payment: any) {
  return {
    ...payment,
    amount: toNumber(payment?.amount),
    paymentProofs: Array.isArray(payment?.paymentProofs)
      ? payment.paymentProofs.map(serializePaymentProof)
      : [],
  };
}

export function serializeProduct(product: any) {
  return normalizeCatalogProduct({
    ...product,
    variants: Array.isArray(product?.variants)
      ? product.variants.map(serializeVariant)
      : [],
    media: Array.isArray(product?.media) ? product.media : [],
  } as any);
}

export function serializeProducts(products: any[]) {
  return products.map(serializeProduct);
}

export function serializeInventoryItem(item: any) {
  const quantityOnHand = Number(item?.quantityOnHand ?? 0);
  const quantityReserved = Number(item?.quantityReserved ?? 0);
  const availableQuantity = Math.max(0, quantityOnHand - quantityReserved);

  return {
    ...item,
    quantityOnHand,
    quantityReserved,
    costPrice: item?.costPrice == null ? null : toNumber(item.costPrice),
    quantity: availableQuantity,
    reserved: quantityReserved,
    reorderLevel: 5,
    sku: item?.variant?.sku ?? item?.variantId ?? "",
  };
}

export function serializeInventoryItems(items: any[]) {
  return items.map(serializeInventoryItem);
}

export function serializeOrder(order: any) {
  return {
    ...order,
    subtotal: toNumber(order?.subtotal),
    gstAmount: toNumber(order?.gstAmount),
    taxAmount: toNumber(order?.taxAmount),
    discountAmount: toNumber(order?.discountAmount),
    total: toNumber(order?.total),
    items: Array.isArray(order?.items)
      ? order.items.map((item: any) => ({
          ...item,
          price: toNumber(item?.price),
          variant: item?.variant ? serializeVariant(item.variant) : item?.variant,
        }))
      : [],
    payments: Array.isArray(order?.payments)
      ? order.payments.map(serializePayment)
      : [],
  };
}

export function serializeOrders(orders: any[]) {
  return orders.map(serializeOrder);
}

export function serializeInvoice(invoice: any) {
  return {
    ...invoice,
    subtotal: toNumber(invoice?.subtotal),
    taxTotal: toNumber(invoice?.taxTotal),
    discountPct: toNumber(invoice?.discountPct),
    shipping: toNumber(invoice?.shipping),
    total: toNumber(invoice?.total),
    amountPaid: toNumber(invoice?.amountPaid),
    amountDue: toNumber(invoice?.amountDue),
    lineItems: Array.isArray(invoice?.lineItems)
      ? invoice.lineItems.map((item: any) => ({
          ...item,
          unitPrice: toNumber(item?.unitPrice),
          taxRatePct: toNumber(item?.taxRatePct),
        }))
      : [],
  };
}

export function serializeInvoices(invoices: any[]) {
  return invoices.map(serializeInvoice);
}

export function serializeBuildGuide(guide: any) {
  return {
    ...guide,
    total: toNumber(guide?.total),
    items: Array.isArray(guide?.items)
      ? guide.items.map((item: any) => ({
          ...item,
          variant: item?.variant ? serializeVariant(item.variant) : item?.variant,
        }))
      : [],
  };
}

export function serializeBuildGuides(guides: any[]) {
  return guides.map(serializeBuildGuide);
}

export function serializeBrand(brand: any) {
  const categoryNames = Array.from(
    new Set(
      Array.isArray(brand?.products)
        ? brand.products
            .map((product: any) => product?.subCategory?.category?.name)
            .filter(Boolean)
        : Array.isArray(brand?.categories)
          ? brand.categories.filter(Boolean)
          : [],
    ),
  );

  return {
    ...brand,
    categories: categoryNames,
  };
}

export function serializeBrands(brands: any[]) {
  return brands.map(serializeBrand);
}

export function serializeDerivedSpec(spec: any) {
  return {
    ...spec,
    inputSpecIds: Array.isArray(spec?.inputSpecIds) ? spec.inputSpecIds : [],
    createdAt: spec?.createdAt?.toISOString() || spec?.createdAt,
    updatedAt: spec?.updatedAt?.toISOString() || spec?.updatedAt,
  };
}

export function serializeDerivedSpecs(specs: any[]) {
  return specs.map(serializeDerivedSpec);
}
