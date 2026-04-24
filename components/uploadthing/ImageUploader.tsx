"use client";

import { useUploadThing } from "@/lib/uploadthing";
import { useState, useCallback } from "react";
import { UploadCloud, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: Error) => void;
  previewUrl?: string;
  endpoint?: "imageUploader" | "paymentProofUploader";
}

const MAX_IMAGE_SIZE_MB = 4;

type UploadResponse = {
  ufsUrl?: string;
  url?: string;
};

export default function ImageUploader({
  onUploadComplete,
  onUploadError,
  previewUrl,
  endpoint = "imageUploader"
}: ImageUploaderProps) {
  const [uploadProgress, setUploadProgress] = useState(0);

  const onUploadProgress = useCallback((progress: number) => {
    setUploadProgress(progress);
  }, []);

  const onClientUploadComplete = useCallback((res: UploadResponse[]) => {
    const url = res[0].ufsUrl || res[0].url;
    if (!url) {
      onUploadError?.(new Error("Upload completed without a file URL."));
      setUploadProgress(0);
      return;
    }
    setUploadProgress(100);
    onUploadComplete?.(url);
    // Reset progress after a short delay to clear the bar
    setTimeout(() => setUploadProgress(0), 1000);
  }, [onUploadComplete]);

  const onUploadErrorCallback = useCallback((error: Error) => {
    onUploadError?.(error);
    setUploadProgress(0);
  }, [onUploadError]);

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    onUploadProgress,
    onClientUploadComplete,
    onUploadError: onUploadErrorCallback,
  });

  const handleFile = async (file: File) => {
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      alert(`File too large. Max size is ${MAX_IMAGE_SIZE_MB}MB.`);
      return;
    }

    try {
      await startUpload([file]);
    } catch (err) {
      console.error("Error starting upload:", err);
    }
  };

  return (
    <div className="w-full space-y-2.5">
      <div
        onDrop={(e) => {
          e.preventDefault();
          if (isUploading) return;
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onDragOver={(e) => e.preventDefault()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 min-h-[120px] sm:min-h-[150px]",
          "p-4 sm:p-6 text-center",
          isUploading
            ? "border-indigo-300 bg-indigo-50/30 cursor-not-allowed"
            : "border-stone-200 bg-stone-50/50 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer group"
        )}
      >
        {isUploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-2" />
            <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-widest">Uploading...</p>
            <p className="text-[10px] font-mono text-indigo-500 mt-1">{uploadProgress}%</p>
          </div>
        ) : (
          <>
            <div className="bg-white p-2.5 rounded-xl border border-stone-200 mb-2 group-hover:border-indigo-200 group-hover:text-indigo-500 transition-colors shadow-sm">
              <UploadCloud className="h-5 w-5 text-stone-400 group-hover:text-indigo-500" />
            </div>
            <p className="text-xs font-bold text-stone-700">
              <span className="hidden xs:inline text-indigo-600">Click</span>
              <span className="xs:hidden text-indigo-600">Tap</span> or drag to upload
            </p>
            <p className="text-[10px] text-stone-400 mt-1 font-medium">
              PNG, JPG, WEBP · Max {MAX_IMAGE_SIZE_MB}MB
            </p>

            <input
              id="uploadthing-input"
              type="file"
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={isUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </>
        )}
      </div>

      {/* Progress Bar Container - Fixed height to prevent layout shift */}
      <div className="h-1.5 w-full">
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="h-full w-full rounded-full bg-stone-100 overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-300 ease-out shadow-[0_0_8px_rgba(99,102,241,0.4)]"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* SUCCESS PREVIEW - Optimized for Mobile Density */}
      {previewUrl && !isUploading && (
        <div className="flex items-center gap-3 p-2 bg-emerald-50/50 rounded-xl border border-emerald-100 shadow-sm">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-emerald-200 bg-white shadow-inner">
            <img
              src={previewUrl}
              alt="Preview"
              className="h-full w-full object-contain p-1"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[10px] uppercase tracking-widest">
              <CheckCircle2 size={12} />
              <span>Ready to Save</span>
            </div>
            <p className="text-[10px] text-emerald-600/70 truncate">
              Optimized for catalogue
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
