/**
 * Formatting Utilities
 * 
 * Consistent formatting functions for currency, dates, and status display.
 */

import { Currency, InvoiceStatus } from '@/types';

/**
 * Format currency amount with locale.
 */
export function formatCurrency(amount: number, currency: Currency) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Format date to readable string.
 */
export function formatDate(dateIso: string) {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return dateIso;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

/**
 * Format date and time to readable string.
 */
export function formatDateTime(dateIso: string) {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return dateIso;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Check if invoice is overdue.
 */
export function isOverdue(dueDateIso: string, status: InvoiceStatus) {
  if (status === 'paid' || status === 'cancelled' || status === 'refunded') return false;
  const due = new Date(dueDateIso).getTime();
  const now = Date.now();
  return now > due;
}

/**
 * Get human-readable label for invoice status.
 */
export function statusLabel(status: InvoiceStatus) {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'pending':
      return 'Pending';
    case 'paid':
      return 'Paid';
    case 'overdue':
      return 'Overdue';
    case 'cancelled':
      return 'Cancelled';
    case 'refunded':
      return 'Refunded';
    default:
      return status;
  }
}

/**
 * Get CSS classes for invoice status badge.
 */
export function statusBadgeClasses(status: InvoiceStatus) {
  switch (status) {
    case 'paid':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'pending':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'draft':
      return 'bg-gray-50 text-gray-700 border-gray-200';
    case 'overdue':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'cancelled':
      return 'bg-gray-100 text-gray-600 border-gray-200';
    case 'refunded':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}
