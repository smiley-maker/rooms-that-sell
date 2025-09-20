import { action } from "./_generated/server";
import { v } from "convex/values";
import { logger } from "./lib/logger";
import { api } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";

const DAY_MS = 1000 * 60 * 60 * 24;
const DEFAULT_DAILY_LIMIT = 3;

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
    userEmail: v.string(),
    tier: v.optional(v.string()),
    sessionId: v.optional(v.id("beforeAfterVideoSessions")),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    ok: true;
    workerResponse: unknown;
    session: SessionSummary | null;
  }> => {
    const workerUrl = process.env.WORKER_URL;
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

      if (!session.email && args.userEmail) {
        await ctx.runMutation(api.beforeAfterVideoSessions.ensureSessionEmail, {
          sessionId: session._id,
          email: args.userEmail,
        });
      }
    }

    if (!resolvedBeforeKey || !resolvedAfterKey) {
      throw new Error("Upload both before and after photos before generating the video.");
    }

    const requestPayload = {
      beforeKey: resolvedBeforeKey,
      afterKey: resolvedAfterKey,
      tier: args.tier ?? "free",
      email: args.userEmail,
    };

    logger.info("beforeAfterVideos.startVideoGeneration.dispatch", {
      workerUrl,
      payloadPreview: {
        beforeKey: resolvedBeforeKey,
        afterKey: resolvedAfterKey,
        tier: requestPayload.tier,
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
      const errorBody = await response.text();
      logger.error("beforeAfterVideos.startVideoGeneration.failed", {
        status: response.status,
        statusText: response.statusText,
        errorBody,
      });
      throw new Error("Video processing service failed to accept the request.");
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
    const workerResponse
      = typeof data === "object" && data !== null ? (data as WorkerResponse) : undefined;
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
    };
  },
});
