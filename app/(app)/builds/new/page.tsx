'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useShop } from '@/context/ShopContext';
import { useBuild } from '@/context/BuildContext';
import { validateBuild } from '@/services/compatibility';
import { BUILD_SEQUENCE } from '@/data/categoryTree';
import {
    Category, CATEGORY_LABELS, Product, CartItem, CompatibilityLevel, specsToFlat,
} from '@/types';
import {
    Cpu, Monitor, HardDrive, Zap, Box, Fan, Keyboard, Wifi,
    Check, X, AlertTriangle, AlertOctagon, CheckCircle2,
    Plus, ArrowRight, ArrowLeft, ChevronDown, ChevronUp, ChevronRight,
    Search, XCircle, Share2, Save, Copy, ShoppingCart, Trash2,
    Filter, SlidersHorizontal, RotateCcw, Sparkles, Download,
    Layers, Eye, EyeOff, ChevronLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

// ─── Constants ──────────────────────────────────────────────────────────
const CORE_BUILD_CATEGORIES = [
    Category.PROCESSOR,
    Category.MOTHERBOARD,
    Category.RAM,
    Category.GPU,
    Category.STORAGE,
    Category.PSU,
    Category.CABINET,
    Category.COOLER,
];

const CATEGORY_ICONS: Record<string, React.FC<{ size?: number; className?: string; style?: React.CSSProperties; color?: string }>> = {
    [Category.PROCESSOR]: Cpu,
    [Category.MOTHERBOARD]: Layers,
    [Category.RAM]: HardDrive,
    [Category.GPU]: Monitor,
    [Category.STORAGE]: HardDrive,
    [Category.PSU]: Zap,
    [Category.CABINET]: Box,
    [Category.COOLER]: Fan,
    [Category.MONITOR]: Monitor,
    [Category.PERIPHERAL]: Keyboard,
    [Category.NETWORKING]: Wifi,
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
    [Category.PROCESSOR]: 'The brain of your PC. Choose between AMD and Intel.',
    [Category.MOTHERBOARD]: 'Connects all components. Must match CPU socket.',
    [Category.RAM]: 'System memory. Must match motherboard DDR type.',
    [Category.GPU]: 'Graphics card for gaming and creative work.',
    [Category.STORAGE]: 'SSDs and HDDs to store your data.',
    [Category.PSU]: 'Power supply. Must handle total system wattage.',
    [Category.CABINET]: 'The case. Must fit your motherboard and GPU.',
    [Category.COOLER]: 'Keep your CPU cool under load.',
};

const CATEGORY_ACCENT: Record<string, string> = {
    [Category.PROCESSOR]: '#3b82f6',
    [Category.MOTHERBOARD]: '#8b5cf6',
    [Category.RAM]: '#06b6d4',
    [Category.GPU]: '#f59e0b',
    [Category.STORAGE]: '#10b981',
    [Category.PSU]: '#ef4444',
    [Category.CABINET]: '#6366f1',
    [Category.COOLER]: '#ec4899',
};

// ─── Power Estimation ───────────────────────────────────────────────────
function estimateWattage(cart: CartItem[]): number {
    let total = 50;
    for (const item of cart) {
        const specs = specsToFlat(item.specs);
        const w = Number(specs.wattage);
        if (!isNaN(w) && w > 0) {
            total += w * item.quantity;
        } else {
            if (item.category === Category.PROCESSOR) total += 65;
            if (item.category === Category.GPU) total += 150;
            if (item.category === Category.RAM) total += 5 * item.quantity;
            if (item.category === Category.STORAGE) total += 5 * item.quantity;
        }
    }
    return total;
}

function getPsuCapacity(cart: CartItem[]): number | null {
    const psu = cart.find(i => i.category === Category.PSU);
    if (!psu) return null;
    const specs = specsToFlat(psu.specs);
    const w = Number(specs.wattage);
    return isNaN(w) ? null : w;
}

// ─── Animated Price ─────────────────────────────────────────────────────
const AnimatedPrice: React.FC<{ value: number; prefix?: string }> = ({ value, prefix = '₹' }) => {
    const [display, setDisplay] = useState(value);
    const prevRef = useRef(value);

    useEffect(() => {
        const from = prevRef.current;
        const to = value;
        if (from === to) return;
        const steps = 20;
        const diff = to - from;
        let step = 0;
        const interval = setInterval(() => {
            step++;
            setDisplay(Math.round(from + diff * (step / steps)));
            if (step >= steps) {
                clearInterval(interval);
                prevRef.current = to;
            }
        }, 16);
        return () => clearInterval(interval);
    }, [value]);

    return <>{prefix}{display.toLocaleString('en-IN')}</>;
};

// ─── Starter Templates ─────────────────────────────────────────────────
interface StarterTemplate {
    id: string;
    title: string;
    subtitle: string;
    budget: string;
    color: string;
    icon: React.FC<{ size?: number; className?: string; style?: React.CSSProperties; color?: string }>;
    tag: string;
}

const STARTER_TEMPLATES: StarterTemplate[] = [
    { id: 'budget', title: 'Budget Gaming', subtitle: '1080p • Esports Ready', budget: '~₹50K', color: '#3b82f6', icon: Sparkles, tag: 'Best Value' },
    { id: 'midrange', title: '1440p Sweet Spot', subtitle: 'High Refresh • AAA Ready', budget: '~₹1.2L', color: '#8b5cf6', icon: Zap, tag: 'Most Popular' },
    { id: 'creator', title: 'Creator Workstation', subtitle: 'Video Editing • 3D Render', budget: '~₹1.5L', color: '#f59e0b', icon: Monitor, tag: 'Pro Pick' },
    { id: 'highend', title: 'No Compromise 4K', subtitle: 'Max Settings • Ray Tracing', budget: '~₹2.5L+', color: '#ef4444', icon: Sparkles, tag: 'Flagship' },
];

// ─── Product Card ────────────────────────────────────────────────────────
const ProductCard: React.FC<{
    product: Product;
    isInCart: boolean;
    compatibility: CompatibilityLevel;
    compatMessage?: string;
    onAdd: () => void;
    onRemove: () => void;
}> = ({ product, isInCart, compatibility, compatMessage, onAdd, onRemove }) => {
    const price = product.variants?.[0]?.price || 0;
    const comparePrice = product.variants?.[0]?.compareAtPrice;
    const specs = specsToFlat(product.specs);
    const specEntries = Object.entries(specs).slice(0, 3);
    const isIncompatible = compatibility === CompatibilityLevel.INCOMPATIBLE;

    const statusConfig = {
        [CompatibilityLevel.COMPATIBLE]: { dot: 'bg-emerald-400', text: 'Compatible', textColor: 'text-emerald-400' },
        [CompatibilityLevel.WARNING]: { dot: 'bg-amber-400', text: 'Warning', textColor: 'text-amber-400' },
        [CompatibilityLevel.INCOMPATIBLE]: { dot: 'bg-red-400', text: 'Incompatible', textColor: 'text-red-400' },
    }[compatibility];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: isIncompatible ? 0.5 : 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`group relative bg-white border rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer
                ${isInCart
                    ? 'border-blue-500/60 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                    : isIncompatible
                        ? 'border-zinc-200'
                        : 'border-zinc-200 hover:border-zinc-950/25 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
                }`}
            onClick={isInCart ? onRemove : (isIncompatible ? undefined : onAdd)}
        >
            {/* Image */}
            <div className="relative aspect-square bg-[#fff] overflow-hidden">
                <Image
                    src={product.media?.[0]?.url || '/placeholder.png'}
                    alt={product.name}
                    fill
                    className="object-contain p-5 transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 200px"
                    loading="lazy"
                />
                {/* Status badge */}
                {!isInCart && (
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                        <span className={`text-[10px] font-semibold ${statusConfig.textColor}`}>{statusConfig.text}</span>
                    </div>
                )}
                {isInCart && (
                    <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check size={18} strokeWidth={2.5} className="text-zinc-950" />
                        </div>
                    </div>
                )}
                {comparePrice && comparePrice > price && (
                    <div className="absolute top-2.5 right-2.5 bg-red-500 text-zinc-950 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                        SALE
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-3.5">
                <h4 className="text-[13px] font-semibold text-zinc-950 line-clamp-2 leading-snug mb-2.5">
                    {product.name}
                </h4>

                {/* Specs */}
                <div className="flex flex-wrap gap-1 mb-3">
                    {specEntries.map(([k, v]) => (
                        <span key={k} className="text-[10px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded-md font-mono">
                            {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </span>
                    ))}
                </div>

                {/* Price + Action */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-base font-bold text-zinc-950">₹{price.toLocaleString('en-IN')}</p>
                        {comparePrice && comparePrice > price && (
                            <p className="text-[10px] text-zinc-400 line-through">₹{comparePrice.toLocaleString('en-IN')}</p>
                        )}
                    </div>

                    {isInCart ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemove(); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-red-400 bg-red-400/10 hover:bg-red-400/20 border border-red-400/20 rounded-xl transition-colors"
                        >
                            <X size={11} /> Remove
                        </button>
                    ) : (
                        <button
                            onClick={(e) => { e.stopPropagation(); if (!isIncompatible) onAdd(); }}
                            disabled={isIncompatible}
                            className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-xl border transition-all ${isIncompatible
                                ? 'text-zinc-300 border-zinc-200 cursor-not-allowed'
                                : 'text-zinc-950 bg-zinc-100 hover:bg-zinc-200 border-zinc-200 hover:border-zinc-950/25'
                                }`}
                        >
                            <Plus size={11} /> Select
                        </button>
                    )}
                </div>

                {compatMessage && !isInCart && (
                    <p className={`mt-2 text-[10px] leading-tight px-2 py-1.5 rounded-lg ${compatibility === CompatibilityLevel.WARNING
                        ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                        : 'bg-red-400/10 text-red-400 border border-red-400/20'
                        }`}>
                        {compatMessage}
                    </p>
                )}
            </div>
        </motion.div>
    );
};

// ─── Build Summary Right Panel ───────────────────────────────────────────
const BuildSummaryPanel: React.FC<{
    cart: CartItem[];
    onRemove: (id: string) => void;
    onStepClick: (cat: Category) => void;
    activeStep: Category;
    onSave: () => void;
    onShare: () => void;
    onCheckout: () => void;
}> = ({ cart, onRemove, onStepClick, activeStep, onSave, onShare, onCheckout }) => {
    const report = useMemo(() => validateBuild(cart), [cart]);
    const totalPrice = useMemo(() => cart.reduce((s, i) => s + (i.selectedVariant?.price || 0) * i.quantity, 0), [cart]);
    const wattage = useMemo(() => estimateWattage(cart), [cart]);
    const psuCap = useMemo(() => getPsuCapacity(cart), [cart]);
    const wattPct = psuCap ? Math.min((wattage / psuCap) * 100, 100) : Math.min((wattage / 800) * 100, 100);
    const completedCount = CORE_BUILD_CATEGORIES.filter(cat => cart.some(i => i.category === cat)).length;
    const isIncompat = report.status === CompatibilityLevel.INCOMPATIBLE;
    const progress = (completedCount / CORE_BUILD_CATEGORIES.length) * 100;

    return (
        <div className="flex flex-col h-full text-zinc-950">
            {/* Header */}
            <div className="p-5 border-b border-zinc-200 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-zinc-950 text-sm tracking-wide uppercase">Your Build</h3>
                    <span className="text-xs font-bold px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded-full">
                        {completedCount}/{CORE_BUILD_CATEGORIES.length}
                    </span>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-zinc-100 rounded-full mb-4 overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                        initial={false}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                </div>

                {/* Total */}
                <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-2xl font-black text-zinc-950 tracking-tight">
                        <AnimatedPrice value={totalPrice} />
                    </span>
                </div>
                <p className="text-xs text-zinc-500">{cart.length === 0 ? 'No components selected' : `${cart.length} component${cart.length > 1 ? 's' : ''} selected`}</p>

                {/* Compatibility status */}
                {cart.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${report.status === CompatibilityLevel.INCOMPATIBLE
                            ? 'bg-red-500/10 border-red-500/30 text-red-400'
                            : report.status === CompatibilityLevel.WARNING
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            }`}
                    >
                        {report.status === CompatibilityLevel.INCOMPATIBLE ? <AlertOctagon size={13} /> :
                            report.status === CompatibilityLevel.WARNING ? <AlertTriangle size={13} /> :
                                <CheckCircle2 size={13} />}
                        {report.status === CompatibilityLevel.COMPATIBLE
                            ? 'All components compatible'
                            : `${report.issues.length} issue${report.issues.length > 1 ? 's' : ''} detected`}
                    </motion.div>
                )}
            </div>

            {/* Component list */}
            <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                {CORE_BUILD_CATEGORIES.map((cat) => {
                    const item = cart.find(i => i.category === cat);
                    const Icon = CATEGORY_ICONS[cat] || Box;
                    const isActive = activeStep === cat;
                    const accent = CATEGORY_ACCENT[cat] || '#3b82f6';

                    return (
                        <motion.div
                            key={cat}
                            role="button"
                            tabIndex={0}
                            onClick={() => onStepClick(cat)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStepClick(cat); } }}
                            className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left group cursor-pointer
                                ${isActive ? 'bg-zinc-100' : 'hover:bg-zinc-100'}`}
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                                ${item ? 'bg-zinc-200' : 'bg-zinc-100'}`}
                                style={item ? { backgroundColor: `${accent}22`, border: `1px solid ${accent}44` } : {}}
                            >
                                {item ? <Check size={12} strokeWidth={3} style={{ color: accent }} /> : <Icon size={12} className="text-zinc-400" />}
                            </div>

                            <div className="flex-1 min-w-0">
                                {item ? (
                                    <>
                                        <p className="text-[11px] text-zinc-500 uppercase tracking-wide">{CATEGORY_LABELS[cat] || cat}</p>
                                        <p className="text-xs font-semibold text-zinc-950 truncate leading-tight">{item.name}</p>
                                    </>
                                ) : (
                                    <p className="text-xs font-medium text-zinc-400">{CATEGORY_LABELS[cat] || cat}</p>
                                )}
                            </div>

                            {item ? (
                                <div className="flex-shrink-0 text-right">
                                    <p className="text-xs font-bold text-zinc-950">₹{((item.selectedVariant?.price || 0) * item.quantity).toLocaleString('en-IN')}</p>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                                        className="text-[10px] text-zinc-300 hover:text-red-400 transition-colors"
                                    >
                                        remove
                                    </button>
                                </div>
                            ) : (
                                <Plus size={13} className="text-zinc-300 group-hover:text-zinc-500 transition-colors flex-shrink-0" />
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Power section */}
            {cart.length > 0 && (
                <div className="px-4 py-3 border-t border-zinc-200 flex-shrink-0">
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <span className="text-zinc-500 font-medium">Est. Power Draw</span>
                        <span className={`font-bold ${psuCap && wattage > psuCap ? 'text-red-400' : wattage > (psuCap || 800) * 0.8 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            ~{wattage}W {psuCap ? <span className="text-zinc-400 font-normal">of {psuCap}W PSU</span> : ''}
                        </span>
                    </div>
                    <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                        <motion.div
                            className={`h-full rounded-full ${psuCap && wattage > psuCap ? 'bg-red-500' : wattage > (psuCap || 800) * 0.8 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            initial={false}
                            animate={{ width: `${wattPct}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                </div>
            )}

            {/* Issues */}
            {report.issues.length > 0 && (
                <div className="px-3 pb-2 flex-shrink-0 max-h-36 overflow-y-auto space-y-1.5">
                    {report.issues.map((issue, i) => (
                        <div key={i} className={`px-3 py-2 rounded-xl border text-[10px] leading-relaxed ${issue.level === CompatibilityLevel.INCOMPATIBLE
                            ? 'bg-red-500/10 border-red-500/20 text-red-400'
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                            }`}>
                            <p className="font-semibold">{issue.message}</p>
                            {issue.resolution && <p className="mt-0.5 opacity-70">{issue.resolution}</p>}
                        </div>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="p-3 border-t border-zinc-200 flex-shrink-0 space-y-2">
                <div className="flex gap-2">
                    <button onClick={onSave} className="flex-1 flex items-center justify-center gap-1.5 h-9 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl border border-zinc-200 transition-colors">
                        <Save size={12} /> Save
                    </button>
                    <button onClick={onShare} className="flex-1 flex items-center justify-center gap-1.5 h-9 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl border border-zinc-200 transition-colors">
                        <Share2 size={12} /> Share
                    </button>
                </div>
                <motion.button
                    onClick={onCheckout}
                    disabled={isIncompat || cart.length === 0}
                    className={`w-full flex items-center justify-center gap-2 h-11 font-bold rounded-xl text-sm transition-all ${isIncompat || cart.length === 0
                        ? 'bg-zinc-100 text-zinc-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-zinc-950 hover:from-blue-400 hover:to-cyan-400 shadow-lg shadow-blue-500/20'
                        }`}
                    whileTap={!isIncompat && cart.length > 0 ? { scale: 0.97 } : {}}
                >
                    <ShoppingCart size={15} />
                    {cart.length === 0 ? 'Start Building' : 'Add Build to Cart'}
                </motion.button>
            </div>
        </div>
    );
};

// ─── Mobile Drawer ────────────────────────────────────────────────────────
const MobileBuildDrawer: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    cart: CartItem[];
    onRemove: (id: string) => void;
    onStepClick: (cat: Category) => void;
    activeStep: Category;
    onSave: () => void;
    onShare: () => void;
    onCheckout: () => void;
}> = ({ isOpen, onClose, ...rest }) => (
    <AnimatePresence>
        {isOpen && (
            <>
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 lg:hidden"
                    onClick={onClose}
                />
                <motion.div
                    initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                    className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-zinc-200 rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col"
                >
                    <div className="flex items-center justify-center py-3 flex-shrink-0">
                        <div className="w-10 h-1 bg-zinc-200 rounded-full" />
                    </div>
                    <BuildSummaryPanel {...rest} />
                </motion.div>
            </>
        )}
    </AnimatePresence>
);

// ─── Save Dialog ─────────────────────────────────────────────────────────
const SaveBuildDialog: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (title: string) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const [title, setTitle] = useState('My Custom Build');
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative bg-white border border-zinc-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl"
            >
                <h3 className="text-lg font-black text-zinc-950 mb-1">Save Build</h3>
                <p className="text-xs text-zinc-500 mb-5">Give your build a name to save it to your account.</p>
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Ultimate Gaming Rig"
                    className="w-full h-11 px-4 bg-zinc-100 border border-zinc-200 rounded-xl text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 mb-4 transition-all"
                    autoFocus
                />
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 h-10 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-500 hover:bg-zinc-100 transition-colors">Cancel</button>
                    <button onClick={() => { onSave(title); onClose(); }} className="flex-1 h-10 bg-blue-500 hover:bg-blue-400 text-zinc-950 rounded-xl text-sm font-bold transition-colors">Save</button>
                </div>
            </motion.div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════
export default function PCBuilderPage() {
    const router = useRouter();
    const { cart, addToCart, removeFromCart, cartTotal, setCartOpen } = useShop();
    const { isBuildMode, toggleBuildMode, saveCurrentBuild, generateShareLink, compatibilityReport } = useBuild();
    const { toast } = useToast();

    const [activeStep, setActiveStep] = useState<Category>(Category.PROCESSOR);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [showIncompat, setShowIncompat] = useState(false);
    const [sortOption, setSortOption] = useState('popularity');
    const [isMobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [isSaveDialogOpen, setSaveDialogOpen] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const prevParamsRef = useRef('');

    useEffect(() => { if (!isBuildMode) toggleBuildMode(); }, []);

    useEffect(() => {
        if (cart.length > 0) {
            setHasStarted(true);
            const firstEmpty = CORE_BUILD_CATEGORIES.find(cat => !cart.some(i => i.category === cat));
            if (firstEmpty) setActiveStep(firstEmpty);
        }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(t);
    }, [searchTerm]);

    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoading(true);
            try {
                const params = new URLSearchParams();
                params.set('category', activeStep);
                params.set('limit', '48');
                params.set('page', '1');
                if (debouncedSearch) params.set('q', debouncedSearch);
                if (sortOption !== 'popularity') params.set('sort', sortOption);

                const cpu = cart.find(i => i.category === Category.PROCESSOR);
                const mobo = cart.find(i => i.category === Category.MOTHERBOARD);
                const cpuSpecs = cpu ? specsToFlat(cpu.specs) : null;
                const moboSpecs = mobo ? specsToFlat(mobo.specs) : null;

                if (!showIncompat) {
                    if (activeStep === Category.MOTHERBOARD && cpuSpecs?.socket) params.set('f_specs.socket', String(cpuSpecs.socket));
                    if (activeStep === Category.PROCESSOR && moboSpecs?.socket) params.set('f_specs.socket', String(moboSpecs.socket));
                    if (activeStep === Category.RAM && (cpuSpecs || moboSpecs)) {
                        const type = moboSpecs?.ramType || cpuSpecs?.ramType;
                        if (type) params.set('f_specs.ramType', String(type));
                    }
                }

                params.sort();
                const queryString = params.toString();
                if (prevParamsRef.current === queryString) { setIsLoading(false); return; }
                prevParamsRef.current = queryString;

                const res = await fetch(`/api/products?${queryString}`);
                const data = await res.json();
                if (data.products) setProducts(data.products);
            } catch (err) {
                console.error('Failed to fetch products:', err);
            } finally {
                setIsLoading(false);
            }
        };
        if (hasStarted) fetchProducts();
    }, [activeStep, debouncedSearch, sortOption, cart, showIncompat, hasStarted]);

    const handleAddComponent = useCallback((product: Product) => {
        addToCart(product);
        setTimeout(() => {
            const nextEmpty = CORE_BUILD_CATEGORIES.find(cat =>
                cat !== product.category && !cart.some(i => i.category === cat)
            );
            if (nextEmpty) setActiveStep(nextEmpty);
        }, 100);
    }, [addToCart, cart]);

    const handleRemoveComponent = useCallback((productId: string) => removeFromCart(productId), [removeFromCart]);
    const handleStepClick = useCallback((cat: Category) => { setActiveStep(cat); setSearchTerm(''); prevParamsRef.current = ''; }, []);

    const checkProductCompat = useCallback((product: Product) => {
        if (cart.some(i => i.id === product.id)) return { level: CompatibilityLevel.COMPATIBLE, message: '' };
        const hypothetical = [...cart.filter(i => i.category !== product.category), { ...product, quantity: 1, selectedVariant: product.variants?.[0] || {} as any }];
        const report = validateBuild(hypothetical as CartItem[]);
        const relevantIssues = report.issues.filter(iss => iss.componentIds.includes(product.id));
        return {
            level: relevantIssues.length > 0
                ? relevantIssues.some(i => i.level === CompatibilityLevel.INCOMPATIBLE) ? CompatibilityLevel.INCOMPATIBLE : CompatibilityLevel.WARNING
                : CompatibilityLevel.COMPATIBLE,
            message: relevantIssues[0]?.message || '',
        };
    }, [cart]);

    const handleSave = useCallback((title: string) => saveCurrentBuild(title), [saveCurrentBuild]);
    const handleShare = useCallback(async () => {
        const link = generateShareLink();
        if (!link) {
            toast({ title: 'Nothing to share', description: 'Add components to your build first.', variant: 'destructive' });
            return;
        }
        try {
            await navigator.clipboard.writeText(link);
            toast({ title: 'Link copied!', description: 'Share this link with anyone to load your build.' });
        } catch {
            // Fallback for HTTP contexts
            const textarea = document.createElement('textarea');
            textarea.value = link;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            toast({ title: 'Link copied!', description: 'Share this link with anyone to load your build.' });
        }
    }, [generateShareLink, toast]);
    const handleCheckout = useCallback(() => setCartOpen(true), [setCartOpen]);

    const completedCount = CORE_BUILD_CATEGORIES.filter(cat => cart.some(i => i.category === cat)).length;
    const totalPrice = cart.reduce((s, i) => s + (i.selectedVariant?.price || 0) * i.quantity, 0);
    const compatibilityReport2 = useMemo(() => validateBuild(cart), [cart]);
    const ActiveCatIcon = CATEGORY_ICONS[activeStep] || Box;
    const activeCatAccent = CATEGORY_ACCENT[activeStep] || '#3b82f6';

    // ─── Global styles ────────────────────────────────────────────────
    const globalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
    
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }
`;

    // ═══════════════════════════════════════════════════════════════════════
    // LANDING VIEW
    // ═══════════════════════════════════════════════════════════════════════
    if (!hasStarted) {
        return (
            <div className="min-h-screen bg-zinc-50 font-sans text-zinc-950 overflow-x-hidden">
                <style>{globalStyles}</style>

                {/* Hero */}
                <section className="relative min-h-[85vh] flex flex-col items-center justify-center px-6 grid-dots overflow-hidden">
                    {/* Ambient glow */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/8 blur-[100px]" />
                        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-600/6 blur-[80px]" />
                    </div>

                    <div className="relative z-10 max-w-4xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2 bg-zinc-100 backdrop-blur text-zinc-600 text-[11px] font-semibold px-4 py-2 rounded-full mb-8 border border-zinc-200 font-mono uppercase tracking-widest"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Live Compatibility Engine
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="heading-font text-5xl sm:text-6xl lg:text-7xl font-black mb-5 leading-[0.95]"
                        >
                            Build Your
                            <br />
                            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                                Dream PC.
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="text-zinc-500 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed font-light"
                        >
                            Select components one by one. Compatibility is checked in real time — no guesswork, no mistakes.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16"
                        >
                            <motion.button
                                onClick={() => setHasStarted(true)}
                                className="group flex items-center gap-2 bg-white text-black text-sm font-bold px-8 py-3.5 rounded-2xl hover:bg-white/90 transition-all shadow-lg shadow-white/10"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Start from Scratch
                                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                            </motion.button>
                        </motion.div>

                        {/* Feature pills */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="flex flex-wrap items-center justify-center gap-2"
                        >
                            {['Socket Check', 'RAM Compatibility', 'GPU Clearance', 'Power Estimation', 'Form Factor Fit'].map(f => (
                                <span key={f} className="text-[11px] text-zinc-400 bg-zinc-100 border border-zinc-200 px-3 py-1 rounded-full font-mono">
                                    {f}
                                </span>
                            ))}
                        </motion.div>
                    </div>

                    {/* Scroll indicator */}
                    <motion.div
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-300"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                    >
                        <ChevronDown size={16} className="animate-bounce" />
                    </motion.div>
                </section>

                {/* Start templates */}
                <section className="py-16 px-6 max-w-6xl mx-auto">
                    <div className="text-center mb-10">
                        <p className="text-zinc-400 font-mono text-[11px] uppercase tracking-widest mb-3">Or start with a template</p>
                        <h2 className="heading-font text-3xl font-bold text-zinc-950">Choose your use case</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {STARTER_TEMPLATES.map((t, i) => (
                            <motion.button
                                key={t.id}
                                onClick={() => { setHasStarted(true); setActiveStep(Category.PROCESSOR); }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * i }}
                                className="group relative bg-white border border-zinc-200 rounded-2xl p-5 text-left hover:border-zinc-950/25 transition-all overflow-hidden"
                                whileHover={{ y: -4 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {/* Glow */}
                                <div className="absolute top-0 left-0 w-full h-0.5 opacity-60 transition-opacity group-hover:opacity-100 rounded-t-2xl"
                                    style={{ background: `linear-gradient(90deg, transparent, ${t.color}, transparent)` }} />

                                <div className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center"
                                    style={{ background: `${t.color}18`, border: `1px solid ${t.color}30` }}>
                                    <t.icon size={18} style={{ color: t.color }} />
                                </div>

                                <span className="text-[10px] font-mono font-semibold uppercase tracking-widest mb-2 block"
                                    style={{ color: t.color }}>{t.tag}</span>
                                <h3 className="heading-font text-base font-bold text-zinc-950 mb-1">{t.title}</h3>
                                <p className="text-xs text-zinc-500 mb-3">{t.subtitle}</p>
                                <p className="text-lg font-black text-zinc-700">{t.budget}</p>

                                <ArrowRight size={14} className="absolute bottom-5 right-5 text-zinc-300 group-hover:text-zinc-600 group-hover:translate-x-0.5 transition-all" />
                            </motion.button>
                        ))}
                    </div>
                </section>

                {/* Features */}
                <section className="py-16 px-6 border-t border-zinc-200">
                    <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
                        {[
                            { icon: CheckCircle2, title: 'Real-time Compatibility', desc: 'Every component is instantly validated against your current build.', color: '#10b981' },
                            { icon: Zap, title: 'Power Estimation', desc: 'Get live wattage draw estimates and PSU recommendations.', color: '#f59e0b' },
                            { icon: Share2, title: 'Save & Share', desc: 'Save builds to your account or share with a link instantly.', color: '#3b82f6' },
                        ].map((f, i) => (
                            <motion.div
                                key={f.title}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + i * 0.1 }}
                                className="flex gap-4"
                            >
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                                    style={{ background: `${f.color}15`, border: `1px solid ${f.color}25` }}>
                                    <f.icon size={16} style={{ color: f.color }} />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-zinc-950 text-sm mb-1">{f.title}</h4>
                                    <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BUILDER VIEW
    // ═══════════════════════════════════════════════════════════════════════
    return (
        <div className="min-h-screen bg-zinc-50 font-sans text-zinc-950 flex flex-col">
            <style>{globalStyles}</style>

            {/* ── Top Bar ─────────────────────────────────────────────────── */}
            <header className="bg-white/95 backdrop-blur-lg border-b border-zinc-200 flex-shrink-0 sticky top-[64px] z-40">
                <div className="max-w-[1700px] mx-auto px-4 sm:px-5">
                    <div className="flex items-center justify-between h-14 gap-4">
                        {/* Left */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setHasStarted(false)}
                                className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-950 flex items-center justify-center transition-all"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <div className="hidden sm:flex flex-col">
                                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest">PC Builder</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-zinc-100 px-2.5 py-1 rounded-full">
                                <div className={`w-1.5 h-1.5 rounded-full ${completedCount === CORE_BUILD_CATEGORIES.length ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                                <span className="text-[11px] font-semibold text-zinc-600">{completedCount}/{CORE_BUILD_CATEGORIES.length} parts</span>
                            </div>
                        </div>

                        {/* Center — Category steps (Desktop) */}
                        <nav className="hidden lg:flex items-center gap-1 overflow-x-auto scrollbar-hide">
                            {CORE_BUILD_CATEGORIES.map((cat) => {
                                const item = cart.find(i => i.category === cat);
                                const isActive = activeStep === cat;
                                const CatIcon = CATEGORY_ICONS[cat] || Box;
                                const accent = CATEGORY_ACCENT[cat];

                                return (
                                    <button
                                        key={cat}
                                        onClick={() => handleStepClick(cat)}
                                        className={`relative flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-xl transition-all whitespace-nowrap ${isActive
                                            ? 'bg-zinc-200 text-zinc-950'
                                            : item
                                                ? 'text-zinc-700 hover:bg-zinc-100'
                                                : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-500'
                                            }`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute inset-0 rounded-xl bg-zinc-100"
                                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                            />
                                        )}
                                        <span className="relative z-10 flex items-center gap-1.5">
                                            {item ? (
                                                <Check size={10} strokeWidth={3} style={{ color: accent }} />
                                            ) : (
                                                <CatIcon size={10} />
                                            )}
                                            {CATEGORY_LABELS[cat] || cat}
                                        </span>
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Right */}
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex flex-col items-end">
                                <span className="text-base font-black text-zinc-950 tracking-tight">
                                    <AnimatedPrice value={totalPrice} />
                                </span>
                                <span className="text-[10px] text-zinc-400">
                                    {compatibilityReport2.status === CompatibilityLevel.COMPATIBLE && cart.length > 0
                                        ? '✓ Compatible'
                                        : compatibilityReport2.issues.length > 0
                                            ? `${compatibilityReport2.issues.length} issue${compatibilityReport2.issues.length > 1 ? 's' : ''}`
                                            : 'No components'}
                                </span>
                            </div>
                            <button
                                onClick={() => setMobileDrawerOpen(true)}
                                className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-bold rounded-xl border border-zinc-200 transition-colors"
                            >
                                <ShoppingCart size={13} /> Build
                                {compatibilityReport2.issues.length > 0 && (
                                    <span className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${compatibilityReport2.status === CompatibilityLevel.INCOMPATIBLE ? 'bg-red-500' : 'bg-amber-500'}`}>
                                        {compatibilityReport2.issues.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Mobile tabs */}
                    <div className="lg:hidden flex items-center gap-1 overflow-x-auto scrollbar-hide py-2.5 -mx-4 px-4">
                        {CORE_BUILD_CATEGORIES.map(cat => {
                            const item = cart.find(i => i.category === cat);
                            const isActive = activeStep === cat;
                            const accent = CATEGORY_ACCENT[cat];
                            return (
                                <button
                                    key={cat}
                                    onClick={() => handleStepClick(cat)}
                                    className={`flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold rounded-xl transition-all whitespace-nowrap flex-shrink-0 ${isActive
                                        ? 'bg-zinc-200 text-zinc-950'
                                        : item
                                            ? 'text-zinc-600'
                                            : 'text-zinc-400'
                                        }`}
                                >
                                    {item && <Check size={9} strokeWidth={3} style={{ color: accent }} />}
                                    {CATEGORY_LABELS[cat] || cat}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </header>

            {/* ── Main Content ────────────────────────────────────────────── */}
            <div className="flex-1 flex min-h-0">
                <div className="max-w-[1700px] mx-auto w-full flex flex-1">

                    {/* Left: Product Selection */}
                    <main className="flex-1 min-w-0 flex flex-col">
                        {/* Category Header */}
                        <div className="px-5 sm:px-7 pt-6 pb-4 border-b border-zinc-200">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: `${activeCatAccent}15`, border: `1px solid ${activeCatAccent}30` }}>
                                        <ActiveCatIcon size={18} style={{ color: activeCatAccent }} />
                                    </div>
                                    <div>
                                        <h2 className="heading-font text-xl font-bold text-zinc-950 leading-tight">
                                            Select {CATEGORY_LABELS[activeStep] || activeStep}
                                        </h2>
                                        <p className="text-xs text-zinc-500 mt-0.5">
                                            {CATEGORY_DESCRIPTIONS[activeStep] || `Choose your ${CATEGORY_LABELS[activeStep]}.`}
                                        </p>
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* Search */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            placeholder={`Search ${CATEGORY_LABELS[activeStep]}...`}
                                            className="h-9 pl-8 pr-8 w-44 bg-zinc-100 border border-zinc-200 rounded-xl text-xs text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950/25 focus:bg-zinc-100 transition-all"
                                        />
                                        {searchTerm && (
                                            <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors">
                                                <XCircle size={13} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Sort */}
                                    <select
                                        value={sortOption}
                                        onChange={e => setSortOption(e.target.value)}
                                        className="h-9 px-3 bg-zinc-100 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-none focus:border-zinc-950/25 cursor-pointer appearance-none"
                                    >
                                        <option value="popularity">Popular</option>
                                        <option value="price-asc">Price ↑</option>
                                        <option value="price-desc">Price ↓</option>
                                        <option value="newest">Newest</option>
                                    </select>

                                    {/* Compat filter */}
                                    <button
                                        onClick={() => setShowIncompat(prev => !prev)}
                                        className={`flex items-center gap-1.5 h-9 px-3 text-xs font-semibold rounded-xl border transition-all ${showIncompat
                                            ? 'bg-zinc-200 border-zinc-300 text-zinc-950'
                                            : 'bg-zinc-100 border-zinc-200 text-zinc-500 hover:bg-zinc-100'
                                            }`}
                                    >
                                        {showIncompat ? <Eye size={12} /> : <EyeOff size={12} />}
                                        <span className="hidden sm:inline">{showIncompat ? 'All' : 'Compatible'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Product Grid */}
                        <div className="flex-1 overflow-y-auto p-5 sm:p-7 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                            {isLoading ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                    {Array.from({ length: 10 }).map((_, i) => (
                                        <div key={i} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden animate-pulse">
                                            <div className="aspect-square bg-zinc-100" />
                                            <div className="p-3.5 space-y-2.5">
                                                <div className="h-3 bg-zinc-100 rounded-lg w-3/4" />
                                                <div className="h-3 bg-zinc-100 rounded-lg w-1/2" />
                                                <div className="h-7 bg-zinc-100 rounded-xl w-1/3 mt-3" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : products.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-24 text-center"
                                >
                                    <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-4">
                                        <Box size={24} className="text-zinc-300" />
                                    </div>
                                    <p className="text-zinc-500 text-sm font-semibold mb-1">No products found</p>
                                    <p className="text-zinc-300 text-xs mb-5">Try adjusting the search or filters</p>
                                    {!showIncompat && (
                                        <button
                                            onClick={() => setShowIncompat(true)}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-100 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 text-xs font-medium rounded-xl border border-zinc-200 transition-all"
                                        >
                                            <Eye size={12} /> Show all products
                                        </button>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    layout
                                    className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
                                >
                                    <AnimatePresence mode="popLayout">
                                        {products.map(product => {
                                            const isInCart = cart.some(i => i.id === product.id);
                                            const compat = checkProductCompat(product);
                                            return (
                                                <ProductCard
                                                    key={product.id}
                                                    product={product}
                                                    isInCart={isInCart}
                                                    compatibility={compat.level}
                                                    compatMessage={compat.message}
                                                    onAdd={() => handleAddComponent(product)}
                                                    onRemove={() => handleRemoveComponent(product.id)}
                                                />
                                            );
                                        })}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </div>
                    </main>

                    {/* Right: Build Summary Panel */}
                    <aside className="hidden lg:flex flex-shrink-0 w-[300px] xl:w-[320px] border-l border-zinc-200 bg-white sticky top-[calc(64px+58px)] h-[calc(100vh-64px-58px)] flex-col">
                        <BuildSummaryPanel
                            cart={cart}
                            onRemove={handleRemoveComponent}
                            onStepClick={handleStepClick}
                            activeStep={activeStep}
                            onSave={() => setSaveDialogOpen(true)}
                            onShare={handleShare}
                            onCheckout={handleCheckout}
                        />
                    </aside>
                </div>
            </div>

            {/* ── Mobile Bottom Bar ──────────────────────────────────────── */}
            <div className="lg:hidden fixed bottom-16 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-zinc-200 px-4 py-3 flex items-center justify-between gap-3">
                <div>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">Total</p>
                    <p className="text-lg font-black text-zinc-950 tracking-tight">
                        <AnimatedPrice value={totalPrice} />
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {compatibilityReport2.issues.length > 0 && (
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${compatibilityReport2.status === CompatibilityLevel.INCOMPATIBLE ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
                            {compatibilityReport2.issues.length} issue{compatibilityReport2.issues.length > 1 ? 's' : ''}
                        </span>
                    )}
                    <button
                        onClick={() => setMobileDrawerOpen(true)}
                        className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 text-white shadow-md shadow-indigo-600/20 text-xs font-bold rounded-xl transition-all"
                    >
                        <ShoppingCart size={13} /> View Build
                    </button>
                </div>
            </div>

            {/* Mobile Drawer */}
            <MobileBuildDrawer
                isOpen={isMobileDrawerOpen}
                onClose={() => setMobileDrawerOpen(false)}
                cart={cart}
                onRemove={handleRemoveComponent}
                onStepClick={(cat) => { handleStepClick(cat); setMobileDrawerOpen(false); }}
                activeStep={activeStep}
                onSave={() => { setMobileDrawerOpen(false); setSaveDialogOpen(true); }}
                onShare={handleShare}
                onCheckout={() => { setMobileDrawerOpen(false); handleCheckout(); }}
            />

            {/* Save Dialog */}
            <SaveBuildDialog
                isOpen={isSaveDialogOpen}
                onClose={() => setSaveDialogOpen(false)}
                onSave={handleSave}
            />
        </div>
    );
}