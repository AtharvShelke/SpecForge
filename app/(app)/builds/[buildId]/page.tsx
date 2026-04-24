'use client';

import React, { useEffect, useState, useMemo, ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useShop } from '@/context/ShopContext';
import { BuildGuide } from '@/types';
import { CATEGORY_NAMES } from '@/lib/categoryUtils';
import {
    Upload,
    Cpu,
    Monitor,
    HardDrive,
    Zap,
    Box,
    AlertTriangle,
    ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

type GuideItem = NonNullable<BuildGuide['items']>[number];
type GuideSpec = NonNullable<NonNullable<GuideItem['variant']>['variantSpecs']>[number];

// Category Icon Map
const CATEGORY_ICON: Record<string, ReactNode> = {
    [CATEGORY_NAMES.PROCESSOR]: <Cpu size={14} />,
    [CATEGORY_NAMES.GPU]: <Monitor size={14} />,
    [CATEGORY_NAMES.RAM]: <Cpu size={14} />,
    [CATEGORY_NAMES.MOTHERBOARD]: <Cpu size={14} />,
    [CATEGORY_NAMES.STORAGE]: <HardDrive size={14} />,
    [CATEGORY_NAMES.PSU]: <Zap size={14} />,
    [CATEGORY_NAMES.CABINET]: <Box size={14} />,
    [CATEGORY_NAMES.COOLER]: <Cpu size={14} />,
    [CATEGORY_NAMES.MONITOR]: <Monitor size={14} />,
    [CATEGORY_NAMES.PERIPHERAL]: <Monitor size={14} />,
    [CATEGORY_NAMES.NETWORKING]: <HardDrive size={14} />,
    Laptop: <Monitor size={14} />,
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
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'An error occurred while loading the build.');
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
        const newCart = (build.items ?? [])
            .filter((item: GuideItem) => Boolean(item.variant?.product))
            .map((item: GuideItem) => ({ ...item.variant!.product!, quantity: item.quantity ?? 1, selectedVariant: item.variant }));
        loadCart(newCart);
        setCartOpen(true);
        router.push('/products?mode=build');
    };

    const buildItems = useMemo(() => build?.items ?? [], [build]);
    const totalValue = useMemo(
        () => buildItems.reduce(
            (sum, item: GuideItem) => sum + Number(item.variant?.price ?? 0) * Number(item.quantity ?? 1),
            0,
        ),
        [buildItems],
    );

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
                        href="/build-guides"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl font-medium transition-colors"
                    >
                        <ArrowLeft size={18} /> Go back to Builds
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 py-10">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link
                    href="/build-guides"
                    className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors mb-6"
                >
                    <ArrowLeft size={16} /> Back to Build Guides
                </Link>
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
                    {/* Header */}
                    <div className="p-6 sm:p-8 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">{build.title}</h1>
                            <p className="text-zinc-500 mt-1">
                                {new Date(build.createdAt).toLocaleDateString()} · {buildItems.length} components
                            </p>
                            {build.description && (
                                <p className="text-zinc-500 mt-3 max-w-2xl">{build.description}</p>
                            )}
                        </div>
                        <button
                            onClick={handleLoadCart}
                            className="flex-shrink-0 flex items-center justify-center gap-2 h-11 px-6 bg-blue-600 hover:bg-blue-700 
                text-white font-semibold rounded-xl text-sm transition-all shadow-sm"
                        >
                            <Upload size={16} /> Load into Cart
                        </button>
                    </div>

                    {/* Guide Banner */}
                    <div className="px-6 sm:px-8 py-4 bg-zinc-50/50 border-b border-zinc-100 flex items-center gap-2 text-sm font-medium">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-blue-50 border-blue-200 text-blue-700">
                            <AlertTriangle size={16} />
                            Admin-curated guide
                        </div>
                        <span className="text-zinc-500 ml-2">Load it into the builder to customize, continue, and order.</span>
                    </div>

                    {/* Build Items */}
                    <div className="p-6 sm:p-8 space-y-4">
                        {buildItems.map((item: GuideItem) => (
                            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-4 border border-zinc-100 rounded-xl p-4 hover:bg-zinc-50 transition-colors">
                                <div className="w-16 h-16 bg-white border border-zinc-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden self-start sm:self-auto">
                                    <img src={item.variant?.product?.media?.[0]?.url || '/placeholder.png'} alt={item.variant?.product?.name} className="w-full h-full object-contain p-1.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-zinc-900 text-base">{item.variant?.product?.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-zinc-500 mt-1">
                                        <span className="text-zinc-400">{item.variant?.product?.subCategory?.category?.name ? CATEGORY_ICON[item.variant.product.subCategory.category.name] : null}</span>
                                        {item.variant?.product?.subCategory?.category?.name || item.variant?.product?.subCategory?.name}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {item.variant?.variantSpecs?.slice(0, 4).map((spec: GuideSpec) => (
                                            <span key={spec.id} className="text-[11px] font-medium bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md">
                                                {spec.spec?.name}: {spec.valueString || spec.valueNumber || spec.valueBool}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="sm:text-right flex-shrink-0 mt-2 sm:mt-0">
                                    <p className="font-bold text-zinc-900 text-lg">₹{item.variant?.price?.toLocaleString('en-IN')}</p>
                                    <p className="text-xs text-zinc-400">Qty {item.quantity ?? 1}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="px-6 sm:px-8 py-5 border-t border-zinc-100 bg-zinc-50/60 flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-500">Estimated total</span>
                        <span className="text-xl font-bold text-zinc-900">₹{(build.total || totalValue).toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
