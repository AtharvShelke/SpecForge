"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Play,
  Bug,
  RefreshCw,
  Plus,
  Minus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
} from "lucide-react";

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

  // Fetch available variants
  const fetchVariants = async () => {
    setLoadingVariants(true);
    try {
      // Mock data for now - in real implementation, fetch from API
      const mockVariants: ProductVariant[] = [
        {
          id: "1",
          sku: "CPU-I9-14900K",
          price: 599.99,
          product: {
            id: "p1",
            name: "Intel Core i9-14900K",
            subCategory: {
              id: "cpu",
              name: "CPU",
            },
          },
          variantSpecs: [
            {
              spec: { id: "spec1", name: "TDP" },
              valueNumber: 253,
            },
            {
              spec: { id: "spec2", name: "Socket" },
              option: { value: "LGA1700" },
            },
          ],
        },
        {
          id: "2",
          sku: "GPU-RTX4090",
          price: 1599.99,
          product: {
            id: "p2",
            name: "NVIDIA RTX 4090",
            subCategory: {
              id: "gpu",
              name: "GPU",
            },
          },
          variantSpecs: [
            {
              spec: { id: "spec3", name: "TDP" },
              valueNumber: 450,
            },
            {
              spec: { id: "spec4", name: "Memory" },
              valueNumber: 24,
            },
          ],
        },
        {
          id: "3",
          sku: "PSU-650W",
          price: 89.99,
          product: {
            id: "p3",
            name: "Corsair RM650x",
            subCategory: {
              id: "psu",
              name: "PSU",
            },
          },
          variantSpecs: [
            {
              spec: { id: "spec5", name: "Wattage" },
              valueNumber: 650,
            },
          ],
        },
        {
          id: "4",
          sku: "MB-Z790",
          price: 399.99,
          product: {
            id: "p4",
            name: "ASUS ROG Strix Z790-E",
            subCategory: {
              id: "mb",
              name: "Motherboard",
            },
          },
          variantSpecs: [
            {
              spec: { id: "spec2", name: "Socket" },
              option: { value: "LGA1700" },
            },
          ],
        },
      ];

      setAvailableVariants(mockVariants);
    } catch (error) {
      console.error("Failed to fetch variants:", error);
    } finally {
      setLoadingVariants(false);
    }
  };

  useEffect(() => {
    fetchVariants();
  }, []);

  // Handle variant selection
  const addVariant = (variant: ProductVariant) => {
    if (!selectedVariants.find(v => v.id === variant.id)) {
      setSelectedVariants(prev => [...prev, variant]);
    }
  };

  const removeVariant = (variantId: string) => {
    setSelectedVariants(prev => prev.filter(v => v.id !== variantId));
  };

  // Run compatibility test
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
        // Mock result for demo
        const mockResult: TestResult = {
          isCompatible: false,
          summary: {
            totalChecks: 3,
            passed: 2,
            failed: 1,
            errors: 1,
            warnings: 0,
          },
          details: [
            {
              ruleId: "1",
              ruleName: "CPU-Motherboard Socket Match",
              passed: true,
              message: "OK",
              severity: "ERROR",
            },
            {
              ruleId: "2",
              ruleName: "PSU Wattage Sufficient",
              passed: false,
              message: "Total system TDP (703W + 100W headroom) exceeds PSU capacity (650W)",
              severity: "ERROR",
              sourceValue: 650,
              targetValue: 803,
            },
            {
              ruleId: "3",
              ruleName: "GPU Compatibility",
              passed: true,
              message: "OK",
              severity: "INFO",
            },
          ],
        };
        setTestResult(mockResult);
      }
    } catch (error) {
      console.error("Failed to run test:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get icon for severity
  const getSeverityIcon = (severity: string, passed: boolean) => {
    if (passed) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    
    switch (severity) {
      case "ERROR":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "WARNING":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case "INFO":
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-600" />;
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rule Sandbox</h2>
          <p className="text-muted-foreground">
            Test compatibility rules against selected components
          </p>
        </div>
        <Button onClick={runTest} disabled={loading || selectedVariants.length < 2}>
          {loading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          Run Test
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Component Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Component Selection</CardTitle>
            <CardDescription>
              Add components to test their compatibility
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Available Variants */}
            <div>
              <h4 className="text-sm font-medium mb-2">Available Components</h4>
              {loadingVariants ? (
                <div className="flex items-center justify-center py-4">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm">Loading components...</span>
                </div>
              ) : (
                <ScrollArea className="h-[200px] border rounded-md p-2">
                  <div className="space-y-2">
                    {availableVariants.map((variant) => (
                      <div
                        key={variant.id}
                        className="flex items-center justify-between p-2 border rounded hover:bg-muted/50"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{variant.product.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {variant.product.subCategory.name} • {getVariantSpecs(variant)}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addVariant(variant)}
                          disabled={selectedVariants.find(v => v.id === variant.id) !== undefined}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Selected Variants */}
            <div>
              <h4 className="text-sm font-medium mb-2">
                Selected Components ({selectedVariants.length})
              </h4>
              <ScrollArea className="h-[200px] border rounded-md p-2">
                {selectedVariants.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No components selected
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedVariants.map((variant) => (
                      <div
                        key={variant.id}
                        className="flex items-center justify-between p-2 border rounded bg-muted/30"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{variant.product.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {variant.product.subCategory.name}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeVariant(variant.id)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Compatibility check results for selected components
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!testResult ? (
              <div className="text-center py-8 text-muted-foreground">
                <Play className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Run a test to see compatibility results</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${testResult.isCompatible ? 'text-green-600' : 'text-red-600'}`}>
                      {testResult.isCompatible ? 'Compatible' : 'Incompatible'}
                    </div>
                    <div className="text-sm text-muted-foreground">Overall Status</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {testResult.summary.failed}/{testResult.summary.totalChecks}
                    </div>
                    <div className="text-sm text-muted-foreground">Failed Checks</div>
                  </div>
                </div>

                {/* Detailed Results */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Detailed Results</h4>
                  <ScrollArea className="h-[300px] border rounded-md">
                    <div className="p-2 space-y-2">
                      {testResult.details.map((detail, index) => (
                        <div
                          key={index}
                          className="p-3 border rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getSeverityIcon(detail.severity, detail.passed)}
                              <span className="font-medium text-sm">{detail.ruleName}</span>
                              <Badge variant={detail.severity === "ERROR" ? "destructive" : detail.severity === "WARNING" ? "secondary" : "outline"}>
                                {detail.severity}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {detail.message}
                          </div>
                          {detail.sourceValue !== undefined && detail.targetValue !== undefined && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Values: {detail.sourceValue} vs {detail.targetValue}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RuleSandbox;
