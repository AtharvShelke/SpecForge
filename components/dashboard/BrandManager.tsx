'use client';

import React, { useState } from 'react';
import { useShop } from '@/context/ShopContext';
import { useAdmin } from '@/context/AdminContext';
import { Category } from '@/types';
import { Trash, Plus, Tag, AlertCircle, Search, Hash, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const BrandManager = () => {
    const { brands } = useShop();
    const { addBrand, deleteBrand } = useAdmin();

    const [newBrandName, setNewBrandName] = useState('');
    const [selectedCats, setSelectedCats] = useState<Category[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBrandName.trim()) return;

        if (selectedCats.length === 0) {
            alert('Please select at least one category');
            return;
        }

        addBrand({
            id: `brand-${Date.now()}`,
            name: newBrandName.trim(),
            categories: selectedCats
        });

        setNewBrandName('');
        setSelectedCats([]);
    };

    const toggleCat = (cat: Category) => {
        if (selectedCats.includes(cat)) {
            setSelectedCats(selectedCats.filter(c => c !== cat));
        } else {
            setSelectedCats([...selectedCats, cat]);
        }
    };

    const handleDelete = (brandId: string, brandName: string) => {
        if (window.confirm(`Delete brand "${brandName}"? This cannot be undone.`)) {
            deleteBrand(brandId);
        }
    };

    const filteredBrands = brands.filter(b =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-zinc-900">Brand Management</h2>
                    <p className="text-sm text-zinc-500 mt-0.5">
                        Manage brand portfolio and category associations
                    </p>
                </div>
                <Badge variant="outline" className="bg-white border-zinc-200 text-zinc-600 text-xs font-medium px-2.5 py-1 w-fit">
                    {brands.length} brands
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                {/* Form */}
                <div className="lg:col-span-4 flex flex-col gap-5">
                    <Card className="border-zinc-200 rounded-lg shadow-sm sticky top-6">
                        <CardHeader className="px-5 py-4 border-b border-zinc-100">
                            <CardTitle className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                                <Plus size={14} className="text-zinc-500" />
                                Add Brand
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <form onSubmit={handleAdd} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium text-zinc-700">Brand Name</Label>
                                    <Input
                                        placeholder="e.g. ASUS"
                                        className="h-9 text-sm border-zinc-200 focus:border-indigo-300 focus:ring-indigo-500/20 rounded-md"
                                        value={newBrandName}
                                        onChange={e => setNewBrandName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium text-zinc-700 flex items-center justify-between">
                                        Categories
                                        <span className="text-zinc-400 text-xs font-normal">Required</span>
                                    </Label>
                                    <div className="border border-zinc-200 rounded-md overflow-hidden">
                                        <ScrollArea className="h-[240px]">
                                            <div className="p-1.5 space-y-0.5">
                                                {Object.values(Category).map(cat => (
                                                    <div
                                                        key={cat}
                                                        onClick={() => toggleCat(cat)}
                                                        className={cn(
                                                            "flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer transition-colors duration-150 text-sm",
                                                            selectedCats.includes(cat)
                                                                ? "bg-indigo-50 text-indigo-700"
                                                                : "text-zinc-600 hover:bg-zinc-50"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                                                            selectedCats.includes(cat) ? "border-indigo-500 bg-indigo-500" : "border-zinc-300"
                                                        )}>
                                                            {selectedCats.includes(cat) && <CheckCircle2 size={10} className="text-white" />}
                                                        </div>
                                                        <span className="font-medium">{cat}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                    {selectedCats.length > 0 && (
                                        <p className="text-xs text-zinc-500 text-right">
                                            {selectedCats.length} selected
                                        </p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-9 bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-medium rounded-md transition-colors duration-150"
                                    disabled={!newBrandName.trim() || selectedCats.length === 0}
                                >
                                    Save Brand
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Brand List */}
                <div className="lg:col-span-8 space-y-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-600 transition-colors duration-150" />
                        <Input
                            placeholder="Search brands..."
                            className="pl-9 h-9 border-zinc-200 bg-white text-sm rounded-md placeholder:text-zinc-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {filteredBrands.length === 0 ? (
                        <div className="bg-white rounded-lg border border-dashed border-zinc-200 p-12 text-center">
                            <Tag size={28} className="mx-auto text-zinc-200 mb-3" />
                            <p className="text-sm text-zinc-400">No brands found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {filteredBrands.map(brand => (
                                <div
                                    key={brand.id}
                                    className="bg-white border border-zinc-200 rounded-lg p-4 hover:border-zinc-300 transition-colors duration-150 group relative"
                                >
                                    <div className="flex justify-between items-start gap-3 mb-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <Hash size={10} className="text-zinc-300" />
                                                <span className="text-[11px] font-mono text-zinc-400">{brand.id.substring(0, 8).toUpperCase()}</span>
                                            </div>
                                            <h4 className="font-semibold text-zinc-900 text-sm truncate">
                                                {brand.name}
                                            </h4>
                                        </div>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => handleDelete(brand.id, brand.name)}
                                            className="h-7 w-7 text-zinc-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-150 rounded-md"
                                        >
                                            <Trash size={14} />
                                        </Button>
                                    </div>

                                    <Separator className="mb-3 bg-zinc-100" />

                                    {brand.categories.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {brand.categories.map(cat => (
                                                <Badge
                                                    key={cat}
                                                    variant="secondary"
                                                    className="bg-zinc-50 text-zinc-600 text-[11px] font-medium h-5 border border-zinc-200 rounded"
                                                >
                                                    {cat}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-100 px-2 py-1.5 rounded-md w-fit">
                                            <AlertCircle size={12} />
                                            No categories assigned
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default BrandManager;