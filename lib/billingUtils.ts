import { InvoiceLineItem, InvoiceStatus } from "@/types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function isOverdue(dueDateIso: string, status: InvoiceStatus) {
  if (
    status === InvoiceStatus.PAID ||
    status === InvoiceStatus.CANCELLED ||
    status === InvoiceStatus.REFUNDED
  )
    return false;
  const due = new Date(dueDateIso).getTime();
  const now = Date.now();
  return now > due;
}

export function computeInvoiceTotals(
  lineItems: InvoiceLineItem[],
  discountPct: number,
  shipping: number,
) {
  const subtotal = lineItems.reduce(
    (sum, li) => sum + li.quantity * li.unitPrice,
    0,
  );

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
