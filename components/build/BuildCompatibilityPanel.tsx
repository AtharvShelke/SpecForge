"use client";

import { useMemo } from "react";
import { 
  Check, 
  X, 
  AlertTriangle, 
  Info, 
  Zap, 
  Cpu, 
  HardDrive, 
  Monitor,
  Box,
  Fan,
  Layers
} from "lucide-react";
import { CartItem, CompatibilityLevel, specsToFlat } from "@/types";
import { FALLBACK_CATEGORY_NAMES } from "@/lib/categoryUtils";
import { BuilderSettings } from "@/types";

interface BuildCompatibilityPanelProps {
  cart: CartItem[];
  powerDefaults: BuilderSettings["powerDefaults"];
  className?: string;
}

interface CompatibilityIssue {
  level: CompatibilityLevel;
  message: string;
  component?: string;
  icon?: React.ElementType;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  [FALLBACK_CATEGORY_NAMES.PROCESSOR]: Cpu,
  [FALLBACK_CATEGORY_NAMES.MOTHERBOARD]: Layers,
  [FALLBACK_CATEGORY_NAMES.RAM]: HardDrive,
  [FALLBACK_CATEGORY_NAMES.GPU]: Monitor,
  [FALLBACK_CATEGORY_NAMES.STORAGE]: HardDrive,
  [FALLBACK_CATEGORY_NAMES.PSU]: Zap,
  [FALLBACK_CATEGORY_NAMES.CABINET]: Box,
  [FALLBACK_CATEGORY_NAMES.COOLER]: Fan,
};

function estimateWattage(cart: CartItem[], powerDefaults: BuilderSettings["powerDefaults"]): number {
  let wattage = powerDefaults.baseWattage;
  
  for (const item of cart) {
    const specs = specsToFlat(item.specs);
    const tdp = Number(specs.tdp || specs.wattage || specs.powerDraw);
    
    if (!isNaN(tdp) && tdp > 0) {
      wattage += tdp * item.quantity;
      continue;
    }
    
    // Default wattage by category
    if (item.category === FALLBACK_CATEGORY_NAMES.PROCESSOR) {
      wattage += powerDefaults.cpuDefaultWattage;
    } else if (item.category === FALLBACK_CATEGORY_NAMES.GPU) {
      wattage += powerDefaults.gpuDefaultWattage;
    } else if (item.category === FALLBACK_CATEGORY_NAMES.RAM) {
      wattage += powerDefaults.ramWattagePerStick * item.quantity;
    } else if (item.category === FALLBACK_CATEGORY_NAMES.STORAGE) {
      wattage += powerDefaults.storageWattagePerDrive * item.quantity;
    }
  }
  
  return wattage;
}

function validateBuild(cart: CartItem[], powerDefaults: BuilderSettings["powerDefaults"]): {
  status: CompatibilityLevel;
  issues: CompatibilityIssue[];
} {
  const issues: CompatibilityIssue[] = [];
  
  const cpu = cart.find((i) => i.category === FALLBACK_CATEGORY_NAMES.PROCESSOR);
  const mobo = cart.find((i) => i.category === FALLBACK_CATEGORY_NAMES.MOTHERBOARD);
  const ram = cart.find((i) => i.category === FALLBACK_CATEGORY_NAMES.RAM);
  const psu = cart.find((i) => i.category === FALLBACK_CATEGORY_NAMES.PSU);
  
  // CPU-Motherboard socket compatibility
  if (cpu && mobo) {
    const cpuSocket = String(specsToFlat(cpu.specs).socket || "").toLowerCase();
    const moboSocket = String(specsToFlat(mobo.specs).socket || "").toLowerCase();
    
    if (cpuSocket && moboSocket && cpuSocket !== moboSocket) {
      issues.push({
        level: CompatibilityLevel.INCOMPATIBLE,
        message: "CPU socket does not match motherboard socket",
        component: `${cpu.name} & ${mobo.name}`,
        icon: AlertTriangle,
      });
    }
  }
  
  // RAM-Motherboard/CPU compatibility
  if (ram && (mobo || cpu)) {
    const ramType = String(specsToFlat(ram.specs).memoryType || specsToFlat(ram.specs).ramType || "").toLowerCase();
    const moboRamType = mobo ? String(specsToFlat(mobo.specs).memoryType || specsToFlat(mobo.specs).ramType || "").toLowerCase() : "";
    const cpuRamType = cpu ? String(specsToFlat(cpu.specs).memoryType || specsToFlat(cpu.specs).ramType || "").toLowerCase() : "";
    
    const expectedRamType = moboRamType || cpuRamType;
    
    if (ramType && expectedRamType && ramType !== expectedRamType) {
      issues.push({
        level: CompatibilityLevel.INCOMPATIBLE,
        message: "RAM type does not match motherboard/CPU supported type",
        component: ram.name,
        icon: AlertTriangle,
      });
    }
  }
  
  // Power supply capacity check
  if (psu) {
    const wattage = estimateWattage(cart, powerDefaults);
    const psuCapacity = Number(specsToFlat(psu.specs).wattage || specsToFlat(psu.specs).power || 0);
    
    if (!isNaN(psuCapacity) && psuCapacity > 0) {
      if (wattage > psuCapacity) {
        issues.push({
          level: CompatibilityLevel.INCOMPATIBLE,
          message: `Estimated ${wattage}W exceeds PSU capacity (${psuCapacity}W)`,
          component: psu.name,
          icon: X,
        });
      } else if (wattage > psuCapacity * 0.8) {
        issues.push({
          level: CompatibilityLevel.WARNING,
          message: `Estimated ${wattage}W is close to PSU capacity (${psuCapacity}W)`,
          component: psu.name,
          icon: AlertTriangle,
        });
      }
    }
  }
  
  // Physical compatibility warnings
  if (cart.length > 0) {
    const hasGPU = cart.some(item => item.category === FALLBACK_CATEGORY_NAMES.GPU);
    const hasCabinet = cart.some(item => item.category === FALLBACK_CATEGORY_NAMES.CABINET);
    
    if (hasGPU && !hasCabinet) {
      issues.push({
        level: CompatibilityLevel.WARNING,
        message: "Consider adding a cabinet to ensure GPU fits",
        component: "GPU",
        icon: Info,
      });
    }
  }
  
  const status = issues.some((i) => i.level === CompatibilityLevel.INCOMPATIBLE)
    ? CompatibilityLevel.INCOMPATIBLE
    : issues.length > 0
      ? CompatibilityLevel.WARNING
      : CompatibilityLevel.COMPATIBLE;
  
  return { status, issues };
}

export default function BuildCompatibilityPanel({ 
  cart, 
  powerDefaults, 
  className = "" 
}: BuildCompatibilityPanelProps) {
  const compatibility = useMemo(() => validateBuild(cart, powerDefaults), [cart, powerDefaults]);
  const estimatedWattage = useMemo(() => estimateWattage(cart, powerDefaults), [cart, powerDefaults]);
  
  const getStatusIcon = (level: CompatibilityLevel) => {
    switch (level) {
      case CompatibilityLevel.COMPATIBLE:
        return Check;
      case CompatibilityLevel.WARNING:
        return AlertTriangle;
      case CompatibilityLevel.INCOMPATIBLE:
        return X;
      default:
        return Info;
    }
  };
  
  const getStatusColor = (level: CompatibilityLevel) => {
    switch (level) {
      case CompatibilityLevel.COMPATIBLE:
        return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case CompatibilityLevel.WARNING:
        return "text-amber-600 bg-amber-50 border-amber-200";
      case CompatibilityLevel.INCOMPATIBLE:
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };
  
  const StatusIcon = getStatusIcon(compatibility.status);
  const statusColor = getStatusColor(compatibility.status);
  
  if (cart.length === 0) {
    return (
      <div className={`border border-gray-200 bg-white rounded-lg p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <Info className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">Add components to check compatibility</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`border border-gray-200 bg-white rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Compatibility Check</h3>
          <div className={`flex items-center gap-2 px-2 py-1 rounded-full border text-sm font-medium ${statusColor}`}>
            <StatusIcon className="h-4 w-4" />
            {compatibility.status === CompatibilityLevel.COMPATIBLE && "Compatible"}
            {compatibility.status === CompatibilityLevel.WARNING && "Warnings"}
            {compatibility.status === CompatibilityLevel.INCOMPATIBLE && "Incompatible"}
          </div>
        </div>
      </div>
      
      {/* Power Estimate */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700">Estimated Power Draw</span>
          </div>
          <span className="font-semibold text-gray-900">{estimatedWattage}W</span>
        </div>
      </div>
      
      {/* Issues */}
      <div className="p-4">
        {compatibility.issues.length === 0 ? (
          <div className="flex items-center gap-3 text-emerald-600">
            <Check className="h-5 w-5" />
            <span className="text-sm font-medium">All components are compatible!</span>
          </div>
        ) : (
          <div className="space-y-3">
            {compatibility.issues.map((issue, index) => {
              const IssueIcon = issue.icon || AlertTriangle;
              const issueColor = issue.level === CompatibilityLevel.INCOMPATIBLE 
                ? "text-red-600 border-red-200 bg-red-50"
                : "text-amber-600 border-amber-200 bg-amber-50";
              
              return (
                <div key={index} className={`flex gap-3 p-3 rounded-lg border ${issueColor}`}>
                  <IssueIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{issue.message}</p>
                    {issue.component && (
                      <p className="text-xs opacity-75 mt-1">{issue.component}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Component Summary */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-500">Components</span>
            <p className="font-semibold text-gray-900">{cart.length}</p>
          </div>
          <div>
            <span className="text-gray-500">Issues</span>
            <p className="font-semibold text-gray-900">{compatibility.issues.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
