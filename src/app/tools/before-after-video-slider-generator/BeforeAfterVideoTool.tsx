"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAction } from "convex/react";
import { Loader2, Upload, RefreshCcw } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NotificationService } from "@/lib/notifications";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

interface UploadState {
  key: string | null;
  isUploading: boolean;
}

export function BeforeAfterVideoTool() {
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);

  const [beforeUpload, setBeforeUpload] = useState<UploadState>({ key: null, isUploading: false });
  const [afterUpload, setAfterUpload] = useState<UploadState>({ key: null, isUploading: false });

  const [isRequestingVideo, setIsRequestingVideo] = useState(false);
  const [jobAccepted, setJobAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startVideoGeneration = useAction(api.beforeAfterVideos.startVideoGeneration);
  const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL;

  useEffect(() => {
    return () => {
      if (beforePreview) URL.revokeObjectURL(beforePreview);
      if (afterPreview) URL.revokeObjectURL(afterPreview);
    };
  }, [beforePreview, afterPreview]);

  const resetTool = useCallback(() => {
    setBeforeFile(null);
    setAfterFile(null);
    if (beforePreview) URL.revokeObjectURL(beforePreview);
    if (afterPreview) URL.revokeObjectURL(afterPreview);
    setBeforePreview(null);
    setAfterPreview(null);
    setBeforeUpload({ key: null, isUploading: false });
    setAfterUpload({ key: null, isUploading: false });
    setIsRequestingVideo(false);
    setJobAccepted(false);
    setError(null);
  }, [afterPreview, beforePreview]);

  const validateFile = useCallback((file: File, label: string) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      throw new Error(`${label} image must be a JPEG, PNG, or WebP file.`);
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`${label} image must be smaller than ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB.`);
    }
  }, []);

  const requestUploadUrl = useCallback(
    async (variant: "before" | "after", contentType: string) => {
      if (!workerUrl) {
        throw new Error("The video worker is not configured yet.");
      }

      const bucketType = variant === "before" ? "original" : "staged";
      const response = await fetch(`${workerUrl}/generate-upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucketType, contentType }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Upload service error (${response.status}): ${body || response.statusText}`);
      }

      return (await response.json()) as { uploadUrl: string; key: string };
    },
    [workerUrl]
  );

  const uploadFileToWorker = useCallback(
    async (file: File, variant: "before" | "after") => {
      validateFile(file, variant === "before" ? "Before" : "After");
      const { uploadUrl, key } = await requestUploadUrl(variant, file.type);
      const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload ${variant} image (status ${response.status}).`);
      }

      return key;
    },
    [requestUploadUrl, validateFile]
  );

  const handleEmailSubmit = useCallback(async () => {
    if (!email.trim()) {
      setError("Please enter your email to get the download link.");
      return;
    }
    setError(null);
    setIsSubmittingEmail(true);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "before-after-tool" }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "Unable to save your email." }));
        throw new Error(body.error || "Unable to save your email.");
      }

      setEmailSubmitted(true);
      NotificationService.success("You're on the list!", {
        description: "Upload your before & after photos to generate the video.",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save your email.";
      setError(message);
      NotificationService.error("Couldn't save email", { description: message });
    } finally {
      setIsSubmittingEmail(false);
    }
  }, [email]);

  const handleFileSelect = useCallback(
    async (files: FileList | null, variant: "before" | "after") => {
      const file = files?.[0];
      if (!file) return;

      setError(null);

      if (variant === "before") {
        if (beforePreview) URL.revokeObjectURL(beforePreview);
        setBeforePreview(URL.createObjectURL(file));
        setBeforeFile(file);
        setBeforeUpload((prev) => ({ ...prev, isUploading: true }));
      } else {
        if (afterPreview) URL.revokeObjectURL(afterPreview);
        setAfterPreview(URL.createObjectURL(file));
        setAfterFile(file);
        setAfterUpload((prev) => ({ ...prev, isUploading: true }));
      }

      try {
        const key = await uploadFileToWorker(file, variant);
        if (variant === "before") {
          setBeforeUpload({ key, isUploading: false });
        } else {
          setAfterUpload({ key, isUploading: false });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed.";
        setError(message);
        NotificationService.error("Upload failed", { description: message });
        if (variant === "before") {
          setBeforeUpload({ key: null, isUploading: false });
          setBeforeFile(null);
          if (beforePreview) URL.revokeObjectURL(beforePreview);
          setBeforePreview(null);
        } else {
          setAfterUpload({ key: null, isUploading: false });
          setAfterFile(null);
          if (afterPreview) URL.revokeObjectURL(afterPreview);
          setAfterPreview(null);
        }
      }
    },
    [afterPreview, beforePreview, uploadFileToWorker]
  );

  const canRequestVideo = useMemo(() => {
    return (
      emailSubmitted &&
      beforeUpload.key &&
      afterUpload.key &&
      !beforeUpload.isUploading &&
      !afterUpload.isUploading &&
      !jobAccepted
    );
  }, [afterUpload, beforeUpload, emailSubmitted, jobAccepted]);

  const requestVideo = useCallback(async () => {
    if (!beforeUpload.key || !afterUpload.key) {
      setError("Upload both images before requesting the video.");
      return;
    }
    if (!emailSubmitted) {
      setError("Please submit your email so we can send the download link.");
      return;
    }

    setError(null);
    setIsRequestingVideo(true);

    try {
      await startVideoGeneration({
        beforeKey: beforeUpload.key,
        afterKey: afterUpload.key,
        userEmail: email,
        tier: "free",
      });

      setJobAccepted(true);
      NotificationService.success("Video request received!", {
        description: "We'll email you the download link as soon as it's ready.",
        duration: 6000,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Video request failed.";
      setError(message);
      NotificationService.error("Couldn't start video", { description: message });
    } finally {
      setIsRequestingVideo(false);
    }
  }, [afterUpload.key, beforeUpload.key, email, emailSubmitted, startVideoGeneration]);

  return (
    <section className="space-y-10">
      <Card className="border border-black/5 bg-white text-black shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Step 1: Join the list</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-neutral-700">
            Drop your email and we&apos;ll send the finished video straight to your inbox. You&apos;ll also
            get early updates from RoomsThatSell.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={emailSubmitted || isSubmittingEmail}
              className="h-12 border-black/10 bg-white text-black placeholder:text-neutral-400"
            />
            <Button
              onClick={handleEmailSubmit}
              disabled={emailSubmitted || isSubmittingEmail}
              className="h-12 bg-[#4A6B85] text-white hover:bg-[#3d5a70]"
            >
              {isSubmittingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : emailSubmitted ? "Saved" : "Continue"}
            </Button>
          </div>
          {emailSubmitted && (
            <p className="text-sm text-emerald-600">Thanks! You can upload your before &amp; after photos now.</p>
          )}
        </CardContent>
      </Card>

      <Card className="border border-black/5 bg-white text-black shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Step 2: Upload before & after images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <label
              className={cn(
                "group flex h-48 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#4A6B85]/40 bg-[#F3F2F2] text-center transition hover:border-[#4A6B85]/70 hover:bg-white",
                (!emailSubmitted || beforeUpload.isUploading) && "pointer-events-none opacity-60"
              )}
            >
              <Input
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                className="hidden"
                onChange={(event) => handleFileSelect(event.target.files, "before")}
                disabled={!emailSubmitted || beforeUpload.isUploading}
              />
              {beforeUpload.isUploading ? (
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-[#4A6B85]" />
              ) : (
                <Upload className="mb-3 h-8 w-8 text-[#4A6B85]" />
              )}
              <div className="text-sm font-semibold uppercase tracking-wide">Before Photo</div>
              <p className="mt-2 text-xs text-neutral-600">JPEG, PNG, or WebP up to 15MB</p>
              {beforeFile && (
                <p className="mt-3 text-xs text-neutral-500">{beforeFile.name}</p>
              )}
            </label>

            <label
              className={cn(
                "group flex h-48 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#4A6B85]/40 bg-[#F3F2F2] text-center transition hover:border-[#4A6B85]/70 hover:bg-white",
                (!emailSubmitted || afterUpload.isUploading) && "pointer-events-none opacity-60"
              )}
            >
              <Input
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                className="hidden"
                onChange={(event) => handleFileSelect(event.target.files, "after")}
                disabled={!emailSubmitted || afterUpload.isUploading}
              />
              {afterUpload.isUploading ? (
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-[#4A6B85]" />
              ) : (
                <Upload className="mb-3 h-8 w-8 text-[#4A6B85]" />
              )}
              <div className="text-sm font-semibold uppercase tracking-wide">After Photo</div>
              <p className="mt-2 text-xs text-neutral-600">JPEG, PNG, or WebP up to 15MB</p>
              {afterFile && (
                <p className="mt-3 text-xs text-neutral-500">{afterFile.name}</p>
              )}
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="ghost"
              onClick={resetTool}
              disabled={beforeUpload.isUploading || afterUpload.isUploading || (!beforeFile && !afterFile)}
              className="text-[#4A6B85] hover:bg-[#4A6B85]/10"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button
              onClick={requestVideo}
              disabled={!canRequestVideo || isRequestingVideo}
              className="bg-[#4A6B85] text-white hover:bg-[#3d5a70]"
            >
              {isRequestingVideo ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending to video worker...
                </>
              ) : jobAccepted ? (
                "We&apos;ll email you soon"
              ) : (
                "Email me the video"
              )}
            </Button>
          </div>

          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
