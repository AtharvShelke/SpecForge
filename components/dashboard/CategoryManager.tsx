'use client';

import React, { useMemo, useState } from 'react';
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
    Settings2,
    Save,
    ArrowLeft,
    Search,
    Filter,
    LayoutGrid,
    MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const CategoryManager = () => {
    const {
        categories,
    } = useShop();
    const {
        updateCategories,
        filterConfigs,
        updateFilterConfig,
    } = useAdmin();

    // --- HIERARCHY STATE ---
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [editingNodePath, setEditingNodePath] = useState<string | null>(null);
    const [nodeForm, setNodeForm] = useState<Partial<CategoryNode>>({
        label: '',
        category: undefined,
        brand: '',
        query: '',
    });
    const [isAddingRoot, setIsAddingRoot] = useState(false);

    // --- FILTER CONFIG STATE ---
    const [configMode, setConfigMode] = useState<'hierarchy' | 'filters'>('hierarchy');
    const [selectedCatForFilters, setSelectedCatForFilters] = useState<Category>(
        Category.PROCESSOR
    );
    const [editingFilterIdx, setEditingFilterIdx] = useState<number | null>(null);
    const [filterForm, setFilterForm] = useState<Partial<FilterDefinition>>({
        key: '',
        label: '',
        type: 'checkbox',
        options: [],
        dependency: undefined,
    });
    const [showFilterModal, setShowFilterModal] = useState(false);

    // --- HIERARCHY HELPERS ---
    const toggleExpand = (path: string) => {
        setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));
    };

    const handleEditNode = (node: CategoryNode, path: string) => {
        setEditingNodePath(path);
        setNodeForm({ ...node });
        setIsAddingRoot(false);
    };

    const handleAddSubcategory = (path: string) => {
        setEditingNodePath(path + '-new');
        setNodeForm({ label: 'New Subcategory' });
        setIsAddingRoot(false);
    };

    const saveNode = () => {
        if (!editingNodePath && !isAddingRoot) return;

        const newTree = JSON.parse(JSON.stringify(categories));

        if (isAddingRoot) {
            newTree.push(nodeForm);
        } else if (editingNodePath!.endsWith('-new')) {
            const parentPath = editingNodePath!
                .replace('-new', '')
                .split('-')
                .map(Number);
            let current = newTree[parentPath[0]];
            for (let i = 1; i < parentPath.length; i++) {
                current = current.children![parentPath[i]];
            }
            if (!current.children) current.children = [];
            current.children.push(nodeForm);
        } else {
            const path = editingNodePath!.split('-').map(Number);
            let current = newTree[path[0]];
            for (let i = 1; i < path.length; i++) {
                current = current.children![path[i]];
            }
            Object.assign(current, nodeForm);
        }

        updateCategories(newTree);
        setEditingNodePath(null);
        setIsAddingRoot(false);
        setNodeForm({ label: '', category: undefined, brand: '', query: '' });
    };

    const deleteNode = (pathStr: string) => {
        if (!window.confirm('Delete this category and all subcategories?')) return;

        const newTree = JSON.parse(JSON.stringify(categories));
        const path = pathStr.split('-').map(Number);

        if (path.length === 1) {
            newTree.splice(path[0], 1);
        } else {
            let parent = newTree[path[0]];
            for (let i = 1; i < path.length - 1; i++) {
                parent = parent.children![path[i]];
            }
            parent.children!.splice(path[path.length - 1], 1);
        }
        updateCategories(newTree);
    };

    const activeFilters = useMemo(() => {
        return (
            filterConfigs.find((c) => c.category === selectedCatForFilters)?.filters || []
        );
    }, [filterConfigs, selectedCatForFilters]);

    const handleSaveFilter = () => {
        if (!filterForm.key || !filterForm.label) return;

        const newFilters = [...activeFilters];
        const filterData = filterForm as FilterDefinition;

        if (editingFilterIdx !== null) {
            newFilters[editingFilterIdx] = filterData;
        } else {
            newFilters.push(filterData);
        }

        updateFilterConfig(selectedCatForFilters, newFilters);
        setShowFilterModal(false);
        setFilterForm({
            key: '',
            label: '',
            type: 'checkbox',
            options: [],
            dependency: undefined,
        });
        setEditingFilterIdx(null);
    };

    const handleDeleteFilter = (idx: number) => {
        if (!window.confirm('Delete this filter?')) return;
        const newFilters = [...activeFilters];
        newFilters.splice(idx, 1);
        updateFilterConfig(selectedCatForFilters, newFilters);
    };

    const renderTree = (
        nodes: any[],
        pathPrefix: string = '',
        depth: number = 0
    ) => {
        return nodes.map((node, index) => {
            const currentPath = `${pathPrefix}${index}`;
            const isExpanded = expanded[currentPath];
            const hasChildren = node.children && node.children.length > 0;
            const isEditing = editingNodePath === currentPath;

            return (
                <div key={currentPath} className="relative">
                    <div
                        className={cn(
                            "group flex items-center gap-3 p-3 mb-2 rounded-lg border transition-all",
                            isEditing
                                ? "border-zinc-900 bg-zinc-50"
                                : "border-zinc-100 hover:border-zinc-200 hover:bg-white hover:shadow-sm"
                        )}
                    >
                        <div className="text-zinc-300 cursor-grab flex-shrink-0">
                            <GripVertical size={14} />
                        </div>
                        <button
                            onClick={() => toggleExpand(currentPath)}
                            className={cn(
                                "p-1 rounded text-zinc-400 hover:bg-zinc-100 transition-colors",
                                !hasChildren && "invisible"
                            )}
                        >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        <div className="p-2 bg-zinc-100 rounded-md text-zinc-500">
                            <Folder size={18} />
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-zinc-900">{node.label}</h4>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {node.category && (
                                    <Badge variant="outline" className="text-[11px] font-medium bg-zinc-50 border-zinc-200 text-zinc-500 h-5 px-1.5 rounded">
                                        {node.category}
                                    </Badge>
                                )}
                                {node.brand && (
                                    <Badge variant="outline" className="text-[11px] font-medium bg-zinc-50 border-zinc-200 text-zinc-500 h-5 px-1.5 rounded">
                                        {node.brand}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleAddSubcategory(currentPath)}
                                className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                            >
                                <Plus size={14} />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditNode(node, currentPath)}
                                className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                            >
                                <Edit size={14} />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteNode(currentPath)}
                                className="h-8 w-8 p-0 text-zinc-400 hover:text-red-500 hover:bg-red-50"
                            >
                                <Trash size={14} />
                            </Button>
                        </div>
                    </div>

                    {(isEditing || editingNodePath === `${currentPath}-new`) && (
                        <div className="ml-12 mb-4 p-4 bg-white border border-zinc-200 rounded-lg shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
                            <h4 className="text-xs font-medium text-zinc-500 mb-3">
                                {editingNodePath?.endsWith('-new')
                                    ? 'Add Subcategory'
                                    : 'Edit Category'}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium text-zinc-700">Label</Label>
                                    <Input
                                        placeholder="Label"
                                        className="h-9 text-xs border-zinc-200"
                                        value={nodeForm.label}
                                        onChange={(e) => setNodeForm({ ...nodeForm, label: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Category Mapping</Label>
                                    <Select
                                        value={nodeForm.category ?? 'none'}
                                        onValueChange={(val) => setNodeForm({ ...nodeForm, category: val === 'none' ? undefined : val as Category })}
                                    >
                                        <SelectTrigger className="h-9 text-xs border-zinc-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none" className="text-xs italic text-zinc-400">No Mapping</SelectItem>
                                            {Object.values(Category).map((c) => (
                                                <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Brand Filter</Label>
                                    <Input
                                        placeholder="Brand Filter"
                                        className="h-9 text-xs border-zinc-200"
                                        value={nodeForm.brand ?? ''}
                                        onChange={(e) => setNodeForm({ ...nodeForm, brand: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Query Constraint</Label>
                                    <Input
                                        placeholder="Search Query"
                                        className="h-9 text-xs border-zinc-200"
                                        value={nodeForm.query ?? ''}
                                        onChange={(e) => setNodeForm({ ...nodeForm, query: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setEditingNodePath(null)}
                                    className="h-8 text-sm font-medium border-zinc-200 rounded-md"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={saveNode}
                                    className="h-8 text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-700 rounded-md"
                                >
                                    Save
                                </Button>
                            </div>
                        </div>
                    )}

                    {hasChildren && isExpanded && (
                        <div className="pl-6 ml-6 border-l border-zinc-200">
                            {renderTree(node.children, `${currentPath}-`, depth + 1)}
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="space-y-6">
            {/* Header & Control Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-zinc-900">Categories & Filters</h2>
                    <p className="text-sm text-zinc-500 mt-0.5">
                        Category hierarchy and filter configuration
                    </p>
                </div>
                <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-lg border border-zinc-200">
                    <Button
                        size="sm"
                        variant={configMode === 'hierarchy' ? 'default' : 'ghost'}
                        onClick={() => setConfigMode('hierarchy')}
                        className={cn(
                            "h-8 text-sm font-medium gap-2 rounded-md",
                            configMode === 'hierarchy' ? "bg-white text-zinc-900 shadow-sm border border-zinc-200 hover:bg-white" : "text-zinc-500 hover:text-zinc-900 hover:bg-transparent"
                        )}
                    >
                        <Layers size={14} /> Hierarchy
                    </Button>
                    <Button
                        size="sm"
                        variant={configMode === 'filters' ? 'default' : 'ghost'}
                        onClick={() => setConfigMode('filters')}
                        className={cn(
                            "h-8 text-sm font-medium gap-2 rounded-md",
                            configMode === 'filters' ? "bg-white text-zinc-900 shadow-sm border border-zinc-200 hover:bg-white" : "text-zinc-500 hover:text-zinc-900 hover:bg-transparent"
                        )}
                    >
                        <ListFilter size={14} /> Filters
                    </Button>
                </div>
            </div>

            <Card className="border shadow-sm overflow-hidden">
                <CardHeader className="px-6 py-5 border-b border-zinc-100 bg-zinc-50/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                                {configMode === 'hierarchy' ? <Layers size={16} className="text-zinc-500" /> : <ListFilter size={16} className="text-zinc-500" />}
                                {configMode === 'hierarchy' ? 'Category Hierarchy' : 'Filter Configuration'}
                            </CardTitle>
                            <CardDescription className="text-xs text-zinc-500 mt-1">
                                {configMode === 'hierarchy' ? 'Configure navigation tree and node relationships' : 'Define filter parameters per category'}
                            </CardDescription>
                        </div>
                        {configMode === 'hierarchy' ? (
                            <Button
                                size="sm"
                                onClick={() => { setIsAddingRoot(true); setNodeForm({}); }}
                                className="h-8 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 gap-2 rounded-md"
                            >
                                <Plus size={14} /> Add Root Category
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                onClick={() => {
                                    setShowFilterModal(true);
                                    setEditingFilterIdx(null);
                                    setFilterForm({ key: '', label: '', type: 'checkbox', options: [] });
                                }}
                                className="h-8 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 gap-2 rounded-md"
                            >
                                <Plus size={14} /> Add Filter
                            </Button>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    {configMode === 'hierarchy' ? (
                        <div className="animate-in fade-in duration-300">
                            {isAddingRoot && (
                                <div className="mb-6 p-4 bg-zinc-50 border border-zinc-200 rounded-lg shadow-sm">
                                    <h4 className="text-xs font-medium text-zinc-500 mb-3">Add Root Category</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Display Label</Label>
                                            <Input
                                                placeholder="Label"
                                                className="h-9 text-xs border-zinc-200 bg-white"
                                                value={nodeForm.label ?? ''}
                                                onChange={(e) => setNodeForm({ ...nodeForm, label: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Category Mapping</Label>
                                            <Select
                                                value={nodeForm.category ?? 'none'}
                                                onValueChange={(val) => setNodeForm({ ...nodeForm, category: val === 'none' ? undefined : val as Category })}
                                            >
                                                <SelectTrigger className="h-9 text-xs border-zinc-200 bg-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none" className="text-xs italic text-zinc-400">No Mapping</SelectItem>
                                                    {Object.values(Category).map((c) => (
                                                        <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 mt-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsAddingRoot(false)}
                                            className="h-8 text-[10px] font-bold uppercase tracking-wider border-zinc-200"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={saveNode}
                                            className="h-8 text-[10px] font-bold uppercase tracking-wider bg-zinc-900 text-white"
                                        >
                                            Save
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                {categories.length === 0 ? (
                                    <div className="text-center py-16">
                                        <Folder size={32} className="mx-auto text-zinc-200 mb-4" />
                                        <p className="text-sm text-zinc-400">No categories configured</p>
                                        <Button
                                            variant="link"
                                            onClick={() => { setIsAddingRoot(true); setNodeForm({}); }}
                                            className="text-indigo-600 font-medium text-sm mt-2"
                                        >
                                            Add first category
                                        </Button>
                                    </div>
                                ) : (
                                    renderTree(categories)
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in duration-300 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-zinc-50 border border-zinc-200 p-4 rounded-lg">
                                <div className="space-y-1.5 flex-1 max-w-sm">
                                    <Label className="text-sm font-medium text-zinc-700">Category</Label>
                                    <Select value={selectedCatForFilters} onValueChange={(val) => setSelectedCatForFilters(val as Category)}>
                                        <SelectTrigger className="h-9 text-sm border-zinc-200 bg-white rounded-md">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.values(Category).map((c) => (
                                                <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="text-xs text-zinc-500 pb-2">
                                    {activeFilters.length} active filters
                                </div>
                            </div>

                            <div className="space-y-3">
                                {activeFilters.length === 0 ? (
                                    <div className="text-center py-16 bg-zinc-50/50 rounded-lg border border-dashed border-zinc-200">
                                        <ListFilter size={28} className="mx-auto text-zinc-300 mb-3" />
                                        <p className="text-sm text-zinc-400">No filters defined for this category</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {activeFilters.map((filter, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between p-4 bg-white border border-zinc-200 rounded-lg hover:border-zinc-300 transition-colors duration-150 group"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-semibold text-zinc-900 truncate">{filter.label}</h4>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <Badge variant="outline" className="text-[9px] font-mono font-bold bg-zinc-50 border-zinc-200 text-zinc-500 h-4 px-1">
                                                            KEY: {filter.key}
                                                        </Badge>
                                                        <Badge className="text-[9px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border-emerald-100 h-4 px-1">
                                                            {filter.type}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => { setEditingFilterIdx(idx); setFilterForm(filter); setShowFilterModal(true); }}
                                                        className="h-8 w-8 p-0 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900"
                                                    >
                                                        <Edit size={14} />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDeleteFilter(idx)}
                                                        className="h-8 w-8 p-0 hover:bg-red-50 text-zinc-400 hover:text-red-500"
                                                    >
                                                        <Trash size={14} />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Filter Architect Modal */}
            <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
                <DialogContent className="sm:max-w-lg bg-white border-zinc-200">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-zinc-900">Filter Configuration</DialogTitle>
                        <DialogDescription className="text-sm text-zinc-500">
                            Configure filters for: <span className="font-medium text-zinc-700">{selectedCatForFilters}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-zinc-700">Filter Key</Label>
                                <Input
                                    placeholder="e.g. specs.brand"
                                    className="h-10 text-xs font-mono border-zinc-200"
                                    value={filterForm.key}
                                    onChange={(e) => setFilterForm({ ...filterForm, key: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-zinc-700">Display Label</Label>
                                <Input
                                    placeholder="e.g. Manufacturer"
                                    className="h-10 text-xs border-zinc-200"
                                    value={filterForm.label}
                                    onChange={(e) => setFilterForm({ ...filterForm, label: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-zinc-700">Filter Type</Label>
                            <Select
                                value={filterForm.type}
                                onValueChange={(val) => setFilterForm({ ...filterForm, type: val as 'checkbox' | 'range' })}
                            >
                                <SelectTrigger className="h-9 text-sm border-zinc-200 rounded-md">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="checkbox" className="text-sm">Checkbox</SelectItem>
                                    <SelectItem value="range" className="text-sm">Range (Price/Value)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-zinc-700">Options</Label>
                            <Textarea
                                className="min-h-[100px] text-xs font-medium border-zinc-200 resize-none"
                                placeholder="AMD, Intel, NVIDIA (Comma-separated)..."
                                value={filterForm.options?.join(', ') || ''}
                                onChange={(e) =>
                                    setFilterForm({
                                        ...filterForm,
                                        options: e.target.value
                                            .split(',')
                                            .map((s) => s.trim())
                                            .filter(Boolean),
                                    })
                                }
                            />
                            <p className="text-xs text-zinc-400">Separate values with commas.</p>
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowFilterModal(false)} className="h-9 text-sm font-medium border-zinc-200 rounded-md">
                            Cancel
                        </Button>
                        <Button onClick={handleSaveFilter} className="h-9 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-md">
                            Save Filter
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CategoryManager;