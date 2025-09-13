"use client";

import React, { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "processing" | "completed" | "error";
  error?: string;
  imageId?: Id<"images">;
}

interface ImageUploaderProps {
  projectId: Id<"projects">;
  onUploadComplete?: (imageIds: Id<"images">[]) => void;
  maxFiles?: number;
  className?: string;
}

export function ImageUploader({
  projectId,
  onUploadComplete,
  maxFiles = 10,
  className = "",
}: ImageUploaderProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generateUploadUrl = useAction(api.images.generateImageUploadUrl);
  const createImageRecord = useMutation(api.images.createImageRecord);

  // Validate file before upload
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: "Only JPEG, PNG, and WebP files are allowed" };
    }

    if (file.size > maxSize) {
      return { valid: false, error: "File size must be less than 10MB" };
    }

    return { valid: true };
  };

  // Get image dimensions
  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image"));
      };

      img.src = url;
    });
  };

  // Detect room type from filename
  const detectRoomType = (filename: string): string => {
    const name = filename.toLowerCase();
    
    if (name.includes("kitchen")) return "kitchen";
    if (name.includes("living") || name.includes("family")) return "living_room";
    if (name.includes("bedroom") || name.includes("master")) return "bedroom";
    if (name.includes("bathroom") || name.includes("bath")) return "bathroom";
    if (name.includes("dining")) return "dining_room";
    if (name.includes("office") || name.includes("study")) return "office";
    if (name.includes("basement")) return "basement";
    if (name.includes("garage")) return "garage";
    
    return "unknown";
  };

  // Upload single file
  const uploadFile = async (uploadFile: UploadFile): Promise<void> => {
    try {
      // Update status to uploading
      setUploadFiles(prev =>
        prev.map(f => f.id === uploadFile.id ? { ...f, status: "uploading", progress: 0 } : f)
      );

      // Get upload URL from Convex
      const { uploadUrl, imageKey } = await generateUploadUrl({
        projectId,
        filename: uploadFile.file.name,
        contentType: uploadFile.file.type,
        fileSize: uploadFile.file.size,
      });

      console.log("Upload URL generated:", {
        url: uploadUrl.substring(0, 100) + "...", // Don't log full URL for security
        imageKey,
        contentType: uploadFile.file.type,
        fileSize: uploadFile.file.size
      });

      // Upload to R2 using fetch API
      try {
        // Simulate progress during upload
        setUploadFiles(prev =>
          prev.map(f => f.id === uploadFile.id ? { ...f, progress: 20 } : f)
        );

        const response = await fetch(uploadUrl, {
          method: 'PUT',
          body: uploadFile.file,
          headers: {
            'Content-Type': uploadFile.file.type,
          },
        });

        // Update progress after upload completes
        setUploadFiles(prev =>
          prev.map(f => f.id === uploadFile.id ? { ...f, progress: 70 } : f)
        );

        console.log("Upload response:", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        if (!response.ok) {
          throw new Error(`Upload failed with status ${response.status}: ${response.statusText}`);
        }

        // Update to processing status
        setUploadFiles(prev =>
          prev.map(f => f.id === uploadFile.id ? { ...f, status: "processing", progress: 90 } : f)
        );

        // Get image dimensions
        const dimensions = await getImageDimensions(uploadFile.file);
        
        // Detect room type
        const roomType = detectRoomType(uploadFile.file.name);

        // Create image record in Convex
        const imageId = await createImageRecord({
          projectId,
          imageKey,
          filename: uploadFile.file.name,
          fileSize: uploadFile.file.size,
          contentType: uploadFile.file.type,
          dimensions,
          roomType,
        });

        // Update to completed status
        setUploadFiles(prev =>
          prev.map(f => f.id === uploadFile.id ? { 
            ...f, 
            status: "completed", 
            progress: 100,
            imageId 
          } : f)
        );

      } catch (error) {
        console.error("Upload error:", error);
        const errorMessage = error instanceof Error ? error.message : "Upload failed";
        setUploadFiles(prev =>
          prev.map(f => f.id === uploadFile.id ? { ...f, status: "error", error: errorMessage } : f)
        );
        throw error;
      }
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      setUploadFiles(prev =>
        prev.map(f => f.id === uploadFile.id ? { ...f, status: "error", error: errorMessage } : f)
      );
      throw error;
    }
  };

  // Upload all files
  const uploadAllFiles = async () => {
    if (uploadFiles.length === 0) return;

    setIsUploading(true);
    abortControllerRef.current = new AbortController();

    try {
      const pendingFiles = uploadFiles.filter(f => f.status === "pending");
      
      // Upload files sequentially to avoid overwhelming the server
      for (const file of pendingFiles) {
        if (abortControllerRef.current.signal.aborted) break;
        await uploadFile(file);
      }

      // Get completed image IDs
      const completedImages = uploadFiles
        .filter(f => f.status === "completed" && f.imageId)
        .map(f => f.imageId!);

      if (completedImages.length > 0 && onUploadComplete) {
        onUploadComplete(completedImages);
      }
    } catch (error) {
      console.error("Batch upload error:", error);
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  };

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles
      .slice(0, maxFiles - uploadFiles.length)
      .map(file => {
        const validation = validateFile(file);
        return {
          id: `${Date.now()}-${Math.random()}`,
          file,
          progress: 0,
          status: validation.valid ? "pending" : "error",
          error: validation.error,
        };
      });

    setUploadFiles(prev => [...prev, ...newFiles]);
  }, [uploadFiles.length, maxFiles]);

  // Remove file from upload list
  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Cancel all uploads
  const cancelUploads = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsUploading(false);
    setUploadFiles([]);
  };

  // Clear completed uploads
  const clearCompleted = () => {
    setUploadFiles(prev => prev.filter(f => f.status !== "completed"));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxFiles: maxFiles - uploadFiles.length,
    disabled: isUploading,
  });

  const pendingCount = uploadFiles.filter(f => f.status === "pending").length;
  const completedCount = uploadFiles.filter(f => f.status === "completed").length;
  const errorCount = uploadFiles.filter(f => f.status === "error").length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
              ${isUploading ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              {isDragActive ? "Drop images here" : "Drag & drop images here"}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              or click to select files (JPEG, PNG, WebP up to 10MB each)
            </p>
            <p className="text-xs text-gray-400">
              Maximum {maxFiles} files • {uploadFiles.length} selected
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Upload Progress</h3>
              <div className="flex gap-2">
                {pendingCount > 0 && (
                  <Button
                    onClick={uploadAllFiles}
                    disabled={isUploading}
                    size="sm"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      `Upload ${pendingCount} files`
                    )}
                  </Button>
                )}
                {isUploading && (
                  <Button onClick={cancelUploads} variant="outline" size="sm">
                    Cancel
                  </Button>
                )}
                {completedCount > 0 && !isUploading && (
                  <Button onClick={clearCompleted} variant="outline" size="sm">
                    Clear Completed
                  </Button>
                )}
              </div>
            </div>

            {/* File List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {uploadFiles.map((uploadFile) => (
                <div
                  key={uploadFile.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    {uploadFile.status === "pending" && (
                      <span className="text-xs text-gray-500">Ready</span>
                    )}
                    {uploadFile.status === "uploading" && (
                      <div className="flex items-center gap-2">
                        <Progress value={uploadFile.progress} className="w-20" />
                        <span className="text-xs text-blue-600">
                          {uploadFile.progress}%
                        </span>
                      </div>
                    )}
                    {uploadFile.status === "processing" && (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span className="text-xs text-blue-600">Processing</span>
                      </div>
                    )}
                    {uploadFile.status === "completed" && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    {uploadFile.status === "error" && (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>

                  {/* Remove Button */}
                  {!isUploading && (
                    <Button
                      onClick={() => removeFile(uploadFile.id)}
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Error Messages */}
            {errorCount > 0 && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {errorCount} file(s) failed to upload. Check individual file errors above.
                </AlertDescription>
              </Alert>
            )}

            {/* Summary */}
            {(completedCount > 0 || errorCount > 0) && (
              <div className="mt-4 text-sm text-gray-600">
                {completedCount > 0 && (
                  <span className="text-green-600">
                    {completedCount} uploaded successfully
                  </span>
                )}
                {completedCount > 0 && errorCount > 0 && " • "}
                {errorCount > 0 && (
                  <span className="text-red-600">{errorCount} failed</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}