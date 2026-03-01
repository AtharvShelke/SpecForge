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
        id: 'office-starter',
        tier: 'Entry',
        title: 'Office Starter',
        budget: 'Under ₹35,000',
        budgetMax: 35000,
        useCase: 'Productivity & Web',
        icon: Briefcase,
        color: 'from-slate-500 to-slate-700',
        tagColor: 'bg-slate-100 text-slate-700',
        description: 'The essential daily driver — fast boots, smooth browsing, and MS Office performance without breaking the bank.',
        highlights: ['Fast SSD boot', 'Integrated graphics', 'Low power consumption', 'Silent operation'],
        components: [
            { category: 'Processor', name: 'Intel Core i3-12100F' },
            { category: 'Motherboard', name: 'Gigabyte H610M S2H' },
            { category: 'RAM', name: 'Kingston Fury 8GB DDR4' },
            { category: 'Storage', name: 'Crucial P3 500GB NVMe' },
            { category: 'Power Supply', name: 'Cooler Master MWE 550 Bronze' },
            { category: 'Cabinet', name: 'Corsair 4000D Airflow' },
        ],
    },
    {
        id: 'budget-gaming',
        tier: 'Budget',
        title: 'Budget Gaming',
        budget: 'Under ₹55,000',
        budgetMax: 55000,
        useCase: '1080p Gaming',
        icon: Gamepad2,
        color: 'from-blue-500 to-indigo-600',
        tagColor: 'bg-blue-100 text-blue-700',
        description: 'Smooth 60–100 FPS in popular titles at 1080p. AMD Ryzen + RX 6600 is the sweet spot for budget builders.',
        highlights: ['60–100 FPS in popular titles', 'AMD efficient architecture', 'Upgradeable platform', 'Great price-to-performance'],
        components: [
            { category: 'Processor', name: 'AMD Ryzen 5 5600' },
            { category: 'Motherboard', name: 'MSI B550 Tomahawk' },
            { category: 'RAM', name: 'Corsair Vengeance LPX 16GB DDR4' },
            { category: 'GPU', name: 'Gigabyte RX 6600 Eagle 8GB' },
            { category: 'Storage', name: 'Samsung 990 Pro 1TB NVMe' },
            { category: 'Power Supply', name: 'Corsair RM850e' },
        ],
    },
    {
        id: 'mid-gaming',
        tier: 'Mid-Range',
        title: 'Mid-Range Gaming',
        budget: '₹80,000 – ₹1,00,000',
        budgetMax: 100000,
        useCase: '1440p Gaming',
        icon: Monitor,
        color: 'from-violet-500 to-purple-700',
        tagColor: 'bg-violet-100 text-violet-700',
        description: 'Buttery smooth 1440p gaming with 100+ FPS. Ryzen 7 7800X3D is the king CPU for gaming right now.',
        highlights: ['100+ FPS at 1440p', 'AMD 3D V-Cache tech', 'PCIe 5.0 ready', 'DDR5 platform'],
        components: [
            { category: 'Processor', name: 'AMD Ryzen 7 7800X3D' },
            { category: 'Motherboard', name: 'ASUS TUF B650-PLUS' },
            { category: 'RAM', name: 'G.Skill Trident Z5 32GB DDR5' },
            { category: 'GPU', name: 'Sapphire Nitro+ RX 7800 XT 16GB' },
            { category: 'Storage', name: 'Samsung 990 Pro 1TB' },
            { category: 'Power Supply', name: 'Corsair RM850e Gold' },
            { category: 'Cooler', name: 'DeepCool LS720 ARGB AIO' },
        ],
    },
    {
        id: 'content-creator',
        tier: 'Creator',
        title: 'Content Creator',
        budget: '₹1,10,000 – ₹1,30,000',
        budgetMax: 130000,
        useCase: 'Video Editing & Streaming',
        icon: Video,
        color: 'from-rose-500 to-pink-600',
        tagColor: 'bg-rose-100 text-rose-700',
        description: 'Built for DaVinci Resolve, Premiere Pro, and live streaming. High core count + fast RAM = snappy timelines.',
        highlights: ['16-core CPU for rendering', 'Fast 4K editing', 'Dual-channel DDR5', 'NVENC streaming support'],
        components: [
            { category: 'Processor', name: 'AMD Ryzen 9 7950X' },
            { category: 'Motherboard', name: 'ASUS ROG Strix X670E-E' },
            { category: 'RAM', name: 'G.Skill Trident Z5 32GB DDR5 6000MHz' },
            { category: 'GPU', name: 'Zotac RTX 4070 Twin Edge 12GB' },
            { category: 'Storage', name: 'Samsung 990 Pro 1TB + WD Blue 2TB' },
            { category: 'Power Supply', name: 'MSI MPG A1000G Gold' },
            { category: 'Cooler', name: 'DeepCool LS720 360mm AIO' },
        ],
    },
    {
        id: 'highend-gaming',
        tier: 'High-End',
        title: 'High-End Gaming',
        budget: '₹1,60,000 – ₹2,00,000',
        budgetMax: 200000,
        useCase: '4K Gaming & VR',
        icon: Sparkles,
        color: 'from-amber-500 to-orange-600',
        tagColor: 'bg-amber-100 text-amber-700',
        description: 'Uncompromised 4K gaming at ultra settings. RTX 4090 + i9 is the pinnacle of gaming performance in 2024.',
        highlights: ['4K Ultra 60+ FPS', 'VR-ready', 'PCIe 5.0 GPU slot', 'Full tower thermals'],
        components: [
            { category: 'Processor', name: 'Intel Core i9-14900K' },
            { category: 'Motherboard', name: 'MSI MAG Z790 Tomahawk WiFi' },
            { category: 'RAM', name: 'G.Skill Trident Z5 32GB DDR5' },
            { category: 'GPU', name: 'NVIDIA RTX 4090 Founders Edition 24GB' },
            { category: 'Storage', name: 'Samsung 990 Pro 1TB + WD 2TB' },
            { category: 'Power Supply', name: 'MSI MPG A1000G Gold 1000W' },
            { category: 'Cooler', name: 'DeepCool LS720 360mm AIO' },
        ],
    },
    {
        id: 'workstation-pro',
        tier: 'Pro',
        title: 'Workstation Pro',
        budget: '₹2,00,000 – ₹2,80,000',
        budgetMax: 280000,
        useCase: '3D / AI / CAD',
        icon: Cpu,
        color: 'from-teal-500 to-cyan-700',
        tagColor: 'bg-teal-100 text-teal-700',
        description: 'Threadripper-class performance for 3D rendering, scientific computing, AI model training, and CAD.',
        highlights: ['24-core HEDT CPU', 'Massive multi-thread performance', 'ECC-capable', 'Extreme storage throughput'],
        components: [
            { category: 'Processor', name: 'AMD Ryzen Threadripper 7960X' },
            { category: 'Motherboard', name: 'ASUS ROG Strix X670E-E Gaming' },
            { category: 'RAM', name: 'G.Skill Trident Z5 32GB DDR5 6000MHz (×2)' },
            { category: 'GPU', name: 'NVIDIA RTX 4090 24GB' },
            { category: 'Storage', name: 'Samsung 990 Pro 1TB (×2) + WD 2TB' },
            { category: 'Power Supply', name: 'MSI MPG A1000G Gold 1000W' },
            { category: 'Cooler', name: 'EKWB Quantum Velocity + Corsair XD5' },
        ],
    },
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
