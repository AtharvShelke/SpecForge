'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { SavedBuild, CompatibilityReport, CompatibilityLevel } from '../types';
import { validateBuild } from '../services/compatibility';
import { useShop } from './ShopContext';
import { useToast } from '@/hooks/use-toast';

interface BuildContextType {
    savedBuilds: SavedBuild[];
    refreshSavedBuilds: () => Promise<void>;
    saveCurrentBuild: (name: string) => Promise<void>;
    loadBuild: (buildId: string) => Promise<void>;
    deleteBuild: (buildId: string) => Promise<void>;
    compatibilityReport: CompatibilityReport;
    isBuildMode: boolean;
    toggleBuildMode: () => void;
    isLoading: boolean;
}

const BuildContext = createContext<BuildContextType | undefined>(undefined);

export const BuildProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { cart, cartTotal, products, setCartOpen, loadCart } = useShop();
    const { toast } = useToast();

    const [savedBuilds, setSavedBuilds] = useState<SavedBuild[]>([]);
    const [isBuildMode, setIsBuildMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [compatibilityReport, setCompatibilityReport] = useState<CompatibilityReport>({
        status: CompatibilityLevel.COMPATIBLE,
        issues: []
    });

    // --- COMPATIBILITY LOGIC ---
    useEffect(() => {
        // Re-validate whenever cart changes
        const report = validateBuild(cart);
        setCompatibilityReport(report);
    }, [cart]);

    // --- FETCHERS ---
    const refreshSavedBuilds = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/builds');
            const data = await res.json();
            setSavedBuilds(data);
        } catch (err) {
            console.error('Failed to fetch builds:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // --- ACTIONS ---
    const saveCurrentBuild = useCallback(async (name: string) => {
        if (cart.length === 0) return;
        try {
            const res = await fetch('/api/builds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    total: cartTotal,
                    items: cart.map(i => ({ productId: i.id, variantId: i.selectedVariant?.id || '', quantity: i.quantity }))
                }),
            });
            if (res.ok) {
                toast({ title: "Build saved successfully" });
                await refreshSavedBuilds();
            } else {
                const errData = await res.json();
                console.error("Failed to save build API:", errData);
                toast({ title: "Failed to save build", description: JSON.stringify(errData.error || errData), variant: "destructive" });
            }
        } catch (err) {
            console.error('Failed to save build:', err);
            toast({ title: "Error", description: "Network error while saving build", variant: "destructive" });
        }
    }, [cart, cartTotal, refreshSavedBuilds, toast]);

    const loadBuild = useCallback(async (buildId: string) => {
        const build = savedBuilds.find(b => b.id === buildId);
        if (!build) return;

        const newCart: any[] = [];
        for (const item of build.items) {
            const product = products.find(p => p.variants?.some(v => v.id === item.variantId));
            if (product) {
                const variant = product.variants?.find(v => v.id === item.variantId) || product.variants?.[0];
                newCart.push({ ...product, quantity: item.quantity, selectedVariant: variant });
            }
        }
        loadCart(newCart);

        toast({ title: "Build loaded", description: "Items added to your cart." });
        setCartOpen(true);
    }, [savedBuilds, products, loadCart, setCartOpen, toast]);

    const deleteBuild = useCallback(async (buildId: string) => {
        try {
            const res = await fetch(`/api/builds/${buildId}`, { method: 'DELETE' });
            if (res.ok) {
                toast({ title: "Build deleted" });
                await refreshSavedBuilds();
            }
        } catch (err) {
            console.error('Failed to delete build:', err);
        }
    }, [refreshSavedBuilds, toast]);

    const toggleBuildMode = useCallback(() => setIsBuildMode(prev => !prev), []);

    // Initial load
    useEffect(() => {
        refreshSavedBuilds();
    }, [refreshSavedBuilds]);

    const value = useMemo(() => ({
        savedBuilds,
        refreshSavedBuilds,
        saveCurrentBuild,
        loadBuild,
        deleteBuild,
        compatibilityReport,
        isBuildMode,
        toggleBuildMode,
        isLoading
    }), [
        savedBuilds, refreshSavedBuilds, saveCurrentBuild, loadBuild,
        deleteBuild, compatibilityReport, isBuildMode, toggleBuildMode, isLoading
    ]);

    return (
        <BuildContext.Provider value={value}>
            {children}
        </BuildContext.Provider>
    );
};

export const useBuild = () => {
    const context = useContext(BuildContext);
    if (context === undefined) {
        throw new Error('useBuild must be used within a BuildProvider');
    }
    return context;
};
