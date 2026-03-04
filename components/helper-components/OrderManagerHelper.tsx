import { STATUS_CONFIG } from "@/data/constants";
import { cn } from "@/lib/utils";
import { Order, OrderStatus } from "@/types";
import { AlertTriangle, ClipboardList, Package, TrendingUp } from "lucide-react";
import { useMemo } from "react";

export const StatusBadge = ({ status }: { status: OrderStatus }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn(
      'inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-medium uppercase tracking-wide border transition-all duration-300',
      cfg.badgeClass
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dotClass)} />
      {cfg.label}
    </span>
  );
};

export const MetaItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
  <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50 border border-zinc-100 group hover:border-zinc-200 transition-all duration-150">
    <div className="p-2 bg-white rounded-lg text-zinc-400 group-hover:text-zinc-900 shadow-sm transition-colors">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-zinc-400 mb-0.5">{label}</p>
      <div className="text-sm font-semibold text-zinc-900 truncate">{value}</div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// STATS BAR (Top KPIs)
// ─────────────────────────────────────────────────────────────
export const StatsBar = ({ orders }: { orders: Order[] }) => {
  const stats = useMemo(() => {
    const total = orders.length;
    const revenue = orders
      .filter(o => o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.RETURNED)
      .reduce((s, o) => s + o.total, 0);
    const pending = orders.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.PAID).length;
    const processing = orders.filter(o => o.status === OrderStatus.PROCESSING || o.status === OrderStatus.SHIPPED).length;
    return { total, revenue, pending, processing };
  }, [orders]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {[
        { label: 'Total Orders', value: stats.total, sub: `${stats.total} records`, icon: <ClipboardList size={16} />, color: 'text-zinc-900' },
        { label: 'Revenue', value: `₹${stats.revenue.toLocaleString('en-IN')}`, sub: 'Net revenue', icon: <TrendingUp size={16} />, color: 'text-zinc-900 bg-zinc-900 text-white' },
        { label: 'Needs Action', value: stats.pending, sub: 'Pending / paid', icon: <AlertTriangle size={16} />, color: 'text-amber-600' },
        { label: 'In Progress', value: stats.processing, sub: 'Processing / shipped', icon: <Package size={16} />, color: 'text-zinc-900' },
      ].map(item => (
        <div key={item.label} className={cn('flex items-center gap-4 px-5 py-4 rounded-lg border border-zinc-200 transition-all duration-150 group cursor-default', item.color)}>
          <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 shrink-0">{item.icon}</div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-zinc-400 mb-0.5">{item.label}</p>
            <p className="text-xl font-semibold leading-tight truncate">{item.value}</p>
            <p className="text-[11px] text-zinc-400">{item.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
};