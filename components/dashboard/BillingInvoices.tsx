'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useShop } from '@/context/ShopContext';
import type {
  Invoice,
  InvoiceStatus,
  InvoiceLineItem,
  Customer,
  BillingProfile,
  Currency,
  Product,
} from '@/types';
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
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────
// STATIC DATA & TYPES
// ─────────────────────────────────────────────────────────────

const BILLING_PROFILE: BillingProfile = {
  companyName: 'Nexus Hardware Store',
  legalName: 'Nexus Hardware Private Limited',
  email: 'billing@nexushardware.com',
  phone: '+91 80000 12345',
  addressLine1: '123, Tech Park',
  addressLine2: 'MG Road',
  city: 'Bengaluru',
  state: 'Karnataka',
  postalCode: '560001',
  country: 'India',
  gstin: '29ABCDE1234F1Z5',
  currency: 'INR',
};

const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'cust_1', name: 'Rahul Sharma', email: 'rahul.sharma@example.com', phone: '+91 98765 43210', company: 'Tech Solutions Ltd', addressLine1: '45, Business Center', city: 'Mumbai', state: 'Maharashtra', postalCode: '400001', country: 'India' },
  { id: 'cust_2', name: 'Priya Patel', email: 'priya.patel@example.com', phone: '+91 99887 77665', company: 'Digital Ventures', addressLine1: '78, Innovation Hub', city: 'Pune', state: 'Maharashtra', postalCode: '411001', country: 'India' },
  { id: 'cust_3', name: 'Amit Singh', email: 'amit.singh@example.com', phone: '+91 98888 77777', company: 'Enterprise Corp', addressLine1: '90, Corporate Tower', city: 'Delhi', state: 'Delhi', postalCode: '110001', country: 'India' },
  { id: 'cust_4', name: 'Meera Nair', email: 'meera.nair@example.com', phone: '+91 94440 11223', company: 'StartupLab', addressLine1: '22, Kaloor Junction', city: 'Kochi', state: 'Kerala', postalCode: '682017', country: 'India' },
  { id: 'cust_5', name: 'Vikram Desai', email: 'vikram.desai@company.in', phone: '+91 97770 33445', company: 'CreativeWorks', addressLine1: '67, Baner Road', city: 'Pune', state: 'Maharashtra', postalCode: '411045', country: 'India' },
];

type PaymentMethod = 'cash' | 'upi' | 'card' | 'bank_transfer';

interface PaymentMethodConfig {
  id: PaymentMethod;
  label: string;
  icon: React.ReactNode;
  color: string;
  placeholder?: string;
}

const PAYMENT_METHODS: PaymentMethodConfig[] = [
  { id: 'cash', label: 'Cash', icon: <Banknote size={16} />, color: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
  { id: 'upi', label: 'UPI', icon: <Smartphone size={16} />, color: 'text-violet-700 bg-violet-50 border-violet-300', placeholder: 'UPI Ref / UTR' },
  { id: 'card', label: 'Card', icon: <CreditCard size={16} />, color: 'text-blue-700 bg-blue-50 border-blue-300', placeholder: 'Last 4 digits' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: <Building2 size={16} />, color: 'text-slate-700 bg-slate-50 border-slate-300', placeholder: 'NEFT/RTGS Ref' },
];

const INV_STATUS_CONFIG: Record<InvoiceStatus, { label: string; dotClass: string; badgeClass: string }> = {
  draft: { label: 'Draft', dotClass: 'bg-slate-400', badgeClass: 'bg-slate-100 text-slate-600 border-slate-200' },
  pending: { label: 'Pending', dotClass: 'bg-amber-400', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  paid: { label: 'Paid', dotClass: 'bg-emerald-500', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  overdue: { label: 'Overdue', dotClass: 'bg-red-500', badgeClass: 'bg-red-50 text-red-700 border-red-200' },
  cancelled: { label: 'Cancelled', dotClass: 'bg-rose-400', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' },
  refunded: { label: 'Refunded', dotClass: 'bg-indigo-400', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
};

// ─────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────

const uid = (prefix = 'id') => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** Recompute subtotal, tax, discount, total from line items */
const computeTotals = (
  items: InvoiceLineItem[],
  discountPct: number,
  shipping: number
) => {
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const taxTotal = items.reduce((s, i) => s + i.quantity * i.unitPrice * ((i.taxRatePct ?? 18) / 100), 0);
  const discountAmount = (subtotal * discountPct) / 100;
  const total = subtotal + taxTotal - discountAmount + shipping;
  return { subtotal, taxTotal, discountAmount, total };
};

/** Generate printable HTML invoice */
const buildInvoiceHtml = (invoice: Invoice, profile: BillingProfile): string => {
  const { subtotal, taxTotal, discountAmount, total } = computeTotals(
    invoice.lineItems,
    invoice.discountPct ?? 0,
    invoice.shipping ?? 0
  );
  const rows = invoice.lineItems.map(i => {
    const lineTotal = i.quantity * i.unitPrice;
    const tax = lineTotal * ((i.taxRatePct ?? 18) / 100);
    return `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9">
          <strong style="color:#1e293b">${i.name}</strong>
          ${i.description ? `<br/><small style="color:#94a3b8">${i.description}</small>` : ''}
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:center">${i.quantity}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:right">${fmtINR(i.unitPrice)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:right;color:#6366f1">${i.taxRatePct ?? 18}%</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:700;color:#1e293b">${fmtINR(lineTotal + tax)}</td>
      </tr>`;
  }).join('');

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
  thead th:not(:first-child){text-align:right}thead th:nth-child(2){text-align:center}
  .totals{margin-left:auto;max-width:280px;background:#f8fafc;border-radius:12px;padding:16px 20px}
  .tot-row{display:flex;justify-content:space-between;font-size:13px;padding:4px 0;color:#64748b}
  .tot-final{font-size:17px;font-weight:900;color:#1e293b;border-top:2px solid #e2e8f0;padding-top:10px;margin-top:8px;display:flex;justify-content:space-between}
  .footer{margin-top:48px;padding-top:20px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:11px;color:#94a3b8}
  @media print{.page{padding:20px}}
  </style></head><body><div class="page">
  <div class="header">
    <div>
      <div class="brand-name">${profile.companyName}</div>
      <div class="brand-sub">${profile.addressLine1}${profile.addressLine2 ? ', ' + profile.addressLine2 : ''}, ${profile.city} – ${profile.postalCode}<br/>
      GSTIN: ${profile.gstin || 'N/A'} &nbsp;|&nbsp; ${profile.email}</div>
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
      <div class="sec-val"><strong style="color:#1e293b">${invoice.customer.name}</strong><br/>
      ${invoice.customer.company ? invoice.customer.company + '<br/>' : ''}
      ${invoice.customer.email}<br/>
      ${invoice.customer.addressLine1 ? invoice.customer.addressLine1 + '<br/>' : ''}
      ${invoice.customer.city ? invoice.customer.city + ', ' : ''}${invoice.customer.state || ''} ${invoice.customer.postalCode || ''}</div>
    </div>
    <div>
      <div class="sec-label">Payment Info</div>
      <div class="sec-val">
        <strong>Invoice #:</strong> ${invoice.invoiceNumber}<br/>
        <strong>Created:</strong> ${fmtDate(invoice.createdAt)}<br/>
        <strong>Due Date:</strong> ${fmtDate(invoice.dueDate)}<br/>
        <strong>Status:</strong> ${invoice.status.toUpperCase()}
        ${invoice.notes ? '<br/><br/><em>' + invoice.notes + '</em>' : ''}
      </div>
    </div>
  </div>
  <table><thead><tr>
    <th>Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Tax</th><th style="text-align:right">Amount</th>
  </tr></thead><tbody>${rows}</tbody></table>
  <div class="totals">
    <div class="tot-row"><span>Subtotal</span><span>${fmtINR(subtotal)}</span></div>
    <div class="tot-row"><span>Tax (GST)</span><span>${fmtINR(taxTotal)}</span></div>
    ${discountAmount > 0 ? `<div class="tot-row" style="color:#16a34a"><span>Discount (${invoice.discountPct}%)</span><span>–${fmtINR(discountAmount)}</span></div>` : ''}
    ${(invoice.shipping ?? 0) > 0 ? `<div class="tot-row"><span>Shipping</span><span>${fmtINR(invoice.shipping!)}</span></div>` : ''}
    <div class="tot-final"><span>Total Due</span><span style="color:#6366f1">${fmtINR(total)}</span></div>
  </div>
  <div class="footer">
    <span>Thank you for your business!</span>
    <span>${invoice.invoiceNumber} · Generated ${new Date().toLocaleDateString('en-IN')}</span>
  </div>
  </div></body></html>`;
};

// ─────────────────────────────────────────────────────────────
// SHARED SUB-COMPONENTS (mirrored from OrderManager style)
// ─────────────────────────────────────────────────────────────

const InvStatusBadge = ({ status }: { status: InvoiceStatus }) => {
  const cfg = INV_STATUS_CONFIG[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border', cfg.badgeClass)}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dotClass)} />
      {cfg.label}
    </span>
  );
};

const MetaItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
  <div className="flex items-start gap-3 min-w-0">
    <div className="p-2 bg-slate-50 rounded-lg text-slate-500 flex-shrink-0 mt-0.5 border border-slate-100">{icon}</div>
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
      <div className="text-sm font-medium text-slate-800">{value}</div>
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
  notes: '',
  paymentMethod: 'cash',
  paymentRef: '',
  cashTendered: '',
};

interface PosCounterProps {
  products: Product[];
  customers: Customer[];
  onComplete: (invoice: Invoice) => void;
  onCancel: () => void;
}

const PosCounter: React.FC<PosCounterProps> = ({ products, customers, onComplete, onCancel }) => {
  const [pos, setPos] = useState<PosState>(EMPTY_POS);
  const [productSearch, setProductSearch] = useState('');
  const [manualItem, setManualItem] = useState({ name: '', price: '', qty: '1', tax: '18' });
  const [addMode, setAddMode] = useState<'catalog' | 'manual'>('catalog');
  const [showPayDialog, setShowPayDialog] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products.slice(0, 20);
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [products, productSearch]);

  const { subtotal, taxTotal, discountAmount, total } = useMemo(
    () => computeTotals(pos.items, pos.discountPct, pos.shipping),
    [pos.items, pos.discountPct, pos.shipping]
  );

  const cashChange = useMemo(() => {
    const tendered = parseFloat(pos.cashTendered) || 0;
    return tendered - total;
  }, [pos.cashTendered, total]);

  const addProduct = useCallback((p: Product) => {
    setPos(prev => {
      const existing = prev.items.find(i => i.productId === p.id);
      if (existing) {
        return { ...prev, items: prev.items.map(i => i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i) };
      }
      const newItem: PosCartItem = {
        id: uid('li'),
        productId: p.id,
        name: p.name,
        description: p.category,
        quantity: 1,
        unitPrice: p.price,
        taxRatePct: 18,
        image: p.image,
      };
      return { ...prev, items: [...prev.items, newItem] };
    });
    setProductSearch('');
  }, []);

  const addManualItem = () => {
    if (!manualItem.name || !manualItem.price) return;
    const newItem: PosCartItem = {
      id: uid('li'),
      name: manualItem.name,
      quantity: parseInt(manualItem.qty) || 1,
      unitPrice: parseFloat(manualItem.price) || 0,
      taxRatePct: parseFloat(manualItem.tax) || 18,
    };
    setPos(prev => ({ ...prev, items: [...prev.items, newItem] }));
    setManualItem({ name: '', price: '', qty: '1', tax: '18' });
  };

  const updateQty = (id: string, delta: number) => {
    setPos(prev => ({
      ...prev,
      items: prev.items.flatMap(i => {
        if (i.id !== id) return [i];
        const newQty = i.quantity + delta;
        return newQty < 1 ? [] : [{ ...i, quantity: newQty }];
      }),
    }));
  };

  const removeItem = (id: string) => {
    setPos(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
  };

  const handleCharge = () => {
    if (!pos.customer) { alert('Please select a customer'); return; }
    if (pos.items.length === 0) { alert('Add at least one item'); return; }
    if (pos.paymentMethod === 'cash' && parseFloat(pos.cashTendered) < total) {
      alert('Cash tendered is less than the total'); return;
    }
    setShowPayDialog(false);

    const now = new Date().toISOString();
    const invoice: Invoice = {
      id: uid('inv'),
      invoiceNumber: `INV-${Date.now().toString().slice(-7)}`,
      status: 'paid',
      customer: pos.customer,
      createdAt: now,
      dueDate: now,
      sentAt: undefined,
      paidAt: now,
      currency: 'INR',
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
        { id: uid('ev'), type: 'created', createdAt: now, actor: 'Admin', message: 'POS sale created' },
        { id: uid('ev'), type: 'paid', createdAt: now, actor: 'Admin', message: `Paid via ${pos.paymentMethod.toUpperCase()}${pos.paymentRef ? ' · Ref: ' + pos.paymentRef : ''}` },
      ],
    };

    onComplete(invoice);
    setPos(EMPTY_POS);
  };

  const selectedPmConfig = PAYMENT_METHODS.find(p => p.id === pos.paymentMethod)!;

  return (
    <div className="flex flex-col xl:flex-row h-full min-h-0 overflow-hidden bg-slate-50">

      {/* ── LEFT: Product Search ── */}
      <div className="flex flex-col xl:w-[460px] flex-shrink-0 bg-white border-r border-slate-200">

        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <ShoppingCart size={14} className="text-white" />
            </div>
            <span className="font-bold text-slate-800 text-sm">New Sale</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel} className="h-7 px-2 text-slate-400 hover:text-slate-700">
            <X size={14} /> Cancel
          </Button>
        </div>

        {/* Customer selector */}
        <div className="px-4 py-3 border-b border-slate-100">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Customer</label>
          <Select
            value={pos.customer?.id ?? ''}
            onValueChange={(v: string) => setPos(p => ({ ...p, customer: customers.find(c => c.id === v) ?? null }))}
          >
            <SelectTrigger className="h-9 text-sm border-slate-200 bg-slate-50">
              <SelectValue placeholder="Select customer…" />
            </SelectTrigger>
            <SelectContent>
              {customers.map(c => (
                <SelectItem key={c.id} value={c.id} className='bg-white'>
                  <div className="flex flex-col">
                    <span className="font-medium">{c.name}</span>
                    {c.company && <span className="text-xs text-slate-400">{c.company}</span>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Add Item Tabs */}
        <div className="px-4 py-3 border-b border-slate-100">
          <Tabs value={addMode} onValueChange={(v: string) => setAddMode(v as 'catalog' | 'manual')}>
            <TabsList className="h-8 w-full mb-3">
              <TabsTrigger value="catalog" className="flex-1 text-xs gap-1.5"><Package size={12} /> Catalog</TabsTrigger>
              <TabsTrigger value="manual" className="flex-1 text-xs gap-1.5"><Edit size={12} />  Manual</TabsTrigger>
            </TabsList>

            <TabsContent value="catalog" className="mt-0 space-y-2">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  ref={searchRef}
                  placeholder="Search by name, SKU, category…"
                  value={productSearch}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProductSearch(e.target.value)}
                  className="pl-8 h-8 text-sm bg-slate-50 border-slate-200"
                />
              </div>
              <ScrollArea className="h-44">
                <div className="space-y-1 pr-2">
                  {filteredProducts.length === 0
                    ? <p className="text-xs text-slate-400 text-center py-6">No products found</p>
                    : filteredProducts.map(p => (
                      <button
                        key={p.id}
                        onClick={() => addProduct(p)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-indigo-50 text-left transition-colors group"
                      >
                        <div className="w-9 h-9 rounded-md bg-slate-100 border border-slate-200 flex-shrink-0 overflow-hidden">
                          <img src={p.image} alt={p.name} className="w-full h-full object-contain"
                            onError={e => { (e.target as HTMLImageElement).src = 'https://picsum.photos/80/80'; }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 line-clamp-1 group-hover:text-indigo-700">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{p.sku}</p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-xs font-bold text-slate-900">{fmtINR(p.price)}</p>
                          {p.stock <= 5 && <p className="text-[10px] text-amber-600">Low: {p.stock}</p>}
                        </div>
                      </button>
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="manual" className="mt-0">
              <div className="space-y-2">
                <Input placeholder="Item name *" className="h-8 text-sm border-slate-200"
                  value={manualItem.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualItem(m => ({ ...m, name: e.target.value }))} />
                <div className="grid grid-cols-3 gap-2">
                  <Input type="number" placeholder="Price ₹ *" className="h-8 text-sm border-slate-200"
                    value={manualItem.price} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualItem(m => ({ ...m, price: e.target.value }))} />
                  <Input type="number" placeholder="Qty" min="1" className="h-8 text-sm border-slate-200"
                    value={manualItem.qty} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualItem(m => ({ ...m, qty: e.target.value }))} />
                  <Input type="number" placeholder="Tax %" min="0" max="100" className="h-8 text-sm border-slate-200"
                    value={manualItem.tax} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualItem(m => ({ ...m, tax: e.target.value }))} />
                </div>
                <Button size="sm" className="w-full h-8 bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                  onClick={addManualItem}>
                  <Plus size={13} /> Add Item
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Discount & Shipping */}
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Discount %</label>
              <Input type="number" min="0" max="100" className="h-8 text-sm border-slate-200"
                value={pos.discountPct} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPos(p => ({ ...p, discountPct: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="col-span-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Shipping ₹</label>
              <Input type="number" min="0" className="h-8 text-sm border-slate-200"
                value={pos.shipping} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPos(p => ({ ...p, shipping: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="col-span-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Note</label>
              <Input placeholder="Optional" className="h-8 text-sm border-slate-200"
                value={pos.notes} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPos(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Payment method selector */}
        <div className="px-4 py-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Payment Method</label>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map(m => (
              <button
                key={m.id}
                onClick={() => setPos(p => ({ ...p, paymentMethod: m.id, paymentRef: '', cashTendered: '' }))}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition-all',
                  pos.paymentMethod === m.id ? m.color + ' ring-2 ring-offset-1 ring-current' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                )}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          {pos.paymentMethod === 'cash' && (
            <div className="mt-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Cash Tendered ₹</label>
              <Input type="number" placeholder={`Min: ${fmtINR(total)}`} className="h-8 text-sm border-slate-200"
                value={pos.cashTendered} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPos(p => ({ ...p, cashTendered: e.target.value }))} />
              {pos.cashTendered && cashChange >= 0 && (
                <p className="text-xs font-bold text-emerald-700 mt-1">Change: {fmtINR(cashChange)}</p>
              )}
              {pos.cashTendered && cashChange < 0 && (
                <p className="text-xs font-bold text-red-600 mt-1">Short by {fmtINR(Math.abs(cashChange))}</p>
              )}
            </div>
          )}

          {pos.paymentMethod !== 'cash' && selectedPmConfig.placeholder && (
            <div className="mt-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                {selectedPmConfig.placeholder}
              </label>
              <Input placeholder="Reference number…" className="h-8 text-sm border-slate-200"
                value={pos.paymentRef} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPos(p => ({ ...p, paymentRef: e.target.value }))} />
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Cart + Charge ── */}
      <div className="flex flex-col flex-1 min-h-0">

        {/* Cart items */}
        <div className="px-4 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <ReceiptText size={14} className="text-indigo-600" />
            Cart
            {pos.items.length > 0 && (
              <span className="w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {pos.items.length}
              </span>
            )}
          </h3>
          {pos.items.length > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => setPos(p => ({ ...p, items: [] }))}>
              Clear All
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 bg-white">
          {pos.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <ShoppingCart size={32} className="text-slate-200 mb-3" />
              <p className="text-sm text-slate-400 font-medium">Cart is empty</p>
              <p className="text-xs text-slate-300 mt-1">Search and add products or enter items manually</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {pos.items.map(item => {
                const lineSubtotal = item.quantity * item.unitPrice;
                const lineTax = lineSubtotal * ((item.taxRatePct ?? 18) / 100);
                return (
                  <div key={item.id} className="px-4 py-3 flex items-center gap-3 group hover:bg-slate-50/50 transition-colors">
                    {item.image && (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0 overflow-hidden">
                        <img src={item.image} alt={item.name} className="w-full h-full object-contain"
                          onError={e => { (e.target as HTMLImageElement).src = 'https://picsum.photos/80/80'; }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 line-clamp-1">{item.name}</p>
                      <p className="text-xs text-slate-400">{fmtINR(item.unitPrice)} · GST {item.taxRatePct}%</p>
                    </div>
                    {/* Qty controls */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => updateQty(item.id, -1)}
                        className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors">
                        <Minus size={11} className="text-slate-600" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-slate-800">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, 1)}
                        className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors">
                        <Plus size={11} className="text-slate-600" />
                      </button>
                    </div>
                    <div className="text-right flex-shrink-0 min-w-[80px]">
                      <p className="text-sm font-bold text-slate-900">{fmtINR(lineSubtotal + lineTax)}</p>
                      <p className="text-[10px] text-slate-400">incl. tax</p>
                    </div>
                    <button onClick={() => removeItem(item.id)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Order totals + Charge button */}
        <div className="bg-white border-t border-slate-200 p-4 space-y-2">
          <div className="space-y-1.5">
            {[
              { label: 'Subtotal', value: fmtINR(subtotal), className: 'text-slate-500 text-sm' },
              { label: 'Tax (GST)', value: fmtINR(taxTotal), className: 'text-slate-500 text-sm' },
              ...(discountAmount > 0 ? [{ label: `Discount (${pos.discountPct}%)`, value: `–${fmtINR(discountAmount)}`, className: 'text-emerald-700 text-sm' }] : []),
              ...(pos.shipping > 0 ? [{ label: 'Shipping', value: fmtINR(pos.shipping), className: 'text-slate-500 text-sm' }] : []),
            ].map(row => (
              <div key={row.label} className={cn('flex justify-between', row.className)}>
                <span>{row.label}</span><span>{row.value}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <span className="text-base font-bold text-slate-900">Total</span>
            <span className="text-2xl font-black text-indigo-700 tracking-tight">{fmtINR(total)}</span>
          </div>

          <Button
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base gap-2 rounded-xl shadow-sm transition-all active:scale-[0.99]"
            disabled={pos.items.length === 0 || !pos.customer}
            onClick={() => setShowPayDialog(true)}
          >
            <Zap size={18} />
            Charge {pos.items.length > 0 ? fmtINR(total) : ''}
          </Button>
          {!pos.customer && <p className="text-[11px] text-center text-amber-600 flex items-center justify-center gap-1"><AlertTriangle size={10} /> Select a customer first</p>}
        </div>
      </div>

      {/* Payment Confirmation Dialog */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                {selectedPmConfig.icon}
              </div>
              Confirm Payment
            </DialogTitle>
            <DialogDescription>
              Review and confirm the transaction for <strong>{pos.customer?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 border border-slate-200">
              {pos.items.map(i => (
                <div key={i.id} className="flex justify-between text-sm">
                  <span className="text-slate-600 truncate mr-2">{i.name} ×{i.quantity}</span>
                  <span className="text-slate-800 font-medium flex-shrink-0">{fmtINR(i.quantity * i.unitPrice)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-extrabold text-slate-900 text-base">
                <span>Total</span><span className="text-indigo-700">{fmtINR(total)}</span>
              </div>
            </div>

            <div className={cn('flex items-center gap-3 px-4 py-3 rounded-xl border font-semibold text-sm', selectedPmConfig.color)}>
              {selectedPmConfig.icon}
              <span>Paying via {selectedPmConfig.label}</span>
              {pos.paymentRef && <span className="ml-auto text-xs font-mono opacity-70">{pos.paymentRef}</span>}
            </div>

            {pos.paymentMethod === 'cash' && parseFloat(pos.cashTendered) > 0 && (
              <div className="flex justify-between text-sm px-1">
                <span className="text-slate-500">Change Due</span>
                <span className={cn('font-bold', cashChange >= 0 ? 'text-emerald-700' : 'text-red-600')}>{fmtINR(Math.abs(cashChange))}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowPayDialog(false)}>Back</Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 flex-1" onClick={handleCharge}>
              <CheckCircle2 size={14} /> Confirm & Issue Invoice
            </Button>
          </DialogFooter>
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
  onDelete: (id: string) => void;
  onPrint: (inv: Invoice) => void;
  onDownload: (inv: Invoice) => void;
  onSend: (inv: Invoice) => void;
  onBack: () => void;
}

const InvoiceDetail: React.FC<InvoiceDetailProps> = ({
  invoice, onUpdateStatus, onDelete, onPrint, onDownload, onSend, onBack
}) => {
  const { subtotal, taxTotal, discountAmount, total } = computeTotals(
    invoice.lineItems,
    invoice.discountPct ?? 0,
    invoice.shipping ?? 0
  );

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Mobile back */}
      <Button variant="ghost" size="sm"
        className="lg:hidden mb-4 -ml-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 gap-1.5"
        onClick={onBack}>
        <ArrowLeft size={15} /> Back
      </Button>

      {/* Header Card */}
      <Card className="mb-4 border-slate-200 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
                  {invoice.invoiceNumber}
                </h2>
                <InvStatusBadge status={invoice.status} />
              </div>
              <p className="text-sm text-slate-500">
                Created {fmtDate(invoice.createdAt)} · Due {fmtDate(invoice.dueDate)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  onClick={() => onUpdateStatus(invoice.id, 'paid')}>
                  <Check size={14} /> Mark Paid
                </Button>
              )}
              <Button size="sm" variant="outline" className="gap-1.5 border-slate-200"
                onClick={() => onSend(invoice)}>
                <Send size={13} /> Send
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1.5 border-slate-200">
                    <FileText size={13} /> Invoice <ChevronDown size={11} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 bg-white">
                  <DropdownMenuLabel className="text-xs text-slate-500">Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => onPrint(invoice)}><Printer size={13} /> Print</DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => onDownload(invoice)}><Download size={13} /> Download HTML</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {invoice.status === 'pending' && (
                    <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => onUpdateStatus(invoice.id, 'overdue')}>
                      <AlertTriangle size={13} className="text-amber-500" /> Mark Overdue
                    </DropdownMenuItem>
                  )}
                  {!['cancelled', 'refunded'].includes(invoice.status) && (
                    <DropdownMenuItem className="gap-2 cursor-pointer text-rose-600" onClick={() => onUpdateStatus(invoice.id, 'cancelled')}>
                      <XCircle size={13} /> Cancel Invoice
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 cursor-pointer text-red-600" onClick={() => onDelete(invoice.id)}>
                    <Trash2 size={13} /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Separator className="my-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetaItem icon={<User size={14} />} label="Customer" value={invoice.customer.name} />
            <MetaItem icon={<Mail size={14} />} label="Email" value={invoice.customer.email} />
            <MetaItem icon={<Hash size={14} />} label="Items" value={`${invoice.lineItems.length} item${invoice.lineItems.length !== 1 ? 's' : ''}`} />
            <MetaItem icon={<Wallet size={14} />} label="Amount Due"
              value={
                <span className={cn('font-bold', invoice.amountDue > 0 ? 'text-red-600' : 'text-emerald-700')}>
                  {invoice.amountDue > 0 ? fmtINR(invoice.amountDue) : 'Paid in Full'}
                </span>
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card className="mb-4 border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ReceiptText size={14} className="text-slate-500" /> Line Items
            </CardTitle>
            <span className="text-xs text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded-md font-medium">
              {invoice.lineItems.length} item{invoice.lineItems.length !== 1 ? 's' : ''}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white border-b border-slate-100">
                <tr>
                  {['Description', 'Qty', 'Unit Price', 'Tax', 'Total'].map((h, i) => (
                    <th key={h} className={cn('px-4 sm:px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide',
                      i === 0 ? 'text-left' : 'text-right', i === 1 && 'text-center')}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {invoice.lineItems.map(item => {
                  const lineTotal = item.quantity * item.unitPrice;
                  const tax = lineTotal * ((item.taxRatePct ?? 18) / 100);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 sm:px-6 py-3.5">
                        <p className="font-semibold text-slate-800">{item.name}</p>
                        {item.description && <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm">{item.quantity}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right text-slate-600">{fmtINR(item.unitPrice)}</td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-indigo-600 font-medium text-xs">{item.taxRatePct ?? 18}%</span>
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 text-right font-bold text-slate-900">{fmtINR(lineTotal + tax)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="sm:hidden divide-y divide-slate-100">
            {invoice.lineItems.map(item => {
              const lineTotal = item.quantity * item.unitPrice;
              const tax = lineTotal * ((item.taxRatePct ?? 18) / 100);
              return (
                <div key={item.id} className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                    <p className="font-bold text-slate-900 text-sm ml-2">{fmtINR(lineTotal + tax)}</p>
                  </div>
                  {item.description && <p className="text-xs text-slate-400">{item.description}</p>}
                  <div className="flex gap-4 mt-2 text-xs text-slate-500">
                    <span>Qty: <strong className="text-slate-700">{item.quantity}</strong></span>
                    <span>Unit: <strong className="text-slate-700">{fmtINR(item.unitPrice)}</strong></span>
                    <span>GST: <strong className="text-indigo-600">{item.taxRatePct ?? 18}%</strong></span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals footer */}
          <div className="px-4 sm:px-6 py-4 bg-slate-50/80 border-t border-slate-100">
            <div className="ml-auto max-w-xs space-y-1.5">
              {[
                { l: 'Subtotal', v: fmtINR(subtotal), cls: 'text-slate-500 text-sm' },
                { l: 'Tax (GST)', v: fmtINR(taxTotal), cls: 'text-slate-500 text-sm' },
                ...(discountAmount > 0 ? [{ l: `Discount (${invoice.discountPct}%)`, v: `–${fmtINR(discountAmount)}`, cls: 'text-emerald-700 text-sm' }] : []),
                ...((invoice.shipping ?? 0) > 0 ? [{ l: 'Shipping', v: fmtINR(invoice.shipping!), cls: 'text-slate-500 text-sm' }] : []),
              ].map(r => (
                <div key={r.l} className={cn('flex justify-between', r.cls)}><span>{r.l}</span><span>{r.v}</span></div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 mt-1">
                <span className="font-bold text-slate-900">Total</span>
                <span className="text-xl font-extrabold text-indigo-700">{fmtINR(total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit trail */}
      {invoice.audit.length > 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="px-4 py-3 pb-2 border-b border-slate-100">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
              <StickyNote size={12} /> Audit Trail
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 py-3">
            <div className="relative pl-4 border-l-2 border-slate-200 space-y-4">
              {[...invoice.audit].reverse().map((ev, idx) => (
                <div key={ev.id} className="relative">
                  <div className={cn('absolute -left-[21px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white',
                    idx === 0 ? 'bg-indigo-500' : 'bg-slate-200')} />
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn('text-xs font-bold', idx === 0 ? 'text-slate-900' : 'text-slate-500')}>
                      {ev.message}
                    </span>
                    {idx === 0 && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-semibold">Latest</span>}
                  </div>
                  <p className="text-[11px] text-slate-400">{ev.actor} · {fmtDate(ev.createdAt)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {invoice.notes && (
        <Card className="mt-4 border-slate-200 shadow-sm">
          <CardContent className="px-4 py-3 flex items-start gap-3">
            <StickyNote size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// STATS BAR
// ─────────────────────────────────────────────────────────────
const StatsBar = ({ invoices }: { invoices: Invoice[] }) => {
  const s = useMemo(() => {
    const total = invoices.length;
    const revenue = invoices.filter(i => i.status === 'paid').reduce((a, i) => a + i.total, 0);
    const outstanding = invoices.filter(i => ['pending', 'overdue'].includes(i.status)).reduce((a, i) => a + i.amountDue, 0);
    const overdue = invoices.filter(i => i.status === 'overdue').length;
    return { total, revenue, outstanding, overdue };
  }, [invoices]);

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
      {[
        { label: 'Total Invoices', value: s.total, icon: <FileText size={15} />, color: 'text-slate-600 bg-slate-50 border-slate-200' },
        { label: 'Revenue (Paid)', value: fmtINR(s.revenue), icon: <TrendingUp size={15} />, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
        { label: 'Outstanding', value: fmtINR(s.outstanding), icon: <Wallet size={15} />, color: 'text-amber-700 bg-amber-50 border-amber-200' },
        { label: 'Overdue', value: s.overdue, icon: <AlertTriangle size={15} />, color: 'text-red-700 bg-red-50 border-red-200' },
      ].map(item => (
        <div key={item.label} className={cn('flex items-center gap-3 px-4 py-3 rounded-xl border', item.color)}>
          <div className="flex-shrink-0">{item.icon}</div>
          <div className="min-w-0">
            <p className="text-xs font-medium opacity-70 truncate">{item.label}</p>
            <p className="text-lg font-bold leading-tight truncate">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

type PageView = 'list' | 'pos';

const BillingInvoices: React.FC = () => {
  const { products, inventory } = useShop();

  const [invoices, setInvoices] = useState<Invoice[]>(() => buildSampleInvoices());
  const [customers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [view, setView] = useState<PageView>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [sendDialog, setSendDialog] = useState<{ open: boolean; invoice: Invoice | null }>({ open: false, invoice: null });
  const [sendEmail, setSendEmail] = useState('');

  // Enrich products with inventory stock
  const enrichedProducts = useMemo<Product[]>(() => {
    return products.map(p => {
      const inv = inventory.find(i => i.productId === p.id);
      return { ...p, stock: inv?.quantity ?? p.stock };
    });
  }, [products, inventory]);

  // Sort newest first
  const sortedInvoices = useMemo(() =>
    [...invoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [invoices]
  );

  // Auto-select first
  useEffect(() => {
    if (!selectedId && sortedInvoices.length > 0) setSelectedId(sortedInvoices[0].id);
  }, [sortedInvoices, selectedId]);

  const filteredInvoices = useMemo(() => {
    return sortedInvoices.filter(inv => {
      const matchStatus = filterStatus === 'all' || inv.status === filterStatus;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch = !q || inv.invoiceNumber.toLowerCase().includes(q) || inv.customer.name.toLowerCase().includes(q) || inv.customer.email.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [sortedInvoices, filterStatus, searchQuery]);

  const selectedInvoice = useMemo(() =>
    invoices.find(i => i.id === selectedId) ?? sortedInvoices[0] ?? null,
    [invoices, selectedId, sortedInvoices]
  );

  // ── Handlers ──

  const handlePosComplete = (invoice: Invoice) => {
    setInvoices(prev => [invoice, ...prev]);
    setSelectedId(invoice.id);
    setView('list');
    setShowMobileDetail(true);
    // Auto-print
    setTimeout(() => handlePrint(invoice), 300);
  };

  const handleUpdateStatus = (id: string, status: InvoiceStatus) => {
    const now = new Date().toISOString();
    setInvoices(prev => prev.map(inv => {
      if (inv.id !== id) return inv;
      const updates: Partial<Invoice> = { status, lastUpdatedAt: now };
      if (status === 'paid') { updates.paidAt = now; updates.amountPaid = inv.total; updates.amountDue = 0; }
      if (status === 'cancelled') { updates.cancelledAt = now; }
      const auditMsg = `Status changed to ${status}`;
      return { ...inv, ...updates, audit: [...inv.audit, { id: uid('ev'), type: status as any, createdAt: now, actor: 'Admin', message: auditMsg }] };
    }));
  };

  const handleDelete = (id: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handlePrint = (invoice: Invoice) => {
    const html = buildInvoiceHtml(invoice, BILLING_PROFILE);
    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) { win.document.write(html); win.document.close(); win.focus(); setTimeout(() => win.print(), 500); }
  };

  const handleDownload = (invoice: Invoice) => {
    const html = buildInvoiceHtml(invoice, BILLING_PROFILE);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${invoice.invoiceNumber}.html`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleSend = (invoice: Invoice) => {
    setSendEmail(invoice.customer.email);
    setSendDialog({ open: true, invoice });
  };

  const confirmSend = () => {
    const inv = sendDialog.invoice;
    if (!inv) return;
    const now = new Date().toISOString();
    setInvoices(prev => prev.map(i => i.id !== inv.id ? i : {
      ...i, sentAt: now, lastUpdatedAt: now,
      status: i.status === 'draft' ? 'pending' : i.status,
      audit: [...i.audit, { id: uid('ev'), type: 'sent', createdAt: now, actor: 'Admin', message: `Invoice sent to ${sendEmail}` }],
    }));
    setSendDialog({ open: false, invoice: null });
  };

  // ── POS view ──
  if (view === 'pos') {
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden -m-6">
        <div className="flex-shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <ShoppingCart size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">POS Billing Counter</h1>
            <p className="text-xs text-slate-500">Quick sale — add items, accept payment, generate invoice</p>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <PosCounter
            products={enrichedProducts}
            customers={customers}
            onComplete={handlePosComplete}
            onCancel={() => setView('list')}
          />
        </div>
      </div>
    );
  }

  // ── List view ──
  return (
    <TooltipProvider>
      <div className="flex flex-col h-full min-h-0 overflow-hidden -m-6">

        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Billing & Invoices</h1>
              <p className="text-xs text-slate-500 mt-0.5">{sortedInvoices.length} invoices · GSTIN {BILLING_PROFILE.gstin}</p>
            </div>
            <Button
              onClick={() => setView('pos')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm h-9"
              size="sm"
            >
              <Zap size={14} /> New Sale
            </Button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* LEFT: Invoice list */}
          <div className={cn(
            'flex flex-col bg-white border-r border-slate-200 flex-shrink-0',
            'w-full lg:w-[340px] xl:w-[380px]',
            showMobileDetail ? 'hidden lg:flex' : 'flex'
          )}>
            {/* Search + filter */}
            <div className="px-3 py-3 border-b border-slate-100 space-y-2">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input placeholder="Search invoices…" value={searchQuery} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm bg-slate-50 border-slate-200" />
              </div>
              <div className="flex items-center gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-8 text-xs flex-1 border-slate-200 bg-slate-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {(Object.keys(INV_STATUS_CONFIG) as InvoiceStatus[]).map(s => (
                      <SelectItem key={s} value={s}>
                        <div className="flex items-center gap-2">
                          <span className={cn('w-2 h-2 rounded-full', INV_STATUS_CONFIG[s].dotClass)} />
                          {INV_STATUS_CONFIG[s].label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-slate-400 flex-shrink-0 tabular-nums">{filteredInvoices.length} result{filteredInvoices.length !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* List */}
            <ScrollArea className="flex-1">
              {filteredInvoices.length === 0 ? (
                <div className="p-10 text-center">
                  <FileText size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500">No invoices found.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredInvoices.map(inv => {
                    const isSelected = selectedId === inv.id;
                    const isOverdue = inv.status === 'overdue';
                    return (
                      <button key={inv.id} onClick={() => { setSelectedId(inv.id); setShowMobileDetail(true); }}
                        className={cn('w-full text-left px-4 py-3.5 transition-all group hover:bg-slate-50 relative',
                          isSelected && 'bg-indigo-50/70 border-l-[3px] !border-l-indigo-600')}>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={cn('text-xs font-mono font-bold tracking-tight truncate',
                              isSelected ? 'text-indigo-700' : 'text-slate-700')}>
                              {inv.invoiceNumber}
                            </span>
                            <InvStatusBadge status={inv.status} />
                          </div>
                          <ChevronRight size={14} className={cn('flex-shrink-0 transition-opacity mt-0.5',
                            isSelected ? 'text-indigo-600 opacity-100' : 'text-slate-400 opacity-0 group-hover:opacity-100')} />
                        </div>
                        <p className="text-sm font-semibold text-slate-800 truncate mb-0.5">{inv.customer.name}</p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar size={11} /> {fmtDate(inv.createdAt)}
                          </span>
                          <span className={cn('text-sm font-bold', inv.amountDue > 0 ? 'text-red-600' : 'text-slate-900')}>
                            {fmtINR(inv.total)}
                          </span>
                        </div>
                        {isOverdue && (
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-red-600">
                            <AlertTriangle size={10} /> Overdue
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* RIGHT: Invoice detail */}
          {selectedInvoice ? (
            <div className={cn(
              'flex-1 overflow-y-auto bg-slate-50 min-w-0',
              !showMobileDetail && 'hidden lg:block'
            )}>
              <div className="hidden xl:block px-6 pt-6">
                <StatsBar invoices={invoices} />
              </div>
              <InvoiceDetail
                invoice={selectedInvoice}
                onUpdateStatus={handleUpdateStatus}
                onDelete={handleDelete}
                onPrint={handlePrint}
                onDownload={handleDownload}
                onSend={handleSend}
                onBack={() => setShowMobileDetail(false)}
              />
            </div>
          ) : (
            <div className="hidden lg:flex flex-1 items-center justify-center bg-slate-50">
              <div className="text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText size={24} className="text-slate-400" />
                </div>
                <p className="font-semibold text-slate-700">No invoice selected</p>
                <p className="text-sm text-slate-400 mt-1">Choose one from the list or start a new sale</p>
                <Button onClick={() => setView('pos')} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white gap-2" size="sm">
                  <Zap size={13} /> New Sale
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Send dialog */}
      <Dialog open={sendDialog.open} onOpenChange={(open: boolean) => setSendDialog(d => ({ ...d, open }))}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Send size={15} className="text-indigo-600" /> Send Invoice</DialogTitle>
            <DialogDescription>
              Sending <span className="font-mono font-semibold text-slate-800">{sendDialog.invoice?.invoiceNumber}</span> to customer.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-indigo-900 text-sm">{sendDialog.invoice?.invoiceNumber}</p>
                <p className="text-xs text-indigo-600 mt-0.5">{sendDialog.invoice && fmtINR(sendDialog.invoice.total)}</p>
              </div>
              <InvStatusBadge status={sendDialog.invoice?.status ?? 'draft'} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Send To</label>
              <Input type="email" value={sendEmail} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSendEmail(e.target.value)}
                placeholder="customer@example.com" className="border-slate-200" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSendDialog({ open: false, invoice: null })}>Cancel</Button>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5" onClick={confirmSend}>
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

  const make = (overrides: Partial<Invoice> & Pick<Invoice, 'invoiceNumber' | 'status' | 'customer' | 'lineItems'> & { discountPct?: number; shipping?: number }): Invoice => {
    const { subtotal, taxTotal, discountAmount, total } = computeTotals(overrides.lineItems, overrides.discountPct ?? 0, overrides.shipping ?? 0);
    const isPaid = overrides.status === 'paid';
    const base: Invoice = {
      id: uid('inv'),
      invoiceNumber: overrides.invoiceNumber,
      status: overrides.status,
      customer: overrides.customer,
      createdAt: overrides.createdAt ?? d(10),
      dueDate: overrides.dueDate ?? d(-20),
      currency: 'INR',
      lineItems: overrides.lineItems,
      discountPct: overrides.discountPct ?? 0,
      shipping: overrides.shipping ?? 0,
      notes: overrides.notes,
      subtotal, taxTotal, total,
      amountPaid: isPaid ? total : 0,
      amountDue: isPaid ? 0 : total,
      lastUpdatedAt: d(0),
      audit: [{ id: uid('ev'), type: 'created', createdAt: overrides.createdAt ?? d(10), actor: 'Admin', message: 'Invoice created' }],
      sentAt: overrides.sentAt,
      paidAt: isPaid ? d(5) : undefined,
    };
    return { ...base, ...overrides, subtotal, taxTotal, total, amountPaid: isPaid ? total : 0, amountDue: isPaid ? 0 : total };
  };

  const C = INITIAL_CUSTOMERS;

  return [
    make({
      invoiceNumber: 'INV-7834201',
      status: 'paid',
      customer: C[0],
      createdAt: d(12), dueDate: d(2), sentAt: d(11),
      lineItems: [
        { id: uid('li'), name: 'AMD Ryzen 7 7800X3D', quantity: 1, unitPrice: 36000, taxRatePct: 18, description: 'Processor' },
        { id: uid('li'), name: 'ASUS ROG Strix RX 7800 XT', quantity: 1, unitPrice: 52000, taxRatePct: 18, description: 'Graphics Card' },
        { id: uid('li'), name: 'Corsair Vengeance DDR5 32GB', quantity: 2, unitPrice: 12500, taxRatePct: 18, description: 'RAM Kit' },
      ],
      discountPct: 5,
      notes: 'B2B order for gaming cafe setup. 30-day warranty included.',
      audit: [
        { id: uid('ev'), type: 'created', createdAt: d(12), actor: 'Admin', message: 'Invoice created' },
        { id: uid('ev'), type: 'sent', createdAt: d(11), actor: 'Admin', message: `Invoice sent to ${C[0].email}` },
        { id: uid('ev'), type: 'paid', createdAt: d(7), actor: 'System', message: 'Payment received via UPI. UTR: UPI2025011082391' },
      ],
    }),
    make({
      invoiceNumber: 'INV-7834202',
      status: 'pending',
      customer: C[1],
      createdAt: d(5), dueDate: d(-7), sentAt: d(4),
      lineItems: [
        { id: uid('li'), name: 'Samsung 990 Pro 1TB', quantity: 2, unitPrice: 10500, taxRatePct: 18, description: 'NVMe SSD' },
        { id: uid('li'), name: 'Corsair 4000D Case', quantity: 1, unitPrice: 7000, taxRatePct: 18, description: 'Cabinet' },
      ],
      shipping: 250,
    }),
    make({
      invoiceNumber: 'INV-7834203',
      status: 'overdue',
      customer: C[2],
      createdAt: d(20), dueDate: d(3),
      lineItems: [
        { id: uid('li'), name: 'Intel Core i9-14900K', quantity: 1, unitPrice: 55000, taxRatePct: 18, description: 'Processor' },
        { id: uid('li'), name: 'ASUS ROG Maximus Z790', quantity: 1, unitPrice: 58000, taxRatePct: 18, description: 'Motherboard' },
      ],
      notes: 'Overdue since Jan 17, 2025. Please follow up.',
    }),
    make({
      invoiceNumber: 'INV-7834204',
      status: 'draft',
      customer: C[3],
      createdAt: d(1), dueDate: d(-29),
      lineItems: [
        { id: uid('li'), name: 'NVIDIA RTX 4090 FE', quantity: 1, unitPrice: 185000, taxRatePct: 18, description: 'Graphics Card' },
      ],
      discountPct: 2,
    }),
    make({
      invoiceNumber: 'INV-7834205',
      status: 'paid',
      customer: C[4],
      createdAt: d(8), dueDate: d(-2), sentAt: d(7),
      lineItems: [
        { id: uid('li'), name: 'Lian Li O11 Dynamic', quantity: 1, unitPrice: 14000, taxRatePct: 18, description: 'Cabinet' },
        { id: uid('li'), name: 'Corsair H150i Elite 360', quantity: 1, unitPrice: 11000, taxRatePct: 18, description: 'AIO Cooler' },
        { id: uid('li'), name: 'Corsair HX1000 PSU', quantity: 1, unitPrice: 16000, taxRatePct: 18, description: 'Power Supply' },
      ],
      shipping: 0,
      notes: 'Thank you for your continued business!',
    }),
    make({
      invoiceNumber: 'INV-7834206',
      status: 'cancelled',
      customer: C[0],
      createdAt: d(15), dueDate: d(5),
      lineItems: [
        { id: uid('li'), name: 'AMD Threadripper 7960X', quantity: 1, unitPrice: 135000, taxRatePct: 18, description: 'HEDT Processor' },
      ],
      notes: 'Order cancelled — item backordered.',
    }),
  ];
}