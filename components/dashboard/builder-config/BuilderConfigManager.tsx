"use client";

import { useState, memo } from "react";
import { Settings, Sparkles } from "lucide-react";
import BuilderSettingsTab from "./BuilderSettingsTab";
import BuilderRulesTab from "./BuilderRulesTab";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "settings", label: "Builder Settings", icon: Settings },
  { key: "rules", label: "Rules Engine", icon: Sparkles },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const BuilderConfigManager = memo(function BuilderConfigManager() {
  const [activeTab, setActiveTab] = useState<TabKey>("settings");

  return (
    <div className="flex h-full min-h-0 flex-col space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Builder Configuration
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage PC builder categories, behavior, UI rules, and filters.
          </p>
        </div>
        <div className="flex rounded-md border border-slate-200 bg-slate-50 p-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {activeTab === "settings" && <BuilderSettingsTab />}
        {activeTab === "rules" && <BuilderRulesTab />}
      </div>
    </div>
  );
});

export default BuilderConfigManager;