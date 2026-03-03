"use client";

import { useUploadThing } from "@/lib/uploadthing";
import { useState, useCallback } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface ImageUploaderProps {
    onUploadComplete?: (url: string) => void;
    onUploadError?: (error: Error) => void;
    previewUrl?: string;
    endpoint?: "imageUploader";
}

const MAX_IMAGE_SIZE_MB = 4;

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

    const onClientUploadComplete = useCallback((res: any) => {
        const url = res[0].ufsUrl || res[0].url;
        console.log("Uploaded:", url);
        setUploadProgress(100);
        onUploadComplete?.(url);
    }, [onUploadComplete]);

    const onUploadErrorCallback = useCallback((error: Error) => {
        console.error("Upload error:", error);
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
        <div className="w-full">
            <div
                onDrop={(e) => {
                    e.preventDefault();
                    if (isUploading) return;
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFile(file);
                }}
                onDragOver={(e) => e.preventDefault()}
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed
        p-6 text-center transition-all duration-200
        ${isUploading
                        ? "border-blue-400 bg-blue-50/50 cursor-not-allowed"
                        : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
                    }`}
            >
                {isUploading ? (
                    <div className="flex flex-col items-center">
                        <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-2" />
                        <p className="text-sm font-semibold text-blue-700">Uploading Image...</p>
                        <p className="text-xs text-blue-500 mt-1">{uploadProgress}%</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-blue-100 p-3 rounded-full mb-3 group-hover:bg-blue-200 transition-colors">
                            <UploadCloud className="h-6 w-6 text-blue-600" />
                        </div>
                        <p className="text-sm font-semibold text-gray-700">
                            Click or drag to upload
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            JPG, PNG, WEBP · Max {MAX_IMAGE_SIZE_MB}MB
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

            {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-3">
                    <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                </div>
            )}

            {previewUrl && !isUploading && (
                <div className="mt-4 flex items-center gap-4 p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="relative h-16 w-16 overflow-hidden rounded-md border border-green-200 shadow-sm bg-white">
                        <img
                            src={previewUrl}
                            alt="Uploaded brand preview"
                            className="h-full w-full object-contain"
                        />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-1.5 text-green-700 font-medium text-sm">
                            <CheckCircle2 size={16} />
                            <span>Image Ready</span>
                        </div>
                        <p className="text-xs text-green-600/80 mt-0.5 truncate max-w-[200px]">
                            Successfully optimized and uploaded
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
