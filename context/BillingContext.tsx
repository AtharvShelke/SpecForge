"use client";

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

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
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
} from "../types";
import * as invoiceService from "../services/invoice-client.service";
import { apiFetch, useLoadingCounter, refreshAndSyncDetail } from "@/lib/helpers";

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
  refreshInvoices: (filters?: {
    status?: string;
    customerId?: string;
    orderId?: string;
  }) => Promise<void>;
  getInvoiceDetail: (id: string) => Promise<void>;

  // ── Lifecycle Actions ────────────────────────────────────────────────
  createInvoice: (data: CreateInvoice) => Promise<Invoice>;
  sendInvoice: (id: string, data?: InvoiceActionInput) => Promise<void>;
  payInvoice: (id: string, data?: PayInvoiceInput) => Promise<void>;
  voidInvoice: (id: string, data?: InvoiceActionInput) => Promise<void>;
  cancelInvoice: (id: string, data?: InvoiceActionInput) => Promise<void>;
  createCreditNote: (
    invoiceId: string,
    data?: CreateCreditNoteInput,
  ) => Promise<void>;

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
  error: Error | null;
}

const BillingContext = createContext<BillingContextType | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export const BillingProvider = ({
  children,
  autoLoad = true,
}: {
  children: ReactNode;
  autoLoad?: boolean;
}) => {
  // start/stop are guaranteed stable by useLoadingCounter's internal useCallback([],
  // so including them in dependency arrays is safe and prevents exhaustive-deps warnings.
  const { loading, start, stop } = useLoadingCounter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedAuditTrail, setSelectedAuditTrail] = useState<
    InvoiceAuditEvent[]
  >([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [billingProfile, setBillingProfile] = useState<BillingProfile | null>(
    null,
  );
  const [error, setError] = useState<Error | null>(null);

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
      {} as Record<InvoiceStatus, Invoice[]>,
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
    async (filters?: {
      status?: string;
      customerId?: string;
      orderId?: string;
    }) => {
      setError(null);
      start();
      try {
        const data = await invoiceService.getInvoices(filters);
        setInvoices(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        stop();
      }
    },
    [start, stop],
  );

  const getInvoiceDetail = useCallback(async (id: string) => {
    setError(null);
    start();
    try {
      const data = await invoiceService.getInvoice(id);
      setSelectedInvoice(data);
      setSelectedAuditTrail(data.audit || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      stop();
    }
  }, [start, stop]);

  // ── Lifecycle Actions ────────────────────────────────────────────────

  const createInvoice = useCallback(
    async (data: CreateInvoice): Promise<Invoice> => {
      setError(null);
      start();
      try {
        const invoice = await invoiceService.createInvoice(data);
        await refreshInvoices();
        return invoice;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        stop();
      }
    },
    [refreshInvoices, start, stop],
  );

  const sendInvoice = useCallback(
    async (id: string, data?: InvoiceActionInput) => {
      setError(null);
      start();
      try {
        await invoiceService.sendInvoice(id, data || {});
        await refreshAndSyncDetail(id, refreshInvoices, selectedInvoice?.id, getInvoiceDetail);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        stop();
      }
    },
    [refreshInvoices, getInvoiceDetail, selectedInvoice?.id, start, stop],
  );

  const payInvoice = useCallback(
    async (id: string, data?: PayInvoiceInput) => {
      setError(null);
      start();
      try {
        await invoiceService.payInvoice(id, data || {});
        await refreshAndSyncDetail(id, refreshInvoices, selectedInvoice?.id, getInvoiceDetail);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        stop();
      }
    },
    [refreshInvoices, getInvoiceDetail, selectedInvoice?.id, start, stop],
  );

  const voidInvoice = useCallback(
    async (id: string, data?: InvoiceActionInput) => {
      setError(null);
      start();
      try {
        await invoiceService.voidInvoice(id, data || {});
        await refreshAndSyncDetail(id, refreshInvoices, selectedInvoice?.id, getInvoiceDetail);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        stop();
      }
    },
    [refreshInvoices, getInvoiceDetail, selectedInvoice?.id, start, stop],
  );

  const cancelInvoice = useCallback(
    async (id: string, data?: InvoiceActionInput) => {
      setError(null);
      start();
      try {
        await invoiceService.cancelInvoice(id, data || {});
        await refreshAndSyncDetail(id, refreshInvoices, selectedInvoice?.id, getInvoiceDetail);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        stop();
      }
    },
    [refreshInvoices, getInvoiceDetail, selectedInvoice?.id, start, stop],
  );

  const createCreditNote = useCallback(
    async (invoiceId: string, data?: CreateCreditNoteInput) => {
      setError(null);
      start();
      try {
        await invoiceService.createCreditNote(invoiceId, data || {});
        await refreshAndSyncDetail(invoiceId, refreshInvoices, selectedInvoice?.id, getInvoiceDetail);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        stop();
      }
    },
    [refreshInvoices, getInvoiceDetail, selectedInvoice?.id, start, stop],
  );

  const updateInvoice = useCallback(
    async (id: string, data: Partial<Invoice>) => {
      setError(null);
      start();
      try {
        await apiFetch(`/api/billing/invoices/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
        await refreshAndSyncDetail(id, refreshInvoices, selectedInvoice?.id, getInvoiceDetail);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        stop();
      }
    },
    [refreshInvoices, getInvoiceDetail, selectedInvoice?.id, start, stop],
  );

  const refreshCustomers = useCallback(async () => {
    setError(null);
    start();
    try {
      const data = await apiFetch<Customer[]>("/api/customers");
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      stop();
    }
  }, [start, stop]);

  const createCustomer = useCallback(
    async (data: Partial<Customer>) => {
      setError(null);
      start();
      try {
        const customer = await apiFetch<Customer>("/api/customers", {
          method: "POST",
          body: JSON.stringify(data),
        });
        await refreshCustomers();
        return customer;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        stop();
      }
    },
    [refreshCustomers, start, stop],
  );

  const refreshBillingProfile = useCallback(async () => {
    setError(null);
    start();
    try {
      const data = await apiFetch<BillingProfile>("/api/billing/profile");
      setBillingProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      stop();
    }
  }, [start, stop]);

  const saveBillingProfile = useCallback(
    async (data: Partial<BillingProfile>) => {
      setError(null);
      start();
      try {
        const profile = await apiFetch<BillingProfile>("/api/billing/profile", {
          method: "POST",
          body: JSON.stringify(data),
        });
        setBillingProfile(profile);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        stop();
      }
    },
    [start, stop],
  );

  // ── Initial Load ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!autoLoad) return;
    void Promise.allSettled([
      refreshInvoices(),
      refreshCustomers(),
      refreshBillingProfile(),
    ]);
  }, [autoLoad, refreshInvoices, refreshCustomers, refreshBillingProfile]);

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
      error,
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
      error,
    ],
  );

  return (
    <BillingContext.Provider value={value}>{children}</BillingContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────

export const useBilling = () => {
  const ctx = useContext(BillingContext);
  if (!ctx) throw new Error("useBilling must be used within BillingProvider");
  return ctx;
};

/** Convenience hook: get a single invoice by ID (O(1) lookup) */
export const useInvoice = (id: string) => {
  const { invoiceById } = useBilling();
  return useMemo(() => invoiceById.get(id) ?? null, [invoiceById, id]);
};
