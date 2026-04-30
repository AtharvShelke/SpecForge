"use client";

import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function CatalogEmptyState({
  title = "No products found",
  description = "Try adjusting your filters or search term",
  onClear,
}: {
  title?: string;
  description?: string;
  onClear: () => void;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/30 px-6 text-center">
      <div className="rounded-full bg-gray-100 p-4">
        <SlidersHorizontal className="size-6 text-gray-400" />
      </div>
      <p className="mt-4 text-lg font-medium text-gray-900">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      <Button
        variant="outline"
        className="mt-6 border-gray-200 bg-white hover:bg-gray-50"
        onClick={onClear}
      >
        Clear all filters
      </Button>
    </div>
  );
}

