'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  Settings,
  ChevronRight,
  PlusCircle,
  X
} from 'lucide-react';
import { Category, CategoryAttributeDefinition, CompatibilityLevel } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface RuleClause {
  id?: string;
  sourceAttributeId: string;
  targetAttributeId: string;
  operator: string;
  sourceValue?: string | null;
  targetValue?: string | null;
  sortOrder: number;
}

interface CompatibilityRule {
  id: string;
  name: string;
  message?: string | null;
  severity: 'COMPATIBLE' | 'WARNING' | 'INCOMPATIBLE';
  sourceCategoryId: number;
  targetCategoryId: number;
  isActive: boolean;
  sortOrder: number;
  clauses: RuleClause[];
  sourceCategory?: Category;
  targetCategory?: Category;
}

const OPERATORS = [
  { value: 'EQUALS', label: 'Equals' },
  { value: 'NOT_EQUALS', label: 'Not Equals' },
  { value: 'CONTAINS', label: 'Contains' },
  { value: 'IN', label: 'In' },
  { value: 'GREATER_THAN', label: 'Greater Than' },
  { value: 'LESS_THAN', label: 'Less Than' },
  { value: 'MATCHES_REGEX', label: 'Matches Regex' },
];

const RuleManager = () => {
  const { toast } = useToast();
  const [rules, setRules] = useState<CompatibilityRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<CompatibilityRule> | null>(null);
  const [attributesCache, setAttributesCache] = useState<Record<number, CategoryAttributeDefinition[]>>({});

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rulesRes, catsRes] = await Promise.all([
        fetch('/api/compatibility-rules'),
        fetch('/api/categories?includeInactive=true')
      ]);

      if (!rulesRes.ok || !catsRes.ok) throw new Error('Failed to load data');

      setRules(await rulesRes.json());
      setCategories(await catsRes.json());
    } catch (error) {
      console.error(error);
      toast({ title: 'Load failed', description: 'Could not fetch compatibility rules.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadAttributes = async (categoryId: number) => {
    if (attributesCache[categoryId]) return attributesCache[categoryId];
    
    try {
      const category = categories.find(c => c.id === categoryId);
      if (!category) return [];
      
      const res = await fetch(`/api/categories/${category.code}/attributes`);
      if (!res.ok) throw new Error('Failed to load attributes');
      const data = await res.json();
      const attrs = data.attributes || [];
      setAttributesCache(prev => ({ ...prev, [categoryId]: attrs }));
      return attrs;
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const handleEdit = async (rule: CompatibilityRule | null) => {
    if (rule) {
      setEditingRule(rule);
      await Promise.all([
        loadAttributes(rule.sourceCategoryId),
        loadAttributes(rule.targetCategoryId)
      ]);
    } else {
      setEditingRule({
        name: '',
        severity: 'INCOMPATIBLE',
        isActive: true,
        clauses: [],
        sortOrder: 0
      });
    }
  };

  const handleSave = async () => {
    if (!editingRule) return;
    if (!editingRule.name || !editingRule.sourceCategoryId || !editingRule.targetCategoryId) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const isNew = !editingRule.id;
      const url = isNew ? '/api/compatibility-rules' : `/api/compatibility-rules/${editingRule.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRule),
      });

      if (!response.ok) throw new Error('Failed to save rule');
      
      await loadData();
      setEditingRule(null);
      toast({ title: isNew ? 'Rule created' : 'Rule updated' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    
    try {
      const response = await fetch(`/api/compatibility-rules/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete rule');
      
      await loadData();
      toast({ title: 'Rule deleted' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  const addClause = () => {
    if (!editingRule) return;
    const newClauses = [...(editingRule.clauses || []), {
      sourceAttributeId: '',
      targetAttributeId: '',
      operator: 'EQUALS',
      sortOrder: (editingRule.clauses?.length || 0)
    }];
    setEditingRule({ ...editingRule, clauses: newClauses });
  };

  const removeClause = (index: number) => {
    if (!editingRule) return;
    const newClauses = [...(editingRule.clauses || [])];
    newClauses.splice(index, 1);
    setEditingRule({ ...editingRule, clauses: newClauses });
  };

  const updateClause = (index: number, data: Partial<RuleClause>) => {
    if (!editingRule) return;
    const newClauses = [...(editingRule.clauses || [])];
    newClauses[index] = { ...newClauses[index], ...data };
    setEditingRule({ ...editingRule, clauses: newClauses });
  };

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3 text-stone-400">
        <RefreshCw size={24} className="animate-spin text-indigo-500" />
        <span className="text-sm font-medium">Loading rules…</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-stone-900">Compatibility Rules</h3>
          <p className="text-xs text-stone-500">Define logic to prevent invalid component combinations.</p>
        </div>
        <button
          onClick={() => handleEdit(null)}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Add Rule
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-stone-100">
              <th className="pb-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest px-2">Rule Name</th>
              <th className="pb-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest px-2">Source</th>
              <th className="pb-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest px-2">Target</th>
              <th className="pb-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest px-2 text-center">Severity</th>
              <th className="pb-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest px-2 text-center">Clauses</th>
              <th className="pb-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest px-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {rules.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-stone-400 text-sm">
                  No compatibility rules found.
                </td>
              </tr>
            ) : (
              rules.map(rule => (
                <tr key={rule.id} className="hover:bg-stone-50/50 transition-colors group">
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-2">
                      {!rule.isActive && <span className="w-1.5 h-1.5 rounded-full bg-stone-300" title="Inactive" />}
                      <span className="text-sm font-bold text-stone-800">{rule.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <span className="text-xs text-stone-600 font-medium px-2 py-1 bg-stone-100 rounded-lg">{rule.sourceCategory?.name}</span>
                  </td>
                  <td className="py-4 px-2">
                    <span className="text-xs text-stone-600 font-medium px-2 py-1 bg-stone-100 rounded-lg">{rule.targetCategory?.name}</span>
                  </td>
                  <td className="py-4 px-2 text-center">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter",
                      rule.severity === 'INCOMPATIBLE' ? "bg-red-50 text-red-600" :
                      rule.severity === 'WARNING' ? "bg-amber-50 text-amber-600" :
                      "bg-emerald-50 text-emerald-600"
                    )}>
                      {rule.severity}
                    </span>
                  </td>
                  <td className="py-4 px-2 text-center">
                    <span className="text-xs font-mono text-stone-400">{rule.clauses.length}</span>
                  </td>
                  <td className="py-4 px-2 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(rule)}
                        className="p-1.5 text-stone-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(rule.id)}
                        className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Editor Modal */}
      {editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-stone-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-stone-50 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900">{editingRule.id ? 'Edit Rule' : 'New Compatibility Rule'}</h3>
                  <p className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">Rule Configuration</p>
                </div>
              </div>
              <button onClick={() => setEditingRule(null)} className="text-stone-400 hover:text-stone-600 p-2">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Basic Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 block">Rule Name</label>
                  <input 
                    value={editingRule.name || ''}
                    onChange={e => setEditingRule({...editingRule, name: e.target.value})}
                    placeholder="e.g., Socket Compatibility"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 block">Alert Message</label>
                  <textarea 
                    value={editingRule.message || ''}
                    onChange={e => setEditingRule({...editingRule, message: e.target.value})}
                    placeholder="Message shown to user when rule is violated..."
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none min-h-[80px]"
                  />
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 block">Severity</label>
                  <select 
                    value={editingRule.severity}
                    onChange={e => setEditingRule({...editingRule, severity: e.target.value as any})}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-100 rounded-xl text-sm outline-none"
                  >
                    <option value="INCOMPATIBLE">Incompatible (Error)</option>
                    <option value="WARNING">Warning</option>
                    <option value="COMPATIBLE">Compatible (Info)</option>
                  </select>
                </div>
                
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={editingRule.isActive}
                      onChange={e => setEditingRule({...editingRule, isActive: e.target.checked})}
                      className="w-4 h-4 rounded border-stone-200 text-indigo-600 focus:ring-indigo-100"
                    />
                    <span className="text-sm font-semibold text-stone-700">Active Rule</span>
                  </label>
                </div>
              </div>

              <div className="h-px bg-stone-50" />

              {/* Scope */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 block">Source Category (Base)</label>
                  <select 
                    value={editingRule.sourceCategoryId || ''}
                    onChange={e => {
                      const id = Number(e.target.value);
                      setEditingRule({...editingRule, sourceCategoryId: id});
                      loadAttributes(id);
                    }}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-100 rounded-xl text-sm outline-none"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 block">Target Category (Check Against)</label>
                  <select 
                    value={editingRule.targetCategoryId || ''}
                    onChange={e => {
                      const id = Number(e.target.value);
                      setEditingRule({...editingRule, targetCategoryId: id});
                      loadAttributes(id);
                    }}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-100 rounded-xl text-sm outline-none"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="h-px bg-stone-50" />

              {/* Clauses */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-stone-800 flex items-center gap-2">
                    <Settings size={14} className="text-indigo-400" />
                    Logic Clauses
                  </h4>
                  <button 
                    onClick={addClause}
                    disabled={!editingRule.sourceCategoryId || !editingRule.targetCategoryId}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-30"
                  >
                    <PlusCircle size={14} />
                    Add Clause
                  </button>
                </div>

                {!editingRule.sourceCategoryId || !editingRule.targetCategoryId ? (
                  <div className="bg-stone-50 border border-dashed border-stone-200 rounded-2xl p-8 text-center text-stone-400 text-xs">
                    Select source and target categories to start adding logic clauses.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {editingRule.clauses?.length === 0 ? (
                      <p className="text-center text-xs text-stone-400 py-4 italic">No clauses defined. Rule will always trigger if active.</p>
                    ) : (
                      editingRule.clauses?.map((clause, idx) => (
                        <div key={idx} className="flex items-start gap-2 bg-stone-50/50 p-3 rounded-2xl border border-stone-100 group">
                          <div className="flex-1 grid grid-cols-3 gap-2">
                            <div>
                              <select 
                                value={clause.sourceAttributeId}
                                onChange={e => updateClause(idx, { sourceAttributeId: e.target.value })}
                                className="w-full px-3 py-2 bg-white border border-stone-100 rounded-lg text-xs outline-none"
                              >
                                <option value="">Source Attribute</option>
                                {attributesCache[editingRule.sourceCategoryId!]?.map(attr => (
                                  <option key={attr.id} value={attr.id}>{attr.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <select 
                                value={clause.operator}
                                onChange={e => updateClause(idx, { operator: e.target.value })}
                                className="w-full px-3 py-2 bg-white border border-stone-100 rounded-lg text-xs outline-none"
                              >
                                {OPERATORS.map(op => (
                                  <option key={op.value} value={op.value}>{op.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <select 
                                value={clause.targetAttributeId}
                                onChange={e => updateClause(idx, { targetAttributeId: e.target.value })}
                                className="w-full px-3 py-2 bg-white border border-stone-100 rounded-lg text-xs outline-none"
                              >
                                <option value="">Target Attribute</option>
                                {attributesCache[editingRule.targetCategoryId!]?.map(attr => (
                                  <option key={attr.id} value={attr.id}>{attr.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeClause(idx)}
                            className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-stone-100 flex items-center justify-end gap-3 bg-stone-50/30">
              <button 
                onClick={() => setEditingRule(null)}
                className="px-6 py-2 rounded-xl text-sm font-bold text-stone-500 hover:bg-stone-100 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 flex items-center gap-2"
              >
                {isSaving && <RefreshCw size={14} className="animate-spin" />}
                Save Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RuleManager;
