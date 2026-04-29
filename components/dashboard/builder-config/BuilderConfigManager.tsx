'use client';

import React, { useState, memo } from 'react';
import { Settings, Layers, Sparkles, Filter } from 'lucide-react';
import BuilderSettingsTab from './BuilderSettingsTab';
import BuilderCategoriesTab from './BuilderCategoriesTab';
import BuilderRulesTab from './BuilderRulesTab';
import BuilderFiltersTab from './BuilderFiltersTab';

const TABS = [
  { key: 'settings', label: 'Builder Settings', icon: Settings },
  { key: 'categories', label: 'Categories', icon: Layers },
  { key: 'rules', label: 'Rules Engine', icon: Sparkles },
  { key: 'filters', label: 'Filter Manager', icon: Filter },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const BuilderConfigManager = memo(function BuilderConfigManager() {
  const [activeTab, setActiveTab] = useState<TabKey>('settings');

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Builder Configuration</h2>
        <p className="text-sm text-zinc-400 mt-1">Manage PC builder categories, behavior, UI rules, and filters — all from one place.</p>
      </div>

      <div className="flex gap-1 p-1 bg-zinc-100/80 rounded-xl w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'settings' && <BuilderSettingsTab />}
        {activeTab === 'categories' && <BuilderCategoriesTab />}
        {activeTab === 'rules' && <BuilderRulesTab />}
        {activeTab === 'filters' && <BuilderFiltersTab />}
      </div>
    </div>
  );
});

export default BuilderConfigManager;
