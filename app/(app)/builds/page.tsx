'use client';

import React, { useState, useMemo, ReactNode, Suspense } from 'react';
import { useBuild } from '@/context/BuildContext';
import { validateBuild } from '@/services/compatibility';
import {
  Save,
  Upload,
  Share2,
  Cpu,
  Monitor,
  HardDrive,
  Zap,
  Box,
  X,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Link2,
  ArrowRight,
  Calendar,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import { Category, CompatibilityLevel, BuildGuide, CartItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageTitle } from '@/components/layout/PageTitle';
import { motion, AnimatePresence } from 'framer-motion';
import { getBaseUrl } from '@/lib/utils';

// --- Category Icon Map ---
const CATEGORY_ICON: Record<Category, ReactNode> = {
  [Category.PROCESSOR]: <Cpu size={12} />,
  [Category.GPU]: <Monitor size={12} />,
  [Category.RAM]: <Layers size={12} />,
  [Category.MOTHERBOARD]: <Cpu size={12} />,
  [Category.STORAGE]: <HardDrive size={12} />,
  [Category.PSU]: <Zap size={12} />,
  [Category.CABINET]: <Box size={12} />,
  [Category.COOLER]: <Zap size={12} />,
  [Category.MONITOR]: <Monitor size={12} />,
  [Category.PERIPHERAL]: <Monitor size={12} />,
  [Category.NETWORKING]: <HardDrive size={12} />,
  [Category.LAPTOP]: <Monitor size={12} />,
};

function getCoverImage(build: BuildGuide): string | null {
  const gpu = build.items.find((i) => i.variant?.product?.category === Category.GPU);
  if (gpu?.variant?.product) return gpu.variant.product.media?.[0]?.url || null;
  const cpu = build.items.find((i) => i.variant?.product?.category === Category.PROCESSOR);
  if (cpu?.variant?.product) return cpu.variant.product.media?.[0]?.url || null;
  return build.items[0]?.variant?.product?.media?.[0]?.url ?? null;
}

const CompatChip: React.FC<{ build: BuildGuide }> = ({ build }) => {
  const cartItems = useMemo(() => build.items.map(i => i.variant?.product ? ({ ...i.variant.product, quantity: i.quantity, selectedVariant: i.variant }) : null).filter(Boolean) as CartItem[], [build]);
  const report = useMemo(() => validateBuild(cartItems), [cartItems]);

  const configs = {
    [CompatibilityLevel.INCOMPATIBLE]: { color: 'bg-red-500', icon: <AlertOctagon size={10} />, label: 'Incompatible' },
    [CompatibilityLevel.WARNING]: { color: 'bg-amber-500', icon: <AlertTriangle size={10} />, label: 'Warning' },
    [CompatibilityLevel.COMPATIBLE]: { color: 'bg-emerald-500', icon: <CheckCircle2 size={10} />, label: 'Compatible' },
  };

  const current = configs[report.status as keyof typeof configs] || configs[CompatibilityLevel.COMPATIBLE];

  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold tracking-tight uppercase ${current.color} text-white px-2 py-0.5 rounded-md shadow-sm`}>
      {current.icon} {current.label}
    </span>
  );
};

function buildShareUrl(build: BuildGuide): string {
  return `${getBaseUrl()}/builds/${build.id}`;
}

const BuildModal: React.FC<{
  build: BuildGuide;
  onClose: () => void;
  onLoad: () => void;
}> = ({ build, onClose, onLoad }) => {
  const cartItems = useMemo(() => build.items.map(i => i.variant?.product ? ({ ...i.variant.product, quantity: i.quantity, selectedVariant: i.variant }) : null).filter(Boolean) as CartItem[], [build]);
  const report = useMemo(() => validateBuild(cartItems), [cartItems]);
  const [copied, setCopied] = useState(false);

  const totalPrice = build.items.reduce((sum, item) => sum + (item.variant?.price || 0) * item.quantity, 0);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(buildShareUrl(build));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const compatCfg = report.status === CompatibilityLevel.INCOMPATIBLE
    ? { bg: 'bg-red-50 border-red-100 text-red-700', label: 'Incompatible', Icon: AlertOctagon }
    : report.status === CompatibilityLevel.WARNING
      ? { bg: 'bg-amber-50 border-amber-100 text-amber-700', label: 'Minor Issues', Icon: AlertTriangle }
      : { bg: 'bg-emerald-50 border-emerald-100 text-emerald-700', label: 'Fully Compatible', Icon: CheckCircle2 };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-md" onClick={onClose} 
      />

      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative bg-white rounded-t-2xl sm:rounded-xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-zinc-900 truncate pr-4">{build.title}</h2>
            <div className="flex items-center gap-2 mt-0.5 text-zinc-400 font-bold text-[9px] uppercase tracking-widest">
                <span className="flex items-center gap-1"><Calendar size={10}/> {new Date(build.createdAt).toLocaleDateString()}</span>
                <span>•</span>
                <span>{build.items.length} Parts</span>
            </div>
          </div>
          <button onClick={onClose} className="shrink-0 p-1.5 hover:bg-zinc-100 rounded-lg transition-colors">
            <X size={18} className="text-zinc-400" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          <div className={`flex items-start gap-3 p-3 rounded-lg border ${compatCfg.bg}`}>
            <compatCfg.Icon size={16} className="mt-0.5 shrink-0" />
            <div className="flex-1">
                <p className="font-bold text-xs">{compatCfg.label}</p>
                <p className="text-[11px] opacity-80 leading-relaxed">
                  {report.issues.length > 0 ? report.issues[0].message : "System is validated and ready."}
                </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">Build Manifest</h4>
            {build.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 transition-all">
                <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center p-1 border border-zinc-100 shrink-0">
                  <img src={item.variant?.product?.media?.[0]?.url || '/placeholder.png'} alt="" className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-zinc-900 text-[13px] truncate">{item.variant?.product?.name}</p>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase">
                    {item.variant?.product?.category} {item.quantity > 1 && `×${item.quantity}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-[13px] text-zinc-900">₹{(item.variant?.price || 0).toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-zinc-50 border-t border-zinc-100">
          <div className="flex justify-between items-center mb-4 px-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Value</span>
            <span className="text-xl font-black text-zinc-900">₹{totalPrice.toLocaleString('en-IN')}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={onLoad} className="h-10 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all">
              <Upload size={14} /> Load Build
            </button>
            <button onClick={handleCopyLink} className={`h-10 text-xs font-bold rounded-lg border flex items-center justify-center gap-2 transition-all ${copied ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-100'}`}>
              {copied ? <CheckCircle2 size={14} /> : <Share2 size={14} />}
              {copied ? 'Copied' : 'Share'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

function BuildsContent() {
  const { buildGuides, loadBuild, refreshBuildGuides } = useBuild();
  const [activeBuild, setActiveBuild] = useState<BuildGuide | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  React.useEffect(() => { refreshBuildGuides(); }, [refreshBuildGuides]);

  const handleCopyDirect = async (e: React.MouseEvent, build: BuildGuide) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(buildShareUrl(build));
    setCopiedId(build.id);
    toast({ title: 'Link copied!', description: 'Ready to share.' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <PageLayout bgClass="bg-[#fcfcfd]">
      <PageLayout.Header>
        <PageTitle
          title="Saved Builds"
          subtitle={`${buildGuides.length} configurations available.`}
          badge={
            <div className="inline-flex items-center gap-2 bg-white border border-zinc-200 text-zinc-500 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md mb-2 shadow-sm">
              <Save size={10} className="text-indigo-600" /> Library
            </div>
          }
        />
      </PageLayout.Header>

      <PageLayout.Content className="flex-1" padding="sm">
        {buildGuides.length === 0 ? (
          <div className="max-w-xs mx-auto mt-20 text-center">
            <Box className="text-zinc-200 mx-auto mb-4" size={40} />
            <h3 className="text-lg font-bold text-zinc-900">Empty Library</h3>
            <p className="text-xs text-zinc-500 mb-6">No saved configurations found.</p>
            <Link href="/products?mode=build" className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg font-bold text-xs">
              Open Studio <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {buildGuides.map((build, i) => {
              const coverImg = getCoverImage(build);
              const totalItems = build.items.length;
              return (
                <motion.div
                  key={build.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setActiveBuild(build)}
                  className="group bg-white rounded-xl border border-zinc-200/60 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col"
                >
                  <div className="relative h-36 bg-zinc-50/50 flex items-center justify-center p-6 border-b border-zinc-100">
                    <div className="absolute top-2 left-2 z-10 scale-90 origin-top-left">
                      <CompatChip build={build} />
                    </div>
                    {coverImg ? (
                      <img src={coverImg} alt="" className="h-full w-auto object-contain filter drop-shadow-lg group-hover:scale-105 transition-transform" />
                    ) : (
                      <Box className="h-8 w-8 text-zinc-200" />
                    )}
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <div className="mb-3">
                      <h3 className="text-[13px] font-bold text-zinc-900 truncate">{build.title}</h3>
                      <p className="text-[9px] font-bold text-zinc-400 flex items-center gap-1 mt-0.5 uppercase">
                         <Calendar size={10}/> {new Date(build.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="space-y-1 mb-4">
                      {build.items.slice(0, 2).map((item) => (
                        <div key={item.id} className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 bg-zinc-50 px-2 py-1 rounded-md">
                          <span className="shrink-0 opacity-60">
                            {item.variant?.product ? CATEGORY_ICON[item.variant.product.category as Category] : null}
                          </span>
                          <span className="truncate">{item.variant?.product?.name}</span>
                        </div>
                      ))}
                      {totalItems > 2 && (
                        <p className="text-[8px] font-black text-zinc-300 pl-1 uppercase">
                          + {totalItems - 2} more
                        </p>
                      )}
                    </div>

                    <div className="mt-auto pt-3 border-t border-zinc-50 flex items-center justify-between">
                       <div className="flex -space-x-1.5">
                          {build.items.slice(0,3).map((item, idx) => (
                             <div key={idx} className="w-6 h-6 rounded-full border-2 border-white bg-white shadow-sm overflow-hidden ring-1 ring-zinc-100">
                                <img src={item.variant?.product?.media?.[0]?.url || '/placeholder.png'} className="w-full h-full object-contain" />
                             </div>
                          ))}
                       </div>
                       
                       <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                          <button 
                            onClick={(e) => handleCopyDirect(e, build)} 
                            className={`w-8 h-8 flex items-center justify-center rounded-md transition-all border ${copiedId === build.id ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-white text-zinc-400 hover:text-zinc-900 border-zinc-200'}`}
                          >
                             {copiedId === build.id ? <CheckCircle2 size={14} /> : <Link2 size={14} />}
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); loadBuild(build.id); }} 
                            className="px-3 h-8 bg-zinc-900 text-white text-[9px] font-bold uppercase tracking-widest rounded-md hover:bg-indigo-600 transition-colors"
                          >
                             Load
                          </button>
                       </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </PageLayout.Content>

      <AnimatePresence>
        {activeBuild && (
          <BuildModal
            build={activeBuild}
            onClose={() => setActiveBuild(null)}
            onLoad={() => { loadBuild(activeBuild.id); setActiveBuild(null); }}
          />
        )}
      </AnimatePresence>
    </PageLayout>
  );
}

export default function Builds() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    }>
      <BuildsContent />
    </Suspense>
  );
}