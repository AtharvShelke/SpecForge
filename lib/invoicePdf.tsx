/**
 * React-PDF invoice document component.
 *
 * Uses @react-pdf/renderer primitives (Document, Page, View, Text)
 * to produce a pixel-level replica of the existing HTML invoice.
 *
 * Server-only – call `generateInvoicePdfBuffer(order)` from API routes
 * or server actions to get a Buffer suitable for HTTP responses or
 * nodemailer attachments.
 */

import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  renderToBuffer,
  Font,
} from '@react-pdf/renderer';
import { BILLING_PROFILE } from '@/lib/invoice';
import type { Order } from '@/types';

// ── Colours (matching HTML invoice) ──────────────────
const C = {
  dark: '#0f172a',
  heading: '#1e293b',
  body: '#334155',
  muted: '#64748b',
  label: '#94a3b8',
  accent: '#4f46e5',
  accentLight: '#6366f1',
  border: '#e2e8f0',
  bgFaint: '#f8fafc',
  chipBg: '#dcfce7',
  chipText: '#15803d',
};

// ── Styles ───────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: C.body,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 44,
  },

  /* ── Header ─────────────────────── */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginBottom: 18,
  },
  brand: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.dark },
  brandSub: { fontSize: 9, color: C.label, lineHeight: 1.8, marginTop: 3 },
  invLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: C.label,
    textAlign: 'right',
  },
  invNum: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: C.dark,
    textAlign: 'right',
    marginTop: 1,
  },
  invDate: { fontSize: 10, color: C.muted, textAlign: 'right', marginTop: 3 },
  chip: {
    alignSelf: 'flex-end',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: C.chipBg,
    color: C.chipText,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    marginTop: 5,
  },

  /* ── Two-column grid ────────────── */
  grid2: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 18,
  },
  gridCol: { flex: 1 },
  secLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: C.label,
    marginBottom: 5,
  },
  secVal: { fontSize: 10, lineHeight: 1.85, color: '#475569' },
  secBold: { fontFamily: 'Helvetica-Bold', color: C.heading },

  /* ── Table ──────────────────────── */
  tableHead: {
    flexDirection: 'row',
    backgroundColor: C.bgFaint,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 6,
  },
  th: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: C.label,
    paddingHorizontal: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 8,
  },
  td: { fontSize: 10, paddingHorizontal: 10, color: C.body },
  tdBold: { fontFamily: 'Helvetica-Bold', color: C.heading },
  tdSku: { fontSize: 9, color: C.label, marginTop: 1 },

  /* Column widths (flex basis) */
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: 'center' },
  colPrice: { flex: 1.5, textAlign: 'right' },
  colTax: { flex: 1, textAlign: 'right' },
  colAmt: { flex: 1.5, textAlign: 'right' },

  /* ── Totals ─────────────────────── */
  totals: { alignSelf: 'flex-end', width: 220, marginTop: 10, marginBottom: 18 },
  totRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totLabel: { fontSize: 10, color: C.muted },
  totValue: { fontSize: 10, color: C.body },
  totSep: { borderTopWidth: 1, borderTopColor: C.border, marginVertical: 6 },
  totFinalLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.dark },
  totFinalValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.accent },

  /* ── Footer ─────────────────────── */
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: 'auto',
  },
  footerText: { fontSize: 9, color: C.label },
});

// ── Helpers ──────────────────────────────────────────
const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

// ── React PDF Document ──────────────────────────────
interface InvoiceDocProps {
  order: Order;
}

const InvoiceDocument: React.FC<InvoiceDocProps> = ({ order }) => {
  const subtotal = order.subtotal || Math.round(order.total / 1.18);
  const taxAmount = order.gstAmount || (order.total - subtotal);
  const total = order.total;
  const invoiceNumber = `INV-${order.id}-${new Date().getFullYear()}`;
  const today = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ── Header ─────────────────────── */}
        <View style={s.header}>
          <View>
            <Text style={s.brand}>{BILLING_PROFILE.companyName}</Text>
            <Text style={s.brandSub}>
              {BILLING_PROFILE.addressLine1}
              {BILLING_PROFILE.addressLine2 ? `, ${BILLING_PROFILE.addressLine2}` : ''}
              , {BILLING_PROFILE.city} – {BILLING_PROFILE.postalCode}
              {'\n'}GSTIN: {BILLING_PROFILE.gstin || 'N/A'}  ·  {BILLING_PROFILE.email}
            </Text>
          </View>
          <View>
            <Text style={s.invLabel}>Invoice</Text>
            <Text style={s.invNum}>{invoiceNumber}</Text>
            <Text style={s.invDate}>{fmtDate(order.date)}</Text>
            <Text style={s.chip}>{order.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* ── Bill To / Payment ───────────── */}
        <View style={s.grid2}>
          <View style={s.gridCol}>
            <Text style={s.secLabel}>Bill to</Text>
            <Text style={s.secVal}>
              <Text style={s.secBold}>{order.customerName}</Text>
              {'\n'}{order.email}
              {'\n'}{order.shippingStreet}
              {'\n'}{order.shippingCity}, {order.shippingState} – {order.shippingZip}
              {'\n'}{order.shippingCountry}
            </Text>
          </View>
          <View style={s.gridCol}>
            <Text style={s.secLabel}>Payment details</Text>
            <Text style={s.secVal}>
              <Text style={s.secBold}>Order ID: </Text>{order.id}
              {'\n'}<Text style={s.secBold}>Method: </Text>{order.paymentMethod}
              {'\n'}<Text style={s.secBold}>Payment status: </Text>{order.paymentStatus}
              {order.paymentTransactionId ? (
                <>
                  {'\n'}<Text style={s.secBold}>TXN ID: </Text>{order.paymentTransactionId}
                </>
              ) : null}
            </Text>
          </View>
        </View>

        {/* ── Items table ─────────────────── */}
        <View style={s.tableHead}>
          <Text style={[s.th, s.colDesc]}>Description</Text>
          <Text style={[s.th, s.colQty]}>Qty</Text>
          <Text style={[s.th, s.colPrice]}>Unit price</Text>
          <Text style={[s.th, s.colTax]}>Tax (GST)</Text>
          <Text style={[s.th, s.colAmt]}>Amount</Text>
        </View>
        {order.items.map((item) => (
          <View key={item.id} style={s.tableRow}>
            <View style={[s.td, s.colDesc]}>
              <Text style={s.tdBold}>{item.name}</Text>
              {(item.category || item.sku) && (
                <Text style={s.tdSku}>{item.category?.name || item.sku}</Text>
              )}
              {(item.assignedUnits ?? []).map((unit) => {
                const label = [unit.partNumber, unit.serialNumber].filter(Boolean).join(' / ');
                return label ? <Text key={unit.id} style={s.tdSku}>Unit: {label}</Text> : null;
              })}
            </View>
            <Text style={[s.td, s.colQty]}>{item.quantity}</Text>
            <Text style={[s.td, s.colPrice]}>{fmtINR(item.price)}</Text>
            <Text style={[s.td, s.colTax, { color: C.accentLight }]}>18%</Text>
            <Text style={[s.td, s.colAmt, { fontFamily: 'Helvetica-Bold', color: C.heading }]}>
              {fmtINR(item.quantity * item.price)}
            </Text>
          </View>
        ))}

        {/* ── Totals ──────────────────────── */}
        <View style={s.totals}>
          <View style={s.totRow}>
            <Text style={s.totLabel}>Subtotal (excl. tax)</Text>
            <Text style={s.totValue}>{fmtINR(subtotal)}</Text>
          </View>
          <View style={s.totRow}>
            <Text style={s.totLabel}>Shipping</Text>
            <Text style={s.totValue}>Free</Text>
          </View>
          <View style={s.totRow}>
            <Text style={s.totLabel}>GST 18%</Text>
            <Text style={s.totValue}>{fmtINR(taxAmount)}</Text>
          </View>
          <View style={s.totSep} />
          <View style={s.totRow}>
            <Text style={s.totFinalLabel}>Total due</Text>
            <Text style={s.totFinalValue}>{fmtINR(total)}</Text>
          </View>
        </View>

        {/* ── Footer ──────────────────────── */}
        <View style={s.footer}>
          <Text style={s.footerText}>Thank you for your business.</Text>
          <Text style={s.footerText}>{invoiceNumber} · Generated {today}</Text>
        </View>
      </Page>
    </Document>
  );
};

// ── Public API ───────────────────────────────────────

/**
 * Render the invoice for the given order as a PDF buffer.
 * Use in API routes or server actions — never in client components.
 */
export async function generateInvoicePdfBuffer(order: Order): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument order={order} />);
}
