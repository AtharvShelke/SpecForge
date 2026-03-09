'use client';

/**
 * PC Builder Page
 * Design language: slate palette, blue-600 accent, glassmorphic effects,
 * left sidebar nav, Inter + Space Grotesk typography. Light mode only.
 * All business logic preserved from original.
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

// ─── Scoped styles ────────────────────────────────────────────────────────────
const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&family=Space+Grotesk:wght@500;600;700&display=swap');

  .pcb-root * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
  .pcb-root h1,.pcb-root h2,.pcb-root h3,.pcb-root h4,.pcb-root .heading-font {
    font-family: 'Space Grotesk','Inter',sans-serif;
    letter-spacing: -0.025em;
  }

  .pcb-root ::-webkit-scrollbar { width: 4px; height: 4px; }
  .pcb-root ::-webkit-scrollbar-track { background: transparent; }
  .pcb-root ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 3px; }

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
    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
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
                    ? 'border-2 border-blue-600 shadow-xl'
                    : 'border-slate-100 hover:shadow-lg'
                } ${isIncompat && !isInCart ? 'opacity-50' : ''}`}
            onClick={isInCart ? onRemove : (isIncompat || isOos ? undefined : onAdd)}
            style={{ cursor: isIncompat && !isInCart ? 'default' : isOos && !isInCart ? 'not-allowed' : 'pointer' }}
        >
            {/* Image */}
            <div className="relative h-40 bg-slate-50/60 border-b border-slate-100 flex items-center justify-center p-4 overflow-hidden shrink-0 group-hover:bg-slate-50 transition-colors duration-300">
                <Link href={`/products/${product.id}`} className="absolute inset-0 z-0" onClick={e => e.stopPropagation()}>
                    <span className="sr-only">View {product.name}</span>
                </Link>
                <div className={`pcb-img relative w-full h-full transition-all ${!isInCart ? 'grayscale-[30%] opacity-70 group-hover:grayscale-0 group-hover:opacity-100' : ''}`}>
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
                    <span className="absolute top-2.5 left-2.5 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md z-20">
                        -{discount}%
                    </span>
                )}

                {/* Selected check — top right corner (reference style) */}
                <AnimatePresence>
                    {isInCart && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute top-3 right-3 bg-blue-600 text-white p-1.5 rounded-full flex items-center justify-center z-20 shadow-lg shadow-blue-600/30"
                        >
                            <Check size={12} strokeWidth={3} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Content */}
            <div className="p-3.5 flex flex-col flex-1 bg-white">
                {/* Type tag */}
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isInCart ? 'text-blue-600' : 'text-slate-400'}`}>
                    {CATEGORY_LABELS[product.category] || product.category}
                </p>

                <Link href={`/products/${product.id}`} onClick={e => e.stopPropagation()} className="block mb-1 group/title">
                    <h3 className="heading-font font-bold text-slate-900 text-[13px] leading-snug line-clamp-2 min-h-[36px] group-hover/title:text-blue-600 transition-colors duration-150">
                        {product.name}
                    </h3>
                </Link>

                {/* Specs — dot separated */}
                {specEntries.length > 0 && (
                    <p className="text-[11px] text-slate-400 font-medium truncate mb-2">
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
                <div className="mt-auto pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                        <span className="heading-font text-base font-black text-slate-900 tracking-tight">
                            ₹{price.toLocaleString('en-IN')}
                        </span>
                        {compareAt && compareAt > price && (
                            <span className="ml-1.5 text-[11px] text-slate-400 line-through">
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

                        {/* Action button */}
                        <button
                            type="button"
                            onClick={e => { e.stopPropagation(); isInCart ? onRemove() : (!isIncompat && !isOos && onAdd()); }}
                            disabled={(isIncompat && !isInCart) || (isOos && !isInCart)}
                            className={`h-7 px-3 rounded-md text-[11px] font-bold uppercase tracking-wide transition-all duration-200 flex items-center justify-center min-w-[56px] ${isInCart
                                ? 'bg-slate-100 text-slate-900 border border-slate-200 hover:bg-slate-200'
                                : isOos
                                    ? 'bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-100'
                                    : isIncompat
                                        ? 'bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-100 opacity-60'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/20 hover:-translate-y-0.5'
                                }`}
                        >
                            {isInCart ? 'Remove' : isOos ? 'Out' : 'Select'}
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
};

// ─── BuildSummaryPanel ────────────────────────────────────────────────────────
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
    const isIncompat = report.status === CompatibilityLevel.INCOMPATIBLE;
    const wattColor = wattPct > 90 ? '#ef4444' : wattPct > 70 ? '#f59e0b' : '#10b981';

    return (
        <div className="flex flex-col h-full bg-white">

            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Build Summary</h3>

                {/* Total price */}
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Estimated Total</p>
                    <p className="heading-font text-xl font-black text-slate-900 tracking-tight leading-tight">
                        <AnimatedPrice value={totalPrice} />
                    </p>
                </div>
            </div>

            {/* Component rows — reference style: label/price top, value below */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                {CORE_CATEGORIES.map(cat => {
                    const item = cart.find(i => i.category === cat);
                    const isMissing = !item;

                    return (
                        <div
                            key={cat}
                            role="button"
                            tabIndex={0}
                            aria-label={`Go to ${CATEGORY_LABELS[cat] || cat}`}
                            onClick={() => onStepClick(cat)}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onStepClick(cat); }}
                            className="group cursor-pointer select-none outline-none"
                        >
                            <div className="flex justify-between items-start mb-1">
                                <p className={`text-xs font-bold uppercase ${isMissing ? 'text-slate-400' : 'text-slate-900'}`}>
                                    {CATEGORY_LABELS[cat] || cat}
                                </p>
                                {isMissing ? (
                                    <p className="text-xs font-bold text-blue-600 italic">MISSING</p>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-bold tabular-nums">
                                            ₹{((item.selectedVariant?.price || 0) * item.quantity).toLocaleString('en-IN')}
                                        </p>
                                        <button
                                            type="button"
                                            aria-label={`Remove ${item.name}`}
                                            onClick={e => { e.stopPropagation(); onRemove(item.id); }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-50 flex-shrink-0 focus:outline-none focus-visible:opacity-100"
                                            style={{ color: '#ef4444' }}
                                        >
                                            <X size={11} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <p className={`text-[11px] ${isMissing
                                ? 'text-red-400 font-medium'
                                : 'text-slate-500 group-hover:text-blue-600 transition-colors'
                                }`}>
                                {item ? item.name : `Add ${CATEGORY_LABELS[cat]} to continue`}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Power meter */}
            <div className="px-5 py-3 flex-shrink-0 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Power Draw</span>
                    <span className="text-[11px] font-semibold tabular-nums" style={{ color: wattColor }}>
                        {wattage}W{psuCap ? ` / ${psuCap}W` : ''}
                    </span>
                </div>
                <div className="h-1 rounded-full overflow-hidden bg-slate-100">
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
                        className="px-4 py-3 space-y-1.5 flex-shrink-0 border-t border-slate-100"
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

            {/* Performance tier box */}
            <div className="px-5 py-3 flex-shrink-0 border-t border-slate-100">
                <div className="bg-blue-600/5 rounded-2xl p-4 border border-blue-600/10">
                    <div className="flex items-center gap-2 mb-1">
                        <Zap size={14} className="text-blue-600" />
                        <p className="text-[10px] font-black uppercase text-blue-600 tracking-wide">Build Status</p>
                    </div>
                    <p className="text-sm font-bold text-slate-900">
                        {completedCount === CORE_CATEGORIES.length ? 'Build Complete' : `${completedCount}/${CORE_CATEGORIES.length} Components`}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        {completedCount === CORE_CATEGORIES.length
                            ? 'All components selected — ready to checkout'
                            : `${CORE_CATEGORIES.length - completedCount} more to go`}
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="p-4 flex-shrink-0 space-y-2 border-t border-slate-100">
                <div className="flex gap-2">
                    <button type="button" onClick={onSave}
                        className="flex-1 h-8 text-[11px] font-semibold rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5">
                        <Save size={12} /> Save
                    </button>
                    <button type="button" onClick={onShare}
                        className="flex-1 h-8 text-[11px] font-semibold rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5">
                        <Share2 size={12} /> Share
                    </button>
                </div>

                <button
                    type="button"
                    onClick={onCheckout}
                    disabled={cart.length === 0 || isIncompat}
                    className={`w-full h-10 text-[13px] font-bold rounded-full transition-all duration-200 flex items-center justify-center gap-2 ${cart.length === 0 || isIncompat
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 hover:-translate-y-0.5'
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
                className="relative bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl"
            >
                <h3 className="heading-font text-base font-bold text-slate-900 mb-1">Save Build</h3>
                <p className="text-xs text-slate-500 mb-4">Give your build a name to save it.</p>
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. My Gaming PC"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-300 mb-4 transition-all"
                    autoFocus
                />
                <div className="flex gap-2">
                    <button type="button" onClick={onClose}
                        className="flex-1 h-9 text-sm font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                        Cancel
                    </button>
                    <button type="button" onClick={() => { onSave(title); onClose(); }}
                        className="flex-1 h-9 text-sm font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                        Save
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// ─── SidebarNavItem ───────────────────────────────────────────────────────────
const SidebarNavItem: React.FC<{
    cat: Category; isActive: boolean; isCompleted: boolean; label: string; onClick: () => void;
}> = ({ cat, isActive, isCompleted, label, onClick }) => {
    const CatIcon = CAT_ICONS[cat] || Box;
    return (
        <button
            type="button"
            onClick={onClick}
            className={`group flex flex-col items-center gap-2 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'
                }`}
        >
            <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 ${isActive
                        ? 'bg-blue-600/10'
                        : 'bg-slate-50 group-hover:bg-blue-600/5'
                    }`}
            >
                {isCompleted ? (
                    <Check size={20} strokeWidth={2.5} className="text-emerald-500" />
                ) : (
                    <CatIcon size={20} />
                )}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
        </button>
    );
};

// ─── MobileStepTab ────────────────────────────────────────────────────────────
const MobileStepTab: React.FC<{
    cat: Category; isActive: boolean; isCompleted: boolean; label: string; onClick: () => void;
}> = ({ cat, isActive, isCompleted, label, onClick }) => {
    const CatIcon = CAT_ICONS[cat] || Box;
    return (
        <button
            type="button"
            onClick={onClick}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors duration-150 flex-shrink-0 ${isActive
                ? 'bg-blue-600/10 text-blue-600 font-semibold border border-blue-200/60'
                : isCompleted
                    ? 'text-slate-600 hover:text-blue-600 hover:bg-slate-50 border border-transparent'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50 border border-transparent'
                }`}
        >
            <span className="flex items-center gap-1.5">
                {isCompleted
                    ? <Check size={11} strokeWidth={2.5} className="text-emerald-500" />
                    : <CatIcon size={11} />
                }
                {label}
            </span>
        </button>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
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
    const wattage = useMemo(() => estimateWattage(cart), [cart]);
    const psuCap = useMemo(() => getPsuCap(cart), [cart]);

    const compatStatusColor =
        compatReport.status === CompatibilityLevel.INCOMPATIBLE ? 'text-red-600' :
            compatReport.issues.length > 0 ? 'text-amber-600' : 'text-emerald-600';

    const compatStatusText =
        cart.length === 0 ? 'No components yet' :
            compatReport.status === CompatibilityLevel.INCOMPATIBLE ? `${compatReport.issues.length} incompatibility` :
                compatReport.issues.length > 0 ? `${compatReport.issues.length} warning${compatReport.issues.length > 1 ? 's' : ''}` :
                    '✓ Compatible';

    return (
        <div className="pcb-root flex flex-col bg-slate-50 text-slate-900 overflow-hidden" style={{ minHeight: 'calc(100vh - 64px)' }}>
            <style>{PAGE_STYLES}</style>

            {/* ── Header ──────────────────────────────────────────────────── */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 lg:px-12 py-3 z-50 shrink-0 sticky top-16">

                {/* Left: Back + title */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 text-blue-600">
                        <Box size={24} strokeWidth={2} />
                        <h2 className="heading-font text-slate-900 text-lg font-bold leading-tight tracking-tight">
                            PC Builder
                        </h2>
                    </div>
                    <nav className="hidden md:flex items-center gap-6">
                        <button
                            type="button"
                            onClick={() => router.push('/builds')}
                            className="text-slate-600 text-sm font-medium hover:text-blue-600 transition-colors flex items-center gap-1.5"
                        >
                            <ArrowLeft size={14} />
                            My Builds
                        </button>
                        <span className="text-slate-300 text-sm">|</span>
                        <span className={`text-sm font-medium ${compatStatusColor}`}>{compatStatusText}</span>
                    </nav>
                </div>

                {/* Right: price + checkout */}
                <div className="flex gap-4 items-center">
                    <div className="text-right mr-4 hidden sm:block">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Estimated Total</p>
                        <p className="heading-font text-xl font-black text-slate-900 leading-tight">
                            <AnimatedPrice value={totalPrice} />
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setCartOpen(true)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
                    >
                        <ShoppingCart size={14} />
                        Checkout
                        {cart.length > 0 && (
                            <span className="w-5 h-5 rounded-full bg-white text-blue-600 text-[10px] font-black flex items-center justify-center">
                                {cart.length}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            {/* ── Main body ────────────────────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden">

                {/* ── Left Sidebar Nav (desktop only) ─────────────────────── */}
                <aside className="w-20 lg:w-24 border-r border-slate-200 bg-white flex-col items-center py-8 gap-6 overflow-y-auto z-40 hidden lg:flex">
                    {CORE_CATEGORIES.map(cat => (
                        <SidebarNavItem
                            key={cat}
                            cat={cat}
                            isActive={activeStep === cat}
                            isCompleted={cart.some(i => i.category === cat)}
                            label={CATEGORY_LABELS[cat] || cat}
                            onClick={() => handleStepClick(cat)}
                        />
                    ))}
                </aside>

                {/* ── Main Content ─────────────────────────────────────────── */}
                <main className="flex-1 flex flex-col relative overflow-hidden">

                    {/* Mobile step scroll */}
                    <div className="lg:hidden border-b border-slate-100 bg-white shrink-0">
                        <div className="px-4 sm:px-6">
                            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide-pcb py-2">
                                {CORE_CATEGORIES.map(cat => (
                                    <MobileStepTab
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

                    {/* Category sub-header + search/controls */}
                    <div className="p-6 pb-2 shrink-0 z-30">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeStep}
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="flex items-end justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-2.5">
                                            <h3 className="heading-font text-2xl font-black text-slate-900">
                                                {CATEGORY_LABELS[activeStep] || activeStep}
                                            </h3>
                                            {cart.some(i => i.category === activeStep) && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                                                    <Check size={9} strokeWidth={2.5} /> Selected
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 mt-0.5">
                                            {CAT_DESCRIPTIONS[activeStep] || `Select your ${CATEGORY_LABELS[activeStep]}.`}
                                        </p>
                                    </div>
                                </div>

                                {/* Controls row */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* Search */}
                                    <div className="relative group flex-1 sm:flex-none sm:w-56">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" strokeWidth={2} />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            placeholder={`Search ${CATEGORY_LABELS[activeStep]}…`}
                                            className="w-full h-8 pl-8 pr-8 bg-white border border-slate-200 rounded-md text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-300 transition-all"
                                        />
                                        {searchTerm && (
                                            <button type="button" onClick={() => setSearchTerm('')}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                <XCircle size={13} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Sort */}
                                    <select
                                        value={sortOption}
                                        onChange={e => setSortOption(e.target.value)}
                                        className="h-8 px-2.5 bg-white border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 cursor-pointer appearance-none pr-7"
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
                                            ? 'bg-blue-50 border-blue-200 text-blue-600'
                                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                            }`}
                                    >
                                        {showIncompat ? <Eye size={13} /> : <EyeOff size={13} />}
                                        <span className="hidden sm:inline">{showIncompat ? 'All' : 'Compatible'}</span>
                                    </button>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Product grid */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide-pcb">
                        {isLoading ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <div key={i} className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden">
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
                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                                    <Box size={20} className="text-slate-300" />
                                </div>
                                <p className="heading-font text-sm font-semibold text-slate-600 mb-1">No products found</p>
                                <p className="text-xs text-slate-400 mb-4">Try adjusting the search or filters</p>
                                {!showIncompat && (
                                    <button type="button" onClick={() => setShowIncompat(true)}
                                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
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

                    {/* ── Bottom Status Bar (reference style) ──────────────── */}
                    <div className="h-16 bg-white/50 backdrop-blur-xl border-t border-slate-200 hidden lg:flex items-center px-8 shrink-0 justify-between">
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-3">
                                {compatReport.status === CompatibilityLevel.INCOMPATIBLE ? (
                                    <AlertOctagon size={20} className="text-red-500" />
                                ) : compatReport.issues.length > 0 ? (
                                    <AlertTriangle size={20} className="text-amber-500" />
                                ) : (
                                    <CheckCircle size={20} className="text-green-500" />
                                )}
                                <div>
                                    <p className="text-xs font-bold text-slate-800">
                                        {cart.length === 0 ? 'Start Building' :
                                            compatReport.status === CompatibilityLevel.INCOMPATIBLE ? 'Incompatible Build' :
                                                compatReport.issues.length > 0 ? 'Warnings Detected' : 'Compatible Build'}
                                    </p>
                                    <p className="text-[10px] text-slate-500">
                                        {cart.length === 0 ? 'Select components to begin' :
                                            compatReport.issues.length > 0 ? compatReport.issues[0]?.message :
                                                'No clearance issues detected'}
                                    </p>
                                </div>
                            </div>
                            <div className="h-8 w-px bg-slate-200" />
                            <div className="flex items-center gap-3">
                                <Zap size={20} className="text-yellow-500" />
                                <div>
                                    <p className="text-xs font-bold text-slate-800">{wattage}W Est.</p>
                                    <p className="text-[10px] text-slate-500">
                                        {psuCap ? `${psuCap}W PSU selected` : '850W+ PSU Recommended'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            {[
                                { icon: Share2, action: handleShare },
                                { icon: Save, action: () => setSaveOpen(true) },
                                { icon: Eye, action: () => { } },
                            ].map(({ icon: Icon, action }, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={action}
                                    className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
                                >
                                    <Icon size={18} />
                                </button>
                            ))}
                        </div>
                    </div>
                </main>

                {/* ── Right Sidebar — Build Summary (desktop) ──────────────── */}
                <aside className="w-80 border-l border-slate-200 bg-white overflow-y-auto hidden xl:flex flex-col">
                    <BuildSummaryPanel
                        cart={cart}
                        onRemove={handleRemove}
                        onStepClick={handleStepClick}
                        activeStep={activeStep}
                        onSave={() => setSaveOpen(true)}
                        onShare={handleShare}
                        onCheckout={() => setCartOpen(true)}
                    />
                </aside>
            </div>

            {/* ── Mobile bottom bar ───────────────────────────────────────── */}
            <div className="lg:hidden fixed bottom-16 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-3">
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
                    <p className="heading-font text-lg font-black text-slate-900 tracking-tight">
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
                        className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-full hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
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