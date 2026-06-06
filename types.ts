import { ReactNode } from "react";

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
export interface UpdateInvoicePayload {
  status?: InvoiceStatus;
  dueDate?: string;
  notes?: string;
  discountPct?: number;
  shipping?: number;
  actor?: string;
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
export interface CreatePaymentInput {
  orderId: string;
  method: PaymentMethodType;
  amount: number;
  gatewayTxnId?: string;
  idempotencyKey: string;
  metadata?: Record<string, any>;
  status?: PaymentStatus;
}
export enum FilterType {
  checkbox = "checkbox",
  range = "range",
  boolean = "boolean",
  search = "search",
  dropdown = "dropdown",
}

export enum AttributeInputType {
  text = "text",
  number = "number",
  boolean = "boolean",
  select = "select",
  multi_select = "multi_select",
}

export enum ProductStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
}

export enum Role {
  ADMIN = "ADMIN",
  USER = "USER",
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
  code: string;
  name: string;
  label?: string;
  slug?: string;
  description?: string | null;
  image?: string | null;
  icon?: string | null;
  displayOrder?: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  subCategories?: SubCategory[];
  subcategories?: SubCategory[];
  categoryHierarchies?: CategoryHierarchy[];
  attributes?: CategoryAttribute[];
}

export interface SubCategory {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;

  categoryId: string;
  category?: Category;

  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  isActive?: boolean;
  image?: string | null;

  products?: Product[];
  attributes?: CategoryAttribute[];
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

// =====================================================
// CATEGORY ATTRIBUTES (Dynamic Specification System)
// =====================================================

export interface CategoryAttribute {
  id: string;
  categoryId: number;
  subcategoryId?: number | null;
  key: string;
  label: string;
  type: AttributeInputType | `${AttributeInputType}`;
  isRequired: boolean;
  isFilterable: boolean;
  isComparable: boolean;
  filterType?: FilterType | `${FilterType}` | null;
  unit?: string | null;
  helpText?: string | null;
  dependencyAttributeId?: string | null;
  dependencyOptionId?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;

  category?: Category;
  subcategory?: SubCategory | null;
  dependencyAttribute?: CategoryAttribute | null;
  dependentAttributes?: CategoryAttribute[];
  dependencyOption?: AttributeOption | null;
  options?: AttributeOption[];
}

export interface AttributeOption {
  id: string;
  attributeId: string;
  value: string;
  slug: string;
  sortOrder: number;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;

  attribute?: CategoryAttribute;
}

// =====================================================
// PRODUCT SPECS (linking products to attributes)
// =====================================================

export interface ProductSpec {
  key: string;
  value: string | number | boolean | string[] | null | undefined;
  name?: string;
}

export type ProductSpecsFlat = Record<string, ProductSpec["value"]>;

export interface ProductSpecRecord {
  id: string;
  productId: string;
  attributeId: string;
  optionId?: string | null;
  value: string;
  valueNumber?: number | null;
  valueBoolean?: boolean | null;
  isHighlighted: boolean;

  product?: Product;
  attribute?: CategoryAttribute;
  option?: AttributeOption | null;
}

// =====================================================
// FILTER DEFINITIONS
// =====================================================

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
  icon: ReactNode;
  description?: string;
}

export interface CategoryFilterConfig {
  category: string;
  filters: FilterDefinition[];
}

export interface CategoryNode {
  id?: string;
  label: string;
  children?: CategoryNode[];
  category?: Category | string | null;
  brand?: string;
  query?: string;
  subCategoryId?: string;
  isOpen?: boolean;
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
  min?: number;
  max?: number;
  dependencies?: DynamicFilterDependency[];
}

export interface CatalogListingResult {
  products: Product[];
  total: number;
  filters: DynamicCatalogFilter[];
  priceRange?: { min: number; max: number };
  nextCursor?: string | null;
}

// =====================================================
// PRODUCT SYSTEM (Single-product, no variants)
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

export interface Product {
  id: string;
  slug: string;
  name: string;

  metaTitle?: string | null;
  metaDescription?: string | null;
  description?: string | null;

  status: ProductStatus;
  deletedAt?: string | null;

  categoryId?: number;
  subCategoryId: string;
  subcategoryId?: number | null;
  subCategory?: SubCategory;
  subcategory?: SubCategory;

  brandId?: string | null;
  brand?: Brand | null;

  category?: Category | string;

  // Product-level pricing and stock (no variants)
  price?: number | null;
  compareAtPrice?: number | null;
  stockStatus?: string | null;
  sku?: string | null;

  image?: string | null;
  images?: string[];
  specs?: ProductSpec[];

  createdAt: string;
  updatedAt: string;

  media?: ProductMedia[];
  inventoryItems?: InventoryItem[];
}

export interface CartItem {
  productId?: string;
  id: string;
  name: string;
  category: string;
  quantity: number;
  specs?: ProductSpec[];
  product?: Product;
  image?: string | null;
  images?: string[];
  price?: number;
  brand?: Brand | null;
  media?: ProductMedia[];
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
  lineReference?: string;
  orderId: string;
  productId: string;
  inventoryItemId?: string | null;
  productNumber?: string;
  partNumber?: string;
  serialNumber?: string;

  name: string;
  category: string;
  categoryId?: number;

  price: number;
  quantity: number;

  sku?: string | null;
  image?: string | null;

  order?: Order;
  product?: Product;
  inventoryItem?: InventoryItem | null;
  assignedUnits?: any[];
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
  productId: string;
  quantity: number;

  buildGuide?: BuildGuide;
  product?: Product;
}

// =====================================================
// INVENTORY
// =====================================================

export interface InventoryItem {
  id: string;
  productId: string;

  trackingType?: InventoryTrackingType;

  serialNumber?: string | null;
  partNumber?: string | null;

  quantity: number;
  reserved?: number;
  quantityOnHand?: number;
  quantityReserved?: number;
  reorderLevel?: number;

  status?: InventoryStatus;

  costPrice?: number | null;
  batchNumber?: string | null;
  receivedAt?: string | null;
  notes?: string | null;
  location?: string;

  createdAt?: string;
  updatedAt?: string;

  product?: Product;
  orderItems?: OrderItem[];
}

export interface InventoryUnitInput {
  id?: string;
  serialNumber: string;
  partNumber: string;
}

export interface InventorySkuSummary {
  id: string;
  productId: string;
  sku?: string;

  quantityOnHand?: number;
  quantityReserved?: number;

  quantity: number;
  reserved?: number;
  reorderLevel: number;
  costPrice: number;

  product?: Product;
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
  productId: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  product?: Product;
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
  productId: string;
  slotId: string;

  build?: Build;
  product?: Product;
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

export enum RuleType {
  PAIR = "PAIR",
  COMPONENT = "COMPONENT",
  GLOBAL = "GLOBAL",
}

export interface CompatibilityRule {
  id: string;
  name: string;
  description?: string | null;

  type?: RuleType;

  sourceCategoryId?: number;
  targetCategoryId?: number;
  sourceAttributeId?: string | null;
  targetAttributeId?: string | null;
  operator?: CompatibilityOperator | string | null;
  scopeId?: string | null;

  message: string;
  messageTemplate?: string | null;
  severity: CompatibilitySeverity | CompatibilityLevel;

  logic?: Record<string, any> | null;

  priority?: number;
  enabled?: boolean;
  isActive?: boolean;
  sortOrder?: number;

  createdAt: string;
  updatedAt: string;

  sourceAttribute?: CategoryAttribute | null;
  targetAttribute?: CategoryAttribute | null;
  scope?: CompatibilityScope | null;

  clauses?: CompatibilityRuleClause[];
  compatibilityChecks?: CompatibilityCheck[];
}

export interface CompatibilityRuleClause {
  id: string;
  ruleId: string;
  sourceAttributeId: string;
  targetAttributeId: string;
  operator: string;
  sourceValue?: string | null;
  targetValue?: string | null;
  sortOrder: number;

  rule?: CompatibilityRule;
  sourceAttribute?: CategoryAttribute;
  targetAttribute?: CategoryAttribute;
}

// Condition node for the visual rule builder
export interface RuleCondition {
  id: string;
  type: "condition" | "group";
  specRef?: string;
  operator?: string;
  value?: string | number | boolean;
  compareRef?: string;
  groupOperator?: "AND" | "OR";
  children?: RuleCondition[];
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
  sourceProductId?: string | null;
  targetProductId?: string | null;
  passed: boolean;
  message: string;
  severity: CompatibilitySeverity;

  result?: BuildCompatibilityResult;
  rule?: CompatibilityRule;
}

export type OverallCompatibilityStatus =
  | "COMPATIBLE"
  | "WARNING"
  | "INCOMPATIBLE"
  | "UNCHECKED";

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
    sourceProductId: string;
    targetProductId: string;
    passed: boolean;
    message: string;
    severity: string;
    sourceAttributeName: string;
    targetAttributeName: string;
    sourceValue: any;
    targetValue: any;
  }>;
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

  powerDefaults: {
    baseWattage: number;
    cpuDefaultWattage: number;
    gpuDefaultWattage: number;
    ramWattagePerStick: number;
    storageWattagePerDrive: number;
  };

  tdpBands: {
    low: { max: number; label: string };
    balanced: { min: number; max: number; label: string };
    high: { min: number; label: string };
  };

  pricePresets: Array<{
    id: string;
    label: string;
    min?: number;
    max?: number;
  }>;
}

export const DEFAULT_BUILDER_SETTINGS: BuilderSettings = {
  defaultExpandedCategory: null,
  autoOpenNextCategory: true,
  enforceCompatibility: true,
  showWarnings: true,
  allowIncompatibleCheckout: false,
  powerCalculationMode: "static",
  powerDefaults: {
    baseWattage: 50,
    cpuDefaultWattage: 65,
    gpuDefaultWattage: 150,
    ramWattagePerStick: 5,
    storageWattagePerDrive: 5,
  },
  tdpBands: {
    low: { max: 65, label: "Low power (up to 65W)" },
    balanced: { min: 66, max: 120, label: "Balanced (66W-120W)" },
    high: { min: 121, label: "High power (121W+)" },
  },
  pricePresets: [
    { id: "budget", label: "Under 10k", max: 10000 },
    { id: "mid", label: "10k - 25k", min: 10000, max: 25000 },
    { id: "upper", label: "25k - 50k", min: 25000, max: 50000 },
    { id: "premium", label: "50k+", min: 50000 },
  ],
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
  attributeId: string;
  specDefinitionId?: string;
  categoryName: string;
  labelOverride: string | null;
  hidden: boolean;
  displayOrder: number;
  groupOverride: string | null;
  attribute?: CategoryAttribute;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
//  — typed inputs for product creation
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateProductSpec {
  attributeId: string;
  optionId?: string;
  value: string;
  valueNumber?: number;
  valueBoolean?: boolean;
}

export interface CreateProduct {
  name: string;
  subCategoryId?: string;
  categoryId?: number;
  subcategoryId?: number;
  slug?: string;
  brandId?: string;
  metaTitle?: string;
  metaDescription?: string;
  description?: string;
  status?: string;
  price?: number;
  compareAtPrice?: number;
  sku?: string;
  stockStatus?: string;
  specs?: CreateProductSpec[];
  images?: string[];
  stock?: number;
  costPrice?: number;
}

export interface CreateCategoryAttribute {
  categoryId: number;
  subcategoryId?: number | null;
  key: string;
  label: string;
  type: AttributeInputType | string;
  isRequired?: boolean;
  isFilterable?: boolean;
  isComparable?: boolean;
  filterType?: FilterType | string | null;
  unit?: string | null;
  helpText?: string | null;
  dependencyAttributeId?: string | null;
  dependencyOptionId?: string | null;
  sortOrder?: number;
  options?: Array<{
    value: string;
    slug?: string;
    sortOrder?: number;
    metadata?: Record<string, any>;
  }>;
}

export interface UpdateCategoryAttribute {
  key?: string;
  label?: string;
  type?: AttributeInputType | string;
  isRequired?: boolean;
  isFilterable?: boolean;
  isComparable?: boolean;
  filterType?: FilterType | string | null;
  unit?: string | null;
  helpText?: string | null;
  dependencyAttributeId?: string | null;
  dependencyOptionId?: string | null;
  sortOrder?: number;
  options?: Array<{
    id?: string;
    value: string;
    slug?: string;
    sortOrder?: number;
    metadata?: Record<string, any>;
  }>;
}

export interface AdvancedFilter {
  categoryId?: number;
  subcategoryId?: number;
  subCategoryId?: string;
  filters: Array<{
    attributeId: string;
    values: string[];
  }>;
  priceMin?: number;
  priceMax?: number;
  brandId?: string;
  status?: string;
  stockStatus?: string;
  q?: string;
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
  productId: string;
  inventoryItemId?: string;
  productNumber?: string;
  name: string;
  category?: string;
  categoryId?: number;
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

export interface BillingProfilePayload {
  companyName: string;
  legalName?: string;
  email: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  gstin?: string;
  logoUrl?: string;
}

// =====================================================
// MISSING SYSTEM DTO & ENGINE TYPES
// =====================================================

export enum Currency {
  INR = "INR",
  USD = "USD",
  EUR = "EUR",
  GBP = "GBP",
}

export type CategoryDefinition = Category;

export interface BuildSequenceItem {
  id?: string;
  categoryId: number;
  stepOrder: number;
  category: CategoryDefinition;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CompatibilityIssue {
  level: CompatibilityLevel;
  message: string;
  reason?: string;
  resolution?: string;
  componentIds: string[];
}

export interface CompatibilityReport {
  status: CompatibilityLevel;
  issues: CompatibilityIssue[];
}

export interface CategoryAttributeDefinition {
  id?: string;
  key: string;
  label: string;
  type: AttributeInputType | string;
  options: string[];
  required: boolean;
  unit?: string;
  sortOrder?: number;
  categoryId?: number;
  categoryCode?: string;
  dependencyKey?: string;
  dependencyValue?: string;
  isFilterable: boolean;
  isComparable: boolean;
  filterType?: FilterType | string | null;
  helpText?: string | null;
}

export interface CategoryAttributesConfig {
  id?: string;
  categoryCode: string;
  category: Category | string;
  categoryDefinition?: Category;
  attributes: CategoryAttributeDefinition[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

