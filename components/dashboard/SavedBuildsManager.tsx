'use client';

import React, { useState, useEffect } from 'react';
import { Trash, Search, Hash, Cpu, Edit } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}

export default function SavedBuildsManager() {
    const { toast } = useToast();
    const [builds, setBuilds] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [editingBuild, setEditingBuild] = useState<any | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const fetchBuilds = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/build-guides');
            const data = await res.json();
            setBuilds(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBuilds();
    }, []);

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/build-guides/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast({ title: "Build deleted successfully" });
                fetchBuilds();
                setDeleteConfirmId(null);
            } else {
                const data = await res.json();
                toast({ title: "Delete Failed", description: data.error || "Could not delete", variant: "destructive" });
            }
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "Failed to delete build", variant: "destructive" });
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingBuild) return;

        try {
            const res = await fetch(`/api/build-guides/${editingBuild.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editingBuild.title,
                    description: editingBuild.description,
                    category: editingBuild.category,
                    total: editingBuild.total
                })
            });

            if (res.ok) {
                toast({ title: "Build updated successfully" });
                setEditingBuild(null);
                fetchBuilds();
            } else {
                const data = await res.json();
                toast({ title: "Update Failed", description: data.error || "Could not update", variant: "destructive" });
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to update build", variant: "destructive" });
        }
    };

    const filteredBuilds = builds.filter(b =>
        b.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-zinc-900">Saved Builds</h2>
                    <p className="text-sm text-zinc-500 mt-0.5">
                        Manage saved builds and custom configurations
                    </p>
                </div>
                <Badge variant="outline" className="bg-white border-zinc-200 text-zinc-600 text-xs font-medium px-2.5 py-1 w-fit">
                    {builds.length} builds
                </Badge>
            </div>

            <div className="flex flex-col gap-5">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input
                        placeholder="Search builds..."
                        className="pl-9 h-9 border-zinc-200 bg-white text-sm rounded-md"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                {isLoading ? (
                    <div className="text-center py-20 text-zinc-500">Loading builds...</div>
                ) : filteredBuilds.length === 0 ? (
                    <div className="bg-white rounded-lg border border-dashed border-zinc-200 p-12 text-center">
                        <Cpu size={28} className="mx-auto text-zinc-200 mb-3" />
                        <p className="text-sm text-zinc-400">No saved builds found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredBuilds.map((build) => (
                            <Card key={build.id} className="border-zinc-200 group">
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start gap-4 mb-4">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                <Hash size={10} className="text-zinc-300" />
                                                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest">
                                                    {build.id.substring(0, 8)}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-zinc-900 truncate" title={build.title}>
                                                {build.title}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="w-8 h-8 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100"
                                                onClick={() => setEditingBuild(build)}
                                            >
                                                <Edit size={14} />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="w-8 h-8 text-zinc-400 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => setDeleteConfirmId(build.id)}
                                            >
                                                <Trash size={14} />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <Badge variant="secondary" className="bg-zinc-50 border-zinc-200 text-zinc-600">
                                                {build.category || 'General'}
                                            </Badge>
                                            <span className="font-semibold text-zinc-900">
                                                {formatCurrency(build.total)}
                                            </span>
                                        </div>

                                        <Separator className="bg-zinc-100" />

                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                                Components ({build.items?.length || 0})
                                            </p>
                                            <div className="space-y-1.5">
                                                {build.items?.slice(0, 3).map((item: any) => (
                                                    <div key={item.id} className="flex justify-between items-center text-xs">
                                                        <span className="text-zinc-600 truncate mr-2">
                                                            {item.quantity}x {item.variant?.product?.name || 'Unknown Item'}
                                                        </span>
                                                        <span className="text-zinc-400 shrink-0">
                                                            {formatCurrency(item.variant?.price || 0)}
                                                        </span>
                                                    </div>
                                                ))}
                                                {(build.items?.length || 0) > 3 && (
                                                    <p className="text-[11px] text-zinc-400 mt-1 italic">
                                                        + {(build.items?.length || 0) - 3} more items
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-[10px] text-zinc-400 pt-2 border-t border-zinc-50">
                                            Saved on {new Date(build.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <Dialog open={!!editingBuild} onOpenChange={(open) => !open && setEditingBuild(null)}>
                <DialogContent className="sm:max-w-md bg-white border-zinc-200">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-zinc-900">Edit Saved Build</DialogTitle>
                        <DialogDescription className="text-sm text-zinc-500">
                            Update the details of this build. Component changes must be done via the Builder.
                        </DialogDescription>
                    </DialogHeader>
                    {editingBuild && (
                        <form onSubmit={handleSave} className="space-y-4 py-2">
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium text-zinc-700">Title</Label>
                                <Input
                                    value={editingBuild.title}
                                    onChange={e => setEditingBuild({ ...editingBuild, title: e.target.value })}
                                    required
                                    className="h-9 border-zinc-200"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium text-zinc-700">Category</Label>
                                <Input
                                    value={editingBuild.category || ''}
                                    onChange={e => setEditingBuild({ ...editingBuild, category: e.target.value })}
                                    className="h-9 border-zinc-200"
                                    placeholder="e.g. Gaming, Workstation"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium text-zinc-700">Description</Label>
                                <Textarea
                                    value={editingBuild.description || ''}
                                    onChange={e => setEditingBuild({ ...editingBuild, description: e.target.value })}
                                    className="border-zinc-200 resize-none"
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium text-zinc-700">Total Price override (Optional)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={editingBuild.total}
                                    onChange={e => setEditingBuild({ ...editingBuild, total: parseFloat(e.target.value) || 0 })}
                                    className="h-9 border-zinc-200"
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button variant="outline" type="button" onClick={() => setEditingBuild(null)} className="h-9 border-zinc-200 text-zinc-600">
                                    Cancel
                                </Button>
                                <Button type="submit" className="h-9 bg-zinc-900 text-white hover:bg-zinc-800">
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                <DialogContent className="sm:max-w-md bg-white border-zinc-200">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-zinc-900">Confirm Delete</DialogTitle>
                        <DialogDescription className="text-sm text-zinc-500">
                            Are you sure you want to delete this saved build? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-end gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteConfirmId(null)}
                            className="h-9 text-sm font-medium border-zinc-200 rounded-md"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                            className="h-9 text-sm font-medium bg-red-600 text-white hover:bg-red-700 rounded-md gap-1.5"
                        >
                            <Trash size={14} />
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
