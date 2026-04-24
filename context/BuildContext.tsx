'use client';

/**
 * BuildContext — Enterprise-grade PC Build state management.
 *
 * Features:
 *   • Slot-based build system (CPU, GPU, RAM, PSU, etc.)
 *   • Each slot holds one variant (enforced by PartSlot + BuildItem unique constraint)
 *   • Full compatibility engine integration via /api/compatibility/check
 *   • Returns COMPATIBLE / WARNING / INCOMPATIBLE per-check
 *   • O(1) item lookup by slot
 *   • Auto-recheck compatibility on item add/remove
 *   • Build CRUD lifecycle (create, load, list)
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import {
  Build,
  BuildItem,
  BuildGuide,
  CartItem,
  CompatibilityCheck,
  CompatibilitySeverity,
} from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CompatibilityResult {
  buildId: string;
  isCompatible: boolean;
  message?: string;
  checks: CompatibilityCheck[];
  summary?: {
    totalChecks: number;
    passed: number;
    failed: number;
    errors: number;
    warnings: number;
  };
  details?: Array<{
    ruleId: string;
    ruleName: string;
    sourceVariantId: string;
    targetVariantId: string;
    passed: boolean;
    message: string;
    severity: string;
    sourceSpecName: string;
    targetSpecName: string;
    sourceValue: unknown;
    targetValue: unknown;
  }>;
}

export type OverallCompatibilityStatus = 'COMPATIBLE' | 'WARNING' | 'INCOMPATIBLE' | 'UNCHECKED';

interface BuildContextType {
  /** Currently active build */
  build: Build | null;

  /** All builds (list view) */
  builds: Build[];

  /** Pre-defined build guides */
  buildGuides: BuildGuide[];

  /** Latest compatibility result for the active build */
  compatibilityResult: CompatibilityResult | null;

  /** Aggregated compatibility status */
  overallStatus: OverallCompatibilityStatus;

  /** UI build mode flag used by storefront flows */
  isBuildMode: boolean;

  /** Legacy-friendly compatibility summary for build-mode widgets */
  compatibilityReport: {
    status: OverallCompatibilityStatus;
    issues: CompatibilityCheck[];
  };

  /** O(1) item lookup by slotId */
  itemBySlot: Map<string, BuildItem>;

  /** Errors from the compatibility result */
  compatibilityErrors: CompatibilityCheck[];

  /** Warnings from the compatibility result */
  compatibilityWarnings: CompatibilityCheck[];

  // ── Build CRUD ──────────────────────────────────────────────────────
  createBuild: (name?: string) => Promise<void>;
  loadBuild: (id: string) => Promise<void>;
  refreshBuilds: () => Promise<void>;
  refreshBuildGuides: () => Promise<void>;
  updateBuildGuide: (id: string, data: Partial<BuildGuide>) => Promise<BuildGuide>;
  deleteBuildGuide: (id: string) => Promise<void>;
  deleteBuild: (id: string) => Promise<void>;

  // ── BuildItem Management ────────────────────────────────────────────
  addItem: (variantId: string, slotId: string) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;

  // ── Compatibility ───────────────────────────────────────────────────
  checkCompatibility: () => Promise<CompatibilityResult | null>;

  toggleBuildMode: () => void;
  saveCurrentBuild: (payload: {
    title: string;
    items: CartItem[];
    category?: string;
    description?: string;
  }) => Promise<BuildGuide>;
  generateShareLink: () => string | null;

  loading: boolean;
}

const BuildContext = createContext<BuildContextType | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Fetch Utility
// ─────────────────────────────────────────────────────────────────────────────

async function fetchJSON<T = unknown>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { ...options?.headers, 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    let msg = 'Request failed';
    try {
      const errData = await res.json();
      msg = errData.error || errData.message || msg;
    } catch {
      try { msg = await res.text(); } catch {}
    }
    throw new Error(msg);
  }
  // Handle 204 No Content
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export const BuildProvider = ({ children }: { children: ReactNode }) => {
  const [build, setBuild] = useState<Build | null>(null);
  const [builds, setBuilds] = useState<Build[]>([]);
  const [buildGuides, setBuildGuides] = useState<BuildGuide[]>([]);
  const [compatibilityResult, setCompatibilityResult] = useState<CompatibilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isBuildMode, setIsBuildMode] = useState(false);

  // ── O(1) Slot Lookup ────────────────────────────────────────────────

  const itemBySlot = useMemo(() => {
    const map = new Map<string, BuildItem>();
    if (build?.items) {
      build.items.forEach((item: BuildItem) => {
        map.set(item.slotId, item);
      });
    }
    return map;
  }, [build]);

  // ── Compatibility Derived State ─────────────────────────────────────

  const overallStatus = useMemo<OverallCompatibilityStatus>(() => {
    if (!compatibilityResult) return 'UNCHECKED';
    if (compatibilityResult.isCompatible) {
      // Check if there are warnings
      const hasWarnings = compatibilityResult.checks?.some(
        (c) => !c.passed && c.severity === CompatibilitySeverity.WARNING
      );
      return hasWarnings ? 'WARNING' : 'COMPATIBLE';
    }
    return 'INCOMPATIBLE';
  }, [compatibilityResult]);

  const compatibilityErrors = useMemo(() => {
    if (!compatibilityResult?.checks) return [];
    return compatibilityResult.checks.filter(
      (c) => !c.passed && c.severity === CompatibilitySeverity.ERROR
    );
  }, [compatibilityResult]);

  const compatibilityWarnings = useMemo(() => {
    if (!compatibilityResult?.checks) return [];
    return compatibilityResult.checks.filter(
      (c) => !c.passed && c.severity === CompatibilitySeverity.WARNING
    );
  }, [compatibilityResult]);

  const compatibilityReport = useMemo(
    () => ({
      status: overallStatus,
      issues: [...compatibilityErrors, ...compatibilityWarnings],
    }),
    [overallStatus, compatibilityErrors, compatibilityWarnings],
  );

  const toggleBuildMode = useCallback(() => {
    setIsBuildMode((value) => !value);
  }, []);

  const generateShareLink = useCallback(() => {
    if (!build?.id || typeof window === 'undefined') return null;
    return `${window.location.origin}/builds/${build.id}`;
  }, [build?.id]);

  // ── Build CRUD ──────────────────────────────────────────────────────

  const createBuild = useCallback(async (name?: string) => {
    setLoading(true);
    try {
      const data = await fetchJSON<Build>('/api/builds', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      setBuild(data);
      setCompatibilityResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveCurrentBuild = useCallback(async (payload: {
    title: string;
    items: CartItem[];
    category?: string;
    description?: string;
  }) => {
    const items = payload.items
      .filter((item) => item.selectedVariant?.id)
      .map((item) => ({
        variantId: item.selectedVariant!.id,
        quantity: item.quantity,
      }));

    const created = await fetchJSON<BuildGuide>('/api/build-guides', {
      method: 'POST',
      body: JSON.stringify({
        title: payload.title,
        category: payload.category,
        description: payload.description,
        total: payload.items.reduce(
          (sum, item) => sum + (item.selectedVariant?.price || 0) * item.quantity,
          0,
        ),
        items,
      }),
    });

    setBuildGuides((prev) => [created, ...prev]);
    return created;
  }, []);

  const loadBuild = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const data = await fetchJSON<Build>(`/api/builds/${id}`);
      setBuild(data);
      setCompatibilityResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshBuilds = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchJSON<Build[]>('/api/builds');
      setBuilds(data);
    } catch {
      // Silently handle — builds list may not exist yet
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshBuildGuides = useCallback(async () => {
    try {
      const data = await fetchJSON<BuildGuide[]>('/api/build-guides');
      setBuildGuides(data);
    } catch (err) {
      console.error("Failed to fetch build guides", err);
    }
  }, []);

  const updateBuildGuide = useCallback(async (id: string, data: Partial<BuildGuide>) => {
    const updated = await fetchJSON<BuildGuide>(`/api/build-guides/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    setBuildGuides((prev) => prev.map((guide) => guide.id === id ? updated : guide));
    return updated;
  }, []);

  const deleteBuildGuide = useCallback(async (id: string) => {
    await fetchJSON(`/api/build-guides/${id}`, { method: 'DELETE' });
    setBuildGuides((prev) => prev.filter((guide) => guide.id !== id));
  }, []);

  const deleteBuild = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await fetchJSON(`/api/builds/${id}`, { method: 'DELETE' });
      if (build?.id === id) {
        setBuild(null);
        setCompatibilityResult(null);
      }
      setBuilds((prev) => prev.filter((b) => b.id !== id));
    } finally {
      setLoading(false);
    }
  }, [build?.id]);

  // ── BuildItem Management ────────────────────────────────────────────

  const addItem = useCallback(async (variantId: string, slotId: string) => {
    if (!build) return;
    setLoading(true);
    try {
      await fetchJSON(`/api/builds/${build.id}/items`, {
        method: 'POST',
        body: JSON.stringify({ variantId, slotId }),
      });
      // Reload build to get fresh state with variant details
      const refreshed = await fetchJSON<Build>(`/api/builds/${build.id}`);
      setBuild(refreshed);
      // Invalidate previous compatibility result
      setCompatibilityResult(null);
    } finally {
      setLoading(false);
    }
  }, [build]);

  const removeItem = useCallback(async (itemId: string) => {
    if (!build) return;
    setLoading(true);
    try {
      await fetchJSON(`/api/builds/${build.id}/items/${itemId}`, {
        method: 'DELETE',
      });
      // Reload build
      const refreshed = await fetchJSON<Build>(`/api/builds/${build.id}`);
      setBuild(refreshed);
      // Invalidate previous compatibility result
      setCompatibilityResult(null);
    } finally {
      setLoading(false);
    }
  }, [build]);

  // ── Compatibility Check ─────────────────────────────────────────────

  const checkCompatibility = useCallback(async (): Promise<CompatibilityResult | null> => {
    if (!build) return null;
    setLoading(true);
    try {
      const result = await fetchJSON<CompatibilityResult>('/api/compatibility/check', {
        method: 'POST',
        body: JSON.stringify({ buildId: build.id }),
      });
      setCompatibilityResult(result);
      return result;
    } finally {
      setLoading(false);
    }
  }, [build]);

  // ── Initial Load ────────────────────────────────────────────────────

  React.useEffect(() => {
    refreshBuildGuides();
  }, [refreshBuildGuides]);

  // ── Provider Value ──────────────────────────────────────────────────

  const value = useMemo<BuildContextType>(
    () => ({
      build,
      builds,
      buildGuides,
      compatibilityResult,
      overallStatus,
      isBuildMode,
      compatibilityReport,
      itemBySlot,
      compatibilityErrors,
      compatibilityWarnings,
      createBuild,
      loadBuild,
      refreshBuilds,
      refreshBuildGuides,
      updateBuildGuide,
      deleteBuildGuide,
      deleteBuild,
      addItem,
      removeItem,
      checkCompatibility,
      toggleBuildMode,
      saveCurrentBuild,
      generateShareLink,
      loading,
    }),
    [
      build,
      builds,
      buildGuides,
      compatibilityResult,
      overallStatus,
      isBuildMode,
      compatibilityReport,
      itemBySlot,
      compatibilityErrors,
      compatibilityWarnings,
      createBuild,
      loadBuild,
      refreshBuilds,
      refreshBuildGuides,
      updateBuildGuide,
      deleteBuildGuide,
      deleteBuild,
      addItem,
      removeItem,
      checkCompatibility,
      toggleBuildMode,
      saveCurrentBuild,
      generateShareLink,
      loading,
    ]
  );

  return (
    <BuildContext.Provider value={value}>
      {children}
    </BuildContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────

export const useBuild = () => {
  const ctx = useContext(BuildContext);
  if (!ctx) throw new Error('useBuild must be used within BuildProvider');
  return ctx;
};

/** Convenience hook: get the item in a specific slot (O(1) lookup) */
export const useBuildSlot = (slotId: string) => {
  const { itemBySlot } = useBuild();
  return useMemo(() => itemBySlot.get(slotId) ?? null, [itemBySlot, slotId]);
};

/** Convenience hook: get compatibility status without the full result object */
export const useCompatibilityStatus = () => {
  const { overallStatus, compatibilityErrors, compatibilityWarnings } = useBuild();
  return useMemo(
    () => ({ status: overallStatus, errors: compatibilityErrors, warnings: compatibilityWarnings }),
    [overallStatus, compatibilityErrors, compatibilityWarnings]
  );
};
