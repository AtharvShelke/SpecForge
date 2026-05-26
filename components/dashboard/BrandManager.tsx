"use client";

<<<<<<< HEAD
import { useState, useCallback, useMemo, memo } from "react";

import { useAdmin } from "@/context/AdminContext";
=======
import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { Category, Brand, CreateBrandRequest } from '@/types';
import { useToast } from '@/hooks/use-toast';
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
import {
  Trash,
  Plus,
  Tag,
  Search,
  Hash,
  CheckCircle2,
  Layers,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Brand, Category } from "@/types";
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
    onClick,
    collapsible,
    open,
  }: {
    icon: React.ReactNode;
    children: React.ReactNode;
    right?: React.ReactNode;
    onClick?: () => void;
    collapsible?: boolean;
    open?: boolean;
  }) => (
    <div
      className={cn(
        "flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-5",
        collapsible && "cursor-pointer transition-colors hover:bg-slate-50",
      )}
      onClick={onClick}
    >
      <SectionLabel icon={icon}>{children}</SectionLabel>
      <div className="flex items-center gap-3">
        {right}
        {collapsible && (
          <ChevronDown
            size={16}
            className={cn(
              "text-slate-400 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        )}
      </div>
    </div>
  ),
);
PanelHeader.displayName = "PanelHeader";

// ─────────────────────────────────────────────────────────────
// CATEGORY PILL
// ─────────────────────────────────────────────────────────────
const CategoryPill = memo(({ label }: { label: string }) => (
  <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 whitespace-nowrap">
    {label}
  </span>
));
CategoryPill.displayName = "CategoryPill";

// ─────────────────────────────────────────────────────────────
// BRAND CARD
// ─────────────────────────────────────────────────────────────
<<<<<<< HEAD
const BrandCard = memo(
  ({
    brand,
    onDelete,
  }: {
    brand: Brand;
=======
const BrandCard = memo(({ brand, onDelete }: {
    brand: { id: string; name: string; categories?: Category[] };
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
    onDelete: (id: string, name: string) => void;
  }) => {
    const handleDelete = useCallback(
      () => onDelete(brand.id, brand.name),
      [onDelete, brand.id, brand.name],
    );
    const shortId = brand.id.substring(0, 8).toUpperCase();
    const brandCategories = brand.categories ?? [];

    return (
<<<<<<< HEAD
      <Panel className="group transition-colors hover:border-slate-300">
        <div className="p-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-1.5">
                <Hash size={12} className="text-slate-400" />
                <span className="font-mono text-xs font-medium text-slate-500">
                  {shortId}
                </span>
              </div>
              <p className="truncate text-base font-semibold text-slate-900">
                {brand.name}
              </p>
            </div>
            <button
              onClick={handleDelete}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-transparent text-slate-400 opacity-100 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <Trash size={14} />
            </button>
          </div>

          <div className="h-px bg-slate-100" />

          <div>
            <p className="mb-2 text-xs font-medium text-slate-500">Associated Categories</p>
            {brandCategories.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {brandCategories.map((cat) => (
                  <CategoryPill key={cat} label={cat} />
                ))}
              </div>
            ) : (
              <div className="flex w-fit items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-amber-700">
                <AlertCircle size={14} />
                <span className="text-xs font-medium">No categories</span>
              </div>
            )}
          </div>
        </div>
      </Panel>
=======
        <Panel stripe="stone" className="group">
            <div className="px-3 py-3 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <div className="flex items-center gap-1 mb-0.5">
                            <Hash size={9} className="text-stone-300" />
                            <span className="text-[10px] font-mono font-bold text-stone-400">
                                {shortId}
                            </span>
                        </div>
                        <p className="text-sm font-bold text-stone-800 tracking-tight truncate">
                            {brand.name}
                        </p>
                    </div>
                    <button
                        onClick={handleDelete}
                        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-150 h-7 w-7 rounded-md flex items-center justify-center text-stone-300 hover:text-rose-500 hover:bg-rose-50 active:bg-rose-100 flex-shrink-0"
                    >
                        <Trash size={13} />
                    </button>
                </div>

                <div className="h-px bg-stone-100" />

                {(brand.categories?.length ?? 0) > 0 ? (
                    <div className="flex flex-wrap gap-1">
                        {brand.categories?.map(cat => (
                            <CategoryPill key={cat?.id} label={cat?.name} />
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 px-2 py-1.5 bg-amber-50 border border-amber-100 rounded-lg w-fit">
                        <AlertCircle size={11} className="text-amber-500 shrink-0" />
                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">
                            No categories
                        </span>
                    </div>
                )}
            </div>
        </Panel>
    );
});
BrandCard.displayName = 'BrandCard';

// Removed static ALL_CATEGORIES as Category is now a dynamic DB model

// ─────────────────────────────────────────────────────────────
// CATEGORY CHIP — memoized toggle chip for the mobile selector
// ─────────────────────────────────────────────────────────────
const CategoryChip = memo(({ cat, active, onToggle }: {
    cat: Category;
    active: boolean;
    onToggle: (cat: Category) => void;
}) => {
    const handleClick = useCallback(() => onToggle(cat), [onToggle, cat]);
    return (
        <button
            type="button"
            onClick={handleClick}
            className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors duration-150 ring-1',
                active
                    ? 'bg-indigo-600 text-white ring-indigo-600'
                    : 'bg-white text-stone-500 ring-stone-200 hover:ring-stone-300'
            )}
        >
            {active && <CheckCircle2 size={9} />}
            {cat?.name}
        </button>
    );
});
CategoryChip.displayName = 'CategoryChip';

// ─────────────────────────────────────────────────────────────
// DESKTOP CATEGORY ROW — memoized list item
// ─────────────────────────────────────────────────────────────
const DesktopCategoryRow = memo(({ cat, active, onToggle }: {
    cat: Category;
    active: boolean;
    onToggle: (cat: Category) => void;
}) => {
    const handleClick = useCallback(() => onToggle(cat), [onToggle, cat]);
    return (
        <button
            type="button"
            onClick={handleClick}
            className={cn(
                'w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-left transition-colors duration-150',
                active ? 'bg-indigo-50 text-indigo-700' : 'text-stone-600 hover:bg-stone-50'
            )}
        >
            <div
                className={cn(
                    'w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors',
                    active ? 'bg-indigo-500 border-indigo-500' : 'border-stone-300'
                )}
            >
                {active && <CheckCircle2 size={9} className="text-white" />}
            </div>
            <span className="text-[11px] font-semibold">{cat?.name}</span>
        </button>
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
    );
  },
);
BrandCard.displayName = "BrandCard";

// ─────────────────────────────────────────────────────────────
// CATEGORY CHIP — mobile selector
// ─────────────────────────────────────────────────────────────
const CategoryChip = memo(
  ({
    cat,
    active,
    onToggle,
  }: {
    cat: string;
    active: boolean;
    onToggle: (cat: string) => void;
  }) => {
    const handleClick = useCallback(() => onToggle(cat), [onToggle, cat]);
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
          active
            ? "border-slate-900 bg-slate-900 text-white"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
        )}
      >
        {active && <CheckCircle2 size={12} />}
        {cat}
      </button>
    );
  },
);
CategoryChip.displayName = "CategoryChip";

// ─────────────────────────────────────────────────────────────
// DESKTOP CATEGORY ROW — desktop selector
// ─────────────────────────────────────────────────────────────
const DesktopCategoryRow = memo(
  ({
    cat,
    active,
    onToggle,
  }: {
    cat: string;
    active: boolean;
    onToggle: (cat: string) => void;
  }) => {
    const handleClick = useCallback(() => onToggle(cat), [onToggle, cat]);
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors",
          active
            ? "bg-slate-100 text-slate-900"
            : "text-slate-600 hover:bg-slate-50",
        )}
      >
        <div
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
            active
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-300 bg-white",
          )}
        >
          {active && <CheckCircle2 size={10} strokeWidth={3} />}
        </div>
        <span className="text-sm font-medium">{cat}</span>
      </button>
    );
  },
);
DesktopCategoryRow.displayName = "DesktopCategoryRow";

// ─────────────────────────────────────────────────────────────
// BRAND MANAGER
// ─────────────────────────────────────────────────────────────

const EMPTY_CATEGORIES: string[] = [];

const BrandManager = () => {
<<<<<<< HEAD
  const admin = useAdmin() as any;
  const { syncData, isLoading } = admin;
  const brands: Brand[] = admin.catalog?.brands ?? admin.brands ?? [];
  const catalogCategories: Category[] = admin.catalog?.categories ?? [];
  const addBrand = admin.addBrand ?? (() => undefined);
  const deleteBrand = admin.deleteBrand ?? (() => undefined);
=======
    const { toast } = useToast();
    const [brands, setBrands] = useState<Brand[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch categories
    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch('/api/categories');
            if (res.ok) {
                const data = await res.json();
                // Ensure data is an array of Category objects
                setCategories(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    }, []);

    // Fetch brands
    const fetchBrands = useCallback(async () => {
        try {
            const res = await fetch('/api/brands');
            setBrands(await res.json());
        } catch (err) {
            console.error('Failed to fetch brands:', err);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchCategories();
        fetchBrands();
    }, [fetchCategories, fetchBrands]);

    // Sync data
    const syncData = useCallback(async () => {
        setIsLoading(true);
        await Promise.all([fetchCategories(), fetchBrands()]);
        setIsLoading(false);
    }, [fetchCategories, fetchBrands]);

    // Add brand
    const addBrand = useCallback(async (brand: CreateBrandRequest) => {
        try {
            const res = await fetch('/api/brands', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(brand),
            });
            if (res.ok) {
                toast({ title: 'Brand added' });
                await fetchBrands();
            }
        } catch (err) {
            console.error(err);
        }
    }, [fetchBrands, toast]);

    // Delete brand
    const deleteBrand = useCallback(async (brandId: string) => {
        try {
            const res = await fetch(`/api/brands/${brandId}`, { method: 'DELETE' });
            if (res.ok) {
                toast({ title: 'Brand deleted' });
                await fetchBrands();
            }
        } catch (err) {
            console.error(err);
        }
    }, [fetchBrands, toast]);
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50

  const [newBrandName, setNewBrandName] = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(true);

  const handleAdd = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newBrandName.trim() || selectedCats.length === 0) return;

<<<<<<< HEAD
      addBrand({
        id: `brand-${Date.now()}`,
        name: newBrandName.trim(),
        categories: selectedCats,
      });
=======
        addBrand({
            name: newBrandName.trim(),
            categories: selectedCats.map(c => c.name),
        });
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50

      setNewBrandName("");
      setSelectedCats([]);
      if (window.innerWidth < 1024) setFormOpen(false);
    },
    [newBrandName, selectedCats, addBrand],
  );

<<<<<<< HEAD
  const toggleCat = useCallback(
    (cat: string) =>
      setSelectedCats((prev) =>
        prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
      ),
    [],
  );
=======
    const toggleCat = useCallback((cat: Category) =>
        setSelectedCats(prev =>
            prev.some(c => c.id === cat.id) ? prev.filter(c => c.id !== cat.id) : [...prev, cat]
        ), []);
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50

  const handleDelete = useCallback(
    (brandId: string, brandName: string) => {
      if (window.confirm(`Delete brand "${brandName}"? This cannot be undone.`))
        deleteBrand(brandId);
    },
    [deleteBrand],
  );

  const handleSyncData = useCallback(() => syncData(), [syncData]);
  const toggleForm = useCallback(() => setFormOpen((o) => !o), []);
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value),
    [],
  );
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setNewBrandName(e.target.value),
    [],
  );
  const handleOpenForm = useCallback(() => setFormOpen(true), []);

  const filteredBrands = useMemo(() => {
    if (!searchQuery.trim()) return brands;
    const lower = searchQuery.toLowerCase();
    return brands.filter((b) => b.name.toLowerCase().includes(lower));
  }, [brands, searchQuery]);

  const canSubmit = newBrandName.trim().length > 0 && selectedCats.length > 0;

<<<<<<< HEAD
  const selectedCatSet = useMemo(() => new Set(selectedCats), [selectedCats]);
  const allCategories = useMemo(
    () => catalogCategories.map((category) => category.name).filter(Boolean),
    [catalogCategories],
  );
=======
    // Pre-build a Set for O(1) active lookups
    const selectedCatSet = useMemo(() => new Set(selectedCats.map(c => c.id)), [selectedCats]);
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50

  const brandsCount = brands.length;

  return (
    <div className="space-y-6">


      {/* ── MAIN LAYOUT ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ── LEFT: ADD BRAND FORM ── */}
        <div className="lg:col-span-4">
          <Panel className="lg:sticky lg:top-6">
            <PanelHeader
              icon={<Building2 size={16} />}
              collapsible
              open={formOpen}
              onClick={toggleForm}
              right={
                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-medium text-slate-600 sm:hidden">
                  {brandsCount}
                </span>
              }
            >
              Add New Brand
            </PanelHeader>

<<<<<<< HEAD
            <div className={cn("p-5", formOpen ? "block" : "hidden lg:block")}>
              <form onSubmit={handleAdd} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Brand Name
                  </label>
                  <Input
                    placeholder="e.g. ASUS"
                    value={newBrandName}
                    onChange={handleNameChange}
                    className="h-10 rounded-md border-slate-200 text-sm"
                    required
                  />
=======
                {/* ── LEFT: ADD BRAND FORM ── */}
                <div className="lg:col-span-4">
                    <Panel stripe="indigo" className="lg:sticky lg:top-6">
                        <PanelHeader
                            icon={<Plus size={12} />}
                            collapsible
                            open={formOpen}
                            onClick={toggleForm}
                            right={
                                <span className="text-[10px] font-bold font-mono text-stone-400 bg-white border border-stone-200 px-2 py-0.5 rounded-md sm:hidden">
                                    {brandsCount}
                                </span>
                            }
                        >
                            Add Brand
                        </PanelHeader>

                        <div className={cn('lg:block', formOpen ? 'block' : 'hidden')}>
                            <form onSubmit={handleAdd} className="px-3 sm:px-5 py-3 space-y-3">

                                {/* Brand name */}
                                <div className="space-y-1.5">
                                    <SectionLabel icon={<Tag size={11} />}>Brand Name</SectionLabel>
                                    <Input
                                        placeholder="e.g. ASUS"
                                        value={newBrandName}
                                        onChange={handleNameChange}
                                        className="h-8 text-xs border-stone-200 bg-stone-50 rounded-lg focus:bg-white focus:border-indigo-300 focus:ring-indigo-500/20 placeholder:text-stone-400 font-medium"
                                        required
                                    />
                                </div>

                                {/* Category selector */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <SectionLabel icon={<Layers size={11} />}>Categories</SectionLabel>
                                        {selectedCats.length > 0 && (
                                            <span className="text-[10px] font-bold font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                                {selectedCats.length} selected
                                            </span>
                                        )}
                                    </div>

                                    {/* Mobile chip grid */}
                                    <div className="lg:hidden flex flex-wrap gap-1.5 p-2 rounded-lg border border-stone-200 bg-stone-50/50">
                                        {categories.map(cat => (
                                            <CategoryChip
                                                key={cat.id}
                                                cat={cat}
                                                active={selectedCatSet.has(cat.id)}
                                                onToggle={toggleCat}
                                            />
                                        ))}
                                    </div>

                                    {/* Desktop scrollable list */}
                                    <div className="hidden lg:block rounded-lg border border-stone-200 overflow-hidden">
                                        <ScrollArea className="h-[200px]">
                                            <div className="p-1.5 space-y-0.5">
                                                {categories.map(cat => (
                                                    <DesktopCategoryRow
                                                        key={cat.id}
                                                        cat={cat}
                                                        active={selectedCatSet.has(cat.id)}
                                                        onToggle={toggleCat}
                                                    />
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={!canSubmit}
                                    className={cn(
                                        'w-full h-9 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-150',
                                        canSubmit
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm active:bg-indigo-800'
                                            : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                                    )}
                                >
                                    Save Brand
                                </button>
                            </form>
                        </div>
                    </Panel>
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">
                      Target Categories
                    </label>
                    {selectedCats.length > 0 && (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-medium text-slate-600">
                        {selectedCats.length} selected
                      </span>
                    )}
                  </div>

                  {/* Mobile chip grid */}
                  <div className="flex flex-wrap gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 lg:hidden">
                    {(allCategories.length ? allCategories : EMPTY_CATEGORIES).map(
                      (cat) => (
                        <CategoryChip
                          key={cat}
                          cat={cat}
                          active={selectedCatSet.has(cat)}
                          onToggle={toggleCat}
                        />
                      ),
                    )}
                  </div>

                  {/* Desktop scrollable list */}
                  <div className="hidden overflow-hidden rounded-md border border-slate-200 lg:block">
                    <ScrollArea className="h-[240px]">
                      <div className="p-2 space-y-0.5">
                        {(allCategories.length ? allCategories : EMPTY_CATEGORIES).map(
                          (cat) => (
                            <DesktopCategoryRow
                              key={cat}
                              cat={cat}
                              active={selectedCatSet.has(cat)}
                              onToggle={toggleCat}
                            />
                          ),
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className={cn(
                    "w-full bg-slate-900 text-white hover:bg-slate-800",
                    !canSubmit && "bg-slate-100 text-slate-400 hover:bg-slate-100 cursor-not-allowed"
                  )}
                >
                  <Plus size={16} className="mr-2" /> Save Brand
                </Button>
              </form>
            </div>
          </Panel>
        </div>

        {/* ── RIGHT: BRAND LIST ── */}
        <div className="space-y-4 lg:col-span-8">
          <Panel>
            <div className="p-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search brands…"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="h-10 rounded-md border-slate-200 pl-9 text-sm"
                />
              </div>
            </div>
          </Panel>

          {filteredBrands.length === 0 ? (
            <Panel>
              <div className="flex flex-col items-center justify-center py-16">
                <Tag size={32} className="mb-4 text-slate-300" />
                <p className="mb-2 text-sm font-medium text-slate-500">
                  {searchQuery
                    ? "No brands match your search"
                    : "No brands configured"}
                </p>
                {!searchQuery && (
                  <button
                    type="button"
                    onClick={handleOpenForm}
                    className="text-sm font-medium text-slate-900 hover:underline"
                  >
                    Add your first brand
                  </button>
                )}
              </div>
            </Panel>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {filteredBrands.map((brand) => (
                <BrandCard
                  key={brand.id}
                  brand={brand}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrandManager;
