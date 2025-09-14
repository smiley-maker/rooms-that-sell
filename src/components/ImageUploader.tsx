"use client";

import React, { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, AlertCircle, CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useNotifications } from "@/lib/notifications";
import { AppErrorHandler, ErrorCode, AppError } from "@/lib/errors";
import { withUploadRetry } from "@/lib/retry";

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

  // Import the intelligent room type detection
  const detectRoomType = (filename: string): string => {
    // This is a simplified version for the uploader
    // The full detection logic is in the Convex function
    const name = filename.toLowerCase();
    
    // Enhanced pattern matching
    if (/kitchen|kit\b|cooking|culinary/i.test(name)) return "kitchen";
    if (/master[\s_-]?bedroom|master[\s_-]?bed|mbr|primary[\s_-]?bedroom/i.test(name)) return "master_bedroom";
    if (/bedroom|bed[\s_-]?room|br\d*|\bbr\b/i.test(name)) return "bedroom";
    if (/living[\s_-]?room|living|lounge|sitting[\s_-]?room|great[\s_-]?room|lr\b/i.test(name)) return "living_room";
    if (/family[\s_-]?room|family|rec[\s_-]?room|recreation|game[\s_-]?room/i.test(name)) return "family_room";
    if (/bathroom|bath[\s_-]?room|\bbath\b|\bba\b|washroom|restroom/i.test(name)) return "bathroom";
    if (/powder[\s_-]?room|half[\s_-]?bath|guest[\s_-]?bath/i.test(name)) return "powder_room";
    if (/dining[\s_-]?room|dining|\bdr\b|breakfast[\s_-]?nook/i.test(name)) return "dining_room";
    if (/office|study|den|library|work[\s_-]?room|home[\s_-]?office/i.test(name)) return "office";
    if (/guest[\s_-]?room|guest[\s_-]?bed|spare[\s_-]?room|spare[\s_-]?bed/i.test(name)) return "guest_room";
    if (/walk[\s_-]?in[\s_-]?closet|closet|wardrobe|dressing[\s_-]?room/i.test(name)) return "walk_in_closet";
    if (/laundry|wash[\s_-]?room|utility[\s_-]?room|mud[\s_-]?room/i.test(name)) return "laundry_room";
    if (/basement|cellar|lower[\s_-]?level|downstairs/i.test(name)) return "basement";
    if (/garage|car[\s_-]?port|parking/i.test(name)) return "garage";
    if (/foyer|entry[\s_-]?way|entrance|front[\s_-]?hall|vestibule/i.test(name)) return "foyer";
    if (/pantry|storage|food[\s_-]?storage/i.test(name)) return "pantry";
    if (/balcony|patio|deck|terrace|outdoor|veranda/i.test(name)) return "balcony";
    
    return "unknown";
  };

  const notifications = useNotifications();

  // Upload single file with enhanced error handling
  const uploadFile = async (uploadFile: UploadFile): Promise<void> => {
    
    try {
      // Update status to uploading
      setUploadFiles(prev =>
        prev.map(f => f.id === uploadFile.id ? { ...f, status: "uploading", progress: 0 } : f)
      );

      // Validate file size and format
      const validation = validateFile(uploadFile.file);
      if (!validation.valid) {
        throw AppErrorHandler.createError(
          validation.error?.includes("size") ? ErrorCode.IMAGE_TOO_LARGE : ErrorCode.IMAGE_INVALID_FORMAT,
          new Error(validation.error),
          { filename: uploadFile.file.name }
        );
      }

      // Use retry mechanism for upload operations
      await withUploadRetry(async () => {
        // Get upload URL from Convex
        const { uploadUrl, imageKey } = await generateUploadUrl({
          projectId,
          filename: uploadFile.file.name,
          contentType: uploadFile.file.type,
          fileSize: uploadFile.file.size,
        });

        // Update progress
        setUploadFiles(prev =>
          prev.map(f => f.id === uploadFile.id ? { ...f, progress: 20 } : f)
        );

        // Upload to R2 with timeout
        const uploadPromise = fetch(uploadUrl, {
          method: 'PUT',
          body: uploadFile.file,
          headers: {
            'Content-Type': uploadFile.file.type,
          },
          signal: abortControllerRef.current?.signal,
        });

        // Add timeout to upload
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Upload timeout")), 60000); // 60 second timeout
        });

        const response = await Promise.race([uploadPromise, timeoutPromise]) as Response;

        // Update progress after upload completes
        setUploadFiles(prev =>
          prev.map(f => f.id === uploadFile.id ? { ...f, progress: 70 } : f)
        );

        if (!response.ok) {
          throw AppErrorHandler.createError(
            ErrorCode.STORAGE_UPLOAD_FAILED,
            new Error(`Upload failed with status ${response.status}: ${response.statusText}`),
            { filename: uploadFile.file.name, status: response.status }
          );
        }

        // Update to processing status
        setUploadFiles(prev =>
          prev.map(f => f.id === uploadFile.id ? { ...f, status: "processing", progress: 90 } : f)
        );

        // Get image dimensions with error handling
        let dimensions;
        try {
          dimensions = await getImageDimensions(uploadFile.file);
        } catch (error) {
          throw AppErrorHandler.createError(
            ErrorCode.IMAGE_PROCESSING_FAILED,
            error,
            { filename: uploadFile.file.name, step: "dimension_detection" }
          );
        }
        
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

        return imageId;
      }, {
        maxAttempts: 3,
        baseDelay: 2000,
        onRetry: (attempt) => {
          notifications.info(`Retrying upload for ${uploadFile.file.name}`, {
            description: `Attempt ${attempt} of 3`,
          });
        },
      });

    } catch (error) {
      let appError: AppError;
      if (error && typeof error === "object" && "code" in error) {
        appError = error as AppError;
      } else {
        appError = AppErrorHandler.createError(
          ErrorCode.IMAGE_UPLOAD_FAILED,
          error,
          { filename: uploadFile.file.name }
        );
      }

      const errorMessage = appError.userMessage;
      setUploadFiles(prev =>
        prev.map(f => f.id === uploadFile.id ? { ...f, status: "error", error: errorMessage } : f)
      );

      // Don't show notification here as it will be handled by the batch operation
      throw appError;
    }
  };

  // Upload all files with enhanced error handling
  const uploadAllFiles = async () => {
    if (uploadFiles.length === 0) return;
    setIsUploading(true);
    abortControllerRef.current = new AbortController();

    const pendingFiles = uploadFiles.filter(f => f.status === "pending");
    let completed = 0;
    let failed = 0;

    try {
      // Show initial progress notification
      const progressToastId = notifications.loading("Starting upload...", {
        description: `Uploading ${pendingFiles.length} files`,
      });

      // Upload files sequentially to avoid overwhelming the server
      for (const file of pendingFiles) {
        if (abortControllerRef.current.signal.aborted) break;
        
        try {
          await uploadFile(file);
          completed++;
          
          // Update progress notification
          notifications.dismiss(progressToastId);
          notifications.loading(`Uploading files...`, {
            description: `${completed + failed} of ${pendingFiles.length} processed`,
          });
        } catch (uploadError) {
          failed++;
          console.error(`Upload failed for ${file.file.name}:`, uploadError);
        }
      }

      // Dismiss progress notification
      notifications.dismiss(progressToastId);

      // Show final result notification
      notifications.batchOperation("Upload", pendingFiles.length, completed, failed);

      // Get completed image IDs
      const completedImages = uploadFiles
        .filter(f => f.status === "completed" && f.imageId)
        .map(f => f.imageId!);

      if (completedImages.length > 0 && onUploadComplete) {
        onUploadComplete(completedImages);
      }
    } catch (batchError) {
      const appError = AppErrorHandler.fromConvexError(batchError);
      notifications.handleError(appError, () => uploadAllFiles());
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  };

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles
      .slice(0, Math.max(0, maxFiles - uploadFiles.length))
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

  // Retry failed upload
  const retryFile = async (fileId: string) => {
    const file = uploadFiles.find(f => f.id === fileId);
    if (!file || file.status !== "error") return;

    // Reset file status to pending
    setUploadFiles(prev =>
      prev.map(f => f.id === fileId ? { ...f, status: "pending", error: undefined, progress: 0 } : f)
    );

    // Upload the file
    try {
      await uploadFile(file);
    } catch (retryError) {
      // Error is already handled in uploadFile
      console.error('Retry failed:', retryError);
    }
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
    maxFiles,
    disabled: isUploading,
  });

  const pendingCount = uploadFiles.filter(f => f.status === "pending").length;
  const completedCount = uploadFiles.filter(f => f.status === "completed").length;
  const errorCount = uploadFiles.filter(f => f.status === "error").length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-4 sm:p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
              ${isUploading ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mb-2 sm:mb-4" />
            <p className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">
              {isDragActive ? "Drop images here" : "Drag & drop images here"}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-4 px-2">
              or tap to select files (JPEG, PNG, WebP up to 10MB each)
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="font-medium">Upload Progress</h3>
              <div className="flex flex-wrap gap-2">
                {pendingCount > 0 && (
                  <Button
                    onClick={uploadAllFiles}
                    disabled={isUploading}
                    size="sm"
                    className="flex-1 sm:flex-none"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        <span className="hidden sm:inline">Uploading...</span>
                        <span className="sm:hidden">Uploading</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">Upload {pendingCount} files</span>
                        <span className="sm:hidden">Upload ({pendingCount})</span>
                      </>
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
                    <span className="hidden sm:inline">Clear Completed</span>
                    <span className="sm:hidden">Clear</span>
                  </Button>
                )}
              </div>
            </div>

            {/* File List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {uploadFiles.map((uploadFile) => (
                <div
                  key={uploadFile.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 bg-gray-50 rounded-lg"
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
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <div className="flex items-center gap-2">
                      {uploadFile.status === "pending" && (
                        <span className="text-xs text-gray-500">Ready</span>
                      )}
                      {uploadFile.status === "uploading" && (
                        <div className="flex items-center gap-2">
                          <Progress value={uploadFile.progress} className="w-16 sm:w-20" />
                          <span className="text-xs text-blue-600">
                            {uploadFile.progress}%
                          </span>
                        </div>
                      )}
                      {uploadFile.status === "processing" && (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          <span className="text-xs text-blue-600 hidden sm:inline">Processing</span>
                        </div>
                      )}
                      {uploadFile.status === "completed" && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      {uploadFile.status === "error" && (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          {uploadFile.error && (
                            <span className="text-xs text-red-600 max-w-24 sm:max-w-32 truncate" title={uploadFile.error}>
                              {uploadFile.error}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      {uploadFile.status === "error" && !isUploading && (
                        <Button
                          onClick={() => retryFile(uploadFile.id)}
                          variant="ghost"
                          size="sm"
                          className="p-1 h-auto"
                          title="Retry upload"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      )}
                      {!isUploading && (
                        <Button
                          onClick={() => removeFile(uploadFile.id)}
                          variant="ghost"
                          size="sm"
                          className="p-1 h-auto"
                          title="Remove file"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
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