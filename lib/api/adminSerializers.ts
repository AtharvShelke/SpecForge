import { normalizeCatalogProduct } from "@/lib/catalogFrontend";

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (value && typeof value === "object" && "toNumber" in value && typeof (value as { toNumber: () => number }).toNumber === "function") {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value ?? 0);
}

function mainWarehouseInventory(variant: any) {
  const inventoryItems = Array.isArray(variant?.inventoryItems)
    ? variant.inventoryItems
    : [];

  const quantity = inventoryItems.reduce(
    (sum: number, item: any) => sum + Number(item?.quantityOnHand ?? 0),
    0,
  );
  const reserved = inventoryItems.reduce(
    (sum: number, item: any) => sum + Number(item?.quantityReserved ?? 0),
    0,
  );
  const avgCost =
    inventoryItems.length > 0
      ? inventoryItems.reduce(
          (sum: number, item: any) => sum + Number(item?.costPrice ?? 0),
          0,
        ) / inventoryItems.length
      : 0;

  return [
    {
      id: `main-${variant.id}`,
      quantity,
      reserved,
      reorderLevel: 5,
      costPrice: avgCost,
      location: "Main Warehouse",
      warehouseId: "MAIN",
      warehouseName: "Main Warehouse",
      warehouse: {
        id: "MAIN",
        code: "MAIN",
        name: "Main Warehouse",
      },
    },
  ];
}

function serializeVariant(variant: any) {
  return {
    ...variant,
    price: toNumber(variant?.price),
    compareAtPrice:
      variant?.compareAtPrice == null ? null : toNumber(variant.compareAtPrice),
    warehouseInventories: mainWarehouseInventory(variant),
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
  return {
    ...item,
    quantityOnHand: Number(item?.quantityOnHand ?? 0),
    quantityReserved: Number(item?.quantityReserved ?? 0),
    costPrice: item?.costPrice == null ? null : toNumber(item.costPrice),
    quantity: Number(item?.quantityOnHand ?? 0),
    reserved: Number(item?.quantityReserved ?? 0),
    reorderLevel: 5,
    sku: item?.variant?.sku ?? item?.variantId ?? "",
    location: "Main Warehouse",
    warehouseId: "MAIN",
    warehouseName: "Main Warehouse",
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
