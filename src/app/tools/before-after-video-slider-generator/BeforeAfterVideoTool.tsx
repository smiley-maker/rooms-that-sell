"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAction } from "convex/react";
import { Loader2, Upload, RefreshCcw, Download } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { BasicImageComparisonSlider } from "@/components/tools/BasicImageComparisonSlider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { NotificationService } from "@/lib/notifications";
import { cn, formatDuration } from "@/lib/utils";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const TOOL_SLUG = "before-after-video-slider-generator";

interface UploadedAsset {
  key: string;
  bucket: string;
}

interface UsageInfo {
  limit: number;
  remaining: number;
  windowEndsAt: number;
}

export function BeforeAfterVideoTool() {
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoExpiresAt, setVideoExpiresAt] = useState<number | null>(null);
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "completed">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const generateUploadUrl = useAction(api.beforeAfterVideos.generateUploadUrl);

  useEffect(() => {
    return () => {
      if (beforePreview) URL.revokeObjectURL(beforePreview);
      if (afterPreview) URL.revokeObjectURL(afterPreview);
    };
  }, [beforePreview, afterPreview]);

  const humanUsageStatus = useMemo(() => {
    if (!usageInfo) return null;
    const { remaining, limit, windowEndsAt } = usageInfo;
    const used = limit - remaining;
    const windowEndsIn = Math.max(0, windowEndsAt - Date.now());
    return {
      used,
      limit,
      remaining,
      windowText: formatDuration(windowEndsIn),
    };
  }, [usageInfo]);

  const videoExpiryText = useMemo(() => {
    if (!videoExpiresAt) return "24 hours";
    const millisecondsRemaining = Math.max(0, videoExpiresAt - Date.now());
    return formatDuration(millisecondsRemaining);
  }, [videoExpiresAt]);

  const validateFile = useCallback((file: File | null, label: string) => {
    if (!file) {
      setError(`${label} image is missing.`);
      return false;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(`${label} image must be a JPEG, PNG, or WebP file.`);
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`${label} image must be smaller than ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB.`);
      return false;
    }
    return true;
  }, []);

  const handleFileSelect = useCallback((fileList: FileList | null, variant: "before" | "after") => {
    const file = fileList?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please upload JPEG, PNG, or WebP images only.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(`Each image must be under ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB.`);
      return;
    }

    setError(null);
    setVideoUrl(null);
    setVideoExpiresAt(null);

    if (variant === "before") {
      if (beforePreview) URL.revokeObjectURL(beforePreview);
      setBeforePreview(URL.createObjectURL(file));
      setBeforeFile(file);
    } else {
      if (afterPreview) URL.revokeObjectURL(afterPreview);
      setAfterPreview(URL.createObjectURL(file));
      setAfterFile(file);
    }
  }, [afterPreview, beforePreview]);

  const uploadAsset = useCallback(
    async (file: File, variant: "before" | "after"): Promise<UploadedAsset> => {
      const { uploadUrl, assetKey, bucket } = await generateUploadUrl({
        filename: file.name,
        contentType: file.type,
        fileSize: file.size,
        variant,
        toolSlug: TOOL_SLUG,
      });

      const response = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      return { key: assetKey, bucket };
    },
    [generateUploadUrl]
  );

  const resetInputs = useCallback(() => {
    setIsResetting(true);
    setBeforeFile(null);
    setAfterFile(null);
    if (beforePreview) URL.revokeObjectURL(beforePreview);
    if (afterPreview) URL.revokeObjectURL(afterPreview);
    setBeforePreview(null);
    setAfterPreview(null);
    setVideoUrl(null);
    setVideoExpiresAt(null);
    setUsageInfo(null);
    setProgress(0);
    setStatus("idle");
    setError(null);
    setTimeout(() => setIsResetting(false), 50);
  }, [afterPreview, beforePreview]);

  const generateVideo = useCallback(async () => {
    setError(null);
    if (!validateFile(beforeFile, "Before")) return;
    if (!validateFile(afterFile, "After")) return;

    let uploadToastId: string | number | undefined;
    try {
      setProgress(5);
      setStatus("uploading");
      uploadToastId = NotificationService.loading(
        "Uploading images to build your slider video..."
      );

      const beforeAsset = await uploadAsset(beforeFile!, "before");
      setProgress(30);
      const afterAsset = await uploadAsset(afterFile!, "after");
      setProgress(65);

      if (uploadToastId !== undefined) {
        NotificationService.dismiss(uploadToastId);
        uploadToastId = undefined;
      }

      setStatus("processing");
      NotificationService.info("Images uploaded. Rendering video...", { duration: 2500 });

      const response = await fetch("/api/tools/before-after-video/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          before: beforeAsset,
          after: afterAsset,
          filenames: {
            before: beforeFile?.name,
            after: afterFile?.name,
          },
          toolSlug: TOOL_SLUG,
        }),
      });

      setProgress(85);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: "Unable to generate video." }));
        throw new Error(errorBody.message || "Unable to generate video.");
      }

      const data: {
        videoUrl: string;
        expiresAt: number;
        usage: UsageInfo;
      } = await response.json();

      setUsageInfo(data.usage);
      setVideoUrl(data.videoUrl);
      setVideoExpiresAt(data.expiresAt);
      setProgress(100);
      setStatus("completed");
      NotificationService.success("Video ready!", {
        description: "Scroll down to preview or download the finished clip.",
      });
    } catch (err) {
      console.error(err);
      NotificationService.error("We couldn't create the video", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
      setStatus("idle");
      setProgress(0);
      setVideoUrl(null);
      setVideoExpiresAt(null);
      setUsageInfo(null);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      if (uploadToastId !== undefined) {
        NotificationService.dismiss(uploadToastId);
      }
    }
  }, [afterFile, uploadAsset, beforeFile, validateFile]);

  const showSlider = beforePreview && afterPreview;

  return (
    <section className="space-y-10">
      <Card className="border-white/10 bg-neutral-950 text-white shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Upload your before & after images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <label
              className={cn(
                "group flex h-48 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-neutral-900/60 text-center transition hover:border-primary/60 hover:bg-neutral-900",
                isResetting && "pointer-events-none opacity-50"
              )}
            >
              <Input
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                className="hidden"
                onChange={(event) => handleFileSelect(event.target.files, "before")}
                disabled={isResetting}
              />
              <Upload className="mb-3 h-8 w-8 text-primary" />
              <div className="text-sm font-semibold uppercase tracking-wide">Before Photo</div>
              <p className="mt-2 text-xs text-white/70">JPEG, PNG, or WebP up to 15MB</p>
              {beforeFile && (
                <p className="mt-3 text-xs text-white/60">{beforeFile.name}</p>
              )}
            </label>

            <label
              className={cn(
                "group flex h-48 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-neutral-900/60 text-center transition hover:border-primary/60 hover:bg-neutral-900",
                isResetting && "pointer-events-none opacity-50"
              )}
            >
              <Input
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                className="hidden"
                onChange={(event) => handleFileSelect(event.target.files, "after")}
                disabled={isResetting}
              />
              <Upload className="mb-3 h-8 w-8 text-primary" />
              <div className="text-sm font-semibold uppercase tracking-wide">After Photo</div>
              <p className="mt-2 text-xs text-white/70">JPEG, PNG, or WebP up to 15MB</p>
              {afterFile && (
                <p className="mt-3 text-xs text-white/60">{afterFile.name}</p>
              )}
            </label>
          </div>

          {error && (
            <p className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-white/70">
              {humanUsageStatus ? (
                <span>
                  You&apos;ve generated {humanUsageStatus.used} of {humanUsageStatus.limit} free videos today. Reset in {humanUsageStatus.windowText}.
                </span>
              ) : (
                <span>Free plan: up to 3 videos per IP every 24 hours.</span>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={resetInputs}
                disabled={status === "processing" || isResetting || (!beforeFile && !afterFile)}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button
                onClick={generateVideo}
                disabled={status === "uploading" || status === "processing" || !beforeFile || !afterFile}
              >
                {status === "uploading" || status === "processing" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {status === "uploading" ? "Uploading" : "Rendering"}
                  </>
                ) : (
                  <>Generate Slider Video</>
                )}
              </Button>
            </div>
          </div>

          {progress > 0 && status !== "idle" && (
            <div className="space-y-2">
              <Progress value={progress} className="h-3 bg-white/10" />
              <p className="text-xs uppercase tracking-wide text-white/60">
                {status === "uploading" && "Uploading images to Cloudflare"}
                {status === "processing" && "Rendering video with FFmpeg"}
                {status === "completed" && "Video ready"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {showSlider && (
        <Card className="border-white/10 bg-neutral-950 text-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Interactive preview</CardTitle>
          </CardHeader>
          <CardContent>
            <BasicImageComparisonSlider
              beforeImage={beforePreview!}
              afterImage={afterPreview!}
              beforeLabel="Before"
              afterLabel="After"
              className="mx-auto max-w-3xl"
            />
          </CardContent>
        </Card>
      )}

      {videoUrl && (
        <Card className="border-primary/30 bg-neutral-950 text-white shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Download your before & after slider video</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <video
              className="w-full rounded-2xl border border-white/10"
              controls
              playsInline
              preload="metadata"
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            <Button asChild className="w-full md:w-auto">
              <a href={videoUrl} download>
                <Download className="mr-2 h-4 w-4" />
                Download MP4
              </a>
            </Button>

            {videoUrl && (
              <p className="text-xs text-white/60">
                This link expires in {videoExpiryText}. Save the MP4 locally to keep it forever.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </section>
  );
}
