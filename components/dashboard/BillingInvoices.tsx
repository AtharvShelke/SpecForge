"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useShop } from "@/context/ShopContext";
import { useAdmin } from "@/context/AdminContext";
import { InvoiceStatus, InvoiceType } from "@/types";
import type {
  Invoice,
  InvoiceLineItem,
  InvoiceAuditEvent,
  CreateInvoice,
  Customer,
  BillingProfile,
  Product,
} from "@/types";
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Download,
  Edit,
  FileText,
  Hash,
  Mail,
  MapPin,
  Minus,
  MoreHorizontal,
  Package,
  Plus,
  Printer,
  ReceiptText,
  RefreshCcw,
  RefreshCw,
  Search,
  Send,
  ShoppingCart,
  StickyNote,
  Tag,
  Trash2,
  TrendingUp,
  User,
  Wallet,
  X,
  XCircle,
  Zap,
  Smartphone,
  Banknote,
  Building2,
  AlertTriangle,
  Shield,
  Monitor,
  Layout,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InvoiceLineItems } from "@/components/invoices/InvoiceLineItems";
import { InvoiceAuditTrail } from "@/components/invoices/InvoiceAuditTrail";
import { InvoiceActions } from "@/components/invoices/InvoiceActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// STATIC DATA & TYPES
// ─────────────────────────────────────────────────────────────

// BILLING_PROFILE is no longer hardcoded here.
// It is fetched from the database via BillingContext.billingProfile
// and passed into buildInvoiceHtml() at the call site.
// A fallback stub is used only if the profile hasn't loaded yet.
const BILLING_PROFILE_STUB: BillingProfile = {
  id: "",
  companyName: "Your Company",
  legalName: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: null,
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  gstin: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const now_iso = new Date().toISOString();
const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "cust_1",
    name: "Rahul Sharma",
    email: "rahul.sharma@example.com",
    phone: "+91 98765 43210",
    company: "Tech Solutions Ltd",
    addressLine1: "45, Business Center",
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "400001",
    country: "India",
    createdAt: now_iso,
    updatedAt: now_iso,
  },
  {
    id: "cust_2",
    name: "Priya Patel",
    email: "priya.patel@example.com",
    phone: "+91 99887 77665",
    company: "Digital Ventures",
    addressLine1: "78, Innovation Hub",
    city: "Pune",
    state: "Maharashtra",
    postalCode: "411001",
    country: "India",
    createdAt: now_iso,
    updatedAt: now_iso,
  },
  {
    id: "cust_3",
    name: "Amit Singh",
    email: "amit.singh@example.com",
    phone: "+91 98888 77777",
    company: "Enterprise Corp",
    addressLine1: "90, Corporate Tower",
    city: "Delhi",
    state: "Delhi",
    postalCode: "110001",
    country: "India",
    createdAt: now_iso,
    updatedAt: now_iso,
  },
  {
    id: "cust_4",
    name: "Meera Nair",
    email: "meera.nair@example.com",
    phone: "+91 94440 11223",
    company: "StartupLab",
    addressLine1: "22, Kaloor Junction",
    city: "Kochi",
    state: "Kerala",
    postalCode: "682017",
    country: "India",
    createdAt: now_iso,
    updatedAt: now_iso,
  },
  {
    id: "cust_5",
    name: "Vikram Desai",
    email: "vikram.desai@company.in",
    phone: "+91 97770 33445",
    company: "CreativeWorks",
    addressLine1: "67, Baner Road",
    city: "Pune",
    state: "Maharashtra",
    postalCode: "411045",
    country: "India",
    createdAt: now_iso,
    updatedAt: now_iso,
  },
];

type PaymentMethod = "cash" | "upi" | "card" | "bank_transfer";

interface PaymentMethodConfig {
  id: PaymentMethod;
  label: string;
  icon: React.ReactNode;
  color: string;
  placeholder?: string;
}

const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: "cash",
    label: "Cash",
    icon: <Banknote size={16} />,
    color: "text-emerald-700 bg-emerald-50 border-emerald-300",
  },
  {
    id: "upi",
    label: "UPI",
    icon: <Smartphone size={16} />,
    color: "text-violet-700 bg-violet-50 border-violet-300",
    placeholder: "UPI Ref / UTR",
  },
  {
    id: "card",
    label: "Card",
    icon: <CreditCard size={16} />,
    color: "text-blue-700 bg-blue-50 border-blue-300",
    placeholder: "Last 4 digits",
  },
  {
    id: "bank_transfer",
    label: "Bank Transfer",
    icon: <Building2 size={16} />,
    color: "text-slate-700 bg-slate-50 border-slate-300",
    placeholder: "NEFT/RTGS Ref",
  },
];

const INV_STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; dotClass: string; badgeClass: string }
> = {
  DRAFT: {
    label: "Draft",
    dotClass: "bg-slate-400",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
  },
  PENDING: {
    label: "Pending",
    dotClass: "bg-amber-400",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  PAID: {
    label: "Paid",
    dotClass: "bg-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  OVERDUE: {
    label: "Overdue",
    dotClass: "bg-red-500",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
  },
  CANCELLED: {
    label: "Cancelled",
    dotClass: "bg-rose-400",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
  },
  REFUNDED: {
    label: "Refunded",
    dotClass: "bg-indigo-400",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  VOIDED: {
    label: "Voided",
    dotClass: "bg-gray-500",
    badgeClass: "bg-gray-100 text-gray-600 border-gray-300",
  },
};

// ─────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────

const uid = (prefix = "id") =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const fmtINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/** Recompute subtotal, tax, discount, total from line items */
const computeTotals = (
  items: InvoiceLineItem[],
  discountPct: number,
  shipping: number,
) => {
  const safeItems = items || [];
  const safeDiscount = discountPct || 0;
  const safeShipping = shipping || 0;
  const subtotal = safeItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const taxTotal = safeItems.reduce(
    (s, i) => s + i.quantity * i.unitPrice * ((i.taxRatePct ?? 18) / 100),
    0,
  );
  const discountAmount = (subtotal * safeDiscount) / 100;
  const total = subtotal + taxTotal - discountAmount + safeShipping;
  return { subtotal, taxTotal, discountAmount, total };
};

/** Generate printable HTML invoice */
const buildInvoiceHtml = (
  invoice: Invoice,
  profile: BillingProfile,
): string => {
  const { subtotal, taxTotal, discountAmount, total } = computeTotals(
    invoice.lineItems || [],
    invoice.discountPct ?? 0,
    invoice.shipping ?? 0,
  );
  const rows = (invoice.lineItems || [])
    .map((i) => {
      const lineTotal = i.quantity * i.unitPrice;
      const tax = lineTotal * ((i.taxRatePct ?? 18) / 100);
      return `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9">
          <strong style="color:#1e293b">${i.name}</strong>
          ${i.description ? `<br/><small style="color:#94a3b8">${i.description}</small>` : ""}
          ${i.lineReference ? `<br/><small style="color:#64748b;font-family:monospace">${i.lineReference}</small>` : ""}
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-family:monospace">${i.productNumber || "-"}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-family:monospace">${i.partNumber || "-"}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-family:monospace">${i.serialNumber || "-"}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:center">${i.quantity}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:right">${fmtINR(i.unitPrice)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:right;color:#6366f1">${i.taxRatePct ?? 18}%</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:700;color:#1e293b">${fmtINR(lineTotal + tax)}</td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
  <title>${invoice.invoiceNumber}</title>
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',sans-serif;color:#334155;background:#fff}
  .page{max-width:820px;margin:0 auto;padding:52px 44px}
  .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:32px;border-bottom:2px solid #e2e8f0;margin-bottom:32px}
  .brand-name{font-size:24px;font-weight:900;color:#1e293b;letter-spacing:-0.5px}
  .brand-sub{font-size:11px;color:#94a3b8;margin-top:4px;line-height:1.6}
  .inv-meta{text-align:right}.inv-num{font-size:30px;font-weight:900;color:#6366f1;letter-spacing:-1px}
  .inv-label{font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px}
  .chip{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:#dcfce7;color:#15803d;margin-top:6px}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:32px}
  .sec-label{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
  .sec-val{font-size:13px;line-height:1.75;color:#475569}
  table{width:100%;border-collapse:collapse;margin-bottom:24px}
  thead{background:#f8fafc}thead th{padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;text-align:left;border-bottom:2px solid #e2e8f0}
  thead th:nth-child(5){text-align:center}
  thead th:nth-child(6),thead th:nth-child(7),thead th:nth-child(8){text-align:right}
  .totals{margin-left:auto;max-width:280px;background:#f8fafc;border-radius:12px;padding:16px 20px}
  .tot-row{display:flex;justify-content:space-between;font-size:13px;padding:4px 0;color:#64748b}
  .tot-final{font-size:17px;font-weight:900;color:#1e293b;border-top:2px solid #e2e8f0;padding-top:10px;margin-top:8px;display:flex;justify-content:space-between}
  .footer{margin-top:48px;padding-top:20px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:11px;color:#94a3b8}
  @media print{.page{padding:20px}}
  </style></head><body><div class="page">
  <div class="header">
    <div>
      <div class="brand-name">${profile.companyName}</div>
      <div class="brand-sub">${profile.addressLine1}${profile.addressLine2 ? ", " + profile.addressLine2 : ""}, ${profile.city} – ${profile.postalCode}<br/>
      GSTIN: ${profile.gstin || "N/A"} &nbsp;|&nbsp; ${profile.email}</div>
    </div>
    <div class="inv-meta">
      <div class="inv-label">Invoice</div>
      <div class="inv-num">${invoice.invoiceNumber}</div>
      <div style="font-size:12px;color:#64748b;margin-top:4px">Date: ${fmtDate(invoice.createdAt)}</div>
      <div style="font-size:12px;color:#64748b">Due: ${fmtDate(invoice.dueDate)}</div>
      <span class="chip">${invoice.status.toUpperCase()}</span>
    </div>
  </div>
  <div class="grid2">
    <div>
      <div class="sec-label">Bill To</div>
      <div class="sec-val">
        ${
          invoice.customer
            ? `<strong style="color:#1e293b">${invoice.customer.name}</strong><br/>
             ${invoice.customer.company ? invoice.customer.company + "<br/>" : ""}
             ${invoice.customer.email}<br/>
             ${invoice.customer.addressLine1 ? invoice.customer.addressLine1 + "<br/>" : ""}
             ${invoice.customer.city ? invoice.customer.city + ", " : ""}${invoice.customer.state || ""} ${invoice.customer.postalCode || ""}`
            : '<strong style="color:#ef4444">Customer Information Missing</strong>'
        }
      </div>
    </div>
    <div>
      <div class="sec-label">Payment Info</div>
      <div class="sec-val">
        <strong>Invoice #:</strong> ${invoice.invoiceNumber}<br/>
        <strong>Created:</strong> ${fmtDate(invoice.createdAt)}<br/>
        <strong>Due Date:</strong> ${fmtDate(invoice.dueDate)}<br/>
        <strong>Status:</strong> ${invoice.status.toUpperCase()}
        ${invoice.notes ? "<br/><br/><em>" + invoice.notes + "</em>" : ""}
      </div>
    </div>
  </div>
  <table><thead><tr>
    <th>Description</th><th>Product #</th><th>Part #</th><th>Serial #</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Tax</th><th style="text-align:right">Amount</th>
  </tr></thead><tbody>${rows}</tbody></table>
  <div class="totals">
    <div class="tot-row"><span>Subtotal</span><span>${fmtINR(subtotal)}</span></div>
    <div class="tot-row"><span>Tax (GST)</span><span>${fmtINR(taxTotal)}</span></div>
    ${discountAmount > 0 ? `<div class="tot-row" style="color:#16a34a"><span>Discount (${invoice.discountPct}%)</span><span>–${fmtINR(discountAmount)}</span></div>` : ""}
    ${(invoice.shipping ?? 0) > 0 ? `<div class="tot-row"><span>Shipping</span><span>${fmtINR(invoice.shipping!)}</span></div>` : ""}
    <div class="tot-final"><span>Total Due</span><span style="color:#6366f1">${fmtINR(total)}</span></div>
  </div>
  <div class="footer">
    <span>Thank you for your business!</span>
    <span>${invoice.invoiceNumber} · Generated ${new Date().toLocaleDateString("en-IN")}</span>
  </div>
  </div></body></html>`;
};

// ─────────────────────────────────────────────────────────────
// SHARED SUB-COMPONENTS (mirrored from OrderManager style)
// ─────────────────────────────────────────────────────────────

const InvStatusBadge = ({ status }: { status: InvoiceStatus }) => {
  const cfg = INV_STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-medium uppercase tracking-wide border transition-all duration-150",
        cfg?.badgeClass,
        status === "PAID" && "bg-emerald-600 text-white border-emerald-600",
        status === "OVERDUE" && "bg-red-600 text-white border-red-600",
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full flex-shrink-0",
          status === "PAID"
            ? "bg-white"
            : status === "OVERDUE"
              ? "bg-white"
              : cfg?.dotClass,
        )}
      />
      {cfg?.label || status}
    </span>
  );
};

const MetaItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-start gap-3 min-w-0 group">
    <div className="w-9 h-9 rounded-lg bg-zinc-50 border border-zinc-100 text-zinc-400 flex items-center justify-center shrink-0 transition-all group-hover:bg-zinc-900 group-hover:text-white group-hover:border-zinc-800 shadow-sm">
      {icon}
    </div>
    <div className="min-w-0 space-y-0.5">
      <p className="text-xs font-medium text-zinc-400">{label}</p>
      <div className="text-sm font-semibold text-zinc-900 truncate">
        {value}
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// POS COUNTER — Left panel of "New Sale" flow
// ─────────────────────────────────────────────────────────────

interface PosCartItem extends InvoiceLineItem {
  productId?: string;
  image?: string;
}

interface PosState {
  customer: Customer | null;
  items: PosCartItem[];
  discountPct: number;
  shipping: number;
  notes: string;
  paymentMethod: PaymentMethod;
  paymentRef: string;
  cashTendered: string;
}

const EMPTY_POS: PosState = {
  customer: null,
  items: [],
  discountPct: 0,
  shipping: 0,
  notes: "",
  paymentMethod: "cash",
  paymentRef: "",
  cashTendered: "",
};

interface PosCounterProps {
  products: (Product & { stock: number })[];
  customers: Customer[];
  onComplete: (invoice: Invoice) => void;
  onCancel: () => void;
}

const PosCounter: React.FC<PosCounterProps> = ({
  products,
  customers,
  onComplete,
  onCancel,
}) => {
  const [pos, setPos] = useState<PosState>(EMPTY_POS);
  const [productSearch, setProductSearch] = useState("");
  const [manualItem, setManualItem] = useState({
    name: "",
    price: "",
    qty: "1",
    tax: "18",
  });
  const [addMode, setAddMode] = useState<"catalog" | "manual">("catalog");
  const [showPayDialog, setShowPayDialog] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products.slice(0, 20);
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.variants?.[0]?.sku || "").toLowerCase().includes(q) ||
          (p.subCategory?.name || "").toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [products, productSearch]);

  const { subtotal, taxTotal, discountAmount, total } = useMemo(
    () => computeTotals(pos.items, pos.discountPct, pos.shipping),
    [pos.items, pos.discountPct, pos.shipping],
  );

  const cashChange = useMemo(() => {
    const tendered = parseFloat(pos.cashTendered) || 0;
    return tendered - total;
  }, [pos.cashTendered, total]);

  const addProduct = useCallback((p: Product) => {
    setPos((prev) => {
      const existing = prev.items.find((i) => i.productId === p.id);
      if (existing) {
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        };
      }
      const newItem: PosCartItem = {
        id: uid("li"),
        invoiceId: "",
        productId: p.id,
        name: p.name,
        description: p.subCategory?.name || "",
        quantity: 1,
        unitPrice: p.variants?.[0]?.price || 0,
        taxRatePct: 18,
        image: p.media?.[0]?.url || "/placeholder.png",
      };
      return { ...prev, items: [...prev.items, newItem] };
    });
    setProductSearch("");
  }, []);

  const addManualItem = () => {
    if (!manualItem.name || !manualItem.price) return;
    const newItem: PosCartItem = {
      id: uid("li"),
      invoiceId: "",
      name: manualItem.name,
      quantity: parseInt(manualItem.qty) || 1,
      unitPrice: parseFloat(manualItem.price) || 0,
      taxRatePct: parseFloat(manualItem.tax) || 18,
    };
    setPos((prev) => ({ ...prev, items: [...prev.items, newItem] }));
    setManualItem({ name: "", price: "", qty: "1", tax: "18" });
  };

  const updateQty = (id: string, delta: number) => {
    setPos((prev) => ({
      ...prev,
      items: prev.items.flatMap((i) => {
        if (i.id !== id) return [i];
        const newQty = i.quantity + delta;
        return newQty < 1 ? [] : [{ ...i, quantity: newQty }];
      }),
    }));
  };

  const removeItem = (id: string) => {
    setPos((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== id),
    }));
  };

  const handleCharge = () => {
    if (!pos.customer) return;
    if (pos.items.length === 0) return;
    if (pos.paymentMethod === "cash" && parseFloat(pos.cashTendered) < total)
      return;
    setShowPayDialog(false);

    const now = new Date().toISOString();
    const invoice: Invoice = {
      id: uid("inv"),
      invoiceNumber: `INV-${Date.now().toString().slice(-7)}`,
      status: InvoiceStatus.PAID,
      type: InvoiceType.STANDARD,
      customerId: pos.customer.id,
      customer: pos.customer,
      createdAt: now,
      dueDate: now,
      paidAt: now,
      lineItems: pos.items,
      discountPct: pos.discountPct,
      shipping: pos.shipping,
      notes: pos.notes || undefined,
      subtotal,
      taxTotal,
      total,
      amountPaid: total,
      amountDue: 0,
      lastUpdatedAt: now,
      audit: [
        {
          id: uid("ev"),
          invoiceId: "",
          type: "created",
          createdAt: now,
          actor: "Admin",
          message: "POS sale created",
        },
        {
          id: uid("ev"),
          invoiceId: "",
          type: "paid",
          createdAt: now,
          actor: "Admin",
          message: `Paid via ${pos.paymentMethod.toUpperCase()}${pos.paymentRef ? " · Ref: " + pos.paymentRef : ""}`,
        },
      ],
    };

    onComplete(invoice);
    setPos(EMPTY_POS);
  };

  const selectedPmConfig = PAYMENT_METHODS.find(
    (p) => p.id === pos.paymentMethod,
  )!;

  return (
    <div className="flex flex-col xl:flex-row h-full min-h-0 bg-white">
      {/* ── LEFT: Product Search ── */}
      <div className="flex flex-col xl:w-[480px] shrink-0 border-r border-zinc-200 bg-zinc-50/50">
        <div className="px-6 py-5 border-b border-zinc-200 bg-white">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center shadow-sm">
                <ShoppingCart size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">
                  Point of Sale
                </h3>
                <p className="text-xs text-zinc-400">New sale</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-8 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 text-xs font-medium gap-2"
            >
              <X size={14} /> Cancel
            </Button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-2 block">
                Customer
              </label>
              <Select
                value={pos.customer?.id ?? ""}
                onValueChange={(v: string) =>
                  setPos((p) => ({
                    ...p,
                    customer: customers.find((c) => c.id === v) ?? null,
                  }))
                }
              >
                <SelectTrigger className="h-10 text-xs font-medium border-zinc-200 bg-white focus:ring-zinc-900">
                  <SelectValue placeholder="Select customer…" />
                </SelectTrigger>
                <SelectContent className="bg-white border-zinc-200 shadow-2xl">
                  {customers.map((c) => (
                    <SelectItem
                      key={c.id}
                      value={c.id}
                      className="text-xs font-medium"
                    >
                      <div className="flex flex-col">
                        <span className="text-zinc-900">{c.name}</span>
                        {c.company && (
                          <span className="text-[8px] text-zinc-400">
                            {c.company}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tabs
              value={addMode}
              onValueChange={(v: string) =>
                setAddMode(v as "catalog" | "manual")
              }
            >
              <TabsList className="h-10 w-full bg-zinc-100 p-1 rounded-xl">
                <TabsTrigger
                  value="catalog"
                  className="flex-1 text-xs font-medium gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                >
                  <Package size={14} /> Catalog
                </TabsTrigger>
                <TabsTrigger
                  value="manual"
                  className="flex-1 text-xs font-medium gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                >
                  <Edit size={14} /> Manual
                </TabsTrigger>
              </TabsList>

              <TabsContent value="catalog" className="mt-4 space-y-4">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <Input
                    ref={searchRef}
                    placeholder="Search products…"
                    value={productSearch}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setProductSearch(e.target.value)
                    }
                    className="pl-10 h-10 text-xs font-medium border-zinc-200 bg-white focus:ring-zinc-900"
                  />
                </div>
                <ScrollArea className="h-[280px]">
                  <div className="space-y-2 pr-4">
                    {filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => addProduct(p)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white border border-zinc-100 hover:border-zinc-300 hover:shadow-sm text-left transition-all group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-100 shrink-0 overflow-hidden flex items-center justify-center p-2">
                          <img
                            src={p.media?.[0]?.url || "/placeholder.png"}
                            alt={p.name}
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://picsum.photos/100/100";
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-zinc-900 truncate group-hover:text-zinc-600 transition-colors">
                            {p.name}
                          </p>
                          <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                            {p.variants?.[0]?.sku || "NO-SKU"}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-semibold text-zinc-900">
                            {fmtINR(p.variants?.[0]?.price || 0)}
                          </p>
                          {(p.stock || 0) <= 5 && (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-medium bg-red-50 text-red-600 border-red-100 mt-1 h-4 px-1.5 rounded"
                            >
                              Low Stock
                            </Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="manual" className="mt-4 space-y-4">
                <div className="space-y-3 p-4 bg-white border border-zinc-200 rounded-lg shadow-sm">
                  <Input
                    placeholder="Item name *"
                    className="h-10 text-xs font-medium border-zinc-200 focus:ring-zinc-900"
                    value={manualItem.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setManualItem((m) => ({ ...m, name: e.target.value }))
                    }
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      type="number"
                      placeholder="Price"
                      className="h-10 text-xs font-medium border-zinc-200 focus:ring-zinc-900"
                      value={manualItem.price}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setManualItem((m) => ({ ...m, price: e.target.value }))
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      className="h-10 text-xs font-medium border-zinc-200 focus:ring-zinc-900"
                      value={manualItem.qty}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setManualItem((m) => ({ ...m, qty: e.target.value }))
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Tax %"
                      min="0"
                      max="100"
                      className="h-10 text-xs font-medium border-zinc-200 focus:ring-zinc-900"
                      value={manualItem.tax}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setManualItem((m) => ({ ...m, tax: e.target.value }))
                      }
                    />
                  </div>
                  <Button
                    size="sm"
                    className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition-all shadow-sm"
                    onClick={addManualItem}
                  >
                    <Plus size={14} className="mr-2" /> Add Item
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="flex-1 p-6 space-y-6">
          <div>
            <label className="text-xs font-medium text-zinc-500 mb-3 block">
              Sale Options
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-500 ml-1">
                  Discount %
                </p>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  className="h-10 text-xs font-medium border-zinc-200 bg-white focus:ring-zinc-900"
                  value={pos.discountPct}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPos((p) => ({
                      ...p,
                      discountPct: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-500 ml-1">
                  Shipping
                </p>
                <Input
                  type="number"
                  min="0"
                  className="h-10 text-xs font-medium border-zinc-200 bg-white focus:ring-zinc-900"
                  value={pos.shipping}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPos((p) => ({
                      ...p,
                      shipping: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-500 mb-3 block">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() =>
                    setPos((p) => ({
                      ...p,
                      paymentMethod: m.id,
                      paymentRef: "",
                      cashTendered: "",
                    }))
                  }
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg border text-xs font-medium transition-all shadow-sm",
                    pos.paymentMethod === m.id
                      ? "bg-zinc-900 text-white border-zinc-900 ring-2 ring-zinc-100"
                      : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300",
                  )}
                >
                  <span
                    className={cn(
                      pos.paymentMethod === m.id
                        ? "text-white"
                        : "text-zinc-400",
                    )}
                  >
                    {m.icon}
                  </span>
                  {m.label}
                </button>
              ))}
            </div>

            <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
              {pos.paymentMethod === "cash" ? (
                <div className="p-4 bg-zinc-900 rounded-lg space-y-3 border border-zinc-800 shadow-sm">
                  <p className="text-xs font-medium text-zinc-400">
                    Cash tendered
                  </p>
                  <Input
                    type="number"
                    placeholder={`Min: ${fmtINR(total)}`}
                    className="h-10 bg-white/5 border-white/10 text-white font-semibold text-sm focus:ring-white/20"
                    value={pos.cashTendered}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPos((p) => ({ ...p, cashTendered: e.target.value }))
                    }
                  />
                  {pos.cashTendered && (
                    <div
                      className={cn(
                        "px-3 py-2 rounded-md text-xs font-medium flex items-center justify-between",
                        cashChange >= 0
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400",
                      )}
                    >
                      <span>{cashChange >= 0 ? "Change" : "Insufficient"}</span>
                      <span>{fmtINR(Math.abs(cashChange))}</span>
                    </div>
                  )}
                </div>
              ) : (
                selectedPmConfig.placeholder && (
                  <div className="p-4 bg-white border border-zinc-200 rounded-lg space-y-3 shadow-sm">
                    <p className="text-xs font-medium text-zinc-400">
                      {selectedPmConfig.placeholder}
                    </p>
                    <Input
                      placeholder="Enter reference…"
                      className="h-10 text-xs font-medium border-zinc-200 focus:ring-zinc-900"
                      value={pos.paymentRef}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setPos((p) => ({ ...p, paymentRef: e.target.value }))
                      }
                    />
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Cart + Finalize ── */}
      <div className="flex flex-col flex-1 min-w-0 bg-white">
        <div className="px-6 py-5 border-b border-zinc-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ReceiptText size={18} className="text-zinc-400" />
              <h3 className="text-lg font-semibold text-zinc-900">Cart</h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="h-6 rounded-md text-xs font-medium bg-zinc-50 border-zinc-200 text-zinc-500"
              >
                {pos.items.length} items
              </Badge>
              {pos.items.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  onClick={() => setPos((p) => ({ ...p, items: [] }))}
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-6">
          {pos.items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
              <div className="w-24 h-24 rounded-[2rem] border-4 border-dashed border-zinc-200 flex items-center justify-center mb-6">
                <ShoppingCart size={40} className="text-zinc-300" />
              </div>
              <p className="text-sm font-medium">No items added</p>
              <p className="text-xs text-zinc-400 mt-2 max-w-xs leading-relaxed">
                Search products or add items manually to start the sale.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pos.items.map((item) => {
                const lineTotal = item.quantity * item.unitPrice;
                const lineTax = lineTotal * ((item.taxRatePct ?? 18) / 100);
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-zinc-100 hover:border-zinc-300 transition-all group bg-zinc-50/30"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-white border border-zinc-100 p-2 shrink-0 flex items-center justify-center shadow-sm">
                      <img
                        src={item.image || "/placeholder.png"}
                        alt={item.name}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://picsum.photos/100/100";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {fmtINR(item.unitPrice)} · GST {item.taxRatePct}%
                      </p>
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-zinc-200 p-1.5 rounded-xl shrink-0 shadow-sm">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-all"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center text-xs font-semibold text-zinc-900 tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-all"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="w-32 text-right shrink-0">
                      <p className="text-sm font-semibold text-zinc-900 tabular-nums">
                        {fmtINR(lineTotal + lineTax)}
                      </p>
                      <p className="text-[10px] text-zinc-300 mt-0.5">
                        incl. tax
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="w-10 h-10 text-zinc-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="p-6 border-t border-zinc-100 bg-zinc-50/50">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-8 pb-8 border-b border-zinc-200">
            <div>
              <p className="text-xs font-medium text-zinc-400 mb-0.5">
                Subtotal
              </p>
              <p className="text-sm font-semibold text-zinc-900">
                {fmtINR(subtotal)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-400 mb-0.5">Tax</p>
              <p className="text-sm font-semibold text-zinc-900">
                {fmtINR(taxTotal)}
              </p>
            </div>
            {discountAmount > 0 && (
              <div>
                <p className="text-xs font-medium text-emerald-500 mb-0.5">
                  Discount
                </p>
                <p className="text-sm font-semibold text-emerald-600">
                  -{fmtINR(discountAmount)}
                </p>
              </div>
            )}
            {pos.shipping > 0 && (
              <div>
                <p className="text-xs font-medium text-zinc-400 mb-0.5">
                  Shipping
                </p>
                <p className="text-sm font-semibold text-zinc-900">
                  {fmtINR(pos.shipping)}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-400">Total</p>
              <p className="text-4xl font-semibold text-zinc-900">
                {fmtINR(total)}
              </p>
            </div>
            <div className="flex flex-col gap-3 min-w-[320px]">
              <Button
                size="lg"
                className="h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-lg rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
                disabled={
                  pos.items.length === 0 ||
                  !pos.customer ||
                  (pos.paymentMethod === "cash" && cashChange < 0)
                }
                onClick={() => setShowPayDialog(true)}
              >
                <Zap size={20} className="mr-3 text-white/50" /> Complete Sale
              </Button>
              <p className="text-xs font-medium text-zinc-400 text-center">
                {!pos.customer
                  ? "Select a customer to proceed"
                  : pos.items.length === 0
                    ? "Add items to the cart"
                    : pos.paymentMethod === "cash" && cashChange < 0
                      ? "Insufficient cash tendered"
                      : "Ready to complete sale"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent className="sm:max-w-sm bg-white rounded-xl shadow-lg p-0 overflow-hidden">
          <div className="p-6 space-y-5">
            <div className="w-16 h-16 bg-zinc-900 rounded-xl flex items-center justify-center mx-auto shadow-sm">
              {selectedPmConfig.icon}
            </div>
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl font-semibold text-zinc-900 text-center">
                Confirm Payment
              </DialogTitle>
              <DialogDescription className="text-sm text-zinc-400 text-center leading-relaxed">
                Processing payment for{" "}
                <span className="text-zinc-900 font-semibold">
                  {pos.customer?.name}
                </span>
                .
              </DialogDescription>
            </DialogHeader>

            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-zinc-100 shadow-sm">
                <span className="text-xs font-medium text-zinc-400">Total</span>
                <span className="text-lg font-black text-zinc-900">
                  {fmtINR(total)}
                </span>
              </div>
              <div
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border font-medium text-xs shadow-sm",
                  selectedPmConfig.color
                    .replace("bg-", "bg-")
                    .replace("text-", "text-"),
                )}
              >
                {selectedPmConfig.icon} {selectedPmConfig.label}
                {pos.paymentRef && (
                  <span className="ml-auto opacity-50 font-mono">
                    #{pos.paymentRef}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleCharge}
                className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all shadow-sm"
              >
                <Shield size={16} className="mr-2" /> Confirm Payment
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowPayDialog(false)}
                className="h-9 text-xs font-medium text-zinc-400 hover:text-zinc-900"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// INVOICE DETAIL PANEL
// ─────────────────────────────────────────────────────────────

interface InvoiceDetailProps {
  invoice: Invoice;
  onUpdateStatus: (id: string, status: InvoiceStatus) => void;
  onVoid: (id: string) => void;
  onPrint: (inv: Invoice) => void;
  onDownload: (inv: Invoice) => void;
  onSend: (inv: Invoice) => void;
  onBack: () => void;
  onRefresh?: () => void;
}

const InvoiceDetail: React.FC<InvoiceDetailProps> = ({
  invoice,
  onUpdateStatus,
  onVoid,
  onPrint,
  onDownload,
  onSend,
  onBack,
  onRefresh,
}) => {
  const { subtotal, taxTotal, discountAmount, total } = computeTotals(
    invoice.lineItems || [],
    invoice.discountPct ?? 0,
    invoice.shipping ?? 0,
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ── HEADER ── */}
      <div className="px-6 py-5 border-b border-zinc-100 bg-white shrink-0 sticky top-0 z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-12 w-12 rounded-2xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-all"
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-semibold text-zinc-900 font-mono">
                  {invoice.invoiceNumber}
                </h2>
                <InvStatusBadge status={invoice.status} />
                <span className="px-2 py-1 bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-zinc-200">
                  {invoice.type === "CREDIT_NOTE" ? "Credit Note" : "Standard"}
                </span>
              </div>
              <p className="text-sm text-zinc-400">
                Created {fmtDate(invoice.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <InvoiceActions
              invoice={invoice}
              onActionComplete={onRefresh || (() => {})}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-10 px-5 gap-2 border-zinc-200 text-zinc-600 font-medium text-sm rounded-md hover:bg-zinc-50 transition-all"
                >
                  <MoreHorizontal size={15} /> More
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-white border-zinc-200 shadow-lg rounded-lg p-1"
              >
                <DropdownMenuLabel className="text-xs font-medium text-zinc-400 p-2">
                  Actions
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-100" />
                <DropdownMenuItem
                  className="gap-2 p-2 cursor-pointer rounded-md hover:bg-zinc-50 text-xs font-medium"
                  onClick={() => onPrint(invoice)}
                >
                  <Printer size={14} className="text-zinc-400" /> Print
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2 p-2 cursor-pointer rounded-md hover:bg-zinc-50 text-xs font-medium"
                  onClick={() => onDownload(invoice)}
                >
                  <Download size={14} className="text-zinc-400" /> Download
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-6 py-6 space-y-8">
          {/* ── ENTITY INTEL ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <MetaItem
              icon={<User size={16} />}
              label="Customer"
              value={invoice.customer?.name || "Unknown"}
            />
            <MetaItem
              icon={<Mail size={16} />}
              label="Email"
              value={invoice.customer?.email || "N/A"}
            />
            <MetaItem
              icon={<Layout size={16} />}
              label="Items"
              value={`${invoice.lineItems?.length || 0} line items`}
            />
            <MetaItem
              icon={<Shield size={16} />}
              label="Balance"
              value={
                <span
                  className={cn(
                    "font-semibold",
                    invoice.amountDue > 0 ? "text-red-500" : "text-emerald-500",
                  )}
                >
                  {invoice.amountDue > 0
                    ? `Due: ${fmtINR(invoice.amountDue)}`
                    : "Paid"}
                </span>
              }
            />
            {invoice.sentAt && (
              <MetaItem
                icon={<Send size={16} />}
                label="Sent At"
                value={fmtDate(invoice.sentAt)}
              />
            )}
            {invoice.paidAt && (
              <MetaItem
                icon={<CheckCircle2 size={16} />}
                label="Paid At"
                value={fmtDate(invoice.paidAt)}
              />
            )}
            {invoice.cancelledAt && (
              <MetaItem
                icon={<XCircle size={16} />}
                label="Cancelled At"
                value={fmtDate(invoice.cancelledAt)}
              />
            )}
            {invoice.voidedAt && (
              <MetaItem
                icon={<Trash2 size={16} />}
                label="Voided At"
                value={fmtDate(invoice.voidedAt)}
              />
            )}
            {invoice.refundedAt && (
              <MetaItem
                icon={<RefreshCcw size={16} />}
                label="Refunded At"
                value={fmtDate(invoice.refundedAt)}
              />
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ── ASSET LIST ── */}
            <div className="lg:col-span-2 space-y-6">
              <InvoiceLineItems lineItems={invoice.lineItems} />

              {invoice.notes && (
                <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-lg flex items-start gap-3">
                  <StickyNote
                    size={16}
                    className="text-zinc-400 mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-xs font-medium text-zinc-400 mb-1">
                      Notes
                    </p>
                    <p className="text-sm text-zinc-900 whitespace-pre-wrap font-medium leading-relaxed">
                      {invoice.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── FINANCIAL SYNC ── */}
            <div className="space-y-8">
              <div className="p-8 bg-zinc-900 rounded-xl text-white shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity scale-[3] rotate-12">
                  <TrendingUp size={100} />
                </div>

                <h3 className="text-xs font-medium text-zinc-500 mb-6">
                  Summary
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-zinc-400 text-xs font-medium">
                    <span>Subtotal</span>
                    <span className="text-white">{fmtINR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-400 text-xs font-medium">
                    <span>Tax</span>
                    <span className="text-white">{fmtINR(taxTotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-emerald-400 text-xs font-medium">
                      <span>Discount</span>
                      <span>-{fmtINR(discountAmount)}</span>
                    </div>
                  )}
                  {(invoice.shipping ?? 0) > 0 && (
                    <div className="flex justify-between items-center text-zinc-400 text-xs font-medium">
                      <span>Shipping</span>
                      <span className="text-white">
                        {fmtINR(invoice.shipping!)}
                      </span>
                    </div>
                  )}
                  <Separator className="bg-white/10" />
                  <div className="flex justify-between items-end pt-4">
                    <span className="text-xs font-medium text-zinc-500">
                      Total
                    </span>
                    <span className="text-3xl font-semibold">
                      {fmtINR(total)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-400 text-xs font-medium mt-2">
                    <span>Amount Paid</span>
                    <span>{fmtINR(invoice.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between items-center text-red-400 text-xs font-medium mt-2">
                    <span>Amount Due</span>
                    <span>{fmtINR(invoice.amountDue)}</span>
                  </div>
                </div>
              </div>

              {/* ── AUDIT LOG ── */}
              <details className="group border border-zinc-200 rounded-lg overflow-hidden transition-all duration-300">
                <summary className="flex items-center justify-between px-6 py-4 bg-zinc-50 cursor-pointer list-none select-none hover:bg-zinc-100 transition-colors">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 uppercase tracking-wide">
                    <Monitor size={14} className="text-zinc-400" />
                    Audit Trail
                  </div>
                  <ChevronDown
                    size={16}
                    className="text-zinc-400 group-open:rotate-180 transition-transform duration-300"
                  />
                </summary>
                <div className="border-t border-zinc-200 bg-white">
                  <InvoiceAuditTrail audit={invoice.audit} />
                </div>
              </details>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// STATS BAR
// ─────────────────────────────────────────────────────────────
const StatsBar = ({ invoices }: { invoices: Invoice[] }) => {
  const s = useMemo(() => {
    const safeInvoices = invoices || [];
    const total = safeInvoices.length;
    const revenue = safeInvoices
      .filter((i) => i.status === InvoiceStatus.PAID)
      .reduce((a, i) => a + i.total, 0);
    const outstanding = safeInvoices
      .filter((i) =>
        [InvoiceStatus.PENDING, InvoiceStatus.OVERDUE].includes(i.status),
      )
      .reduce((a, i) => a + i.amountDue, 0);
    const overdue = safeInvoices.filter(
      (i) => i.status === InvoiceStatus.OVERDUE,
    ).length;
    return { total, revenue, outstanding, overdue };
  }, [invoices]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {[
        {
          label: "Total Invoices",
          value: s.total,
          icon: <FileText size={16} />,
          color: "bg-white border-zinc-200 text-zinc-900",
          secondary: `${s.total} records`,
        },
        {
          label: "Revenue",
          value: fmtINR(s.revenue),
          icon: <TrendingUp size={16} />,
          color: "bg-zinc-900 border-zinc-800 text-white",
          secondary: "Collected payments",
        },
        {
          label: "Outstanding",
          value: fmtINR(s.outstanding),
          icon: <Wallet size={16} />,
          color: "bg-white border-zinc-200 text-zinc-900",
          secondary: "Pending collection",
        },
        {
          label: "Overdue",
          value: s.overdue,
          icon: <AlertTriangle size={16} />,
          color: "bg-red-50 border-red-100 text-red-600",
          secondary: "Action needed",
        },
      ].map((item) => (
        <div
          key={item.label}
          className={cn(
            "relative overflow-hidden group p-4 rounded-lg border shadow-sm transition-all",
            item.color,
          )}
        >
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity scale-150 rotate-12">
            {item.icon}
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className={cn(
                "p-2 rounded-lg border",
                item.color.includes("bg-zinc-900")
                  ? "bg-white/10 border-white/10"
                  : "bg-zinc-50 border-zinc-100",
              )}
            >
              {item.icon}
            </div>
            <p
              className={cn(
                "text-xs font-medium",
                item.color.includes("bg-zinc-900")
                  ? "text-zinc-400"
                  : "text-zinc-500",
              )}
            >
              {item.label}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xl font-semibold">{item.value}</p>
            <p
              className={cn(
                "text-[11px] opacity-50",
                item.color.includes("bg-zinc-900")
                  ? "text-white"
                  : "text-zinc-600",
              )}
            >
              {item.secondary}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

type PageView = "list" | "pos";

const BillingInvoices: React.FC = () => {
  const { products } = useShop();
  const {
    billing: {
      invoices,
      refreshInvoices,
      createInvoice,
      updateInvoice,
      voidInvoice,
      customers,
      refreshCustomers,
      createCustomer,
      billingProfile,
      refreshBillingProfile,
      saveBillingProfile,
    },
    inventory: { inventory },
    isLoading,
    syncData,
  } = useAdmin();

  const [view, setView] = useState<PageView>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [sendDialog, setSendDialog] = useState<{
    open: boolean;
    invoice: Invoice | null;
  }>({ open: false, invoice: null });
  const [sendEmail, setSendEmail] = useState("");

  // Enrich products with inventory stock
  const enrichedProducts = useMemo<(Product & { stock: number })[]>(() => {
    const inventoryArr = Array.isArray(inventory) ? inventory : [];
    return products.map((p) => {
      const inv = inventoryArr.find((i) =>
        p.variants?.some((v) => v.id === i.variantId),
      );
      return { ...p, stock: inv?.quantityOnHand ?? 0 };
    });
  }, [products, inventory]);

  // Sort newest first
  const sortedInvoices = useMemo(
    () =>
      [...(invoices || [])].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [invoices],
  );

  // Auto-select first
  useEffect(() => {
    if (!selectedId && sortedInvoices.length > 0)
      setSelectedId(sortedInvoices[0].id);
  }, [sortedInvoices, selectedId]);

  const filteredInvoices = useMemo(() => {
    return sortedInvoices.filter((inv) => {
      const matchStatus = filterStatus === "all" || inv.status === filterStatus;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customer?.name?.toLowerCase().includes(q) ||
        inv.customer?.email?.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [sortedInvoices, filterStatus, searchQuery]);

  const selectedInvoice = useMemo(() => {
    const invs = invoices || [];
    return (
      invs.find((i: Invoice) => i.id === selectedId) ??
      sortedInvoices[0] ??
      null
    );
  }, [invoices, selectedId, sortedInvoices]);

  // ── Handlers ──

  const handlePosComplete = async (inv: Invoice) => {
    const payload: CreateInvoice = {
      customerId: inv.customerId,
      dueDate: inv.dueDate,
      type: inv.type,
      lineItems:
        inv.lineItems?.map((li) => ({
          name: li.name,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          taxRatePct: li.taxRatePct,
          hsnCode: li.hsnCode || undefined,
        })) || [],
      notes: inv.notes || undefined,
    };
    await createInvoice(payload);
    setSelectedId(inv.id);
    setView("list");
    setShowMobileDetail(true);
    // Auto-print
    setTimeout(() => handlePrint(inv), 300);
  };

  const handleUpdateStatus = async (id: string, status: InvoiceStatus) => {
    await updateInvoice(id, { status });
  };

  const handleVoid = async (id: string) => {
    await voidInvoice(id);
    if (selectedId === id) setSelectedId(null);
  };

  const handlePrint = (invoice: Invoice) => {
    const profile = billingProfile ?? BILLING_PROFILE_STUB;
    const html = buildInvoiceHtml(invoice, profile);
    const win = window.open("", "_blank", "width=900,height=700");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
  };

  const handleDownload = (invoice: Invoice) => {
    const profile = billingProfile ?? BILLING_PROFILE_STUB;
    const html = buildInvoiceHtml(invoice, profile);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice.invoiceNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSend = (invoice: Invoice) => {
    setSendEmail(invoice.customer?.email || "");
    setSendDialog({ open: true, invoice });
  };

  const confirmSend = async () => {
    const inv = sendDialog.invoice;
    if (!inv) return;
    const now = new Date().toISOString();
    await updateInvoice(inv.id, {
      sentAt: now,
      status:
        inv.status === InvoiceStatus.DRAFT ? InvoiceStatus.PENDING : inv.status,
    });
    setSendDialog({ open: false, invoice: null });
  };

  // ── POS view ──
  if (view === "pos") {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[1.2rem] border border-zinc-200 bg-white shadow-sm">
        <PosCounter
          products={enrichedProducts}
          customers={customers}
          onComplete={handlePosComplete}
          onCancel={() => setView("list")}
        />
      </div>
    );
  }

  // ── List view ──
  return (
    <TooltipProvider>
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[1.2rem] border border-zinc-200 bg-white shadow-sm lg:flex-row">
        {/* LEFT: Master List */}
        <div
          className={cn(
            "flex flex-col bg-zinc-50/50 border-r border-zinc-200 shrink-0 h-full transition-all duration-300",
            "w-full lg:w-[400px] xl:w-[440px]",
            showMobileDetail ? "hidden lg:flex" : "flex",
          )}
        >
          {/* List Header */}
          <div className="shrink-0 border-b border-zinc-200 bg-white px-4 py-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-semibold text-zinc-900">
                  Billing & Invoices
                </h1>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <p className="text-sm text-zinc-500 mt-0.5 flex items-center gap-2">
                  {sortedInvoices.length} invoices
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 border-zinc-200 text-zinc-500 hover:text-zinc-900 transition-all shadow-sm"
                  onClick={() => syncData()}
                  disabled={isLoading}
                >
                  <RefreshCw
                    size={15}
                    className={cn(isLoading && "animate-spin")}
                  />
                </Button>
                <Button
                  onClick={() => setView("pos")}
                  className="h-9 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-md shadow-sm transition-all active:scale-95 gap-2"
                >
                  <Zap size={15} /> New Sale
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="relative group">
                <Search
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-zinc-900"
                />
                <Input
                  placeholder="Search invoices…"
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchQuery(e.target.value)
                  }
                  className="pl-12 h-10 text-xs font-medium border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-zinc-900 transition-all rounded-md"
                />
              </div>
              <div className="flex items-center gap-3">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-9 text-xs font-medium border-zinc-200 bg-white focus:ring-zinc-900 flex-1 rounded-md shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-zinc-200 shadow-lg rounded-lg p-1">
                    <SelectItem
                      value="all"
                      className="rounded-md p-2 text-xs font-medium"
                    >
                      All Invoices
                    </SelectItem>
                    {(Object.keys(INV_STATUS_CONFIG) as InvoiceStatus[]).map(
                      (s) => (
                        <SelectItem
                          key={s}
                          value={s}
                          className="rounded-md p-2 text-xs font-medium cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                "w-2 h-2 rounded-full",
                                INV_STATUS_CONFIG[s].dotClass,
                              )}
                            />
                            {INV_STATUS_CONFIG[s].label}
                          </div>
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <div className="h-9 px-3 bg-zinc-100 rounded-md flex items-center justify-center shrink-0 border border-zinc-200">
                  <span className="text-xs font-medium text-zinc-500 tabular-nums">
                    {filteredInvoices.length} results
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Master List Content */}
          <ScrollArea className="flex-1">
            {filteredInvoices.length === 0 ? (
              <div className="p-20 text-center opacity-20">
                <FileText size={48} className="mx-auto text-zinc-400 mb-6" />
                <p className="text-sm font-medium">No invoices found</p>
                <p className="text-xs text-zinc-400 mt-2">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            ) : (
              <div className="space-y-2 p-3">
                {filteredInvoices.map((inv) => {
                  const isSelected = selectedId === inv.id;
                  const isOverdue = inv.status === InvoiceStatus.OVERDUE;
                  return (
                    <button
                      key={inv.id}
                      onClick={() => {
                        setSelectedId(inv.id);
                        setShowMobileDetail(true);
                      }}
                      className={cn(
                        "w-full text-left p-4 rounded-lg transition-all group relative border",
                        isSelected
                          ? "bg-zinc-900 border-zinc-900 text-white shadow-lg z-10"
                          : "bg-white border-zinc-100 hover:border-zinc-200 hover:shadow-sm text-zinc-900",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex flex-col gap-1 min-w-0">
                          <span
                            className={cn(
                              "text-xs font-mono font-medium truncate",
                              isSelected ? "text-zinc-400" : "text-zinc-500",
                            )}
                          >
                            {inv.invoiceNumber}
                          </span>
                          <p
                            className={cn(
                              "text-sm font-semibold truncate",
                              isSelected ? "text-white" : "text-zinc-900",
                            )}
                          >
                            {inv.customer?.name || "Unknown"}
                          </p>
                        </div>
                        <InvStatusBadge status={inv.status} />
                      </div>

                      <div className="flex items-center justify-between gap-4 mt-auto pt-4 border-t border-current opacity-10">
                        <div className="flex items-center gap-2">
                          <Calendar
                            size={12}
                            className={cn(
                              isSelected ? "text-zinc-500" : "text-zinc-300",
                            )}
                          />
                          <span
                            className={cn(
                              "text-[11px] font-medium",
                              isSelected ? "text-zinc-500" : "text-zinc-400",
                            )}
                          >
                            {fmtDate(inv.createdAt)}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "text-base font-semibold",
                            isSelected ? "text-white" : "text-zinc-900",
                          )}
                        >
                          {fmtINR(inv.total)}
                        </span>
                      </div>

                      {isOverdue && !isSelected && (
                        <div className="absolute bottom-4 right-4 flex items-center gap-1 text-[10px] font-medium text-red-500 animate-pulse">
                          <AlertTriangle size={10} /> Critical
                        </div>
                      )}

                      {isSelected && (
                        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-white rounded-l-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* RIGHT: Detail View */}
        <div
          className={cn(
            "flex-1 flex flex-col bg-white min-w-0 transition-opacity duration-500",
            !showMobileDetail && "hidden lg:flex",
          )}
        >
          {selectedInvoice ? (
            <>
              <div className="hidden xl:block px-6 pt-6 pb-2">
                <StatsBar invoices={invoices} />
              </div>
              <div className="flex-1 overflow-hidden">
                <InvoiceDetail
                  invoice={selectedInvoice}
                  onUpdateStatus={handleUpdateStatus}
                  onVoid={handleVoid}
                  onPrint={handlePrint}
                  onDownload={handleDownload}
                  onSend={handleSend}
                  onBack={() => setShowMobileDetail(false)}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
              <div className="w-24 h-24 bg-zinc-50 rounded-xl border border-dashed border-zinc-200 flex items-center justify-center mb-6">
                <FileText size={40} className="text-zinc-200" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900">
                No Invoice Selected
              </h3>
              <p className="text-sm text-zinc-400 mt-2 max-w-xs leading-relaxed">
                Select an invoice from the list to view details, or create a new
                sale.
              </p>
              <Button
                onClick={() => setView("pos")}
                className="mt-8 h-10 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-md shadow-sm transition-all active:scale-95 gap-2"
                size="lg"
              >
                <Zap size={16} /> New Sale
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Send dialog */}
      <Dialog
        open={sendDialog.open}
        onOpenChange={(open: boolean) => setSendDialog((d) => ({ ...d, open }))}
      >
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send size={15} className="text-indigo-600" /> Send Invoice
            </DialogTitle>
            <DialogDescription>
              Sending{" "}
              <span className="font-mono font-semibold text-slate-800">
                {sendDialog.invoice?.invoiceNumber}
              </span>{" "}
              to customer.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-indigo-900 text-sm">
                  {sendDialog.invoice?.invoiceNumber}
                </p>
                <p className="text-xs text-indigo-600 mt-0.5">
                  {sendDialog.invoice && fmtINR(sendDialog.invoice.total)}
                </p>
              </div>
              <InvStatusBadge
                status={sendDialog.invoice?.status ?? InvoiceStatus.DRAFT}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                Send To
              </label>
              <Input
                type="email"
                value={sendEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSendEmail(e.target.value)
                }
                placeholder="customer@example.com"
                className="border-slate-200"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSendDialog({ open: false, invoice: null })}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
              onClick={confirmSend}
            >
              <Send size={13} /> Send Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default BillingInvoices;

// ─────────────────────────────────────────────────────────────
// SAMPLE DATA INITIALIZER
// ─────────────────────────────────────────────────────────────

function buildSampleInvoices(): Invoice[] {
  const now = Date.now();
  const d = (offset: number) => new Date(now - offset * 86400000).toISOString();

  const make = (
    overrides: Partial<Invoice> &
      Pick<Invoice, "invoiceNumber" | "status" | "customer" | "lineItems"> & {
        discountPct?: number;
        shipping?: number;
      },
  ): Invoice => {
    const { subtotal, taxTotal, discountAmount, total } = computeTotals(
      overrides.lineItems || [],
      overrides.discountPct ?? 0,
      overrides.shipping ?? 0,
    );
    const isPaid = overrides.status === InvoiceStatus.PAID;
    const base: Invoice = {
      id: uid("inv"),
      invoiceNumber: overrides.invoiceNumber,
      status: overrides.status,
      type: overrides.type ?? InvoiceType.STANDARD,
      customerId: overrides.customer?.id || "",
      customer: overrides.customer,
      createdAt: overrides.createdAt ?? d(10),
      dueDate: overrides.dueDate ?? d(-20),
      lineItems: overrides.lineItems,
      discountPct: overrides.discountPct ?? 0,
      shipping: overrides.shipping ?? 0,
      notes: overrides.notes,
      subtotal,
      taxTotal,
      total,
      amountPaid: isPaid ? total : 0,
      amountDue: isPaid ? 0 : total,
      lastUpdatedAt: d(0),
      audit: [
        {
          id: uid("ev"),
          invoiceId: "",
          type: "created",
          createdAt: overrides.createdAt ?? d(10),
          actor: "Admin",
          message: "Invoice created",
        },
      ],
      sentAt: overrides.sentAt,
      paidAt: isPaid ? d(5) : undefined,
    };
    return {
      ...base,
      ...overrides,
      subtotal,
      taxTotal,
      total,
      amountPaid: isPaid ? total : 0,
      amountDue: isPaid ? 0 : total,
    };
  };

  const C = INITIAL_CUSTOMERS;

  return [
    make({
      invoiceNumber: "INV-7834201",
      status: InvoiceStatus.PAID,
      customer: C[0],
      createdAt: d(12),
      dueDate: d(2),
      sentAt: d(11),
      lineItems: [
        {
          id: uid("li"),
          invoiceId: "",
          name: "AMD Ryzen 7 7800X3D",
          quantity: 1,
          unitPrice: 36000,
          taxRatePct: 18,
          description: "Processor",
        },
        {
          id: uid("li"),
          invoiceId: "",
          name: "ASUS ROG Strix RX 7800 XT",
          quantity: 1,
          unitPrice: 52000,
          taxRatePct: 18,
          description: "Graphics Card",
        },
        {
          id: uid("li"),
          invoiceId: "",
          name: "Corsair Vengeance DDR5 32GB",
          quantity: 2,
          unitPrice: 12500,
          taxRatePct: 18,
          description: "RAM Kit",
        },
      ],
      discountPct: 5,
      notes: "B2B order for gaming cafe setup. 30-day warranty included.",
      audit: [
        {
          id: uid("ev"),
          invoiceId: "",
          type: "created",
          createdAt: d(12),
          actor: "Admin",
          message: "Invoice created",
        },
        {
          id: uid("ev"),
          invoiceId: "",
          type: "sent",
          createdAt: d(11),
          actor: "Admin",
          message: `Invoice sent to ${C[0].email}`,
        },
        {
          id: uid("ev"),
          invoiceId: "",
          type: "paid",
          createdAt: d(7),
          actor: "System",
          message: "Payment received via UPI. UTR: UPI2025011082391",
        },
      ],
    }),
    make({
      invoiceNumber: "INV-7834202",
      status: InvoiceStatus.PENDING,
      customer: C[1],
      createdAt: d(5),
      dueDate: d(-7),
      sentAt: d(4),
      lineItems: [
        {
          id: uid("li"),
          invoiceId: "",
          name: "Samsung 990 Pro 1TB",
          quantity: 2,
          unitPrice: 10500,
          taxRatePct: 18,
          description: "NVMe SSD",
        },
        {
          id: uid("li"),
          invoiceId: "",
          name: "Corsair 4000D Case",
          quantity: 1,
          unitPrice: 7000,
          taxRatePct: 18,
          description: "Cabinet",
        },
      ],
      shipping: 250,
    }),
    make({
      invoiceNumber: "INV-7834203",
      status: InvoiceStatus.OVERDUE,
      customer: C[2],
      createdAt: d(20),
      dueDate: d(3),
      lineItems: [
        {
          id: uid("li"),
          invoiceId: "",
          name: "Intel Core i9-14900K",
          quantity: 1,
          unitPrice: 55000,
          taxRatePct: 18,
          description: "Processor",
        },
        {
          id: uid("li"),
          invoiceId: "",
          name: "ASUS ROG Maximus Z790",
          quantity: 1,
          unitPrice: 58000,
          taxRatePct: 18,
          description: "Motherboard",
        },
      ],
      notes: "Overdue since Jan 17, 2025. Please follow up.",
    }),
    make({
      invoiceNumber: "INV-7834204",
      status: InvoiceStatus.DRAFT,
      customer: C[3],
      createdAt: d(1),
      dueDate: d(-29),
      lineItems: [
        {
          id: uid("li"),
          invoiceId: "",
          name: "NVIDIA RTX 4090 FE",
          quantity: 1,
          unitPrice: 185000,
          taxRatePct: 18,
          description: "Graphics Card",
        },
      ],
      discountPct: 2,
    }),
    make({
      invoiceNumber: "INV-7834205",
      status: InvoiceStatus.PAID,
      customer: C[4],
      createdAt: d(8),
      dueDate: d(-2),
      sentAt: d(7),
      lineItems: [
        {
          id: uid("li"),
          invoiceId: "",
          name: "Lian Li O11 Dynamic",
          quantity: 1,
          unitPrice: 14000,
          taxRatePct: 18,
          description: "Cabinet",
        },
        {
          id: uid("li"),
          invoiceId: "",
          name: "Corsair H150i Elite 360",
          quantity: 1,
          unitPrice: 11000,
          taxRatePct: 18,
          description: "AIO Cooler",
        },
        {
          id: uid("li"),
          invoiceId: "",
          name: "Corsair HX1000 PSU",
          quantity: 1,
          unitPrice: 16000,
          taxRatePct: 18,
          description: "Power Supply",
        },
      ],
      shipping: 0,
      notes: "Thank you for your continued business!",
    }),
    make({
      invoiceNumber: "INV-7834206",
      status: InvoiceStatus.CANCELLED,
      customer: C[0],
      createdAt: d(15),
      dueDate: d(5),
      lineItems: [
        {
          id: uid("li"),
          invoiceId: "",
          name: "AMD Threadripper 7960X",
          quantity: 1,
          unitPrice: 135000,
          taxRatePct: 18,
          description: "HEDT Processor",
        },
      ],
      notes: "Order cancelled — item backordered.",
    }),
  ];
}
