'use client';

import React, { useMemo, useState, useEffect, useCallback, memo } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { CategoryFilterConfig, CategoryNode, FilterDefinition, SpecDefinition, SubCategory, UpdateSpecInput } from '@/types';
import { CATEGORY_NAMES } from '@/lib/categoryUtils';
import {
    ChevronDown,
    ChevronRight,
    Edit,
    Folder,
    GripVertical,
    Layers,
    ListFilter,
    Plus,
    Trash,
    X,
    Save,
    AlertTriangle,
    CheckCircle2,
    FolderOpen,
    RefreshCw,
    Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

// ─────────────────────────────────────────────────────────────
// SHARED PRIMITIVES
// ─────────────────────────────────────────────────────────────

const SectionLabel = memo(({
    icon,
    children,
}: {
    icon: React.ReactNode;
    children: React.ReactNode;
}) => (
    <div className="flex items-center gap-1.5">
        <span className="text-stone-400">{icon}</span>
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em]">
            {children}
        </span>
    </div>
));
SectionLabel.displayName = 'SectionLabel';

type Stripe = 'indigo' | 'teal' | 'amber' | 'rose' | 'violet' | 'stone';

// Stripe classes extracted outside component to avoid re-creation on every render
const STRIPE_CLASSES: Record<Stripe, string> = {
    indigo: 'from-indigo-400 via-indigo-500 to-violet-400',
    teal: 'from-teal-400 via-emerald-400 to-emerald-300',
    amber: 'from-amber-400 via-amber-400 to-orange-300',
    rose: 'from-rose-400 via-rose-400 to-rose-300',
    violet: 'from-violet-400 via-violet-500 to-indigo-400',
    stone: 'from-stone-300 via-stone-400 to-stone-300',
};

const Panel = memo(({
    children,
    className,
    stripe,
}: {
    children: React.ReactNode;
    className?: string;
    stripe?: Stripe;
}) => (
    <div className={cn('rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden', className)}>
        {stripe && (
            <div className={cn('h-0.5 w-full bg-gradient-to-r', STRIPE_CLASSES[stripe])} />
        )}
        {children}
    </div>
));
Panel.displayName = 'Panel';

const PanelHeader = memo(({
    icon,
    children,
    right,
}: {
    icon: React.ReactNode;
    children: React.ReactNode;
    right?: React.ReactNode;
}) => (
    <div className="px-3 sm:px-5 py-3 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between gap-2">
        <SectionLabel icon={icon}>{children}</SectionLabel>
        {right}
    </div>
));
PanelHeader.displayName = 'PanelHeader';

// ─────────────────────────────────────────────────────────────
// SMALL REUSABLES
// ─────────────────────────────────────────────────────────────

const PILL_CLASSES: Record<string, string> = {
    stone: 'bg-stone-100 text-stone-600 ring-stone-200',
    indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    teal: 'bg-teal-50 text-teal-700 ring-teal-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    violet: 'bg-violet-50 text-violet-700 ring-violet-200',
};

const Pill = memo(({ children, color = 'stone' }: { children: React.ReactNode; color?: 'stone' | 'indigo' | 'teal' | 'amber' | 'violet' }) => (
    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ring-1 whitespace-nowrap', PILL_CLASSES[color])}>
        {children}
    </span>
));
Pill.displayName = 'Pill';

const ActionBtn = memo(({
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
            'h-7 w-7 rounded-md flex items-center justify-center transition-all duration-150',
            danger
                ? 'text-stone-300 hover:text-rose-500 hover:bg-rose-50 active:bg-rose-100'
                : 'text-stone-300 hover:text-stone-700 hover:bg-stone-100 active:bg-stone-200',
            alwaysVisible ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100',
            className
        )}
    >
        {children}
    </button>
));
ActionBtn.displayName = 'ActionBtn';

// ─────────────────────────────────────────────────────────────
// INLINE NODE FORM
// ─────────────────────────────────────────────────────────────

// Stable field config outside component — no re-creation per render
const NODE_FORM_FIELDS = [
    { label: 'Display Label', field: 'label', placeholder: 'e.g. Laptops' },
    { label: 'Brand Filter', field: 'brand', placeholder: 'e.g. ASUS' },
    { label: 'Query Constraint', field: 'query', placeholder: 'Search query' },
] as const;

const NodeForm = memo(({
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
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
        <SectionLabel icon={<Edit size={11} />}>{title}</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {NODE_FORM_FIELDS.map(({ label, field, placeholder }) => (
                <div key={field} className="space-y-1">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em]">{label}</span>
                    <Input
                        placeholder={placeholder}
                        value={(nodeForm as any)[field] ?? ''}
                        onChange={e => setNodeForm({ ...nodeForm, [field]: e.target.value })}
                        className="h-8 text-xs border-stone-200 bg-white rounded-lg placeholder:text-stone-400 font-medium focus:border-indigo-300 focus:ring-indigo-500/20"
                    />
                </div>
            ))}
            <div className="space-y-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em]">Category Mapping</span>
                <Select
                    value={nodeForm.category ?? 'none'}
                    onValueChange={val => setNodeForm({ ...nodeForm, category: val === 'none' ? undefined : val })}
                >
                    <SelectTrigger className="h-8 text-xs border-stone-200 bg-white rounded-lg">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none" className="text-xs italic text-stone-400">No Mapping</SelectItem>
                        {CATEGORY_VALUES.map(c => (
                            <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
        <div className="flex gap-2 pt-0.5">
            <button
                type="button"
                onClick={onCancel}
                className="flex-1 sm:flex-none h-8 px-3 text-[10px] font-bold uppercase tracking-widest text-stone-500 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
            >
                Cancel
            </button>
            <button
                type="button"
                onClick={onSave}
                className="flex-1 sm:flex-none h-8 px-3 text-[10px] font-bold uppercase tracking-widest bg-stone-900 text-white rounded-lg hover:bg-stone-700 transition-colors"
            >
                Save
            </button>
        </div>
    </div>
));
NodeForm.displayName = 'NodeForm';

// ─────────────────────────────────────────────────────────────
// TREE NODE — isolated memo component to prevent full-tree re-renders
// ─────────────────────────────────────────────────────────────

// Stable empty children array reference
const EMPTY_CHILDREN: any[] = [];

const CATEGORY_VALUES = Object.values(CATEGORY_NAMES);

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

const TreeNode = memo(({
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

    const handleToggle = useCallback(() => onToggle(currentPath), [onToggle, currentPath]);
    const handleEdit = useCallback(() => onEdit(node, currentPath), [onEdit, node, currentPath]);
    const handleAddSub = useCallback(() => onAddSub(currentPath), [onAddSub, currentPath]);
    const handleDelete = useCallback(() => onDelete(currentPath, node.label), [onDelete, currentPath, node.label]);

    return (
        <div>
            <div className={cn(
                'group flex items-center gap-2 px-2.5 py-2 rounded-xl border transition-all duration-150',
                isEditing
                    ? 'border-indigo-200 bg-indigo-50/40'
                    : 'border-stone-100 bg-white hover:border-stone-200 hover:shadow-sm'
            )}>
                <GripVertical size={12} className="text-stone-200 cursor-grab shrink-0 hidden sm:block" />
                <button
                    type="button"
                    onClick={handleToggle}
                    className={cn(
                        'h-6 w-6 rounded flex items-center justify-center text-stone-400 hover:bg-stone-100 active:bg-stone-200 transition-colors shrink-0',
                        !hasChildren && 'invisible'
                    )}
                >
                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                <div className={cn(
                    'h-6 w-6 rounded-lg flex items-center justify-center shrink-0',
                    depth === 0 ? 'bg-indigo-50 text-indigo-500' : 'bg-stone-100 text-stone-500'
                )}>
                    {isExpanded ? <FolderOpen size={13} /> : <Folder size={13} />}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-stone-800 tracking-tight truncate">{node.label}</p>
                    {(node.category || node.brand) && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                            {node.category && <Pill color="indigo">{node.category}</Pill>}
                            {node.brand && <Pill color="stone">{node.brand}</Pill>}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                    <ActionBtn onClick={handleAddSub}><Plus size={12} /></ActionBtn>
                    <ActionBtn onClick={handleEdit}><Edit size={12} /></ActionBtn>
                    <ActionBtn danger onClick={handleDelete}><Trash size={12} /></ActionBtn>
                </div>
            </div>

            {isEditing && (
                <div className="mt-2 mb-2 ml-6 sm:ml-10">
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
                <div className="mt-2 mb-2 ml-6 sm:ml-10">
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
                <div className="mt-1.5 mb-1.5 ml-6 sm:ml-9 pl-3 sm:pl-4 border-l-2 border-stone-100 space-y-1.5">
                    {children}
                </div>
            )}
        </div>
    );
});
TreeNode.displayName = 'TreeNode';

// ─────────────────────────────────────────────────────────────
// FILTER CARD — isolated memo to prevent grid re-renders
// ─────────────────────────────────────────────────────────────

interface FilterCardProps {
    filter: FilterDefinition;
    idx: number;
    onEdit: (idx: number, filter: FilterDefinition) => void;
    onDelete: (idx: number) => void;
}

const FilterCard = memo(({ filter, idx, onEdit, onDelete }: FilterCardProps) => {
    const handleEdit = useCallback(() => onEdit(idx, filter), [onEdit, idx, filter]);
    const handleDelete = useCallback(() => onDelete(idx), [onDelete, idx]);

    return (
        <div className="group flex items-start justify-between gap-2 px-3 py-3 rounded-xl border border-stone-100 bg-white hover:border-stone-200 hover:shadow-sm transition-all duration-150">
            <div className="min-w-0 space-y-1.5 flex-1">
                <p className="text-xs font-bold text-stone-800 tracking-tight truncate">{filter.label}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-stone-400 bg-stone-50 border border-stone-200 px-1.5 py-0.5 rounded">
                        {filter.key}
                    </span>
                    <Pill color={filter.type === 'range' ? 'amber' : 'teal'}>
                        {filter.type}
                    </Pill>
                    {filter.options && filter.options.length > 0 && (
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                            {filter.options.length} opts
                        </span>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-150 shrink-0 pt-0.5">
                <ActionBtn onClick={handleEdit}><Edit size={12} /></ActionBtn>
                <ActionBtn danger onClick={handleDelete}><Trash size={12} /></ActionBtn>
            </div>
        </div>
    );
});
FilterCard.displayName = 'FilterCard';

// ─────────────────────────────────────────────────────────────
// STABLE INITIAL FORM VALUES — defined outside to avoid GC churn
// ─────────────────────────────────────────────────────────────

const EMPTY_NODE_FORM: Partial<CategoryNode> = { label: '', category: undefined, brand: '', query: '' };
const EMPTY_FILTER_FORM: Partial<FilterDefinition> = { key: '', label: '', type: 'checkbox', options: [] };
const EMPTY_SPEC_FORM: UpdateSpecInput = {
    name: '',
    valueType: 'STRING',
    isFilterable: true,
    isRange: false,
    isMulti: false,
    filterGroup: '',
    filterOrder: 0,
    options: [],
    dependencies: [],
};

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

const CategoryManager = () => {
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
        updateFilterConfig?: (category: string, filters: FilterDefinition[]) => Promise<void>;
    };
    const { categoryHierarchy, refreshCategoryHierarchy, updateCategories, syncData, isLoading, subCategories, specs, refreshSpecs, createSpec, updateSpec, deleteSpec } = admin;
    const filterConfigs = Array.isArray(admin.filterConfigs) ? admin.filterConfigs : [];
    const updateFilterConfig = admin.updateFilterConfig ?? (async () => {});
    const categories = Array.isArray(categoryHierarchy) ? categoryHierarchy : [];
    const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>('');

    useEffect(() => {
        refreshCategoryHierarchy().catch((error) => {
            console.error('Failed to load category hierarchy', error);
        });
    }, [refreshCategoryHierarchy]);

    useEffect(() => {
        if (!selectedSubCategoryId && subCategories.length > 0) {
            setSelectedSubCategoryId(subCategories[0].id);
        }
    }, [selectedSubCategoryId, subCategories]);

    useEffect(() => {
        if (!selectedSubCategoryId) return;
        refreshSpecs(selectedSubCategoryId).catch((error) => {
            console.error('Failed to load filter schema', error);
        });
    }, [refreshSpecs, selectedSubCategoryId]);

    // ── Hierarchy state ──
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [editingNodePath, setEditingNodePath] = useState<string | null>(null);
    const [nodeForm, setNodeForm] = useState<Partial<CategoryNode>>(EMPTY_NODE_FORM);
    const [isAddingRoot, setIsAddingRoot] = useState(false);

    // ── Filter config state ──
    const [configMode, setConfigMode] = useState<'hierarchy' | 'filters'>('hierarchy');
    const [selectedCatForFilters, setSelectedCatForFilters] = useState<string>(CATEGORY_NAMES.PROCESSOR);
    const [editingFilterIdx, setEditingFilterIdx] = useState<number | null>(null);
    const [filterForm, setFilterForm] = useState<Partial<FilterDefinition>>(EMPTY_FILTER_FORM);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showSpecModal, setShowSpecModal] = useState(false);
    const [editingSpecId, setEditingSpecId] = useState<string | null>(null);
    const [specForm, setSpecForm] = useState<UpdateSpecInput>(EMPTY_SPEC_FORM);

    // ── Builder state ──
    const [showBuilderModal, setShowBuilderModal] = useState(false);
    const [builderForm, setBuilderForm] = useState<Partial<SubCategory>>({});
    const [isSavingBuilder, setIsSavingBuilder] = useState(false);

    // ── Delete confirm state ──
    const [deleteConfirm, setDeleteConfirm] = useState<{
        type: 'filter' | 'node';
        filterIdx?: number;
        nodePath?: string;
        label: string;
    } | null>(null);

    // ─── Memoized callbacks — prevent child re-renders ───

    const toggleExpand = useCallback((path: string) =>
        setExpanded(prev => ({ ...prev, [path]: !prev[path] })),
    []);

    const handleEditNode = useCallback((node: CategoryNode, path: string) => {
        setEditingNodePath(path);
        setNodeForm({ ...node });
        setIsAddingRoot(false);
    }, []);

    const handleAddSubcategory = useCallback((path: string) => {
        setEditingNodePath(path + '-new');
        setNodeForm({ label: '' });
        setIsAddingRoot(false);
    }, []);

    const cancelNodeEdit = useCallback(() => setEditingNodePath(null), []);
    const cancelAddRoot = useCallback(() => setIsAddingRoot(false), []);

    const saveNode = useCallback(() => {
        if (!editingNodePath && !isAddingRoot) return;
        const newTree = JSON.parse(JSON.stringify(categories));
        if (isAddingRoot) {
            newTree.push(nodeForm);
        } else if (editingNodePath!.endsWith('-new')) {
            const parentPath = editingNodePath!.replace('-new', '').split('-').map(Number);
            let current = newTree[parentPath[0]];
            for (let i = 1; i < parentPath.length; i++) current = current.children![parentPath[i]];
            if (!current.children) current.children = [];
            current.children.push(nodeForm);
        } else {
            const path = editingNodePath!.split('-').map(Number);
            let current = newTree[path[0]];
            for (let i = 1; i < path.length; i++) current = current.children![path[i]];
            Object.assign(current, nodeForm);
        }
        updateCategories(newTree).then(() => refreshCategoryHierarchy());
        setEditingNodePath(null);
        setIsAddingRoot(false);
        setNodeForm(EMPTY_NODE_FORM);
    }, [editingNodePath, isAddingRoot, categories, nodeForm, updateCategories, refreshCategoryHierarchy]);

    const deleteNode = useCallback((pathStr: string, nodeLabel: string) =>
        setDeleteConfirm({ type: 'node', nodePath: pathStr, label: nodeLabel }),
    []);

    const confirmDeleteNode = useCallback((pathStr: string) => {
        const newTree = JSON.parse(JSON.stringify(categories));
        const path = pathStr.split('-').map(Number);
        if (path.length === 1) {
            newTree.splice(path[0], 1);
        } else {
            let parent = newTree[path[0]];
            for (let i = 1; i < path.length - 1; i++) parent = parent.children![path[i]];
            parent.children!.splice(path[path.length - 1], 1);
        }
        updateCategories(newTree).then(() => refreshCategoryHierarchy());
    }, [categories, updateCategories, refreshCategoryHierarchy]);

    const activeFilters = useMemo<FilterDefinition[]>(() =>
        filterConfigs.find(c => c.category === selectedCatForFilters)?.filters || EMPTY_CHILDREN,
        [filterConfigs, selectedCatForFilters]
    );

    const selectedSubCategory = useMemo(
        () => subCategories.find((subCategory) => subCategory.id === selectedSubCategoryId) ?? null,
        [selectedSubCategoryId, subCategories],
    );

    const openBuilderConfig = useCallback(() => {
        if (!selectedSubCategory) return;
        setBuilderForm({
            isBuilderEnabled: selectedSubCategory.isBuilderEnabled ?? false,
            isCore: selectedSubCategory.isCore ?? false,
            isRequired: selectedSubCategory.isRequired ?? false,
            allowMultiple: selectedSubCategory.allowMultiple ?? false,
            builderOrder: selectedSubCategory.builderOrder ?? 0,
            icon: selectedSubCategory.icon ?? '',
            shortLabel: selectedSubCategory.shortLabel ?? '',
        });
        setShowBuilderModal(true);
    }, [selectedSubCategory]);

    const saveBuilderConfig = useCallback(async () => {
        if (!selectedSubCategoryId) return;
        setIsSavingBuilder(true);
        try {
            const response = await fetch(`/api/catalog/subcategories/${selectedSubCategoryId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(builderForm)
            });
            if (!response.ok) throw new Error("Failed to save");
            await admin.syncData();
            setShowBuilderModal(false);
        } catch (error) {
            console.error('Failed to save builder config', error);
        } finally {
            setIsSavingBuilder(false);
        }
    }, [selectedSubCategoryId, builderForm, admin]);

    const activeSpecs = useMemo(
        () => specs.filter((spec) => spec.subCategoryId === selectedSubCategoryId),
        [selectedSubCategoryId, specs],
    );

    const handleSaveFilter = useCallback(() => {
        if (!filterForm.key || !filterForm.label) return;
        const newFilters = [...activeFilters];
        const filterData = filterForm as FilterDefinition;
        if (editingFilterIdx !== null) newFilters[editingFilterIdx] = filterData;
        else newFilters.push(filterData);
        updateFilterConfig(selectedCatForFilters, newFilters);
        setShowFilterModal(false);
        setFilterForm(EMPTY_FILTER_FORM);
        setEditingFilterIdx(null);
    }, [filterForm, activeFilters, editingFilterIdx, updateFilterConfig, selectedCatForFilters]);

    const handleDeleteFilter = useCallback((idx: number) => {
        const filter = activeFilters[idx];
        setDeleteConfirm({ type: 'filter', filterIdx: idx, label: filter?.label || 'this filter' });
    }, [activeFilters]);

    const handleEditFilter = useCallback((idx: number, filter: FilterDefinition) => {
        setEditingFilterIdx(idx);
        setFilterForm(filter);
        setShowFilterModal(true);
    }, []);

    const confirmDeleteFilter = useCallback((idx: number) => {
        const newFilters = [...activeFilters];
        newFilters.splice(idx, 1);
        updateFilterConfig(selectedCatForFilters, newFilters);
    }, [activeFilters, updateFilterConfig, selectedCatForFilters]);

    const handleConfirmDelete = useCallback(() => {
        if (!deleteConfirm) return;
        if (deleteConfirm.type === 'filter' && deleteConfirm.filterIdx !== undefined)
            confirmDeleteFilter(deleteConfirm.filterIdx);
        else if (deleteConfirm.type === 'node' && deleteConfirm.nodePath)
            confirmDeleteNode(deleteConfirm.nodePath);
        setDeleteConfirm(null);
    }, [deleteConfirm, confirmDeleteFilter, confirmDeleteNode]);

    const closeDeleteConfirm = useCallback((open: boolean) => {
        if (!open) setDeleteConfirm(null);
    }, []);

    const closeFilterModal = useCallback((open: boolean) => {
        setShowFilterModal(open);
    }, []);

    const openAddRoot = useCallback(() => {
        setIsAddingRoot(true);
        setNodeForm(EMPTY_NODE_FORM);
        setEditingNodePath(null);
    }, []);

    const openAddFilter = useCallback(() => {
        setShowFilterModal(true);
        setEditingFilterIdx(null);
        setFilterForm(EMPTY_FILTER_FORM);
    }, []);

    const handleSyncData = useCallback(() => syncData(), [syncData]);

    const handleCatForFiltersChange = useCallback((val: string) =>
        setSelectedCatForFilters(val),
    []);

    // ─── Tree renderer — memoized with useCallback, stable deps ───
    const renderTree = useCallback((nodes: any[], pathPrefix = '', depth = 0): React.ReactNode =>
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
    [expanded, editingNodePath, nodeForm, toggleExpand, handleEditNode, handleAddSubcategory, deleteNode, saveNode, cancelNodeEdit]);

    // Memoize the filter options textarea value to avoid recalc on every keystroke elsewhere
    const filterOptionsValue = useMemo(() =>
        filterForm.options?.join(', ') || '',
    [filterForm.options]);

    const handleFilterOptionsChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) =>
        setFilterForm(prev => ({
            ...prev,
            options: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
        })),
    []);

    const handleFilterFieldChange = useCallback((field: string) =>
        (e: React.ChangeEvent<HTMLInputElement>) =>
            setFilterForm(prev => ({ ...prev, [field]: e.target.value })),
    []);

    const handleFilterTypeChange = useCallback((val: string) =>
        setFilterForm(prev => ({ ...prev, type: val as 'checkbox' | 'range' })),
    []);

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
            filterGroup: spec.filterGroup ?? '',
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
                        parentOptionValue: dependency.parentOption?.value ?? '',
                        childOptionValue: null,
                    })),
                ...((spec.options ?? []).flatMap((option) =>
                    (option.childOptionDeps ?? []).map((dependency) => ({
                        parentSpecId: dependency.parentSpecId,
                        parentOptionValue: dependency.parentOption?.value ?? '',
                        childOptionValue: option.value,
                    })),
                )),
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
            options: (specForm.options ?? []).filter((option) => option.value.trim().length > 0).map((option, index) => ({
                ...option,
                value: option.value.trim(),
                label: option.label?.trim() || option.value.trim(),
                order: option.order ?? index,
            })),
            dependencies: (specForm.dependencies ?? []).filter((dependency) => dependency.parentSpecId && dependency.parentOptionValue),
        };

        if (editingSpecId) {
            await updateSpec(editingSpecId, payload);
        } else {
            const response = await fetch('/api/catalog/specs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subCategoryId: selectedSubCategoryId,
                    name: payload.name ?? '',
                    valueType: payload.valueType ?? 'STRING',
                    isFilterable: payload.isFilterable,
                    isRange: payload.isRange,
                    isMulti: payload.isMulti,
                    filterGroup: payload.filterGroup ?? undefined,
                    filterOrder: payload.filterOrder ?? undefined,
                    options: payload.options,
                }),
            });
            if (!response.ok) {
                throw new Error(await response.text());
            }
            const created = await response.json();
            if (payload.dependencies && payload.dependencies.length > 0) {
                await updateSpec(created.id, payload);
            }
        }

        await refreshSpecs(selectedSubCategoryId);

        setShowSpecModal(false);
        setEditingSpecId(null);
        setSpecForm(EMPTY_SPEC_FORM);
    }, [editingSpecId, refreshSpecs, selectedSubCategoryId, specForm, updateSpec]);

    const removeSpec = useCallback(async (spec: SpecDefinition) => {
        await deleteSpec(spec.id, spec.subCategoryId);
    }, [deleteSpec]);

    const availableParentSpecs = useMemo(
        () => activeSpecs.filter((spec) => spec.id !== editingSpecId),
        [activeSpecs, editingSpecId],
    );

    return (
        <div
            className="space-y-2.5"
            style={{ fontFamily: "'DM Sans', 'Geist', 'system-ui', sans-serif" }}
        >

            {/* ── PAGE HEADER ── */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-1 h-4 rounded-full bg-indigo-500 flex-shrink-0" />
                    <div className="min-w-0">
                        <h2 className="text-sm font-bold text-stone-800 tracking-tight">Categories & Filters</h2>
                        <p className="text-[11px] text-stone-400 mt-0.5 hidden sm:block">
                            Navigation hierarchy and filter configuration
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={handleSyncData}
                        disabled={isLoading}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-stone-50 text-stone-600 border border-stone-200 text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">Sync</span>
                    </button>
                    <div className="flex items-center gap-px bg-stone-100 p-1 rounded-xl border border-stone-200">
                        {(['hierarchy', 'filters'] as const).map(mode => (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => setConfigMode(mode)}
                                className={cn(
                                    'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-150',
                                    configMode === mode
                                        ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                                        : 'text-stone-400 hover:text-stone-700'
                                )}
                            >
                                {mode === 'hierarchy' ? <Layers size={11} /> : <ListFilter size={11} />}
                                <span className="hidden sm:inline">
                                    {mode === 'hierarchy' ? 'Hierarchy' : 'Filters'}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════ */}
            {/*  HIERARCHY MODE                        */}
            {/* ══════════════════════════════════════ */}
            {configMode === 'hierarchy' && (
                <Panel stripe="indigo">
                    <PanelHeader
                        icon={<Layers size={12} />}
                        right={
                            <button
                                type="button"
                                onClick={openAddRoot}
                                className="flex items-center gap-1 h-7 px-2.5 text-[10px] font-bold uppercase tracking-widest bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex-shrink-0"
                            >
                                <Plus size={11} />
                                <span className="hidden sm:inline">Add Root</span>
                                <span className="sm:hidden">Add</span>
                            </button>
                        }
                    >
                        Category Hierarchy
                    </PanelHeader>

                    <div className="px-3 sm:px-5 py-3 space-y-1.5">
                        {isAddingRoot && (
                            <div className="mb-3">
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
                            <div className="py-12 flex flex-col items-center gap-3">
                                <Folder size={24} className="text-stone-200" />
                                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                                    No categories configured
                                </p>
                                <button
                                    type="button"
                                    onClick={openAddRoot}
                                    className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline"
                                >
                                    Add first category →
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                {renderTree(categories)}
                            </div>
                        )}
                    </div>
                </Panel>
            )}

            {/* ══════════════════════════════════════ */}
            {/*  FILTERS MODE                          */}
            {/* ══════════════════════════════════════ */}
            {configMode === 'filters' && (
                <Panel stripe="teal">
                    <PanelHeader
                        icon={<ListFilter size={12} />}
                        right={
                            <button
                                type="button"
                                onClick={openCreateSpec}
                                className="flex items-center gap-1 h-7 px-2.5 text-[10px] font-bold uppercase tracking-widest bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm flex-shrink-0"
                            >
                                <Plus size={11} />
                                <span className="hidden sm:inline">Add Filter</span>
                                <span className="sm:hidden">Add</span>
                            </button>
                        }
                    >
                        Filter Configuration
                    </PanelHeader>

                    <div className="px-3 sm:px-5 py-3 space-y-3">
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-stone-50 border border-stone-100 rounded-xl flex-wrap sm:flex-nowrap">
                            <SectionLabel icon={<Layers size={11} />}>Subcategory</SectionLabel>
                            <div className="flex-1 min-w-0">
                                <Select
                                    value={selectedSubCategoryId}
                                    onValueChange={setSelectedSubCategoryId}
                                >
                                    <SelectTrigger className="h-8 text-xs border-stone-200 bg-white rounded-lg w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subCategories.map((subCategory) => (
                                            <SelectItem key={subCategory.id} value={subCategory.id} className="text-xs">
                                                {subCategory.category?.name ? `${subCategory.category.name} / ${subCategory.name}` : subCategory.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <button
                                type="button"
                                onClick={openBuilderConfig}
                                className="flex items-center gap-1.5 h-8 px-3 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex-shrink-0"
                                disabled={!selectedSubCategory}
                            >
                                <Settings size={13} />
                                PC Builder
                            </button>
                            <span className="text-[10px] font-bold font-mono text-stone-400 bg-white border border-stone-200 px-2 py-0.5 rounded-md flex-shrink-0">
                                {activeSpecs.length} filter{activeSpecs.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {activeSpecs.length === 0 ? (
                            <div className="py-12 flex flex-col items-center gap-3">
                                <ListFilter size={24} className="text-stone-200" />
                                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                                    No filters defined
                                </p>
                                <button
                                    type="button"
                                    onClick={openCreateSpec}
                                    className="text-[10px] font-bold text-teal-600 uppercase tracking-widest hover:underline"
                                >
                                    Add first filter →
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                {activeSpecs.map((spec) => (
                                    <div key={spec.id} className="group flex items-start justify-between gap-2 px-3 py-3 rounded-xl border border-stone-100 bg-white hover:border-stone-200 hover:shadow-sm transition-all duration-150">
                                        <div className="min-w-0 space-y-1.5 flex-1">
                                            <p className="text-xs font-bold text-stone-800 tracking-tight truncate">{spec.name}</p>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className="text-[10px] font-mono font-bold text-stone-400 bg-stone-50 border border-stone-200 px-1.5 py-0.5 rounded">
                                                    {spec.valueType}
                                                </span>
                                                <Pill color={spec.isFilterable ? 'teal' : 'stone'}>
                                                    {spec.isFilterable ? 'Visible' : 'Hidden'}
                                                </Pill>
                                                {spec.filterGroup && <Pill color="indigo">{spec.filterGroup}</Pill>}
                                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                                    {(spec.options ?? []).length} opts
                                                </span>
                                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                                    {(spec.childOptionDeps ?? []).length} rels
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-150 shrink-0 pt-0.5">
                                            <ActionBtn onClick={() => openEditSpec(spec)}><Edit size={12} /></ActionBtn>
                                            <ActionBtn danger onClick={() => removeSpec(spec)}><Trash size={12} /></ActionBtn>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Panel>
            )}

            {/* ══════════════════════════════════════ */}
            {/*  FILTER MODAL                          */}
            {/* ══════════════════════════════════════ */}
            <Dialog open={showSpecModal} onOpenChange={closeSpecModal}>
                <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl bg-white border-stone-200 rounded-2xl shadow-xl">
                    <div className="h-0.5 w-full bg-gradient-to-r from-teal-400 via-emerald-400 to-emerald-300 -mt-6 mb-4 rounded-t-2xl" />
                    <DialogHeader className="pb-2">
                        <DialogTitle className="text-sm font-bold text-stone-800 tracking-tight">
                            {editingSpecId ? 'Edit Dynamic Filter' : 'New Dynamic Filter'}
                        </DialogTitle>
                        <DialogDescription className="text-[11px] text-stone-400">
                            {selectedSubCategory ? `${selectedSubCategory.category?.name ?? 'Catalog'} / ${selectedSubCategory.name}` : 'Select a subcategory first'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-1 max-h-[70vh] overflow-y-auto pr-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em]">Filter Label</span>
                                <Input placeholder="e.g. Socket" value={specForm.name ?? ''} onChange={(e) => setSpecForm((prev) => ({ ...prev, name: e.target.value }))} className="h-8 text-xs border-stone-200 bg-stone-50 rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em]">Group</span>
                                <Input placeholder="e.g. Compatibility" value={specForm.filterGroup ?? ''} onChange={(e) => setSpecForm((prev) => ({ ...prev, filterGroup: e.target.value }))} className="h-8 text-xs border-stone-200 bg-stone-50 rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em]">Value Type</span>
                                <Select value={specForm.valueType ?? 'STRING'} onValueChange={(value) => setSpecForm((prev) => ({ ...prev, valueType: value }))}>
                                    <SelectTrigger className="h-8 text-xs border-stone-200 bg-stone-50 rounded-lg"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="STRING" className="text-xs">String</SelectItem>
                                        <SelectItem value="NUMBER" className="text-xs">Number</SelectItem>
                                        <SelectItem value="BOOLEAN" className="text-xs">Boolean</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em]">Sort Order</span>
                                <Input type="number" value={specForm.filterOrder ?? 0} onChange={(e) => setSpecForm((prev) => ({ ...prev, filterOrder: Number(e.target.value) }))} className="h-8 text-xs border-stone-200 bg-stone-50 rounded-lg" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {[
                                ['isFilterable', 'Visible'],
                                ['isRange', 'Range-like'],
                                ['isMulti', 'Multi-value'],
                            ].map(([field, label]) => (
                                <label key={field} className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-600">
                                    <input type="checkbox" checked={Boolean((specForm as Record<string, unknown>)[field])} onChange={(e) => setSpecForm((prev) => ({ ...prev, [field]: e.target.checked }))} />
                                    {label}
                                </label>
                            ))}
                        </div>

                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em]">Filter Options</span>
                            <Textarea
                                placeholder="AM4, AM5, LGA1700"
                                value={(specForm.options ?? []).map((option) => option.value).join(', ')}
                                onChange={(e) => setSpecForm((prev) => ({
                                    ...prev,
                                    options: e.target.value.split(',').map((value, index) => value.trim()).filter(Boolean).map((value, index) => ({ value, label: value, order: index })),
                                }))}
                                className="min-h-[72px] text-xs font-medium border-stone-200 bg-stone-50 rounded-lg resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em]">Relationships</span>
                                <button type="button" onClick={() => setSpecForm((prev) => ({ ...prev, dependencies: [...(prev.dependencies ?? []), { parentSpecId: '', parentOptionValue: '', childOptionValue: null }] }))} className="text-[10px] font-bold text-teal-600 uppercase tracking-widest hover:underline">
                                    Add relation
                                </button>
                            </div>

                            {(specForm.dependencies ?? []).map((dependency, index) => {
                                const parentSpec = availableParentSpecs.find((spec) => spec.id === dependency.parentSpecId);
                                const parentOptions = parentSpec?.options ?? [];

                                return (
                                    <div key={`${dependency.parentSpecId}-${dependency.parentOptionValue}-${index}`} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 rounded-xl border border-stone-100 bg-stone-50/60 p-3">
                                        <Select value={dependency.parentSpecId} onValueChange={(value) => setSpecForm((prev) => ({ ...prev, dependencies: (prev.dependencies ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, parentSpecId: value, parentOptionValue: '' } : item) }))}>
                                            <SelectTrigger className="h-8 text-xs border-stone-200 bg-white rounded-lg"><SelectValue placeholder="Parent filter" /></SelectTrigger>
                                            <SelectContent>
                                                {availableParentSpecs.map((spec) => (
                                                    <SelectItem key={spec.id} value={spec.id} className="text-xs">{spec.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select value={dependency.parentOptionValue} onValueChange={(value) => setSpecForm((prev) => ({ ...prev, dependencies: (prev.dependencies ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, parentOptionValue: value } : item) }))}>
                                            <SelectTrigger className="h-8 text-xs border-stone-200 bg-white rounded-lg"><SelectValue placeholder="Parent option" /></SelectTrigger>
                                            <SelectContent>
                                                {parentOptions.map((option) => (
                                                    <SelectItem key={option.id} value={option.value} className="text-xs">{option.label ?? option.value}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select value={dependency.childOptionValue ?? '__all__'} onValueChange={(value) => setSpecForm((prev) => ({ ...prev, dependencies: (prev.dependencies ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, childOptionValue: value === '__all__' ? null : value } : item) }))}>
                                            <SelectTrigger className="h-8 text-xs border-stone-200 bg-white rounded-lg"><SelectValue placeholder="Child option" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__all__" className="text-xs">Whole filter</SelectItem>
                                                {(specForm.options ?? []).map((option) => (
                                                    <SelectItem key={option.value} value={option.value} className="text-xs">{option.label ?? option.value}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <button type="button" onClick={() => setSpecForm((prev) => ({ ...prev, dependencies: (prev.dependencies ?? []).filter((_, itemIndex) => itemIndex !== index) }))} className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest border border-stone-200 text-stone-500 rounded-lg hover:bg-white">
                                            Remove
                                        </button>
                                    </div>
                                );
                            })}

                            {(specForm.dependencies ?? []).length === 0 && (
                                <p className="text-[11px] text-stone-400">No dependencies configured. Add one when a filter or option should only be available after another selection.</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="gap-2 pt-2 flex-row">
                        <button type="button" onClick={() => closeSpecModal(false)} className="flex-1 h-10 px-4 text-[10px] font-bold uppercase tracking-widest border border-stone-200 text-stone-500 rounded-lg hover:bg-stone-50 transition-colors">
                            Cancel
                        </button>
                        <button type="button" onClick={saveSpec} className="flex-1 h-10 px-4 text-[10px] font-bold uppercase tracking-widest bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm">
                            Save Filter
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showFilterModal} onOpenChange={closeFilterModal}>
                <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg bg-white border-stone-200 rounded-2xl shadow-xl">
                    <div className="h-0.5 w-full bg-gradient-to-r from-teal-400 via-emerald-400 to-emerald-300 -mt-6 mb-4 rounded-t-2xl" />
                    <DialogHeader className="pb-2">
                        <DialogTitle className="text-sm font-bold text-stone-800 tracking-tight">
                            {editingFilterIdx !== null ? 'Edit Filter' : 'New Filter'}
                        </DialogTitle>
                        <DialogDescription className="text-[11px] text-stone-400">
                            Configuring filters for:{' '}
                            <span className="font-bold text-stone-600">{selectedCatForFilters}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {[
                                { label: 'Filter Key', field: 'key', placeholder: 'e.g. specs.brand', mono: true },
                                { label: 'Display Label', field: 'label', placeholder: 'e.g. Manufacturer', mono: false },
                            ].map(({ label, field, placeholder, mono }) => (
                                <div key={field} className="space-y-1">
                                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em]">{label}</span>
                                    <Input
                                        placeholder={placeholder}
                                        value={(filterForm as any)[field] ?? ''}
                                        onChange={handleFilterFieldChange(field)}
                                        className={cn(
                                            'h-8 text-xs border-stone-200 bg-stone-50 rounded-lg focus:bg-white focus:border-teal-300 focus:ring-teal-500/20 placeholder:text-stone-400',
                                            mono && 'font-mono'
                                        )}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em]">Filter Type</span>
                            <Select
                                value={filterForm.type}
                                onValueChange={handleFilterTypeChange}
                            >
                                <SelectTrigger className="h-8 text-xs border-stone-200 bg-stone-50 rounded-lg">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="checkbox" className="text-xs">Checkbox</SelectItem>
                                    <SelectItem value="range" className="text-xs">Range (Price / Value)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em]">Options</span>
                            <Textarea
                                placeholder="AMD, Intel, NVIDIA  (comma-separated)"
                                value={filterOptionsValue}
                                onChange={handleFilterOptionsChange}
                                className="min-h-[72px] text-xs font-medium border-stone-200 bg-stone-50 rounded-lg resize-none focus:bg-white focus:border-teal-300 focus:ring-teal-500/20 placeholder:text-stone-400"
                            />
                            <p className="text-[10px] text-stone-400">Separate values with commas.</p>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 pt-2 flex-row">
                        <button
                            type="button"
                            onClick={() => setShowFilterModal(false)}
                            className="flex-1 h-10 px-4 text-[10px] font-bold uppercase tracking-widest border border-stone-200 text-stone-500 rounded-lg hover:bg-stone-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveFilter}
                            className="flex-1 h-10 px-4 text-[10px] font-bold uppercase tracking-widest bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
                        >
                            Save Filter
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ══════════════════════════════════════ */}
            {/*  DELETE CONFIRM MODAL                  */}
            {/* ══════════════════════════════════════ */}
            <Dialog open={deleteConfirm !== null} onOpenChange={closeDeleteConfirm}>
                <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md bg-white border-stone-200 rounded-2xl shadow-xl">
                    <div className="h-0.5 w-full bg-gradient-to-r from-rose-400 via-rose-400 to-rose-300 -mt-6 mb-4 rounded-t-2xl" />
                    <DialogHeader className="pb-2">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-7 w-7 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle size={14} className="text-rose-500" />
                            </div>
                            <DialogTitle className="text-sm font-bold text-stone-800 tracking-tight">
                                Confirm Delete
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-xs text-stone-500 leading-relaxed pl-9">
                            {deleteConfirm?.type === 'node' ? (
                                <>
                                    Delete <span className="font-bold text-stone-700">{deleteConfirm?.label}</span> and all its subcategories? This cannot be undone.
                                </>
                            ) : (
                                <>
                                    Delete filter <span className="font-bold text-stone-700">{deleteConfirm?.label}</span>? This cannot be undone.
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 pt-2 flex-row">
                        <button
                            type="button"
                            onClick={() => setDeleteConfirm(null)}
                            className="flex-1 h-10 px-4 text-[10px] font-bold uppercase tracking-widest border border-stone-200 text-stone-500 rounded-lg hover:bg-stone-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmDelete}
                            className="flex-1 h-10 px-4 text-[10px] font-bold uppercase tracking-widest bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                        >
                            <Trash size={11} /> Delete
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-xl bg-white border-stone-200 rounded-2xl shadow-xl">
                    <DialogHeader className="pb-2 border-b border-stone-100 mb-2">
                        <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                <Settings size={14} className="text-indigo-600" />
                            </div>
                            <DialogTitle className="text-sm font-bold text-stone-800 tracking-tight">
                                PC Builder Settings: {selectedSubCategory?.name}
                            </DialogTitle>
                        </div>
                    </DialogHeader>
                    
                    <div className="py-2 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1">
                                    Enabled in PC Builder
                                </label>
                                <Select
                                    value={builderForm.isBuilderEnabled ? "true" : "false"}
                                    onValueChange={(val) => setBuilderForm(prev => ({ ...prev, isBuilderEnabled: val === "true" }))}
                                >
                                    <SelectTrigger className="h-9 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">Yes</SelectItem>
                                        <SelectItem value="false">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1">
                                    Display Order
                                </label>
                                <Input
                                    type="number"
                                    value={builderForm.builderOrder ?? 0}
                                    onChange={(e) => setBuilderForm(prev => ({ ...prev, builderOrder: parseInt(e.target.value) || 0 }))}
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1">
                                    Short Label
                                </label>
                                <Input
                                    value={builderForm.shortLabel ?? ''}
                                    onChange={(e) => setBuilderForm(prev => ({ ...prev, shortLabel: e.target.value }))}
                                    placeholder="e.g. CPU, RAM"
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1">
                                    Lucide Icon Name
                                </label>
                                <Input
                                    value={builderForm.icon ?? ''}
                                    onChange={(e) => setBuilderForm(prev => ({ ...prev, icon: e.target.value }))}
                                    placeholder="cpu, memory"
                                    className="h-9 text-sm"
                                />
                            </div>
                            
                            <div className="col-span-2 space-y-2 mt-2">
                                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1 border-b border-stone-100 pb-2">
                                    Builder Rules
                                </label>
                                
                                <label className="flex items-center gap-3 p-2 hover:bg-stone-50 rounded-lg cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="h-4 w-4 rounded border-stone-300 text-indigo-600 focus:ring-indigo-600"
                                        checked={builderForm.isCore ?? false}
                                        onChange={(e) => setBuilderForm(prev => ({ ...prev, isCore: e.target.checked }))}
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-stone-800">Core Component</span>
                                        <span className="text-xs text-stone-500">Essential for a functioning PC</span>
                                    </div>
                                </label>
                                
                                <label className="flex items-center gap-3 p-2 hover:bg-stone-50 rounded-lg cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="h-4 w-4 rounded border-stone-300 text-indigo-600 focus:ring-indigo-600"
                                        checked={builderForm.isRequired ?? false}
                                        onChange={(e) => setBuilderForm(prev => ({ ...prev, isRequired: e.target.checked }))}
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-stone-800">Required Selection</span>
                                        <span className="text-xs text-stone-500">User must pick an item from this category</span>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 p-2 hover:bg-stone-50 rounded-lg cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="h-4 w-4 rounded border-stone-300 text-indigo-600 focus:ring-indigo-600"
                                        checked={builderForm.allowMultiple ?? false}
                                        onChange={(e) => setBuilderForm(prev => ({ ...prev, allowMultiple: e.target.checked }))}
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-stone-800">Allow Multiple</span>
                                        <span className="text-xs text-stone-500">Users can pick multiple items (e.g. RAM, Storage)</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 pt-2 flex-row">
                        <button
                            type="button"
                            onClick={() => setShowBuilderModal(false)}
                            className="flex-1 h-10 px-4 text-[10px] font-bold uppercase tracking-widest border border-stone-200 text-stone-500 rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-50"
                            disabled={isSavingBuilder}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={saveBuilderConfig}
                            className="flex-1 h-10 px-4 text-[10px] font-bold uppercase tracking-widest bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                            disabled={isSavingBuilder}
                        >
                            {isSavingBuilder ? <RefreshCw className="animate-spin" size={12} /> : <Save size={12} />}
                            {isSavingBuilder ? 'Saving...' : 'Save Settings'}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            )}
        </div>
    );
};

export default CategoryManager;
