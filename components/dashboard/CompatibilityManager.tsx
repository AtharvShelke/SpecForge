"use client";

import { useState, useCallback, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Settings, Play, Bug, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Import components
import RuleList from "./RuleList";
import RuleEditor from "./RuleEditor";
import DerivedSpecManager from "./DerivedSpecManager";
import RuleSandbox from "./RuleSandbox";

interface CompatibilityRule {
  id: string;
  name: string;
  description?: string;
  type: "PAIR" | "COMPONENT" | "GLOBAL";
  enabled: boolean;
  priority: number;
  severity: "ERROR" | "WARNING" | "INFO";
  scopeId?: string;
  sourceSpecId?: string;
  targetSpecId?: string;
  operator?: string;
  message: string;
  messageTemplate?: string;
  logic?: any;
  createdAt: string;
  updatedAt: string;
  scope?: {
    id: string;
    sourceSubCategory: { name: string };
    targetSubCategory: { name: string };
  };
  sourceSpec?: { name: string };
  targetSpec?: { name: string };
}

interface CompatibilityManagerProps {}

const CompatibilityManager: React.FC<CompatibilityManagerProps> = () => {
  const [activeTab, setActiveTab] = useState("rules");
  const [rules, setRules] = useState<CompatibilityRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRule, setSelectedRule] = useState<CompatibilityRule | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/compatibility/rules");
      if (response.ok) {
        const data = await response.json();
        setRules(data);
      }
    } catch (error) {
      console.error("Failed to fetch rules:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredRules = useMemo(() => {
    if (!searchQuery) return rules;
    
    const query = searchQuery.toLowerCase();
    return rules.filter(
      (rule) =>
        rule.name.toLowerCase().includes(query) ||
        rule.description?.toLowerCase().includes(query) ||
        rule.type.toLowerCase().includes(query) ||
        rule.severity.toLowerCase().includes(query)
    );
  }, [rules, searchQuery]);

  const handleCreateRule = useCallback(() => {
    setSelectedRule(null);
    setIsEditorOpen(true);
  }, []);

  const handleEditRule = useCallback((rule: CompatibilityRule) => {
    setSelectedRule(rule);
    setIsEditorOpen(true);
  }, []);

  const handleSaveRule = useCallback(async (ruleData: Partial<CompatibilityRule>) => {
    try {
      const url = selectedRule 
        ? `/api/compatibility/rules/${selectedRule.id}`
        : "/api/compatibility/rules";
      
      const method = selectedRule ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ruleData),
      });

      if (response.ok) {
        await fetchRules();
        setIsEditorOpen(false);
        setSelectedRule(null);
      }
    } catch (error) {
      console.error("Failed to save rule:", error);
    }
  }, [selectedRule, fetchRules]);

  const handleDeleteRule = useCallback(async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;
    
    try {
      const response = await fetch(`/api/compatibility/rules/${ruleId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        await fetchRules();
      }
    } catch (error) {
      console.error("Failed to delete rule:", error);
    }
  }, [fetchRules]);

  const handleToggleRule = useCallback(async (ruleId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/compatibility/rules/${ruleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      
      if (response.ok) {
        await fetchRules();
      }
    } catch (error) {
      console.error("Failed to toggle rule:", error);
    }
  }, [fetchRules]);

  const stats = useMemo(() => {
    const total = rules.length;
    const enabled = rules.filter(r => r.enabled).length;
    const errors = rules.filter(r => r.severity === "ERROR").length;
    const warnings = rules.filter(r => r.severity === "WARNING").length;
    
    return { total, enabled, errors, warnings };
  }, [rules]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Compatibility Rules</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage dynamic compatibility rules and constraints for PC builds.
          </p>
        </div>
        <button 
          onClick={handleCreateRule} 
          className="flex h-9 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
        >
          <Plus size={14} />
          New Rule
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Rules", value: stats.total, icon: <Settings size={16} />, color: "text-slate-500", bg: "bg-slate-50" },
          { label: "Active Rules", value: stats.enabled, icon: <Play size={16} />, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Error Rules", value: stats.errors, icon: <XCircle size={16} />, color: "text-rose-600", bg: "bg-rose-50" },
          { label: "Warning Rules", value: stats.warnings, icon: <AlertTriangle size={16} />, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((stat, idx) => (
          <div key={idx} className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="mt-1.5 text-2xl font-semibold text-slate-900">{stat.value}</p>
              </div>
              <div className={cn("rounded-md p-2", stat.bg, stat.color)}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex w-full sm:w-auto h-auto flex-wrap rounded-md border border-slate-200 bg-slate-50 p-1">
          {[
            { value: "rules", label: "Rules" },
            { value: "sandbox", label: "Sandbox" },
            { value: "derived-specs", label: "Derived Specs" },
            { value: "debug", label: "Debug" },
          ].map((tab) => (
            <TabsTrigger 
              key={tab.value}
              value={tab.value}
              className="rounded-sm px-4 py-1.5 text-sm font-medium text-slate-500 transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-slate-200"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="rules" className="mt-0">
          <RuleList
            rules={filteredRules}
            loading={loading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onEdit={handleEditRule}
            onDelete={handleDeleteRule}
            onToggle={handleToggleRule}
            onRefresh={fetchRules}
          />
        </TabsContent>

        <TabsContent value="sandbox" className="mt-0">
          <RuleSandbox rules={rules} />
        </TabsContent>

        <TabsContent value="derived-specs" className="mt-0">
          <DerivedSpecManager />
        </TabsContent>

        <TabsContent value="debug" className="mt-0">
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-white px-5 py-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                <Bug size={16} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Rule Debugger</h3>
                <p className="text-xs text-slate-500">Debug individual rules with step-by-step evaluation traces.</p>
              </div>
            </div>
            <div className="p-8 text-center text-sm text-slate-500">
              Select a rule from the Rules tab and click "Debug" to see detailed evaluation traces.
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Rule Editor Modal */}
      {isEditorOpen && (
        <RuleEditor
          rule={selectedRule}
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setSelectedRule(null);
          }}
          onSave={handleSaveRule}
        />
      )}
    </div>
  );
};

export default CompatibilityManager;