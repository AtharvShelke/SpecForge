"use client";

import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  FormEvent,
  memo,
} from "react";
import { apiFetch } from "@/lib/helpers";
import { StockMovementType } from "@/types";
import {
  
  ArrowDownRight,
  ArrowUpRight,

  Package,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  History,
  
  ChevronDown,
  SlidersHorizontal,
  Plus,
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
  const [inventory, setInventory] = useState<InventorySkuSummary[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stockMovements, setStockMovements] = useState<StockMovementRecord[]>([]);
 const [adjQty, setAdjQty] = useState(0);
  const [adjReason, setAdjReason] = useState("");

  const [auditLogModal, setAuditLogModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [addStockOpen, setAddStockOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [serialNumber, setSerialNumber] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [costPrice, setCostPrice] = useState(0);
  const [location, setLocation] = useState("");
  const [isSubmittingStock, setIsSubmittingStock] = useState(false);
  const [addStockError, setAddStockError] = useState("");

  const loadDependencies = useCallback(async () => {
    setIsLoading(true);
    try {
      const [catsData, inventoryData, movementsData] = await Promise.all([
        apiFetch<any[]>("/api/catalog/categories"),
        apiFetch<any>("/api/inventory?limit=1000&page=1"),
        apiFetch<any[]>("/api/inventory/movements?limit=50&page=1"),
      ]);
      setCategories(catsData);
      setInventory(Array.isArray(inventoryData?.items) ? inventoryData.items : Array.isArray(inventoryData) ? inventoryData : []);
      setStockMovements(Array.isArray(movementsData) ? movementsData : []);
    } catch (err) {
      console.error("Failed to load InventoryManager dependencies", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDependencies();
  }, [loadDependencies]);

  const syncData = useCallback(async () => {
    await loadDependencies();
  }, [loadDependencies]);

  const refreshInventory = useCallback(async () => {
    await loadDependencies();
  }, [loadDependencies]);

  

  const fetchInventoryPage = useCallback(async (query?: URLSearchParams | string) => {
    const qs = query?.toString();
    const data = await apiFetch<any>(qs ? `/api/inventory?${qs}` : "/api/inventory");
    return {
      items: Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [],
      total: Number(data?.total ?? 0),
      page: Number(data?.page ?? 1),
      limit: Number(data?.limit ?? 10),
    };
  }, []);

  const adjustStock = useCallback(async (sku: string, quantity: number, type: StockMovementType, reason?: string) => {
    await apiFetch("/api/inventory/items", {
      method: "POST",
      body: JSON.stringify({ variantId: sku, quantity, type, action: "ADJUST", reason }),
    });
    void loadDependencies();
  }, [loadDependencies]);

  const [adjustmentModal, setAdjustmentModal] = useState<{
    isOpen: boolean;
    sku: string;
    currentQty: number;
  } | null>(null);

  const [adjType, setAdjType] = useState<StockMovementType>(
    StockMovementType.INWARD,
  );
 

  const openAddStock = useCallback(async () => {
    setAddStockOpen(true);
    setIsLoadingProducts(true);
    setAddStockError("");
    try {
      const data = await apiFetch<any>("/api/catalog/products?limit=1000");
      setProducts(Array.isArray(data?.products) ? data.products : Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch products for stock entry", e);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  const handleProductSelect = useCallback((product: any) => {
    setSelectedProduct(product);
    setProductSearch("");
  }, []);

  const handleSerialNumberChange = useCallback((val: string) => {
    setSerialNumber(val);
    if (val.trim()) {
      setQuantity(1);
    }
  }, []);

  const handleAddStockSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      setAddStockError("Please select a product");
      return;
    }
    
    setIsSubmittingStock(true);
    setAddStockError("");
    try {
      const payload = {
        productId: selectedProduct.id,
        serialNumber: serialNumber.trim() ? serialNumber.trim() : null,
        partNumber: partNumber.trim() ? partNumber.trim() : null,
        quantity: serialNumber.trim() ? 1 : quantity,
        costPrice: Number(costPrice),
        location: location.trim() ? location.trim() : null,
      };

      await apiFetch<any>("/api/inventory/items", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSelectedProduct(null);
      setSerialNumber("");
      setPartNumber("");
      setQuantity(1);
      setCostPrice(0);
      setLocation("");
      setAddStockOpen(false);
      setRefreshTrigger((prev) => !prev);
    } catch (err: any) {
      console.error("Failed to add stock:", err);
      setAddStockError(err.message || "Failed to add stock. Please try again.");
    } finally {
      setIsSubmittingStock(false);
    }
  }, [selectedProduct, serialNumber, partNumber, quantity, costPrice, location]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products;
    const lower = productSearch.toLowerCase();
    return products.filter((p) => 
      p.name?.toLowerCase().includes(lower) || 
      p.sku?.toLowerCase().includes(lower)
    );
  }, [products, productSearch]);

  

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

  const inventoryCategories = useMemo(
    () =>
      (categories ?? [])
        .map((category) =>
          typeof category === "string" ? category : category.name,
        )
        .filter(Boolean),
    [categories],
  );

 

  const totalPages = Math.max(1, Math.ceil(totalItems / currentLimit));

  return (
    <div className="space-y-6">
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
                onClick={openAddStock}
                className="flex h-9 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">Add Stock</span>
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
                  const product = item.product;
                  const physicalQty = item.quantityOnHand ?? (item.quantity + (item.reserved || 0));
                  const costValue = physicalQty * item.costPrice;
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
                              alt={product?.name || item.sku || product?.sku || ""}
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
                              {typeof product?.category === "string" ? product.category : product?.category?.name || "Standard"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-sm font-medium text-slate-600">
                        {item.sku || product?.sku || "N/A"}
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
                              sku: item.sku || product?.sku || item.productId,
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
              const product = item.product;
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
                        alt={product?.name || item.sku || product?.sku || ""}
                        onError={handleImgError}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {product?.name || "Undefined Product"}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-slate-500">
                          {item.sku || product?.sku || "N/A"}
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
                          sku: item.sku || product?.sku || item.productId,
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
                stockMovements.slice(0, 20).map((mov: any) => (
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
            stockMovements.slice(0, 20).map((mov: any) => (
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

      {/* ─── ADD STOCK DIALOG ─── */}
      <Dialog open={addStockOpen} onOpenChange={setAddStockOpen}>
        <DialogContent className="flex max-h-[90vh] w-[95vw] sm:max-w-md flex-col overflow-hidden p-0 rounded-lg border-slate-200 bg-white shadow-lg">
          <DialogHeader className="shrink-0 border-b border-slate-100 px-6 py-4">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Add New Inventory Stock
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Create a new physical stock unit or increase bulk inventory
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddStockSubmit} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
            {addStockError && (
              <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700 border border-rose-200">
                {addStockError}
              </div>
            )}

            {/* Product Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-700">
                Select Product <span className="text-rose-500">*</span>
              </label>
              {selectedProduct ? (
                <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-slate-900 truncate">{selectedProduct.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{selectedProduct.sku || "No SKU"}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-500 transition-colors ml-4 shrink-0"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <Input
                      placeholder="Type to search product name/SKU..."
                      className="h-10 rounded-md border-slate-200 pl-8 text-sm"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>
                  <ScrollArea className="h-[140px] rounded-md border border-slate-200 bg-white p-2">
                    {isLoadingProducts ? (
                      <div className="p-4 text-center text-xs text-slate-500">Loading products...</div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">No products found</div>
                    ) : (
                      filteredProducts.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleProductSelect(p)}
                          className="w-full text-left rounded px-2 py-1.5 text-xs transition-colors hover:bg-slate-100 flex flex-col gap-0.5"
                        >
                          <div className="font-medium text-slate-950 truncate w-full">{p.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{p.sku || "No SKU"}</div>
                        </button>
                      ))
                    )}
                  </ScrollArea>
                </div>
              )}
            </div>

            {/* Serial Number & Part Number */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  Serial Number <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <Input
                  className="h-10 rounded-md border-slate-200 text-sm"
                  placeholder="e.g. SN12345"
                  value={serialNumber}
                  onChange={(e) => handleSerialNumberChange(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  Part Number <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <Input
                  className="h-10 rounded-md border-slate-200 text-sm"
                  placeholder="e.g. PN98765"
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                />
              </div>
            </div>

            {/* Quantity & Cost Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  Quantity
                </label>
                <Input
                  type="number"
                  min={1}
                  className="h-10 rounded-md border-slate-200 text-sm"
                  value={quantity}
                  disabled={!!serialNumber.trim()}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                />
                {serialNumber.trim() && (
                  <p className="mt-1 text-[10px] text-slate-500">
                    Locked to 1 for serial items.
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  Cost Price (₹)
                </label>
                <Input
                  type="number"
                  min={0}
                  className="h-10 rounded-md border-slate-200 text-sm"
                  value={costPrice}
                  onChange={(e) => setCostPrice(Math.max(0, Number(e.target.value)))}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Storage Location <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <Input
                className="h-10 rounded-md border-slate-200 text-sm"
                placeholder="e.g. Aisle 3, Shelf B"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-4 shrink-0 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 px-6 py-4 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setAddStockOpen(false)}
                className="flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingStock || !selectedProduct}
                className="flex h-9 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingStock ? "Saving..." : "Add Stock"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryManager;