"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { UploadCloud, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: Error) => void;
  previewUrl?: string;
  endpoint?: "imageUploader" | "paymentProofUploader";
  minimal?: boolean;
  onUploadStart?: () => void;
  onProgress?: (progress: number) => void;
}

const MAX_IMAGE_SIZE_MB = 4;

type UploadResponse = {
  ufsUrl?: string;
  url?: string;
};

export default function ImageUploader({
  onUploadComplete,
  onUploadError,
  onUploadStart,
  onProgress: onProgressCallback,
  previewUrl,
  endpoint = "imageUploader",
  minimal = false,
}: ImageUploaderProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const onUploadProgress = useCallback((progress: number) => {
    setUploadProgress(progress);
    onProgressCallback?.(progress);
  }, [onProgressCallback]);
  const onUploadCompleteRef = useRef(onUploadComplete);
  useEffect(() => {
    onUploadCompleteRef.current = onUploadComplete;
  }, [onUploadComplete]);
  const onUploadErrorCallback = useCallback(
    (error: Error) => {
      onUploadError?.(error);
      setUploadProgress(0);
      setIsUploading(false);
    },
    [onUploadError],
  );

  const handleFile = async (file: File) => {
    if (isUploading) return;
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      alert(`File too large. Max size is ${MAX_IMAGE_SIZE_MB}MB.`);
      return;
    }

    try {
      setIsUploading(true);
      onUploadStart?.();
      onUploadProgress(0);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("endpoint", endpoint);

      const response = await new Promise<UploadResponse>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/uploads");
        xhr.responseType = "json";

        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          const progress = Math.round((event.loaded / event.total) * 100);
          onUploadProgress(progress);
        };

        xhr.onerror = () => reject(new Error("Network error while uploading file."));
        xhr.onabort = () => reject(new Error("Upload was cancelled."));
        xhr.onload = () => {
          const data =
            (xhr.response as UploadResponse | { error?: string } | null) ??
            JSON.parse(xhr.responseText || "{}");

          if (xhr.status < 200 || xhr.status >= 300) {
            const errorMessage =
              typeof data === "object" && data && "error" in data
                ? data.error
                : "Upload failed.";
            reject(new Error(errorMessage || "Upload failed."));
            return;
          }

          resolve(data as UploadResponse);
        };

        xhr.send(formData);
      });

      const url = response.ufsUrl || response.url;
      if (!url) {
        throw new Error("Upload completed without a file URL.");
      }

      setUploadProgress(100);
      onUploadCompleteRef.current?.(url);
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (err) {
      onUploadErrorCallback(
        err instanceof Error ? err : new Error("Failed to upload file."),
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (minimal) {
    return (
      <div
        onDrop={(e) => {
          e.preventDefault();
          if (isUploading) return;
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onDragOver={(e) => e.preventDefault()}
        className="absolute inset-0 z-50 cursor-pointer"
      >
        <input
          type="file"
          accept="image/*"
          className="absolute inset-0 opacity-0 cursor-pointer"
          disabled={isUploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <div
        onDrop={(e) => {
          e.preventDefault();
          if (isUploading) return;
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onDragOver={(e) => e.preventDefault()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-500 min-h-[140px] sm:min-h-[160px]",
          "p-4 sm:p-8 text-center overflow-hidden",
          isUploading
            ? "border-indigo-300 bg-indigo-50/40 cursor-not-allowed"
            : "border-stone-200 bg-stone-50/30 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer group",
        )}
      >
        {/* Decorative background elements for premium feel */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.1),transparent)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        {isUploading ? (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <div className="relative mb-4">
              <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
              <div className="absolute inset-0 blur-lg bg-indigo-500/20 animate-pulse" />
            </div>
            <p className="text-xs font-black text-indigo-700 uppercase tracking-[0.2em] mb-1">
              Uploading
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-indigo-500/70">
                {uploadProgress}%
              </span>
              <div className="w-20 h-1 bg-indigo-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-white p-3.5 rounded-2xl border border-stone-200 mb-3 group-hover:border-indigo-200 group-hover:text-indigo-600 transition-all duration-300 shadow-sm group-hover:shadow-indigo-100 group-hover:-translate-y-1">
              <UploadCloud className="h-6 w-6 text-stone-400 group-hover:text-indigo-500 transition-colors" />
            </div>
            <p className="text-sm font-bold text-stone-800 tracking-tight">
              <span className="text-indigo-600">Choose files</span> or drag and drop
            </p>
            <p className="text-[10px] text-stone-400 mt-1.5 font-bold uppercase tracking-widest">
              PNG, JPG, WEBP • MAX {MAX_IMAGE_SIZE_MB}MB
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
          </div>
        )}
      </div>

      {/* Progress Bar Container - Only show when uploading and not minimal */}
      <div className="h-1.5 w-full">
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="h-full w-full rounded-full bg-stone-100 overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 ease-out shadow-[0_0_12px_rgba(99,102,241,0.5)]"
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
