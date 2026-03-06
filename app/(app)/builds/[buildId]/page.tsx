'use client';

import React, { useEffect, useState, useMemo, ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useShop } from '@/context/ShopContext';
import { BuildGuide, CartItem, CompatibilityLevel, Category } from '@/types';
import { validateBuild } from '@/services/compatibility';
import {
    Upload,
    Cpu,
    Monitor,
    HardDrive,
    Zap,
    Box,
    CheckCircle2,
    AlertTriangle,
    AlertOctagon,
    ArrowLeft,
    Laptop,
} from 'lucide-react';
import Link from 'next/link';

// Category Icon Map
const CATEGORY_ICON: Record<Category, ReactNode> = {
    [Category.PROCESSOR]: <Cpu size={14} />,
    [Category.GPU]: <Monitor size={14} />,
    [Category.RAM]: <Cpu size={14} />,
    [Category.MOTHERBOARD]: <Cpu size={14} />,
    [Category.STORAGE]: <HardDrive size={14} />,
    [Category.PSU]: <Zap size={14} />,
    [Category.CABINET]: <Box size={14} />,
    [Category.COOLER]: <Cpu size={14} />,
    [Category.MONITOR]: <Monitor size={14} />,
    [Category.PERIPHERAL]: <Monitor size={14} />,
    [Category.NETWORKING]: <HardDrive size={14} />,
    [Category.LAPTOP]: <Laptop size={14} />,
};

export default function SharedBuildPage() {
    const params = useParams();
    const router = useRouter();
    const buildId = params?.buildId as string;
    const { loadCart, setCartOpen } = useShop();

    const [build, setBuild] = useState<BuildGuide | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchBuild() {
            try {
                setLoading(true);
                const res = await fetch(`/api/build-guides/${buildId}`);
                if (!res.ok) {
                    throw new Error(res.status === 404 ? 'Build not found' : 'Failed to load build');
                }
                const data = await res.json();
                setBuild(data);
            } catch (err: any) {
                setError(err.message || 'An error occurred while loading the build.');
            } finally {
                setLoading(false);
            }
        }
        if (buildId) {
            fetchBuild();
        }
    }, [buildId]);

    const handleLoadCart = () => {
        if (!build) return;
        const newCart = build.items
            .filter((item: any) => item.variant?.product)
            .map((item: any) => ({ ...item.variant.product, quantity: item.quantity, selectedVariant: item.variant })) as CartItem[];
        loadCart(newCart);
        setCartOpen(true);
        router.push('/products?mode=build');
    };

    const cartItems = useMemo(() => {
        if (!build) return [];
        return build.items
            .map((i: any) => (i.variant?.product ? { ...i.variant.product, quantity: i.quantity, selectedVariant: i.variant } : null))
            .filter(Boolean) as CartItem[];
    }, [build]);

    const report = useMemo(() => validateBuild(cartItems), [cartItems]);

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-zinc-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <p className="text-zinc-500 font-medium">Loading build details...</p>
            </div>
        );
    }

    if (error || !build) {
        return (
            <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center py-12 px-4">
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900 mb-2">Build Not Found</h1>
                    <p className="text-zinc-500 mb-6">{error || "The build you're looking for doesn't exist or has been deleted."}</p>
                    <Link
                        href="/builds"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl font-medium transition-colors"
                    >
                        <ArrowLeft size={18} /> Go back to Builds
                    </Link>
                </div>
            </div>
        );
    }

    const isIncompat = report.status === CompatibilityLevel.INCOMPATIBLE;
    const isWarning = report.status === CompatibilityLevel.WARNING;

    const compatCfg = isIncompat
        ? { bg: 'bg-red-50 border-red-200 text-red-700', label: 'Incompatible', Icon: AlertOctagon }
        : isWarning
            ? { bg: 'bg-yellow-50 border-yellow-200 text-yellow-700', label: 'Minor Issues', Icon: AlertTriangle }
            : { bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', label: 'Fully Compatible', Icon: CheckCircle2 };

    const { Icon: CompatIcon } = compatCfg;

    return (
        <div className="min-h-screen bg-zinc-50 py-10">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link
                    href="/builds"
                    className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors mb-6"
                >
                    <ArrowLeft size={16} /> Back to My Builds
                </Link>
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
                    {/* Header */}
                    <div className="p-6 sm:p-8 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">{build.title}</h1>
                            <p className="text-zinc-500 mt-1">
                                {new Date(build.createdAt).toLocaleDateString()} · {build.items.length} components
                            </p>
                        </div>
                        <button
                            onClick={handleLoadCart}
                            className="flex-shrink-0 flex items-center justify-center gap-2 h-11 px-6 bg-blue-600 hover:bg-blue-700 
                text-white font-semibold rounded-xl text-sm transition-all shadow-sm"
                        >
                            <Upload size={16} /> Load into Cart
                        </button>
                    </div>

                    {/* Compat Banner */}
                    <div className="px-6 sm:px-8 py-4 bg-zinc-50/50 border-b border-zinc-100 flex items-center gap-2 text-sm font-medium">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${compatCfg.bg}`}>
                            <CompatIcon size={16} />
                            {compatCfg.label}
                        </div>
                        {report.issues.length > 0 && (
                            <span className="text-zinc-500 ml-2">— {report.issues[0].message}</span>
                        )}
                    </div>

                    {/* Build Items */}
                    <div className="p-6 sm:p-8 space-y-4">
                        {build.items.map((item) => (
                            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-4 border border-zinc-100 rounded-xl p-4 hover:bg-zinc-50 transition-colors">
                                <div className="w-16 h-16 bg-white border border-zinc-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden self-start sm:self-auto">
                                    <img src={(item as any).variant?.product?.media?.[0]?.url || '/placeholder.png'} alt={(item as any).variant?.product?.name} className="w-full h-full object-contain p-1.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-zinc-900 text-base">{(item as any).variant?.product?.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-zinc-500 mt-1">
                                        <span className="text-zinc-400">{(item as any).variant?.product ? CATEGORY_ICON[(item as any).variant.product.category as Category] : null}</span>
                                        {(item as any).variant?.product?.category}
                                        {item.quantity > 1 && <span className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md text-xs font-medium ml-2">Qty {item.quantity}</span>}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {(item as any).variant?.product && Object.entries((item as any).variant.product.specs).slice(0, 4).map(([k, v]) => (
                                            <span key={k} className="text-[11px] font-medium bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md">
                                                {k}: {typeof v === 'object' ? (v as any).value : v}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="sm:text-right flex-shrink-0 mt-2 sm:mt-0">
                                    <p className="font-bold text-zinc-900 text-lg">₹{(item as any).variant?.price?.toLocaleString('en-IN')}</p>
                                    {item.quantity > 1 && (
                                        <p className="text-xs text-zinc-500">₹{((item as any).variant?.price || 0) * item.quantity} total</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
