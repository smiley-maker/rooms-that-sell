"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { Loader2, Upload, RefreshCcw, Download, Share2 } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
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
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoKey, setVideoKey] = useState<string | null>(null);
  const [showDownloadMessage, setShowDownloadMessage] = useState(false);
  const [sessionId, setSessionId] = useState<Id<"beforeAfterVideoSessions"> | null>(null);
  const [isBootstrappingSession, setIsBootstrappingSession] = useState(false);

  const downloadMessageTimeout = useRef<number | null>(null);

  const startVideoGeneration = useAction(api.beforeAfterVideos.startVideoGeneration);
  const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL;

  const DAILY_LIMIT = 3;

  const session = useQuery(
    api.beforeAfterVideoSessions.getSession,
    sessionId ? { sessionId } : ("skip" as const)
  );

  const initializeSession = useMutation(api.beforeAfterVideoSessions.initializeSession);
  const updateSessionUploads = useMutation(api.beforeAfterVideoSessions.updateSessionUploads);
  const setSessionEmailMutation = useMutation(api.beforeAfterVideoSessions.setSessionEmail);

  useEffect(() => {
    return () => {
      if (beforePreview) URL.revokeObjectURL(beforePreview);
      if (afterPreview) URL.revokeObjectURL(afterPreview);
    };
  }, [beforePreview, afterPreview]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionId || isBootstrappingSession) return;

    setIsBootstrappingSession(true);

    (async () => {
      try {
        const storedId = window.localStorage.getItem("beforeAfterVideoSessionId");
        if (storedId) {
          setSessionId(storedId as Id<"beforeAfterVideoSessions">);
          return;
        }

        const created = await initializeSession({
          dailyLimit: DAILY_LIMIT,
        });

        if (created?.sessionId) {
          window.localStorage.setItem("beforeAfterVideoSessionId", created.sessionId);
          setSessionId(created.sessionId as Id<"beforeAfterVideoSessions">);
        }
      } catch (err) {
        console.error("Failed to initialize before/after session", err);
      } finally {
        setIsBootstrappingSession(false);
      }
    })();
  }, [DAILY_LIMIT, initializeSession, isBootstrappingSession, sessionId]);

  useEffect(() => {
    if (sessionId && session === null && typeof window !== "undefined") {
      window.localStorage.removeItem("beforeAfterVideoSessionId");
      setSessionId(null);
    }
  }, [session, sessionId]);

  useEffect(() => {
    if (!session) return;
    if (session.videoUrl) {
      setVideoUrl(session.videoUrl);
      setJobAccepted(false);
    }
    if (session.videoKey) {
      setVideoKey(session.videoKey);
    }
    if (session.email && !emailSubmitted) {
      setEmail(session.email);
      setEmailSubmitted(true);
    }
  }, [emailSubmitted, session]);

  const generationsRemaining = useMemo(() => {
    if (!session) return DAILY_LIMIT;
    const limit = session.dailyGenerationLimit ?? DAILY_LIMIT;
    const now = Date.now();
    const windowEndsAt = session.windowStartedAt + 24 * 60 * 60 * 1000;
    const used = now >= windowEndsAt ? 0 : session.generationsUsed;
    return Math.max(0, limit - used);
  }, [DAILY_LIMIT, session]);

  const generationsRemainingLabel = session === undefined ? "…" : generationsRemaining;

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
    setVideoUrl(null);
    setVideoKey(null);
    setShowDownloadMessage(false);
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
      if (sessionId) {
        await setSessionEmailMutation({ sessionId, email });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save your email.";
      setError(message);
      NotificationService.error("Couldn't save email", { description: message });
    } finally {
      setIsSubmittingEmail(false);
    }
  }, [email, sessionId, setSessionEmailMutation]);

  const handleFileSelect = useCallback(
    async (files: FileList | null, variant: "before" | "after") => {
      const file = files?.[0];
      if (!file) return;

      setError(null);

      let previewUrl: string | null = null;

      if (variant === "before") {
        if (beforePreview) URL.revokeObjectURL(beforePreview);
        previewUrl = URL.createObjectURL(file);
        setBeforePreview(previewUrl);
        setBeforeFile(file);
        setBeforeUpload((prev) => ({ ...prev, isUploading: true }));
      } else {
        if (afterPreview) URL.revokeObjectURL(afterPreview);
        previewUrl = URL.createObjectURL(file);
        setAfterPreview(previewUrl);
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

        if (sessionId) {
          await updateSessionUploads({
            sessionId,
            variant,
            fileKey: key,
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed.";
        setError(message);
        NotificationService.error("Upload failed", { description: message });
        if (variant === "before") {
          setBeforeUpload({ key: null, isUploading: false });
          setBeforeFile(null);
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          setBeforePreview(null);
        } else {
          setAfterUpload({ key: null, isUploading: false });
          setAfterFile(null);
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          setAfterPreview(null);
        }
      }
    },
    [afterPreview, beforePreview, sessionId, updateSessionUploads, uploadFileToWorker]
  );

  const canRequestVideo = useMemo(() => {
    return (
      emailSubmitted &&
      sessionId &&
      beforeUpload.key &&
      afterUpload.key &&
      !beforeUpload.isUploading &&
      !afterUpload.isUploading &&
      generationsRemaining > 0
    );
  }, [afterUpload, beforeUpload, emailSubmitted, generationsRemaining, sessionId]);

  const requestVideo = useCallback(async () => {
    if (!beforeUpload.key || !afterUpload.key) {
      setError("Upload both images before requesting the video.");
      return;
    }
    if (!emailSubmitted) {
      setError("Please submit your email so we can send the download link.");
      return;
    }
    if (!sessionId) {
      setError("We couldn't find your session. Refresh and try again.");
      return;
    }
    if (generationsRemaining <= 0) {
      setError("You've reached the maximum number of video generations for today.");
      return;
    }

    setError(null);
    setIsRequestingVideo(true);

    try {
      const result = await startVideoGeneration({
        beforeKey: beforeUpload.key,
        afterKey: afterUpload.key,
        userEmail: email,
        tier: "free",
        sessionId,
      });
      setJobAccepted(true);
      setVideoUrl(null);
      setVideoKey(null);
      setShowDownloadMessage(false);
      const workerResponse = result?.workerResponse as
        | {
            videoUrl?: string | null;
            videoKey?: string | null;
            status?: string;
            message?: string;
          }
        | undefined;
      const sessionSummary = result?.session as
        | {
            videoUrl?: string | null;
            videoKey?: string | null;
            remaining?: number;
          }
        | undefined;

      const resolvedVideoUrl = workerResponse?.videoUrl ?? null;
      const resolvedVideoKey = workerResponse?.videoKey ?? null;

      if (resolvedVideoUrl) {
        setVideoUrl(resolvedVideoUrl);
        NotificationService.success("Video ready!", {
          description: "Preview it below or download the MP4.",
          duration: 6000,
        });
      } else if (sessionSummary?.videoUrl) {
        setVideoUrl(sessionSummary.videoUrl);
        NotificationService.success("Video ready!", {
          description: "Preview it below or download the MP4.",
          duration: 6000,
        });
      } else {
        NotificationService.success("Video request received!", {
          description: workerResponse?.message || "We'll email you the download link as soon as it's ready.",
          duration: 6000,
        });
      }

      if (resolvedVideoKey) {
        setVideoKey(resolvedVideoKey);
      } else if (sessionSummary?.videoKey) {
        setVideoKey(sessionSummary.videoKey);
      }

      setJobAccepted(Boolean(!(resolvedVideoUrl || sessionSummary?.videoUrl)));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Video request failed.";
      setError(message);
      NotificationService.error("Couldn't start video", { description: message });
    } finally {
      setIsRequestingVideo(false);
    }
  }, [afterUpload.key, beforeUpload.key, email, emailSubmitted, generationsRemaining, sessionId, startVideoGeneration]);

  useEffect(() => {
    return () => {
      if (downloadMessageTimeout.current) {
        window.clearTimeout(downloadMessageTimeout.current);
      }
    };
  }, []);

  const handleDownload = useCallback(() => {
    if (!videoUrl) return;

    const link = document.createElement("a");
    link.href = videoUrl;
    link.target = "_blank";
    link.rel = "noopener";
    if (videoKey) {
      link.download = `${videoKey}.mp4`;
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setShowDownloadMessage(true);
    if (downloadMessageTimeout.current) {
      window.clearTimeout(downloadMessageTimeout.current);
    }
    downloadMessageTimeout.current = window.setTimeout(() => {
      setShowDownloadMessage(false);
    }, 5000);
  }, [videoKey, videoUrl]);


  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <Card className="w-full border border-black/5 bg-white text-black shadow-lg lg:max-w-2xl lg:flex-none">
          <CardHeader>
            <CardTitle className="text-2xl">Step 1: Upload before &amp; after photos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <label
                className={cn(
                  "group flex h-44 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#4A6B85]/40 bg-[#F3F2F2] text-center transition hover:border-[#4A6B85]/70 hover:bg-white",
                  beforeUpload.isUploading && "pointer-events-none opacity-60"
                )}
              >
                <Input
                  type="file"
                  accept={ACCEPTED_TYPES.join(",")}
                  className="hidden"
                  onChange={(event) => handleFileSelect(event.target.files, "before")}
                  disabled={beforeUpload.isUploading}
                />
                {beforeUpload.isUploading ? (
                  <Loader2 className="mb-3 h-8 w-8 animate-spin text-[#4A6B85]" />
                ) : (
                  <Upload className="mb-3 h-8 w-8 text-[#4A6B85]" />
                )}
                <div className="text-sm font-semibold uppercase tracking-wide">Before Photo</div>
                <p className="mt-2 text-xs text-neutral-600">JPEG, PNG, or WebP up to 15MB</p>
                {beforeFile && (
                  <p className="mt-3 w-full truncate text-xs text-neutral-500">{beforeFile.name}</p>
                )}
              </label>

              <label
                className={cn(
                  "group flex h-44 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#4A6B85]/40 bg-[#F3F2F2] text-center transition hover:border-[#4A6B85]/70 hover:bg-white",
                  afterUpload.isUploading && "pointer-events-none opacity-60"
                )}
              >
                <Input
                  type="file"
                  accept={ACCEPTED_TYPES.join(",")}
                  className="hidden"
                  onChange={(event) => handleFileSelect(event.target.files, "after")}
                  disabled={afterUpload.isUploading}
                />
                {afterUpload.isUploading ? (
                  <Loader2 className="mb-3 h-8 w-8 animate-spin text-[#4A6B85]" />
                ) : (
                  <Upload className="mb-3 h-8 w-8 text-[#4A6B85]" />
                )}
                <div className="text-sm font-semibold uppercase tracking-wide">After Photo</div>
                <p className="mt-2 text-xs text-neutral-600">JPEG, PNG, or WebP up to 15MB</p>
                {afterFile && (
                  <p className="mt-3 w-full truncate text-xs text-neutral-500">{afterFile.name}</p>
                )}
              </label>
            </div>

            <Button
              variant="ghost"
              onClick={resetTool}
              disabled={beforeUpload.isUploading || afterUpload.isUploading || (!beforeFile && !afterFile)}
              className="text-[#4A6B85] hover:bg-[#4A6B85]/10"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Reset uploads
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:w-[360px] border border-black/5 bg-white text-black shadow-lg lg:flex-none">
          <CardHeader>
            <CardTitle className="text-2xl">Step 2: Preview the transformation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-wide text-[#4A6B85]">Before Preview</p>
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-dashed border-[#4A6B85]/40 bg-[#F3F2F2] text-center">
                  {beforePreview ? (
                    <img
                      src={beforePreview}
                      alt="Before preview"
                      className="h-full w-full object-cover"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-neutral-600">Upload a before photo to preview.</div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-wide text-[#4A6B85]">After Preview</p>
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-dashed border-[#4A6B85]/40 bg-[#F3F2F2] text-center">
                  {afterPreview ? (
                    <img
                      src={afterPreview}
                      alt="After preview"
                      className="h-full w-full object-cover"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-neutral-600">Upload an after photo to preview.</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-black/5 bg-white text-black shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Step 3: Get your video</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row">
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
              {isSubmittingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : emailSubmitted ? "Saved" : "Save email"}
            </Button>
          </div>
          <div className="rounded-xl border border-[#4A6B85]/20 bg-[#F3F2F2] px-4 py-3 text-sm text-neutral-700">
            {emailSubmitted ? (
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-[#4A6B85]">Generations remaining today: {generationsRemainingLabel}</span>
                <span>We&apos;ll email fresh credits as soon as we release the next batch.</span>
              </div>
            ) : (
              <span>Submit your email to unlock video renders and track how many runs you have left.</span>
            )}
          </div>

          <Button
            onClick={requestVideo}
            disabled={!canRequestVideo || isRequestingVideo}
            className="h-12 bg-[#4A6B85] text-white hover:bg-[#3d5a70]"
          >
            {isRequestingVideo ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending to video worker...
              </>
            ) : jobAccepted ? (
              "Processing your video..."
            ) : (
              "Generate slider video"
            )}
          </Button>

          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border border-black/5 bg-white text-black shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Step 4: Download &amp; Share</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-black/80 p-4">
            {videoUrl ? (
              <video
                className="aspect-video w-full rounded-xl bg-black object-cover"
                src={videoUrl}
                controls
                playsInline
              />
            ) : (
              <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-white/40 text-sm text-white/80">
                Your render will appear here once it&apos;s ready.
              </div>
            )}

            {showDownloadMessage && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-black/70 p-6 text-center text-white">
                <p className="text-lg font-semibold">Thanks for downloading!</p>
                <p className="mt-2 text-sm text-white/80">
                  RoomsThatSell loves powering your transformations. Tag us when you share it!
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              onClick={handleDownload}
              disabled={!videoUrl}
              className="bg-[#4A6B85] text-white hover:bg-[#3d5a70]"
            >
              <Download className="mr-2 h-4 w-4" />
              Download MP4
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                NotificationService.info("Sharing options coming soon!", {
                  description: "We\'ll add social links shortly.",
                })
              }
              className="border-[#4A6B85]/40 text-[#4A6B85] hover:bg-[#4A6B85]/10"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
