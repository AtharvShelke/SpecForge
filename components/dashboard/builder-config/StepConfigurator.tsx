'use client';

import { useCallback, useEffect, useState } from 'react';
import { 
  GripVertical, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  RefreshCw,
  Search,
  Box
} from 'lucide-react';
import { Category, BuildSequenceItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const StepConfigurator = () => {
  const { toast } = useToast();
  const [steps, setSteps] = useState<BuildSequenceItem[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [stepsRes, catsRes] = await Promise.all([
        fetch('/api/categories/build-sequence'),
        fetch('/api/categories?includeInactive=true')
      ]);

      if (!stepsRes.ok || !catsRes.ok) throw new Error('Failed to load data');

      setSteps(await stepsRes.json());
      setAllCategories(await catsRes.json());
    } catch (error) {
      console.error(error);
      toast({ title: 'Load failed', description: 'Could not fetch builder steps.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleReorder = async (categoryIds: number[]) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/categories/build-sequence', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryIds }),
      });

      if (!response.ok) throw new Error('Failed to save order');
      
      const updated = await response.json();
      setSteps(updated);
      toast({ title: 'Order saved' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSteps.length) return;

    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    const categoryIds = newSteps.map(s => s.categoryId);
    handleReorder(categoryIds);
  };

  const removeStep = async (categoryId: number) => {
    if (!confirm('Are you sure you want to remove this category from the builder?')) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/categories/build-sequence?categoryId=${categoryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove step');
      
      const updated = await response.json();
      setSteps(updated);
      toast({ title: 'Step removed' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Delete failed', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const addStep = async (categoryId: number) => {
    const categoryIds = [...steps.map(s => s.categoryId), categoryId];
    await handleReorder(categoryIds);
    setShowAddDialog(false);
  };

  const availableCategories = allCategories.filter(
    cat => !steps.some(step => step.categoryId === cat.id) &&
    (cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     cat.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3 text-stone-400">
        <RefreshCw size={24} className="animate-spin text-indigo-500" />
        <span className="text-sm font-medium">Loading steps…</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-stone-900">Builder Sequence</h3>
          <p className="text-xs text-stone-500">Categories will appear in the PC builder in this exact order.</p>
        </div>
        <button
          onClick={() => setShowAddDialog(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Add Step
        </button>
      </div>

      <div className="space-y-2">
        {steps.length === 0 ? (
          <div className="border-2 border-dashed border-stone-100 rounded-3xl p-12 text-center">
            <Box className="mx-auto text-stone-200 mb-3" size={40} />
            <p className="text-sm text-stone-400">No steps configured yet.</p>
          </div>
        ) : (
          steps.map((step, index) => (
            <div 
              key={step.id}
              className={cn(
                "group flex items-center gap-4 p-3 bg-white border border-stone-100 rounded-2xl transition-all hover:border-indigo-200 hover:shadow-sm",
                isSaving && "opacity-50 pointer-events-none"
              )}
            >
              <div className="flex flex-col gap-0.5">
                <button 
                  disabled={index === 0}
                  onClick={() => moveStep(index, 'up')}
                  className="p-1 text-stone-300 hover:text-indigo-600 disabled:opacity-0"
                >
                  <ChevronUp size={14} />
                </button>
                <button 
                  disabled={index === steps.length - 1}
                  onClick={() => moveStep(index, 'down')}
                  className="p-1 text-stone-300 hover:text-indigo-600 disabled:opacity-0"
                >
                  <ChevronDown size={14} />
                </button>
              </div>

              <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-stone-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                <span className="text-xs font-bold">{index + 1}</span>
              </div>

              <div className="flex-1">
                <h4 className="text-sm font-bold text-stone-800">{step.category?.name || step.category?.label}</h4>
                <p className="text-[10px] text-stone-400 font-mono uppercase tracking-wider">{step.category?.code}</p>
              </div>

              <button 
                onClick={() => removeStep(step.categoryId)}
                className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Step Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-100 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-stone-50 flex items-center justify-between bg-stone-50/50">
              <h3 className="font-bold text-stone-900">Add Step to Builder</h3>
              <button onClick={() => setShowAddDialog(false)} className="text-stone-400 hover:text-stone-600">
                <Plus className="rotate-45" size={20} />
              </button>
            </div>
            
            <div className="p-4 border-b border-stone-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
                <input 
                  autoFocus
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-stone-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {availableCategories.length === 0 ? (
                <div className="py-12 text-center text-stone-400 text-sm">
                  No matching categories found.
                </div>
              ) : (
                availableCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => addStep(cat.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-indigo-50 transition-colors group text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white border border-stone-100 flex items-center justify-center text-stone-400 group-hover:text-indigo-600 group-hover:border-indigo-100">
                      <Box size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-800">{cat.name}</p>
                      <p className="text-[10px] text-stone-400 uppercase tracking-widest">{cat.code}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepConfigurator;
