"use client";

import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  FormEvent,
  memo,
} from "react";
import { useAdmin } from "@/context/AdminContext";
import { StockMovementType } from "@/types";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Package,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  History,
  Warehouse,
  BarChart3,
  ShieldAlert,
  Zap,
  Clock,
  Tag,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { InventorySkuSummary } from "@/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/useDebounce";

/* ─────────────────────────────────────────────────────────────
   MODULE-LEVEL CONSTANTS
───────────────────────────────────────────────────────────────*/

const MOV_TYPE_MAP: Record<
  string,
  { label: string; cls: string; icon: React.ReactNode }
> = {
  INWARD: {
    label: "Inward",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: <ArrowDownRight size={12} />,
  },
  OUTWARD: {
    label: "Outward",
    cls: "bg-rose-50 text-rose-700 border-rose-200",
    icon: <ArrowUpRight size={12} />,
  },
  ADJUSTMENT: {
    label: "Adjustment",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
    icon: <RefreshCw size={12} />,
  },
};

type StockMovementRecord = {
  id: string;
  date: string;
  sku: string;
  type: StockMovementType | string;
  quantity: number;
  reason?: string | null;
};

type AuditLogRecord = {
  id: string;
  action?: string | null;
  actor?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  createdAt: string;
  metadata?: unknown;
};

const MOV_TYPE_FALLBACK = {
  label: "",
  cls: "bg-slate-100 text-slate-700 border-slate-200",
  icon: null,
};

const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  (e.target as HTMLImageElement).src = "https://picsum.photos/300/300";
};

const DATE_OPTS_MOV: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
};
const DATE_OPTS_MOV_MOBILE: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
};
const DATE_OPTS_AUDIT: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

/* ─────────────────────────────────────────────────────────────
   SHARED PRIMITIVES
───────────────────────────────────────────────────────────────*/

const SectionLabel = memo(
  ({
    icon,
    children,
  }: {
    icon: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div className="flex items-center gap-2">
      <span className="text-slate-400">{icon}</span>
      <span className="text-sm font-medium text-slate-900">
        {children}
      </span>
    </div>
  ),
);
SectionLabel.displayName = "SectionLabel";

const StockBadge = memo(
  ({ qty, reorderLevel }: { qty: number; reorderLevel: number }) => {
    if (qty === 0)
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 whitespace-nowrap">
          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-75" /> Out of stock
        </span>
      );
    if (qty <= reorderLevel)
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 whitespace-nowrap">
          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-75" /> Low stock
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-75" /> Healthy
      </span>
    );
  },
);
StockBadge.displayName = "StockBadge";

const MovTypeBadge = memo(({ type }: { type: string }) => {
  const cfg = MOV_TYPE_MAP[type] ?? { ...MOV_TYPE_FALLBACK, label: type };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        cfg.cls,
      )}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
});
MovTypeBadge.displayName = "MovTypeBadge";

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
    const toggle = useCallback(() => setOpen((o) => !o), []);

    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
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
              "flex-shrink-0 text-slate-400 transition-transform duration-200",
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

/* ─────────────────────────────────────────────────────────────
   MAIN
───────────────────────────────────────────────────────────────*/
const InventoryManager = () => {
  const {
    inventory,
    stockMovements,
    adjustStock,
    refreshInventory,
    refreshAuditLogs,
    fetchInventoryPage,
    syncData,
    isLoading,
  } = useAdmin() as unknown as {
    inventory: InventorySkuSummary[];
    stockMovements: StockMovementRecord[];
    adjustStock: (
      sku: string,
      quantity: number,
      type: StockMovementType,
      reason?: string,
    ) => Promise<void>;
    refreshInventory: () => Promise<void>;
    refreshAuditLogs: () => Promise<AuditLogRecord[]>;
    fetchInventoryPage: (
      query?: URLSearchParams | string,
    ) => Promise<{
      items: InventorySkuSummary[];
      total: number;
      page: number;
      limit: number;
    }>;
    syncData: () => Promise<void>;
    isLoading: boolean;
  };

  const [adjustmentModal, setAdjustmentModal] = useState<{
    isOpen: boolean;
    sku: string;
    currentQty: number;
  } | null>(null);

  const [adjType, setAdjType] = useState<StockMovementType>(
    StockMovementType.INWARD,
  );
  const [adjQty, setAdjQty] = useState(0);
  const [adjReason, setAdjReason] = useState("");

  const [auditLogModal, setAuditLogModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const openAuditLog = useCallback(async () => {
    setAuditLogModal(true);
    setIsLoadingAudit(true);
    try {
      setAuditLogs(await refreshAuditLogs());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingAudit(false);
    }
  }, [refreshAuditLogs]);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [paginatedInventory, setPaginatedInventory] = useState<
    InventorySkuSummary[]
  >([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const currentLimit = parseInt(searchParams.get("limit") || "10", 10);
  const currentCategory = searchParams.get("category") || "all";
  const currentSearch = searchParams.get("q") || "";
  const currentStockStatus = searchParams.get("f_stock_status") || "all";

  const [searchTerm, setSearchTerm] = useState(currentSearch);
  useEffect(() => {
    setSearchTerm(currentSearch);
  }, [currentSearch]);

  const debouncedSearch = useDebounce(searchTerm, 500);

  const updateQueryParams = useCallback(
    (newParams: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      if (
        !newParams.page &&
        (newParams.category !== undefined ||
          newParams.q !== undefined ||
          newParams.f_stock_status !== undefined)
      ) {
        params.set("page", "1");
      }
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === null || value === "all" || value === "")
          params.delete(key);
        else params.set(key, value);
      });
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname],
  );

  useEffect(() => {
    if (debouncedSearch !== currentSearch)
      updateQueryParams({ q: debouncedSearch });
  }, [debouncedSearch]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const fetchPaginatedInventory = async () => {
      setIsLoadingInventory(true);
      try {
        const query = new URLSearchParams(searchParams.toString());
        if (!query.has("limit")) query.set("limit", "10");
        if (!query.has("page")) query.set("page", "1");
        const data = await fetchInventoryPage(query);
        if (signal.aborted) return;
        setPaginatedInventory(data.items);
        setTotalItems(data.total || 0);
      } catch (err) {
        if (
          err instanceof Error &&
          (err as { name?: string }).name !== "AbortError"
        ) {
          console.error("Failed to fetch paginated inventory:", err);
          setPaginatedInventory([]);
          setTotalItems(0);
        }
      } finally {
        if (!signal.aborted) setIsLoadingInventory(false);
      }
    };

    fetchPaginatedInventory();

    const interval = setInterval(fetchPaginatedInventory, 30000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [searchParams, refreshTrigger, fetchInventoryPage]);

  const handleAdjustment = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (adjustmentModal && adjQty > 0) {
        adjustStock(adjustmentModal.sku, adjQty, adjType, adjReason);
        setAdjustmentModal(null);
        setAdjQty(0);
        setAdjReason("");
        setAdjType(StockMovementType.INWARD);
        setRefreshTrigger((prev) => !prev);
      }
    },
    [adjustmentModal, adjQty, adjType, adjReason, adjustStock],
  );

  const handleCloseAdjustment = useCallback(() => setAdjustmentModal(null), []);
  const handleToggleFilters = useCallback(() => setShowFilters((f) => !f), []);

  const handleRefreshSync = useCallback(async () => {
    await refreshInventory();
    setRefreshTrigger((prev) => !prev);
  }, [refreshInventory]);

  const handlePrevPage = useCallback(() => {
    updateQueryParams({ page: String(currentPage - 1) });
  }, [updateQueryParams, currentPage]);

  const handleNextPage = useCallback(() => {
    updateQueryParams({ page: String(currentPage + 1) });
  }, [updateQueryParams, currentPage]);

  const handleCategoryChange = useCallback(
    (val: string) => {
      updateQueryParams({ category: val });
    },
    [updateQueryParams],
  );

  const handleStockStatusChange = useCallback(
    (val: string) => {
      updateQueryParams({ f_stock_status: val });
    },
    [updateQueryParams],
  );

  const kpis = useMemo(() => {
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalStockValue = 0;
    let totalAvailable = 0;
    let totalReserved = 0;
    let healthyCount = 0;

    const arr = Array.isArray(inventory) ? inventory : [];
    for (const i of arr) {
      const qty = i.quantity;
      const reserved = i.reserved || 0;
      totalStockValue += qty * i.costPrice;
      totalAvailable += qty;
      totalReserved += reserved;
      if (qty === 0) outOfStockCount++;
      else if (qty <= i.reorderLevel) lowStockCount++;
      else healthyCount++;
    }

    const totalOnHand = totalAvailable + totalReserved;
    const healthPct =
      arr.length > 0 ? Math.round((healthyCount / arr.length) * 100) : 0;

    return {
      lowStockCount,
      outOfStockCount,
      totalStockValue,
      totalAvailable,
      totalReserved,
      totalOnHand,
      healthyCount,
      healthPct,
    };
  }, [inventory]);

  const {
    lowStockCount,
    outOfStockCount,
    totalStockValue,
    totalAvailable,
    totalReserved,
    totalOnHand,
    healthyCount,
    healthPct,
  } = kpis;

  const criticalItems = useMemo(() => {
    const arr = Array.isArray(inventory) ? inventory : [];
    return [...arr]
      .filter((i) => i.quantity <= i.reorderLevel)
      .sort(
        (a, b) =>
          a.quantity / Math.max(a.reorderLevel, 1) -
          b.quantity / Math.max(b.reorderLevel, 1),
      )
      .slice(0, 5);
  }, [inventory]);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { units: number; value: number; count: number }> =
      {};
    const arr = Array.isArray(inventory) ? inventory : [];
    for (const i of arr) {
      const cat = i.variant?.product?.category || "Uncategorised";
      if (!map[cat]) map[cat] = { units: 0, value: 0, count: 0 };
      map[cat].units += i.quantity;
      map[cat].value += i.quantity * i.costPrice;
      map[cat].count += 1;
    }
    return Object.entries(map)
      .sort((a, b) => b[1].value - a[1].value)
      .slice(0, 5);
  }, [inventory]);
  const inventoryCategories = useMemo(
    () => categoryBreakdown.map(([cat]) => cat),
    [categoryBreakdown],
  );

  const kpiCards = useMemo(
    () => [
      {
        label: "Stock Valuation",
        value:
          totalStockValue > 999999
            ? `₹${(totalStockValue / 100000).toFixed(1)}L`
            : `₹${totalStockValue.toLocaleString("en-IN")}`,
        sub: `${Array.isArray(inventory) ? inventory.length : 0} SKUs tracking`,
        icon: <DollarSign size={16} />,
        alert: false,
      },
      {
        label: "Low Stock",
        value: lowStockCount,
        sub: "Needs reorder soon",
        icon: <AlertTriangle size={16} />,
        alert: lowStockCount > 0,
      },
      {
        label: "Out of Stock",
        value: outOfStockCount,
        sub: "Zero availability",
        icon: <ShieldAlert size={16} />,
        alert: outOfStockCount > 0,
      },
      {
        label: "Inventory Health",
        value: `${healthPct}%`,
        sub: `${healthyCount} items optimal`,
        icon: <BarChart3 size={16} />,
        alert: false,
      },
    ],
    [
      totalStockValue,
      inventory,
      lowStockCount,
      outOfStockCount,
      healthPct,
      healthyCount,
    ],
  );

  const utilisationRows = useMemo(
    () => [
      {
        label: "Total On Hand",
        value: totalOnHand.toLocaleString("en-IN"),
        sub: "Physical stock count",
        icon: <Package size={16} />,
        color: "text-slate-900",
      },
      {
        label: "Reserved Stock",
        value: totalReserved.toLocaleString("en-IN"),
        sub: "Allocated to active orders",
        icon: <Clock size={16} />,
        color: "text-amber-600",
      },
      {
        label: "Available to Sell",
        value: totalAvailable.toLocaleString("en-IN"),
        sub: "Free for new orders",
        icon: <Zap size={16} />,
        color: "text-emerald-600",
      },
      {
        label: "Avg Cost / Unit",
        value:
          Array.isArray(inventory) && inventory.length > 0
            ? `₹${Math.round(totalStockValue / Math.max(totalOnHand, 1)).toLocaleString("en-IN")}`
            : "—",
        sub: "Weighted average value",
        icon: <DollarSign size={16} />,
        color: "text-blue-600",
      },
    ],
    [totalOnHand, totalReserved, totalAvailable, totalStockValue, inventory],
  );

  const totalPages = Math.max(1, Math.ceil(totalItems / currentLimit));

  return (
    <div className="space-y-6">
      {/* ─── KPI CARDS ─── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpiCards.map((card, idx) => (
          <div
            key={idx}
            className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {card.label}
                </p>
                <p className="mt-1.5 text-2xl font-semibold text-slate-900">
                  {card.value}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {card.sub}
                </p>
              </div>
              <div
                className={cn(
                  "rounded-md p-2",
                  card.alert
                    ? "bg-rose-50 text-rose-600"
                    : "bg-slate-50 text-slate-500",
                )}
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── SECONDARY STATS ROW ─── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Critical Alerts */}
        <CollapsibleSection
          icon={<AlertTriangle size={16} />}
          title="Critical Alerts"
        >
          <div className="divide-y divide-slate-100 p-2">
            {criticalItems.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                All inventory levels healthy.
              </div>
            ) : (
              criticalItems.map((item, idx) => {
                const pct = Math.round(
                  (item.quantity / Math.max(item.reorderLevel, 1)) * 100,
                );
                const name = item.variant?.product?.name || item.variantId;
                return (
                  <div key={idx} className="p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-medium text-slate-900">
                        {name}
                      </span>
                      {item.quantity === 0 ? (
                        <span className="flex-shrink-0 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                          Empty
                        </span>
                      ) : (
                        <span className="flex-shrink-0 font-mono text-xs font-medium text-amber-700">
                          {item.quantity} / {item.reorderLevel}
                        </span>
                      )}
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          item.quantity === 0 ? "bg-rose-500" : "bg-amber-500",
                        )}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CollapsibleSection>

        {/* Category Breakdown */}
        <CollapsibleSection
          icon={<Tag size={16} />}
          title="Value by Category"
        >
          <div className="divide-y divide-slate-100 p-2">
            {categoryBreakdown.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                No data available
              </div>
            ) : (
              categoryBreakdown.map(([cat, data], idx) => {
                const pct =
                  totalStockValue > 0
                    ? Math.round((data.value / totalStockValue) * 100)
                    : 0;
                return (
                  <div key={idx} className="p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-medium text-slate-900">
                        {cat}
                      </span>
                      <span className="flex-shrink-0 font-mono text-xs font-medium text-slate-700">
                        ₹{data.value.toLocaleString("en-IN")} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">
                      {data.units} physical units · {data.count} SKUs
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </CollapsibleSection>

        {/* Stock Utilisation */}
        <CollapsibleSection
          icon={<Warehouse size={16} />}
          title="Stock Utilisation"
        >
          <div className="space-y-4 p-5">
            {utilisationRows.map(({ label, value, sub, icon, color }) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={cn("flex-shrink-0", color)}>{icon}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {label}
                    </p>
                    <p className="hidden truncate text-xs text-slate-500 sm:block">
                      {sub}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "flex-shrink-0 font-mono text-base font-semibold",
                    color,
                  )}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      </div>

      {/* ─── STOCK TABLE ─── */}
      <div className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {/* Filters header */}
        <div className="border-b border-slate-200 bg-white p-4 space-y-4">
          <div className="flex items-center justify-between">
            <SectionLabel icon={<Package size={16} />}>
              Stock Levels <span className="ml-2 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{totalItems}</span>
            </SectionLabel>
            <div className="flex items-center gap-3">
              <button
                onClick={syncData}
                disabled={isLoading}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={cn(isLoading && "animate-spin")}
                />
              </button>
              <button
                onClick={handleToggleFilters}
                className={cn(
                  "hidden h-9 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors sm:flex",
                  showFilters
                    ? "border-slate-300 bg-slate-100 text-slate-900"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                <SlidersHorizontal size={14} />
                Filters
              </button>
              <button
                onClick={handleToggleFilters}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 sm:hidden"
              >
                <SlidersHorizontal size={16} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                placeholder="Search SKU, name…"
                className="h-10 rounded-md border-slate-200 pl-9 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {showFilters && (
              <div className="flex flex-wrap items-center gap-3">
                <Select
                  value={currentCategory}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger className="h-10 w-full sm:w-[160px] rounded-md border-slate-200 text-sm">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {inventoryCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={currentStockStatus}
                  onValueChange={handleStockStatusChange}
                >
                  <SelectTrigger className="h-10 w-full sm:w-[160px] rounded-md border-slate-200 text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Status</SelectItem>
                    <SelectItem value="in">In Stock</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="out">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/50 text-xs text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">SKU</th>
                <th className="px-5 py-3 text-right font-medium">Available</th>
                <th className="hidden px-5 py-3 text-right font-medium md:table-cell">Reserved</th>
                <th className="hidden px-5 py-3 text-right font-medium lg:table-cell">Cost Value</th>
                <th className="px-5 py-3 text-right font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoadingInventory ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    Loading inventory…
                  </td>
                </tr>
              ) : paginatedInventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <Package
                      size={24}
                      className="mx-auto mb-3 text-slate-400"
                    />
                    <p className="text-sm text-slate-500">
                      {currentSearch ||
                        currentStockStatus !== "all" ||
                        currentCategory !== "all"
                        ? "No items match current filters"
                        : "Inventory is empty"}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedInventory.map((item: InventorySkuSummary) => {
                  const variant = item.variant;
                  const product = variant?.product;
                  const costValue = item.quantity * item.costPrice;
                  return (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-slate-50/50"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white">
                            <img
                              className="h-full w-full object-contain p-1"
                              src={
                                product?.media?.[0]?.url || "/placeholder.png"
                              }
                              alt={product?.name || variant?.sku}
                              onError={handleImgError}
                            />
                          </div>
                          <div className="min-w-0">
                            <p
                              className="truncate text-sm font-medium text-slate-900"
                              title={product?.name}
                            >
                              {product?.name || "Undefined Product"}
                            </p>
                            <span className="mt-0.5 inline-block rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                              {product?.category || "Standard"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-sm font-medium text-slate-600">
                        {variant?.sku || "N/A"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right">
                        <span
                          className={cn(
                            "font-mono text-base font-semibold tabular-nums",
                            item.quantity === 0
                              ? "text-rose-600"
                              : item.quantity <= item.reorderLevel
                                ? "text-amber-600"
                                : "text-slate-900",
                          )}
                        >
                          {item.quantity}
                        </span>
                        <p className="font-mono text-xs text-slate-400">
                          /{item.reorderLevel} min
                        </p>
                      </td>
                      <td className="hidden whitespace-nowrap px-5 py-3 text-right font-mono text-sm font-medium text-amber-600 md:table-cell">
                        {item.reserved || 0}
                      </td>
                      <td className="hidden whitespace-nowrap px-5 py-3 text-right font-mono text-sm font-medium text-slate-900 lg:table-cell">
                        ₹{costValue.toLocaleString("en-IN")}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right">
                        <StockBadge
                          qty={item.quantity}
                          reorderLevel={item.reorderLevel}
                        />
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right">
                        <button
                          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                          onClick={() =>
                            setAdjustmentModal({
                              isOpen: true,
                              sku: variant?.sku || item.variantId,
                              currentQty: item.quantity,
                            })
                          }
                        >
                          <RefreshCw size={14} className="text-slate-400" /> Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="divide-y divide-slate-100 sm:hidden">
          {isLoadingInventory ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Loading inventory…
            </div>
          ) : paginatedInventory.length === 0 ? (
            <div className="p-12 text-center">
              <Package size={24} className="mx-auto mb-3 text-slate-400" />
              <p className="text-sm text-slate-500">
                {currentSearch ||
                  currentStockStatus !== "all" ||
                  currentCategory !== "all"
                  ? "No items match filters"
                  : "Inventory is empty"}
              </p>
            </div>
          ) : (
            paginatedInventory.map((item: InventorySkuSummary) => {
              const variant = item.variant;
              const product = variant?.product;
              const isLow =
                item.quantity > 0 && item.quantity <= item.reorderLevel;
              const isOut = item.quantity === 0;
              return (
                <div key={item.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white">
                      <img
                        className="h-full w-full object-contain p-1"
                        src={product?.media?.[0]?.url || "/placeholder.png"}
                        alt={product?.name || variant?.sku}
                        onError={handleImgError}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {product?.name || "Undefined Product"}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-slate-500">
                          {variant?.sku || "N/A"}
                        </span>
                        <StockBadge
                          qty={item.quantity}
                          reorderLevel={item.reorderLevel}
                        />
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span
                        className={cn(
                          "font-mono text-lg font-bold leading-none tabular-nums",
                          isOut
                            ? "text-rose-600"
                            : isLow
                              ? "text-amber-600"
                              : "text-slate-900",
                        )}
                      >
                        {item.quantity}
                      </span>
                      <p className="font-mono text-xs text-slate-400">
                        /{item.reorderLevel} min
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() =>
                        setAdjustmentModal({
                          isOpen: true,
                          sku: variant?.sku || item.variantId,
                          currentQty: item.quantity,
                        })
                      }
                    >
                      <RefreshCw size={14} className="text-slate-400" /> Adjust Stock
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {!isLoadingInventory && totalItems > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3">
            <p className="text-sm text-slate-600">
              <span className="font-medium text-slate-900">
                {(currentPage - 1) * currentLimit + 1}
              </span>
              {" - "}
              <span className="font-medium text-slate-900">
                {Math.min(currentPage * currentLimit, totalItems)}
              </span>
              <span className="hidden sm:inline">
                {" "}of{" "}
                <span className="font-medium text-slate-900">
                  {totalItems}
                </span>
              </span>
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={handlePrevPage}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={handleNextPage}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── STOCK MOVEMENT HISTORY ─── */}
      <CollapsibleSection
        icon={<History size={16} />}
        title="Movement History"
        badge={
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs font-medium text-slate-600">
            {Math.min(stockMovements.length, 20)} recent
          </span>
        }
        defaultOpen={false}
      >
        {/* Desktop table */}
        <div className="hidden max-h-[400px] overflow-y-auto sm:block">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="sticky top-0 z-10 bg-slate-50/90 text-xs text-slate-500 backdrop-blur-sm">
              <tr className="border-b border-slate-200">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">SKU</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 text-right font-medium">Qty</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {stockMovements.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    No stock movements recorded
                  </td>
                </tr>
              ) : (
                stockMovements.slice(0, 20).map((mov) => (
                  <tr
                    key={mov.id}
                    className="transition-colors hover:bg-slate-50/50"
                  >
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-500">
                      {new Date(mov.date).toLocaleDateString(
                        "en-IN",
                        DATE_OPTS_MOV,
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-sm font-medium text-slate-900">
                      {mov.sku}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <MovTypeBadge type={mov.type} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-mono text-sm font-semibold text-slate-900 tabular-nums">
                      {mov.quantity}
                    </td>
                    <td className="hidden max-w-[200px] px-5 py-3 text-slate-500 md:table-cell">
                      <span className="line-clamp-1">{mov.reason || "—"}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile movement cards */}
        <div className="divide-y divide-slate-100 sm:hidden max-h-[400px] overflow-y-auto">
          {stockMovements.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No stock movements recorded
            </div>
          ) : (
            stockMovements.slice(0, 20).map((mov) => (
              <div key={mov.id} className="flex items-center gap-4 p-4">
                <MovTypeBadge type={mov.type} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm font-medium text-slate-900">
                    {mov.sku}
                  </p>
                  <p className="font-mono text-xs text-slate-500">
                    {new Date(mov.date).toLocaleDateString(
                      "en-IN",
                      DATE_OPTS_MOV_MOBILE,
                    )}
                    {mov.reason && <span> · {mov.reason}</span>}
                  </p>
                </div>
                <span className="flex-shrink-0 font-mono text-base font-semibold text-slate-900 tabular-nums">
                  {mov.quantity}
                </span>
              </div>
            ))
          )}
        </div>
      </CollapsibleSection>

      {/* ─── ADJUSTMENT DIALOG ─── */}
      <Dialog open={!!adjustmentModal} onOpenChange={handleCloseAdjustment}>
        <DialogContent className="flex max-h-[90vh] w-[95vw] sm:max-w-md flex-col overflow-hidden p-0 rounded-lg border-slate-200 bg-white shadow-lg">
          <DialogHeader className="shrink-0 border-b border-slate-100 px-6 py-4">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Stock Adjustment
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              SKU:{" "}
              <span className="font-mono font-medium text-slate-900">
                {adjustmentModal?.sku}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Current Stock
              </span>
              <span className="font-mono text-base font-semibold text-slate-900">
                {adjustmentModal?.currentQty} units
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  Adjustment Type
                </label>
                <Select
                  value={adjType}
                  onValueChange={(val) => setAdjType(val as StockMovementType)}
                >
                  <SelectTrigger className="h-10 rounded-md border-slate-200 bg-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 bg-white">
                    <SelectItem value="INWARD">Inward (Replenishment)</SelectItem>
                    <SelectItem value="ADJUSTMENT">Manual Correction</SelectItem>
                    <SelectItem value="OUTWARD">Outward (Loss / Damage)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  Quantity
                </label>
                <Input
                  type="number"
                  className="h-10 rounded-md border-slate-200 text-sm"
                  value={adjQty}
                  onChange={(e) => setAdjQty(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  Reason
                </label>
                <textarea
                  className="min-h-[100px] w-full resize-none rounded-md border border-slate-200 bg-white p-3 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-0"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="Brief explanation…"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t border-slate-100 bg-slate-50 px-6 py-4">
            <button
              onClick={handleCloseAdjustment}
              className="flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleAdjustment}
              className="flex h-9 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              Save Adjustment
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── AUDIT LOG DIALOG ─── */}
      <Dialog open={auditLogModal} onOpenChange={setAuditLogModal}>
        <DialogContent className="flex max-h-[90vh] w-[95vw] sm:max-w-2xl flex-col overflow-hidden p-0 rounded-lg border-slate-200 bg-white shadow-lg">
          <DialogHeader className="shrink-0 border-b border-slate-100 px-6 py-4">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Audit Log
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Recent system actions
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50/50 p-6">
            <div className="rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden h-full">
              {isLoadingAudit ? (
                <div className="p-12 text-center text-sm text-slate-500">
                  Loading logs…
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-500">
                  No audit logs found.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 h-full overflow-y-auto">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-4 transition-colors hover:bg-slate-50/50">
                      <div className="mb-1 flex items-start justify-between gap-4">
                        <span className="text-sm font-semibold text-slate-900">
                          {log.action || "Action"}
                        </span>
                        <span className="flex-shrink-0 font-mono text-xs text-slate-500">
                          {new Date(log.createdAt).toLocaleDateString(
                            "en-IN",
                            DATE_OPTS_AUDIT,
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">
                        by <span className="font-medium text-slate-900">{log.actor}</span> · {log.entityType}{" "}
                        <span className="font-mono text-xs text-slate-400">({log.entityId})</span>
                      </p>
                      {Boolean(log.metadata) && (
                        <pre className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-600 whitespace-pre-wrap break-words">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t border-slate-100 bg-slate-50 px-6 py-4">
            <button
              onClick={() => setAuditLogModal(false)}
              className="flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryManager;