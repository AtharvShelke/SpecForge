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
    X
} from 'lucide-react';

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

        const newTree = JSON.parse(JSON.stringify(categories)); // Deep clone

        if (isAddingRoot) {
            newTree.push(nodeForm);
        } else if (editingNodePath!.endsWith('-new')) {
            // Add child
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
            // Edit existing
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

    // --- FILTER CONFIG HELPERS ---
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

    // --- RENDERERS ---
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
                        className={`group flex items-center gap-3 p-3 mb-2 rounded-xl border transition-all 
                ${isEditing
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-transparent hover:border-blue-200 hover:bg-white hover:shadow-sm'
                            }
             `}
                    >
                        <div className="text-gray-300 cursor-grab flex-shrink-0">
                            <GripVertical size={16} />
                        </div>
                        <button
                            onClick={() => toggleExpand(currentPath)}
                            className={`p-1 rounded text-gray-500 hover:bg-blue-50 ${!hasChildren ? 'invisible' : ''
                                }`}
                        >
                            {isExpanded ? (
                                <ChevronDown size={16} />
                            ) : (
                                <ChevronRight size={16} />
                            )}
                        </button>
                        <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
                            <Folder size={20} />
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900">{node.label}</h4>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {node.category && (
                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 rounded font-medium">
                                        {node.category}
                                    </span>
                                )}
                                {node.brand && (
                                    <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 rounded font-medium">
                                        {node.brand}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleAddSubcategory(currentPath)}
                                className="p-2 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                                title="Add subcategory"
                            >
                                <Plus size={16} />
                            </button>
                            <button
                                onClick={() => handleEditNode(node, currentPath)}
                                className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                                title="Edit"
                            >
                                <Edit size={16} />
                            </button>
                            <button
                                onClick={() => deleteNode(currentPath)}
                                className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                title="Delete"
                            >
                                <Trash size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Inline Editor for Hierarchy */}
                    {(isEditing || editingNodePath === `${currentPath}-new`) && (
                        <div className="ml-12 mb-4 p-4 bg-white border border-blue-200 rounded-lg shadow-sm">
                            <h4 className="text-xs font-semibold text-gray-700 uppercase mb-3">
                                {editingNodePath?.endsWith('-new')
                                    ? 'New Subcategory'
                                    : 'Edit Category'}
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder="Label"
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={nodeForm.label}
                                    onChange={(e) =>
                                        setNodeForm({ ...nodeForm, label: e.target.value })
                                    }
                                />
                                <select
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={nodeForm.category}
                                    onChange={(e) =>
                                        setNodeForm({
                                            ...nodeForm,
                                            category: e.target.value as Category,
                                        })
                                    }
                                >
                                    <option value="">No Mapping</option>
                                    {Object.values(Category).map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    placeholder="Brand Filter"
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={nodeForm.brand}
                                    onChange={(e) =>
                                        setNodeForm({ ...nodeForm, brand: e.target.value })
                                    }
                                />
                                <input
                                    type="text"
                                    placeholder="Search Query"
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={nodeForm.query}
                                    onChange={(e) =>
                                        setNodeForm({ ...nodeForm, query: e.target.value })
                                    }
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-3">
                                <button
                                    onClick={() => setEditingNodePath(null)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveNode}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    )}

                    {hasChildren && isExpanded && (
                        <div className="pl-8 ml-4 border-l-2 border-dashed border-gray-200">
                            {renderTree(node.children, `${currentPath}-`, depth + 1)}
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="space-y-6">
            {/* Header & Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Category & Filter Manager
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Configure hierarchy and dynamic filters
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setConfigMode('hierarchy')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${configMode === 'hierarchy'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <Layers size={16} /> Hierarchy
                    </button>
                    <button
                        onClick={() => setConfigMode('filters')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${configMode === 'filters'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <ListFilter size={16} /> Filters
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="p-6">
                    {configMode === 'hierarchy' ? (
                        <div>
                            <div className="mb-6 flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Root Categories
                                </h3>
                                <button
                                    onClick={() => {
                                        setIsAddingRoot(true);
                                        setNodeForm({});
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                                >
                                    <Plus size={16} /> Add Root
                                </button>
                            </div>

                            {isAddingRoot && (
                                <div className="mb-6 p-4 bg-white border border-blue-200 rounded-lg shadow-sm">
                                    <h4 className="text-xs font-semibold text-gray-700 uppercase mb-3">
                                        New Root Category
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            placeholder="Label"
                                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={nodeForm.label}
                                            onChange={(e) =>
                                                setNodeForm({ ...nodeForm, label: e.target.value })
                                            }
                                        />
                                        <select
                                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={nodeForm.category}
                                            onChange={(e) =>
                                                setNodeForm({
                                                    ...nodeForm,
                                                    category: e.target.value as Category,
                                                })
                                            }
                                        >
                                            <option value="">No Mapping</option>
                                            {Object.values(Category).map((c) => (
                                                <option key={c} value={c}>
                                                    {c}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex justify-end gap-2 mt-3">
                                        <button
                                            onClick={() => setIsAddingRoot(false)}
                                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={saveNode}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                {categories.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Folder size={48} className="mx-auto text-gray-300 mb-3" />
                                        <p className="text-gray-500">No categories yet</p>
                                        <button
                                            onClick={() => {
                                                setIsAddingRoot(true);
                                                setNodeForm({});
                                            }}
                                            className="mt-3 text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Create your first category
                                        </button>
                                    </div>
                                ) : (
                                    renderTree(categories)
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Filter Configuration Panel */
                        <div>
                            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Category
                                    </label>
                                    <select
                                        className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={selectedCatForFilters}
                                        onChange={(e) =>
                                            setSelectedCatForFilters(e.target.value as Category)
                                        }
                                    >
                                        {Object.values(Category).map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowFilterModal(true);
                                        setEditingFilterIdx(null);
                                        setFilterForm({
                                            key: '',
                                            label: '',
                                            type: 'checkbox',
                                            options: [],
                                        });
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    <Plus size={16} /> Add Filter
                                </button>
                            </div>

                            {activeFilters.length === 0 ? (
                                <div className="text-center py-12">
                                    <ListFilter size={48} className="mx-auto text-gray-300 mb-3" />
                                    <p className="text-gray-500">No filters configured</p>
                                    <button
                                        onClick={() => setShowFilterModal(true)}
                                        className="mt-3 text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        Add your first filter
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {activeFilters.map((filter, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors group"
                                        >
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900">
                                                    {filter.label}
                                                </h4>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Key: <code className="bg-white px-1.5 py-0.5 rounded text-xs">{filter.key}</code> • Type: {filter.type}
                                                    {filter.options && filter.options.length > 0 && (
                                                        <> • {filter.options.length} options</>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setEditingFilterIdx(idx);
                                                        setFilterForm(filter);
                                                        setShowFilterModal(true);
                                                    }}
                                                    className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                                                    title="Edit filter"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteFilter(idx)}
                                                    className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                                    title="Delete filter"
                                                >
                                                    <Trash size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Filter Modal */}
            {showFilterModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editingFilterIdx !== null ? 'Edit Filter' : 'Add Filter'}
                            </h3>
                            <button
                                onClick={() => setShowFilterModal(false)}
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Filter Key <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., specs.brand"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={filterForm.key}
                                        onChange={(e) =>
                                            setFilterForm({ ...filterForm, key: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Filter Label <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Brand"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={filterForm.label}
                                        onChange={(e) =>
                                            setFilterForm({ ...filterForm, label: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Filter Type
                                </label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={filterForm.type}
                                    onChange={(e) =>
                                        setFilterForm({
                                            ...filterForm,
                                            type: e.target.value as 'checkbox' | 'range',
                                        })
                                    }
                                >
                                    <option value="checkbox">Checkbox</option>
                                    <option value="range">Range</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Options (comma-separated)
                                </label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={3}
                                    placeholder="AMD, Intel, NVIDIA"
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
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                            <button
                                onClick={() => setShowFilterModal(false)}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveFilter}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                {editingFilterIdx !== null ? 'Update Filter' : 'Add Filter'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryManager;