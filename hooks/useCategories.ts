'use client';

import { useEffect, useMemo, useState } from 'react';
import { buildCategoryMap, getCategoryDescription, getCategoryLabel, getCategoryShortLabel } from '@/lib/categories';
import { CategoryDefinition } from '@/types';

export function useCategories() {
  const [categories, setCategories] = useState<CategoryDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        if (!cancelled) {
          setCategories(data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryMap = useMemo(() => buildCategoryMap(categories), [categories]);

  return {
    categories,
    categoryMap,
    loading,
    getLabel: (code: string) => getCategoryLabel(categoryMap, code),
    getShortLabel: (code: string) => getCategoryShortLabel(categoryMap, code),
    getDescription: (code: string) => getCategoryDescription(categoryMap, code),
  };
}
