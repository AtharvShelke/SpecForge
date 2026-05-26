"use client";

<<<<<<< HEAD
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
=======
import React, { useDeferredValue, useState, useMemo, useEffect, useCallback, useRef, FormEvent, memo } from 'react';
import { StockMovementType, StockMovement } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    DollarSign,
    Package,
    Search,
    TrendingDown,
    TrendingUp,
    Filter,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    MoveHorizontal,
    History,
    Warehouse as WarehouseIcon,
    BarChart3,
    ShieldAlert,
    Zap,
    Clock,
    Tag,
    ChevronDown,
    SlidersHorizontal,
} from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { InventoryItem, Category, Product } from '@/types';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
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
<<<<<<< HEAD
import { useDebounce } from "@/hooks/useDebounce";
=======
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50

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
<<<<<<< HEAD
  const {
    inventory,
    stockMovements,
    adjustStock,
    refreshInventory,
    refreshAuditLogs,
    fetchInventoryPage,
    syncData,
    isLoading,
    categories,
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
    categories: any[];
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
=======
    const { toast } = useToast();
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    const refreshCategories = useCallback(async () => {
        try {
            const res = await fetch('/api/categories');
            if (res.ok) {
                const data = await res.json();
               
                setCategories(data);
            }
        } catch (err) {
            console.error("Failed to fetch categories:", err);
        }
    }, []);

    const refreshProducts = useCallback(async () => {
        try {
            const res = await fetch('/api/products?fields=minimal&limit=5000');
            if (res.ok) {
                const data = await res.json();
                setProducts(data.products ?? []);
            }
        } catch (err) {
            console.error("Failed to fetch products:", err);
        }
    }, []);

    // Fetch inventory
    const refreshInventory = useCallback(async () => {
        try {
            const res = await fetch('/api/inventory?limit=3000');
            const data = await res.json();
            setInventory(data.items ?? (Array.isArray(data) ? data : []));
        } catch (err) {
            console.error(err);
        }
    }, []);

    // Fetch stock movements
    const refreshStockMovements = useCallback(async () => {
        try {
            const res = await fetch('/api/inventory/movements');
            setStockMovements(await res.json());
        } catch (err) {
            console.error(err);
        }
    }, []);

   

    // Sync data
    const syncData = useCallback(async () => {
        setIsLoading(true);
        await Promise.all([refreshInventory(), refreshStockMovements(), refreshCategories(), refreshProducts()]);
        setRefreshTrigger(prev => !prev);
        setIsLoading(false);
    }, [refreshInventory, refreshStockMovements, refreshCategories, refreshProducts]);

    // Adjust stock
    const adjustStock = useCallback(async (
        warehouseInventoryId: string, quantity: number, type: StockMovementType, reason?: string,
    ) => {
        try {
            const res = await fetch(`/api/inventory/${warehouseInventoryId}/movements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, quantity, reason }),
            });
            if (res.ok) {
                toast({ title: 'Stock adjusted' });
                await Promise.all([refreshInventory(), refreshStockMovements()]);
                return true;
            } else {
                const errorData = await res.json().catch(() => ({}));
                toast({ 
                    title: 'Adjustment failed', 
                    description: errorData.error || 'The request was rejected by the server.', 
                    variant: 'destructive' 
                });
                return false;
            }
        } catch (err) {
            console.error(err);
            toast({ title: 'Network error', description: 'Could not connect to the server.', variant: 'destructive' });
            return false;
        }
    }, [refreshInventory, refreshStockMovements, toast]);

    

    // Initial data fetch
    useEffect(() => {
        Promise.all([refreshInventory(), refreshStockMovements(), refreshCategories(), refreshProducts()]);
    }, [refreshInventory, refreshStockMovements, refreshCategories, refreshProducts]);

    const [adjustmentModal, setAdjustmentModal] = useState<{
        isOpen: boolean; id: string; sku: string; productId: string; currentQty: number; isUnitTracked: boolean;
    } | null>(null);

    
    const [addUnitsModal, setAddUnitsModal] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [numberOfUnits, setNumberOfUnits] = useState(1);
    const [unitsToAdd, setUnitsToAdd] = useState<{partNumber: string; serialNumber: string; costPrice: string}[]>([{ partNumber: '', serialNumber: '', costPrice: '' }]);

    const [editUnitsModal, setEditUnitsModal] = useState<{
        isOpen: boolean; productId: string; productName: string; sku: string;
    } | null>(null);
    const [existingUnits, setExistingUnits] = useState<{id: string; partNumber: string; serialNumber: string; costPrice: number}[]>([]);
    const [isLoadingUnits, setIsLoadingUnits] = useState(false);

 
    const [adjType, setAdjType] = useState<StockMovementType>('INWARD');
    const [adjQty, setAdjQty] = useState(1);
    const [adjReason, setAdjReason] = useState('');
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50

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

<<<<<<< HEAD
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const currentLimit = parseInt(searchParams.get("limit") || "10", 10);
  const currentCategory = searchParams.get("category") || "all";
  const currentSearch = searchParams.get("q") || "";
  const currentStockStatus = searchParams.get("f_stock_status") || "all";
=======
    const [paginatedInventory, setPaginatedInventory] = useState<InventoryItem[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoadingInventory, setIsLoadingInventory] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(false);
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50

  const [searchTerm, setSearchTerm] = useState(currentSearch);
  useEffect(() => {
    setSearchTerm(currentSearch);
  }, [currentSearch]);

<<<<<<< HEAD
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
=======
    const [searchTerm, setSearchTerm] = useState(currentSearch);
    useEffect(() => { setSearchTerm(currentSearch); }, [currentSearch]);
    const deferredSearch = useDeferredValue(searchTerm);
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50

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

<<<<<<< HEAD
    fetchPaginatedInventory();
=======
    useEffect(() => {
        if (deferredSearch !== currentSearch) updateQueryParams({ q: deferredSearch });
    }, [currentSearch, deferredSearch, updateQueryParams]);
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50

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

<<<<<<< HEAD
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
=======
    const handleAdjustment = useCallback(async (e: FormEvent) => {
        e.preventDefault();
        if (adjustmentModal && adjQty > 0) {
            const success = await adjustStock(adjustmentModal.id, adjQty, adjType, adjReason);
            if (success) {
                setAdjustmentModal(null); setAdjQty(1); setAdjReason(''); setAdjType('INWARD');
                setRefreshTrigger(prev => !prev);
            }
        }
    }, [adjustmentModal, adjQty, adjType, adjReason, adjustStock]);



    const handleCloseAdjustment = useCallback(() => setAdjustmentModal(null), []);
    const handleToggleFilters = useCallback(() => setShowFilters(f => !f), []);
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50

  const handleStockStatusChange = useCallback(
    (val: string) => {
      updateQueryParams({ f_stock_status: val });
    },
    [updateQueryParams],
  );

<<<<<<< HEAD
  const kpis = useMemo(() => {
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalStockValue = 0;
    let totalAvailable = 0;
    let totalReserved = 0;
    let healthyCount = 0;
=======
    const handleCreateUnits = useCallback(async () => {
        const units = unitsToAdd
            .filter((unit) => unit.partNumber && unit.serialNumber)
            .map((unit) => ({
                partNumber: unit.partNumber.trim(),
                serialNumber: unit.serialNumber.trim(),
                costPrice: unit.costPrice ? Number(unit.costPrice) : undefined,
            }));

        if (!selectedProductId || units.length === 0) {
            toast({ title: 'Add at least one valid unit entry (requires Part Number and Serial Number)', variant: 'destructive' });
            return;
        }

        const res = await fetch('/api/inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productId: selectedProductId,
                units,
                note: 'Inventory units added from dashboard',
            }),
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            toast({ title: 'Failed to add units', description: data.error || 'Please review the unit register.', variant: 'destructive' });
            return;
        }

        toast({ title: 'Inventory units added' });
        setAddUnitsModal(false);
        setSelectedProductId('');
        setNumberOfUnits(1);
        setUnitsToAdd([{ partNumber: '', serialNumber: '', costPrice: '' }]);
        await syncData();
    }, [selectedProductId, syncData, toast, unitsToAdd]);

    const handleOpenEditUnits = useCallback(async (productId: string, productName: string, sku: string) => {
        setIsLoadingUnits(true);
        setEditUnitsModal({ isOpen: true, productId, productName, sku });
        try {
            const res = await fetch(`/api/inventory?productId=${productId}&limit=1000`);
            if (res.ok) {
                const data = await res.json();
                const units = (data.items || []).map((item: any) => ({
                    id: item.id,
                    partNumber: item.partNumber || '',
                    serialNumber: item.serialNumber || '',
                    costPrice: item.costPrice || 0,
                }));
                setExistingUnits(units);
            }
        } catch (err) {
            console.error('Failed to fetch units:', err);
            toast({ title: 'Failed to load units', variant: 'destructive' });
        } finally {
            setIsLoadingUnits(false);
        }
    }, [toast]);

    const handleUpdateUnits = useCallback(async () => {
        if (!editUnitsModal) return;

        const updates = existingUnits.map(unit => ({
            id: unit.id,
            partNumber: unit.partNumber.trim(),
            serialNumber: unit.serialNumber.trim(),
            costPrice: unit.costPrice,
        }));

        const res = await fetch('/api/inventory/update', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ units: updates }),
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            toast({ title: 'Failed to update units', description: data.error || 'Please try again.', variant: 'destructive' });
            return;
        }

        toast({ title: 'Units updated successfully' });
        setEditUnitsModal(null);
        setExistingUnits([]);
        await syncData();
    }, [editUnitsModal, existingUnits, syncData, toast]);

    // Pagination handlers — stable references prevent button re-renders
    const handlePrevPage = useCallback(() => {
        updateQueryParams({ page: String(currentPage - 1) });
    }, [updateQueryParams, currentPage]);
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50

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

<<<<<<< HEAD
    const totalOnHand = totalAvailable + totalReserved;
    const healthPct =
      arr.length > 0 ? Math.round((healthyCount / arr.length) * 100) : 0;
=======
    const handleCategoryChange = useCallback((val: string) => {
        if (val === 'all') {
            updateQueryParams({ category: '' });
        } else {
            updateQueryParams({ category: val });
        }
    }, [updateQueryParams]);
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50

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
      const cat = i.variant?.product?.category || 
                  i.variant?.product?.subCategory?.category?.name ||
                  i.variant?.product?.subCategory?.name ||
                  "Other";
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
    () =>
      (categories ?? [])
        .map((category) =>
          typeof category === "string" ? category : category.name,
        )
        .filter(Boolean),
    [categories],
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

<<<<<<< HEAD
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
=======
    const categoryBreakdown = useMemo(() => {
        const map: Record<string, { units: number; value: number; count: number }> = {};
        const arr = Array.isArray(inventory) ? inventory : [];
        for (const i of arr) {
            const cat = i.product?.category?.name || 'Uncategorised';
            if (!map[cat]) map[cat] = { units: 0, value: 0, count: 0 };
            map[cat].units += i.quantity;
            map[cat].value += i.quantity * i.costPrice;
            map[cat].count += 1;
        }
        return Object.entries(map).sort((a, b) => b[1].value - a[1].value).slice(0, 5);
    }, [inventory]);

    // KPI card definitions — memoized so the array isn't reconstructed every render
    const kpiCards = useMemo(() => [
        {
            label: 'Valuation',
            value: totalStockValue > 999999
                ? `₹${(totalStockValue / 100000).toFixed(1)}L`
                : `₹${totalStockValue.toLocaleString('en-IN')}`,
            sub: `${Array.isArray(inventory) ? inventory.length : 0} units`,
            icon: <DollarSign size={12} />,
            accent: 'border-l-indigo-400',
            alert: false,
        },
        {
            label: 'Low Stock',
            value: lowStockCount,
            sub: 'Action req.',
            icon: <AlertTriangle size={12} />,
            accent: 'border-l-amber-400',
            alert: lowStockCount > 0,
        },
        {
            label: 'Out of Stock',
            value: outOfStockCount,
            sub: 'Zero stock',
            icon: <ShieldAlert size={12} />,
            accent: 'border-l-rose-400',
            alert: outOfStockCount > 0,
        },
        {
            label: 'Health',
            value: `${healthPct}%`,
            sub: `${healthyCount} Optimal`,
            icon: <BarChart3 size={12} />,
            accent: healthPct >= 80 ? 'border-l-emerald-400' : healthPct >= 50 ? 'border-l-amber-400' : 'border-l-rose-400',
            alert: false,
        },
    ], [totalStockValue, inventory, lowStockCount, outOfStockCount, healthPct, healthyCount]);

    // Utilisation rows — memoized to prevent array construction on every render
    const utilisationRows = useMemo(() => [
        { label: 'On Hand',      value: totalOnHand.toLocaleString('en-IN'),   sub: 'Physical stock', icon: <Package size={12} />,    color: 'text-stone-600' },
        { label: 'Reserved',     value: totalReserved.toLocaleString('en-IN'), sub: 'Pending orders', icon: <Clock size={12} />,       color: 'text-amber-600' },
        { label: 'Available',    value: totalAvailable.toLocaleString('en-IN'),sub: 'Free to sell',   icon: <Zap size={12} />,         color: 'text-emerald-600' },
        {
            label: 'Avg Cost/Unit',
            value: Array.isArray(inventory) && inventory.length > 0
                ? `₹${Math.round(totalStockValue / Math.max(totalOnHand, 1)).toLocaleString('en-IN')}`
                : '—',
            sub: 'Weighted avg', icon: <DollarSign size={12} />, color: 'text-indigo-600',
        },
    ], [totalOnHand, totalReserved, totalAvailable, totalStockValue, inventory]);

    const totalPages = Math.max(1, Math.ceil(totalItems / currentLimit));

    return (
        <div
            className="space-y-3"
            style={{ fontFamily: "'DM Sans', 'Geist', 'system-ui', sans-serif" }}
        >
            {/* ─── HEADER ─── */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-1 h-4 rounded-full bg-indigo-500 flex-shrink-0" />
                    <div className="min-w-0">
                        <h2 className="text-sm font-bold text-stone-900 tracking-tight">Inventory</h2>
                        <p className="text-[11px] text-stone-400 font-mono hidden sm:block">
                            {Array.isArray(inventory) ? inventory.length : 0} units · Live
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setAddUnitsModal(true)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-stone-50 text-stone-600 border border-stone-200 text-xs font-semibold transition-colors"
                    >
                        <Package size={12} />
                        <span className="hidden sm:inline">Add Units</span>
                    </button>
                    <button
                        onClick={openAuditLog}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-stone-50 text-stone-600 border border-stone-200 text-xs font-semibold transition-colors"
                    >
                        <History size={12} />
                        <span className="hidden sm:inline">Audit Log</span>
                    </button>
                    <button
                        onClick={handleRefreshSync}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm"
                    >
                        <RefreshCw size={12} />
                        <span className="hidden sm:inline">Sync</span>
                    </button>
                </div>
            </div>

            {/* ─── KPI CARDS ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                {kpiCards.map((card, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            'rounded-xl bg-white border border-stone-200 border-l-[3px] sm:border-l-4 shadow-sm p-2.5 sm:p-4 active:scale-[0.98] transition-transform',
                            card.accent
                        )}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[8px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-tighter sm:tracking-widest truncate mr-1">
                                {card.label}
                            </span>
                            <span className={cn(
                                'p-1 rounded-md shrink-0',
                                card.alert ? 'text-rose-500 bg-rose-50' : 'text-stone-400 bg-stone-50'
                            )}>
                                {card.icon}
                            </span>
                        </div>
                        <p className="text-base sm:text-lg md:text-xl font-black text-stone-900 tabular-nums tracking-tight leading-none">
                            {card.value}
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-stone-400 mt-1 truncate font-medium">
                            {card.sub}
                        </p>
                    </div>
                ))}
            </div>

            {/* ─── SECONDARY STATS ROW ─── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                {/* Critical Alerts */}
                <CollapsibleSection
                    icon={<AlertTriangle size={12} />}
                    title="Critical Alerts"
                    accentClass="bg-gradient-to-r from-rose-400 via-amber-400 to-amber-300"
                >
                    <div className="divide-y divide-stone-50">
                        {criticalItems.length === 0 ? (
                            <div className="px-4 py-4 text-center text-xs text-stone-400">All levels healthy</div>
                        ) : criticalItems.map((item, idx) => {
                            const pct = Math.round((item.quantity / Math.max(item.reorderLevel, 1)) * 100);
                            const name = item.product?.name || item.productId;
                            return (
                                <div key={idx} className="px-4 py-2.5">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="text-xs font-semibold text-stone-800 truncate">{name}</span>
                                        {item.quantity === 0
                                            ? <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full ring-1 ring-rose-200 whitespace-nowrap flex-shrink-0">OUT</span>
                                            : <span className="text-[10px] font-mono font-bold text-amber-700 flex-shrink-0">{item.quantity}/{item.reorderLevel}</span>
                                        }
                                    </div>
                                    <div className="h-1 w-full bg-stone-100 rounded-full overflow-hidden">
                                        <div
                                            className={cn('h-full rounded-full transition-all', item.quantity === 0 ? 'bg-rose-400' : 'bg-amber-400')}
                                            style={{ width: `${Math.min(pct, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CollapsibleSection>

                {/* Category Breakdown */}
                <CollapsibleSection
                    icon={<Tag size={12} />}
                    title="Value by Category"
                    accentClass="bg-gradient-to-r from-indigo-400 via-indigo-500 to-violet-400"
                >
                    <div className="divide-y divide-stone-50">
                        {categoryBreakdown.length === 0 ? (
                            <div className="px-4 py-4 text-center text-xs text-stone-400">No data</div>
                        ) : categoryBreakdown.map(([cat, data], idx) => {
                            const pct = totalStockValue > 0 ? Math.round((data.value / totalStockValue) * 100) : 0;
                            return (
                                <div key={idx} className="px-4 py-2.5">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="text-xs font-semibold text-stone-700 truncate">{cat}</span>
                                        <span className="text-[10px] font-mono font-bold text-stone-500 tabular-nums shrink-0">
                                            ₹{data.value.toLocaleString('en-IN')} · {pct}%
                                        </span>
                                    </div>
                                    <div className="h-1 w-full bg-stone-100 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full bg-indigo-400 transition-all" style={{ width: `${pct}%` }} />
                                    </div>
                                    <p className="text-[10px] text-stone-400 mt-0.5">{data.units} units · {data.count} SKUs</p>
                                </div>
                            );
                        })}
                    </div>
                </CollapsibleSection>

                {/* Stock Utilisation */}
                <CollapsibleSection
                    icon={<WarehouseIcon size={12} />}
                    title="Stock Utilisation"
                    accentClass="bg-gradient-to-r from-teal-400 via-emerald-400 to-emerald-300"
                >
                    <div className="px-4 py-3 space-y-2.5">
                        {utilisationRows.map(({ label, value, sub, icon, color }) => (
                            <div key={label} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className={cn('shrink-0', color)}>{icon}</span>
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold truncate">{label}</p>
                                        <p className="text-[10px] text-stone-400 hidden sm:block">{sub}</p>
                                    </div>
                                </div>
                                <span className={cn('font-bold font-mono tabular-nums text-sm shrink-0', color)}>{value}</span>
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>
            </div>

            {/* ─── STOCK TABLE ─── */}
            <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                <div className="h-0.5 w-full bg-gradient-to-r from-indigo-400 via-indigo-500 to-violet-400" />

                {/* Filters header */}
                <div className="px-3 sm:px-4 py-2.5 border-b border-stone-100 bg-stone-50/50 space-y-2">
                    <div className="flex items-center gap-2">
                        <SectionLabel icon={<Package size={12} />}>Stock Levels</SectionLabel>
                        <span className="text-[10px] font-mono font-bold text-stone-400 bg-white border border-stone-200 px-2 py-0.5 rounded-md">
                            {totalItems}
                        </span>
                        <button
                            onClick={syncData}
                            disabled={isLoading}
                            className="h-7 w-7 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={11} className={cn(isLoading && 'animate-spin')} />
                        </button>
                        <div className="flex-1" />
                        <div className="relative flex-1 max-w-[160px] sm:max-w-xs">
                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                            <Input
                                placeholder="SKU, name…"
                                className="pl-7 h-8 text-xs bg-white border-stone-200 text-stone-800 placeholder:text-stone-400 focus-visible:ring-indigo-400 focus-visible:border-indigo-300 shadow-none rounded-lg w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleToggleFilters}
                            className={cn(
                                'flex items-center gap-1 h-8 px-2.5 rounded-lg border text-xs font-semibold transition-colors flex-shrink-0',
                                showFilters
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                            )}
                        >
                            <SlidersHorizontal size={12} />
                            <span className="hidden sm:inline">Filters</span>
                        </button>
                    </div>

                    {showFilters && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            <Select value={currentCategory} onValueChange={handleCategoryChange}>
                                <SelectTrigger className="h-8 text-xs w-32 sm:w-36 bg-white border-stone-200 text-stone-700 focus:ring-indigo-400 shadow-none rounded-lg">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-stone-200 text-stone-800 shadow-md">
                                    <SelectItem value="all" className="text-xs focus:bg-stone-50">All Categories</SelectItem>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.code || cat.slug} className="text-xs focus:bg-stone-50">
                                            {cat.shortLabel || cat.label || cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={currentStockStatus} onValueChange={handleStockStatusChange}>
                                <SelectTrigger className="h-8 text-xs w-32 sm:w-36 bg-white border-stone-200 text-stone-700 focus:ring-indigo-400 shadow-none rounded-lg">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-stone-200 text-stone-800 shadow-md">
                                    <SelectItem value="all" className="text-xs focus:bg-stone-50">Any Status</SelectItem>
                                    <SelectItem value="in" className="text-xs focus:bg-stone-50">In Stock</SelectItem>
                                    <SelectItem value="low" className="text-xs focus:bg-stone-50">Low Stock</SelectItem>
                                    <SelectItem value="out" className="text-xs focus:bg-stone-50">Out of Stock</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-stone-100 bg-stone-50/30">
                                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Product</th>
                                <th className="px-3 py-2.5 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">SKU</th>
                                <th className="hidden md:table-cell px-3 py-2.5 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Location</th>
                                <th className="px-3 py-2.5 text-right text-[10px] font-bold text-stone-400 uppercase tracking-widest">Available</th>
                                <th className="hidden md:table-cell px-3 py-2.5 text-right text-[10px] font-bold text-stone-400 uppercase tracking-widest">Reserved</th>
                                <th className="hidden lg:table-cell px-3 py-2.5 text-right text-[10px] font-bold text-stone-400 uppercase tracking-widest">Cost Value</th>
                                <th className="px-3 py-2.5 text-right text-[10px] font-bold text-stone-400 uppercase tracking-widest">Status</th>
                                <th className="px-4 py-2.5 text-right text-[10px] font-bold text-stone-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                            {isLoadingInventory ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-10 text-center text-xs text-stone-400">Loading inventory…</td>
                                </tr>
                            ) : paginatedInventory.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-12 text-center">
                                        <Package size={24} className="mx-auto text-stone-300 mb-2" />
                                        <p className="text-xs text-stone-400">
                                            {currentSearch || currentStockStatus !== 'all' || currentCategory !== 'all'
                                                ? 'No items match current filters'
                                                : 'Inventory is empty'}
                                        </p>
                                    </td>
                                </tr>
                            ) : paginatedInventory.map((item: InventoryItem) => {
                                const product = item.product;
                                const costValue = item.quantity * item.costPrice;
                                return (
                                    <tr key={item.id} className="hover:bg-stone-50/60 transition-colors group">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="h-9 w-9 shrink-0 bg-stone-100 border border-stone-200 rounded-lg overflow-hidden">
                                                    <img
                                                        className="h-full w-full object-contain"
                                                        src={product?.media?.[0]?.url || '/placeholder.png'}
                                                        alt={product?.name || product?.sku || 'Product image'}
                                                        onError={handleImgError}
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-stone-800 truncate tracking-tight leading-tight" title={product?.name}>
                                                        {product?.name || 'Undefined Product'}
                                                    </p>
                                                    <span className="text-[10px] text-stone-400 bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded font-medium">
                                                        {product?.category?.name || 'Standard'}
                                                    </span>
                                                    <p className="mt-1 text-[10px] font-mono text-stone-400">
                                                        {item.partNumber || 'No part'} · {item.serialNumber || 'No serial'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-xs font-mono font-semibold text-stone-500">
                                            {product?.sku || 'N/A'}
                                        </td>
                                        <td className="hidden md:table-cell px-3 py-3 whitespace-nowrap text-xs font-mono text-stone-400 uppercase">
                                            {item.location || 'WH-01'}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-right">
                                            <span className={cn(
                                                'text-sm font-bold tabular-nums font-mono',
                                                item.quantity === 0 ? 'text-rose-600' :
                                                    item.quantity <= item.reorderLevel ? 'text-amber-700' : 'text-stone-900'
                                            )}>
                                                {item.quantity}
                                            </span>
                                            <p className="text-[10px] text-stone-400 font-mono">/{item.reorderLevel} min</p>
                                        </td>
                                        <td className="hidden md:table-cell px-3 py-3 whitespace-nowrap text-right text-xs font-mono font-semibold text-amber-600 tabular-nums">
                                            {item.reserved || 0}
                                        </td>
                                        <td className="hidden lg:table-cell px-3 py-3 whitespace-nowrap text-right text-xs font-mono font-bold text-stone-700 tabular-nums">
                                            ₹{costValue.toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-right">
                                            <StockBadge qty={item.quantity} reorderLevel={item.reorderLevel} />
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white hover:bg-stone-50 text-stone-600 border border-stone-200 text-[11px] font-semibold transition-colors"
                                                    onClick={() => handleOpenEditUnits(
                                                        item.productId,
                                                        product?.name || 'Unknown',
                                                        product?.sku || 'N/A'
                                                    )}
                                                >
                                                    <Tag size={11} /> Edit Units
                                                </button>
                                                
                                                <button
                                                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition-colors"
                                                    onClick={() => setAdjustmentModal({
                                                        isOpen: true,
                                                        id: item.id,
                                                        sku: product?.sku || item.productId,
                                                        productId: item.productId,
                                                        currentQty: item.quantity,
                                                        isUnitTracked: !!(item.serialNumber || item.partNumber),
                                                    })}
                                                >
                                                    <RefreshCw size={11} /> Adjust
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="sm:hidden divide-y divide-stone-100">
                    {isLoadingInventory ? (
                        <div className="p-8 text-center text-xs text-stone-400">Loading inventory…</div>
                    ) : paginatedInventory.length === 0 ? (
                        <div className="p-10 text-center">
                            <Package size={24} className="mx-auto text-stone-300 mb-2" />
                            <p className="text-xs text-stone-400">
                                {currentSearch || currentStockStatus !== 'all' || currentCategory !== 'all'
                                    ? 'No items match filters' : 'Inventory is empty'}
                            </p>
                        </div>
                    ) : paginatedInventory.map((item: InventoryItem) => {
                        const product = item.product;
                        const isLow = item.quantity > 0 && item.quantity <= item.reorderLevel;
                        const isOut = item.quantity === 0;
                        return (
                            <div key={item.id} className="px-3 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-11 w-11 shrink-0 bg-stone-100 border border-stone-200 rounded-lg overflow-hidden">
                                        <img
                                            className="h-full w-full object-contain"
                                            src={product?.media?.[0]?.url || '/placeholder.png'}
                                            alt={product?.name || product?.sku || 'Product image'}
                                            onError={handleImgError}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-stone-800 truncate tracking-tight">{product?.name || 'Undefined Product'}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                            <span className="text-[10px] font-mono font-bold text-stone-400">{product?.sku || 'N/A'}</span>
                                            <StockBadge qty={item.quantity} reorderLevel={item.reorderLevel} />
                                        </div>
                                        <p className="mt-1 text-[10px] font-mono text-stone-400 truncate">
                                            {item.partNumber || 'No part'} · {item.serialNumber || 'No serial'}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <span className={cn(
                                            'text-lg font-extrabold tabular-nums font-mono leading-none',
                                            isOut ? 'text-rose-600' : isLow ? 'text-amber-700' : 'text-stone-900'
                                        )}>
                                            {item.quantity}
                                        </span>
                                        <p className="text-[10px] text-stone-400 font-mono text-right">/{item.reorderLevel}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-2.5">
                                   
                                    <button
                                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold transition-colors active:bg-indigo-700"
                                        onClick={() => setAdjustmentModal({
                                            isOpen: true,
                                            id: item.id,
                                            sku: product?.sku || item.productId,
                                            productId: item.productId,
                                            currentQty: item.quantity,
                                            isUnitTracked: !!(item.serialNumber || item.partNumber),
                                        })}
                                    >
                                        <RefreshCw size={12} /> Adjust
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pagination */}
                {!isLoadingInventory && totalItems > 0 && (
                    <div className="px-3 sm:px-5 py-3 border-t border-stone-100 bg-stone-50/40 flex items-center justify-between">
                        <p className="text-xs text-stone-400 font-mono tabular-nums">
                            <span className="text-stone-600 font-semibold">{(currentPage - 1) * currentLimit + 1}</span>
                            –
                            <span className="text-stone-600 font-semibold">{Math.min(currentPage * currentLimit, totalItems)}</span>
                            <span className="hidden sm:inline"> of <span className="text-stone-600 font-semibold">{totalItems}</span></span>
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button
                                disabled={currentPage <= 1}
                                onClick={handlePrevPage}
                                className="h-8 w-8 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={13} />
                            </button>
                            <span className="px-3 h-8 flex items-center text-xs font-mono font-bold text-stone-600 border border-stone-200 rounded-lg bg-white tabular-nums">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                disabled={currentPage >= totalPages}
                                onClick={handleNextPage}
                                className="h-8 w-8 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={13} />
                            </button>
                        </div>
                    </div>
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
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

<<<<<<< HEAD
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
=======
            {/* ─── STOCK MOVEMENT HISTORY ─── */}
            <CollapsibleSection
                icon={<History size={12} />}
                title="Movement History"
                badge={
                    <span className="text-[10px] font-mono font-bold text-stone-400 bg-white border border-stone-200 px-2 py-0.5 rounded-md ml-1">
                        {Math.min(stockMovements.length, 20)}
                    </span>
                }
                defaultOpen={false}
            >
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto max-h-[300px]">
                    <table className="w-full">
                        <thead className="sticky top-0 bg-white z-10">
                            <tr className="border-b border-stone-100">
                                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Date</th>
                                <th className="px-3 py-2.5 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">SKU</th>
                                <th className="px-3 py-2.5 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Type</th>
                                <th className="px-3 py-2.5 text-right text-[10px] font-bold text-stone-400 uppercase tracking-widest">Qty</th>
                                <th className="hidden md:table-cell px-4 py-2.5 text-left text-[10px] font-bold text-stone-400 uppercase tracking-widest">Reason</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                            {stockMovements.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-8 text-center text-xs text-stone-400">No stock movements recorded</td>
                                </tr>
                            ) : stockMovements.slice(0, 20).map(mov => (
                                <tr key={mov.id} className="hover:bg-stone-50/60 transition-colors">
                                    <td className="px-4 py-2.5 whitespace-nowrap text-[11px] font-mono text-stone-400 tabular-nums">
                                        {new Date(mov.date || mov.createdAt).toLocaleDateString('en-IN', DATE_OPTS_MOV)}
                                    </td>
                                    <td className="px-3 py-2.5 whitespace-nowrap text-xs font-mono font-semibold text-stone-700">{mov.sku}</td>
                                    <td className="px-3 py-2.5 whitespace-nowrap"><MovTypeBadge type={mov.type} /></td>
                                    <td className="px-3 py-2.5 whitespace-nowrap text-right text-xs font-bold font-mono text-stone-900 tabular-nums">{mov.quantity}</td>
                                    <td className="hidden md:table-cell px-4 py-2.5 text-xs text-stone-400 max-w-[200px]">
                                        <span className="line-clamp-1">{mov.note || '—'}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile movement cards */}
                <div className="sm:hidden divide-y divide-stone-100">
                    {stockMovements.length === 0 ? (
                        <div className="p-6 text-center text-xs text-stone-400">No stock movements recorded</div>
                    ) : stockMovements.slice(0, 20).map(mov => (
                        <div key={mov.id} className="flex items-center gap-3 px-3 py-2.5">
                            <MovTypeBadge type={mov.type} />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-mono font-semibold text-stone-700 truncate">{mov.sku}</p>
                                <p className="text-[10px] text-stone-400 font-mono">
                                    {new Date(mov.date || mov.createdAt).toLocaleDateString('en-IN', DATE_OPTS_MOV_MOBILE)}
                                    {mov.note && <span> · {mov.note}</span>}
                                </p>
                            </div>
                            <span className="text-sm font-bold font-mono text-stone-900 tabular-nums flex-shrink-0">{mov.quantity}</span>
                        </div>
                    ))}
                </div>
            </CollapsibleSection>

            {/* ─── ADJUSTMENT DIALOG ─── */}
            <Dialog open={!!adjustmentModal} onOpenChange={handleCloseAdjustment}>
                <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md bg-white border-stone-200 shadow-xl rounded-xl">
                    <div className="h-0.5 w-full bg-gradient-to-r from-indigo-400 to-violet-400 -mt-6 mb-4 rounded-t-xl" />
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold text-stone-900 tracking-tight">Stock Adjustment</DialogTitle>
                        <DialogDescription className="text-xs text-stone-400">
                            SKU: <span className="font-mono font-semibold text-stone-600">{adjustmentModal?.sku}</span>
                        </DialogDescription>
                    </DialogHeader>
                    {adjustmentModal && (
                        <div className="space-y-3 py-1">
                            <div className="px-3 py-2.5 bg-stone-50 border border-stone-100 rounded-lg flex items-center justify-between">
                                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Current Stock</span>
                                <span className="text-sm font-bold text-stone-900 font-mono">{adjustmentModal.currentQty} units</span>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Type</label>
                                <Select value={adjType} onValueChange={(val: any) => setAdjType(val)}>
                                    <SelectTrigger className="h-9 text-xs border-stone-200 bg-white focus:ring-indigo-400 rounded-lg shadow-none">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-stone-200 shadow-md">
                                        <SelectItem value="INWARD" className="text-xs focus:bg-stone-50">Inward (Replenishment)</SelectItem>
                                        <SelectItem value="ADJUSTMENT" className="text-xs focus:bg-stone-50">Manual Correction</SelectItem>
                                        <SelectItem value="OUTWARD" className="text-xs focus:bg-stone-50">Outward (Loss / Damage)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Quantity</label>
                                {adjustmentModal.isUnitTracked ? (
                                    <>
                                        <Input
                                            type="number"
                                            readOnly
                                            className="h-9 text-sm font-bold border-stone-200 bg-stone-50 text-stone-500 cursor-not-allowed rounded-lg shadow-none"
                                            value={1}
                                        />
                                        <p className="text-[9px] text-stone-400 mt-1 italic">Unit-tracked items can only be adjusted 1 unit at a time.</p>
                                    </>
                                ) : (
                                    <Input
                                        type="number"
                                        min={1}
                                        className="h-9 text-sm font-bold border-stone-200 focus-visible:ring-indigo-400 rounded-lg shadow-none"
                                        value={adjQty}
                                        onChange={e => setAdjQty(Math.max(1, parseInt(e.target.value) || 1))}
                                    />
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Reason</label>
                                <textarea
                                    className="w-full min-h-[72px] px-3 py-2 text-xs border border-stone-200 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none bg-white resize-none text-stone-700 placeholder:text-stone-400"
                                    value={adjReason}
                                    onChange={e => setAdjReason(e.target.value)}
                                    placeholder="Brief explanation…"
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2 pt-1 flex-row">
                        <button onClick={handleCloseAdjustment}
                            className="flex-1 h-10 rounded-lg border border-stone-200 bg-white text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleAdjustment}
                            className="flex-1 h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm">
                            Save Adjustment
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            
            <Dialog open={addUnitsModal} onOpenChange={(open) => {
                setAddUnitsModal(open);
                if (!open) {
                    setSelectedProductId('');
                    setNumberOfUnits(1);
                    setUnitsToAdd([{ partNumber: '', serialNumber: '', costPrice: '' }]);
                }
            }}>
                <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl bg-white border-stone-200 shadow-xl rounded-xl">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold text-stone-900 tracking-tight">Add Inventory Units</DialogTitle>
                        <DialogDescription className="text-xs text-stone-400">
                            Specify the amount of units and provide details for each physical unit.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="flex gap-4">
                            <div className="space-y-1.5 flex-1">
                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Product</label>
                                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                                    <SelectTrigger className="h-9 text-xs border-stone-200 bg-white focus:ring-indigo-400 rounded-lg shadow-none">
                                        <SelectValue placeholder="Select product" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-stone-200 shadow-md">
                                        {products.map((product) => (
                                            <SelectItem key={product.id} value={product.id} className="text-xs focus:bg-stone-50">
                                                {product.name} ({product.sku || 'NO-SKU'})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5 w-32">
                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Amount of Units</label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={numberOfUnits}
                                    onChange={(e) => {
                                        const val = Math.max(1, parseInt(e.target.value) || 1);
                                        setNumberOfUnits(val);
                                        setUnitsToAdd(prev => {
                                            if (prev.length === val) return prev;
                                            if (prev.length < val) {
                                                return [...prev, ...Array.from({ length: val - prev.length }).map(() => ({ partNumber: '', serialNumber: '', costPrice: '' }))];
                                            }
                                            return prev.slice(0, val);
                                        });
                                    }}
                                    className="h-9 text-xs border-stone-200 bg-white focus:ring-indigo-400 rounded-lg shadow-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                            {unitsToAdd.map((unit, idx) => (
                                <div key={idx} className="flex flex-col gap-2 bg-stone-50 p-3 rounded-lg border border-stone-100">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-stone-400">{idx + 1}.</span>
                                        <span className="text-[11px] font-semibold text-stone-700">Unit #{idx + 1}</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide mb-1 block">Part Number</label>
                                            <Input
                                                placeholder="Enter part number"
                                                value={unit.partNumber}
                                                onChange={(e) => {
                                                    const newUnits = [...unitsToAdd];
                                                    newUnits[idx].partNumber = e.target.value;
                                                    setUnitsToAdd(newUnits);
                                                }}
                                                className="h-9 text-xs border-stone-200 bg-white focus:ring-indigo-400 rounded-lg shadow-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide mb-1 block">Serial Number</label>
                                            <Input
                                                placeholder="Enter serial number"
                                                value={unit.serialNumber}
                                                onChange={(e) => {
                                                    const newUnits = [...unitsToAdd];
                                                    newUnits[idx].serialNumber = e.target.value;
                                                    setUnitsToAdd(newUnits);
                                                }}
                                                className="h-9 text-xs border-stone-200 bg-white focus:ring-indigo-400 rounded-lg shadow-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide mb-1 block">Cost Price</label>
                                            <Input
                                                placeholder="Enter cost price"
                                                type="number"
                                                value={unit.costPrice}
                                                onChange={(e) => {
                                                    const newUnits = [...unitsToAdd];
                                                    newUnits[idx].costPrice = e.target.value;
                                                    setUnitsToAdd(newUnits);
                                                }}
                                                className="h-9 text-xs border-stone-200 bg-white focus:ring-indigo-400 rounded-lg shadow-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DialogFooter className="gap-2 pt-1 flex-row">
                        <button
                            onClick={() => {
                                setAddUnitsModal(false);
                                setSelectedProductId('');
                                setNumberOfUnits(1);
                                setUnitsToAdd([{ partNumber: '', serialNumber: '', costPrice: '' }]);
                            }}
                            className="flex-1 h-10 rounded-lg border border-stone-200 bg-white text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateUnits}
                            className="flex-1 h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm"
                        >
                            Save Units
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── EDIT UNITS DIALOG ─── */}
            <Dialog open={editUnitsModal?.isOpen || false} onOpenChange={(open) => {
                if (!open) {
                    setEditUnitsModal(null);
                    setExistingUnits([]);
                }
            }}>
                <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl bg-white border-stone-200 shadow-xl rounded-xl">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold text-stone-900 tracking-tight">Edit Inventory Units</DialogTitle>
                        <DialogDescription className="text-xs text-stone-400">
                            {editUnitsModal?.productName} ({editUnitsModal?.sku}) · {existingUnits.length} units
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {isLoadingUnits ? (
                            <div className="text-center text-xs text-stone-400 py-8">Loading units…</div>
                        ) : existingUnits.length === 0 ? (
                            <div className="text-center text-xs text-stone-400 py-8">No units found for this product</div>
                        ) : (
                            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                                {existingUnits.map((unit, idx) => (
                                    <div key={unit.id} className="flex flex-col gap-2 bg-stone-50 p-3 rounded-lg border border-stone-100">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-stone-400">{idx + 1}.</span>
                                            <span className="text-[11px] font-semibold text-stone-700">Unit #{idx + 1}</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div>
                                                <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide mb-1 block">Part Number</label>
                                                <Input
                                                    placeholder="Enter part number"
                                                    value={unit.partNumber}
                                                    onChange={(e) => {
                                                        const newUnits = [...existingUnits];
                                                        newUnits[idx].partNumber = e.target.value;
                                                        setExistingUnits(newUnits);
                                                    }}
                                                    className="h-9 text-xs border-stone-200 bg-white focus:ring-indigo-400 rounded-lg shadow-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide mb-1 block">Serial Number</label>
                                                <Input
                                                    placeholder="Enter serial number"
                                                    value={unit.serialNumber}
                                                    onChange={(e) => {
                                                        const newUnits = [...existingUnits];
                                                        newUnits[idx].serialNumber = e.target.value;
                                                        setExistingUnits(newUnits);
                                                    }}
                                                    className="h-9 text-xs border-stone-200 bg-white focus:ring-indigo-400 rounded-lg shadow-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide mb-1 block">Cost Price</label>
                                                <Input
                                                    placeholder="Enter cost price"
                                                    type="number"
                                                    value={unit.costPrice}
                                                    onChange={(e) => {
                                                        const newUnits = [...existingUnits];
                                                        newUnits[idx].costPrice = Number(e.target.value);
                                                        setExistingUnits(newUnits);
                                                    }}
                                                    className="h-9 text-xs border-stone-200 bg-white focus:ring-indigo-400 rounded-lg shadow-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <DialogFooter className="gap-2 pt-1 flex-row">
                        <button
                            onClick={() => {
                                setEditUnitsModal(null);
                                setExistingUnits([]);
                            }}
                            className="flex-1 h-10 rounded-lg border border-stone-200 bg-white text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpdateUnits}
                            disabled={isLoadingUnits || existingUnits.length === 0}
                            className="flex-1 h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                        >
                            Save Changes
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── AUDIT LOG DIALOG ─── */}
            <Dialog open={auditLogModal} onOpenChange={setAuditLogModal}>
                <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl bg-white border-stone-200 shadow-xl rounded-xl">
                    <div className="h-0.5 w-full bg-gradient-to-r from-stone-300 via-stone-400 to-stone-300 -mt-6 mb-4 rounded-t-xl" />
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold text-stone-900 tracking-tight">Audit Log</DialogTitle>
                        <DialogDescription className="text-xs text-stone-400">Recent system actions</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[60dvh] sm:h-[400px] w-full rounded-lg border border-stone-100 bg-stone-50 p-2.5">
                        {isLoadingAudit ? (
                            <div className="text-center text-xs text-stone-400 mt-8">Loading logs…</div>
                        ) : auditLogs.length === 0 ? (
                            <div className="text-center text-xs text-stone-400 mt-8">No audit logs found.</div>
                        ) : (
                            <div className="space-y-2">
                                {auditLogs.map((log: any) => (
                                    <div key={log.id} className="bg-white border border-stone-100 rounded-lg px-3 py-2.5">
                                        <div className="flex items-start justify-between gap-2 mb-0.5">
                                            <span className="text-xs font-bold text-stone-800">{log.action || 'Action'}</span>
                                            <span className="text-[10px] font-mono text-stone-400 tabular-nums flex-shrink-0">
                                                {new Date(log.createdAt).toLocaleDateString('en-IN', DATE_OPTS_AUDIT)}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-stone-500">by <span className="font-semibold text-stone-700">{log.actor}</span> · {log.entityType} <span className="font-mono text-stone-400 text-[10px]">({log.entityId})</span></p>
                                        {log.metadata && (
                                            <pre className="text-[10px] mt-1.5 bg-stone-50 border border-stone-100 p-2 rounded break-all whitespace-pre-wrap text-stone-500 font-mono">
                                                {JSON.stringify(log.metadata, null, 2)}
                                            </pre>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
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
