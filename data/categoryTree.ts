import { CATEGORY_NAMES } from "../lib/categoryUtils";

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
