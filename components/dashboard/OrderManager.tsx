"use client";

import { useEffect, useMemo, useState, useCallback, memo } from "react";
import { useAdmin } from "@/context/AdminContext";
import {
  InventorySkuSummary,
  Order,
  OrderItem,
  OrderLog,
  OrderStatus,
  PaymentStatus,
} from "@/types";
import {
  ArrowLeft,
  Clock,
  FileText,
  Printer,
  RefreshCw,
  Search,
  Hash,
  Warehouse,
  XCircle,
  RotateCcw,
  ChevronDown,
  AlertTriangle,
  Trash2,
  Package,
  MapPin,
  User,
  Mail,
  Phone,
  CreditCard,
  AlertCircle,
  CalendarRange,
  FilterX,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  NEXT_STATUS_BUTTON,
  STATUS_CONFIG,
  STATUS_FLOW,
} from "@/data/constants";
import { generateInvoiceHTML } from "@/lib/invoice";
import OrderPayments from "@/components/orders/OrderPayments";
import InvoiceSequenceTab from "@/components/orders/InvoiceSequenceTab";
import {
  ConfirmStatusDialog,
  DeleteOrderDialog,
} from "../helper-components/OrderManagerDialogs";

/* ─────────────────────────────────────────────────────────────
   MODULE-LEVEL CONSTANTS
───────────────────────────────────────────────────────────────*/

const STATUS_PILL_MAP: Record<string, { label: string; cls: string }> = {
  [OrderStatus.PENDING]: {
    label: "Pending",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
  [OrderStatus.PAID]: {
    label: "Paid",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  [OrderStatus.PROCESSING]: {
    label: "Processing",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
  },
  [OrderStatus.SHIPPED]: {
    label: "Shipped",
    cls: "bg-violet-50 text-violet-700 border-violet-200",
  },
  [OrderStatus.DELIVERED]: {
    label: "Delivered",
    cls: "bg-teal-50 text-teal-700 border-teal-200",
  },
  [OrderStatus.CANCELLED]: {
    label: "Cancelled",
    cls: "bg-rose-50 text-rose-700 border-rose-200",
  },
  [OrderStatus.RETURNED]: {
    label: "Returned",
    cls: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

const FALLBACK_IMG = "https://picsum.photos/300/300";

const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  (e.target as HTMLImageElement).src = FALLBACK_IMG;
};

function computeFinancials(order: Order) {
  const subtotal =
    order.subtotal ??
    (order.items ?? []).reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
  const tax = (order.gstAmount ?? 0) + (order.taxAmount ?? 0);
  const discount = order.discountAmount ?? 0;
  const total = order.total ?? subtotal + tax - discount;
  return { subtotal, tax, discount, total };
}

const DATE_OPTS_SHORT: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};
const DATE_OPTS_LONG: Intl.DateTimeFormatOptions = {
  weekday: "short",
  year: "numeric",
  month: "short",
  day: "numeric",
};
const TIME_OPTS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
};
const TIMELINE_DATE_OPTS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
};

const DATE_FILTER_OPTIONS = [
  { value: "ALL", label: "Any date" },
  { value: "TODAY", label: "Today" },
  { value: "LAST_7_DAYS", label: "Last 7 days" },
  { value: "LAST_30_DAYS", label: "Last 30 days" },
  { value: "LAST_90_DAYS", label: "Last 90 days" },
] as const;

type DateFilterValue = (typeof DATE_FILTER_OPTIONS)[number]["value"];

const formatCurrency = (value: number) =>
  `Rs. ${value.toLocaleString("en-IN")}`;

function matchesDateFilter(orderDate: string, dateFilter: DateFilterValue) {
  if (dateFilter === "ALL") return true;

  const orderTime = new Date(orderDate).getTime();
  if (Number.isNaN(orderTime)) return false;

  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();

  if (dateFilter === "TODAY") {
    return orderTime >= todayStart;
  }

  const days =
    dateFilter === "LAST_7_DAYS" ? 7 : dateFilter === "LAST_30_DAYS" ? 30 : 90;
  const windowStart = todayStart - (days - 1) * 24 * 60 * 60 * 1000;
  return orderTime >= windowStart;
}

function getPaymentTone(paymentStatus?: PaymentStatus | null) {
  if (paymentStatus === PaymentStatus.COMPLETED)
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (
    paymentStatus === PaymentStatus.PENDING ||
    paymentStatus === PaymentStatus.INITIATED
  ) {
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }
  if (paymentStatus === PaymentStatus.FAILED)
    return "bg-rose-50 text-rose-700 border border-rose-200";
  return "bg-slate-100 text-slate-700 border border-slate-200";
}

/* ─────────────────────────────────────────────────────────────
   COMPONENTS
───────────────────────────────────────────────────────────────*/
const StatusPill = memo(({ status }: { status: OrderStatus }) => {
  const cfg = STATUS_PILL_MAP[status] ?? {
    label: status,
    cls: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        cfg.cls,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-75" />
      {cfg.label}
    </span>
  );
});
StatusPill.displayName = "StatusPill";

const SectionLabel = memo(
  ({
    icon,
    children,
  }: {
    icon: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div className="flex items-center gap-2 text-slate-700">
      <span className="text-slate-400">{icon}</span>
      <span className="text-sm font-semibold">{children}</span>
    </div>
  ),
);
SectionLabel.displayName = "SectionLabel";

const CollapsibleSection = memo(
  ({
    icon,
    title,
    badge,
    children,
    defaultOpen = true,
  }: {
    icon: React.ReactNode;
    title: string;
    badge?: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
  }) => {
    const [open, setOpen] = useState(defaultOpen);

    useEffect(() => {
      setOpen(defaultOpen);
    }, [defaultOpen]);

    const toggle = useCallback(() => setOpen((o) => !o), []);

    return (
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <button
          className={cn(
            "flex w-full items-center justify-between bg-white px-5 py-3 transition-colors hover:bg-slate-50",
            open && "border-b border-slate-200",
          )}
          onClick={toggle}
        >
          <div className="flex items-center gap-3">
            <SectionLabel icon={icon}>{title}</SectionLabel>
            {badge}
          </div>
          <ChevronDown
            size={16}
            className={cn(
              "text-slate-400 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </button>
        {open && <div>{children}</div>}
      </div>
    );
  },
);
CollapsibleSection.displayName = "CollapsibleSection";

interface OrderRowProps {
  order: Order;
  isSelected: boolean;
  onClick: (id: string) => void;
}

const OrderRow = memo(({ order, isSelected, onClick }: OrderRowProps) => {
  const needsAction =
    order.status === OrderStatus.PENDING || order.status === OrderStatus.PAID;
  const handleClick = useCallback(() => onClick(order.id), [order.id, onClick]);
  const itemCount =
    order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const formattedDate = useMemo(
    () => new Date(order.date).toLocaleDateString("en-IN", DATE_OPTS_SHORT),
    [order.date],
  );

  return (
    <button
      onClick={handleClick}
      className={cn(
        "group relative w-full border-l-2 px-4 py-4 text-left transition-colors",
        isSelected
          ? "border-l-slate-900 bg-slate-50"
          : "border-l-transparent hover:bg-slate-50",
      )}
    >
      {needsAction && !isSelected && (
        <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-amber-500" />
      )}
      <div className="mb-1 flex items-center justify-between gap-2">
        <span
          className={cn(
            "truncate font-mono text-xs font-medium",
            isSelected ? "text-slate-900" : "text-slate-500",
          )}
        >
          {order.id}
        </span>
        <StatusPill status={order.status} />
      </div>
      <p
        className={cn(
          "mb-1 truncate text-sm font-semibold tracking-tight",
          isSelected ? "text-slate-900" : "text-slate-700",
        )}
      >
        {order.customerName}
      </p>
      <p className="mb-3 truncate text-xs text-slate-500">{order.email}</p>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-600">
          {itemCount} item{itemCount !== 1 ? "s" : ""}
        </span>
        <span
          className={cn(
            "rounded-md px-2 py-0.5 text-xs font-medium",
            getPaymentTone(order.paymentStatus),
          )}
        >
          {order.paymentStatus ?? "Unpaid"}
        </span>
        {order.phone && (
          <span className="truncate rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-600">
            {order.phone}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <span className="font-mono text-xs text-slate-500">
            {formattedDate}
          </span>
          <p className="truncate text-xs text-slate-500">
            {order.paymentMethod ?? "Payment method pending"}
          </p>
        </div>
        <span
          className={cn(
            "font-mono text-sm font-medium",
            isSelected ? "text-slate-900" : "text-slate-700",
          )}
        >
          ₹{order.total.toLocaleString("en-IN")}
        </span>
      </div>
    </button>
  );
});
OrderRow.displayName = "OrderRow";

/* ─────────────────────────────────────────────────────────────
   MAIN ORDER MANAGER
───────────────────────────────────────────────────────────────*/
const OrderManager = () => {
  const {
    orders,
    updateOrderStatus,
    deleteOrder,
    inventory,
    syncData,
    isLoading,
  } = useAdmin() as unknown as {
    orders: Order[];
    updateOrderStatus: (
      id: string,
      status: OrderStatus,
      note?: string,
    ) => Promise<void>;
    deleteOrder: (id: string) => Promise<void>;
    inventory: InventorySkuSummary[];
    syncData: () => Promise<void>;
    isLoading: boolean;
  };

  const aggregatedInventory = useMemo(() => {
    const variantTotals = new Map<
      string,
      { quantity: number; reserved: number; reorderLevel: number; sku?: string }
    >();
    const arr = Array.isArray(inventory) ? inventory : [];

    for (const item of arr) {
      const existing = variantTotals.get(item.variantId);
      if (existing) {
        existing.quantity += item.quantity;
        existing.reserved += item.reserved || 0;
        existing.reorderLevel = Math.max(
          existing.reorderLevel,
          item.reorderLevel || 0,
        );
      } else {
        variantTotals.set(item.variantId, {
          quantity: item.quantity,
          reserved: item.reserved || 0,
          reorderLevel: item.reorderLevel || 0,
          sku: item.variant?.sku,
        });
      }
    }

    const lookupMap = new Map<
      string,
      { quantity: number; reserved: number; reorderLevel: number }
    >();
    variantTotals.forEach((data, vid) => {
      lookupMap.set(vid, data);
      if (data.sku) lookupMap.set(data.sku, data);
    });
    return lookupMap;
  }, [inventory]);

  const inventoryArray = useMemo(
    () => (Array.isArray(inventory) ? inventory : []),
    [inventory],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterOrderQuery, setFilterOrderQuery] = useState("");
  const [filterDate, setFilterDate] = useState<DateFilterValue>("ALL");
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    orderId: string;
    newStatus: OrderStatus;
    note: string;
  }>({ open: false, orderId: "", newStatus: OrderStatus.PENDING, note: "" });

  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const sortedOrders = useMemo(
    () =>
      [...orders].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [orders],
  );

  useEffect(() => {
    if (!selectedId && sortedOrders.length > 0)
      setSelectedId(sortedOrders[0].id);
  }, [sortedOrders, selectedId]);

  const filteredOrders = useMemo(() => {
    const customerQuery = filterCustomer.toLowerCase().trim();
    const orderQuery = filterOrderQuery.toLowerCase().trim();

    return sortedOrders.filter((o) => {
      const matchStatus = filterStatus === "All" || o.status === filterStatus;
      const matchCustomer =
        !customerQuery ||
        o.customerName.toLowerCase().includes(customerQuery) ||
        o.email.toLowerCase().includes(customerQuery) ||
        (o.phone ?? "").toLowerCase().includes(customerQuery);
      const matchOrder =
        !orderQuery ||
        o.id.toLowerCase().includes(orderQuery) ||
        (o.paymentTransactionId ?? "").toLowerCase().includes(orderQuery);
      const matchDate = matchesDateFilter(o.date, filterDate);

      return matchStatus && matchCustomer && matchOrder && matchDate;
    });
  }, [
    sortedOrders,
    filterCustomer,
    filterDate,
    filterOrderQuery,
    filterStatus,
  ]);

  useEffect(() => {
    if (filteredOrders.length === 0) return;
    if (
      !selectedId ||
      !filteredOrders.some((order) => order.id === selectedId)
    ) {
      setSelectedId(filteredOrders[0].id);
    }
  }, [filteredOrders, selectedId]);

  const selectedOrder = useMemo(
    () =>
      orders.find((o: Order) => o.id === selectedId) ?? sortedOrders[0] ?? null,
    [orders, selectedId, sortedOrders],
  );
  const selectedOrderItems = useMemo<OrderItem[]>(
    () => selectedOrder?.items ?? [],
    [selectedOrder],
  );

  const selectedFinancials = useMemo(
    () => (selectedOrder ? computeFinancials(selectedOrder) : null),
    [selectedOrder],
  );

  const needsActionCount = useMemo(
    () =>
      sortedOrders.filter(
        (o) =>
          o.status === OrderStatus.PENDING || o.status === OrderStatus.PAID,
      ).length,
    [sortedOrders],
  );

  const selectedDateLong = useMemo(
    () =>
      selectedOrder
        ? new Date(selectedOrder.date).toLocaleDateString(
          "en-IN",
          DATE_OPTS_LONG,
        )
        : "",
    [selectedOrder],
  );
  const selectedTime = useMemo(
    () =>
      selectedOrder
        ? new Date(selectedOrder.date).toLocaleTimeString("en-IN", TIME_OPTS)
        : "",
    [selectedOrder],
  );

  const openConfirmDialog = useCallback(
    (orderId: string, newStatus: OrderStatus) => {
      setConfirmDialog({ open: true, orderId, newStatus, note: "" });
    },
    [],
  );

  const confirmStatusUpdate = useCallback(async () => {
    const { orderId, newStatus } = confirmDialog;
    setIsUpdating(true);
    try {
      await updateOrderStatus(orderId, newStatus);
      setConfirmDialog((d) => ({ ...d, open: false }));
    } catch (error) {
      console.error("Failed to update order status", error);
    } finally {
      setIsUpdating(false);
    }
  }, [confirmDialog, updateOrderStatus]);

  const handleDeleteOrder = useCallback(async () => {
    if (!selectedOrder) return;
    setIsDeleting(true);
    try {
      await deleteOrder(selectedOrder.id);
      setDeleteDialogOpen(false);
      setSelectedId(null);
    } catch (error) {
      console.error("Failed to delete order", error);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedOrder, deleteOrder]);

  const handlePrintInvoice = useCallback(() => {
    if (!selectedOrder) return;
    const html = generateInvoiceHTML(selectedOrder);
    const win = window.open("", "_blank", "width=900,height=700");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
  }, [selectedOrder]);

  const handleRowClick = useCallback((id: string) => {
    setSelectedId(id);
    setShowMobileDetail(true);
  }, []);

  const handleReviewPayment = useCallback(
    async (
      paymentId: string,
      status: PaymentStatus.COMPLETED | PaymentStatus.FAILED,
    ) => {
      if (!selectedOrder) return;

      const response = await fetch(
        `/api/orders/${selectedOrder.id}/payments/${paymentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            note:
              status === PaymentStatus.COMPLETED
                ? "Manual payment verified by admin."
                : "Manual payment proof rejected by admin.",
          }),
        },
      );

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to review payment.");
      }

      await syncData();
    },
    [selectedOrder, syncData],
  );

  const handleBackClick = useCallback(() => setShowMobileDetail(false), []);
  const handleOpenDeleteDialog = useCallback(
    () => setDeleteDialogOpen(true),
    [],
  );

  const handleOpenConfirmNext = useCallback(() => {
    if (selectedOrder)
      openConfirmDialog(selectedOrder.id, STATUS_FLOW[selectedOrder.status][0]);
  }, [selectedOrder, openConfirmDialog]);

  const handleOpenConfirmReturn = useCallback(() => {
    if (selectedOrder)
      openConfirmDialog(selectedOrder.id, OrderStatus.RETURNED);
  }, [selectedOrder, openConfirmDialog]);

  const handleOpenConfirmCancel = useCallback(() => {
    if (selectedOrder)
      openConfirmDialog(selectedOrder.id, OrderStatus.CANCELLED);
  }, [selectedOrder, openConfirmDialog]);

  if (sortedOrders.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
            <Package size={20} className="text-slate-400" />
          </div>
          <h3 className="mb-1 text-sm font-semibold text-slate-900">
            No Orders Yet
          </h3>
          <p className="text-sm text-slate-500">
            Orders will appear here once customers start placing them
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">


        {/* ─── BODY ─── */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* ─── LEFT PANEL (order list) ─── */}
          <div
            className={cn(
              "flex w-full flex-shrink-0 flex-col border-r border-slate-200 bg-white lg:w-[320px] xl:w-[360px]",
              showMobileDetail ? "hidden lg:flex" : "flex",
            )}
          >
            {/* Search + Filter */}
            <div className="space-y-3 border-b border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                  <CalendarRange size={14} />
                  Filters
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFilterStatus("All");
                    setFilterCustomer("");
                    setFilterOrderQuery("");
                    setFilterDate("ALL");
                  }}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  <FilterX size={12} />
                  Reset
                </button>
              </div>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  placeholder="Search ID, name, email…"
                  value={filterOrderQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFilterOrderQuery(e.target.value)
                  }
                  className="h-9 rounded-md border-slate-200 pl-8 text-sm placeholder:text-slate-400 focus-visible:ring-slate-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-9 flex-1 rounded-md border-slate-200 text-sm">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Orders</SelectItem>
                    {Object.values(OrderStatus).map((s) => (
                      <SelectItem key={s} value={s}>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              STATUS_CONFIG[s].dotClass,
                            )}
                          />
                          {STATUS_CONFIG[s].label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filterDate}
                  onValueChange={(value) =>
                    setFilterDate(value as DateFilterValue)
                  }
                >
                  <SelectTrigger className="h-9 flex-1 rounded-md border-slate-200 text-sm">
                    <SelectValue placeholder="Any date" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_FILTER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Order List */}
            <ScrollArea className="flex-1">
              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center">
                  <AlertCircle
                    size={20}
                    className="mx-auto mb-2 text-slate-400"
                  />
                  <p className="text-sm text-slate-500">
                    No orders match your filters
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredOrders.map((order) => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      isSelected={selectedId === order.id}
                      onClick={handleRowClick}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* ─── RIGHT PANEL (order detail) ─── */}
          {selectedOrder && (
            <div
              className={cn(
                "min-w-0 flex-1 overflow-y-auto bg-slate-50/50",
                !showMobileDetail && "hidden lg:block",
              )}
            >
              <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
                {/* Mobile back button */}
                <button
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 lg:hidden"
                  onClick={handleBackClick}
                >
                  <ArrowLeft size={14} /> Back to orders
                </button>

                {/* ── ORDER HEADER CARD ── */}
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  {/* Top row: ID + status + amount */}
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-3">
                        <h2 className="truncate font-mono text-xl font-semibold text-slate-900">
                          {selectedOrder.id}
                        </h2>
                        <StatusPill status={selectedOrder.status} />
                      </div>
                      <p className="font-mono text-xs text-slate-500">
                        {selectedDateLong} · {selectedTime}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                        Total
                      </p>
                      <p className="font-mono text-xl font-bold text-slate-900">
                        ₹{selectedFinancials?.total.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {/* Primary Action: Next Status */}
                    {NEXT_STATUS_BUTTON[selectedOrder.status] && (
                      <button
                        className="flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                        onClick={handleOpenConfirmNext}
                      >
                        {NEXT_STATUS_BUTTON[selectedOrder.status]!.icon}
                        <span>
                          {NEXT_STATUS_BUTTON[selectedOrder.status]!.label}
                        </span>
                      </button>
                    )}

                    {/* Utility Group */}
                    <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                      {/* Invoice Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex flex-1 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:flex-none">
                            <FileText size={16} />
                            <span>Invoice</span>
                            <ChevronDown size={14} className="text-slate-400" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48 rounded-md border-slate-200"
                        >
                          <DropdownMenuItem
                            onClick={handlePrintInvoice}
                            className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700"
                          >
                            <Printer size={14} className="text-slate-400" />
                            Print Invoice
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Return Button (Conditional) */}
                      {STATUS_FLOW[selectedOrder.status].includes(
                        OrderStatus.RETURNED,
                      ) &&
                        !STATUS_FLOW[selectedOrder.status].includes(
                          OrderStatus.DELIVERED,
                        ) && (
                          <button
                            className="flex flex-1 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:flex-none"
                            onClick={handleOpenConfirmReturn}
                          >
                            <RotateCcw size={14} /> Return
                          </button>
                        )}

                      {/* Danger Zone */}
                      <div className="flex w-full gap-3 sm:w-auto">
                        {STATUS_FLOW[selectedOrder.status].includes(
                          OrderStatus.CANCELLED,
                        ) && (
                            <button
                              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100 sm:flex-none"
                              onClick={handleOpenConfirmCancel}
                            >
                              <XCircle size={14} /> Cancel
                            </button>
                          )}
                        <button
                          className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 transition-colors hover:border-rose-200 hover:text-rose-600"
                          onClick={handleOpenDeleteDialog}
                          aria-label="Delete Order"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Customer Meta */}
                  <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2 xl:grid-cols-5">
                    {[
                      {
                        icon: <User size={14} />,
                        label: "Customer",
                        value: selectedOrder.customerName,
                      },
                      {
                        icon: <Mail size={14} />,
                        label: "Email",
                        value: selectedOrder.email,
                      },
                      {
                        icon: <Phone size={14} />,
                        label: "Phone",
                        value: selectedOrder.phone ?? "Not provided",
                      },
                      {
                        icon: <CreditCard size={14} />,
                        label: "Payment",
                        value: (
                          <span className="flex flex-wrap items-center gap-2">
                            <span>
                              {selectedOrder.paymentMethod ?? "Pending"}
                            </span>
                            <span
                              className={cn(
                                "rounded-md px-1.5 py-0.5 text-xs font-medium",
                                getPaymentTone(selectedOrder.paymentStatus),
                              )}
                            >
                              {selectedOrder.paymentStatus ?? "UNPAID"}
                            </span>
                          </span>
                        ),
                      },
                      {
                        icon: <Package size={14} />,
                        label: "Subtotal",
                        value: formatCurrency(
                          selectedFinancials?.subtotal ??
                          selectedOrder.subtotal ??
                          0,
                        ),
                      },
                    ].map(({ icon, label, value }) => (
                      <div key={label}>
                        <div className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-500">
                          {icon}
                          <span>{label}</span>
                        </div>
                        <div className="truncate text-sm font-semibold text-slate-900">
                          {value as React.ReactNode}
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedOrder.paymentTransactionId && (
                    <div className="mt-4 flex items-center gap-3 rounded-md bg-slate-50 px-4 py-2">
                      <span className="flex-shrink-0 text-xs font-medium uppercase tracking-wider text-slate-500">
                        Transaction ID
                      </span>
                      <span className="truncate font-mono text-sm text-slate-900">
                        {selectedOrder.paymentTransactionId}
                      </span>
                    </div>
                  )}
                </div>

                {/* ── ORDER ITEMS ── */}
                <CollapsibleSection
                  icon={<Package size={16} />}
                  title="Order Items"
                  badge={
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs font-medium text-slate-600">
                      {selectedOrderItems.length}
                    </span>
                  }
                >
                  {selectedOrderItems.length > 0 ? (
                    <>
                      {/* Desktop table */}
                      <div className="hidden overflow-x-auto sm:block">
                        <table className="w-full text-left text-sm text-slate-600">
                          <thead className="bg-slate-50/50 text-xs text-slate-500">
                            <tr className="border-b border-slate-200">
                              <th className="px-5 py-3 font-medium">Product</th>
                              <th className="px-5 py-3 font-medium">
                                Traceability
                              </th>
                              <th className="px-5 py-3 text-center font-medium">
                                Qty
                              </th>
                              <th className="px-5 py-3 text-right font-medium">
                                Unit
                              </th>
                              <th className="px-5 py-3 text-right font-medium">
                                Total
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedOrderItems.map((item: OrderItem) => {
                              const inv =
                                aggregatedInventory.get(item.variantId) ||
                                (item.sku
                                  ? aggregatedInventory.get(item.sku)
                                  : undefined);
                              const isLow =
                                inv && inv.quantity <= inv.reorderLevel;
                              return (
                                <tr
                                  key={item.id}
                                  className="transition-colors hover:bg-slate-50/50"
                                >
                                  <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white">
                                        <img
                                          src={item.image ?? FALLBACK_IMG}
                                          alt={item.name}
                                          className="h-full w-full object-contain"
                                          onError={handleImgError}
                                        />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="line-clamp-1 text-sm font-semibold text-slate-900">
                                          {item.name}
                                        </p>
                                        <p className="mt-0.5 font-mono text-xs text-slate-500">
                                          {item.sku}
                                        </p>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                          {item.category} · Ref{" "}
                                          {item.lineReference}
                                        </p>
                                        {isLow && (
                                          <span className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600">
                                            <AlertTriangle size={12} /> Low:{" "}
                                            {inv.quantity} left
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-5 py-4">
                                    <div className="space-y-1.5">
                                      {[
                                        ["Product", item.productNumber],
                                        ["Part", item.partNumber],
                                        ["Serial", item.serialNumber],
                                      ].map(([label, value]) => (
                                        <div
                                          key={label}
                                          className="flex items-center gap-2 text-xs"
                                        >
                                          <span className="w-14 font-medium text-slate-500">
                                            {label}
                                          </span>
                                          <span className="truncate font-mono text-slate-900">
                                            {value || "-"}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="px-5 py-4 text-center">
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700">
                                      {item.quantity}
                                    </span>
                                  </td>
                                  <td className="px-5 py-4 text-right font-mono text-sm tabular-nums text-slate-600">
                                    ₹{item.price.toLocaleString("en-IN")}
                                  </td>
                                  <td className="px-5 py-4 text-right font-mono text-sm font-medium tabular-nums text-slate-900">
                                    ₹
                                    {(
                                      item.price * item.quantity
                                    ).toLocaleString("en-IN")}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile cards */}
                      <div className="divide-y divide-slate-100 sm:hidden">
                        {selectedOrderItems.map((item: OrderItem) => (
                          <div key={item.id} className="flex gap-3 p-4">
                            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white">
                              <img
                                src={item.image ?? FALLBACK_IMG}
                                alt={item.name}
                                className="h-full w-full object-contain"
                                onError={handleImgError}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold leading-tight tracking-tight text-slate-900">
                                {item.name}
                              </p>
                              <p className="mt-0.5 font-mono text-xs text-slate-500">
                                {item.sku}
                              </p>
                              <div className="mt-3 space-y-1.5 rounded-md border border-slate-100 bg-slate-50 p-3">
                                {[
                                  ["Product", item.productNumber],
                                  ["Part", item.partNumber],
                                  ["Serial", item.serialNumber],
                                ].map(([label, value]) => (
                                  <div
                                    key={label}
                                    className="flex items-center justify-between gap-2 text-xs"
                                  >
                                    <span className="font-medium text-slate-500">
                                      {label}
                                    </span>
                                    <span className="truncate font-mono text-slate-900">
                                      {value || "-"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-3 flex items-center justify-between">
                                <span className="text-sm text-slate-500">
                                  {item.quantity} × ₹
                                  {item.price.toLocaleString("en-IN")}
                                </span>
                                <span className="font-mono text-sm font-medium text-slate-900">
                                  ₹
                                  {(item.price * item.quantity).toLocaleString(
                                    "en-IN",
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Financials Footer */}
                      {selectedFinancials && (
                        <div className="border-t border-slate-200 bg-slate-50/50 p-5">
                          <div className="ml-auto w-full max-w-xs space-y-2">
                            {[
                              {
                                label: "Subtotal",
                                value: `₹${selectedFinancials.subtotal.toLocaleString("en-IN")}`,
                                cls: "text-slate-700",
                              },
                              {
                                label: "Shipping",
                                value: "Free",
                                cls: "text-emerald-600 font-medium",
                              },
                              {
                                label: "GST (18%)",
                                value: `₹${selectedFinancials.tax.toLocaleString("en-IN")}`,
                                cls: "text-slate-700",
                              },
                            ].map((row) => (
                              <div
                                key={row.label}
                                className="flex justify-between text-sm font-mono tabular-nums"
                              >
                                <span className="text-slate-500">
                                  {row.label}
                                </span>
                                <span className={row.cls}>{row.value}</span>
                              </div>
                            ))}
                            <div className="mt-3 border-t border-slate-200 pt-3 flex items-center justify-between">
                              <span className="text-sm font-semibold text-slate-900">
                                Total
                              </span>
                              <span className="font-mono text-lg font-bold text-slate-900 tabular-nums">
                                ₹
                                {selectedFinancials.total.toLocaleString(
                                  "en-IN",
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-8 text-center">
                      <Package
                        size={20}
                        className="mx-auto mb-2 text-slate-400"
                      />
                      <p className="text-sm text-slate-500">
                        No items in this order
                      </p>
                    </div>
                  )}
                </CollapsibleSection>

                {/* ── BOTTOM GRID: Shipping, Inventory, Timeline ── */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {/* Shipping Address */}
                  <CollapsibleSection icon={<MapPin size={16} />} title="Shipping">
                    <div className="p-5">
                      {selectedOrder.shippingStreet ? (
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                          <p className="mb-2 text-sm font-semibold text-slate-900">
                            {selectedOrder.customerName}
                          </p>
                          <div className="space-y-1 text-sm text-slate-600">
                            <p>{selectedOrder.shippingStreet}</p>
                            <p>
                              {selectedOrder.shippingCity},{" "}
                              {selectedOrder.shippingState}
                            </p>
                            <p className="pt-2 font-mono text-xs text-slate-500">
                              {selectedOrder.shippingZip} •{" "}
                              {selectedOrder.shippingCountry}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-md border border-dashed border-slate-200 p-6 text-center">
                          <p className="text-sm font-medium text-slate-500">
                            No address provided
                          </p>
                        </div>
                      )}
                    </div>
                  </CollapsibleSection>

                  {/* Inventory Snapshot */}
                  <CollapsibleSection
                    icon={<Warehouse size={16} />}
                    title="Inventory Snapshot"
                  >
                    <div className="flex flex-col gap-3 p-5">
                      {selectedOrderItems.map((item: OrderItem) => {
                        const inv =
                          aggregatedInventory.get(item.variantId) ||
                          (item.sku
                            ? aggregatedInventory.get(item.sku)
                            : undefined);
                        const available = inv?.quantity ?? 0;
                        const reserved = inv?.reserved ?? 0;
                        const isLow = available <= (inv?.reorderLevel ?? 5);
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-4 rounded-md border border-slate-200 p-3 hover:bg-slate-50"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-900">
                                {item.name}
                              </p>
                              <p className="mt-0.5 font-mono text-xs text-slate-500">
                                {item.sku}
                              </p>
                            </div>
                            <div className="flex flex-shrink-0 items-center gap-2">
                              <Tooltip>
                                <TooltipTrigger>
                                  <span
                                    className={cn(
                                      "rounded-md border px-2.5 py-1 font-mono text-xs font-medium tabular-nums",
                                      isLow
                                        ? "border-amber-200 bg-amber-50 text-amber-700"
                                        : "border-emerald-200 bg-emerald-50 text-emerald-700",
                                    )}
                                  >
                                    {available}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="left"
                                  className="rounded-md border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-md"
                                >
                                  {available} available{" "}
                                  <span className="mx-1 text-slate-300">•</span>{" "}
                                  {reserved} reserved
                                </TooltipContent>
                              </Tooltip>
                              {isLow && (
                                <div className="rounded-md bg-amber-100 p-1.5 text-amber-600">
                                  <AlertTriangle size={14} />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleSection>

                  {/* Order Timeline */}
                  <CollapsibleSection
                    icon={<Clock size={16} />}
                    title="Timeline"
                    defaultOpen={false}
                  >
                    <div className="p-6">
                      {!(
                        selectedOrder.logs && selectedOrder.logs.length > 0
                      ) ? (
                        <div className="rounded-md border border-dashed border-slate-200 p-6 text-center">
                          <p className="text-sm font-medium text-slate-500">
                            No timeline data available
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6 border-l-2 border-slate-100 pl-6">
                          {(selectedOrder.logs || []).map(
                            (log: OrderLog, idx: number) => {
                              const isLatest =
                                idx ===
                                (selectedOrder.logs || []).length - 1;
                              const cfg = STATUS_CONFIG[log.status];
                              return (
                                <div key={idx} className="relative">
                                  <div
                                    className={cn(
                                      "absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white",
                                      isLatest
                                        ? `${cfg.dotClass} ring-2 ring-slate-200`
                                        : "bg-slate-300",
                                    )}
                                  />
                                  <div>
                                    <div className="mb-1 flex items-center gap-2">
                                      <span
                                        className={cn(
                                          "text-sm font-semibold",
                                          isLatest
                                            ? "text-slate-900"
                                            : "text-slate-500",
                                        )}
                                      >
                                        {cfg.label}
                                      </span>
                                      {isLatest && (
                                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-600">
                                          Current
                                        </span>
                                      )}
                                    </div>
                                    <p className="font-mono text-xs font-medium tabular-nums text-slate-500">
                                      {new Date(log.timestamp).toLocaleString(
                                        "en-IN",
                                        TIMELINE_DATE_OPTS,
                                      )}
                                    </p>
                                    {log.note && (
                                      <p className="mt-2 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                                        {log.note}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            },
                          )}
                        </div>
                      )}
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection
                    icon={<CreditCard size={16} />}
                    title="Payments"
                    badge={
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-medium text-slate-600">
                        {(selectedOrder.payments || []).length}
                      </span>
                    }
                    defaultOpen={(selectedOrder.payments || []).length > 0}
                  >
                    <OrderPayments
                      payments={selectedOrder.payments || []}
                      canReviewManualPayments
                      onReviewPayment={handleReviewPayment}
                    />
                  </CollapsibleSection>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmStatusDialog
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
        confirmStatusUpdate={confirmStatusUpdate}
        selectedOrder={selectedOrder}
        inventoryArray={inventoryArray}
        isUpdating={isUpdating}
      />

      {selectedOrder && (
        <DeleteOrderDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteOrder}
          orderId={selectedOrder.id}
          orderStatus={selectedOrder.status}
          isDeleting={isDeleting}
        />
      )}
    </TooltipProvider>
  );
};

export default OrderManager;