import {
  Box,
  Cpu,
  Fan,
  HardDrive,
  Keyboard,
  Laptop,
  Layers,
  LucideIcon,
  Monitor,
  Package,
  Wifi,
  Zap,
} from 'lucide-react';
import { CategoryDefinition } from '@/types';

export const CATEGORY_ICON_COMPONENTS: Record<string, LucideIcon> = {
  box: Box,
  cabinet: Box,
  cpu: Cpu,
  fan: Fan,
  'hard-drive': HardDrive,
  keyboard: Keyboard,
  laptop: Laptop,
  layers: Layers,
  monitor: Monitor,
  package: Package,
  wifi: Wifi,
  zap: Zap,
};

export function getCategoryIconComponent(iconName?: string | null): LucideIcon {
  if (!iconName) return Package;
  return CATEGORY_ICON_COMPONENTS[iconName] ?? Package;
}

export function formatCategoryCode(code: string): string {
  return code
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function buildCategoryMap(categories: CategoryDefinition[]) {
  return Object.fromEntries(categories.map((category) => [category.code, category]));
}

export function getCategoryLabel(categoryMap: Record<string, CategoryDefinition>, code: string): string {
  return categoryMap[code]?.label ?? formatCategoryCode(code);
}

export function getCategoryShortLabel(categoryMap: Record<string, CategoryDefinition>, code: string): string {
  return categoryMap[code]?.shortLabel ?? getCategoryLabel(categoryMap, code);
}

export function getCategoryDescription(categoryMap: Record<string, CategoryDefinition>, code: string): string {
  return categoryMap[code]?.description ?? `Select your ${getCategoryLabel(categoryMap, code)}.`;
}
