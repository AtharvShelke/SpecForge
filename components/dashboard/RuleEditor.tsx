"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

interface CompatibilityRule {
  id?: string;
  name: string;
  description?: string;
  type: "PAIR" | "COMPONENT" | "GLOBAL";
  enabled: boolean;
  priority: number;
  severity: "ERROR" | "WARNING" | "INFO";
  scopeId?: string;
  sourceSpecId?: string;
  targetSpecId?: string;
  operator?: string;
  message: string;
  messageTemplate?: string;
  logic?: any;
}

interface CompatibilityScope {
  id: string;
  sourceSubCategory: { name: string; id: string };
  targetSubCategory: { name: string; id: string };
}

interface SpecDefinition {
  id: string;
  name: string;
  subCategoryId: string;
}

interface RuleEditorProps {
  rule: CompatibilityRule | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: Partial<CompatibilityRule>) => void;
}

const RuleEditor: React.FC<RuleEditorProps> = ({
  rule,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<CompatibilityRule>>({
    name: "",
    description: "",
    type: "PAIR",
    enabled: true,
    priority: 0,
    severity: "ERROR",
    message: "",
    messageTemplate: "",
  });
  const [scopes, setScopes] = useState<CompatibilityScope[]>([]);
  const [specs, setSpecs] = useState<SpecDefinition[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (rule) {
      setFormData(rule);
    } else {
      setFormData({
        name: "",
        description: "",
        type: "PAIR",
        enabled: true,
        priority: 0,
        severity: "ERROR",
        message: "",
        messageTemplate: "",
      });
    }
  }, [rule]);

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        fetch("/api/compatibility/scopes").then((res) => res.json()),
        fetch("/api/catalog/specs").then((res) => res.json()),
      ]).then(([scopesData, specsData]) => {
        setScopes(scopesData || []);
        setSpecs(specsData || []);
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getSpecsForScope = (scopeId: string, isSource: boolean) => {
    const scope = scopes.find((s) => s.id === scopeId);
    if (!scope) return [];

    const subCategoryId = isSource
      ? scope.sourceSubCategory.id
      : scope.targetSubCategory.id;

    return specs.filter((spec) => spec.subCategoryId === subCategoryId);
  };

  const isFormValid = () => {
    if (!formData.name || !formData.message) return false;

    if (formData.type === "PAIR") {
      return !!(formData.scopeId && formData.sourceSpecId && formData.targetSpecId && formData.operator);
    }

    return true;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] w-[95vw] sm:max-w-2xl flex-col overflow-hidden p-0 rounded-lg border-slate-200 bg-white shadow-lg">
        <DialogHeader className="shrink-0 border-b border-slate-100 px-6 py-5">
          <DialogTitle className="text-lg font-semibold text-slate-900">
            {rule ? "Edit Compatibility Rule" : "Create Compatibility Rule"}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Configure a dynamic rule to validate PC component selections.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          <form id="rule-form" onSubmit={handleSubmit} className="space-y-8">

            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">Basic Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Rule Name</label>
                  <Input
                    value={formData.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g., CPU-Motherboard Socket Match"
                    className="h-10 rounded-md border-slate-200 text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Rule Type</label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleInputChange("type", value)}
                  >
                    <SelectTrigger className="h-10 rounded-md border-slate-200 bg-white text-sm">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAIR">Pair (Compare two components)</SelectItem>
                      <SelectItem value="COMPONENT">Component (Single constraint)</SelectItem>
                      <SelectItem value="GLOBAL">Global (Full-build constraint)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Description</label>
                  <Textarea
                    value={formData.description || ""}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Optional description of what this rule checks"
                    rows={2}
                    className="resize-none rounded-md border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Severity</label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value) => handleInputChange("severity", value)}
                  >
                    <SelectTrigger className="h-10 rounded-md border-slate-200 bg-white text-sm">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ERROR">Error</SelectItem>
                      <SelectItem value="WARNING">Warning</SelectItem>
                      <SelectItem value="INFO">Info</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Priority</label>
                  <Input
                    type="number"
                    value={formData.priority || 0}
                    onChange={(e) => handleInputChange("priority", parseInt(e.target.value))}
                    min={0}
                    max={100}
                    className="h-10 rounded-md border-slate-200 text-sm font-mono"
                  />
                </div>
                <div className="flex items-center space-x-3 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enabled || false}
                      onChange={(e) => handleInputChange("enabled", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span className="text-sm font-medium text-slate-700">Rule Enabled</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Rule Configuration */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">Rule Configuration</h4>

              {formData.type === "PAIR" && (
                <div className="space-y-4 rounded-md border border-slate-200 bg-slate-50 p-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">Compatibility Scope</label>
                    <Select
                      value={formData.scopeId || ""}
                      onValueChange={(value) => {
                        handleInputChange("scopeId", value);
                        handleInputChange("sourceSpecId", "");
                        handleInputChange("targetSpecId", "");
                      }}
                    >
                      <SelectTrigger className="h-10 rounded-md border-slate-200 bg-white text-sm">
                        <SelectValue placeholder="Select scope" />
                      </SelectTrigger>
                      <SelectContent>
                        {scopes.map((scope) => (
                          <SelectItem key={scope.id} value={scope.id}>
                            {scope.sourceSubCategory.name} → {scope.targetSubCategory.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700">Source Spec</label>
                      <Select
                        value={formData.sourceSpecId || ""}
                        onValueChange={(value) => handleInputChange("sourceSpecId", value)}
                        disabled={!formData.scopeId}
                      >
                        <SelectTrigger className="h-10 rounded-md border-slate-200 bg-white text-sm">
                          <SelectValue placeholder="Select source spec" />
                        </SelectTrigger>
                        <SelectContent>
                          {getSpecsForScope(formData.scopeId || "", true).map((spec) => (
                            <SelectItem key={spec.id} value={spec.id}>
                              {spec.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700">Target Spec</label>
                      <Select
                        value={formData.targetSpecId || ""}
                        onValueChange={(value) => handleInputChange("targetSpecId", value)}
                        disabled={!formData.scopeId}
                      >
                        <SelectTrigger className="h-10 rounded-md border-slate-200 bg-white text-sm">
                          <SelectValue placeholder="Select target spec" />
                        </SelectTrigger>
                        <SelectContent>
                          {getSpecsForScope(formData.scopeId || "", false).map((spec) => (
                            <SelectItem key={spec.id} value={spec.id}>
                              {spec.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">Operator</label>
                    <Select
                      value={formData.operator || ""}
                      onValueChange={(value) => handleInputChange("operator", value)}
                    >
                      <SelectTrigger className="h-10 rounded-md border-slate-200 bg-white text-sm">
                        <SelectValue placeholder="Select operator" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EQUAL">Equal (=)</SelectItem>
                        <SelectItem value="NOT_EQUAL">Not Equal (≠)</SelectItem>
                        <SelectItem value="LESS_THAN">Less Than (&lt;)</SelectItem>
                        <SelectItem value="LESS_OR_EQUAL">Less or Equal (≤)</SelectItem>
                        <SelectItem value="GREATER_THAN">Greater Than (&gt;)</SelectItem>
                        <SelectItem value="GREATER_OR_EQUAL">Greater or Equal (≥)</SelectItem>
                        <SelectItem value="CONTAINS">Contains</SelectItem>
                        <SelectItem value="IN_LIST">In List</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {(formData.type === "COMPONENT" || formData.type === "GLOBAL") && (
                <div className="space-y-1.5 rounded-md border border-slate-200 bg-slate-50 p-4">
                  <label className="text-xs font-medium text-slate-700">Logic Configuration</label>
                  <Textarea
                    value={formData.logic ? JSON.stringify(formData.logic, null, 2) : ""}
                    onChange={(e) => {
                      try {
                        const logic = e.target.value ? JSON.parse(e.target.value) : null;
                        handleInputChange("logic", logic);
                      } catch (error) {
                        // Let users type invalid JSON temporarily
                      }
                    }}
                    placeholder='{"operator": "GREATER_OR_EQUAL", "left": {"ref": "PSU.Wattage"}, "right": {"ref": "totals.totalTDP", "offset": 100}}'
                    rows={6}
                    className="font-mono text-xs rounded-md border-slate-200 bg-white"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    JSON configuration for complex logic. Use variable references like "CPU.TDP" or "totals.totalTDP".
                  </p>
                </div>
              )}
            </div>

            {/* Message Configuration */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">Messages</h4>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Error Message</label>
                  <Textarea
                    value={formData.message || ""}
                    onChange={(e) => handleInputChange("message", e.target.value)}
                    placeholder="Message to show when rule fails"
                    rows={2}
                    className="resize-none rounded-md border-slate-200 text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Message Template (Optional)</label>
                  <Textarea
                    value={formData.messageTemplate || ""}
                    onChange={(e) => handleInputChange("messageTemplate", e.target.value)}
                    placeholder="Template with variables: e.g., 'CPU {source.name} ({source.TDP}W) exceeds limit'"
                    rows={2}
                    className="resize-none rounded-md border-slate-200 text-sm font-mono"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Use <span className="font-medium text-slate-700">{"{source.field}"}</span>, <span className="font-medium text-slate-700">{"{target.field}"}</span>, or <span className="font-medium text-slate-700">{"{totals.field}"}</span> for dynamic values.
                  </p>
                </div>
              </div>
            </div>

          </form>
        </div>

        <DialogFooter className="shrink-0 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-md border-slate-200 text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="rule-form"
            disabled={!isFormValid() || loading}
            className="rounded-md bg-slate-900 text-white hover:bg-slate-800"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {rule ? "Update Rule" : "Create Rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RuleEditor;