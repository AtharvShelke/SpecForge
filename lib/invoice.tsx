import { Order } from "@/types";

export const BILLING_PROFILE = {
  companyName: 'Nexus Hardware Store',
  email: 'billing@nexushardware.com',
  addressLine1: '123, Tech Park',
  addressLine2: 'MG Road',
  city: 'Bengaluru',
  postalCode: '560001',
  gstin: '29ABCDE1234F1Z5',
};

export const generateInvoiceHTML = (order: Order): string => {
  // Backward hook for historical orders
  const subtotal = order.subtotal || Math.round(order.total / 1.18);
  const taxAmount = order.gstAmount || (order.total - subtotal);
  const total = order.total;
  const invoiceNumber = `INV-${order.id}-${new Date().getFullYear()}`;
  const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

  const fmtINR = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const itemRows = order.items.map(item => {
    const lineTotal = item.quantity * item.price;
    return `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9">
          <strong style="color:#1e293b">${item.name}</strong>
          <br/><small style="color:#94a3b8">${item.category || item.sku || ''}</small>
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:center">${item.quantity}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:right">${fmtINR(item.price)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:right;color:#6366f1">18%</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:700;color:#1e293b">${fmtINR(lineTotal)}</td>
      </tr>`;
  }).join('');

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
  <title>${invoiceNumber}</title>
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
      <div class="brand-name">${BILLING_PROFILE.companyName}</div>
      <div class="brand-sub">${BILLING_PROFILE.addressLine1}${BILLING_PROFILE.addressLine2 ? ', ' + BILLING_PROFILE.addressLine2 : ''}, ${BILLING_PROFILE.city} – ${BILLING_PROFILE.postalCode}<br/>
      GSTIN: ${BILLING_PROFILE.gstin || 'N/A'} &nbsp;|&nbsp; ${BILLING_PROFILE.email}</div>
    </div>
    <div class="inv-meta">
      <div class="inv-label">Invoice</div>
      <div class="inv-num">${invoiceNumber}</div>
      <div style="font-size:12px;color:#64748b;margin-top:4px">Date: ${new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
      <span class="chip">${order.status.toUpperCase()}</span>
    </div>
  </div>
  <div class="grid2">
    <div>
      <div class="sec-label">Bill To</div>
      <div class="sec-val">
        <strong style="color:#1e293b">${order.customerName}</strong><br/>
        ${order.email}<br/>
        ${order.shippingStreet}<br/>
        ${order.shippingCity}, ${order.shippingState} – ${order.shippingZip}<br/>
        ${order.shippingCountry}
      </div>
    </div>
    <div>
      <div class="sec-label">Payment Info</div>
      <div class="sec-val">
        <strong>Order ID:</strong> ${order.id}<br/>
        <strong>Payment:</strong> ${order.paymentMethod}<br/>
        <strong>Payment Status:</strong> ${order.paymentStatus}
        ${order.paymentTransactionId ? `<br/><strong>TXN ID:</strong> ${order.paymentTransactionId}` : ''}
      </div>
    </div>
  </div>
  <table><thead><tr>
    <th>Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Tax</th><th style="text-align:right">Amount</th>
  </tr></thead><tbody>${itemRows}</tbody></table>
  <div class="totals">
    <div class="tot-row"><span>Subtotal (Excl. Tax)</span><span>${fmtINR(subtotal)}</span></div>
    <div class="tot-row"><span>Shipping</span><span>Free</span></div>
    <div class="tot-row"><span>Tax (GST 18%)</span><span>${fmtINR(taxAmount)}</span></div>
    <div class="tot-final"><span>Total Due</span><span style="color:#6366f1">${fmtINR(total)}</span></div>
  </div>
  <div class="footer">
    <span>Thank you for your business!</span>
    <span>${invoiceNumber} · Generated ${today}</span>
  </div>
  </div></body></html>`;
};