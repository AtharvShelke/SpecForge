/**
 * Invoice Calculations
 * 
 * Invoice-specific calculation logic.
 */

import { InvoiceLineItem } from '@/types';

/**
 * Clamp a number between min and max.
 */
export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Compute invoice totals from line items.
 */
export function computeInvoiceTotals(
  lineItems: InvoiceLineItem[],
  discountPct: number,
  shipping: number
) {
  const subtotal = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);

  const taxTotal = lineItems.reduce((sum, li) => {
    const rate = clamp(li.taxRatePct ?? 0, 0, 100);
    const base = li.quantity * li.unitPrice;
    return sum + (base * rate) / 100;
  }, 0);

  const discount = (subtotal * clamp(discountPct, 0, 100)) / 100;

  const total = Math.max(0, subtotal + taxTotal + shipping - discount);

  return {
    subtotal,
    taxTotal,
    total,
  };
}
