import { Order } from "@/types";
import { escapeHtml } from "@/lib/security/html";

export const BILLING_PROFILE = {
  companyName: "SpecForge",
  email: "billing@specforge.com",
  addressLine1: "123, Tech Park",
  addressLine2: "MG Road",
  city: "Bengaluru",
  postalCode: "560001",
  gstin: "29ABCDE1234F1Z5",
};

export const generateInvoiceHTML = (order: Order): string => {
  const subtotal = order.subtotal || Math.round(order.total / 1.18);
  const taxAmount = order.gstAmount || (order.total - subtotal);
  const total = order.total;
  const invoiceNumber = `INV-${order.id}-${new Date().getFullYear()}`;
  const today = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const fmtINR = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);

  const itemRows = order.items
    .map((item) => {
      const lineTotal = item.quantity * item.price;
      const unitLines = (item.assignedUnits ?? [])
        .map((unit) =>
          [unit.partNumber, unit.serialNumber].filter(Boolean).join(" / ")
        )
        .filter(Boolean)
        .map(
          (text) =>
            `<div style="margin-top:2px;color:#64748b">Unit: ${escapeHtml(text)}</div>`
        )
        .join("");

      return `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9">
            <strong style="color:#1e293b">${escapeHtml(item.name)}</strong>
            <br/><small style="color:#94a3b8">${escapeHtml(item.category || item.sku || "")}</small>
            ${unitLines}
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:center">${escapeHtml(item.quantity)}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:right">${escapeHtml(fmtINR(item.price))}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:right;color:#6366f1">18%</td>
          <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:700;color:#1e293b">${escapeHtml(fmtINR(lineTotal))}</td>
        </tr>`;
    })
    .join("");

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>${escapeHtml(invoiceNumber)}</title>
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
thead th:not(:first-child){text-align:right}
thead th:nth-child(2){text-align:center}
tbody td{padding:9px 12px;border-bottom:1px solid #f1f5f9;vertical-align:top;color:#334155}
tbody td:not(:first-child){text-align:right}
tbody td:nth-child(2){text-align:center}
tbody tr:last-child td{border-bottom:none}
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
    <div class="brand">${escapeHtml(BILLING_PROFILE.companyName)}</div>
    <div class="brand-sub">${escapeHtml(BILLING_PROFILE.addressLine1)}${BILLING_PROFILE.addressLine2 ? `, ${escapeHtml(BILLING_PROFILE.addressLine2)}` : ""}, ${escapeHtml(BILLING_PROFILE.city)} - ${escapeHtml(BILLING_PROFILE.postalCode)}<br>GSTIN: ${escapeHtml(BILLING_PROFILE.gstin || "N/A")} · ${escapeHtml(BILLING_PROFILE.email)}</div>
  </div>
  <div>
    <div class="inv-label">Invoice</div>
    <div class="inv-num">${escapeHtml(invoiceNumber)}</div>
    <div class="inv-date">${escapeHtml(
      new Date(order.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    )}</div>
    <div style="text-align:right"><span class="chip">${escapeHtml(order.status.toUpperCase())}</span></div>
  </div>
</div>

<div class="grid2">
  <div>
    <div class="sec-lbl">Bill to</div>
    <div class="sec-val">
      <strong>${escapeHtml(order.customerName)}</strong><br>${escapeHtml(order.email)}<br>${escapeHtml(order.shippingStreet)}<br>${escapeHtml(order.shippingCity)}, ${escapeHtml(order.shippingState)} - ${escapeHtml(order.shippingZip)}<br>${escapeHtml(order.shippingCountry)}
    </div>
  </div>
  <div>
    <div class="sec-lbl">Payment details</div>
    <div class="sec-val">
      <strong>Order ID:</strong> ${escapeHtml(order.id)}<br>
      <strong>Method:</strong> ${escapeHtml(order.paymentMethod)}<br>
      <strong>Payment status:</strong> ${escapeHtml(order.paymentStatus)}
      ${order.paymentTransactionId ? `<br><strong>TXN ID:</strong> ${escapeHtml(order.paymentTransactionId)}` : ""}
    </div>
  </div>
</div>

<table>
  <thead><tr>
    <th>Description</th>
    <th style="text-align:center">Qty</th>
    <th style="text-align:right">Unit price</th>
    <th style="text-align:right">Tax (GST)</th>
    <th style="text-align:right">Amount</th>
  </tr></thead>
  <tbody>${itemRows}</tbody>
</table>

<div class="totals">
  <div class="tot-row"><span>Subtotal (excl. tax)</span><span>${escapeHtml(fmtINR(subtotal))}</span></div>
  <div class="tot-row"><span>Shipping</span><span>Free</span></div>
  <div class="tot-row"><span>GST 18%</span><span>${escapeHtml(fmtINR(taxAmount))}</span></div>
  <hr class="tot-sep">
  <div class="tot-final"><span>Total due</span><span>${escapeHtml(fmtINR(total))}</span></div>
</div>

<div class="footer">
  <span>Thank you for your business.</span>
  <span>${escapeHtml(invoiceNumber)} · Generated ${escapeHtml(today)}</span>
</div>
</div></body></html>`;
};
