'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useShop } from '@/context/ShopContext';
import { useAdmin } from '@/context/AdminContext';
import { Category, CategoryNode, FilterDefinition } from '@/types';
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
// SHARED PRIMITIVES  (mirrors Overview / OrderManager system)
// ─────────────────────────────────────────────────────────────

const SectionLabel = ({
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
);

type Stripe = 'indigo' | 'teal' | 'amber' | 'rose' | 'violet' | 'stone';

const Panel = ({
    children,
    className,
    stripe,
}: {
    children: React.ReactNode;
    className?: string;
    stripe?: Stripe;
}) => {
    const stripes: Record<Stripe, string> = {
        indigo: 'from-indigo-400 via-indigo-500 to-violet-400',
        teal:   'from-teal-400 via-emerald-400 to-emerald-300',
        amber:  'from-amber-400 via-amber-400 to-orange-300',
        rose:   'from-rose-400 via-rose-400 to-rose-300',
        violet: 'from-violet-400 via-violet-500 to-indigo-400',
        stone:  'from-stone-300 via-stone-400 to-stone-300',
    };
    return (
        <div className={cn('rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden', className)}>
            {stripe && (
                <div className={cn('h-0.5 w-full bg-gradient-to-r', stripes[stripe])} />
            )}
            {children}
        </div>
    );
};

const PanelHeader = ({
    icon,
    children,
    right,
}: {
    icon: React.ReactNode;
    children: React.ReactNode;
    right?: React.ReactNode;
}) => (
    <div className="px-5 py-3.5 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
        <SectionLabel icon={icon}>{children}</SectionLabel>
        {right}
    </div>
);

// ─────────────────────────────────────────────────────────────
// SMALL REUSABLES
// ─────────────────────────────────────────────────────────────

const Pill = ({ children, color = 'stone' }: { children: React.ReactNode; color?: 'stone' | 'indigo' | 'teal' | 'amber' | 'violet' }) => {
    const cls = {
        stone:  'bg-stone-100 text-stone-600 ring-stone-200',
        indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
        teal:   'bg-teal-50 text-teal-700 ring-teal-200',
        amber:  'bg-amber-50 text-amber-700 ring-amber-200',
        violet: 'bg-violet-50 text-violet-700 ring-violet-200',
    }[color];
    return (
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ring-1 whitespace-nowrap', cls)}>
            {children}
        </span>
    );
};

const ActionBtn = ({
    onClick,
    danger,
    children,
    className,
}: {
    onClick: () => void;
    danger?: boolean;
    children: React.ReactNode;
    className?: string;
}) => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            'h-6 w-6 rounded-md flex items-center justify-center transition-all duration-150',
            danger
                ? 'text-stone-300 hover:text-rose-500 hover:bg-rose-50'
                : 'text-stone-300 hover:text-stone-700 hover:bg-stone-100',
            className
        )}
    >
        {children}
    </button>
);

// ─────────────────────────────────────────────────────────────
// INLINE NODE FORM  (shared by add-root, add-sub, edit)
// ─────────────────────────────────────────────────────────────

const NodeForm = ({
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
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
        <SectionLabel icon={<Edit size={11} />}>{title}</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
                { label: 'Display Label', field: 'label', placeholder: 'e.g. Laptops' },
                { label: 'Brand Filter', field: 'brand', placeholder: 'e.g. ASUS' },
                { label: 'Query Constraint', field: 'query', placeholder: 'Search query' },
            ].map(({ label, field, placeholder }) => (
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
                    onValueChange={val => setNodeForm({ ...nodeForm, category: val === 'none' ? undefined : val as Category })}
                >
                    <SelectTrigger className="h-8 text-xs border-stone-200 bg-white rounded-lg">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none" className="text-xs italic text-stone-400">No Mapping</SelectItem>
                        {Object.values(Category).map(c => (
                            <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
            <button
                type="button"
                onClick={onCancel}
                className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest text-stone-500 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
            >
                Cancel
            </button>
            <button
                type="button"
                onClick={onSave}
                className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest bg-stone-900 text-white rounded-lg hover:bg-stone-700 transition-colors"
            >
                Save
            </button>
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

const CategoryManager = () => {
    const { categories, refreshCategories, refreshFilterConfigs: refreshShopFilterConfigs } = useShop();
    const { updateCategories, filterConfigs, updateFilterConfig } = useAdmin();

    useEffect(() => { refreshCategories(); }, [refreshCategories]);

    // ── Hierarchy state ──
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [editingNodePath, setEditingNodePath] = useState<string | null>(null);
    const [nodeForm, setNodeForm] = useState<Partial<CategoryNode>>({ label: '', category: undefined, brand: '', query: '' });
    const [isAddingRoot, setIsAddingRoot] = useState(false);

    // ── Filter config state ──
    const [configMode, setConfigMode] = useState<'hierarchy' | 'filters'>('hierarchy');
    const [selectedCatForFilters, setSelectedCatForFilters] = useState<Category>(Category.PROCESSOR);
    const [editingFilterIdx, setEditingFilterIdx] = useState<number | null>(null);
    const [filterForm, setFilterForm] = useState<Partial<FilterDefinition>>({ key: '', label: '', type: 'checkbox', options: [] });
    const [showFilterModal, setShowFilterModal] = useState(false);

    // ── Delete confirm state ──
    const [deleteConfirm, setDeleteConfirm] = useState<{
        type: 'filter' | 'node';
        filterIdx?: number;
        nodePath?: string;
        label: string;
    } | null>(null);

    // ─── Hierarchy helpers ───
    const toggleExpand = (path: string) =>
        setExpanded(prev => ({ ...prev, [path]: !prev[path] }));

    const handleEditNode = (node: CategoryNode, path: string) => {
        setEditingNodePath(path);
        setNodeForm({ ...node });
        setIsAddingRoot(false);
    };

    const handleAddSubcategory = (path: string) => {
        setEditingNodePath(path + '-new');
        setNodeForm({ label: '' });
        setIsAddingRoot(false);
    };

    const saveNode = () => {
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
        updateCategories(newTree).then(() => refreshCategories());
        setEditingNodePath(null);
        setIsAddingRoot(false);
        setNodeForm({ label: '', category: undefined, brand: '', query: '' });
    };

    const deleteNode = (pathStr: string, nodeLabel: string) =>
        setDeleteConfirm({ type: 'node', nodePath: pathStr, label: nodeLabel });

    const confirmDeleteNode = (pathStr: string) => {
        const newTree = JSON.parse(JSON.stringify(categories));
        const path = pathStr.split('-').map(Number);
        if (path.length === 1) {
            newTree.splice(path[0], 1);
        } else {
            let parent = newTree[path[0]];
            for (let i = 1; i < path.length - 1; i++) parent = parent.children![path[i]];
            parent.children!.splice(path[path.length - 1], 1);
        }
        updateCategories(newTree).then(() => refreshCategories());
    };

    const activeFilters = useMemo(() =>
        filterConfigs.find(c => c.category === selectedCatForFilters)?.filters || [],
        [filterConfigs, selectedCatForFilters]
    );

    const handleSaveFilter = () => {
        if (!filterForm.key || !filterForm.label) return;
        const newFilters = [...activeFilters];
        const filterData = filterForm as FilterDefinition;
        if (editingFilterIdx !== null) newFilters[editingFilterIdx] = filterData;
        else newFilters.push(filterData);
        updateFilterConfig(selectedCatForFilters, newFilters);
        setShowFilterModal(false);
        setFilterForm({ key: '', label: '', type: 'checkbox', options: [], dependency: undefined });
        setEditingFilterIdx(null);
    };

    const handleDeleteFilter = (idx: number) => {
        const filter = activeFilters[idx];
        setDeleteConfirm({ type: 'filter', filterIdx: idx, label: filter?.label || 'this filter' });
    };

    const confirmDeleteFilter = (idx: number) => {
        const newFilters = [...activeFilters];
        newFilters.splice(idx, 1);
        updateFilterConfig(selectedCatForFilters, newFilters).then(() => refreshShopFilterConfigs());
    };

    const handleConfirmDelete = () => {
        if (!deleteConfirm) return;
        if (deleteConfirm.type === 'filter' && deleteConfirm.filterIdx !== undefined)
            confirmDeleteFilter(deleteConfirm.filterIdx);
        else if (deleteConfirm.type === 'node' && deleteConfirm.nodePath)
            confirmDeleteNode(deleteConfirm.nodePath);
        setDeleteConfirm(null);
    };

    // ─── Tree renderer ───
    const renderTree = (nodes: any[], pathPrefix = '', depth = 0): React.ReactNode =>
        nodes.map((node, index) => {
            const currentPath = `${pathPrefix}${index}`;
            const isExpanded = expanded[currentPath];
            const hasChildren = node.children && node.children.length > 0;
            const isEditing = editingNodePath === currentPath;
            const isAddingSub = editingNodePath === `${currentPath}-new`;

            return (
                <div key={currentPath}>
                    {/* Node row */}
                    <div className={cn(
                        'group flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all duration-150',
                        isEditing
                            ? 'border-indigo-200 bg-indigo-50/40'
                            : 'border-stone-100 bg-white hover:border-stone-200 hover:shadow-sm'
                    )}>
                        {/* Grip */}
                        <GripVertical size={13} className="text-stone-200 cursor-grab shrink-0" />

                        {/* Expand toggle */}
                        <button
                            type="button"
                            onClick={() => toggleExpand(currentPath)}
                            className={cn(
                                'h-5 w-5 rounded flex items-center justify-center text-stone-400 hover:bg-stone-100 transition-colors shrink-0',
                                !hasChildren && 'invisible'
                            )}
                        >
                            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>

                        {/* Folder icon */}
                        <div className={cn(
                            'h-7 w-7 rounded-lg flex items-center justify-center shrink-0',
                            depth === 0 ? 'bg-indigo-50 text-indigo-500' : 'bg-stone-100 text-stone-500'
                        )}>
                            {isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />}
                        </div>

                        {/* Label + meta */}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-stone-800 tracking-tight truncate">{node.label}</p>
                            {(node.category || node.brand) && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {node.category && <Pill color="indigo">{node.category}</Pill>}
                                    {node.brand && <Pill color="stone">{node.brand}</Pill>}
                                </div>
                            )}
                        </div>

                        {/* Actions — revealed on hover */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-150 shrink-0">
                            <ActionBtn onClick={() => handleAddSubcategory(currentPath)}>
                                <Plus size={12} />
                            </ActionBtn>
                            <ActionBtn onClick={() => handleEditNode(node, currentPath)}>
                                <Edit size={12} />
                            </ActionBtn>
                            <ActionBtn danger onClick={() => deleteNode(currentPath, node.label)}>
                                <Trash size={12} />
                            </ActionBtn>
                        </div>
                    </div>

                    {/* Inline edit form */}
                    {isEditing && (
                        <div className="mt-2 mb-2 ml-10">
                            <NodeForm
                                title="Edit Category"
                                nodeForm={nodeForm}
                                setNodeForm={setNodeForm}
                                onSave={saveNode}
                                onCancel={() => setEditingNodePath(null)}
                            />
                        </div>
                    )}

                    {/* Inline add-sub form */}
                    {isAddingSub && (
                        <div className="mt-2 mb-2 ml-10">
                            <NodeForm
                                title="Add Subcategory"
                                nodeForm={nodeForm}
                                setNodeForm={setNodeForm}
                                onSave={saveNode}
                                onCancel={() => setEditingNodePath(null)}
                            />
                        </div>
                    )}

                    {/* Children */}
                    {hasChildren && isExpanded && (
                        <div className="mt-1.5 mb-1.5 ml-9 pl-4 border-l-2 border-stone-100 space-y-1.5">
                            {renderTree(node.children, `${currentPath}-`, depth + 1)}
                        </div>
                    )}
                </div>
            );
        });

    return (
        <div className="space-y-4">

            {/* ── PAGE HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-sm font-bold text-stone-800 tracking-tight">Categories & Filters</h2>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                        Navigation hierarchy and per-category filter configuration
                    </p>
                </div>

                {/* Mode toggle — styled like the stats tabs in OrderManager */}
                <div className="flex items-center gap-px bg-stone-100 p-1 rounded-xl border border-stone-200 w-fit">
                    {(['hierarchy', 'filters'] as const).map(mode => (
                        <button
                            key={mode}
                            type="button"
                            onClick={() => setConfigMode(mode)}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-150',
                                configMode === mode
                                    ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                                    : 'text-stone-400 hover:text-stone-700'
                            )}
                        >
                            {mode === 'hierarchy' ? <Layers size={11} /> : <ListFilter size={11} />}
                            {mode === 'hierarchy' ? 'Hierarchy' : 'Filters'}
                        </button>
                    ))}
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
                                onClick={() => { setIsAddingRoot(true); setNodeForm({}); setEditingNodePath(null); }}
                                className="flex items-center gap-1.5 h-7 px-3 text-[10px] font-bold uppercase tracking-widest bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                                <Plus size={11} /> Add Root
                            </button>
                        }
                    >
                        Category Hierarchy
                    </PanelHeader>

                    <div className="px-5 py-4 space-y-1.5">

                        {/* Add-root inline form */}
                        {isAddingRoot && (
                            <div className="mb-4">
                                <NodeForm
                                    title="Add Root Category"
                                    nodeForm={nodeForm}
                                    setNodeForm={setNodeForm}
                                    onSave={saveNode}
                                    onCancel={() => setIsAddingRoot(false)}
                                />
                            </div>
                        )}

                        {categories.length === 0 ? (
                            <div className="py-16 flex flex-col items-center gap-3">
                                <Folder size={28} className="text-stone-200" />
                                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                                    No categories configured
                                </p>
                                <button
                                    type="button"
                                    onClick={() => { setIsAddingRoot(true); setNodeForm({}); }}
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
                                onClick={() => { setShowFilterModal(true); setEditingFilterIdx(null); setFilterForm({ key: '', label: '', type: 'checkbox', options: [] }); }}
                                className="flex items-center gap-1.5 h-7 px-3 text-[10px] font-bold uppercase tracking-widest bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
                            >
                                <Plus size={11} /> Add Filter
                            </button>
                        }
                    >
                        Filter Configuration
                    </PanelHeader>

                    <div className="px-5 py-4 space-y-4">

                        {/* Category selector bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl">
                            <SectionLabel icon={<Layers size={11} />}>Category</SectionLabel>
                            <div className="flex-1 max-w-xs">
                                <Select
                                    value={selectedCatForFilters}
                                    onValueChange={val => setSelectedCatForFilters(val as Category)}
                                >
                                    <SelectTrigger className="h-8 text-xs border-stone-200 bg-white rounded-lg">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(Category).map(c => (
                                            <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <span className="text-[10px] font-bold font-mono text-stone-400 bg-white border border-stone-200 px-2 py-0.5 rounded-md ml-auto">
                                {activeFilters.length} filter{activeFilters.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {/* Filter cards */}
                        {activeFilters.length === 0 ? (
                            <div className="py-16 flex flex-col items-center gap-3">
                                <ListFilter size={28} className="text-stone-200" />
                                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                                    No filters defined
                                </p>
                                <button
                                    type="button"
                                    onClick={() => { setShowFilterModal(true); setFilterForm({ key: '', label: '', type: 'checkbox', options: [] }); }}
                                    className="text-[10px] font-bold text-teal-600 uppercase tracking-widest hover:underline"
                                >
                                    Add first filter →
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {activeFilters.map((filter, idx) => (
                                    <div
                                        key={idx}
                                        className="group flex items-start justify-between gap-3 px-4 py-3.5 rounded-xl border border-stone-100 bg-white hover:border-stone-200 hover:shadow-sm transition-all duration-150"
                                    >
                                        <div className="min-w-0 space-y-2">
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
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-150 shrink-0 pt-0.5">
                                            <ActionBtn onClick={() => { setEditingFilterIdx(idx); setFilterForm(filter); setShowFilterModal(true); }}>
                                                <Edit size={12} />
                                            </ActionBtn>
                                            <ActionBtn danger onClick={() => handleDeleteFilter(idx)}>
                                                <Trash size={12} />
                                            </ActionBtn>
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
            <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
                <DialogContent className="sm:max-w-lg bg-white border-stone-200 rounded-2xl shadow-xl">
                    {/* Custom stripe header */}
                    <div className="h-0.5 w-full bg-gradient-to-r from-teal-400 via-emerald-400 to-emerald-300 -mt-6 mb-5 rounded-t-2xl" />
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
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Filter Key', field: 'key', placeholder: 'e.g. specs.brand', mono: true },
                                { label: 'Display Label', field: 'label', placeholder: 'e.g. Manufacturer', mono: false },
                            ].map(({ label, field, placeholder, mono }) => (
                                <div key={field} className="space-y-1">
                                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em]">{label}</span>
                                    <Input
                                        placeholder={placeholder}
                                        value={(filterForm as any)[field] ?? ''}
                                        onChange={e => setFilterForm({ ...filterForm, [field]: e.target.value })}
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
                                onValueChange={val => setFilterForm({ ...filterForm, type: val as 'checkbox' | 'range' })}
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
                                value={filterForm.options?.join(', ') || ''}
                                onChange={e =>
                                    setFilterForm({
                                        ...filterForm,
                                        options: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                                    })
                                }
                                className="min-h-[80px] text-xs font-medium border-stone-200 bg-stone-50 rounded-lg resize-none focus:bg-white focus:border-teal-300 focus:ring-teal-500/20 placeholder:text-stone-400"
                            />
                            <p className="text-[10px] text-stone-400">Separate values with commas.</p>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowFilterModal(false)}
                            className="h-8 px-4 text-[10px] font-bold uppercase tracking-widest border border-stone-200 text-stone-500 rounded-lg hover:bg-stone-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveFilter}
                            className="h-8 px-4 text-[10px] font-bold uppercase tracking-widest bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
                        >
                            Save Filter
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ══════════════════════════════════════ */}
            {/*  DELETE CONFIRM MODAL                  */}
            {/* ══════════════════════════════════════ */}
            <Dialog open={deleteConfirm !== null} onOpenChange={open => { if (!open) setDeleteConfirm(null); }}>
                <DialogContent className="sm:max-w-md bg-white border-stone-200 rounded-2xl shadow-xl">
                    <div className="h-0.5 w-full bg-gradient-to-r from-rose-400 via-rose-400 to-rose-300 -mt-6 mb-5 rounded-t-2xl" />
                    <DialogHeader className="pb-2">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-7 w-7 rounded-lg bg-rose-50 flex items-center justify-center">
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
                    <DialogFooter className="gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setDeleteConfirm(null)}
                            className="h-8 px-4 text-[10px] font-bold uppercase tracking-widest border border-stone-200 text-stone-500 rounded-lg hover:bg-stone-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmDelete}
                            className="h-8 px-4 text-[10px] font-bold uppercase tracking-widest bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shadow-sm flex items-center gap-1.5"
                        >
                            <Trash size={11} /> Delete
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CategoryManager;