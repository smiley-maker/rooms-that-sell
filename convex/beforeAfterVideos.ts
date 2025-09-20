import { action } from "./_generated/server";
import { v } from "convex/values";
import { logger } from "./lib/logger";

export const startVideoGeneration = action({
  args: {
    beforeKey: v.string(),
    afterKey: v.string(),
    userEmail: v.string(),
    tier: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const workerUrl = process.env.WORKER_URL;
    if (!workerUrl) {
      logger.error("beforeAfterVideos.startVideoGeneration.misconfigured", {
        reason: "Missing WORKER_URL environment variable",
      });
      throw new Error("Video processing service unavailable");
    }

    const requestPayload = {
      beforeKey: args.beforeKey,
      afterKey: args.afterKey,
      tier: args.tier ?? "free",
      email: args.userEmail,
    };

    logger.info("beforeAfterVideos.startVideoGeneration.dispatch", {
      workerUrl,
      payloadPreview: {
        beforeKey: args.beforeKey,
        afterKey: args.afterKey,
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

    return {
      ok: true,
      workerResponse: data,
    } as const;
  },
});
