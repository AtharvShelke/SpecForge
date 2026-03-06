// ──────────────────────────────────────────────────────
// ENUMS — Must match schema.prisma exactly
// ──────────────────────────────────────────────────────

export enum Category {
  PROCESSOR = 'PROCESSOR',
  GPU = 'GPU',
  MOTHERBOARD = 'MOTHERBOARD',
  RAM = 'RAM',
  STORAGE = 'STORAGE',
  PSU = 'PSU',
  CABINET = 'CABINET',
  COOLER = 'COOLER',
  MONITOR = 'MONITOR',
  PERIPHERAL = 'PERIPHERAL',
  NETWORKING = 'NETWORKING',
  LAPTOP = 'LAPTOP',
}

/** Display labels for categories (frontend-only) */
export const CATEGORY_LABELS: Record<Category, string> = {
  [Category.PROCESSOR]: 'Processor',
  [Category.GPU]: 'Graphics Card',
  [Category.MOTHERBOARD]: 'Motherboard',
  [Category.RAM]: 'RAM',
  [Category.STORAGE]: 'Storage',
  [Category.PSU]: 'Power Supply',
  [Category.CABINET]: 'Cabinet',
  [Category.COOLER]: 'Cooler',
  [Category.MONITOR]: 'Monitor',
  [Category.PERIPHERAL]: 'Peripheral',
  [Category.NETWORKING]: 'Networking',
  [Category.LAPTOP]: 'Laptop',
};

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

export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export type StockMovementType = 'PURCHASE' | 'INWARD' | 'OUTWARD' | 'SALE' | 'RETURN' | 'ADJUSTMENT' | 'RESERVE';

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded' | 'voided';

export type InvoiceType = 'STANDARD' | 'CREDIT_NOTE';

export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP';

export type FilterType = 'checkbox' | 'range' | 'boolean' | 'search' | 'dropdown';

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'WAREHOUSE_STAFF' | 'FINANCE' | 'USER';

export type SalesChannel = 'ONLINE' | 'POS' | 'MANUAL' | 'API' | 'PHONE';

export type PaymentMethodEnum = 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'CASH' | 'WALLET';

export type PaymentStatusType = 'INITIATED' | 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

// ──────────────────────────────────────────────────────
// CATALOG — Product
// ──────────────────────────────────────────────────────

export interface ProductSpec {
  id: string;
  productId: string;
  key: string;
  value: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface ProductMedia {
  id: string;
  productId: string;
  url: string;
  altText?: string;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  attributes?: Record<string, string>;
  status: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  product?: Product; // parent relation
  warehouseInventories?: WarehouseInventory[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  metaTitle?: string;
  metaDescription?: string;
  category: Category;
  description?: string;
  status: ProductStatus;
  deletedAt?: string;
  version: number;

  brandId?: string;
  brand?: Brand;

  createdAt: string;
  updatedAt: string;

  specs: ProductSpec[];
  variants: ProductVariant[];
  media: ProductMedia[];
  tags: Tag[];

  // Frontend-only
  imageFile?: File;
  image?: string;
}

/** Convenience type for flat specs (frontend display/compatibility logic) */
export interface ProductSpecsFlat {
  [key: string]: string | string[] | number | undefined;
}

/** Convert ProductSpec[] to flat object for legacy/compat logic */
export function specsToFlat(specs: ProductSpec[]): ProductSpecsFlat {
  const flat: ProductSpecsFlat = {};
  if (!specs || !Array.isArray(specs)) return flat;
  for (const s of specs) {
    const num = Number(s.value);
    const parsedValue = isNaN(num) ? s.value : num;

    if (flat[s.key] !== undefined) {
      if (Array.isArray(flat[s.key])) {
        (flat[s.key] as Array<string | number>).push(parsedValue);
      } else {
        flat[s.key] = [flat[s.key] as string | number, parsedValue] as any;
      }
    } else {
      flat[s.key] = parsedValue;
    }
  }
  return flat;
}

/** Convert flat object to ProductSpec array for API/DB */
export function flatToSpecs(flat: ProductSpecsFlat): Partial<ProductSpec>[] {
  const specs: Partial<ProductSpec>[] = [];

  for (const [key, value] of Object.entries(flat)) {
    if (value === undefined || value === '') continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        specs.push({ key, value: String(item) });
      }
    } else {
      specs.push({ key, value: String(value) });
    }
  }

  return specs;
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariant: ProductVariant;
}

// ──────────────────────────────────────────────────────
// CATALOG — Brand
// ──────────────────────────────────────────────────────

export interface Brand {
  id: string;
  name: string;
  categories: Category[]; // Maps to DB field 'categories'
  createdAt: string;
  updatedAt: string;
}

// ──────────────────────────────────────────────────────
// CATALOG — Category Hierarchy
// ──────────────────────────────────────────────────────

export interface CategoryNode {
  id?: string;       // DB has id, but tree nodes in frontend may not always have it
  label: string;
  children?: CategoryNode[];
  category?: Category;
  brand?: string;
  query?: string;
  parentId?: string;
  sortOrder?: number;
  isOpen?: boolean;  // Frontend-only UI state
}

// ──────────────────────────────────────────────────────
// CATALOG — Category Schema (attribute definitions)
// ──────────────────────────────────────────────────────

export interface AttributeDefinition {
  id?: string;
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multi-select' | 'boolean';
  options?: string[];
  required: boolean;
  unit?: string;
  sortOrder?: number;
  categorySchemaId?: string;
  dependencyKey?: string;
  dependencyValue?: string;
}

export interface CategorySchema {
  id?: string;
  category: Category;
  attributes: AttributeDefinition[];
  createdAt?: string;
  updatedAt?: string;
}

// ──────────────────────────────────────────────────────
// CATALOG — Filter Config
// ──────────────────────────────────────────────────────

export interface FilterDefinition {
  id?: string;
  key: string;
  label: string;
  type: FilterType;
  options?: string[];
  min?: number;
  max?: number;
  dependencyKey?: string;
  dependencyValue?: string;
  sortOrder?: number;
  categoryFilterConfigId?: string;
  // Frontend convenience accessor
  dependency?: {
    key: string;
    value: string;
  };
}

export interface CategoryFilterConfig {
  id?: string;
  category: Category;
  filters: FilterDefinition[];
  createdAt?: string;
  updatedAt?: string;
}

// ──────────────────────────────────────────────────────
// INVENTORY
// ──────────────────────────────────────────────────────

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseInventory {
  id: string;
  variantId: string;
  warehouseId: string;
  quantity: number;
  reserved: number;
  reorderLevel: number;
  costPrice: number;
  location: string;
  lastUpdated?: string;

  variant?: ProductVariant;
  warehouse?: Warehouse;
}

export interface StockMovement {
  id: string;
  warehouseInventoryId: string;
  warehouseId: string;
  type: StockMovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  performedBy: string;
  orderId?: string;
  purchaseOrderId?: string;
  createdAt: string;
  // Added for frontend compatibility/lookup
  sku: string;
  date: string;
}

// ──────────────────────────────────────────────────────
// SUPPLIERS & PURCHASE ORDERS
// ──────────────────────────────────────────────────────

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
  variantId: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  variant?: ProductVariant;
}

export type PurchaseOrderStatus = "PENDING" | "PARTIAL" | "COMPLETED" | "CANCELLED";

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

// ──────────────────────────────────────────────────────
// CUSTOMER
// ──────────────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ──────────────────────────────────────────────────────
// ORDERS
// ──────────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  orderId: string;
  variantId: string;
  name: string;
  category: Category;
  price: number;
  quantity: number;
  image?: string;
  sku?: string;
  variantSnapshot?: Record<string, any>;
}

export interface OrderLog {
  id: string;
  orderId: string;
  status: OrderStatus;
  timestamp: string; // ISO DateTime
  note?: string;
}

export interface Order {
  id: string;
  channel: SalesChannel;
  customerName: string;
  email: string;
  phone?: string;
  date: string;
  subtotal: number;
  gstAmount: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  status: OrderStatus;
  version: number;

  customerId?: string;
  customer?: Customer;

  // Flat shipping fields (match DB)
  shippingStreet?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingZip?: string;
  shippingCountry?: string;

  // Flat payment fields (match DB)
  paymentMethod?: string;
  paymentTransactionId?: string;
  paymentStatus?: string;
  source?: Record<string, any>;

  createdAt: string;
  updatedAt: string;

  items: OrderItem[];
  logs: OrderLog[];
  payments?: PaymentTransaction[];
}

// ──────────────────────────────────────────────────────
// BUILD GUIDES
// ──────────────────────────────────────────────────────

export interface BuildGuideItem {
  id: string;
  buildGuideId: string;
  variantId: string;
  quantity: number;
  variant?: ProductVariant;
}

export interface BuildGuide {
  id: string;
  title: string;
  description?: string;
  category: string;
  total: number;
  createdAt: string;   // ISO DateTime
  updatedAt: string;
  items: BuildGuideItem[];
}

// ──────────────────────────────────────────────────────
// REVIEWS
// ──────────────────────────────────────────────────────

export interface Review {
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  createdAt: string; // ISO DateTime
}

// ──────────────────────────────────────────────────────
// COMPATIBILITY
// ──────────────────────────────────────────────────────

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

// ──────────────────────────────────────────────────────
// BILLING & INVOICES
// ──────────────────────────────────────────────────────

export interface BillingProfile {
  id: string;
  companyName: string;
  legalName?: string;
  email: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;       // Required in DB
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
  | 'created'
  | 'updated'
  | 'sent'
  | 'viewed'
  | 'paid'
  | 'refunded'
  | 'cancelled'
  | 'note';

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

export type InvoiceFilterStatus = 'all' | InvoiceStatus;

// ──────────────────────────────────────────────────────
// CMS — Landing Page
// ──────────────────────────────────────────────────────

// ================== HERO SECTION ==================
export interface HeroContent {
  badge: {
    icon: boolean;
    text: string;
  };
  headline: {
    line1: string;
    line2: string;
    line2Gradient: boolean;
  };
  subheadline: string;
  primaryCTA: {
    text: string;
    link: string;
  };
  secondaryCTA: {
    text: string;
    link: string;
  };
  stats: Array<{
    value: string;
    label: string;
  }>;
  heroImage: {
    url: string;
    alt: string;
  };
  floatingBadge: {
    title: string;
    subtitle: string;
  };
}

// ================== CATEGORY SECTION ==================
export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  categoryKey: string;
  order: number;
}

export interface CategorySectionContent {
  sectionTitle: string;
  categories: CategoryItem[];
}

// ================== FEATURED PRODUCTS ==================
export interface FeaturedProductsContent {
  sectionTitle: string;
  sectionSubtitle: string;
  productIds: string[];
  ctaText: string;
  ctaLink: string;
}

// ================== TRUST INDICATORS ==================
export interface TrustFeature {
  id: string;
  icon: string;
  title: string;
  description: string;
  order: number;
}

export interface TrustSectionContent {
  features: TrustFeature[];
}

// ================== FINAL CTA ==================
export interface FinalCTAContent {
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaLink: string;
  backgroundStyle: 'gradient' | 'solid' | 'pattern';
}

// ================== COMPLETE LANDING PAGE CMS ==================
export interface CMSContent {
  id: string;
  version: number;
  lastUpdated: string;
  publishedAt?: string;
  status: 'published' | 'draft' | 'archived';
  sections: {
    hero: HeroContent;
    categories: CategorySectionContent;
    featuredProducts: FeaturedProductsContent;
    trustIndicators: TrustSectionContent;
    finalCTA: FinalCTAContent;
  };
}

export interface LandingPageCMS {
  id: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  content: CMSContent;
}

// ================== CMS HISTORY & VERSIONING ==================
export interface CMSVersion {
  id: string;
  version: number; // Added for convenience/usage in cmsData
  pageId: string;
  content: CMSContent; // Storing the content snapshot
  label?: string;
  createdAt: string;
  createdBy?: string;
  note?: string;
}

export interface CMSHistory {
  versions: CMSVersion[];
  current: string;
}

// ================== PAYMENT (frontend-only, for order form) ==================
export type PaymentMethodType = 'card' | 'upi' | 'bank_transfer';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  label: string;
  isDefault: boolean;
  details?: Record<string, string>;
}

// ──────────────────────────────────────────────────────
// PAYMENT TRANSACTIONS
// ──────────────────────────────────────────────────────

export interface PaymentTransaction {
  id: string;
  orderId: string;
  method: PaymentMethodEnum;
  gatewayTxnId?: string;
  amount: number;
  currency: Currency;
  status: PaymentStatusType;
  idempotencyKey: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// ──────────────────────────────────────────────────────
// CREDIT NOTES
// ──────────────────────────────────────────────────────

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

// ──────────────────────────────────────────────────────
// AUDIT LOG
// ──────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: string;
}


// ──────────────────────────────────────────────────────
// Order manager 
// ──────────────────────────────────────────────────────

export interface StatusConfig {
  label: string;
  badgeClass: string;
  dotClass: string;
  icon: React.ReactNode;
  description: string;
}