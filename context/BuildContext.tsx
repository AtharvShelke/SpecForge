'use client';

import {
    createContext, useContext, useState, useEffect,
    useCallback, useMemo,
    type ReactNode,
} from 'react';
import { BuildGuide, CompatibilityReport, CartItem } from '../types';
import { validateBuild } from '../services/compatibility';
import { useShop } from './ShopContext';
import { useToast } from '@/hooks/use-toast';
import { getBaseUrl } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Context ───────────────────────────────────────────────────────────────────

const BuildContext = createContext<BuildContextType | undefined>(undefined);

// ── BuildProvider ─────────────────────────────────────────────────────────────

export const BuildProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { cart, cartTotal, products, setCartOpen, loadCart } = useShop();
    const { toast } = useToast();

    const [buildGuides, setBuildGuides] = useState<BuildGuide[]>([]);
    const [isBuildMode, setIsBuildMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // ── Compatibility — derived synchronously, no extra render cycle ──────────
    const liveCompatReport = useMemo(() => validateBuild(cart), [cart]);

    // ── Seed build guides from the /api/init payload (no extra fetch) ─────────
    const { initBuildGuides } = useShop();
    useEffect(() => {
        if (initBuildGuides.length > 0) setBuildGuides(initBuildGuides);
    }, [initBuildGuides]);

    // ── Manual refresh — used after save / delete actions only ───────────────
    const refreshBuildGuides = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${getBaseUrl()}/api/build-guides`);
            const data = await res.json();
            setBuildGuides(data);
        } catch (err) {
            console.error('Failed to fetch build guides:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ── Actions ───────────────────────────────────────────────────────────────

    const saveCurrentBuild = useCallback(async (title: string, description = '') => {
        if (cart.length === 0) return;
        try {
            const res = await fetch(`${getBaseUrl()}/api/build-guides`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: title,
                    total: cartTotal,
                    items: cart.map(i => ({
                        productId: i.id,
                        variantId: i.selectedVariant?.id ?? i.variants?.[0]?.id ?? '',
                        quantity: i.quantity,
                    })),
                }),
            });

            if (res.ok) {
                toast({ title: 'Build Guide saved successfully' });
                await refreshBuildGuides();
            } else {
                const errData = await res.json();
                console.error('Failed to save build guide API:', errData);
                toast({
                    title: 'Failed to save build guide',
                    description: JSON.stringify(errData.error ?? errData),
                    variant: 'destructive',
                });
            }
        } catch (err) {
            console.error('Failed to save build guide:', err);
            toast({ title: 'Error', description: 'Network error while saving build guide', variant: 'destructive' });
        }
    }, [cart, cartTotal, refreshBuildGuides, toast]);

    const loadBuild = useCallback(async (buildId: string) => {
        setIsLoading(true);
        try {
            // Prefer locally cached guide; fall back to API
            let build = buildGuides.find(b => b.id === buildId);
            if (!build) {
                const res = await fetch(`${getBaseUrl()}/api/build-guides/${buildId}`);
                if (res.ok) build = await res.json();
            }

            if (!build) {
                toast({ title: 'Build not found', variant: 'destructive' });
                return;
            }

            const newCart: any[] = [];
            for (const item of build.items || []) {
                const fullProduct = item.variant?.product;
                if (fullProduct) {
                    newCart.push({ ...fullProduct, quantity: item.quantity, selectedVariant: item.variant });
                } else {
                    const product = products.find(p => p.variants?.some(v => v.id === item.variantId));
                    if (product) {
                        const variant = product.variants?.find(v => v.id === item.variantId) ?? product.variants?.[0];
                        newCart.push({ ...product, quantity: item.quantity, selectedVariant: variant });
                    }
                }
            }

            loadCart(newCart);
            toast({ title: 'Build Guide loaded', description: 'Items added to your cart.' });
            setCartOpen(true);
        } catch (err) {
            console.error('Failed to load build guide:', err);
            toast({ title: 'Error', description: 'Could not load Build Guide', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [buildGuides, products, loadCart, setCartOpen, toast]);

    const deleteBuild = useCallback(async (buildId: string) => {
        try {
            const res = await fetch(`${getBaseUrl()}/api/build-guides/${buildId}`, { method: 'DELETE' });
            if (res.ok) {
                toast({ title: 'Build Guide deleted' });
                await refreshBuildGuides();
            }
        } catch (err) {
            console.error('Failed to delete build guide:', err);
        }
    }, [refreshBuildGuides, toast]);

    const toggleBuildMode = useCallback(() => setIsBuildMode(prev => !prev), []);

    const generateShareLink = useCallback((): string => {
        if (cart.length === 0) return '';
        try {
            const minimalCart = cart.map(item => [
                item.selectedVariant?.id ?? item.variants?.[0]?.id,
                item.quantity,
            ]);
            const encoded = btoa(encodeURIComponent(JSON.stringify(minimalCart)))
                .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
            const url = new URL(`${getBaseUrl()}/builds`);
            url.searchParams.set('share', encoded);
            return url.toString();
        } catch (err) {
            console.error('Error generating share link:', err);
            return '';
        }
    }, [cart]);

    const loadBuildFromBase64 = useCallback(async (base64Str: string) => {
        setIsLoading(true);
        try {
            const padded = base64Str.replace(/-/g, '+').replace(/_/g, '/');
            const decoded = decodeURIComponent(atob(padded));
            if (!decoded) throw new Error('Invalid share string');

            const itemsToLoad: [string, number][] = JSON.parse(decoded);
            const newCart: any[] = [];

            for (const [variantId, quantity] of itemsToLoad) {
                const product = products.find(p => p.variants?.some(v => v.id === variantId));
                if (product) {
                    const variant = product.variants?.find(v => v.id === variantId) ?? product.variants?.[0];
                    newCart.push({ ...product, quantity, selectedVariant: variant });
                }
            }

            if (newCart.length > 0) {
                loadCart(newCart);
                toast({ title: 'Shared build loaded', description: `${newCart.length} items added to your cart.` });
                setCartOpen(true);
                setIsBuildMode(true);
            } else {
                toast({ title: 'Could not load shared build', description: 'Products may be unavailable', variant: 'destructive' });
            }
        } catch (err) {
            console.error('Failed to load shared build', err);
            toast({ title: 'Error loading build', description: 'The link appears to be invalid or broken.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [products, loadCart, setCartOpen, toast]);

    // ── Context value — only rebuilds when a dep actually changes ─────────────

    const value = useMemo<BuildContextType>(() => ({
        buildGuides,
        refreshBuildGuides,
        saveCurrentBuild,
        loadBuild,
        deleteBuild,
        generateShareLink,
        loadBuildFromBase64,
        compatibilityReport: liveCompatReport,
        isBuildMode,
        toggleBuildMode,
        isLoading,
    }), [
        buildGuides,
        refreshBuildGuides,
        saveCurrentBuild,
        loadBuild,
        deleteBuild,
        generateShareLink,
        loadBuildFromBase64,
        liveCompatReport,
        isBuildMode,
        toggleBuildMode,
        isLoading,
    ]);

    return (
        <BuildContext.Provider value={value}>
            {children}
        </BuildContext.Provider>
    );
};

// ── useBuild ──────────────────────────────────────────────────────────────────

export const useBuild = (): BuildContextType => {
    const context = useContext(BuildContext);
    if (context === undefined) {
        throw new Error('useBuild must be used within a BuildProvider');
    }
    return context;
};