'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { HelpCircle, Layers3, Network, RefreshCw } from 'lucide-react';
import { Category, CategoryAttributeDefinition, CategoryAttributesConfig, CategoryNode } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { NavigationManager } from '@/components/dashboard/category-manager/NavigationManager';
import { AttributeManager } from '@/components/dashboard/category-manager/AttributeManager';
import { HelpDialog, HelpTopic } from '@/components/dashboard/category-manager/HelpDialog';

type ManagerTab = 'navigation' | 'attributes';

type SerializedNavigationNode = {
  label: string;
  category?: string;
  query?: string;
  brand?: string;
  sortOrder: number;
  children: SerializedNavigationNode[];
};

function serializeTree(nodes: CategoryNode[]): SerializedNavigationNode[] {
  return nodes.map((node, index) => ({
    label: node.label,
    category: typeof node.category === 'string' ? node.category : node.category?.code,
    query: node.query,
    brand: node.brand,
    sortOrder: node.sortOrder ?? index,
    children: serializeTree(node.children ?? []),
  }));
}

const TABS: Array<{ id: ManagerTab; label: string; icon: React.ReactNode }> = [
  { id: 'navigation', label: 'Navigation', icon: <Network size={14} /> },
  { id: 'attributes', label: 'Attributes', icon: <Layers3 size={14} /> },
];

const CategoryManager = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ManagerTab>('navigation');
  const [categories, setCategories] = useState<Category[]>([]);
  const [navigationTree, setNavigationTree] = useState<CategoryNode[]>([]);
  const [selectedCategoryCode, setSelectedCategoryCode] = useState('');
  const [attributesConfig, setAttributesConfig] = useState<CategoryAttributesConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingNavigation, setIsSavingNavigation] = useState(false);
  const [isSavingAttributes, setIsSavingAttributes] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpTopic, setHelpTopic] = useState<HelpTopic>('attributes');

  const loadCategories = useCallback(async () => {
    const response = await fetch('/api/categories?includeInactive=true');
    if (!response.ok) throw new Error('Failed to load categories');
    const data = await response.json();
    setCategories(data);
    setSelectedCategoryCode((current) => current || data[0]?.code || '');
    return data as Category[];
  }, []);

  const loadNavigation = useCallback(async () => {
    const response = await fetch('/api/categories/hierarchy');
    if (!response.ok) throw new Error('Failed to load navigation');
    const data = await response.json();
    setNavigationTree(data);
  }, []);

  const loadAttributes = useCallback(async (categoryCode: string) => {
    if (!categoryCode) {
      setAttributesConfig(null);
      return;
    }

    const response = await fetch(`/api/categories/${categoryCode}/attributes`);
    if (!response.ok) throw new Error('Failed to load attributes');
    const data = await response.json();
    setAttributesConfig(data);
  }, []);

  const refreshAll = useCallback(async (categoryCode?: string) => {
    setIsLoading(true);
    try {
      const categoryList = await loadCategories();
      await Promise.all([loadNavigation(), loadAttributes(categoryCode || selectedCategoryCode || categoryList[0]?.code || '')]);
    } catch (error) {
      console.error(error);
      toast({ title: 'Load failed', description: 'Unable to load category manager data.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [loadAttributes, loadCategories, loadNavigation, selectedCategoryCode, toast]);

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    if (!selectedCategoryCode) return;
    loadAttributes(selectedCategoryCode).catch((error) => {
      console.error(error);
      toast({ title: 'Load failed', description: 'Unable to load category attributes.', variant: 'destructive' });
    });
  }, [loadAttributes, selectedCategoryCode, toast]);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.code === selectedCategoryCode) ?? null,
    [categories, selectedCategoryCode]
  );

  const handleSaveNavigation = useCallback(async (nextTree: CategoryNode[]) => {
    setIsSavingNavigation(true);
    try {
      const response = await fetch('/api/categories/hierarchy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serializeTree(nextTree)),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(JSON.stringify(error));
      }

      toast({ title: 'Navigation updated' });
      await loadNavigation();
    } catch (error) {
      console.error(error);
      toast({ title: 'Save failed', description: 'Unable to save navigation tree.', variant: 'destructive' });
    } finally {
      setIsSavingNavigation(false);
    }
  }, [loadNavigation, toast]);

  const handleSaveAttributes = useCallback(async (attributes: CategoryAttributeDefinition[]) => {
    if (!selectedCategoryCode) return;

    setIsSavingAttributes(true);
    try {
      const response = await fetch(`/api/categories/${selectedCategoryCode}/attributes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attributes }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(JSON.stringify(error));
      }

      const nextConfig = await response.json();
      setAttributesConfig(nextConfig);
      toast({ title: 'Attributes updated' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Save failed', description: 'Unable to save category attributes.', variant: 'destructive' });
    } finally {
      setIsSavingAttributes(false);
    }
  }, [selectedCategoryCode, toast]);

  const openHelp = (topic: HelpTopic) => {
    setHelpTopic(topic);
    setHelpOpen(true);
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 text-stone-500">
          <RefreshCw size={16} className="animate-spin" />
          <span className="text-sm font-semibold">Loading category architecture…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition',
              activeTab === tab.id
                ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'navigation' ? (
        <NavigationManager
          categories={categories}
          tree={navigationTree}
          isSaving={isSavingNavigation}
          onSave={handleSaveNavigation}
          onOpenHelp={() => openHelp('navigation')}
        />
      ) : (
        <AttributeManager
          categories={categories}
          selectedCategoryCode={selectedCategoryCode}
          attributesConfig={attributesConfig}
          isSaving={isSavingAttributes}
          onChangeCategory={setSelectedCategoryCode}
          onSave={handleSaveAttributes}
          onOpenHelp={openHelp}
        />
      )}

      <HelpDialog open={helpOpen} topic={helpTopic} onOpenChange={setHelpOpen} />
    </div>
  );
};

export default CategoryManager;
