"use client";

import { useState, useCallback, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Settings, Play, Bug, Search, Filter } from "lucide-react";

// Import components (we'll create these next)
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

  // Fetch rules from API
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

  // Filter rules based on search query
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

  // Handle rule creation/editing
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

  // Handle rule deletion
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

  // Handle rule toggle
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

  // Stats for overview
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compatibility Rules</h1>
          <p className="text-muted-foreground">
            Manage dynamic compatibility rules for PC builds
          </p>
        </div>
        <Button onClick={handleCreateRule} className="gap-2">
          <Plus className="h-4 w-4" />
          New Rule
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enabled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rules</CardTitle>
            <Badge variant="destructive" className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.errors}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warning Rules</CardTitle>
            <Badge variant="secondary" className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.warnings}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="sandbox">Sandbox</TabsTrigger>
          <TabsTrigger value="derived-specs">Derived Specs</TabsTrigger>
          <TabsTrigger value="debug">Debug</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
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

        <TabsContent value="sandbox" className="space-y-4">
          <RuleSandbox rules={rules} />
        </TabsContent>

        <TabsContent value="derived-specs" className="space-y-4">
          <DerivedSpecManager />
        </TabsContent>

        <TabsContent value="debug" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Rule Debugger
              </CardTitle>
              <CardDescription>
                Debug individual rules with step-by-step evaluation traces
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Select a rule from the Rules tab and click "Debug" to see detailed evaluation traces.
              </p>
            </CardContent>
          </Card>
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
