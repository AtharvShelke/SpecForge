'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, BarChart3, Users, Mail, Activity, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export const MarketingManager = () => {
    const { toast } = useToast();
    const [stats, setStats] = useState<any>(null);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const [form, setForm] = useState({
        name: '',
        triggerType: '',
        delayHours: '0',
        subject: ''
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [statsRes, campsRes] = await Promise.all([
                fetch('/api/marketing/stats'),
                fetch('/api/marketing/campaigns')
            ]);
            const s = await statsRes.json();
            const c = await campsRes.json();
            setStats(s);
            setCampaigns(c);
        } catch (e) {
            console.error("Failed to fetch marketing data", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateCampaign = async () => {
        try {
            const payload = {
                name: form.name,
                triggerType: form.triggerType,
                isActive: true,
                rulesConfig: {
                    delayHours: parseInt(form.delayHours),
                    subject: form.subject
                }
            };
            const res = await fetch('/api/marketing/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                toast({ title: 'Campaign created', description: 'Your new campaign is now active.' });
                setIsCreateOpen(false);
                fetchData();
            } else {
                toast({ title: 'Error', description: 'Failed to create campaign', variant: 'destructive' });
            }
        } catch (e) {
            toast({ title: 'Error', description: 'Error creating campaign', variant: 'destructive' });
        }
    };

    if (isLoading) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-black">Marketing Funnels</h2>
                    <p className="text-sm text-zinc-500 mt-1">Convert leads into customers through automated event-driven sequences.</p>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-black text-white hover:bg-zinc-800">
                            <PlusCircle className="w-4 h-4 mr-2" />
                            New Campaign
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Campaign</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Campaign Name</Label>
                                <Input placeholder="e.g. Abandoned Cart Recovery" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Trigger Event</Label>
                                <Select value={form.triggerType} onValueChange={(v) => setForm({ ...form, triggerType: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select Trigger" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CART_ABANDONED">Cart Abandoned</SelectItem>
                                        <SelectItem value="NEWSLETTER_SIGNUP">Newsletter Signup (Custom)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Delay Before Sending (Hours)</Label>
                                <Input type="number" min="0" value={form.delayHours} onChange={(e) => setForm({ ...form, delayHours: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Email Subject Line</Label>
                                <Input placeholder="You left something behind..." value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateCampaign}>Create & Activate</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">Total Leads</CardTitle>
                        <Users className="h-4 w-4 text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalLeads || 0}</div>
                        <p className="text-xs text-zinc-500 mt-1">In database</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">Active Campaigns</CardTitle>
                        <Activity className="h-4 w-4 text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.activeCampaigns || 0}</div>
                        <p className="text-xs text-zinc-500 mt-1">Out of {stats?.totalCampaigns || 0} total</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">Emails Sent</CardTitle>
                        <Mail className="h-4 w-4 text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.emailsSent || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">Conversion Rate</CardTitle>
                        <BarChart3 className="h-4 w-4 text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.conversionRate || "0.0"}%</div>
                        <p className="text-xs text-zinc-500 mt-1">Leads that became customers</p>
                    </CardContent>
                </Card>
            </div>

            {/* Campaign List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Campaign Overview</CardTitle>
                    <CardDescription>Manage your event-driven marketing workflows.</CardDescription>
                </CardHeader>
                <CardContent>
                    {campaigns.length === 0 ? (
                        <div className="py-8 text-center text-zinc-500 text-sm border border-dashed rounded-lg">
                            No campaigns created yet. Build your first funnel to start converting leads.
                        </div>
                    ) : (
                        <div className="rounded-md border border-zinc-200 divide-y divide-zinc-200">
                            {campaigns.map((camp) => (
                                <div key={camp.id} className="flex items-center justify-between p-4 hover:bg-zinc-50/50 transition-colors">
                                    <div>
                                        <p className="font-medium text-sm text-black">{camp.name}</p>
                                        <p className="text-xs text-zinc-500 mt-1">
                                            Trigger: <span className="font-mono bg-zinc-100 px-1 py-0.5 rounded">{camp.triggerType}</span> •
                                            Delay: {camp.rulesConfig?.delayHours || 0} hours
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right text-xs text-zinc-500">
                                            <p><span className="font-semibold text-black">{camp._count?.emailLogs || 0}</span> sends</p>
                                        </div>
                                        <Badge variant="outline" className={cn(camp.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-zinc-100 text-zinc-500")}>
                                            {camp.isActive ? 'Active' : 'Paused'}
                                        </Badge>
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

function cn(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}
