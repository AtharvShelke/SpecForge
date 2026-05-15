import { z } from "zod";
import {
  ATTRIBUTE_INPUT_TYPE_VALUES,
  COMPATIBILITY_LEVEL_VALUES,
  CURRENCY_VALUES,
  FILTER_TYPE_VALUES,
  INVOICE_STATUS_VALUES,
  ORDER_PAYMENT_METHOD_VALUES,
  ORDER_STATUS_VALUES,
  PAYMENT_STATUS_VALUES,
  PAYMENT_TRANSACTION_METHOD_VALUES,
  SALES_CHANNEL_VALUES,
  STOCK_MOVEMENT_TYPE_VALUES,
} from "@/lib/contracts/domain";

export const OrderStatusSchema = z.enum(ORDER_STATUS_VALUES);
export const SalesChannelSchema = z.enum(SALES_CHANNEL_VALUES);
export const OrderPaymentMethodSchema = z.enum(ORDER_PAYMENT_METHOD_VALUES);
export const PaymentTransactionMethodSchema = z.enum(
  PAYMENT_TRANSACTION_METHOD_VALUES
);
export const PaymentStatusSchema = z.enum(PAYMENT_STATUS_VALUES);
export const CurrencySchema = z.enum(CURRENCY_VALUES);
export const InvoiceStatusSchema = z.enum(INVOICE_STATUS_VALUES);
export const CompatibilityLevelSchema = z.enum(COMPATIBILITY_LEVEL_VALUES);
export const StockMovementTypeSchema = z.enum(STOCK_MOVEMENT_TYPE_VALUES);
export const AttributeInputTypeSchema = z.enum(ATTRIBUTE_INPUT_TYPE_VALUES);
export const FilterTypeSchema = z.enum(FILTER_TYPE_VALUES);
