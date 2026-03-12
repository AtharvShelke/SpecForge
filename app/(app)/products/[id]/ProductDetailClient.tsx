'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useShop } from '@/context/ShopContext';
import {
    ShoppingCart,
    CheckCircle,
    AlertTriangle,
    XCircle,
    ArrowLeft,
    ChevronRight,
    ChevronLeft,
} from 'lucide-react';
import { CompatibilityLevel, specsToFlat, Product } from '@/types';
import { validateBuild } from '@/services/compatibility';

const CATEGORY_HIGHLIGHTS: Record<string, string[]> = {
    PROCESSOR: ['cores', 'socket', 'wattage', 'ramType', 'series', 'generation'],
    GPU: ['memory', 'wattage', 'series'],
    RAM: ['capacity', 'frequency', 'ramType'],
    MOTHERBOARD: ['chipset', 'socket', 'formFactor', 'ramType'],
    COOLER: ['type', 'size'],
    STORAGE: ['type', 'interface', 'capacity'],
    CABINET: ['formFactor', 'color'],
    PSU: ['wattage', 'efficiency'],
    MONITOR: ['size', 'resolution', 'type'],
    PERIPHERAL: ['type', 'connectivity'],
};

const formatKey = (key: string) =>
    key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());

interface ProductDetailClientProps {
    product: Product & { brand?: any; specs: any };
}

const ProductDetailClient: React.FC<ProductDetailClientProps> = ({ product }) => {
    const { cart, addToCart } = useShop();

    const flatSpecs = useMemo(() => product ? specsToFlat(product.specs) : {}, [product]);

    const [selectedImage, setSelectedImage] = useState(0);
    const [activeTab, setActiveTab] = useState<'about' | 'specs' | 'compatibility'>('about');

    const media = useMemo(() => {
        return product.media?.length
            ? product.media.map((m: any) => m.url)
            : [product.image || '/placeholder.png'];
    }, [product]);

    const hasMultipleImages = media.length > 1;
    const prevImage = () => setSelectedImage(i => (i - 1 + media.length) % media.length);
    const nextImage = () => setSelectedImage(i => (i + 1) % media.length);

    if (!product) {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-zinc-500 mb-4">Product not found.</p>
                    <Link href="/products" className="text-indigo-600 font-medium hover:underline">← Back to catalog</Link>
                </div>
            </div>
        );
    }

    const hypotheticalCart = [...cart, { ...product, quantity: 1 } as any];
    const report = validateBuild(hypotheticalCart);
    const inCart = cart.find((c: any) => c.id === product.id);
    const highlights = CATEGORY_HIGHLIGHTS[product.category] || [];
    const price = product.variants?.[0]?.price || 0;
    const compareAtPrice = product.variants?.[0]?.compareAtPrice;
    const hasDiscount = compareAtPrice && compareAtPrice > price;
    const discountPct = hasDiscount ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;
    const status = product.variants?.[0]?.status;
    const sku = product.variants?.[0]?.sku;

    const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
        IN_STOCK: { label: 'In Stock', color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
        LOW_STOCK: { label: 'Low Stock', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' },
        OUT_OF_STOCK: { label: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-50', dot: 'bg-red-500' },
    };
    const statusInfo = statusConfig[status as string] ?? statusConfig.IN_STOCK;

    const compatConfig = {
        [CompatibilityLevel.COMPATIBLE]: {
            label: 'Compatible with your build',
            desc: 'This component works perfectly with your current selection.',
            icon: CheckCircle,
            color: 'text-emerald-700',
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
        },
        [CompatibilityLevel.WARNING]: {
            label: 'Compatibility warning',
            desc: 'Double-check specifications before adding to your build.',
            icon: AlertTriangle,
            color: 'text-amber-700',
            bg: 'bg-amber-50',
            border: 'border-amber-100',
        },
        [CompatibilityLevel.INCOMPATIBLE]: {
            label: 'Not compatible with your build',
            desc: report.issues[0]?.message || 'This component is not compatible with your current build.',
            icon: XCircle,
            color: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-red-100',
        },
    };
    const compat = compatConfig[report.status] ?? compatConfig[CompatibilityLevel.COMPATIBLE];
    const CompatIcon = compat.icon;

    return (
        <div className="min-h-screen bg-stone-50">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');
                *, body { font-family: 'DM Sans', system-ui, sans-serif; }

                .img-fade { animation: imgFade 0.22s ease both; }
                @keyframes imgFade {
                    from { opacity: 0; transform: scale(0.988); }
                    to   { opacity: 1; transform: scale(1); }
                }
                .thumb-btn { transition: all 0.16s cubic-bezier(0.22, 1, 0.36, 1); }

                .tab-line { position: relative; padding-bottom: 10px; }
                .tab-line::after {
                    content: '';
                    position: absolute;
                    bottom: 0; left: 0; right: 0;
                    height: 2px; background: #18181b; border-radius: 2px;
                    transform: scaleX(0); transform-origin: left;
                    transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
                }
                .tab-line.tab-active::after { transform: scaleX(1); }

                .spec-row:hover { background: #f9f9f8 !important; }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* ── STICKY BREADCRUMB ── */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-zinc-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-10">
                        <nav className="flex items-center gap-1 text-xs text-zinc-400 min-w-0">
                            <Link href="/" className="hover:text-zinc-700 transition-colors shrink-0">Home</Link>
                            <ChevronRight size={11} className="shrink-0" />
                            <Link href="/products" className="hover:text-zinc-700 transition-colors shrink-0">Products</Link>
                            <ChevronRight size={11} className="shrink-0" />
                            <Link href={`/products?category=${product.category}`} className="hover:text-zinc-700 transition-colors capitalize shrink-0">
                                {product.category.toLowerCase()}
                            </Link>
                            <ChevronRight size={11} className="shrink-0" />
                            <span className="text-zinc-800 font-medium truncate">{product.name}</span>
                        </nav>
                        <Link
                            href="/products"
                            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-900 transition-colors group shrink-0 ml-4"
                        >
                            <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
                            <span className="hidden sm:inline">Back</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">

                {/* Top grid: gallery + buy box */}
                <div className="bg-zinc-50 py-6">
                    <div className="max-w-6xl mx-auto px-4">

                        {/* ================= GRID ================= */}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">


                            {/* ================= GALLERY ================= */}

                            <div className="flex flex-col gap-3">

                                <div
                                    className="relative rounded-3xl overflow-hidden
bg-gradient-to-b from-zinc-50 to-white
border border-zinc-200/70
shadow-xl shadow-zinc-200/60
group"
                                    style={{ aspectRatio: "1 / 1" }}
                                >

                                    <div key={selectedImage} className="absolute inset-0">
                                        <Image
                                            src={media[selectedImage] || "/placeholder.png"}
                                            alt={product.name}
                                            fill
                                            priority
                                            className="object-contain p-10 transition-transform duration-500 group-hover:scale-[1.05]"
                                        />
                                    </div>


                                    {/* category */}
                                    <div className="absolute top-4 left-4 px-3 py-1
bg-white/80 backdrop-blur
border border-zinc-200
rounded-full text-[11px] font-semibold text-zinc-600">

                                        {product.category}

                                    </div>


                                    {/* discount */}
                                    {hasDiscount && (

                                        <div className="absolute top-4 right-4 px-3 py-1
bg-red-500 text-white
rounded-full text-[11px] font-semibold">

                                            -{discountPct}%

                                        </div>

                                    )}


                                    {/* arrows */}

                                    {hasMultipleImages && (

                                        <>

                                            <button
                                                onClick={prevImage}
                                                className="absolute left-3 top-1/2 -translate-y-1/2
w-9 h-9 rounded-full
bg-white/90 backdrop-blur
border border-zinc-200
shadow-md
flex items-center justify-center
opacity-0 group-hover:opacity-100
transition"
                                            >

                                                <ChevronLeft size={16} />

                                            </button>


                                            <button
                                                onClick={nextImage}
                                                className="absolute right-3 top-1/2 -translate-y-1/2
w-9 h-9 rounded-full
bg-white/90 backdrop-blur
border border-zinc-200
shadow-md
flex items-center justify-center
opacity-0 group-hover:opacity-100
transition"
                                            >

                                                <ChevronRight size={16} />

                                            </button>

                                        </>

                                    )}

                                </div>


                                {/* thumbnails */}

                                {hasMultipleImages && (

                                    <div className="flex gap-2 overflow-x-auto pt-1">

                                        {media.map((url, i) => (

                                            <button
                                                key={i}
                                                onClick={() => setSelectedImage(i)}
                                                className={`relative w-14 h-14 rounded-xl overflow-hidden border
transition

${selectedImage === i
                                                        ? "border-zinc-900 shadow-md"
                                                        : "border-zinc-200 opacity-60 hover:opacity-100"
                                                    }`}

                                            >

                                                <Image
                                                    src={url}
                                                    alt=""
                                                    fill
                                                    className="object-contain p-1"
                                                />

                                            </button>

                                        ))}

                                    </div>

                                )}

                            </div>


                            {/* ================= BUY BOX ================= */}

                            <div
                                className="
bg-white/90 backdrop-blur
rounded-3xl
border border-zinc-200/70
shadow-xl shadow-zinc-200/60
p-6 flex flex-col
"
                            >


                                <p className="text-xs font-semibold tracking-widest text-indigo-500 mb-1">
                                    {(flatSpecs.brand as string) || product.category}
                                </p>


                                <h1 className="text-2xl font-bold text-zinc-900 mb-2">
                                    {product.name}
                                </h1>


                                {sku && (
                                    <p className="text-xs text-zinc-400 mb-4">
                                        SKU {sku}
                                    </p>
                                )}


                                {/* price */}

                                <div className="flex items-end gap-3 mb-3">

                                    <span className="text-4xl font-bold text-zinc-900">
                                        ₹{price.toLocaleString("en-IN")}
                                    </span>


                                    {hasDiscount && (
                                        <>
                                            <span className="line-through text-zinc-400">
                                                ₹{compareAtPrice!.toLocaleString("en-IN")}
                                            </span>

                                            <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-1 rounded-full">
                                                Save {discountPct}%
                                            </span>
                                        </>
                                    )}

                                </div>


                                {/* status */}

                                <div
                                    className={`inline-flex items-center gap-2 px-3 py-1.5
rounded-full text-xs font-semibold mb-4
${statusInfo.bg} ${statusInfo.color}`}
                                >

                                    <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />

                                    {statusInfo.label}

                                </div>


                                {/* specs */}

                                {highlights.length > 0 && (

                                    <div className="flex flex-wrap gap-2 mb-5">

                                        {highlights.slice(0, 6).map(key =>

                                            flatSpecs[key] && (

                                                <div
                                                    key={key}
                                                    className="px-3 py-1.5
bg-zinc-50
border border-zinc-200
rounded-xl
text-xs font-medium"
                                                >

                                                    {formatKey(key)}: {String(flatSpecs[key])}

                                                </div>

                                            )

                                        )}

                                    </div>

                                )}


                                {/* CTA */}

                                <button
                                    onClick={() => addToCart(product as any)}
                                    disabled={status === "OUT_OF_STOCK"}
                                    className="
w-full py-4 rounded-2xl
font-semibold text-sm
transition
bg-zinc-900 text-white
hover:bg-indigo-600
shadow-lg shadow-indigo-200/40
active:scale-[0.98]
"
                                >

                                    Add to Build

                                </button>

                            </div>

                        </div>



                        {/* ================= TABS ================= */}


                        <div
                            className="
bg-white/90 backdrop-blur
rounded-3xl
border border-zinc-200/70
shadow-xl shadow-zinc-200/60
overflow-hidden
"
                        >


                            <div className="flex gap-6 px-6 pt-4 border-b border-zinc-200">


                                {([
                                    { id: "about", label: "Overview" },
                                    { id: "specs", label: "Specifications" },
                                    { id: "compatibility", label: "Compatibility" },
                                ] as const).map(tab => (

                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`pb-3 text-sm font-medium transition
${activeTab === tab.id
                                                ? "text-zinc-900 border-b-2 border-zinc-900"
                                                : "text-zinc-400 hover:text-zinc-700"
                                            }`}
                                    >
                                        {tab.label}
                                    </button>

                                ))}

                            </div>


                            <div className="p-6">


                                {/* overview */}

                                {activeTab === "about" && (

                                    <p className="text-zinc-600 leading-relaxed">
                                        {product.description}
                                    </p>

                                )}


                                {/* specs */}

                                {activeTab === "specs" && (

                                    <div className="divide-y divide-zinc-200">

                                        {Object.entries(flatSpecs).map(([k, v]) => (

                                            <div key={k} className="py-3 flex justify-between text-sm">

                                                <span className="text-zinc-500">
                                                    {formatKey(k)}
                                                </span>

                                                <span className="font-medium text-zinc-900">
                                                    {String(v)}
                                                </span>

                                            </div>

                                        ))}

                                    </div>

                                )}


                                {/* compat */}

                                {activeTab === "compatibility" && (

                                    <div className="text-sm text-zinc-600">
                                        Compatibility info here
                                    </div>

                                )}

                            </div>

                        </div>


                    </div>
                </div>

            </div>
        </div>
    );
};

export default ProductDetailClient;