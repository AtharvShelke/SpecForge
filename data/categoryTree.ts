import { CATEGORY_NAMES } from "../lib/categoryUtils";
import {
  Monitor,
  Cpu,
  HardDrive,
  Keyboard,
  ShieldQuestion,
} from "lucide-react";

export interface CategoryNode {
  label: string;
  children?: CategoryNode[];
  // Filter logic
  category?: string;
  brand?: string;
  query?: string; // Matches against product name or specs
  subCategoryId?: string;
  isOpen?: boolean; // Initial UI state
}

export const BUILD_SEQUENCE = [
  CATEGORY_NAMES.PROCESSOR,
  CATEGORY_NAMES.MOTHERBOARD,
  CATEGORY_NAMES.RAM,
  CATEGORY_NAMES.STORAGE,
  CATEGORY_NAMES.GPU,
  CATEGORY_NAMES.PSU,
  CATEGORY_NAMES.CABINET,
  CATEGORY_NAMES.COOLER,
  CATEGORY_NAMES.MONITOR,
  CATEGORY_NAMES.PERIPHERAL,
];
export const CATEGORY_ICONS: Record<string, React.ElementType> = {
  [CATEGORY_NAMES.PROCESSOR]: Cpu,
  [CATEGORY_NAMES.MOTHERBOARD]: ShieldQuestion,
  [CATEGORY_NAMES.RAM]: HardDrive,
  [CATEGORY_NAMES.STORAGE]: HardDrive,
  [CATEGORY_NAMES.GPU]: ShieldQuestion,
  [CATEGORY_NAMES.PSU]: ShieldQuestion,
  [CATEGORY_NAMES.CABINET]: ShieldQuestion,
  [CATEGORY_NAMES.COOLER]: ShieldQuestion,
  [CATEGORY_NAMES.MONITOR]: Monitor,
  [CATEGORY_NAMES.PERIPHERAL]: Keyboard,
};
