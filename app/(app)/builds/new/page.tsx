'use client';

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
    Eye, EyeOff, ChevronRight, CheckCircle, AlertOctagon, SlidersHorizontal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

/* ─────────────────────────────── Styles ─────────────────────────────────── */
const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

  .pcb-root, .pcb-root * { font-family: 'DM Sans', system-ui, sans-serif; }

  .pcb-root ::-webkit-scrollbar { width: 3px; height: 3px; }
  .pcb-root ::-webkit-scrollbar-track { background: transparent; }
  .pcb-root ::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 4px; }
  .pcb-root ::-webkit-scrollbar-thumb:hover { background: #d4d4d8; }

  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  .scrollbar-hide::-webkit-scrollbar { display: none; }

  /* Fixed 3-column layout: left nav | main | right summary */
  .pcb-layout {
    display: grid;
    grid-template-columns: 72px 1fr 288px;
    grid-template-rows: 1fr;
    height: calc(100vh - 56px);
    overflow: hidden;
  }
  @media (max-width: 1279px) {
    .pcb-layout { grid-template-columns: 1fr; }
  }

  .pcb-card {
    transition: box-shadow 0.2s ease, transform 0.2s cubic-bezier(0.22,1,0.36,1);
  }
  .pcb-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px -6px rgba(0,0,0,0.07), 0 2px 8px -2px rgba(0,0,0,0.04);
  }
  .pcb-card.selected {
    box-shadow: 0 0 0 2px #4f46e5, 0 8px 24px -6px rgba(79,70,229,0.15);
  }
  .pcb-img { transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1); }
  .pcb-card:hover .pcb-img { transform: scale(1.05); }

  .pcb-skeleton {
    background: linear-gradient(90deg, #f4f4f5 25%, #e4e4e7 50%, #f4f4f5 75%);
    background-size: 800px 100%;
    animation: shimmer 1.5s infinite;
  }
  @keyframes shimmer {
    from { background-position: -800px 0; }
    to   { background-position:  800px 0; }
  }

  .card-enter {
    animation: cardIn 0.35s cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .nav-item-active { position: relative; }
  .nav-item-active::before {
    content: '';
    position: absolute;
    left: 0; top: 50%; transform: translateY(-50%);
    width: 2px; height: 24px;
    background: #4f46e5;
    border-radius: 0 2px 2px 0;
  }
`;

/* ─────────────────────────────── Constants ──────────────────────────────── */
const CORE_CATEGORIES = [
    Category.PROCESSOR, Category.MOTHERBOARD, Category.RAM,
    Category.GPU, Category.STORAGE, Category.PSU, Category.CABINET, Category.COOLER,
];

const CAT_ICONS: Record<string, React.FC<any>> = {
    [Category.PROCESSOR]:   Cpu,
    [Category.MOTHERBOARD]: Layers,
    [Category.RAM]:         HardDrive,
    [Category.GPU]:         Monitor,
    [Category.STORAGE]:     HardDrive,
    [Category.PSU]:         Zap,
    [Category.CABINET]:     Box,
    [Category.COOLER]:      Fan,
    [Category.MONITOR]:     Monitor,
    [Category.PERIPHERAL]:  Keyboard,
    [Category.NETWORKING]:  Wifi,
};

const CAT_SHORT: Record<string, string> = {
    [Category.PROCESSOR]:   'CPU',
    [Category.MOTHERBOARD]: 'Mobo',
    [Category.RAM]:         'RAM',
    [Category.GPU]:         'GPU',
    [Category.STORAGE]:     'SSD',
    [Category.PSU]:         'PSU',
    [Category.CABINET]:     'Case',
    [Category.COOLER]:      'Cooler',
};

const CAT_DESCRIPTIONS: Record<string, string> = {
    [Category.PROCESSOR]:   'The brain of your build — AMD or Intel.',
    [Category.MOTHERBOARD]: 'Connects everything. Must match your CPU socket.',
    [Category.RAM]:         'System memory. Must match your motherboard DDR type.',
    [Category.GPU]:         'Graphics card for gaming and creative work.',
    [Category.STORAGE]:     'NVMe SSDs for fast load times.',
    [Category.PSU]:         'Power supply — must handle your total wattage.',
    [Category.CABINET]:     'The case. Must fit your motherboard and GPU.',
    [Category.COOLER]:      'Keep your CPU cool under load.',
};

/* ─────────────────────────────── Utilities ──────────────────────────────── */
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

/* ─────────────────────────────── AnimatedPrice ──────────────────────────── */
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

/* ─────────────────────────────── SkeletonCard ───────────────────────────── */
const SkeletonCard = () => (
    <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden">
        <div className="h-36 pcb-skeleton" />
        <div className="p-3 space-y-2">
            <div className="h-2.5 pcb-skeleton rounded-full w-1/4" />
            <div className="h-3 pcb-skeleton rounded-full w-full" />
            <div className="h-3 pcb-skeleton rounded-full w-3/4" />
            <div className="pt-2 flex justify-between items-center">
                <div className="h-4 pcb-skeleton rounded-full w-1/3" />
                <div className="h-7 w-16 pcb-skeleton rounded-xl" />
            </div>
        </div>
    </div>
);

/* ─────────────────────────────── ProductCard ────────────────────────────── */
const ProductCard: React.FC<{
    product: Product;
    isInCart: boolean;
    compatibility: CompatibilityLevel;
    compatMessage?: string;
    onAdd: () => void;
    onRemove: () => void;
    index: number;
}> = ({ product, isInCart, compatibility, compatMessage, onAdd, onRemove, index }) => {
    const price = product.variants?.[0]?.price || 0;
    const compareAt = product.variants?.[0]?.compareAtPrice;
    const isOos = product.variants?.[0]?.status === 'OUT_OF_STOCK';
    const isIncompat = compatibility === CompatibilityLevel.INCOMPATIBLE;
    const isWarning = compatibility === CompatibilityLevel.WARNING;
    const specEntries = Object.entries(specsToFlat(product.specs)).slice(0, 3);
    const discount = compareAt && compareAt > price ? Math.round((1 - price / compareAt) * 100) : null;

    const compatDot = isIncompat
        ? 'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]'
        : isWarning
            ? 'bg-amber-400 shadow-[0_0_4px_rgba(245,158,11,0.4)]'
            : 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.4)]';

    return (
        <article
            className={`pcb-card card-enter bg-white border rounded-2xl overflow-hidden flex flex-col h-full relative cursor-pointer
                ${isInCart ? 'selected border-indigo-200' : 'border-zinc-100'}
                ${isIncompat && !isInCart ? 'opacity-45' : ''}`}
            style={{ animationDelay: `${index * 35}ms` }}
            onClick={isInCart ? onRemove : (isIncompat || isOos ? undefined : onAdd)}
        >
            {/* Image zone */}
            <div className="relative h-36 bg-zinc-50 flex items-center justify-center p-3 overflow-hidden shrink-0">
                <Link href={`/products/${product.id}`} className="absolute inset-0 z-0" onClick={e => e.stopPropagation()}>
                    <span className="sr-only">View {product.name}</span>
                </Link>
                <div className="pcb-img relative w-full h-full">
                    <Image
                        src={product.media?.[0]?.url || '/placeholder.png'}
                        alt={product.name}
                        fill
                        className="object-contain mix-blend-multiply pointer-events-none"
                        sizes="(max-width:640px) 50vw, 200px"
                        loading="lazy"
                    />
                </div>

                {/* Badges */}
                {isOos && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide z-10">
                        Out of Stock
                    </span>
                )}
                {discount && !isOos && (
                    <span className="absolute top-2 left-2 bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-10">
                        -{discount}%
                    </span>
                )}

                {/* Selected checkmark */}
                <AnimatePresence>
                    {isInCart && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                            className="absolute top-2.5 right-2.5 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center z-10 shadow-lg shadow-indigo-600/30"
                        >
                            <Check size={11} strokeWidth={3} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Compat dot (bottom-right corner of image) */}
                {!isInCart && (
                    <div className={`absolute bottom-2 right-2 w-2 h-2 rounded-full z-10 ${compatDot}`} title={isIncompat ? 'Incompatible' : isWarning ? 'Warning' : 'Compatible'} />
                )}
            </div>

            {/* Content */}
            <div className="p-3 flex flex-col flex-1">
                <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${isInCart ? 'text-indigo-500' : 'text-zinc-400'}`}>
                    {CATEGORY_LABELS[product.category] || product.category}
                </p>

                <Link href={`/products/${product.id}`} onClick={e => e.stopPropagation()} className="block mb-1.5">
                    <h3 className="font-semibold text-zinc-900 text-[12px] leading-snug line-clamp-2 min-h-[32px] hover:text-indigo-600 transition-colors">
                        {product.name}
                    </h3>
                </Link>

                {specEntries.length > 0 && (
                    <p className="text-[10px] text-zinc-400 truncate mb-1.5">
                        {specEntries.map(([, v]) => (Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : String(v))).join(' · ')}
                    </p>
                )}

                {/* Compat message */}
                {compatMessage && !isInCart && (isIncompat || isWarning) && (
                    <p className={`text-[9px] leading-snug px-2 py-1 rounded-lg mb-1.5 ${isIncompat
                        ? 'bg-red-50 text-red-600 border border-red-100'
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                        {compatMessage}
                    </p>
                )}

                {/* Footer */}
                <div className="mt-auto pt-2 border-t border-zinc-50 flex items-center justify-between gap-1.5">
                    <div>
                        <span className="text-sm font-bold text-zinc-900 tracking-tight">
                            ₹{price.toLocaleString('en-IN')}
                        </span>
                        {compareAt && compareAt > price && (
                            <span className="ml-1 text-[10px] text-zinc-400 line-through">
                                ₹{compareAt.toLocaleString('en-IN')}
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={e => { e.stopPropagation(); isInCart ? onRemove() : (!isIncompat && !isOos && onAdd()); }}
                        disabled={(isIncompat && !isInCart) || (isOos && !isInCart)}
                        className={`h-7 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all duration-200 flex items-center justify-center gap-1 ${
                            isInCart
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                                : isOos || isIncompat
                                    ? 'bg-zinc-50 text-zinc-300 cursor-not-allowed border border-zinc-100'
                                    : 'bg-zinc-900 text-white hover:bg-indigo-600 hover:shadow-md hover:shadow-indigo-200/50 active:scale-95'
                            }`}
                    >
                        {isInCart ? (
                            <><X size={9} strokeWidth={3} /> Remove</>
                        ) : isOos ? 'Out' : (
                            <><Plus size={9} strokeWidth={3} /> Select</>
                        )}
                    </button>
                </div>
            </div>
        </article>
    );
};

/* ─────────────────────────────── BuildSummaryPanel ──────────────────────── */
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
        <div className="flex flex-col h-full bg-white border-l border-zinc-100">

            {/* Header */}
            <div className="px-4 pt-4 pb-3 border-b border-zinc-100 flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Build Summary</h3>
                    <div className="flex items-center gap-1">
                        <button onClick={onSave} className="w-7 h-7 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-all" title="Save build">
                            <Save size={13} />
                        </button>
                        <button onClick={onShare} className="w-7 h-7 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-all" title="Share build">
                            <Share2 size={13} />
                        </button>
                    </div>
                </div>

                {/* Price */}
                <div>
                    <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-0.5">Estimated Total</p>
                    <p className="text-2xl font-bold text-zinc-900 tracking-tight">
                        <AnimatedPrice value={totalPrice} />
                    </p>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-zinc-400 font-medium">{completedCount}/{CORE_CATEGORIES.length} components</span>
                        <span className="text-[10px] font-semibold text-indigo-500">{Math.round((completedCount / CORE_CATEGORIES.length) * 100)}%</span>
                    </div>
                    <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-indigo-500 rounded-full"
                            animate={{ width: `${(completedCount / CORE_CATEGORIES.length) * 100}%` }}
                            transition={{ duration: 0.4 }}
                        />
                    </div>
                </div>
            </div>

            {/* Component rows */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
                {CORE_CATEGORIES.map(cat => {
                    const item = cart.find(i => i.category === cat);
                    const isActive = activeStep === cat;
                    const CatIcon = CAT_ICONS[cat] || Box;

                    return (
                        <div
                            key={cat}
                            role="button"
                            tabIndex={0}
                            onClick={() => onStepClick(cat)}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onStepClick(cat); }}
                            className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer transition-all outline-none select-none ${
                                isActive ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-zinc-50 border border-transparent'
                            }`}
                        >
                            {/* Icon or check */}
                            <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                item ? 'bg-indigo-100' : isActive ? 'bg-indigo-50' : 'bg-zinc-100'
                            }`}>
                                {item
                                    ? <Check size={13} strokeWidth={2.5} className="text-indigo-600" />
                                    : <CatIcon size={13} className={isActive ? 'text-indigo-500' : 'text-zinc-400'} />
                                }
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className={`text-[10px] font-bold uppercase tracking-wider ${
                                    item ? 'text-zinc-900' : isActive ? 'text-indigo-600' : 'text-zinc-400'
                                }`}>
                                    {CAT_SHORT[cat] || CATEGORY_LABELS[cat]}
                                </p>
                                <p className={`text-[11px] truncate leading-none mt-0.5 ${
                                    item ? 'text-zinc-500' : 'text-zinc-300 italic'
                                }`}>
                                    {item ? item.name : `Not selected`}
                                </p>
                            </div>

                            {/* Price or remove */}
                            {item ? (
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <span className="text-[11px] font-bold text-zinc-700 tabular-nums">
                                        ₹{((item.selectedVariant?.price || 0) * item.quantity).toLocaleString('en-IN')}
                                    </span>
                                    <button
                                        type="button"
                                        aria-label={`Remove ${item.name}`}
                                        onClick={e => { e.stopPropagation(); onRemove(item.id); }}
                                        className="w-5 h-5 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                                    >
                                        <X size={10} strokeWidth={2.5} />
                                    </button>
                                </div>
                            ) : (
                                <ChevronRight size={12} className={`flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-zinc-200 group-hover:text-zinc-400'} transition-colors`} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Power meter */}
            <div className="px-4 py-3 flex-shrink-0 border-t border-zinc-100">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Power Draw</span>
                    <span className="text-[11px] font-semibold tabular-nums" style={{ color: wattColor }}>
                        {wattage}W{psuCap ? ` / ${psuCap}W` : ' est.'}
                    </span>
                </div>
                <div className="h-1 rounded-full overflow-hidden bg-zinc-100">
                    <motion.div
                        className="h-full rounded-full"
                        style={{ background: wattColor }}
                        animate={{ width: `${wattPct}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
                {psuCap && wattPct > 85 && (
                    <p className="text-[10px] text-amber-600 mt-1">⚠ PSU near capacity</p>
                )}
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
                        {report.issues.slice(0, 2).map((issue, i) => (
                            <div key={i} className={`flex items-start gap-2 px-2.5 py-1.5 rounded-xl text-[10px] leading-snug ${
                                issue.level === CompatibilityLevel.INCOMPATIBLE
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

            {/* CTA */}
            <div className="px-4 pb-4 pt-3 flex-shrink-0 border-t border-zinc-100">
                <button
                    type="button"
                    onClick={onCheckout}
                    disabled={cart.length === 0 || isIncompat}
                    className={`w-full h-11 text-sm font-bold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 ${
                        cart.length === 0 || isIncompat
                            ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                            : 'bg-zinc-900 text-white hover:bg-indigo-600 shadow-sm hover:shadow-lg hover:shadow-indigo-200/50 active:scale-[0.98]'
                        }`}
                >
                    <ShoppingCart size={15} />
                    {cart.length === 0 ? 'Start Building' : `View Build (${cart.length})`}
                </button>
            </div>
        </div>
    );
};

/* ─────────────────────────────── SaveDialog ─────────────────────────────── */
const SaveDialog: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (t: string) => void }> = ({ isOpen, onClose, onSave }) => {
    const [title, setTitle] = useState('My Custom Build');
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className="relative bg-white border border-zinc-100 rounded-2xl w-full max-w-sm p-6 shadow-2xl"
            >
                <h3 className="text-base font-bold text-zinc-900 mb-1">Save Build</h3>
                <p className="text-xs text-zinc-500 mb-4">Give your build a name to save it.</p>
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. My Gaming PC"
                    className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 mb-4 transition-all"
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') { onSave(title); onClose(); } }}
                />
                <div className="flex gap-2">
                    <button type="button" onClick={onClose}
                        className="flex-1 h-9 text-sm font-medium border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50 transition-colors">
                        Cancel
                    </button>
                    <button type="button" onClick={() => { onSave(title); onClose(); }}
                        className="flex-1 h-9 text-sm font-bold rounded-xl bg-zinc-900 text-white hover:bg-indigo-600 transition-colors">
                        Save Build
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

/* ─────────────────────────────── Left Nav Item ──────────────────────────── */
const NavItem: React.FC<{
    cat: Category; isActive: boolean; isCompleted: boolean; onClick: () => void;
}> = ({ cat, isActive, isCompleted, onClick }) => {
    const CatIcon = CAT_ICONS[cat] || Box;
    return (
        <button
            type="button"
            onClick={onClick}
            title={CATEGORY_LABELS[cat] || cat}
            className={`nav-item-active group relative w-full flex flex-col items-center gap-1 py-2 transition-all ${
                isActive ? 'nav-item-active' : ''
            }`}
        >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : isCompleted
                        ? 'bg-emerald-50 text-emerald-600 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                        : 'bg-zinc-50 text-zinc-400 group-hover:bg-zinc-100 group-hover:text-zinc-700'
                }`}>
                {isCompleted && !isActive
                    ? <Check size={16} strokeWidth={2.5} />
                    : <CatIcon size={16} />
                }
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-tight leading-none ${
                isActive ? 'text-indigo-600' : isCompleted ? 'text-emerald-600' : 'text-zinc-400'
            }`}>
                {CAT_SHORT[cat] || 'Part'}
            </span>
        </button>
    );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
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

    const compatStatus = compatReport.status === CompatibilityLevel.INCOMPATIBLE
        ? { text: `${compatReport.issues.length} incompatibility`, color: 'text-red-500', dot: 'bg-red-500' }
        : compatReport.issues.length > 0
            ? { text: `${compatReport.issues.length} warning${compatReport.issues.length > 1 ? 's' : ''}`, color: 'text-amber-500', dot: 'bg-amber-500' }
            : cart.length === 0
                ? { text: 'No components yet', color: 'text-zinc-400', dot: 'bg-zinc-300' }
                : { text: 'Compatible', color: 'text-emerald-600', dot: 'bg-emerald-500' };

    return (
        <div className="pcb-root flex flex-col bg-stone-50 overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
            <style>{PAGE_STYLES}</style>

            {/* ── STICKY HEADER ────────────────────────────────────────────── */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-zinc-100 bg-white px-5 lg:px-8 h-14 z-50 flex-shrink-0">
                {/* Left */}
                <div className="flex items-center gap-5">
                    <button
                        type="button"
                        onClick={() => router.push('/builds')}
                        className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-900 transition-colors group"
                    >
                        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                        <span className="hidden sm:inline">Builds</span>
                    </button>

                    <div className="h-5 w-px bg-zinc-100" />

                    <div className="flex items-center gap-2">
                        <Box size={18} className="text-indigo-500" strokeWidth={2} />
                        <h1 className="text-base font-bold text-zinc-900">PC Builder</h1>
                    </div>

                    {/* Compat status pill */}
                    <div className={`hidden md:flex items-center gap-1.5 text-xs font-semibold ${compatStatus.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${compatStatus.dot}`} />
                        {compatStatus.text}
                    </div>
                </div>

                {/* Right — total only, no duplicate checkout */}
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-[9px] text-zinc-400 uppercase font-bold tracking-widest leading-none mb-0.5">Total</p>
                        <p className="text-base font-bold text-zinc-900 leading-none">
                            <AnimatedPrice value={totalPrice} />
                        </p>
                    </div>
                    <div className="h-5 w-px bg-zinc-100 hidden sm:block" />
                    <div className="flex items-center gap-1.5">
                        <button onClick={() => setSaveOpen(true)} className="w-8 h-8 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-all" title="Save">
                            <Save size={14} />
                        </button>
                        <button onClick={handleShare} className="w-8 h-8 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-all" title="Share">
                            <Share2 size={14} />
                        </button>
                    </div>
                </div>
            </header>

            {/* ── MAIN BODY (3-col grid) ─────────────────────────────────── */}
            <div className="pcb-layout flex-1">

                {/* ── LEFT NAV (desktop) ─────────────────────────────── */}
                <aside className="hidden xl:flex flex-col items-center py-4 px-2 gap-1 border-r border-zinc-100 bg-white overflow-y-auto">
                    {CORE_CATEGORIES.map(cat => (
                        <NavItem
                            key={cat}
                            cat={cat}
                            isActive={activeStep === cat}
                            isCompleted={cart.some(i => i.category === cat)}
                            onClick={() => handleStepClick(cat)}
                        />
                    ))}
                </aside>

                {/* ── MAIN CONTENT ─────────────────────────────────────── */}
                <main className="flex flex-col overflow-hidden bg-stone-50 min-w-0">

                    {/* Mobile step scrollbar */}
                    <div className="xl:hidden border-b border-zinc-100 bg-white flex-shrink-0">
                        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide px-4 py-2">
                            {CORE_CATEGORIES.map(cat => {
                                const CatIcon = CAT_ICONS[cat] || Box;
                                const isActive = activeStep === cat;
                                const isDone = cart.some(i => i.category === cat);
                                return (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => handleStepClick(cat)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap flex-shrink-0 transition-all ${
                                            isActive
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : isDone
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 border border-transparent'
                                            }`}
                                    >
                                        {isDone && !isActive ? <Check size={11} strokeWidth={2.5} /> : <CatIcon size={11} />}
                                        {CAT_SHORT[cat] || CATEGORY_LABELS[cat]}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Sub-header: category title + controls — fixed, doesn't scroll */}
                    <div className="flex-shrink-0 px-5 py-3 bg-white border-b border-zinc-100 z-20">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeStep}
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                transition={{ duration: 0.18 }}
                            >
                                <div className="flex items-center justify-between mb-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
                                            {CATEGORY_LABELS[activeStep] || activeStep}
                                        </h2>
                                        {cart.some(i => i.category === activeStep) && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                                <Check size={9} strokeWidth={2.5} /> Selected
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-zinc-400 hidden sm:block">
                                        {CAT_DESCRIPTIONS[activeStep] || `Select your ${CATEGORY_LABELS[activeStep]}.`}
                                    </p>
                                </div>

                                {/* Controls */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* Search */}
                                    <div className="relative group flex-1 sm:flex-none sm:w-52">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" strokeWidth={2} />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            placeholder={`Search ${CATEGORY_LABELS[activeStep]}…`}
                                            className="w-full h-8 pl-9 pr-8 bg-zinc-50 border border-zinc-200 rounded-xl text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
                                        />
                                        {searchTerm && (
                                            <button type="button" onClick={() => setSearchTerm('')}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                                                <X size={13} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Sort */}
                                    <div className="flex items-center bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 h-8 gap-1.5">
                                        <SlidersHorizontal size={12} className="text-zinc-400" />
                                        <select
                                            value={sortOption}
                                            onChange={e => setSortOption(e.target.value)}
                                            className="bg-transparent text-xs text-zinc-700 focus:outline-none cursor-pointer appearance-none"
                                        >
                                            <option value="popularity">Popular</option>
                                            <option value="price-asc">Price ↑</option>
                                            <option value="price-desc">Price ↓</option>
                                            <option value="newest">Newest</option>
                                        </select>
                                    </div>

                                    {/* Compat filter */}
                                    <button
                                        type="button"
                                        onClick={() => setShowIncompat(p => !p)}
                                        className={`flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-xl border transition-all ${
                                            showIncompat
                                                ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                                : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100'
                                            }`}
                                    >
                                        {showIncompat ? <Eye size={12} /> : <EyeOff size={12} />}
                                        <span className="hidden sm:inline">{showIncompat ? 'All parts' : 'Compatible only'}</span>
                                    </button>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* ── PRODUCT GRID — this is the only part that scrolls ── */}
                    <div className="flex-1 overflow-y-auto px-5 py-4">
                        {isLoading ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                                {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mb-3">
                                    <Box size={20} className="text-zinc-300" />
                                </div>
                                <p className="text-sm font-semibold text-zinc-700 mb-1">No products found</p>
                                <p className="text-xs text-zinc-400 mb-4">Try adjusting search or showing incompatible parts</p>
                                {!showIncompat && (
                                    <button type="button" onClick={() => setShowIncompat(true)}
                                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50 transition-colors">
                                        <Eye size={12} /> Show all parts
                                    </button>
                                )}
                            </div>
                        ) : (
                            <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                                <AnimatePresence mode="popLayout">
                                    {products.map((product, index) => {
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
                                                index={index}
                                            />
                                        );
                                    })}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </div>

                    {/* ── Status bar (bottom of main, desktop only) ── */}
                    <div className="hidden lg:flex xl:hidden items-center justify-between h-12 px-5 border-t border-zinc-100 bg-white flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <div className={`flex items-center gap-1.5 text-xs font-semibold ${compatStatus.color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${compatStatus.dot}`} />
                                {compatStatus.text}
                            </div>
                            <div className="h-4 w-px bg-zinc-100" />
                            <span className="text-xs text-zinc-500">{wattage}W est. draw</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setCartOpen(true)}
                            disabled={cart.length === 0}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-900 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 transition-colors disabled:opacity-40"
                        >
                            <ShoppingCart size={12} /> View Build ({cart.length})
                        </button>
                    </div>
                </main>

                {/* ── RIGHT SIDEBAR — Build Summary ─────────────────── */}
                <aside className="hidden xl:flex flex-col overflow-hidden">
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

            {/* ── MOBILE BOTTOM BAR ────────────────────────────────────── */}
            <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-100 px-4 py-3 flex items-center justify-between gap-3">
                <div>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-0.5">Total</p>
                    <p className="text-lg font-bold text-zinc-900 leading-none">
                        <AnimatedPrice value={totalPrice} />
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {compatReport.issues.length > 0 && (
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            compatReport.status === CompatibilityLevel.INCOMPATIBLE
                                ? 'bg-red-50 text-red-600 border-red-200'
                                : 'bg-amber-50 text-amber-600 border-amber-200'
                            }`}>
                            {compatReport.issues.length} issue{compatReport.issues.length > 1 ? 's' : ''}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={() => setCartOpen(true)}
                        disabled={cart.length === 0}
                        className="flex items-center gap-1.5 px-5 py-2.5 bg-zinc-900 text-white text-xs font-bold rounded-2xl hover:bg-indigo-600 transition-colors disabled:opacity-40"
                    >
                        <ShoppingCart size={13} /> View Build ({cart.length})
                    </button>
                </div>
            </div>

            {/* Save dialog */}
            <AnimatePresence>
                {saveOpen && <SaveDialog isOpen={saveOpen} onClose={() => setSaveOpen(false)} onSave={handleSave} />}
            </AnimatePresence>
        </div>
    );
}