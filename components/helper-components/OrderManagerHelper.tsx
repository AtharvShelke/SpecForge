import { STATUS_CONFIG } from '@/data/constants';
import { cn } from '@/lib/utils';
import { Order, OrderStatus } from '@/types';
import { AlertTriangle, ClipboardList, Package, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

export const StatusBadge = ({ status }: { status: OrderStatus }) => {
  const cfg = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] ring-1 transition-all duration-300',
        cfg.badgeClass,
      )}
    >
      <span className={cn('h-1.5 w-1.5 flex-shrink-0 rounded-full', cfg.dotClass)} />
      {cfg.label}
    </span>
  );
};

export const MetaItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="group flex items-start gap-3 rounded-[1.25rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(247,244,238,0.9))] p-3.5 shadow-[0_12px_30px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
    <div className="rounded-2xl border border-white/80 bg-white/90 p-2.5 text-stone-400 shadow-sm transition-colors group-hover:text-stone-900">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">{label}</p>
      <div className="truncate text-sm font-semibold text-stone-900">{value}</div>
    </div>
  </div>
);

export const StatsBar = ({ orders }: { orders: Order[] }) => {
  const stats = useMemo(() => {
    const total = orders.length;
    const revenue = orders
      .filter((order) => order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.RETURNED)
      .reduce((sum, order) => sum + order.total, 0);
    const pending = orders.filter((order) => order.status === OrderStatus.PENDING || order.status === OrderStatus.PAID).length;
    const processing = orders.filter((order) => order.status === OrderStatus.PROCESSING || order.status === OrderStatus.SHIPPED).length;

    return { total, revenue, pending, processing };
  }, [orders]);

  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[
        {
          label: 'Total Orders',
          value: stats.total,
          sub: `${stats.total} records`,
          icon: <ClipboardList size={16} />,
          className: 'border-white/80 bg-white/90 text-stone-900',
        },
        {
          label: 'Revenue',
          value: `Rs. ${stats.revenue.toLocaleString('en-IN')}`,
          sub: 'Net revenue',
          icon: <TrendingUp size={16} />,
          className: 'border-stone-900 bg-stone-900 text-white',
        },
        {
          label: 'Needs Action',
          value: stats.pending,
          sub: 'Pending / paid',
          icon: <AlertTriangle size={16} />,
          className: 'border-amber-100 bg-amber-50/80 text-amber-700',
        },
        {
          label: 'In Progress',
          value: stats.processing,
          sub: 'Processing / shipped',
          icon: <Package size={16} />,
          className: 'border-sky-100 bg-sky-50/80 text-sky-700',
        },
      ].map((item) => (
        <div
          key={item.label}
          className={cn(
            'group flex items-center gap-4 rounded-[1.5rem] border px-5 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition-all duration-200',
            item.className,
          )}
        >
          <div className="shrink-0 rounded-2xl border border-white/70 bg-white/90 p-2.5 shadow-sm">{item.icon}</div>
          <div className="min-w-0">
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">{item.label}</p>
            <p className="truncate text-xl font-semibold leading-tight">{item.value}</p>
            <p className="text-[11px] text-stone-500">{item.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
