import React from 'react';
import { InvoiceAuditEvent } from '@/types';
import { Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { 
    day: 'numeric', month: 'short', year: 'numeric', 
    hour: '2-digit', minute: '2-digit', hour12: true 
  });

interface InvoiceAuditTrailProps {
  audit?: InvoiceAuditEvent[];
}

export const InvoiceAuditTrail: React.FC<InvoiceAuditTrailProps> = ({ audit }) => {
  const safeAudit = [...(audit || [])].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (safeAudit.length === 0) {
    return null;
  }

  return (
    <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-lg shadow-sm">
      <h3 className="text-xs font-medium text-zinc-400 mb-4 flex items-center gap-2">
        <Monitor size={14} /> Audit Trail
      </h3>
      <div className="space-y-6">
        {safeAudit.map((ev, idx, arr) => (
          <div key={ev.id} className="flex gap-4 group">
            <div className="flex flex-col items-center shrink-0">
              <div className={cn(
                'w-2.5 h-2.5 rounded-full border-2 border-zinc-50', 
                idx === arr.length - 1 ? 'bg-zinc-900 shadow-[0_0_10px_rgba(0,0,0,0.2)]' : 'bg-zinc-300'
              )} />
              {idx !== arr.length - 1 && <div className="w-0.5 flex-1 bg-zinc-200 my-1" />}
            </div>
            <div className="pb-6">
              <p className={cn(
                'text-xs font-semibold mb-0.5', 
                idx === arr.length - 1 ? 'text-zinc-900' : 'text-zinc-500'
              )}>
                <span className="uppercase text-[10px] tracking-wider text-indigo-500 mr-2 border border-indigo-100 bg-indigo-50 px-1.5 py-0.5 rounded">
                  {ev.type}
                </span>
                {ev.message || `Action: ${ev.type}`}
              </p>
              <p className="text-[11px] text-zinc-400">{ev.actor} · {fmtDate(ev.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
