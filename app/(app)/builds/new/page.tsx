'use client';

/**
 * PC Builder Page
 * Design language: matches ProductsClient (white bg, zinc palette, Inter + Space Grotesk,
 * subtle borders, clean hover shadows). No landing view. No internal navbar.
 * Nested-button bug fixed: build-summary rows are div[role=button], remove is a sibling button.
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useShop } from '@/context/ShopContext';
import { useBuild } from '@/context/BuildContext';
import { validateBuild } from '@/services/compatibility';
import { BUILD_SEQUENCE } from '@/data/categoryTree';
import {
    Category, CATEGORY_LABELS, Product, CartItem, CompatibilityLevel, specsToFlat,
} from '@/types';
import {
    Cpu, Monitor, HardDrive, Zap, Box, Fan, Keyboard, Wifi, Layers,
    Check, X, AlertTriangle, Plus, ArrowLeft,
    Search, XCircle, Share2, Save, ShoppingCart,
    Eye, EyeOff, ChevronLeft, ChevronRight, CheckCircle,
    AlertOctagon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

// ─── Scoped styles — mirrors ProductsClient aesthetics ───────────────────────
const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');

  .pcb-root * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
  .pcb-root h1,.pcb-root h2,.pcb-root h3,.pcb-root h4,.pcb-root .heading-font {
    font-family: 'Space Grotesk','Inter',sans-serif;
    letter-spacing: -0.025em;
  }

  .pcb-root ::-webkit-scrollbar { width: 4px; height: 4px; }
  .pcb-root ::-webkit-scrollbar-track { background: transparent; }
  .pcb-root ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 3px; }

  .scrollbar-hide-pcb { -ms-overflow-style:none; scrollbar-width:none; }
  .scrollbar-hide-pcb::-webkit-scrollbar { display:none; }

  .pcb-card {
    transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
  }
  @media(min-width:1024px){
    .pcb-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 24px -8px rgba(0,0,0,0.06), 0 4px 8px -4px rgba(0,0,0,0.04);
    }
  }
  .pcb-img {
    transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
  }
  @media(min-width:1024px){
    .pcb-card:hover .pcb-img { transform: scale(1.04); }
  }

  .pcb-skeleton {
    background: linear-gradient(90deg, #f4f4f5 25%, #e4e4e7 50%, #f4f4f5 75%);
    background-size: 800px 100%;
    animation: pcb-shimmer 1.4s infinite;
  }
  @keyframes pcb-shimmer {
    from { background-position: -800px 0; }
    to   { background-position:  800px 0; }
  }

  .line-clamp-2 {
    display:-webkit-box;
    -webkit-line-clamp:2;
    -webkit-box-orient:vertical;
    overflow:hidden;
  }
`;

// ─── Constants ────────────────────────────────────────────────────────────────
const CORE_CATEGORIES = [
    Category.PROCESSOR, Category.MOTHERBOARD, Category.RAM,
    Category.GPU, Category.STORAGE, Category.PSU, Category.CABINET, Category.COOLER,
];

const CAT_ICONS: Record<string, React.FC<any>> = {
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

const CAT_DESCRIPTIONS: Record<string, string> = {
    [Category.PROCESSOR]: 'The brain of your build — AMD or Intel.',
    [Category.MOTHERBOARD]: 'Connects everything. Must match your CPU socket.',
    [Category.RAM]: 'System memory. Must match your motherboard DDR type.',
    [Category.GPU]: 'Graphics card for gaming and creative work.',
    [Category.STORAGE]: 'NVMe SSDs and high-capacity HDDs.',
    [Category.PSU]: 'Power supply — must handle your total wattage.',
    [Category.CABINET]: 'The case. Must fit your motherboard and GPU.',
    [Category.COOLER]: 'Keep your CPU cool under load.',
};

// ─── Utilities ────────────────────────────────────────────────────────────────
function estimateWattage(cart: CartItem[]): number {
    let w = 50;
    for (const item of cart) {
        const s = specsToFlat(item.specs);
        const n = Number(s.wattage);
        if (!isNaN(n) && n > 0) { w += n * item.quantity; continue; }
        if (item.category === Category.PROCESSOR) w += 65;
        if (item.category === Category.GPU) w += 150;
        if (item.category === Category.RAM) w += 5 * item.quantity;
        if (item.category === Category.STORAGE) w += 5 * item.quantity;
    }
    return w;
}
function getPsuCap(cart: CartItem[]): number | null {
    const psu = cart.find(i => i.category === Category.PSU);
    if (!psu) return null;
    const w = Number(specsToFlat(psu.specs).wattage);
    return isNaN(w) ? null : w;
}

// ─── AnimatedPrice ────────────────────────────────────────────────────────────
const AnimatedPrice: React.FC<{ value: number }> = ({ value }) => {
    const [display, setDisplay] = useState(value);
    const prev = useRef(value);
    useEffect(() => {
        const from = prev.current;
        if (from === value) return;
        let step = 0;
        const id = setInterval(() => {
            step++;
            const t = step / 20;
            const e = t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            setDisplay(Math.round(from + (value - from) * e));
            if (step >= 20) { clearInterval(id); prev.current = value; }
        }, 16);
        return () => clearInterval(id);
    }, [value]);
    return <>₹{display.toLocaleString('en-IN')}</>;
};

// ─── CompatBadge ─────────────────────────────────────────────────────────────
const CompatBadge: React.FC<{ level: CompatibilityLevel }> = ({ level }) => {
    if (level === CompatibilityLevel.COMPATIBLE) return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
            <span className="w-1 h-1 rounded-full bg-emerald-500" />Compatible
        </span>
    );
    if (level === CompatibilityLevel.WARNING) return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
            <span className="w-1 h-1 rounded-full bg-amber-500" />Warning
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-md">
            <span className="w-1 h-1 rounded-full bg-red-500" />Incompatible
        </span>
    );
};

// ─── ProductCard ──────────────────────────────────────────────────────────────
const ProductCard: React.FC<{
    product: Product;
    isInCart: boolean;
    compatibility: CompatibilityLevel;
    compatMessage?: string;
    onAdd: () => void;
    onRemove: () => void;
}> = ({ product, isInCart, compatibility, compatMessage, onAdd, onRemove }) => {
    const price = product.variants?.[0]?.price || 0;
    const compareAt = product.variants?.[0]?.compareAtPrice;
    const isOos = product.variants?.[0]?.status === 'OUT_OF_STOCK';
    const isIncompat = compatibility === CompatibilityLevel.INCOMPATIBLE;
    const specEntries = Object.entries(specsToFlat(product.specs)).slice(0, 3);
    const discount = compareAt && compareAt > price ? Math.round((1 - price / compareAt) * 100) : null;

    return (
        <article
            className={`pcb-card group bg-white border rounded-2xl overflow-hidden flex flex-col h-full relative
                ${isInCart
                    ? 'border-zinc-900 shadow-[0_0_0_1px_rgba(0,0,0,0.08)]'
                    : 'border-zinc-200/80 hover:border-zinc-300'
                } ${isIncompat && !isInCart ? 'opacity-50' : ''}`}
            onClick={isInCart ? onRemove : (isIncompat || isOos ? undefined : onAdd)}
            style={{ cursor: isIncompat && !isInCart ? 'default' : isOos && !isInCart ? 'not-allowed' : 'pointer' }}
        >
            {/* Image */}
            <div className="relative h-40 bg-zinc-50/60 border-b border-zinc-100 flex items-center justify-center p-4 overflow-hidden shrink-0 group-hover:bg-zinc-50 transition-colors duration-300">
                <Link href={`/products/${product.id}`} className="absolute inset-0 z-0" onClick={e => e.stopPropagation()}>
                    <span className="sr-only">View {product.name}</span>
                </Link>
                <div className="pcb-img relative w-full h-full">
                    <Image
                        src={product.media?.[0]?.url || '/placeholder.png'}
                        alt={product.name}
                        fill
                        className="object-contain mix-blend-multiply pointer-events-none"
                        sizes="(max-width:640px) 50vw, 220px"
                        loading="lazy"
                    />
                </div>

                {/* Stock badge */}
                {isOos && (
                    <span className="absolute top-2.5 left-2.5 bg-red-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide backdrop-blur z-20">
                        Out of Stock
                    </span>
                )}

                {/* Discount badge */}
                {discount && !isOos && (
                    <span className="absolute top-2.5 left-2.5 bg-zinc-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md z-20">
                        -{discount}%
                    </span>
                )}

                {/* Selected check */}
                <AnimatePresence>
                    {isInCart && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute inset-0 bg-zinc-900/5 flex items-center justify-center z-10"
                        >
                            <div className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center shadow-lg">
                                <Check size={16} strokeWidth={2.5} className="text-white" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Content */}
            <div className="p-3.5 flex flex-col flex-1 bg-white">
                <Link href={`/products/${product.id}`} onClick={e => e.stopPropagation()} className="block mb-1 group/title">
                    <h3 className="heading-font font-medium text-zinc-900 text-[13px] leading-snug line-clamp-2 min-h-[36px] group-hover/title:text-blue-600 transition-colors duration-150">
                        {product.name}
                    </h3>
                </Link>

                {/* Specs — dot separated */}
                {specEntries.length > 0 && (
                    <p className="text-[11px] text-zinc-400 font-medium truncate mb-2">
                        {specEntries.map(([, v]) => (Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : String(v))).join(' • ')}
                    </p>
                )}

                {/* Compat message */}
                {compatMessage && !isInCart && (
                    <p className={`text-[10px] leading-tight px-2 py-1 rounded-md mb-2 ${compatibility === CompatibilityLevel.WARNING
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        {compatMessage}
                    </p>
                )}

                {/* Footer */}
                <div className="mt-auto pt-2.5 border-t border-zinc-100/80 flex items-center justify-between gap-2">
                    <div>
                        <span className="heading-font text-base font-bold text-zinc-900 tracking-tight">
                            ₹{price.toLocaleString('en-IN')}
                        </span>
                        {compareAt && compareAt > price && (
                            <span className="ml-1.5 text-[11px] text-zinc-400 line-through">
                                ₹{compareAt.toLocaleString('en-IN')}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Compat dot */}
                        {!isInCart && (
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isIncompat ? 'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]'
                                    : compatibility === CompatibilityLevel.WARNING ? 'bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.5)]'
                                        : 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]'
                                }`} title={isIncompat ? 'Incompatible' : compatibility === CompatibilityLevel.WARNING ? 'Warning' : 'Compatible'} />
                        )}

                        {/* Action button — standalone, never nested */}
                        <button
                            type="button"
                            onClick={e => { e.stopPropagation(); isInCart ? onRemove() : (!isIncompat && !isOos && onAdd()); }}
                            disabled={(isIncompat && !isInCart) || (isOos && !isInCart)}
                            className={`h-7 px-3 rounded-md text-[11px] font-bold uppercase tracking-wide transition-all duration-200 flex items-center justify-center min-w-[56px] ${isInCart
                                    ? 'bg-zinc-100 text-zinc-900 border border-zinc-200 hover:bg-zinc-200'
                                    : isOos
                                        ? 'bg-zinc-50 text-zinc-400 cursor-not-allowed border border-zinc-100'
                                        : isIncompat
                                            ? 'bg-zinc-50 text-zinc-400 cursor-not-allowed border border-zinc-100 opacity-60'
                                            : 'bg-zinc-900 text-white hover:bg-black hover:shadow-md hover:shadow-black/10 hover:-translate-y-0.5'
                                }`}
                        >
                            {isInCart ? 'Remove' : isOos ? 'Out' : 'Add'}
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
};

// ─── BuildSummaryPanel ────────────────────────────────────────────────────────
/**
 * FIX: rows are div[role=button], remove <button> is a sibling — never nested.
 */
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
    const psuCap = useMemo(() => getPsuCap(cart), [cart]);
    const wattPct = psuCap ? Math.min((wattage / psuCap) * 100, 100) : Math.min((wattage / 800) * 100, 100);
    const completedCount = CORE_CATEGORIES.filter(cat => cart.some(i => i.category === cat)).length;
    const progress = (completedCount / CORE_CATEGORIES.length) * 100;
    const isIncompat = report.status === CompatibilityLevel.INCOMPATIBLE;
    const wattColor = wattPct > 90 ? '#ef4444' : wattPct > 70 ? '#f59e0b' : '#10b981';

    return (
        <div className="flex flex-col h-full bg-white">

            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-zinc-100 flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="heading-font text-xs font-bold text-zinc-900 uppercase tracking-wider">Your Build</h3>
                    <span className="text-[11px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                        {completedCount}/{CORE_CATEGORIES.length}
                    </span>
                </div>

                {/* Progress */}
                <div className="h-1 bg-zinc-100 rounded-full overflow-hidden mb-4">
                    <motion.div
                        className="h-full bg-zinc-900 rounded-full"
                        initial={false}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    />
                </div>

                {/* Total price */}
                <div>
                    <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-0.5">Total Estimate</p>
                    <p className="heading-font text-2xl font-bold text-zinc-900 tracking-tight">
                        <AnimatedPrice value={totalPrice} />
                    </p>
                </div>
            </div>

            {/* Component rows */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
                {CORE_CATEGORIES.map(cat => {
                    const item = cart.find(i => i.category === cat);
                    const CatIcon = CAT_ICONS[cat] || Box;
                    const isActive = activeStep === cat;

                    return (
                        /* ── div[role=button] — NOT a <button> ── */
                        <div
                            key={cat}
                            role="button"
                            tabIndex={0}
                            aria-label={`Go to ${CATEGORY_LABELS[cat] || cat}`}
                            onClick={() => onStepClick(cat)}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onStepClick(cat); }}
                            className={`group/row flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer select-none outline-none transition-colors duration-150 focus-visible:ring-1 focus-visible:ring-zinc-400 ${isActive ? 'bg-zinc-50 border border-zinc-200' : 'border border-transparent hover:bg-zinc-50'
                                }`}
                        >
                            {/* Icon */}
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${item ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'
                                }`}>
                                {item
                                    ? <Check size={12} strokeWidth={2.5} />
                                    : <CatIcon size={12} />
                                }
                            </div>

                            {/* Labels */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-[10px] font-semibold uppercase tracking-wider ${item ? 'text-zinc-900' : 'text-zinc-400'}`}>
                                    {CATEGORY_LABELS[cat] || cat}
                                </p>
                                <p className="text-[11px] text-zinc-600 truncate mt-0.5">
                                    {item ? item.name : <span className="text-zinc-300 italic">Not selected</span>}
                                </p>
                            </div>

                            {/* Price + remove — siblings, never nested */}
                            {item && (
                                <>
                                    <span className="text-[11px] font-semibold text-zinc-700 flex-shrink-0 tabular-nums">
                                        ₹{((item.selectedVariant?.price || 0) * item.quantity).toLocaleString('en-IN')}
                                    </span>
                                    {/* Standalone sibling <button> */}
                                    <button
                                        type="button"
                                        aria-label={`Remove ${item.name}`}
                                        onClick={e => { e.stopPropagation(); onRemove(item.id); }}
                                        className="opacity-0 group-hover/row:opacity-100 transition-opacity p-1 rounded-md hover:bg-red-50 flex-shrink-0 focus:outline-none focus-visible:opacity-100"
                                        style={{ color: '#ef4444' }}
                                    >
                                        <X size={12} />
                                    </button>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Power meter */}
            <div className="px-5 py-3 flex-shrink-0 border-t border-zinc-100">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Power Draw</span>
                    <span className="text-[11px] font-semibold tabular-nums" style={{ color: wattColor }}>
                        {wattage}W{psuCap ? ` / ${psuCap}W` : ''}
                    </span>
                </div>
                <div className="h-1 rounded-full overflow-hidden bg-zinc-100">
                    <motion.div
                        className="h-full rounded-full"
                        style={{ background: wattColor }}
                        initial={false}
                        animate={{ width: `${wattPct}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </div>

            {/* Compat issues */}
            <AnimatePresence>
                {report.issues.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 py-3 space-y-1.5 flex-shrink-0 border-t border-zinc-100"
                    >
                        {report.issues.slice(0, 3).map((issue, i) => (
                            <div key={i} className={`flex items-start gap-2 px-2.5 py-1.5 rounded-lg text-[10px] leading-snug ${issue.level === CompatibilityLevel.INCOMPATIBLE
                                    ? 'bg-red-50 text-red-700 border border-red-100'
                                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                                }`}>
                                <AlertTriangle size={10} className="mt-0.5 flex-shrink-0" />
                                <span>{issue.message}</span>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Actions */}
            <div className="p-4 flex-shrink-0 space-y-2 border-t border-zinc-100">
                <div className="flex gap-2">
                    <button type="button" onClick={onSave}
                        className="flex-1 h-8 text-[11px] font-semibold rounded-lg border border-zinc-200 text-zinc-600 bg-white hover:bg-zinc-50 transition-colors flex items-center justify-center gap-1.5">
                        <Save size={12} /> Save
                    </button>
                    <button type="button" onClick={onShare}
                        className="flex-1 h-8 text-[11px] font-semibold rounded-lg border border-zinc-200 text-zinc-600 bg-white hover:bg-zinc-50 transition-colors flex items-center justify-center gap-1.5">
                        <Share2 size={12} /> Share
                    </button>
                </div>

                <button
                    type="button"
                    onClick={onCheckout}
                    disabled={cart.length === 0 || isIncompat}
                    className={`w-full h-10 text-[13px] font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${cart.length === 0 || isIncompat
                            ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                            : 'bg-zinc-900 text-white hover:bg-black hover:shadow-md hover:shadow-black/10 hover:-translate-y-0.5'
                        }`}
                >
                    <ShoppingCart size={14} />
                    {cart.length === 0 ? 'Start Building' : 'Add Build to Cart'}
                </button>
            </div>
        </div>
    );
};

// ─── SaveDialog ───────────────────────────────────────────────────────────────
const SaveDialog: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (t: string) => void }> = ({ isOpen, onClose, onSave }) => {
    const [title, setTitle] = useState('My Custom Build');
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className="relative bg-white border border-zinc-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl shadow-zinc-200/50"
            >
                <h3 className="heading-font text-base font-bold text-zinc-900 mb-1">Save Build</h3>
                <p className="text-xs text-zinc-500 mb-4">Give your build a name to save it.</p>
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. My Gaming PC"
                    className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 mb-4 transition-all"
                    autoFocus
                />
                <div className="flex gap-2">
                    <button type="button" onClick={onClose}
                        className="flex-1 h-9 text-sm font-medium border border-zinc-200 rounded-lg text-zinc-600 hover:bg-zinc-50 transition-colors">
                        Cancel
                    </button>
                    <button type="button" onClick={() => { onSave(title); onClose(); }}
                        className="flex-1 h-9 text-sm font-bold rounded-lg bg-zinc-900 text-white hover:bg-black transition-colors">
                        Save
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// ─── StepTab ──────────────────────────────────────────────────────────────────
const StepTab: React.FC<{
    cat: Category; isActive: boolean; isCompleted: boolean; label: string; onClick: () => void;
}> = ({ cat, isActive, isCompleted, label, onClick }) => {
    const CatIcon = CAT_ICONS[cat] || Box;
    return (
        <button
            type="button"
            onClick={onClick}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors duration-150 flex-shrink-0 ${isActive
                    ? 'bg-zinc-100 text-zinc-900 font-semibold shadow-sm border border-zinc-200/60'
                    : isCompleted
                        ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 border border-transparent'
                        : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 border border-transparent'
                }`}
        >
            {isActive && (
                <motion.span
                    layoutId="activeStepTab"
                    className="absolute inset-0 rounded-md bg-zinc-100 border border-zinc-200/60"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
                {isCompleted
                    ? <Check size={11} strokeWidth={2.5} className="text-emerald-500" />
                    : <CatIcon size={11} />
                }
                {label}
            </span>
        </button>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function PCBuilderPage() {
    const router = useRouter();
    const { cart, addToCart, removeFromCart, setCartOpen } = useShop();
    const { isBuildMode, toggleBuildMode, saveCurrentBuild, generateShareLink, compatibilityReport } = useBuild();
    const { toast } = useToast();

    const [activeStep, setActiveStep] = useState<Category>(Category.PROCESSOR);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debounced, setDebounced] = useState('');
    const [showIncompat, setShowIncompat] = useState(false);
    const [sortOption, setSortOption] = useState('popularity');
    const [saveOpen, setSaveOpen] = useState(false);
    const prevParams = useRef('');

    useEffect(() => { if (!isBuildMode) toggleBuildMode(); }, []);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(searchTerm), 300);
        return () => clearTimeout(t);
    }, [searchTerm]);

    useEffect(() => {
        (async () => {
            setIsLoading(true);
            try {
                const p = new URLSearchParams();
                p.set('category', activeStep);
                p.set('limit', '48');
                p.set('page', '1');
                if (debounced) p.set('q', debounced);
                if (sortOption !== 'popularity') p.set('sort', sortOption);
                const cpu = cart.find(i => i.category === Category.PROCESSOR);
                const mobo = cart.find(i => i.category === Category.MOTHERBOARD);
                const cpuSpecs = cpu ? specsToFlat(cpu.specs) : null;
                const moboSp = mobo ? specsToFlat(mobo.specs) : null;
                if (!showIncompat) {
                    if (activeStep === Category.MOTHERBOARD && cpuSpecs?.socket) p.set('f_specs.socket', String(cpuSpecs.socket));
                    if (activeStep === Category.PROCESSOR && moboSp?.socket) p.set('f_specs.socket', String(moboSp.socket));
                    if (activeStep === Category.RAM && (cpuSpecs || moboSp)) {
                        const type = moboSp?.ramType || cpuSpecs?.ramType;
                        if (type) p.set('f_specs.ramType', String(type));
                    }
                }
                p.sort();
                const qs = p.toString();
                if (prevParams.current === qs) { setIsLoading(false); return; }
                prevParams.current = qs;
                const res = await fetch(`/api/products?${qs}`);
                const data = await res.json();
                if (data.products) setProducts(data.products);
            } catch (e) { console.error(e); }
            finally { setIsLoading(false); }
        })();
    }, [activeStep, debounced, sortOption, cart, showIncompat]);

    const handleAdd = useCallback((product: Product) => {
        addToCart(product);
        setTimeout(() => {
            const next = CORE_CATEGORIES.find(cat => cat !== product.category && !cart.some(i => i.category === cat));
            if (next) setActiveStep(next);
        }, 100);
    }, [addToCart, cart]);

    const handleRemove = useCallback((id: string) => removeFromCart(id), [removeFromCart]);
    const handleStepClick = useCallback((cat: Category) => {
        setActiveStep(cat); setSearchTerm(''); prevParams.current = '';
    }, []);

    const checkCompat = useCallback((product: Product) => {
        if (cart.some(i => i.id === product.id)) return { level: CompatibilityLevel.COMPATIBLE, message: '' };
        const hypo = [...cart.filter(i => i.category !== product.category),
        { ...product, quantity: 1, selectedVariant: product.variants?.[0] || {} as any }];
        const rep = validateBuild(hypo as CartItem[]);
        const rel = rep.issues.filter(iss => iss.componentIds.includes(product.id));
        return {
            level: rel.length > 0
                ? rel.some(i => i.level === CompatibilityLevel.INCOMPATIBLE) ? CompatibilityLevel.INCOMPATIBLE : CompatibilityLevel.WARNING
                : CompatibilityLevel.COMPATIBLE,
            message: rel[0]?.message || '',
        };
    }, [cart]);

    const handleSave = useCallback((t: string) => saveCurrentBuild(t), [saveCurrentBuild]);
    const handleShare = useCallback(async () => {
        const link = generateShareLink();
        if (!link) { toast({ title: 'Nothing to share', description: 'Add components first.', variant: 'destructive' }); return; }
        try { await navigator.clipboard.writeText(link); }
        catch {
            const ta = document.createElement('textarea');
            ta.value = link; document.body.appendChild(ta); ta.select();
            document.execCommand('copy'); document.body.removeChild(ta);
        }
        toast({ title: 'Link copied!', description: 'Share this link to load your build.' });
    }, [generateShareLink, toast]);

    const totalPrice = cart.reduce((s, i) => s + (i.selectedVariant?.price || 0) * i.quantity, 0);
    const compatReport = useMemo(() => validateBuild(cart), [cart]);
    const completedCount = CORE_CATEGORIES.filter(cat => cart.some(i => i.category === cat)).length;

    const compatStatusColor =
        compatReport.status === CompatibilityLevel.INCOMPATIBLE ? 'text-red-600' :
            compatReport.issues.length > 0 ? 'text-amber-600' : 'text-emerald-600';

    const compatStatusText =
        cart.length === 0 ? 'No components yet' :
            compatReport.status === CompatibilityLevel.INCOMPATIBLE ? `${compatReport.issues.length} incompatibility` :
                compatReport.issues.length > 0 ? `${compatReport.issues.length} warning${compatReport.issues.length > 1 ? 's' : ''}` :
                    '✓ Compatible';

    return (
        <div className="pcb-root flex flex-col bg-white" style={{ minHeight: 'calc(100vh - 64px)' }}>
            <style>{PAGE_STYLES}</style>

            {/* ── Category / step toolbar ───────────────────────────────── */}
            {/* Sticks directly below the layout Navbar (top-16 = 64px) */}
            <div className="sticky top-16 z-20 bg-white/90 backdrop-blur-xl border-b border-zinc-200/80 flex-shrink-0">

                {/* Header row */}
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between gap-4 h-14">

                        {/* Left: Back + title */}
                        <div className="flex items-center gap-3 min-w-0">
                            <button
                                type="button"
                                onClick={() => router.push('/builds')}
                                className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors flex-shrink-0"
                            >
                                <ArrowLeft size={14} />
                                Builds
                            </button>
                            <div className="hidden sm:block h-4 w-px bg-zinc-200 flex-shrink-0" />
                            <div className="min-w-0">
                                <h1 className="heading-font text-sm font-bold text-zinc-900 truncate">PC Builder</h1>
                                <p className="text-[11px] text-zinc-400 hidden sm:block">
                                    {completedCount}/{CORE_CATEGORIES.length} components · {' '}
                                    <span className={compatStatusColor}>{compatStatusText}</span>
                                </p>
                            </div>
                        </div>

                        {/* Center: Step tabs (desktop) */}
                        <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center overflow-x-auto scrollbar-hide-pcb">
                            {CORE_CATEGORIES.map(cat => (
                                <StepTab
                                    key={cat}
                                    cat={cat}
                                    isActive={activeStep === cat}
                                    isCompleted={cart.some(i => i.category === cat)}
                                    label={CATEGORY_LABELS[cat] || cat}
                                    onClick={() => handleStepClick(cat)}
                                />
                            ))}
                        </nav>

                        {/* Right: price + mobile cart */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="hidden sm:flex flex-col items-end">
                                <span className="heading-font text-sm font-bold text-zinc-900 tracking-tight tabular-nums">
                                    <AnimatedPrice value={totalPrice} />
                                </span>
                                <span className={`text-[10px] font-medium ${compatStatusColor}`}>{compatStatusText}</span>
                            </div>

                            {/* Mobile: open sidebar */}
                            <button
                                type="button"
                                onClick={() => setCartOpen(true)}
                                className="lg:hidden flex items-center gap-1.5 h-8 px-3 bg-zinc-900 text-white rounded-md text-xs font-semibold hover:bg-black transition-colors"
                            >
                                <ShoppingCart size={13} />
                                Build
                                {cart.length > 0 && (
                                    <span className="w-4 h-4 rounded-full bg-white text-zinc-900 text-[9px] font-bold flex items-center justify-center">
                                        {cart.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile step scroll */}
                <div className="lg:hidden border-t border-zinc-100">
                    <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
                        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide-pcb py-2">
                            {CORE_CATEGORIES.map(cat => (
                                <StepTab
                                    key={cat}
                                    cat={cat}
                                    isActive={activeStep === cat}
                                    isCompleted={cart.some(i => i.category === cat)}
                                    label={CATEGORY_LABELS[cat] || cat}
                                    onClick={() => handleStepClick(cat)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main body ─────────────────────────────────────────────── */}
            <div className="flex-1 overflow-hidden">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-full">
                    <div className="flex h-full gap-6">

                        {/* Product main area */}
                        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">

                            {/* Category sub-header with search + controls */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeStep}
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 4 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-zinc-100 flex-shrink-0"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="heading-font text-sm font-bold text-zinc-900">
                                                {CATEGORY_LABELS[activeStep] || activeStep}
                                            </h2>
                                            {cart.some(i => i.category === activeStep) && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                                                    <Check size={9} strokeWidth={2.5} /> Selected
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-zinc-400 mt-0.5">
                                            {CAT_DESCRIPTIONS[activeStep] || `Select your ${CATEGORY_LABELS[activeStep]}.`}
                                        </p>
                                    </div>

                                    {/* Controls */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {/* Search */}
                                        <div className="relative group flex-1 sm:flex-none sm:w-56">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 group-focus-within:text-zinc-600 transition-colors" strokeWidth={2} />
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                                placeholder={`Search ${CATEGORY_LABELS[activeStep]}…`}
                                                className="w-full h-8 pl-8 pr-8 bg-white border border-zinc-200 rounded-md text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 transition-all"
                                            />
                                            {searchTerm && (
                                                <button type="button" onClick={() => setSearchTerm('')}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                                                    <XCircle size={13} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Sort */}
                                        <select
                                            value={sortOption}
                                            onChange={e => setSortOption(e.target.value)}
                                            className="h-8 px-2.5 bg-white border border-zinc-200 rounded-md text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 cursor-pointer appearance-none pr-7"
                                        >
                                            <option value="popularity">Popular</option>
                                            <option value="price-asc">Price ↑</option>
                                            <option value="price-desc">Price ↓</option>
                                            <option value="newest">Newest</option>
                                        </select>

                                        {/* Compat toggle */}
                                        <button
                                            type="button"
                                            onClick={() => setShowIncompat(p => !p)}
                                            className={`flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium rounded-md border transition-colors ${showIncompat
                                                    ? 'bg-zinc-100 border-zinc-300 text-zinc-900'
                                                    : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700'
                                                }`}
                                        >
                                            {showIncompat ? <Eye size={13} /> : <EyeOff size={13} />}
                                            <span className="hidden sm:inline">{showIncompat ? 'All' : 'Compatible'}</span>
                                        </button>
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Product grid */}
                            <div className="flex-1 overflow-y-auto py-5 scrollbar-hide-pcb">
                                {isLoading ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                        {Array.from({ length: 10 }).map((_, i) => (
                                            <div key={i} className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden">
                                                <div className="h-40 pcb-skeleton" />
                                                <div className="p-3.5 space-y-2">
                                                    <div className="h-3 pcb-skeleton rounded w-3/4" />
                                                    <div className="h-3 pcb-skeleton rounded w-1/2" />
                                                    <div className="h-7 pcb-skeleton rounded w-1/3 mt-3" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : products.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center justify-center py-28 text-center"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mb-3">
                                            <Box size={20} className="text-zinc-300" />
                                        </div>
                                        <p className="heading-font text-sm font-semibold text-zinc-600 mb-1">No products found</p>
                                        <p className="text-xs text-zinc-400 mb-4">Try adjusting the search or filters</p>
                                        {!showIncompat && (
                                            <button type="button" onClick={() => setShowIncompat(true)}
                                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-zinc-200 rounded-lg text-zinc-600 hover:bg-zinc-50 transition-colors">
                                                <Eye size={12} /> Show incompatible
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
                                                const inCart = cart.some(i => i.id === product.id);
                                                const compat = checkCompat(product);
                                                return (
                                                    <ProductCard
                                                        key={product.id}
                                                        product={product}
                                                        isInCart={inCart}
                                                        compatibility={compat.level}
                                                        compatMessage={compat.message}
                                                        onAdd={() => handleAdd(product)}
                                                        onRemove={() => handleRemove(product.id)}
                                                    />
                                                );
                                            })}
                                        </AnimatePresence>
                                    </motion.div>
                                )}
                            </div>
                        </main>

                        {/* ── Desktop summary sidebar ────────────────────── */}
                        <aside className="hidden lg:flex w-[272px] xl:w-[288px] flex-shrink-0 sticky top-[calc(64px+56px+49px)] h-[calc(100vh-64px-56px-49px)]"
                            style={{ borderLeft: '1px solid rgba(228,228,231,0.8)' }}>
                            <div className="w-full overflow-hidden">
                                <BuildSummaryPanel
                                    cart={cart}
                                    onRemove={handleRemove}
                                    onStepClick={handleStepClick}
                                    activeStep={activeStep}
                                    onSave={() => setSaveOpen(true)}
                                    onShare={handleShare}
                                    onCheckout={() => setCartOpen(true)}
                                />
                            </div>
                        </aside>
                    </div>
                </div>
            </div>

            {/* ── Mobile bottom bar ─────────────────────────────────────── */}
            <div className="lg:hidden fixed bottom-16 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-zinc-200 px-4 py-3 flex items-center justify-between gap-3">
                <div>
                    <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Total</p>
                    <p className="heading-font text-lg font-bold text-zinc-900 tracking-tight">
                        <AnimatedPrice value={totalPrice} />
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {compatReport.issues.length > 0 && (
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${compatReport.status === CompatibilityLevel.INCOMPATIBLE
                                ? 'bg-red-50 text-red-600 border border-red-200'
                                : 'bg-amber-50 text-amber-600 border border-amber-200'
                            }`}>
                            {compatReport.issues.length} issue{compatReport.issues.length > 1 ? 's' : ''}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={() => setCartOpen(true)}
                        className="flex items-center gap-1.5 px-5 py-2.5 bg-zinc-900 text-white text-xs font-bold rounded-xl hover:bg-black transition-colors shadow-sm"
                    >
                        <ShoppingCart size={13} /> View Build
                    </button>
                </div>
            </div>

            {/* Save dialog */}
            <AnimatePresence>
                {saveOpen && (
                    <SaveDialog isOpen={saveOpen} onClose={() => setSaveOpen(false)} onSave={handleSave} />
                )}
            </AnimatePresence>
        </div>
    );
}