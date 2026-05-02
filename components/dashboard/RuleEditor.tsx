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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, X } from "lucide-react";

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

  // Initialize form data when rule changes
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

  // Fetch scopes and specs when dialog opens
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

  // Filter specs based on selected scope
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {rule ? "Edit Compatibility Rule" : "Create Compatibility Rule"}
          </DialogTitle>
          <DialogDescription>
            Configure a compatibility rule to validate PC builds.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Rule Name</Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g., CPU-Motherboard Socket Match"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Rule Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleInputChange("type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAIR">
                        <div className="flex items-center gap-2">
                          <Badge variant="default">Pair</Badge>
                          <span>Compare two components</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="COMPONENT">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 text-blue-800">Component</Badge>
                          <span>Single component constraint</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="GLOBAL">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-purple-100 text-purple-800">Global</Badge>
                          <span>Full-build constraint</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Optional description of what this rule checks"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="severity">Severity</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value) => handleInputChange("severity", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ERROR">
                        <Badge variant="destructive">Error</Badge>
                      </SelectItem>
                      <SelectItem value="WARNING">
                        <Badge variant="secondary">Warning</Badge>
                      </SelectItem>
                      <SelectItem value="INFO">
                        <Badge variant="outline">Info</Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority || 0}
                    onChange={(e) => handleInputChange("priority", parseInt(e.target.value))}
                    min={0}
                    max={100}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    checked={formData.enabled || false}
                    onCheckedChange={(checked) => handleInputChange("enabled", checked)}
                  />
                  <Label htmlFor="enabled">Enabled</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rule Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rule Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.type === "PAIR" && (
                <>
                  <div>
                    <Label htmlFor="scope">Compatibility Scope</Label>
                    <Select
                      value={formData.scopeId || ""}
                      onValueChange={(value) => {
                        handleInputChange("scopeId", value);
                        // Clear spec selections when scope changes
                        handleInputChange("sourceSpecId", "");
                        handleInputChange("targetSpecId", "");
                      }}
                    >
                      <SelectTrigger>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sourceSpec">Source Spec</Label>
                      <Select
                        value={formData.sourceSpecId || ""}
                        onValueChange={(value) => handleInputChange("sourceSpecId", value)}
                        disabled={!formData.scopeId}
                      >
                        <SelectTrigger>
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
                    <div>
                      <Label htmlFor="targetSpec">Target Spec</Label>
                      <Select
                        value={formData.targetSpecId || ""}
                        onValueChange={(value) => handleInputChange("targetSpecId", value)}
                        disabled={!formData.scopeId}
                      >
                        <SelectTrigger>
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

                  <div>
                    <Label htmlFor="operator">Operator</Label>
                    <Select
                      value={formData.operator || ""}
                      onValueChange={(value) => handleInputChange("operator", value)}
                    >
                      <SelectTrigger>
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
                </>
              )}

              {(formData.type === "COMPONENT" || formData.type === "GLOBAL") && (
                <div>
                  <Label htmlFor="logic">Logic Configuration</Label>
                  <Textarea
                    id="logic"
                    value={formData.logic ? JSON.stringify(formData.logic, null, 2) : ""}
                    onChange={(e) => {
                      try {
                        const logic = e.target.value ? JSON.parse(e.target.value) : null;
                        handleInputChange("logic", logic);
                      } catch (error) {
                        // Invalid JSON, don't update
                      }
                    }}
                    placeholder='{"operator": "GREATER_OR_EQUAL", "left": {"ref": "PSU.Wattage"}, "right": {"ref": "totals.totalTDP", "offset": 100}}'
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    JSON configuration for complex logic. Use variable references like "CPU.TDP" or "totals.totalTDP".
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Message Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Message Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="message">Error Message</Label>
                <Textarea
                  id="message"
                  value={formData.message || ""}
                  onChange={(e) => handleInputChange("message", e.target.value)}
                  placeholder="Message to show when rule fails"
                  rows={2}
                  required
                />
              </div>
              <div>
                <Label htmlFor="messageTemplate">Message Template (Optional)</Label>
                <Textarea
                  id="messageTemplate"
                  value={formData.messageTemplate || ""}
                  onChange={(e) => handleInputChange("messageTemplate", e.target.value)}
                  placeholder="Template with variable interpolation: e.g., 'CPU {source.name} ({source.TDP}W) exceeds limit'"
                  rows={2}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Use {"{"}source.field{"}"}, {"{"}target.field{"}"}, or {"{"}totals.field{"}"} for dynamic values.
                </p>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid() || loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {rule ? "Update Rule" : "Create Rule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RuleEditor;
