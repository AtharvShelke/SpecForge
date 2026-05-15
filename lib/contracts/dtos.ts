import type {
  AttributeInputType,
  CompatibilityLevel,
  Currency,
  FilterType,
  InvoiceStatus,
  InvoiceType,
  OrderPaymentMethod,
  OrderStatus,
  PaymentStatusType,
  PaymentTransactionMethod,
  ProductStatus,
  SalesChannel,
  StockMovementType,
  StockStatus,
} from "@/lib/contracts/domain";

export interface Category {
  id: number;
  code: string;
  name: string;
  slug: string;
  shortLabel?: string | null;
  label?: string;
  description?: string | null;
  image?: string | null;
  icon?: string | null;
  displayOrder?: number;
  featuredOrder?: number | null;
  stepOrder?: number | null;
  isInBuildSequence?: boolean;
  showInFeatured?: boolean;
  isActive?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export type CategoryDefinition = Category;

export interface Subcategory {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  category?: Category;
  products?: Product[];
}

export interface BuildSequenceItem {
  id?: string;
  categoryId: number;
  stepOrder: number;
  category: CategoryDefinition;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CategoryRelationship {
  id?: string;
  fromCategoryCode?: string | null;
  toCategoryCode?: string | null;
  relationshipType: string;
  sortOrder: number;
  metadata?: Record<string, unknown> | null;
  createdAt?: string | Date;
}

export interface ProductSpec {
  id: string;
  productId: string;
  attributeId?: string;
  optionId?: string | null;
  key: string;
  value: string;
  valueNumber?: number | null;
  valueBoolean?: boolean | null;
  isHighlighted?: boolean;
}

export interface Tag {
  id: string;
  name: string;
}

export interface ProductMedia {
  id?: string;
  productId?: string;
  url: string;
  altText?: string | null;
  sortOrder?: number;
}

export interface Brand {
  id: string;
  name: string;
  categories?: Category[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface InventoryItem {
  id: string;
  productId: string;
  partNumber?: string;
  serialNumber?: string;
  quantity: number;
  reserved: number;
  reorderLevel: number;
  costPrice: number;
  location: string;
  lastUpdated?: string | Date | null;
  product?: Product;
}

export interface Product {
  id: string;
  slug?: string;
  name: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  category?: Category;
  categoryId?: number;
  description?: string | null;
  status: ProductStatus;
  deletedAt?: string | Date | null;
  version?: number;
  sku?: string | null;
  price?: number | null;
  compareAtPrice?: number | null;
  stockStatus?: StockStatus | string | null;
  brandId?: string | null;
  brand?: Brand | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  specs: ProductSpec[];
  media?: ProductMedia[];
  tags?: Tag[];
  inventoryItems?: InventoryItem[];
  imageFile?: File;
  image?: string | null;
}

export type ProductSpecScalar = string | number | boolean;

export interface ProductSpecsFlat {
  [key: string]: ProductSpecScalar | ProductSpecScalar[] | undefined;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface CategoryNode {
  id?: string;
  label: string;
  slug?: string;
  children?: CategoryNode[];
  category?: Category | string | null;
  brand?: string;
  query?: string;
  parentId?: string;
  sortOrder?: number;
  isOpen?: boolean;
}

export interface CategoryAttributeDefinition {
  id?: string;
  key: string;
  label: string;
  type: AttributeInputType;
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
  filterType?: FilterType | null;
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

export interface AssignedInventoryUnit {
  id: string;
  inventoryItemId: string;
  serialNumber?: string | null;
  partNumber?: string | null;
}

export interface StockMovement {
  id: string;
  orderId?: string;
  productId: string;
  inventoryItemId?: string;
  type: StockMovementType;
  quantity: number;
  note?: string | null;
  createdAt: string | Date;
  sku?: string;
  date?: string;
  serialNumber?: string;
  partNumber?: string;
}

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
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  name: string;
  categoryId: number;
  category?: Category | string | null;
  price: number;
  quantity: number;
  image?: string | null;
  sku?: string | null;
  assignedUnits?: AssignedInventoryUnit[];
}

export interface OrderLog {
  id: string;
  orderId: string;
  status: OrderStatus;
  timestamp: string | Date;
  note?: string | null;
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  method: PaymentTransactionMethod;
  gatewayTxnId?: string | null;
  amount: number;
  currency: Currency;
  status: PaymentStatusType;
  idempotencyKey: string;
  metadata?: unknown;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Order {
  id: string;
  channel: SalesChannel;
  customerName: string;
  email: string;
  phone?: string | null;
  date: string | Date;
  subtotal: number;
  gstAmount: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  status: OrderStatus;
  version: number;
  customerId?: string | null;
  customer?: Customer | null;
  shippingStreet?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingZip?: string | null;
  shippingCountry?: string | null;
  paymentMethod?: OrderPaymentMethod | string | null;
  paymentTransactionId?: string | null;
  paymentStatus?: string | null;
  source?: unknown;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  items: OrderItem[];
  logs: OrderLog[];
  payments?: PaymentTransaction[];
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

export interface BuildGuideItem {
  id: string;
  buildGuideId: string;
  productId: string;
  quantity: number;
  product?: Product;
}

export interface BuildGuide {
  id: string;
  title: string;
  description?: string;
  category: Category;
  total: number;
  createdAt: string;
  updatedAt: string;
  items: BuildGuideItem[];
}

export interface BillingProfile {
  id: string;
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
  currency: Currency;
  logoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceLineItem {
  id: string;
  invoiceId?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  taxRatePct: number;
  hsnCode?: string;
}

export type InvoiceAuditEventType =
  | "created"
  | "updated"
  | "sent"
  | "viewed"
  | "paid"
  | "refunded"
  | "cancelled"
  | "note";

export interface InvoiceAuditEvent {
  id: string;
  invoiceId?: string;
  type: InvoiceAuditEventType;
  actor: string;
  message?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  customerId: string;
  customer?: Customer;
  currency: Currency;
  orderId?: string;
  type: InvoiceType;
  subtotal: number;
  taxTotal: number;
  discountPct: number;
  shipping: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  notes?: string;
  sentAt?: string;
  refundedAt?: string;
  cancelledAt?: string;
  paidAt?: string;
  voidedAt?: string;
  createdAt: string;
  dueDate: string;
  lastUpdatedAt: string;
  lineItems: InvoiceLineItem[];
  audit: InvoiceAuditEvent[];
  creditNotes?: CreditNote[];
}

export interface CreditNoteLineItem {
  id: string;
  creditNoteId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  taxRatePct: number;
  hsnCode?: string;
}

export interface CreditNote {
  id: string;
  creditNoteNumber: string;
  originalInvoiceId: string;
  orderId?: string;
  reason: string;
  subtotal: number;
  taxTotal: number;
  total: number;
  createdAt: string;
  lineItems: CreditNoteLineItem[];
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface CreateBrandRequest {
  name: string;
  categories: string[];
}

export type PurchaseOrderStatus =
  | "PENDING"
  | "PARTIAL"
  | "COMPLETED"
  | "CANCELLED";

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  product?: Product;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  warehouseId: string;
  status: PurchaseOrderStatus;
  expectedDelivery?: string;
  createdAt: string;
  updatedAt: string;
  supplier?: Supplier;
  items: PurchaseOrderItem[];
}

export type CheckoutPaymentMethodType = "card" | "upi" | "bank_transfer";

export interface PaymentMethod {
  id: string;
  type: CheckoutPaymentMethodType;
  label: string;
  isDefault: boolean;
  details?: Record<string, string>;
}

export interface ListResponse<T> {
  items: T[];
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  filterOptions?: unknown;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}
