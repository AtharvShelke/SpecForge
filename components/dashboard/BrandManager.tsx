'use client';

import React, { useState } from 'react';

import { useAdmin } from '@/context/AdminContext';
import { Category } from '@/types';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

// ─────────────────────────────────────────────────────────────
// SHARED PRIMITIVES
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
        teal: 'from-teal-400 via-emerald-400 to-emerald-300',
        amber: 'from-amber-400 via-amber-400 to-orange-300',
        rose: 'from-rose-400 via-rose-400 to-rose-300',
        violet: 'from-violet-400 via-violet-500 to-indigo-400',
        stone: 'from-stone-300 via-stone-400 to-stone-300',
    };
    return (
        <div
            className={cn(
                'rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden',
                className
            )}
        >
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
            'px-3 sm:px-5 py-3 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between gap-2',
            collapsible && 'cursor-pointer select-none'
        )}
        onClick={onClick}
    >
        <SectionLabel icon={icon}>{children}</SectionLabel>
        <div className="flex items-center gap-2">
            {right}
            {collapsible && (
                <ChevronDown
                    size={13}
                    className={cn('text-stone-400 transition-transform duration-200', open && 'rotate-180')}
                />
            )}
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────
// CATEGORY PILL
// ─────────────────────────────────────────────────────────────
const CategoryPill = ({ label }: { label: string }) => (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap bg-stone-100 text-stone-600 ring-1 ring-stone-200">
        {label}
    </span>
);

// ─────────────────────────────────────────────────────────────
// BRAND MANAGER
// ─────────────────────────────────────────────────────────────
const BrandManager = () => {
    const { brands, addBrand, deleteBrand, syncData, isLoading } = useAdmin();

    const [newBrandName, setNewBrandName] = useState('');
    const [selectedCats, setSelectedCats] = useState<Category[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    // On mobile the "Add Brand" form collapses so the list is visible immediately
    const [formOpen, setFormOpen] = useState(true);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBrandName.trim() || selectedCats.length === 0) return;

        addBrand({
            id: `brand-${Date.now()}`,
            name: newBrandName.trim(),
            categories: selectedCats,
        });

        setNewBrandName('');
        setSelectedCats([]);
        // Collapse the form on mobile after saving so the user can see the updated list
        if (window.innerWidth < 1024) setFormOpen(false);
    };

    const toggleCat = (cat: Category) =>
        setSelectedCats(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );

    const handleDelete = (brandId: string, brandName: string) => {
        if (window.confirm(`Delete brand "${brandName}"? This cannot be undone.`))
            deleteBrand(brandId);
    };

    const filteredBrands = brands.filter(b =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const canSubmit = newBrandName.trim().length > 0 && selectedCats.length > 0;

    return (
        <div
            className="space-y-3"
            style={{ fontFamily: "'DM Sans', 'Geist', 'system-ui', sans-serif" }}
        >

            {/* ── PAGE HEADER ── */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-1 h-4 rounded-full bg-indigo-500 flex-shrink-0" />
                    <div className="min-w-0">
                        <h2 className="text-sm font-bold text-stone-800 tracking-tight">Brand Management</h2>
                        <p className="text-[11px] text-stone-400 mt-0.5 hidden sm:block">
                            Manage brand portfolio and category associations
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Brand count pill */}
                    <span className="text-[10px] font-bold font-mono text-stone-400 bg-white border border-stone-200 px-2 py-0.5 rounded-md shadow-sm hidden sm:inline">
                        {brands.length} brands
                    </span>
                    <button
                        onClick={() => syncData()}
                        disabled={isLoading}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-stone-50 text-stone-600 border border-stone-200 text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">Sync</span>
                    </button>
                </div>
            </div>

            {/* ── MAIN LAYOUT ── */}
            {/*
                On mobile: stacked — collapsible form on top, list below.
                On lg+: side-by-side 4/8 grid with sticky form.
            */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">

                {/* ── LEFT: ADD BRAND FORM ── */}
                <div className="lg:col-span-4">
                    {/*
                        On mobile the panel header acts as a collapse toggle.
                        On lg+ it's always open (sticky).
                    */}
                    <Panel stripe="indigo" className="lg:sticky lg:top-6">
                        {/* Header — tappable on mobile to collapse/expand */}
                        <PanelHeader
                            icon={<Plus size={12} />}
                            collapsible
                            open={formOpen}
                            onClick={() => setFormOpen(o => !o)}
                            right={
                                /* Brand count shown inside form header on mobile */
                                <span className="text-[10px] font-bold font-mono text-stone-400 bg-white border border-stone-200 px-2 py-0.5 rounded-md sm:hidden">
                                    {brands.length}
                                </span>
                            }
                        >
                            Add Brand
                        </PanelHeader>

                        {/* Collapsible body — always open on lg */}
                        <div className={cn(
                            'lg:block',
                            formOpen ? 'block' : 'hidden'
                        )}>
                            <form onSubmit={handleAdd} className="px-3 sm:px-5 py-3 space-y-3">

                                {/* Brand name */}
                                <div className="space-y-1.5">
                                    <SectionLabel icon={<Tag size={11} />}>Brand Name</SectionLabel>
                                    <Input
                                        placeholder="e.g. ASUS"
                                        value={newBrandName}
                                        onChange={e => setNewBrandName(e.target.value)}
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

                                    {/*
                                        On mobile: wrap-grid of toggle chips — no scrollable box.
                                        On lg: scrollable list (bounded height).
                                    */}

                                    {/* Mobile chip grid — shown below lg */}
                                    <div className="lg:hidden flex flex-wrap gap-1.5 p-2 rounded-lg border border-stone-200 bg-stone-50/50">
                                        {Object.values(Category).map(cat => {
                                            const active = selectedCats.includes(cat);
                                            return (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => toggleCat(cat)}
                                                    className={cn(
                                                        'flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors duration-150 ring-1',
                                                        active
                                                            ? 'bg-indigo-600 text-white ring-indigo-600'
                                                            : 'bg-white text-stone-500 ring-stone-200 hover:ring-stone-300'
                                                    )}
                                                >
                                                    {active && <CheckCircle2 size={9} />}
                                                    {cat}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Desktop scrollable list — shown on lg+ */}
                                    <div className="hidden lg:block rounded-lg border border-stone-200 overflow-hidden">
                                        <ScrollArea className="h-[200px]">
                                            <div className="p-1.5 space-y-0.5">
                                                {Object.values(Category).map(cat => {
                                                    const active = selectedCats.includes(cat);
                                                    return (
                                                        <button
                                                            key={cat}
                                                            type="button"
                                                            onClick={() => toggleCat(cat)}
                                                            className={cn(
                                                                'w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-left transition-colors duration-150',
                                                                active
                                                                    ? 'bg-indigo-50 text-indigo-700'
                                                                    : 'text-stone-600 hover:bg-stone-50'
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
                                                            <span className="text-[11px] font-semibold">{cat}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                </div>

                                {/* Submit — taller tap target on mobile */}
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
                </div>

                {/* ── RIGHT: BRAND LIST ── */}
                <div className="lg:col-span-8 space-y-3">

                    {/* Search bar */}
                    <Panel>
                        <div className="px-3 py-2.5">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                                <Input
                                    placeholder="Search brands…"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="pl-8 h-8 text-xs border-stone-200 bg-stone-50/50 rounded-lg placeholder:text-stone-400 font-medium"
                                />
                            </div>
                        </div>
                    </Panel>

                    {/* Empty state */}
                    {filteredBrands.length === 0 ? (
                        <Panel>
                            <div className="py-12 flex flex-col items-center gap-2.5">
                                <Tag size={22} className="text-stone-200" />
                                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                                    {searchQuery ? 'No brands match your search' : 'No brands found'}
                                </p>
                                {!searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setFormOpen(true)}
                                        className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline"
                                    >
                                        Add your first brand →
                                    </button>
                                )}
                            </div>
                        </Panel>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {filteredBrands.map(brand => (
                                <Panel key={brand.id} stripe="stone" className="group">
                                    <div className="px-3 py-3 space-y-2.5">

                                        {/* Top row: ID + name + delete */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1 mb-0.5">
                                                    <Hash size={9} className="text-stone-300" />
                                                    <span className="text-[10px] font-mono font-bold text-stone-400">
                                                        {brand.id.substring(0, 8).toUpperCase()}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-bold text-stone-800 tracking-tight truncate">
                                                    {brand.name}
                                                </p>
                                            </div>
                                            {/*
                                                Delete: always visible on mobile (touch can't hover),
                                                opacity-0 + group-hover on desktop.
                                            */}
                                            <button
                                                onClick={() => handleDelete(brand.id, brand.name)}
                                                className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-150 h-7 w-7 rounded-md flex items-center justify-center text-stone-300 hover:text-rose-500 hover:bg-rose-50 active:bg-rose-100 flex-shrink-0"
                                            >
                                                <Trash size={13} />
                                            </button>
                                        </div>

                                        {/* Divider */}
                                        <div className="h-px bg-stone-100" />

                                        {/* Categories */}
                                        {brand.categories.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {brand.categories.map(cat => (
                                                    <CategoryPill key={cat} label={cat} />
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
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BrandManager;