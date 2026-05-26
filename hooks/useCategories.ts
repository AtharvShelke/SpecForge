<<<<<<< HEAD
"use client";

import { useEffect, useState } from "react";

export interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
}

export interface SubCategory {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  isBuilderEnabled?: boolean;
  isCore?: boolean;
  isRequired?: boolean;
  allowMultiple?: boolean;
  builderOrder?: number;
  icon?: string | null;
  shortLabel?: string | null;
  category?: {
    id: string;
    name: string;
  };
  subCategorySlots?: Array<{
    slotId: string;
    slot?: {
      id: string;
      name: string;
    };
  }>;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        const response = await fetch("/api/categories");
        
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }
        
        const data = await response.json();
        setCategories(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        
        // Fallback to static categories if API fails
        setCategories([
          { id: "1", name: "Processor", slug: "processor" },
          { id: "2", name: "Motherboard", slug: "motherboard" },
          { id: "3", name: "RAM", slug: "ram" },
          { id: "4", name: "Graphics Card", slug: "graphics-card" },
          { id: "5", name: "Storage", slug: "storage" },
          { id: "6", name: "Power Supply", slug: "power-supply" },
          { id: "7", name: "Cabinet", slug: "cabinet" },
          { id: "8", name: "Cooler", slug: "cooler" },
          { id: "9", name: "Monitor", slug: "monitor" },
          { id: "10", name: "Peripheral", slug: "peripheral" },
          { id: "11", name: "Networking", slug: "networking" },
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  return { categories, loading, error };
}

export function useBuilderCategories() {
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBuilderCategories() {
      try {
        setLoading(true);
        const response = await fetch("/api/catalog/subcategories?builderEnabled=true");
        
        if (!response.ok) {
          throw new Error("Failed to fetch builder categories");
        }
        
        const data = await response.json();
        setSubCategories(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch builder categories:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchBuilderCategories();
  }, []);

  return { subCategories, loading, error };
=======
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
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
}
