'use client';

import { useState } from 'react';
import { Hammer, Settings2, ShieldCheck, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import StepConfigurator from './builder-config/StepConfigurator';
import RuleManager from './builder-config/RuleManager';

type ConfigTab = 'steps' | 'rules';

const TABS: Array<{ id: ConfigTab; label: string; icon: React.ReactNode }> = [
  { id: 'steps', label: 'Builder Steps', icon: <Hammer size={14} /> },
  { id: 'rules', label: 'Compatibility Rules', icon: <ShieldCheck size={14} /> },
];

const BuilderConfigManager = () => {
  const [activeTab, setActiveTab] = useState<ConfigTab>('steps');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
          <Settings2 className="text-indigo-600" size={20} />
          Builder Configuration
        </h2>
        <p className="text-sm text-stone-500">
          Manage the steps, order, and compatibility rules for the PC Builder.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200',
              activeTab === tab.id
                ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50 hover:border-stone-300'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-stone-100 rounded-3xl shadow-sm overflow-hidden">
        {activeTab === 'steps' ? (
          <StepConfigurator />
        ) : (
          <RuleManager />
        )}
      </div>
    </div>
  );
};

export default BuilderConfigManager;
