"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play,
  RefreshCw,
  Plus,
  Minus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSandboxVariants } from "@/app/actions/sandbox.actions";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CompatibilityRule {
  id: string;
  name: string;
  description?: string;
  type: "PAIR" | "COMPONENT" | "GLOBAL";
  enabled: boolean;
  priority: number;
  severity: "ERROR" | "WARNING" | "INFO";
  message: string;
  messageTemplate?: string;
}

interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  product: {
    id: string;
    name: string;
    subCategory: {
      id: string;
      name: string;
    };
  };
  variantSpecs: Array<{
    spec: {
      id: string;
      name: string;
    };
    valueString?: string;
    valueNumber?: number;
    option?: {
      value: string;
    };
  }>;
}

interface TestResult {
  isCompatible: boolean;
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    errors: number;
    warnings: number;
  };
  details: Array<{
    ruleId: string;
    ruleName: string;
    passed: boolean;
    message: string;
    severity: string;
    sourceValue?: any;
    targetValue?: any;
  }>;
  context?: any;
}

interface RuleSandboxProps {
  rules: CompatibilityRule[];
}

const RuleSandbox: React.FC<RuleSandboxProps> = ({ rules }) => {
  const [selectedVariants, setSelectedVariants] = useState<ProductVariant[]>([]);
  const [availableVariants, setAvailableVariants] = useState<ProductVariant[]>([]);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;
  const [selectedSpecVariant, setSelectedSpecVariant] = useState<ProductVariant | null>(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const fetchVariants = async () => {
    setLoadingVariants(true);
    try {
      const data = await getSandboxVariants({
        search: debouncedSearch,
        page,
        limit,
      });
      setAvailableVariants(data.items as ProductVariant[]);
      setTotalItems(data.total);
    } catch (error) {
      console.error("Failed to fetch variants:", error);
    } finally {
      setLoadingVariants(false);
    }
  };

  useEffect(() => {
    fetchVariants();
  }, [debouncedSearch, page]);

  const addVariant = (variant: ProductVariant) => {
    if (!selectedVariants.find(v => v.id === variant.id)) {
      setSelectedVariants(prev => [...prev, variant]);
    }
  };

  const removeVariant = (variantId: string) => {
    setSelectedVariants(prev => prev.filter(v => v.id !== variantId));
  };

  const runTest = async () => {
    if (selectedVariants.length < 2) {
      alert("Please select at least 2 components to test compatibility");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/compatibility/rules/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantIds: selectedVariants.map(v => v.id),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setTestResult(result);
      } else {
        console.error("API request failed:", response.statusText);
        alert("Failed to run compatibility test. Please try again.");
      }
    } catch (error) {
      console.error("Failed to run test:", error);
      alert("Failed to run compatibility test. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity: string, passed: boolean) => {
    if (passed) {
      return <CheckCircle className="h-4 w-4 text-emerald-600" />;
    }
    
    switch (severity) {
      case "ERROR":
        return <XCircle className="h-4 w-4 text-rose-600" />;
      case "WARNING":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case "INFO":
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return <XCircle className="h-4 w-4 text-slate-400" />;
    }
  };

  const getVariantSpecs = (variant: ProductVariant) => {
    return variant.variantSpecs.map(spec => {
      const value = spec.option?.value || spec.valueNumber || spec.valueString || "N/A";
      return `${spec.spec.name}: ${value}`;
    }).join(", ");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Rule Sandbox</h2>
          <p className="mt-1 text-sm text-slate-500">
            Test compatibility rules against simulated component selections.
          </p>
        </div>
        <button 
          onClick={runTest} 
          disabled={loading || selectedVariants.length < 2}
          className="flex h-9 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Run Test
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Component Selection Area */}
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-200 bg-white px-5 py-4">
            <h3 className="text-base font-semibold text-slate-900">Component Selection</h3>
            <p className="text-xs text-slate-500">Add components to test their interactions.</p>
          </div>
          
          <div className="p-5 space-y-6 flex-1 flex flex-col">
            {/* Available Components */}
            <div className="flex-1 flex flex-col min-h-[250px]">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-slate-700">Available Components</h4>
                <div className="relative w-48">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input 
                    placeholder="Search components..." 
                    className="h-8 pl-8 text-xs" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 rounded-md border border-slate-200 bg-slate-50 overflow-hidden flex flex-col">
                {loadingVariants ? (
                  <div className="flex flex-1 h-full items-center justify-center text-slate-500">
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading components...</span>
                  </div>
                ) : (
                  <>
                    <ScrollArea className="flex-1 h-0">
                      <div className="p-2 pr-4 space-y-1">
                        {availableVariants.map((variant) => {
                          const isSelected = selectedVariants.some(v => v.id === variant.id);
                          return (
                            <div
                              key={variant.id}
                              className="flex items-center justify-between p-3 rounded-md bg-white border border-slate-200 transition-colors hover:border-slate-300"
                            >
                              <div className="min-w-0 flex-1 pr-3">
                                <p className="truncate text-sm font-semibold text-slate-900">{variant.product.name}</p>
                                <p className="truncate text-xs text-slate-500 mt-0.5">
                                  {variant.product.subCategory.name}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setSelectedSpecVariant(variant)}
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50"
                                  title="View Specs"
                                >
                                  <Eye size={14} />
                                </button>
                                <button
                                  onClick={() => addVariant(variant)}
                                  disabled={isSelected}
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                    <div className="border-t border-slate-200 bg-white px-3 py-2 flex items-center justify-between shrink-0">
                      <span className="text-xs text-slate-500">
                        {totalItems === 0 ? "No items" : `${(page - 1) * limit + 1}-${Math.min(page * limit, totalItems)} of ${totalItems}`}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-7 w-7" 
                          disabled={page === 1}
                          onClick={() => setPage(p => p - 1)}
                        >
                          <ChevronLeft size={14} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-7 w-7" 
                          disabled={page * limit >= totalItems}
                          onClick={() => setPage(p => p + 1)}
                        >
                          <ChevronRight size={14} />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Selected Components */}
            <div className="flex-1 flex flex-col min-h-[250px]">
              <h4 className="text-sm font-medium text-slate-700 mb-2">
                Selected Components <span className="ml-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{selectedVariants.length}</span>
              </h4>
              <div className="flex-1 rounded-md border border-slate-200 bg-slate-50 overflow-hidden">
                {selectedVariants.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    No components selected.
                  </div>
                ) : (
                  <ScrollArea className="h-full">
                    <div className="p-2 pr-4 space-y-1">
                      {selectedVariants.map((variant) => (
                        <div
                          key={variant.id}
                          className="flex items-center justify-between p-3 rounded-md bg-white border border-slate-300 shadow-sm"
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            <p className="truncate text-sm font-semibold text-slate-900">{variant.product.name}</p>
                            <p className="text-xs font-medium text-slate-500 mt-0.5">
                              {variant.product.subCategory.name}
                            </p>
                          </div>
                          <button
                            onClick={() => removeVariant(variant.id)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Minus size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Test Results Area */}
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-200 bg-white px-5 py-4">
            <h3 className="text-base font-semibold text-slate-900">Test Results</h3>
            <p className="text-xs text-slate-500">Compatibility check output for the active selection.</p>
          </div>
          
          <div className="p-5 flex-1 flex flex-col bg-slate-50/50">
            {!testResult ? (
              <div className="flex h-full flex-col items-center justify-center text-slate-400 py-12">
                <Play className="mb-3 h-8 w-8 opacity-20" />
                <p className="text-sm font-medium">Run a test to see compatibility results.</p>
              </div>
            ) : (
              <div className="space-y-6 flex-1 flex flex-col">
                {/* Summary Row */}
                <div className="grid grid-cols-2 gap-4 shrink-0">
                  <div className="rounded-md border border-slate-200 bg-white p-4 text-center shadow-sm">
                    <p className={cn("text-xl font-bold font-mono", testResult.isCompatible ? "text-emerald-600" : "text-rose-600")}>
                      {testResult.isCompatible ? "Compatible" : "Incompatible"}
                    </p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500">Overall Status</p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-white p-4 text-center shadow-sm">
                    <p className="text-xl font-bold font-mono text-slate-900">
                      {testResult.summary.failed} <span className="text-slate-400">/ {testResult.summary.totalChecks}</span>
                    </p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500">Failed Checks</p>
                  </div>
                </div>

                {/* Detailed Results */}
                <div className="flex-1 flex flex-col min-h-[300px]">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">Detailed Log</h4>
                  <div className="flex-1 rounded-md border border-slate-200 bg-white overflow-hidden shadow-sm">
                    <ScrollArea className="h-full">
                      <div className="p-3 space-y-2">
                        {testResult.details.map((detail, index) => (
                          <div
                            key={index}
                            className="rounded-md border border-slate-100 bg-slate-50 p-4"
                          >
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div className="flex items-center gap-2">
                                {getSeverityIcon(detail.severity, detail.passed)}
                                <span className="font-semibold text-sm text-slate-900">{detail.ruleName}</span>
                              </div>
                              <span
                                className={cn(
                                  "shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                                  detail.severity === "ERROR" ? "border-rose-200 bg-rose-50 text-rose-700" :
                                  detail.severity === "WARNING" ? "border-amber-200 bg-amber-50 text-amber-700" :
                                  "border-slate-200 bg-white text-slate-600"
                                )}
                              >
                                {detail.severity}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {detail.message}
                            </p>
                            {detail.sourceValue !== undefined && detail.targetValue !== undefined && (
                              <div className="mt-3 rounded-md bg-white border border-slate-100 p-2 font-mono text-xs text-slate-500 flex items-center gap-2">
                                <span className="font-medium text-slate-700">Values:</span>
                                <span>{String(detail.sourceValue)}</span>
                                <span className="text-slate-300">vs</span>
                                <span>{String(detail.targetValue)}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={!!selectedSpecVariant} onOpenChange={(open) => !open && setSelectedSpecVariant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedSpecVariant?.product.name} Specs</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto">
            {selectedSpecVariant?.variantSpecs.map((spec, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-xs font-medium text-slate-500">{spec.spec.name}</span>
                <span className="text-sm text-slate-900">{spec.option?.value || spec.valueNumber || spec.valueString || "N/A"}</span>
              </div>
            ))}
            {selectedSpecVariant?.variantSpecs.length === 0 && (
              <p className="text-sm text-slate-500 col-span-2">No specs defined for this component.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RuleSandbox;