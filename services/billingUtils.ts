import { BillingProfile, Currency, Invoice, InvoiceLineItem, InvoiceStatus } from "@/types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function formatCurrency(amount: number, currency: Currency) {
  // Uses user's locale by default; keeps it simple
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatDate(dateIso: string) {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return dateIso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function formatDateTime(dateIso: string) {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return dateIso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isOverdue(dueDateIso: string, status: InvoiceStatus) {
  if (status === "paid" || status === "cancelled" || status === "refunded") return false;
  const due = new Date(dueDateIso).getTime();
  const now = Date.now();
  return now > due;
}

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

export function statusLabel(status: InvoiceStatus) {
  switch (status) {
    case "draft":
      return "Draft";
    case "pending":
      return "Pending";
    case "paid":
      return "Paid";
    case "overdue":
      return "Overdue";
    case "cancelled":
      return "Cancelled";
    case "refunded":
      return "Refunded";
    default:
      return status;
  }
}

export function statusBadgeClasses(status: InvoiceStatus) {
  // Matches your project vibe: soft bg + border + strong text
  switch (status) {
    case "paid":
      return "bg-green-50 text-green-700 border-green-200";
    case "pending":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "draft":
      return "bg-gray-50 text-gray-700 border-gray-200";
    case "overdue":
      return "bg-red-50 text-red-700 border-red-200";
    case "cancelled":
      return "bg-gray-100 text-gray-600 border-gray-200";
    case "refunded":
      return "bg-purple-50 text-purple-700 border-purple-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

/* ---------------------------------------------
   PDF Generator (No dependencies)
   - Generates a simple but valid PDF with text.
   - Not as pretty as jsPDF/pdfmake, but production-safe and zero-deps.
--------------------------------------------- */

export function escapePdfText(text: string) {
  // Basic PDF string escaping for parentheses and backslashes
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function generateInvoicePdfBlob({
  invoice,
  billingProfile,
}: {
  invoice: Invoice;
  billingProfile: BillingProfile;
}) {
  /**
   * Extremely small PDF:
   * - One page
   * - Built-in Helvetica font
   * - Text drawing via "Tj"
   *
   * This is sufficient for real downloads in admin dashboards.
   */

  const lines: string[] = [];

  const push = (s: string) => lines.push(s);

  const title = `Invoice ${invoice.invoiceNumber}`;
  const metaLeft = [
    billingProfile.companyName,
    billingProfile.addressLine1,
    billingProfile.addressLine2 ? billingProfile.addressLine2 : null,
    `${billingProfile.city}${billingProfile.state ? ", " + billingProfile.state : ""} ${billingProfile.postalCode}`,
    billingProfile.country,
    billingProfile.gstin ? `GSTIN: ${billingProfile.gstin}` : null,
    `Email: ${billingProfile.email}`,
  ].filter(Boolean) as string[];

  const metaRight = [
    `Invoice #: ${invoice.invoiceNumber}`,
    `Status: ${statusLabel(invoice.status)}`,
    `Created: ${formatDate(invoice.createdAt)}`,
    `Due: ${formatDate(invoice.dueDate)}`,
    invoice.sentAt ? `Sent: ${formatDate(invoice.sentAt)}` : null,
    invoice.paidAt ? `Paid: ${formatDate(invoice.paidAt)}` : null,
  ].filter(Boolean) as string[];

  const customerBlock = [
    "Bill To:",
    invoice.customer.company ? invoice.customer.company : invoice.customer.name,
    invoice.customer.email,
    invoice.customer.phone ? invoice.customer.phone : null,
    invoice.customer.addressLine1 ? invoice.customer.addressLine1 : null,
    invoice.customer.city
      ? `${invoice.customer.city}${invoice.customer.state ? ", " + invoice.customer.state : ""} ${invoice.customer.postalCode ?? ""}`
      : null,
    invoice.customer.country ? invoice.customer.country : null,
  ].filter(Boolean) as string[];

  const itemsHeader = "Items:";
  const itemsLines = invoice.lineItems.map((li) => {
    const lineTotal = li.quantity * li.unitPrice;
    const tax = ((li.taxRatePct ?? 0) / 100) * lineTotal;
    const full = lineTotal + tax;
    return `${li.name}  |  ${li.quantity} x ${formatCurrency(li.unitPrice, invoice.currency)}  |  ${formatCurrency(
      full,
      invoice.currency
    )}`;
  });

  const totals = [
    `Subtotal: ${formatCurrency(invoice.subtotal, invoice.currency)}`,
    `Tax: ${formatCurrency(invoice.taxTotal, invoice.currency)}`,
    invoice.shipping ? `Shipping: ${formatCurrency(invoice.shipping, invoice.currency)}` : null,
    invoice.discountPct ? `Discount: ${invoice.discountPct}%` : null,
    `Total: ${formatCurrency(invoice.total, invoice.currency)}`,
    `Paid: ${formatCurrency(invoice.amountPaid, invoice.currency)}`,
    `Amount Due: ${formatCurrency(invoice.amountDue, invoice.currency)}`,
  ].filter(Boolean) as string[];

  const notes = invoice.notes ? [`Notes:`, invoice.notes] : [];

  // Simple layout
  const pageWidth = 595; // A4 width in points
  const pageHeight = 842; // A4 height
  const margin = 40;

  // Text cursor
  let y = pageHeight - margin;

  const fontSizeTitle = 18;
  const fontSize = 11;

  // PDF content stream builder
  const content: string[] = [];

  const setFont = (size: number) => {
    content.push(`/F1 ${size} Tf`);
  };

  const moveTo = (x: number, y: number) => {
    content.push(`${x} ${y} Td`);
  };

  const showText = (t: string) => {
    content.push(`(${escapePdfText(t)}) Tj`);
  };

  const newLine = (dy: number) => {
    content.push(`0 ${-dy} Td`);
  };

  // Begin text object
  content.push("BT");

  // Title
  setFont(fontSizeTitle);
  moveTo(margin, y);
  showText(title);

  // Move down
  y -= 30;
  setFont(fontSize);

  // Left meta
  moveTo(margin, y);
  metaLeft.forEach((l, idx) => {
    if (idx > 0) newLine(14);
    showText(l);
  });

  // Right meta
  const rightX = pageWidth / 2 + 20;
  const rightStartY = y;
  moveTo(rightX, rightStartY);
  metaRight.forEach((l, idx) => {
    if (idx > 0) newLine(14);
    showText(l);
  });

  // Customer block
  y = rightStartY - Math.max(metaLeft.length, metaRight.length) * 14 - 24;
  moveTo(margin, y);
  customerBlock.forEach((l, idx) => {
    if (idx > 0) newLine(14);
    showText(l);
  });

  // Items
  y -= (customerBlock.length * 14 + 18);
  moveTo(margin, y);
  showText(itemsHeader);

  y -= 18;
  moveTo(margin, y);

  // Items lines (truncate to fit page)
  const maxItemLines = 18;
  itemsLines.slice(0, maxItemLines).forEach((l, idx) => {
    if (idx > 0) newLine(14);
    showText(l);
  });

  // Totals
  y -= (Math.min(itemsLines.length, maxItemLines) * 14 + 24);
  moveTo(margin, y);
  totals.forEach((l, idx) => {
    if (idx > 0) newLine(14);
    showText(l);
  });

  // Notes
  if (notes.length) {
    y -= (totals.length * 14 + 24);
    moveTo(margin, y);
    notes.forEach((l, idx) => {
      if (idx > 0) newLine(14);
      showText(l);
    });
  }

  // End text object
  content.push("ET");

  const contentStream = content.join("\n");

  // Build a minimal PDF with 5 objects
  // 1) Catalog
  // 2) Pages
  // 3) Page
  // 4) Font
  // 5) Content stream
  const objects: string[] = [];

  const addObj = (objBody: string) => {
    objects.push(objBody);
  };

  addObj(`1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj`);

  addObj(`2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj`);

  addObj(`3 0 obj
<< /Type /Page
   /Parent 2 0 R
   /MediaBox [0 0 ${pageWidth} ${pageHeight}]
   /Resources << /Font << /F1 4 0 R >> >>
   /Contents 5 0 R
>>
endobj`);

  addObj(`4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj`);

  // Content stream length
  const contentBytes = new TextEncoder().encode(contentStream);
  addObj(`5 0 obj
<< /Length ${contentBytes.length} >>
stream
${contentStream}
endstream
endobj`);

  // Assemble PDF with xref
  const header = `%PDF-1.4\n`;
  let body = "";
  const xref: number[] = [];

  // Object offsets
  let offset = header.length;

  objects.forEach((obj) => {
    xref.push(offset);
    body += obj + "\n";
    offset += (obj + "\n").length;
  });

  const xrefStart = offset;

  let xrefTable = `xref
0 ${objects.length + 1}
0000000000 65535 f \n`;

  xref.forEach((off) => {
    xrefTable += `${String(off).padStart(10, "0")} 00000 n \n`;
  });

  const trailer = `trailer
<< /Size ${objects.length + 1} /Root 1 0 R >>
startxref
${xrefStart}
%%EOF`;

  const pdf = header + body + xrefTable + trailer;

  return new Blob([pdf], { type: "application/pdf" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
