"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useBuilderCategories } from "@/hooks/useCategories";
import { useCatalogListing } from "@/hooks/useCatalogListing";
import { apiFetch } from "@/lib/helpers";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/context/ShopCartContext";
import { validateBuildSync } from "@/lib/compatibilityEngine";
import {
  calculateBuildCompletion,
  calculatePSUHeadroom,
  getCompatibilitySummary,
  getNextRecommendedStep,
  validateBuildForCheckout,
  getSpecValue
} from "@/lib/calculations/pcBuilderUtils";
import { Product, BuildItem, Build } from "@/types";
import {
  Cpu,
  Zap,
  Wrench,
  Sliders,
  SlidersHorizontal,
  Trash2,
  ShoppingCart,
  Check,
  Info,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Loader2,
  ArrowLeft
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Slot step configurations & specifications prioritizer maps
// ─────────────────────────────────────────────────────────────────────────────

const SLOT_PRIORITY_SPECS: Record<string, string[]> = {
  CPU:  ["cores", "threads", "base clock", "socket", "tdp"],
  GPU:  ["vram", "memory type", "boost clock", "tdp", "length"],
  RAM:  ["capacity", "speed", "type", "form factor"],
  MB:   ["socket", "chipset", "memory type", "form factor"],
  SSD:  ["capacity", "interface", "read speed", "write speed"],
  PSU:  ["wattage", "efficiency", "modular"],
  COOL: ["socket support", "tdp rating", "type"],
  CASE: ["form factor", "max gpu length", "radiator support"],
};

const SLOT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  CPU: { bg: "bg-indigo-600", text: "text-indigo-600", dot: "bg-indigo-600" },
  GPU: { bg: "bg-violet-600", text: "text-violet-600", dot: "bg-violet-600" },
  RAM: { bg: "bg-sky-500", text: "text-sky-500", dot: "bg-sky-500" },
  SSD: { bg: "bg-teal-500", text: "text-teal-500", dot: "bg-teal-500" },
  PSU: { bg: "bg-amber-500", text: "text-amber-500", dot: "bg-amber-500" },
  CASE: { bg: "bg-slate-500", text: "text-slate-500", dot: "bg-slate-500" },
  COOL: { bg: "bg-emerald-500", text: "text-emerald-500", dot: "bg-emerald-500" },
  MB: { bg: "bg-rose-500", text: "text-rose-500", dot: "bg-rose-500" },
};

const BUILDER_STEPS = [
  { id: "CPU", name: "Processor", shortLabel: "CPU", isRequired: true, icon: "cpu", categoryCode: "CPU" },
  { id: "COOL", name: "CPU Cooler", shortLabel: "COOLER", isRequired: false, icon: "cool", categoryCode: "COOL" },
  { id: "MB", name: "Motherboard", shortLabel: "MOTHERBOARD", isRequired: true, icon: "mb", categoryCode: "MB" },
  { id: "RAM", name: "Memory (RAM)", shortLabel: "RAM", isRequired: true, icon: "ram", categoryCode: "RAM" },
  { id: "SSD", name: "Storage (SSD/HDD)", shortLabel: "STORAGE", isRequired: true, icon: "ssd", categoryCode: "SSD" },
  { id: "GPU", name: "Graphics Card", shortLabel: "GPU", isRequired: false, icon: "gpu", categoryCode: "GPU" },
  { id: "PSU", name: "Power Supply", shortLabel: "PSU", isRequired: true, icon: "power", categoryCode: "PSU" },
  { id: "CASE", name: "PC Case (Cabinet)", shortLabel: "CASE", isRequired: true, icon: "case", categoryCode: "CASE" },
];

export default function PCBuilderClient() {
  const { subCategories } = useBuilderCategories();
  const { toast: appToast } = useToast();
  const { addToCart } = useCart();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [build, setBuild] = useState<Build | null>(null);
  const [buildLoading, setBuildLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [onlyCompatible, setOnlyCompatible] = useState(true);
  const [builderSettings] = useState<any>({
    powerDefaults: {
      baseWattage: 50,
      cpuDefaultWattage: 65,
      gpuDefaultWattage: 150,
      ramWattagePerStick: 5,
      storageWattagePerDrive: 5,
    }
  });

  // UI state variables for mobile layouts, drawer, and checklist expansion
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [checkoutDrawerOpen, setCheckoutDrawerOpen] = useState(false);
  const [compatibilityExpanded, setCompatibilityExpanded] = useState(false);

  // activeStep synced with URL Query params
  const activeStep = useMemo(() => {
    return searchParams.get("step") || "CPU";
  }, [searchParams]);

  const setActiveStep = useCallback((stepId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", stepId);
    router.push(`?${params.toString()}`);
  }, [searchParams, router]);

  // Load or Create Build session from database
  const createBuild = useCallback(async (name?: string) => {
    setBuildLoading(true);
    try {
      const data = await apiFetch<Build>("/api/builds", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      setBuild(data);
      if (typeof window !== "undefined") {
        localStorage.setItem("pc-builder-build-id", data.id);
      }
    } catch (err) {
      console.error("Failed to create build:", err);
    } finally {
      setBuildLoading(false);
    }
  }, []);

  const loadBuild = useCallback(async (buildId: string) => {
    setBuildLoading(true);
    try {
      const data = await apiFetch<Build>(`/api/builds/${buildId}`);
      setBuild(data);
    } catch (err) {
      console.warn("Failed to load build, creating new:", err);
      createBuild("My Live Custom Build");
    } finally {
      setBuildLoading(false);
    }
  }, [createBuild]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedBuildId = localStorage.getItem("pc-builder-build-id");
      if (savedBuildId) {
        loadBuild(savedBuildId);
      } else {
        createBuild("My Live Custom Build");
      }
    }
  }, []);

  // Listen to screen size changes (max-width: 1024px) for mobile progress layout
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(max-width: 1024px)");
    setIsSmallScreen(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => {
      setIsSmallScreen(e.matches);
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // API Mutators
  const addItem = useCallback(async (productId: string, slotId: string) => {
    if (!build) return;
    setBuildLoading(true);
    try {
      await apiFetch(`/api/builds/${build.id}/items`, {
        method: "POST",
        body: JSON.stringify({ variantId: productId, slotId }),
      });
      const refreshed = await apiFetch<Build>(`/api/builds/${build.id}`);
      setBuild(refreshed);
      appToast({
        title: "Component selected",
        description: "Added successfully to your blueprint slot.",
      });
    } catch (err: any) {
      console.error("Failed to add item:", err);
      appToast({
        title: "Selection failed",
        description: err.message || "Failed to select component.",
        variant: "destructive",
      });
    } finally {
      setBuildLoading(false);
    }
  }, [build, appToast]);

  const removeItem = useCallback(async (slotId: string) => {
    if (!build) return;
    const item = build.items?.find((i: any) => i.slotId === slotId);
    if (!item) return;
    setBuildLoading(true);
    try {
      await apiFetch(`/api/builds/${build.id}/items/${item.id}`, {
        method: "DELETE",
      });
      const refreshed = await apiFetch<Build>(`/api/builds/${build.id}`);
      setBuild(refreshed);
      appToast({
        title: "Part removed",
        description: "Removed successfully from slot.",
      });
    } catch (err: any) {
      console.error("Failed to remove item:", err);
      appToast({
        title: "Removal failed",
        description: err.message || "Failed to remove component.",
        variant: "destructive",
      });
    } finally {
      setBuildLoading(false);
    }
  }, [build, appToast]);

  const handleStartFresh = useCallback(async () => {
    if (!build) return;
    setBuildLoading(true);
    try {
      const removePromises = build.items?.map((item: any) =>
        apiFetch(`/api/builds/${build.id}/items/${item.id}`, { method: "DELETE" }).catch(() => { })
      ) || [];
      await Promise.all(removePromises);
      const refreshed = await apiFetch<Build>(`/api/builds/${build.id}`);
      setBuild(refreshed);
      appToast({
        title: "Build cleared",
        description: "All parts have been cleared. Let's start fresh!",
      });
    } catch (e: any) {
      console.error(e);
    } finally {
      setBuildLoading(false);
    }
  }, [build, appToast]);

  // Steps mapper
  const steps = useMemo(() => {
    return BUILDER_STEPS.map((step) => {
      const matchingSub = subCategories.find(
        (sc) => (sc.category as any)?.code === step.categoryCode || String(sc.shortLabel || "").toUpperCase() === step.shortLabel.toUpperCase()
      );

      return {
        ...step,
        categoryId: matchingSub?.categoryId,
        categoryName: matchingSub?.category?.name || step.name,
        subCategorySlots: [{ slotId: step.categoryCode }],
      };
    });
  }, [subCategories]);

  const itemBySlot = useMemo(() => {
    const map = new Map<string, BuildItem>();
    if (build?.items) {
      build.items.forEach((item: BuildItem) => {
        map.set(item.slotId, item);
      });
    }
    return map;
  }, [build]);

  // ── Live Catalog Fetching ──────────────────────────────────────────────────
  const searchKey = useMemo(() => {
    const params = new URLSearchParams();
    const currentStepObj = steps.find(s => s.id === activeStep);
    if (currentStepObj?.categoryName) {
      params.set("category", currentStepObj.categoryName);
    }
    if (searchQuery.trim()) {
      params.set("q", searchQuery);
    }
    if (sortBy && sortBy !== "featured") {
      params.set("sort", sortBy);
    }
    return params.toString();
  }, [activeStep, searchQuery, sortBy, steps]);

  const { products, isLoading: productsLoading } = useCatalogListing({
    searchKey,
    limit: 60,
    page: 1
  });

  // Client-Side Compatibility validation of selected parts
  const compatibilityReport = useMemo(() => {
    const items = build?.items || [];
    return validateBuildSync(items);
  }, [build?.items]);

  const overallStatusText = useMemo(() => {
    const items = build?.items || [];
    if (items.length === 0) return "UNCHECKED";
    const hasError = compatibilityReport.issues.some(i => i.severity === "ERROR");
    const hasWarning = compatibilityReport.issues.some(i => i.severity === "WARNING");
    if (hasError) return "INCOMPATIBLE";
    if (hasWarning) return "WARNING";
    return "COMPATIBLE";
  }, [compatibilityReport, build?.items]);

  // PSU headrooms & estimated loads
  const powerDefaults = useMemo(() => {
    return builderSettings.powerDefaults || {
      baseWattage: 50,
      cpuDefaultWattage: 65,
      gpuDefaultWattage: 150,
      ramWattagePerStick: 5,
      storageWattagePerDrive: 5,
    };
  }, [builderSettings]);

  const powerAnalytics = useMemo(() => {
    return calculatePSUHeadroom(build?.items || [], powerDefaults);
  }, [build?.items, powerDefaults]);

  // Checkout and progress
  const completionMetrics = useMemo(() => {
    return calculateBuildCompletion(build?.items || [], steps);
  }, [build?.items, steps]);

  // Computes the proportional cost segments for slot cost breakdown
  // Dependency inline comment: build?.items
  const slotCostBreakdown = useMemo(() => {
    if (!build?.items || build.items.length === 0) return [];
    const itemsWithProduct = build.items.filter(item => item.product);
    const total = itemsWithProduct.reduce((sum, item) => sum + Number(item.product?.price ?? 0), 0);
    if (total === 0) return [];
    return itemsWithProduct.map(item => {
      const price = Number(item.product?.price ?? 0);
      const step = BUILDER_STEPS.find(s => s.categoryCode === item.slotId);
      return {
        slotId: item.slotId,
        name: step ? step.name : item.slotId,
        price,
        percentage: (price / total) * 100
      };
    });
  }, [build?.items]);

  // Validator summary containing warnings and readiness flags
  // Dependency inline comment: build?.items, steps, compatibilityReport, powerAnalytics
  const checkoutValidation = useMemo(() => {
    const base = validateBuildForCheckout(
      build?.items || [],
      steps,
      compatibilityReport,
      powerAnalytics
    );
    const warnings = compatibilityReport.issues
      .filter(issue => issue.severity === "WARNING")
      .map(issue => issue.message);
    if (powerAnalytics.psuCapacity && powerAnalytics.headroomStatus === "warning") {
      warnings.push(`Estimated wattage (${powerAnalytics.estimatedWattage}W) is close to PSU capacity (${powerAnalytics.psuCapacity}W). Recommended overhead is 20%.`);
    }
    return {
      ...base,
      warnings
    };
  }, [build?.items, steps, compatibilityReport, powerAnalytics]);

  const recommendedStep = useMemo(() => {
    return getNextRecommendedStep(build?.items || [], steps);
  }, [build?.items, steps]);

  // Simulated compatibility checker for catalog product card overlays
  const getProductCompatibility = useCallback((product: Product) => {
    if (!build?.items || !activeStep) return { compatible: true, message: "" };

    const currentStepObj = steps.find((s) => s.id === activeStep);
    const activeSlotId = currentStepObj?.subCategorySlots?.[0]?.slotId;
    if (!activeSlotId) return { compatible: true, message: "" };

    const otherItems = build.items.filter((item: any) => item.slotId !== activeSlotId);
    const candidateItem = {
      slotId: activeSlotId,
      productId: product.id,
      product: product
    };

    const simulatedItems = [...otherItems, candidateItem];
    const report = validateBuildSync(simulatedItems);

    const fatalError = report.issues.find((issue) => issue.severity === "ERROR");
    if (fatalError) {
      return { compatible: false, message: fatalError.message };
    }

    const warning = report.issues.find((issue) => issue.severity === "WARNING");
    if (warning) {
      return { compatible: true, message: warning.message };
    }

    return { compatible: true, message: "" };
  }, [build?.items, activeStep, steps]);

  // Dynamic products catalog list with compatibility filtering
  const displayedProducts = useMemo(() => {
    if (!onlyCompatible) return products;
    return products.filter((p) => {
      const check = getProductCompatibility(p);
      return check.compatible;
    });
  }, [products, onlyCompatible, getProductCompatibility]);

  // Rules checklist mapper
  const rulesTableData = useMemo(() => {
    const hasCPU = itemBySlot.has("CPU");
    const hasMB = itemBySlot.has("MB");
    const hasRAM = itemBySlot.has("RAM");
    const hasSSD = itemBySlot.has("SSD");
    const hasGPU = itemBySlot.has("GPU");
    const hasPSU = itemBySlot.has("PSU");
    const hasCOOL = itemBySlot.has("COOL");
    const hasCASE = itemBySlot.has("CASE");

    const issues = compatibilityReport.issues;
    const findIssue = (keywords: string[]) => {
      return issues.find(i => keywords.some(k => i.message.toLowerCase().includes(k)));
    };

    interface LiveRule {
      id: string;
      name: string;
      components: string;
      status: "PASS" | "FAIL" | "WARN" | "N/A";
      message: string;
    }

    const rules: LiveRule[] = [
      {
        id: "SOCKET",
        name: "CPU ↔ Motherboard Socket Match",
        components: "CPU, Motherboard",
        status: "N/A",
        message: "Select a Processor and a Motherboard to verify socket compatibility."
      },
      {
        id: "RAM",
        name: "RAM ↔ Motherboard Memory Type",
        components: "RAM, Motherboard",
        status: "N/A",
        message: "Select Memory (RAM) and a Motherboard to verify memory type compatibility."
      },
      {
        id: "PSU",
        name: "PSU Wattage vs Total TDP",
        components: "Power Supply, System TDP",
        status: "N/A",
        message: "Select a Power Supply to verify wattage capacity."
      },
      {
        id: "GPU",
        name: "GPU Length vs Case Clearance",
        components: "Graphics Card, PC Case",
        status: "N/A",
        message: "Select a Graphics Card and a PC Case to verify clearance compatibility."
      },
      {
        id: "COOLER",
        name: "Cooler Socket Compatibility",
        components: "CPU Cooler, CPU",
        status: "N/A",
        message: "Select a Processor and a CPU Cooler to verify cooler socket support."
      }
    ];

    if (hasCPU && hasMB) {
      const issue = findIssue(["socket", "cpu socket"]);
      if (issue) {
        rules[0].status = "FAIL";
        rules[0].message = issue.message;
      } else {
        rules[0].status = "PASS";
        rules[0].message = "Compatible! Both CPU and Motherboard support the same socket.";
      }
    }

    if (hasRAM && hasMB) {
      const issue = findIssue(["ram type", "memory type", "ddr"]);
      if (issue) {
        rules[1].status = "FAIL";
        rules[1].message = issue.message;
      } else {
        rules[1].status = "PASS";
        rules[1].message = "Compatible! Both RAM and Motherboard support the same memory standard.";
      }
    }

    if (hasPSU) {
      const issue = findIssue(["psu wattage", "power supply", "tdp", "sufficient"]);
      if (issue) {
        rules[2].status = issue.severity === "ERROR" ? "FAIL" : "WARN";
        rules[2].message = issue.message;
      } else {
        rules[2].status = "PASS";
        rules[2].message = "Compatible! Power supply has sufficient capacity for all components.";
      }
    }

    if (hasGPU && hasCASE) {
      const issue = findIssue(["gpu length", "card length", "clearance"]);
      if (issue) {
        rules[3].status = "FAIL";
        rules[3].message = issue.message;
      } else {
        rules[3].status = "PASS";
        rules[3].message = "Compatible! GPU length is within the case clearance limit.";
      }
    }

    if (hasCPU && hasCOOL) {
      const issue = findIssue(["cooler may not support", "cooler socket", "socket compatibility"]);
      if (issue) {
        rules[4].status = "WARN";
        rules[4].message = issue.message;
      } else {
        rules[4].status = "PASS";
        rules[4].message = "Compatible! Cooler explicitly supports this CPU socket.";
      }
    }

    return rules;
  }, [compatibilityReport, build?.items]);

  // Actions
  const handleSelect = useCallback(async (product: Product) => {
    if (!activeStep || !build) return;
    const currentStepObj = steps.find(s => s.id === activeStep);
    const slotId = currentStepObj?.subCategorySlots?.[0]?.slotId;
    if (!slotId) return;

    await addItem(product.id, slotId);
  }, [activeStep, build, steps, addItem]);

  const handleRemove = useCallback(async (stepId: string) => {
    const currentStepObj = steps.find(s => s.id === stepId);
    const slotId = currentStepObj?.subCategorySlots?.[0]?.slotId;
    if (!slotId) return;

    await removeItem(slotId);
  }, [steps, removeItem]);

  const handleAddToCartAll = useCallback(() => {
    if (!build?.items || build.items.length === 0) return;
    let count = 0;
    build.items.forEach((item: any) => {
      if (item.product) {
        addToCart(item.product);
        count++;
      }
    });
    appToast({
      title: "Build added to cart!",
      description: `${count} items added to your checkout shopping cart.`,
    });
  }, [build?.items, addToCart, appToast]);

  const totalPrice = useMemo(() => {
    if (!build?.items) return 0;
    return build.items.reduce((sum, item) => sum + Number(item.product?.price ?? 0), 0);
  }, [build?.items]);

  const missingRequiredList = useMemo(() => {
    const requiredKeys = ["CPU", "MB", "RAM", "SSD", "PSU", "CASE"];
    const list: typeof BUILDER_STEPS = [];
    requiredKeys.forEach(k => {
      if (!itemBySlot.has(k)) {
        const found = BUILDER_STEPS.find(s => s.id === k);
        if (found) {
          list.push(found);
        }
      }
    });
    return list;
  }, [itemBySlot]);

  const renderStepIcon = (iconName: string, size: number = 18) => {
    switch (iconName) {
      case "cpu":
        return <Cpu size={size} />;
      case "cool":
        return <RefreshCw size={size} />;
      case "mb":
        return <Wrench size={size} />;
      case "ram":
        return <SlidersHorizontal size={size} />;
      case "ssd":
        return <Check size={size} />;
      case "gpu":
        return <Sliders size={size} />;
      case "psu":
        return <Zap size={size} />;
      case "case":
        return <Sliders size={size} />;
      default:
        return <Wrench size={size} />;
    }
  };

  return (
    <div className="min-h-screen lg:h-[calc(100vh-64px)] lg:overflow-hidden bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white antialiased font-sans flex flex-col">

      {/* TOP HEADER CONTROLS */}
      <header className="flex-shrink-0 z-40 bg-white border-b border-slate-200/60 shadow-sm py-3 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Ultimate Custom PC Builder
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full">
                  Inventory Backed
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Assemble, test, and buy from your live stock inventory database.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleStartFresh}
              disabled={buildLoading || !build?.items?.length}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 h-9 rounded-xl transition-all disabled:opacity-50"
            >
              <Trash2 size={13} />
              Clear Configuration
            </button>
            <button
              onClick={() => setCheckoutDrawerOpen(true)}
              disabled={!checkoutValidation.ready}
              className={`inline-flex items-center justify-center gap-1.5 text-xs font-bold text-white px-5 h-9 rounded-xl shadow-md transition-all ${checkoutValidation.ready
                  ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/15"
                  : "bg-slate-300 cursor-not-allowed shadow-none"
                }`}
            >
              <ShoppingCart size={13} />
              Add All to Cart
            </button>
          </div>
        </div>
      </header>

      {/* DASHBOARD PANEL GRID */}
      <main className="flex-1 min-h-0 max-w-7xl w-full mx-auto px-4 md:px-6 py-4 overflow-hidden">
        <div className="grid lg:grid-cols-12 gap-6 items-stretch h-full overflow-hidden">

          {/* LEFT PANEL (40% width on large screens) */}
          <section className="lg:col-span-5 flex flex-col gap-4 h-full overflow-y-auto pr-1 pb-4">

            {/* PC Component Blueprint Slots / Mobile Sticky Progress Pills */}
            {isSmallScreen ? (
              <div className="sticky top-[73px] z-30 bg-white border border-slate-200/80 shadow-md rounded-2xl p-2.5 flex justify-between items-center gap-1.5 flex-shrink-0">
                {steps.map(step => {
                  const item = itemBySlot.get(step.categoryCode);
                  const product = item?.product;
                  const isActive = activeStep === step.id;

                  let circleClass = "";
                  if (isActive) {
                    circleClass = "bg-indigo-600 text-white ring-2 ring-indigo-600 ring-offset-2 shadow-sm shadow-indigo-600/20";
                  } else if (product) {
                    circleClass = "bg-emerald-600 text-white shadow-sm shadow-emerald-600/10";
                  } else {
                    circleClass = "bg-slate-100 text-slate-400 hover:bg-slate-200/80";
                  }

                  return (
                    <button
                      key={step.id}
                      onClick={() => setActiveStep(step.id)}
                      className={`relative size-9 rounded-full flex items-center justify-center transition-all ${circleClass}`}
                      title={step.name}
                    >
                      {renderStepIcon(step.icon, 14)}
                      {product && !isActive && (
                        <span className="absolute -top-1 -right-1 size-3.5 bg-white border border-emerald-600 text-emerald-600 rounded-full flex items-center justify-center shadow-sm">
                          <Check size={8} className="stroke-[3]" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-shrink-0">
                <div className="p-3 bg-slate-50/60 border-b border-slate-200/60 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    PC Component Blueprint Slots
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400">8 total components</span>
                </div>

                <div className="divide-y divide-slate-100 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
                  {steps.map(step => {
                    const item = itemBySlot.get(step.categoryCode);
                    const product = item?.product;
                    const isActive = activeStep === step.id;

                    return (
                      <div
                        key={step.id}
                        onClick={() => setActiveStep(step.id)}
                        className={`flex-shrink-0 lg:flex-shrink-1 w-[260px] lg:w-auto py-2.5 px-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 cursor-pointer select-none transition-all ${isActive
                            ? "bg-indigo-50/50 border-l-4 border-indigo-600 lg:translate-x-0.5"
                            : "hover:bg-slate-50/40 border-l-4 border-transparent"
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          {/* Step Icon */}
                          <div className={`size-7 rounded-lg flex items-center justify-center ${isActive
                              ? "bg-indigo-100 text-indigo-700"
                              : product
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}>
                            {renderStepIcon(step.icon, 14)}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-[11px] font-extrabold text-slate-800 leading-tight">{step.name}</h4>
                              {step.isRequired && (
                                <span className="text-[8px] uppercase font-black text-rose-500 bg-rose-50 px-1 py-0.2 rounded">
                                  req
                                </span>
                              )}
                            </div>

                            {product ? (
                              <p className="text-[10px] font-bold text-indigo-600 truncate max-w-[150px] lg:max-w-[190px] mt-0.5">
                                {product.name}
                              </p>
                            ) : (
                              <p className="text-[9px] font-medium text-slate-400 mt-0.5">
                                Click to select product spec
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right Detail (Price or Action) */}
                        <div className="flex items-center justify-between lg:justify-end gap-2.5 mt-1 lg:mt-0 pt-1 lg:pt-0 border-t lg:border-t-0 border-slate-100/50">
                          {product ? (
                            <>
                              <span className="text-[11px] font-extrabold text-slate-700 tabular-nums">
                                ₹{Number(product.price ?? 0).toLocaleString("en-IN")}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemove(step.id);
                                }}
                                className="size-5 rounded flex items-center justify-center hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors text-xs"
                                title="Delete component selection"
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.2">
                              config
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* BUILD METRICS COMPACT DISPLAY */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex-shrink-0">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center justify-between">
                <span>System Configuration Analytics</span>
                <span className="text-[9px] lowercase text-slate-400 font-medium">real-time updates</span>
              </h2>

              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  {/* Build Price */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Estimated Cost
                    </span>
                    <span className="text-xl font-black text-slate-900 tracking-tight mt-0.5 block tabular-nums">
                      ₹{totalPrice.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Progress Circle or Meter */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Core Completeness
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-xl font-black text-slate-900 tracking-tight">
                        {completionMetrics.percentage}%
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">
                        ({6 - missingRequiredList.length}/6 required)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Proportional Cost Breakdown stacked horizontal bar */}
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                    Cost Breakdown by Slot
                  </span>
                  {slotCostBreakdown.length > 0 ? (
                    <div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex shadow-inner">
                        {slotCostBreakdown.map((item) => {
                          const color = SLOT_COLORS[item.slotId] || { bg: "bg-slate-400" };
                          return (
                            <div
                              key={item.slotId}
                              className={`${color.bg} h-full transition-all`}
                              style={{ width: `${item.percentage}%` }}
                              title={`${item.name}: ₹${item.price.toLocaleString("en-IN")} (${item.percentage.toFixed(1)}%)`}
                            />
                          );
                        })}
                      </div>
                      {/* Legend */}
                      <div className="flex flex-wrap gap-x-2.5 gap-y-1 mt-1.5 text-[9px] font-semibold text-slate-500">
                        {slotCostBreakdown.map((item) => {
                          const color = SLOT_COLORS[item.slotId] || { dot: "bg-slate-400" };
                          return (
                            <div key={item.slotId} className="flex items-center gap-0.5">
                              <span className={`size-1.5 rounded-full ${color.dot}`} />
                              <span>{item.name}</span>
                              <span className="text-slate-800 font-bold">₹{item.price.toLocaleString("en-IN")}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[9px] text-slate-400 italic font-medium">
                      Add items to slot blueprints to view proportional cost breakdown.
                    </p>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${completionMetrics.percentage}%` }}
                  />
                </div>
              </div>

              {/* ESTIMATED WATTAGE & BUFFER STATUS */}
              <div className="border-t border-slate-100 pt-3 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Zap className="size-3.5 text-amber-500" />
                    <span className="text-[11px] font-bold text-slate-600">Estimated Load:</span>
                    <span className="text-[11px] font-black text-slate-900">{powerAnalytics.estimatedWattage}W</span>
                  </div>
                  {/* Headroom status badge */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-slate-400 font-medium">PSU Headroom:</span>
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${powerAnalytics.headroomStatus === "danger"
                        ? "bg-rose-50 border border-rose-200 text-rose-600"
                        : powerAnalytics.headroomStatus === "warning"
                          ? "bg-amber-50 border border-amber-200 text-amber-600"
                          : powerAnalytics.headroomStatus === "safe" && powerAnalytics.psuCapacity
                            ? "bg-emerald-50 border border-emerald-200 text-emerald-600"
                            : "bg-slate-50 border border-slate-200 text-slate-500"
                      }`}>
                      {powerAnalytics.psuCapacity ? powerAnalytics.headroomStatus.toUpperCase() : "N/A"}
                    </span>
                  </div>
                </div>

                {powerAnalytics.psuCapacity ? (
                  <div className="space-y-1">
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${powerAnalytics.headroomStatus === "danger"
                            ? "bg-rose-500"
                            : powerAnalytics.headroomStatus === "warning"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                        style={{ width: `${powerAnalytics.utilizationPercentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[8px] font-bold text-slate-400">
                      <span>{powerAnalytics.utilizationPercentage}% Power capacity utilized</span>
                      <span>Recommended buffer: {powerAnalytics.recommendedBuffer}W</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[9px] text-slate-400 font-medium italic">
                    💡 Select a Power Supply (PSU) to compute total buffer margin headroom status.
                  </p>
                )}
              </div>

              {/* Missing requirements listing */}
              {missingRequiredList.length > 0 ? (
                <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-2.5 space-y-1">
                  <div className="flex items-center gap-1 text-amber-700">
                    <AlertTriangle size={12} className="stroke-[2.5]" />
                    <span className="text-[10px] font-bold">Unfinished System Requirements</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {missingRequiredList.map(step => (
                      <button
                        key={step.id}
                        onClick={() => setActiveStep(step.id)}
                        className="text-[8px] font-bold bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 px-1.5 py-0.2 rounded transition-colors"
                      >
                        + Add {step.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50/50 border border-emerald-200/50 rounded-xl p-2.5 flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span className="text-[10px] font-bold">Core hardware components are ready for checkout!</span>
                </div>
              )}
            </div>

            {/* COLLAPSIBLE COMPATIBILITY CHECK WIDGET */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200">
              {/* Header */}
              <button
                onClick={() => setCompatibilityExpanded(!compatibilityExpanded)}
                className="w-full p-4 bg-slate-50/60 border-b border-slate-200/60 flex items-center justify-between text-left focus:outline-none"
              >
                <div className="space-y-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Live Compatibility Rules
                  </h3>
                  <p className="text-[10px] font-semibold text-slate-500">
                    {rulesTableData.filter(r => r.status === "PASS").length} rules passing · {rulesTableData.filter(r => r.status === "FAIL" || r.status === "WARN").length} rules failing · {rulesTableData.filter(r => r.status === "N/A").length} unchecked
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                    overallStatusText === "COMPATIBLE"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : overallStatusText === "INCOMPATIBLE"
                        ? "bg-rose-50 border-rose-200 text-rose-700"
                        : overallStatusText === "WARNING"
                          ? "bg-amber-50 border-amber-200 text-amber-700"
                          : "bg-slate-50 border-slate-200 text-slate-500"
                  }`}>
                    {overallStatusText}
                  </span>
                  <span className="text-slate-400 text-xs font-bold">
                    {compatibilityExpanded ? "▲" : "▼"}
                  </span>
                </div>
              </button>

              {/* Rules checklist list with transition-all */}
              <div
                className={`transition-all duration-200 overflow-hidden ${
                  compatibilityExpanded ? "max-h-[500px] border-t border-slate-100 overflow-y-auto" : "max-h-0"
                }`}
              >
                <div className="p-4 space-y-3">
                  {rulesTableData.map(rule => (
                    <div key={rule.id} className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800">{rule.name}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                          rule.status === "PASS"
                            ? "bg-emerald-50 text-emerald-600"
                            : rule.status === "FAIL"
                              ? "bg-rose-50 text-rose-600"
                              : rule.status === "WARN"
                                ? "bg-amber-50 text-amber-600"
                                : "bg-slate-100 text-slate-400"
                        }`}>
                          {rule.status === "PASS" && "PASS"}
                          {rule.status === "FAIL" && "FAIL"}
                          {rule.status === "WARN" && "WARN"}
                          {rule.status === "N/A" && "N/A"}
                        </span>
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        Components: {rule.components}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                        {rule.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </section>

          {/* RIGHT PANEL (60% width on large screens) */}
          <section className="lg:col-span-7 flex flex-col gap-4 lg:h-full lg:overflow-hidden pb-4">

            {/* STEP PICKER HEADER */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex-shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    {renderStepIcon(steps.find(s => s.id === activeStep)?.icon || "cpu", 16)}
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      Selecting {steps.find(s => s.id === activeStep)?.name}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Browse available components to add to slot configuration.
                    </p>
                  </div>
                </div>

                {/* Compatibility controls */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Filter Compatible:</span>
                  <button
                    onClick={() => setOnlyCompatible(prev => !prev)}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${onlyCompatible ? "bg-indigo-600" : "bg-slate-200"
                      }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${onlyCompatible ? "translate-x-5" : "translate-x-0"
                        }`}
                    />
                  </button>
                </div>
              </div>

              {/* SEARCH & SORT SUB-CONTROLS */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder={`Search ${steps.find(s => s.id === activeStep)?.name} by name or brand...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-slate-600"
                  >
                    <option value="featured">Featured Products</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* PRODUCT GRID & HINT CONTAINER (SCROLLABLE) */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-4 space-y-4">
              {/* PRODUCT GRID DISPLAY */}
              <div className="relative">
                {buildLoading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-30 flex items-center justify-center rounded-2xl">
                  <Loader2 className="animate-spin text-indigo-600 size-8" />
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                {productsLoading ? (
                  <div className="col-span-2 py-24 text-center flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-indigo-600 size-8 mb-3" />
                    <span className="text-xs text-slate-500 font-bold">Scanning inventory catalog...</span>
                  </div>
                ) : displayedProducts.length > 0 ? (
                  displayedProducts.map((product: Product) => {
                    const activeStepObj = steps.find(s => s.id === activeStep);
                    const slotId = activeStepObj?.subCategorySlots?.[0]?.slotId;
                    const isSelected = slotId && itemBySlot.get(slotId)?.productId === product.id;
                    const simStatus = getProductCompatibility(product);

                    return (
                      <div
                        key={product.id}
                        className={`relative bg-white rounded-xl shadow-sm border overflow-hidden p-4 hover:shadow-md transition-all flex flex-col justify-between ${isSelected
                            ? "ring-2 ring-indigo-600 border-transparent bg-indigo-50/10"
                            : !simStatus.compatible
                              ? "border-rose-200 bg-rose-50/5"
                              : "border-slate-200"
                          }`}
                      >
                        {/* CARD BANNER OVERLAYS FOR COMPATIBILITY STATUS */}
                        {!simStatus.compatible && (
                          <div className="absolute top-2 right-2 bg-rose-50 border border-rose-200 text-rose-600 text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm flex items-center gap-1 animate-pulse">
                            <AlertTriangle size={10} />
                            Mismatched
                          </div>
                        )}

                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1 shadow-sm">
                            <Check size={10} className="stroke-[3]" />
                            Active Selected
                          </div>
                        )}

                        {/* Product Header */}
                        <div className="space-y-2">
                          <div className="flex gap-3">
                            <div className="size-16 rounded-lg bg-slate-50 border border-slate-100 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                              <img
                                src={product.media?.[0]?.url || product.image || "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=120&auto=format&fit=crop&q=80"}
                                alt={product.name}
                                className="w-full h-full object-contain hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                                {product.brand?.name || "Manufacturer"}
                              </span>
                              <h3 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight mt-0.5">
                                {product.name}
                              </h3>
                            </div>
                          </div>

                          {/* Specs grid sorted by priority specs map */}
                          <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 flex flex-wrap gap-x-3 gap-y-1.5">
                            {(() => {
                              const priorityList = SLOT_PRIORITY_SPECS[activeStep] || [];
                              const matchedSpecs = priorityList
                                .map(pName => {
                                  const pNameLower = pName.toLowerCase();
                                  return product.specs?.find((spec: any) => {
                                    const label = (spec.name || spec.attribute?.label || spec.key || "").toLowerCase();
                                    return label.includes(pNameLower);
                                  });
                                })
                                .filter((spec): spec is any => !!spec);

                              return matchedSpecs.length > 0 ? (
                                matchedSpecs.map((spec: any, index: number) => (
                                  <div key={index} className="text-[10px] font-medium flex gap-1">
                                    <span className="text-slate-400">{spec.name || spec.attribute?.label || spec.key}:</span>
                                    <span className="text-slate-700 font-bold">{String(spec.value)}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-[10px] text-slate-400 italic">No priority specs match this product.</div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Product Footer Price + Select */}
                        <div className="mt-4 pt-3 border-t border-slate-100/60 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">price</p>
                            <p className="text-sm font-extrabold text-slate-800 tabular-nums">
                              ₹{Number(product.price ?? 0).toLocaleString("en-IN")}
                            </p>
                          </div>

                          <button
                            onClick={() => handleSelect(product)}
                            disabled={buildLoading}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${isSelected
                                ? "bg-emerald-600 text-white shadow-sm"
                                : !simStatus.compatible
                                  ? "bg-rose-100 hover:bg-rose-200 text-rose-700"
                                  : "bg-indigo-50 hover:bg-indigo-100 text-indigo-600"
                              }`}
                          >
                            {isSelected ? "Selected" : "Select Product"}
                          </button>
                        </div>

                        {/* Simulated mismatch message display if failed */}
                        {!simStatus.compatible && (
                          <div className="mt-2.5 bg-rose-50 border border-rose-200/50 p-2 rounded-lg text-[9px] font-semibold text-rose-700 leading-snug">
                            {simStatus.message}
                          </div>
                        )}

                        {simStatus.compatible && simStatus.message && (
                          <div className="mt-2.5 bg-amber-50 border border-amber-200/50 p-2 rounded-lg text-[9px] font-semibold text-amber-700 leading-snug">
                            {simStatus.message}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center">
                    <AlertTriangle className="text-slate-400 size-8 mb-2 stroke-[1.5]" />
                    <p className="text-sm font-bold text-slate-700">No components found matching filters</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try clearing search criteria or toggle off "Filter Compatible" checkbox.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setOnlyCompatible(false);
                      }}
                      className="mt-4 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-all"
                    >
                      Clear Filter Constraints
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* NEXT RECOMMENDED STEP HINT CARD (retained below the product grid) */}
            {recommendedStep && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                  <div className="p-1 rounded bg-indigo-100 text-indigo-700 mt-0.5">
                    <Info size={14} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      Guided Recommendation: Select {recommendedStep.stepName} next
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium mt-1">
                      {recommendedStep.guidance}
                    </p>
                    <button
                      onClick={() => {
                        setActiveStep(recommendedStep.stepId);
                        setSearchQuery("");
                      }}
                      className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-extrabold text-indigo-600 hover:text-indigo-700"
                    >
                      Open {recommendedStep.stepName} Picker
                      <ArrowRight size={11} className="stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            </div>
          </section>

        </div>
      </main>

      {/* Checkout Confirmation Drawer */}
      <div className={`fixed inset-0 z-50 overflow-hidden flex items-end justify-center transition-all duration-300 ${checkoutDrawerOpen ? "pointer-events-auto" : "pointer-events-none opacity-0"}`}>
        <div 
          className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${checkoutDrawerOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setCheckoutDrawerOpen(false)}
        />
        <div 
          className={`relative w-full max-w-2xl bg-white rounded-t-3xl shadow-2xl z-10 max-h-[85vh] flex flex-col transform transition-transform duration-300 ${
            checkoutDrawerOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900">
              Review Your Build Before Adding to Cart
            </h3>
            <button 
              onClick={() => setCheckoutDrawerOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1 text-base font-bold"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Blueprint Items</h4>
              <div className="divide-y divide-slate-100 border border-slate-150 rounded-xl bg-slate-50/50 px-4">
                {build?.items?.map((item: any) => {
                  const step = BUILDER_STEPS.find(s => s.categoryCode === item.slotId);
                  return (
                    <div key={item.id} className="py-3 flex items-center justify-between text-xs gap-4">
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-slate-500 uppercase text-[9px] block">
                          {step?.name || item.slotId}
                        </span>
                        <span className="font-bold text-slate-800 truncate block mt-0.5">
                          {item.product?.name}
                        </span>
                      </div>
                      <span className="font-extrabold text-slate-950 tabular-nums">
                        ₹{Number(item.product?.price ?? 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {checkoutValidation.warnings && checkoutValidation.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Compatibility Warnings</h4>
                <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3.5 space-y-2">
                  {checkoutValidation.warnings.map((warning, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs font-semibold text-amber-800">
                      <AlertTriangle size={14} className="stroke-[2.5] text-amber-600 shrink-0 mt-0.5" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Build Price</span>
              <span className="text-lg font-black text-slate-900 tabular-nums">
                ₹{totalPrice.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setCheckoutDrawerOpen(false)}
                className="flex-1 sm:flex-none text-xs font-bold text-slate-500 hover:text-slate-700 px-4 py-2.5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleAddToCartAll();
                  setCheckoutDrawerOpen(false);
                }}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-6 py-2.5 rounded-xl shadow-md shadow-indigo-600/15 transition-all"
              >
                <ShoppingCart size={14} />
                Confirm — Add All to Cart
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
