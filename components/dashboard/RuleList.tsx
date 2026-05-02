"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Filter,
  Edit,
  Trash2,
  Power,
  PowerOff,
  MoreHorizontal,
  RefreshCw,
  Bug,
} from "lucide-react";

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

  // Apply filters
  const filteredRules = useMemo(() => {
    let filtered = rules;

    if (filterType !== "all") {
      filtered = filtered.filter(rule => rule.type === filterType);
    }

    if (filterSeverity !== "all") {
      filtered = filtered.filter(rule => rule.severity === filterSeverity);
    }

    if (filterEnabled !== "all") {
      const isEnabled = filterEnabled === "enabled";
      filtered = filtered.filter(rule => rule.enabled === isEnabled);
    }

    return filtered;
  }, [rules, filterType, filterSeverity, filterEnabled]);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "ERROR":
        return <Badge variant="destructive">Error</Badge>;
      case "WARNING":
        return <Badge variant="secondary">Warning</Badge>;
      case "INFO":
        return <Badge variant="outline">Info</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "PAIR":
        return <Badge variant="default">Pair</Badge>;
      case "COMPONENT":
        return <Badge className="bg-blue-100 text-blue-800">Component</Badge>;
      case "GLOBAL":
        return <Badge className="bg-purple-100 text-purple-800">Global</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Compatibility Rules</CardTitle>
          <Button onClick={onRefresh} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search rules..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">All Types</option>
              <option value="PAIR">Pair</option>
              <option value="COMPONENT">Component</option>
              <option value="GLOBAL">Global</option>
            </select>
            
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">All Severities</option>
              <option value="ERROR">Error</option>
              <option value="WARNING">Warning</option>
              <option value="INFO">Info</option>
            </select>
            
            <select
              value={filterEnabled}
              onChange={(e) => setFilterEnabled(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">All Status</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading rules...</span>
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {rules.length === 0 ? "No rules found. Create your first rule to get started." : "No rules match your filters."}
          </div>
        ) : (
          <ScrollArea className="h-[600px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{rule.name}</div>
                        {rule.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {rule.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(rule.type)}</TableCell>
                    <TableCell>{getSeverityBadge(rule.severity)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{rule.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggle(rule.id, !rule.enabled)}
                        className="h-8 w-8 p-0"
                      >
                        {rule.enabled ? (
                          <Power className="h-4 w-4 text-green-600" />
                        ) : (
                          <PowerOff className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      {rule.scope ? (
                        <div className="text-sm">
                          <div>{rule.scope.sourceSubCategory.name}</div>
                          <div className="text-muted-foreground">→ {rule.scope.targetSubCategory.name}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(rule.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(rule)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Bug className="mr-2 h-4 w-4" />
                            Debug
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(rule.id)}
                            className="text-destructive"
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
      </CardContent>
    </Card>
  );
};

export default RuleList;
