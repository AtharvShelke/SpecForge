'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
    Cpu,
    Monitor,
    HardDrive,
    Zap,
    Box,
    Video,
    Briefcase,
    Gamepad2,
    ArrowRight,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    Sparkles,
    BookOpen,
} from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageTitle } from '@/components/layout/PageTitle';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';

// -------------------------------------------------------------------
// Guide Data
// -------------------------------------------------------------------

interface GuideComponent {
    category: string;
    name: string;
}

interface Guide {
    id: string;
    tier: string;
    title: string;
    budget: string;
    budgetMax: number;
    useCase: string;
    icon: React.FC<{ size?: number; className?: string }>;
    color: string;
    tagColor: string;
    description: string;
    highlights: string[];
    components: GuideComponent[];
}

const GUIDES: Guide[] = [
    {
        id: 'student-everyday',
        tier: 'Basic',
        title: 'Student & Everyday Use',
        budget: 'Under ₹35,000',
        budgetMax: 35000,
        useCase: 'School Work, Browsing, Light Media',
        icon: BookOpen,
        color: 'from-blue-400 to-blue-600',
        tagColor: 'bg-blue-100 text-blue-700',
        description: 'perfect basic computer for students and everyday web browsing. Reliable performance without spending on unnecessary gaming hardware.',
        highlights: ['Fast everyday computing', 'Very quiet operation', 'Low power draw', 'Reliable basics'],
        components: [
            { category: 'Processor', name: 'Intel Core i3-12100F' },
            { category: 'Motherboard', name: 'MSI Pro H610M' },
            { category: 'RAM', name: 'Crucial 8GB DDR4 3200MHz' },
            { category: 'Storage', name: 'Crucial P3 500GB' },
            { category: 'Power Supply', name: 'Cooler Master MWE 550 V2' },
            { category: 'Cabinet', name: 'Corsair 4000D Airflow' }, // using available realistic case
        ],
    },
    {
        id: 'budget-1080p-gaming',
        tier: 'Entry Gaming',
        title: '1080p Starter Gaming',
        budget: 'Under ₹60,000',
        budgetMax: 60000,
        useCase: 'Esports, 1080p AAA Games',
        icon: Gamepad2,
        color: 'from-violet-500 to-purple-600',
        tagColor: 'bg-violet-100 text-violet-700',
        description: 'Get into PC gaming without breaking the bank. Excellent for Valorant, CS2, Minecraft, and enjoying modern AAA titles at 1080p.',
        highlights: ['60+ FPS in modern games', 'Great upgrade path', 'Smart budget allocation', '1080p sweet spot'],
        components: [
            { category: 'Processor', name: 'AMD Ryzen 5 5600' },
            { category: 'Motherboard', name: 'Gigabyte B550M DS3H' },
            { category: 'RAM', name: 'Corsair Vengeance LPX 16GB' },
            { category: 'GPU', name: 'Gigabyte Radeon RX 6600' },
            { category: 'Storage', name: 'Crucial P3 500GB' },
            { category: 'Power Supply', name: 'Cooler Master MWE 550 V2' },
        ],
    },
    {
        id: 'creator-video-editing',
        tier: 'Creator',
        title: 'Video Editing & Creative',
        budget: '₹1,00,000 - ₹1,40,000',
        budgetMax: 140000,
        useCase: 'Premiere Pro, After Effects, Photoshop',
        icon: Video,
        color: 'from-rose-500 to-pink-600',
        tagColor: 'bg-rose-100 text-rose-700',
        description: 'Optimized for Adobe Creative Cloud and video rendering. Features Intel QuickSync for smoother timeline scrubbing and fast exports.',
        highlights: ['Intel Quick Sync (iGPU)', 'Fast DDR5 RAM', 'NVIDIA CUDA acceleration', 'High-speed scratch drive'],
        components: [
            { category: 'Processor', name: 'Intel Core i5-14600K' }, // Intel specifically for QuickSync
            { category: 'Motherboard', name: 'MSI MAG Z790 Tomahawk WiFi' },
            { category: 'RAM', name: 'G.Skill Trident Z5 32GB' }, // 32gb essential for video
            { category: 'GPU', name: 'Zotac RTX 4070' }, // NVIDIA for CUDA in render
            { category: 'Storage', name: 'Samsung 990 Pro 1TB' },
            { category: 'Power Supply', name: 'Corsair RM850e' },
            { category: 'Cooler', name: 'DeepCool LS720' },
        ],
    },
    {
        id: 'developer-coding',
        tier: 'Pro',
        title: 'Developer Workstation',
        budget: '₹80,000 - ₹1,20,000',
        budgetMax: 120000,
        useCase: 'Coding, Docker, Virtualization',
        icon: HardDrive, // Better icon for dev
        color: 'from-emerald-500 to-teal-600',
        tagColor: 'bg-emerald-100 text-emerald-700',
        description: 'Heavy on CPU cores and RAM for compiling code, running multiple Docker containers, and IDEs. GPU power is secondary here.',
        highlights: ['High multi-core count', 'Massive RAM for VMs', 'Ultra-fast NVMe storage', 'Stable productivity platform'],
        components: [
            { category: 'Processor', name: 'AMD Ryzen 9 7900' }, // High core count, efficient
            { category: 'Motherboard', name: 'ASUS TUF B650-PLUS' },
            { category: 'RAM', name: 'G.Skill Trident Z5 32GB' }, // High Ram
            { category: 'Storage', name: 'Samsung 990 Pro 1TB' }, // Very fast disk I/O
            { category: 'Power Supply', name: 'Corsair RM850e' },
            { category: 'Cabinet', name: 'Lian Li O11 Dynamic Evo' }, // using available case
        ],
    },
    {
        id: 'high-end-1440p',
        tier: 'Enthusiast',
        title: 'The 1440p Sweet Spot',
        budget: '₹1,20,000 - ₹1,60,000',
        budgetMax: 160000,
        useCase: 'High refresh rate 1440p Gaming',
        icon: Zap,
        color: 'from-amber-500 to-orange-600',
        tagColor: 'bg-amber-100 text-amber-700',
        description: 'The optimal build for modern high-refresh 1440p monitors. The absolute best gaming processor paired with a powerful upper-midrange GPU.',
        highlights: ['Best gaming CPU (X3D)', '144+ FPS at 1440p', 'Premium AM5 Platform', 'Silent liquid cooling'],
        components: [
            { category: 'Processor', name: 'AMD Ryzen 7 7800X3D' },
            { category: 'Motherboard', name: 'Gigabyte X670 Aorus Elite' },
            { category: 'RAM', name: 'G.Skill Trident Z5 32GB' },
            { category: 'GPU', name: 'Sapphire Nitro+ RX 7800 XT' },
            { category: 'Storage', name: 'Samsung 990 Pro 1TB' },
            { category: 'Power Supply', name: 'Corsair RM850e' },
            { category: 'Cooler', name: 'DeepCool LS720' },
        ],
    },
    {
        id: 'no-compromise-4k',
        tier: 'Ultimate',
        title: 'No Compromise 4K',
        budget: '₹2,50,000+',
        budgetMax: Infinity,
        useCase: '4K Ultra Gaming, Max AI workloads',
        icon: Sparkles,
        color: 'from-slate-800 to-black',
        tagColor: 'bg-slate-200 text-slate-900',
        description: 'When money is no object. The absolute maximum performance available today for 4K gaming with ray tracing and heavy AI generation tasks.',
        highlights: ['Ultimate 4K performance', 'Top-tier Ray Tracing', '24GB VRAM for AI', 'Premium aesthetics'],
        components: [
            { category: 'Processor', name: 'Intel Core i9-14900K' },
            { category: 'Motherboard', name: 'MSI X670E Carbon' }, // High end board
            { category: 'RAM', name: 'G.Skill Trident Z5 32GB' },
            { category: 'GPU', name: 'NVIDIA RTX 4090' },
            { category: 'Storage', name: 'Samsung 990 Pro 1TB' },
            { category: 'Power Supply', name: 'MSI MPG A1000G' },
            { category: 'Cabinet', name: 'Cooler Master HAF 700 Evo' },
        ],
    }
];

// Budget filter options
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
// Helper functions
// -------------------------------------------------------------------
function getMatchedProductsForGuide(guide: Guide, products: any[]) {
    return guide.components.map(comp => {
        const searchTerms = comp.name.toLowerCase().split(' ').filter(word => word.length > 2);
        let matched = products.find(p => searchTerms.some(term => p.name.toLowerCase().includes(term)) && p.category.toLowerCase() === comp.category.toLowerCase());

        if (!matched) {
            matched = products.find(p => p.name.toLowerCase().includes(comp.name.toLowerCase()) || comp.name.toLowerCase().includes(p.name.toLowerCase()));
        }

        if (!matched && process.env.NODE_ENV === 'development') {
            console.warn(`[Build Guides] Could not find product match for component: ${comp.name} (${comp.category})`);
        }

        return {
            guideComponent: comp,
            matchedProduct: matched || null
        };
    });
}
// -------------------------------------------------------------------
// Guide Card
// -------------------------------------------------------------------
const GuideCard: React.FC<{ guide: Guide; products: any[]; onStartBuild: () => void }> = ({ guide, products, onStartBuild }) => {
    const [expanded, setExpanded] = useState(false);
    const Icon = guide.icon;
    const matchedProducts = useMemo(() => getMatchedProductsForGuide(guide, products), [guide, products]);
    const total = useMemo(() => matchedProducts.reduce((sum, item) => sum + (item.matchedProduct?.price || 0), 0), [matchedProducts]);

    return (
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
            {/* Card Header Gradient */}
            <div className={`bg-gradient-to-br ${guide.color} p-6 relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />
                <div className="relative flex items-start justify-between">
                    <div>
                        <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-2 bg-white/20 text-white`}>
                            {guide.tier}
                        </span>
                        <h3 className="text-xl font-bold text-white">{guide.title}</h3>
                        <p className="text-white/80 text-sm mt-0.5">{guide.useCase}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Icon size={22} className="text-white" />
                    </div>
                </div>
                <div className="relative mt-4 flex items-end justify-between">
                    <div>
                        <p className="text-white/60 text-xs font-medium">Est. Budget</p>
                        <p className="text-white font-bold text-lg">{guide.budget}</p>
                    </div>
                    <p className="text-white/70 text-sm font-medium">
                        ~₹{total.toLocaleString('en-IN')} total
                    </p>
                </div>
            </div>

            {/* Card Body */}
            <div className="p-5">
                <p className="text-sm text-zinc-600 leading-relaxed mb-4">{guide.description}</p>

                {/* Highlights */}
                <div className="grid grid-cols-2 gap-1.5 mb-4">
                    {guide.highlights.map((h) => (
                        <div key={h} className="flex items-center gap-1.5 text-xs text-zinc-600">
                            <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
                            {h}
                        </div>
                    ))}
                </div>

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
                        {matchedProducts.map(({ guideComponent: comp, matchedProduct }, i) => (
                            <div key={i} className="flex items-center justify-between text-xs px-3 py-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
                                <div className="min-w-0 pr-4">
                                    <span className="font-semibold text-zinc-500 uppercase text-[10px] tracking-wide block">{comp.category}</span>
                                    <span className="text-zinc-800 font-medium truncate block">{matchedProduct ? matchedProduct.name : comp.name}</span>
                                </div>
                                <span className="font-bold text-zinc-700 ml-4 flex-shrink-0">
                                    {matchedProduct ? `₹${matchedProduct.price.toLocaleString('en-IN')}` : <span className="text-red-500">Unavailable</span>}
                                </span>
                            </div>
                        ))}
                        <div className="flex justify-between px-3 py-2.5 bg-blue-50 rounded-lg border border-blue-100 text-sm font-bold text-blue-800">
                            <span>Estimated Total</span>
                            <span>₹{total.toLocaleString('en-IN')}</span>
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
    const { products, loadCart, setCartOpen } = useShop();
    const router = useRouter();

    const filtered = GUIDES.filter((g) => {
        const min = BUDGET_MIN[activeFilter];
        const max_f = BUDGET_FILTERS.find((f) => f.label === activeFilter)?.max ?? Infinity;
        return g.budgetMax > min && g.budgetMax <= max_f;
    });

    const handleStartBuild = (guide: Guide) => {
        const matched = getMatchedProductsForGuide(guide, products);
        const newCart = matched
            .filter(item => item.matchedProduct)
            .map(item => ({ ...item.matchedProduct, quantity: 1 }));

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
                                <GuideCard key={guide.id} guide={guide} products={products} onStartBuild={() => handleStartBuild(guide)} />
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
