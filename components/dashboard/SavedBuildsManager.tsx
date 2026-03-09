'use client';

import React, { useState, useEffect } from 'react';
import {
    Trash,
    Search,
    Hash,
    Cpu,
    Edit,
    Plus,
    Package,
    AlertTriangle,
    RefreshCw,
    ExternalLink,
    ChevronRight,
    DollarSign,
    Layers,
    Clock,
} from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────
// DESIGN-SYSTEM PRIMITIVES  (mirrors Overview / OrderManager)
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

// KPI card — matches Overview's border-l-4 accent cards
const KpiCard = ({
    label,
    value,
    sub,
    icon,
    accent,
    subColor = 'text-stone-400',
}: {
    label: string;
    value: React.ReactNode;
    sub: string;
    icon: React.ReactNode;
    accent: string;
    subColor?: string;
}) => (
    <div className={cn('rounded-xl bg-white border border-stone-200 border-l-4 shadow-sm p-4', accent)}>
        <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{label}</span>
            <span className="p-1 rounded-md text-stone-400 bg-stone-50">{icon}</span>
        </div>
        <p className="text-2xl font-extrabold text-stone-900 tabular-nums tracking-tight font-mono">{value}</p>
        <p className={cn('text-[11px] mt-0.5 font-medium', subColor)}>{sub}</p>
    </div>
);

// Category pill — mirrors StatusPill pattern
const CategoryPill = ({ label }: { label: string }) => (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
        <span className="w-1 h-1 rounded-full bg-current opacity-60" />
        {label}
    </span>
);

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function SavedBuildsManager() {
    const { toast } = useToast();
    const { savedBuilds: builds, refreshSavedBuilds: fetchBuilds, syncData, isLoading } = useAdmin();
    const [searchQuery, setSearchQuery] = useState('');
    const [editingBuild, setEditingBuild] = useState<any | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => { fetchBuilds(); }, [fetchBuilds]);

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/build-guides/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast({ title: 'Build deleted successfully' });
                fetchBuilds();
                setDeleteConfirmId(null);
            } else {
                const data = await res.json();
                toast({ title: 'Delete Failed', description: data.error || 'Could not delete', variant: 'destructive' });
            }
        } catch (err) {
            console.error(err);
            toast({ title: 'Error', description: 'Failed to delete build', variant: 'destructive' });
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingBuild) return;
        try {
            const res = await fetch(`/api/build-guides/${editingBuild.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editingBuild.title,
                    description: editingBuild.description,
                    category: editingBuild.category,
                    total: editingBuild.total,
                }),
            });
            if (res.ok) {
                toast({ title: 'Build updated successfully' });
                setEditingBuild(null);
                fetchBuilds();
            } else {
                const data = await res.json();
                toast({ title: 'Update Failed', description: data.error || 'Could not update', variant: 'destructive' });
            }
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Failed to update build', variant: 'destructive' });
        }
    };

    const filteredBuilds = builds.filter(b =>
        b.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // ── Derived KPIs ──
    const totalValue = builds.reduce((s, b) => s + (b.total || 0), 0);
    const avgValue = builds.length > 0 ? Math.round(totalValue / builds.length) : 0;
    const categories = [...new Set(builds.map(b => b.category).filter(Boolean))];

    return (
        <div className="space-y-4">

            {/* ── PAGE HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-1 h-5 rounded-full bg-violet-500" />
                    <div>
                        <h2 className="text-sm font-bold text-stone-800 tracking-tight">Saved Builds</h2>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                            Manage saved configurations and custom PC builds
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => syncData()}
                        disabled={isLoading}
                        className="h-7 px-3 flex items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-all shadow-sm text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                    >
                        <RefreshCw size={11} className={cn(isLoading && 'animate-spin')} /> Sync
                    </button>
                    <Link href="/builds/new">
                        <span className="flex items-center gap-1.5 h-7 px-3 text-[10px] font-bold uppercase tracking-widest bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors shadow-sm cursor-pointer">
                            <Plus size={11} /> New Build
                        </span>
                    </Link>
                </div>
            </div>

            {/* ── KPI STRIP ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiCard
                    label="Total Builds"
                    value={builds.length}
                    sub={`${filteredBuilds.length} matching search`}
                    icon={<Cpu size={14} />}
                    accent="border-l-violet-400"
                />
                <KpiCard
                    label="Total Value"
                    value={`₹${totalValue.toLocaleString('en-IN')}`}
                    sub="Sum of all build totals"
                    icon={<DollarSign size={14} />}
                    accent="border-l-teal-400"
                />
                <KpiCard
                    label="Avg Build Value"
                    value={`₹${avgValue.toLocaleString('en-IN')}`}
                    sub={`Across ${builds.length} build${builds.length !== 1 ? 's' : ''}`}
                    icon={<Package size={14} />}
                    accent="border-l-indigo-400"
                />
                <KpiCard
                    label="Categories"
                    value={categories.length}
                    sub={categories.slice(0, 2).join(' · ') || 'None yet'}
                    icon={<Layers size={14} />}
                    accent="border-l-amber-400"
                />
            </div>

            {/* ── BUILD LIST PANEL ── */}
            <Panel stripe="violet">
                <PanelHeader
                    icon={<Cpu size={12} />}
                    right={
                        <span className="text-[10px] font-bold font-mono text-stone-400 bg-white border border-stone-200 px-2 py-0.5 rounded-md">
                            {filteredBuilds.length} build{filteredBuilds.length !== 1 ? 's' : ''}
                        </span>
                    }
                >
                    Build Catalogue
                </PanelHeader>

                {/* Search bar */}
                <div className="px-5 py-3 border-b border-stone-100">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                        <Input
                            placeholder="Search builds or categories…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-8 h-8 text-xs border-stone-200 bg-stone-50 rounded-lg placeholder:text-stone-400 font-medium focus:bg-white"
                        />
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="py-20 flex flex-col items-center gap-3">
                        <RefreshCw size={20} className="text-stone-200 animate-spin" />
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Loading builds…</p>
                    </div>
                ) : filteredBuilds.length === 0 ? (
                    <div className="py-20 flex flex-col items-center gap-3">
                        <Cpu size={28} className="text-stone-200" />
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">No builds found</p>
                        <Link href="/builds/new">
                            <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest hover:underline cursor-pointer">
                                Create first build →
                            </span>
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-stone-100">
                        {filteredBuilds.map(build => {
                            const isExpanded = expandedId === build.id;
                            const itemCount = build.items?.length || 0;
                            const visibleItems = build.items?.slice(0, 4) || [];
                            const overflow = Math.max(0, itemCount - 4);

                            return (
                                <div key={build.id} className="group">

                                    {/* ── ROW ── */}
                                    <div
                                        className="flex items-center gap-4 px-5 py-3.5 hover:bg-stone-50/70 transition-colors duration-150 cursor-pointer"
                                        onClick={() => setExpandedId(isExpanded ? null : build.id)}
                                    >
                                        {/* Expand chevron */}
                                        <ChevronRight
                                            size={13}
                                            className={cn(
                                                'text-stone-300 shrink-0 transition-transform duration-200',
                                                isExpanded && 'rotate-90'
                                            )}
                                        />

                                        {/* Icon */}
                                        <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                                            <Cpu size={14} className="text-violet-500" />
                                        </div>

                                        {/* Title block */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-xs font-bold text-stone-800 tracking-tight truncate">
                                                    {build.title}
                                                </p>
                                                {build.category && <CategoryPill label={build.category} />}
                                            </div>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <span className="flex items-center gap-1 text-[10px] font-mono text-stone-400">
                                                    <Hash size={9} />
                                                    {build.id.substring(0, 8).toUpperCase()}
                                                </span>
                                                <span className="text-[10px] text-stone-400">
                                                    {itemCount} component{itemCount !== 1 ? 's' : ''}
                                                </span>
                                                <span className="flex items-center gap-1 text-[10px] text-stone-400">
                                                    <Clock size={9} />
                                                    {new Date(build.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Total */}
                                        <div className="text-right shrink-0 hidden sm:block">
                                            <p className="text-sm font-extrabold text-stone-900 tabular-nums font-mono">
                                                ₹{Number(build.total || 0).toLocaleString('en-IN')}
                                            </p>
                                            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Total</p>
                                        </div>

                                        {/* Actions */}
                                        <div
                                            className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-150 shrink-0"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setEditingBuild(build)}
                                                className="h-6 w-6 rounded-md flex items-center justify-center text-stone-300 hover:text-stone-700 hover:bg-stone-100 transition-all"
                                            >
                                                <Edit size={12} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeleteConfirmId(build.id)}
                                                className="h-6 w-6 rounded-md flex items-center justify-center text-stone-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                            >
                                                <Trash size={12} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* ── EXPANDED DETAIL ── */}
                                    {isExpanded && (
                                        <div className="px-5 pb-4 pt-1 ml-[72px] animate-in fade-in slide-in-from-top-1 duration-200 border-t border-stone-100">
                                            <div className="space-y-3">

                                                {/* Description */}
                                                {build.description && (
                                                    <p className="text-[11px] text-stone-500 leading-relaxed bg-stone-50 border border-stone-100 rounded-lg px-3 py-2">
                                                        {build.description}
                                                    </p>
                                                )}

                                                {/* Components */}
                                                <div>
                                                    <SectionLabel icon={<Package size={11} />}>
                                                        Components · {itemCount}
                                                    </SectionLabel>
                                                    <div className="mt-2 rounded-xl border border-stone-100 overflow-hidden">
                                                        {visibleItems.map((item: any, idx: number) => (
                                                            <div
                                                                key={item.id}
                                                                className={cn(
                                                                    'flex items-center justify-between gap-3 px-4 py-2.5',
                                                                    idx < visibleItems.length - 1 && 'border-b border-stone-50'
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-2.5 min-w-0">
                                                                    <span className="text-[10px] font-bold font-mono text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded shrink-0">
                                                                        ×{item.quantity}
                                                                    </span>
                                                                    <p className="text-xs font-semibold text-stone-700 truncate">
                                                                        {item.variant?.product?.name || 'Unknown Item'}
                                                                    </p>
                                                                </div>
                                                                <span className="text-xs font-bold font-mono text-stone-600 shrink-0 tabular-nums">
                                                                    ₹{Number(item.variant?.price || 0).toLocaleString('en-IN')}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {overflow > 0 && (
                                                            <div className="px-4 py-2 bg-stone-50 border-t border-stone-100">
                                                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                                                    + {overflow} more component{overflow !== 1 ? 's' : ''}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Footer actions */}
                                                <div className="flex items-center gap-2 pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingBuild(build)}
                                                        className="flex items-center gap-1.5 h-7 px-3 text-[10px] font-bold uppercase tracking-widest border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors"
                                                    >
                                                        <Edit size={11} /> Edit Details
                                                    </button>
                                                    <Link href={`/builds/${build.id}`}>
                                                        <span className="flex items-center gap-1.5 h-7 px-3 text-[10px] font-bold uppercase tracking-widest bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors cursor-pointer">
                                                            <ExternalLink size={11} /> Open in Builder
                                                        </span>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </Panel>

            {/* ══════════════════════════════════════ */}
            {/*  EDIT MODAL                            */}
            {/* ══════════════════════════════════════ */}
            <Dialog open={!!editingBuild} onOpenChange={open => !open && setEditingBuild(null)}>
                <DialogContent className="sm:max-w-md bg-white border-stone-200 rounded-2xl shadow-xl">
                    <div className="h-0.5 w-full bg-gradient-to-r from-violet-400 via-violet-500 to-indigo-400 -mt-6 mb-5 rounded-t-2xl" />
                    <DialogHeader className="pb-2">
                        <DialogTitle className="text-sm font-bold text-stone-800 tracking-tight">
                            Edit Build
                        </DialogTitle>
                        <DialogDescription className="text-[11px] text-stone-400">
                            Component changes must be made via the Builder.
                        </DialogDescription>
                    </DialogHeader>

                    {editingBuild && (
                        <form onSubmit={handleSave} className="space-y-3 py-1">
                            {[
                                { label: 'Title', field: 'title', placeholder: 'Build name', type: 'text', required: true },
                                { label: 'Category', field: 'category', placeholder: 'e.g. Gaming, Workstation', type: 'text' },
                            ].map(({ label, field, placeholder, type, required }) => (
                                <div key={field} className="space-y-1">
                                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em]">{label}</span>
                                    <Input
                                        type={type}
                                        placeholder={placeholder}
                                        required={required}
                                        value={(editingBuild as any)[field] || ''}
                                        onChange={e => setEditingBuild({ ...editingBuild, [field]: e.target.value })}
                                        className="h-8 text-xs border-stone-200 bg-stone-50 rounded-lg focus:bg-white focus:border-violet-300 focus:ring-violet-500/20 placeholder:text-stone-400 font-medium"
                                    />
                                </div>
                            ))}

                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em]">Description</span>
                                <Textarea
                                    rows={3}
                                    placeholder="Brief description of this build…"
                                    value={editingBuild.description || ''}
                                    onChange={e => setEditingBuild({ ...editingBuild, description: e.target.value })}
                                    className="text-xs border-stone-200 bg-stone-50 rounded-lg resize-none focus:bg-white focus:border-violet-300 focus:ring-violet-500/20 placeholder:text-stone-400 font-medium"
                                />
                            </div>

                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em]">Total Price Override</span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={editingBuild.total}
                                    onChange={e => setEditingBuild({ ...editingBuild, total: parseFloat(e.target.value) || 0 })}
                                    className="h-8 text-xs font-mono border-stone-200 bg-stone-50 rounded-lg focus:bg-white focus:border-violet-300 focus:ring-violet-500/20 placeholder:text-stone-400"
                                />
                            </div>

                            <DialogFooter className="gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingBuild(null)}
                                    className="h-8 px-4 text-[10px] font-bold uppercase tracking-widest border border-stone-200 text-stone-500 rounded-lg hover:bg-stone-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="h-8 px-4 text-[10px] font-bold uppercase tracking-widest bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors shadow-sm"
                                >
                                    Save Changes
                                </button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* ══════════════════════════════════════ */}
            {/*  DELETE CONFIRM MODAL                  */}
            {/* ══════════════════════════════════════ */}
            <Dialog open={!!deleteConfirmId} onOpenChange={open => !open && setDeleteConfirmId(null)}>
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
                            Are you sure you want to delete this saved build? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="h-8 px-4 text-[10px] font-bold uppercase tracking-widest border border-stone-200 text-stone-500 rounded-lg hover:bg-stone-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                            className="h-8 px-4 text-[10px] font-bold uppercase tracking-widest bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shadow-sm flex items-center gap-1.5"
                        >
                            <Trash size={11} /> Delete
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}