'use client';

import React, {
    Suspense, useState, useMemo, useEffect, useCallback, useRef, memo,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useShop } from '@/context/ShopContext';
import { validateBuild } from '@/lib/calculations/compatibility';
import {
    Category, Product, CartItem, CompatibilityLevel, specsToFlat,
} from '@/types';
import {
    Cpu, Monitor, HardDrive, Zap, Box, Fan, Keyboard, Wifi, Layers,
    Check, X, AlertTriangle, Plus, ArrowLeft,
    Search, Share2, Save, ShoppingCart,
    Eye, EyeOff, ChevronRight, AlertOctagon, SlidersHorizontal,
    Hammer,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useBuildSequence } from '@/hooks/useBuildSequence';

/* ─────────────────────────────── Styles ─────────────────────────────────── */
const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

  .pcb-root, .pcb-root * { font-family: 'DM Sans', system-ui, sans-serif; box-sizing: border-box; }

  .pcb-root ::-webkit-scrollbar { width: 3px; height: 3px; }
  .pcb-root ::-webkit-scrollbar-track { background: transparent; }
  .pcb-root ::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 4px; }
  .pcb-root ::-webkit-scrollbar-thumb:hover { background: #d4d4d8; }

  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  .scrollbar-hide::-webkit-scrollbar { display: none; }

  .pcb-layout {
    display: grid;
    grid-template-columns: 72px 1fr 296px;
    grid-template-rows: 1fr;
    height: 100%;
    overflow: hidden;
  }
  @media (max-width: 1279px) {
    .pcb-layout { grid-template-columns: 1fr; }
  }

  .pcb-card {
    transition: box-shadow 0.2s ease, transform 0.2s cubic-bezier(0.22,1,0.36,1), border-color 0.15s ease;
  }
  .pcb-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px -6px rgba(0,0,0,0.09), 0 3px 10px -3px rgba(0,0,0,0.05);
  }
  .pcb-card.selected {
    box-shadow: 0 0 0 2px #4f46e5, 0 8px 24px -6px rgba(79,70,229,0.15);
  }
  .pcb-img { transition: transform 0.45s cubic-bezier(0.34,1.56,0.64,1); }
  .pcb-card:hover .pcb-img { transform: scale(1.06); }

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
    animation: cardIn 0.38s cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .nav-item-active::before {
    content: '';
    position: absolute;
    left: 0; top: 50%; transform: translateY(-50%);
    width: 2px; height: 24px;
    background: #4f46e5;
    border-radius: 0 2px 2px 0;
  }

  .product-grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(2, 1fr);
  }
  @media (min-width: 480px)  { .product-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 640px)  { .product-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (min-width: 900px)  { .product-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (min-width: 1100px) { .product-grid { grid-template-columns: repeat(4, 1fr); } }
  @media (min-width: 1400px) { .product-grid { grid-template-columns: repeat(5, 1fr); } }

  .mobile-bar {
    padding-bottom: max(12px, env(safe-area-inset-bottom));
  }
`;


// Static animation variants — defined once outside component
const MOTION_SPRING = { type: 'spring', stiffness: 400, damping: 30 } as const;
const MOTION_EASE_OUT = { duration: 0.4, ease: 'easeOut' } as const;
const MOTION_FAST = { duration: 0.15 } as const;

/* ─────────────────────────────── Utilities ──────────────────────────────── */
// Combined single-pass wattage + PSU capacity to avoid two separate cart iterations
function estimatePowerStats(cart: CartItem[]): { wattage: number; psuCap: number | null } {
    let w = 50;
    let psuCap: number | null = null;
    for (const item of cart) {
        const s = specsToFlat(item.specs);
        if (item.category?.name.toUpperCase() === 'PSU') {
            const cap = Number(s.wattage);
            if (!isNaN(cap)) psuCap = cap;
        }
        const n = Number(s.wattage);
        if (!isNaN(n) && n > 0) { w += n * item.quantity; continue; }
        if (item.category?.name.toUpperCase() === 'PROCESSOR') w += 65;
        if (item.category?.name.toUpperCase() === 'GPU') w += 150;
        if (item.category?.name.toUpperCase() === 'RAM') w += 5 * item.quantity;
        if (item.category?.name.toUpperCase() === 'STORAGE') w += 5 * item.quantity;
    }
    return { wattage: w, psuCap };
}

// Keep legacy helpers as thin wrappers for BuildSummaryPanel (no breaking changes)
function estimateWattage(cart: CartItem[]): number {
    return estimatePowerStats(cart).wattage;
}
function getPsuCap(cart: CartItem[]): number | null {
    return estimatePowerStats(cart).psuCap;
}

/* ─────────────────────────────── AnimatedPrice ──────────────────────────── */
const AnimatedPrice: React.FC<{ value: number }> = memo(({ value }) => {
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
});
AnimatedPrice.displayName = 'AnimatedPrice';

/* ─────────────────────────────── SkeletonCard ───────────────────────────── */
// Pure static component — no props, no re-render risk
const SkeletonCard = memo(() => (
    <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden">
        <div className="aspect-[4/3] pcb-skeleton" />
        <div className="p-3 space-y-2.5">
            <div className="h-2 pcb-skeleton rounded-full w-1/4" />
            <div className="h-3 pcb-skeleton rounded-full w-full" />
            <div className="h-3 pcb-skeleton rounded-full w-3/4" />
            <div className="h-2 pcb-skeleton rounded-full w-1/2" />
            <div className="pt-1.5 flex justify-between items-center gap-2">
                <div className="h-4 pcb-skeleton rounded-full w-1/3" />
                <div className="h-7 w-16 pcb-skeleton rounded-xl" />
            </div>
        </div>
    </div>
));
SkeletonCard.displayName = 'SkeletonCard';

/* ─────────────────────────────── ProductCard ────────────────────────────── */
// memo prevents re-render when unrelated cart items change
const ProductCard: React.FC<{
    product: Product;
    isInCart: boolean;
    compatibility: CompatibilityLevel;
    compatMessage?: string;
    onAdd: () => void;
    onRemove: () => void;
    index: number;
}> = memo(({ product, isInCart, compatibility, compatMessage, onAdd, onRemove, index }) => {
    const price = product.price || 0;
    const compareAt = product.compareAtPrice;
    const status = product.stockStatus;

    const isOos = status === 'OUT_OF_STOCK';
    const isLowStock = status === 'LOW_STOCK';
    const isIncompat = compatibility === CompatibilityLevel.INCOMPATIBLE;
    const isWarning = compatibility === CompatibilityLevel.WARNING;

    // Memoize spec entries — only re-computed when product changes
    const specEntries = useMemo(
        () => Object.entries(specsToFlat(product.specs)).slice(0, 3),
        [product.specs],
    );

    const discount = useMemo(
        () => compareAt && compareAt > price ? Math.round((1 - price / compareAt) * 100) : null,
        [price, compareAt],
    );

    const compatDotClass = isIncompat
        ? 'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]'
        : isWarning
        ? 'bg-amber-400 shadow-[0_0_4px_rgba(245,158,11,0.4)]'
        : 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.4)]';

    const compatLabel = isIncompat ? 'Incompatible' : isWarning ? 'Check specs' : 'Compatible';

    // Stable event handlers — no inline arrow functions in JSX
    const handleCardClick = useCallback(() => {
        if (isInCart) { onRemove(); return; }
        if (!isIncompat && !isOos) onAdd();
    }, [isInCart, isIncompat, isOos, onAdd, onRemove]);

    const handleButtonClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        isInCart ? onRemove() : (!isIncompat && !isOos && onAdd());
    }, [isInCart, isIncompat, isOos, onAdd, onRemove]);

    return (
        <article
            className={`pcb-card card-enter bg-white border rounded-lg sm:rounded-2xl overflow-hidden flex flex-col h-full relative cursor-pointer
                ${isInCart ? 'selected border-indigo-200' : 'border-zinc-100 hover:border-zinc-200'}
                ${isIncompat && !isInCart ? 'opacity-50' : ''}`}
            style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
            onClick={handleCardClick}
        >
            {/* IMAGE */}
            <div className="relative aspect-[4/3] bg-gradient-to-br from-zinc-50 to-stone-50 flex items-center justify-center p-1 sm:p-3 overflow-hidden flex-shrink-0">
                <Link
                    href={`/products/${product.id}`}
                    className="absolute inset-0 z-0"
                    onClick={(e) => e.stopPropagation()}
                    tabIndex={-1}
                >
                    <span className="sr-only">View {product.name}</span>
                </Link>

                <div className="relative w-full h-full">
                    <Image
                        src={product.media?.[0]?.url || '/placeholder.png'}
                        alt={product.name}
                        fill
                        className="object-contain mix-blend-multiply pointer-events-none"
                        sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, 200px"
                        loading="lazy"
                    />
                </div>

                {/* badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                    {isOos && (
                        <span className="bg-red-500 text-white text-[8px] sm:text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Out of Stock
                        </span>
                    )}
                    {isLowStock && !isOos && (
                        <span className="bg-amber-500 text-white text-[8px] sm:text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Low Stock
                        </span>
                    )}
                    {discount && !isOos && (
                        <span className="bg-indigo-600 text-white text-[8px] sm:text-[9px] font-bold px-2 py-0.5 rounded-full">
                            -{discount}%
                        </span>
                    )}
                </div>

                {!isInCart && (
                    <div
                        className={`absolute bottom-2 right-2 w-2 h-2 rounded-full z-10 ${compatDotClass}`}
                        title={compatLabel}
                    />
                )}
            </div>

            {/* CONTENT */}
            <div className="p-1 sm:p-3 flex flex-col flex-1 min-h-0">
                <p className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-widest mb-0.5 sm:mb-1 truncate ${
                    isInCart ? 'text-indigo-500' : 'text-zinc-400'
                }`}>
                    {product.category?.name.toUpperCase() || product.category?.name}
                </p>

                <Link
                    href={`/products/${product.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="block mb-0.5 sm:mb-1"
                >
                    <h3 className="font-semibold text-zinc-900 text-[10px] sm:text-[12px] leading-snug line-clamp-2 min-h-[30px] hover:text-indigo-600">
                        {product.name}
                    </h3>
                </Link>

                {specEntries.length > 0 && (
                    <p className="text-[9px] sm:text-[10px] text-zinc-400 truncate mb-0.5 sm:mb-1 leading-none">
                        {specEntries
                            .map(([, v]) =>
                                Array.isArray(v) ? v.join(', ')
                                : typeof v === 'object' ? JSON.stringify(v)
                                : String(v)
                            )
                            .join(' · ')}
                    </p>
                )}

                {compatMessage && !isInCart && (isIncompat || isWarning) && (
                    <p className={`text-[8px] pt-1 sm:text-[9px] leading-snug px-2 py-1 rounded-lg mb-0.5 sm:mb-1 ${
                        isIncompat
                            ? 'bg-red-50 text-red-600 border border-red-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                        {compatMessage}
                    </p>
                )}

                {/* FOOTER */}
                <div className="mt-auto border-t border-zinc-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                        <span className="text-xs sm:text-sm font-bold text-zinc-900 tabular-nums">
                            ₹{price.toLocaleString('en-IN')}
                        </span>
                        {compareAt && compareAt > price && (
                            <span className="ml-1 text-[8px] sm:text-[9px] text-zinc-400 line-through">
                                ₹{compareAt.toLocaleString('en-IN')}
                            </span>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleButtonClick}
                        disabled={(isIncompat && !isInCart) || (isOos && !isInCart)}
                        className={`flex-shrink-0 h-6 sm:h-7 px-2 sm:px-3 rounded-lg sm:rounded-xl
                        text-[9px] sm:text-[10px] font-bold uppercase tracking-wide
                        flex items-center justify-center gap-1
                        w-full sm:w-auto transition-all duration-200
                        ${
                            isInCart
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-red-50 hover:text-red-600'
                                : isOos || isIncompat
                                ? 'bg-zinc-50 text-zinc-300 cursor-not-allowed border'
                                : 'bg-zinc-900 text-white hover:bg-indigo-600'
                        }`}
                    >
                        {isInCart ? (
                            <><X size={9} strokeWidth={3} />Remove</>
                        ) : isOos ? (
                            'Sold Out'
                        ) : (
                            <><Plus size={9} strokeWidth={3} />Select</>
                        )}
                    </button>
                </div>
            </div>
        </article>
    );
});
ProductCard.displayName = 'ProductCard';

/* ─────────────────────────────── BuildSummaryPanel ──────────────────────── */
const BuildSummaryPanel: React.FC<{
    cart: CartItem[];
    coreCategories: Category[];
    onRemove: (id: string) => void;
    onStepClick: (cat: Category) => void;
    activeStep: Category;
    onSave: () => void;
    onShare: () => void;
    onCheckout: () => void;
    dynamicRules?: any[];
}> = memo(({ cart, coreCategories, onRemove, onStepClick, activeStep, onSave, onShare, onCheckout, dynamicRules = [] }) => {
    const report = useMemo(() => validateBuild(cart, dynamicRules), [cart, dynamicRules]);
    const totalPrice = useMemo(
        () => cart.reduce((s, i) => s + (i.price || 0) * i.quantity, 0),
        [cart],
    );
    const { wattage, psuCap } = useMemo(() => estimatePowerStats(cart), [cart]);
    const progressPct = coreCategories.length > 0 ? (cart.length / coreCategories.length) * 100 : 0;

    return (
        <div className="flex flex-col h-full bg-white border-l border-zinc-100">
            <div className="px-4 pt-4 pb-3 border-b border-zinc-100 flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Build Summary</h3>
                    <div className="flex items-center gap-1">
                        <button onClick={onSave} className="w-7 h-7 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-all"><Save size={13} /></button>
                        <button onClick={onShare} className="w-7 h-7 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-all"><Share2 size={13} /></button>
                    </div>
                </div>
                <div>
                    <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-0.5">Estimated Total</p>
                    <p className="text-2xl font-bold text-zinc-900 tracking-tight"><AnimatedPrice value={totalPrice} /></p>
                </div>
                <div className="mt-3">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] text-zinc-400 font-medium">{cart.length}/{coreCategories.length} components</span>
                        <span className="text-[10px] font-bold text-indigo-500">{Math.round(progressPct)}%</span>
                    </div>
                    <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-indigo-500 rounded-full" animate={{ width: `${progressPct}%` }} transition={MOTION_EASE_OUT} />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
                {coreCategories.map(cat => {
                    const item = cart.find(i => i.category?.name === cat.name);
                    const isActive = activeStep?.name === cat.name;
                    return (
                        <div key={cat?.name} onClick={() => onStepClick(cat)} className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer transition-all ${isActive ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-zinc-50 border border-transparent'}`}>
                            <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${item ? 'bg-indigo-100' : isActive ? 'bg-indigo-50' : 'bg-zinc-100'}`}>
                                {item ? <Check size={13} strokeWidth={2.5} className="text-indigo-600" /> : <Layers size={13} className="text-zinc-300" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-[10px] font-bold uppercase tracking-wider ${item ? 'text-zinc-900' : isActive ? 'text-indigo-600' : 'text-zinc-400'}`}>{cat?.name}</p>
                                <p className={`text-[11px] truncate leading-none mt-0.5 ${item ? 'text-zinc-500' : 'text-zinc-300 italic'}`}>{item ? item.name : 'Not selected'}</p>
                            </div>
                            {item ? (
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <span className="text-[11px] font-bold text-zinc-700 tabular-nums">₹{((item.price || 0) * item.quantity).toLocaleString('en-IN')}</span>
                                    <button onClick={e => { e.stopPropagation(); onRemove(item.id); }} className="w-5 h-5 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all"><X size={10} strokeWidth={2.5} /></button>
                                </div>
                            ) : <ChevronRight size={12} className={`flex-shrink-0 transition-colors ${isActive ? 'text-indigo-400' : 'text-zinc-200 group-hover:text-zinc-400'}`} />}
                        </div>
                    );
                })}
            </div>

            <AnimatePresence>
                {report.issues.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="px-4 py-3 space-y-1.5 border-t border-zinc-100">
                        {report.issues.slice(0, 2).map((issue, i) => (
                            <div key={i} className={`flex items-start gap-2 px-2.5 py-1.5 rounded-xl text-[10px] leading-snug ${issue.level === CompatibilityLevel.INCOMPATIBLE ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                                {issue.level === CompatibilityLevel.INCOMPATIBLE ? <AlertOctagon size={11} className="mt-px" /> : <AlertTriangle size={11} className="mt-px" />}
                                {issue.message}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-4 pb-4 pt-3 border-t border-zinc-100">
                <button onClick={onCheckout} disabled={cart.length === 0} className="w-full h-10 flex items-center justify-center gap-2 bg-zinc-900 text-white text-xs font-bold rounded-2xl hover:bg-indigo-600 transition-colors disabled:opacity-40 shadow-sm"><ShoppingCart size={14} />View Build ({cart.length})</button>
            </div>
        </div>
    );
});
BuildSummaryPanel.displayName = 'BuildSummaryPanel';

/* ─────────────────────────────── SaveDialog ─────────────────────────────── */
const SaveDialog: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (title: string) => void;
}> = memo(({ isOpen, onClose, onSave }) => {
    const [title, setTitle] = useState('');
    const handleSave = useCallback(() => { if (title.trim()) { onSave(title); onClose(); } }, [title, onSave, onClose]);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 8 }} transition={MOTION_SPRING} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-5 w-full max-w-xs shadow-2xl border border-zinc-100">
                <h3 className="text-sm font-bold text-zinc-900 mb-1">Save Build</h3>
                <p className="text-xs text-zinc-400 mb-4">Give your build a memorable name.</p>
                <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Gaming Beast" className="w-full h-9 px-3 border border-zinc-200 rounded-xl text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition" />
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 h-9 text-sm font-medium border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50 transition-colors">Cancel</button>
                    <button onClick={handleSave} disabled={!title.trim()} className="flex-1 h-9 text-sm font-bold rounded-xl bg-zinc-900 text-white hover:bg-indigo-600 transition-colors disabled:opacity-40">Save Build</button>
                </div>
            </motion.div>
        </div>
    );
});
SaveDialog.displayName = 'SaveDialog';

/* ─────────────────────────────── NavItem ──────────────────────────── */
const NavItem: React.FC<{
    cat: Category; isActive: boolean; isCompleted: boolean; onClick: () => void;
}> = memo(({ cat, isActive, isCompleted, onClick }) => {
    return (
        <button type="button" onClick={onClick} title={cat?.name} className={`relative group w-full flex flex-col items-center gap-1 py-2.5 transition-all ${isActive ? 'nav-item-active' : ''}`}>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : isCompleted ? 'bg-emerald-50 text-emerald-600 group-hover:bg-indigo-50 group-hover:text-indigo-600' : 'bg-zinc-50 text-zinc-400 group-hover:bg-zinc-100 group-hover:text-zinc-700'}`}>
                {isCompleted && !isActive ? <Check size={16} strokeWidth={2.5} /> : <Box size={16} />}
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-tight leading-none ${isActive ? 'text-indigo-600' : isCompleted ? 'text-emerald-600' : 'text-zinc-400'}`}>{cat?.name}</span>
        </button>
    );
});
NavItem.displayName = 'NavItem';

const SKELETON_ITEMS = Array.from({ length: 12 }, (_, i) => i);

function PCBuilderPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { cart, addToCart, removeFromCart, setCartOpen, cartTotal, clearCart, loadCart } = useShop();
    const { toast } = useToast();

    const isBuildMode = searchParams.get('mode') === 'build';
    const toggleBuildMode = useCallback(() => {
        if (isBuildMode) router.push(window.location.pathname);
        else router.push(`${window.location.pathname}?mode=build`);
    }, [isBuildMode, router]);

    const saveCurrentBuild = useCallback(async (title: string) => {
        if (cart.length === 0) return;
        try {
            const res = await fetch('/api/build-guides', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: title, total: cartTotal, items: cart.map(i => ({ productId: i.id, quantity: i.quantity })) }),
            });
            if (res.ok) toast({ title: 'Build Guide saved!' });
            else toast({ title: 'Failed to save', variant: 'destructive' });
        } catch (err) { toast({ title: 'Error', variant: 'destructive' }); }
    }, [cart, cartTotal, toast]);

    const generateShareLink = useCallback((): string => {
        if (cart.length === 0) return '';
        const encoded = btoa(encodeURIComponent(JSON.stringify(cart.map(i => [i.id, i.quantity])))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const url = new URL('/builds', window.location.origin);
        url.searchParams.set('share', encoded);
        return url.toString();
    }, [cart]);

    const { buildSequence, loading: sequenceLoading, error: sequenceError,  retry: retrySequence } = useBuildSequence();
    const coreCategories = useMemo(() => buildSequence.map(i => ({ ...i.category, name: i.category?.label || '' } as unknown as Category)), [buildSequence]);
    
    const [activeStep, setActiveStep] = useState<Category>(coreCategories[0]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debounced, setDebounced] = useState('');
    const [showIncompat, setShowIncompat] = useState(false);
    const [sortOption, setSortOption] = useState('popularity');
    const [saveOpen, setSaveOpen] = useState(false);
    const [dynamicRules, setDynamicRules] = useState<any[]>([]);
    const prevParams = useRef('');

    useEffect(() => {
        fetch('/api/compatibility-rules/public').then(r => r.json()).then(d => setDynamicRules(Array.isArray(d) ? d : [])).catch(() => {});
    }, []);

    useEffect(() => { if (!isBuildMode) toggleBuildMode(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { if (coreCategories.length && (!activeStep || !coreCategories.includes(activeStep))) setActiveStep(coreCategories[0]); }, [coreCategories, activeStep]);
    useEffect(() => { const t = setTimeout(() => setDebounced(searchTerm), 300); return () => clearTimeout(t); }, [searchTerm]);

    // Restore cart from share parameter
    useEffect(() => {
        const shareParam = searchParams.get('share');
        if (!shareParam) return;

        try {
            // Decode the share parameter
            const decoded = shareParam.replace(/-/g, '+').replace(/_/g, '/');
            const jsonStr = decodeURIComponent(atob(decoded));
            const sharedData = JSON.parse(jsonStr);
            
            // Validate the shared data format
            if (!Array.isArray(sharedData)) return;
            
            // Fetch product details for each shared item
            const restoreCart = async () => {
                const productIds = sharedData.map(([id]: [string, number]) => id);
                if (productIds.length === 0) return;
                
                try {
                    const res = await fetch('/api/products', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids: productIds })
                    });
                    
                    if (res.ok) {
                        const data = await res.json();
                        const products = data.products || [];
                        
                        // Clear current cart and add shared items
                        const sharedItems: CartItem[] = [];
                        sharedData.forEach(([id, quantity]: [string, number]) => {
                            const product = products.find((p: Product) => p.id === id);
                            if (product) {
                                sharedItems.push({
                                    ...product,
                                    quantity
                                });
                            }
                        });
                        
                        // Update cart with shared items
                        if (sharedItems.length > 0) {
                            // Clear cart and load shared items
                            clearCart();
                            loadCart(sharedItems);
                            
                            toast({ 
                                title: 'Build restored!', 
                                description: `Loaded ${sharedItems.length} components from shared link` 
                            });
                        }
                    }
                } catch (error) {
                    console.error('Error restoring shared build:', error);
                    toast({ 
                        title: 'Failed to restore build', 
                        variant: 'destructive' 
                    });
                }
            };
            
            restoreCart();
            
            // Clean up the URL
            const url = new URL(window.location.href);
            url.searchParams.delete('share');
            window.history.replaceState({}, '', url.toString());
            
        } catch (error) {
            console.error('Error parsing share parameter:', error);
            toast({ 
                title: 'Invalid share link', 
                variant: 'destructive' 
            });
        }
    }, [searchParams, clearCart, loadCart, toast]);

    const cartSpecsCache = useMemo(() => {
        const cpu = cart.find(i => i.category?.name.toUpperCase() === 'PROCESSOR');
        const mobo = cart.find(i => i.category?.name.toUpperCase() === 'MOTHERBOARD');
        return {
            cpuSocket: cpu ? String(specsToFlat(cpu.specs).socket ?? '') : '',
            moboSocket: mobo ? String(specsToFlat(mobo.specs).socket ?? '') : '',
            moboRamType: mobo ? String(specsToFlat(mobo.specs).ramType ?? '') : '',
            cpuRamType: cpu ? String(specsToFlat(cpu.specs).ramType ?? '') : '',
        };
    }, [cart]);

    useEffect(() => {
        if (!activeStep) return;
        let cancelled = false;
        (async () => {
            setIsLoading(true);
            try {
                const p = new URLSearchParams();
                p.set('category', activeStep.name.toUpperCase());
                p.set('limit', '48');
                if (debounced) p.set('q', debounced);
                if (sortOption !== 'popularity') p.set('sort', sortOption);
                if (!showIncompat) {
                    const { cpuSocket, moboSocket, moboRamType, cpuRamType } = cartSpecsCache;
                    if (activeStep.name.toUpperCase() === 'MOTHERBOARD' && cpuSocket) p.set('f_specs.socket', cpuSocket);
                    if (activeStep.name.toUpperCase() === 'PROCESSOR' && moboSocket) p.set('f_specs.socket', moboSocket);
                    if (activeStep.name.toUpperCase() === 'RAM') { const type = moboRamType || cpuRamType; if (type) p.set('f_specs.ramType', type); }
                }
                const qs = p.toString();
                if (prevParams.current === qs && products.length) { setIsLoading(false); return; }
                prevParams.current = qs;
                const res = await fetch(`/api/products?${qs}`);
                if (cancelled) return;
                if (!res.ok) {
                    console.error('API Error:', res.status, res.statusText);
                    console.error('Query string:', qs);
                    return;
                }
                const data = await res.json();
                let filteredProducts = data.products || [];
                
                // Client-side filtering for coolers based on CPU socket
                if (activeStep.name.toUpperCase() === 'COOLER' && !showIncompat && cartSpecsCache.cpuSocket) {
                    filteredProducts = filteredProducts.filter((product: Product) => {
                        const socketSupport = specsToFlat(product.specs).socketSupport;
                        if (!socketSupport) return true;
                        
                        // Handle both array and comma-separated string formats
                        let supportedSockets: string[];
                        if (Array.isArray(socketSupport)) {
                            supportedSockets = socketSupport.map((value) => String(value).trim());
                        } else if (typeof socketSupport === 'string') {
                            supportedSockets = socketSupport.split(',').map(s => s.trim());
                        } else {
                            supportedSockets = [String(socketSupport)];
                        }
                        
                        // Check if cooler has universal support or matches the CPU socket
                        const isUniversal = supportedSockets.some(socket => socket.toLowerCase() === 'universal');
                        const hasSupport = isUniversal || supportedSockets.some(socket => 
                            socket.toLowerCase() === cartSpecsCache.cpuSocket.toLowerCase()
                        );
                        
                        return hasSupport;
                    });
                }
                
                if (!cancelled) setProducts(filteredProducts);
            } finally { if (!cancelled) setIsLoading(false); }
        })();
        return () => { cancelled = true; };
    }, [activeStep, debounced, sortOption, cartSpecsCache, showIncompat]);

    const handleAdd = useCallback((product: Product) => {
        addToCart(product);
        setTimeout(() => {
            setActiveStep(prev => {
                const next = coreCategories.find(cat => cat.name !== product.category?.name && !cart.some(i => i.category?.name === cat.name));
                return next ?? prev;
            });
        }, 100);
    }, [addToCart, cart, coreCategories]);

    const handleRemove = useCallback((id: string) => removeFromCart(id), [removeFromCart]);
    const handleStepClick = useCallback((cat: Category) => { setActiveStep(cat); setSearchTerm(''); prevParams.current = ''; }, []);
    
    const cartCompatMap = useMemo(() => new Map(), [cart]); // eslint-disable-line react-hooks/exhaustive-deps
    const checkCompat = useCallback((product: Product) => {
        if (cart.some(i => i.id === product.id)) return { level: CompatibilityLevel.COMPATIBLE, message: '' };
        if (cartCompatMap.has(product.id)) return cartCompatMap.get(product.id);
        const rep = validateBuild([...cart.filter(i => i.category?.name !== product.category?.name), { ...product, quantity: 1 }], dynamicRules);
        const rel = rep.issues.filter(iss => iss.componentIds.includes(product.id));
        const res = { level: rel.length ? (rel.some(i => i.level === CompatibilityLevel.INCOMPATIBLE) ? CompatibilityLevel.INCOMPATIBLE : CompatibilityLevel.WARNING) : CompatibilityLevel.COMPATIBLE, message: rel[0]?.message || '' };
        cartCompatMap.set(product.id, res);
        return res;
    }, [cart, cartCompatMap, dynamicRules]);

    const compatReport = useMemo(() => validateBuild(cart, dynamicRules), [cart, dynamicRules]);
    const compatStatus = useMemo(() => {
        if (compatReport.status === CompatibilityLevel.INCOMPATIBLE) return { text: `${compatReport.issues.length} incompatibility`, color: 'text-red-500', dot: 'bg-red-500' };
        if (compatReport.issues.length > 0) return { text: `${compatReport.issues.length} warning(s)`, color: 'text-amber-500', dot: 'bg-amber-500' };
        if (cart.length === 0) return { text: 'No components yet', color: 'text-zinc-400', dot: 'bg-zinc-300' };
        return { text: 'Compatible', color: 'text-emerald-600', dot: 'bg-emerald-500' };
    }, [compatReport, cart.length]);

    const navClickHandlers = useMemo(() => Object.fromEntries(coreCategories.map(cat => [cat.name, () => handleStepClick(cat)])), [coreCategories, handleStepClick]);

    return (
        <div className="pcb-root flex flex-col bg-stone-50 overflow-hidden" style={{ height: '100vh' }}>
            <style>{PAGE_STYLES}</style>
            <header className="flex items-center justify-between border-b bg-white px-4 h-14 z-50 flex-shrink-0 gap-3">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push('/builds')} className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-900 transition-colors">
                        <ArrowLeft size={15} /> <span className="hidden sm:inline text-sm">Builds</span>
                    </button>
                    <div className="h-5 w-px bg-zinc-100 hidden sm:block" />
                    <div className="flex items-center gap-2">
                        <Hammer size={16} className="text-indigo-500" />
                        <h1 className="text-sm sm:text-base font-bold text-zinc-900">PC Builder</h1>
                    </div>
                    <div className={`hidden md:flex items-center gap-1.5 text-xs font-semibold ${compatStatus.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${compatStatus.dot}`} />
                        {compatStatus.text}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-[9px] text-zinc-400 uppercase font-bold tracking-widest leading-none mb-0.5">Total</p>
                        <p className="text-base font-bold text-zinc-900 leading-none tabular-nums"><AnimatedPrice value={cartTotal} /></p>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button onClick={() => setSaveOpen(true)} className="w-8 h-8 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-all"><Save size={14} /></button>
                        <button onClick={() => { const link = generateShareLink(); if (link) { navigator.clipboard.writeText(link); toast({ title: 'Link copied!' }); } }} className="w-8 h-8 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-all"><Share2 size={14} /></button>
                    </div>
                </div>
            </header>

            {/* Build Sequence Loading State */}
            {sequenceLoading && (
                <div className="mx-4 mt-3 mb-2 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-blue-800">Loading build sequence...</p>
                        <p className="text-xs text-blue-600 mt-0.5">Setting up PC builder components</p>
                    </div>
                </div>
            )}

           
            <div className="pcb-layout flex-1 min-h-0">
                <aside className="hidden xl:flex flex-col items-center py-4 px-2 border-r bg-white overflow-y-auto">
                    {coreCategories.map(cat => (
                        <NavItem key={cat.name} cat={cat} isActive={activeStep?.name === cat.name} isCompleted={cart.some(i => i.category?.name === cat.name)} onClick={navClickHandlers[cat.name]} />
                    ))}
                </aside>

                <main className="flex flex-col overflow-hidden min-w-0">
                    {sequenceLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-sm font-medium text-zinc-600">Loading PC Builder...</p>
                                <p className="text-xs text-zinc-400 mt-1">Setting up build sequence</p>
                            </div>
                        </div>
                    ) : (
                        <>
                    <div className="flex-shrink-0 px-4 sm:px-5 py-3 bg-white border-b z-20">
                        <div className="flex items-center justify-between mb-2.5">
                            <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight leading-none">{activeStep?.name}</h2>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-52">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={`Search ${activeStep?.name}…`} className="w-full h-8 pl-9 pr-8 bg-zinc-50 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100" />
                            </div>
                            <div className="flex items-center bg-zinc-50 border rounded-xl px-2.5 h-8 gap-1.5 flex-shrink-0">
                                <SlidersHorizontal size={12} className="text-zinc-400" />
                                <select value={sortOption} onChange={e => setSortOption(e.target.value)} className="bg-transparent text-xs text-zinc-700 focus:outline-none appearance-none cursor-pointer">
                                    <option value="popularity">Popular</option>
                                    <option value="price-asc">Price ↑</option>
                                    <option value="price-desc">Price ↓</option>
                                </select>
                            </div>
                            <button type="button" onClick={() => setShowIncompat(p => !p)} className={`flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-xl border transition-all ${showIncompat ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-zinc-50 border text-zinc-500'}`}>
                                {showIncompat ? <Eye size={12} /> : <EyeOff size={12} />}
                                <span className="hidden sm:inline">{showIncompat ? 'All parts' : 'Compatible only'}</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-4 pb-20 xl:pb-4">
                        {isLoading ? (
                            <div className="product-grid">{SKELETON_ITEMS.map(i => <SkeletonCard key={i} />)}</div>
                        ) : products.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <Box size={40} className="text-zinc-200 mb-4" />
                                <p className="text-sm font-bold text-zinc-700">No products found</p>
                            </div>
                        ) : (
                            <div className="product-grid">
                                {products.map((product, index) => {
                                    const inCart = cart.some(i => i.id === product.id);
                                    const compat = checkCompat(product);
                                    return <ProductCard key={product.id} product={product} isInCart={inCart} compatibility={compat.level} compatMessage={compat.message} onAdd={() => handleAdd(product)} onRemove={() => handleRemove(product.id)} index={index} />;
                                })}
                            </div>
                        )}
                    </div>
                        </>
                    )}
                </main>

                <aside className="hidden xl:flex flex-col overflow-hidden">
                    <BuildSummaryPanel cart={cart} coreCategories={coreCategories} onRemove={handleRemove} onStepClick={handleStepClick} activeStep={activeStep!} onSave={() => setSaveOpen(true)} onShare={() => {}} onCheckout={() => setCartOpen(true)} dynamicRules={dynamicRules} />
                </aside>
            </div>

            <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md px-4 pt-3 mobile-bar flex items-center justify-between gap-3 mb-20 sm:mb-0">
                <div className="min-w-0">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-0.5">Total</p>
                    <p className="text-lg font-bold text-zinc-900 leading-none tabular-nums"><AnimatedPrice value={cartTotal} /></p>
                </div>
                <button onClick={() => setCartOpen(true)} disabled={cart.length === 0} className="flex items-center gap-1.5 px-5 py-2.5 bg-zinc-900 text-white text-xs font-bold rounded-2xl disabled:opacity-40 shadow-sm"><ShoppingCart size={13} /> View Build</button>
            </div>

            <AnimatePresence>
                {saveOpen && <SaveDialog isOpen={saveOpen} onClose={() => setSaveOpen(false)} onSave={saveCurrentBuild} />}
            </AnimatePresence>
        </div>
    );
}

export default function PCBuilderPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-stone-50" />}>
            <PCBuilderPageContent />
        </Suspense>
    );
}
