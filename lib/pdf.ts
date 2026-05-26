/**
 * PDF Generation Utilities
 * 
 * Zero-dependency PDF generation for invoices.
 */

import { BillingProfile, Invoice, InvoiceLineItem } from '@/types';

/**
 * Escape text for PDF strings.
 */
export function escapePdfText(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/**
 * Generate invoice PDF blob.
 */
export function generateInvoicePdfBlob({
  invoice,
  billingProfile,
}: {
  invoice: Invoice;
  billingProfile: BillingProfile;
}) {
  const lines: string[] = [];
  const push = (s: string) => lines.push(s);

  const title = `Invoice ${invoice.invoiceNumber}`;
  const metaLeft = [
    billingProfile.companyName,
    billingProfile.addressLine1,
    billingProfile.addressLine2 ? billingProfile.addressLine2 : null,
    `${billingProfile.city}${billingProfile.state ? ', ' + billingProfile.state : ''} ${billingProfile.postalCode}`,
    billingProfile.country,
    billingProfile.gstin ? `GSTIN: ${billingProfile.gstin}` : null,
    `Email: ${billingProfile.email}`,
  ].filter(Boolean) as string[];

  const metaRight = [
    `Invoice #: ${invoice.invoiceNumber}`,
    `Status: ${invoice.status}`,
    `Created: ${new Date(invoice.createdAt).toLocaleDateString()}`,
    `Due: ${new Date(invoice.dueDate).toLocaleDateString()}`,
    invoice.sentAt ? `Sent: ${new Date(invoice.sentAt).toLocaleDateString()}` : null,
    invoice.paidAt ? `Paid: ${new Date(invoice.paidAt).toLocaleDateString()}` : null,
  ].filter(Boolean) as string[];

  const customer = invoice.customer;
  const customerBlock = customer
    ? [
      'Bill To:',
      customer.company ? customer.company : customer.name,
      customer.email,
      customer.phone ? customer.phone : null,
      customer.addressLine1 ? customer.addressLine1 : null,
      customer.city
        ? `${customer.city}${customer.state ? ', ' + customer.state : ''} ${customer.postalCode ?? ''}`
        : null,
      customer.country ? customer.country : null,
    ].filter(Boolean) as string[]
    : ['Bill To:', 'Unknown Customer'];

  const itemsHeader = 'Items:';
  const itemsLines = invoice.lineItems.map((li) => {
    const lineTotal = li.quantity * li.unitPrice;
    const tax = ((li.taxRatePct ?? 0) / 100) * lineTotal;
    const full = lineTotal + tax;
    return `${li.name}  |  ${li.quantity} x ${li.unitPrice}  |  ${full}`;
  });

  const totals = [
    `Subtotal: ${invoice.subtotal}`,
    `Tax: ${invoice.taxTotal}`,
    invoice.shipping ? `Shipping: ${invoice.shipping}` : null,
    invoice.discountPct ? `Discount: ${invoice.discountPct}%` : null,
    `Total: ${invoice.total}`,
    `Paid: ${invoice.amountPaid}`,
    `Amount Due: ${invoice.amountDue}`,
  ].filter(Boolean) as string[];

  const notes = invoice.notes ? [`Notes:`, invoice.notes] : [];

  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 40;
  let y = pageHeight - margin;
  const fontSizeTitle = 18;
  const fontSize = 11;

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

  content.push('BT');
  setFont(fontSizeTitle);
  moveTo(margin, y);
  showText(title);
  y -= 30;
  setFont(fontSize);
  moveTo(margin, y);
  metaLeft.forEach((l, idx) => {
    if (idx > 0) newLine(14);
    showText(l);
  });

  const rightX = pageWidth / 2 + 20;
  const rightStartY = y;
  moveTo(rightX, rightStartY);
  metaRight.forEach((l, idx) => {
    if (idx > 0) newLine(14);
    showText(l);
  });

  y = rightStartY - Math.max(metaLeft.length, metaRight.length) * 14 - 24;
  moveTo(margin, y);
  customerBlock.forEach((l, idx) => {
    if (idx > 0) newLine(14);
    showText(l);
  });

  y -= (customerBlock.length * 14 + 18);
  moveTo(margin, y);
  showText(itemsHeader);
  y -= 18;
  moveTo(margin, y);

  const maxItemLines = 18;
  itemsLines.slice(0, maxItemLines).forEach((l, idx) => {
    if (idx > 0) newLine(14);
    showText(l);
  });

  y -= (Math.min(itemsLines.length, maxItemLines) * 14 + 24);
  moveTo(margin, y);
  totals.forEach((l, idx) => {
    if (idx > 0) newLine(14);
    showText(l);
  });

  if (notes.length) {
    y -= (totals.length * 14 + 24);
    moveTo(margin, y);
    notes.forEach((l, idx) => {
      if (idx > 0) newLine(14);
      showText(l);
    });
  }

  content.push('ET');

  const contentStream = content.join('\n');
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

  const contentBytes = new TextEncoder().encode(contentStream);
  addObj(`5 0 obj
<< /Length ${contentBytes.length} >>
stream
${contentStream}
endstream
endobj`);

  const header = '%PDF-1.4\n';
  let body = '';
  const xref: number[] = [];
  let offset = header.length;

  objects.forEach((obj) => {
    xref.push(offset);
    body += obj + '\n';
    offset += (obj + '\n').length;
  });

  const xrefStart = offset;
  let xrefTable = `xref
0 ${objects.length + 1}
0000000000 65535 f \n`;

  xref.forEach((off) => {
    xrefTable += `${String(off).padStart(10, '0')} 00000 n \n`;
  });

  const trailer = `trailer
<< /Size ${objects.length + 1} /Root 1 0 R >>
startxref
${xrefStart}
%%EOF`;

  const pdf = header + body + xrefTable + trailer;

  return new Blob([pdf], { type: 'application/pdf' });
}

/**
 * Download a blob as a file.
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
