import type React from "react";

// =====================================================
// ENUMS (STRICT MATCH WITH PRISMA)
// =====================================================

export enum OrderStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  PROCESSING = "PROCESSING",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
  RETURNED = "RETURNED",
}

export enum CompatibilityLevel {
  COMPATIBLE = "COMPATIBLE",
  WARNING = "WARNING",
  INCOMPATIBLE = "INCOMPATIBLE",
}

export enum StockMovementType {
  PURCHASE = "PURCHASE",
  INWARD = "INWARD",
  OUTWARD = "OUTWARD",
  SALE = "SALE",
  RETURN = "RETURN",
  ADJUSTMENT = "ADJUSTMENT",
  RESERVE = "RESERVE",
}

export enum InvoiceStatus {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
  VOIDED = "VOIDED",
}

export enum InvoiceType {
  STANDARD = "STANDARD",
  CREDIT_NOTE = "CREDIT_NOTE",
}

export enum PaymentMethodType {
  RAZORPAY = "RAZORPAY",
  UPI = "UPI",
  BANK_TRANSFER = "BANK_TRANSFER",
}

export enum PaymentStatus {
  INITIATED = "INITIATED",
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
  PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED",
}

export enum FilterType {
  checkbox = "checkbox",
  range = "range",
  boolean = "boolean",
  search = "search",
  dropdown = "dropdown",
}

export enum ProductStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
}

export enum VariantStatus {
  IN_STOCK = "IN_STOCK",
  OUT_OF_STOCK = "OUT_OF_STOCK",
  DISCONTINUED = "DISCONTINUED",
  PREORDER = "PREORDER",
}

export enum Role {
  ADMIN = "ADMIN",
  USER = "USER",
}

export enum SpecValueType {
  STRING = "STRING",
  NUMBER = "NUMBER",
  BOOLEAN = "BOOLEAN",
}

export enum CompatibilityOperator {
  EQUAL = "EQUAL",
  NOT_EQUAL = "NOT_EQUAL",
  LESS_THAN = "LESS_THAN",
  LESS_OR_EQUAL = "LESS_OR_EQUAL",
  GREATER_THAN = "GREATER_THAN",
  GREATER_OR_EQUAL = "GREATER_OR_EQUAL",
  IN_LIST = "IN_LIST",
  CONTAINS = "CONTAINS",
}

export enum CompatibilitySeverity {
  ERROR = "ERROR",
  WARNING = "WARNING",
  INFO = "INFO",
}

export enum InventoryStatus {
  IN_STOCK = "IN_STOCK",
  RESERVED = "RESERVED",
  SOLD = "SOLD",
  DAMAGED = "DAMAGED",
  RMA = "RMA",
  IN_TRANSIT = "IN_TRANSIT",
  RETURNED = "RETURNED",
}

export enum InventoryTrackingType {
  SERIALIZED = "SERIALIZED",
  BULK = "BULK",
}

export enum ReservationStatus {
  ACTIVE = "ACTIVE",
  RELEASED = "RELEASED",
  CONVERTED = "CONVERTED",
  EXPIRED = "EXPIRED",
}

// =====================================================
// CORE ENTITIES
// =====================================================

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// CATEGORY SYSTEM
// =====================================================

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  subCategories?: SubCategory[];
  categoryHierarchies?: CategoryHierarchy[];
}

export interface SubCategory {
  id: string;
  name: string;
  description?: string | null;

  categoryId: string;
  category?: Category;

  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  isBuilderEnabled?: boolean;
  isCore?: boolean;
  isRequired?: boolean;
  allowMultiple?: boolean;
  builderOrder?: number;
  icon?: string | null;
  shortLabel?: string | null;

  products?: Product[];

  sourceCompatibilityScopes?: CompatibilityScope[];
  targetCompatibilityScopes?: CompatibilityScope[];

  subCategorySlots?: SubCategorySlot[];
  specDefinitions?: SpecDefinition[];
}

export interface CategoryHierarchy {
  id: string;
  label: string;
  categoryId?: string | null;
  parentId?: string | null;
  query?: string | null;
  brand?: string | null;
  sortOrder: number;

  parent?: CategoryHierarchy | null;
  children?: CategoryHierarchy[];
  category?: Category | null;
}

export interface ProductSpec {
  key: string;
  value: string | number | boolean | string[] | null | undefined;
  name?: string;
}

export type ProductSpecsFlat = Record<string, ProductSpec["value"]>;

export interface FilterDefinition {
  key: string;
  label: string;
  type: FilterType | `${FilterType}`;
  options?: string[];
  placeholder?: string;
  dependency?: {
    key: string;
    value: string;
  };
  dependencyKey?: string;
  dependencyValue?: string;
}

export interface StatusConfig {
  label: string;
  badgeClass: string;
  dotClass: string;
  icon: React.ReactNode;
  description?: string;
}

export interface CategoryFilterConfig {
  category: string;
  filters: FilterDefinition[];
}

export interface CategoryNode {
  label: string;
  children?: CategoryNode[];
  category?: string;
  brand?: string;
  query?: string;
  subCategoryId?: string;
  isOpen?: boolean;
}

// =====================================================
// SPECS SYSTEM
// =====================================================

export interface SpecDefinition {
  id: string;
  subCategoryId: string;
  subCategory?: SubCategory;

  name: string;
  valueType: SpecValueType;

  isFilterable: boolean;
  isRange: boolean;
  isMulti: boolean;

  filterGroup?: string | null;
  filterOrder?: number | null;

  options?: SpecOption[];
  variantSpecs?: VariantSpec[];

  parentOptionDeps?: SpecOptionDependency[];
  childOptionDeps?: SpecOptionDependency[];
  sourceRules?: CompatibilityRule[];
  targetRules?: CompatibilityRule[];

  derivedSpecs?: DerivedSpec[];
}

export interface SpecOptionDependency {
  id: string;

  parentSpecId: string;
  parentOptionId: string;
  childSpecId: string;
  childOptionId?: string | null;

  parentSpec?: SpecDefinition;
  parentOption?: SpecOption;
  childSpec?: SpecDefinition;
  childOption?: SpecOption | null;
}

export interface SpecOption {
  id: string;
  specId: string;
  spec?: SpecDefinition;

  value: string;
  label?: string | null;
  order?: number | null;

  parentOptionId?: string | null;
  parentOption?: SpecOption | null;
  children?: SpecOption[];

  variantSpecs?: VariantSpec[];

  parentOptionDeps?: SpecOptionDependency[];
  childOptionDeps?: SpecOptionDependency[];
}

export interface VariantSpec {
  id: string;
  variantId: string;
  specId: string;
  optionId?: string | null;

  valueString?: string | null;
  valueNumber?: number | null;
  valueBool?: boolean | null;

  variant?: ProductVariant;
  spec?: SpecDefinition;
  option?: SpecOption | null;
}

export interface DerivedSpec {
  id: string;
  name: string;
  resultSpecId: string;
  formula: string;

  resultSpec?: SpecDefinition;
}

// =====================================================
// PRODUCT SYSTEM
// =====================================================

export interface Brand {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  categories?: string[];

  products?: Product[];
}

export interface ProductMedia {
  id: string;
  productId: string;
  url: string;
  altText?: string | null;
  sortOrder: number;

  product?: Product;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;

  price: number;
  compareAtPrice?: number | null;

  attributes?: Record<string, any> | null;

  status: VariantStatus;
  deletedAt?: string | null;

  createdAt: string;
  updatedAt: string;

  product?: Product;

  variantSpecs?: VariantSpec[];
  orderItems?: OrderItem[];
  buildGuideItems?: BuildGuideItem[];
  buildItems?: BuildItem[];
  inventoryItems?: InventoryItem[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;

  metaTitle?: string | null;
  metaDescription?: string | null;
  description?: string | null;

  status: ProductStatus;
  deletedAt?: string | null;

  subCategoryId: string;
  subCategory?: SubCategory;

  brandId?: string | null;
  brand?: Brand | null;

  category: string;
  image?: string | null;
  images?: string[];
  specs?: ProductSpec[];

  createdAt: string;
  updatedAt: string;

  variants?: ProductVariant[];
  media?: ProductMedia[];
}
export interface CartItem {
  productId?: string;
  variantId?: string;
  id: string;
  name: string;
  category: string;
  quantity: number;
  specs?: ProductSpec[];
  product?: Product;
  variant?: ProductVariant;
  selectedVariant?: ProductVariant;
  variants?: ProductVariant[];
  image?: string | null;
  images?: string[];
}
// =====================================================
// CUSTOMER + ORDER
// =====================================================

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;

  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;

  createdAt: string;
  updatedAt: string;

  invoices?: Invoice[];
  orders?: Order[];
}

export interface OrderItem {
  id: string;
  lineReference: string;
  orderId: string;
  variantId: string;
  inventoryItemId?: string | null;
  productNumber: string;
  partNumber: string;
  serialNumber: string;

  name: string;
  category: string;

  price: number;
  quantity: number;

  sku?: string | null;
  image?: string | null;
  variantSnapshot?: Record<string, any> | null;

  order?: Order;
  variant?: ProductVariant;
  inventoryItem?: InventoryItem | null;
}

export interface OrderLog {
  id: string;
  orderId: string;
  status: OrderStatus;
  timestamp: string;
  note?: string | null;

  order?: Order;
}

export interface ShipmentTracking {
  id: string;
  orderId: string;
  trackingNumber: string;
  carrier: string;
  status: string;
  estimatedDelivery?: string | null;
  createdAt: string;
  updatedAt: string;

  order?: Order;
}

export interface Order {
  id: string;
  customerName: string;
  email: string;
  phone?: string | null;

  customerId?: string | null;
  customer?: Customer | null;

  subtotal: number;
  gstAmount: number;
  taxAmount: number;
  discountAmount: number;
  total: number;

  status: OrderStatus;
  version: number;
  deletedAt?: string | null;

  shippingStreet?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingZip?: string | null;
  shippingCountry?: string | null;

  paymentMethod?: string | null;
  paymentTransactionId?: string | null;
  paymentStatus?: PaymentStatus | null;

  idempotencyKey?: string | null;
  source?: Record<string, any> | null;

  date: string;
  createdAt: string;
  updatedAt: string;

  items?: OrderItem[];
  logs?: OrderLog[];
  shipments?: ShipmentTracking[];
  payments?: PaymentTransaction[];
  invoices?: Invoice[];
  reservations?: Reservation[];
}

export interface BuildGuide {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  total: number;
  createdAt: string;
  updatedAt: string;

  items?: BuildGuideItem[];
}

export interface BuildGuideItem {
  id: string;
  buildGuideId: string;
  variantId: string;
  quantity: number;

  buildGuide?: BuildGuide;
  variant?: ProductVariant;
}

// =====================================================
// INVENTORY
// =====================================================

export interface InventoryItem {
  id: string;
  variantId: string;

  trackingType: InventoryTrackingType;

  serialNumber?: string | null;
  partNumber?: string | null;

  quantityOnHand: number;
  quantityReserved: number;

  status: InventoryStatus;

  costPrice?: number | null;
  batchNumber?: string | null;
  receivedAt?: string | null;
  notes?: string | null;

  createdAt: string;
  updatedAt: string;

  variant?: ProductVariant & { product?: Product };
  orderItems?: OrderItem[];
  reservations?: Reservation[];
}

export interface InventoryUnitInput {
  id?: string;
  serialNumber: string;
  partNumber: string;
}

export interface InventorySkuSummary {
  id: string;
  variantId: string;
  sku?: string;

  quantityOnHand?: number;
  quantityReserved?: number;

  quantity: number;
  reserved?: number;
  reorderLevel: number;
  costPrice: number;

  variant?: ProductVariant & { product?: Product };
}

export type PurchaseOrderStatus =
  | "PENDING"
  | "PARTIAL"
  | "COMPLETED"
  | "CANCELLED";

export interface Supplier {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PurchaseOrderItem {
  variantId: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  variant?: ProductVariant & { product?: Product };
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplier?: Supplier | null;
  status: PurchaseOrderStatus;
  expectedDelivery?: string | null;
  createdAt: string;
  updatedAt?: string;
  items: PurchaseOrderItem[];
}

export interface Reservation {
  id: string;
  orderId: string;
  inventoryItemId: string;

  quantity: number;
  status: ReservationStatus;
  expiresAt?: string | null;

  order?: Order;
  inventoryItem?: InventoryItem;

  createdAt: string;
  updatedAt: string;
}

// =====================================================
// BILLING
// =====================================================

export interface InvoiceSequence {
  id: string;
  currentValue: number;
}

export interface BillingProfile {
  id: string;
  companyName: string;
  legalName?: string | null;
  email: string;
  phone?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  gstin?: string | null;
  logoUrl?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  orderItemId?: string | null;
  inventoryItemId?: string | null;
  lineReference?: string | null;
  name: string;
  description?: string | null;
  productNumber?: string | null;
  partNumber?: string | null;
  serialNumber?: string | null;

  quantity: number;
  unitPrice: number;
  taxRatePct: number;
  hsnCode?: string | null;

  invoice?: Invoice;
}

export interface InvoiceAuditEvent {
  id: string;
  invoiceId: string;
  type: string;
  actor: string;
  message?: string | null;
  createdAt: string;

  invoice?: Invoice;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;

  status: InvoiceStatus;
  type: InvoiceType;

  customerId: string;
  customer?: Customer;
  orderId?: string | null;
  order?: Order | null;

  subtotal: number;
  taxTotal: number;
  discountPct: number;
  shipping: number;

  total: number;
  amountPaid: number;
  amountDue: number;

  notes?: string | null;
  sentAt?: string | null;
  refundedAt?: string | null;
  cancelledAt?: string | null;
  paidAt?: string | null;
  voidedAt?: string | null;

  createdAt: string;
  dueDate: string;
  lastUpdatedAt: string;

  lineItems?: InvoiceLineItem[];
  audit?: InvoiceAuditEvent[];
}

// =====================================================
// PAYMENTS
// =====================================================

export interface PaymentTransaction {
  id: string;
  orderId: string;

  method: PaymentMethodType;
  gatewayTxnId?: string | null;
  amount: number;

  status: PaymentStatus;
  idempotencyKey: string;
  metadata?: Record<string, any> | null;

  createdAt: string;
  updatedAt: string;

  order?: Order;
  paymentProofs?: PaymentProof[];
}

export interface PaymentProof {
  id: string;
  transactionId: string;
  proofUrl?: string | null;
  createdAt: string;
  updatedAt: string;

  paymentTransaction?: PaymentTransaction;
}

// =====================================================
// AUDIT LOG
// =====================================================

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

// =====================================================
// BUILD + COMPATIBILITY
// =====================================================

export interface Build {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;

  items?: BuildItem[];
  buildCompatibilityResults?: BuildCompatibilityResult[];
}

export interface BuildItem {
  id: string;
  buildId: string;
  variantId: string;
  slotId: string;

  build?: Build;
  variant?: ProductVariant;
  slot?: PartSlot;
}

export interface PartSlot {
  id: string;
  name: string;
  maxItems?: number | null;
  minItems?: number | null;

  buildItems?: BuildItem[];
  slotConstraint?: SlotConstraint | null;
  subCategorySlots?: SubCategorySlot[];
}

export interface SubCategorySlot {
  id: string;
  subCategoryId: string;
  slotId: string;

  subCategory?: SubCategory;
  slot?: PartSlot;
}

export interface SlotConstraint {
  id: string;
  slotId: string;
  minItems: number;
  maxItems: number;

  slot?: PartSlot;
}

export interface CompatibilityScope {
  id: string;
  sourceSubCategoryId: string;
  targetSubCategoryId: string;

  sourceSubCategory?: SubCategory;
  targetSubCategory?: SubCategory;

  rules?: CompatibilityRule[];
}

export interface CompatibilityRule {
  id: string;
  name: string;
  sourceSpecId: string;
  targetSpecId: string;
  operator: CompatibilityOperator;
  message: string;
  severity: CompatibilitySeverity;
  scopeId: string;

  sourceSpec?: SpecDefinition;
  targetSpec?: SpecDefinition;
  scope?: CompatibilityScope;

  compatibilityChecks?: CompatibilityCheck[];
}

export interface BuildCompatibilityResult {
  id: string;
  buildId: string;
  isCompatible: boolean;
  createdAt: string;

  checks?: CompatibilityCheck[];
  build?: Build;
}

export interface CompatibilityCheck {
  id: string;
  resultId: string;
  ruleId: string;
  sourceVariantId?: string | null;
  targetVariantId?: string | null;
  passed: boolean;
  message: string;
  severity: CompatibilitySeverity;

  result?: BuildCompatibilityResult;
  rule?: CompatibilityRule;
}

export interface CompatibilityResult {
  id: string;
  buildId: string;
  isCompatible: boolean;
  createdAt: string;
  checks?: CompatibilityCheck[];
  summary?: {
    totalChecks: number;
    passed: number;
    failed: number;
    errors: number;
    warnings: number;
  };
  details?: Array<{
    ruleId: string;
    ruleName: string;
    sourceVariantId: string;
    targetVariantId: string;
    passed: boolean;
    message: string;
    severity: string;
    sourceSpecName: string;
    targetSpecName: string;
    sourceValue: any;
    targetValue: any;
  }>;
}

export interface VariantCompatibilityCache {
  id: string;
  variantAId: string;
  variantBId: string;
  compatible: boolean;
  message?: string | null;
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// BUILDER CONFIGURATION (Admin-managed)
// =====================================================

export interface BuilderSettings {
  defaultExpandedCategory: string | null;
  autoOpenNextCategory: boolean;
  enforceCompatibility: boolean;
  showWarnings: boolean;
  allowIncompatibleCheckout: boolean;
  powerCalculationMode: "static" | "spec_based" | "rule_based";
}

export const DEFAULT_BUILDER_SETTINGS: BuilderSettings = {
  defaultExpandedCategory: null,
  autoOpenNextCategory: true,
  enforceCompatibility: true,
  showWarnings: true,
  allowIncompatibleCheckout: false,
  powerCalculationMode: "static",
};

export interface BuilderConfig {
  id: string;
  settings: BuilderSettings;
  createdAt: string;
  updatedAt: string;
}

export interface BuilderCategoryConfig {
  id: string;
  categoryName: string;
  enabled: boolean;
  isCore: boolean;
  required: boolean;
  allowMultiple: boolean;
  displayOrder: number;
  icon: string | null;
  shortLabel: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export enum BuilderRuleAction {
  HIGHLIGHT = "HIGHLIGHT",
  HIDE_FILTER = "HIDE_FILTER",
  LOCK_CATEGORY = "LOCK_CATEGORY",
  AUTO_SELECT = "AUTO_SELECT",
  SHOW_WARNING = "SHOW_WARNING",
}

export interface BuilderUIRule {
  id: string;
  name: string;
  category: string;
  specKey: string;
  operator: string;
  value: string;
  action: BuilderRuleAction;
  priority: number;
  enabled: boolean;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface FilterOverrideItem {
  id: string;
  specDefinitionId: string;
  categoryName: string;
  labelOverride: string | null;
  hidden: boolean;
  displayOrder: number;
  groupOverride: string | null;
  specDefinition?: SpecDefinition;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
//  — typed inputs for deep relational creates
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateVariantSpec {
  specId: string;
  optionId?: string;
  valueString?: string;
  valueNumber?: number;
  valueBool?: boolean;
}

export interface CreateVariant {
  sku: string;
  price: number;
  compareAtPrice?: number;
  attributes?: any;
  status?: string;
  specs?: CreateVariantSpec[];
}

export interface CreateProduct {
  name: string;
  subCategoryId: string;
  slug?: string;
  brandId?: string;
  metaTitle?: string;
  metaDescription?: string;
  description?: string;
  status?: string;
  variants?: CreateVariant[];
  images?: string[];
}

export interface CreateSpecWithOptions {
  subCategoryId: string;
  name: string;
  valueType: string;
  isFilterable?: boolean;
  isRange?: boolean;
  isMulti?: boolean;
  filterGroup?: string;
  filterOrder?: number;
  options?: Array<{
    value: string;
    label?: string;
    order?: number;
  }>;
}

export interface AdvancedFilter {
  subCategoryId: string;
  filters: Array<{
    specId: string;
    values: string[];
  }>;
  priceMin?: number;
  priceMax?: number;
  brandId?: string;
  status?: string;
}

export interface DynamicFilterDependency {
  filterId: string;
  values: string[];
}

export interface DynamicFilterOption {
  value: string;
  label: string;
  count: number;
  selected?: boolean;
  enabled?: boolean;
  dependencies?: DynamicFilterDependency[];
}

export interface DynamicCatalogFilter {
  id: string;
  key: string;
  label: string;
  type: FilterType | `${FilterType}`;
  group?: string | null;
  order?: number | null;
  options: DynamicFilterOption[];
  dependencies?: DynamicFilterDependency[];
}

export interface CatalogListingResult {
  products: Product[];
  total: number;
  filters: DynamicCatalogFilter[];
  nextCursor?: string | null;
}

export interface SpecDependencyInput {
  parentSpecId: string;
  parentOptionValue: string;
  childOptionValue?: string | null;
}

export interface UpdateSpecInput {
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
  dependencies?: SpecDependencyInput[];
}

export function specsToFlat(specs?: ProductSpec[] | null): ProductSpecsFlat {
  if (!Array.isArray(specs)) return {};

  return specs.reduce<ProductSpecsFlat>((acc, spec) => {
    if (!spec?.key) return acc;
    acc[spec.key] = spec.value;
    return acc;
  }, {});
}

export function flatToSpecs(specs?: ProductSpecsFlat | null): ProductSpec[] {
  if (!specs) return [];

  return Object.entries(specs)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    )
    .map(([key, value]) => ({
      key,
      value,
      name: key,
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// BILLING — Typed Inputs
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateInvoiceLineItem {
  name: string;
  description?: string;
  orderItemId?: string;
  inventoryItemId?: string;
  lineReference?: string;
  productNumber?: string;
  partNumber?: string;
  serialNumber?: string;
  quantity: number;
  unitPrice: number;
  taxRatePct?: number;
  hsnCode?: string;
}

export interface CreateInvoice {
  customerId: string;
  orderId?: string;
  type?: InvoiceType;
  subtotal?: number;
  taxTotal?: number;
  discountPct?: number;
  shipping?: number;
  total?: number;
  amountPaid?: number;
  amountDue?: number;
  dueDate: string;
  notes?: string;
  lineItems?: CreateInvoiceLineItem[];
}

export interface PayInvoiceInput {
  amount?: number;
  note?: string;
  actor?: string;
}

export interface InvoiceActionInput {
  reason?: string;
  actor?: string;
}

export interface CreateCreditNoteInput {
  reason?: string;
  actor?: string;
  lineItems?: CreateInvoiceLineItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER — Typed Inputs
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateOrderItem {
  variantId: string;
  inventoryItemId?: string;
  productNumber?: string;
  name: string;
  category?: string;
  price: number;
  quantity: number;
  image?: string;
  sku?: string;
}

export interface CreateOrder {
  id?: string;
  customerName: string;
  email: string;
  phone?: string;
  customerId?: string;
  subtotal?: number;
  gstAmount?: number;
  taxAmount?: number;
  discountAmount?: number;
  total: number;
  shippingStreet?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingZip?: string;
  shippingCountry?: string;
  paymentMethod?: PaymentMethodType;
  paymentStatus?: PaymentStatus;
  paymentTransactionId?: string;
  paymentIdempotencyKey?: string;
  paymentMetadata?: Record<string, any>;
  paymentProofUrl?: string;
  source?: Record<string, any>;
  items?: CreateOrderItem[];
}

export type HomepageCategory = {
  id: string;
  name: string;
  displayName: string;
  sortOrder: number;
  subCategories: Array<{ id: string; name: string }>;
};
