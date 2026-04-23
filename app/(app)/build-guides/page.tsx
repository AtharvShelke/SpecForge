'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Box,
    Video,
    Briefcase,
    Gamepad2,
    ArrowRight,
    ChevronDown,
    ChevronUp,
    Sparkles,
    BookOpen,
    Zap,
} from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { useBuild } from '@/context/BuildContext';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageTitle } from '@/components/layout/PageTitle';
import { Section } from '@/components/layout/Section';
import { BuildGuide } from '@/types';

// -------------------------------------------------------------------
// Budget filter options
// -------------------------------------------------------------------
const BUDGET_FILTERS = [
    { label: 'All Builds', max: Infinity },
    { label: 'Under ₹50K', max: 50000 },
    { label: '₹50K – ₹1L', max: 100000 },
    { label: '₹1L – ₹2L', max: 200000 },
    { label: '₹2L+', max: Infinity },
] as const;

type BudgetLabel = typeof BUDGET_FILTERS[number]['label'];

const BUDGET_MIN: Record<BudgetLabel, number> = {
    'All Builds': 0,
    'Under ₹50K': 0,
    '₹50K – ₹1L': 50000,
    '₹1L – ₹2L': 100000,
    '₹2L+': 200000,
};

// -------------------------------------------------------------------
// Themes
// -------------------------------------------------------------------
const GUIDE_THEMES: Record<string, any> = {
    'Gaming': { tier: 'Gaming', icon: Gamepad2, color: 'from-violet-500 to-purple-600', tagColor: 'bg-violet-100 text-violet-700' },
    'Creator': { tier: 'Creator', icon: Video, color: 'from-rose-500 to-pink-600', tagColor: 'bg-rose-100 text-rose-700' },
    'Office': { tier: 'Office', icon: Briefcase, color: 'from-blue-400 to-blue-600', tagColor: 'bg-blue-100 text-blue-700' },
    'Enthusiast': { tier: 'Enthusiast', icon: Zap, color: 'from-amber-500 to-orange-600', tagColor: 'bg-amber-100 text-amber-700' },
};
const DEFAULT_THEME = { tier: 'Custom', icon: Box, color: 'from-slate-500 to-slate-600', tagColor: 'bg-slate-100 text-slate-700' };

// -------------------------------------------------------------------
// Guide Card
// -------------------------------------------------------------------
const GuideCard: React.FC<{ guide: BuildGuide; onStartBuild: () => void }> = ({ guide, onStartBuild }) => {
    const [expanded, setExpanded] = useState(false);
    const theme = GUIDE_THEMES[guide.category] || DEFAULT_THEME;
    const Icon = theme.icon;

    return (
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
            {/* Card Header Gradient */}
            <div className={`bg-gradient-to-br ${theme.color} p-6 relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />
                <div className="relative flex items-start justify-between">
                    <div>
                        <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-2 bg-white/20 text-white`}>
                            {theme.tier}
                        </span>
                        <h3 className="text-xl font-bold text-white">{guide.title}</h3>
                        <p className="text-white/80 text-sm mt-0.5">{guide.category}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Icon size={22} className="text-white" />
                    </div>
                </div>
                <div className="relative mt-4 flex items-end justify-between">
                    <div>
                        <p className="text-white/60 text-xs font-medium">Est. Budget</p>
                        <p className="text-white font-bold text-lg">~₹{guide.total.toLocaleString('en-IN')}</p>
                    </div>
                </div>
            </div>

            {/* Card Body */}
            <div className="p-5">
                <p className="text-sm text-zinc-600 leading-relaxed mb-4">{guide.description || 'A hand-curated PC build.'}</p>

                {/* Expand / Collapse */}
                <button
                    onClick={() => setExpanded((v) => !v)}
                    className="w-full flex items-center justify-between text-sm font-semibold text-zinc-700 
            px-4 py-2.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl
            transition-colors mb-4"
                >
                    <span>{expanded ? 'Hide' : 'View'} Component List</span>
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {expanded && (
                    <div className="mb-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                        {guide.items?.map((item, i) => (
                            <div key={item.id || i} className="flex items-center justify-between text-xs px-3 py-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
                                <div className="min-w-0 pr-4">
                                    <span className="font-semibold text-zinc-500 uppercase text-[10px] tracking-wide block">
                                        {item.variant?.product?.subCategory?.category?.name || item.variant?.product?.category || 'Component'}
                                    </span>
                                    <span className="text-zinc-800 font-medium truncate block">{item.variant?.product?.name || 'Unknown Component'}</span>
                                </div>
                                <span className="font-bold text-zinc-700 ml-4 flex-shrink-0">
                                    {item.variant ? `₹${(item.variant.price * item.quantity).toLocaleString('en-IN')}` : <span className="text-red-500">Unavailable</span>}
                                </span>
                            </div>
                        ))}
                        <div className="flex justify-between px-3 py-2.5 bg-blue-50 rounded-lg border border-blue-100 text-sm font-bold text-blue-800">
                            <span>Estimated Total</span>
                            <span>₹{guide.total.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                )}

                {/* CTA */}
                <button
                    onClick={onStartBuild}
                    className="w-full flex items-center justify-center gap-2 h-11 bg-zinc-900 hover:bg-zinc-800
            text-white font-semibold rounded-xl text-sm transition-all"
                >
                    Start This Build <ArrowRight size={15} />
                </button>
            </div>
        </div>
    );
};

// -------------------------------------------------------------------
// Main Page
// -------------------------------------------------------------------
export default function BuildGuidesPage() {
    const [activeFilter, setActiveFilter] = useState<BudgetLabel>('All Builds');
    const { loadCart, setCartOpen } = useShop();
    const { buildGuides, refreshBuildGuides } = useBuild();
    const router = useRouter();

    useEffect(() => {
        refreshBuildGuides();
    }, [refreshBuildGuides]);

    const filtered = buildGuides.filter((g) => {
        const min = BUDGET_MIN[activeFilter];
        const max_f = BUDGET_FILTERS.find((f) => f.label === activeFilter)?.max ?? Infinity;
        return g.total > min && g.total <= max_f;
    });

    const handleStartBuild = (guide: BuildGuide) => {
        const newCart = guide.items
            ?.filter(item => item.variant?.product)
            .map(item => ({ ...item.variant!.product, quantity: item.quantity, selectedVariant: item.variant })) || [];

        loadCart(newCart);
        router.push('/products?mode=build');
        setTimeout(() => setCartOpen(true), 500);
    };

    return (
        <PageLayout bgClass="bg-zinc-50">
            {/* Hero */}
            <PageLayout.Header>
                <PageTitle
                    title="PC Build Guides"
                    subtitle="Curated PC builds for every budget and use-case — hand-picked by our experts. Click 'Start This Build' to jump straight into Build Mode with the right category pre-selected."
                    badge={
                        <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                            <BookOpen size={12} /> Expert Guides
                        </div>
                    }
                />

                {/* Budget Filter Chips */}
                <div className="flex flex-wrap gap-2 mt-8">
                    {BUDGET_FILTERS.map((f) => (
                        <button
                            key={f.label}
                            onClick={() => setActiveFilter(f.label)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all
                  ${activeFilter === f.label
                                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </PageLayout.Header>

            {/* Guide Grid */}
            <PageLayout.Content padding="lg">
                {filtered.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-zinc-200">
                        <p className="text-zinc-500">No guides match this budget filter.</p>
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-zinc-400 mb-6">
                            Showing {filtered.length} guide{filtered.length !== 1 ? 's' : ''}
                            {activeFilter !== 'All Builds' ? ` · ${activeFilter}` : ''}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filtered.map((guide) => (
                                <GuideCard key={guide.id} guide={guide} onStartBuild={() => handleStartBuild(guide)} />
                            ))}
                        </div>
                    </>
                )}

                {/* Bottom CTA */}
                <Section spacing="xl" container={false} className="mt-8">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 sm:p-10 text-center">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                            Want a Custom Build?
                        </h2>
                        <p className="text-blue-100 text-sm mb-6 max-w-lg mx-auto">
                            Use our Build Mode to configure any combination — our compatibility checker will flag issues in real time.
                        </p>
                        <Link
                            href="/products?mode=build"
                            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-blue-700 
                  font-bold rounded-xl text-sm hover:bg-blue-50 transition-all shadow-lg"
                        >
                            Open Build Mode <ArrowRight size={16} />
                        </Link>
                    </div>
                </Section>
            </PageLayout.Content>
        </PageLayout>
    );
}
