"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { logger } from "./lib/logger";
import { presignPut, presignGet } from "@integrations/r2";
import { putObject } from "@integrations/r2";
import { randomUUID, createHash } from "node:crypto";
import { promises as fs, constants as fsConstants } from "node:fs";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

const DEFAULT_LIMIT = 3;
const DEFAULT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const TARGET_WIDTH = Number(process.env.BEFORE_AFTER_VIDEO_WIDTH ?? 1920);
const TARGET_HEIGHT = Number(process.env.BEFORE_AFTER_VIDEO_HEIGHT ?? 1080);
const VIDEO_DURATION = Number(process.env.BEFORE_AFTER_VIDEO_DURATION ?? 5);
const RENDER_FRAME_RATE = Number(process.env.BEFORE_AFTER_VIDEO_FPS ?? 30);

function sanitizeFilename(filename: string) {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function pickBucket(variant: "before" | "after") {
  const variantBucketEnv =
    variant === "before" ? process.env.R2_BUCKET_TOOL_BEFORE : process.env.R2_BUCKET_TOOL_AFTER;

  if (variantBucketEnv) return variantBucketEnv;

  if (variant === "before" && process.env.R2_BUCKET_OG) return process.env.R2_BUCKET_OG;
  if (variant === "after" && process.env.R2_BUCKET_STAGED) return process.env.R2_BUCKET_STAGED;

  const fallback = process.env.R2_BUCKET_OG || process.env.R2_BUCKET_STAGED;
  if (!fallback) {
    throw new Error("No R2 bucket configured for tool uploads");
  }
  return fallback;
}

function pickVideoBucket() {
  const bucket =
    process.env.R2_BUCKET_TOOL_VIDEOS || process.env.R2_BUCKET_STAGED || process.env.R2_BUCKET_OG;
  if (!bucket) {
    throw new Error("No R2 bucket configured for tool videos");
  }
  return bucket;
}

async function downloadToTempFile(params: { key: string; bucket: string; prefix: string }) {
  const { key, bucket, prefix } = params;
  const { url } = await presignGet({ key, bucket, expiresIn: 300 });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${prefix} image from R2: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), `${prefix}-`));
  const extension = path.extname(key) || ".png";
  const filePath = path.join(tempDir, `${prefix}${extension}`);
  await fs.writeFile(filePath, buffer);

  return { tempDir, filePath, cleanup: () => fs.rm(tempDir, { recursive: true, force: true }) };
}

const require = createRequire(import.meta.url);

async function resolveFfmpegPath(): Promise<string> {
  const candidateSet = new Set<string>();

  const staticExport =
    typeof ffmpegStatic === "string"
      ? ffmpegStatic
      : ((ffmpegStatic as unknown as { path?: string; default?: string })?.path ??
          (ffmpegStatic as unknown as { path?: string; default?: string })?.default ??
          null);
  if (staticExport) {
    candidateSet.add(staticExport);
  } else {
    logger.error("beforeAfterVideos.ffmpegPath.missingExport", {
      ffmpegStaticType: typeof ffmpegStatic,
      hasDefault: Boolean((ffmpegStatic as { default?: unknown }).default),
    });
  }

  if (process.env.FFMPEG_PATH) {
    candidateSet.add(process.env.FFMPEG_PATH);
  }

  try {
    const modulePath = require.resolve("ffmpeg-static");
    candidateSet.add(path.join(path.dirname(modulePath), "ffmpeg"));
  } catch (error) {
    logger.warn("beforeAfterVideos.ffmpegPath.resolveFailed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  candidateSet.add(path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg"));

  for (const candidate of candidateSet) {
    try {
      await fs.access(candidate, fsConstants.R_OK);
      const preparedPath = await prepareExecutable(candidate);
      logger.info("beforeAfterVideos.ffmpegPath.selected", { candidate, preparedPath });
      return preparedPath;
    } catch (error) {
      logger.warn("beforeAfterVideos.ffmpegPath.candidateUnavailable", {
        candidate,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  throw new Error(
    "Unable to locate ffmpeg binary. Ensure ffmpeg-static is bundled or provide FFMPEG_PATH env."
  );
}

async function prepareExecutable(sourcePath: string): Promise<string> {
  const destinationPath = path.join(os.tmpdir(), `ffmpeg-${process.pid}-${Date.now()}`);
  await fs.copyFile(sourcePath, destinationPath);
  await fs.chmod(destinationPath, 0o755).catch(() => undefined);
  return destinationPath;
}

async function renderSliderVideo(beforePath: string, afterPath: string, outputPath: string) {
  const ffmpegPath = await resolveFfmpegPath();
  logger.info("beforeAfterVideos.ffmpegPath.selected", { ffmpegPath });
  ffmpeg.setFfmpegPath(ffmpegPath);

  const sliderDuration = VIDEO_DURATION > 0 ? VIDEO_DURATION : 5;
  const sliderGraph = [
    `[0:v]scale=${TARGET_WIDTH}:-1:force_original_aspect_ratio=decrease,pad=${TARGET_WIDTH}:${TARGET_HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=black[before]`,
    `[1:v]scale=${TARGET_WIDTH}:-1:force_original_aspect_ratio=decrease,pad=${TARGET_WIDTH}:${TARGET_HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=black[after]`,
    `[before][after]blend=all_expr='if(lte(X,W*T/${sliderDuration}),B,A)'[blended]`,
    `[blended]drawbox=x='W*T/${sliderDuration}-2':y=0:w=4:h=H:color=white@0.85:t=fill,drawbox=x='W*T/${sliderDuration}-4':y=0:w=8:h=H:color=black@0.35:t=fill[video]`,
  ];

  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .addInput(beforePath)
      .addInput(afterPath)
      .complexFilter(sliderGraph, "video")
      .outputOptions([
        "-map",
        "[video]",
        "-movflags",
        "+faststart",
        "-t",
        `${sliderDuration}`,
        "-r",
        `${RENDER_FRAME_RATE}`,
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "22",
        "-pix_fmt",
        "yuv420p",
      ])
      .on("end", () => resolve())
      .on("error", (error) => reject(error))
      .save(outputPath);
  });
}

export const generateUploadUrl = action({
  args: {
    filename: v.string(),
    contentType: v.string(),
    fileSize: v.number(),
    variant: v.union(v.literal("before"), v.literal("after")),
    toolSlug: v.string(),
  },
  handler: async (_ctx, args) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(args.contentType)) {
      throw new Error("Unsupported file type. Please upload JPEG, PNG, or WebP images.");
    }

    const maxSize = 15 * 1024 * 1024; // 15MB
    if (args.fileSize > maxSize) {
      throw new Error("Image file is too large. Maximum size is 15MB.");
    }

    const bucket = pickBucket(args.variant);
    const sanitized = sanitizeFilename(args.filename);
    const timestamp = Date.now();
    const random = randomUUID();
    const assetKey = `tools/${args.toolSlug}/${args.variant}/${timestamp}-${random}-${sanitized}`;

    const { url: uploadUrl } = await presignPut({
      key: assetKey,
      contentType: args.contentType,
      bucket,
      expiresIn: 900,
      metadata: {
        toolSlug: args.toolSlug,
        variant: args.variant,
      },
    });

    return { uploadUrl, assetKey, bucket };
  },
});

interface UsageClaimResult {
  allowed: boolean;
  recordId: Id<"toolUsage">;
  remaining: number;
  windowEndsAt: number;
}

interface GenerateVideoResult {
  videoUrl: string;
  videoKey: string;
  expiresAt: number;
  usage: {
    limit: number;
    remaining: number;
    windowEndsAt: number;
  };
}

export const generateVideo = action({
  args: {
    before: v.object({ key: v.string(), bucket: v.string() }),
    after: v.object({ key: v.string(), bucket: v.string() }),
    filenames: v.optional(v.object({ before: v.optional(v.string()), after: v.optional(v.string()) })),
    toolSlug: v.string(),
    ipHash: v.string(),
    sourceIp: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<GenerateVideoResult> => {
    const limit = Number(process.env.BEFORE_AFTER_TOOL_LIMIT ?? DEFAULT_LIMIT);
    const windowMs = Number(process.env.BEFORE_AFTER_TOOL_WINDOW_MS ?? DEFAULT_WINDOW_MS);
    const timestamp = Date.now();

    const usage = (await ctx.runMutation(api.toolUsage.claimUsage, {
      toolSlug: args.toolSlug,
      ipHash: args.ipHash,
      limit,
      windowMs,
      timestamp,
    })) as UsageClaimResult;

    if (!usage.allowed) {
      const windowEndsIn = Math.max(0, usage.windowEndsAt - timestamp);
      throw new Error(
        `Daily limit reached. Try again in ${Math.ceil(windowEndsIn / (60 * 1000))} minutes.`
      );
    }

    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "before-after-video-"));
    const outputPath = path.join(tempRoot, `slider-${randomUUID()}.mp4`);

    let beforeAsset: Awaited<ReturnType<typeof downloadToTempFile>> | null = null;
    let afterAsset: Awaited<ReturnType<typeof downloadToTempFile>> | null = null;

    try {
      beforeAsset = await downloadToTempFile({
        key: args.before.key,
        bucket: args.before.bucket,
        prefix: "before",
      });

      afterAsset = await downloadToTempFile({
        key: args.after.key,
        bucket: args.after.bucket,
        prefix: "after",
      });

      await renderSliderVideo(beforeAsset.filePath, afterAsset.filePath, outputPath);

      const videoBuffer = await fs.readFile(outputPath);
      const videoBucket = pickVideoBucket();
      const videoKey = `tools/${args.toolSlug}/videos/${timestamp}-${randomUUID()}.mp4`;

      await putObject({
        bucket: videoBucket,
        key: videoKey,
        body: videoBuffer,
        contentType: "video/mp4",
      });

      const expiresInSeconds = Number(process.env.BEFORE_AFTER_VIDEO_DOWNLOAD_TTL ?? 60 * 60 * 24);
      const { url: videoUrl } = await presignGet({
        key: videoKey,
        bucket: videoBucket,
        expiresIn: expiresInSeconds,
      });

      logger.info("beforeAfterVideos.generateVideo.success", {
        toolSlug: args.toolSlug,
        ipHashPreview: args.ipHash.slice(0, 6),
        sourceIp: args.sourceIp?.slice(0, 6),
        videoKey,
      });

      return {
        videoUrl,
        videoKey,
        expiresAt: Date.now() + expiresInSeconds * 1000,
        usage: {
          limit,
          remaining: usage.remaining,
          windowEndsAt: usage.windowEndsAt,
        },
      };
    } catch (error) {
      logger.error("beforeAfterVideos.generateVideo.failed", {
        message: error instanceof Error ? error.message : String(error),
        toolSlug: args.toolSlug,
      });
      await ctx.runMutation(api.toolUsage.revertUsage, { recordId: usage.recordId });
      throw error;
    } finally {
      await Promise.all([
        beforeAsset?.cleanup().catch(() => undefined) ?? Promise.resolve(),
        afterAsset?.cleanup().catch(() => undefined) ?? Promise.resolve(),
      ]);
      await fs.rm(tempRoot, { recursive: true, force: true }).catch(() => undefined);
    }
  },
});

export const hashIpForTesting = action({
  args: { ipAddress: v.string() },
  handler: async (_ctx, args) => {
    const salt = process.env.BEFORE_AFTER_TOOL_SALT || "rooms-that-sell";
    return createHash("sha256").update(args.ipAddress + salt).digest("hex");
  },
});
