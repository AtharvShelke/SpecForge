export enum Category {
  PROCESSOR = 'Processor',
  MOTHERBOARD = 'Motherboard',
  RAM = 'RAM',
  GPU = 'Graphics Card',
  STORAGE = 'Storage',
  PSU = 'Power Supply',
  CABINET = 'Cabinet',
  COOLER = 'Cooler',
  MONITOR = 'Monitor',
  PERIPHERAL = 'Peripheral',
  NETWORKING = 'Networking'
}

export interface ProductSpecs {
  socket?: string;
  ramType?: string;
  wattage?: number; // For PSU (capacity) or Others (consumption)
  formFactor?: string;
  slots?: number;
  capacity?: string;
  frequency?: string;
  brand?: string;
  [key: string]: string | number | undefined; // Allow flexible specs
}

export interface Product {
  id: string;
  sku: string; // Added for Inventory Linkage
  name: string;
  category: Category;
  price: number;
  image: string;
  imageFile?: File; // For admin product creation
  stock: number; // Kept for frontend compatibility, derived from Inventory in logic
  specs: ProductSpecs;
  description: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface SavedBuild {
  id: string;
  name: string;
  date: string;
  items: CartItem[];
  total: number;
}

export interface Review {
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

export enum CompatibilityLevel {
  COMPATIBLE = 'COMPATIBLE',
  WARNING = 'WARNING',
  INCOMPATIBLE = 'INCOMPATIBLE'
}

export interface CompatibilityIssue {
  level: CompatibilityLevel;
  message: string;
  componentIds: string[];
}

export interface CompatibilityReport {
  status: CompatibilityLevel;
  issues: CompatibilityIssue[];
}

// --- ORDER MANAGEMENT TYPES ---

export enum OrderStatus {
  PENDING = 'Pending',         // Order placed, stock reserved
  PAID = 'Paid',               // Payment confirmed
  PROCESSING = 'Processing',   // Being packed
  SHIPPED = 'Shipped',         // Handed to courier (Stock leaves building)
  DELIVERED = 'Delivered',     // Customer received
  CANCELLED = 'Cancelled',     // Stock returns to available
  RETURNED = 'Returned'        // Stock added back as inward
}

export interface OrderLog {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface PaymentDetails {
  method: 'Credit Card' | 'UPI' | 'Net Banking' | 'EMI';
  transactionId?: string;
  status: 'Pending' | 'Success' | 'Failed';
}

export interface Order {
  id: string;
  customerName: string;
  email: string; // Contact info
  date: string;
  total: number;
  status: OrderStatus;
  items: CartItem[];
  shippingAddress: ShippingAddress;
  payment: PaymentDetails;
  logs: OrderLog[];
}

// --- NEW TYPES FOR DYNAMIC CATALOG ---

export interface AttributeDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  options?: string[]; // For select type
  required: boolean;
  unit?: string;
}

export interface Brand {
  id: string;
  name: string;
  linkedCategories: Category[]; // Categories this brand produces for
}

export interface CategorySchema {
  category: Category;
  attributes: AttributeDefinition[];
}

export interface CategoryNode {
  label: string;
  children?: CategoryNode[];
  // Filter logic
  category?: Category;
  brand?: string;
  query?: string; // Matches against product name or specs
  isOpen?: boolean; // Initial UI state
}

// --- FILTER SYSTEM TYPES ---

export interface FilterDefinition {
  key: string; // Property path, e.g. 'specs.socket', 'specs.brand', 'stock_status'
  label: string;
  type: 'checkbox' | 'range' | 'boolean';
  options?: string[]; // Force specific order or available options
  dependency?: {
    key: string; // The parent filter key
    value: string; // The value that must be selected in parent to show this
  };
}

export interface CategoryFilterConfig {
  category: Category;
  filters: FilterDefinition[];
}

// --- INVENTORY MANAGEMENT TYPES ---

export interface InventoryItem {
  sku: string;
  productId: string;
  quantity: number; // Available to sell
  reserved: number; // Committed to pending orders
  reorderLevel: number;
  costPrice: number;
  location: string;
  lastUpdated: string;
}

export type StockMovementType = 'PURCHASE' | 'INWARD' | 'OUTWARD' | 'ADJUSTMENT' | 'SALE' | 'RETURN' | 'RESERVE';

export interface StockMovement {
  id: string;
  sku: string;
  type: StockMovementType;
  quantity: number;
  date: string;
  reason: string;
  performedBy: string; // e.g., 'Admin' or 'System'
}

// ---------------------------------------------------------------------------------------
// Invoices and Billing
// ----------------------------------------------------------------------------------------
export type Currency = "INR" | "USD" | "EUR";

export type InvoiceStatus =
  | "draft"
  | "pending"
  | "paid"
  | "overdue"
  | "cancelled"
  | "refunded";

export type PaymentMethodType = "card" | "upi" | "bank_transfer";

export type InvoiceLineItem = {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number; // in minor units? We'll use major units for simplicity.
  taxRatePct?: number; // 0-100
};

export type BillingProfile = {
  companyName: string;
  legalName?: string;
  email: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  gstin?: string;
  currency: Currency;
};

export type Customer = {
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
};

export type PaymentMethod = {
  id: string;
  type: PaymentMethodType;
  label: string; // e.g. "Visa •••• 4242"
  isDefault: boolean;
  details?: Record<string, string>;
};

export type InvoiceAuditEventType =
  | "created"
  | "updated"
  | "sent"
  | "viewed"
  | "paid"
  | "refunded"
  | "cancelled"
  | "note";

export type InvoiceAuditEvent = {
  id: string;
  type: InvoiceAuditEventType;
  createdAt: string; // ISO
  actor: string; // "Admin", "System"
  message: string;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  status: "draft" | "pending" | "paid" | "overdue" | "cancelled" | "refunded";
  customer: Customer;
  createdAt: string; // ISO
  dueDate: string; // ISO
  sentAt?: string; // ISO
  paidAt?: string; // ISO
  refundedAt?: string; // ISO
  cancelledAt?: string; // ISO
  currency: Currency;
  lineItems: InvoiceLineItem[];
  discountPct?: number; // 0-100
  shipping?: number; // major units
  notes?: string;
  subtotal: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  lastUpdatedAt: string; // ISO
  audit: InvoiceAuditEvent[];
};

export type InvoiceFilterStatus = "all" | InvoiceStatus;

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
  icon: string; // Icon name from lucide-react
  categoryKey: string; // Maps to Category enum
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
  productIds: string[]; // IDs of products to feature
  ctaText: string;
  ctaLink: string;
}

// ================== TRUST INDICATORS ==================
export interface TrustFeature {
  id: string;
  icon: string; // Icon name from lucide-react
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
export interface LandingPageCMS {
  id: string;
  version: number;
  lastUpdated: string;
  publishedAt?: string;
  status: 'draft' | 'published';
  sections: {
    hero: HeroContent;
    categories: CategorySectionContent;
    featuredProducts: FeaturedProductsContent;
    trustIndicators: TrustSectionContent;
    finalCTA: FinalCTAContent;
  };
}

// ================== CMS HISTORY & VERSIONING ==================
export interface CMSVersion {
  id: string;
  version: number;
  content: LandingPageCMS;
  createdAt: string;
  createdBy: string;
  note?: string;
}

export interface CMSHistory {
  versions: CMSVersion[];
  current: string; // ID of current version
}