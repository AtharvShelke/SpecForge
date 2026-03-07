'use client';

import React, { useState, useEffect } from 'react';
import {
    PlusCircle,
    BarChart3,
    Users,
    Mail,
    Activity,
    Loader2,
    RefreshCw,
    Zap,
    Clock,
    CheckCircle2,
    AlertTriangle,
    ChevronRight,
    Hash,
    TrendingUp,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────
// DESIGN-SYSTEM PRIMITIVES  (mirrors Overview / OrderManager)
// ─────────────────────────────────────────────────────────────

const SectionLabel = ({
    icon,
    children,
}: {
    icon: React.ReactNode;
    children: React.ReactNode;
}) => (
    <div className="flex items-center gap-1.5">
        <span className="text-stone-400">{icon}</span>
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em]">
            {children}
        </span>
    </div>
);

type Stripe = 'indigo' | 'teal' | 'amber' | 'rose' | 'violet' | 'stone' | 'emerald';

const Panel = ({
    children,
    className,
    stripe,
}: {
    children: React.ReactNode;
    className?: string;
    stripe?: Stripe;
}) => {
    const stripes: Record<Stripe, string> = {
        indigo:   'from-indigo-400 via-indigo-500 to-violet-400',
        teal:     'from-teal-400 via-emerald-400 to-emerald-300',
        amber:    'from-amber-400 via-amber-400 to-orange-300',
        rose:     'from-rose-400 via-rose-400 to-rose-300',
        violet:   'from-violet-400 via-violet-500 to-indigo-400',
        stone:    'from-stone-300 via-stone-400 to-stone-300',
        emerald:  'from-emerald-400 via-emerald-400 to-teal-300',
    };
    return (
        <div className={cn('rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden', className)}>
            {stripe && (
                <div className={cn('h-0.5 w-full bg-gradient-to-r', stripes[stripe])} />
            )}
            {children}
        </div>
    );
};

const PanelHeader = ({
    icon,
    children,
    right,
}: {
    icon: React.ReactNode;
    children: React.ReactNode;
    right?: React.ReactNode;
}) => (
    <div className="px-5 py-3.5 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
        <SectionLabel icon={icon}>{children}</SectionLabel>
        {right}
    </div>
);

// KPI card — exact border-l-4 accent pattern from Overview
const KpiCard = ({
    label,
    value,
    sub,
    icon,
    accent,
    subColor = 'text-stone-400',
}: {
    label: string;
    value: React.ReactNode;
    sub: string;
    icon: React.ReactNode;
    accent: string;
    subColor?: string;
}) => (
    <div className={cn('rounded-xl bg-white border border-stone-200 border-l-4 shadow-sm p-4', accent)}>
        <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{label}</span>
            <span className="p-1 rounded-md text-stone-400 bg-stone-50">{icon}</span>
        </div>
        <p className="text-2xl font-extrabold text-stone-900 tabular-nums tracking-tight font-mono">{value}</p>
        <p className={cn('text-[11px] mt-0.5 font-medium', subColor)}>{sub}</p>
    </div>
);

// Status pill — mirrors StatusPill from OrderManager / Overview
const StatusPill = ({ active }: { active: boolean }) => (
    <span className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ring-1',
        active
            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
            : 'bg-stone-100 text-stone-500 ring-stone-200'
    )}>
        <span className={cn('w-1 h-1 rounded-full bg-current', active && 'animate-pulse')} />
        {active ? 'Active' : 'Paused'}
    </span>
);

// Trigger pill
const TriggerPill = ({ trigger }: { trigger: string }) => {
    const map: Record<string, string> = {
        CART_ABANDONED:    'bg-amber-50 text-amber-700 ring-amber-200',
        NEWSLETTER_SIGNUP: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    };
    const cls = map[trigger] ?? 'bg-stone-100 text-stone-600 ring-stone-200';
    const label = trigger.replace(/_/g, ' ');
    return (
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ring-1 whitespace-nowrap', cls)}>
            {label}
        </span>
    );
};

// Funnel metric mini-cell (used inside campaign rows)
const MetaChip = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex flex-col items-end">
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{label}</span>
        <span className="text-sm font-extrabold text-stone-900 font-mono tabular-nums leading-tight">{value}</span>
    </div>
);

// Inline form field label
const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em] block mb-1">
        {children}
    </span>
);

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export const MarketingManager = () => {
    const { toast } = useToast();
    const [stats, setStats]         = useState<any>(null);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: '',
        triggerType: '',
        delayHours: '0',
        subject: '',
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [statsRes, campsRes] = await Promise.all([
                fetch('/api/marketing/stats'),
                fetch('/api/marketing/campaigns'),
            ]);
            setStats(await statsRes.json());
            setCampaigns(await campsRes.json());
        } catch (e) {
            console.error('Failed to fetch marketing data', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleCreateCampaign = async () => {
        try {
            const res = await fetch('/api/marketing/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    triggerType: form.triggerType,
                    isActive: true,
                    rulesConfig: {
                        delayHours: parseInt(form.delayHours),
                        subject: form.subject,
                    },
                }),
            });
            if (res.ok) {
                toast({ title: 'Campaign created', description: 'Your new campaign is now active.' });
                setIsCreateOpen(false);
                setForm({ name: '', triggerType: '', delayHours: '0', subject: '' });
                fetchData();
            } else {
                toast({ title: 'Error', description: 'Failed to create campaign', variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Error', description: 'Error creating campaign', variant: 'destructive' });
        }
    };

    const activeCampaigns = campaigns.filter(c => c.isActive).length;
    const convRate = stats?.conversionRate ?? '0.0';
    const convColor =
        parseFloat(convRate) >= 10 ? 'text-emerald-600'
        : parseFloat(convRate) >= 5  ? 'text-amber-600'
        : 'text-stone-400';

    // ── Full-page loading skeleton ──
    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-stone-300" />
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Loading…</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ fontFamily: "'DM Sans', 'Geist', 'system-ui', sans-serif" }}
        >
            {/* ── PAGE HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
                <div className="flex items-center gap-2.5">
                    <div className="w-1 h-5 rounded-full bg-rose-500" />
                    <div>
                        <h1 className="text-base font-bold text-stone-900 tracking-tight">Marketing Funnels</h1>
                        <p className="text-xs text-stone-400 mt-0.5">
                            Automated event-driven sequences to convert leads into customers
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Refresh */}
                    <button
                        type="button"
                        onClick={fetchData}
                        className="h-7 w-7 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-all shadow-sm"
                        title="Refresh"
                    >
                        <RefreshCw size={12} />
                    </button>
                    {/* Live badge — mirrors OrderManager */}
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live
                    </div>
                    {/* New Campaign CTA */}
                    <button
                        type="button"
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center gap-1.5 h-7 px-3 text-[10px] font-bold uppercase tracking-widest bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
                    >
                        <PlusCircle size={11} /> New Campaign
                    </button>
                </div>
            </div>

            {/* ── KPI ROW ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiCard
                    label="Total Leads"
                    value={stats?.totalLeads ?? 0}
                    sub="In database"
                    icon={<Users size={14} />}
                    accent="border-l-rose-400"
                />
                <KpiCard
                    label="Active Campaigns"
                    value={activeCampaigns}
                    sub={`Out of ${stats?.totalCampaigns ?? 0} total`}
                    icon={<Activity size={14} />}
                    accent={activeCampaigns > 0 ? 'border-l-emerald-400' : 'border-l-stone-300'}
                    subColor={activeCampaigns > 0 ? 'text-emerald-600' : 'text-stone-400'}
                />
                <KpiCard
                    label="Emails Sent"
                    value={(stats?.emailsSent ?? 0).toLocaleString()}
                    sub={`${campaigns.reduce((s: number, c: any) => s + (c._count?.emailLogs ?? 0), 0)} logged actions`}
                    icon={<Mail size={14} />}
                    accent="border-l-indigo-400"
                />
                <KpiCard
                    label="Conversion Rate"
                    value={`${convRate}%`}
                    sub="Leads → customers"
                    icon={<BarChart3 size={14} />}
                    accent={
                        parseFloat(convRate) >= 10 ? 'border-l-emerald-400'
                        : parseFloat(convRate) >= 5  ? 'border-l-amber-400'
                        : 'border-l-stone-300'
                    }
                    subColor={convColor}
                />
            </div>

            {/* ── MAIN CONTENT ROW ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

                {/* ── CAMPAIGN LIST  (xl: 2 cols) ── */}
                <Panel stripe="rose" className="xl:col-span-2">
                    <PanelHeader
                        icon={<Zap size={12} />}
                        right={
                            <span className="text-[10px] font-bold font-mono text-stone-400 bg-white border border-stone-200 px-2 py-0.5 rounded-md">
                                {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}
                            </span>
                        }
                    >
                        Campaign Overview
                    </PanelHeader>

                    {campaigns.length === 0 ? (
                        <div className="py-20 flex flex-col items-center gap-3">
                            <Zap size={24} className="text-stone-200" />
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                No campaigns yet
                            </p>
                            <button
                                type="button"
                                onClick={() => setIsCreateOpen(true)}
                                className="text-[10px] font-bold text-rose-600 uppercase tracking-widest hover:underline"
                            >
                                Build your first funnel →
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-stone-100">
                            {campaigns.map(camp => {
                                const isExpanded = expandedId === camp.id;
                                const sends = camp._count?.emailLogs ?? 0;

                                return (
                                    <div key={camp.id} className="group">
                                        {/* ── Campaign row ── */}
                                        <div
                                            className="flex items-center gap-4 px-5 py-3.5 hover:bg-stone-50/70 transition-colors duration-150 cursor-pointer"
                                            onClick={() => setExpandedId(isExpanded ? null : camp.id)}
                                        >
                                            {/* Expand chevron */}
                                            <ChevronRight
                                                size={13}
                                                className={cn(
                                                    'text-stone-300 shrink-0 transition-transform duration-200',
                                                    isExpanded && 'rotate-90'
                                                )}
                                            />

                                            {/* Icon */}
                                            <div className={cn(
                                                'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
                                                camp.isActive ? 'bg-rose-50 text-rose-500' : 'bg-stone-100 text-stone-400'
                                            )}>
                                                <Zap size={14} />
                                            </div>

                                            {/* Name + trigger */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                                    <p className="text-xs font-bold text-stone-800 tracking-tight truncate">
                                                        {camp.name}
                                                    </p>
                                                    <StatusPill active={camp.isActive} />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <TriggerPill trigger={camp.triggerType} />
                                                    <span className="flex items-center gap-1 text-[10px] text-stone-400">
                                                        <Clock size={9} />
                                                        {camp.rulesConfig?.delayHours ?? 0}h delay
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Sends count */}
                                            <MetaChip label="Sends" value={sends.toLocaleString()} />
                                        </div>

                                        {/* ── Expanded detail ── */}
                                        {isExpanded && (
                                            <div className="px-5 pb-4 ml-[72px] pt-1 border-t border-stone-100 animate-in fade-in slide-in-from-top-1 duration-200">
                                                <div className="space-y-3">

                                                    {/* Stat mini-grid */}
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {[
                                                            { label: 'Emails Sent', value: sends.toLocaleString(), color: 'text-stone-800' },
                                                            { label: 'Delay', value: `${camp.rulesConfig?.delayHours ?? 0}h`, color: 'text-stone-800' },
                                                            { label: 'Status', value: camp.isActive ? 'Active' : 'Paused', color: camp.isActive ? 'text-emerald-600' : 'text-stone-500' },
                                                        ].map(({ label, value, color }) => (
                                                            <div key={label} className="px-3 py-2.5 bg-stone-50 border border-stone-100 rounded-lg">
                                                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{label}</p>
                                                                <p className={cn('text-sm font-extrabold tabular-nums font-mono mt-0.5', color)}>{value}</p>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Subject line */}
                                                    {camp.rulesConfig?.subject && (
                                                        <div className="flex items-start gap-2 px-3 py-2.5 bg-stone-50 border border-stone-100 rounded-lg">
                                                            <Mail size={12} className="text-stone-400 mt-0.5 shrink-0" />
                                                            <div>
                                                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">Email Subject</p>
                                                                <p className="text-xs font-semibold text-stone-700">{camp.rulesConfig.subject}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Campaign ID */}
                                                    <div className="flex items-center gap-1.5">
                                                        <Hash size={10} className="text-stone-300" />
                                                        <span className="text-[10px] font-mono font-bold text-stone-400">
                                                            {String(camp.id).substring(0, 16).toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Panel>

                {/* ── RIGHT COLUMN ── */}
                <div className="flex flex-col gap-4">

                    {/* Funnel Health */}
                    <Panel stripe="emerald">
                        <PanelHeader icon={<TrendingUp size={12} />}>Funnel Health</PanelHeader>
                        <div className="px-4 py-3 space-y-2.5">
                            {/* Conversion rate bar */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Conversion Rate</span>
                                    <span className={cn('text-sm font-extrabold font-mono tabular-nums', convColor)}>
                                        {convRate}%
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            'h-full rounded-full transition-all',
                                            parseFloat(convRate) >= 10 ? 'bg-emerald-400'
                                            : parseFloat(convRate) >= 5  ? 'bg-amber-400'
                                            : 'bg-stone-300'
                                        )}
                                        style={{ width: `${Math.min(100, parseFloat(convRate) * 5)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Quick stat 2-up */}
                            <div className="grid grid-cols-2 gap-2 pt-1">
                                {[
                                    { label: 'Total Leads',  value: stats?.totalLeads ?? 0,      color: 'text-stone-800' },
                                    { label: 'Emails Sent', value: stats?.emailsSent ?? 0,       color: 'text-stone-800' },
                                    { label: 'Active',      value: activeCampaigns,               color: activeCampaigns > 0 ? 'text-emerald-600' : 'text-stone-800' },
                                    { label: 'Paused',      value: campaigns.length - activeCampaigns, color: 'text-stone-800' },
                                ].map(({ label, value, color }) => (
                                    <div key={label} className="px-2 py-2 bg-stone-50 border border-stone-100 rounded-lg text-center">
                                        <p className={cn('text-base font-extrabold tabular-nums font-mono', color)}>{value}</p>
                                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">{label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Alert if no active campaigns */}
                            {activeCampaigns === 0 && campaigns.length > 0 && (
                                <div className="flex items-center gap-2 px-2 py-1.5 bg-amber-50 border border-amber-100 rounded-lg">
                                    <AlertTriangle size={12} className="text-amber-500 shrink-0" />
                                    <p className="text-[11px] font-semibold text-amber-700">All campaigns paused</p>
                                </div>
                            )}
                            {activeCampaigns > 0 && (
                                <div className="flex items-center gap-2 px-2 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg">
                                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                                    <p className="text-[11px] font-semibold text-emerald-700">
                                        {activeCampaigns} campaign{activeCampaigns !== 1 ? 's' : ''} running
                                    </p>
                                </div>
                            )}
                        </div>
                    </Panel>

                    {/* Trigger Breakdown */}
                    <Panel stripe="amber">
                        <PanelHeader icon={<Activity size={12} />}>Trigger Breakdown</PanelHeader>
                        <div className="px-4 py-3 space-y-2">
                            {campaigns.length === 0 ? (
                                <p className="py-6 text-center text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                    No data yet
                                </p>
                            ) : (() => {
                                const counts: Record<string, number> = {};
                                campaigns.forEach(c => {
                                    counts[c.triggerType] = (counts[c.triggerType] ?? 0) + 1;
                                });
                                const max = Math.max(...Object.values(counts));
                                return Object.entries(counts).map(([trigger, count]) => {
                                    const pct = max > 0 ? Math.round((count / max) * 100) : 0;
                                    return (
                                        <div key={trigger}>
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <span className="text-[10px] font-bold text-stone-600 uppercase tracking-widest truncate">
                                                    {trigger.replace(/_/g, ' ')}
                                                </span>
                                                <span className="text-xs font-bold text-stone-600 font-mono tabular-nums shrink-0">
                                                    {count}
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-amber-400 transition-all"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </Panel>
                </div>
            </div>

            {/* ══════════════════════════════════════ */}
            {/*  CREATE CAMPAIGN MODAL                 */}
            {/* ══════════════════════════════════════ */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-md bg-white border-stone-200 rounded-2xl shadow-xl">
                    {/* Gradient stripe header — same pattern as CategoryManager / SavedBuildsManager */}
                    <div className="h-0.5 w-full bg-gradient-to-r from-rose-400 via-rose-500 to-orange-400 -mt-6 mb-5 rounded-t-2xl" />

                    <DialogHeader className="pb-2">
                        <DialogTitle className="text-sm font-bold text-stone-800 tracking-tight">
                            New Campaign
                        </DialogTitle>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                            Configure your event-driven email sequence.
                        </p>
                    </DialogHeader>

                    <div className="space-y-3 py-1">
                        {/* Campaign name */}
                        <div>
                            <FieldLabel>Campaign Name</FieldLabel>
                            <Input
                                placeholder="e.g. Abandoned Cart Recovery"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className="h-8 text-xs border-stone-200 bg-stone-50 rounded-lg focus:bg-white focus:border-rose-300 focus:ring-rose-500/20 placeholder:text-stone-400 font-medium"
                            />
                        </div>

                        {/* Trigger */}
                        <div>
                            <FieldLabel>Trigger Event</FieldLabel>
                            <Select value={form.triggerType} onValueChange={v => setForm({ ...form, triggerType: v })}>
                                <SelectTrigger className="h-8 text-xs border-stone-200 bg-stone-50 rounded-lg">
                                    <SelectValue placeholder="Select a trigger…" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CART_ABANDONED" className="text-xs">Cart Abandoned</SelectItem>
                                    <SelectItem value="NEWSLETTER_SIGNUP" className="text-xs">Newsletter Signup</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Delay + Subject in a 2-col grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <FieldLabel>Delay (Hours)</FieldLabel>
                                <Input
                                    type="number"
                                    min="0"
                                    value={form.delayHours}
                                    onChange={e => setForm({ ...form, delayHours: e.target.value })}
                                    className="h-8 text-xs font-mono border-stone-200 bg-stone-50 rounded-lg focus:bg-white focus:border-rose-300 focus:ring-rose-500/20 placeholder:text-stone-400"
                                />
                            </div>
                            <div>
                                <FieldLabel>Subject Line</FieldLabel>
                                <Input
                                    placeholder="You left something…"
                                    value={form.subject}
                                    onChange={e => setForm({ ...form, subject: e.target.value })}
                                    className="h-8 text-xs border-stone-200 bg-stone-50 rounded-lg focus:bg-white focus:border-rose-300 focus:ring-rose-500/20 placeholder:text-stone-400 font-medium"
                                />
                            </div>
                        </div>

                        {/* Preview pill */}
                        {form.triggerType && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-100 rounded-lg">
                                <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                                <p className="text-[11px] text-stone-500">
                                    Will fire{' '}
                                    <span className="font-bold text-stone-700">
                                        {parseInt(form.delayHours) === 0 ? 'immediately' : `after ${form.delayHours}h`}
                                    </span>
                                    {' '}on{' '}
                                    <TriggerPill trigger={form.triggerType} />
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2 pt-3">
                        <button
                            type="button"
                            onClick={() => setIsCreateOpen(false)}
                            className="h-8 px-4 text-[10px] font-bold uppercase tracking-widest border border-stone-200 text-stone-500 rounded-lg hover:bg-stone-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleCreateCampaign}
                            disabled={!form.name || !form.triggerType}
                            className={cn(
                                'h-8 px-4 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors shadow-sm flex items-center gap-1.5',
                                form.name && form.triggerType
                                    ? 'bg-rose-600 text-white hover:bg-rose-700'
                                    : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                            )}
                        >
                            <Zap size={11} /> Create & Activate
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};