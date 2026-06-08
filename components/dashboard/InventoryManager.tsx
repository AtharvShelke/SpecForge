"use client";

import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  FormEvent,
} from "react";
import { apiFetch } from "@/lib/helpers";
import {
  Package,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  History,
  SlidersHorizontal,
  Plus,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
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

type InventoryUnit = {
  id: string;
  productId: string;
  partNumber: string | null;
  serialNumber: string;
  status: "AVAILABLE" | "RESERVED" | "ALLOCATED" | "SHIPPED" | "RETURNED" | "DAMAGED";
  costPrice: number;
  location: string;
  lastUpdated: string | null;
  product?: {
    id: string;
    name: string;
    sku: string | null;
    price: number | null;
    media?: { url: string }[];
    subcategory?: {
      name: string;
      category?: { name: string };
    };
  };
  orderItemUnits?: {
    orderId: string;
    orderItem?: {
      order?: {
        customerName: string;
        status: string;
      };
    };
  }[];
};

type StockMovementRecord = {
  id: string;
  createdAt: string;
  productId: string;
  inventoryItemId: string | null;
  type: "INWARD" | "OUTWARD" | "ADJUSTMENT";
  quantity: number;
  note: string | null;
  product?: { name: string; sku: string | null };
  inventoryItem?: { serialNumber: string };
};

const STATUS_BADGES: Record<string, { label: string; cls: string }> = {
  AVAILABLE: {
    label: "Available",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  RESERVED: {
    label: "Reserved",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
  },
  ALLOCATED: {
    label: "Allocated",
    cls: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  SHIPPED: {
    label: "Shipped",
    cls: "bg-purple-50 text-purple-700 border-purple-200",
  },
  RETURNED: {
    label: "Returned",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
  DAMAGED: {
    label: "Damaged",
    cls: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  (e.target as HTMLImageElement).src = "https://picsum.photos/300/300";
};

export default function InventoryManager() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Route Params
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const currentLimit = parseInt(searchParams.get("limit") || "10", 10);
  const currentStatusFilter = searchParams.get("status") || "all";
  const currentSearch = searchParams.get("q") || "";
  const currentPlaceholderFilter = searchParams.get("placeholder") === "true";

  // Local State
  const [units, setUnits] = useState<InventoryUnit[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [placeholderCount, setPlaceholderCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const [searchTerm, setSearchTerm] = useState(currentSearch);
  const [showFilters, setShowFilters] = useState(true);
  
  // Stock Movements State
  const [stockMovements, setStockMovements] = useState<StockMovementRecord[]>([]);
  const [isLoadingMovements, setIsLoadingMovements] = useState(false);

  // Dialog State
  const [addStockOpen, setAddStockOpen] = useState(false);
  const [editUnitOpen, setEditUnitOpen] = useState(false);
  const [viewUnitOpen, setViewUnitOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Form State
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  
  const [serialNumber, setSerialNumber] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [costPrice, setCostPrice] = useState(0);
  const [location, setLocation] = useState("");
  const [unitStatus, setUnitStatus] = useState<InventoryUnit["status"]>("AVAILABLE");

  const [activeUnit, setActiveUnit] = useState<InventoryUnit | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const debouncedSearch = useDebounce(searchTerm, 500);

  // Load Inventory data
  const loadInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      query.set("page", String(currentPage));
      query.set("limit", String(currentLimit));
      if (currentStatusFilter !== "all") query.set("status", currentStatusFilter);
      if (currentSearch) query.set("q", currentSearch);
      if (currentPlaceholderFilter) query.set("placeholder", "true");

      const res = await apiFetch<any>(`/api/inventory?${query.toString()}`);
      setUnits(res.items || []);
      setTotalItems(res.total || 0);
      setPlaceholderCount(res.placeholderCount || 0);
    } catch (err) {
      console.error("Failed to load inventory:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, currentLimit, currentStatusFilter, currentSearch, currentPlaceholderFilter]);

  // Load Recent Movements
  const loadMovements = useCallback(async () => {
    setIsLoadingMovements(true);
    try {
      const res = await apiFetch<any>("/api/inventory/movements?limit=15&page=1");
      setStockMovements(Array.isArray(res) ? res : res.items || []);
    } catch (err) {
      console.error("Failed to load stock movements:", err);
    } finally {
      setIsLoadingMovements(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory, refreshTrigger]);

  useEffect(() => {
    loadMovements();
  }, [loadMovements, refreshTrigger]);

  useEffect(() => {
    if (debouncedSearch !== currentSearch) {
      updateQueryParams({ q: debouncedSearch });
    }
  }, [debouncedSearch]);

  const updateQueryParams = useCallback(
    (newParams: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!newParams.page && (newParams.status !== undefined || newParams.q !== undefined)) {
        params.set("page", "1");
      }
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === null || value === "all" || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );

  const syncData = () => {
    setRefreshTrigger((prev) => !prev);
  };

  const openAddStock = async () => {
    setAddStockOpen(true);
    setIsLoadingProducts(true);
    setErrorMsg("");
    try {
      const data = await apiFetch<any>("/api/catalog/products?limit=1000");
      setProducts(Array.isArray(data?.products) ? data.products : Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch products", e);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setProductSearch("");
  };

  const handleAddStockSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      setErrorMsg("Please select a product");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const payload = {
        productId: selectedProduct.id,
        serialNumber: serialNumber.trim() || null,
        partNumber: partNumber.trim() || null,
        quantity: serialNumber.trim() ? 1 : quantity,
        costPrice: Number(costPrice),
        location: location.trim() || null,
      };

      await apiFetch("/api/inventory", {
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
      syncData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add stock.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditUnit = (unit: InventoryUnit) => {
    setActiveUnit(unit);
    setSerialNumber(unit.serialNumber);
    setPartNumber(unit.partNumber || "");
    setCostPrice(unit.costPrice);
    setLocation(unit.location);
    setUnitStatus(unit.status);
    setErrorMsg("");
    setEditUnitOpen(true);
  };

  const handleEditUnitSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeUnit) return;
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      await apiFetch(`/api/inventory/${activeUnit.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          serialNumber: serialNumber.trim(),
          partNumber: partNumber.trim() || null,
          costPrice: Number(costPrice),
          location: location.trim(),
          status: unitStatus,
        }),
      });

      setEditUnitOpen(false);
      setActiveUnit(null);
      syncData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update unit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openViewUnit = (unit: InventoryUnit) => {
    setActiveUnit(unit);
    setViewUnitOpen(true);
  };

  const openDeleteConfirm = (unit: InventoryUnit) => {
    setActiveUnit(unit);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteUnit = async () => {
    if (!activeUnit) return;
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      await apiFetch(`/api/inventory/${activeUnit.id}`, {
        method: "DELETE",
      });
      setDeleteConfirmOpen(false);
      setActiveUnit(null);
      syncData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete unit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products;
    const lower = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(lower) || p.sku?.toLowerCase().includes(lower)
    );
  }, [products, productSearch]);

  const totalPages = Math.max(1, Math.ceil(totalItems / currentLimit));

  return (
    <div className="space-y-6">
      {placeholderCount > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/50 p-4 shadow-sm animate-pulse">
          <AlertTriangle className="size-5 shrink-0 text-amber-600 mt-0.5" />
          <div className="flex-1 space-y-1">
            <h4 className="text-sm font-semibold text-amber-900">
              Placeholder Serial & Part Numbers Detected
            </h4>
            <p className="text-xs text-amber-700 leading-relaxed">
              There are <span className="font-semibold">{placeholderCount}</span> inventory units currently using auto-generated placeholder serial numbers and missing part numbers. Please assign real serial and part numbers to these units.
            </p>
            <div className="pt-1">
              <button
                onClick={() => {
                  if (currentPlaceholderFilter) {
                    updateQueryParams({ placeholder: null });
                  } else {
                    updateQueryParams({ placeholder: "true" });
                  }
                }}
                className="text-xs font-semibold text-amber-900 underline hover:text-amber-800 transition-colors"
              >
                {currentPlaceholderFilter ? "Show all inventory units" : "Filter units to resolve them now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Levels Panel */}
      <div className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-white p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package size={18} className="text-slate-500" />
              <span className="text-base font-semibold text-slate-900">
                Serialized Units
              </span>
              <span className="ml-2 rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {totalItems} total
              </span>
              {currentPlaceholderFilter && (
                <span className="ml-2 rounded-md bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  Missing Details Filter Active
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={syncData}
                disabled={isLoading}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw size={14} className={cn(isLoading && "animate-spin")} />
              </button>
              <button
                onClick={openAddStock}
                className="flex h-9 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
              >
                <Plus size={14} />
                <span>Add Units</span>
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
                placeholder="Search by serial number, part number, name or SKU..."
                className="h-10 rounded-md border-slate-200 pl-9 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {showFilters && (
              <div className="flex items-center gap-3">
                <Select
                  value={currentStatusFilter}
                  onValueChange={(val) => updateQueryParams({ status: val })}
                >
                  <SelectTrigger className="h-10 w-full sm:w-[180px] rounded-md border-slate-200 text-sm">
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 bg-white">
                    <SelectItem value="all">Any Status</SelectItem>
                    <SelectItem value="AVAILABLE">Available</SelectItem>
                    <SelectItem value="RESERVED">Reserved</SelectItem>
                    <SelectItem value="ALLOCATED">Allocated</SelectItem>
                    <SelectItem value="SHIPPED">Shipped</SelectItem>
                    <SelectItem value="RETURNED">Returned</SelectItem>
                    <SelectItem value="DAMAGED">Damaged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Units Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/50 text-xs text-slate-500 uppercase tracking-wider">
              <tr className="border-b border-slate-200">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Part Number</th>
                <th className="px-5 py-3 font-medium">Serial Number</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 text-right font-medium">Cost Price</th>
                <th className="px-5 py-3 text-center font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <RefreshCw size={20} className="mx-auto mb-2 animate-spin text-slate-400" />
                    Loading inventory units...
                  </td>
                </tr>
              ) : units.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-slate-500">
                    <Package size={28} className="mx-auto mb-2 text-slate-300" />
                    No units match the search or filter criteria.
                  </td>
                </tr>
              ) : (
                units.map((unit) => {
                  const badge = STATUS_BADGES[unit.status] || { label: unit.status, cls: "bg-slate-50 text-slate-700" };
                  const isPlaceholder = (!unit.partNumber || unit.partNumber.trim() === "") && (unit.serialNumber && unit.serialNumber.startsWith("SN-"));
                  return (
                    <tr key={unit.id} className={cn("hover:bg-slate-50/50 transition-colors", isPlaceholder && "bg-amber-50/20")}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white">
                            <img
                              className="h-full w-full object-contain p-1"
                              src={unit.product?.media?.[0]?.url || "/placeholder.png"}
                              alt={unit.product?.name}
                              onError={handleImgError}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900" title={unit.product?.name}>
                              {unit.product?.name || "Unknown Product"}
                            </p>
                            <span className="text-[11px] font-mono text-slate-400">
                              SKU: {unit.product?.sku || "N/A"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-sm text-slate-600">
                        {unit.partNumber || "—"}
                      </td>
                      <td className="px-5 py-3 font-mono text-sm font-semibold text-slate-800">
                        <div className="flex items-center gap-2">
                          {unit.serialNumber}
                          {isPlaceholder && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded" title="Auto-generated placeholder; please edit to set actual serial and part number.">
                              <AlertTriangle size={10} className="text-amber-600 animate-pulse" />
                              Placeholder
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-600">
                        {unit.location || "—"}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-sm font-medium text-slate-900">
                        ₹{unit.costPrice.toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-3 text-center whitespace-nowrap">
                        <span className={cn("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold", badge.cls)}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => openViewUnit(unit)}
                            title="View Unit Details"
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => openEditUnit(unit)}
                            title="Edit Unit Details / Status"
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => openDeleteConfirm(unit)}
                            disabled={unit.status === "RESERVED" || unit.status === "ALLOCATED" || unit.status === "SHIPPED"}
                            title="Delete Unit"
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-rose-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {!isLoading && totalItems > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-5 py-3">
            <p className="text-sm text-slate-600">
              Showing{" "}
              <span className="font-semibold text-slate-900">
                {(currentPage - 1) * currentLimit + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-900">
                {Math.min(currentPage * currentLimit, totalItems)}
              </span>{" "}
              of <span className="font-semibold text-slate-900">{totalItems}</span> units
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => updateQueryParams({ page: String(currentPage - 1) })}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => updateQueryParams({ page: String(currentPage + 1) })}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Movement History Section */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={16} className="text-slate-500" />
            <span className="text-sm font-semibold text-slate-900">Recent Stock Movements</span>
          </div>
          <button
            onClick={loadMovements}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <RefreshCw size={12} className={cn(isLoadingMovements && "animate-spin")} />
            Refresh History
          </button>
        </div>

        <div className="max-h-[300px] overflow-y-auto rounded-md border border-slate-100">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 sticky top-0 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2 font-medium">Timestamp</th>
                <th className="px-4 py-2 font-medium">Product Name</th>
                <th className="px-4 py-2 font-medium">Serial Number</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoadingMovements ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading movements...</td>
                </tr>
              ) : stockMovements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">No stock movements recorded</td>
                </tr>
              ) : (
                stockMovements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-2 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(mov.createdAt).toLocaleString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-2 font-medium text-slate-900 max-w-[200px] truncate">
                      {mov.product?.name || "Deleted Product"}
                    </td>
                    <td className="px-4 py-2 font-mono text-slate-700">
                      {mov.inventoryItem?.serialNumber || "—"}
                    </td>
                    <td className="px-4 py-2">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        mov.type === "INWARD" ? "bg-emerald-50 text-emerald-700" :
                        mov.type === "OUTWARD" ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700"
                      )}>
                        {mov.type}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-500 max-w-[250px] truncate" title={mov.note || ""}>
                      {mov.note || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Stock Dialog */}
      <Dialog open={addStockOpen} onOpenChange={setAddStockOpen}>
        <DialogContent className="flex max-h-[90vh] w-[95vw] sm:max-w-md flex-col overflow-hidden p-0 rounded-lg border-slate-200 bg-white shadow-lg">
          <DialogHeader className="shrink-0 border-b border-slate-100 p-6 pb-4">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Add New Serialized Units
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Insert a single unit with a custom serial number, or auto-generate multiple units.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddStockSubmit} className="flex-1 min-h-0 overflow-y-auto p-6 py-4 space-y-4">
            {errorMsg && (
              <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700 border border-rose-200">
                {errorMsg}
              </div>
            )}

            {/* Select Product */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Select Product <span className="text-rose-500">*</span>
              </label>
              {selectedProduct ? (
                <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900 truncate">{selectedProduct.name}</div>
                    <div className="text-xs text-slate-400 font-mono">SKU: {selectedProduct.sku || "N/A"}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 transition-colors ml-4 shrink-0"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Type product name/SKU..."
                      className="h-10 rounded-md border-slate-200 pl-8 text-sm bg-white"
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
                          className="w-full text-left rounded px-2.5 py-2 text-xs transition-colors hover:bg-slate-100 flex flex-col gap-0.5 border-b border-slate-50 last:border-0"
                        >
                          <div className="font-semibold text-slate-900 truncate w-full">{p.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">SKU: {p.sku || "N/A"}</div>
                        </button>
                      ))
                    )}
                  </ScrollArea>
                </div>
              )}
            </div>

            {/* Serial & Part numbers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Serial Number
                </label>
                <Input
                  className="h-10 rounded-md border-slate-200 text-sm"
                  placeholder="e.g. SN-XYZ-01"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                />
                <p className="text-[10px] text-slate-400">Leave blank to auto-generate</p>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Part Number
                </label>
                <Input
                  className="h-10 rounded-md border-slate-200 text-sm"
                  placeholder="e.g. PN-990-PRO"
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                />
              </div>
            </div>

            {/* Qty & Cost */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Quantity
                </label>
                <Input
                  type="number"
                  min={1}
                  disabled={!!serialNumber.trim()}
                  className="h-10 rounded-md border-slate-200 text-sm disabled:bg-slate-50 disabled:text-slate-400"
                  value={serialNumber.trim() ? 1 : quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                />
                {serialNumber.trim() && (
                  <p className="text-[9px] text-amber-600 font-medium">Locked to 1 for custom serials</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
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

            {/* Storage Location */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Storage Location
              </label>
              <Input
                className="h-10 rounded-md border-slate-200 text-sm"
                placeholder="e.g. Rack A, Shelf 2"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-4 shrink-0 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 px-6 py-4 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setAddStockOpen(false)}
                className="flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedProduct}
                className="flex h-9 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "Creating..." : "Add Units"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Unit Dialog */}
      <Dialog open={editUnitOpen} onOpenChange={setEditUnitOpen}>
        <DialogContent className="flex max-h-[90vh] w-[95vw] sm:max-w-md flex-col overflow-hidden p-0 rounded-lg border-slate-200 bg-white shadow-lg">
          <DialogHeader className="shrink-0 border-b border-slate-100 p-6 pb-4">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Edit Unit Details
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Update serial number, location, cost, or physical status.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditUnitSubmit} className="flex-1 min-h-0 overflow-y-auto p-6 py-4 space-y-4">
            {errorMsg && (
              <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700 border border-rose-200">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Product</label>
              <div className="rounded-md border border-slate-100 bg-slate-50/50 p-2.5 text-sm">
                <span className="font-semibold text-slate-950 block">{activeUnit?.product?.name}</span>
                <span className="text-xs text-slate-400 font-mono">SKU: {activeUnit?.product?.sku || "N/A"}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Serial Number *</label>
                <Input
                  required
                  className="h-10 rounded-md border-slate-200 text-sm font-mono"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Part Number</label>
                <Input
                  className="h-10 rounded-md border-slate-200 text-sm font-mono"
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Cost Price (₹)</label>
                <Input
                  type="number"
                  min={0}
                  className="h-10 rounded-md border-slate-200 text-sm font-mono"
                  value={costPrice}
                  onChange={(e) => setCostPrice(Math.max(0, Number(e.target.value)))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Storage Location</label>
                <Input
                  className="h-10 rounded-md border-slate-200 text-sm"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Status</label>
              <Select
                value={unitStatus}
                onValueChange={(val) => setUnitStatus(val as InventoryUnit["status"])}
                disabled={activeUnit?.status === "SHIPPED"}
              >
                <SelectTrigger className="h-10 rounded-md border-slate-200 bg-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-slate-200 bg-white">
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="RESERVED">Reserved</SelectItem>
                  <SelectItem value="ALLOCATED">Allocated</SelectItem>
                  <SelectItem value="SHIPPED" disabled>Shipped</SelectItem>
                  <SelectItem value="RETURNED">Returned</SelectItem>
                  <SelectItem value="DAMAGED">Damaged</SelectItem>
                </SelectContent>
              </Select>
              {activeUnit?.status === "SHIPPED" && (
                <p className="text-[10px] text-amber-600 font-medium">Shipped units cannot change status directly here.</p>
              )}
            </div>

            <DialogFooter className="pt-4 shrink-0 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 px-6 py-4 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setEditUnitOpen(false)}
                className="flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-9 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Unit Details Dialog */}
      <Dialog open={viewUnitOpen} onOpenChange={setViewUnitOpen}>
        <DialogContent className="flex max-h-[90vh] w-[95vw] sm:max-w-md flex-col overflow-hidden p-0 rounded-lg border-slate-200 bg-white shadow-lg">
          <DialogHeader className="shrink-0 border-b border-slate-100 p-6 pb-4">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Unit Specification
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 text-sm">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white">
                <img
                  className="h-full w-full object-contain p-1"
                  src={activeUnit?.product?.media?.[0]?.url || "/placeholder.png"}
                  alt={activeUnit?.product?.name}
                  onError={handleImgError}
                />
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-slate-900 text-sm truncate">{activeUnit?.product?.name}</h4>
                <p className="text-xs text-slate-400 font-mono">SKU: {activeUnit?.product?.sku || "N/A"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-2 border-b border-slate-50">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Serial Number</span>
                <span className="font-mono text-slate-800 font-semibold">{activeUnit?.serialNumber}</span>
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Part Number</span>
                <span className="font-mono text-slate-800">{activeUnit?.partNumber || "—"}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-2 border-b border-slate-50">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Cost Price</span>
                <span className="font-mono text-slate-800">₹{activeUnit?.costPrice.toLocaleString("en-IN")}</span>
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Storage Location</span>
                <span className="text-slate-800 font-medium">{activeUnit?.location || "—"}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-2 border-b border-slate-50">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Status</span>
                <span className={cn(
                  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold mt-0.5",
                  activeUnit ? STATUS_BADGES[activeUnit.status].cls : ""
                )}>
                  {activeUnit ? STATUS_BADGES[activeUnit.status].label : ""}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">Last Updated</span>
                <span className="text-slate-500 text-xs">
                  {activeUnit?.lastUpdated
                    ? new Date(activeUnit.lastUpdated).toLocaleString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </span>
              </div>
            </div>

            {/* Associated Order details */}
            {activeUnit?.orderItemUnits && activeUnit.orderItemUnits.length > 0 && (
              <div className="rounded-md bg-slate-50 border border-slate-200 p-3 mt-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Active Allocation Link
                </span>
                <div className="text-xs text-slate-700 space-y-1">
                  <p>
                    Order ID:{" "}
                    <span className="font-mono font-medium text-slate-900">
                      {activeUnit.orderItemUnits[0].orderId}
                    </span>
                  </p>
                  <p>
                    Customer:{" "}
                    <span className="font-semibold text-slate-900">
                      {activeUnit.orderItemUnits[0].orderItem?.order?.customerName || "Guest"}
                    </span>
                  </p>
                  <p>
                    Order Status:{" "}
                    <span className="font-semibold uppercase text-indigo-600">
                      {activeUnit.orderItemUnits[0].orderItem?.order?.status || "PENDING"}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 border-t border-slate-100 bg-slate-50 p-6 py-4 flex justify-end">
            <button
              onClick={() => setViewUnitOpen(false)}
              className="flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Close Details
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Unit Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="flex max-h-[90vh] w-[95vw] sm:max-w-md flex-col overflow-hidden p-0 rounded-lg border-slate-200 bg-white shadow-lg">
          <DialogHeader className="shrink-0 border-b border-slate-100 p-6 pb-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle size={20} />
              <DialogTitle className="text-lg font-semibold text-slate-900">
                Confirm Unit Delete
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-slate-500 mt-1">
              Are you sure you want to permanently delete this inventory unit? This action will generate an outward stock movement.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-3 text-sm">
            {errorMsg && (
              <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700 border border-rose-200">
                {errorMsg}
              </div>
            )}

            <div className="rounded-md border border-slate-100 bg-slate-50/50 p-3">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Unit to Delete</p>
              <p className="text-slate-800 font-medium text-sm mt-1">{activeUnit?.product?.name}</p>
              <p className="text-xs font-mono text-slate-500 mt-0.5">
                Serial Number: <span className="font-semibold text-slate-800">{activeUnit?.serialNumber}</span>
              </p>
            </div>
            <p className="text-xs text-rose-600 font-medium">Warning: This cannot be undone.</p>
          </div>

          <DialogFooter className="shrink-0 border-t border-slate-100 bg-slate-50 p-6 py-4 flex gap-2 justify-end">
            <button
              onClick={() => setDeleteConfirmOpen(false)}
              className="flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteUnit}
              disabled={isSubmitting}
              className="flex h-9 items-center justify-center rounded-md bg-rose-600 px-4 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "Deleting..." : "Permanently Delete"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}