'use client';

/**
 * BillingContext — Enterprise-grade billing state management.
 *
 * Features:
 *   • Full invoice lifecycle: DRAFT → PENDING → PAID / OVERDUE / VOIDED / CANCELLED / REFUNDED
 *   • Partial payment support with auto amountDue/amountPaid tracking
 *   • Credit note creation against paid invoices
 *   • Audit trail per invoice
 *   • O(1) invoice lookups by ID
 *   • Status-filtered invoice lists (memoised)
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import {
  Invoice,
  InvoiceAuditEvent,
  InvoiceStatus,
  CreateInvoice,
  PayInvoiceInput,
  InvoiceActionInput,
  CreateCreditNoteInput,
  Customer,
  BillingProfile,
} from '../types';
import * as invoiceService from '../services/invoiceService';

// ─────────────────────────────────────────────────────────────────────────────
// Context Shape
// ─────────────────────────────────────────────────────────────────────────────

interface BillingContextType {
  /** Full invoice list (newest first) */
  invoices: Invoice[];

  /** O(1) lookup by invoice ID */
  invoiceById: Map<string, Invoice>;

  /** Invoices grouped by status (memoised) */
  invoicesByStatus: Record<InvoiceStatus, Invoice[]>;

  /** Currently selected invoice (detail view) */
  selectedInvoice: Invoice | null;

  /** Audit events for the selected invoice */
  selectedAuditTrail: InvoiceAuditEvent[];

  // ── Data Fetching ────────────────────────────────────────────────────
  refreshInvoices: (filters?: { status?: string; customerId?: string; orderId?: string }) => Promise<void>;
  getInvoiceDetail: (id: string) => Promise<void>;

  // ── Lifecycle Actions ────────────────────────────────────────────────
  createInvoice: (data: CreateInvoice) => Promise<Invoice>;
  sendInvoice: (id: string, data?: InvoiceActionInput) => Promise<void>;
  payInvoice: (id: string, data?: PayInvoiceInput) => Promise<void>;
  voidInvoice: (id: string, data?: InvoiceActionInput) => Promise<void>;
  cancelInvoice: (id: string, data?: InvoiceActionInput) => Promise<void>;
  createCreditNote: (invoiceId: string, data?: CreateCreditNoteInput) => Promise<void>;

  /** Customer list for billing */
  customers: Customer[];
  refreshCustomers: () => Promise<void>;
  createCustomer: (data: Partial<Customer>) => Promise<Customer>;

  /** Business billing profile (header info) */
  billingProfile: BillingProfile | null;
  refreshBillingProfile: () => Promise<void>;
  saveBillingProfile: (data: Partial<BillingProfile>) => Promise<void>;

  loading: boolean;
  updateInvoice: (id: string, data: Partial<Invoice>) => Promise<void>;
}

const BillingContext = createContext<BillingContextType | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Fetch Utility
// ─────────────────────────────────────────────────────────────────────────────

async function fetchJSON<T = any>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { ...options?.headers, 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    let msg = 'Request failed';
    try {
      const errData = await res.json();
      msg = errData.error || errData.message || (await res.text());
    } catch {
      try { msg = await res.text(); } catch {}
    }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export const BillingProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedAuditTrail, setSelectedAuditTrail] = useState<InvoiceAuditEvent[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [billingProfile, setBillingProfile] = useState<BillingProfile | null>(null);

  // ── O(1) Lookup Map ──────────────────────────────────────────────────

  const invoiceById = useMemo(() => {
    const map = new Map<string, Invoice>();
    invoices.forEach((inv) => map.set(inv.id, inv));
    return map;
  }, [invoices]);

  // ── Status Groups ────────────────────────────────────────────────────

  const invoicesByStatus = useMemo(() => {
    const groups = Object.values(InvoiceStatus).reduce(
      (acc, status) => ({ ...acc, [status]: [] }),
      {} as Record<InvoiceStatus, Invoice[]>
    );
    invoices.forEach((inv) => {
      if (groups[inv.status]) {
        groups[inv.status].push(inv);
      }
    });
    return groups;
  }, [invoices]);

  // ── Data Fetching ────────────────────────────────────────────────────

  const refreshInvoices = useCallback(
    async (filters?: { status?: string; customerId?: string; orderId?: string }) => {
      setLoading(true);
      try {
        const data = await invoiceService.getInvoices(filters);
        setInvoices(data);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getInvoiceDetail = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const data = await invoiceService.getInvoice(id);
      setSelectedInvoice(data);
      setSelectedAuditTrail(data.audit || []);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Lifecycle Actions ────────────────────────────────────────────────

  const createInvoice = useCallback(
    async (data: CreateInvoice): Promise<Invoice> => {
      setLoading(true);
      try {
        const invoice = await invoiceService.createInvoice(data);
        await refreshInvoices();
        return invoice;
      } finally {
        setLoading(false);
      }
    },
    [refreshInvoices]
  );

  const sendInvoice = useCallback(
    async (id: string, data?: InvoiceActionInput) => {
      setLoading(true);
      try {
        await invoiceService.sendInvoice(id, data || {});
        await refreshInvoices();
        // Refresh detail if viewing this invoice
        if (selectedInvoice?.id === id) await getInvoiceDetail(id);
      } finally {
        setLoading(false);
      }
    },
    [refreshInvoices, getInvoiceDetail, selectedInvoice?.id]
  );

  const payInvoice = useCallback(
    async (id: string, data?: PayInvoiceInput) => {
      setLoading(true);
      try {
        await invoiceService.payInvoice(id, data || {});
        await refreshInvoices();
        if (selectedInvoice?.id === id) await getInvoiceDetail(id);
      } finally {
        setLoading(false);
      }
    },
    [refreshInvoices, getInvoiceDetail, selectedInvoice?.id]
  );

  const voidInvoice = useCallback(
    async (id: string, data?: InvoiceActionInput) => {
      setLoading(true);
      try {
        await invoiceService.voidInvoice(id, data || {});
        await refreshInvoices();
        if (selectedInvoice?.id === id) await getInvoiceDetail(id);
      } finally {
        setLoading(false);
      }
    },
    [refreshInvoices, getInvoiceDetail, selectedInvoice?.id]
  );

  const cancelInvoice = useCallback(
    async (id: string, data?: InvoiceActionInput) => {
      setLoading(true);
      try {
        await invoiceService.cancelInvoice(id, data || {});
        await refreshInvoices();
        if (selectedInvoice?.id === id) await getInvoiceDetail(id);
      } finally {
        setLoading(false);
      }
    },
    [refreshInvoices, getInvoiceDetail, selectedInvoice?.id]
  );

  const createCreditNote = useCallback(
    async (invoiceId: string, data?: CreateCreditNoteInput) => {
      setLoading(true);
      try {
        await invoiceService.createCreditNote(invoiceId, data || {});
        await refreshInvoices();
        if (selectedInvoice?.id === invoiceId) await getInvoiceDetail(invoiceId);
      } finally {
        setLoading(false);
      }
    },
    [refreshInvoices, getInvoiceDetail, selectedInvoice?.id]
  );

  const updateInvoice = useCallback(async (id: string, data: Partial<Invoice>) => {
    setLoading(true);
    try {
      await fetchJSON(`/api/billing/invoices/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      await refreshInvoices();
      if (selectedInvoice?.id === id) await getInvoiceDetail(id);
    } finally {
      setLoading(false);
    }
  }, [refreshInvoices, getInvoiceDetail, selectedInvoice?.id]);

  const refreshCustomers = useCallback(async () => {
    const data = await fetchJSON<Customer[]>('/api/customers');
    setCustomers(data);
  }, []);

  const createCustomer = useCallback(async (data: Partial<Customer>) => {
    const customer = await fetchJSON<Customer>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await refreshCustomers();
    return customer;
  }, [refreshCustomers]);

  const refreshBillingProfile = useCallback(async () => {
    const data = await fetchJSON<BillingProfile>('/api/billing/profile');
    setBillingProfile(data);
  }, []);

  const saveBillingProfile = useCallback(async (data: Partial<BillingProfile>) => {
    const profile = await fetchJSON<BillingProfile>('/api/billing/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setBillingProfile(profile);
  }, []);

  // ── Initial Load ─────────────────────────────────────────────────────

  useEffect(() => {
    refreshInvoices();
    refreshCustomers();
    refreshBillingProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Provider Value ───────────────────────────────────────────────────

  const value = useMemo<BillingContextType>(
    () => ({
      invoices,
      invoiceById,
      invoicesByStatus,
      selectedInvoice,
      selectedAuditTrail,
      refreshInvoices,
      getInvoiceDetail,
      createInvoice,
      sendInvoice,
      payInvoice,
      voidInvoice,
      cancelInvoice,
      createCreditNote,
      updateInvoice,
      customers,
      refreshCustomers,
      createCustomer,
      billingProfile,
      refreshBillingProfile,
      saveBillingProfile,
      loading,
    }),
    [
      invoices,
      invoiceById,
      invoicesByStatus,
      selectedInvoice,
      selectedAuditTrail,
      refreshInvoices,
      getInvoiceDetail,
      createInvoice,
      sendInvoice,
      payInvoice,
      voidInvoice,
      cancelInvoice,
      createCreditNote,
      updateInvoice,
      customers,
      refreshCustomers,
      createCustomer,
      billingProfile,
      refreshBillingProfile,
      saveBillingProfile,
      loading,
    ]
  );

  return (
    <BillingContext.Provider value={value}>
      {children}
    </BillingContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────

export const useBilling = () => {
  const ctx = useContext(BillingContext);
  if (!ctx) throw new Error('useBilling must be used within BillingProvider');
  return ctx;
};

/** Convenience hook: get a single invoice by ID (O(1) lookup) */
export const useInvoice = (id: string) => {
  const { invoiceById } = useBilling();
  return useMemo(() => invoiceById.get(id) ?? null, [invoiceById, id]);
};
