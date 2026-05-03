"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  description?: string | null;
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [derivedSpecsRes, specsRes] = await Promise.all([
        fetch('/api/admin/derived-specs'),
        fetch('/api/catalog/specs')
      ]);

      if (!derivedSpecsRes.ok || !specsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [derivedSpecs, specs] = await Promise.all([
        derivedSpecsRes.json(),
        specsRes.json()
      ]);

      setDerivedSpecs(derivedSpecs);
      setSpecs(specs);
    } catch (error) {
      console.error("Failed to fetch derived specs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      const url = editingSpec 
        ? `/api/admin/derived-specs/${editingSpec.id}`
        : '/api/admin/derived-specs';
      
      const method = editingSpec ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        throw new Error('Failed to save derived spec');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Failed to save derived spec:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this derived spec?")) return;
    try {
      const res = await fetch(`/api/admin/derived-specs/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        throw new Error('Failed to delete derived spec');
      }

      setDerivedSpecs(prev => prev.filter(spec => spec.id !== id));
    } catch (error) {
      console.error("Failed to delete derived spec:", error);
    }
  };

  const getFormulaPreview = (formula: string) => {
    if (!formula) return "No formula";
    return formula;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Derived Specifications</h2>
          <p className="mt-1 text-sm text-slate-500">
            Define computed specifications that aggregate values from multiple components.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleCreate}
            className="flex h-9 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">New Spec</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Calculator size={16} className="text-slate-500" />
            About Derived Specs
          </h3>
          <div className="mt-3 text-sm text-slate-600">
            <p className="mb-2">Derived specifications allow you to compute values from multiple components, such as:</p>
            <ul className="list-inside list-disc space-y-1 text-slate-500 ml-1">
              <li><strong className="text-slate-700 font-medium">Total TDP:</strong> <span className="font-mono text-xs">SUM(CPU.TDP, GPU.TDP)</span></li>
              <li><strong className="text-slate-700 font-medium">PSU Headroom:</strong> <span className="font-mono text-xs">SUBTRACT(PSU.Wattage, Total_TDP)</span></li>
              <li><strong className="text-slate-700 font-medium">Total RAM:</strong> <span className="font-mono text-xs">SUM(RAM.Capacity)</span></li>
            </ul>
            <p className="mt-3">These computed values can then be used in GLOBAL compatibility rules.</p>
          </div>
        </div>

        <div className="bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-500">
              <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
              <span className="text-sm">Loading derived specs...</span>
            </div>
          ) : derivedSpecs.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-500">
              No derived specifications found. Create your first derived spec to get started.
            </div>
          ) : (
            <ScrollArea className="h-[400px] w-full">
              <Table className="w-full text-left text-sm text-slate-600">
                <TableHeader className="bg-slate-50/50 text-xs text-slate-500">
                  <TableRow className="border-b border-slate-200">
                    <TableHead className="px-5 py-3 font-medium">Name</TableHead>
                    <TableHead className="px-5 py-3 font-medium">Formula</TableHead>
                    <TableHead className="px-5 py-3 font-medium">Result Spec</TableHead>
                    <TableHead className="px-5 py-3 font-medium">Updated</TableHead>
                    <TableHead className="px-5 py-3 text-right font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {derivedSpecs.map((spec) => (
                    <TableRow key={spec.id} className="transition-colors hover:bg-slate-50/50 border-0">
                      <TableCell className="px-5 py-4">
                        <div>
                          <div className="font-medium text-slate-900">{spec.name}</div>
                          {spec.description && (
                            <div className="mt-0.5 text-xs text-slate-500">{spec.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs text-slate-600">
                            {getFormulaPreview(spec.formula)}
                          </span>
                          <button
                            onClick={() => navigator.clipboard.writeText(spec.formula)}
                            className="p-1 text-slate-400 hover:text-slate-900 transition-colors"
                            title="Copy formula"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {spec.resultSpec?.name || spec.resultSpecId}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-xs text-slate-500">
                        {formatDate(spec.updatedAt)}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                              <MoreHorizontal size={14} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-md border-slate-200">
                            <DropdownMenuItem onClick={() => handleEdit(spec)} className="text-sm cursor-pointer">
                              <Edit className="mr-2 h-4 w-4 text-slate-400" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-sm cursor-pointer" onClick={() => navigator.clipboard.writeText(spec.formula)}>
                              <Copy className="mr-2 h-4 w-4 text-slate-400" />
                              Copy Formula
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-100" />
                            <DropdownMenuItem
                              onClick={() => handleDelete(spec.id)}
                              className="text-sm text-rose-600 cursor-pointer focus:bg-rose-50 focus:text-rose-700"
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
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="flex max-h-[90vh] w-[95vw] sm:max-w-xl flex-col overflow-hidden p-0 rounded-lg border-slate-200 bg-white shadow-lg">
          <DialogHeader className="shrink-0 border-b border-slate-100 px-6 py-5">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              {editingSpec ? "Edit Derived Specification" : "Create Derived Specification"}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Define a computed specification that aggregates values from multiple components.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Total TDP"
                className="h-10 rounded-md border-slate-200 text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description of what this spec computes"
                rows={2}
                className="resize-none rounded-md border-slate-200 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Result Specification</label>
              <select
                value={formData.resultSpecId}
                onChange={(e) => setFormData(prev => ({ ...prev, resultSpecId: e.target.value }))}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                required
              >
                <option value="" disabled>Select a specification</option>
                {specs.map((spec) => (
                  <option key={spec.id} value={spec.id}>
                    {spec.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 rounded-md border border-slate-200 bg-slate-50 p-4">
              <label className="text-xs font-medium text-slate-700">Formula</label>
              <Textarea
                value={formData.formula}
                onChange={(e) => setFormData(prev => ({ ...prev, formula: e.target.value }))}
                placeholder="e.g., SUM(CPU.TDP, GPU.TDP)"
                rows={3}
                className="font-mono text-xs rounded-md border-slate-200 bg-white"
                required
              />
              <p className="text-xs text-slate-500 mt-2">
                Available functions: <span className="font-medium text-slate-700 font-mono">SUM()</span>, <span className="font-medium text-slate-700 font-mono">SUBTRACT()</span>, <span className="font-medium text-slate-700 font-mono">MULTIPLY()</span>, <span className="font-medium text-slate-700 font-mono">DIVIDE()</span>
              </p>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t border-slate-100 bg-slate-50 px-6 py-4">
            <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)} className="rounded-md border-slate-200 text-slate-700 hover:bg-slate-100">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!formData.name || !formData.formula} className="rounded-md bg-slate-900 text-white hover:bg-slate-800">
              {editingSpec ? "Update Spec" : "Create Spec"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DerivedSpecManager;