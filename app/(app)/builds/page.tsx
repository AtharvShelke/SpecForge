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
import { Category, CompatibilityLevel, SavedBuild, SavedBuildItem, Product, CartItem } from '@/types';

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
};

// -------------------------------------------------------------------
// Smart Cover Image (GPU > CPU > first item)
// -------------------------------------------------------------------
function getCoverImage(build: SavedBuild): string | null {
  const gpu = build.items.find((i) => i.product?.category === Category.GPU);
  if (gpu?.product) return gpu.product.image;
  const cpu = build.items.find((i) => i.product?.category === Category.PROCESSOR);
  if (cpu?.product) return cpu.product.image;
  return build.items[0]?.product?.image ?? null;
}

// -------------------------------------------------------------------
// Compatibility Badge (small, for card)
// -------------------------------------------------------------------
const CompatChip: React.FC<{ build: SavedBuild }> = ({ build }) => {
  const cartItems = useMemo(() => build.items.map(i => i.product ? ({ ...i.product, quantity: i.quantity }) : null).filter(Boolean) as CartItem[], [build]);
  const report = useMemo(() => validateBuild(cartItems), [cartItems]);

  if (report.status === CompatibilityLevel.INCOMPATIBLE)
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full">
        <AlertOctagon size={10} /> Incompatible
      </span>
    );
  if (report.status === CompatibilityLevel.WARNING)
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-yellow-50 text-yellow-700 border border-yellow-100 px-2 py-0.5 rounded-full">
        <AlertTriangle size={10} /> Check Issues
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full">
      <CheckCircle2 size={10} /> Compatible
    </span>
  );
};

// -------------------------------------------------------------------
// Share helper
// -------------------------------------------------------------------
function buildShareUrl(build: SavedBuild): string {
  const ids = build.items.map((i) => i.id).join(',');
  return `${typeof window !== 'undefined' ? window.location.origin : ''}/builds?shared=${encodeURIComponent(ids)}&name=${encodeURIComponent(build.name)}`;
}

// -------------------------------------------------------------------
// Build Detail Modal
// -------------------------------------------------------------------
const BuildModal: React.FC<{
  build: SavedBuild;
  onClose: () => void;
  onLoad: () => void;
}> = ({ build, onClose, onLoad }) => {
  const cartItems = useMemo(() => build.items.map(i => i.product ? ({ ...i.product, quantity: i.quantity }) : null).filter(Boolean) as CartItem[], [build]);
  const report = useMemo(() => validateBuild(cartItems), [cartItems]);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(buildShareUrl(build));
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="p-6 border-b border-zinc-100 flex items-start justify-between gap-4 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">{build.name}</h2>
            <p className="text-sm text-zinc-400 mt-0.5">
              {new Date(build.createdAt).toLocaleDateString()} · {build.items.length} components · ₹{build.total.toLocaleString('en-IN')}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Compat Banner */}
        <div className={`mx-6 mt-4 flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium ${compatCfg.bg}`}>
          <CompatIcon size={15} />
          {compatCfg.label}
          {report.issues.length > 0 && (
            <span className="ml-1 opacity-70 font-normal">— {report.issues[0].message}</span>
          )}
        </div>

        {/* Component List */}
        <div className="overflow-y-auto flex-1 p-6 space-y-3">
          {build.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 border border-zinc-100 rounded-xl p-3.5 hover:bg-zinc-50 transition-colors">
              <div className="w-14 h-14 bg-zinc-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img src={item.product?.image} alt={item.product?.name} className="w-full h-full object-contain p-1.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-zinc-900 text-sm truncate">{item.product?.name}</p>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                  <span className="text-zinc-300">{item.product ? CATEGORY_ICON[item.product.category] : null}</span>
                  {item.product?.category} · Qty {item.quantity}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.product && Object.entries(item.product.specs).slice(0, 3).map(([k, v]) => (
                    <span key={k} className="text-[10px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded-full">
                      {k}: {typeof v === 'object' ? (v as any).value : v}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-zinc-900 text-sm">₹{item.product?.price.toLocaleString('en-IN')}</p>
                {item.quantity > 1 && (
                  <p className="text-[10px] text-zinc-400">×{item.quantity}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-zinc-100 flex gap-3 flex-shrink-0">
          <button
            onClick={onLoad}
            className="flex-1 flex items-center justify-center gap-2 h-11 bg-blue-600 hover:bg-blue-700 
              text-white font-semibold rounded-xl text-sm transition-all"
          >
            <Upload size={15} /> Load into Cart
          </button>
          <button
            onClick={handleCopyLink}
            className={`flex items-center justify-center gap-2 h-11 px-5 font-semibold rounded-xl text-sm transition-all border
              ${copied
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'}`}
          >
            {copied ? <CheckCircle2 size={15} /> : <Share2 size={15} />}
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------------
// Main Page
// -------------------------------------------------------------------
export default function Builds() {
  const { savedBuilds, loadBuild, deleteBuild, refreshSavedBuilds } = useBuild();

  React.useEffect(() => {
    refreshSavedBuilds();
  }, [refreshSavedBuilds]);
  const [activeBuild, setActiveBuild] = useState<SavedBuild | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleLoad = (buildId: string) => {
    loadBuild(buildId);
    setActiveBuild(null);
  };

  const handleCopyDirect = (e: React.MouseEvent, build: SavedBuild) => {
    e.stopPropagation();
    navigator.clipboard.writeText(buildShareUrl(build));
    setCopiedId(build.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; }
        h1,h2,h3,h4 { font-family: 'Space Grotesk', 'Inter', sans-serif; letter-spacing: -0.025em; }
        .build-card { transition: box-shadow 0.2s ease, transform 0.2s ease; }
        .build-card:hover { box-shadow: 0 12px 32px -8px rgba(0,0,0,0.1); transform: translateY(-2px); }
      `}</style>

      {/* Page Header */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
                <Save size={12} /> Your Saved Builds
              </div>
              <h1 className="text-3xl font-bold text-zinc-900">Saved Builds</h1>
              <p className="text-zinc-500 text-sm mt-1">
                {savedBuilds.length} build{savedBuilds.length !== 1 ? 's' : ''} saved — click any card to view details or share.
              </p>
            </div>
            <Link
              href="/products?mode=build"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 
                text-white text-sm font-semibold rounded-xl transition-all self-start sm:self-auto"
            >
              <Plus size={15} /> New Build
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {savedBuilds.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-zinc-200">
            <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Box className="text-zinc-400" size={28} />
            </div>
            <h3 className="text-lg font-semibold text-zinc-800 mb-2">No saved builds yet</h3>
            <p className="text-zinc-500 text-sm mb-6">
              Use Build Mode to configure your perfect PC, then save it here.
            </p>
            <Link
              href="/products?mode=build"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm"
            >
              Start Building <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {savedBuilds.map((build: SavedBuild) => {
              const coverImg = getCoverImage(build);
              const isCopied = copiedId === build.id;

              return (
                <div
                  key={build.id}
                  onClick={() => setActiveBuild(build)}
                  className="build-card bg-white border border-zinc-200 rounded-2xl overflow-hidden cursor-pointer"
                >
                  {/* Cover Image */}
                  <div className="h-44 bg-zinc-50 flex items-center justify-center relative overflow-hidden border-b border-zinc-100">
                    {coverImg ? (
                      <img
                        src={coverImg}
                        alt={build.name}
                        className="w-full h-full object-contain p-6"
                      />
                    ) : (
                      <Box className="h-12 w-12 text-zinc-300" />
                    )}
                    {/* Compat badge overlay */}
                    <div className="absolute top-3 left-3">
                      <CompatChip build={build} />
                    </div>
                  </div>

                  {/* Card Header */}
                  <div className="px-5 pt-4 pb-3">
                    <h3 className="text-base font-bold text-zinc-900 truncate">{build.name}</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">{new Date(build.createdAt).toLocaleDateString()} · {build.items.length} components</p>
                  </div>

                  {/* Items Preview */}
                  <div className="px-5 pb-4 space-y-1.5">
                    {build.items.slice(0, 4).map((item: SavedBuildItem) => (
                      <div key={item.id} className="flex items-center gap-2 text-xs text-zinc-600">
                        <span className="text-zinc-300 flex-shrink-0">{item.product ? CATEGORY_ICON[item.product.category as Category] : null}</span>
                        <span className="truncate flex-1">{item.product?.name}</span>
                        {item.quantity > 1 && <span className="text-zinc-400 flex-shrink-0">×{item.quantity}</span>}
                      </div>
                    ))}
                    {build.items.length > 4 && (
                      <p className="text-[11px] text-zinc-400 pl-5">+{build.items.length - 4} more components</p>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="px-5 py-4 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-lg font-bold text-zinc-900">
                      ₹{build.total.toLocaleString('en-IN')}
                    </span>
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleCopyDirect(e, build)}
                        title="Copy shareable link"
                        className={`h-8 px-3 flex items-center gap-1.5 text-xs font-medium rounded-lg border transition-all
                          ${isCopied
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'}`}
                      >
                        {isCopied ? <CheckCircle2 size={12} /> : <Link2 size={12} />}
                        {isCopied ? 'Copied' : 'Share'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleLoad(build.id); }}
                        className="h-8 px-3 flex items-center gap-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg"
                      >
                        <Upload size={12} /> Load
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteBuild(build.id); }}
                        className="h-8 w-8 flex items-center justify-center text-zinc-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {activeBuild && (
        <BuildModal
          build={activeBuild}
          onClose={() => setActiveBuild(null)}
          onLoad={() => { handleLoad(activeBuild.id); }}
        />
      )}
    </div>
  );
}