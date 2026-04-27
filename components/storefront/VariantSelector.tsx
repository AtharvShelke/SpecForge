"use client";

import { ProductVariant } from "@/types";

type VariantSelection = Record<string, string>;

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariantId: string;
  onVariantChange: (variant: ProductVariant) => void;
}

function getVariantGroups(variants: ProductVariant[]) {
  const groups = new Map<string, Set<string>>();

  for (const variant of variants) {
    const attributes = variant.attributes ?? {};
    for (const [key, value] of Object.entries(attributes)) {
      if (!value) continue;
      if (!groups.has(key)) {
        groups.set(key, new Set());
      }
      groups.get(key)?.add(String(value));
    }
  }

  return Array.from(groups.entries()).map(([key, values]) => ({
    key,
    label: key.replace(/([A-Z])/g, " $1").replace(/^./, (entry) => entry.toUpperCase()),
    values: Array.from(values),
  }));
}

function selectionForVariant(variant: ProductVariant): VariantSelection {
  const attributes = variant.attributes ?? {};
  return Object.entries(attributes).reduce<VariantSelection>((acc, [key, value]) => {
    if (value) {
      acc[key] = String(value);
    }
    return acc;
  }, {});
}

export default function VariantSelector({
  variants,
  selectedVariantId,
  onVariantChange,
}: VariantSelectorProps) {
  const groups = getVariantGroups(variants);
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId);
  const selection = selectedVariant ? selectionForVariant(selectedVariant) : {};

  if (groups.length === 0) {
    return null;
  }

  const handlePick = (key: string, value: string) => {
    const nextSelection = { ...selection, [key]: value };
    const nextVariant = variants.find((variant) => {
      const attributes = selectionForVariant(variant);
      return Object.entries(nextSelection).every(
        ([entryKey, entryValue]) => attributes[entryKey] === entryValue,
      );
    });

    if (nextVariant) {
      onVariantChange(nextVariant);
    }
  };

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.key}>
          <p className="mb-3 text-sm font-medium text-gray-900">{group.label}</p>
          <div className="flex flex-wrap gap-2">
            {group.values.map((value) => {
              const variantForValue = variants.find((variant) => {
                const attributes = selectionForVariant(variant);
                if (attributes[group.key] !== value) {
                  return false;
                }

                return Object.entries(selection).every(([entryKey, entryValue]) => {
                  if (entryKey === group.key) {
                    return true;
                  }
                  return attributes[entryKey] === entryValue;
                });
              });

              const isDisabled =
                !variantForValue || variantForValue.status === "OUT_OF_STOCK";
              const isActive = selection[group.key] === value;

              return (
                <button
                  key={value}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handlePick(group.key, value)}
                  className={`min-h-11 rounded-full border px-4 text-sm transition-colors ${
                    isActive
                      ? "border-black bg-black text-white"
                      : "border-gray-300 bg-white text-gray-900 hover:border-gray-900"
                  } ${isDisabled ? "cursor-not-allowed border-gray-200 text-gray-400 line-through" : ""}`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
