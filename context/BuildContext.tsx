'use client';

import { usePathname } from 'next/navigation';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { BuildGuide, CompatibilityReport, CompatibilityLevel, CartItem } from '../types';
import { validateBuild } from '../services/compatibility';
import { useShop } from './ShopContext';
import { useToast } from '@/hooks/use-toast';
import { getBaseUrl } from '@/lib/utils';

interface BuildContextType {
    buildGuides: BuildGuide[];
    refreshBuildGuides: () => Promise<void>;
    saveCurrentBuild: (title: string, description?: string) => Promise<void>;
    loadBuild: (buildId: string) => Promise<void>;
    deleteBuild: (buildId: string) => Promise<void>;
    generateShareLink: () => string;
    loadBuildFromBase64: (base64Str: string) => Promise<void>;
    compatibilityReport: CompatibilityReport;
    isBuildMode: boolean;
    toggleBuildMode: () => void;
    isLoading: boolean;
}

const BuildContext = createContext<BuildContextType | undefined>(undefined);

export const BuildProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { cart, cartTotal, products, setCartOpen, loadCart } = useShop();
    const { toast } = useToast();

    const [buildGuides, setBuildGuides] = useState<BuildGuide[]>([]);
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
    const refreshBuildGuides = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/build-guides');
            const data = await res.json();
            setBuildGuides(data);
        } catch (err) {
            console.error('Failed to fetch build guides:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const pathname = usePathname();
    const hasFetchedGuides = React.useRef(false);

    useEffect(() => {
        if (pathname?.startsWith('/admin')) return;
        if (hasFetchedGuides.current) return;
        hasFetchedGuides.current = true;
        refreshBuildGuides();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- ACTIONS ---
    const saveCurrentBuild = useCallback(async (title: string, description: string = '') => {
        if (cart.length === 0) return;
        try {
            const res = await fetch('/api/build-guides', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: title, // sending as name right now to not break the API if not yet redeployed
                    total: cartTotal,
                    items: cart.map(i => ({ productId: i.id, variantId: i.selectedVariant?.id || (i.variants && i.variants.length > 0 ? i.variants[0].id : ''), quantity: i.quantity }))
                }),
            });
            if (res.ok) {
                toast({ title: "Build Guide saved successfully" });
                await refreshBuildGuides();
            } else {
                const errData = await res.json();
                console.error("Failed to save build guide API:", errData);
                toast({ title: "Failed to save build guide", description: JSON.stringify(errData.error || errData), variant: "destructive" });
            }
        } catch (err) {
            console.error('Failed to save build guide:', err);
            toast({ title: "Error", description: "Network error while saving build guide", variant: "destructive" });
        }
    }, [cart, cartTotal, refreshBuildGuides, toast]);

    const loadBuild = useCallback(async (buildId: string) => {
        setIsLoading(true);
        try {
            // First attempt to locate the build guide locally
            let build = buildGuides.find(b => b.id === buildId);

            // If not found locally or we want fresh server data, fetch it explicitly
            if (!build) {
                const res = await fetch(`/api/build-guides/${buildId}`);
                if (res.ok) {
                    build = await res.json();
                }
            }

            if (!build) {
                toast({ title: "Build not found", variant: "destructive" });
                return;
            }

            const newCart: any[] = [];
            for (const item of build.items) {
                // Ensure we use server-resolved product data rather than only relying on client side products which may not be fetched
                const fullProduct = item.variant?.product;
                if (fullProduct) {
                    newCart.push({ ...fullProduct, quantity: item.quantity, selectedVariant: item.variant });
                } else {
                    // Fallback to client-side catalog search if API didn't resolve full product specs somehow
                    const product = products.find(p => p.variants?.some(v => v.id === item.variantId));
                    if (product) {
                        const variant = product.variants?.find(v => v.id === item.variantId) || product.variants?.[0];
                        newCart.push({ ...product, quantity: item.quantity, selectedVariant: variant });
                    }
                }
            }
            loadCart(newCart);

            toast({ title: "Build Guide loaded", description: "Items added to your cart." });
            setCartOpen(true);
        } catch (err) {
            console.error("Failed to load build guide:", err);
            toast({ title: "Error", description: "Could not load Build Guide", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [buildGuides, products, loadCart, setCartOpen, toast]);

    const deleteBuild = useCallback(async (buildId: string) => {
        try {
            const res = await fetch(`/api/build-guides/${buildId}`, { method: 'DELETE' });
            if (res.ok) {
                toast({ title: "Build Guide deleted" });
                await refreshBuildGuides();
            }
        } catch (err) {
            console.error('Failed to delete build guide:', err);
        }
    }, [refreshBuildGuides, toast]);

    const toggleBuildMode = useCallback(() => setIsBuildMode(prev => !prev), []);

    // --- SHARE ACTIONS ---
    const generateShareLink = useCallback(() => {
        if (cart.length === 0) return "";
        // Extract minimal info: [variantId, quantity]
        const minimalCart = cart.map(item => [
            item.selectedVariant?.id || item.variants?.[0]?.id,
            item.quantity
        ]);

        try {
            const jsonStr = JSON.stringify(minimalCart);
            // Use native btoa with URL-safe base64
            const encoded = btoa(encodeURIComponent(jsonStr))
                .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
            const url = new URL(getBaseUrl() + '/builds');
            url.searchParams.set('share', encoded);
            return url.toString();
        } catch (err) {
            console.error('Error generating share link:', err);
            return "";
        }
    }, [cart]);

    const loadBuildFromBase64 = useCallback(async (base64Str: string) => {
        try {
            setIsLoading(true);
            // Decode URL-safe base64 back
            const padded = base64Str.replace(/-/g, '+').replace(/_/g, '/');
            const decoded = decodeURIComponent(atob(padded));
            if (!decoded) throw new Error("Invalid share string");

            const itemsToLoad: [string, number][] = JSON.parse(decoded);

            // To ensure correct product hydrates, we hit a generic product search or rely on 'products' array
            // Assuming 'products' holds our active catalog
            const newCart: any[] = [];
            for (const [variantId, quantity] of itemsToLoad) {
                const product = products.find(p => p.variants?.some(v => v.id === variantId));
                if (product) {
                    const variant = product.variants?.find(v => v.id === variantId) || product.variants?.[0];
                    newCart.push({ ...product, quantity: quantity, selectedVariant: variant });
                }
            }

            if (newCart.length > 0) {
                loadCart(newCart);
                toast({ title: "Shared build loaded", description: `${newCart.length} items added to your cart.` });
                setCartOpen(true);
                setIsBuildMode(true);
            } else {
                toast({ title: "Could not load shared build", description: "Products may be unavailable", variant: "destructive" });
            }
        } catch (err) {
            console.error("Failed to load shared build", err);
            toast({ title: "Error loading build", description: "The link appears to be invalid or broken.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [products, loadCart, setCartOpen, toast]);

    const value = useMemo(() => ({
        buildGuides,
        refreshBuildGuides,
        saveCurrentBuild,
        loadBuild,
        deleteBuild,
        generateShareLink,
        loadBuildFromBase64,
        compatibilityReport,
        isBuildMode,
        toggleBuildMode,
        isLoading
    }), [
        buildGuides, refreshBuildGuides, saveCurrentBuild, loadBuild,
        deleteBuild, generateShareLink, loadBuildFromBase64, compatibilityReport, isBuildMode, toggleBuildMode, isLoading
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
