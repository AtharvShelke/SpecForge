import { Order } from "@/types";

export const BILLING_PROFILE = {
  companyName: 'Computer Store Store',
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

  const itemRows = (order.items ?? []).map(item => {
    const lineTotal = item.quantity * item.price;
    return `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9">
          <strong style="color:#1e293b">${item.name}</strong>
          <br/><small style="color:#94a3b8">${item.category || item.sku || ''}</small>
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-family:monospace">${item.productNumber || '-'}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-family:monospace">${item.partNumber || '-'}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-family:monospace">${item.serialNumber || '-'}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:center">${item.quantity}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:right">${fmtINR(item.price)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:right;color:#6366f1">18%</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:700;color:#1e293b">${fmtINR(lineTotal)}</td>
      </tr>`;
  }).join('');

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>${invoiceNumber}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',system-ui,sans-serif;color:#334155;background:#f8fafc}
.page{max-width:760px;margin:32px auto;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:40px 44px}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:22px;border-bottom:1px solid #e2e8f0;margin-bottom:22px}
.brand{font-size:15px;font-weight:600;color:#0f172a;margin-bottom:4px}
.brand-sub{font-size:11px;color:#94a3b8;line-height:1.8}
.inv-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:#94a3b8;text-align:right;margin-bottom:2px}
.inv-num{font-size:20px;font-weight:700;color:#0f172a;text-align:right;letter-spacing:-.3px}
.inv-date{font-size:12px;color:#64748b;text-align:right;margin-top:3px}
.chip{display:inline-block;font-size:10px;font-weight:600;padding:2px 8px;border-radius:4px;letter-spacing:.4px;background:#dcfce7;color:#15803d;margin-top:6px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:22px}
.sec-lbl{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:#94a3b8;margin-bottom:6px}
.sec-val{font-size:12px;line-height:1.85;color:#475569}
.sec-val strong{color:#1e293b;font-weight:600}
table{width:100%;border-collapse:collapse;margin-bottom:18px;font-size:12px}
thead th{padding:7px 12px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:#94a3b8;background:#f8fafc;border-bottom:1px solid #e2e8f0;text-align:left}
thead th:nth-child(5){text-align:center}
thead th:nth-child(6),thead th:nth-child(7),thead th:nth-child(8){text-align:right}
tbody td{padding:9px 12px;border-bottom:1px solid #f1f5f9;vertical-align:top;color:#334155}
tbody td:nth-child(5){text-align:center}
tbody td:nth-child(6),tbody td:nth-child(7),tbody td:nth-child(8){text-align:right}
tbody tr:last-child td{border-bottom:none}
.item-name{font-weight:600;color:#1e293b;font-size:12px;margin-bottom:1px}
.item-sku{font-size:11px;color:#94a3b8}
.totals{margin-left:auto;max-width:256px;margin-bottom:22px}
.tot-row{display:flex;justify-content:space-between;font-size:12px;padding:3px 0;color:#64748b}
.tot-row span:last-child{color:#334155}
.tot-sep{border:none;border-top:1px solid #e2e8f0;margin:8px 0}
.tot-final{display:flex;justify-content:space-between;font-size:13px;font-weight:700;padding:6px 0 0;color:#0f172a}
.tot-final span:last-child{color:#4f46e5}
.footer{padding-top:14px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:11px;color:#94a3b8}
@media print{body{background:#fff}.page{margin:0;border:none;border-radius:0;box-shadow:none;padding:28px 32px}}
</style></head><body><div class="page">

<div class="hdr">
  <div>
    <div class="brand">${BILLING_PROFILE.companyName}</div>
    <div class="brand-sub">${BILLING_PROFILE.addressLine1}${BILLING_PROFILE.addressLine2 ? ', ' + BILLING_PROFILE.addressLine2 : ''}, ${BILLING_PROFILE.city} – ${BILLING_PROFILE.postalCode}<br>GSTIN: ${BILLING_PROFILE.gstin || 'N/A'} &nbsp;·&nbsp; ${BILLING_PROFILE.email}</div>
  </div>
  <div>
    <div class="inv-label">Invoice</div>
    <div class="inv-num">${invoiceNumber}</div>
    <div class="inv-date">${new Date(order.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>
    <div style="text-align:right"><span class="chip">${order.status.toUpperCase()}</span></div>
  </div>
</div>

<div class="grid2">
  <div>
    <div class="sec-lbl">Bill to</div>
    <div class="sec-val">
      <strong>${order.customerName}</strong><br>${order.email}<br>${order.shippingStreet}<br>${order.shippingCity}, ${order.shippingState} – ${order.shippingZip}<br>${order.shippingCountry}
    </div>
  </div>
  <div>
    <div class="sec-lbl">Payment details</div>
    <div class="sec-val">
      <strong>Order ID:</strong> ${order.id}<br>
      <strong>Method:</strong> ${order.paymentMethod}<br>
      <strong>Payment status:</strong> ${order.paymentStatus}
      ${order.paymentTransactionId ? `<br><strong>TXN ID:</strong> ${order.paymentTransactionId}` : ''}
    </div>
  </div>
</div>

<table>
  <thead><tr>
    <th>Description</th>
    <th>Product #</th>
    <th>Part #</th>
    <th>Serial #</th>
    <th style="text-align:center">Qty</th>
    <th style="text-align:right">Unit price</th>
    <th style="text-align:right">Tax (GST)</th>
    <th style="text-align:right">Amount</th>
  </tr></thead>
  <tbody>${itemRows}</tbody>
</table>

<div class="totals">
  <div class="tot-row"><span>Subtotal (excl. tax)</span><span>${fmtINR(subtotal)}</span></div>
  <div class="tot-row"><span>Shipping</span><span>Free</span></div>
  <div class="tot-row"><span>GST 18%</span><span>${fmtINR(taxAmount)}</span></div>
  <hr class="tot-sep">
  <div class="tot-final"><span>Total due</span><span>${fmtINR(total)}</span></div>
</div>

<div class="footer">
  <span>Thank you for your business.</span>
  <span>${invoiceNumber} · Generated ${today}</span>
</div>
</div></body></html>`;
};
