'use client';

import React, { useState } from 'react';
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

// -------------------------------------------------------------------
// Guide Data
// -------------------------------------------------------------------

interface GuideComponent {
    category: string;
    name: string;
    approxPrice: number;
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
            { category: 'Processor', name: 'Intel Core i3-12100F', approxPrice: 9000 },
            { category: 'Motherboard', name: 'Gigabyte H610M S2H', approxPrice: 7000 },
            { category: 'RAM', name: 'Kingston Fury 8GB DDR4', approxPrice: 2500 },
            { category: 'Storage', name: 'Crucial P3 500GB NVMe', approxPrice: 3500 },
            { category: 'Power Supply', name: 'Cooler Master MWE 550 Bronze', approxPrice: 4500 },
            { category: 'Cabinet', name: 'Corsair 4000D Airflow', approxPrice: 7000 },
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
            { category: 'Processor', name: 'AMD Ryzen 5 5600', approxPrice: 12500 },
            { category: 'Motherboard', name: 'MSI B550 Tomahawk', approxPrice: 14500 },
            { category: 'RAM', name: 'Corsair Vengeance LPX 16GB DDR4', approxPrice: 4500 },
            { category: 'GPU', name: 'Gigabyte RX 6600 Eagle 8GB', approxPrice: 19500 },
            { category: 'Storage', name: 'Samsung 990 Pro 1TB NVMe', approxPrice: 10500 },
            { category: 'Power Supply', name: 'Corsair RM850e', approxPrice: 11000 },
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
            { category: 'Processor', name: 'AMD Ryzen 7 7800X3D', approxPrice: 36000 },
            { category: 'Motherboard', name: 'ASUS TUF B650-PLUS', approxPrice: 19000 },
            { category: 'RAM', name: 'G.Skill Trident Z5 32GB DDR5', approxPrice: 12500 },
            { category: 'GPU', name: 'Sapphire Nitro+ RX 7800 XT 16GB', approxPrice: 52000 },
            { category: 'Storage', name: 'Samsung 990 Pro 1TB', approxPrice: 10500 },
            { category: 'Power Supply', name: 'Corsair RM850e Gold', approxPrice: 11000 },
            { category: 'Cooler', name: 'DeepCool LS720 ARGB AIO', approxPrice: 11000 },
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
            { category: 'Processor', name: 'AMD Ryzen 9 7950X', approxPrice: 52000 },
            { category: 'Motherboard', name: 'ASUS ROG Strix X670E-E', approxPrice: 42000 },
            { category: 'RAM', name: 'G.Skill Trident Z5 32GB DDR5 6000MHz', approxPrice: 12500 },
            { category: 'GPU', name: 'Zotac RTX 4070 Twin Edge 12GB', approxPrice: 56000 },
            { category: 'Storage', name: 'Samsung 990 Pro 1TB + WD Blue 2TB', approxPrice: 15300 },
            { category: 'Power Supply', name: 'MSI MPG A1000G Gold', approxPrice: 16000 },
            { category: 'Cooler', name: 'DeepCool LS720 360mm AIO', approxPrice: 11000 },
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
            { category: 'Processor', name: 'Intel Core i9-14900K', approxPrice: 55000 },
            { category: 'Motherboard', name: 'MSI MAG Z790 Tomahawk WiFi', approxPrice: 28000 },
            { category: 'RAM', name: 'G.Skill Trident Z5 32GB DDR5', approxPrice: 12500 },
            { category: 'GPU', name: 'NVIDIA RTX 4090 Founders Edition 24GB', approxPrice: 185000 },
            { category: 'Storage', name: 'Samsung 990 Pro 1TB + WD 2TB', approxPrice: 15300 },
            { category: 'Power Supply', name: 'MSI MPG A1000G Gold 1000W', approxPrice: 16000 },
            { category: 'Cooler', name: 'DeepCool LS720 360mm AIO', approxPrice: 11000 },
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
            { category: 'Processor', name: 'AMD Ryzen Threadripper 7960X', approxPrice: 135000 },
            { category: 'Motherboard', name: 'ASUS ROG Strix X670E-E Gaming', approxPrice: 42000 },
            { category: 'RAM', name: 'G.Skill Trident Z5 32GB DDR5 6000MHz (×2)', approxPrice: 25000 },
            { category: 'GPU', name: 'NVIDIA RTX 4090 24GB', approxPrice: 185000 },
            { category: 'Storage', name: 'Samsung 990 Pro 1TB (×2) + WD 2TB', approxPrice: 25800 },
            { category: 'Power Supply', name: 'MSI MPG A1000G Gold 1000W', approxPrice: 16000 },
            { category: 'Cooler', name: 'EKWB Quantum Velocity + Corsair XD5', approxPrice: 24000 },
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
// Guide Card
// -------------------------------------------------------------------
const GuideCard: React.FC<{ guide: Guide }> = ({ guide }) => {
    const [expanded, setExpanded] = useState(false);
    const Icon = guide.icon;
    const total = guide.components.reduce((s, c) => s + c.approxPrice, 0);

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
                        {guide.components.map((comp, i) => (
                            <div key={i} className="flex items-center justify-between text-xs px-3 py-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
                                <div>
                                    <span className="font-semibold text-zinc-500 uppercase text-[10px] tracking-wide block">{comp.category}</span>
                                    <span className="text-zinc-800 font-medium">{comp.name}</span>
                                </div>
                                <span className="font-bold text-zinc-700 ml-4 flex-shrink-0">₹{comp.approxPrice.toLocaleString('en-IN')}</span>
                            </div>
                        ))}
                        <div className="flex justify-between px-3 py-2.5 bg-blue-50 rounded-lg border border-blue-100 text-sm font-bold text-blue-800">
                            <span>Estimated Total</span>
                            <span>₹{total.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                )}

                {/* CTA */}
                <Link
                    href="/products?mode=build"
                    className="w-full flex items-center justify-center gap-2 h-11 bg-zinc-900 hover:bg-zinc-800
            text-white font-semibold rounded-xl text-sm transition-all"
                >
                    Start This Build <ArrowRight size={15} />
                </Link>
            </div>
        </div>
    );
};

// -------------------------------------------------------------------
// Main Page
// -------------------------------------------------------------------
export default function BuildGuidesPage() {
    const [activeFilter, setActiveFilter] = useState<BudgetLabel>('All Builds');

    const filtered = GUIDES.filter((g) => {
        const min = BUDGET_MIN[activeFilter];
        const max_f = BUDGET_FILTERS.find((f) => f.label === activeFilter)?.max ?? Infinity;
        return g.budgetMax > min && g.budgetMax <= max_f;
    });

    return (
        <div className="min-h-screen bg-zinc-50">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; }
        h1,h2,h3,h4 { font-family: 'Space Grotesk', 'Inter', sans-serif; letter-spacing: -0.025em; }
        .animate-in { animation: slideDown 0.2s ease-out; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

            {/* Hero */}
            <div className="bg-white border-b border-zinc-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                            <BookOpen size={12} /> Expert Guides
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-3">
                            PC Build Guides
                        </h1>
                        <p className="text-zinc-500 text-base leading-relaxed">
                            Curated PC builds for every budget and use-case — hand-picked by our experts.
                            Click "Start This Build" to jump straight into Build Mode with the right category pre-selected.
                        </p>
                    </div>

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
                </div>
            </div>

            {/* Guide Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
                                <GuideCard key={guide.id} guide={guide} />
                            ))}
                        </div>
                    </>
                )}

                {/* Bottom CTA */}
                <div className="mt-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 sm:p-10 text-center">
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
            </div>
        </div>
    );
}
