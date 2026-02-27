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
  { key: 'hero', label: 'Hero Section', shortLabel: 'Hero', icon: <Sparkles size={15} />, description: 'Badge, headline, CTAs, stats, image' },
  { key: 'categories', label: 'Categories', shortLabel: 'Categories', icon: <Layers size={15} />, description: 'Category tiles and labels' },
  { key: 'featured', label: 'Featured Products', shortLabel: 'Featured', icon: <Star size={15} />, description: 'Section title, subtitle, CTA' },
  { key: 'trust', label: 'Trust Indicators', shortLabel: 'Trust', icon: <Shield size={15} />, description: 'Feature cards with icons' },
  { key: 'cta', label: 'Final CTA', shortLabel: 'CTA', icon: <Zap size={15} />, description: 'Bottom call-to-action block' },
];

// ─────────────────────────────────────────────────────────────
// FIELD COMPONENTS
// ─────────────────────────────────────────────────────────────

const FieldLabel = ({ children, hint }: { children: React.ReactNode; hint?: string }) => (
  <div className="flex items-center gap-1.5 mb-1.5">
    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{children}</Label>
    {hint && (
      <Tooltip>
        <TooltipTrigger asChild>
          <Info size={12} className="text-slate-400 cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs max-w-48">{hint}</TooltipContent>
      </Tooltip>
    )}
  </div>
);

const FieldGroup = ({ title, icon, children, defaultOpen = true }: {
  title: string; icon?: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="px-4 py-3 cursor-pointer hover:bg-slate-50/60 transition-colors border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <span className="text-slate-400">{icon}</span>
                {title}
              </CardTitle>
              <ChevronDown size={14} className={cn('text-slate-400 transition-transform duration-200', open && 'rotate-180')} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="px-4 py-4 space-y-4">
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
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
        <Icon size={15} className="text-slate-600" />
      </div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs border-slate-200 flex-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-56">
          {AVAILABLE_ICONS.map(icon => {
            const I = (LucideIcons as any)[icon] || LucideIcons.Package;
            return (
              <SelectItem key={icon} value={icon}>
                <div className="flex items-center gap-2">
                  <I size={13} className="text-slate-500" /> {icon}
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
    <div className="w-full h-full bg-white overflow-hidden rounded-lg border border-slate-200 text-[0.5rem] leading-tight select-none pointer-events-none">
      {/* Simulated browser bar */}
      <div className="bg-slate-100 border-b border-slate-200 px-2 py-1 flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <div className="ml-2 flex-1 bg-white rounded text-[0.45rem] text-slate-400 px-1.5 py-0.5 truncate">
          nexushardware.com
        </div>
      </div>

      <ScrollArea className="h-[calc(100%-24px)]">
        <div className="px-3 py-2 space-y-3">

          {/* Hero preview */}
          <div className={cn('rounded-lg p-2 space-y-1 transition-all', activeSection === 'hero' ? 'ring-2 ring-blue-500 bg-blue-50/30' : 'bg-slate-50')}>
            <div className="inline-flex items-center gap-0.5 bg-slate-200 rounded-full px-1.5 py-0.5">
              <div className="w-0.5 h-0.5 rounded-full bg-blue-600" />
              <span className="text-slate-600 text-[0.45rem]">{hero.badge.text}</span>
            </div>
            <div className="text-slate-800 font-bold" style={{ fontSize: '0.6rem' }}>
              {hero.headline.line1}{' '}
              <span className="text-blue-600">{hero.headline.line2}</span>
            </div>
            <p className="text-slate-500 line-clamp-2" style={{ fontSize: '0.45rem' }}>{hero.subheadline}</p>
            <div className="flex gap-1 mt-1">
              <span className="bg-slate-900 text-white rounded px-1.5 py-0.5 text-[0.4rem]">{hero.primaryCTA.text}</span>
              <span className="bg-white border border-slate-300 text-slate-700 rounded px-1.5 py-0.5 text-[0.4rem]">{hero.secondaryCTA.text}</span>
            </div>
          </div>

          {/* Categories preview */}
          <div className={cn('rounded-lg p-2 space-y-1 transition-all', activeSection === 'categories' ? 'ring-2 ring-blue-500 bg-blue-50/30' : 'bg-slate-50')}>
            <p className="font-bold text-slate-700 text-[0.5rem]">{categories.sectionTitle}</p>
            <div className="flex flex-wrap gap-1">
              {categories.categories.slice(0, 4).map(c => (
                <span key={c.id} className="bg-white border border-slate-200 text-slate-600 rounded px-1 py-0.5 text-[0.4rem]">{c.name}</span>
              ))}
              {categories.categories.length > 4 && (
                <span className="text-slate-400 text-[0.4rem] self-center">+{categories.categories.length - 4}</span>
              )}
            </div>
          </div>

          {/* Trust preview */}
          <div className={cn('rounded-lg p-2 space-y-1 transition-all', activeSection === 'trust' ? 'ring-2 ring-blue-500 bg-blue-50/30' : 'bg-slate-50')}>
            <div className="grid grid-cols-2 gap-1">
              {trustIndicators.features.slice(0, 4).map(f => (
                <div key={f.id} className="bg-white border border-slate-200 rounded p-1">
                  <p className="font-semibold text-slate-700" style={{ fontSize: '0.4rem' }}>{f.title}</p>
                  <p className="text-slate-500 line-clamp-1" style={{ fontSize: '0.38rem' }}>{f.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA preview */}
          <div className={cn('rounded-lg p-2 text-center space-y-1 transition-all', activeSection === 'cta' ? 'ring-2 ring-blue-500 bg-blue-50/30' : 'bg-slate-900')}>
            <p className="font-bold text-white text-[0.5rem]">{finalCTA.headline}</p>
            <p className="text-slate-400 text-[0.4rem] line-clamp-1">{finalCTA.subheadline}</p>
            <span className="inline-block bg-blue-600 text-white rounded px-1.5 py-0.5 text-[0.4rem]">{finalCTA.ctaText}</span>
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
    <div className="space-y-4">
      <FieldGroup title="Badge" icon={<Tag size={13} />}>
        <div>
          <FieldLabel hint="Short text shown above the headline">Badge Text</FieldLabel>
          <Input value={hero.badge.text}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateHero({ badge: { ...hero.badge, text: e.target.value } })}
            className="h-8 text-sm border-slate-200" placeholder="e.g. Premium PC Components" />
        </div>
        <div className="flex items-center justify-between py-1">
          <FieldLabel>Show Badge Icon</FieldLabel>
          <Switch checked={hero.badge.icon}
            onCheckedChange={(v: boolean) => updateHero({ badge: { ...hero.badge, icon: v } })} />
        </div>
      </FieldGroup>

      <FieldGroup title="Headline" icon={<Type size={13} />}>
        <div>
          <FieldLabel>Line 1</FieldLabel>
          <Input value={hero.headline.line1}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateHero({ headline: { ...hero.headline, line1: e.target.value } })}
            className="h-8 text-sm border-slate-200" placeholder="e.g. Build Without" />
        </div>
        <div>
          <FieldLabel hint="This line is displayed with gradient styling when enabled">Line 2 (Accent)</FieldLabel>
          <Input value={hero.headline.line2}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateHero({ headline: { ...hero.headline, line2: e.target.value } })}
            className="h-8 text-sm border-slate-200" placeholder="e.g. Compromise" />
        </div>
        <div className="flex items-center justify-between py-1">
          <FieldLabel>Gradient on Line 2</FieldLabel>
          <Switch checked={hero.headline.line2Gradient}
            onCheckedChange={(v: boolean) => updateHero({ headline: { ...hero.headline, line2Gradient: v } })} />
        </div>
        <div>
          <FieldLabel>Subheadline</FieldLabel>
          <Textarea value={hero.subheadline}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateHero({ subheadline: e.target.value })}
            rows={3} className="text-sm border-slate-200 resize-none" placeholder="Supporting description text…" />
        </div>
      </FieldGroup>

      <FieldGroup title="Call to Actions" icon={<LinkIcon size={13} />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <FieldLabel>Primary Button Text</FieldLabel>
            <Input value={hero.primaryCTA.text}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateHero({ primaryCTA: { ...hero.primaryCTA, text: e.target.value } })}
              className="h-8 text-sm border-slate-200" />
          </div>
          <div>
            <FieldLabel>Primary Button Link</FieldLabel>
            <Input value={hero.primaryCTA.link}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateHero({ primaryCTA: { ...hero.primaryCTA, link: e.target.value } })}
              className="h-8 text-sm border-slate-200" placeholder="/catalog" />
          </div>
          <div>
            <FieldLabel>Secondary Button Text</FieldLabel>
            <Input value={hero.secondaryCTA.text}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateHero({ secondaryCTA: { ...hero.secondaryCTA, text: e.target.value } })}
              className="h-8 text-sm border-slate-200" />
          </div>
          <div>
            <FieldLabel>Secondary Button Link</FieldLabel>
            <Input value={hero.secondaryCTA.link}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateHero({ secondaryCTA: { ...hero.secondaryCTA, link: e.target.value } })}
              className="h-8 text-sm border-slate-200" placeholder="/saved-builds" />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup title="Stats Bar" icon={<Hash size={13} />}>
        <div className="space-y-3">
          {hero.stats.map((stat, i) => (
            <div key={i} className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Stat {i + 1} Value</FieldLabel>
                <Input value={stat.value}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const next = [...hero.stats];
                    next[i] = { ...stat, value: e.target.value };
                    updateHero({ stats: next });
                  }}
                  className="h-8 text-sm border-slate-200" placeholder="900+" />
              </div>
              <div>
                <FieldLabel>Label</FieldLabel>
                <Input value={stat.label}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const next = [...hero.stats];
                    next[i] = { ...stat, label: e.target.value };
                    updateHero({ stats: next });
                  }}
                  className="h-8 text-sm border-slate-200" placeholder="Components" />
              </div>
            </div>
          ))}
        </div>
      </FieldGroup>

      <FieldGroup title="Hero Image" icon={<ImageIcon size={13} />}>
        <div>
          <FieldLabel hint="Direct URL to the hero image. Use a PNG/WebP with transparent background for best results">Image URL</FieldLabel>
          <Input value={hero.heroImage.url}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateHero({ heroImage: { ...hero.heroImage, url: e.target.value } })}
            className="h-8 text-sm border-slate-200 font-mono text-xs" placeholder="https://…" />
        </div>
        <div>
          <FieldLabel>Alt Text</FieldLabel>
          <Input value={hero.heroImage.alt}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateHero({ heroImage: { ...hero.heroImage, alt: e.target.value } })}
            className="h-8 text-sm border-slate-200" />
        </div>
        {hero.heroImage.url && (
          <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center p-4 h-36">
            <img src={hero.heroImage.url} alt={hero.heroImage.alt}
              className="max-h-full max-w-full object-contain"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
        )}
      </FieldGroup>

      <FieldGroup title="Floating Badge" icon={<LucideIcons.Award size={13} />} defaultOpen={false}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <FieldLabel>Title</FieldLabel>
            <Input value={hero.floatingBadge.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateHero({ floatingBadge: { ...hero.floatingBadge, title: e.target.value } })}
              className="h-8 text-sm border-slate-200" />
          </div>
          <div>
            <FieldLabel>Subtitle</FieldLabel>
            <Input value={hero.floatingBadge.subtitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateHero({ floatingBadge: { ...hero.floatingBadge, subtitle: e.target.value } })}
              className="h-8 text-sm border-slate-200" />
          </div>
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
      name: 'New Category',
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
    <div className="space-y-4">
      <FieldGroup title="Section Title" icon={<Type size={13} />}>
        <div>
          <FieldLabel>Title</FieldLabel>
          <Input value={cats.sectionTitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContent(prev => {
              if (!prev) return prev;
              return { ...prev, sections: { ...prev.sections, categories: { ...prev.sections.categories, sectionTitle: e.target.value } } };
            })}
            className="h-8 text-sm border-slate-200" />
        </div>
      </FieldGroup>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Layers size={13} className="text-slate-400" /> Category Tiles
              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">{cats.categories.length}</span>
            </CardTitle>
            <Button size="sm" variant="outline" onClick={addCategory} className="h-7 text-xs gap-1 border-slate-200">
              <Plus size={12} /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {cats.categories.length === 0 ? (
            <div className="py-10 text-center">
              <Layers size={24} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">No categories yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {[...cats.categories].sort((a, b) => a.order - b.order).map(cat => (
                <div key={cat.id} className="px-4 py-3 group hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <GripVertical size={14} className="text-slate-300 mt-2 flex-shrink-0 cursor-grab" />
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <FieldLabel>Name</FieldLabel>
                        <Input value={cat.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update(cat.id, { name: e.target.value })}
                          className="h-7 text-xs border-slate-200" />
                      </div>
                      <div>
                        <FieldLabel>Category Key</FieldLabel>
                        <Select value={cat.categoryKey} onValueChange={v => update(cat.id, { categoryKey: v })}>
                          <SelectTrigger className="h-7 text-xs border-slate-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORY_KEYS.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <FieldLabel>Icon</FieldLabel>
                        <IconSelect value={cat.icon} onChange={v => update(cat.id, { icon: v })} />
                      </div>
                      <div>
                        <FieldLabel>Order</FieldLabel>
                        <Input type="number" value={cat.order} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update(cat.id, { order: parseInt(e.target.value) || 1 })}
                          className="h-7 text-xs border-slate-200 w-20" />
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => remove(cat.id)}
                      className="h-7 w-7 text-slate-300 hover:text-red-500 hover:bg-red-50 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
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
    <div className="space-y-4">
      <FieldGroup title="Section Content" icon={<Star size={13} />}>
        <div>
          <FieldLabel>Section Title</FieldLabel>
          <Input value={fp.sectionTitle} onChange={e => update({ sectionTitle: e.target.value })} className="h-8 text-sm border-slate-200" />
        </div>
        <div>
          <FieldLabel hint="Shown below the section title as a subtitle">Section Subtitle</FieldLabel>
          <Input value={fp.sectionSubtitle} onChange={e => update({ sectionSubtitle: e.target.value })} className="h-8 text-sm border-slate-200" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <FieldLabel>CTA Button Text</FieldLabel>
            <Input value={fp.ctaText} onChange={e => update({ ctaText: e.target.value })} className="h-8 text-sm border-slate-200" />
          </div>
          <div>
            <FieldLabel>CTA Button Link</FieldLabel>
            <Input value={fp.ctaLink} onChange={e => update({ ctaLink: e.target.value })} className="h-8 text-sm border-slate-200" placeholder="/catalog" />
          </div>
        </div>
      </FieldGroup>

      <Card className="border-blue-200 bg-blue-50/40 shadow-sm">
        <CardContent className="px-4 py-3 flex items-start gap-3">
          <Info size={15} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>Auto-selected products:</strong> Featured products are dynamically pulled from your catalog — the top 2 GPUs and 2 CPUs by listing order. This section only controls the text content surrounding them.
          </p>
        </CardContent>
      </Card>
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
      icon: 'Star',
      title: 'New Feature',
      description: 'Feature description',
      order: features.length + 1,
    };
    setContent(prev => {
      if (!prev) return prev;
      return { ...prev, sections: { ...prev.sections, trustIndicators: { features: [...prev.sections.trustIndicators.features, newFeature] } } };
    });
  };

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Shield size={13} className="text-slate-400" /> Trust Features
              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">{features.length}</span>
            </CardTitle>
            <Button size="sm" variant="outline" onClick={add} className="h-7 text-xs gap-1 border-slate-200">
              <Plus size={12} /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {features.length === 0 ? (
            <div className="py-10 text-center">
              <Shield size={24} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">No trust features added</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {[...features].sort((a, b) => a.order - b.order).map(f => (
                <div key={f.id} className="px-4 py-4 group hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <GripVertical size={14} className="text-slate-300 mt-2 flex-shrink-0 cursor-grab" />
                    <div className="flex-1 space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <FieldLabel>Icon</FieldLabel>
                          <IconSelect value={f.icon} onChange={v => update(f.id, { icon: v })} />
                        </div>
                        <div>
                          <FieldLabel>Title</FieldLabel>
                          <Input value={f.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update(f.id, { title: e.target.value })}
                            className="h-7 text-xs border-slate-200" />
                        </div>
                        <div>
                          <FieldLabel>Order</FieldLabel>
                          <Input type="number" value={f.order} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update(f.id, { order: parseInt(e.target.value) || 1 })}
                            className="h-7 text-xs border-slate-200 w-20" />
                        </div>
                      </div>
                      <div>
                        <FieldLabel>Description</FieldLabel>
                        <Textarea value={f.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => update(f.id, { description: e.target.value })}
                          rows={2} className="text-xs border-slate-200 resize-none" />
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => remove(f.id)}
                      className="h-7 w-7 text-slate-300 hover:text-red-500 hover:bg-red-50 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
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
    <div className="space-y-4">
      <FieldGroup title="CTA Content" icon={<Zap size={13} />}>
        <div>
          <FieldLabel>Headline</FieldLabel>
          <Input value={cta.headline} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update({ headline: e.target.value })} className="h-8 text-sm border-slate-200" />
        </div>
        <div>
          <FieldLabel>Subheadline</FieldLabel>
          <Textarea value={cta.subheadline} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => update({ subheadline: e.target.value })}
            rows={2} className="text-sm border-slate-200 resize-none" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <FieldLabel>Button Text</FieldLabel>
            <Input value={cta.ctaText} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update({ ctaText: e.target.value })} className="h-8 text-sm border-slate-200" />
          </div>
          <div>
            <FieldLabel>Button Link</FieldLabel>
            <Input value={cta.ctaLink} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update({ ctaLink: e.target.value })} className="h-8 text-sm border-slate-200" placeholder="/catalog" />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup title="Background Style" icon={<Layout size={13} />}>
        <div>
          <FieldLabel hint="Controls the visual appearance of the CTA section background">Style</FieldLabel>
          <Select value={cta.backgroundStyle} onValueChange={v => update({ backgroundStyle: v as any })}>
            <SelectTrigger className="h-8 text-sm border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gradient">Gradient</SelectItem>
              <SelectItem value="solid">Solid Dark</SelectItem>
              <SelectItem value="pattern">Pattern</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Live preview of bg style */}
        <div className={cn('rounded-xl h-16 flex items-center justify-center text-sm font-bold text-white transition-all', {
          'bg-gradient-to-r from-blue-600 to-indigo-700': cta.backgroundStyle === 'gradient',
          'bg-slate-900': cta.backgroundStyle === 'solid',
          'bg-slate-800 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:16px_16px]': cta.backgroundStyle === 'pattern',
        })}>
          {cta.ctaText || 'CTA Preview'}
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
      <DialogContent className="sm:max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock size={16} className="text-slate-600" /> Version History
          </DialogTitle>
          <DialogDescription>
            Restore any previously published version. This will create a new version with that content.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] -mx-6 px-6">
          {published.length === 0 ? (
            <div className="py-8 text-center">
              <Clock size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">No version history yet</p>
            </div>
          ) : (
            <div className="space-y-2 py-2">
              {published.map((ver, idx) => (
                <div key={ver.id} className={cn(
                  'rounded-xl border p-4 transition-colors',
                  idx === 0 ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'
                )}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-800 text-sm">Version {ver.id}</span>
                        {idx === 0 && (
                          <Badge variant="outline" className="text-[10px] text-blue-700 border-blue-300 bg-blue-50 px-1.5 py-0.5">Current</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {new Date(ver.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {ver.label && (
                        <p className="text-xs text-slate-600 mt-1 italic">{ver.label}</p>
                      )}
                    </div>
                    {idx !== 0 && (
                      <Button size="sm" variant="outline" className="h-7 text-xs border-slate-200 gap-1 flex-shrink-0"
                        onClick={() => onRestore(ver)}>
                        <RotateCcw size={11} /> Restore
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </DialogFooter>
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
    <DialogContent className="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Upload size={16} className="text-blue-600" /> Publish Changes
        </DialogTitle>
        <DialogDescription>
          This will make your changes <strong>live on the website immediately</strong> and create a new version in history. This cannot be undone without a rollback.
        </DialogDescription>
      </DialogHeader>
      <div className="py-2">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 flex items-start gap-2">
          <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
          <span>All visitors will see the updated landing page once published.</span>
        </div>
      </div>
      <DialogFooter className="gap-2">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>Cancel</Button>
        <Button size="sm" onClick={onConfirm} disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
          {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
          {isSaving ? 'Publishing…' : 'Publish Now'}
        </Button>
      </DialogFooter>
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
  const [activePage, setActivePage] = useState<LandingPageCMS | null>(null);
  const [isDraft, setIsDraft] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>('hero');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [showHistory, setShowHistory] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showMobileNav, setShowMobileNav] = useState(false);

  // Sync local editor state from ShopContext CMS content
  useEffect(() => {
    if (cmsContent && !content) {
      setContent(cmsContent.content);
      setActivePage(cmsContent);
    }
  }, [cmsContent, content]);

  // ── Update helpers ──

  const updateHero = useCallback((updates: Partial<HeroContent>) => {
    setContent(prev => {
      if (!prev) return prev;
      return { ...prev, sections: { ...prev.sections, hero: { ...prev.sections.hero, ...updates } } };
    });
    setIsDraft(true);
  }, []);

  const handleSaveDraft = async () => {
    if (!content) return;
    setSaveStatus('saving');
    try {
      await saveCMS({ content, isPublished: false });
      setIsDraft(true);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
    }
  };

  const handlePublish = async () => {
    if (!content) return;
    setSaveStatus('saving');
    try {
      await saveCMS({ content, isPublished: true });
      setIsDraft(false);
      setSaveStatus('saved');
      setShowPublishDialog(false);
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
    }
  };

  const handleDiscard = () => {
    if (cmsContent) {
      setContent(cmsContent.content);
      setActivePage(cmsContent);
      setIsDraft(false);
    }
  };

  const handleRestoreVersion = async (version: CMSVersion) => {
    await restoreCMSVersion(version.id);
    await refreshCMS();
    if (cmsContent) {
      setContent(cmsContent.content);
      setActivePage(cmsContent);
    }
    setIsDraft(false);
    setShowHistory(false);
  };

  // ── Save status UI ──
  const saveStatusEl = useMemo(() => {
    if (saveStatus === 'saving') return (
      <span className="flex items-center gap-1.5 text-xs text-slate-500">
        <Loader2 size={12} className="animate-spin" /> Saving…
      </span>
    );
    if (saveStatus === 'saved') return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-600">
        <Check size={12} /> Saved
      </span>
    );
    if (isDraft) return (
      <span className="flex items-center gap-1.5 text-xs text-amber-600">
        <AlertCircle size={12} /> Unsaved changes
      </span>
    );
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-600">
        <CheckCircle2 size={12} /> Published
      </span>
    );
  }, [saveStatus, isDraft]);

  // Guard: if CMS content not loaded yet
  if (!content) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  const activeNavItem = SECTION_NAV.find(n => n.key === activeSection)!;

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full min-h-0 overflow-hidden -m-6">

        {/* ─── TOP HEADER ─── */}
        <div className="flex-shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Left: title + status */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile nav toggle */}
              <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8 flex-shrink-0"
                onClick={() => setShowMobileNav(v => !v)}>
                <Layers size={16} className="text-slate-600" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
                  Landing Page CMS
                </h1>
                <div className="mt-0.5">{saveStatusEl}</div>
              </div>
            </div>

            {/* Right: action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-700"
                    onClick={() => setShowHistory(true)}>
                    <Clock size={15} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Version History</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hidden xl:flex text-slate-500 hover:text-slate-700"
                    onClick={() => setShowPreview(v => !v)}>
                    {showPreview ? <EyeOff size={15} /> : <Eye size={15} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{showPreview ? 'Hide' : 'Show'} preview</TooltipContent>
              </Tooltip>

              {isDraft && (
                <Button variant="ghost" size="sm" onClick={handleDiscard}
                  className="h-8 text-xs text-slate-500 hover:text-slate-700 gap-1.5 hidden sm:flex">
                  <Undo size={12} /> Discard
                </Button>
              )}

              <Button variant="outline" size="sm" onClick={handleSaveDraft}
                disabled={saveStatus === 'saving'}
                className="h-8 text-xs border-slate-200 gap-1.5">
                <Save size={12} />
                <span className="hidden sm:inline">Save Draft</span>
              </Button>

              <Button size="sm" onClick={() => setShowPublishDialog(true)}
                disabled={saveStatus === 'saving'}
                className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                <Upload size={12} />
                <span className="hidden sm:inline">Publish</span>
              </Button>
            </div>
          </div>
        </div>

        {/* ─── MAIN BODY ─── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ─── LEFT SIDEBAR: Section Nav ─── */}
          <div className={cn(
            'flex-col bg-white border-r border-slate-200 flex-shrink-0 w-[220px] xl:w-[240px]',
            'hidden lg:flex',
            // Mobile overlay
            showMobileNav && 'flex fixed inset-y-0 left-0 z-50 shadow-2xl'
          )}>
            {/* Mobile close */}
            {showMobileNav && (
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 lg:hidden">
                <span className="text-sm font-bold text-slate-700">Sections</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowMobileNav(false)}>
                  <X size={14} />
                </Button>
              </div>
            )}

            <div className="px-3 py-3 border-b border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Sections</p>
            </div>

            <ScrollArea className="flex-1">
              <nav className="p-2 space-y-0.5">
                {SECTION_NAV.map(item => (
                  <button key={item.key}
                    onClick={() => { setActiveSection(item.key); setShowMobileNav(false); }}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-start gap-2.5 group',
                      activeSection === item.key
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    )}>
                    <span className={cn('mt-0.5 flex-shrink-0', activeSection === item.key ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-500')}>
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <p className={cn('text-sm font-semibold leading-tight', activeSection === item.key && 'text-blue-700')}>{item.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-tight line-clamp-1">{item.description}</p>
                    </div>
                    {activeSection === item.key && (
                      <ChevronRight size={12} className="text-blue-600 flex-shrink-0 mt-1 ml-auto" />
                    )}
                  </button>
                ))}
              </nav>
            </ScrollArea>

            {/* Footer: last saved */}
            <div className="px-4 py-3 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Last updated{' '}
                {activePage?.updatedAt ? new Date(activePage.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}
              </p>
            </div>
          </div>

          {/* Mobile nav backdrop */}
          {showMobileNav && (
            <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setShowMobileNav(false)} />
          )}

          {/* ─── CENTRE: Editor ─── */}
          <div className="flex-1 min-w-0 overflow-y-auto bg-slate-50">
            <div className="p-4 sm:p-6 max-w-2xl">
              {/* Mobile section indicator */}
              <div className="flex items-center gap-2 mb-4 lg:hidden">
                <span className="text-slate-400">{activeNavItem.icon}</span>
                <div>
                  <h2 className="text-base font-bold text-slate-800">{activeNavItem.label}</h2>
                  <p className="text-xs text-slate-400">{activeNavItem.description}</p>
                </div>
              </div>

              {/* Desktop section heading */}
              <div className="hidden lg:flex items-center gap-2 mb-5">
                <span className="text-slate-500">{activeNavItem.icon}</span>
                <div>
                  <h2 className="text-base font-bold text-slate-800">{activeNavItem.label}</h2>
                  <p className="text-xs text-slate-400">{activeNavItem.description}</p>
                </div>
              </div>

              {/* Section editors */}
              {activeSection === 'hero' && (
                <HeroEditor content={content} updateHero={updateHero} />
              )}
              {activeSection === 'categories' && (
                <CategoriesEditor content={content} setContent={setContent} />
              )}
              {activeSection === 'featured' && (
                <FeaturedEditor content={content} setContent={setContent} />
              )}
              {activeSection === 'trust' && (
                <TrustEditor content={content} setContent={setContent} />
              )}
              {activeSection === 'cta' && (
                <CtaEditor content={content} setContent={setContent} />
              )}

              {/* Bottom action bar on mobile */}
              <div className="sticky bottom-0 bg-white border-t border-slate-200 px-4 py-3 -mx-4 sm:-mx-6 mt-8 flex items-center justify-between gap-3 lg:hidden">
                <div>{saveStatusEl}</div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleSaveDraft}
                    disabled={saveStatus === 'saving'} className="h-8 text-xs border-slate-200 gap-1.5">
                    <Save size={12} /> Save
                  </Button>
                  <Button size="sm" onClick={() => setShowPublishDialog(true)}
                    className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                    <Upload size={12} /> Publish
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* ─── RIGHT: Live Preview ─── */}
          {showPreview && (
            <div className="hidden xl:flex flex-col flex-shrink-0 w-[280px] 2xl:w-[320px] bg-slate-100 border-l border-slate-200">
              <div className="px-4 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Monitor size={13} /> Live Preview
                </span>
                <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-200 bg-emerald-50 px-1.5 py-0.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block mr-1 animate-pulse" />
                  Live
                </Badge>
              </div>
              <div className="flex-1 p-3 overflow-hidden">
                <MiniPreview content={content} activeSection={activeSection} />
              </div>
              <div className="px-3 py-2 border-t border-slate-200 bg-white">
                <p className="text-[10px] text-slate-400 text-center">
                  Highlighted sections reflect active editor
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── DIALOGS ─── */}
      <HistoryDrawer
        open={showHistory}
        onClose={() => setShowHistory(false)}
        onRestore={handleRestoreVersion}
        versions={cmsVersions}
      />
      <PublishDialog
        open={showPublishDialog}
        onClose={() => setShowPublishDialog(false)}
        onConfirm={handlePublish}
        isSaving={saveStatus === 'saving'}
      />
    </TooltipProvider>
  );
};

export default CMSManager;