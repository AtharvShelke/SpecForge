'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useAdmin } from '@/context/AdminContext';
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
    Search,
    Trash2,
    ToggleLeft,
    ToggleRight,
    UserPlus,
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
// DESIGN-SYSTEM PRIMITIVES — memoized
// ─────────────────────────────────────────────────────────────

const SectionLabel = memo(({
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
));
SectionLabel.displayName = 'SectionLabel';

type Stripe = 'indigo' | 'teal' | 'amber' | 'rose' | 'violet' | 'stone' | 'emerald';

// Hoisted outside component — never recreated on render
const STRIPE_CLASSES: Record<Stripe, string> = {
    indigo: 'from-indigo-400 via-indigo-500 to-violet-400',
    teal: 'from-teal-400 via-emerald-400 to-emerald-300',
    amber: 'from-amber-400 via-amber-400 to-orange-300',
    rose: 'from-rose-400 via-rose-400 to-rose-300',
    violet: 'from-violet-400 via-violet-500 to-indigo-400',
    stone: 'from-stone-300 via-stone-400 to-stone-300',
    emerald: 'from-emerald-400 via-emerald-400 to-teal-300',
};

const Panel = memo(({
    children,
    className,
    stripe,
}: {
    children: React.ReactNode;
    className?: string;
    stripe?: Stripe;
}) => (
    <div className={cn('rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden', className)}>
        {stripe && (
            <div className={cn('h-0.5 w-full bg-gradient-to-r', STRIPE_CLASSES[stripe])} />
        )}
        {children}
    </div>
));
Panel.displayName = 'Panel';

const PanelHeader = memo(({
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
));
PanelHeader.displayName = 'PanelHeader';

const KpiCard = memo(({
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
));
KpiCard.displayName = 'KpiCard';

const StatusPill = memo(({ active }: { active: boolean }) => (
    <span className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ring-1',
        active
            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
            : 'bg-stone-100 text-stone-500 ring-stone-200'
    )}>
        <span className={cn('w-1 h-1 rounded-full bg-current', active && 'animate-pulse')} />
        {active ? 'Active' : 'Paused'}
    </span>
));
StatusPill.displayName = 'StatusPill';

// Precompute trigger pill class map outside component
const TRIGGER_PILL_MAP: Record<string, string> = {
    CART_ABANDONED: 'bg-amber-50 text-amber-700 ring-amber-200',
    NEWSLETTER_SIGNUP: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
};

const TriggerPill = memo(({ trigger }: { trigger: string }) => {
    const cls = TRIGGER_PILL_MAP[trigger] ?? 'bg-stone-100 text-stone-600 ring-stone-200';
    const label = trigger.replace(/_/g, ' ');
    return (
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ring-1 whitespace-nowrap', cls)}>
            {label}
        </span>
    );
});
TriggerPill.displayName = 'TriggerPill';

const MetaChip = memo(({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex flex-col items-end">
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{label}</span>
        <span className="text-sm font-extrabold text-stone-900 font-mono tabular-nums leading-tight">{value}</span>
    </div>
));
MetaChip.displayName = 'MetaChip';

const FieldLabel = memo(({ children }: { children: React.ReactNode }) => (
    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.12em] block mb-1">
        {children}
    </span>
));
FieldLabel.displayName = 'FieldLabel';

// ─────────────────────────────────────────────────────────────
// CAMPAIGN ROW — memoized to prevent full list re-renders
// ─────────────────────────────────────────────────────────────
const CampaignRow = memo(({
    camp,
    isExpanded,
    isDeleting,
    onToggleExpand,
    onToggle,
    onDelete,
}: {
    camp: any;
    isExpanded: boolean;
    isDeleting: boolean;
    onToggleExpand: (id: string) => void;
    onToggle: (id: string, isActive: boolean) => void;
    onDelete: (id: string) => void;
}) => {
    const sends = camp._count?.emailLogs ?? 0;
    const sendsFormatted = sends.toLocaleString();
    const shortId = String(camp.id).substring(0, 16).toUpperCase();

    const handleExpandClick = useCallback(() => onToggleExpand(camp.id), [onToggleExpand, camp.id]);
    const handleToggle = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onToggle(camp.id, camp.isActive);
    }, [onToggle, camp.id, camp.isActive]);
    const handleDelete = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(camp.id);
    }, [onDelete, camp.id]);

    return (
        <div className="group">
            <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-stone-50/70 transition-colors duration-150 cursor-pointer">
                <ChevronRight
                    size={13}
                    onClick={handleExpandClick}
                    className={cn(
                        'text-stone-300 shrink-0 transition-transform duration-200',
                        isExpanded && 'rotate-90'
                    )}
                />
                <div className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
                    camp.isActive ? 'bg-rose-50 text-rose-500' : 'bg-stone-100 text-stone-400'
                )}>
                    <Zap size={14} />
                </div>
                <div className="flex-1 min-w-0" onClick={handleExpandClick}>
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-xs font-bold text-stone-800 tracking-tight truncate">{camp.name}</p>
                        <StatusPill active={camp.isActive} />
                    </div>
                    <div className="flex items-center gap-2">
                        <TriggerPill trigger={camp.triggerType} />
                        <span className="flex items-center gap-1 text-[10px] text-stone-400">
                            <Clock size={9} /> {camp.rulesConfig?.delayHours ?? 0}h delay
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <MetaChip label="Sends" value={sendsFormatted} />
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={handleToggle}
                            className="p-1.5 rounded-md hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
                            title={camp.isActive ? "Pause" : "Resume"}
                        >
                            {camp.isActive ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} />}
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="p-1.5 rounded-md hover:bg-rose-50 text-stone-400 hover:text-rose-500 transition-colors"
                            title="Delete"
                        >
                            {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="px-5 pb-4 ml-[72px] pt-1 border-stone-100 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { label: 'Emails Sent', value: sendsFormatted, color: 'text-stone-800' },
                                { label: 'Delay', value: `${camp.rulesConfig?.delayHours ?? 0}h`, color: 'text-stone-800' },
                                { label: 'Status', value: camp.isActive ? 'Active' : 'Paused', color: camp.isActive ? 'text-emerald-600' : 'text-stone-500' },
                            ].map(({ label, value, color }) => (
                                <div key={label} className="px-3 py-2.5 bg-stone-50 border border-stone-100 rounded-lg">
                                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{label}</p>
                                    <p className={cn('text-sm font-extrabold tabular-nums font-mono mt-0.5', color)}>{value}</p>
                                </div>
                            ))}
                        </div>
                        {camp.rulesConfig?.subject && (
                            <div className="flex items-start gap-2 px-3 py-2.5 bg-stone-50 border border-stone-100 rounded-lg">
                                <Mail size={12} className="text-stone-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">Email Subject</p>
                                    <p className="text-xs font-semibold text-stone-700">{camp.rulesConfig.subject}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5">
                            <Hash size={10} className="text-stone-300" />
                            <span className="text-[10px] font-mono font-bold text-stone-400">{shortId}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});
CampaignRow.displayName = 'CampaignRow';

// ─────────────────────────────────────────────────────────────
// ACTIVITY LOG ROW — memoized
// ─────────────────────────────────────────────────────────────
const LogRow = memo(({ log }: { log: any }) => {
    const displayName = log.lead.name || log.lead.email.split('@')[0];
    const timeStr = new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const campaignName = log.campaign?.name || 'Campaign Deleted';

    return (
        <div className="px-4 py-3 hover:bg-stone-50/50 transition-colors">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="text-[11px] font-bold text-stone-800 leading-tight">
                        Sent to {displayName}
                    </p>
                    <p className="text-[10px] font-medium text-stone-400 truncate w-40">
                        {log.subject}
                    </p>
                </div>
                <div className="text-right shrink-0">
                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter bg-emerald-50 px-1 rounded">SENT</span>
                    <p className="text-[9px] text-stone-400 font-mono mt-1">{timeStr}</p>
                </div>
            </div>
            <div className="mt-1.5 flex items-center gap-1">
                <Zap size={9} className="text-rose-400" />
                <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">
                    {campaignName}
                </span>
            </div>
        </div>
    );
});
LogRow.displayName = 'LogRow';

// ─────────────────────────────────────────────────────────────
// LEAD ROW — memoized
// ─────────────────────────────────────────────────────────────
const LeadRow = memo(({ lead }: { lead: any }) => (
    <tr className="hover:bg-stone-50/50">
        <td className="px-5 py-3">
            <p className="text-xs font-bold text-stone-800 tracking-tight">{lead.name || 'Anonymous'}</p>
            <p className="text-[10px] text-stone-400 font-mono">{lead.email}</p>
        </td>
        <td className="px-5 py-3">
            <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-md uppercase">{lead.source || 'Direct'}</span>
        </td>
        <td className="px-5 py-3">
            {lead.customerId ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase">
                    <CheckCircle2 size={10} /> Converted
                </span>
            ) : (
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tight">Active Lead</span>
            )}
        </td>
        <td className="px-5 py-3 text-right">
            <div className="flex flex-col items-end">
                <p className="text-xs font-extrabold text-stone-700 font-mono tracking-tighter">{lead._count.events} events</p>
                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{lead._count.logs} emails</p>
            </div>
        </td>
    </tr>
));
LeadRow.displayName = 'LeadRow';

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

const MarketingManager = () => {
    const { toast } = useToast();
    const {
        marketingStats: stats,
        marketingCampaigns: campaigns,
        marketingLeads: leadsData,
        marketingContacts: allContacts,
        marketingLogs: logs,
        refreshMarketing,
        syncData,
        isLoading
    } = useAdmin();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [activeView, setActiveView] = useState<'campaigns' | 'leads' | 'contacts'>('campaigns');
    const [searchQuery, setSearchQuery] = useState('');
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: '',
        triggerType: '',
        delayHours: '0',
        subject: '',
    });

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            refreshMarketing(searchQuery, activeView);
        }, 300);
        return () => clearTimeout(delaySearch);
    }, [searchQuery, activeView, refreshMarketing]);

    const handleCreateCampaign = useCallback(async () => {
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
                refreshMarketing();
            } else {
                toast({ title: 'Error', description: 'Failed to create campaign', variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Error', description: 'Error creating campaign', variant: 'destructive' });
        }
    }, [form, toast, refreshMarketing]);

    const toggleCampaign = useCallback(async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/marketing/campaigns/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentStatus }),
            });
            if (res.ok) {
                toast({ title: currentStatus ? 'Campaign paused' : 'Campaign activated' });
                refreshMarketing();
            }
        } catch (e) { console.error(e); }
    }, [toast, refreshMarketing]);

    const deleteCampaign = useCallback(async (id: string) => {
        if (!confirm('Are you sure you want to delete this campaign?')) return;
        setIsDeleting(id);
        try {
            const res = await fetch(`/api/marketing/campaigns/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast({ title: 'Campaign deleted' });
                refreshMarketing();
            }
        } catch (e) { console.error(e); }
        finally { setIsDeleting(null); }
    }, [toast, refreshMarketing]);

    const handleToggleExpand = useCallback((id: string) => {
        setExpandedId(prev => prev === id ? null : id);
    }, []);

    // Stable view switchers
    const setViewCampaigns = useCallback(() => setActiveView('campaigns'), []);
    const setViewLeads = useCallback(() => setActiveView('leads'), []);
    const setViewContacts = useCallback(() => setActiveView('contacts'), []);

    const handleSyncData = useCallback(() => syncData(), [syncData]);
    const handleOpenCreate = useCallback(() => setIsCreateOpen(true), []);
    const handleCloseCreate = useCallback(() => setIsCreateOpen(false), []);
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value), []);

    // Stable form field handlers — avoids new object per keystroke
    const handleFormName = useCallback((e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(prev => ({ ...prev, name: e.target.value })), []);
    const handleFormTrigger = useCallback((v: string) =>
        setForm(prev => ({ ...prev, triggerType: v })), []);
    const handleFormDelay = useCallback((e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(prev => ({ ...prev, delayHours: e.target.value })), []);
    const handleFormSubject = useCallback((e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(prev => ({ ...prev, subject: e.target.value })), []);

    // Copy handlers
    const handleCopyEmails = useCallback(() => {
        navigator.clipboard.writeText(allContacts?.emails.join('\n') || '');
        toast({ title: 'Emails copied', description: `${allContacts?.counts.emails} emails copied to clipboard.` });
    }, [allContacts, toast]);
    const handleCopyPhones = useCallback(() => {
        navigator.clipboard.writeText(allContacts?.phoneNumbers.join('\n') || '');
        toast({ title: 'Phone numbers copied', description: `${allContacts?.counts.phoneNumbers} phone numbers copied to clipboard.` });
    }, [allContacts, toast]);

    // Derived values — computed once per relevant change
    const activeCampaigns = useMemo(() => campaigns.filter(c => c.isActive).length, [campaigns]);
    const convRate = stats?.conversionRate ?? '0.0';
    const convRateFloat = parseFloat(convRate as string);
    const convColor = convRateFloat >= 10 ? 'text-emerald-600' : convRateFloat >= 5 ? 'text-amber-600' : 'text-stone-400';
    const totalEmailsSent = useMemo(() =>
        campaigns.reduce((s: number, c: any) => s + (c._count?.emailLogs ?? 0), 0),
        [campaigns]
    );
    const triggerDistribution = useMemo(() => {
        const acc: Record<string, number> = {};
        for (const c of campaigns) {
            const type = c.triggerType || 'UNKNOWN';
            acc[type] = (acc[type] || 0) + 1;
        }
        return Object.entries(acc);
    }, [campaigns]);

    const canSubmitForm = form.name && form.triggerType;

    // ── Full-page loading skeleton ──
    if (isLoading && campaigns.length === 0) {
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
                    {/* View Switcher */}
                    <div className="flex items-center bg-stone-100 p-0.5 rounded-lg mr-2">
                        <button
                            onClick={setViewCampaigns}
                            className={cn(
                                "px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
                                activeView === 'campaigns' ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
                            )}
                        >
                            Campaigns
                        </button>
                        <button
                            onClick={setViewLeads}
                            className={cn(
                                "px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
                                activeView === 'leads' ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
                            )}
                        >
                            Leads
                        </button>
                        <button
                            onClick={setViewContacts}
                            className={cn(
                                "px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
                                activeView === 'contacts' ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
                            )}
                        >
                            Contacts
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={handleSyncData}
                        disabled={isLoading}
                        className="h-7 px-3 flex items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-all shadow-sm text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                    >
                        <RefreshCw size={11} className={cn(isLoading && 'animate-spin')} /> Sync
                    </button>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live
                    </div>
                    <button
                        type="button"
                        onClick={handleOpenCreate}
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
                    sub={`${totalEmailsSent} logged actions`}
                    icon={<Mail size={14} />}
                    accent="border-l-indigo-400"
                />
                <KpiCard
                    label="Conversion Rate"
                    value={`${convRate}%`}
                    sub="Leads → customers"
                    icon={<BarChart3 size={14} />}
                    accent={
                        convRateFloat >= 10 ? 'border-l-emerald-400'
                            : convRateFloat >= 5 ? 'border-l-amber-400'
                                : 'border-l-stone-300'
                    }
                    subColor={convColor}
                />
            </div>

            {/* ── MAIN CONTENT ROW ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

                <div className="xl:col-span-2 space-y-4">
                    {activeView === 'campaigns' ? (
                        <Panel stripe="rose">
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
                                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">No campaigns yet</p>
                                    <button
                                        type="button"
                                        onClick={handleOpenCreate}
                                        className="text-[10px] font-bold text-rose-600 uppercase tracking-widest hover:underline"
                                    >
                                        Build your first funnel →
                                    </button>
                                </div>
                            ) : (
                                <div className="divide-y divide-stone-100">
                                    {campaigns.map(camp => (
                                        <CampaignRow
                                            key={camp.id}
                                            camp={camp}
                                            isExpanded={expandedId === camp.id}
                                            isDeleting={isDeleting === camp.id}
                                            onToggleExpand={handleToggleExpand}
                                            onToggle={toggleCampaign}
                                            onDelete={deleteCampaign}
                                        />
                                    ))}
                                </div>
                            )}
                        </Panel>
                    ) : activeView === 'leads' ? (
                        <Panel stripe="indigo">
                            <PanelHeader
                                icon={<Users size={12} />}
                                right={
                                    <div className="relative w-48">
                                        <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                                        <input
                                            type="text"
                                            placeholder="Search leads..."
                                            value={searchQuery}
                                            onChange={handleSearchChange}
                                            className="w-full bg-white border border-stone-200 rounded-lg pl-8 pr-3 py-1 text-[10px] font-bold tracking-tight focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                }
                            >
                                Registered Leads
                            </PanelHeader>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-stone-50/50 border-b border-stone-100">
                                        <tr>
                                            <th className="px-5 py-2.5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Contact</th>
                                            <th className="px-5 py-2.5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Source</th>
                                            <th className="px-5 py-2.5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Status</th>
                                            <th className="px-5 py-2.5 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">Engagement</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-50">
                                        {leadsData.items.length === 0 && !isLoading && (
                                            <tr>
                                                <td colSpan={4} className="py-20 text-center text-[10px] font-bold text-stone-300 uppercase tracking-widest">No leads found</td>
                                            </tr>
                                        )}
                                        {leadsData.items.map(lead => (
                                            <LeadRow key={lead.id} lead={lead} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Panel>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Panel stripe="stone">
                                    <PanelHeader
                                        icon={<Users size={12} />}
                                        right={
                                            <button
                                                onClick={handleCopyEmails}
                                                className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline px-2 py-0.5"
                                            >
                                                Copy All
                                            </button>
                                        }
                                    >
                                        Unique Emails ({allContacts?.counts.emails ?? 0})
                                    </PanelHeader>
                                    <div className="max-h-[500px] overflow-y-auto px-5 py-3 space-y-2">
                                        {allContacts?.emails.length === 0 ? (
                                            <p className="text-[10px] font-bold text-stone-300 uppercase tracking-widest text-center py-10">No emails collected</p>
                                        ) : (
                                            allContacts?.emails.map((email: string) => (
                                                <div key={email} className="flex items-center justify-between py-1.5 border-b border-stone-50 last:border-0">
                                                    <span className="text-xs font-medium text-stone-700 font-mono">{email}</span>
                                                    <Mail size={12} className="text-stone-300" />
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </Panel>

                                <Panel stripe="stone">
                                    <PanelHeader
                                        icon={<Hash size={12} />}
                                        right={
                                            <button
                                                onClick={handleCopyPhones}
                                                className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline px-2 py-0.5"
                                            >
                                                Copy All
                                            </button>
                                        }
                                    >
                                        Unique Phone Numbers ({allContacts?.counts.phoneNumbers ?? 0})
                                    </PanelHeader>
                                    <div className="max-h-[500px] overflow-y-auto px-5 py-3 space-y-2">
                                        {allContacts?.phoneNumbers.length === 0 ? (
                                            <p className="text-[10px] font-bold text-stone-300 uppercase tracking-widest text-center py-10">No phone numbers collected</p>
                                        ) : (
                                            allContacts?.phoneNumbers.map((phone: string) => (
                                                <div key={phone} className="flex items-center justify-between py-1.5 border-b border-stone-50 last:border-0">
                                                    <span className="text-xs font-medium text-stone-700 font-mono">{phone}</span>
                                                    <Activity size={12} className="text-stone-300" />
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </Panel>
                            </div>
                        </div>
                    )}

                    {/* Funnel Health Mini */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Panel stripe="emerald">
                            <PanelHeader icon={<TrendingUp size={12} />}>Funnel Health</PanelHeader>
                            <div className="px-4 py-3 space-y-2.5">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Conversion Rate</span>
                                        <span className={cn('text-sm font-extrabold font-mono tabular-nums', convColor)}>{convRate}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                                        <div
                                            className={cn('h-full rounded-full transition-all', convRateFloat >= 10 ? 'bg-emerald-400' : convRateFloat >= 5 ? 'bg-amber-400' : 'bg-stone-300')}
                                            style={{ width: `${Math.min(100, convRateFloat * 5)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Panel>
                        <Panel stripe="amber">
                            <PanelHeader icon={<Activity size={12} />}>Trigger Distribution</PanelHeader>
                            <div className="px-4 py-3 space-y-2">
                                {campaigns.length === 0 ? (
                                    <p className="py-2 text-center text-[10px] font-bold text-stone-300 uppercase tracking-widest">No data</p>
                                ) : (
                                    triggerDistribution.map(([trigger, count]) => (
                                        <div key={trigger} className="flex items-center justify-between gap-2">
                                            <span className="text-[10px] font-bold text-stone-600 tracking-widest">{trigger.replace(/_/g, ' ')}</span>
                                            <span className="text-xs font-bold text-stone-600 font-mono">{count as number}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Panel>
                    </div>
                </div>

                {/* ── RIGHT COLUMN: ACTIVITY LOG ── */}
                <div className="flex flex-col gap-4">
                    <Panel stripe="indigo" className="h-full">
                        <PanelHeader
                            icon={<Activity size={12} />}
                            right={<Activity size={12} className="text-indigo-400 animate-pulse" />}
                        >
                            Recent Activity
                        </PanelHeader>
                        <div className="p-0 overflow-y-auto max-h-[600px]">
                            {logs.length === 0 ? (
                                <div className="py-20 flex flex-col items-center gap-3">
                                    <Mail size={24} className="text-stone-100" />
                                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">No activity yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-stone-50">
                                    {logs.map(log => (
                                        <LogRow key={log.id} log={log} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </Panel>
                </div>
            </div>

            {/* ── CREATE CAMPAIGN MODAL ── */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-md bg-white border-stone-200 rounded-2xl shadow-xl">
                    <div className="h-0.5 w-full bg-gradient-to-r from-rose-400 via-rose-500 to-orange-400 -mt-6 mb-5 rounded-t-2xl" />

                    <DialogHeader className="pb-2">
                        <DialogTitle className="text-sm font-bold text-stone-800 tracking-tight">New Campaign</DialogTitle>
                        <p className="text-[11px] text-stone-400 mt-0.5">Configure your event-driven email sequence.</p>
                    </DialogHeader>

                    <div className="space-y-3 py-1">
                        <div>
                            <FieldLabel>Campaign Name</FieldLabel>
                            <Input
                                placeholder="e.g. Abandoned Cart Recovery"
                                value={form.name}
                                onChange={handleFormName}
                                className="h-8 text-xs bg-stone-50 rounded-lg focus:bg-white focus:border-rose-300"
                            />
                        </div>

                        <div>
                            <FieldLabel>Trigger Event</FieldLabel>
                            <Select value={form.triggerType} onValueChange={handleFormTrigger}>
                                <SelectTrigger className="h-8 text-xs bg-stone-50 rounded-lg">
                                    <SelectValue placeholder="Select a trigger…" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CART_ABANDONED" className="text-xs">Cart Abandoned</SelectItem>
                                    <SelectItem value="NEWSLETTER_SIGNUP" className="text-xs">Newsletter Signup</SelectItem>
                                    <SelectItem value="CHECKOUT_STARTED" className="text-xs">Checkout Started</SelectItem>
                                    <SelectItem value="PRODUCT_VIEWED" className="text-xs">Product Viewed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <FieldLabel>Delay (Hours)</FieldLabel>
                                <Input
                                    type="number"
                                    min="0"
                                    value={form.delayHours}
                                    onChange={handleFormDelay}
                                    className="h-8 text-xs font-mono bg-stone-50 rounded-lg"
                                />
                            </div>
                            <div>
                                <FieldLabel>Subject Line</FieldLabel>
                                <Input
                                    placeholder="You left something…"
                                    value={form.subject}
                                    onChange={handleFormSubject}
                                    className="h-8 text-xs bg-stone-50 rounded-lg"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 pt-3">
                        <button
                            type="button"
                            onClick={handleCloseCreate}
                            className="h-8 px-4 text-[10px] font-bold uppercase border text-stone-500 rounded-lg hover:bg-stone-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleCreateCampaign}
                            disabled={!canSubmitForm}
                            className={cn(
                                'h-8 px-4 text-[10px] font-bold uppercase rounded-lg shadow-sm flex items-center gap-1.5',
                                canSubmitForm ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-stone-100 text-stone-400'
                            )}
                        >
                            {isLoading ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />} Create & Activate
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MarketingManager;