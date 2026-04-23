'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronRight, Loader2, AlertCircle, FolderTree } from 'lucide-react';
import { CategoryHierarchy } from '@/types';
import { getCategoryHierarchy } from '@/services/categoryService';

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_DEPTH = 5;

// ─── Types ───────────────────────────────────────────────────────────────────

interface CategoryTreeProps {
  /** Called when a navigable node is clicked (has query, brand, or categoryId). */
  onSelect: (node: CategoryHierarchy) => void;
  /** Currently selected node id for highlight. */
  selectedNodeId?: string | null;
}

// ─── TreeNode (recursive) ────────────────────────────────────────────────────

const TreeNode: React.FC<{
  node: CategoryHierarchy;
  depth: number;
  onSelect: (node: CategoryHierarchy) => void;
  selectedNodeId?: string | null;
}> = ({ node, depth, onSelect, selectedNodeId }) => {
  // Top-level nodes start expanded; deeper nodes start collapsed
  const [isExpanded, setIsExpanded] = useState(depth === 0);

  const hasChildren = !!(node.children && node.children.length > 0);
  const isNavigable = !!(node.categoryId || node.query || node.brand);
  const isSelected = selectedNodeId === node.id;

  // Sort children by sortOrder (safety net — API should pre-sort)
  const sortedChildren = useMemo(() => {
    if (!node.children || node.children.length === 0) return [];
    return [...node.children].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [node.children]);

  // Guard: don't render beyond MAX_DEPTH
  if (depth >= MAX_DEPTH) return null;

  // Don't render empty child groups
  if (hasChildren && sortedChildren.length === 0) return null;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsExpanded(prev => !prev);
    }
  };

  const handleSelect = () => {
    if (isNavigable) {
      onSelect(node);
    }
    // If it has children, also toggle on click
    if (hasChildren) {
      setIsExpanded(prev => !prev);
    }
  };

  // Indent: 12px per depth level
  const paddingLeft = depth * 12;

  return (
    <div>
      {/* Node row */}
      {isNavigable ? (
        <button
          onClick={handleSelect}
          className={`
            w-full flex items-center gap-1.5 text-left rounded-md px-2 py-1.5
            text-[13px] transition-all duration-150 group/node
            ${isSelected
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-foreground/75 hover:bg-accent hover:text-foreground font-medium'
            }
          `}
          style={{ paddingLeft: `${paddingLeft + 8}px` }}
          title={node.label}
        >
          {/* Expand/collapse chevron */}
          {hasChildren ? (
            <span
              onClick={handleToggle}
              className="flex-shrink-0 p-0.5 rounded hover:bg-accent/80 transition-colors"
            >
              <ChevronRight
                size={12}
                strokeWidth={2.5}
                className={`transition-transform duration-200 text-muted-foreground ${isExpanded ? 'rotate-90' : ''}`}
              />
            </span>
          ) : (
            <span className="w-[16px] flex-shrink-0" />
          )}
          <span className="truncate">{node.label}</span>
        </button>
      ) : (
        /* Non-clickable header (no categoryId, query, or brand) */
        <div
          onClick={hasChildren ? handleToggle : undefined}
          className={`
            flex items-center gap-1.5 px-2 py-1.5 rounded-md
            text-[11px] font-semibold text-muted-foreground uppercase tracking-widest
            ${hasChildren ? 'cursor-pointer hover:bg-accent/50' : ''}
            select-none transition-colors duration-150
          `}
          style={{ paddingLeft: `${paddingLeft + 8}px` }}
        >
          {hasChildren ? (
            <ChevronRight
              size={11}
              strokeWidth={2.5}
              className={`transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
            />
          ) : (
            <span className="w-[15px] flex-shrink-0" />
          )}
          <span className="truncate">{node.label}</span>
        </div>
      )}

      {/* Recursive children */}
      {hasChildren && isExpanded && (
        <div className="overflow-hidden">
          {sortedChildren.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
              selectedNodeId={selectedNodeId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── CategoryTree (main export) ──────────────────────────────────────────────

const CategoryTree: React.FC<CategoryTreeProps> = ({
  onSelect,
  selectedNodeId,
}) => {
  const [hierarchy, setHierarchy] = useState<CategoryHierarchy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHierarchy = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCategoryHierarchy();
      setHierarchy(data);
    } catch (err: any) {
      console.error('[CategoryTree] Failed to fetch hierarchy:', err);
      setError(err.message ?? 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHierarchy();
  }, [fetchHierarchy]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="py-6 flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-[11px] font-medium">Loading categories…</span>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="py-4 px-3 flex flex-col items-center gap-2 text-center">
        <AlertCircle size={18} className="text-destructive" />
        <p className="text-[11px] text-destructive/80 font-medium">{error}</p>
        <button
          onClick={fetchHierarchy}
          className="text-[11px] text-primary font-semibold hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (hierarchy.length === 0) {
    return (
      <div className="py-6 flex flex-col items-center gap-2 text-muted-foreground">
        <FolderTree size={18} strokeWidth={1.5} />
        <span className="text-[11px] font-medium">No categories found</span>
      </div>
    );
  }

  // ── Tree render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-0.5">
      {hierarchy.map(node => (
        <TreeNode
          key={node.id}
          node={node}
          depth={0}
          onSelect={onSelect}
          selectedNodeId={selectedNodeId}
        />
      ))}
    </div>
  );
};

export default CategoryTree;
