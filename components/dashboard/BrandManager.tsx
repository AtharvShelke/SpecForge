"use client";

import { useState, useCallback, useMemo, memo } from "react";

import { useAdmin } from "@/context/AdminContext";
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
const BrandCard = memo(
  ({
    brand,
    onDelete,
  }: {
    brand: Brand;
    onDelete: (id: string, name: string) => void;
  }) => {
    const handleDelete = useCallback(
      () => onDelete(brand.id, brand.name),
      [onDelete, brand.id, brand.name],
    );
    const shortId = brand.id.substring(0, 8).toUpperCase();
    const brandCategories = brand.categories ?? [];

    return (
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
  const admin = useAdmin() as any;
  const { syncData, isLoading } = admin;
  const brands: Brand[] = admin.catalog?.brands ?? admin.brands ?? [];
  const catalogCategories: Category[] = admin.catalog?.categories ?? [];
  const addBrand = admin.addBrand ?? (() => undefined);
  const deleteBrand = admin.deleteBrand ?? (() => undefined);

  const [newBrandName, setNewBrandName] = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(true);

  const handleAdd = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newBrandName.trim() || selectedCats.length === 0) return;

      addBrand({
        id: `brand-${Date.now()}`,
        name: newBrandName.trim(),
        categories: selectedCats,
      });

      setNewBrandName("");
      setSelectedCats([]);
      if (window.innerWidth < 1024) setFormOpen(false);
    },
    [newBrandName, selectedCats, addBrand],
  );

  const toggleCat = useCallback(
    (cat: string) =>
      setSelectedCats((prev) =>
        prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
      ),
    [],
  );

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

  const selectedCatSet = useMemo(() => new Set(selectedCats), [selectedCats]);
  const allCategories = useMemo(
    () => catalogCategories.map((category) => category.name).filter(Boolean),
    [catalogCategories],
  );

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