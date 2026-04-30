"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function CatalogPagination({
  page,
  totalPages,
  isLoading,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  isLoading?: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
      <p className="text-sm text-gray-500">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={page <= 1 || isLoading}
          className="border-gray-200 bg-white hover:bg-gray-50"
        >
          <ArrowLeft className="mr-1 size-3.5" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={page >= totalPages || isLoading}
          className="border-gray-200 bg-white hover:bg-gray-50"
        >
          Next
          <ArrowRight className="ml-1 size-3.5" />
        </Button>
      </div>
    </div>
  );
}

