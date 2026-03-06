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
    Layers, Eye, EyeOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const CATEGORY_ICONS: Record<string, React.FC<{ size?: number; className?: string }>> = {
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

// ─── Power Estimation ───────────────────────────────────────────────────
function estimateWattage(cart: CartItem[]): number {
    let total = 50; // base overhead
    for (const item of cart) {
        const specs = specsToFlat(item.specs);
        const w = Number(specs.wattage);
        if (!isNaN(w) && w > 0) {
            total += w * item.quantity;
        } else {
            // fallback estimates by category
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

// ─── Starter Templates ─────────────────────────────────────────────────
interface StarterTemplate {
    id: string;
    title: string;
    subtitle: string;
    budget: string;
    gradient: string;
    icon: React.FC<{ size?: number; className?: string }>;
}

const STARTER_TEMPLATES: StarterTemplate[] = [
    { id: 'budget', title: 'Budget Gaming', subtitle: '1080p • Esports Ready', budget: '~₹50K', gradient: 'from-blue-500 to-cyan-500', icon: Sparkles },
    { id: 'midrange', title: '1440p Sweet Spot', subtitle: 'High Refresh • AAA Ready', budget: '~₹1.2L', gradient: 'from-violet-500 to-purple-600', icon: Zap },
    { id: 'creator', title: 'Creator Workstation', subtitle: 'Video Editing • 3D', budget: '~₹1.5L', gradient: 'from-rose-500 to-pink-600', icon: Monitor },
    { id: 'high-end', title: 'No Compromise 4K', subtitle: 'Max Settings • RT', budget: '~₹2.5L+', gradient: 'from-amber-500 to-orange-600', icon: Sparkles },
];

// ─── Product Card Component ────────────────────────────────────────────
const ProductCard: React.FC<{
    product: Product;
    isInCart: boolean;
    compatibility: CompatibilityLevel;
    compatMessage?: string;
    onAdd: () => void;
    onRemove: () => void;
}> = ({ product, isInCart, compatibility, compatMessage, onAdd, onRemove }) => {
    const price = product.variants?.[0]?.price || 0;
    const specs = specsToFlat(product.specs);
    const specEntries = Object.entries(specs).slice(0, 3);

    const compatColor = {
        [CompatibilityLevel.COMPATIBLE]: 'border-emerald-200 bg-emerald-50',
        [CompatibilityLevel.WARNING]: 'border-yellow-200 bg-yellow-50',
        [CompatibilityLevel.INCOMPATIBLE]: 'border-red-200 bg-red-50',
    }[compatibility];

    const compatIcon = {
        [CompatibilityLevel.COMPATIBLE]: <CheckCircle2 size={12} className="text-emerald-600" />,
        [CompatibilityLevel.WARNING]: <AlertTriangle size={12} className="text-yellow-600" />,
        [CompatibilityLevel.INCOMPATIBLE]: <AlertOctagon size={12} className="text-red-600" />,
    }[compatibility];

    const isIncompatible = compatibility === CompatibilityLevel.INCOMPATIBLE;

    return (
        <div className={`group relative bg-white border rounded-xl overflow-hidden transition-all duration-200 ${isInCart ? 'border-blue-300 ring-2 ring-blue-100' : isIncompatible ? 'border-red-100 opacity-60' : 'border-zinc-200 hover:border-zinc-300 hover:shadow-md'}`}>
            {/* Image */}
            <div className="relative aspect-square bg-zinc-50 p-4 flex items-center justify-center">
                <Image
                    src={product.media?.[0]?.url || '/placeholder.png'}
                    alt={product.name}
                    fill
                    className="object-contain p-4 mix-blend-multiply"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                />
                {/* Compat Badge */}
                {!isInCart && (
                    <div className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${compatColor}`}>
                        {compatIcon}
                        <span className={compatibility === CompatibilityLevel.COMPATIBLE ? 'text-emerald-700' : compatibility === CompatibilityLevel.WARNING ? 'text-yellow-700' : 'text-red-700'}>
                            {compatibility === CompatibilityLevel.COMPATIBLE ? 'Compatible' : compatibility === CompatibilityLevel.WARNING ? 'Warning' : 'Incompatible'}
                        </span>
                    </div>
                )}
                {isInCart && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                        <Check size={10} strokeWidth={3} /> Selected
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-3.5">
                <h4 className="text-sm font-semibold text-zinc-900 line-clamp-2 leading-tight mb-1.5">
                    {product.name}
                </h4>

                {/* Key Specs */}
                <div className="flex flex-wrap gap-1 mb-2">
                    {specEntries.map(([k, v]) => (
                        <span key={k} className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded-md">
                            {k}: {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </span>
                    ))}
                </div>

                {/* Price + Actions */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-100">
                    <div>
                        <p className="text-base font-bold text-zinc-900">₹{price.toLocaleString('en-IN')}</p>
                        {product.variants?.[0]?.compareAtPrice && product.variants[0].compareAtPrice > price && (
                            <p className="text-[10px] text-zinc-400 line-through">₹{product.variants[0].compareAtPrice.toLocaleString('en-IN')}</p>
                        )}
                    </div>

                    {isInCart ? (
                        <button
                            onClick={onRemove}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                        >
                            <X size={12} /> Remove
                        </button>
                    ) : (
                        <button
                            onClick={onAdd}
                            disabled={isIncompatible}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${isIncompatible
                                ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                                : 'bg-zinc-900 text-white hover:bg-zinc-800'
                                }`}
                        >
                            <Plus size={12} /> Add
                        </button>
                    )}
                </div>

                {/* Compat Message (tooltip-like) */}
                {compatMessage && !isInCart && (
                    <p className={`mt-2 text-[10px] leading-tight px-2 py-1.5 rounded-md ${compatibility === CompatibilityLevel.WARNING ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        {compatMessage}
                    </p>
                )}
            </div>
        </div>
    );
};

// ─── Build Summary Sidebar ──────────────────────────────────────────────
const BuildSummary: React.FC<{
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
    const wattPct = psuCap ? Math.min((wattage / psuCap) * 100, 100) : 0;

    const isIncompat = report.status === CompatibilityLevel.INCOMPATIBLE;
    const completedCount = CORE_BUILD_CATEGORIES.filter(cat => cart.some(i => i.category === cat)).length;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-zinc-200 bg-white flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-zinc-900 text-sm heading-font">Build Summary</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                        {completedCount}/{CORE_BUILD_CATEGORIES.length}
                    </span>
                </div>

                {/* Total Price */}
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-zinc-900 heading-font">₹{totalPrice.toLocaleString('en-IN')}</span>
                    {cart.length === 0 && <span className="text-xs text-zinc-400">No components added</span>}
                </div>

                {/* Power Bar */}
                {cart.length > 0 && (
                    <div className="mt-3">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="font-medium text-zinc-500">Est. Power: {wattage}W</span>
                            {psuCap ? (
                                <span className={`font-bold ${wattage > psuCap ? 'text-red-600' : wattage > psuCap * 0.8 ? 'text-yellow-600' : 'text-emerald-600'}`}>
                                    PSU: {psuCap}W
                                </span>
                            ) : (
                                <span className="font-medium text-zinc-400">No PSU selected</span>
                            )}
                        </div>
                        <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${psuCap
                                    ? (wattage > psuCap ? 'bg-red-500' : wattage > psuCap * 0.8 ? 'bg-yellow-500' : 'bg-emerald-500')
                                    : 'bg-zinc-300'
                                    }`}
                                style={{ width: psuCap ? `${wattPct}%` : `${Math.min((wattage / 800) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Compat Status */}
                {cart.length > 0 && (
                    <div className={`mt-3 flex items-start gap-2 p-2.5 rounded-lg border text-[11px] font-medium ${report.status === CompatibilityLevel.INCOMPATIBLE
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : report.status === CompatibilityLevel.WARNING
                            ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        }`}>
                        {report.status === CompatibilityLevel.INCOMPATIBLE ? <AlertOctagon size={13} className="mt-0.5 flex-shrink-0" /> :
                            report.status === CompatibilityLevel.WARNING ? <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" /> :
                                <CheckCircle2 size={13} className="mt-0.5 flex-shrink-0" />}
                        <span className="leading-tight">
                            {report.status === CompatibilityLevel.COMPATIBLE
                                ? 'All components are compatible!'
                                : `${report.issues.length} issue${report.issues.length > 1 ? 's' : ''} found`}
                        </span>
                    </div>
                )}
            </div>

            {/* Steps / Selected Parts */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {CORE_BUILD_CATEGORIES.map((cat) => {
                    const item = cart.find(i => i.category === cat);
                    const Icon = CATEGORY_ICONS[cat] || Box;
                    const isActive = activeStep === cat;
                    const hasIssue = report.issues.some(iss => item && iss.componentIds.includes(item.id));

                    return (
                        <button
                            key={cat}
                            onClick={() => onStepClick(cat)}
                            className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${isActive
                                ? 'border-blue-300 bg-blue-50/50 ring-1 ring-blue-100'
                                : item
                                    ? 'border-zinc-200 bg-white hover:border-zinc-300'
                                    : 'border-zinc-200 border-dashed bg-zinc-50/50 hover:bg-zinc-100'
                                }`}
                        >
                            <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center ${item
                                ? hasIssue ? 'bg-red-100 text-red-600' : 'bg-zinc-900 text-white'
                                : isActive ? 'bg-blue-600 text-white' : 'bg-zinc-200 text-zinc-500'
                                }`}>
                                {item ? (hasIssue ? <AlertTriangle size={12} /> : <Check size={12} strokeWidth={3} />) : <Icon size={12} />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className={`text-[11px] font-bold uppercase tracking-wider ${isActive ? 'text-blue-700' : item ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                    {CATEGORY_LABELS[cat] || cat}
                                </p>
                                {item ? (
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-[11px] font-medium text-zinc-800 truncate">{item.name}</p>
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-zinc-400">Click to select</p>
                                )}
                            </div>

                            {item && (
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <span className="text-[11px] font-bold text-zinc-700">₹{(item.selectedVariant?.price || 0).toLocaleString('en-IN')}</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                                        className="p-1 text-zinc-300 hover:text-red-500 transition-colors"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Compat Issues Detail */}
            {report.issues.length > 0 && (
                <div className="px-3 pb-2 flex-shrink-0">
                    <div className="max-h-28 overflow-y-auto space-y-1.5">
                        {report.issues.map((issue, i) => (
                            <div key={i} className={`px-2.5 py-2 rounded-lg border text-[10px] leading-tight ${issue.level === CompatibilityLevel.INCOMPATIBLE
                                ? 'bg-red-50 border-red-100 text-red-700'
                                : 'bg-yellow-50 border-yellow-100 text-yellow-700'
                                }`}>
                                <p className="font-semibold">{issue.message}</p>
                                {issue.resolution && <p className="mt-0.5 opacity-80">{issue.resolution}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="p-3 border-t border-zinc-200 flex-shrink-0 space-y-2">
                <div className="flex gap-2">
                    <button onClick={onSave} className="flex-1 flex items-center justify-center gap-1.5 h-9 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg transition-colors">
                        <Save size={13} /> Save
                    </button>
                    <button onClick={onShare} className="flex-1 flex items-center justify-center gap-1.5 h-9 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg transition-colors">
                        <Share2 size={13} /> Share
                    </button>
                </div>
                <button
                    onClick={onCheckout}
                    disabled={isIncompat || cart.length === 0}
                    className={`w-full flex items-center justify-center gap-2 h-11 font-semibold rounded-xl text-sm transition-all ${isIncompat || cart.length === 0
                        ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                        : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm'
                        }`}
                >
                    <ShoppingCart size={15} /> Add Build to Cart
                </button>
            </div>
        </div>
    );
};

// ─── Mobile Build Drawer ────────────────────────────────────────────────
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
}> = ({ isOpen, onClose, ...rest }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 z-50 lg:hidden"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col"
                    >
                        <div className="flex items-center justify-center py-2 flex-shrink-0">
                            <div className="w-10 h-1 bg-zinc-300 rounded-full" />
                        </div>
                        <BuildSummary {...rest} />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// ─── Save Build Dialog ──────────────────────────────────────────────────
const SaveBuildDialog: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (title: string) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const [title, setTitle] = useState('My Custom Build');

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
            <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                <h3 className="text-lg font-bold text-zinc-900 mb-4 heading-font">Save Build</h3>
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Give your build a name..."
                    className="w-full h-10 px-3 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 mb-4"
                    autoFocus
                />
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 h-10 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors">Cancel</button>
                    <button onClick={() => { onSave(title); onClose(); }} className="flex-1 h-10 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors">Save</button>
                </div>
            </div>
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

    // ── State ──
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

    // Enable build mode on mount
    useEffect(() => {
        if (!isBuildMode) toggleBuildMode();
    }, []);

    // Check if user already has items in cart (resuming a build)
    useEffect(() => {
        if (cart.length > 0) {
            setHasStarted(true);
            // Jump to first empty category
            const firstEmpty = CORE_BUILD_CATEGORIES.find(cat => !cart.some(i => i.category === cat));
            if (firstEmpty) setActiveStep(firstEmpty);
        }
    }, []);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(t);
    }, [searchTerm]);

    // Fetch products for active category
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

                // Smart compatibility filtering
                const cpu = cart.find(i => i.category === Category.PROCESSOR);
                const mobo = cart.find(i => i.category === Category.MOTHERBOARD);
                const cpuSpecs = cpu ? specsToFlat(cpu.specs) : null;
                const moboSpecs = mobo ? specsToFlat(mobo.specs) : null;

                if (!showIncompat) {
                    if (activeStep === Category.MOTHERBOARD && cpuSpecs?.socket) {
                        params.set('f_specs.socket', String(cpuSpecs.socket));
                    }
                    if (activeStep === Category.PROCESSOR && moboSpecs?.socket) {
                        params.set('f_specs.socket', String(moboSpecs.socket));
                    }
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

    // ── Handlers ──
    const handleStartBuild = () => setHasStarted(true);

    const handleStartTemplate = useCallback((templateId: string) => {
        setHasStarted(true);
        // Templates just jump into the builder — users select components themselves
        setActiveStep(Category.PROCESSOR);
    }, []);

    const handleAddComponent = useCallback((product: Product) => {
        addToCart(product);
        // Auto-advance to next empty step
        setTimeout(() => {
            const nextEmpty = CORE_BUILD_CATEGORIES.find(cat =>
                cat !== product.category && !cart.some(i => i.category === cat)
            );
            if (nextEmpty) setActiveStep(nextEmpty);
        }, 100);
    }, [addToCart, cart]);

    const handleRemoveComponent = useCallback((productId: string) => {
        removeFromCart(productId);
    }, [removeFromCart]);

    const handleStepClick = useCallback((cat: Category) => {
        setActiveStep(cat);
        setSearchTerm('');
        prevParamsRef.current = '';
    }, []);

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

    const handleSave = useCallback((title: string) => {
        saveCurrentBuild(title);
    }, [saveCurrentBuild]);

    const handleShare = useCallback(() => {
        const link = generateShareLink();
        if (link) {
            navigator.clipboard.writeText(link);
        }
    }, [generateShareLink]);

    const handleCheckout = useCallback(() => {
        setCartOpen(true);
    }, [setCartOpen]);

    // ── Computed ──
    const activeIcon = CATEGORY_ICONS[activeStep] || Box;
    const ActiveIcon = activeIcon;
    const completedCount = CORE_BUILD_CATEGORIES.filter(cat => cart.some(i => i.category === cat)).length;
    const totalPrice = cart.reduce((s, i) => s + (i.selectedVariant?.price || 0) * i.quantity, 0);

    // ═══════════════════════════════════════════════════════════════════════
    // LANDING VIEW (No build started yet)
    // ═══════════════════════════════════════════════════════════════════════
    if (!hasStarted) {
        return (
            <div className="min-h-screen bg-zinc-50">
                <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
          * { font-family: 'Inter', sans-serif; }
          h1,h2,h3,h4,.heading-font { font-family: 'Space Grotesk', 'Inter', sans-serif; letter-spacing: -0.025em; }
        `}</style>

                {/* Hero */}
                <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-white/10">
                            <Sparkles size={14} /> Compatibility Engine Powered
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold heading-font mb-4 leading-tight">
                            Build Your<br />
                            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                Dream PC
                            </span>
                        </h1>
                        <p className="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
                            Select components step-by-step. Our compatibility engine validates every choice in real time — so you never build a broken system.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={handleStartBuild}
                                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-zinc-900 font-bold rounded-xl text-sm hover:bg-zinc-100 transition-all shadow-lg"
                            >
                                Start From Scratch <ArrowRight size={16} />
                            </button>
                            <Link
                                href="/build-guides"
                                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/10 text-white font-semibold rounded-xl text-sm hover:bg-white/20 transition-all border border-white/10"
                            >
                                Browse Templates
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Templates */}
                <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 relative z-10 pb-16">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {STARTER_TEMPLATES.map(t => {
                            const Icon = t.icon;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => handleStartTemplate(t.id)}
                                    className="group text-left bg-white border border-zinc-200 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                                >
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.gradient} flex items-center justify-center mb-3`}>
                                        <Icon size={18} className="text-white" />
                                    </div>
                                    <h3 className="font-bold text-zinc-900 text-sm mb-0.5">{t.title}</h3>
                                    <p className="text-[11px] text-zinc-500 mb-2">{t.subtitle}</p>
                                    <p className="text-xs font-bold text-zinc-700">{t.budget}</p>
                                </button>
                            );
                        })}
                    </div>

                    {/* Features */}
                    <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[
                            { icon: CheckCircle2, title: 'Real-time Compatibility', desc: 'Every component is checked against your build instantly.' },
                            { icon: Zap, title: 'Power Estimation', desc: 'See estimated wattage and PSU headroom as you build.' },
                            { icon: Share2, title: 'Save & Share', desc: 'Save builds to your account or share with a link.' },
                        ].map(f => (
                            <div key={f.title} className="text-center p-6">
                                <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                    <f.icon size={22} className="text-zinc-600" />
                                </div>
                                <h4 className="font-bold text-zinc-900 text-sm mb-1">{f.title}</h4>
                                <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BUILDER VIEW
    // ═══════════════════════════════════════════════════════════════════════
    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; }
        h1,h2,h3,h4,.heading-font { font-family: 'Space Grotesk', 'Inter', sans-serif; letter-spacing: -0.025em; }
        .scrollbar-thin::-webkit-scrollbar { width: 6px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 3px; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

            {/* ── Top Bar ─────────────────────────────────────────────────── */}
            <header className="bg-white border-b border-zinc-200 flex-shrink-0 sticky top-[64px] z-40">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-12 gap-4">
                        {/* Left */}
                        <div className="flex items-center gap-3">
                            <button onClick={() => { setHasStarted(false); }} className="text-zinc-400 hover:text-zinc-700 transition-colors">
                                <ArrowLeft size={18} />
                            </button>
                            <div className="hidden sm:block">
                                <h2 className="text-sm font-bold text-zinc-900 heading-font">PC Builder</h2>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                {completedCount}/{CORE_BUILD_CATEGORIES.length} parts
                            </span>
                        </div>

                        {/* Center — Category Steps (Desktop) */}
                        <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
                            {CORE_BUILD_CATEGORIES.map((cat, idx) => {
                                const item = cart.find(i => i.category === cat);
                                const isActive = activeStep === cat;
                                const CatIcon = CATEGORY_ICONS[cat] || Box;
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => handleStepClick(cat)}
                                        className={`relative flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all whitespace-nowrap ${isActive
                                            ? 'bg-zinc-900 text-white'
                                            : item
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : 'text-zinc-500 hover:bg-zinc-100 border border-transparent'
                                            }`}
                                    >
                                        {item ? <Check size={11} strokeWidth={3} /> : <CatIcon size={11} />}
                                        {CATEGORY_LABELS[cat] || cat}
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Right */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-zinc-900 heading-font hidden sm:block">₹{totalPrice.toLocaleString('en-IN')}</span>
                            <button
                                onClick={() => setMobileDrawerOpen(true)}
                                className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white text-xs font-semibold rounded-lg"
                            >
                                <ShoppingCart size={13} /> Build
                            </button>
                        </div>
                    </div>

                    {/* Mobile Category Tabs */}
                    <div className="lg:hidden flex items-center gap-1 overflow-x-auto scrollbar-hide py-2 -mx-4 px-4">
                        {CORE_BUILD_CATEGORIES.map(cat => {
                            const item = cart.find(i => i.category === cat);
                            const isActive = activeStep === cat;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => handleStepClick(cat)}
                                    className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${isActive
                                        ? 'bg-zinc-900 text-white'
                                        : item
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            : 'text-zinc-500 hover:bg-zinc-100 border border-transparent'
                                        }`}
                                >
                                    {item ? <Check size={10} strokeWidth={3} /> : null}
                                    {CATEGORY_LABELS[cat] || cat}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </header>

            {/* ── Main Content ───────────────────────────────────────────── */}
            <div className="flex-1 flex">
                <div className="max-w-[1600px] mx-auto w-full flex">
                    {/* Center: Product Selection */}
                    <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
                        {/* Category Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <ActiveIcon size={18} className="text-zinc-400" />
                                    <h2 className="text-xl font-bold text-zinc-900 heading-font">
                                        Select {CATEGORY_LABELS[activeStep] || activeStep}
                                    </h2>
                                </div>
                                <p className="text-xs text-zinc-500">
                                    {CATEGORY_DESCRIPTIONS[activeStep] || `Choose your ${CATEGORY_LABELS[activeStep]}.`}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        placeholder={`Search ${CATEGORY_LABELS[activeStep]}...`}
                                        className="h-8 pl-8 pr-3 w-48 bg-white border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                                    />
                                    {searchTerm && (
                                        <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                                            <XCircle size={13} />
                                        </button>
                                    )}
                                </div>

                                {/* Sort */}
                                <select
                                    value={sortOption}
                                    onChange={e => setSortOption(e.target.value)}
                                    className="h-8 px-2 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-700 focus:outline-none cursor-pointer"
                                >
                                    <option value="popularity">Popular</option>
                                    <option value="price-asc">Price: Low</option>
                                    <option value="price-desc">Price: High</option>
                                    <option value="newest">New</option>
                                </select>

                                {/* Show Incompat Toggle */}
                                <button
                                    onClick={() => setShowIncompat(prev => !prev)}
                                    className={`flex items-center gap-1 h-8 px-2.5 text-xs font-medium rounded-lg border transition-colors ${showIncompat
                                        ? 'bg-zinc-100 border-zinc-300 text-zinc-700'
                                        : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50'
                                        }`}
                                    title={showIncompat ? 'Hide incompatible products' : 'Show incompatible products'}
                                >
                                    {showIncompat ? <Eye size={13} /> : <EyeOff size={13} />}
                                    <span className="hidden sm:inline">{showIncompat ? 'All' : 'Compatible'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Product Grid */}
                        {isLoading ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="bg-white border border-zinc-100 rounded-xl overflow-hidden animate-pulse">
                                        <div className="aspect-square bg-zinc-100" />
                                        <div className="p-3 space-y-2">
                                            <div className="h-3 bg-zinc-100 rounded w-3/4" />
                                            <div className="h-3 bg-zinc-100 rounded w-1/2" />
                                            <div className="h-6 bg-zinc-100 rounded w-1/3 mt-3" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-zinc-200">
                                <Box className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                                <p className="text-zinc-500 text-sm mb-2">No products found</p>
                                <p className="text-zinc-400 text-xs">Try adjusting the search or filters.</p>
                                {!showIncompat && (
                                    <button
                                        onClick={() => setShowIncompat(true)}
                                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-lg hover:bg-zinc-200 transition-colors"
                                    >
                                        <Eye size={13} /> Show All Products
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
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
                            </div>
                        )}
                    </main>

                    {/* Right: Build Summary (Desktop) */}
                    <aside className="hidden lg:flex flex-shrink-0 w-80 xl:w-[340px] border-l border-zinc-200 bg-white sticky top-[112px] h-[calc(100vh-112px)] flex-col">
                        <BuildSummary
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
            <div className="lg:hidden fixed bottom-16 left-0 right-0 z-40 bg-white border-t border-zinc-200 px-4 py-2 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-500">Total</p>
                    <p className="text-base font-bold text-zinc-900 heading-font truncate">₹{totalPrice.toLocaleString('en-IN')}</p>
                </div>
                <div className="flex items-center gap-2">
                    {compatibilityReport.issues.length > 0 && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${compatibilityReport.status === CompatibilityLevel.INCOMPATIBLE
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {compatibilityReport.issues.length} issue{compatibilityReport.issues.length > 1 ? 's' : ''}
                        </span>
                    )}
                    <button
                        onClick={() => setMobileDrawerOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white text-xs font-semibold rounded-xl"
                    >
                        <ShoppingCart size={14} /> View Build
                    </button>
                </div>
            </div>

            {/* ── Mobile Drawer ──────────────────────────────────────────── */}
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

            {/* ── Save Dialog ────────────────────────────────────────────── */}
            <SaveBuildDialog
                isOpen={isSaveDialogOpen}
                onClose={() => setSaveDialogOpen(false)}
                onSave={handleSave}
            />
        </div>
    );
}
