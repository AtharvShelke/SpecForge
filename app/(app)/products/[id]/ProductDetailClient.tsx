'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useShop } from '@/context/ShopContext';
import {
    CheckCircle,
    AlertTriangle,
    XCircle,
    ArrowLeft,
    ChevronRight,
    ChevronLeft,
    Plus,
} from 'lucide-react';
import { CompatibilityIssue, CompatibilityLevel, Product, toCartItem, specsToFlat } from '@/types';
import { validateBuild } from '@/lib/calculations/compatibility';




// Status config — plain object, never recreated
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    IN_STOCK:     { label: 'In Stock',      color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
    LOW_STOCK:    { label: 'Low Stock',     color: 'text-amber-700',   bg: 'bg-amber-50',   dot: 'bg-amber-500'   },
    OUT_OF_STOCK: { label: 'Out of Stock',  color: 'text-red-600',     bg: 'bg-red-50',     dot: 'bg-red-500'     },
};

// Compat config — plain object, never recreated
const COMPAT_CONFIG = {
    [CompatibilityLevel.COMPATIBLE]: {
        label:  'Compatible with your build',
        icon:   CheckCircle,
        color:  'text-emerald-700',
        bg:     'bg-emerald-50',
        border: 'border-emerald-100',
        dot:    'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.4)]',
    },
    [CompatibilityLevel.WARNING]: {
        label:  'Compatibility warning',
        icon:   AlertTriangle,
        color:  'text-amber-700',
        bg:     'bg-amber-50',
        border: 'border-amber-100',
        dot:    'bg-amber-400 shadow-[0_0_4px_rgba(245,158,11,0.4)]',
    },
    [CompatibilityLevel.INCOMPATIBLE]: {
        label:  'Not compatible with your build',
        icon:   XCircle,
        color:  'text-red-600',
        bg:     'bg-red-50',
        border: 'border-red-100',
        dot:    'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]',
    },
} as const;

// Tab definitions — plain array, never recreated
const TABS = [
    { id: 'about',         label: 'Overview'       },
    { id: 'specs',         label: 'Specifications' },
    { id: 'compatibility', label: 'Compatibility'  },
] as const;

type TabId = typeof TABS[number]['id'];

// Page styles — hoisted string constant, never recreated on re-render.
// @import removed from runtime <style>; add these to layout.tsx instead:
//   <link rel="preconnect" href="https://fonts.googleapis.com" />
//   <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
//   <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@...&display=swap" rel="stylesheet" />
const PAGE_STYLES = `
  *,body{font-family:'DM Sans',system-ui,sans-serif}
  .img-fade{animation:imgFade 0.22s ease both}
  @keyframes imgFade{from{opacity:0;transform:scale(0.988)}to{opacity:1;transform:scale(1)}}
  .scrollbar-hide::-webkit-scrollbar{display:none}
  .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
` as const;

const formatKey = (key: string) =>
    key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());

// ── Sub-components ────────────────────────────────────────────────────────────

// Thumbnail strip — only re-renders when media or selectedImage changes
const ThumbnailStrip = memo(function ThumbnailStrip({
    media,
    selectedImage,
    onSelect,
}: {
    media:         string[]
    selectedImage: number
    onSelect:      (i: number) => void
}) {
    return (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {media.map((url, i) => (
                <button
                    key={url}
                    onClick={() => onSelect(i)}
                    className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden border flex-shrink-0 transition-all ${
                        selectedImage === i
                            ? 'border-zinc-900 shadow-sm'
                            : 'border-zinc-200 opacity-50 hover:opacity-90'
                    }`}
                >
                    <Image src={url} alt="" fill className="object-contain p-1" />
                </button>
            ))}
        </div>
    );
});

// Spec row — memoised so the spec table doesn't re-render on tab switches
const SpecRow = memo(function SpecRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="py-2 flex items-center justify-between gap-4 spec-row rounded">
            <span className="text-[11px] text-zinc-400 shrink-0">{label}</span>
            <span className="text-[11px] font-medium text-zinc-900 text-right">{value}</span>
        </div>
    );
});

// ── ProductDetailClient ───────────────────────────────────────────────────────

interface ProductDetailClientProps {
    product: Product;
}

const ProductDetailClient = memo(function ProductDetailClient({ product }: ProductDetailClientProps) {
    const { cart, addToCart } = useShop();

    const flatSpecs = useMemo(() => specsToFlat(product.specs), [product.specs]);

    const [selectedImage, setSelectedImage] = useState(0);
    const [activeTab,     setActiveTab]     = useState<TabId>('about');

    const media = useMemo(() => {
        return product.media?.length
            ? product.media.map((mediaItem) => mediaItem.url)
            : [product.image ?? '/placeholder.png'];
    }, [product.media, product.image]);

    const hasMultipleImages = media.length > 1;

    const prevImage = useCallback(() => setSelectedImage(i => (i - 1 + media.length) % media.length), [media.length]);
    const nextImage = useCallback(() => setSelectedImage(i => (i + 1) % media.length),                [media.length]);
    const handleAddToCart = useCallback(() => addToCart(product), [addToCart, product]);

    // Derived values — all memoised so they don't recompute on tab/image changes
    const price         = product.price ?? 0;
    const compareAtPrice = product.compareAtPrice;
    const status        = (product.stockStatus || 'IN_STOCK') as string;
    const sku           = product.sku;
    const isOutOfStock  = status === 'OUT_OF_STOCK';
    const hasDiscount   = !!(compareAtPrice && compareAtPrice > price);
    const discountPct   = hasDiscount ? Math.round(((compareAtPrice! - price) / compareAtPrice!) * 100) : 0;

    const inCart        = useMemo(() => cart.find((cartItem) => cartItem.id === product.id), [cart, product.id]);
    const statusInfo    = STATUS_CONFIG[status] ?? STATUS_CONFIG.IN_STOCK;
    

    const report = useMemo(() => {
        const hypotheticalCart = [...cart, toCartItem(product)];
        return validateBuild(hypotheticalCart);
    }, [cart, product]);

    const compatBase = COMPAT_CONFIG[report.status] ?? COMPAT_CONFIG[CompatibilityLevel.COMPATIBLE];

    // Merge dynamic desc into compat without mutating the module-level constant
    const compat = useMemo(() => ({
        ...compatBase,
        desc: report.status === CompatibilityLevel.INCOMPATIBLE
            ? (report.issues[0]?.message ?? 'This component is not compatible with your current build.')
            : report.status === CompatibilityLevel.WARNING
                ? 'Double-check specifications before adding to your build.'
                : 'This component works perfectly with your current selection.',
    }), [compatBase, report]);

    const CompatIcon = compat.icon;

    return (
        <div className="min-h-screen bg-stone-50">
            <style>{PAGE_STYLES}</style>

            {/* STICKY BREADCRUMB */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-zinc-100">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-9">
                        <nav className="flex items-center gap-1 text-[10px] text-zinc-400 min-w-0">
                            <Link href="/" className="hover:text-zinc-700 transition-colors shrink-0">Home</Link>
                            <ChevronRight size={10} className="shrink-0" />
                            <Link href="/products" className="hover:text-zinc-700 transition-colors shrink-0">Products</Link>
                            <ChevronRight size={10} className="shrink-0" />
                            <Link href={`/products?category=${typeof product.category === 'string' ? product.category : product.category?.code ?? product.category?.slug}`} className="hover:text-zinc-700 transition-colors capitalize shrink-0">
                                {(typeof product.category === 'string' ? product.category : product.category?.name)?.toLowerCase() || 'Uncategorized'}
                            </Link>
                            <ChevronRight size={10} className="shrink-0" />
                            <span className="text-zinc-700 font-medium truncate">{product.name}</span>
                        </nav>
                        <Link href="/products" className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-900 transition-colors group shrink-0 ml-4">
                            <ArrowLeft size={11} className="group-hover:-translate-x-0.5 transition-transform" />
                            <span className="hidden sm:inline">Back</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 mb-3 lg:mb-4">

                    {/* GALLERY */}
                    <div className="flex flex-col gap-2">
                        <div className="group relative rounded-2xl overflow-hidden bg-white border border-zinc-100 shadow-sm" style={{ aspectRatio: '1 / 1' }}>
                            <div key={selectedImage} className="absolute inset-0 img-fade">
                                <Image
                                    src={media[selectedImage] ?? '/placeholder.png'}
                                    alt={product.name}
                                    fill
                                    priority
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                    className="object-contain p-5 sm:p-7 transition-transform duration-500 group-hover:scale-[1.04]"
                                />
                            </div>

                            <div className="absolute top-3 left-3 px-2 py-0.5 bg-white/90 backdrop-blur border border-zinc-200 rounded-full text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                                {product.category?.name || 'Uncategorized'}
                            </div>

                            {hasDiscount && (
                                <div className="absolute top-3 right-3 px-2 py-0.5 bg-red-500 text-white rounded-full text-[9px] font-bold">
                                    -{discountPct}%
                                </div>
                            )}

                            {(isOutOfStock || status === 'LOW_STOCK') && (
                                <span className={`absolute bottom-3 left-3 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${isOutOfStock ? 'bg-red-500' : 'bg-amber-500'}`}>
                                    {isOutOfStock ? 'Out of Stock' : 'Low Stock'}
                                </span>
                            )}

                            {hasMultipleImages && (
                                <>
                                    <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 backdrop-blur border border-zinc-200 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-zinc-50">
                                        <ChevronLeft size={13} />
                                    </button>
                                    <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 backdrop-blur border border-zinc-200 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-zinc-50">
                                        <ChevronRight size={13} />
                                    </button>
                                </>
                            )}
                        </div>

                        {hasMultipleImages && (
                            <ThumbnailStrip
                                media={media}
                                selectedImage={selectedImage}
                                onSelect={setSelectedImage}
                            />
                        )}
                    </div>

                    {/* BUY BOX */}
                    <div className="bg-white border border-zinc-100 rounded-2xl shadow-sm p-3 sm:p-4 flex flex-col gap-3">

                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-500 mb-1">
                                {(flatSpecs.brand as string) || (typeof product.category === 'string' ? product.category : product.category?.name) || 'Uncategorized'}
                            </p>
                            <h1 className="text-sm sm:text-base lg:text-lg font-bold text-zinc-900 leading-snug">
                                {product.name}
                            </h1>
                            {sku && <p className="text-[10px] text-zinc-400 mt-0.5">SKU {sku}</p>}
                        </div>

                        {/* Price */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
                                    ₹{price.toLocaleString('en-IN')}
                                </span>
                                {hasDiscount && (
                                    <>
                                        <span className="text-sm text-zinc-400 line-through">
                                            ₹{compareAtPrice!.toLocaleString('en-IN')}
                                        </span>
                                        <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                                            -{discountPct}%
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="mt-2">
                            {inCart ? (
                                <button
                                    onClick={handleAddToCart}
                                    className="w-full h-9 rounded-xl text-xs font-bold uppercase tracking-wide bg-emerald-50 border border-emerald-200 text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.98] flex items-center justify-center gap-1.5"
                                >
                                    <CheckCircle size={13} strokeWidth={2.5} />
                                    Added to Build
                                </button>
                            ) : (
                                <button
                                    onClick={handleAddToCart}
                                    disabled={isOutOfStock}
                                    className={`w-full h-9 rounded-xl text-xs font-bold uppercase tracking-wide transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                                        isOutOfStock
                                            ? 'bg-zinc-50 text-zinc-300 cursor-not-allowed border border-zinc-100'
                                            : 'bg-zinc-900 text-white hover:bg-indigo-600 hover:shadow-md hover:shadow-indigo-200/50'
                                    }`}
                                >
                                    {isOutOfStock ? 'Sold Out' : (<><Plus size={12} strokeWidth={3} /> Add to Build</>)}
                                </button>
                            )}
                        </div>

                        {/* Status + compat badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusInfo.bg} ${statusInfo.color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                                {statusInfo.label}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${compat.bg} ${compat.color} ${compat.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${compat.dot}`} />
                                {compat.label}
                            </span>
                        </div>

                       
                        {/* Compat detail banner */}
                        {report.status !== CompatibilityLevel.COMPATIBLE && (
                            <div className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border text-[10px] ${compat.bg} ${compat.border}`}>
                                <CompatIcon size={13} className={`${compat.color} mt-0.5 shrink-0`} />
                                <p className={`${compat.color} leading-snug`}>{compat.desc}</p>
                            </div>
                        )}

                        {/* TABS */}
                        <div className="bg-white border border-zinc-100 rounded-2xl shadow-sm overflow-hidden">
                            <div className="flex gap-0 border-b border-zinc-100 px-1">
                                {TABS.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-3 sm:px-4 py-2.5 text-[11px] sm:text-xs font-semibold transition-all border-b-2 -mb-px ${
                                            activeTab === tab.id
                                                ? 'text-zinc-900 border-zinc-900'
                                                : 'text-zinc-400 border-transparent hover:text-zinc-700'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="p-3 sm:p-4">
                                {activeTab === 'about' && (
                                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                                        {product.description ?? 'No description available.'}
                                    </p>
                                )}

                                {activeTab === 'specs' && (
                                    <div className="divide-y divide-zinc-100">
                                        {Object.entries(flatSpecs).map(([k, v]) => (
                                            <SpecRow key={k} label={formatKey(k)} value={String(v)} />
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'compatibility' && (
                                    <div className={`flex items-start gap-3 p-3 rounded-xl border ${compat.bg} ${compat.border}`}>
                                        <CompatIcon size={15} className={`${compat.color} mt-0.5 shrink-0`} />
                                        <div>
                                            <p className={`text-xs font-semibold ${compat.color} mb-0.5`}>{compat.label}</p>
                                            <p className="text-[11px] text-zinc-500 leading-snug">{compat.desc}</p>
                                            {report.issues.length > 0 && (
                                                <ul className="mt-2 space-y-1">
                                                    {report.issues.map((issue: CompatibilityIssue, i: number) => (
                                                        <li key={i} className="text-[10px] text-zinc-500 flex items-start gap-1.5">
                                                            <span className="w-1 h-1 rounded-full bg-zinc-300 mt-1.5 shrink-0" />
                                                            {issue.message}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default ProductDetailClient;
