"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Calculator,
  RefreshCw,
  Copy,
} from "lucide-react";

interface DerivedSpec {
  id: string;
  name: string;
  description?: string;
  resultSpecId: string;
  formula: string;
  createdAt: string;
  updatedAt: string;
  resultSpec?: {
    id: string;
    name: string;
    subCategoryId: string;
  };
}

interface SpecDefinition {
  id: string;
  name: string;
  subCategoryId: string;
  subCategory?: {
    name: string;
  };
}

const DerivedSpecManager: React.FC = () => {
  const [derivedSpecs, setDerivedSpecs] = useState<DerivedSpec[]>([]);
  const [specs, setSpecs] = useState<SpecDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSpec, setEditingSpec] = useState<DerivedSpec | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    resultSpecId: "",
    formula: "",
  });

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      // For now, we'll mock the data since the API endpoints don't exist yet
      // In a real implementation, you would fetch from /api/compatibility/derived-specs
      const mockDerivedSpecs: DerivedSpec[] = [
        {
          id: "1",
          name: "Total TDP",
          description: "Total thermal design power of all components",
          resultSpecId: "spec1",
          formula: "SUM(CPU.TDP, GPU.TDP)",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          resultSpec: {
            id: "spec1",
            name: "Total_TDP",
            subCategoryId: "cat1",
          },
        },
        {
          id: "2",
          name: "PSU Headroom",
          description: "Available power capacity after component requirements",
          resultSpecId: "spec2",
          formula: "SUBTRACT(PSU.Wattage, Total_TDP)",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          resultSpec: {
            id: "spec2",
            name: "PSU_Headroom",
            subCategoryId: "cat2",
          },
        },
      ];

      const mockSpecs: SpecDefinition[] = [
        { id: "spec1", name: "Total_TDP", subCategoryId: "cat1" },
        { id: "spec2", name: "PSU_Headroom", subCategoryId: "cat2" },
        { id: "spec3", name: "TDP", subCategoryId: "cat3" },
        { id: "spec4", name: "Wattage", subCategoryId: "cat4" },
      ];

      setDerivedSpecs(mockDerivedSpecs);
      setSpecs(mockSpecs);
    } catch (error) {
      console.error("Failed to fetch derived specs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Form handling
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      resultSpecId: "",
      formula: "",
    });
    setEditingSpec(null);
  };

  const handleEdit = (spec: DerivedSpec) => {
    setEditingSpec(spec);
    setFormData({
      name: spec.name,
      description: spec.description || "",
      resultSpecId: spec.resultSpecId,
      formula: spec.formula,
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      // Mock save operation
      if (editingSpec) {
        // Update existing spec
        setDerivedSpecs(prev =>
          prev.map(spec =>
            spec.id === editingSpec.id
              ? { ...spec, ...formData, updatedAt: new Date().toISOString() }
              : spec
          )
        );
      } else {
        // Create new spec
        const newSpec: DerivedSpec = {
          id: Date.now().toString(),
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setDerivedSpecs(prev => [...prev, newSpec]);
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to save derived spec:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this derived spec?")) return;
    
    try {
      // Mock delete operation
      setDerivedSpecs(prev => prev.filter(spec => spec.id !== id));
    } catch (error) {
      console.error("Failed to delete derived spec:", error);
    }
  };

  const getFormulaPreview = (formula: string) => {
    // Simple preview of the formula
    if (!formula) return "No formula";
    
    // This would be more sophisticated in a real implementation
    return formula;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Derived Specifications</h2>
          <p className="text-muted-foreground">
            Define computed specifications that aggregate values from multiple components
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Derived Spec
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            About Derived Specs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              Derived specifications allow you to compute values from multiple components, such as:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>Total TDP:</strong> SUM(CPU.TDP, GPU.TDP)</li>
              <li><strong>PSU Headroom:</strong> SUBTRACT(PSU.Wattage, Total_TDP)</li>
              <li><strong>Total RAM:</strong> SUM(RAM.Capacity)</li>
              <li><strong>Storage Space:</strong> SUM(STORAGE.Capacity)</li>
            </ul>
            <p>
              These computed values can then be used in GLOBAL compatibility rules.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Derived Specs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Derived Specifications</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading derived specs...</span>
            </div>
          ) : derivedSpecs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No derived specifications found. Create your first derived spec to get started.
            </div>
          ) : (
            <ScrollArea className="h-[400px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Formula</TableHead>
                    <TableHead>Result Spec</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {derivedSpecs.map((spec) => (
                    <TableRow key={spec.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{spec.name}</div>
                          {spec.description && (
                            <div className="text-sm text-muted-foreground">
                              {spec.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {getFormulaPreview(spec.formula)}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(spec.formula)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {spec.resultSpec?.name || spec.resultSpecId}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(spec.updatedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(spec)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Formula
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(spec.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSpec ? "Edit Derived Specification" : "Create Derived Specification"}
            </DialogTitle>
            <DialogDescription>
              Define a computed specification that aggregates values from multiple components.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Total TDP"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description of what this spec computes"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="resultSpecId">Result Specification</Label>
              <select
                id="resultSpecId"
                value={formData.resultSpecId}
                onChange={(e) => setFormData(prev => ({ ...prev, resultSpecId: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="">Select a specification</option>
                {specs.map((spec) => (
                  <option key={spec.id} value={spec.id}>
                    {spec.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="formula">Formula</Label>
              <Textarea
                id="formula"
                value={formData.formula}
                onChange={(e) => setFormData(prev => ({ ...prev, formula: e.target.value }))}
                placeholder="e.g., SUM(CPU.TDP, GPU.TDP)"
                rows={3}
                className="font-mono text-sm"
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                Available functions: SUM(), SUBTRACT(), MULTIPLY(), DIVIDE()
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.name || !formData.formula}>
              {editingSpec ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DerivedSpecManager;
