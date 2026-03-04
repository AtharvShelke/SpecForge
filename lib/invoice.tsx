import { Order } from "@/types";

export const generateInvoiceHTML = (order: Order): string => {
  // Backward hook for historical orders
  const subtotal = order.subtotal || Math.round(order.total / 1.18);
  const taxAmount = order.gstAmount || (order.total - subtotal);
  const total = order.total;
  const invoiceNumber = `INV-${order.id}-${new Date().getFullYear()}`;
  const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  const itemRows = order.items.map(item => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;">${item.name}<br/><span style="font-size:11px;color:#6b7280;">${item.sku}</span></td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">₹${item.price.toLocaleString('en-IN')}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${invoiceNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; color: #111; background: #fff; }
    .page { max-width: 800px; margin: 0 auto; padding: 48px 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; }
    .brand { font-size: 22px; font-weight: 800; color: #1d4ed8; letter-spacing: -0.5px; }
    .brand-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
    .invoice-meta { text-align: right; }
    .invoice-meta h2 { font-size: 28px; font-weight: 800; color: #111; letter-spacing: -1px; }
    .invoice-meta p { font-size: 12px; color: #6b7280; margin-top: 2px; }
    .status-chip { display: inline-block; margin-top: 6px; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; background: #dcfce7; color: #15803d; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 40px; }
    .section-label { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .section-value { font-size: 13px; color: #111; line-height: 1.7; }
    .section-value strong { font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead tr { background: #f8fafc; }
    thead th { padding: 10px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; text-align: left; }
    thead th:last-child, thead th:nth-child(3), thead th:nth-child(2) { text-align: right; }
    thead th:nth-child(2) { text-align: center; }
    .totals { margin-left: auto; max-width: 280px; }
    .total-row { display: flex; justify-content: space-between; font-size: 13px; padding: 5px 0; color: #374151; }
    .total-row.final { font-size: 16px; font-weight: 800; color: #111; border-top: 2px solid #111; margin-top: 8px; padding-top: 10px; }
    .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af; }
    @media print { .page { padding: 20px; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        <div class="brand">Nexus Hardware</div>
        <div class="brand-sub">123, Tech Park, MG Road, Bengaluru 560001<br/>GSTIN: 29ABCDE1234F1Z5 | billing@nexushardware.com</div>
      </div>
      <div class="invoice-meta">
        <h2>INVOICE</h2>
        <p>${invoiceNumber}</p>
        <p>Date: ${today}</p>
        <span class="status-chip">${order.status.toUpperCase()}</span>
      </div>
    </div>

    <div class="grid-2">
      <div>
        <div class="section-label">Bill To</div>
        <div class="section-value">
          <strong>${order.customerName}</strong><br/>
          ${order.email}<br/>
          ${order.shippingStreet}<br/>
          ${order.shippingCity}, ${order.shippingState} – ${order.shippingZip}<br/>
          ${order.shippingCountry}
        </div>
      </div>
      <div>
        <div class="section-label">Order Details</div>
        <div class="section-value">
          <strong>Order ID:</strong> ${order.id}<br/>
          <strong>Order Date:</strong> ${new Date(order.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}<br/>
          <strong>Payment:</strong> ${order.paymentMethod}<br/>
          ${order.paymentTransactionId ? `<strong>TXN ID:</strong> ${order.paymentTransactionId}<br/>` : ''}
          <strong>Payment Status:</strong> ${order.paymentStatus}
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div class="totals">
      <div class="total-row"><span>Subtotal</span><span>₹${subtotal.toLocaleString('en-IN')}</span></div>
      <div class="total-row"><span>Shipping</span><span>Free</span></div>
      <div class="total-row"><span>GST (18%)</span><span>₹${taxAmount.toLocaleString('en-IN')}</span></div>
      <div class="total-row final"><span>Total Due</span><span>₹${total.toLocaleString('en-IN')}</span></div>
    </div>

    <div class="footer">
      <span>Thank you for your business!</span>
      <span>Generated: ${today} | ${invoiceNumber}</span>
    </div>
  </div>
</body>
</html>`;
};