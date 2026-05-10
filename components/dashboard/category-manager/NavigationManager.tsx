'use client';

import { useEffect, useMemo, useState } from 'react';
import { HelpCircle, Layers, Plus, Save } from 'lucide-react';
import { Category, CategoryNode } from '@/types';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NavigationTree } from './NavigationTree';

interface NavigationManagerProps {
  categories: Category[];
  tree: CategoryNode[];
  isSaving: boolean;
  onSave: (nextTree: CategoryNode[]) => Promise<void>;
  onOpenHelp: () => void;
}

function getCategoryCode(node?: CategoryNode | null) {
  if (!node?.category) return 'none';
  return typeof node.category === 'string' ? node.category : node.category.code;
}

function setNodeAtPath(nodes: CategoryNode[], path: string, updater: (node: CategoryNode) => CategoryNode): CategoryNode[] {
  const parts = path.split('.').map(Number);
  const walk = (items: CategoryNode[], depth: number): CategoryNode[] =>
    items.map((node, index) => {
      if (index !== parts[depth]) return node;
      if (depth === parts.length - 1) return updater(node);
      return { ...node, children: walk(node.children ?? [], depth + 1) };
    });

  return walk(nodes, 0);
}

function deleteNodeAtPath(nodes: CategoryNode[], path: string): CategoryNode[] {
  const parts = path.split('.').map(Number);
  const walk = (items: CategoryNode[], depth: number): CategoryNode[] =>
    items.flatMap((node, index) => {
      if (index !== parts[depth]) return [node];
      if (depth === parts.length - 1) return [];
      return [{ ...node, children: walk(node.children ?? [], depth + 1) }];
    });

  return walk(nodes, 0);
}

type NavigationForm = {
  label: string;
  categoryCode: string;
  brand: string;
  query: string;
};

const EMPTY_FORM: NavigationForm = {
  label: '',
  categoryCode: 'none',
  brand: '',
  query: '',
};

export function NavigationManager({ categories, tree, isSaving, onSave, onOpenHelp }: NavigationManagerProps) {
  const [draftTree, setDraftTree] = useState<CategoryNode[]>(tree);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [form, setForm] = useState<NavigationForm>(EMPTY_FORM);

  useEffect(() => {
    setDraftTree(tree);
  }, [tree]);

  const categoryLookup = useMemo(
    () => new Map(categories.map((category) => [category.code, category])),
    [categories]
  );

  const openNewRoot = () => {
    setEditingPath(null);
    setParentPath(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (path: string, node: CategoryNode) => {
    setEditingPath(path);
    setParentPath(null);
    setForm({
      label: node.label,
      categoryCode: getCategoryCode(node),
      brand: node.brand ?? '',
      query: node.query ?? '',
    });
    setDialogOpen(true);
  };

  const openAddChild = (path: string) => {
    setEditingPath(null);
    setParentPath(path);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const handleDelete = (path: string, node: CategoryNode) => {
    if (!window.confirm(`Delete "${node.label}" and its child nodes?`)) return;
    setDraftTree((prev) => deleteNodeAtPath(prev, path));
  };

  const handleSubmit = () => {
    const nextNode: CategoryNode = {
      label: form.label.trim(),
      category: form.categoryCode === 'none' ? undefined : categoryLookup.get(form.categoryCode),
      brand: form.brand.trim() || undefined,
      query: form.query.trim() || undefined,
      children: editingPath
        ? undefined
        : [],
    };

    if (!nextNode.label) return;

    if (editingPath) {
      setDraftTree((prev) =>
        setNodeAtPath(prev, editingPath, (current) => ({
          ...current,
          label: nextNode.label,
          category: nextNode.category,
          brand: nextNode.brand,
          query: nextNode.query,
        }))
      );
    } else if (parentPath) {
      setDraftTree((prev) =>
        setNodeAtPath(prev, parentPath, (current) => ({
          ...current,
          children: [...(current.children ?? []), nextNode],
        }))
      );
      setExpanded((prev) => ({ ...prev, [parentPath]: true }));
    } else {
      setDraftTree((prev) => [...prev, nextNode]);
    }

    setDialogOpen(false);
    setForm(EMPTY_FORM);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-stone-900">Navigation</h2>
              <button type="button" onClick={onOpenHelp} className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700">
                <HelpCircle size={14} />
              </button>
            </div>
            <p className="text-sm text-stone-500">
              Manage browse structure with category codes, optional brand constraints, and query shortcuts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openNewRoot}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-stone-200 px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
            >
              <Plus size={14} />
              Add Root Node
            </button>
            <button
              type="button"
              onClick={() => onSave(draftTree)}
              disabled={isSaving}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:opacity-60"
            >
              <Save size={14} />
              {isSaving ? 'Saving…' : 'Save Navigation'}
            </button>
          </div>
        </div>
      </div>

      <NavigationTree
        nodes={draftTree}
        expanded={expanded}
        onToggle={(path) => setExpanded((prev) => ({ ...prev, [path]: !(prev[path] ?? true) }))}
        onEdit={openEdit}
        onAddChild={openAddChild}
        onDelete={handleDelete}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl border-stone-200 bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-stone-900">
              {editingPath ? 'Edit Navigation Node' : parentPath ? 'Add Child Node' : 'Add Root Node'}
            </DialogTitle>
            <DialogDescription className="text-sm text-stone-500">
              Navigation nodes are customer-facing browse entries. Keep labels clear and map category by code.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-widest text-stone-500">Label</label>
              <Input value={form.label} onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))} placeholder="Processors" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-widest text-stone-500">Category Code</label>
              <Select value={form.categoryCode} onValueChange={(value) => setForm((prev) => ({ ...prev, categoryCode: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category mapping</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.code} value={category.code}>
                      {category.code} · {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-widest text-stone-500">Brand Constraint</label>
                <Input value={form.brand} onChange={(event) => setForm((prev) => ({ ...prev, brand: event.target.value }))} placeholder="AMD" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-widest text-stone-500">Query Constraint</label>
                <Input value={form.query} onChange={(event) => setForm((prev) => ({ ...prev, query: event.target.value }))} placeholder="gaming" />
              </div>
            </div>
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
              <div className="mb-1 flex items-center gap-1.5 font-semibold">
                <Layers size={12} />
                Navigation vs Attributes
              </div>
              <p>
                Use Navigation for browse structure only. Product metadata like socket, wattage, or filterability belongs in Attributes.
              </p>
            </div>
          </div>

          <DialogFooter>
            <button type="button" onClick={() => setDialogOpen(false)} className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 transition hover:bg-stone-50">
              Cancel
            </button>
            <button type="button" onClick={handleSubmit} className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-700">
              Save Node
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
