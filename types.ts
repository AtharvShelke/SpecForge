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

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';

export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP';

export type FilterType = 'checkbox' | 'range' | 'boolean';

// ──────────────────────────────────────────────────────
// CATALOG — Product
// ──────────────────────────────────────────────────────

export interface ProductSpec {
  id: string;
  productId: string;
  key: string;
  value: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: Category;
  price: number;
  stock: number;
  image: string;
  description?: string; // nullable in DB

  brandId?: string; // FK to Brand (nullable)
  brand?: Brand;    // included relation

  createdAt: string;
  updatedAt: string;

  specs: ProductSpec[];

  // Frontend-only
  imageFile?: File;
}

/** Convenience type for flat specs (frontend display/compatibility logic) */
export interface ProductSpecsFlat {
  [key: string]: string | string[] | number | undefined;
}

/** Convert ProductSpec[] to flat object for legacy/compat logic */
export function specsToFlat(specs: ProductSpec[]): ProductSpecsFlat {
  const flat: ProductSpecsFlat = {};
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

export interface InventoryItem {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  reserved: number;
  reorderLevel: number;
  costPrice: number;
  location: string;
  lastUpdated?: string; // nullable DateTime

  product?: Product; // included relation
}

export interface StockMovement {
  id: string;
  inventoryItemId: string;
  type: StockMovementType;
  quantity: number;
  reason?: string; // nullable in DB
  performedBy: string;
  createdAt: string;
  // Added for frontend compatibility/lookup
  sku: string;
  date: string;
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
  productId: string;
  name: string;
  category: Category;
  price: number;
  quantity: number;
  image?: string;
  sku?: string;
}

export interface OrderLog {
  id: string;
  orderId: string;
  status: OrderStatus;
  timestamp: string; // ISO DateTime
  note?: string;
}

export interface Order {
  id: string;          // Not auto-generated in DB, must be provided (e.g., ORD-xxx)
  customerName: string;
  email: string;
  phone?: string;
  date: string;        // ISO DateTime
  total: number;
  status: OrderStatus;

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

  createdAt: string;
  updatedAt: string;

  items: OrderItem[];
  logs: OrderLog[];
}

// ──────────────────────────────────────────────────────
// SAVED BUILDS
// ──────────────────────────────────────────────────────

export interface SavedBuildItem {
  id: string;
  savedBuildId: string;
  productId: string;
  quantity: number;
  product?: Product; // included relation
}

export interface SavedBuild {
  id: string;
  name: string;
  total: number;
  createdAt: string;   // ISO DateTime
  items: SavedBuildItem[];
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
  taxRatePct: number; // Default 18 in DB, not nullable
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
  customer?: Customer;  // included relation
  currency: Currency;

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

  createdAt: string;
  dueDate: string;
  lastUpdatedAt: string;

  lineItems: InvoiceLineItem[];
  audit: InvoiceAuditEvent[];
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