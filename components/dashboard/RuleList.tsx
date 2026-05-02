"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Edit,
  Trash2,
  Power,
  PowerOff,
  MoreHorizontal,
  RefreshCw,
  Bug,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface RuleListProps {
  rules: CompatibilityRule[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onEdit: (rule: CompatibilityRule) => void;
  onDelete: (ruleId: string) => void;
  onToggle: (ruleId: string, enabled: boolean) => void;
  onRefresh: () => void;
}

const RuleList: React.FC<RuleListProps> = ({
  rules,
  loading,
  searchQuery,
  onSearchChange,
  onEdit,
  onDelete,
  onToggle,
  onRefresh,
}) => {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterEnabled, setFilterEnabled] = useState<string>("all");

  const filteredRules = useMemo(() => {
    let filtered = rules;

    if (filterType !== "all") {
      filtered = filtered.filter((rule) => rule.type === filterType);
    }
    if (filterSeverity !== "all") {
      filtered = filtered.filter((rule) => rule.severity === filterSeverity);
    }
    if (filterEnabled !== "all") {
      const isEnabled = filterEnabled === "enabled";
      filtered = filtered.filter((rule) => rule.enabled === isEnabled);
    }

    return filtered;
  }, [rules, filterType, filterSeverity, filterEnabled]);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "ERROR":
        return <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">Error</span>;
      case "WARNING":
        return <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Warning</span>;
      case "INFO":
        return <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">Info</span>;
      default:
        return <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">{severity}</span>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "PAIR":
        return <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">Pair</span>;
      case "COMPONENT":
        return <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">Component</span>;
      case "GLOBAL":
        return <span className="rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">Global</span>;
      default:
        return <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">{type}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Configured Rules</h3>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search rules..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-10 rounded-md border-slate-200 pl-9 text-sm focus-visible:ring-slate-400"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="all">All Types</option>
              <option value="PAIR">Pair</option>
              <option value="COMPONENT">Component</option>
              <option value="GLOBAL">Global</option>
            </select>

            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="all">All Severities</option>
              <option value="ERROR">Error</option>
              <option value="WARNING">Warning</option>
              <option value="INFO">Info</option>
            </select>

            <select
              value={filterEnabled}
              onChange={(e) => setFilterEnabled(e.target.value)}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="all">All Status</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
            <span className="text-sm">Loading rules...</span>
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">
            {rules.length === 0
              ? "No rules found. Create your first rule to get started."
              : "No rules match your filters."}
          </div>
        ) : (
          <ScrollArea className="h-[600px] w-full">
            <Table className="w-full text-left text-sm text-slate-600">
              <TableHeader className="bg-slate-50/50 text-xs text-slate-500">
                <TableRow className="border-b border-slate-200">
                  <TableHead className="px-5 py-3 font-medium">Name</TableHead>
                  <TableHead className="px-5 py-3 font-medium">Type</TableHead>
                  <TableHead className="px-5 py-3 font-medium">Severity</TableHead>
                  <TableHead className="px-5 py-3 font-medium">Priority</TableHead>
                  <TableHead className="px-5 py-3 font-medium">Status</TableHead>
                  <TableHead className="px-5 py-3 font-medium">Scope</TableHead>
                  <TableHead className="px-5 py-3 font-medium">Updated</TableHead>
                  <TableHead className="px-5 py-3 text-right font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {filteredRules.map((rule) => (
                  <TableRow key={rule.id} className="transition-colors hover:bg-slate-50/50 border-0">
                    <TableCell className="px-5 py-3">
                      <div>
                        <div className="font-medium text-slate-900">{rule.name}</div>
                        {rule.description && (
                          <div className="mt-0.5 truncate text-xs text-slate-500 max-w-[200px]" title={rule.description}>
                            {rule.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-3">{getTypeBadge(rule.type)}</TableCell>
                    <TableCell className="px-5 py-3">{getSeverityBadge(rule.severity)}</TableCell>
                    <TableCell className="px-5 py-3">
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs text-slate-600">
                        {rule.priority}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      <button
                        onClick={() => onToggle(rule.id, !rule.enabled)}
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-md border transition-colors",
                          rule.enabled
                            ? "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            : "border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100"
                        )}
                        title={rule.enabled ? "Disable Rule" : "Enable Rule"}
                      >
                        {rule.enabled ? <Power size={14} /> : <PowerOff size={14} />}
                      </button>
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      {rule.scope ? (
                        <div className="text-xs">
                          <div className="font-medium text-slate-700">{rule.scope.sourceSubCategory.name}</div>
                          <div className="text-slate-400">→ {rule.scope.targetSubCategory.name}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-xs text-slate-500">
                      {formatDate(rule.updatedAt)}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                            <MoreHorizontal size={14} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-md border-slate-200">
                          <DropdownMenuItem onClick={() => onEdit(rule)} className="text-sm cursor-pointer">
                            <Edit className="mr-2 h-4 w-4 text-slate-400" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-sm cursor-pointer">
                            <Bug className="mr-2 h-4 w-4 text-slate-400" />
                            Debug
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-100" />
                          <DropdownMenuItem
                            onClick={() => onDelete(rule.id)}
                            className="text-sm text-rose-600 cursor-pointer focus:bg-rose-50 focus:text-rose-700"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default RuleList;