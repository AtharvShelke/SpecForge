'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type HelpTopic = 'navigation' | 'attributes' | 'filters' | 'dependencies' | 'types';

const HELP_CONTENT: Record<HelpTopic, { title: string; description: string; bullets: string[] }> = {
  navigation: {
    title: 'Navigation Help',
    description: 'Navigation controls how buyers browse the catalog, not how products are structured internally.',
    bullets: [
      'Each navigation node can point to a category code, a brand, and an optional query constraint.',
      'Use top-level nodes for broad browse paths and child nodes for curated sub-navigation.',
      'Keep labels customer-facing. Attribute keys and product specs belong in Attributes, not here.',
    ],
  },
  attributes: {
    title: 'Attributes Help',
    description: 'Attributes define the metadata contract for products in a category.',
    bullets: [
      'Attributes power product entry, validation, filtering, comparison, and future compatibility rules.',
      'Use stable machine keys like `socket`, `ramType`, or `tdp` so product specs stay predictable.',
      'This replaces the old split between schema definitions and filter definitions.',
    ],
  },
  filters: {
    title: 'Filter Behavior Help',
    description: 'Filter behavior is now metadata on the attribute itself.',
    bullets: [
      'Turn on Filterable when the attribute should appear in the storefront sidebar.',
      'Choose a filter type that matches how buyers should explore the values: dropdown, checkbox, boolean, or range.',
      'If an attribute is not filterable, it can still be required for products and used for comparison.',
    ],
  },
  dependencies: {
    title: 'Dependency Rules Help',
    description: 'Dependencies let one attribute appear only when another attribute has a specific value.',
    bullets: [
      'Example: `family` can depend on `manufacturer = AMD`.',
      'The dependency key should reference another attribute key in the same category.',
      'The dependency value should match one of that parent attribute’s allowed options.',
    ],
  },
  types: {
    title: 'Attribute Types Help',
    description: 'Pick the type that best matches the stored data and the product-entry experience.',
    bullets: [
      'Text: flexible freeform values like model names or notes.',
      'Number: numeric values such as wattage, speed, or length.',
      'Select / Multi-select: controlled options with consistent filtering and comparisons.',
    ],
  },
};

interface HelpDialogProps {
  open: boolean;
  topic: HelpTopic;
  onOpenChange: (open: boolean) => void;
}

export function HelpDialog({ open, topic, onOpenChange }: HelpDialogProps) {
  const content = HELP_CONTENT[topic];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl rounded-2xl border-stone-200 bg-white">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-stone-900">{content.title}</DialogTitle>
          <DialogDescription className="text-sm text-stone-500">
            {content.description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {content.bullets.map((bullet) => (
            <div key={bullet} className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
              {bullet}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type { HelpTopic };
