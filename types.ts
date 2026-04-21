// =====================================================
// ENUMS (STRICT MATCH WITH PRISMA)
// =====================================================

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
}

export enum CompatibilityLevel {
  COMPATIBLE = 'COMPATIBLE',
  WARNING = 'WARNING',
  INCOMPATIBLE = 'INCOMPATIBLE',
}

export enum StockMovementType {
  PURCHASE = 'PURCHASE',
  INWARD = 'INWARD',
  OUTWARD = 'OUTWARD',
  SALE = 'SALE',
  RETURN = 'RETURN',
  ADJUSTMENT = 'ADJUSTMENT',
  RESERVE = 'RESERVE',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  VOIDED = 'VOIDED',
}

export enum InvoiceType {
  STANDARD = 'STANDARD',
  CREDIT_NOTE = 'CREDIT_NOTE',
}

export enum PaymentMethodType {
  RAZORPAY = 'RAZORPAY',
  UPI = 'UPI',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum PaymentStatus {
  INITIATED = 'INITIATED',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum FilterType {
  checkbox = 'checkbox',
  range = 'range',
  boolean = 'boolean',
  search = 'search',
  dropdown = 'dropdown',
}

export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum VariantStatus {
  IN_STOCK = 'IN_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED',
  PREORDER = 'PREORDER',
}

export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum SpecValueType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
}

export enum CompatibilityOperator {
  EQUAL = 'EQUAL',
  NOT_EQUAL = 'NOT_EQUAL',
  LESS_THAN = 'LESS_THAN',
  LESS_OR_EQUAL = 'LESS_OR_EQUAL',
  GREATER_THAN = 'GREATER_THAN',
  GREATER_OR_EQUAL = 'GREATER_OR_EQUAL',
  IN_LIST = 'IN_LIST',
  CONTAINS = 'CONTAINS',
}

export enum CompatibilitySeverity {
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  INFO = 'INFO',
}

export enum InventoryStatus {
  IN_STOCK = 'IN_STOCK',
  RESERVED = 'RESERVED',
  SOLD = 'SOLD',
  DAMAGED = 'DAMAGED',
  RMA = 'RMA',
  IN_TRANSIT = 'IN_TRANSIT',
  RETURNED = 'RETURNED',
}

export enum InventoryTrackingType {
  SERIALIZED = 'SERIALIZED',
  BULK = 'BULK',
}

export enum ReservationStatus {
  ACTIVE = 'ACTIVE',
  RELEASED = 'RELEASED',
  CONVERTED = 'CONVERTED',
  EXPIRED = 'EXPIRED',
}

// =====================================================
// CORE ENTITIES
// =====================================================

export interface User {
  id: string
  email: string
  name: string
  role: Role
  createdAt: string
  updatedAt: string
}

// =====================================================
// CATEGORY SYSTEM
// =====================================================

export interface Category {
  id: string
  name: string
  description?: string | null
  createdAt: string
  updatedAt: string
  deletedAt?: string | null

  subCategories?: SubCategory[]
}

export interface SubCategory {
  id: string
  name: string
  description?: string | null

  categoryId: string
  category?: Category

  createdAt: string
  updatedAt: string
  deletedAt?: string | null

  specDefinitions?: SpecDefinition[]
}

export interface CategoryHierarchy {
  id: string
  label: string
  categoryId?: string | null
  parentId?: string | null
  query?: string | null
  brand?: string | null
  sortOrder: number

  children?: CategoryHierarchy[]
}

// =====================================================
// SPECS SYSTEM
// =====================================================

export interface SpecDefinition {
  id: string
  subCategoryId: string

  name: string
  valueType: SpecValueType

  isFilterable: boolean
  isRange: boolean
  isMulti: boolean

  filterGroup?: string | null
  filterOrder?: number | null

  options?: SpecOption[]
}

export interface SpecOption {
  id: string
  specId: string
  value: string
  label?: string | null
  order?: number | null

  parentOptionId?: string | null
}

export interface VariantSpec {
  id: string
  variantId: string
  specId: string
  optionId?: string | null

  valueString?: string | null
  valueNumber?: number | null
  valueBool?: boolean | null
}

// =====================================================
// PRODUCT SYSTEM
// =====================================================

export interface Brand {
  id: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export interface ProductMedia {
  id: string
  productId: string
  url: string
  altText?: string | null
  sortOrder: number
}

export interface ProductVariant {
  id: string
  productId: string
  sku: string

  price: number
  compareAtPrice?: number | null

  attributes?: Record<string, any> | null

  status: VariantStatus
  deletedAt?: string | null

  createdAt: string
  updatedAt: string

  variantSpecs?: VariantSpec[]
}

export interface Product {
  id: string
  slug: string
  name: string

  metaTitle?: string | null
  metaDescription?: string | null
  description?: string | null

  status: ProductStatus
  deletedAt?: string | null

  subCategoryId: string
  brandId?: string | null

  createdAt: string
  updatedAt: string

  variants?: ProductVariant[]
  media?: ProductMedia[]
}

// =====================================================
// CUSTOMER + ORDER
// =====================================================

export interface Customer {
  id: string
  name: string
  email: string
  phone?: string | null
  company?: string | null

  addressLine1?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
  country?: string | null

  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  orderId: string
  variantId: string

  name: string
  category: string

  price: number
  quantity: number

  sku?: string | null
  image?: string | null
}

export interface Order {
  id: string
  customerName: string
  email: string

  subtotal: number
  gstAmount: number
  taxAmount: number
  discountAmount: number
  total: number

  status: OrderStatus

  createdAt: string
  updatedAt: string

  items?: OrderItem[]
}

// =====================================================
// INVENTORY
// =====================================================

export interface InventoryItem {
  id: string
  variantId: string

  trackingType: InventoryTrackingType

  serialNumber?: string | null
  quantityOnHand: number
  quantityReserved: number

  status: InventoryStatus

  costPrice?: number | null

  createdAt: string
  updatedAt: string
}

export interface Reservation {
  id: string
  orderId: string
  inventoryItemId: string

  quantity: number
  status: ReservationStatus

  createdAt: string
  updatedAt: string
}

// =====================================================
// BILLING
// =====================================================

export interface InvoiceLineItem {
  id: string
  invoiceId: string
  name: string

  quantity: number
  unitPrice: number
  taxRatePct: number
}

export interface Invoice {
  id: string
  invoiceNumber: string

  status: InvoiceStatus
  type: InvoiceType

  customerId: string
  orderId?: string | null

  subtotal: number
  taxTotal: number
  discountPct: number
  shipping: number

  total: number
  amountPaid: number
  amountDue: number

  createdAt: string
  dueDate: string

  lineItems?: InvoiceLineItem[]
}

// =====================================================
// PAYMENTS
// =====================================================

export interface PaymentTransaction {
  id: string
  orderId: string

  method: PaymentMethodType
  amount: number

  status: PaymentStatus

  createdAt: string
  updatedAt: string
}

// =====================================================
// BUILD + COMPATIBILITY
// =====================================================

export interface Build {
  id: string
  name: string
  createdAt: string
  updatedAt: string

  items?: BuildItem[]
}

export interface BuildItem {
  id: string
  buildId: string
  variantId: string
  slotId: string
}

export interface CompatibilityRule {
  id: string
  name: string
  operator: CompatibilityOperator
  message: string
  severity: CompatibilitySeverity
}

export interface CompatibilityCheck {
  id: string
  ruleId: string
  passed: boolean
  message: string
  severity: CompatibilitySeverity
}