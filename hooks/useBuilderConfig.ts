'use client';

/**
 * useBuilderConfig — Client-side hook for fetching and caching builder configuration.
 *
 * Replaces hardcoded CORE_CATEGORIES, CAT_ICONS, CAT_DESCRIPTIONS, etc.
 * Fetches from API on mount, caches in memory + sessionStorage for performance.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  BuilderSettings,
  BuilderCategoryConfig,
  BuilderUIRule,
  SubCategory,
} from '@/types';
import { DEFAULT_BUILDER_SETTINGS } from '@/types';

const CACHE_KEY_CONFIG = 'builder_config_cache';
const CACHE_KEY_CATEGORIES = 'builder_categories_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function getSessionCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      sessionStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function setSessionCache<T>(key: string, data: T) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // Storage full — ignore
  }
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
}

export interface UseBuilderConfigReturn {
  /** Global builder settings */
  settings: BuilderSettings;
  /** All category configs, ordered by displayOrder */
  categories: BuilderCategoryConfig[];
  /** Core categories only (isCore=true, enabled=true) */
  coreCategories: BuilderCategoryConfig[];
  /** UI rules */
  rules: BuilderUIRule[];
  /** Category display order (array of category names) */
  categoryOrder: string[];
  /** Map of category name → config for O(1) lookup */
  categoryMap: Map<string, BuilderCategoryConfig>;
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Force refetch all config */
  refresh: () => Promise<void>;
}

export function useBuilderConfig(): UseBuilderConfigReturn {
  const [settings, setSettings] = useState<BuilderSettings>(DEFAULT_BUILDER_SETTINGS);
  const [categories, setCategories] = useState<BuilderCategoryConfig[]>([]);
  const [rules, setRules] = useState<BuilderUIRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Check session cache first
      const cachedConfig = getSessionCache<BuilderSettings>(CACHE_KEY_CONFIG);
      const cachedCategories = getSessionCache<BuilderCategoryConfig[]>(CACHE_KEY_CATEGORIES);

      if (cachedConfig && cachedCategories) {
        setSettings(cachedConfig);
        setCategories(cachedCategories);
        setLoading(false);
        // Still fetch fresh in background
        fetchFresh();
        return;
      }

      await fetchFresh();
    } catch (err) {
      console.error('[useBuilderConfig] error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load config');
      setLoading(false);
    }
  }, []);

  const fetchFresh = useCallback(async () => {
    try {
      const [configRes, categoriesRes, rulesRes] = await Promise.allSettled([
        fetchJSON<{ settings: BuilderSettings }>('/api/admin/builder-config'),
        fetchJSON<SubCategory[]>('/api/catalog/subcategories'),
        fetchJSON<BuilderUIRule[]>('/api/admin/builder-rules'),
      ]);

      if (configRes.status === 'fulfilled' && configRes.value?.settings) {
        const s = { ...DEFAULT_BUILDER_SETTINGS, ...configRes.value.settings };
        setSettings(s);
        setSessionCache(CACHE_KEY_CONFIG, s);
      }

      if (categoriesRes.status === 'fulfilled' && Array.isArray(categoriesRes.value)) {
        const mappedCategories: BuilderCategoryConfig[] = categoriesRes.value
          .filter(sub => sub.isBuilderEnabled)
          .map(sub => ({
            id: sub.id,
            categoryName: sub.name,
            enabled: sub.isBuilderEnabled ?? false,
            isCore: sub.isCore ?? false,
            required: sub.isRequired ?? false,
            allowMultiple: sub.allowMultiple ?? false,
            displayOrder: sub.builderOrder ?? 0,
            icon: sub.icon ?? null,
            shortLabel: sub.shortLabel ?? null,
            description: sub.description ?? null,
            createdAt: sub.createdAt,
            updatedAt: sub.updatedAt,
          }))
          .sort((a, b) => a.displayOrder - b.displayOrder);

        setCategories(mappedCategories);
        setSessionCache(CACHE_KEY_CATEGORIES, mappedCategories);
      }

      if (rulesRes.status === 'fulfilled' && Array.isArray(rulesRes.value)) {
        setRules(rulesRes.value);
      }
    } catch (err) {
      console.error('[useBuilderConfig] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const coreCategories = useMemo(
    () => categories.filter((c) => c.isCore && c.enabled),
    [categories]
  );

  const categoryOrder = useMemo(
    () => categories.filter((c) => c.enabled).map((c) => c.categoryName),
    [categories]
  );

  const categoryMap = useMemo(() => {
    const map = new Map<string, BuilderCategoryConfig>();
    categories.forEach((c) => map.set(c.categoryName, c));
    return map;
  }, [categories]);

  return {
    settings,
    categories,
    coreCategories,
    rules,
    categoryOrder,
    categoryMap,
    loading,
    error,
    refresh: fetchConfig,
  };
}
