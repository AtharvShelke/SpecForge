"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo, useEffect, useCallback, useRef, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useShop } from "@/context/ShopContext";
import { useBuild } from "@/context/BuildContext";
import {
  Product,
  CartItem,
  CompatibilityLevel,
  Role,
  specsToFlat,
} from "@/types";
import {
  CATEGORY_LABELS,
  CATEGORY_NAMES,
  sameCategory,
} from "@/lib/categoryUtils";
import {
  Cpu,
  Monitor,
  HardDrive,
  Zap,
  Box,
  Fan,
  Keyboard,
  Wifi,
  Layers,
  Check,
  X,
  AlertTriangle,
  Plus,
  ArrowLeft,
  Search,
  Share2,
  Save,
  ShoppingCart,
  Eye,
  EyeOff,
  ChevronRight,
  AlertOctagon,
  SlidersHorizontal,
  Hammer,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useProductFilters } from "@/hooks/useProductFilters";
import { useCatalogListing } from "@/hooks/useCatalogListing";
import CatalogFiltersSidebar from "@/app/(app)/products/components/CatalogFiltersSidebar";
import CatalogEmptyState from "@/components/storefront/catalog/CatalogEmptyState";
import CatalogLoadingGrid from "@/components/storefront/catalog/CatalogLoadingGrid";
import CatalogPagination from "@/components/storefront/catalog/CatalogPagination";
import CatalogTopBar from "@/app/(app)/products/components/CatalogCategoryTabs";

type BuildIssue = {
  level: CompatibilityLevel;
  message: string;
};

/* ─────────────────────────────── Styles ─────────────────────────────────── */
const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

  .pcb-root, .pcb-root * { font-family: 'DM Sans', system-ui, sans-serif; box-sizing: border-box; }

  .pcb-root ::-webkit-scrollbar { width: 3px; height: 3px; }
  .pcb-root ::-webkit-scrollbar-track { background: transparent; }
  .pcb-root ::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 4px; }
  .pcb-root ::-webkit-scrollbar-thumb:hover { background: #d4d4d8; }

  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  .scrollbar-hide::-webkit-scrollbar { display: none; }

  .pcb-layout {
    display: grid;
    grid-template-columns: 260px minmax(0, 1fr) 300px;
    grid-template-rows: 1fr;
    height: 100%;
    overflow: hidden;
    column-gap: 16px;
  }
  @media (max-width: 1279px) {
    .pcb-layout { grid-template-columns: 1fr; }
  }

  .pcb-card {
    transition: box-shadow 0.2s ease, transform 0.2s cubic-bezier(0.22,1,0.36,1), border-color 0.15s ease;
  }
  .pcb-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px -6px rgba(0,0,0,0.09), 0 3px 10px -3px rgba(0,0,0,0.05);
  }
  .pcb-card.selected {
    box-shadow: 0 0 0 2px #4f46e5, 0 8px 24px -6px rgba(79,70,229,0.15);
  }
  .pcb-img { transition: transform 0.45s cubic-bezier(0.34,1.56,0.64,1); }
  .pcb-card:hover .pcb-img { transform: scale(1.06); }

  .pcb-skeleton {
    background: linear-gradient(90deg, #f4f4f5 25%, #e4e4e7 50%, #f4f4f5 75%);
    background-size: 800px 100%;
    animation: shimmer 1.5s infinite;
  }
  @keyframes shimmer {
    from { background-position: -800px 0; }
    to   { background-position:  800px 0; }
  }

  .card-enter {
    animation: cardIn 0.38s cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .nav-item-active::before {
    content: '';
    position: absolute;
    left: 0; top: 50%; transform: translateY(-50%);
    width: 2px; height: 24px;
    background: #4f46e5;
    border-radius: 0 2px 2px 0;
  }

  .product-grid {
    display: grid;
    gap: 10px;
    grid-template-columns: repeat(2, 1fr);
  }
  @media (min-width: 700px)  { .product-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  @media (min-width: 1180px) { .product-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
  @media (min-width: 1520px) { .product-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); } }
  @media (min-width: 1820px) { .product-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); } }

  .mobile-bar {
    padding-bottom: max(12px, env(safe-area-inset-bottom));
  }
`;

/* ─────────────────────────────── Constants ──────────────────────────────── */
// Defined outside component — never recreated on render
const CORE_CATEGORIES: string[] = [
  CATEGORY_NAMES.PROCESSOR,
  CATEGORY_NAMES.MOTHERBOARD,
  CATEGORY_NAMES.RAM,
  CATEGORY_NAMES.GPU,
  CATEGORY_NAMES.STORAGE,
  CATEGORY_NAMES.PSU,
  CATEGORY_NAMES.CABINET,
  CATEGORY_NAMES.COOLER,
];

const CAT_ICONS: Record<string, React.ElementType> = {
  [CATEGORY_NAMES.PROCESSOR]: Cpu,
  [CATEGORY_NAMES.MOTHERBOARD]: Layers,
  [CATEGORY_NAMES.RAM]: HardDrive,
  [CATEGORY_NAMES.GPU]: Monitor,
  [CATEGORY_NAMES.STORAGE]: HardDrive,
  [CATEGORY_NAMES.PSU]: Zap,
  [CATEGORY_NAMES.CABINET]: Box,
  [CATEGORY_NAMES.COOLER]: Fan,
  [CATEGORY_NAMES.MONITOR]: Monitor,
  [CATEGORY_NAMES.PERIPHERAL]: Keyboard,
  [CATEGORY_NAMES.NETWORKING]: Wifi,
};

const CAT_SHORT: Record<string, string> = {
  [CATEGORY_NAMES.PROCESSOR]: "CPU",
  [CATEGORY_NAMES.MOTHERBOARD]: "Mobo",
  [CATEGORY_NAMES.RAM]: "RAM",
  [CATEGORY_NAMES.GPU]: "GPU",
  [CATEGORY_NAMES.STORAGE]: "SSD",
  [CATEGORY_NAMES.PSU]: "PSU",
  [CATEGORY_NAMES.CABINET]: "Case",
  [CATEGORY_NAMES.COOLER]: "Cooler",
};

const CAT_DESCRIPTIONS: Record<string, string> = {
  [CATEGORY_NAMES.PROCESSOR]: "The brain of your build - AMD or Intel.",
  [CATEGORY_NAMES.MOTHERBOARD]:
    "Connects everything. Must match your CPU socket.",
  [CATEGORY_NAMES.RAM]: "System memory. Must match your motherboard DDR type.",
  [CATEGORY_NAMES.GPU]: "Graphics card for gaming and creative work.",
  [CATEGORY_NAMES.STORAGE]: "NVMe SSDs for fast load times.",
  [CATEGORY_NAMES.PSU]: "Power supply - must handle your total wattage.",
  [CATEGORY_NAMES.CABINET]: "The case. Must fit your motherboard and GPU.",
  [CATEGORY_NAMES.COOLER]: "Keep your CPU cool under load.",
};

// Static animation variants — defined once outside component
const MOTION_SPRING = { type: "spring", stiffness: 400, damping: 30 } as const;
const MOTION_EASE_OUT = { duration: 0.4, ease: "easeOut" } as const;
const MOTION_FAST = { duration: 0.15 } as const;

/* ─────────────────────────────── Utilities ──────────────────────────────── */
// Combined single-pass wattage + PSU capacity to avoid two separate cart iterations
function estimatePowerStats(cart: CartItem[]): {
  wattage: number;
  psuCap: number | null;
} {
  let w = 50;
  let psuCap: number | null = null;
  for (const item of cart) {
    const s = specsToFlat(item.specs);
    if (sameCategory(item.category, CATEGORY_NAMES.PSU)) {
      const cap = Number(s.wattage);
      if (!isNaN(cap)) psuCap = cap;
    }
    const n = Number(s.wattage);
    if (!isNaN(n) && n > 0) {
      w += n * item.quantity;
      continue;
    }
    if (sameCategory(item.category, CATEGORY_NAMES.PROCESSOR)) w += 65;
    if (sameCategory(item.category, CATEGORY_NAMES.GPU)) w += 150;
    if (sameCategory(item.category, CATEGORY_NAMES.RAM)) w += 5 * item.quantity;
    if (sameCategory(item.category, CATEGORY_NAMES.STORAGE))
      w += 5 * item.quantity;
  }
  return { wattage: w, psuCap };
}

// Keep legacy helpers as thin wrappers for BuildSummaryPanel (no breaking changes)
function estimateWattage(cart: CartItem[]): number {
  return estimatePowerStats(cart).wattage;
}

// Legacy builder-specific filters (kept for internal compatibility helpers).
// The UI now uses the shared dynamic catalog filters, but these are still referenced
// by some internal utilities/components in this module.
type BuilderFilterState = {
  brands: string[];
  sockets: string[];
  coreTiers: string[];
  integratedGraphics: Array<"yes" | "no">;
  tdpBands: string[];
  priceRange: [number, number] | null;
};

type ProductFacts = {
  brand: string;
  price: number;
  socket: string;
  coreCount: number | null;
  coreTier: string;
  integratedGraphics: "yes" | "no" | "";
  tdp: number | null;
  tdpBand: string;
  generation: string;
};

const DEFAULT_FILTERS: BuilderFilterState = {
  brands: [],
  sockets: [],
  coreTiers: [],
  integratedGraphics: [],
  tdpBands: [],
  priceRange: null,
};

const CORE_TIER_LABELS: Record<string, string> = {
  entry: "Entry (up to 6 cores)",
  mainstream: "Mainstream (8-10 cores)",
  enthusiast: "Enthusiast (12-16 cores)",
  workstation: "Workstation (18+ cores)",
};

const TDP_BAND_LABELS: Record<string, string> = {
  low: "Low power (up to 65W)",
  balanced: "Balanced (66W-120W)",
  high: "High power (121W+)",
};

type PricePreset = {
  id: string;
  label: string;
  min?: number;
  max?: number;
};

const PRICE_PRESETS: PricePreset[] = [
  { id: "budget", label: "Under 10k", max: 10000 },
  { id: "mid", label: "10k - 25k", min: 10000, max: 25000 },
  { id: "upper", label: "25k - 50k", min: 25000, max: 50000 },
  { id: "premium", label: "50k+", min: 50000 },
];

function getPrice(product: Product): number {
  return Number(product.variants?.[0]?.price ?? 0);
}

function getSpecText(product: Product, ...keys: string[]): string {
  const flat = specsToFlat(product.specs);
  for (const key of keys) {
    const value = flat[key];
    if (value === null || value === undefined || value === "") continue;
    return Array.isArray(value) ? value.join(", ") : String(value);
  }
  return "";
}

function getNumericSpec(product: Product, ...keys: string[]): number | null {
  const text = getSpecText(product, ...keys);
  if (!text) return null;
  const match = text.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function getBooleanLikeSpec(
  product: Product,
  ...keys: string[]
): "yes" | "no" | "" {
  const raw = getSpecText(product, ...keys)
    .trim()
    .toLowerCase();
  if (!raw) return "";
  if (["yes", "true", "supported", "available", "included"].includes(raw))
    return "yes";
  if (["no", "false", "none", "na", "n/a", "not supported"].includes(raw))
    return "no";
  if (
    raw.includes("yes") ||
    raw.includes("intel uhd") ||
    raw.includes("radeon graphics")
  )
    return "yes";
  if (raw.includes("no")) return "no";
  return "";
}

function deriveCoreTier(coreCount: number | null): string {
  if (!coreCount || coreCount <= 0) return "";
  if (coreCount <= 6) return "entry";
  if (coreCount <= 10) return "mainstream";
  if (coreCount <= 16) return "enthusiast";
  return "workstation";
}

function deriveTdpBand(tdp: number | null): string {
  if (!tdp || tdp <= 0) return "";
  if (tdp <= 65) return "low";
  if (tdp <= 120) return "balanced";
  return "high";
}

function deriveProductFacts(product: Product): ProductFacts {
  const coreCount = getNumericSpec(product, "cores", "coreCount", "cpuCores");
  const tdp = getNumericSpec(product, "tdp", "wattage", "powerDraw");
  return {
    brand: product.brand?.name ?? getSpecText(product, "brand"),
    price: getPrice(product),
    socket: getSpecText(product, "socket", "cpuSocket", "supportedSocket"),
    coreCount,
    coreTier: deriveCoreTier(coreCount),
    integratedGraphics: getBooleanLikeSpec(
      product,
      "integratedGraphics",
      "igpu",
      "integratedGpu",
    ),
    tdp,
    tdpBand: deriveTdpBand(tdp),
    generation: getSpecText(
      product,
      "generation",
      "series",
      "platform",
      "architecture",
    ),
  };
}

function matchesBuilderFilters(
  facts: ProductFacts,
  filters: BuilderFilterState,
): boolean {
  const [minPrice, maxPrice] = filters.priceRange ?? [null, null];
  if (minPrice !== null && maxPrice !== null) {
    if (facts.price < minPrice || facts.price > maxPrice) return false;
  }

  if (filters.brands.length > 0) {
    if (!facts.brand || !filters.brands.includes(facts.brand)) return false;
  }

  if (filters.sockets.length > 0) {
    if (!facts.socket || !filters.sockets.includes(facts.socket)) return false;
  }

  if (filters.coreTiers.length > 0) {
    if (!facts.coreTier || !filters.coreTiers.includes(facts.coreTier))
      return false;
  }

  if (filters.integratedGraphics.length > 0) {
    if (!facts.integratedGraphics) return false;
    if (!filters.integratedGraphics.includes(facts.integratedGraphics))
      return false;
  }

  if (filters.tdpBands.length > 0) {
    if (!facts.tdpBand || !filters.tdpBands.includes(facts.tdpBand))
      return false;
  }

  return true;
}

function normalizeSpecText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(",").toLowerCase();
  return String(value).trim().toLowerCase();
}

function getMemoryTypeFromSpecs(specs: CartItem["specs"]): string {
  const flat = specsToFlat(specs);
  return normalizeSpecText(flat.memoryType ?? flat.ramType);
}

function validateBuild(items: CartItem[] = []): {
  status: CompatibilityLevel;
  issues: BuildIssue[];
} {
  const issues: BuildIssue[] = [];
  const cpu = items.find((i) =>
    sameCategory(i.category, CATEGORY_NAMES.PROCESSOR),
  );
  const mobo = items.find((i) =>
    sameCategory(i.category, CATEGORY_NAMES.MOTHERBOARD),
  );
  const ram = items.find((i) => sameCategory(i.category, CATEGORY_NAMES.RAM));
  const { wattage, psuCap } = estimatePowerStats(items);

  if (cpu && mobo) {
    const cpuSocket = normalizeSpecText(specsToFlat(cpu.specs).socket);
    const moboSocket = normalizeSpecText(specsToFlat(mobo.specs).socket);
    if (cpuSocket && moboSocket && cpuSocket !== moboSocket) {
      issues.push({
        level: CompatibilityLevel.INCOMPATIBLE,
        message: "CPU socket does not match motherboard socket.",
      });
    }
  }

  if (ram && (mobo || cpu)) {
    const ramType = getMemoryTypeFromSpecs(ram.specs);
    const moboRamType = mobo ? getMemoryTypeFromSpecs(mobo.specs) : "";
    const cpuRamType = cpu ? getMemoryTypeFromSpecs(cpu.specs) : "";
    const expectedRamType = moboRamType || cpuRamType;
    if (ramType && expectedRamType && ramType !== expectedRamType) {
      issues.push({
        level: CompatibilityLevel.INCOMPATIBLE,
        message: "RAM type does not match motherboard/CPU supported type.",
      });
    }
  }

  if (psuCap !== null) {
    if (wattage > psuCap) {
      issues.push({
        level: CompatibilityLevel.INCOMPATIBLE,
        message: `Estimated ${wattage}W exceeds PSU capacity (${psuCap}W).`,
      });
    } else if (wattage > psuCap * 0.8) {
      issues.push({
        level: CompatibilityLevel.WARNING,
        message: `Estimated ${wattage}W is close to PSU capacity (${psuCap}W).`,
      });
    }
  }

  const status = issues.some((i) => i.level === CompatibilityLevel.INCOMPATIBLE)
    ? CompatibilityLevel.INCOMPATIBLE
    : issues.length > 0
      ? CompatibilityLevel.WARNING
      : CompatibilityLevel.COMPATIBLE;

  return { status, issues };
}

async function fetchViewerRole(signal?: AbortSignal): Promise<Role | null> {
  try {
    const res = await fetch("/api/auth/session", { signal, cache: "no-store" });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    return (data as { user?: { role?: Role | null } })?.user?.role ?? null;
  } catch {
    return null;
  }
}

/* ─────────────────────────────── AnimatedPrice ──────────────────────────── */
const AnimatedPrice: React.FC<{ value: number }> = memo(({ value }) => {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current;
    if (from === value) return;
    let step = 0;
    const id = setInterval(() => {
      step++;
      const t = step / 20;
      const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      setDisplay(Math.round(from + (value - from) * e));
      if (step >= 20) {
        clearInterval(id);
        prev.current = value;
      }
    }, 16);
    return () => clearInterval(id);
  }, [value]);
  return <>₹{display.toLocaleString("en-IN")}</>;
});
AnimatedPrice.displayName = "AnimatedPrice";

/* ─────────────────────────────── ProductCard ────────────────────────────── */
// memo prevents re-render when unrelated cart items change
const ProductCard: React.FC<{
  product: Product;
  isInCart: boolean;
  compatibility: CompatibilityLevel;
  compatMessage?: string;
  onAdd: () => void;
  onRemove: () => void;
  index: number;
}> = memo(
  ({
    product,
    isInCart,
    compatibility,
    compatMessage,
    onAdd,
    onRemove,
    index,
  }) => {
    const price = product.variants?.[0]?.price || 0;
    const compareAt = product.variants?.[0]?.compareAtPrice;
    const status = String(product.variants?.[0]?.status ?? "");
    const coreCount = getNumericSpec(product, "cores", "coreCount", "cpuCores");
    const socket = getSpecText(
      product,
      "socket",
      "cpuSocket",
      "supportedSocket",
    );
    const generation = getSpecText(
      product,
      "generation",
      "series",
      "platform",
      "architecture",
    );

    const isOos = status === "OUT_OF_STOCK";
    const isLowStock = status === "LOW_STOCK";
    const isIncompat = compatibility === CompatibilityLevel.INCOMPATIBLE;
    const isWarning = compatibility === CompatibilityLevel.WARNING;

    const keySpecsLine = useMemo(() => {
      const coresLabel =
        typeof coreCount === "number" && !Number.isNaN(coreCount)
          ? `${coreCount} cores`
          : "Cores —";
      const socketLabel = socket ? socket : "Socket —";
      const generationLabel = generation ? generation : "Gen —";
      return `${coresLabel} · ${socketLabel} · ${generationLabel}`;
    }, [coreCount, socket, generation]);

    const discount = useMemo(
      () =>
        compareAt && compareAt > price
          ? Math.round((1 - price / compareAt) * 100)
          : null,
      [price, compareAt],
    );

    const compatDotClass = isIncompat
      ? "bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]"
      : isWarning
        ? "bg-amber-400 shadow-[0_0_4px_rgba(245,158,11,0.4)]"
        : "bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.4)]";

    const compatLabel = isIncompat
      ? "Incompatible"
      : isWarning
        ? "Check specs"
        : "Compatible";

    // Stable event handlers — no inline arrow functions in JSX
    const handleCardClick = useCallback(() => {
      if (isInCart) {
        onRemove();
        return;
      }
      if (!isIncompat && !isOos) onAdd();
    }, [isInCart, isIncompat, isOos, onAdd, onRemove]);

    const handleButtonClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isInCart) {
          onRemove();
          return;
        }
        if (!isIncompat && !isOos) {
          onAdd();
        }
      },
      [isInCart, isIncompat, isOos, onAdd, onRemove],
    );

    return (
      <article
        className={`pcb-card card-enter bg-white border rounded-lg overflow-hidden flex flex-col h-full relative cursor-pointer
                ${isInCart ? "selected border-indigo-200" : "border-zinc-200 hover:border-zinc-300"}
                ${isIncompat && !isInCart ? "opacity-50" : ""}`}
        style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
        onClick={handleCardClick}
      >
        {/* IMAGE */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-zinc-50 to-stone-100 flex items-center justify-center p-2 overflow-hidden flex-shrink-0">
          <Link
            href={`/products/${product.id}`}
            className="absolute inset-0 z-0"
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
          >
            <span className="sr-only">View {product.name}</span>
          </Link>

          <div className="relative w-full h-full">
            <Image
              src={product.media?.[0]?.url || "/placeholder.png"}
              alt={product.name}
              fill
              className="object-contain mix-blend-multiply pointer-events-none"
              sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, 200px"
              loading="lazy"
            />
          </div>

          {/* badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {isOos && (
              <span className="bg-red-500 text-white text-[8px] sm:text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                Out of Stock
              </span>
            )}
            {isLowStock && !isOos && (
              <span className="bg-amber-500 text-white text-[8px] sm:text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                Low Stock
              </span>
            )}
            {discount && !isOos && (
              <span className="bg-indigo-600 text-white text-[8px] sm:text-[9px] font-bold px-2 py-0.5 rounded-full">
                -{discount}%
              </span>
            )}
          </div>

          {!isInCart && (
            <div
              className={`absolute bottom-2 right-2 w-2 h-2 rounded-full z-10 ${compatDotClass}`}
              title={compatLabel}
            />
          )}
        </div>

        {/* CONTENT */}
        <div className="p-3 flex flex-col flex-1 min-h-0">
          <p
            className={`text-[9px] font-bold uppercase tracking-widest mb-1 truncate ${
              isInCart ? "text-indigo-500" : "text-zinc-400"
            }`}
          >
            {CATEGORY_LABELS[product.category] || product.category}
          </p>

          <Link
            href={`/products/${product.id}`}
            onClick={(e) => e.stopPropagation()}
            className="block mb-1"
          >
            <h3 className="font-semibold text-zinc-900 text-[12px] leading-snug line-clamp-2 min-h-[34px] hover:text-indigo-600">
              {product.name}
            </h3>
          </Link>

          <p className="text-[9px] sm:text-[10px] text-zinc-400 truncate mb-0.5 sm:mb-1 leading-none">
            {keySpecsLine}
          </p>

          {compatMessage && !isInCart && (isIncompat || isWarning) && (
            <p
              className={`text-[8px] pt-1 sm:text-[9px] leading-snug px-2 py-1 rounded-lg mb-0.5 sm:mb-1 ${
                isIncompat
                  ? "bg-red-50 text-red-600 border border-red-100"
                  : "bg-amber-50 text-amber-700 border border-amber-100"
              }`}
            >
              {compatMessage}
            </p>
          )}

          {/* FOOTER */}
          <div className="mt-auto border-t border-zinc-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
            <div className="min-w-0 flex-1">
              <span className="text-xs sm:text-sm font-bold text-zinc-900 tabular-nums">
                ₹{price.toLocaleString("en-IN")}
              </span>
              {compareAt && compareAt > price && (
                <span className="ml-1 text-[8px] sm:text-[9px] text-zinc-400 line-through">
                  ₹{compareAt.toLocaleString("en-IN")}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleButtonClick}
              disabled={(isIncompat && !isInCart) || (isOos && !isInCart)}
              className={`flex-shrink-0 h-6 sm:h-7 px-2 sm:px-3 rounded-lg sm:rounded-xl
                        text-[9px] sm:text-[10px] font-bold uppercase tracking-wide
                        flex items-center justify-center gap-1
                        w-full sm:w-auto transition-all duration-200
                        ${
                          isInCart
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-red-50 hover:text-red-600"
                            : isOos || isIncompat
                              ? "bg-zinc-50 text-zinc-300 cursor-not-allowed border"
                              : "bg-zinc-900 text-white hover:bg-indigo-600"
                        }`}
            >
              {isInCart ? (
                <>
                  <X size={9} strokeWidth={3} />
                  Remove
                </>
              ) : isOos ? (
                "Sold Out"
              ) : (
                <>
                  <Plus size={9} strokeWidth={3} />
                  Select
                </>
              )}
            </button>
          </div>
        </div>
      </article>
    );
  },
);
ProductCard.displayName = "ProductCard";

/* ─────────────────────────────── BuildSummaryPanel ──────────────────────── */
const BuildSummaryPanel: React.FC<{
  cart: CartItem[];
  onRemove: (id: string) => void;
  onStepClick: (cat: string) => void;
  activeStep: string;
  onSave?: () => void;
  onShare?: () => void;
  onCheckout: () => void;
}> = memo(
  ({
    cart,
    onRemove,
    onStepClick,
    activeStep,
    onSave,
    onShare,
    onCheckout,
  }) => {
    const report = useMemo(() => validateBuild(cart), [cart]);
    const totalPrice = useMemo(
      () =>
        cart.reduce(
          (s, i) => s + (i.selectedVariant?.price || 0) * i.quantity,
          0,
        ),
      [cart],
    );
    // Single pass instead of two separate calls
    const completedCount = useMemo(
      () =>
        CORE_CATEGORIES.filter((cat) =>
          cart.some((i) => sameCategory(i.category, cat)),
        ).length,
      [cart],
    );
    const progressPct = (completedCount / CORE_CATEGORIES.length) * 100;

    return (
      <div className="flex flex-col h-full bg-white border-l border-zinc-100">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-zinc-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Build Summary
            </h3>
            {(onSave || onShare) && (
              <div className="flex items-center gap-1">
                {onSave && (
                  <button
                    onClick={onSave}
                    className="w-7 h-7 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-all"
                    title="Save build"
                  >
                    <Save size={13} />
                  </button>
                )}
                {onShare && (
                  <button
                    onClick={onShare}
                    className="w-7 h-7 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-all"
                    title="Share build"
                  >
                    <Share2 size={13} />
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-0.5">
              Estimated Total
            </p>
            <p className="text-2xl font-bold text-zinc-900 tracking-tight">
              <AnimatedPrice value={totalPrice} />
            </p>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-zinc-400 font-medium">
                {completedCount}/{CORE_CATEGORIES.length} components
              </span>
              <span className="text-[10px] font-bold text-indigo-500">
                {Math.round(progressPct)}%
              </span>
            </div>
            <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-indigo-500 rounded-full"
                animate={{ width: `${progressPct}%` }}
                transition={MOTION_EASE_OUT}
              />
            </div>
          </div>
        </div>

        {/* Component rows */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
          {CORE_CATEGORIES.map((cat) => {
            const item = cart.find((i) => sameCategory(i.category, cat));
            const isActive = sameCategory(activeStep, cat);
            const CatIcon = CAT_ICONS[cat] || Box;

            return (
              <div
                key={cat}
                role="button"
                tabIndex={0}
                onClick={() => onStepClick(cat)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onStepClick(cat);
                }}
                className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer transition-all outline-none select-none ${
                  isActive
                    ? "bg-indigo-50 border border-indigo-100"
                    : "hover:bg-zinc-50 border border-transparent"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    item
                      ? "bg-indigo-100"
                      : isActive
                        ? "bg-indigo-50"
                        : "bg-zinc-100"
                  }`}
                >
                  {item ? (
                    <Check
                      size={13}
                      strokeWidth={2.5}
                      className="text-indigo-600"
                    />
                  ) : (
                    <CatIcon
                      size={13}
                      className={isActive ? "text-indigo-500" : "text-zinc-400"}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      item
                        ? "text-zinc-900"
                        : isActive
                          ? "text-indigo-600"
                          : "text-zinc-400"
                    }`}
                  >
                    {CAT_SHORT[cat] || CATEGORY_LABELS[cat]}
                  </p>
                  <p
                    className={`text-[11px] truncate leading-none mt-0.5 ${
                      item ? "text-zinc-500" : "text-zinc-300 italic"
                    }`}
                  >
                    {item ? item.name : "Not selected"}
                  </p>
                </div>

                {item ? (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[11px] font-bold text-zinc-700 tabular-nums">
                      ₹
                      {(
                        (item.selectedVariant?.price || 0) * item.quantity
                      ).toLocaleString("en-IN")}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${item.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(item.id);
                      }}
                      className="w-5 h-5 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                    >
                      <X size={10} strokeWidth={2.5} />
                    </button>
                  </div>
                ) : (
                  <ChevronRight
                    size={12}
                    className={`flex-shrink-0 transition-colors ${
                      isActive
                        ? "text-indigo-400"
                        : "text-zinc-200 group-hover:text-zinc-400"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Compat issues */}
        <AnimatePresence>
          {report.issues.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-3 space-y-1.5 flex-shrink-0 border-t border-zinc-100"
            >
              {report.issues.slice(0, 2).map((issue, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 px-2.5 py-1.5 rounded-xl text-[10px] leading-snug ${
                    issue.level === CompatibilityLevel.INCOMPATIBLE
                      ? "bg-red-50 text-red-700 border border-red-100"
                      : "bg-amber-50 text-amber-700 border border-amber-100"
                  }`}
                >
                  {issue.level === CompatibilityLevel.INCOMPATIBLE ? (
                    <AlertOctagon size={11} className="flex-shrink-0 mt-px" />
                  ) : (
                    <AlertTriangle size={11} className="flex-shrink-0 mt-px" />
                  )}
                  {issue.message}
                </div>
              ))}
              {report.issues.length > 2 && (
                <p className="text-[10px] text-zinc-400 pl-1">
                  +{report.issues.length - 2} more issues
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Checkout CTA */}
        <div className="px-4 pb-4 pt-3 flex-shrink-0 border-t border-zinc-100">
          <button
            type="button"
            onClick={onCheckout}
            disabled={cart.length === 0}
            className="w-full h-10 flex items-center justify-center gap-2 bg-zinc-900 text-white text-xs font-bold rounded-2xl hover:bg-indigo-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <ShoppingCart size={14} />
            View Build ({cart.length})
          </button>
        </div>
      </div>
    );
  },
);
BuildSummaryPanel.displayName = "BuildSummaryPanel";

/* ─────────────────────────────── SaveDialog ─────────────────────────────── */
const SaveDialog: React.FC<{
  onClose: () => void;
  onSave: (title: string) => Promise<void>;
}> = memo(({ onClose, onSave }) => {
  const [title, setTitle] = useState("");

  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && title.trim()) {
        await onSave(title);
        onClose();
      }
    },
    [title, onSave, onClose],
  );

  const handleSave = useCallback(async () => {
    if (title.trim()) {
      await onSave(title);
      onClose();
    }
  }, [title, onSave, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={MOTION_SPRING}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-5 w-full max-w-xs shadow-2xl border border-zinc-100"
      >
        <h3 className="text-sm font-bold text-zinc-900 mb-1">Save Build</h3>
        <p className="text-xs text-zinc-400 mb-4">
          Give your build a memorable name.
        </p>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Gaming Beast 2025"
          className="w-full h-9 px-3 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition mb-3"
          onKeyDown={handleKeyDown}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-9 text-sm font-medium border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex-1 h-9 text-sm font-bold rounded-xl bg-zinc-900 text-white hover:bg-indigo-600 transition-colors disabled:opacity-40"
          >
            Save Build
          </button>
        </div>
      </motion.div>
    </div>
  );
});
SaveDialog.displayName = "SaveDialog";

/* ─────────────────────────────── Left Nav Item ──────────────────────────── */
const NavItem: React.FC<{
  cat: string;
  isActive: boolean;
  isCompleted: boolean;
  onClick: () => void;
}> = memo(({ cat, isActive, isCompleted, onClick }) => {
  const CatIcon = CAT_ICONS[cat] || Box;
  return (
    <button
      type="button"
      onClick={onClick}
      title={CATEGORY_LABELS[cat] || cat}
      className={`relative group w-full flex flex-col items-center gap-1 py-2.5 transition-all ${
        isActive ? "nav-item-active" : ""
      }`}
    >
      <div
        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
          isActive
            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
            : isCompleted
              ? "bg-emerald-50 text-emerald-600 group-hover:bg-indigo-50 group-hover:text-indigo-600"
              : "bg-zinc-50 text-zinc-400 group-hover:bg-zinc-100 group-hover:text-zinc-700"
        }`}
      >
        {isCompleted && !isActive ? (
          <Check size={16} strokeWidth={2.5} />
        ) : (
          <CatIcon size={16} />
        )}
      </div>
      <span
        className={`text-[9px] font-bold uppercase tracking-tight leading-none ${
          isActive
            ? "text-indigo-600"
            : isCompleted
              ? "text-emerald-600"
              : "text-zinc-400"
        }`}
      >
        {CAT_SHORT[cat] || "Part"}
      </span>
    </button>
  );
});
NavItem.displayName = "NavItem";

/* ═══════════════════════════════════════════════════════════════════════════
   SKELETON LIST — stable reference, never re-created
═══════════════════════════════════════════════════════════════════════════ */
/* ─────────────────────────────── Filters Sidebar ────────────────────────── */
type BuilderFiltersSidebarProps = {
  facts: ProductFacts[];
  filters: BuilderFilterState;
  onChangeFilters: (next: BuilderFilterState) => void;
  onClearAll: () => void;
  priceBounds: { min: number; max: number };
  resultCount: number;
};

function BuilderFiltersSidebar({
  facts,
  filters,
  onChangeFilters,
  onClearAll,
  priceBounds,
  resultCount,
}: BuilderFiltersSidebarProps) {
  const countMatches = useCallback(
    (next: BuilderFilterState) =>
      facts.reduce(
        (acc, f) => acc + (matchesBuilderFilters(f, next) ? 1 : 0),
        0,
      ),
    [facts],
  );

  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    for (const f of facts) if (f.brand) set.add(f.brand);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [facts]);

  const availableSockets = useMemo(() => {
    const set = new Set<string>();
    for (const f of facts) if (f.socket) set.add(f.socket);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [facts]);

  const availableCoreTiers = useMemo(() => {
    const set = new Set<string>();
    for (const f of facts) if (f.coreTier) set.add(f.coreTier);
    return Array.from(set);
  }, [facts]);

  const availableTdpBands = useMemo(() => {
    const set = new Set<string>();
    for (const f of facts) if (f.tdpBand) set.add(f.tdpBand);
    return Array.from(set);
  }, [facts]);

  const sliderMin = filters.priceRange?.[0] ?? priceBounds.min;
  const sliderMax = filters.priceRange?.[1] ?? priceBounds.max;
  const priceStep = Math.max(
    100,
    Math.round((priceBounds.max - priceBounds.min) / 20 / 100) * 100,
  );

  const applyPriceRange = useCallback(
    (nextMin: number, nextMax: number) => {
      const clear =
        nextMin <= priceBounds.min &&
        Math.max(nextMin, nextMax) >= priceBounds.max;

      onChangeFilters({
        ...filters,
        priceRange: clear ? null : ([nextMin, nextMax] as [number, number]),
      });
    },
    [filters, onChangeFilters, priceBounds.max, priceBounds.min],
  );

  const toggleArrayValue = useCallback(
    <T extends string>(
      key: keyof BuilderFilterState,
      value: T,
      current: T[],
    ) => {
      const isSelected = current.includes(value);
      const nextValues = isSelected
        ? current.filter((v) => v !== value)
        : [...current, value];
      onChangeFilters({ ...filters, [key]: nextValues } as BuilderFilterState);
    },
    [filters, onChangeFilters],
  );

  const setIntegrated = useCallback(
    (value: "yes" | "no") => {
      const current = filters.integratedGraphics;
      const isSelected = current.includes(value);
      const nextValues = isSelected
        ? current.filter((v) => v !== value)
        : [...current, value];
      onChangeFilters({ ...filters, integratedGraphics: nextValues });
    },
    [filters, onChangeFilters],
  );

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-4 py-3 border-b border-zinc-100 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Filters
            </p>
            <p className="text-xs font-semibold text-zinc-700">
              {resultCount.toLocaleString()} results
            </p>
          </div>
          <button
            type="button"
            onClick={onClearAll}
            className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 transition-colors"
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-2">
          {/* Price range */}
          <details className="border border-zinc-100 rounded-xl bg-white" open>
            <summary className="cursor-pointer px-3 py-3 flex items-center justify-between gap-3 select-none">
              <span className="text-xs font-bold text-zinc-800">
                Price range
              </span>
              <span className="text-[11px] text-zinc-400 font-semibold">
                {filters.priceRange
                  ? `₹${filters.priceRange[0] / 1000}k - ₹${filters.priceRange[1] / 1000}k`
                  : "Any"}
              </span>
            </summary>
            <div className="px-3 pb-3 pt-1">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      aria-label="Minimum price"
                      type="range"
                      min={priceBounds.min}
                      max={priceBounds.max}
                      step={priceStep}
                      value={sliderMin}
                      onChange={(e) => {
                        const nextMin = Math.min(
                          Number(e.target.value),
                          sliderMax,
                        );
                        applyPriceRange(nextMin, sliderMax);
                      }}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div className="w-16 text-[11px] font-bold text-zinc-800 text-right tabular-nums">
                    {sliderMin === priceBounds.min && !filters.priceRange
                      ? "Any"
                      : `₹${sliderMin.toLocaleString("en-IN")}`}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      aria-label="Maximum price"
                      type="range"
                      min={priceBounds.min}
                      max={priceBounds.max}
                      step={priceStep}
                      value={sliderMax}
                      onChange={(e) => {
                        const nextMax = Math.max(
                          Number(e.target.value),
                          sliderMin,
                        );
                        applyPriceRange(sliderMin, nextMax);
                      }}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div className="w-16 text-[11px] font-bold text-zinc-800 text-right tabular-nums">
                    {sliderMax === priceBounds.max && !filters.priceRange
                      ? "Any"
                      : `₹${sliderMax.toLocaleString("en-IN")}`}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {PRICE_PRESETS.map((preset) => {
                    const presetMin =
                      typeof preset.min === "number"
                        ? preset.min
                        : priceBounds.min;
                    const presetMax =
                      typeof preset.max === "number"
                        ? preset.max
                        : priceBounds.max;
                    const nextMin = Math.max(priceBounds.min, presetMin);
                    const nextMax = Math.min(priceBounds.max, presetMax);
                    const nextRange: [number, number] = [nextMin, nextMax];
                    const nextPriceState =
                      nextMin <= priceBounds.min && nextMax >= priceBounds.max
                        ? null
                        : nextRange;
                    const isActive = filters.priceRange
                      ? filters.priceRange[0] === nextMin &&
                        filters.priceRange[1] === nextMax
                      : nextPriceState === null;
                    const count = countMatches({
                      ...filters,
                      priceRange: nextPriceState,
                    });
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          if (nextPriceState === null) {
                            onChangeFilters({ ...filters, priceRange: null });
                          } else {
                            applyPriceRange(nextMin, nextMax);
                          }
                        }}
                        className={`rounded-lg border px-2 py-1 text-[11px] font-bold transition-colors flex items-center justify-between gap-2 ${
                          isActive
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                            : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                        }`}
                      >
                        <span className="truncate">{preset.label}</span>
                        <span className="text-[11px] text-zinc-500 tabular-nums">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </details>

          {/* Brand */}
          <details className="border border-zinc-100 rounded-xl bg-white" open>
            <summary className="cursor-pointer px-3 py-3 flex items-center justify-between gap-3 select-none">
              <span className="text-xs font-bold text-zinc-800">Brand</span>
              <span className="text-[11px] text-zinc-400 font-semibold">
                {filters.brands.length > 0
                  ? `${filters.brands.length} selected`
                  : "Any"}
              </span>
            </summary>
            <div className="px-3 pb-3 pt-1 space-y-1.5">
              {availableBrands.length === 0 ? (
                <p className="text-[11px] text-zinc-400 px-1">
                  No brands available for this selection.
                </p>
              ) : (
                availableBrands.map((brand) => {
                  const selected = filters.brands.includes(brand);
                  const nextBrands = selected
                    ? filters.brands
                    : [...filters.brands, brand];
                  const count = countMatches({
                    ...filters,
                    brands: nextBrands,
                  });
                  return (
                    <label
                      key={brand}
                      className="flex items-center justify-between gap-3 text-[11px] font-semibold rounded-lg px-2 py-1.5 hover:bg-zinc-50 cursor-pointer border border-transparent"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() =>
                            toggleArrayValue("brands", brand, filters.brands)
                          }
                          className="accent-indigo-600"
                        />
                        <span className="truncate">{brand}</span>
                      </span>
                      <span className="text-[11px] text-zinc-400 tabular-nums">
                        {count}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </details>

          {/* Socket / Compatibility */}
          <details className="border border-zinc-100 rounded-xl bg-white">
            <summary className="cursor-pointer px-3 py-3 flex items-center justify-between gap-3 select-none">
              <span className="text-xs font-bold text-zinc-800">
                Socket / compatibility
              </span>
              <span className="text-[11px] text-zinc-400 font-semibold">
                {filters.sockets.length > 0
                  ? `${filters.sockets.length} selected`
                  : "Any"}
              </span>
            </summary>
            <div className="px-3 pb-3 pt-1 space-y-1.5">
              {availableSockets.length === 0 ? (
                <p className="text-[11px] text-zinc-400 px-1">
                  No sockets available for this selection.
                </p>
              ) : (
                availableSockets.slice(0, 26).map((socket) => {
                  const selected = filters.sockets.includes(socket);
                  const nextSockets = selected
                    ? filters.sockets
                    : [...filters.sockets, socket];
                  const count = countMatches({
                    ...filters,
                    sockets: nextSockets,
                  });
                  return (
                    <label
                      key={socket}
                      className="flex items-center justify-between gap-3 text-[11px] font-semibold rounded-lg px-2 py-1.5 hover:bg-zinc-50 cursor-pointer border border-transparent"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() =>
                            toggleArrayValue("sockets", socket, filters.sockets)
                          }
                          className="accent-indigo-600"
                        />
                        <span className="truncate">{socket}</span>
                      </span>
                      <span className="text-[11px] text-zinc-400 tabular-nums">
                        {count}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </details>

          {/* Core count / performance tier */}
          <details className="border border-zinc-100 rounded-xl bg-white">
            <summary className="cursor-pointer px-3 py-3 flex items-center justify-between gap-3 select-none">
              <span className="text-xs font-bold text-zinc-800">
                Core count / performance tier
              </span>
              <span className="text-[11px] text-zinc-400 font-semibold">
                {filters.coreTiers.length > 0
                  ? `${filters.coreTiers.length} selected`
                  : "Any"}
              </span>
            </summary>
            <div className="px-3 pb-3 pt-1 space-y-1.5">
              {Object.entries(CORE_TIER_LABELS)
                .filter(([tier]) => availableCoreTiers.includes(tier))
                .map(([tier, label]) => {
                  const selected = filters.coreTiers.includes(tier);
                  const nextCoreTiers = selected
                    ? filters.coreTiers
                    : [...filters.coreTiers, tier];
                  const count = countMatches({
                    ...filters,
                    coreTiers: nextCoreTiers,
                  });
                  return (
                    <label
                      key={tier}
                      className="flex items-center justify-between gap-3 text-[11px] font-semibold rounded-lg px-2 py-1.5 hover:bg-zinc-50 cursor-pointer border border-transparent"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() =>
                            toggleArrayValue(
                              "coreTiers",
                              tier,
                              filters.coreTiers,
                            )
                          }
                          className="accent-indigo-600"
                        />
                        <span className="truncate">{label}</span>
                      </span>
                      <span className="text-[11px] text-zinc-400 tabular-nums">
                        {count}
                      </span>
                    </label>
                  );
                })}
            </div>
          </details>

          {/* Integrated graphics */}
          <details className="border border-zinc-100 rounded-xl bg-white">
            <summary className="cursor-pointer px-3 py-3 flex items-center justify-between gap-3 select-none">
              <span className="text-xs font-bold text-zinc-800">
                Integrated graphics
              </span>
              <span className="text-[11px] text-zinc-400 font-semibold">
                {filters.integratedGraphics.length > 0
                  ? `${filters.integratedGraphics.length} selected`
                  : "Any"}
              </span>
            </summary>
            <div className="px-3 pb-3 pt-1 space-y-1.5">
              {(["yes", "no"] as const).map((value) => {
                const selected = filters.integratedGraphics.includes(value);
                const nextValues = selected
                  ? filters.integratedGraphics
                  : [...filters.integratedGraphics, value];
                const count = countMatches({
                  ...filters,
                  integratedGraphics: nextValues,
                });
                return (
                  <label
                    key={value}
                    className="flex items-center justify-between gap-3 text-[11px] font-semibold rounded-lg px-2 py-1.5 hover:bg-zinc-50 cursor-pointer border border-transparent"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => setIntegrated(value)}
                        className="accent-indigo-600"
                      />
                      <span className="truncate">
                        {value === "yes" ? "Yes" : "No"}
                      </span>
                    </span>
                    <span className="text-[11px] text-zinc-400 tabular-nums">
                      {count}
                    </span>
                  </label>
                );
              })}
            </div>
          </details>

          {/* TDP / power usage */}
          <details className="border border-zinc-100 rounded-xl bg-white">
            <summary className="cursor-pointer px-3 py-3 flex items-center justify-between gap-3 select-none">
              <span className="text-xs font-bold text-zinc-800">
                TDP / power usage
              </span>
              <span className="text-[11px] text-zinc-400 font-semibold">
                {filters.tdpBands.length > 0
                  ? `${filters.tdpBands.length} selected`
                  : "Any"}
              </span>
            </summary>
            <div className="px-3 pb-3 pt-1 space-y-1.5">
              {Object.entries(TDP_BAND_LABELS)
                .filter(([band]) => availableTdpBands.includes(band))
                .map(([band, label]) => {
                  const selected = filters.tdpBands.includes(band);
                  const nextTdpBands = selected
                    ? filters.tdpBands
                    : [...filters.tdpBands, band];
                  const count = countMatches({
                    ...filters,
                    tdpBands: nextTdpBands,
                  });
                  return (
                    <label
                      key={band}
                      className="flex items-center justify-between gap-3 text-[11px] font-semibold rounded-lg px-2 py-1.5 hover:bg-zinc-50 cursor-pointer border border-transparent"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() =>
                            toggleArrayValue("tdpBands", band, filters.tdpBands)
                          }
                          className="accent-indigo-600"
                        />
                        <span className="truncate">{label}</span>
                      </span>
                      <span className="text-[11px] text-zinc-400 tabular-nums">
                        {count}
                      </span>
                    </label>
                  );
                })}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function PCBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    cart,
    addToCart,
    removeFromCart,
    setCartOpen,
    categories,
    refreshCategories,
  } = useShop();
  const { isBuildMode, toggleBuildMode, saveCurrentBuild } = useBuild();
  const { toast } = useToast();

  useEffect(() => {
    if (categories.length === 0) {
      refreshCategories();
    }
  }, [categories.length, refreshCategories]);

  const [activeStep, setActiveStep] = useState<string>(CORE_CATEGORIES[0]);
  const [showIncompat, setShowIncompat] = useState(false);
  const [isBuildSummaryOpen, setIsBuildSummaryOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [viewerRole, setViewerRole] = useState<Role | null>(null);
  const [page, setPage] = useState(1);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const {
    activeFilterCount,
    clearFilters,
    limit,
    maxPrice,
    minPrice,
    query,
    selectedFilters,
    setCategory,
    setPriceRange,
    setSearchQuery,
    setSort,
    sort,
    toggleFilterValue,
  } = useProductFilters();

  const searchKey = searchParams.toString();
  const [searchInput, setSearchInput] = useState(query);

  const { products, filters, total, isLoading, totalPages } = useCatalogListing(
    {
      searchKey,
      limit,
      page,
    },
  );

  // Only run once on mount — stable empty dep array
  useEffect(() => {
    if (!isBuildMode) toggleBuildMode();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    (async () => {
      const role = await fetchViewerRole(controller.signal);
      if (active) setViewerRole(role);
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [searchKey]);

  // Cache CPU/mobo specs from cart to avoid repeated specsToFlat calls inside fetch effect
  const cartSpecsCache = useMemo(() => {
    const cpu = cart.find((i) =>
      sameCategory(i.category, CATEGORY_NAMES.PROCESSOR),
    );
    const mobo = cart.find((i) =>
      sameCategory(i.category, CATEGORY_NAMES.MOTHERBOARD),
    );
    return {
      cpuSocket: cpu ? String(specsToFlat(cpu.specs).socket ?? "") : "",
      moboSocket: mobo ? String(specsToFlat(mobo.specs).socket ?? "") : "",
      moboRamType: mobo ? getMemoryTypeFromSpecs(mobo.specs) : "",
      cpuRamType: cpu ? getMemoryTypeFromSpecs(cpu.specs) : "",
    };
  }, [cart]);

  useEffect(() => {
    // Keep the builder step in sync with the shared catalog query params.
    setCategory(activeStep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep]);

  const handleAdd = useCallback(
    (product: Product) => {
      addToCart(product, undefined, true);
      // Defer step advance to avoid blocking the current render
      setTimeout(() => {
        setActiveStep((prev) => {
          const next = CORE_CATEGORIES.find(
            (cat) =>
              !sameCategory(cat, product.category) &&
              !cart.some((i) => sameCategory(i.category, cat)),
          );
          return next ?? prev;
        });
      }, 100);
    },
    [addToCart, cart],
  );

  const handleRemove = useCallback(
    (id: string) => removeFromCart(id),
    [removeFromCart],
  );

  const handleStepClick = useCallback(
    (cat: string) => {
      setActiveStep(cat);
      setSearchInput("");
      setSearchQuery("");
      setPage(1);
      setIsMobileFiltersOpen(false);
      setIsBuildSummaryOpen(false);
    },
    [
      setIsBuildSummaryOpen,
      setIsMobileFiltersOpen,
      setPage,
      setSearchQuery,
      setSearchInput,
    ],
  );

  // Build compat map once per cart change, keyed by product id — avoids calling validateBuild per card
  const cartCompatMap = useMemo<
    Map<string, { level: CompatibilityLevel; message: string }>
  >(() => {
    return new Map(); // populated lazily per product in checkCompat
  }, [cart]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkCompat = useCallback(
    (product: Product): { level: CompatibilityLevel; message: string } => {
      // Return early if already in cart
      if (cart.some((i) => i.id === product.id)) {
        return { level: CompatibilityLevel.COMPATIBLE, message: "" };
      }
      // Check memo cache
      const cached = cartCompatMap.get(product.id);
      if (cached) return cached;

      const hypo: CartItem[] = [
        ...cart.filter((i) => !sameCategory(i.category, product.category)),
        { ...product, quantity: 1, selectedVariant: product.variants?.[0] },
      ];
      const rep = validateBuild(hypo);
      const result = {
        level:
          rep.issues.length > 0
            ? rep.issues.some(
                (i) => i.level === CompatibilityLevel.INCOMPATIBLE,
              )
              ? CompatibilityLevel.INCOMPATIBLE
              : CompatibilityLevel.WARNING
            : CompatibilityLevel.COMPATIBLE,
        message: rep.issues[0]?.message || "",
      };
      cartCompatMap.set(product.id, result);
      return result;
    },
    [cart, cartCompatMap],
  );

  const handleSave = useCallback(
    async (title: string) => {
      const savedGuide = await saveCurrentBuild({
        title,
        items: cart,
        category: "Custom",
      });
      toast({
        title: "Build guide saved",
        description: `${savedGuide.title} is now visible in Build Guides.`,
      });
    },
    [cart, saveCurrentBuild, toast],
  );

  const handleOpenSave = useCallback(() => setSaveOpen(true), []);
  const handleCloseSave = useCallback(() => setSaveOpen(false), []);
  const handleToggleIncompat = useCallback(
    () => setShowIncompat((p) => !p),
    [],
  );
  const handleCartOpen = useCallback(() => setCartOpen(true), [setCartOpen]);

  // Derived values — single source of truth
  const totalPrice = useMemo(
    () =>
      cart.reduce(
        (s, i) => s + (i.selectedVariant?.price || 0) * i.quantity,
        0,
      ),
    [cart],
  );
  const compatReport = useMemo(() => validateBuild(cart), [cart]);
  const completedCount = useMemo(
    () =>
      CORE_CATEGORIES.filter((cat) =>
        cart.some((i) => sameCategory(i.category, cat)),
      ).length,
    [cart],
  );
  const wattageEst = useMemo(() => estimateWattage(cart), [cart]);

  const visibleProducts = useMemo(() => {
    if (showIncompat) return products;
    return products.filter(
      (product) => checkCompat(product).level === CompatibilityLevel.COMPATIBLE,
    );
  }, [checkCompat, products, showIncompat]);

  const compatStatus = useMemo(() => {
    if (compatReport.status === CompatibilityLevel.INCOMPATIBLE) {
      return {
        text: `${compatReport.issues.length} incompatibility`,
        color: "text-red-500",
        dot: "bg-red-500",
      };
    }
    if (compatReport.issues.length > 0) {
      return {
        text: `${compatReport.issues.length} warning${compatReport.issues.length > 1 ? "s" : ""}`,
        color: "text-amber-500",
        dot: "bg-amber-500",
      };
    }
    if (cart.length === 0) {
      return {
        text: "No components yet",
        color: "text-zinc-400",
        dot: "bg-zinc-300",
      };
    }
    return {
      text: "Compatible",
      color: "text-emerald-600",
      dot: "bg-emerald-500",
    };
  }, [compatReport, cart.length]);

  // Stable callback refs for nav items
  const navClickHandlers = useMemo(
    () =>
      Object.fromEntries(
        CORE_CATEGORIES.map((cat) => [cat, () => handleStepClick(cat)]),
      ),
    [handleStepClick],
  );
  const isAdmin = viewerRole === Role.ADMIN;

  return (
    <div
      className="pcb-root flex flex-col bg-stone-50 overflow-hidden"
      style={{ height: "100vh" }}
    >
      <style>{PAGE_STYLES}</style>

      {/* ── CATALOG TOP BAR ──────────────────────────────────────────── */}
      <CatalogTopBar
        categories={categories}
        selectedCategory={
          activeStep ? CATEGORY_LABELS[activeStep] || activeStep : null
        }
        selectedCategoryLabel={
          activeStep
            ? CATEGORY_LABELS[activeStep] || activeStep
            : "All Components"
        }
        total={total}
        searchInput={searchInput}
        sort={sort}
        activeFilterCount={activeFilterCount}
        onSearchChange={(value) => {
          setSearchInput(value);
          setSearchQuery(value);
        }}
        onSearchClear={() => {
          setSearchInput("");
          setSearchQuery("");
        }}
        onSortChange={setSort}
        onOpenMobileFilters={() => setIsMobileFiltersOpen(true)}
        onCategoryChange={(val) => {
          if (val) {
            const coreCat =
              CORE_CATEGORIES.find((c) => CATEGORY_LABELS[c] === val) || val;
            handleStepClick(coreCat);
          } else {
            handleStepClick("");
          }
        }}
      />

      {/* ── 3-COL BODY ─────────────────────────────────────────────── */}
      <div className="pcb-layout flex-1 min-h-0">
        {/* ── LEFT FILTERS (desktop only) ────────────────────────── */}
        <aside className="hidden xl:block">
          <div className="sticky top-20">
            <CatalogFiltersSidebar
              filters={filters}
              selectedFilters={selectedFilters}
              minPrice={minPrice}
              maxPrice={maxPrice}
              activeCount={activeFilterCount}
              total={total}
              onPriceChange={setPriceRange}
              onFilterToggle={toggleFilterValue}
              onClear={clearFilters}
            />
          </div>
        </aside>

        {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
        <main className="flex flex-col overflow-hidden bg-stone-50 min-w-0">
          {/* Sub-header: Description and Compat Toggle */}
          <div className="flex-shrink-0 px-4 sm:px-5 py-3 bg-white border-b border-zinc-100 z-20 flex items-center justify-between gap-4">
            <p className="text-xs text-zinc-500 leading-snug">
              {CAT_DESCRIPTIONS[activeStep] ||
                `Select your ${CATEGORY_LABELS[activeStep]}.`}
            </p>
            <button
              type="button"
              onClick={handleToggleIncompat}
              className={`flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-xl border transition-all flex-shrink-0 ${
                showIncompat
                  ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                  : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100"
              }`}
            >
              {showIncompat ? <Eye size={12} /> : <EyeOff size={12} />}
              <span className="hidden sm:inline">
                {showIncompat ? "All parts" : "Compatible only"}
              </span>
            </button>
          </div>

          {/* ── PRODUCT GRID ── */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 pb-20 xl:pb-4">
            {isLoading ? (
              <CatalogLoadingGrid />
            ) : visibleProducts.length === 0 ? (
              <CatalogEmptyState
                title="No products found"
                description="Try adjusting your filters or search term"
                onClear={clearFilters}
              />
            ) : (
              // Removed motion.div layout + AnimatePresence from grid — was causing
              // full-grid layout recalculation on every product list update.
              // CSS card-enter animation handles entrance visuals without JS overhead.
              <div className="product-grid">
                {visibleProducts.map((product, index) => {
                  const inCart = cart.some((i) => i.id === product.id);
                  const compat = checkCompat(product);
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isInCart={inCart}
                      compatibility={compat.level}
                      compatMessage={compat.message}
                      onAdd={() => handleAdd(product)}
                      onRemove={() => handleRemove(product.id)}
                      index={index}
                    />
                  );
                })}
              </div>
            )}

            <CatalogPagination
              page={page}
              totalPages={totalPages}
              isLoading={isLoading}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            />
          </div>

          {/* Desktop status bar */}
          <div className="hidden lg:flex xl:hidden items-center justify-between h-12 px-5 border-t border-zinc-100 bg-white flex-shrink-0">
            <div className="flex items-center gap-4">
              <div
                className={`flex items-center gap-1.5 text-xs font-semibold ${compatStatus.color}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${compatStatus.dot}`}
                />
                {compatStatus.text}
              </div>
              <div className="h-4 w-px bg-zinc-100" />
              <span className="text-xs text-zinc-400 tabular-nums">
                {wattageEst}W est.
              </span>
            </div>
            <button
              type="button"
              onClick={handleCartOpen}
              disabled={cart.length === 0}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-900 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 transition-colors disabled:opacity-40"
            >
              <ShoppingCart size={12} /> View Build ({cart.length})
            </button>
          </div>
        </main>

        {/* ── RIGHT SIDEBAR ─────────────────────────────────────── */}
        <aside className="hidden xl:flex flex-col overflow-hidden w-[300px] sticky top-0 self-start">
          <BuildSummaryPanel
            cart={cart}
            onRemove={handleRemove}
            onStepClick={handleStepClick}
            activeStep={activeStep}
            onSave={isAdmin ? handleOpenSave : undefined}
            onShare={undefined}
            onCheckout={handleCartOpen}
          />
        </aside>
      </div>

      {/* ── Mobile filters drawer ─────────────────────────────────── */}
      <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
        <SheetContent
          side="left"
          className="p-0 w-full max-w-[320px] overflow-hidden"
        >
          <SheetHeader className="border-b border-gray-100 px-5 py-4">
            <SheetTitle className="flex items-center gap-2">
              <SlidersHorizontal className="size-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {activeFilterCount}
                </span>
              )}
            </SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100dvh-65px)]">
            <CatalogFiltersSidebar
              filters={filters}
              selectedFilters={selectedFilters}
              minPrice={minPrice}
              maxPrice={maxPrice}
              activeCount={activeFilterCount}
              total={total}
              onPriceChange={setPriceRange}
              onFilterToggle={toggleFilterValue}
              onClear={clearFilters}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Mobile build summary drawer ───────────────────────────── */}
      <Sheet open={isBuildSummaryOpen} onOpenChange={setIsBuildSummaryOpen}>
        <SheetContent
          side="right"
          className="p-0 w-full max-w-[320px] overflow-hidden"
        >
          <div className="h-full">
            <BuildSummaryPanel
              cart={cart}
              onRemove={handleRemove}
              onStepClick={handleStepClick}
              activeStep={activeStep}
              onSave={isAdmin ? handleOpenSave : undefined}
              onShare={undefined}
              onCheckout={() => {
                setIsBuildSummaryOpen(false);
                handleCartOpen();
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* ── MOBILE BOTTOM BAR ──────────────────────────────────────── */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md  px-4 pt-3 mobile-bar flex items-center justify-between gap-3 mb-20 sm:mb-0">
        <div className="min-w-0">
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-0.5">
            Total
          </p>
          <p className="text-lg font-bold text-zinc-900 leading-none tabular-nums">
            <AnimatedPrice value={totalPrice} />
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ">
          {compatReport.issues.length > 0 && (
            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${
                compatReport.status === CompatibilityLevel.INCOMPATIBLE
                  ? "bg-red-50 text-red-600 border-red-200"
                  : "bg-amber-50 text-amber-600 border-amber-200"
              }`}
            >
              {compatReport.issues.length} issue
              {compatReport.issues.length > 1 ? "s" : ""}
            </span>
          )}
          <span className="hidden sm:flex items-center gap-1 text-[10px] font-semibold text-zinc-500 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-full flex-shrink-0">
            {completedCount}/{CORE_CATEGORIES.length}
          </span>
          <button
            type="button"
            onClick={() => setIsBuildSummaryOpen(true)}
            disabled={cart.length === 0}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-zinc-900 text-white text-xs font-bold rounded-2xl hover:bg-indigo-600 transition-colors disabled:opacity-40 shadow-sm"
          >
            <ShoppingCart size={13} />
            <span>View Build</span>
            <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {cart.length}
            </span>
          </button>
        </div>
      </div>

      {/* Save dialog */}
      <AnimatePresence>
        {isAdmin && saveOpen && (
          <SaveDialog onClose={handleCloseSave} onSave={handleSave} />
        )}
      </AnimatePresence>
    </div>
  );
}
