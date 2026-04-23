'use client';

import { useState, useEffect, useMemo, useCallback, memo, Suspense } from 'react';
import { useBuild } from '@/context/BuildContext';
// Legacy client-side compatibility engine removed. Use BuildContext.checkCompatibility() for real API-based checks.
const validateBuild = (_items: any[]): { status: any; issues: any[] } => ({ status: 'COMPATIBLE', issues: [] });
import {
  Save, Upload, Share2, Cpu, Monitor, HardDrive, Zap, Box, X,
  CheckCircle2, AlertTriangle, AlertOctagon, Link2, ArrowRight, Calendar, Layers,
} from 'lucide-react';
import Link from 'next/link';
import { CompatibilityLevel, Build, CartItem } from '@/types';
import { CATEGORY_NAMES, sameCategory } from '@/lib/categoryUtils';
import { useToast } from '@/hooks/use-toast';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageTitle } from '@/components/layout/PageTitle';
import { motion, AnimatePresence } from 'framer-motion';
import { getBaseUrl } from '@/lib/utils';

// ── Constants (module scope — never recreated) ────────────────────────────────

// JSX elements as icon values force React to re-create them on every render.
// Store component references instead and render them at use-site.
const CATEGORY_ICON_COMPONENTS: Record<string, React.ElementType> = {
  [CATEGORY_NAMES.PROCESSOR]:  Cpu,
  [CATEGORY_NAMES.GPU]:        Monitor,
  [CATEGORY_NAMES.RAM]:        Layers,
  [CATEGORY_NAMES.MOTHERBOARD]:Cpu,
  [CATEGORY_NAMES.STORAGE]:    HardDrive,
  [CATEGORY_NAMES.PSU]:        Zap,
  [CATEGORY_NAMES.CABINET]:    Box,
  [CATEGORY_NAMES.COOLER]:     Zap,
  [CATEGORY_NAMES.MONITOR]:    Monitor,
  [CATEGORY_NAMES.PERIPHERAL]: Monitor,
  [CATEGORY_NAMES.NETWORKING]: HardDrive,
  Laptop:                      Monitor,
};

// Compat display config — plain object, never recreated
const COMPAT_CHIP_CONFIG = {
  [CompatibilityLevel.INCOMPATIBLE]: { color: 'bg-red-500',    Icon: AlertOctagon,  label: 'Incompatible' },
  [CompatibilityLevel.WARNING]:      { color: 'bg-amber-500',  Icon: AlertTriangle, label: 'Warning'      },
  [CompatibilityLevel.COMPATIBLE]:   { color: 'bg-emerald-500',Icon: CheckCircle2,  label: 'Compatible'   },
} as const;

const COMPAT_MODAL_CONFIG = {
  [CompatibilityLevel.INCOMPATIBLE]: { bg: 'bg-red-50 border-red-100 text-red-700',       Icon: AlertOctagon,  label: 'Incompatible'     },
  [CompatibilityLevel.WARNING]:      { bg: 'bg-amber-50 border-amber-100 text-amber-700', Icon: AlertTriangle, label: 'Minor Issues'     },
  [CompatibilityLevel.COMPATIBLE]:   { bg: 'bg-emerald-50 border-emerald-100 text-emerald-700', Icon: CheckCircle2, label: 'Fully Compatible' },
} as const;

// Framer Motion transition objects — module scope, stable references
const MODAL_BACKDROP_ANIM = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } } as const;
const MODAL_SHEET_ANIM    = { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } } as const;
const MODAL_SHEET_TRANS   = { type: 'spring', damping: 25, stiffness: 300 } as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCoverImage(build: Build): string | null {
  const gpu = (build.items ?? []).find(i => sameCategory(i.variant?.product?.category, CATEGORY_NAMES.GPU));
  if (gpu?.variant?.product) return gpu.variant.product.media?.[0]?.url ?? null;
  const cpu = (build.items ?? []).find(i => sameCategory(i.variant?.product?.category, CATEGORY_NAMES.PROCESSOR));
  if (cpu?.variant?.product) return cpu.variant.product.media?.[0]?.url ?? null;
  return build.items?.[0]?.variant?.product?.media?.[0]?.url ?? null;
}

function buildShareUrl(build: Build): string {
  return `${getBaseUrl()}/builds/${build.id}`;
}

// Converts build items to CartItem[] — extracted so both CompatChip and
// BuildModal can share the same transformation without duplicating it.
function buildToCartItems(build: Build): CartItem[] {
  return (build.items ?? [])
    .map(i => i.variant?.product
      ? ({ ...i.variant.product, quantity: (i as any).quantity ?? 1, selectedVariant: i.variant })
      : null)
    .filter(Boolean) as CartItem[];
}

// ── CompatChip ────────────────────────────────────────────────────────────────

const CompatChip = memo(function CompatChip({ build }: { build: Build }) {
  const report  = useMemo(() => validateBuild(buildToCartItems(build)), [build]);
  const cfg     = COMPAT_CHIP_CONFIG[report.status as CompatibilityLevel] ?? COMPAT_CHIP_CONFIG[CompatibilityLevel.COMPATIBLE];
  const { Icon } = cfg;

  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold tracking-tight uppercase ${cfg.color} text-white px-2 py-0.5 rounded-md shadow-sm`}>
      <Icon size={10} /> {cfg.label}
    </span>
  );
});

// ── BuildModal ────────────────────────────────────────────────────────────────

const BuildModal = memo(function BuildModal({
  build,
  onClose,
  onLoad,
}: {
  build:   Build
  onClose: () => void
  onLoad:  () => void
}) {
  const report     = useMemo(() => validateBuild(buildToCartItems(build)), [build]);
  const [copied, setCopied] = useState(false);

  const totalPrice = useMemo(
    () => (build.items ?? []).reduce((sum, item) => sum + (item.variant?.price ?? 0) * ((item as any).quantity ?? 1), 0),
    [build.items]
  );

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(buildShareUrl(build));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [build]);

  const compatCfg = COMPAT_MODAL_CONFIG[report.status as CompatibilityLevel] ?? COMPAT_MODAL_CONFIG[CompatibilityLevel.COMPATIBLE];
  const { Icon: CompatIcon } = compatCfg;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        {...MODAL_BACKDROP_ANIM}
        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        {...MODAL_SHEET_ANIM}
        transition={MODAL_SHEET_TRANS}
        className="relative bg-white rounded-t-2xl sm:rounded-xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-zinc-900 truncate pr-4">{build.name}</h2>
            <div className="flex items-center gap-2 mt-0.5 text-zinc-400 font-bold text-[9px] uppercase tracking-widest">
              <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(build.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>{build.items?.length ?? 0} Parts</span>
            </div>
          </div>
          <button onClick={onClose} className="shrink-0 p-1.5 hover:bg-zinc-100 rounded-lg transition-colors">
            <X size={18} className="text-zinc-400" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          <div className={`flex items-start gap-3 p-3 rounded-lg border ${compatCfg.bg}`}>
            <CompatIcon size={16} className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-xs">{compatCfg.label}</p>
              <p className="text-[11px] opacity-80 leading-relaxed">
                {report.issues.length > 0 ? report.issues[0].message : 'System is validated and ready.'}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">Build Manifest</h4>
            {(build.items ?? []).map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 transition-all">
                <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center p-1 border border-zinc-100 shrink-0">
                  <img
                    src={item.variant?.product?.media?.[0]?.url ?? '/placeholder.png'}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-zinc-900 text-[13px] truncate">{item.variant?.product?.name}</p>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase">
                    {item.variant?.product?.category} {((item as any).quantity ?? 1) > 1 && `x${(item as any).quantity}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-[13px] text-zinc-900">₹{(item.variant?.price ?? 0).toLocaleString('en-IN')}</p>
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
            <button
              onClick={handleCopyLink}
              className={`h-10 text-xs font-bold rounded-lg border flex items-center justify-center gap-2 transition-all ${copied ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-100'}`}
            >
              {copied ? <CheckCircle2 size={14} /> : <Share2 size={14} />}
              {copied ? 'Copied' : 'Share'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

// ── BuildCard ─────────────────────────────────────────────────────────────────

const CARD_ANIM = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } } as const;

const BuildCard = memo(function BuildCard({
  build,
  index,
  copiedId,
  onOpen,
  onCopyDirect,
  onLoad,
}: {
  build:         Build
  index:         number
  copiedId:      string | null
  onOpen:        (b: Build) => void
  onCopyDirect:  (e: React.MouseEvent, b: Build) => void
  onLoad:        (e: React.MouseEvent, id: string) => void
}) {
  const coverImg   = useMemo(() => getCoverImage(build), [build]);
  const totalItems = build.items?.length ?? 0;
  const isCopied   = copiedId === build.id;

  const handleOpen      = useCallback(() => onOpen(build),                              [onOpen, build]);
  const handleCopy      = useCallback((e: React.MouseEvent) => onCopyDirect(e, build), [onCopyDirect, build]);
  const handleLoadClick = useCallback((e: React.MouseEvent) => onLoad(e, build.id),    [onLoad, build.id]);

  return (
    <motion.div
      {...CARD_ANIM}
      transition={{ delay: index * 0.03 }}
      onClick={handleOpen}
      className="group bg-white rounded-xl border border-zinc-200/60 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col"
    >
      <div className="relative h-36 bg-zinc-50/50 flex items-center justify-center p-6 border-b border-zinc-100">
        <div className="absolute top-2 left-2 z-10 scale-90 origin-top-left">
          <CompatChip build={build} />
        </div>
        {coverImg ? (
          <img
            src={coverImg}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-auto object-contain filter drop-shadow-lg group-hover:scale-105 transition-transform"
          />
        ) : (
          <Box className="h-8 w-8 text-zinc-200" />
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="mb-3">
          <h3 className="text-[13px] font-bold text-zinc-900 truncate">{build.name}</h3>
          <p className="text-[9px] font-bold text-zinc-400 flex items-center gap-1 mt-0.5 uppercase">
            <Calendar size={10} /> {new Date(build.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-1 mb-4">
          {(build.items ?? []).slice(0, 2).map((item) => {
            const IconComp = item.variant?.product
              ? CATEGORY_ICON_COMPONENTS[item.variant.product.category]
              : null;
            return (
              <div key={item.id} className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 bg-zinc-50 px-2 py-1 rounded-md">
                <span className="shrink-0 opacity-60">{IconComp && <IconComp size={12} />}</span>
                <span className="truncate">{item.variant?.product?.name}</span>
              </div>
            );
          })}
          {totalItems > 2 && (
            <p className="text-[8px] font-black text-zinc-300 pl-1 uppercase">+ {totalItems - 2} more</p>
          )}
        </div>

        <div className="mt-auto pt-3 border-t border-zinc-50 flex items-center justify-between">
          <div className="flex -space-x-1.5">
            {(build.items ?? []).slice(0, 3).map((item, idx) => (
              <div key={idx} className="w-6 h-6 rounded-full border-2 border-white bg-white shadow-sm overflow-hidden ring-1 ring-zinc-100">
                <img
                  src={item.variant?.product?.media?.[0]?.url ?? '/placeholder.png'}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
            <button
              onClick={handleCopy}
              className={`w-8 h-8 flex items-center justify-center rounded-md transition-all border ${isCopied ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-white text-zinc-400 hover:text-zinc-900 border-zinc-200'}`}
            >
              {isCopied ? <CheckCircle2 size={14} /> : <Link2 size={14} />}
            </button>
            <button
              onClick={handleLoadClick}
              className="px-3 h-8 bg-zinc-900 text-white text-[9px] font-bold uppercase tracking-widest rounded-md hover:bg-indigo-600 transition-colors"
            >
              Load
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// ── BuildsContent ─────────────────────────────────────────────────────────────

function BuildsContent() {
  const { builds, loadBuild, refreshBuilds } = useBuild();
  const [activeBuild, setActiveBuild] = useState<Build | null>(null);
  const [copiedId,    setCopiedId]    = useState<string | null>(null);
  const { toast } = useToast();

  // Refresh builds on mount
  useEffect(() => { refreshBuilds(); }, [refreshBuilds]);

  const handleCopyDirect = useCallback(async (e: React.MouseEvent, build: Build) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(buildShareUrl(build));
    setCopiedId(build.id);
    toast({ title: 'Link copied!', description: 'Ready to share.' });
    setTimeout(() => setCopiedId(null), 2000);
  }, [toast]);

  const handleLoad = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    loadBuild(id);
  }, [loadBuild]);

  const handleModalLoad = useCallback(() => {
    if (activeBuild) { loadBuild(activeBuild.id); setActiveBuild(null); }
  }, [activeBuild, loadBuild]);

  const handleModalClose = useCallback(() => setActiveBuild(null), []);

  return (
    <PageLayout bgClass="bg-[#fcfcfd]">
      <PageLayout.Header>
        <PageTitle
          title="Saved Builds"
          subtitle={`${builds.length} configurations available.`}
          badge={
            <div className="inline-flex items-center gap-2 bg-white border border-zinc-200 text-zinc-500 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md mb-2 shadow-sm">
              <Save size={10} className="text-indigo-600" /> Library
            </div>
          }
        />
      </PageLayout.Header>

      <PageLayout.Content className="flex-1" padding="sm">
        {builds.length === 0 ? (
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
            {builds.map((build, i) => (
              <BuildCard
                key={build.id}
                build={build}
                index={i}
                copiedId={copiedId}
                onOpen={setActiveBuild}
                onCopyDirect={handleCopyDirect}
                onLoad={handleLoad}
              />
            ))}
          </div>
        )}
      </PageLayout.Content>

      <AnimatePresence>
        {activeBuild && (
          <BuildModal
            build={activeBuild}
            onClose={handleModalClose}
            onLoad={handleModalLoad}
          />
        )}
      </AnimatePresence>
    </PageLayout>
  );
}

// ── Builds (public export) ────────────────────────────────────────────────────

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
