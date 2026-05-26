"use client";

import { useMemo, useState, useEffect, useCallback, memo } from "react";
import { useAdmin } from "@/context/AdminContext";
import { useToast } from "@/hooks/use-toast";
import {
  CategoryFilterConfig,
  CategoryNode,
  FilterDefinition,
  FilterOverrideItem,
  SpecDefinition,
  SubCategory,
  UpdateSpecInput,
} from "@/types";
import { apiFetch } from "@/lib/helpers";
import { CATEGORY_NAMES } from "@/lib/categoryUtils";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Eye,
  EyeOff,
  Folder,
  GripVertical,
  Layers,
  ListFilter,
  Plus,
  Trash,
  X,
  Save,
  Check,
  AlertTriangle,
  FolderOpen,
  RefreshCw,
  Settings,
  Tag,
  TrendingUp,
  BarChart3,
  Star,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

// ─────────────────────────────────────────────────────────────
// SHARED PRIMITIVES
// ─────────────────────────────────────────────────────────────

const SectionLabel = memo(
  ({
    icon,
    children,
  }: {
    icon: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div className="flex items-center gap-2 text-slate-700">
      <span className="text-slate-400">{icon}</span>
      <span className="text-sm font-semibold">{children}</span>
    </div>
  ),
);
SectionLabel.displayName = "SectionLabel";

const Panel = memo(
  ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div
      className={cn(
        "rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  ),
);
Panel.displayName = "Panel";

const PanelHeader = memo(
  ({
    icon,
    children,
    right,
  }: {
    icon: React.ReactNode;
    children: React.ReactNode;
    right?: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
      <SectionLabel icon={icon}>{children}</SectionLabel>
      {right}
    </div>
  ),
);
PanelHeader.displayName = "PanelHeader";

// ─────────────────────────────────────────────────────────────
// SMALL REUSABLES
// ─────────────────────────────────────────────────────────────

const Pill = memo(
  ({
    children,
    color = "slate",
  }: {
    children: React.ReactNode;
    color?: "slate" | "indigo" | "teal" | "amber" | "violet";
  }) => {
    const colorClasses = {
      slate: "border-slate-200 bg-slate-50 text-slate-700",
      indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
      teal: "border-teal-200 bg-teal-50 text-teal-700",
      amber: "border-amber-200 bg-amber-50 text-amber-700",
      violet: "border-violet-200 bg-violet-50 text-violet-700",
    };
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
          colorClasses[color]
        )}
      >
        {children}
      </span>
    );
  }
);
Pill.displayName = "Pill";

const ActionBtn = memo(
  ({
    onClick,
    danger,
    children,
    className,
    alwaysVisible,
  }: {
    onClick: () => void;
    danger?: boolean;
    children: React.ReactNode;
    className?: string;
    alwaysVisible?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md border border-transparent transition-colors",
        danger
          ? "text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
          : "text-slate-400 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900",
        alwaysVisible
          ? "opacity-100"
          : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
        className,
      )}
    >
      {children}
    </button>
  ),
);
ActionBtn.displayName = "ActionBtn";

// ─────────────────────────────────────────────────────────────
// INLINE NODE FORM
// ─────────────────────────────────────────────────────────────

const NODE_FORM_FIELDS = [
  { label: "Display Label", field: "label", placeholder: "e.g. Laptops" },
  { label: "Brand Filter", field: "brand", placeholder: "e.g. ASUS" },
  { label: "Query Constraint", field: "query", placeholder: "Search query" },
] as const;

const NodeForm = memo(
  ({
    title,
    nodeForm,
    setNodeForm,
    onSave,
    onCancel,
  }: {
    title: string;
    nodeForm: Partial<CategoryNode>;
    setNodeForm: (v: Partial<CategoryNode>) => void;
    onSave: () => void;
    onCancel: () => void;
  }) => (
    <div className="space-y-4 rounded-md border border-slate-200 bg-slate-50 p-4">
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {NODE_FORM_FIELDS.map(({ label, field, placeholder }) => (
          <div key={field} className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">
              {label}
            </label>
            <Input
              placeholder={placeholder}
              value={(nodeForm as any)[field] ?? ""}
              onChange={(e) =>
                setNodeForm({ ...nodeForm, [field]: e.target.value })
              }
              className="h-9 rounded-md border-slate-200 text-sm"
            />
          </div>
        ))}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">
            Category Mapping
          </label>
          <Select
            value={nodeForm.category ?? "none"}
            onValueChange={(val) =>
              setNodeForm({
                ...nodeForm,
                category: val === "none" ? undefined : val,
              })
            }
          >
            <SelectTrigger className="h-9 rounded-md border-slate-200 bg-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-slate-500 italic">
                No Mapping
              </SelectItem>
              {Object.values(CATEGORY_NAMES).map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={onSave} className="bg-slate-900 text-white">
          Save
        </Button>
      </div>
    </div>
  ),
);
NodeForm.displayName = "NodeForm";

// ─────────────────────────────────────────────────────────────
// TREE NODE
// ─────────────────────────────────────────────────────────────

interface TreeNodeProps {
  node: any;
  currentPath: string;
  depth: number;
  isExpanded: boolean;
  isEditing: boolean;
  isAddingSub: boolean;
  nodeForm: Partial<CategoryNode>;
  setNodeForm: (v: Partial<CategoryNode>) => void;
  onToggle: (path: string) => void;
  onEdit: (node: any, path: string) => void;
  onAddSub: (path: string) => void;
  onDelete: (path: string, label: string) => void;
  onSave: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

const TreeNode = memo(
  ({
    node,
    currentPath,
    depth,
    isExpanded,
    isEditing,
    isAddingSub,
    nodeForm,
    setNodeForm,
    onToggle,
    onEdit,
    onAddSub,
    onDelete,
    onSave,
    onCancel,
    children,
  }: TreeNodeProps) => {
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div>
        <div
          className={cn(
            "group flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
            isEditing
              ? "border border-slate-200 bg-slate-50"
              : "border border-transparent hover:bg-slate-50",
          )}
        >

          <button
            type="button"
            onClick={() => onToggle(currentPath)}
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-slate-400 hover:bg-slate-200",
              !hasChildren && "invisible",
            )}
          >
            {isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
          <div
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border",
              depth === 0
                ? "border-slate-200 bg-white text-slate-700"
                : "border-transparent bg-transparent text-slate-400",
            )}
          >
            {isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">
              {node.label}
            </p>
            {(node.category || node.brand) && (
              <div className="mt-1 flex flex-wrap gap-2">
                {node.category && <Pill color="indigo">{node.category}</Pill>}
                {node.brand && <Pill color="slate">{node.brand}</Pill>}
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <ActionBtn onClick={() => onAddSub(currentPath)}>
              <Plus size={14} />
            </ActionBtn>
            <ActionBtn onClick={() => onEdit(node, currentPath)}>
              <Edit size={14} />
            </ActionBtn>
            <ActionBtn danger onClick={() => onDelete(currentPath, node.label)}>
              <Trash size={14} />
            </ActionBtn>
          </div>
        </div>

        {isEditing && (
          <div className="my-2 ml-10 border-l border-slate-200 pl-4 sm:ml-12">
            <NodeForm
              title="Edit Category"
              nodeForm={nodeForm}
              setNodeForm={setNodeForm}
              onSave={onSave}
              onCancel={onCancel}
            />
          </div>
        )}

        {isAddingSub && (
          <div className="my-2 ml-10 border-l border-slate-200 pl-4 sm:ml-12">
            <NodeForm
              title="Add Subcategory"
              nodeForm={nodeForm}
              setNodeForm={setNodeForm}
              onSave={onSave}
              onCancel={onCancel}
            />
          </div>
        )}

        {hasChildren && isExpanded && (
          <div className="my-1 ml-10 border-l border-slate-200 pl-4 sm:ml-12 space-y-1">
            {children}
          </div>
        )}
      </div>
    );
  },
);
TreeNode.displayName = "TreeNode";

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

const EMPTY_NODE_FORM: Partial<CategoryNode> = {
  label: "",
  category: undefined,
  brand: "",
  query: "",
};
const EMPTY_FILTER_FORM: Partial<FilterDefinition> = {
  key: "",
  label: "",
  type: "checkbox",
  options: [],
};
const EMPTY_SPEC_FORM: UpdateSpecInput = {
  name: "",
  valueType: "STRING",
  isFilterable: true,
  isRange: false,
  isMulti: false,
  filterGroup: "",
  filterOrder: 0,
  options: [],
  dependencies: [],
};

const CategoryManager = () => {
  const { toast } = useToast();
  const admin = useAdmin() as unknown as {
    categoryHierarchy: CategoryNode[];
    refreshCategoryHierarchy: () => Promise<void>;
    updateCategories: (categories: CategoryNode[]) => Promise<void>;
    syncData: () => Promise<void>;
    isLoading: boolean;
    subCategories: SubCategory[];
    specs: SpecDefinition[];
    refreshSpecs: (subCategoryId?: string) => Promise<void>;
    createSpec: (data: any) => Promise<void>;
    updateSpec: (id: string, data: UpdateSpecInput) => Promise<void>;
    deleteSpec: (id: string, subCategoryId?: string) => Promise<void>;
  } & {
    filterConfigs?: CategoryFilterConfig[];
    updateFilterConfig?: (
      category: string,
      filters: FilterDefinition[],
    ) => Promise<void>;
  };
  const {
    categoryHierarchy,
    refreshCategoryHierarchy,
    updateCategories,
    syncData,
    isLoading,
    subCategories,
    specs,
    refreshSpecs,
    updateSpec,
    deleteSpec,
  } = admin;
  const filterConfigs = Array.isArray(admin.filterConfigs)
    ? admin.filterConfigs
    : [];
  const updateFilterConfig = admin.updateFilterConfig ?? (async () => { });
  const categories = Array.isArray(categoryHierarchy) ? categoryHierarchy : [];
  const [selectedSubCategoryId, setSelectedSubCategoryId] =
    useState<string>("");

  useEffect(() => {
    refreshCategoryHierarchy().catch((error) => {
      console.error("Failed to load category hierarchy", error);
    });
  }, [refreshCategoryHierarchy]);

  useEffect(() => {
    if (!selectedSubCategoryId && subCategories.length > 0) {
      setSelectedSubCategoryId(subCategories[0].id);
    }
  }, [selectedSubCategoryId, subCategories]);

  useEffect(() => {
    if (!selectedSubCategoryId) return;
    const sub = subCategories.find((s) => s.id === selectedSubCategoryId);
    const categoryName = sub?.category?.name ?? "";
    Promise.all([
      refreshSpecs(selectedSubCategoryId).catch((error) => {
        console.error("Failed to load filter schema", error);
      }),
      categoryName
        ? apiFetch<FilterOverrideItem[]>(
          `/api/admin/builder-filters?category=${encodeURIComponent(categoryName)}`,
        )
          .then((data) =>
            setOverrides(Array.isArray(data) ? data : []),
          )
          .catch(() => setOverrides([]))
        : Promise.resolve(),
    ]);
  }, [refreshSpecs, selectedSubCategoryId, subCategories]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editingNodePath, setEditingNodePath] = useState<string | null>(null);
  const [nodeForm, setNodeForm] = useState<Partial<CategoryNode>>(EMPTY_NODE_FORM);
  const [isAddingRoot, setIsAddingRoot] = useState(false);

  const [configMode, setConfigMode] = useState<"hierarchy" | "filters">("hierarchy");
  const [selectedCatForFilters, setSelectedCatForFilters] = useState<string>(
    CATEGORY_NAMES.PROCESSOR,
  );
  const [editingFilterIdx, setEditingFilterIdx] = useState<number | null>(null);
  const [filterForm, setFilterForm] = useState<Partial<FilterDefinition>>(EMPTY_FILTER_FORM);
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [editingSpecId, setEditingSpecId] = useState<string | null>(null);
  const [specForm, setSpecForm] = useState<UpdateSpecInput>(EMPTY_SPEC_FORM);

  const [overrides, setOverrides] = useState<FilterOverrideItem[]>([]);
  const [savingOverride, setSavingOverride] = useState<string | null>(null);
  const [savedOverride, setSavedOverride] = useState<string | null>(null);

  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [builderForm, setBuilderForm] = useState<Partial<SubCategory>>({});
  const [isSavingBuilder, setIsSavingBuilder] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "filter" | "node";
    filterIdx?: number;
    nodePath?: string;
    label: string;
  } | null>(null);

  const toggleExpand = useCallback(
    (path: string) => setExpanded((prev) => ({ ...prev, [path]: !prev[path] })),
    [],
  );

  const handleEditNode = useCallback((node: CategoryNode, path: string) => {
    setEditingNodePath(path);
    setNodeForm({ ...node });
    setIsAddingRoot(false);
  }, []);

  const handleAddSubcategory = useCallback((path: string) => {
    setEditingNodePath(path + "-new");
    setNodeForm({ label: "" });
    setIsAddingRoot(false);
  }, []);

  const cancelNodeEdit = useCallback(() => setEditingNodePath(null), []);
  const cancelAddRoot = useCallback(() => setIsAddingRoot(false), []);

  const saveNode = useCallback(async () => {
    if (!editingNodePath && !isAddingRoot) return;
    const newTree = JSON.parse(JSON.stringify(categories));
    if (isAddingRoot) {
      newTree.push(nodeForm);
    } else if (editingNodePath!.endsWith("-new")) {
      const parentPath = editingNodePath!
        .replace("-new", "")
        .split("-")
        .map(Number);
      let current = newTree[parentPath[0]];
      for (let i = 1; i < parentPath.length; i++)
        current = current.children![parentPath[i]];
      if (!current.children) current.children = [];
      current.children.push(nodeForm);
    } else {
      const path = editingNodePath!.split("-").map(Number);
      let current = newTree[path[0]];
      for (let i = 1; i < path.length; i++)
        current = current.children![path[i]];
      Object.assign(current, nodeForm);
    }
    try {
      await updateCategories(newTree);
      await refreshCategoryHierarchy();
      toast({
        title: "Category hierarchy updated",
        description: "The changes have been saved successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to update hierarchy",
        description: error.message || "An unexpected error occurred.",
      });
    }
    setEditingNodePath(null);
    setIsAddingRoot(false);
    setNodeForm(EMPTY_NODE_FORM);
  }, [
    editingNodePath,
    isAddingRoot,
    categories,
    nodeForm,
    updateCategories,
    refreshCategoryHierarchy,
    toast,
  ]);

  const deleteNode = useCallback(
    (pathStr: string, nodeLabel: string) =>
      setDeleteConfirm({ type: "node", nodePath: pathStr, label: nodeLabel }),
    [],
  );

  const confirmDeleteNode = useCallback(
    async (pathStr: string) => {
      const newTree = JSON.parse(JSON.stringify(categories));
      const path = pathStr.split("-").map(Number);
      if (path.length === 1) {
        newTree.splice(path[0], 1);
      } else {
        let parent = newTree[path[0]];
        for (let i = 1; i < path.length - 1; i++)
          parent = parent.children![path[i]];
        parent.children!.splice(path[path.length - 1], 1);
      }
      try {
        await updateCategories(newTree);
        await refreshCategoryHierarchy();
        toast({
          title: "Category deleted",
          description: "The category and its subcategories have been removed.",
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Failed to delete category",
          description: error.message || "An unexpected error occurred.",
        });
      }
    },
    [categories, updateCategories, refreshCategoryHierarchy, toast],
  );

  const activeFilters = useMemo<FilterDefinition[]>(
    () =>
      filterConfigs.find((c) => c.category === selectedCatForFilters)
        ?.filters || [],
    [filterConfigs, selectedCatForFilters],
  );

  const selectedSubCategory = useMemo(
    () =>
      subCategories.find(
        (subCategory) => subCategory.id === selectedSubCategoryId,
      ) ?? null,
    [selectedSubCategoryId, subCategories],
  );

  const overrideMap = useMemo(() => {
    const map = new Map<string, FilterOverrideItem>();
    overrides.forEach((o) => map.set(o.specDefinitionId, o));
    return map;
  }, [overrides]);

  const handleSaveSpecOverride = useCallback(
    async (
      specId: string,
      categoryName: string,
      data: Partial<FilterOverrideItem>,
    ) => {
      const key = specId;
      setSavingOverride(key);
      try {
        const result = await apiFetch<FilterOverrideItem>(
          "/api/admin/builder-filters",
          {
            method: "POST",
            body: JSON.stringify({
              specDefinitionId: specId,
              categoryName,
              ...data,
            }),
          },
        );
        setOverrides((prev) => {
          const idx = prev.findIndex((o) => o.specDefinitionId === specId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = result;
            return next;
          }
          return [...prev, result];
        });
        setSavedOverride(key);
        setTimeout(() => setSavedOverride(null), 1500);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Failed to save override",
          description: error.message || "An error occurred.",
        });
      } finally {
        setSavingOverride(null);
      }
    },
    [toast],
  );

  const openBuilderConfig = useCallback(() => {
    if (!selectedSubCategory) return;
    setBuilderForm({
      isBuilderEnabled: selectedSubCategory.isBuilderEnabled ?? false,
      isCore: selectedSubCategory.isCore ?? false,
      isRequired: selectedSubCategory.isRequired ?? false,
      allowMultiple: selectedSubCategory.allowMultiple ?? false,
      builderOrder: selectedSubCategory.builderOrder ?? 0,
      icon: selectedSubCategory.icon ?? "",
      shortLabel: selectedSubCategory.shortLabel ?? "",
    });
    setShowBuilderModal(true);
  }, [selectedSubCategory]);

  const saveBuilderConfig = useCallback(async () => {
    if (!selectedSubCategoryId) return;
    setIsSavingBuilder(true);
    try {
      const response = await fetch(
        `/api/catalog/subcategories/${selectedSubCategoryId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(builderForm),
        },
      );
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save builder config");
      }
      await admin.syncData();
      toast({
        title: "Settings saved",
        description: "PC Builder configuration updated.",
      });
      setShowBuilderModal(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: error.message || "Could not save PC Builder settings.",
      });
    } finally {
      setIsSavingBuilder(false);
    }
  }, [selectedSubCategoryId, builderForm, admin, toast]);

  const activeSpecs = useMemo(
    () => specs.filter((spec) => spec.subCategoryId === selectedSubCategoryId),
    [selectedSubCategoryId, specs],
  );

  const confirmDeleteFilter = useCallback(
    async (idx: number) => {
      const newFilters = [...activeFilters];
      newFilters.splice(idx, 1);
      try {
        await updateFilterConfig(selectedCatForFilters, newFilters);
        toast({
          title: "Filter removed",
          description: "The filter has been removed.",
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Delete failed",
          description: error.message || "Could not remove the filter.",
        });
      }
    },
    [activeFilters, updateFilterConfig, selectedCatForFilters, toast],
  );

  const handleConfirmDelete = useCallback(() => {
    if (!deleteConfirm) return;
    if (
      deleteConfirm.type === "filter" &&
      deleteConfirm.filterIdx !== undefined
    )
      confirmDeleteFilter(deleteConfirm.filterIdx);
    else if (deleteConfirm.type === "node" && deleteConfirm.nodePath)
      confirmDeleteNode(deleteConfirm.nodePath);
    setDeleteConfirm(null);
  }, [deleteConfirm, confirmDeleteFilter, confirmDeleteNode]);

  const closeDeleteConfirm = useCallback((open: boolean) => {
    if (!open) setDeleteConfirm(null);
  }, []);

  const openAddRoot = useCallback(() => {
    setIsAddingRoot(true);
    setNodeForm(EMPTY_NODE_FORM);
    setEditingNodePath(null);
  }, []);

  const openCreateSpec = useCallback(() => {
    setEditingSpecId(null);
    setSpecForm(EMPTY_SPEC_FORM);
    setShowSpecModal(true);
  }, []);

  const openEditSpec = useCallback((spec: SpecDefinition) => {
    setEditingSpecId(spec.id);
    setSpecForm({
      name: spec.name,
      valueType: spec.valueType,
      isFilterable: spec.isFilterable,
      isRange: spec.isRange,
      isMulti: spec.isMulti,
      filterGroup: spec.filterGroup ?? "",
      filterOrder: spec.filterOrder ?? 0,
      options: (spec.options ?? []).map((option, index) => ({
        id: option.id,
        value: option.value,
        label: option.label ?? option.value,
        order: option.order ?? index,
      })),
      dependencies: [
        ...(spec.childOptionDeps ?? [])
          .filter((dependency) => !dependency.childOptionId)
          .map((dependency) => ({
            parentSpecId: dependency.parentSpecId,
            parentOptionValue: dependency.parentOption?.value ?? "",
            childOptionValue: null,
          })),
        ...(spec.options ?? []).flatMap((option) =>
          (option.childOptionDeps ?? []).map((dependency) => ({
            parentSpecId: dependency.parentSpecId,
            parentOptionValue: dependency.parentOption?.value ?? "",
            childOptionValue: option.value,
          })),
        ),
      ],
    });
    setShowSpecModal(true);
  }, []);

  const closeSpecModal = useCallback((open: boolean) => {
    setShowSpecModal(open);
    if (!open) {
      setEditingSpecId(null);
      setSpecForm(EMPTY_SPEC_FORM);
    }
  }, []);

  const saveSpec = useCallback(async () => {
    if (!selectedSubCategoryId || !specForm.name?.trim()) return;

    const payload: UpdateSpecInput = {
      ...specForm,
      filterGroup: specForm.filterGroup || null,
      filterOrder: Number(specForm.filterOrder ?? 0),
      options: (specForm.options ?? [])
        .filter((option) => option.value.trim().length > 0)
        .map((option, index) => ({
          ...option,
          value: option.value.trim(),
          label: option.label?.trim() || option.value.trim(),
          order: option.order ?? index,
        })),
      dependencies: (specForm.dependencies ?? []).filter(
        (dependency) => dependency.parentSpecId && dependency.parentOptionValue,
      ),
    };

    try {
      if (editingSpecId) {
        await updateSpec(editingSpecId, payload);
      } else {
        const response = await fetch("/api/catalog/specs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subCategoryId: selectedSubCategoryId,
            name: payload.name ?? "",
            valueType: payload.valueType ?? "STRING",
            isFilterable: payload.isFilterable,
            isRange: payload.isRange,
            isMulti: payload.isMulti,
            filterGroup: payload.filterGroup ?? undefined,
            filterOrder: payload.filterOrder ?? undefined,
            options: payload.options,
          }),
        });
        if (!response.ok) throw new Error("Failed to save spec.");
        const created = await response.json();
        if (payload.dependencies && payload.dependencies.length > 0) {
          await updateSpec(created.id, payload);
        }
      }

      await refreshSpecs(selectedSubCategoryId);
      toast({
        title: editingSpecId ? "Filter updated" : "Filter created",
        description: `"${payload.name}" saved successfully.`,
      });

      setShowSpecModal(false);
      setEditingSpecId(null);
      setSpecForm(EMPTY_SPEC_FORM);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: error.message || "An unexpected error occurred.",
      });
    }
  }, [
    editingSpecId,
    refreshSpecs,
    selectedSubCategoryId,
    specForm,
    updateSpec,
    toast,
  ]);

  const removeSpec = useCallback(
    async (spec: SpecDefinition) => {
      try {
        await deleteSpec(spec.id, spec.subCategoryId);
        toast({
          title: "Filter deleted",
          description: `"${spec.name}" has been removed.`,
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Delete failed",
          description: error.message || "Filter cannot be deleted.",
        });
      }
    },
    [deleteSpec, toast],
  );

  const availableParentSpecs = useMemo(
    () => activeSpecs.filter((spec) => spec.id !== editingSpecId),
    [activeSpecs, editingSpecId],
  );

  const renderTree = useCallback(
    (nodes: any[], pathPrefix = "", depth = 0): React.ReactNode =>
      nodes.map((node, index) => {
        const currentPath = `${pathPrefix}${index}`;
        const isExpanded = expanded[currentPath] ?? false;
        const hasChildren = node.children && node.children.length > 0;
        const isEditing = editingNodePath === currentPath;
        const isAddingSub = editingNodePath === `${currentPath}-new`;

        return (
          <TreeNode
            key={currentPath}
            node={node}
            currentPath={currentPath}
            depth={depth}
            isExpanded={isExpanded}
            isEditing={isEditing}
            isAddingSub={isAddingSub}
            nodeForm={nodeForm}
            setNodeForm={setNodeForm}
            onToggle={toggleExpand}
            onEdit={handleEditNode}
            onAddSub={handleAddSubcategory}
            onDelete={deleteNode}
            onSave={saveNode}
            onCancel={cancelNodeEdit}
          >
            {hasChildren && isExpanded
              ? renderTree(node.children, `${currentPath}-`, depth + 1)
              : null}
          </TreeNode>
        );
      }),
    [
      expanded,
      editingNodePath,
      nodeForm,
      toggleExpand,
      handleEditNode,
      handleAddSubcategory,
      deleteNode,
      saveNode,
      cancelNodeEdit,
    ],
  );

  return (
    <div className="space-y-6">
      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
       
        <div className="flex items-center gap-3">

          <div className="flex rounded-md border border-slate-200 bg-slate-50 p-1">
            {(["hierarchy", "filters"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setConfigMode(mode)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                  configMode === mode
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-900",
                )}
              >
                {mode === "hierarchy" ? <Layers size={14} /> : <ListFilter size={14} />}
                <span className="hidden sm:inline">
                  {mode === "hierarchy" ? "Hierarchy" : "Filters"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════ */}
      {/*  HIERARCHY MODE                      */}
      {/* ══════════════════════════════════════ */}
      {configMode === "hierarchy" && (
        <Panel>
          <PanelHeader
            icon={<Layers size={16} />}
            right={
              <button
                type="button"
                onClick={openAddRoot}
                className="flex h-8 items-center gap-2 rounded-md bg-slate-900 px-3 text-xs font-medium text-white transition-colors hover:bg-slate-800"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">Add Root Category</span>
                <span className="sm:hidden">Add</span>
              </button>
            }
          >
            Category Hierarchy
          </PanelHeader>

          <div className="p-4 sm:p-6">
            {isAddingRoot && (
              <div className="mb-4">
                <NodeForm
                  title="Add Root Category"
                  nodeForm={nodeForm}
                  setNodeForm={setNodeForm}
                  onSave={saveNode}
                  onCancel={cancelAddRoot}
                />
              </div>
            )}

            {categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Folder size={32} className="text-slate-300 mb-4" />
                <p className="text-sm font-medium text-slate-500 mb-2">
                  No categories configured
                </p>
                <button
                  type="button"
                  onClick={openAddRoot}
                  className="text-sm font-medium text-slate-900 hover:underline"
                >
                  Add first category
                </button>
              </div>
            ) : (
              <div className="space-y-1">{renderTree(categories)}</div>
            )}
          </div>
        </Panel>
      )}

      {/* ══════════════════════════════════════ */}
      {/*  FILTERS MODE                          */}
      {/* ══════════════════════════════════════ */}
      {configMode === "filters" && (
        <Panel>
          <PanelHeader
            icon={<ListFilter size={16} />}
            right={
              <button
                type="button"
                onClick={openCreateSpec}
                className="flex h-8 items-center gap-2 rounded-md bg-slate-900 px-3 text-xs font-medium text-white transition-colors hover:bg-slate-800"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">Add Filter</span>
                <span className="sm:hidden">Add</span>
              </button>
            }
          >
            Dynamic Filters
          </PanelHeader>

          <div className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="flex-1 space-y-1.5">

                <Select
                  value={selectedSubCategoryId}
                  onValueChange={setSelectedSubCategoryId}
                >
                  <SelectTrigger className="h-10 rounded-md border-slate-200 bg-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {subCategories.map((subCategory) => (
                      <SelectItem
                        key={subCategory.id}
                        value={subCategory.id}
                      >
                        {subCategory.category?.name
                          ? `${subCategory.category.name} / ${subCategory.name}`
                          : subCategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-3">
                <button
                  type="button"
                  onClick={openBuilderConfig}
                  className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                  disabled={!selectedSubCategory}
                >
                  <Settings size={16} className="text-slate-400" />
                  PC Builder
                </button>
              </div>
            </div>

            {activeSpecs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <ListFilter size={32} className="mb-4 text-slate-300" />
                <p className="mb-2 text-sm font-medium text-slate-500">
                  No filters defined for this subcategory
                </p>
                <button
                  type="button"
                  onClick={openCreateSpec}
                  className="text-sm font-medium text-slate-900 hover:underline"
                >
                  Create first filter
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSpecs.map((spec) => {
                  const override = overrideMap.get(spec.id) ?? null;
                  const isHidden = override?.hidden ?? false;
                  const catName = selectedSubCategory?.category?.name ?? "";

                  return (
                    <div
                      key={spec.id}
                      className={cn(
                        "flex flex-col rounded-md border bg-white transition-colors",
                        isHidden
                          ? "border-slate-200 opacity-60"
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4 p-4">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {override?.labelOverride || spec.name}
                            {override?.labelOverride && (
                              <span className="ml-2 text-xs font-normal text-slate-400">
                                ({spec.name})
                              </span>
                            )}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs text-slate-600">
                              {spec.valueType}
                            </span>
                            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                              {spec.isFilterable ? "Visible" : "Hidden"}
                            </span>
                            {spec.isRange && (
                              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                                Range
                              </span>
                            )}
                            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                              {(spec.options ?? []).length} opts
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <ActionBtn onClick={() => openEditSpec(spec)} alwaysVisible>
                            <Edit size={14} />
                          </ActionBtn>
                          <ActionBtn danger onClick={() => removeSpec(spec)} alwaysVisible>
                            <Trash size={14} />
                          </ActionBtn>
                        </div>
                      </div>

                      {/* PC Builder override row */}
                      {catName && (
                        <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50 px-4 py-2.5">
                          <span className="shrink-0 text-xs font-medium text-slate-500">
                            Builder Label
                          </span>
                          <input
                            type="text"
                            placeholder={spec.name}
                            defaultValue={override?.labelOverride ?? ""}
                            key={`lbl-${spec.id}-${override?.labelOverride}`}
                            onBlur={(e) => {
                              const val = e.target.value.trim();
                              const current = override?.labelOverride ?? "";
                              if (val !== current) {
                                handleSaveSpecOverride(spec.id, catName, {
                                  labelOverride: val || null,
                                  hidden: isHidden,
                                });
                              }
                            }}
                            className="flex-1 min-w-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleSaveSpecOverride(spec.id, catName, {
                                hidden: !isHidden,
                                labelOverride: override?.labelOverride ?? null,
                              })
                            }
                            className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors",
                              isHidden
                                ? "border-slate-200 bg-white text-slate-400 hover:bg-slate-100"
                                : "border-slate-200 bg-slate-900 text-white hover:bg-slate-800"
                            )}
                            title={isHidden ? "Show in builder" : "Hide from builder"}
                          >
                            {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Panel>
      )}

      {/* ══════════════════════════════════════ */}
      {/*  FILTER MODAL                          */}
      {/* ══════════════════════════════════════ */}
      <Dialog open={showSpecModal} onOpenChange={closeSpecModal}>
        <DialogContent className="flex max-h-[90vh] p-0 flex-col overflow-hidden border-slate-200 bg-white shadow-lg sm:max-w-2xl sm:rounded-lg">
          <DialogHeader className="shrink-0 border-b border-slate-100 px-6 py-5">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              {editingSpecId ? "Edit Filter" : "New Filter"}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              {selectedSubCategory
                ? `${selectedSubCategory.category?.name ?? "Catalog"} / ${selectedSubCategory.name}`
                : "Select a subcategory first"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Filter Label</label>
                <Input
                  placeholder="e.g. Socket"
                  value={specForm.name ?? ""}
                  onChange={(e) =>
                    setSpecForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="h-9 rounded-md border-slate-200 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Group (Optional)</label>
                <Input
                  placeholder="e.g. Compatibility"
                  value={specForm.filterGroup ?? ""}
                  onChange={(e) =>
                    setSpecForm((prev) => ({
                      ...prev,
                      filterGroup: e.target.value,
                    }))
                  }
                  className="h-9 rounded-md border-slate-200 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Value Type</label>
                <Select
                  value={specForm.valueType ?? "STRING"}
                  onValueChange={(value) =>
                    setSpecForm((prev) => ({ ...prev, valueType: value }))
                  }
                >
                  <SelectTrigger className="h-9 rounded-md border-slate-200 bg-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STRING">String</SelectItem>
                    <SelectItem value="NUMBER">Number</SelectItem>
                    <SelectItem value="BOOLEAN">Boolean</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Sort Order</label>
                <Input
                  type="number"
                  value={specForm.filterOrder ?? 0}
                  onChange={(e) =>
                    setSpecForm((prev) => ({
                      ...prev,
                      filterOrder: Number(e.target.value),
                    }))
                  }
                  className="h-9 rounded-md border-slate-200 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                ["isFilterable", "Visible to Users"],
                ["isRange", "Range Slider"],
                ["isMulti", "Multi-Select"],
              ].map(([field, label]) => (
                <label
                  key={field}
                  className="flex cursor-pointer items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 transition-colors hover:bg-slate-100"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(
                      (specForm as Record<string, unknown>)[field],
                    )}
                    onChange={(e) =>
                      setSpecForm((prev) => ({
                        ...prev,
                        [field]: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                </label>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Filter Options</label>
              <Textarea
                placeholder="AM4, AM5, LGA1700 (comma-separated)"
                value={(specForm.options ?? [])
                  .map((option) => option.value)
                  .join(", ")}
                onChange={(e) =>
                  setSpecForm((prev) => ({
                    ...prev,
                    options: e.target.value
                      .split(",")
                      .map((value) => value.trim())
                      .filter(Boolean)
                      .map((value, index) => ({
                        value,
                        label: value,
                        order: index,
                      })),
                  }))
                }
                className="min-h-[100px] resize-none rounded-md border-slate-200 text-sm"
              />
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-900">Relationships</label>
                <button
                  type="button"
                  onClick={() =>
                    setSpecForm((prev) => ({
                      ...prev,
                      dependencies: [
                        ...(prev.dependencies ?? []),
                        {
                          parentSpecId: "",
                          parentOptionValue: "",
                          childOptionValue: null,
                        },
                      ],
                    }))
                  }
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline"
                >
                  Add Relation
                </button>
              </div>

              {(specForm.dependencies ?? []).map((dependency, index) => {
                const parentSpec = availableParentSpecs.find(
                  (spec) => spec.id === dependency.parentSpecId,
                );
                const parentOptions = parentSpec?.options ?? [];

                return (
                  <div
                    key={index}
                    className="grid grid-cols-1 gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_1fr_1fr_auto]"
                  >
                    <Select
                      value={dependency.parentSpecId}
                      onValueChange={(value) =>
                        setSpecForm((prev) => ({
                          ...prev,
                          dependencies: (prev.dependencies ?? []).map(
                            (item, itemIndex) =>
                              itemIndex === index
                                ? {
                                  ...item,
                                  parentSpecId: value,
                                  parentOptionValue: "",
                                }
                                : item,
                          ),
                        }))
                      }
                    >
                      <SelectTrigger className="h-9 rounded-md border-slate-200 bg-white text-sm">
                        <SelectValue placeholder="Parent Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableParentSpecs.map((spec) => (
                          <SelectItem key={spec.id} value={spec.id}>
                            {spec.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={dependency.parentOptionValue}
                      onValueChange={(value) =>
                        setSpecForm((prev) => ({
                          ...prev,
                          dependencies: (prev.dependencies ?? []).map(
                            (item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, parentOptionValue: value }
                                : item,
                          ),
                        }))
                      }
                    >
                      <SelectTrigger className="h-9 rounded-md border-slate-200 bg-white text-sm">
                        <SelectValue placeholder="Parent Value" />
                      </SelectTrigger>
                      <SelectContent>
                        {parentOptions.map((option) => (
                          <SelectItem key={option.id} value={option.value}>
                            {option.label ?? option.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={dependency.childOptionValue ?? "__all__"}
                      onValueChange={(value) =>
                        setSpecForm((prev) => ({
                          ...prev,
                          dependencies: (prev.dependencies ?? []).map(
                            (item, itemIndex) =>
                              itemIndex === index
                                ? {
                                  ...item,
                                  childOptionValue:
                                    value === "__all__" ? null : value,
                                }
                                : item,
                          ),
                        }))
                      }
                    >
                      <SelectTrigger className="h-9 rounded-md border-slate-200 bg-white text-sm">
                        <SelectValue placeholder="Target Option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Entire Filter</SelectItem>
                        {(specForm.options ?? []).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label ?? option.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <button
                      type="button"
                      onClick={() =>
                        setSpecForm((prev) => ({
                          ...prev,
                          dependencies: (prev.dependencies ?? []).filter(
                            (_, itemIndex) => itemIndex !== index,
                          ),
                        }))
                      }
                      className="flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-slate-500 hover:text-rose-600 transition-colors"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t border-slate-100 bg-slate-50 px-6 py-4">
            <Button variant="outline" size="sm" onClick={() => closeSpecModal(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={saveSpec} className="bg-slate-900 text-white">
              Save Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════ */}
      {/*  DELETE CONFIRM MODAL                  */}
      {/* ══════════════════════════════════════ */}
      <AlertDialog open={deleteConfirm !== null} onOpenChange={closeDeleteConfirm}>
        <AlertDialogContent className="border-slate-200 bg-white p-0 shadow-lg sm:max-w-md rounded-lg overflow-hidden">
          <AlertDialogHeader className="border-b border-slate-100 px-6 pb-4 pt-6">
            <AlertDialogTitle className="text-lg font-semibold text-slate-900">
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-500">
              {deleteConfirm?.type === "node" ? (
                <>
                  Delete category <span className="font-medium text-slate-900">{deleteConfirm?.label}</span> and all its subcategories? This cannot be undone.
                </>
              ) : (
                <>
                  Delete filter <span className="font-medium text-slate-900">{deleteConfirm?.label}</span>? This cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
            <AlertDialogCancel className="mt-0 rounded-md border-slate-200 text-slate-700 hover:bg-slate-100">
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="rounded-md"
            >
              Delete
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* ══════════════════════════════════════ */}
      {/*  BUILDER CONFIG MODAL                  */}
      {/* ══════════════════════════════════════ */}
      {showBuilderModal && selectedSubCategory && (
        <Dialog
          open={showBuilderModal}
          onOpenChange={(open) => {
            if (!open && !isSavingBuilder) setShowBuilderModal(false);
          }}
        >
          <DialogContent className="flex max-h-[90vh] p-0 flex-col overflow-hidden border-slate-200 bg-white shadow-lg sm:max-w-lg sm:rounded-lg">
            <DialogHeader className="shrink-0 border-b border-slate-100 px-6 py-5">
              <DialogTitle className="text-lg font-semibold text-slate-900">
                PC Builder Settings
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Configuring constraints for <span className="font-medium text-slate-900">{selectedSubCategory?.name}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    Visible in Builder
                  </label>
                  <Select
                    value={builderForm.isBuilderEnabled ? "true" : "false"}
                    onValueChange={(val) =>
                      setBuilderForm((prev) => ({
                        ...prev,
                        isBuilderEnabled: val === "true",
                      }))
                    }
                  >
                    <SelectTrigger className="h-9 rounded-md border-slate-200 bg-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    Display Order
                  </label>
                  <Input
                    type="number"
                    value={builderForm.builderOrder ?? 0}
                    onChange={(e) =>
                      setBuilderForm((prev) => ({
                        ...prev,
                        builderOrder: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="h-9 rounded-md border-slate-200 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    Short Label
                  </label>
                  <Input
                    value={builderForm.shortLabel ?? ""}
                    onChange={(e) =>
                      setBuilderForm((prev) => ({
                        ...prev,
                        shortLabel: e.target.value,
                      }))
                    }
                    placeholder="e.g. CPU, RAM"
                    className="h-9 rounded-md border-slate-200 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    Lucide Icon Name
                  </label>
                  <Input
                    value={builderForm.icon ?? ""}
                    onChange={(e) =>
                      setBuilderForm((prev) => ({
                        ...prev,
                        icon: e.target.value,
                      }))
                    }
                    placeholder="e.g. cpu, memory"
                    className="h-9 rounded-md border-slate-200 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-200">
                <label className="text-sm font-semibold text-slate-900">
                  Builder Constraints
                </label>

                <div className="grid gap-3">
                  {[
                    {
                      field: "isCore",
                      title: "Core Component",
                      desc: "Essential for a functioning PC build",
                    },
                    {
                      field: "isRequired",
                      title: "Required Selection",
                      desc: "User must pick an item from this category",
                    },
                    {
                      field: "allowMultiple",
                      title: "Allow Multiple",
                      desc: "Users can pick multiple items (e.g. RAM, Storage)",
                    },
                  ].map(({ field, title, desc }) => (
                    <label
                      key={field}
                      className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        checked={Boolean((builderForm as any)[field])}
                        onChange={(e) =>
                          setBuilderForm((prev) => ({
                            ...prev,
                            [field]: e.target.checked,
                          }))
                        }
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{title}</p>
                        <p className="text-xs text-slate-500">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="shrink-0 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBuilderModal(false)}
                disabled={isSavingBuilder}
                className="rounded-md border-slate-200 text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={saveBuilderConfig}
                disabled={isSavingBuilder}
                className="gap-2 rounded-md bg-slate-900 text-white hover:bg-slate-800"
              >
                {isSavingBuilder ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                {isSavingBuilder ? "Saving..." : "Save Settings"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CategoryManager;