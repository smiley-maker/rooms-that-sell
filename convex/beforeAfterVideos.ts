import { action } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import { logger } from "./lib/logger";
import { api } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import type { ProjectVideoSummary } from "./projectVideos";

const DAY_MS = 1000 * 60 * 60 * 24;
const DEFAULT_DAILY_LIMIT = 3;

function resolveWorkerUrl(): string | null {
  return process.env.WORKER_URL ?? process.env.NEXT_PUBLIC_WORKER_URL ?? null;
}

async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const text = await response.text();
    if (!text) {
      return `${response.status} ${response.statusText}`;
    }

    try {
      const data = JSON.parse(text) as { error?: unknown; message?: unknown };
      const message = (data.error ?? data.message) as string | undefined;
      return message ?? text;
    } catch (jsonError) {
      return text;
    }
  } catch (readError) {
    return `${response.status} ${response.statusText}`;
  }
}

type SessionDoc = Doc<"beforeAfterVideoSessions">;

type SessionSummary = {
  sessionId: Id<"beforeAfterVideoSessions">;
  generationsUsed: number;
  dailyGenerationLimit: number;
  windowStartedAt: number;
  lastGenerationAt: number;
  videoUrl: string | null;
  videoKey: string | null;
  workerMessage: string | null;
  status: string;
  remaining: number;
  windowEndsAt: number;
};

type WorkerResponse = {
  videoUrl?: string | null;
  videoKey?: string | null;
  status?: string | null;
  message?: string | null;
};


type FreeToolResult = {
  ok: true;
  workerResponse: unknown;
  session: SessionSummary | null;
  projectVideo: null;
};

type ProjectVideoResult = {
  ok: true;
  workerResponse: unknown;
  session: null;
  projectVideo: ProjectVideoSummary | null;
};

type StartVideoResult = FreeToolResult | ProjectVideoResult;

type FreeToolArgs = {
  beforeKey?: string | null;
  afterKey?: string | null;
  userEmail: string;
  sessionId?: Id<"beforeAfterVideoSessions"> | null;
};

type ProjectVideoArgs = {
  projectId: Id<"projects">;
  imageId: Id<"images">;
  versionId?: Id<"imageVersions"> | null;
};

type ApplyGenerationMutationResult = {
  sessionId: Id<"beforeAfterVideoSessions">;
  generationsUsed: number;
  dailyGenerationLimit: number;
  windowStartedAt: number;
  status: string;
  videoUrl: string | null;
  videoKey: string | null;
  workerMessage: string | null;
};

export const startVideoGeneration = action({
  args: {
    beforeKey: v.optional(v.string()),
    afterKey: v.optional(v.string()),
    userEmail: v.optional(v.string()),
    tier: v.optional(v.string()),
    sessionId: v.optional(v.id("beforeAfterVideoSessions")),
    projectId: v.optional(v.id("projects")),
    imageId: v.optional(v.id("images")),
    versionId: v.optional(v.id("imageVersions")),
  },
  handler: async (ctx, args): Promise<StartVideoResult> => {
    const tier = args.tier ?? "free";
    if (tier === "project") {
      if (!args.projectId || !args.imageId) {
        throw new Error("Missing project or image information for video generation.");
      }
      return handleProjectVideoGeneration(ctx, {
        projectId: args.projectId,
        imageId: args.imageId,
        versionId: args.versionId ?? null,
      });
    }

    if (!args.userEmail) {
      throw new Error("Email is required to generate the video.");
    }

    return handleFreeToolGeneration(ctx, {
      beforeKey: args.beforeKey ?? null,
      afterKey: args.afterKey ?? null,
      userEmail: args.userEmail,
      sessionId: args.sessionId ?? null,
    });
  },
});

async function handleFreeToolGeneration(
  ctx: ActionCtx,
  args: FreeToolArgs
): Promise<FreeToolResult> {
  const workerUrl = resolveWorkerUrl();
  if (!workerUrl) {
    logger.error("beforeAfterVideos.startVideoGeneration.misconfigured", {
      reason: "Missing WORKER_URL environment variable",
    });
    throw new Error("Video processing service unavailable");
  }

  let resolvedBeforeKey = args.beforeKey ?? null;
  let resolvedAfterKey = args.afterKey ?? null;
  let session: SessionDoc | null = null;
  let generationsUsedForWindow = 0;
  let windowStartedAt = Date.now();
  let dailyLimit = DEFAULT_DAILY_LIMIT;

  if (args.sessionId) {
    session = await ctx.runQuery(api.beforeAfterVideoSessions.getSessionRecord, {
      sessionId: args.sessionId,
    });
    if (!session) {
      throw new Error("We couldn't find your upload session. Please refresh and try again.");
    }

    windowStartedAt = session.windowStartedAt;
    generationsUsedForWindow = session.generationsUsed;
    dailyLimit = Math.max(1, session.dailyGenerationLimit ?? DEFAULT_DAILY_LIMIT);

    const now = Date.now();
    if (now >= session.windowStartedAt + DAY_MS) {
      windowStartedAt = now;
      generationsUsedForWindow = 0;
    }

    if (generationsUsedForWindow >= dailyLimit) {
      const windowEndsAt = windowStartedAt + DAY_MS;
      throw new Error(
        `Daily video limit reached. Try again ${windowEndsAt <= now ? "soon" : "later today"}.`
      );
    }

    resolvedBeforeKey = resolvedBeforeKey ?? session.beforeKey ?? null;
    resolvedAfterKey = resolvedAfterKey ?? session.afterKey ?? null;

    if (!session.email) {
      await ctx.runMutation(api.beforeAfterVideoSessions.ensureSessionEmail, {
        sessionId: session._id,
        email: args.userEmail,
      });
    }
  }

  if (!resolvedBeforeKey || !resolvedAfterKey) {
    throw new Error("Upload both before and after photos before generating the video.");
  }

  if (!args.userEmail) {
    throw new Error("Email is required to generate the video.");
  }

  const requestPayload = {
    beforeKey: resolvedBeforeKey,
    afterKey: resolvedAfterKey,
    tier: "free",
    email: args.userEmail,
  };

  logger.info("beforeAfterVideos.startVideoGeneration.dispatch", {
    workerUrl,
    payloadPreview: {
      beforeKey: resolvedBeforeKey,
      afterKey: resolvedAfterKey,
      tier: "free",
    },
  });

  const response = await fetch(`${workerUrl}/process-video`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestPayload),
  });

  if (!response.ok) {
    const errorBody = await parseErrorResponse(response);
    logger.error("beforeAfterVideos.startVideoGeneration.failed", {
      status: response.status,
      statusText: response.statusText,
      errorBody,
    });
    throw new Error(errorBody || "Video processing service failed to accept the request.");
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch (error) {
    logger.warn("beforeAfterVideos.startVideoGeneration.nonJsonResponse", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  logger.info("beforeAfterVideos.startVideoGeneration.accepted", {
    responsePreview: data,
  });

  let patchedSession: SessionSummary | null = null;
  const workerResponse = typeof data === "object" && data !== null ? (data as WorkerResponse) : undefined;

  if (session) {
    const now = Date.now();
    const videoUrl = workerResponse?.videoUrl ?? null;
    const videoKey = workerResponse?.videoKey ?? null;
    const workerMessage = workerResponse?.message ?? null;

    const windowReset = now >= windowStartedAt + DAY_MS;
    if (windowReset) {
      windowStartedAt = now;
      generationsUsedForWindow = 0;
    }

    const newGenerationsUsed = generationsUsedForWindow + 1;
    const status = videoUrl ? "completed" : "processing";

    const result: ApplyGenerationMutationResult | null = await ctx.runMutation(
      api.beforeAfterVideoSessions.applyGenerationResult,
      {
        sessionId: session._id,
        generationsUsed: newGenerationsUsed,
        dailyGenerationLimit: dailyLimit,
        windowStartedAt,
        status,
        timestamp: now,
        videoUrl: videoUrl ?? undefined,
        videoKey: videoKey ?? undefined,
        workerMessage: workerMessage ?? undefined,
      }
    );

    if (result) {
      patchedSession = {
        sessionId: result.sessionId,
        generationsUsed: result.generationsUsed,
        dailyGenerationLimit: result.dailyGenerationLimit,
        windowStartedAt: result.windowStartedAt,
        lastGenerationAt: now,
        remaining: Math.max(0, result.dailyGenerationLimit - result.generationsUsed),
        windowEndsAt: result.windowStartedAt + DAY_MS,
        videoUrl: result.videoUrl,
        videoKey: result.videoKey,
        workerMessage: result.workerMessage,
        status: result.status,
      };
    }
  }

  return {
    ok: true,
    workerResponse: data,
    session: patchedSession,
    projectVideo: null,
  };
}

async function handleProjectVideoGeneration(
  ctx: ActionCtx,
  args: ProjectVideoArgs
): Promise<ProjectVideoResult> {
  const workerUrl = resolveWorkerUrl();
  if (!workerUrl) {
    logger.error("beforeAfterVideos.projectVideo.misconfigured", {
      reason: "Missing WORKER_URL environment variable",
    });
    throw new Error("Video processing service unavailable");
  }

  if (!args.projectId || !args.imageId) {
    throw new Error("Missing project or image information for video generation.");
  }

  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const user = await ctx.runQuery(api.users.getCurrentUser, {});
  if (!user) {
    throw new Error("User not found");
  }

  const image = await ctx.runQuery(api.images.getImageById, { imageId: args.imageId });
  if (!image || image.projectId !== args.projectId) {
    throw new Error("Image not found for this project");
  }

  const targetVersionId = args.versionId ?? image.currentVersionId ?? null;
  let afterKey: string | null = null;

  if (targetVersionId) {
    const version = await ctx.runQuery(api.images.getImageVersionById, {
      versionId: targetVersionId,
    });
    if (!version) {
      throw new Error("Staged version not found");
    }
    afterKey = version.stagedKey;
  } else {
    afterKey = image.stagedKey ?? null;
  }

  const beforeKey = image.imageKey ?? null;

  if (!beforeKey || !afterKey) {
    throw new Error("Original or staged image key missing. Generate a staged image first.");
  }

  const now = Date.now();
  const existingVideos = await ctx.runQuery(api.projectVideos.listVideosByImage, {
    imageId: image._id,
  });

  const matchingVideo = existingVideos.find((video) => {
    if (targetVersionId) {
      return video.versionId === targetVersionId;
    }
    return !video.versionId;
  });

  const videoDocId = await ctx.runMutation(api.projectVideos.ensureProcessingVideo, {
    videoId: matchingVideo?._id,
    projectId: args.projectId,
    userId: user._id,
    imageId: image._id,
    versionId: targetVersionId ?? undefined,
    timestamp: now,
  });

  const requestPayload = {
    originalKey: beforeKey,
    stagedKey: afterKey,
    userId: String(user._id),
    projectId: String(args.projectId),
  };

  const response = await fetch(`${workerUrl}/generate-from-existing`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestPayload),
  });

  if (!response.ok) {
    const errorBody = await parseErrorResponse(response);
    logger.error("beforeAfterVideos.projectVideo.failed", {
      status: response.status,
      statusText: response.statusText,
      errorBody,
    });

    await ctx.runMutation(api.projectVideos.saveWorkerResponse, {
      videoId: videoDocId,
      status: "failed",
      message: errorBody || response.statusText,
      timestamp: Date.now(),
    });

    throw new Error(errorBody || "Video processing service failed to accept the project request.");
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch (error) {
    logger.warn("beforeAfterVideos.projectVideo.nonJsonResponse", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const workerResponse = typeof data === "object" && data !== null ? (data as WorkerResponse) : undefined;

  const projectVideo = await ctx.runMutation(api.projectVideos.saveWorkerResponse, {
    videoId: videoDocId,
    status: workerResponse?.videoUrl ? "completed" : "processing",
    videoKey: workerResponse?.videoKey ?? undefined,
    videoUrl: workerResponse?.videoUrl ?? undefined,
    message: workerResponse?.message ?? undefined,
    timestamp: Date.now(),
  });

  return {
    ok: true,
    workerResponse: data,
    session: null,
    projectVideo,
  };
}
