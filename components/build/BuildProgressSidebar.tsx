'use client';

import React, { useMemo } from 'react';
import { useShop } from '../../context/ShopContext';
import { Check, XCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { validateBuild } from '@/lib/calculations/compatibility';
import { useSearchParams } from 'next/navigation';
import { useBuildSequence } from '@/hooks/useBuildSequence';
import { useCategories } from '@/hooks/useCategories';

interface BuildProgressSidebarProps {
    activeCategory?: string;
    onStepClick: (category: string) => void;
}

import { motion, AnimatePresence } from 'framer-motion';
const BuildProgressSidebar: React.FC<BuildProgressSidebarProps> = ({ activeCategory, onStepClick }) => {
    const { cart } = useShop();
    const searchParams = useSearchParams();
    const isBuildMode = searchParams.get('mode') === 'build';
    const { buildSequence } = useBuildSequence();
    const { getLabel } = useCategories();
    const buildSequenceCodes = buildSequence.map((item) => item.category.code);

    // Compute compatibility report locally from cart
    const compatibilityReport = useMemo(() => validateBuild(cart), [cart]);

    const buildSteps = useMemo(() => {
        return buildSequenceCodes.map((cat, index) => {
            const item = cart.find(i => (typeof i.category === 'string' ? i.category : i.category?.slug) === cat);
            return {
                category: cat,
                label: getLabel(cat),
                item,
                step: index + 1
            };
        });
    }, [buildSequenceCodes, cart, getLabel]);

    return (
        <AnimatePresence>
            {isBuildMode && (
                <motion.div
                    initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                    animate={{ width: 320, opacity: 1, marginLeft: 24 }}
                    exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="flex-shrink-0 h-full hidden xl:block overflow-hidden"
                >
                    <div className="w-80 h-full bg-zinc-50 border-l border-zinc-200 overflow-y-auto scrollbar-thin rounded-xl shadow-inner">
                        <div className="p-4 bg-white border-b border-zinc-200 sticky top-0 z-10">
                            <h3 className="font-bold text-zinc-900 heading-font mb-1 flex items-center justify-between">
                                <span>Your Build</span>
                                <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded-md">
                                    {cart.length} / {buildSteps.length} Parts
                                </span>
                            </h3>

                            {/* Compatibility Status Mini-Banner */}
                            {cart.length > 0 && (
                                <div className={`mt-3 p-2.5 rounded-lg border text-xs font-medium flex items-start gap-2 ${compatibilityReport.status === 'INCOMPATIBLE' ? 'bg-red-50 border-red-200 text-red-800' :
                                    compatibilityReport.status === 'WARNING' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                                        'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    }`}>
                                    {compatibilityReport.status === 'INCOMPATIBLE' ? <XCircle size={14} className="mt-0.5" /> :
                                        compatibilityReport.status === 'WARNING' ? <AlertTriangle size={14} className="mt-0.5" /> :
                                            <Check size={14} className="mt-0.5" />}
                                    <span>
                                        {compatibilityReport.status === 'COMPATIBLE' ? 'All selected components are compatible.' :
                                            `${compatibilityReport.issues.length} compatibility issue(s) detected.`}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="p-4 space-y-2 relative">
                            {buildSteps.map((step, idx) => {
                                const isActive = step.category === activeCategory;
                                const isCompleted = !!step.item;

                                return (
                                    <button
                                        key={step.category}
                                        onClick={() => onStepClick(step.category)}
                                        className={`
                            w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all relative
                            ${isActive
                                                ? 'border-blue-300 bg-blue-50/50 shadow-sm ring-1 ring-blue-100'
                                                : isCompleted
                                                    ? 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm'
                                                    : 'border-zinc-200 border-dashed bg-zinc-50/50 hover:bg-zinc-100'
                                            }
                          `}
                                    >
                                        {/* Step indicator */}
                                        <div className={`
                            w-6 h-6 mt-0.5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold transition-colors z-10
                            ${isCompleted
                                                ? 'bg-zinc-900 text-white'
                                                : isActive
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-zinc-200 text-zinc-500'
                                            }
                          `}>
                                            {isCompleted ? <Check size={12} strokeWidth={3} /> : step.step}
                                        </div>

                                        {/* Connecting line (if not last) */}
                                        {idx < buildSteps.length - 1 && (
                                            <div className={`absolute top-9 left-[1.125rem] w-px h-[calc(100%-8px)] rounded-full -translate-x-1/2 z-0
                                ${isCompleted ? 'bg-zinc-300' : 'bg-zinc-200 border-dashed border-l'}
                              `} />
                                        )}

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-blue-700' : isCompleted ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                                    {step.label}
                                                </p>
                                                {isActive && <ChevronRight size={14} className="text-blue-400" />}
                                            </div>

                                            {step.item ? (
                                                <div className="mt-1.5 flex gap-2 items-center">
                                                    <div className="w-8 h-8 rounded-md bg-zinc-50 border border-zinc-100 flex items-center justify-center overflow-hidden relative flex-shrink-0">
                                                        <Image src={step.item.media?.[0]?.url || '/placeholder.png'} alt={step.item.name} fill className="object-contain p-1 mix-blend-multiply" sizes="32px" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] font-medium text-zinc-900 truncate leading-tight">
                                                            {step.item.name}
                                                        </p>
                                                        <p className="text-[11px] text-zinc-500 font-semibold mt-0.5">
                                                            ₹{(step.item.variants?.[0]?.price || 0).toLocaleString('en-IN')}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-[11px] text-zinc-500 mt-1">Select a component</p>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default BuildProgressSidebar;
