import {
  AttributeInputType as PrismaAttributeInputType,
  CompatibilityLevel as PrismaCompatibilityLevel,
  Currency as PrismaCurrency,
  FilterType as PrismaFilterType,
  InvoiceStatus as PrismaInvoiceStatus,
  InvoiceType as PrismaInvoiceType,
  OrderStatus as PrismaOrderStatus,
  PaymentMethodType as PrismaPaymentMethodType,
  PaymentStatus as PrismaPaymentStatus,
  ProductStatus as PrismaProductStatus,
  Role as PrismaRole,
  SalesChannel as PrismaSalesChannel,
  StockMovementType as PrismaStockMovementType,
} from "@/generated/prisma/client";

function enumValues<TEnum extends Record<string, string>>(enumObject: TEnum) {
  return Object.values(enumObject) as [TEnum[keyof TEnum], ...TEnum[keyof TEnum][]];
}

export const OrderStatus = PrismaOrderStatus;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];
export const ORDER_STATUS_VALUES = enumValues(OrderStatus);

export const CompatibilityLevel = PrismaCompatibilityLevel;
export type CompatibilityLevel =
  (typeof CompatibilityLevel)[keyof typeof CompatibilityLevel];
export const COMPATIBILITY_LEVEL_VALUES = enumValues(CompatibilityLevel);

export const StockMovementType = PrismaStockMovementType;
export type StockMovementType =
  (typeof StockMovementType)[keyof typeof StockMovementType];
export const STOCK_MOVEMENT_TYPE_VALUES = enumValues(StockMovementType);

export const InvoiceStatus = PrismaInvoiceStatus;
export type InvoiceStatus =
  (typeof InvoiceStatus)[keyof typeof InvoiceStatus];
export const INVOICE_STATUS_VALUES = enumValues(InvoiceStatus);

export const InvoiceType = PrismaInvoiceType;
export type InvoiceType = (typeof InvoiceType)[keyof typeof InvoiceType];
export const INVOICE_TYPE_VALUES = enumValues(InvoiceType);

export const Currency = PrismaCurrency;
export type Currency = (typeof Currency)[keyof typeof Currency];
export const CURRENCY_VALUES = enumValues(Currency);

export const FilterType = PrismaFilterType;
export type FilterType = (typeof FilterType)[keyof typeof FilterType];
export const FILTER_TYPE_VALUES = enumValues(FilterType);

export const ProductStatus = PrismaProductStatus;
export type ProductStatus =
  (typeof ProductStatus)[keyof typeof ProductStatus];
export const PRODUCT_STATUS_VALUES = enumValues(ProductStatus);

export const Role = PrismaRole;
export type Role = (typeof Role)[keyof typeof Role];
export const ROLE_VALUES = enumValues(Role);

export const SalesChannel = PrismaSalesChannel;
export type SalesChannel =
  (typeof SalesChannel)[keyof typeof SalesChannel];
export const SALES_CHANNEL_VALUES = enumValues(SalesChannel);

export const PaymentTransactionMethod = PrismaPaymentMethodType;
export type PaymentTransactionMethod =
  (typeof PaymentTransactionMethod)[keyof typeof PaymentTransactionMethod];
export const PAYMENT_TRANSACTION_METHOD_VALUES = enumValues(
  PaymentTransactionMethod
);

export const OrderPaymentMethod = {
  CARD: "CARD",
  UPI: "UPI",
  BANK_TRANSFER: "BANK_TRANSFER",
  CASH: "CASH",
  WALLET: "WALLET",
} as const;
export type OrderPaymentMethod =
  (typeof OrderPaymentMethod)[keyof typeof OrderPaymentMethod];
export const ORDER_PAYMENT_METHOD_VALUES = enumValues(OrderPaymentMethod);

export const PaymentStatus = PrismaPaymentStatus;
export type PaymentStatusType =
  (typeof PaymentStatus)[keyof typeof PaymentStatus];
export const PAYMENT_STATUS_VALUES = enumValues(PaymentStatus);

export const AttributeInputType = PrismaAttributeInputType;
export type AttributeInputType =
  (typeof AttributeInputType)[keyof typeof AttributeInputType];
export const ATTRIBUTE_INPUT_TYPE_VALUES = enumValues(AttributeInputType);

export const StockStatus = {
  IN_STOCK: "IN_STOCK",
  LOW_STOCK: "LOW_STOCK",
  OUT_OF_STOCK: "OUT_OF_STOCK",
} as const;
export type StockStatus = (typeof StockStatus)[keyof typeof StockStatus];

export function mapOrderPaymentMethodToTransactionMethod(
  method: OrderPaymentMethod
): PaymentTransactionMethod | null {
  switch (method) {
    case OrderPaymentMethod.UPI:
      return PaymentTransactionMethod.UPI;
    case OrderPaymentMethod.BANK_TRANSFER:
      return PaymentTransactionMethod.BANK_TRANSFER;
    case OrderPaymentMethod.CARD:
    case OrderPaymentMethod.WALLET:
      return PaymentTransactionMethod.RAZORPAY;
    case OrderPaymentMethod.CASH:
      return null;
  }
}
