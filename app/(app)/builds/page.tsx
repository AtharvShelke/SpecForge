'use client';

import React, { useState, useMemo, ReactNode } from 'react';
import { useBuild } from '@/context/BuildContext';
import { validateBuild } from '@/services/compatibility';
import {
  Save,
  Trash2,
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
  Plus,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { Category, CompatibilityLevel, BuildGuide, BuildGuideItem, Product, CartItem } from '@/types';
import { useShop } from '@/context/ShopContext';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { useToast } from '@/hooks/use-toast';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageTitle } from '@/components/layout/PageTitle';
import { motion } from 'framer-motion';
import { getBaseUrl } from '@/lib/utils';

// -------------------------------------------------------------------
// Category Icon Map
// -------------------------------------------------------------------
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
  [Category.LAPTOP]: <Monitor size={14} />,
};

// -------------------------------------------------------------------
// Smart Cover Image (GPU > CPU > first item)
// -------------------------------------------------------------------
function getCoverImage(build: BuildGuide): string | null {
  const gpu = build.items.find((i) => i.variant?.product?.category === Category.GPU);
  if (gpu?.variant?.product) return gpu.variant.product.media?.[0]?.url || null;
  const cpu = build.items.find((i) => i.variant?.product?.category === Category.PROCESSOR);
  if (cpu?.variant?.product) return cpu.variant.product.media?.[0]?.url || null;
  return build.items[0]?.variant?.product?.media?.[0]?.url ?? null;
}

// -------------------------------------------------------------------
// Compatibility Badge (small, for card)
// -------------------------------------------------------------------
const CompatChip: React.FC<{ build: BuildGuide }> = ({ build }) => {
  const cartItems = useMemo(() => build.items.map(i => i.variant?.product ? ({ ...i.variant.product, quantity: i.quantity, selectedVariant: i.variant }) : null).filter(Boolean) as CartItem[], [build]);
  const report = useMemo(() => validateBuild(cartItems), [cartItems]);

  if (report.status === CompatibilityLevel.INCOMPATIBLE)
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase bg-red-500 text-white px-2 py-1 rounded-full shadow-lg">
        <AlertOctagon size={12} /> Incompatible
      </span>
    );
  if (report.status === CompatibilityLevel.WARNING)
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase bg-amber-400 text-white px-2 py-1 rounded-full shadow-lg">
        <AlertTriangle size={12} /> Check Issues
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase bg-zinc-950 text-white px-3 py-1 rounded-full shadow-lg">
      <CheckCircle2 size={12} /> Compatible
    </span>
  );
};

// -------------------------------------------------------------------
// Share helper
// -------------------------------------------------------------------
function buildShareUrl(build: BuildGuide): string {
  return `${getBaseUrl()}/builds/${build.id}`;
}

// -------------------------------------------------------------------
// Build Detail Modal
// -------------------------------------------------------------------
const BuildModal: React.FC<{
  build: BuildGuide;
  onClose: () => void;
  onLoad: () => void;
}> = ({ build, onClose, onLoad }) => {
  const cartItems = useMemo(() => build.items.map(i => i.variant?.product ? ({ ...i.variant.product, quantity: i.quantity, selectedVariant: i.variant }) : null).filter(Boolean) as CartItem[], [build]);
  const report = useMemo(() => validateBuild(cartItems), [cartItems]);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  const handleCopyLink = async () => {
    await copyToClipboard(buildShareUrl(build));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isIncompat = report.status === CompatibilityLevel.INCOMPATIBLE;
  const isWarning = report.status === CompatibilityLevel.WARNING;

  const compatCfg = isIncompat
    ? { bg: 'bg-red-50 border-red-200 text-red-700', label: 'Incompatible', Icon: AlertOctagon }
    : isWarning
      ? { bg: 'bg-yellow-50 border-yellow-200 text-yellow-700', label: 'Minor Issues', Icon: AlertTriangle }
      : { bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', label: 'Fully Compatible', Icon: CheckCircle2 };

  const { Icon: CompatIcon } = compatCfg;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.3 }}
        className="relative bg-white rounded-3xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-zinc-100 flex items-start justify-between gap-4 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-zinc-950 heading-font">{build.title}</h2>
            <p className="text-sm font-medium text-zinc-500 mt-1">
              {new Date(build.createdAt).toLocaleDateString()} · {build.items.length} components
            </p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-zinc-100 text-zinc-500 hover:text-zinc-900 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Compat Banner */}
        <div className={`mx-6 mt-4 flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm font-bold ${compatCfg.bg}`}>
          <CompatIcon size={18} />
          {compatCfg.label}
          {report.issues.length > 0 && (
            <span className="ml-1 opacity-80 font-semibold truncate">— {report.issues[0].message}</span>
          )}
        </div>

        {/* Component List */}
        <div className="overflow-y-auto flex-1 p-6 space-y-3 scrollbar-thin scrollbar-thumb-zinc-200">
          {build.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 border border-zinc-100 rounded-2xl p-4 hover:shadow-md hover:border-zinc-200 transition-all bg-white group">
              <div className="w-16 h-16 bg-zinc-50 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img src={item.variant?.product?.media?.[0]?.url || '/placeholder.png'} alt={item.variant?.product?.name} className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-zinc-950 text-sm truncate group-hover:text-indigo-600 transition-colors">{item.variant?.product?.name}</p>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 mt-1">
                  <span className="text-zinc-400">{item.variant?.product ? CATEGORY_ICON[item.variant.product.category as Category] : null}</span>
                  {item.variant?.product?.category} · Qty {item.quantity}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-black text-zinc-950 text-base">₹{item.variant?.price?.toLocaleString('en-IN')}</p>
                {item.quantity > 1 && (
                  <p className="text-xs font-bold text-zinc-400 mt-0.5">×{item.quantity}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-zinc-100 flex gap-3 flex-shrink-0 bg-zinc-50 rounded-b-3xl">
          <button
            onClick={onLoad}
            className="flex-1 flex items-center justify-center gap-2 h-12 bg-indigo-600 hover:bg-indigo-500 
              text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 text-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <Upload size={18} /> Load into Cart
          </button>
          <button
            onClick={handleCopyLink}
            className={`flex items-center justify-center gap-2 h-12 px-6 font-bold rounded-2xl text-sm transition-all border shadow-sm
              ${copied
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50'}`}
          >
            {copied ? <CheckCircle2 size={18} /> : <Share2 size={18} />}
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// -------------------------------------------------------------------
// Builds Content
// -------------------------------------------------------------------
function BuildsContent() {
  const { buildGuides, loadBuild, deleteBuild, refreshBuildGuides } = useBuild();

  React.useEffect(() => {
    refreshBuildGuides();
  }, [refreshBuildGuides]);
  const [activeBuild, setActiveBuild] = useState<BuildGuide | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  const handleLoad = (buildId: string) => {
    loadBuild(buildId);
    setActiveBuild(null);
  };

  const handleCopyDirect = async (e: React.MouseEvent, build: BuildGuide) => {
    e.stopPropagation();
    await copyToClipboard(buildShareUrl(build));
    setCopiedId(build.id);
    toast({ title: 'Link copied!', description: 'Anyone with this link can view this build.' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <PageLayout bgClass="bg-zinc-50">
      {/* Page Header */}
      <PageLayout.Header>
        <PageTitle
          title="Saved Builds"
          subtitle={`${buildGuides.length} build${buildGuides.length !== 1 ? 's' : ''} saved — click any card to view details or share.`}
          badge={
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
              <Save size={14} /> Your Saved Builds
            </div>
          }

        />
      </PageLayout.Header>

      <PageLayout.Content className="flex-1 overflow-hidden" padding="lg">
        {buildGuides.length === 0 ? (
          <div className="max-w-2xl mx-auto mt-12 text-center bg-white rounded-3xl border border-zinc-200 p-16 shadow-xl shadow-zinc-200/40">
            <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Box className="text-zinc-300" size={36} />
            </div>
            <h3 className="text-2xl font-bold text-zinc-950 mb-3 heading-font">No saved builds yet</h3>
            <p className="text-zinc-500 text-base font-medium mb-8">
              Use Build Mode to configure your perfect PC with real-time compatibility checking.
            </p>
            <Link
              href="/products?mode=build"
              className="inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold uppercase tracking-wide transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-600/20"
            >
              Start Building <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {buildGuides.map((build: BuildGuide, i: number) => {
              const coverImg = getCoverImage(build);
              const isCopied = copiedId === build.id;

              return (
                <motion.div
                  key={build.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  onClick={() => setActiveBuild(build)}
                  className="group relative flex flex-col bg-white rounded-3xl overflow-hidden hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 border border-zinc-100 cursor-pointer"
                >
                  {/* Compat badge overlay */}
                  <div className="absolute top-4 left-4 z-20">
                    <CompatChip build={build} />
                  </div>

                  {/* Cover Image Container */}
                  <div className="relative bg-zinc-50 aspect-video w-full overflow-hidden flex items-center justify-center p-8 border-b border-zinc-100">
                    {coverImg ? (
                      <img
                        src={coverImg}
                        alt={build.title}
                        className="w-full h-full object-contain filter drop-shadow-xl group-hover:scale-110 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                      />
                    ) : (
                      <Box className="h-16 w-16 text-zinc-300 group-hover:scale-110 transition-transform duration-700" />
                    )}
                  </div>

                  {/* Content Area */}
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-zinc-950 truncate group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{build.title}</h3>
                    <p className="text-xs font-semibold text-zinc-400 mt-1 uppercase tracking-widest">{new Date(build.createdAt).toLocaleDateString()} · {build.items.length} parts</p>

                    {/* Items Preview */}
                    <div className="mt-6 mb-8 space-y-2.5">
                      {build.items.slice(0, 3).map((item: BuildGuideItem) => (
                        <div key={item.id} className="flex items-center gap-3 text-sm font-medium text-zinc-600">
                          <span className="text-zinc-400 flex-shrink-0 bg-zinc-50 p-1.5 rounded-lg">{item.variant?.product ? CATEGORY_ICON[item.variant.product.category as Category] : null}</span>
                          <span className="truncate flex-1">{item.variant?.product?.name}</span>
                        </div>
                      ))}
                      {build.items.length > 3 && (
                        <p className="text-xs font-bold text-zinc-400 pl-10 pt-1">+{build.items.length - 3} more</p>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="mt-auto border-t border-zinc-100 pt-5 flex items-center justify-end">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleCopyDirect(e, build)}
                          title="Copy shareable link"
                          className={`h-10 px-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all
                            ${isCopied
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200'}`}
                        >
                          {isCopied ? <CheckCircle2 size={16} /> : <Link2 size={16} />}
                          {isCopied ? 'Copied' : 'Share'}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleLoad(build.id); }}
                          className="h-10 px-5 flex items-center gap-2 bg-zinc-950 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-colors"
                        >
                          <Upload size={16} /> Load
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

      {/* Detail Modal */}
      {activeBuild && (
        <BuildModal
          build={activeBuild}
          onClose={() => setActiveBuild(null)}
          onLoad={() => { handleLoad(activeBuild.id); }}
        />
      )}
    </PageLayout>
  );
}

// -------------------------------------------------------------------
// Main Page Export with Suspense
// -------------------------------------------------------------------
export default function Builds() {
  return (
    <Suspense fallback={
      <PageLayout bgClass="bg-zinc-50">
        <PageLayout.Content className="flex items-center justify-center min-h-[50vh]">
          <div className="w-12 h-12 rounded-full border-4 border-zinc-200 border-t-indigo-600 animate-spin" />
        </PageLayout.Content>
      </PageLayout>
    }>
      <BuildsContent />
    </Suspense>
  );
}
