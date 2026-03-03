'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import {
  AlertCircle, ArrowLeft, Check, CheckCircle2, ChevronDown, ChevronRight,
  Clock, Eye, EyeOff, FileText, GripVertical, Hash, Image as ImageIcon,
  Info, Layout, Link as LinkIcon, Loader2, Monitor, Package, Plus,
  RefreshCw, RotateCcw, Save, Sparkles, Star, Tag, Trash2, Type,
  Undo, Upload, X, Zap, Shield, Layers, AlignLeft, ExternalLink,
} from 'lucide-react';
import { LandingPageCMS, HeroContent, TrustFeature, CategoryItem, CMSVersion, CMSContent } from '@/types';
import { useShop } from '@/context/ShopContext';
import { useAdmin } from '@/context/AdminContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import ImageUploader from '../uploadthing/ImageUploader';

// ─────────────────────────────────────────────────────────────
// TYPES & CONSTANTS
// ─────────────────────────────────────────────────────────────

type SectionKey = 'hero' | 'categories' | 'featured' | 'trust' | 'cta';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const AVAILABLE_ICONS = [
  'Shield', 'Zap', 'Headphones', 'TrendingUp', 'Award', 'Star',
  'Cpu', 'Monitor', 'Package', 'HardDrive', 'Fan', 'Power',
  'Truck', 'Heart', 'Globe', 'Lock', 'Bolt', 'Layers',
] as const;

const CATEGORY_KEYS = [
  'Processor', 'Graphics Card', 'Motherboard', 'RAM',
  'Storage', 'Power Supply', 'Cabinet', 'Cooler', 'Monitor', 'Peripheral',
];

const SECTION_NAV: { key: SectionKey; label: string; shortLabel: string; icon: React.ReactNode; description: string }[] = [
  { key: 'hero', label: 'Hero Section', shortLabel: 'Hero', icon: <Sparkles size={15} />, description: 'Main landing hero area' },
  { key: 'categories', label: 'Categories', shortLabel: 'Categories', icon: <Layers size={15} />, description: 'Product category navigation' },
  { key: 'featured', label: 'Featured Products', shortLabel: 'Featured', icon: <Star size={15} />, description: 'Curated product showcase' },
  { key: 'trust', label: 'Trust Indicators', shortLabel: 'Trust', icon: <Shield size={15} />, description: 'Customer assurance signals' },
  { key: 'cta', label: 'Call to Action', shortLabel: 'CTA', icon: <Zap size={15} />, description: 'Final conversion section' },
];

// ─────────────────────────────────────────────────────────────
// FIELD COMPONENTS
// ─────────────────────────────────────────────────────────────

const FieldLabel = ({ children, hint }: { children: React.ReactNode; hint?: string }) => (
  <div className="flex items-center gap-1.5 mb-2">
    <Label className="text-sm font-medium text-zinc-700">{children}</Label>
    {hint && (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info size={12} className="text-zinc-300 cursor-help hover:text-zinc-500 transition-colors" />
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-zinc-900 text-white border-zinc-800 text-xs max-w-48">
            {hint}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )}
  </div>
);

const FieldGroup = ({ title, icon, children, defaultOpen = true }: {
  title: string; icon?: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border-zinc-200 shadow-sm overflow-hidden bg-white">
        <CollapsibleTrigger asChild>
          <CardHeader className="px-5 py-3.5 cursor-pointer hover:bg-zinc-50 transition-colors border-b border-zinc-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                <span className="text-zinc-400">{icon}</span>
                {title}
              </CardTitle>
              <ChevronDown size={14} className={cn('text-zinc-400 transition-transform duration-300', open && 'rotate-180')} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="px-5 py-5 space-y-6 bg-white">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

const IconSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const Icon = (LucideIcons as any)[value] || LucideIcons.Package;
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-zinc-900" />
      </div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 text-xs font-bold border-zinc-200 flex-1 uppercase tracking-tight focus:ring-zinc-900">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-56 bg-white border-zinc-200 shadow-xl">
          {AVAILABLE_ICONS.map(icon => {
            const I = (LucideIcons as any)[icon] || LucideIcons.Package;
            return (
              <SelectItem key={icon} value={icon} className="text-[10px] font-bold uppercase tracking-tight">
                <div className="flex items-center gap-2">
                  <I size={13} className="text-zinc-400" /> {icon}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// LIVE MINI PREVIEW
// ─────────────────────────────────────────────────────────────

const MiniPreview = ({ content, activeSection }: { content: CMSContent; activeSection: SectionKey }) => {
  const { hero, categories, trustIndicators, finalCTA, featuredProducts } = content.sections;

  return (
    <div className="w-full h-full bg-white overflow-hidden rounded-xl border border-zinc-200 text-[0.5rem] leading-tight select-none pointer-events-none shadow-sm">
      {/* Simulated browser bar */}
      <div className="bg-zinc-50 border-b border-zinc-100 px-3 py-1.5 flex items-center gap-2">
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
        </div>
        <div className="flex-1 bg-white border border-zinc-200 rounded px-2 py-0.5 text-[0.4rem] text-zinc-400 font-mono tracking-tighter truncate">
          nexushardware.com/preview
        </div>
      </div>

      <ScrollArea className="h-[calc(100%-28px)]">
        <div className="px-4 py-4 space-y-4">

          {/* Hero preview */}
          <div className={cn('rounded-xl p-3 space-y-2 transition-all border', activeSection === 'hero' ? 'ring-2 ring-zinc-900 bg-zinc-50 border-zinc-300' : 'bg-white border-zinc-100')}>
            <div className="inline-flex items-center gap-1 bg-zinc-900 rounded-full px-2 py-0.5">
              <span className="text-white text-[0.4rem] font-black uppercase tracking-widest">{hero.badge.text}</span>
            </div>
            <div className="text-zinc-900 font-black uppercase tracking-tighter" style={{ fontSize: '0.7rem' }}>
              {hero.headline.line1}<br />
              <span className="text-zinc-400">{hero.headline.line2}</span>
            </div>
            <p className="text-zinc-500 line-clamp-2" style={{ fontSize: '0.45rem' }}>{hero.subheadline}</p>
            <div className="flex gap-2 pt-1">
              <span className="bg-zinc-900 text-white rounded px-2 py-1 text-[0.4rem] font-bold uppercase tracking-widest">{hero.primaryCTA.text}</span>
              <span className="bg-white border border-zinc-200 text-zinc-900 rounded px-2 py-1 text-[0.4rem] font-bold uppercase tracking-widest">{hero.secondaryCTA.text}</span>
            </div>
          </div>

          {/* Categories preview */}
          <div className={cn('rounded-xl p-3 space-y-2 transition-all border', activeSection === 'categories' ? 'ring-2 ring-zinc-900 bg-zinc-100 border-zinc-300' : 'bg-white border-zinc-100')}>
            <p className="font-black text-zinc-900 uppercase tracking-widest text-[0.45rem]">{categories.sectionTitle}</p>
            <div className="grid grid-cols-2 gap-2">
              {categories.categories.slice(0, 4).map(c => (
                <div key={c.id} className="bg-zinc-50 border border-zinc-200 rounded-lg p-1.5 text-center">
                  <span className="text-zinc-900 font-bold uppercase tracking-tighter text-[0.4rem]">{c.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trust preview */}
          <div className={cn('rounded-xl p-3 space-y-2 transition-all border', activeSection === 'trust' ? 'ring-2 ring-zinc-900 bg-zinc-100 border-zinc-300' : 'bg-white border-zinc-100')}>
            <div className="grid grid-cols-2 gap-2">
              {trustIndicators.features.slice(0, 4).map(f => (
                <div key={f.id} className="bg-zinc-50 border border-zinc-200 rounded-lg p-1.5">
                  <p className="font-black text-zinc-900 uppercase tracking-tighter" style={{ fontSize: '0.4rem' }}>{f.title}</p>
                  <div className="w-full h-1 bg-zinc-200 rounded-full mt-1" />
                </div>
              ))}
            </div>
          </div>

          {/* CTA preview */}
          <div className={cn('rounded-xl p-4 text-center space-y-2 transition-all border', activeSection === 'cta' ? 'ring-2 ring-zinc-900 border-zinc-300' : 'bg-zinc-900 border-zinc-900')}>
            <p className="font-black text-white uppercase tracking-widest text-[0.45rem]">{finalCTA.headline}</p>
            <span className="inline-block bg-white text-zinc-900 rounded px-2 py-1 text-[0.4rem] font-black uppercase tracking-widest">{finalCTA.ctaText}</span>
          </div>

        </div>
      </ScrollArea>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SECTION EDITORS
// ─────────────────────────────────────────────────────────────

const HeroEditor = ({ content, updateHero }: {
  content: CMSContent;
  updateHero: (u: Partial<HeroContent>) => void;
}) => {
  const hero = content.sections.hero;
  return (
    <div className="space-y-6">
      <FieldGroup title="Badge" icon={<Tag size={13} />}>
        <div>
          <FieldLabel hint="Micro-copy shown as a badge above the headline">Badge Text</FieldLabel>
          <Input value={hero.badge.text}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateHero({ badge: { ...hero.badge, text: e.target.value } })}
            className="h-10 text-xs font-bold border-zinc-200 focus:ring-zinc-900 uppercase tracking-widest" placeholder="e.g. PERFORMANCE OPTIMIZED" />
        </div>
        <div className="flex items-center justify-between py-2 bg-zinc-50 px-4 rounded-xl border border-zinc-100">
          <FieldLabel>Show Badge Icon</FieldLabel>
          <Switch checked={hero.badge.icon}
            onCheckedChange={(v: boolean) => updateHero({ badge: { ...hero.badge, icon: v } })} />
        </div>
      </FieldGroup>

      <FieldGroup title="Headline & Copy" icon={<Type size={13} />}>
        <div>
          <FieldLabel>Headline (Line 1)</FieldLabel>
          <Input value={hero.headline.line1}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateHero({ headline: { ...hero.headline, line1: e.target.value } })}
            className="h-10 text-xs font-bold border-zinc-200 focus:ring-zinc-900 uppercase tracking-widest" placeholder="e.g. BEYOND THE" />
        </div>
        <div>
          <FieldLabel hint="Rendered with high-contrast accenting">Headline (Line 2)</FieldLabel>
          <Input value={hero.headline.line2}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateHero({ headline: { ...hero.headline, line2: e.target.value } })}
            className="h-10 text-xs font-black border-zinc-200 focus:ring-zinc-900 uppercase tracking-widest" placeholder="e.g. LIMITS" />
        </div>
        <div className="flex items-center justify-between py-2 bg-zinc-50 px-4 rounded-xl border border-zinc-100">
          <FieldLabel>Enable Gradient</FieldLabel>
          <Switch checked={hero.headline.line2Gradient}
            onCheckedChange={(v: boolean) => updateHero({ headline: { ...hero.headline, line2Gradient: v } })} />
        </div>
        <div>
          <FieldLabel>Subheadline</FieldLabel>
          <Textarea value={hero.subheadline}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateHero({ subheadline: e.target.value })}
            className="text-xs font-medium border-zinc-200 focus:ring-zinc-900 resize-none min-h-[100px] leading-relaxed" placeholder="Detailed architectural description…" />
        </div>
      </FieldGroup>

      <FieldGroup title="Call-to-Action Buttons" icon={<LinkIcon size={13} />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <FieldLabel>Primary Button Text</FieldLabel>
              <Input value={hero.primaryCTA.text}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateHero({ primaryCTA: { ...hero.primaryCTA, text: e.target.value } })}
                className="h-10 text-[10px] font-bold border-zinc-200 uppercase tracking-widest" />
            </div>
            <div>
              <FieldLabel>Primary URL</FieldLabel>
              <Input value={hero.primaryCTA.link}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateHero({ primaryCTA: { ...hero.primaryCTA, link: e.target.value } })}
                className="h-10 text-xs font-mono border-zinc-200" placeholder="/catalog" />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <FieldLabel>Secondary Button Text</FieldLabel>
              <Input value={hero.secondaryCTA.text}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateHero({ secondaryCTA: { ...hero.secondaryCTA, text: e.target.value } })}
                className="h-10 text-[10px] font-bold border-zinc-200 uppercase tracking-widest" />
            </div>
            <div>
              <FieldLabel>Secondary URL</FieldLabel>
              <Input value={hero.secondaryCTA.link}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateHero({ secondaryCTA: { ...hero.secondaryCTA, link: e.target.value } })}
                className="h-10 text-xs font-mono border-zinc-200" placeholder="/saved-builds" />
            </div>
          </div>
        </div>
      </FieldGroup>

      <FieldGroup title="Hero Image" icon={<ImageIcon size={13} />}>
        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            <div className="flex-1">
              <FieldLabel hint="Direct CDN link to image. Preferred: high-res transparent PNG">Image URL</FieldLabel>
              <Input value={hero.heroImage.url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateHero({ heroImage: { ...hero.heroImage, url: e.target.value } })}
                className="h-10 text-xs font-mono border-zinc-200" placeholder="https://cdn.nexushardware.com/assets/..." />
            </div>
            <div className="shrink-0 pt-6">
              <ImageUploader
                endpoint="imageUploader"
                onUploadComplete={(url) => updateHero({ heroImage: { ...hero.heroImage, url } })}
                onUploadError={(err) => console.error('Upload Error:', err)}
              />
            </div>
          </div>
          {hero.heroImage.url && (
            <div className="rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-50/50 flex items-center justify-center p-8 h-48 group relative">
              <div className="absolute top-2 right-2 px-2 py-1 bg-white border border-zinc-200 rounded text-[9px] font-bold text-zinc-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Asset Preview</div>
              <img src={hero.heroImage.url} alt={hero.heroImage.alt}
                className="max-h-full max-w-full object-contain drop-shadow-2xl"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <button
                type="button"
                onClick={() => updateHero({ heroImage: { ...hero.heroImage, url: '' } })}
                className="absolute top-2 left-2 p-1 bg-white border border-red-100 text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>
      </FieldGroup>
    </div>
  );
};

const CategoriesEditor = ({ content, setContent }: { content: CMSContent; setContent: React.Dispatch<React.SetStateAction<CMSContent | null>> }) => {
  const cats = content.sections.categories;

  const addCategory = () => {
    const newCat: CategoryItem = {
      id: `cat-${Date.now()}`,
      name: 'NEW ENTITY',
      icon: 'Package',
      categoryKey: 'Processor',
      order: cats.categories.length + 1,
    };
    setContent(prev => {
      if (!prev) return prev;
      return { ...prev, sections: { ...prev.sections, categories: { ...prev.sections.categories, categories: [...prev.sections.categories.categories, newCat] } } };
    });
  };

  const update = (id: string, updates: Partial<CategoryItem>) =>
    setContent(prev => {
      if (!prev) return prev;
      return { ...prev, sections: { ...prev.sections, categories: { ...prev.sections.categories, categories: prev.sections.categories.categories.map(c => c.id === id ? { ...c, ...updates } : c) } } };
    });

  const remove = (id: string) =>
    setContent(prev => {
      if (!prev) return prev;
      return { ...prev, sections: { ...prev.sections, categories: { ...prev.sections.categories, categories: prev.sections.categories.categories.filter(c => c.id !== id) } } };
    });

  return (
    <div className="space-y-6">
      <FieldGroup title="Section Title" icon={<Type size={13} />}>
        <div>
          <FieldLabel>Title</FieldLabel>
          <Input value={cats.sectionTitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContent(prev => {
              if (!prev) return prev;
              return { ...prev, sections: { ...prev.sections, categories: { ...prev.sections.categories, sectionTitle: e.target.value } } };
            })}
            className="h-10 text-xs font-bold border-zinc-200 uppercase tracking-widest focus:ring-zinc-900" />
        </div>
      </FieldGroup>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-zinc-400" />
            <span className="text-xs font-semibold text-zinc-900">Categories</span>
            <Badge variant="outline" className="bg-zinc-50 text-zinc-500 border-zinc-200 text-[11px] font-medium h-5 px-1.5 rounded">{cats.categories.length}</Badge>
          </div>
          <Button size="sm" variant="outline" onClick={addCategory} className="h-8 text-xs font-medium gap-2 bg-white border-zinc-200 hover:bg-zinc-50 rounded-md">
            <Plus size={12} /> Add Category
          </Button>
        </div>

        <div className="space-y-3">
          {cats.categories.length === 0 ? (
            <div className="py-12 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
              <Layers size={24} className="mx-auto text-zinc-200 mb-2" />
              <p className="text-sm text-zinc-400">No categories added</p>
            </div>
          ) : (
            [...cats.categories].sort((a, b) => a.order - b.order).map(cat => (
              <div key={cat.id} className="bg-white border border-zinc-200 rounded-2xl p-5 group hover:border-zinc-900 transition-all shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center cursor-grab active:cursor-grabbing text-zinc-300 group-hover:text-zinc-400 shrink-0">
                    <GripVertical size={14} />
                  </div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <FieldLabel>Name</FieldLabel>
                      <Input value={cat.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update(cat.id, { name: e.target.value })}
                        className="h-10 text-xs font-bold border-zinc-200 uppercase tracking-tight" />
                    </div>
                    <div>
                      <FieldLabel>Category Key</FieldLabel>
                      <Select value={cat.categoryKey} onValueChange={v => update(cat.id, { categoryKey: v })}>
                        <SelectTrigger className="h-10 text-xs font-bold border-zinc-200 uppercase tracking-tight">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-zinc-200">
                          {CATEGORY_KEYS.map(k => <SelectItem key={k} value={k} className="text-[10px] font-bold uppercase">{k}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-2 grid grid-cols-2 gap-6">
                      <div>
                        <FieldLabel>Icon</FieldLabel>
                        <IconSelect value={cat.icon} onChange={v => update(cat.id, { icon: v })} />
                      </div>
                      <div className="flex flex-col">
                        <FieldLabel>Order</FieldLabel>
                        <div className="flex items-center gap-3">
                          <Input type="number" value={cat.order} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update(cat.id, { order: parseInt(e.target.value) || 1 })}
                            className="h-10 text-xs font-mono border-zinc-200 w-24 text-center" />
                          <div className="flex-1" />
                          <Button size="icon" variant="ghost" onClick={() => remove(cat.id)}
                            className="h-10 w-10 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const FeaturedEditor = ({ content, setContent }: { content: CMSContent; setContent: React.Dispatch<React.SetStateAction<CMSContent | null>> }) => {
  const fp = content.sections.featuredProducts;
  const update = (patch: Partial<typeof fp>) =>
    setContent(prev => {
      if (!prev) return prev;
      return { ...prev, sections: { ...prev.sections, featuredProducts: { ...prev.sections.featuredProducts, ...patch } } };
    });

  return (
    <div className="space-y-6">
      <FieldGroup title="Section Config" icon={<Star size={13} />}>
        <div>
          <FieldLabel>Section Title</FieldLabel>
          <Input value={fp.sectionTitle} onChange={e => update({ sectionTitle: e.target.value })} className="h-10 text-xs font-bold border-zinc-200 uppercase tracking-widest" />
        </div>
        <div>
          <FieldLabel hint="Supporting text beneath the title">Subtitle</FieldLabel>
          <Input value={fp.sectionSubtitle} onChange={e => update({ sectionSubtitle: e.target.value })} className="h-10 text-xs font-medium border-zinc-200" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <FieldLabel>CTA Text</FieldLabel>
            <Input value={fp.ctaText} onChange={e => update({ ctaText: e.target.value })} className="h-10 text-[10px] font-bold border-zinc-200 uppercase tracking-widest" />
          </div>
          <div>
            <FieldLabel>CTA Link</FieldLabel>
            <Input value={fp.ctaLink} onChange={e => update({ ctaLink: e.target.value })} className="h-10 text-xs font-mono border-zinc-200" placeholder="/catalog" />
          </div>
        </div>
      </FieldGroup>

      <div className="p-5 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-2">
          <Zap size={40} className="text-white/5 rotate-12" />
        </div>
        <div className="flex items-start gap-4 transition-all">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
            <Sparkles size={18} className="text-white/80" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-white">Auto-Curated</p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Products are dynamically selected based on listing priority (top GPUs & CPUs).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const TrustEditor = ({ content, setContent }: { content: CMSContent; setContent: React.Dispatch<React.SetStateAction<CMSContent | null>> }) => {
  const features = content.sections.trustIndicators.features;

  const update = (id: string, updates: Partial<TrustFeature>) =>
    setContent(prev => {
      if (!prev) return prev;
      return { ...prev, sections: { ...prev.sections, trustIndicators: { features: prev.sections.trustIndicators.features.map(f => f.id === id ? { ...f, ...updates } : f) } } };
    });

  const remove = (id: string) =>
    setContent(prev => {
      if (!prev) return prev;
      return { ...prev, sections: { ...prev.sections, trustIndicators: { features: prev.sections.trustIndicators.features.filter(f => f.id !== id) } } };
    });

  const add = () => {
    const newFeature: TrustFeature = {
      id: `trust-${Date.now()}`,
      icon: 'Shield',
      title: 'NEW INTEGRITY METRIC',
      description: 'Provide technical assurance details...',
      order: features.length + 1,
    };
    setContent(prev => {
      if (!prev) return prev;
      return { ...prev, sections: { ...prev.sections, trustIndicators: { features: [...prev.sections.trustIndicators.features, newFeature] } } };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-zinc-400" />
          <span className="text-xs font-semibold text-zinc-900">Trust Features</span>
          <Badge variant="outline" className="bg-zinc-50 text-zinc-500 border-zinc-200 text-[11px] font-medium h-5 px-1.5 rounded">{features.length}</Badge>
        </div>
        <Button size="sm" variant="outline" onClick={add} className="h-8 text-xs font-medium gap-2 bg-white border-zinc-200 hover:bg-zinc-50 rounded-md">
          <Plus size={12} /> Add Feature
        </Button>
      </div>

      <div className="space-y-3">
        {features.length === 0 ? (
          <div className="py-12 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            <Shield size={24} className="mx-auto text-zinc-200 mb-2" />
            <p className="text-sm text-zinc-400">No features defined</p>
          </div>
        ) : (
          [...features].sort((a, b) => a.order - b.order).map(f => (
            <div key={f.id} className="bg-white border border-zinc-200 rounded-2xl p-5 group hover:border-zinc-900 transition-all shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center cursor-grab active:cursor-grabbing text-zinc-300 group-hover:text-zinc-400 shrink-0">
                  <GripVertical size={14} />
                </div>
                <div className="flex-1 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <FieldLabel>Title</FieldLabel>
                      <Input value={f.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update(f.id, { title: e.target.value })}
                        className="h-10 text-xs font-bold border-zinc-200 uppercase tracking-tight" />
                    </div>
                    <div>
                      <FieldLabel>Icon</FieldLabel>
                      <IconSelect value={f.icon} onChange={v => update(f.id, { icon: v })} />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Description</FieldLabel>
                    <Textarea value={f.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => update(f.id, { description: e.target.value })}
                      className="text-xs font-medium border-zinc-200 min-h-[80px]" />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-zinc-400">Sort Order</span>
                      <Input type="number" value={f.order} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update(f.id, { order: parseInt(e.target.value) || 1 })}
                        className="h-8 text-xs font-mono border-zinc-200 w-20 text-center" />
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => remove(f.id)}
                      className="h-9 w-9 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const CtaEditor = ({ content, setContent }: { content: CMSContent; setContent: React.Dispatch<React.SetStateAction<CMSContent | null>> }) => {
  const cta = content.sections.finalCTA;
  const update = (patch: Partial<typeof cta>) =>
    setContent(prev => {
      if (!prev) return prev;
      return { ...prev, sections: { ...prev.sections, finalCTA: { ...prev.sections.finalCTA, ...patch } } };
    });

  return (
    <div className="space-y-6">
      <FieldGroup title="CTA Content" icon={<Zap size={13} />}>
        <div>
          <FieldLabel>Headline</FieldLabel>
          <Input value={cta.headline} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update({ headline: e.target.value })} className="h-10 text-xs font-bold border-zinc-200 uppercase tracking-widest" />
        </div>
        <div>
          <FieldLabel>Subtitle</FieldLabel>
          <Textarea value={cta.subheadline} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => update({ subheadline: e.target.value })}
            className="text-xs font-medium border-zinc-200 min-h-[80px]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <FieldLabel>Button Text</FieldLabel>
            <Input value={cta.ctaText} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update({ ctaText: e.target.value })} className="h-10 text-[10px] font-bold border-zinc-200 uppercase tracking-widest" />
          </div>
          <div>
            <FieldLabel>Button Link</FieldLabel>
            <Input value={cta.ctaLink} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update({ ctaLink: e.target.value })} className="h-10 text-xs font-mono border-zinc-200" placeholder="/catalog" />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup title="Visual Style" icon={<Layout size={13} />}>
        <div className="space-y-4">
          <FieldLabel hint="Controls the visual background of the CTA section">Background Style</FieldLabel>
          <Select value={cta.backgroundStyle} onValueChange={v => update({ backgroundStyle: v as any })}>
            <SelectTrigger className="h-10 text-xs font-bold border-zinc-200 uppercase tracking-widest">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-zinc-200">
              <SelectItem value="gradient" className="text-[10px] font-bold uppercase tracking-widest">Gradient Wash</SelectItem>
              <SelectItem value="solid" className="text-[10px] font-bold uppercase tracking-widest">Monolithe Solid</SelectItem>
              <SelectItem value="pattern" className="text-[10px] font-bold uppercase tracking-widest">Technical Grid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className={cn('rounded-[2rem] h-24 flex items-center justify-center text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-inner transition-all duration-500', {
          'bg-zinc-900': cta.backgroundStyle === 'solid',
          'bg-gradient-to-br from-zinc-800 to-zinc-950': cta.backgroundStyle === 'gradient',
          'bg-zinc-900 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:14px_14px]': cta.backgroundStyle === 'pattern',
        })}>
          {cta.ctaText || 'Preview Interface'}
        </div>
      </FieldGroup>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// HISTORY DRAWER
// ─────────────────────────────────────────────────────────────

const HistoryDrawer = ({ open, onClose, onRestore, versions }: {
  open: boolean;
  onClose: () => void;
  onRestore: (version: CMSVersion) => void;
  versions: CMSVersion[];
}) => {
  const published = [...versions].reverse();

  return (
    <Dialog open={open} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl bg-white border-zinc-200 rounded-[2rem] shadow-2xl p-0 overflow-hidden">
        <div className="bg-zinc-50 border-b border-zinc-100 px-8 py-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-zinc-900 font-semibold text-lg">
              <Clock size={20} className="text-zinc-400" /> Version History
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-500 mt-1">
              Published versions and rollback options
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[500px] px-8 py-6">
          {published.length === 0 ? (
            <div className="py-16 text-center">
              <Clock size={32} className="mx-auto text-zinc-100 mb-4" />
              <p className="text-sm text-zinc-400">No versions found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {published.map((ver, idx) => (
                <div key={ver.id} className={cn(
                  'rounded-2xl border p-5 transition-all group',
                  idx === 0 ? 'border-zinc-900 bg-zinc-900 shadow-xl' : 'border-zinc-100 bg-zinc-50/50 hover:border-zinc-300'
                )}>
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={cn("font-semibold text-xs", idx === 0 ? "text-white" : "text-zinc-900")}>
                          Version {ver.id}
                        </span>
                        {idx === 0 && (
                          <Badge className="bg-emerald-500 text-white border-none text-[10px] font-medium px-2 h-5">ACTIVE</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <p className={cn("text-[11px] font-mono", idx === 0 ? "text-zinc-400" : "text-zinc-500")}>
                          {new Date(ver.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).toUpperCase()}
                        </p>
                        {ver.label && (
                          <p className={cn("text-[10px] font-bold uppercase tracking-tight", idx === 0 ? "text-zinc-500" : "text-zinc-400")}>— {ver.label}</p>
                        )}
                      </div>
                    </div>
                    {idx !== 0 && (
                      <Button size="sm" variant="outline" className="h-8 px-4 text-xs font-medium border-zinc-200 hover:bg-indigo-600 hover:text-white transition-all rounded-md shrink-0"
                        onClick={() => onRestore(ver)}>
                        <Undo size={14} className="mr-2" /> Rollback
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="px-8 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs font-medium text-zinc-400 hover:text-zinc-900">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────
// PUBLISH CONFIRM DIALOG
// ─────────────────────────────────────────────────────────────

const PublishDialog = ({ open, onClose, onConfirm, isSaving }: {
  open: boolean; onClose: () => void; onConfirm: () => void; isSaving: boolean;
}) => (
  <Dialog open={open} onOpenChange={(o: boolean) => !o && onClose()}>
    <DialogContent className="sm:max-w-sm bg-white border-zinc-900 rounded-[2rem] shadow-2xl overflow-hidden p-0">
      <div className="p-8 space-y-6">
        <div className="w-16 h-16 rounded-[1.5rem] bg-zinc-900 flex items-center justify-center mx-auto shadow-xl">
          <Upload size={24} className="text-white" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-zinc-900">Publish Changes</h3>
          <p className="text-sm text-zinc-500 mt-2 px-4 leading-relaxed">
            This will deploy your changes to production immediately.
          </p>
        </div>

        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
          <div className="flex items-start gap-4">
            <AlertCircle size={16} className="text-zinc-900 mt-0.5 shrink-0" />
            <p className="text-[10px] font-bold text-zinc-600 leading-relaxed uppercase tracking-tight">
              Status: <span className="text-zinc-900">Immediate Global Update</span><br />
              Voters will witness structural shifts across the nexushardware.com surface.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={onConfirm} disabled={isSaving}
            className="h-12 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all shadow-sm active:scale-[0.98]">
            {isSaving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Shield size={16} className="mr-2" />}
            {isSaving ? 'Publishing…' : 'Publish Now'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSaving}
            className="h-10 text-xs font-medium text-zinc-400 hover:text-zinc-900">
            Cancel Request
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

const CMSManager: React.FC = () => {
  const { cmsContent, refreshCMS } = useShop();
  const { cmsVersions, refreshCMSVersions, saveCMS, restoreCMSVersion } = useAdmin();
  const [content, setContent] = useState<CMSContent | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>('hero');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [showHistory, setShowHistory] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  useEffect(() => {
    if (cmsContent && !content) {
      setContent(JSON.parse(JSON.stringify(cmsContent.content)));
    }
  }, [cmsContent]);

  useEffect(() => { refreshCMSVersions(); }, []);

  // Live Preview Column
  const PreviewColumn = () => (
    <div className="lg:col-span-4 xl:col-span-4 hidden lg:block">
      <div className="sticky top-6 space-y-4">
        <div className="flex items-center justify-between mb-2 px-2">
          <h3 className="text-xs font-medium text-zinc-500 flex items-center gap-2">
            <Eye size={14} className="text-zinc-400" /> Preview
          </h3>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-medium px-2 h-5 rounded">
            LIVE
          </Badge>
        </div>
        <div className="aspect-[9/16] xl:aspect-[10/14] max-h-[750px] shadow-2xl rounded-[2.5rem] overflow-hidden border-[8px] border-zinc-900 ring-1 ring-zinc-200 ring-offset-4 ring-offset-zinc-50 bg-zinc-900">
          {content && <MiniPreview content={content} activeSection={activeSection} />}
        </div>
        <div className="p-4 bg-zinc-900 rounded-2xl text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-5 scale-150">
            <Monitor size={48} />
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/5">
              <Monitor size={15} className="text-zinc-400" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-zinc-500">Preview</p>
              <p className="text-xs font-semibold text-white/90">Responsive Preview</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!content) return (
    <div className="h-[600px] flex items-center justify-center bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 rounded-2xl border-2 border-zinc-200 border-t-zinc-900 animate-spin" />
          <div className="absolute inset-2 rounded-xl border border-zinc-100 border-b-zinc-400 animate-[spin_1.5s_linear_infinite_reverse]" />
        </div>
        <p className="text-sm text-zinc-500 animate-pulse">Loading content...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      {/* Ultra-Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-zinc-100">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-900 rounded-xl shadow-lg">
              <Layout className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-zinc-900 leading-none">
              Content Manager
            </h2>
          </div>
          <p className="text-sm text-zinc-500 flex items-center gap-2 pl-12">
            CMS <span className="w-1 h-1 rounded-full bg-zinc-200" /> Landing page editor
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border border-zinc-200 shadow-xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(true)}
            className="h-9 px-4 text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-all rounded-md"
          >
            <Clock size={16} className="mr-2" /> History
          </Button>
          <Separator orientation="vertical" className="h-8 bg-zinc-100" />
          <Button
            size="sm"
            onClick={() => setShowPublishDialog(true)}
            disabled={saveStatus === 'saving'}
            className="h-9 px-6 bg-indigo-600 text-white hover:bg-indigo-700 font-medium text-sm shadow-sm rounded-md transition-all active:scale-95 group"
          >
            {saveStatus === 'saving' ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Upload size={16} className="mr-2 group-hover:-translate-y-0.5 transition-transform" />}
            Publish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 xl:col-span-2 space-y-4">
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-400 pl-3 mb-2 block">Sections</span>
            {SECTION_NAV.map((nav) => (
              <button
                key={nav.key}
                onClick={() => setActiveSection(nav.key)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left border transition-all group relative overflow-hidden",
                  activeSection === nav.key
                    ? "bg-zinc-900 border-zinc-900 text-white shadow-md"
                    : "bg-white border-zinc-100 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50 shadow-sm"
                )}
              >
                {activeSection === nav.key && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/20" />
                )}
                <span className={cn("transition-all duration-300", activeSection === nav.key ? "text-white scale-110" : "text-zinc-300 group-hover:text-zinc-900")}>
                  {nav.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{nav.shortLabel}</p>
                  <p className={cn("text-[11px] truncate opacity-50 mt-0.5", activeSection === nav.key ? "text-white" : "text-zinc-400")}>{nav.description}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 p-5 bg-zinc-900 rounded-xl shadow-lg relative overflow-hidden group">
            <div className="absolute -bottom-4 -left-4 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
              <Shield size={64} className="text-white" />
            </div>
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <Shield size={14} className="text-white/40" />
              <span className="text-xs font-medium text-white">Version Control</span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed relative z-10">
              All changes are versioned and can be rolled back from the history panel.
            </p>
          </div>
        </div>

        {/* Editor Column */}
        <div className="lg:col-span-5 xl:col-span-6 space-y-8">
          <div className="bg-white rounded-xl border border-zinc-200 p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 scale-[3] opacity-[0.02] pointer-events-none rotate-12">
              {SECTION_NAV.find(n => n.key === activeSection)?.icon}
            </div>

            <div className="flex items-center justify-between mb-8 border-b border-zinc-100 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800 shadow-sm overflow-hidden relative group">
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-white relative z-10">
                    {SECTION_NAV.find(n => n.key === activeSection)?.icon}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-lg font-semibold text-zinc-900 leading-none">
                    {SECTION_NAV.find(n => n.key === activeSection)?.label}
                  </h3>
                  <p className="text-xs text-zinc-400">Section configuration</p>
                </div>
              </div>
            </div>

            <div className="animate-in slide-in-from-bottom-4 duration-500 ease-out">
              {activeSection === 'hero' && <HeroEditor content={content} updateHero={(h) => setContent(prev => prev ? ({ ...prev, sections: { ...prev.sections, hero: { ...prev.sections.hero, ...h } } }) : null)} />}
              {activeSection === 'categories' && <CategoriesEditor content={content} setContent={setContent} />}
              {activeSection === 'featured' && <FeaturedEditor content={content} setContent={setContent} />}
              {activeSection === 'trust' && <TrustEditor content={content} setContent={setContent} />}
              {activeSection === 'cta' && <CtaEditor content={content} setContent={setContent} />}
            </div>
          </div>
        </div>

        {/* Preview Column */}
        <PreviewColumn />
      </div>

      <HistoryDrawer
        open={showHistory}
        onClose={() => setShowHistory(false)}
        onRestore={async (v) => { await restoreCMSVersion(v.id); setShowHistory(false); refreshCMS(); setContent(null); }}
        versions={cmsVersions}
      />

      <PublishDialog
        open={showPublishDialog}
        isSaving={saveStatus === 'saving'}
        onClose={() => setShowPublishDialog(false)}
        onConfirm={async () => {
          setSaveStatus('saving');
          try {
            const res = await saveCMS(content);
            if (res) {
              setSaveStatus('saved');
              setTimeout(() => setSaveStatus('idle'), 3000);
              refreshCMS();
              refreshCMSVersions();
              setShowPublishDialog(false);
            }
            else { setSaveStatus('error'); }
          } catch { setSaveStatus('error'); }
        }}
      />
    </div>
  );
};

export default CMSManager;

