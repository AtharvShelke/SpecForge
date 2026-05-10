'use client';

import { ChevronDown, ChevronRight, Edit, FolderTree, Plus, Trash2 } from 'lucide-react';
import { CategoryNode } from '@/types';
import { cn } from '@/lib/utils';

interface NavigationTreeProps {
  nodes: CategoryNode[];
  expanded: Record<string, boolean>;
  onToggle: (path: string) => void;
  onEdit: (path: string, node: CategoryNode) => void;
  onAddChild: (path: string) => void;
  onDelete: (path: string, node: CategoryNode) => void;
}

function getCategoryCode(node: CategoryNode) {
  if (!node.category) return '';
  return typeof node.category === 'string' ? node.category : node.category.code;
}

function NodeRow({
  node,
  path,
  depth,
  expanded,
  onToggle,
  onEdit,
  onAddChild,
  onDelete,
}: {
  node: CategoryNode;
  path: string;
  depth: number;
  expanded: Record<string, boolean>;
  onToggle: (path: string) => void;
  onEdit: (path: string, node: CategoryNode) => void;
  onAddChild: (path: string) => void;
  onDelete: (path: string, node: CategoryNode) => void;
}) {
  const children = node.children ?? [];
  const hasChildren = children.length > 0;
  const isOpen = expanded[path] ?? true;
  const categoryCode = getCategoryCode(node);

  return (
    <div className="space-y-2">
      <div
        className="group rounded-2xl border border-stone-200 bg-white px-3 py-2 shadow-sm"
        style={{ marginLeft: `${depth * 16}px` }}
      >
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={() => hasChildren && onToggle(path)}
            className={cn(
              'mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100',
              !hasChildren && 'opacity-30'
            )}
          >
            {hasChildren ? (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <FolderTree size={14} />}
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-stone-900">{node.label}</span>
              {categoryCode && (
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-indigo-700">
                  {categoryCode}
                </span>
              )}
              {node.brand && (
                <span className="rounded-full border border-stone-200 bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-stone-600">
                  {node.brand}
                </span>
              )}
            </div>
            {(node.query || node.children?.length) && (
              <p className="mt-1 text-xs text-stone-500">
                {node.query ? `Query: ${node.query}` : `Children: ${node.children?.length ?? 0}`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
            <button type="button" onClick={() => onAddChild(path)} className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700">
              <Plus size={14} />
            </button>
            <button type="button" onClick={() => onEdit(path, node)} className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700">
              <Edit size={14} />
            </button>
            <button type="button" onClick={() => onDelete(path, node)} className="rounded-lg p-2 text-stone-400 hover:bg-rose-50 hover:text-rose-600">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {hasChildren && isOpen && (
        <div className="space-y-2">
          {children.map((child, index) => (
            <NodeRow
              key={`${path}.${index}`}
              node={child}
              path={`${path}.${index}`}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              onEdit={onEdit}
              onAddChild={onAddChild}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function NavigationTree({ nodes, expanded, onToggle, onEdit, onAddChild, onDelete }: NavigationTreeProps) {
  if (!nodes.length) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-10 text-center text-sm text-stone-500">
        No navigation nodes yet. Start with a root node like `PC Components`.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {nodes.map((node, index) => (
        <NodeRow
          key={node.id ?? `root-${index}`}
          node={node}
          path={String(index)}
          depth={0}
          expanded={expanded}
          onToggle={onToggle}
          onEdit={onEdit}
          onAddChild={onAddChild}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
