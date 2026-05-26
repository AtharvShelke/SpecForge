// Client-only: uses fetch. Safe to import in client components and contexts.
import { apiFetch } from "@/lib/helpers";
import {
  Invoice,
  CreateInvoice,
  PayInvoiceInput,
  InvoiceActionInput,
  CreateCreditNoteInput,
} from "../types";

/**
 * Fetch all invoices with optional filtering.
 */
export async function getInvoices(filters?: {
  status?: string;
  customerId?: string;
  orderId?: string;
}): Promise<Invoice[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.customerId) params.set("customerId", filters.customerId);
  if (filters?.orderId) params.set("orderId", filters.orderId);
  const qs = params.toString();
  const url = qs ? `/api/billing/invoices?${qs}` : "/api/billing/invoices";
  return apiFetch<Invoice[]>(url);
}

/**
 * Fetch a single invoice by ID, ensuring lineItems and audit are present.
 */
export async function getInvoice(id: string): Promise<Invoice> {
  const invoice = await apiFetch<Invoice>(`/api/billing/invoices/${id}`);
  if (!invoice.lineItems) invoice.lineItems = [];
  if (!invoice.audit) invoice.audit = [];
  return invoice;
}

/**
 * Create a new invoice.
 */
export async function createInvoice(data: CreateInvoice): Promise<Invoice> {
  return apiFetch<Invoice>("/api/billing/invoices", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Pay an invoice.
 */
export async function payInvoice(
  id: string,
  data: PayInvoiceInput,
): Promise<Invoice> {
  return apiFetch<Invoice>(`/api/billing/invoices/${id}/pay`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Send an invoice to the customer.
 */
export async function sendInvoice(
  id: string,
  data: InvoiceActionInput,
): Promise<Invoice> {
  return apiFetch<Invoice>(`/api/billing/invoices/${id}/send`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Cancel an invoice.
 */
export async function cancelInvoice(
  id: string,
  data: InvoiceActionInput,
): Promise<Invoice> {
  return apiFetch<Invoice>(`/api/billing/invoices/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Void an invoice.
 */
export async function voidInvoice(
  id: string,
  data: InvoiceActionInput,
): Promise<Invoice> {
  return apiFetch<Invoice>(`/api/billing/invoices/${id}/void`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Create a credit note against an invoice.
 */
export async function createCreditNote(
  id: string,
  data: CreateCreditNoteInput,
): Promise<Invoice> {
  return apiFetch<Invoice>(`/api/billing/invoices/${id}/credit-note`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
