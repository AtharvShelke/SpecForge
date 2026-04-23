import React from 'react';
import { InvoiceLineItem } from '@/types';
import { Layers } from 'lucide-react';

const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);


interface InvoiceLineItemsProps {
  lineItems?: InvoiceLineItem[];
}

export const InvoiceLineItems: React.FC<InvoiceLineItemsProps> = ({ lineItems }) => {
  const safeItems = lineItems || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          <Layers size={15} className="text-zinc-400" /> Line Items
        </h3>
      </div>

      <div className="border border-zinc-100 rounded-lg overflow-hidden bg-zinc-50/30">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-zinc-100">
              <th className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Item</th>
              <th className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide text-center">Qty</th>
              <th className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide text-right">Unit Price</th>
              <th className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide text-right">Tax Rate %</th>
              <th className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide text-right">HSN Code</th>
              <th className="px-6 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {safeItems.map(item => {
              const lineTotal = item.quantity * item.unitPrice;
              const tax = lineTotal * ((item.taxRatePct ?? 0) / 100);
              const total = lineTotal + tax;
              return (
                <tr key={item.id} className="group hover:bg-white transition-all">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-zinc-900">{item.name}</p>
                    {item.description && <p className="text-xs text-zinc-400 mt-0.5">{item.description}</p>}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center min-w-[32px] h-7 px-2 rounded-md bg-zinc-100 text-zinc-900 font-semibold text-xs tabular-nums border border-zinc-200">
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-zinc-500 tabular-nums">{fmtINR(item.unitPrice)}</td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-zinc-500 tabular-nums">{item.taxRatePct}%</td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-zinc-500 tabular-nums">{item.hsnCode || '-'}</td>
                  <td className="px-6 py-4 text-right font-semibold text-zinc-900 tabular-nums">{fmtINR(total)}</td>
                </tr>
              );
            })}
            {safeItems.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-zinc-500 text-sm">
                  No line items available
                </td>
              </tr>
            )}
          </tbody>
          {safeItems.length > 0 && (
            <tfoot className="bg-zinc-50 border-t border-zinc-100">
              <tr>
                <td colSpan={5} className="px-6 py-4 text-right text-sm font-semibold text-zinc-900">Total</td>
                <td className="px-6 py-4 text-right font-semibold text-zinc-900 tabular-nums">
                  {fmtINR(safeItems.reduce((acc, item) => {
                    const lineTotal = item.quantity * item.unitPrice;
                    const tax = lineTotal * ((item.taxRatePct ?? 0) / 100);
                    return acc + lineTotal + tax;
                  }, 0))}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
